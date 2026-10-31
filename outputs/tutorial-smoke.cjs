const fs=require('fs'),http=require('http'),path=require('path');
const {chromium}=require('C:/Users/ASUS/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve('frontend');
(async()=>{
 const server=http.createServer((req,res)=>{const file=path.join(root,decodeURIComponent(req.url.split('?')[0]==='/'?'/index.html':req.url.split('?')[0]));if(!file.startsWith(root)){res.writeHead(403).end();return;}fs.readFile(file,(e,b)=>{if(e){res.writeHead(404).end();return;}res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.webp':'image/webp','.png':'image/png'})[path.extname(file)]||'application/octet-stream');res.end(b);});}).listen(0,'127.0.0.1');
 await new Promise(r=>server.on('listening',r));
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 try{
 const page=await browser.newPage({viewport:{width:844,height:390},hasTouch:true,isMobile:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>localStorage.setItem('mk-profile',JSON.stringify({girl:'Thiri',cat:'Shwe',coat:'ginger',welcomeSeen:true,tutorialDone:false,showTips:true,tipsSeen:[],tipLanguage:'en'})));
 await page.route('**/js/game.js?*',async route=>{let s=fs.readFileSync(path.join(root,'js/game.js'),'utf8');const i=s.lastIndexOf('})();');s=s.slice(0,i)+`window.lessonDebug={start:()=>startGame('story',1),get:()=>({step:nightGuide.step,active:nightGuide.active,x:cat.x,y:cat.y,on:cat.on,time:timeLeft,score,done:MK_PROFILE.tutorialDone,stock:workshopRun.length,target:mood.find(m=>m.tutorialCatch&&!m.dead)?.x}),lang:()=>{MK_PROFILE.tipLanguage='my';}};`+s.slice(i);await route.fulfill({contentType:'text/javascript',body:s});});
 await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>document.getElementById('bootLoadingScreen').hidden);await page.evaluate(()=>lessonDebug.start());
 const waitStep=n=>page.waitForFunction(n=>lessonDebug.get().step===n,n,{timeout:5000});
 await page.keyboard.down('d');await waitStep(1);await page.keyboard.up('d');
 await page.keyboard.press('Space');await waitStep(2);
 await page.keyboard.down('Shift');await page.keyboard.down('d');await waitStep(3);await page.keyboard.up('d');await page.keyboard.up('Shift');
 let v=await page.evaluate(()=>lessonDebug.get());if(v.time!==120||v.score!==0||v.stock!==0)throw Error('Practice changed run rewards or clock: '+JSON.stringify(v));
 await page.screenshot({path:'outputs/shwe-lesson-desktop.png'});
 await page.keyboard.down('d');await page.waitForFunction(()=>{const s=lessonDebug.get();return s.target-s.x<65;});await page.keyboard.up('d');await page.keyboard.press('x');await page.waitForFunction(()=>!lessonDebug.get().active,{timeout:5000});
 v=await page.evaluate(()=>lessonDebug.get());if(!v.done||v.score!==0||v.stock!==0||v.time<119)throw Error('Completion failed: '+JSON.stringify(v));
 await page.setViewportSize({width:844,height:390});await page.evaluate(()=>{MK_PROFILE.tutorialDone=false;lessonDebug.start();});if(!await page.locator('#tipCoachControl').innerText().then(t=>t.includes('joystick')))throw Error('Touch instructions missing');await page.screenshot({path:'outputs/shwe-lesson-touch.png'});
 await page.click('#tutorialSkipBtn');await page.waitForFunction(()=>!lessonDebug.get().active);
 if(errors.length)throw Error(errors.join('\n'));console.log('PASS (touch device layout): four real-input lessons, catch completion, paused clock, no practice rewards, skip; desktop and landscape rendered.');
 }finally{await browser.close();server.closeAllConnections();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
