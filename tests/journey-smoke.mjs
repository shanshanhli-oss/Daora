import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { chooseLondon } from './place.mjs';
const base=process.env.TEST_URL||'http://127.0.0.1:4173';
const pageUrl=new URL('sanctuary.html', base.endsWith('/')?base:`${base}/`).href;
console.log('[Journey] scene URL',pageUrl);
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
 page.setDefaultTimeout(45000);
 const errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('request',r=>requests.push(r.url()));
 await page.goto(pageUrl,{waitUntil:'networkidle',timeout:60000});await page.waitForSelector('#landing:not(.hidden)');
 assert.match(await page.locator('#landing-title').innerText(),/这张签名，叫八字/);
 await page.locator('[name="birthDate"]').fill('1998-06-18');
 await page.locator('[name="birthTime"]').fill('07:30');
 await chooseLondon(page);
 await page.locator('#birth-form button[type="submit"]').click();
 await page.waitForSelector('#pillars-result:not(.hidden)');
 const pillars=await page.locator('#pillars-result').innerText();
 assert.match(pillars,/14:30/);
 assert.match(pillars,/戊寅/);
 assert.match(pillars,/乙未/);
 await page.locator('[data-action="confirm-entry"]').click();
 await page.waitForFunction(()=>window.daoraDiagnostics()?.entered,null,{timeout:25000});
 console.log('[Journey] entered sanctuary');
 await page.waitForTimeout(400);
 await page.evaluate(()=>window.daora.getScene().renderer.setAnimationLoop(null));
 const room=await page.evaluate(()=>{
  const s=window.daora.getScene();
  return {
   tower:Boolean(s.room.journeyMemory),
   door:Boolean(s.room.wallDoor),
   centre:s.room.canWalkTo(0,-.28),
   hotspots:s.room.hotspotData.length,
   memoryHotspot:s.room.hotspotData.some(h=>h.id==='memory'),
  };
 });
 assert.equal(room.tower,false);
 assert.equal(room.door,true);
 assert.equal(room.centre,true);
 assert.equal(room.hotspots,11);
 assert.equal(room.memoryHotspot,false);
 assert.equal(await page.evaluate(()=>{
  const s=window.daora.getScene();
  s.enterWalk();
  s.camera.position.set(-1.15,1.64,-3.45);
  s.walkYaw=0;
  s.keys.add('w');
  s.walk(0.2);
  s.keys.clear();
  return s.passing||s.mode==='journey';
 }),true,'Walking into the wall door begins the passage');
 await page.waitForFunction(()=>window.daoraDiagnostics().mode==='journey');
 await page.waitForSelector('#journey-hud:not(.hidden)');
 assert.match(await page.locator('#journey-hud h2').innerText(),/内在旅程/);
 console.log('[Journey] inner space open');
 await page.locator('[data-action="add-milestone"]').click();
 await page.locator('#milestone-form input[name="title"]').fill('A quieter morning');
 await page.locator('#milestone-form textarea').fill('I kept one promise to myself.');
 await page.locator('#milestone-form button[type="submit"]').click();
 await page.waitForFunction(()=>window.daora.getState().milestones.some(item=>item.title==='A quieter morning'));
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('daora-sanctuary-v1')).milestones.some(item=>item.title==='A quieter morning')),true);
 assert.ok(await page.evaluate(()=>window.daora.getScene().inner.pieces.length)>=4);
 await page.locator('[data-action="leave-journey"]').click();
 await page.waitForFunction(()=>window.daoraDiagnostics().mode==='room');
 assert.equal(await page.locator('#journey-hud').evaluate(el=>el.classList.contains('hidden')),true);
 await page.locator('[data-action="walk"]').click();
 await page.waitForFunction(()=>window.daoraDiagnostics().mode==='walk');
 assert.equal(await page.evaluate(()=>window.daora.getScene().room.canWalkTo(0,-.28)),true);
 const original=await page.evaluate(()=>window.daora.getScene().camera.position.toArray());
 await page.keyboard.down('d');await page.evaluate(()=>window.daora.getScene().walk(.35));await page.keyboard.up('d');
 assert.notDeepEqual(await page.evaluate(()=>window.daora.getScene().camera.position.toArray()),original);
 await page.keyboard.press('Escape');
 await page.waitForFunction(()=>window.daoraDiagnostics().mode==='room');
 assert.deepEqual(errors,[]);
 assert.equal(requests.some(url=>!url.startsWith(base)&&!url.startsWith('blob:')&&!url.startsWith('data:')),false);
 console.log('[Journey] diagnostics',await page.evaluate(()=>window.daoraDiagnostics()));
 console.log('PASS Inner Self Journey 1.2: calm centre, one wall door, dated milestones in local storage, return to the room, 0 errors.');
}finally{await browser.close();}
