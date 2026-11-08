import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const root = process.env.TEST_URL || 'http://127.0.0.1:4173';
const base = new URL('./', root.endsWith('/') ? root : `${root}/`).href;
await mkdir('screenshots', { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
  args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
try {
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  await desktop.goto(base, { waitUntil: 'networkidle', timeout: 60000 });
  await desktop.waitForSelector('#hero-mount canvas', { timeout: 20000 });
  await desktop.locator('[data-action="heart"]').click();
  await desktop.waitForTimeout(700);
  await desktop.screenshot({ path: 'screenshots/landing-desktop.png' });
  await desktop.evaluate(() => {
    const el = document.querySelector('#zones');
    window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 88);
  });
  await desktop.waitForSelector('#zone-mount canvas', { timeout: 20000 });
  await desktop.waitForTimeout(600);
  await desktop.screenshot({ path: 'screenshots/landing-zones.png' });
  await desktop.locator('[data-zone="divine"]').click();
  for (let i = 0; i < 6; i += 1) {
    await desktop.locator('[data-action="toss"]').click();
    await desktop.waitForTimeout(30);
  }
  await desktop.waitForSelector('text=本卦');
  await desktop.evaluate(() => {
    const el = document.querySelector('#zone-panel');
    window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 88);
  });
  await desktop.waitForTimeout(200);
  await desktop.screenshot({ path: 'screenshots/landing-hexagram.png' });
  await desktop.close();

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  await mobile.goto(base, { waitUntil: 'networkidle', timeout: 60000 });
  await mobile.waitForSelector('#hero-mount canvas', { timeout: 20000 });
  await mobile.waitForTimeout(500);
  await mobile.screenshot({ path: 'screenshots/landing-mobile.png' });
  await mobile.screenshot({ path: 'screenshots/landing-mobile-full.png', fullPage: true });
  console.log('landing screenshots written');
} finally {
  await browser.close();
}
