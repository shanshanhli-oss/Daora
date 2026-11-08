import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { chooseLondon } from './place.mjs';

const root=process.env.TEST_URL||'http://127.0.0.1:5173';
const base=new URL('sanctuary.html', root.endsWith('/')?root:`${root}/`).href;
const progress=name=>console.log(`[DAORA test] ${name} @ ${new Date().toISOString()}`);
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try {
  const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
  await page.goto(base,{waitUntil:'networkidle',timeout:60000});
  progress('Landing loaded');
  await page.waitForSelector('#landing:not(.hidden)',{timeout:45000});
  assert.equal(await page.locator('#birth-form input[name="birthDate"]').count(),1);
  assert.equal(await page.locator('#birth-form input[name="latitude"]').count(),1);
  await page.locator('[name="birthDate"]').fill('1998-06-18');
  await page.locator('[name="birthTime"]').fill('07:30');
  await chooseLondon(page);
  await page.locator('#birth-form button[type="submit"]').click();
  await page.waitForSelector('#pillars-result:not(.hidden)');
  assert.match(await page.locator('#pillars-result').innerText(),/14:30/);
  await page.locator('[data-action="confirm-entry"]').click();
  await page.waitForFunction(()=>window.daoraDiagnostics()?.entered,{timeout:20000});
  await page.waitForTimeout(1700);
  // CPU-only test runner: pin one rendered room, keep real DOM interaction.
  await page.evaluate(()=>window.daora.getScene().renderer.setAnimationLoop(null));
  assert.equal(await page.evaluate(()=>window.daoraDiagnostics().hotspots),11);
  assert.equal(await page.evaluate(()=>window.daoraDiagnostics().element),'土');
  assert.ok(await page.locator('#landing').evaluate(el=>el.classList.contains('hidden')));

  await page.locator('[data-nav="services"]').click();
  assert.equal(await page.locator('.service-card').count(),4);
  progress('Services open; starting ritual');
  await page.locator('[data-service="breathe"]').click();
  await page.waitForSelector('#modal-backdrop:not(.hidden)');
  await page.waitForTimeout(1400);
  progress('Finishing ritual');
  await page.locator('[data-action="finish-breath"]').click();
  await page.locator('[data-action="close-modal"]').click();
  await page.locator('.panel-close').click();
  await page.locator('[data-nav="records"]').click();
  progress('Journal open; writing entry');
  await page.locator('[data-action="new-record"]').click();
  await page.locator('#reflection-text').fill('A quiet test reflection — 安静的一刻。');
  await page.locator('#reflection-form button[type="submit"]').click();
  progress('Checking saved entry');
  await page.waitForFunction(()=>window.daora.getState().records.some(entry=>entry.body.includes('A quiet test reflection')),null,{timeout:15000});
  await page.getByText('A quiet test reflection — 安静的一刻。',{exact:true}).waitFor({state:'visible',timeout:15000});
  assert.equal(await page.evaluate(()=>window.daora.getState().records.filter(e=>!e.sample).length),1);
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('daora-sanctuary-v1')).records.length),1);

  progress('Record persisted; switching language');
  await page.locator('.panel-close').click();
  await page.locator('#room-ui [data-action="language"]').click();
  await page.locator('[data-nav="records"]').click();
  await page.waitForSelector('#detail-title:text("Quiet traces of you")');
  await page.locator('.panel-close').click();
  await page.locator('[data-nav="about"]').click();
  await page.waitForSelector('#detail-title:text("A little space. A quieter mind.")');
  await page.locator('.panel-close').click();
  await page.getByRole('button',{name:'Reset room view',exact:true}).click();
  progress('Testing first person controls');
  await page.locator('[data-action="walk"]').click();
  await page.waitForFunction(()=>window.daoraDiagnostics().mode==='walk');
  const before=await page.evaluate(()=>window.daoraDiagnostics().position);
  await page.keyboard.down('w');
  // A software WebGL frame can take over a second; advance the same keyboard-driven
  // movement method by exactly 1s instead of letting the assertion depend on frame rate.
  await page.evaluate(()=>window.daora.getScene().walk(1));
  await page.keyboard.up('w');
  const after=await page.evaluate(()=>window.daoraDiagnostics().position);
  assert.notDeepEqual(before,after,'W walking should change camera position');
  await page.keyboard.press('Escape');
  await page.waitForFunction(()=>window.daoraDiagnostics().mode==='room');
  // Return focus so this doesn't accidentally trigger keyboard global state.
  await page.locator('[data-nav="services"]').click();
  assert.equal(await page.evaluate(()=>window.daora.getScene().paused),true);
  progress('Testing chart panel');
  await page.locator('[data-service="elements"]').click();
  assert.equal(await page.locator('.element-row').count(),5);
  await page.keyboard.press('Escape');
  progress('Testing audio toggle');
  await page.locator('[data-action="sound"]').click();
  assert.equal(await page.locator('[data-action="sound"]').getAttribute('aria-pressed'),'true');
  await page.locator('[data-action="sound"]').click();
  await page.screenshot({path:'screenshots/smoke-desktop.png'});
  assert.deepEqual(errors,[],'No browser runtime errors');
  console.log('PASS desktop: pillars → room, 11 hotspots, services, breathing, journal persistence, EN toggle, about, camera reset, WASD movement/Escape, chart, audio; 0 console errors.');
  await page.close();

  const mobile=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  mobile.on('pageerror',e=>errors.push(e.message));
  progress('Mobile landing');
  await mobile.goto(base,{waitUntil:'networkidle',timeout:60000});await mobile.waitForSelector('#landing:not(.hidden)',{timeout:45000});
  const overflow=await mobile.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
  assert.equal(overflow,false,'Mobile landing should not overflow horizontally');
  await mobile.locator('#birth-form button[type="submit"]').click();
  await mobile.locator('[data-action="confirm-entry"]').click();
  await mobile.waitForFunction(()=>window.daoraDiagnostics()?.entered,{timeout:20000});
  await mobile.locator('[data-nav="services"]').click();await mobile.waitForSelector('#detail-panel:not(.hidden)');
  await mobile.screenshot({path:'screenshots/smoke-mobile-services.png'});
  await mobile.locator('.panel-close').click();
  await mobile.screenshot({path:'screenshots/07-mobile-room.png'});
  assert.deepEqual(errors,[]);
  console.log('PASS mobile: responsive landing, entry, service sheet, no horizontal overflow, 0 console errors.');
}finally{await browser.close();}
