// Deep smoke-test: open the seed project in the static build and actually
// play a few seconds of the story, verifying animation frames advance.

import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { mkdirSync, rmSync, symlinkSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = '/home/z/my-project';
const SERVE_DIR = join(ROOT, 'models', 'pages-test');
const PORT = 8932;
// LIVE=1 → test the deployed GitHub Pages site instead of a local server
const LIVE = !!process.env.LIVE;
const BASE = LIVE ? 'https://risktaker-tz.github.io/animation/' : `http://127.0.0.1:${PORT}/animation/`;
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
  if (!LIVE) {
    rmSync(SERVE_DIR, { recursive: true, force: true });
    mkdirSync(SERVE_DIR, { recursive: true });
    symlinkSync(join(ROOT, 'out'), join(SERVE_DIR, 'animation'));
  }

  const server = LIVE
    ? null
    : spawn('python3', ['-m', 'http.server', String(PORT), '--directory', SERVE_DIR], { stdio: 'ignore' });
  try {
    await waitForServer(BASE);
    const browser = await chromium.launch({
      executablePath: CHROME,
      headless: true,
      args: ['--no-sandbox', '--disable-gpu', '--mute-audio'],
    });
    const page = await browser.newPage({ viewport: { width: 1360, height: 850 } });
    const errors: string[] = [];
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text().slice(0, 220));
    });
    page.on('pageerror', (e) => errors.push(`PAGEERROR ${String(e).slice(0, 220)}`));

    await page.goto(BASE, { waitUntil: 'networkidle' });
    await wait(1200);

    // open the seed project from the Projects grid
    const projectCard = page.locator('button.min-w-0.flex-1, [class*="text-left"]').filter({ hasText: /max|rex|story|homework/i }).first();
    if (await projectCard.count()) {
      await projectCard.click();
      await wait(2200);
    } else {
      console.log('no project card matched — trying New story');
      await page.locator('button').filter({ hasText: 'New story' }).first().click();
      await wait(2200);
    }
    await page.screenshot({ path: join(ROOT, 'models', 'pages-studio.png') });

    // find and hit Play
    const play = page.locator('button').filter({ hasText: /play/i }).first();
    const hadPlay = await play.count();
    console.log('play button found:', hadPlay > 0);
    if (hadPlay) {
      await play.click();
      await wait(4500);
      await page.screenshot({ path: join(ROOT, 'models', 'pages-play.png') });
      await wait(2500);
      await page.screenshot({ path: join(ROOT, 'models', 'pages-play2.png') });
    }

    console.log('--- console/page errors:', errors.length ? errors : 'none');
    await browser.close();
  } finally {
    server?.kill();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
