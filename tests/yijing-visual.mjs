/** Visual + interaction smoke test for the yi jing table (yijing.html).
 *  Serves dist/ statically, drives a real browser, and fails on console errors,
 *  404s, dead controls, or a broken mobile layout. Screenshots land in ./screenshots.
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
  const path = req.url === '/' ? '/yijing.html' : req.url.split('?')[0];
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
  await page.goto(`${base}/yijing.html`);
  await page.waitForFunction(() => window.__SCENE_READY__ === true && !!window.__YIJING__, null, { timeout: 15000 });
  await page.waitForTimeout(600);

  check('scene ready, no console errors', errors.length === 0, errors.join(' | '));
  check('no 404s', missing.length === 0, missing.join(' | '));
  check('UI visible after veil', await page.locator('#table-ui').isVisible());
  check('action button enabled', await page.locator('#action').isEnabled());
  check('six empty line slots', (await page.locator('.hex-line.empty').count()) === 6);
  await page.screenshot({ path: join(SHOTS, 'yijing-desktop.png') });

  // tap a coin through the real raycast path
  const pt = await page.evaluate(() => window.__YIJING__.projectCoin(1));
  check('coin projects on screen', !!pt);
  await page.mouse.click(pt.x, pt.y);
  await page.waitForFunction(() => window.__YIJING__.state().tossCount === 1, null, { timeout: 6000 });
  check('coin tap tosses once', true);

  // remaining five tosses via the primary button
  for (let n = 2; n <= 6; n++) {
    await page.click('#action');
    await page.waitForFunction((k) => window.__YIJING__.state().tossCount === k, n, { timeout: 6000 });
  }
  const state = await page.evaluate(() => window.__YIJING__.state());
  check('six tosses complete the cast', state.done === true && !!state.resultName, state.resultName || '');
  check('six lines drawn', (await page.locator('.hex-line:not(.empty)').count()) === 6);
  check('result panel appears', await page.locator('#result').isVisible());
  const judgment = (await page.locator('.result-judgment').textContent()) || '';
  check('judgment text present', judgment.trim().length > 4, judgment.trim().slice(0, 30));
  await page.screenshot({ path: join(SHOTS, 'yijing-cast.png') });

  // cast again resets the panel
  await page.click('#action'); // label is now 再占一次
  await page.waitForFunction(() => window.__YIJING__.state().tossCount === 0, null, { timeout: 6000 });
  check('recast resets the panel', (await page.locator('.hex-line.empty').count()) === 6);

  // switch to the lot cup and draw
  await page.click('[data-mode="lot"]');
  await page.waitForFunction(() => window.__YIJING__.state().mode === 'lot', null, { timeout: 6000 });
  await page.click('#action');
  await page.waitForFunction(() => window.__YIJING__.state().done === true, null, { timeout: 8000 });
  // the panel opens only after the cup stops shaking and the stick has risen
  await page.waitForSelector('#result:not(.hidden)', { timeout: 8000 });
  const lotState = await page.evaluate(() => window.__YIJING__.state());
  check('lot draw reveals a hexagram', !!lotState.resultName, lotState.resultName || '');
  check('lot result panel appears', await page.locator('#result').isVisible());
  check('lot shows six still lines', (await page.locator('.hex-line:not(.empty)').count()) === 6);
  await page.screenshot({ path: join(SHOTS, 'yijing-lot.png') });

  // language toggle
  await page.click('.top-bar [data-action="language"]');
  check('language switches to EN', (await page.evaluate(() => document.documentElement.lang)) === 'en');
  check('action label translates', ((await page.locator('#action').textContent()) || '').includes('Draw Again'));
  const enName = ((await page.locator('.result-name').textContent()) || '').trim();
  check('result name renders in EN', enName.length > 0 && !/[一-鿿]/.test(enName), enName);

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
  await page.goto(`${base}/yijing.html`);
  await page.waitForFunction(() => window.__SCENE_READY__ === true && !!window.__YIJING__, null, { timeout: 15000 });
  await page.waitForTimeout(600);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check('no horizontal scroll on mobile', overflow <= 1, `overflow=${overflow}px`);
  await page.tap('#action');
  await page.waitForFunction(() => window.__YIJING__.state().tossCount === 1, null, { timeout: 6000 });
  check('tap tosses coins on mobile', true);
  check('one line drawn on mobile', (await page.locator('.hex-line:not(.empty)').count()) === 1);
  await page.screenshot({ path: join(SHOTS, 'yijing-mobile.png') });
  check('mobile: no console errors', errors.length === 0, errors.join(' | '));
  check('mobile: no 404s', missing.length === 0, missing.join(' | '));
  await page.close();
}

await browser.close();
server.close();

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed.`);
process.exit(failed.length ? 1 : 0);
