const { chromium } = require('C:/Users/ASUS/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 const page=await browser.newPage({viewport:{width:1280,height:720}});
 const errors=[]; page.on('pageerror', e=>errors.push(e.message));
 await page.addInitScript(()=>{localStorage.setItem('mk-profile',JSON.stringify({girl:'Thiri',cat:'Shwe',coat:'ginger',welcomeSeen:true,tutorialDone:true}));localStorage.setItem('mk-progress','19');localStorage.setItem('mk-map-guide-seen','1');});
 await page.goto('http://127.0.0.1:8001');
 await page.locator('#storyBtn').click();
 for(const [width,height] of [[1280,720],[853,378],[667,320],[1920,1080]]){
  await page.setViewportSize({width,height}); await page.waitForTimeout(250);
  const result=await page.evaluate(()=>{
   const v=document.querySelector('#levelMapViewport'),r=v.getBoundingClientRect();
   const visible=[...document.querySelectorAll('.level-entry')].filter(e=>{const b=e.getBoundingClientRect();return b.left>r.left+110&&b.left<r.right-110;});
   const clipped=visible.filter(e=>{const b=e.querySelector('.level-caption').getBoundingClientRect();return b.top<r.top||b.bottom>r.bottom;}).length;
   return {nodes:document.querySelectorAll('.level-node').length,clipped,screenOverflow:document.querySelector('#storyMapScreen').scrollHeight-innerHeight,art:document.querySelector('#mapScenery').children.length};
  });
  console.log(width,height,result); if(result.clipped||result.nodes!==50||result.screenOverflow>1)throw Error('Layout overflow');
  await page.screenshot({path:`outputs/night-river-${width}.png`});
 }
 await page.locator('#mapNext').click(); await page.waitForTimeout(400);
 await page.locator('#mapCurrent').click();
 await page.locator('#playBtn').click(); await page.locator('#levelBriefingScreen').waitFor({state:'visible'});
 console.log('Current chapter click and navigation passed; errors:', errors); if(errors.length)throw Error(errors.join('\n'));
 await browser.close();
})().catch(e=>{console.error(e);process.exitCode=1});
