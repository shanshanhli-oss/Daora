import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { chooseLondon } from './place.mjs';

const root = process.env.TEST_URL || 'http://127.0.0.1:4173';
const base = root.endsWith('/') ? root : `${root}/`;
const roomUrl = new URL('sanctuary.html', base).href;
await mkdir('screenshots', { recursive: true });

const candidates = [
  process.env.CHROME_PATH,
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean);
let browser = null;
for (const executablePath of candidates) {
  try {
    browser = await chromium.launch({
      headless: true,
      executablePath,
      args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
    });
    const probe = await browser.newPage();
    const ok = await probe.evaluate(() => {
      const canvas = document.createElement('canvas');
      return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
    });
    await probe.close();
    if (ok) break;
    await browser.close(); browser = null;
  } catch { browser = null; }
}
if (!browser) browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });

function pin(page) {
  return page.evaluate(() => {
    const scene = window.daora.getScene();
    scene.tick();
    scene.renderer.setAnimationLoop(null);
    document.querySelector('#toast')?.classList.remove('visible');
  });
}

function frame(page, position, target) {
  return page.evaluate(({ position, target }) => {
    const scene = window.daora.getScene();
    scene.renderer.setAnimationLoop(null);
    scene.controls.enabled = false;
    scene.controls.target.set(...target);
    scene.camera.position.set(...position);
    scene.camera.lookAt(...target);
    scene.camera.updateMatrixWorld();
    scene.room.update(1, scene.camera);
    scene.renderer.render(scene.scene, scene.camera);
  }, { position, target });
}

const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
page.setDefaultTimeout(60000);
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });

await page.goto(roomUrl, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForSelector('#landing:not(.hidden)');
await page.locator('[name="birthDate"]').fill('1998-06-18');
await page.locator('[name="birthTime"]').fill('07:30');
await chooseLondon(page);
await page.locator('#birth-form button[type="submit"]').click();
await page.waitForSelector('#pillars-result:not(.hidden)');
await page.locator('[data-action="confirm-entry"]').click();
await page.waitForFunction(() => window.daoraDiagnostics()?.mode === 'tunnel' || window.daoraDiagnostics()?.entered);
await page.evaluate(() => document.querySelector('#tunnel-skip')?.click());
await page.waitForFunction(() => window.daoraDiagnostics()?.entered);
// Let the entry gold flash fade fully, then pin the veil shut: its CSS fade races stills.
await page.waitForTimeout(1400);
await page.evaluate(() => {
  const veil = document.querySelector('#tunnel-flash');
  if (veil) { veil.style.transition = 'none'; veil.style.opacity = '0'; veil.style.display = 'none'; }
});

// 1. Default room view.
await pin(page);
await page.screenshot({ path: 'screenshots/upgrade-default.png' });

// 2. High orbit: the roof must read as a finished cap, no bare beam tops.
await frame(page, [10.5, 13.5, 10.5], [0, 1, -0.4]);
await page.screenshot({ path: 'screenshots/upgrade-roof.png' });

// 3. Plaque wall closeup: all five plaques clear of posts and ledge.
await frame(page, [0.9, 3.15, 0.7], [-0.15, 3.3, -4.3]);
await page.screenshot({ path: 'screenshots/upgrade-plaques.png' });

// 4. Low angle looking up at the plaque wall over the door and ledge.
await frame(page, [4.6, 1.9, 5.6], [-0.6, 3.1, -4.3]);
await page.screenshot({ path: 'screenshots/upgrade-low.png' });

// 5. Window side: light shaft and pool.
await frame(page, [6.2, 3.4, 7.4], [-3.4, 1.6, 1.2]);
await page.screenshot({ path: 'screenshots/upgrade-window.png' });

// 6. Theme brightness checks.
await page.evaluate(() => window.daora.setTheme('水'));
await frame(page, [10.9, 6.5, 13.5], [-0.12, 1.86, -0.42]);
await page.screenshot({ path: 'screenshots/upgrade-theme-water.png' });
await page.evaluate(() => window.daora.setTheme('火'));
await frame(page, [10.9, 6.5, 13.5], [-0.12, 1.86, -0.42]);
await page.screenshot({ path: 'screenshots/upgrade-theme-fire.png' });
await page.evaluate(() => window.daora.setTheme('木'));
await frame(page, [10.9, 6.5, 13.5], [-0.12, 1.86, -0.42]);
await page.screenshot({ path: 'screenshots/upgrade-theme-wood.png' });
assert.deepEqual(errors, []);
await page.close();

// Mobile pass: enter the room on a phone-sized viewport.
const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
mobile.setDefaultTimeout(60000);
const mobileErrors = [];
mobile.on('pageerror', (error) => mobileErrors.push(error.message));
mobile.on('console', (message) => { if (message.type() === 'error') mobileErrors.push(message.text()); });
await mobile.goto(roomUrl, { waitUntil: 'networkidle', timeout: 60000 });
await mobile.waitForSelector('#landing:not(.hidden)');
await mobile.locator('[name="birthDate"]').fill('1998-06-18');
await mobile.locator('[name="birthTime"]').fill('07:30');
await chooseLondon(mobile);
await mobile.locator('#birth-form button[type="submit"]').click();
await mobile.waitForSelector('#pillars-result:not(.hidden)');
await mobile.locator('[data-action="confirm-entry"]').click();
await mobile.waitForFunction(() => window.daoraDiagnostics()?.mode === 'tunnel' || window.daoraDiagnostics()?.entered);
await mobile.evaluate(() => document.querySelector('#tunnel-skip')?.click());
await mobile.waitForFunction(() => window.daoraDiagnostics()?.entered);
await mobile.waitForTimeout(1400);
await mobile.evaluate(() => {
  const veil = document.querySelector('#tunnel-flash');
  if (veil) { veil.style.transition = 'none'; veil.style.opacity = '0'; veil.style.display = 'none'; }
});
await pin(mobile);
await mobile.screenshot({ path: 'screenshots/upgrade-mobile.png' });
const overflow = await mobile.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
assert.equal(overflow, false, 'no horizontal overflow on mobile');
assert.deepEqual(mobileErrors, []);
await mobile.close();
console.log('upgrade shots ok');
await browser.close();
