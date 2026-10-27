/**
 * Quick visual check: renders the demo story at key timestamps and saves
 * JPEGs so the new 3D-cartoon look can be inspected before a full export.
 * Run: bun scripts/test_frames.ts
 */
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright-core';

const ROOT = '/home/z/my-project';
const WORK = join(ROOT, 'models', 'render');
const CHROME = `${process.env.HOME}/.cache/ms-playwright/chromium-1200/chrome-linux64/chrome`;

// timestamps (ms) to inspect — chosen to cover each scene + each interaction
const STAMPS = [1200, 4200, 9000, 17500, 26000, 33000, 41000, 52000, 62000, 76000, 88000, 98000, 108000, 115000];

async function main() {
  mkdirSync(join(WORK, 'check'), { recursive: true });

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
  page.on('pageerror', (e) => console.error('PAGE ERROR:', e.message));
  page.on('console', (m) => { if (m.type() === 'error') console.error('CONSOLE:', m.text()); });
  await page.setContent('<!doctype html><html><body></body></html>');
  await page.addScriptTag({ content: bundleJs });

  const totalMs = await page.evaluate(async () => {
    const api = (window as unknown as { __sfRender: { init: (d: Record<string, number>) => Promise<{ totalMs: number }> } }).__sfRender;
    const info = await api.init({});
    return info.totalMs;
  });
  console.log(`timeline total: ${(totalMs / 1000).toFixed(1)}s`);

  for (const t of STAMPS) {
    const tt = Math.min(t, totalMs - 100);
    const dataUrl = await page.evaluate((ms) => {
      const w = window as unknown as { __sfRender: { frame: (t: number) => void } };
      w.__sfRender.frame(ms);
      const cv = document.querySelector('canvas') as HTMLCanvasElement;
      return cv.toDataURL('image/jpeg', 0.92);
    }, tt);
    const file = join(WORK, 'check', `f-${String(tt).padStart(6, '0')}.jpg`);
    writeFileSync(file, Buffer.from(dataUrl.slice(dataUrl.indexOf(',') + 1), 'base64'));
    console.log(`saved ${file}`);
  }
  await browser.close();
  console.log('DONE');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
