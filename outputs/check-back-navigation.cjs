const {chromium}=require('C:/Users/ASUS/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const page=await browser.newPage();
 await page.goto('http://127.0.0.1:8001');await page.waitForTimeout(700);
 const failures=[];
 for(const viewport of [{width:667,height:320},{width:853,height:378},{width:375,height:812},{width:1280,height:800}]){
  await page.setViewportSize(viewport);
  for(const id of ['mapHubBackBtn','settingsCloseBtn','levelBriefingBack','shopBack','bookBack','helpDoneBtn','pauseChaptersBtn','menuBtn','setupPrevious']){
   await page.evaluate(id=>{document.querySelectorAll('.overlay').forEach(e=>e.hidden=true);document.querySelector('.orientation-gate')?.remove();const b=document.getElementById(id);b.closest('.overlay').hidden=false;},id);
   await page.waitForTimeout(80);
   if(id==='setupPrevious')await page.locator('#setupNext').click();
   const rect=await page.locator('#'+id).boundingBox();
   if(!rect||Math.abs(rect.x-10)>1||Math.abs(rect.y-10)>1||rect.width<44||rect.height<44)failures.push({viewport,id,rect});
  }
 }
 // Step back still changes the form, and only one return arrow is shown.
 await page.locator('#setupPrevious').click();
 if(!await page.locator('#girlNameInput').isVisible()||await page.locator('#setupPrevious').isVisible())failures.push('setup step back failed');
 console.log(JSON.stringify(failures));await browser.close();if(failures.length)process.exitCode=1;
})();
