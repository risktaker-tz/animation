// Smoke-test the static GitHub Pages export under its /animation/ base path.
// Serves out/ via a directory that mimics https://risktaker-tz.github.io/animation/
// and drives the app with the same headless Chromium the video renderer uses.

import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { mkdirSync, rmSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = '/home/z/my-project';
const SERVE_DIR = join(ROOT, 'models', 'pages-test');
const PORT = 8931;
const BASE = `http://127.0.0.1:${PORT}/animation/`;
const CHROME = `${process.env.HOME}/.cache/ms-playwright/chromium-1200/chrome-linux64/chrome`;

function wait(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForServer(url: string, tries = 40): Promise<void> {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      /* not up yet */
    }
    await wait(250);
  }
  throw new Error('static server never came up');
}

async function main(): Promise<void> {
  // serve directory: models/pages-test/animation → out/
  rmSync(SERVE_DIR, { recursive: true, force: true });
  mkdirSync(SERVE_DIR, { recursive: true });
  const link = join(SERVE_DIR, 'animation');
  const { symlinkSync } = await import('node:fs');
  symlinkSync(join(ROOT, 'out'), link);

  const server = spawn('python3', ['-m', 'http.server', String(PORT), '--directory', SERVE_DIR], {
    stdio: 'ignore',
  });
  try {
    await waitForServer(BASE);

    const browser = await chromium.launch({
      executablePath: CHROME,
      headless: true,
      args: ['--no-sandbox', '--disable-gpu', '--mute-audio'],
    });
    const page = await browser.newPage({ viewport: { width: 1360, height: 850 } });
    const errors: string[] = [];
    const failed404: string[] = [];
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text().slice(0, 200));
    });
    page.on('response', (r) => {
      if (r.status() >= 400) failed404.push(`${r.status()} ${r.url()}`);
    });

    await page.goto(BASE, { waitUntil: 'networkidle' });
    await wait(1500);
    await page.screenshot({ path: join(ROOT, 'models', 'pages-home.png') });

    // open the studio view
    const studioBtn = page.locator('button, a').filter({ hasText: /studio/i }).first();
    if (await studioBtn.count()) {
      await studioBtn.click();
      await wait(2500);
      await page.screenshot({ path: join(ROOT, 'models', 'pages-studio.png') });
    }

    // press play on the story preview if present
    const playBtn = page.locator('button').filter({ hasText: /play/i }).first();
    if (await playBtn.count()) {
      await playBtn.click();
      await wait(3500);
      await page.screenshot({ path: join(ROOT, 'models', 'pages-play.png') });
    }

    // watch page + video asset reachable
    for (const path of ['watch.html', 'max-and-rex-story.mp4', 'max-and-rex-preview.jpg']) {
      const res = await fetch(BASE + path);
      console.log(`${res.status} /animation/${path} (${res.headers.get('content-length') ?? '-'} bytes)`);
    }

    console.log('--- console errors:', errors.length ? errors : 'none');
    console.log('--- failed requests:', failed404.length ? failed404 : 'none');
    console.log('--- files in out/:', readdirSync(join(ROOT, 'out')).length);
    await browser.close();
  } finally {
    server.kill();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
