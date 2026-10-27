// Playback test: open scene 2, screenshot characters, press play, verify state.
import { chromium } from 'playwright-core';

const CHROME = `${process.env.HOME}/.cache/ms-playwright/chromium-1200/chrome-linux64/chrome`;

const browser = await chromium.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--no-sandbox', '--disable-gpu', '--autoplay-policy=no-user-gesture-required'],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors: string[] = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 250)); });
page.on('pageerror', (e) => errors.push(`PAGEERROR: ${String(e).slice(0, 250)}`));

await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
await page.locator('text=Max & Rex').first().click();
await page.waitForTimeout(2500);

// go to shot 2 (bedroom) to see characters
await page.locator('li:has-text("Bedroom")').first().click();
await page.waitForTimeout(1500);
await page.screenshot({ path: '/home/z/my-project/models/smoke-scene.png' });

// press play
await page.locator('button:has-text("Play story")').first().click();
await page.waitForTimeout(6000);
await page.screenshot({ path: '/home/z/my-project/models/smoke-playing.png' });
await page.waitForTimeout(4000);
await page.screenshot({ path: '/home/z/my-project/models/smoke-playing2.png' });

console.log('console errors:', errors.length);
errors.slice(0, 8).forEach((e) => console.log(' -', e));
await browser.close();
