const {chromium}=require('C:/Users/ASUS/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 const page=await browser.newPage();
 await page.goto('http://127.0.0.1:8001');
 await page.waitForTimeout(1500);
 const failures=[];
 for(const [width,height] of [[853,378],[667,320],[740,360],[915,412],[1280,567],[1280,800],[375,812],[375,667]]){
  await page.setViewportSize({width,height});
  for(const screen of ['welcomeScreen','welcomeCardsScreen','setupScreen','pauseScreen','leaveNightScreen']){
   await page.evaluate(id=>{document.querySelectorAll('.overlay').forEach(e=>e.hidden=true);document.getElementById(id).hidden=false;document.querySelector('.orientation-gate')?.remove();},screen);
   await page.waitForTimeout(100);
   const steps=screen==='setupScreen'?2:screen==='welcomeCardsScreen'?3:1;
   for(let step=0;step<steps;step++){
    if(screen==='setupScreen'&&step===1)await page.locator('#setupNext').click();
    if(screen==='welcomeCardsScreen')await page.evaluate(n=>document.querySelectorAll('.welcome-card').forEach((e,i)=>{e.querySelector('h3').textContent=['A heavy heart','Bring them home','Every night grows something'][i];e.querySelector('p').textContent=['Thiri fell asleep with a heavy heart. Her feelings ran into the Night Side.','Help Shwe bring them home. Catch Moodlings before sunrise; each feeling has its own way to be caught.','Earn Glow, upgrade Shwe, fill the Mood Book (17 feelings), unlock 7 nights and the sunrise ending.'][i];}),step);
    const result=await page.evaluate(id=>{
     const s=document.getElementById(id),p=s.querySelector('.panel,.welcome-panel'),r=p.getBoundingClientRect();
     const bad=[...p.querySelectorAll('button,input[type=text],.coat-opt')].filter(e=>e.getClientRects().length&&!e.closest('[hidden]')).filter(e=>{const b=e.getBoundingClientRect();return b.top<r.top-1||b.bottom>r.bottom+1||b.left<r.left-1||b.right>r.right+1}).map(e=>e.id||e.className);
     const inner=[...p.querySelectorAll('.welcome-card,.setup-fields,.coat-pick')].filter(e=>e.getClientRects().length&&!e.closest('[hidden]')).filter(e=>[...e.children].filter(c=>c.getClientRects().length&&!c.closest('[hidden]')).some(c=>{const a=e.getBoundingClientRect(),b=c.getBoundingClientRect();return b.bottom>a.bottom+2||b.top<a.top-2})).map(e=>e.className);
     return {scroll:p.scrollHeight-p.clientHeight,screenScroll:s.scrollHeight-s.clientHeight,bad,inner};
    },screen);
    if(result.scroll>2||result.screenScroll>2||result.bad.length||result.inner.length)failures.push({width,height,screen,step,...result});
    if(width===853)await page.screenshot({path:`outputs/fit-${screen}-${step}.png`});
   }
  }
 }
 console.log(JSON.stringify(failures,null,2));
 await browser.close();
 if(failures.length)process.exitCode=1;
})();
