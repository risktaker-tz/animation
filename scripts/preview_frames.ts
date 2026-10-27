/**
 * StoryForge frame previewer — renders the demo story at chosen timestamps
 * with the exact production engine (headless Chromium) and saves PNGs for
 * visual inspection. No audio involved.
 *
 * Run:  bun scripts/preview_frames.ts [outDir]
 */

import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright-core';

const ROOT = '/home/z/my-project';
const OUT = join(ROOT, 'models', 'preview');
const CHROME = `${process.env.HOME}/.cache/ms-playwright/chromium-1200/chrome-linux64/chrome`;

interface Cue {
  beatId: string;
  text: string;
  startMs: number;
  durMs: number;
  characterId: string | null;
}

async function main() {
  mkdirSync(OUT, { recursive: true });

  // bundle the same entry the video renderer uses
  const bunBuild = spawn('bun', [
    'build', join(ROOT, 'scripts', 'render-entry.ts'),
    '--format=iife', '--target=browser',
    '--outfile=' + join(OUT, 'render-bundle.js'),
    '--tsconfig-override=' + join(ROOT, 'tsconfig.json'),
  ], { cwd: ROOT });
  await new Promise<void>((res, rej) => {
    bunBuild.on('close', (c) => (c === 0 ? res() : rej(new Error('bun build failed'))));
    bunBuild.stderr.on('data', (d) => process.stderr.write(d));
  });
  const bundleJs = readFileSync(join(OUT, 'render-bundle.js'), 'utf8');

  const browser = await chromium.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--no-sandbox', '--disable-gpu', '--force-color-profile=srgb', '--hide-scrollbars', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage({ viewport: { width: 1340, height: 780 } });
  await page.setContent('<!doctype html><html><body></body></html>');
  await page.addScriptTag({ content: bundleJs });

  const info = await page.evaluate(async () => {
    return await (window as unknown as {
      __sfRender: { init: (d: Record<string, number>) => Promise<{ totalMs: number; cues: Cue[] }> };
    }).__sfRender.init({});
  });

  console.log(`total ${(info.totalMs / 1000).toFixed(1)}s, ${info.cues.length} cues`);
  for (const c of info.cues) {
    console.log(
      `  ${c.startMs.toFixed(0).padStart(6)}ms  ${(c.characterId ?? 'NARR').padEnd(12)}  ${c.text.slice(0, 58)}`
    );
  }

  // --- pick inspection timestamps from the cue list ---
  const findCue = (needle: string): Cue =>
    info.cues.find((c) => c.text.toLowerCase().includes(needle.toLowerCase())) ?? info.cues[0];

  const picks: Array<[string, number]> = [
    ['entrance-walk-1', 120],
    ['entrance-walk-2', 340],
    ['entrance-walk-3', 560],
    ['entrance-walk-4', 780],
    ['entrance-mom', findCue('Saturday morning').startMs + 480],
    ['write-arms', findCue('Addition. Spelling').startMs + 900],
    ['talk-to-mom-facing', findCue('Homework first').startMs + 1000],
    ['pivot-turn-antic', findCue('Homework first').startMs + 60],
    ['pivot-turn-mid', findCue('Homework first').startMs + 150],
    ['pivot-turn-late', findCue('Homework first').startMs + 240],
    ['pivot-turn-settle', findCue('Homework first').startMs + 340],
    ['kid-reply-facing', findCue('studying is for grown-ups').startMs + 1100],
    ['sneak', findCue('Operation Animal Time').startMs + 800],
    ['fetch-toss', findCue('Go get it').startMs + 500],
    ['fetch-run', findCue('Go get it').startMs + 1500],
    ['pet-stroke', findCue('Good boy').startMs + 1300],
    ['dad-point-facing', findCue('homework time right now').startMs + 1100],
    ['surprised-facing', findCue('WAIT. Studying').startMs + 900],
    ['highfive-contact', findCue('High five').startMs + 1250],
    ['highfive-react', findCue('High five').startMs + 1750],
    ['read-book', findCue('Chapter One').startMs + 900],
    ['hug-contact', findCue('I love you').startMs + 1300],
    ['hug-approach-1', findCue('I love you').startMs + 120],
    ['hug-approach-2', findCue('I love you').startMs + 260],
    ['hug-approach-3', findCue('I love you').startMs + 420],
    ['hug-approach-4', findCue('I love you').startMs + 560],
    ['exit-back-turn', findCue('tell everyone').startMs + 500],
    ['exit-back-walk', findCue('tell everyone').startMs + 1500],
  ];

  for (const [name, t] of picks) {
    const dataUrl = await page.evaluate((tt) => {
      const w = window as unknown as { __sfRender: { frame: (t: number) => void } };
      w.__sfRender.frame(tt);
      const cv = document.querySelector('canvas') as HTMLCanvasElement;
      return cv.toDataURL('image/png');
    }, t);
    const b64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
    writeFileSync(join(OUT, `${name}.png`), Buffer.from(b64, 'base64'));
    console.log(`saved ${name} @ ${t.toFixed(0)}ms`);
  }

  await browser.close();
  try { unlinkSync(join(OUT, 'render-bundle.js')); } catch { /* noop */ }
  console.log('DONE');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
