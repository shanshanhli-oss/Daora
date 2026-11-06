import {chromium} from 'playwright';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try {
 const page=await browser.newPage({viewport:{width:1280,height:900},reducedMotion:'reduce'});
 page.setDefaultTimeout(60000);
 const errors=[],requests=[];const progress=s=>console.log('[Standalone]',s);
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('request',r=>requests.push(r.url()));
 const url=pathToFileURL(path.resolve('dist/daora-standalone.html')).href;
 await page.goto(url,{waitUntil:'networkidle',timeout:60000});
 await page.waitForSelector('#landing:not(.hidden)',{timeout:45000});
 assert.equal(await page.locator('script[src]').count(),0,'No external scripts');
 assert.equal(await page.evaluate(()=>document.styleSheets.length),1,'CSS embedded');
 await page.locator('#birth-form button[type="submit"]').click();
 await page.locator('[data-action="confirm-entry"]').click();
 await page.waitForFunction(()=>window.daoraDiagnostics()?.entered===true,null,{timeout:15000});
 await page.waitForTimeout(1200);
 // Rendering is paused ONLY in the CPU-only headless test, never in production.
 // DOM/UI events remain live; one last tick pins an actual WebGL room frame.
 await page.evaluate(()=>{const s=window.daora.getScene();s.tick();s.renderer.setAnimationLoop(null);});
 assert.equal(await page.evaluate(()=>window.daoraDiagnostics().hotspots),9);
 assert.equal(await page.evaluate(()=>Boolean(window.daora.getScene().room.wallDoor)),true);
 progress('file URL, local WebGL, entry, wall door and nine hotspots passed');
 await page.locator('[data-nav="services"]').click();
 await page.waitForSelector('.service-card');
 await page.locator('[data-service="breathe"]').click();
 await page.waitForSelector('.ritual-ring');
 await page.waitForTimeout(1200);
 await page.locator('[data-action="finish-breath"]').click();
 await page.waitForSelector('[data-action="again-breath"]');
 await page.locator('#modal [data-action="close-modal"]').click();
 await page.waitForFunction(()=>document.getElementById('modal-backdrop').classList.contains('hidden'));
 await page.locator('[data-nav="records"]').click();
 await page.waitForSelector('#detail-panel .record-card');
 progress('Services, breathing and journal passed');
 progress('Switching bilingual UI via the room header control');
 await page.locator('#room-ui [data-action="language"]').click();
 await page.waitForSelector('#detail-title:text("Quiet traces of you")');
 progress('Records is translated; opening the inner journey');
 await page.evaluate(()=>{window.daora.enterJourney();});
 await page.waitForSelector('#journey-hud:not(.hidden)');
 assert.ok(await page.locator('#journey-list li').count()>=3);
 await page.locator('[data-action="leave-journey"]').click();
 await page.waitForFunction(()=>window.daoraDiagnostics().mode==='room');
 // Keep an exact still of the actual standalone running from file:// for audit.
 await page.evaluate(()=>{const s=window.daora.getScene();s.tick();});
 assert.deepEqual(errors,[]);
 assert.equal(requests.some(url=>!url.startsWith('file:')&&!url.startsWith('blob:')&&!url.startsWith('data:')&&!url.startsWith('about:')),false);
 console.log('PASS: exact rebuilt file:// HTML, embedded CSS/JS, local WebGL, room entry, 9 hotspots, wall door, inner journey, services, breathing, journal, language toggle; 0 errors, 0 network assets.');
} finally {await browser.close();}
