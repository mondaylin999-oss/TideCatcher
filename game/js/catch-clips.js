/* Three still-picture catch guides, drawn with the same cat and Moodling art as play. */
(function (root) {
  'use strict';
  const stage = document.getElementById('catchClipStage');
  if (!stage) return;
  const gallery = document.getElementById('catchClipCards');
  const dots = document.getElementById('catchClipDots');
  const caption = document.getElementById('catchClipCaption');
  const tag = document.getElementById('catchClipTag');
  const back = document.getElementById('catchClipPrev'), next = document.getElementById('catchClipNext');
  const touchControls = document.getElementById('touch');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const W = 800, H = 450;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  let data = null, current = 0, canvases = [], observer = null, animation = 0, startedAt = 0, pointerStart = null;
  const storyboard = {
    F: [{keys:[],action:'NOTICE',pose:'windup'}, {keys:['SPACE'],or:['A','D'],action:'DODGE',pose:'dodge',motion:true}, {keys:['J','X'],action:'POUNCE',pose:'catch',motion:true}],
    N: [{keys:['A','D'],action:'RUN',pose:'scared'}, {keys:['SHIFT'],action:'HOLD',pose:'sneak',held:true}, {keys:['J','X'],action:'POUNCE',pose:'calm'}],
    L: [{keys:['E'],action:'EYES',pose:'chime'}, {keys:['S'],action:'SCRATCH',pose:'scratch'}, {keys:[],action:'WAIT',pose:'wait'}],
    B: [{keys:['E'],action:'EYES',pose:'marked'}, {keys:['S'],action:'SCRATCH',pose:'dig'}, {keys:['J','X'],action:'POUNCE',pose:'catch'}],
    E: [{keys:[],action:'NOTICE',pose:'bounce'}, {keys:['SPACE'],action:'JUMP',pose:'top',motion:true}, {keys:['J','X'],action:'POUNCE',pose:'catch'}],
    S: [{keys:[],action:'NOTICE',pose:'peek'}, {keys:['A','D'],action:'RELEASE',pose:'freeze',motion:true}, {keys:['A','D'],then:['J','X'],action:'MOVE + POUNCE',pose:'catch'}],
    J: [{keys:[],action:'NOTICE',pose:'steal'}, {keys:['A','D'],action:'CHASE',pose:'chase'}, {keys:['J','X'],action:'POUNCE',pose:'catch'}],
    C: [{keys:['SHIFT'],action:'SLOW WALK',pose:'reeds'}, {keys:[],action:'WAIT',pose:'wait'}, {keys:[],action:'WAIT',pose:'catch'}],
    C1: [{keys:['S'],action:'HOLD',pose:'breathe',held:true,motion:true}, {keys:['S'],action:'RELEASE',pose:'breathe',motion:true}, {keys:[],action:'WAIT',pose:'catch'}],
    G: [{keys:[],action:'NOTICE',pose:'arc'}, {keys:['SPACE'],action:'JUMP',pose:'top',motion:true}, {keys:['J','X'],action:'POUNCE',pose:'catch'}]
  };
  const touchInput = { RUN:'move', DODGE:'jump', JUMP:'jump', POUNCE:'pounce', EYES:'eyes', SCRATCH:'scratch', HOLD:'sneak', RELEASE:'release', 'MOVE + POUNCE':'pounce', CHASE:'move', 'SLOW WALK':'sneak' };
  function isTouch() { return !!touchControls && !touchControls.hidden; }
  function layout() { return matchMedia('(max-width: 700px)').matches ? 'mobile' : 'desktop'; }
  function badgeMarkup(step) {
    const type = isTouch() ? 'touch' : 'keys';
    if (step.keys.length === 0 && !step.or) return `<span class="catch-clip-no-input">${data.copy.catchClipNoButton || 'No button — watch Shwe'}</span>`;
    if (type === 'touch') {
      if (data.type==='C'&&data.variant===1&&['HOLD','RELEASE'].includes(step.action)) {
        const scratch=data.touchLabels?.scratch||'SCRATCH',action=data.copy.catchClipActionLabels?.[step.action]||step.action;
        return `<span class="catch-clip-touch-badge"><b>${escapeHtml(scratch)}</b><span>${escapeHtml(action)}</span></span>`;
      }
      if (step.then) {
        const moveLabel = data.touchLabels?.move || 'MOVE', catchLabel = data.touchLabels?.pounce || 'POUNCE';
        return `<span class="catch-clip-touch-badge"><span class="tip-joystick-icon" aria-hidden="true"></span><b>${escapeHtml(moveLabel)}</b><span class="catch-clip-or">→</span><b>${escapeHtml(catchLabel)}</b></span>`;
      }
      const input = step.action==='HOLD'?'sneak':touchInput[step.action] || 'move';
      const label = data.touchLabels?.[input] || step.action;
      const icon = ['move','sneak'].includes(input) ? '<span class="tip-joystick-icon" aria-hidden="true"></span>' : '';
      return `<span class="catch-clip-touch-badge">${icon}<b>${escapeHtml(label)}</b></span>`;
    }
    const keys = step.keys.map(k => `<kbd>${escapeHtml(k)}</kbd>`).join('');
    const alt = step.or ? `<span class="catch-clip-or">${escapeHtml(data.copy.catchClipOr || 'or')}</span>${step.or.map(k => `<kbd>${escapeHtml(k)}</kbd>`).join('')}` : '';
    const then = step.then ? `<span class="catch-clip-or">→</span>${step.then.map(k => `<kbd>${escapeHtml(k)}</kbd>`).join('')}` : '';
    const action = step.action && data.copy.catchClipActionLabels?.[step.action] ? `<span class="catch-clip-or">${escapeHtml(data.copy.catchClipActionLabels[step.action])}</span>` : '';
    return `${keys}${alt}${then}${action}`;
  }
  function escapeHtml(text) { return String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function drawBackground(g, type) {
    const palettes = { F:['#282043','#79526c','#d29072'], N:['#171f35','#3d5264','#78958c'], L:['#15263a','#315979','#4a8b9a'], B:['#1b2034','#514653','#92806b'], E:['#292047','#5d4b83','#c18aa6'], S:['#1d2138','#414d68','#718b83'], J:['#211d3b','#57456a','#c18c64'], C:['#152b39','#2e5960','#638f74'], G:['#211b40','#594c7e','#e7b968'] };
    const [sky, far, floor] = palettes[type] || palettes.F;
    const grad = g.createLinearGradient(0,0,0,H); grad.addColorStop(0,sky); grad.addColorStop(.72,far); grad.addColorStop(1,floor); g.fillStyle=grad; g.fillRect(0,0,W,H);
    g.fillStyle='rgba(19,19,43,.43)';
    for(let i=0;i<8;i++){const x=i*118-20,h=80+(i*37)%100;g.fillRect(x,260-h,82,h);}
    g.fillStyle=floor; g.fillRect(0,324,W,126); g.fillStyle='rgba(255,231,176,.28)';g.fillRect(0,322,W,4);
    if(type==='L'||type==='B'){g.fillStyle='rgba(15,26,46,.72)';g.fillRect(0,340,W,110);for(let i=0;i<9;i++){g.strokeStyle='rgba(180,211,218,.35)';g.beginPath();g.moveTo(i*112,370);g.lineTo(i*112+55,370);g.stroke();}}
    if(type==='N'||type==='S'||type==='C'){g.strokeStyle='rgba(104,155,116,.7)';g.lineWidth=5;for(let i=0;i<9;i++){const x=30+i*94;g.beginPath();g.moveTo(x,324);g.quadraticCurveTo(x-15,275,x+4,260-i%3*13);g.stroke();}}
    g.fillStyle='rgba(255,241,199,.75)';for(let i=0;i<22;i++){let x=(i*137+31)%W,y=(i*73+25)%285;g.fillRect(x,y,2,2);}
  }
  function drawArrow(g,x1,y1,x2,y2,color='#fff1b5'){
    g.save();g.strokeStyle=color;g.fillStyle=color;g.lineWidth=5;g.setLineDash([8,10]);g.beginPath();g.moveTo(x1,y1);g.quadraticCurveTo((x1+x2)/2,y1-32,x2,y2);g.stroke();g.setLineDash([]);const a=Math.atan2(y2-y1,x2-x1);g.beginPath();g.moveTo(x2,y2);g.lineTo(x2-15*Math.cos(a-.45),y2-15*Math.sin(a-.45));g.lineTo(x2-15*Math.cos(a+.45),y2-15*Math.sin(a+.45));g.closePath();g.fill();g.restore();
  }
  function drawMood(g, x, y, alpha=1, scale=1){ if(!data?.mood?.complete||!data.mood.naturalWidth)return;g.save();g.globalAlpha=alpha;g.shadowColor=data.color;g.shadowBlur=18;const s=104*scale;g.drawImage(data.mood,x-s/2,y-s/2,s,s);g.restore(); }
  function drawCat(g,x,y,pose,time,ghost=false){
    if(ghost)g.globalAlpha=.24;
    g.fillStyle='rgba(8,10,24,.35)';g.beginPath();g.ellipse(x,328,66,9,0,0,7);g.fill();
    const motion=['dodge','chase','top','arc','catch','steal'].includes(pose);const action=pose==='dodge'||pose==='top'||pose==='catch'||pose==='arc'?'jump':pose==='scratch'||pose==='dig'?'scratch':pose==='wait'||pose==='breathe'?'sit':pose==='sneak'||pose==='reeds'?'sneak':motion?'walk':'idle';
    root.TCCatchClipArt?.drawCat(g,{x,y:326,height:155,action,facing:1,time,rigPose:null});
    g.globalAlpha=1;
  }
  function drawPicture(canvas, stepIndex, time=0){
    if(!data)return;const rect=canvas.getBoundingClientRect();if(!rect.width)return;
    const dpr=Math.max(1,Math.min(3,devicePixelRatio||1)),w=Math.round(rect.width*dpr),h=Math.round(rect.height*dpr);
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
    const g=canvas.getContext('2d');g.setTransform(w/W,0,0,h/H,0,0);g.clearRect(0,0,W,H);drawBackground(g,data.type);
    const type=data.type,story=type==='C'&&data.variant===1?'C1':type,pose=storyboard[story]?.[stepIndex]?.pose||'notice',pulse=reducedMotion.matches?0:(Math.sin(time*Math.PI*2)+1)/2;
    const catX=pose==='dodge'?310:pose==='chase'?510:pose==='catch'?530:pose==='wait'||pose==='breathe'?350:pose==='sneak'?365:275;
    const catY=(pose==='top'||pose==='arc'||pose==='catch')?235:pose==='dodge'?255:326;
    // Moodling-specific story cues and small map-floor motifs.
    if(pose==='windup'){g.fillStyle='#ff8e83';g.font='bold 46px sans-serif';g.textAlign='center';g.fillText('!',590,118);drawMood(g,590,248,1,1.08);}
    else if(pose==='dodge'){drawMood(g,625,270,.42,.92);drawArrow(g,220,215,420,175);g.fillStyle='#ffdf9a';g.font='bold 30px sans-serif';g.textAlign='center';g.fillText('✦  ✦',620,172);}
    else if(pose==='scared'){drawMood(g,620,270,1,1);g.fillStyle='#ff758a';g.font='bold 38px sans-serif';g.textAlign='center';g.fillText('✕',620,170);}
    else if(pose==='sneak'){drawMood(g,600,268,1,1);g.strokeStyle='#8ee6d1';g.lineWidth=5;g.beginPath();g.arc(365,275,104,0,7);g.stroke();drawArrow(g,195,255,350,260,'#a9eddb');}
    else if(pose==='chime'){drawMood(g,610,265,.3,1);g.fillStyle='#ffe7a2';g.font='bold 42px sans-serif';g.fillText('♪',600,135);g.strokeStyle='#89ecff';g.lineWidth=5;g.shadowColor='#83eaff';g.shadowBlur=24;g.beginPath();g.arc(600,265,67,0,7);g.stroke();g.shadowBlur=0;}
    else if(pose==='scratch'||pose==='dig'){drawMood(g,620,270,.38,.9);g.fillStyle='#ffd96f';g.shadowColor='#ffd96f';g.shadowBlur=24;g.beginPath();g.arc(620,270,30+pulse*8,0,7);g.fill();g.shadowBlur=0;g.fillStyle='#fff1c5';g.font='bold 34px sans-serif';g.fillText('✦',620,220);}
    else if(pose==='marked'){g.fillStyle='#9a795d';g.fillRect(564,280,112,42);g.strokeStyle='#ffe071';g.lineWidth=6;g.strokeRect(560,276,120,50);g.font='bold 36px sans-serif';g.fillStyle='#ffe071';g.fillText('E',620,248);}
    else if(pose==='bounce'||pose==='top'){const my=pose==='top'?160:245+Math.abs(Math.sin(time*6))*65;drawMood(g,620,my,1,1);drawArrow(g,620,295,620,pose==='top'?175:210,'#ffd4f2');}
    else if(pose==='peek'||pose==='freeze'){drawMood(g,625,265,pose==='freeze'?1:.75,1);if(pose==='freeze'){g.fillStyle='#eee5ff';g.font='bold 28px sans-serif';g.textAlign='center';g.fillText('…',620,160);g.strokeStyle='#c8b4ff';g.lineWidth=5;g.beginPath();g.arc(315,258,90,0,7);g.stroke();}}
    else if(pose==='steal'||pose==='chase'){drawMood(g,pose==='steal'?620:560,255,1,1);g.strokeStyle='#ffe485';g.lineWidth=4;g.setLineDash([7,9]);g.beginPath();g.moveTo(620,200);g.quadraticCurveTo(470,145,350,245);g.stroke();g.setLineDash([]);g.fillStyle='#fff0a0';g.shadowColor='#fff0a0';g.shadowBlur=18;g.beginPath();g.arc(480,190,12,0,7);g.fill();g.shadowBlur=0;}
    else if(pose==='reeds'||pose==='wait'||pose==='breathe'){drawMood(g,555,265,1,1);if(pose==='breathe'||pose==='wait'){g.strokeStyle=`rgba(191,234,255,${.48+pulse*.4})`;g.lineWidth=6;g.beginPath();g.arc(350,235,94+(pose==='breathe'?pulse*18:0),0,7);g.stroke();}for(let i=0;i<5;i++){let x=80+i*145;g.fillStyle='#fff1a2';g.shadowColor='#fff1a2';g.shadowBlur=16;g.beginPath();g.arc(x,215+(i%2)*40,5,0,7);g.fill();g.shadowBlur=0;}}
    else if(pose==='arc'){drawMood(g,620,185,1,1);g.strokeStyle='#ffe38a';g.lineWidth=5;g.setLineDash([8,9]);g.beginPath();g.arc(620,240,110,Math.PI*1.15,Math.PI*1.9);g.stroke();g.setLineDash([]);}
    if(pose==='catch'){
      // Catch burst and the collected light visibly travelling home in the final picture.
      drawMood(g,catX+72,catY-40,.28,.65);g.strokeStyle='#ffe58a';g.lineWidth=5;g.beginPath();g.arc(catX+65,catY-48,65+pulse*6,0,7);g.stroke();
      for(let i=0;i<14;i++){const a=i*Math.PI*2/14;g.fillStyle=i%2?'#fff2bb':'#ffd96f';g.beginPath();g.arc(catX+65+Math.cos(a)*45,catY-48+Math.sin(a)*45,4,0,7);g.fill();}
      g.strokeStyle='#ffe58a';g.setLineDash([5,8]);g.beginPath();g.moveTo(catX+70,catY-48);g.quadraticCurveTo(400,80,245,140);g.stroke();g.setLineDash([]);g.fillStyle='#fff1a3';g.shadowColor='#ffe58a';g.shadowBlur=22;g.beginPath();g.arc(245,140,12,0,7);g.fill();g.shadowBlur=0;
      g.font='900 31px sans-serif';g.fillStyle='#ffe58a';g.textAlign='center';g.fillText(data.copy.catchClipGlow||'+Glow',244,97);
    }
    // Earlier positions show the direction of travel without turning the card into a moving clip.
    if(['dodge','chase','top','arc','catch'].includes(pose)){drawCat(g,catX-96,pose==='top'||pose==='arc'?300:catY,pose,time,true);drawCat(g,catX-48,pose==='top'||pose==='arc'?270:catY,pose,time,true);}
    drawCat(g,catX,catY,pose,time,false);
    g.fillStyle='rgba(17,14,38,.82)';g.fillRect(16,16,148,34);g.strokeStyle='rgba(255,255,255,.18)';g.strokeRect(16,16,148,34);g.fillStyle='#f8edce';g.font='700 16px sans-serif';g.textAlign='left';g.fillText(type==='C'&&data.variant===1?'CALM · BREATHING':(data.moodName||'MOODLING').toUpperCase(),28,39);
  }
  function motionFrame(now){animation=0;if(!data||!stage.isConnected||stage.closest('[hidden]'))return;const elapsed=(now-startedAt)/1000,story=data.type==='C'&&data.variant===1?'C1':data.type;canvases.forEach((c,i)=>{if(storyboard[story]?.[i]?.motion)drawPicture(c,i,elapsed);});if(!reducedMotion.matches&&canvases.some((_,i)=>storyboard[story]?.[i]?.motion))animation=requestAnimationFrame(motionFrame);}
  function shouldAnimate(){const story=data?.type==='C'&&data.variant===1?'C1':data?.type;return !reducedMotion.matches&&!!story&&storyboard[story]?.some(step=>step.motion);}
  function syncLayout(){const mobile=layout()==='mobile';stage.classList.toggle('is-mobile',mobile);gallery.setAttribute('aria-label',data?.copy.catchClipGalleryLabel||'Three catch guide pictures');updateCurrent(current);}
  function updateCurrent(index){if(!data)return;current=clamp(index,0,2);const mobile=layout()==='mobile';gallery.style.setProperty('--active-card',String(current));gallery.querySelectorAll('.catch-clip-card').forEach((card,i)=>{card.classList.toggle('is-active',i===current);card.setAttribute('aria-current',i===current?'step': 'false');});dots.replaceChildren();for(let i=0;i<3;i++){const b=document.createElement('button');b.type='button';b.className='catch-clip-dot';b.setAttribute('aria-label',`${data.copy.catchClipStep||'Step'} ${i+1}`);b.setAttribute('aria-current',i===current?'step':'false');b.addEventListener('click',()=>updateCurrent(i));dots.appendChild(b);}
    back.disabled=current===0;next.disabled=current===2;back.hidden=!mobile;next.hidden=!mobile;dots.hidden=!mobile;dots.querySelectorAll('button').forEach(b=>{b.hidden=!mobile;});
    caption.textContent=data.steps[current]||data.steps[0]||'';tag.textContent=`${current+1} · ${data.stages[current]||''}`;
  }
  function makeCards(){gallery.replaceChildren();canvases=[];const story=data.type==='C'&&data.variant===1?'C1':data.type,steps=storyboard[story]||storyboard.F;steps.forEach((step,i)=>{
    const card=document.createElement('article');card.className='catch-clip-card';card.setAttribute('aria-label',`${data.copy.catchClipStep||'Step'} ${i+1}: ${data.stages[i]||''}`);
    const head=document.createElement('header');head.className='catch-clip-card-heading';const num=document.createElement('span');num.className='catch-clip-number';num.textContent=String(i+1);const stageName=document.createElement('strong');stageName.className='catch-clip-stage-name';stageName.textContent=data.stages[i]||'';head.append(num,stageName);
    const art=document.createElement('canvas');art.className='catch-clip-picture';art.setAttribute('role','img');art.setAttribute('aria-label',`${data.copy.catchClipStep||'Step'} ${i+1} illustration`);
    const text=document.createElement('p');text.className='catch-clip-card-caption';text.textContent=data.steps[i]||data.steps[0]||'';
    const badge=document.createElement('div');badge.className='catch-clip-card-control';badge.setAttribute('aria-label',data.copy.catchClipControlsLabel||'Control');badge.innerHTML=badgeMarkup(step);
    card.append(head,art,text,badge);gallery.appendChild(card);canvases.push(art);
  });
    if(observer)observer.disconnect();observer='ResizeObserver'in root?new ResizeObserver(()=>canvases.forEach((c,i)=>drawPicture(c,i,0))):null;if(observer)canvases.forEach(c=>observer.observe(c));else addEventListener('resize',()=>canvases.forEach((c,i)=>drawPicture(c,i,0)),{once:true});
    requestAnimationFrame(()=>canvases.forEach((c,i)=>drawPicture(c,i,0)));
  }
  function redraw(){canvases.forEach((c,i)=>drawPicture(c,i,0));}
  function open(options){close();data={...options};current=0;const mood=new Image();data.mood=mood;mood.onload=()=>{if(data?.mood===mood)redraw();};mood.src=data.moodSrc;makeCards();syncLayout();if(animation)cancelAnimationFrame(animation);startedAt=performance.now();if(shouldAnimate())animation=requestAnimationFrame(motionFrame);}
  function close(){if(animation)cancelAnimationFrame(animation);animation=0;if(observer)observer.disconnect();observer=null;data=null;canvases=[];}
  back.addEventListener('click',()=>updateCurrent(current-1));next.addEventListener('click',()=>updateCurrent(current+1));
  addEventListener('resize',()=>{if(data)syncLayout();});
  function syncMotionPreference(){if(animation)cancelAnimationFrame(animation);animation=0;if(reducedMotion.matches)redraw();else if(data&&shouldAnimate()){startedAt=performance.now();animation=requestAnimationFrame(motionFrame);}}
  reducedMotion.addEventListener?.('change',syncMotionPreference);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){if(animation)cancelAnimationFrame(animation);animation=0;}else if(data&&shouldAnimate()){startedAt=performance.now();animation=requestAnimationFrame(motionFrame);}});
  stage.addEventListener('pointerdown',e=>{if(layout()!=='mobile')return;pointerStart={x:e.clientX,y:e.clientY};});
  stage.addEventListener('pointerup',e=>{if(!pointerStart)return;const dx=e.clientX-pointerStart.x,dy=e.clientY-pointerStart.y;pointerStart=null;if(Math.abs(dx)>44&&Math.abs(dx)>Math.abs(dy))updateCurrent(current+(dx<0?1:-1));});
  document.getElementById('catchClipView').addEventListener('keydown',e=>{if(!data)return;if(e.key==='ArrowLeft'){e.preventDefault();updateCurrent(current-1);}else if(e.key==='ArrowRight'){e.preventDefault();updateCurrent(current+1);}});
  root.TCCatchClipPlayer={open,close};
})(window);
