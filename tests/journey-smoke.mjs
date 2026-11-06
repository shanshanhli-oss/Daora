import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const base=process.env.TEST_URL||'http://127.0.0.1:4173';
 console.log('[Journey] scene URL',base);
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
 page.setDefaultTimeout(45000);
 const errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('request',r=>requests.push(r.url()));
 await page.goto(base,{waitUntil:'networkidle',timeout:60000});await page.waitForSelector('#landing:not(.hidden)');
 await page.locator('#birth-form button[type="submit"]').click();await page.waitForFunction(()=>window.daoraDiagnostics()?.entered,null,{timeout:25000});
 console.log('[Journey] entered sanctuary');
 await page.waitForTimeout(800);await page.evaluate(()=>window.daora.getScene().renderer.setAnimationLoop(null));
 const memory=await page.evaluate(()=>{
  const s=window.daora.getScene(),tower=s.room.journeyMemory;
  return {hotspot:!!s.room.hotspotData.find(h=>h.id==='memory'&&h.title.includes('旅程记忆')),portalCount:tower.floaters.length,doors:tower.doorLights.length,firstY:tower.floaters[0].object.position.y,disc:!!tower.floorMaterial};
 });
 assert.equal(memory.hotspot,true);assert.equal(memory.portalCount,15);assert.equal(memory.doors,5);assert.equal(memory.disc,true);
 // Project the clickable Three.js marker and use a real pointer, not just a helper.
 const click=await page.evaluate(()=>{
  const s=window.daora.getScene(),h=s.room.hotspotData.find(h=>h.id==='memory');
  s.room.root.updateMatrixWorld(true);
  const p=h.group.getWorldPosition(s.camera.position.clone()).project(s.camera);
  return {x:(p.x*.5+.5)*innerWidth,y:(-p.y*.5+.5)*innerHeight};
 });
 assert.ok(click.x>0&&click.x<1440&&click.y>0&&click.y<900);
 console.log('[Journey] centre projected screen point',click);
 await page.mouse.click(click.x,click.y);await page.waitForSelector('#detail-panel:not(.hidden)');
 assert.equal(await page.evaluate(()=>window.daora.getState().currentHotspot),'memory','Actual 3D hotspot click opens memory');

 assert.equal(await page.locator('#detail-title').textContent(),'旅程记忆');
 assert.equal(await page.locator('.journey-step').count(),4);
 await page.locator('[data-action="new-record"]').click();await page.locator('#reflection-text').fill('一段值得被记住的旅程 / A memory to keep.');
 await page.locator('#reflection-form button[type="submit"]').click();
 await page.waitForSelector('.journey-step.personal');
 assert.equal(await page.evaluate(()=>window.daora.getState().records.filter(e=>!e.sample).length),1);
 assert.equal(await page.evaluate(()=>window.daora.getState().records.filter(e=>!e.sample)[0].tag),'旅程记忆');
 console.log('[Journey] demo milestones, personal reflection, local journal linkage passed');
 await page.locator('[data-panel="records"]').click();await page.waitForSelector('#detail-title:text("光阴有迹")');
 await page.locator('.panel-close').click();
 await page.locator('#room-ui [data-action="language"]').click();
 await page.evaluate(()=>window.daora.openPanel('memory'));await page.waitForSelector('#detail-title:text("Journey Memory")');
 console.log('[Journey] bilingual memory panel passed');
 await page.locator('.panel-close').click();
 await page.locator('[data-action="walk"]').click();await page.waitForFunction(()=>window.daoraDiagnostics().mode==='walk');
 // Check real collision handling at the centre, rather than relying only on a screenshot.
 assert.equal(await page.evaluate(()=>window.daora.getScene().room.canWalkTo(0,-.42)),false);
 assert.equal(await page.evaluate(()=>window.daora.getScene().room.canWalkTo(2.1,1.15)),true);
 const original=await page.evaluate(()=>window.daora.getScene().camera.position.toArray());
 await page.keyboard.down('d');await page.evaluate(()=>window.daora.getScene().walk(.35));await page.keyboard.up('d');
 assert.notDeepEqual(await page.evaluate(()=>window.daora.getScene().camera.position.toArray()),original,'D/arrow movement works in the clear aisle');
 await page.keyboard.down('w');await page.evaluate(()=>window.daora.getScene().walk(1));await page.keyboard.up('w');
 const atDisc=await page.evaluate(()=>{const s=window.daora.getScene();return {position:s.camera.position.toArray(),allowed:s.room.canWalkTo(s.camera.position.x,s.camera.position.z)};});
 assert.equal(atDisc.allowed,true,'Forward walk stops at a valid point before disc collision');
 assert.ok(Number.isFinite(atDisc.position[0])&&Number.isFinite(atDisc.position[2]));
 console.log('[Journey] disc approach',atDisc);
 console.log('[Journey] walk controls and centrepiece collision passed');
 await page.keyboard.press('Escape');
 const animated=await page.evaluate(()=>{
  const t=window.daora.getScene().room.journeyMemory,theta=t.helix.rotation.y,height=t.floaters[0].object.position.y,tick=t.memoryLight.intensity;
  t.update(theta+250);return{changed:t.helix.rotation.y!==theta,moving:t.floaters[0].object.position.y!==height,pulsing:t.memoryLight.intensity!==tick};
 });
 assert.equal(animated.changed,true);assert.equal(animated.moving,true);assert.equal(animated.pulsing,true);
 assert.equal(await page.evaluate(()=>{const t=window.daora.getScene().room.journeyMemory;t.reducedMotion=true;t.update(150);const a=t.helix.rotation.y,y=t.floaters[0].object.position.y;t.update(900);return t.helix.rotation.y===a&&t.floaters[0].object.position.y===y;}),true,'Reduced motion holds tower still');
 assert.deepEqual(errors,[]);
 assert.equal(requests.some(url=>!url.startsWith(base)&&!url.startsWith('blob:')&&!url.startsWith('data:')),false);
 console.log('[Journey] whole-scene diagnostics',await page.evaluate(()=>window.daoraDiagnostics()));
 console.log('PASS Journey Memory 1.1: five panelled doors + ten memory frames, bilingual panel/journal, camera, walk collision, orbit/float/pulse, all local with 0 errors.');
}finally{await browser.close();}
