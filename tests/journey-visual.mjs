import {chromium} from 'playwright';
import {writeFile,mkdir} from 'node:fs/promises';
const base=process.env.TEST_URL||'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
await mkdir('screenshots',{recursive:true});
try {
 const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1,reducedMotion:'reduce'});
 page.setDefaultTimeout(60000);const errors=[],requests=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('request',r=>requests.push(r.url));
 const pause=()=>page.evaluate(()=>window.daora.getScene().renderer.setAnimationLoop(null));
 const render=()=>page.evaluate(()=>{const s=window.daora.getScene();s.tick();const d=s.renderer.domElement;d.dataset.frameImage=d.toDataURL('image/png');});
 // Retain one genuine WebGL frame: scene-only proof from the exact rendered camera.
 const raw=async(name)=>{await render();const data=await page.locator('canvas[data-scene-ready="true"]').evaluate(c=>{const d=c.dataset.frameImage;delete c.dataset.frameImage;return d;});await writeFile(`screenshots/journey-${name}.png`,Buffer.from(data.split(',')[1],'base64'));};
 const focus=()=>page.evaluate(()=>{const s=window.daora.getScene();s.focusHotspot('memory');if(s.transition){s.camera.position.copy(s.transition.to);s.controls.target.copy(s.transition.targetTo);s.camera.lookAt(s.controls.target);s.controls.update();s.transition=null;}});
 await page.goto(base,{waitUntil:'networkidle',timeout:60000});await page.waitForSelector('#landing:not(.hidden)');
 await pause();await page.screenshot({path:'screenshots/journey-landing.png',timeout:60000});
 await page.locator('#birth-form button[type="submit"]').click();await page.waitForFunction(()=>window.daoraDiagnostics()?.entered);
 await pause();await page.evaluate(()=>window.daora.getScene().setRoomCamera(true));
 await raw('room'); await page.evaluate(()=>window.daora.getScene().tick());
 console.log('scene',await page.evaluate(()=>window.daoraDiagnostics()));
 console.log('memory objects',await page.evaluate(()=>{const t=window.daora.getScene().room.journeyMemory;return {parts:t.floaters.length,doors:t.doorLights.length,frames:15-t.doorLights.length,reducedMotion:t.reducedMotion};}));
 await focus();await raw('portals-detail');
 await page.evaluate(()=>{const s=window.daora.getScene();s.renderer.setAnimationLoop(()=>s.tick());});
 await page.evaluate(()=>window.daora.openPanel('memory'));await page.waitForSelector('#detail-title:text("旅程记忆")');await pause();
 
 await page.waitForTimeout(2000);await page.screenshot({path:'screenshots/journey-panel.png',timeout:60000});
 await page.locator('.panel-close').click();await pause();await focus();
 await page.evaluate(()=>window.daora.getScene().enterWalk());await raw('walk');
 
 await page.keyboard.press('Escape');await page.close();
 const mobile=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true,reducedMotion:'reduce'});
 mobile.on('pageerror',e=>errors.push(e.message));mobile.setDefaultTimeout(60000);
 await mobile.goto(base,{waitUntil:'networkidle',timeout:60000});await mobile.waitForSelector('#landing:not(.hidden)');
 await mobile.locator('#birth-form button[type="submit"]').click();await mobile.waitForFunction(()=>window.daoraDiagnostics()?.entered);
 await mobile.evaluate(()=>{const s=window.daora.getScene();s.setRoomCamera(false);s.clock.getDelta();});await mobile.waitForFunction(()=>!window.daora.getScene().transition,null,{timeout:20000});await mobile.waitForTimeout(2000);await mobile.evaluate(()=>window.daora.getScene().renderer.setAnimationLoop(null));
 await mobile.screenshot({path:'screenshots/journey-mobile.png',timeout:60000});
 console.log('mobile',await mobile.evaluate(()=>({diagnostics:window.daoraDiagnostics(),overflow:document.documentElement.scrollWidth>innerWidth})));
 console.log('errors',errors);console.log('remote assets',requests.filter(u=>{const url=u;return !url.startsWith(base)&&!url.startsWith('blob:')&&!url.startsWith('data:');}));
 if(errors.length)process.exitCode=1;
} finally {await browser.close();}
