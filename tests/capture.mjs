import { chromium } from 'playwright';
const base=process.env.TEST_URL||'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1,reducedMotion:'reduce'});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto(base,{waitUntil:'networkidle',timeout:60000});await page.waitForSelector('#landing:not(.hidden)',{timeout:45000});
 await page.screenshot({path:'screenshots/01-welcome.png'});
 await page.locator('#birth-form button[type="submit"]').click();await page.waitForFunction(()=>window.daoraDiagnostics()?.entered,null,{timeout:20000});await page.waitForTimeout(1200);
 await page.screenshot({path:'screenshots/02-sanctuary.png'});
 await page.getByRole('button',{name:'Toggle immersive mode'}).click();
 await page.evaluate(()=>{const s=window.daora.getScene();s.transition=null;s.controls.enabled=true;s.camera.position.set(4.9,3.25,5);s.controls.target.set(-.7,1,-1);s.controls.update();s.room.setHotspotsVisible(false);});
 await page.waitForTimeout(500);await page.screenshot({path:'screenshots/03-room-detail.png'});
 await page.evaluate(()=>{window.daora.getScene().enterWalk();document.querySelector('#walk-help').classList.add('hidden');});
 await page.waitForTimeout(500);await page.screenshot({path:'screenshots/04-first-person.png'});
 await page.evaluate(()=>window.daora.startBreath());await page.waitForTimeout(1500);await page.screenshot({path:'screenshots/05-breathing-ritual.png'});
 await page.locator('[data-action="finish-breath"]').click();await page.locator('[data-action="close-modal"]').click();
 await page.evaluate(()=>window.daora.openPanel('services'));await page.screenshot({path:'screenshots/06-services.png'});
 console.log('Desktop screenshots captured; errors:',JSON.stringify(errors));
 await page.close();
 const mobile=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true,reducedMotion:'reduce'});
 await mobile.goto(base,{waitUntil:'networkidle',timeout:60000});await mobile.waitForSelector('#landing:not(.hidden)',{timeout:45000});
 await mobile.screenshot({path:'screenshots/08-mobile-landing.png',fullPage:true});
 await mobile.locator('#birth-form button[type="submit"]').click();await mobile.waitForFunction(()=>window.daoraDiagnostics()?.entered,null,{timeout:20000});
 await mobile.waitForTimeout(600);await mobile.screenshot({path:'screenshots/07-mobile-room.png'});
 console.log('Mobile screenshots captured.');
}finally{await browser.close();}
