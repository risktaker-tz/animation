// Debug: dump CastVisual state (pose/facing/turnK/x/drawH) at key timestamps
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright-core';

const ROOT = '/home/z/my-project';
const OUT = join(ROOT, 'models', 'preview');
const CHROME = `${process.env.HOME}/.cache/ms-playwright/chromium-1200/chrome-linux64/chrome`;

async function main() {
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
    executablePath: CHROME, headless: true, args: ['--no-sandbox', '--disable-gpu'],
  });
  const page = await browser.newPage({ viewport: { width: 1340, height: 780 } });
  await page.setContent('<!doctype html><html><body></body></html>');
  await page.addScriptTag({ content: bundleJs });

  const info = await page.evaluate(async () => {
    return await (window as unknown as {
      __sfRender: { init: (d: Record<string, number>) => Promise<{ totalMs: number; cues: { beatId: string; text: string; startMs: number; characterId: string | null }[] }> };
    }).__sfRender.init({});
  });

  for (const c of info.cues) {
    console.log(`${c.startMs.toFixed(0).padStart(6)}ms  ${(c.characterId ?? 'NARR').padEnd(10)}  ${c.text.slice(0, 52)}`);
  }

  const times = ['Homework first', 'I love you', 'tell everyone'];
  for (const needle of times) {
    const cue = info.cues.find((c) => c.text.toLowerCase().includes(needle.toLowerCase()));
    if (!cue) continue;
    for (const off of [40, 120, 220, 320, 500, 800]) {
      const state = await page.evaluate(({ t, cid }: { t: number; cid: string }) => {
        const w = window as unknown as {
          __sfRender: { frame: (t: number) => void; debugVisuals: (cid: string) => unknown };
        };
        w.__sfRender.frame(t);
        return w.__sfRender.debugVisuals(cid);
      }, { t: cue.startMs + off, cid: cue.characterId ?? '' });
      console.log(`${needle} +${off}ms →`, JSON.stringify(state));
    }
  }

  await browser.close();
  try { unlinkSync(join(OUT, 'render-bundle.js')); } catch { /* noop */ }
}
main().catch((e) => { console.error(e); process.exit(1); });
