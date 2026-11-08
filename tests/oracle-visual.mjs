/** Visual + interaction smoke test for the oracle table (divination.html).
 *  Serves dist/ statically, drives a real browser, and fails on console errors,
 *  404s, dead controls, or a broken mobile layout. Screenshots land in ./screenshots.
 */
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync, mkdirSync } from 'node:fs';
import { extname, join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const DIST = join(ROOT, 'dist');
const SHOTS = join(ROOT, 'screenshots');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json', '.webmanifest': 'application/manifest+json' };

const server = createServer(async (req, res) => {
  const path = req.url === '/' ? '/divination.html' : req.url.split('?')[0];
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
    // the sandbox has no GPU — confirm the candidate can actually create a WebGL context
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
  await page.goto(`${base}/divination.html`);
  await page.waitForFunction(() => window.__SCENE_READY__ === true, null, { timeout: 15000 });
  await page.waitForTimeout(1900); // deal animation settles
  await page.screenshot({ path: join(SHOTS, 'oracle-desktop.png') });

  check('scene ready, no console errors', errors.length === 0, errors.join(' | '));
  check('no 404s', missing.length === 0, missing.join(' | '));
  check('UI visible after veil', await page.locator('#table-ui').isVisible());
  check('draw button enabled', await page.locator('#new-draw').isEnabled());

  // tap the middle card through the real raycast path
  const pt = await page.evaluate(() => window.__ORACLE__.project(1));
  check('card projects on screen', !!pt);
  await page.mouse.click(pt.x, pt.y);
  await page.waitForTimeout(1150);
  const name = await page.locator('.reading-name').textContent();
  check('card flips, reading appears', (await page.locator('#reading-card').isVisible()) && name.trim().length > 0, name.trim());
  await page.screenshot({ path: join(SHOTS, 'oracle-flip.png') });

  // new draw
  await page.click('#new-draw');
  await page.waitForTimeout(2700);
  check('toast after new draw', await page.locator('#toast.visible').isVisible());
  await page.screenshot({ path: join(SHOTS, 'oracle-newdraw.png') });

  // language toggle
  await page.click('.top-bar [data-action="language"]');
  check('language switches to EN', (await page.evaluate(() => document.documentElement.lang)) === 'en');
  check('button label translates', (await page.locator('#new-draw').textContent()).includes('New Draw'));

  // sound toggle (headless may or may not allow AudioContext)
  await page.click('.top-bar [data-action="sound"]');
  await page.waitForTimeout(300);
  const pressed = await page.locator('.top-bar [data-action="sound"]').getAttribute('aria-pressed');
  const toastText = (await page.locator('#toast').textContent()) || '';
  check('sound toggle responds', pressed === 'true' || toastText.length > 0, `pressed=${pressed} toast="${toastText.trim()}"`);

  check('still no console errors', errors.length === 0, errors.join(' | '));
  await page.close();
}

// ---------- mobile ----------
{
  const { page, errors, missing } = await newPage({ width: 390, height: 844 }, true);
  await page.goto(`${base}/divination.html`);
  await page.waitForFunction(() => window.__SCENE_READY__ === true, null, { timeout: 15000 });
  await page.waitForTimeout(1900);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check('no horizontal scroll on mobile', overflow <= 1, `overflow=${overflow}px`);
  const pt = await page.evaluate(() => window.__ORACLE__.project(0));
  await page.touchscreen.tap(pt.x, pt.y);
  await page.waitForTimeout(1200);
  check('tap flips card on mobile', await page.locator('#reading-card').isVisible());
  await page.screenshot({ path: join(SHOTS, 'oracle-mobile.png') });
  check('mobile: no console errors', errors.length === 0, errors.join(' | '));
  check('mobile: no 404s', missing.length === 0, missing.join(' | '));
  await page.close();
}

await browser.close();
server.close();

if (!existsSync(SHOTS)) mkdirSync(SHOTS);
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed.`);
process.exit(failed.length ? 1 : 0);
