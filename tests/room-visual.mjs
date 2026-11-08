/** Visual + interaction smoke test for the four-gate hall (room.html).
 *  Serves dist/ statically, drives a real browser, and fails on console errors,
 *  404s, dead gates, or a broken mobile layout. Screenshots land in ./screenshots.
 *  Run under xvfb-run -a in the sandbox.
 */
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync, mkdirSync } from 'node:fs';
import { extname, join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const DIST = join(ROOT, 'dist');
const SHOTS = join(ROOT, 'screenshots');
if (!existsSync(SHOTS)) mkdirSync(SHOTS);
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json', '.webmanifest': 'application/manifest+json' };

const server = createServer(async (req, res) => {
  const path = req.url === '/' ? '/room.html' : req.url.split('?')[0];
  try {
    const body = await readFile(join(DIST, path));
    res.writeHead(200, { 'content-type': MIME[extname(path)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404); res.end('not found');
  }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;

let browser;
const candidates = [
  {},
  { executablePath: '/root/.cache/ms-playwright/chromium_headless_shell-1247/chrome-headless-shell-linux64/chrome-headless-shell', args: ['--no-sandbox'] },
  { executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] },
];
for (const opts of candidates) {
  try {
    browser = await chromium.launch(opts);
    const probe = await browser.newPage();
    const hasGL = await probe.evaluate(() => !!(document.createElement('canvas').getContext('webgl2') || document.createElement('canvas').getContext('webgl')));
    await probe.close();
    if (hasGL) break;
    await browser.close();
    browser = null;
  } catch {
    browser = null;
  }
}
if (!browser) {
  console.error('No Chromium build with a working WebGL context was found.');
  process.exit(1);
}

const results = [];
const check = (name, ok, extra = '') => {
  results.push({ name, ok, extra });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? ` — ${extra}` : ''}`);
};

async function newPage(viewport, hasTouch = false) {
  const page = await browser.newPage({ viewport, hasTouch });
  const errors = [];
  const missing = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('response', (r) => r.status() >= 400 && missing.push(`${r.status()} ${r.url()}`));
  return { page, errors, missing };
}

// ---------- desktop ----------
{
  const { page, errors, missing } = await newPage({ width: 1440, height: 900 });
  await page.goto(`${base}/room.html`);
  await page.waitForFunction(() => window.__SCENE_READY__ === true && !!window.__HALL__, null, { timeout: 15000 });
  await page.waitForSelector('#table-ui:not(.hidden)', { timeout: 8000 });
  await page.waitForTimeout(700);

  check('scene ready, no console errors', errors.length === 0, errors.join(' | '));
  check('no 404s', missing.length === 0, missing.join(' | '));
  check('four stations in scene', await page.evaluate(() => window.__HALL__.stations.length === 4));
  check('four gate buttons', (await page.locator('.gate-item').count()) === 4);
  check('divination gate marked open', await page.locator('.gate-item.open[data-gate="divination"]').isVisible());
  check('greeting visible', await page.locator('.table-copy h1').isVisible());
  await page.screenshot({ path: join(SHOTS, 'room-desktop.png') });

  // hover a station through the real raycast path → tooltip appears
  const pt = await page.evaluate(() => window.__HALL__.project('fengshui'));
  check('compass projects on screen', !!pt && pt.x > 0 && pt.y > 0);
  await page.mouse.move(pt.x, pt.y);
  await page.waitForTimeout(400);
  check('hover shows station label', await page.evaluate(() => document.getElementById('station-label').classList.contains('show')));
  await page.screenshot({ path: join(SHOTS, 'room-hover.png') });

  // tap a coming-soon station → toast
  await page.mouse.click(pt.x, pt.y);
  await page.waitForTimeout(300);
  check('coming-soon toast appears', await page.evaluate(() => document.getElementById('toast').classList.contains('show')));
  await page.screenshot({ path: join(SHOTS, 'room-toast.png') });

  // language toggle
  await page.click('[data-action="language"]');
  await page.waitForTimeout(200);
  const h1 = await page.locator('.table-copy h1').textContent();
  check('EN switch re-renders copy', /four gates/i.test(h1), h1);
  const enGate = await page.locator('.gate-item[data-gate="spirit"] b').textContent();
  check('EN gate names', enGate.trim() === 'Medium', enGate);
  await page.click('[data-action="language"]');
  await page.waitForTimeout(200);
  const zhGate = await page.locator('.gate-item[data-gate="spirit"] b').textContent();
  check('ZH switch back', zhGate.trim() === '通灵', zhGate);

  // sound toggle flips state
  const before = await page.getAttribute('[data-action="sound"]', 'aria-pressed');
  await page.click('[data-action="sound"]');
  const after = await page.getAttribute('[data-action="sound"]', 'aria-pressed');
  check('sound toggle flips', before !== after, `${before}→${after}`);
  await page.click('[data-action="sound"]');

  // gate-nav coming-soon path via DOM button
  await page.click('.gate-item[data-gate="chart"]');
  await page.waitForTimeout(300);
  check('gate button shows toast', await page.evaluate(() => document.getElementById('toast').classList.contains('show')));

  // open gate navigates to yijing.html
  await page.click('.gate-item[data-gate="divination"]');
  await page.waitForURL('**/yijing.html', { timeout: 6000 });
  check('divination gate navigates to yijing', page.url().endsWith('/yijing.html'));
  await page.waitForFunction(() => window.__SCENE_READY__ === true && !!window.__YIJING__, null, { timeout: 15000 });
  check('yijing page boots after navigation', true);
  await page.screenshot({ path: join(SHOTS, 'room-to-yijing.png') });

  check('no late console errors', errors.length === 0, errors.join(' | '));
  await page.close();
}

// ---------- mobile ----------
{
  const { page, errors, missing } = await newPage({ width: 390, height: 844 }, true);
  await page.goto(`${base}/room.html`);
  await page.waitForFunction(() => window.__SCENE_READY__ === true && !!window.__HALL__, null, { timeout: 15000 });
  await page.waitForSelector('#table-ui:not(.hidden)', { timeout: 8000 });
  await page.waitForTimeout(700);

  check('mobile: no console errors', errors.length === 0, errors.join(' | '));
  check('mobile: no 404s', missing.length === 0, missing.join(' | '));
  check('mobile: no horizontal overflow', await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
  check('mobile: gate nav visible', await page.locator('.gate-nav').isVisible());
  await page.screenshot({ path: join(SHOTS, 'room-mobile.png') });

  // tap the compass station → toast
  const pt = await page.evaluate(() => window.__HALL__.project('spirit'));
  await page.touchscreen.tap(pt.x, pt.y);
  await page.waitForTimeout(400);
  check('mobile: tap shows toast', await page.evaluate(() => document.getElementById('toast').classList.contains('show')));

  // tap divination coin stack → navigates
  const pc = await page.evaluate(() => window.__HALL__.project('divination'));
  await page.touchscreen.tap(pc.x, pc.y);
  try {
    await page.waitForURL('**/yijing.html', { timeout: 6000 });
    check('mobile: tap divination navigates', true);
  } catch {
    check('mobile: tap divination navigates', false, 'no navigation');
  }

  await page.close();
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
await browser.close();
server.close();
process.exit(failed.length ? 1 : 0);
