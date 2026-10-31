const fs=require('fs'),http=require('http'),path=require('path');
const {chromium}=require('C:/Users/ASUS/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve('frontend');
(async()=>{
const server=http.createServer((req,res)=>{const file=path.join(root,decodeURIComponent(req.url.split('?')[0]==='/'?'/index.html':req.url.split('?')[0]));if(!file.startsWith(root)){res.writeHead(403).end();return;}fs.readFile(file,(e,b)=>{if(e){res.writeHead(404).end();return;}res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.webp':'image/webp','.png':'image/png'})[path.extname(file)]||'application/octet-stream');res.end(b);});}).listen(0,'127.0.0.1');await new Promise(r=>server.on('listening',r));
const browser=await chromium.launch({headless:true,channel:'msedge'});
try{
const page=await browser.newPage({viewport:{width:1000,height:600}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>localStorage.setItem('mk-profile',JSON.stringify({girl:'Thiri',cat:'Shwe',coat:'ginger',welcomeSeen:true,tutorialDone:true,showTips:false,tipsSeen:[],tipLanguage:'en'})));
await page.route('**/js/game.js?*',async route=>{let s=fs.readFileSync(path.join(root,'js/game.js'),'utf8');const i=s.lastIndexOf('})();');s=s.slice(0,i)+`window.visualDebug={start:n=>startGame('story',n),brief:n=>showLevelBriefing(n),get:()=>({night:storyNight,map:currentMapKey(),state,score})};`+s.slice(i);await route.fulfill({contentType:'text/javascript',body:s});});
await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>document.getElementById('bootLoadingScreen').hidden);
const original=await page.evaluate(()=>JSON.stringify(TC_LEVELS));
for(let n=1;n<=50;n++){
 await page.evaluate(n=>visualDebug.start(n),n);await page.waitForTimeout(n===1?500:35);
 const v=await page.evaluate(()=>({s:visualDebug.get(),theme:TCVisualChapters.forLevel(visualDebug.get().night)}));
 if(v.s.night!==n||v.theme.first>n||v.theme.last<n)throw Error('Wrong theme for '+n);
 if((n-1)%5===0){await page.screenshot({path:'outputs/visual-chapter-'+String(v.theme.index+1).padStart(2,'0')+'.png'});}
}
if(original!==await page.evaluate(()=>JSON.stringify(TC_LEVELS)))throw Error('Level data changed');
await page.evaluate(()=>visualDebug.brief(46));if(!await page.locator('#levelBriefingSub').innerText().then(t=>t.includes('Dawn Blossoms')))throw Error('Briefing theme missing');
await page.emulateMedia({reducedMotion:'reduce'});await page.setViewportSize({width:844,height:390});await page.evaluate(()=>visualDebug.start(38));await page.waitForTimeout(120);await page.screenshot({path:'outputs/visual-chapter-mobile.png'});
if(errors.length)throw Error(errors.join('\n'));console.log('PASS: all 50 levels render, 10 correct chapter ranges, unchanged level data, themed briefing, mobile/reduced-motion rendering.');
}finally{await browser.close();server.closeAllConnections();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
