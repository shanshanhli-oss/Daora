import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const root = process.env.TEST_URL || 'http://127.0.0.1:5173';
const base = new URL('./', root.endsWith('/') ? root : `${root}/`).href;
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
  args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto(base, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForSelector('h1');
  assert.match(await page.locator('h1').innerText(), /观天之道/);
  assert.match(await page.locator('h1').innerText(), /执天之行/);
  assert.equal(await page.locator('text=Design by DAORA').count() > 0, true);
  await page.locator('[data-action="language"]').click();
  await page.waitForSelector('text=Begin Reading');
  await page.locator('[data-action="language"]').click();
  await page.locator('[data-action="heart"]').click();
  assert.equal(await page.locator('#heart-count').innerText(), '1');
  await page.locator('[data-action="request-toggle"]').click();
  await page.locator('#request-panel textarea').fill('只是看看');
  await page.locator('#request-panel button[type="submit"]').click();
  await page.waitForSelector('#request-done:not([hidden])');
  assert.match(page.url(), /\/$/);
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('daora-landing-interest')).length), 1);

  await page.locator('[data-zone="divine"]').click();
  await page.waitForSelector('[data-action="toss"]');
  for (let i = 0; i < 6; i += 1) {
    await page.locator('[data-action="toss"]').click();
    await page.waitForTimeout(40);
  }
  await page.waitForSelector('text=本卦', { timeout: 8000 });
  const castText = await page.locator('#divine-root').innerText();
  assert.match(castText, /本卦/);
  assert.match(castText, /变卦|六爻皆静/);
  assert.match(castText, /互卦/);
  await page.locator('[data-cast="lot"]').click();
  await page.locator('[data-action="lot"]').click();
  assert.match(await page.locator('#divine-root').innerText(), /六十四|这一签/);

  await page.locator('[data-zone="natal"]').click();
  const href = await page.locator('[data-zone-panel="natal"] a').getAttribute('href');
  assert.match(href, /sanctuary\.html$/);
  await page.locator('[data-zone="feng"]').click();
  assert.match(await page.locator('[data-zone-panel="feng"]').innerText(), /即将开放/);
  await page.locator('[data-zone="spirit"]').click();
  assert.match(await page.locator('[data-zone-panel="spirit"]').innerText(), /即将开放/);
  assert.deepEqual(errors, []);
  console.log('PASS landing: headline, language, heart, interest, six-line cast, lot, natal link, coming soon.');
  await page.close();

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  const mobileErrors = [];
  mobile.on('pageerror', (error) => mobileErrors.push(error.message));
  mobile.on('console', (message) => { if (message.type() === 'error') mobileErrors.push(message.text()); });
  await mobile.goto(base, { waitUntil: 'networkidle', timeout: 60000 });
  const overflow = await mobile.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  assert.equal(overflow, false, 'Mobile landing should not overflow horizontally');
  await mobile.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await mobile.waitForFunction(() => document.querySelector('.sticky-cta')?.classList.contains('is-on'));
  assert.deepEqual(mobileErrors, []);
  console.log('PASS landing mobile: no horizontal overflow, sticky reading link.');
} finally {
  await browser.close();
}
