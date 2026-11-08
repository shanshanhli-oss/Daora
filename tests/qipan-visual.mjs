import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { chooseLondon } from './place.mjs';

const base = process.env.TEST_URL || 'http://127.0.0.1:4173';
await mkdir('screenshots', { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
  args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});

const themes = [
  ['金', 'qipan-room-metal.png'],
  ['木', 'qipan-room-wood.png'],
  ['水', 'qipan-room-water.png'],
  ['火', 'qipan-room-fire.png'],
  ['土', 'qipan-room-earth.png'],
];

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  page.setDefaultTimeout(60000);
  const errors = [];
  const outside = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('request', (request) => {
    const url = request.url();
    if (!url.startsWith(base) && !url.startsWith('blob:') && !url.startsWith('data:')) outside.push(url);
  });
  const pin = () => page.evaluate(() => {
    const scene = window.daora.getScene();
    scene.tick();
    scene.renderer.setAnimationLoop(null);
    document.querySelector('#toast')?.classList.remove('visible');
  });

  await page.goto(base, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForSelector('#landing:not(.hidden)');
  await page.waitForTimeout(400);
  await pin();
  await page.screenshot({ path: 'screenshots/qipan-welcome.png' });
  await page.screenshot({ path: 'screenshots/welcome.png' });

  await page.locator('[name="country"]').fill('中国');
  await page.locator('#country-suggest').waitFor({ state: 'visible' });
  await page.screenshot({ path: 'screenshots/qipan-cascade.png' });
  await page.locator('[name="birthDate"]').fill('1998-06-18');
  await page.locator('[name="birthTime"]').fill('07:30');
  await chooseLondon(page);
  await page.locator('#birth-form button[type="submit"]').click();
  await page.waitForSelector('#pillars-result:not(.hidden)');
  assert.match(await page.locator('#pillars-result').innerText(), /探索你的人生旅程/);
  assert.match(await page.locator('#pillars-result').innerText(), /心灵旅程/);
  assert.match(await page.locator('#pillars-result').innerText(), /14:30/);
  assert.match(await page.locator('#pillars-result').innerText(), /戊寅/);
  await page.locator('[data-action="confirm-entry"]').scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'screenshots/qipan-charts.png' });
  await page.screenshot({ path: 'screenshots/pillars.png' });

  await page.evaluate(() => window.daora.holdTunnel(true));
  await page.locator('[data-action="confirm-entry"]').click();
  await page.waitForFunction(() => window.daoraDiagnostics().mode === 'tunnel');
  await page.waitForTimeout(500);
  await pin();
  await page.screenshot({ path: 'screenshots/qipan-tunnel.png' });
  await page.locator('#tunnel-skip').click();
  await page.waitForFunction(() => window.daoraDiagnostics()?.entered);
  await page.waitForTimeout(300);
  await pin();

  for (const [element, file] of themes) {
    await page.evaluate((name) => window.daora.setTheme(name), element);
    await page.waitForFunction((name) => document.documentElement.dataset.element && window.daoraDiagnostics().theme === name, element);
    await pin();
    await page.screenshot({ path: `screenshots/${file}` });
  }

  await page.locator('[data-space="bazi"]').click();
  await page.waitForSelector('#system-space:not(.hidden)');
  assert.match(await page.locator('#system-space').innerText(), /乙未/);
  await page.screenshot({ path: 'screenshots/qipan-bazi-space.png' });
  await page.locator('[data-action="close-space"]').click();
  await page.locator('[data-space="ziwei"]').click();
  await page.waitForSelector('.ziwei-grid');
  assert.match(await page.locator('#system-space').innerText(), /水二局/);
  await page.screenshot({ path: 'screenshots/qipan-ziwei-space.png' });
  await page.locator('#consult-form textarea[name="topic"]').fill('想了解四柱里的节奏，先不预约。');
  await page.locator('#consult-form button[type="submit"]').click();
  await page.waitForFunction(() => window.daora.getState().consult?.sent === false);
  assert.match(await page.locator('[data-consult-status]').innerText(), /尚未发送/);
  await page.evaluate(() => document.querySelector('#toast')?.classList.remove('visible'));
  await page.locator('[data-consult-status]').scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'screenshots/qipan-consult.png' });
  await page.locator('[data-action="close-space"]').click();

  assert.deepEqual(outside, []);
  assert.deepEqual(errors, []);
  await page.close();

  const mobile = await browser.newPage({ viewport: { width: 360, height: 800 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  const mobileErrors = [];
  mobile.on('pageerror', (error) => mobileErrors.push(error.message));
  await mobile.goto(base, { waitUntil: 'networkidle', timeout: 60000 });
  await mobile.waitForSelector('#landing:not(.hidden)');
  await mobile.locator('[name="birthDate"]').fill('1998-06-18');
  await mobile.locator('[name="birthTime"]').fill('07:30');
  await chooseLondon(mobile);
  await mobile.locator('#birth-form button[type="submit"]').click();
  await mobile.waitForSelector('.ziwei-list');
  await mobile.screenshot({ path: 'screenshots/qipan-mobile-charts.png', fullPage: true });
  await mobile.locator('[data-action="confirm-entry"]').click();
  await mobile.waitForFunction(() => window.daoraDiagnostics()?.entered);
  await mobile.evaluate(() => window.daora.openSpace('ziwei'));
  await mobile.waitForSelector('.ziwei-list-mobile');
  await mobile.evaluate(() => document.querySelector('#toast')?.classList.remove('visible'));
  await mobile.screenshot({ path: 'screenshots/qipan-mobile.png' });
  assert.deepEqual(mobileErrors, []);
  console.log('PASS qipan screenshots');
} finally {
  await browser.close();
}
