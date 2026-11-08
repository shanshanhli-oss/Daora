import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
// This is the page the visual test previously captured. Reloading after dynamic code edits is required.
for(const target of [{name:'dev',url:'http://127.0.0.1:5173/sanctuary.html'},{name:'file',url:'file:///workspace/daora/dist/daora-standalone.html'}]){
 const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1,reducedMotion:'reduce'});
 const errors=[],styles=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto(target.url,{waitUntil:'networkidle',timeout:60000});await page.waitForSelector('#landing:not(.hidden)',{timeout:60000});
 await page.waitForTimeout(1200);
 styles.push(await page.evaluate(()=>({stylesheets:document.styleSheets.length,globalFont:getComputedStyle(document.body).fontFamily,position:getComputedStyle(document.querySelector('.landing')).position,brandFontSize:getComputedStyle(document.querySelector('.brand b')).fontSize,hasWebGL:!!document.querySelector('canvas')?.getContext('webgl2')})));
 if(target.name==='dev')await page.screenshot({path:'screenshots/01-welcome.png'});
 console.log(target.name,'landing',styles, 'errors',errors);
 await page.evaluate(()=>{window.daora.enterRoom();window.daora.getScene().setRoomCamera(true);});await page.waitForTimeout(2500);
 console.log(target.name,'entered',await page.evaluate(()=>({landingHidden:document.querySelector('#landing').classList.contains('hidden'),entered:window.daora.getState().entered,mode:window.daoraDiagnostics()})));
 await page.screenshot({path:`screenshots/${target.name==='dev'?'02-sanctuary':'standalone-room'}.png`});
 if(target.name==='dev'){
  await page.evaluate(()=>{const s=window.daora.getScene();s.transition=null;s.controls.enabled=true;s.camera.position.set(4.9,3.25,5.0);s.controls.target.set(-.7,1,-1.0);s.controls.update();document.querySelector('#room-ui').classList.add('immersive');});
  await page.waitForTimeout(500);await page.screenshot({path:'screenshots/03-room-detail.png'});
  await page.evaluate(()=>{window.daora.getScene().setRoomCamera(true);document.querySelector('#room-ui').classList.remove('immersive');window.daora.getScene().enterWalk();document.querySelector('#walk-help').classList.add('hidden');});
  await page.waitForTimeout(500);await page.screenshot({path:'screenshots/04-first-person.png'});
  await page.evaluate(()=>window.daora.startBreath());await page.waitForTimeout(1500);await page.screenshot({path:'screenshots/05-breathing-ritual.png'});
 }
 await page.close();
}
await browser.close();
