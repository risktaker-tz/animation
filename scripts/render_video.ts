/**
 * StoryForge offline video renderer.
 * Deterministically renders the "Max & Rex" story with the app's own engine
 * (frame-stepped at 30 fps via headless Chromium), mixes neural voice lines +
 * music bed with ffmpeg, and produces a shareable MP4.
 *
 * Run:  bun scripts/render_video.ts
 */

import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync, existsSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright-core';

import { buildMaxRexProject, STORY_CHARACTERS } from '../src/lib/story-max-rex';
import { buildTimeline } from '../src/lib/engine/director';
import { resolveVoice } from '../src/lib/engine/voice';
import type { Character } from '../src/lib/types';

const ROOT = '/home/z/my-project';
const WORK = join(ROOT, 'models', 'render');
const OUT = join(ROOT, 'download', 'max-and-rex-story.mp4');
const TTS_URL = 'http://127.0.0.1:8777/tts';
const FPS = 30;
const CHROME = `${process.env.HOME}/.cache/ms-playwright/chromium-1200/chrome-linux64/chrome`;

const characters: Record<string, Character> = Object.fromEntries(
  STORY_CHARACTERS.map((c) => [c.id, c])
);

function ffprobeDuration(path: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const p = spawn('ffprobe', [
      '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path,
    ]);
    let out = '';
    p.stdout.on('data', (d) => (out += d));
    p.on('close', () => {
      const v = parseFloat(out.trim());
      if (v > 0) {
        resolve(v);
      } else {
        reject(new Error(`bad duration for ${path}: ${out}`));
      }
    });
    p.on('error', reject);
  });
}

async function synthLine(text: string, voiceId: string, speed: number, pitch: number, dest: string): Promise<void> {
  if (existsSync(dest)) return;
  const res = await fetch(TTS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voice: voiceId, speed, pitch }),
  });
  if (!res.ok) throw new Error(`TTS failed (${res.status}) for: ${text.slice(0, 40)}`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(dest, buf);
}

