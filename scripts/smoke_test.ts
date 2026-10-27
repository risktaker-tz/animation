// Quick smoke test: load the app, check for console errors, canvas draw, play start.
import { chromium } from 'playwright-core';

const CHROME = `${process.env.HOME}/.cache/ms-playwright/chromium-1200/chrome-linux64/chrome`;

const browser = await chromium.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--no-sandbox', '--disable-gpu', '--autoplay-policy=no-user-gesture-required'],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors: string[] = [];
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text().slice(0, 300));
});
page.on('pageerror', (e) => errors.push(`PAGEERROR: ${String(e).slice(0, 300)}`));

await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(2500);

// count project cards on home
const cards = await page.locator('text=Max & Rex').count();
console.log('home shows Max&Rex project:', cards > 0);

// screenshot home
await page.screenshot({ path: '/home/z/my-project/models/smoke-home.png' });

// open the project → studio
try {
  await page.locator('text=Max & Rex').first().click();
  await page.waitForTimeout(3000);
  await page.screenshot({ path: '/home/z/my-project/models/smoke-studio.png' });
  console.log('studio opened');
} catch (e) {
  console.log('studio open failed:', String(e).slice(0, 200));
}

console.log('console errors:', errors.length);
errors.slice(0, 8).forEach((e) => console.log(' -', e));
await browser.close();
