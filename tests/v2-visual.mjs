import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { chooseLondon } from './place.mjs';

const root = process.env.TEST_URL || 'http://127.0.0.1:5173';
const base = root.endsWith('/') ? root : `${root}/`;
const roomUrl = new URL('sanctuary.html', base).href;
await mkdir('screenshots', { recursive: true });

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
  args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});

function pin(page) {
  return page.evaluate(() => {
    const scene = window.daora.getScene();
    scene.tick();
    scene.renderer.setAnimationLoop(null);
    document.querySelector('#toast')?.classList.remove('visible');
  });
}

try {
  const landing = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  landing.setDefaultTimeout(60000);
  const landingErrors = [];
  landing.on('pageerror', (error) => landingErrors.push(error.message));
  landing.on('console', (message) => { if (message.type() === 'error') landingErrors.push(message.text()); });
  await landing.goto(base, { waitUntil: 'networkidle', timeout: 60000 });
  await landing.waitForSelector('#cosmos');
  await landing.waitForTimeout(700);
  await landing.screenshot({ path: 'screenshots/v2-landing.png' });

  await landing.locator('[data-zone="divine"]').click();
  await landing.waitForSelector('[data-action="toss"]');
  for (let i = 0; i < 6; i += 1) {
    await landing.locator('[data-action="toss"]').click();
    await landing.waitForTimeout(30);
  }
  await landing.waitForSelector('text=本卦');
  await landing.evaluate(() => document.querySelector('.cast-results')?.scrollIntoView({ block: 'center' }));
  await landing.waitForTimeout(200);
  await landing.screenshot({ path: 'screenshots/v2-hexagram.png' });
  await landing.locator('[data-action="ai-cast"]').click();
  await landing.waitForSelector('#divine-root .reading-card');
  await landing.locator('.reading-card').scrollIntoViewIfNeeded();
  await landing.waitForTimeout(150);
  await landing.screenshot({ path: 'screenshots/v2-ai-landing.png' });
  assert.deepEqual(landingErrors, []);
  await landing.close();

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
  await page.evaluate(() => window.daora.holdTunnel(true));
  await page.locator('[data-action="confirm-entry"]').click();
  await page.waitForFunction(() => window.daoraDiagnostics().mode === 'tunnel');
  await page.waitForTimeout(400);
  await pin(page);
  await page.screenshot({ path: 'screenshots/v2-tunnel.png' });
  await page.locator('#tunnel-skip').click();
  await page.waitForFunction(() => window.daoraDiagnostics()?.entered);
  await page.waitForTimeout(250);
  await pin(page);
  await page.screenshot({ path: 'screenshots/v2-room-chart.png' });

  await page.evaluate(() => {
    window.daora.setTheme('木');
    window.daora.showFurnishings(['books', 'qin', 'plants', 'water', 'scroll']);
  });
  await pin(page);
  await page.screenshot({ path: 'screenshots/v2-room-study.png' });

  await page.evaluate(() => {
    window.daora.setTheme('金');
    window.daora.showFurnishings(['treasure', 'seal', 'travel']);
  });
  await pin(page);
  await page.screenshot({ path: 'screenshots/v2-room-wealth.png' });

  const framed = await page.evaluate(() => {
    const scene = window.daora.getScene();
    window.daora.showFurnishings(['qin', 'books']);
    const qin = scene.room.props.find((item) => item.id === 'furnish-qin');
    qin.group.position.set(-2.35, 0, 3.45);
    qin.group.rotation.y = 0.15;
    scene.renderer.setAnimationLoop(null);
    scene.controls.enabled = false;
    scene.controls.target.set(-2.35, 0.35, 3.45);
    scene.camera.position.set(-2.15, 1.65, 5.15);
    scene.camera.lookAt(-2.35, 0.35, 3.45);
    scene.camera.updateMatrixWorld();
    scene.room.update(1, scene.camera);
    scene.renderer.render(scene.scene, scene.camera);
    return scene.camera.position.toArray().map((value) => Number(value.toFixed(2)));
  });
  if (framed[0] > -1) throw new Error(`qin camera stayed at ${framed.join(',')}`);
  await page.screenshot({ path: 'screenshots/v2-qin.png' });

  const spot = await page.evaluate(() => {
    const scene = window.daora.getScene();
    const qin = scene.room.props.find((item) => item.id === 'furnish-qin');
    const vector = qin.group.position.clone();
    vector.y += 0.36;
    vector.project(scene.camera);
    const rect = scene.renderer.domElement.getBoundingClientRect();
    return {
      x: rect.left + (vector.x * 0.5 + 0.5) * rect.width,
      y: rect.top + (-vector.y * 0.5 + 0.5) * rect.height,
      z: vector.z,
    };
  });
  assert.ok(spot.z < 1, 'the qin should sit in front of the camera');
  await page.mouse.move(spot.x, spot.y);
  await page.waitForTimeout(120);
  const hint = await page.locator('#prop-hint').innerText();
  assert.match(hint, /琴|弦|qin/i);
  await page.mouse.down();
  await page.mouse.move(spot.x + 90, spot.y + 50, { steps: 8 });
  await page.mouse.up();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('daora-prop-layout-v1') || '{}'));
  assert.ok(saved['furnish-qin'], 'dragging the qin should store a snapped place');
  await pin(page);

  await page.evaluate(() => window.daora.openAnswer());
  await page.waitForSelector('#modal-title');
  assert.match(await page.locator('#modal').innerText(), /答案之书|卦/);
  await page.screenshot({ path: 'screenshots/v2-answers.png' });
  await page.locator('#modal .primary-button[data-action="close-modal"]').click();

  await page.evaluate(() => window.daora.openSpace('bazi'));
  await page.locator('#system-space [data-action="ai-reading"]').click();
  await page.waitForSelector('#system-space .reading-card');
  assert.match(await page.locator('#system-space .reading-card').innerText(), /本地模板|日主/);
  await page.locator('#system-space .reading-card').evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(200);
  await page.screenshot({ path: 'screenshots/v2-ai.png' });
  assert.deepEqual(errors, []);
  await page.close();

  const mobile = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
  });
  await mobile.goto(base, { waitUntil: 'networkidle', timeout: 60000 });
  await mobile.waitForSelector('#cosmos');
  const overflow = await mobile.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  assert.equal(overflow, false);
  await mobile.waitForTimeout(400);
  await mobile.screenshot({ path: 'screenshots/v2-mobile.png' });
  await mobile.goto(roomUrl, { waitUntil: 'networkidle', timeout: 60000 });
  await mobile.waitForSelector('#landing:not(.hidden)');
  await mobile.evaluate(() => window.daora.enterRoom());
  await mobile.waitForFunction(() => window.daoraDiagnostics()?.entered);
  await mobile.waitForTimeout(300);
  await mobile.screenshot({ path: 'screenshots/v2-mobile-room.png' });
  console.log('v2 screenshots written');
} finally {
  await browser.close();
}