async function main() {
  mkdirSync(WORK, { recursive: true });

  // 1) timeline v1 (estimates) → cue list
  const project = buildMaxRexProject();
  const est: Record<string, number> = {};
  for (const shot of project.shots) {
    for (const b of shot.beats) {
      if (b.text) {
        est[b.id] = Math.max(1100, 420 + b.text.trim().split(/\s+/).length * 330);
      }
    }
  }
  const tl1 = buildTimeline(project, characters, est);

  // 2) synthesize every spoken line with its character voice
  console.log(`synthesizing ${tl1.audio.length} voice lines…`);
  const voiceFiles: Record<string, string> = {};
  for (const cue of tl1.audio) {
    const ch = cue.characterId ? characters[cue.characterId] : null;
    const v = resolveVoice(ch);
    const dest = join(WORK, `${cue.beatId}.wav`);
    await synthLine(cue.text, v.voiceId, v.speed, v.pitchShift, dest);
    voiceFiles[cue.beatId] = dest;
  }

  // 3) real durations → timeline v2 (exact sync)
  const durations: Record<string, number> = {};
  for (const [beatId, file] of Object.entries(voiceFiles)) {
    durations[beatId] = (await ffprobeDuration(file)) * 1000;
  }
  const timeline = buildTimeline(project, characters, durations);
  console.log(`timeline total: ${(timeline.totalMs / 1000).toFixed(1)}s`);

  // 4) music bed
  const musicPath = join(WORK, 'music.wav');
  if (!existsSync(musicPath)) {
    const p = spawn('python3.13', [join(ROOT, 'scripts', 'make_music.py'), String(timeline.totalMs / 1000), musicPath]);
    await new Promise<void>((res, rej) => {
      p.on('close', (c) => (c === 0 ? res() : rej(new Error('music synth failed'))));
      p.on('error', rej);
    });
  }

  // 5) bundle the renderer and launch headless chromium
  console.log('bundling renderer…');
  const bunBuild = spawn('bun', [
    'build', join(ROOT, 'scripts', 'render-entry.ts'),
    '--format=iife', '--target=browser',
    '--outfile=' + join(WORK, 'render-bundle.js'),
    '--tsconfig-override=' + join(ROOT, 'tsconfig.json'),
  ], { cwd: ROOT });
  await new Promise<void>((res, rej) => {
    bunBuild.on('close', (c) => (c === 0 ? res() : rej(new Error('bun build failed'))));
    bunBuild.stderr.on('data', (d) => process.stderr.write(d));
  });
  const bundleJs = readFileSync(join(WORK, 'render-bundle.js'), 'utf8');

  const browser = await chromium.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--no-sandbox', '--disable-gpu', '--force-color-profile=srgb', '--hide-scrollbars', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage({ viewport: { width: 1360, height: 800 } });
  await page.setContent('<!doctype html><html><body></body></html>');
  await page.addScriptTag({ content: bundleJs });

  const info = await page.evaluate(async (durs) => {
    return await (window as unknown as { __sfRender: { init: (d: Record<string, number>) => Promise<{ totalMs: number; cues: unknown[] }> } }).__sfRender.init(durs);
  }, durations);
  console.log(`render frames: ${Math.ceil(info.totalMs / 1000 * FPS)} @ ${FPS}fps, audio cues: ${info.cues.length}`);

  // 6) frame-stepped capture → ffmpeg (mjpeg pipe)
  const totalFrames = Math.ceil((info.totalMs / 1000) * FPS);
  const frameStepMs = 1000 / FPS;
  const inputs: string[] = [
    '-y', '-loglevel', 'error',
    '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
    '-i', musicPath,
  ];
  for (const c of timeline.audio) inputs.push('-i', voiceFiles[c.beatId]);

  const filters: string[] = [];
  filters.push(`[1:a]volume=0.30[m]`);
  timeline.audio.forEach((c, i) => {
    const idx = i + 2;
    filters.push(`[${idx}:a]adelay=${Math.round(c.startMs)}:all=1,volume=0.95[v${i}]`);
  });
  const mixIns = ['[m]', ...timeline.audio.map((_, i) => `[v${i}]`)].join('');
  filters.push(`${mixIns}amix=inputs=${timeline.audio.length + 1}:normalize=0:duration=longest[aout]`);

  const ffArgs = [
    ...inputs,
    '-filter_complex', filters.join(';'),
    '-map', '0:v', '-map', '[aout]',
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p',
    '-r', String(FPS),
    '-c:a', 'aac', '-b:a', '192k',
    '-movflags', '+faststart',
    '-t', String((info.totalMs / 1000) + 0.4),
    OUT,
  ];

  const ff = spawn('ffmpeg', ffArgs, { stdio: ['pipe', 'inherit', 'inherit'] });
  let framesSent = 0;
  const CHUNK = 6;

  for (let start = 0; start < totalFrames; start += CHUNK) {
    const frames = [] as string[];
    for (let i = start; i < Math.min(totalFrames, start + CHUNK); i++) {
       
      const dataUrl = await page.evaluate((tt) => {
        const w = window as unknown as { __sfRender: { frame: (t: number) => void } };
        w.__sfRender.frame(tt);
        const cv = document.querySelector('canvas') as HTMLCanvasElement;
        return cv.toDataURL('image/jpeg', 0.9);
      }, t);
      frames.push(dataUrl);
    }
    for (const d of frames) {
      const b64 = d.slice(d.indexOf(',') + 1);
      const buf = Buffer.from(b64, 'base64');
      if (!ff.stdin.write(buf)) {
        await new Promise<void>((r) => ff.stdin.once('drain', r));
      }
      framesSent++;
    }
    if (start % 300 === 0) {
      console.log(`  frames ${framesSent}/${totalFrames} (${((framesSent / totalFrames) * 100).toFixed(0)}%)`);
    }
  }
  ff.stdin.end();
  await new Promise<void>((res, rej) => {
    ff.on('close', (c) => (c === 0 ? res() : rej(new Error(`ffmpeg exited ${c}`))));
  });
  await browser.close();

  // cleanup bundle to keep the repo tidy
  try { unlinkSync(join(WORK, 'render-bundle.js')); } catch { /* noop */ }

  const dur = await ffprobeDuration(OUT);
  console.log(`DONE: ${OUT} (${dur.toFixed(1)}s)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
