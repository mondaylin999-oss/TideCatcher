(function () {
  'use strict';
  const D=window.TCHeartData, store=D.create(localStorage);
  let bridge, page='workshop', slots=[], selectedPlace='lamps', result=null, message='', hint=null, focusReturn;
  let pendingLights=[];
  const el=document.createElement('section');
  el.id='heartScreen'; el.hidden=true; el.setAttribute('aria-label','Heart Workshop and Lantern Town');
  el.innerHTML=`<header class="heart-header"><button type="button" data-heart="back" aria-label="Back to home">← Home</button><nav aria-label="Heart activities"><button type="button" data-heart="workshop">Heart Workshop</button><button type="button" data-heart="town">Lantern Town</button></nav><span id="heartGlow"></span></header><div id="heartBody"></div><p id="heartNotice" role="status" aria-live="polite"></p>`;
  document.body.append(el);
  const body=el.querySelector('#heartBody'), notice=el.querySelector('#heartNotice');
  const face=id=>{
    const f=D.byId[id], i=D.feelings.indexOf(f);
    if(f.tier===0 && bridge?.portrait) return `<img class="feeling-face" src="${bridge.portrait(id)}" alt="" draggable="false">`;
    if(f.tier>0 && window.TCMoodArt?.has(id)) return window.TCMoodArt.svg(id);
    return `<svg class="feeling-face" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="33" r="25" fill="${f.color}"/><path d="M15 22Q26 8 42 14" fill="none" stroke="#fff" opacity=".3" stroke-width="6" stroke-linecap="round"/><ellipse cx="24" cy="30" rx="3" ry="4" fill="#30234c"/><ellipse cx="41" cy="30" rx="3" ry="4" fill="#30234c"/><path d="${i===0 || i===2 ? 'M25 45Q32 37 40 45' : 'M24 40Q32 50 41 40'}" fill="none" stroke="#30234c" stroke-width="3" stroke-linecap="round"/><circle cx="17" cy="39" r="4" fill="#e27a96" opacity=".45"/><circle cx="47" cy="39" r="4" fill="#e27a96" opacity=".45"/>${f.tier>1?'<path d="m50 3 2 6 6 2-6 2-2 6-2-6-6-2 6-2Z" fill="#ffdf80"/>':''}</svg>`;
  };
  const name=id=>D.byId[id]?.name || id;
  function announce(text) {message=text;notice.textContent=text;}
  function render() {
    const scrolls=['.heart-stock','.heart-catalog','.town-scroll','.town-requirements'].map(selector=>{
      const node=body.querySelector(selector);return {selector,top:node?.scrollTop||0,left:node?.scrollLeft||0};
    });
    const active=document.activeElement;
    const focusKey=['data-feeling','data-detail','data-place','data-heart','data-slot'].find(key=>body.contains(active) && active.hasAttribute(key));
    const focusValue=focusKey?active.getAttribute(focusKey):null;
    const s=store.snapshot();
    el.querySelector('#heartGlow').textContent=`${bridge.glow()} Glow`;
    el.querySelectorAll('nav button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.heart===page)));
    if (page==='workshop') workshop(s); else town(s);
    scrolls.forEach(({selector,top,left})=>{const node=body.querySelector(selector);if(node){node.scrollTop=top;node.scrollLeft=left;}});
    if(focusKey){const next=[...body.querySelectorAll(`[${focusKey}]`)].find(n=>n.getAttribute(focusKey)===focusValue && !n.disabled);(next || body.querySelector('button:not(:disabled)'))?.focus({preventScroll:true});}
    notice.textContent=message;
  }
  function workshop(s) {
    body.innerHTML=`<div class="heart-workshop">
      <section class="heart-shelf"><h2>Your feeling lights</h2><p>Finish nights to bring lights home.</p><div class="heart-stock">${D.feelings.filter(f=>s.discovered.includes(f.id)).map(f=>`<button type="button" draggable="${s.stock[f.id]>0}" data-feeling="${f.id}" aria-label="${f.name}, ${s.stock[f.id]} lights" class="${slots.includes(f.id)?'chosen':''}">${face(f.id)}<span>${f.name}</span><b>×${s.stock[f.id]}</b></button>`).join('') || '<div class="heart-empty">Your shelf is waiting for its first light.<br>Complete a night, then come back to mix.</div>'}</div><button type="button" data-heart="play">Catch more lights →</button></section>
      <section class="heart-mixer"><p class="heart-kicker">A LITTLE ROOM FOR EVERY FEELING</p><h1>What will you discover?</h1><div class="heart-equation">${[0,1].map((i)=>`${i?'<span>+</span>':''}<button type="button" class="heart-slot" data-slot="${i}" aria-label="Ingredient ${i+1}${slots[i]?': '+name(slots[i])+', tap to clear':''}">${slots[i]?face(slots[i])+`<small>${name(slots[i])}</small>`:'<span>＋</span><small>Choose a light</small>'}</button>`).join('')}</div>
      <button type="button" class="heart-primary" data-heart="mix" ${slots.length<2?'disabled':''}>Mix feelings ✦</button><p class="heart-instruction">Tap two lights, or drag them into the bowls.<br>Uses one of each. Unmatched pairs cost nothing.</p>
      <div class="heart-result">${result?`${face(result.id)}<h2>${result.name}</h2><p>${result.line}</p>`:'<span class="heart-spark">✧</span><p>A small spark. A new beginning.</p>'}</div></section>
      <section class="heart-discovery"><h2>Discovered ${s.discovered.length} / ${D.feelings.length}</h2><progress max="50" value="${s.discovered.length}" aria-label="Feelings discovered"></progress><div class="heart-catalog">${D.feelings.map(f=>`<button type="button" data-detail="${f.id}" aria-label="${s.discovered.includes(f.id)?f.name:'Undiscovered '+(f.tier?'layer '+f.tier:'night feeling')}" title="${s.discovered.includes(f.id)?f.name:'Not discovered yet'}">${s.discovered.includes(f.id)?face(f.id):'<span>?</span>'}</button>`).join('')}</div><button type="button" data-heart="hint" ${bridge.glow()<20 || !store.hint()?'disabled':''}>A little hint · 20 Glow</button><p class="heart-hint">${hint || 'Mix the results again. Discover seven deep feelings, then Happiness + Love make Whole Heart.'}</p></section>
    </div>`;
  }
  // Positions are deliberately staggered to give the town its own skyline.
  const pos=[[45,270],[140,220],[245,280],[335,285],[430,245],[530,250],[630,275],[730,235],[850,130],[925,300]];
  function townArt(s,ending=false) {
    const lit=id=>s.lit.includes(id), gold='#ffe399', dark='#393052';
    return `<svg class="town-art" viewBox="0 0 1000 390" preserveAspectRatio="none" role="img" aria-label="${s.lit.length} of 10 places glowing in Lantern Town">
      <defs>
        <linearGradient id="townSky" x2="0" y2="1"><stop stop-color="#101727"/><stop offset=".65" stop-color="#2e304b"/><stop offset="1" stop-color="${s.lit.length===10?'#786079':'#444157'}"/></linearGradient>
        <linearGradient id="townPlaster" x2="1" y2="1"><stop stop-color="#777080"/><stop offset=".55" stop-color="#514b60"/><stop offset="1" stop-color="#36354b"/></linearGradient>
        <linearGradient id="townRoof" x2="0" y2="1"><stop stop-color="#786f86"/><stop offset="1" stop-color="#343445"/></linearGradient>
        <linearGradient id="townWater" x2="0" y2="1"><stop stop-color="#354e63"/><stop offset="1" stop-color="#172635"/></linearGradient>
        <radialGradient id="townLight"><stop stop-color="#ffe5ac" stop-opacity=".35"/><stop offset=".45" stop-color="#ffc875" stop-opacity=".12"/><stop offset="1" stop-color="#ffc875" stop-opacity="0"/></radialGradient>
        <pattern id="townBricks" width="26" height="14" patternUnits="userSpaceOnUse"><path d="M0 0H26M0 7H26M13 0V7M0 7V14M26 7V14" stroke="#d1b9b0" stroke-opacity=".12" fill="none" stroke-width=".7"/></pattern>
        <pattern id="townTiles" width="12" height="7" patternUnits="userSpaceOnUse"><path d="M0 6H12M6 0V6" stroke="#b0a0ad" stroke-opacity=".22" stroke-width=".65"/></pattern>
      </defs><rect width="1000" height="390" fill="url(#townSky)"/>
      ${Array.from({length:47},(_,i)=>`<circle cx="${(i*173+41)%990}" cy="${(i*71+23)%220}" r="${i%3===0?1.6:1}" fill="#e7d2b1" opacity=".5"/>`).join('')}
      <ellipse cx="910" cy="54" rx="95" ry="80" fill="url(#townLight)"/><path d="M899 28a30 30 0 1 0 35 42 30 30 0 0 1-35-42" fill="#fff0d0"/>
      <path d="M0 245Q80 155 180 219T390 190T620 203T820 180T1000 221V390H0" fill="#303649"/>
      <path d="M0 280 80 240 180 265 300 220 400 260 560 195 690 255 850 125 1000 235V390H0" fill="#2c2548"/><path d="M0 330Q200 315 380 335T750 330T1000 335V390H0" fill="#18182e"/>
      ${D.places.map((p,i)=>{
        const [x,y]=pos[i], c=lit(p.id)?gold:dark, glow=lit(p.id)?`<ellipse cx="${x}" cy="${y+10}" rx="85" ry="100" fill="url(#townLight)"/><path d="M${x-15} 315l-25 20h85l-30-20" fill="#f4c988" opacity=".12"/>`:'';
        let art='';
        if(i===0) art=`<path d="M${x} 330V${y-40}" stroke="#716182" stroke-width="5"/><rect x="${x-10}" y="${y-48}" width="20" height="27" rx="7" fill="${c}"/>`;
        else if(i===3) art=`<path d="M${x-38} 330l12-95h52l12 95M${x-15} 235v65m30-65v65" stroke="${c}" stroke-width="4" fill="none"/><path d="M${x-22} 302h44" stroke="${c}" stroke-width="7"/>`;
        else if(i===8) art=`<path d="M${x-6} 280q12-90 0-145m5 55-28-38m29 24 24-33" stroke="#655047" stroke-width="9" fill="none"/>${[[-28,5,26],[24,4,31],[-6,-24,33],[-31,-18,21],[28,-24,23],[0,17,30]].map(([dx,dy,r],j)=>`<circle cx="${x+dx}" cy="${130+dy}" r="${r}" fill="${lit(p.id)?['#506c61','#627b64','#718b70'][j%3]:['#313f42','#3b4b4c','#465754'][j%3]}"/>`).join('')}${[[-20,0],[15,15],[2,-20]].map(([dx,dy])=>`<circle cx="${x+dx}" cy="${130+dy}" r="3" fill="${c}"/>`).join('')}`;
        else if(i===9) art=`<path d="M850 338q70-12 150 0v52H850Z" fill="url(#townWater)"/>${Array.from({length:9},(_,j)=>`<path d="M${865+j%3*24} ${347+j*4}h${40-j*2}" stroke="${lit(p.id)?'#b8a47a':'#6d879a'}" opacity=".25"/>`).join('')}<path d="M865 330q65-50 130 0M865 315q65-50 130 0" stroke="${lit(p.id)?'#bba17a':'#746d68'}" stroke-width="5" fill="none"/>${[0,1,2,3,4,5].map(j=>`<path d="M${865+j*26} ${330-24*Math.sin(j*Math.PI/5)}v-16" stroke="#9b8b76" stroke-width="3"/>`).join('')}`;
        else if(i===5) art=`<path d="M${x-43} 330v-70h86v70M${x-55} 260l55-50 55 50" fill="none" stroke="${lit(p.id)?'#dfb567':'#514364'}" stroke-width="9"/><path d="M${x-32} 270q32 18 64 0" stroke="${c}" fill="none"/>${[-25,0,25].map(dx=>`<rect x="${x+dx-5}" y="280" width="10" height="15" rx="4" fill="${c}"/>`).join('')}`;
        else art=`<rect x="${x-39}" y="${y}" width="78" height="${330-y}" rx="3" fill="#44365f"/><path d="M${x-48} ${y}l48-35 48 35Z" fill="#5b477c"/><rect x="${x-8}" y="304" width="16" height="26" fill="#211a36"/>${[-22,11].map(dx=>`<rect x="${x+dx}" y="${y+12}" width="15" height="20" rx="1" fill="${c}"/>`).join('')}${i===1?[-22,11].map(dx=>`<rect x="${x+dx}" y="${y+43}" width="15" height="20" fill="${c}"/>`).join(''):''}`;
        if(![0,3,5,8,9].includes(i)) {
          art=art.replace('fill="#44365f"','fill="url(#townPlaster)"').replace('fill="#5b477c"','fill="url(#townRoof)"');
          art+=`<rect x="${x-39}" y="${y}" width="78" height="${330-y}" fill="url(#townBricks)"/><path d="M${x+39} ${y}l10 7v${323-y}h-10Z" fill="#282939"/><path d="M${x-48} ${y}l48-35 48 35Z" fill="url(#townTiles)"/><path d="M${x-48} ${y}h96" stroke="#a599a2" stroke-width="2"/><rect x="${x+20}" y="${y-31}" width="8" height="18" fill="#625960"/><path d="M${x-12} 330h24" stroke="#8c8490" stroke-width="4"/>${[-22,11].map(dx=>`<path d="M${x+dx+7.5} ${y+12}v20m-7.5-10h15" stroke="#79644f" stroke-width="1.5"/><path d="M${x+dx-2} ${y+33}h19" stroke="#b1a18b" stroke-width="2"/>`).join('')}`;
          if(i===2)art+=`<rect x="${x-27}" y="${y+10}" width="54" height="30" rx="2" fill="#54483e" stroke="#a48c6f"/>${[-19,-4,11].map(dx=>`<rect x="${x+dx}" y="${y+14}" width="11" height="20" fill="${lit(p.id)?'#d8be88':'#81716a'}"/>`).join('')}`;
          if(i===6)art+=`<rect x="${x-27}" y="${y+10}" width="54" height="28" fill="${lit(p.id)?'#e5d6a9':'#797484'}"/>${['#c48887','#c9b277','#8bad9b','#8c93b2'].map((color,j)=>`<circle cx="${x-17+j*11}" cy="${y+24}" r="4" fill="${color}"/>`).join('')}`;
        }
        return `<ellipse cx="${x+8}" cy="332" rx="45" ry="6" fill="#0a1121" opacity=".45"/>`+glow+art;
      }).join('')}
      ${s.lit.length===10?Array.from({length:16},(_,i)=>`<g class="town-lantern" style="--delay:${i*.3}s"><rect x="${30+i*62}" y="${40+(i*43)%160}" width="9" height="13" rx="4" fill="#ffd37e"/></g>`).join(''):''}
      ${ending?'<g transform="translate(455 300)"><rect x="0" y="-6" width="52" height="36" rx="3" fill="#fff0c5"/><path d="m5 20 12-15 13 12 15-8" fill="none" stroke="#b183a9" stroke-width="3"/><circle cx="-20" cy="-20" r="13" fill="#d8ab90"/><path d="M-34-23q3-24 28-6v15" fill="#322035"/><path d="M-21-7v40m0-30L5 10" stroke="#cba0dc" stroke-width="11" stroke-linecap="round"/><ellipse cx="78" cy="24" rx="18" ry="10" fill="#dfab60"/><path d="m87 18-2-15 9 6 9-6-2 17" fill="#dfab60"/><path d="M86 20h14" stroke="#ffde73" stroke-width="4"/></g>':''}
    </svg>`;
  }
  function town(s) {
    const p=D.places.find(p=>p.id===selectedPlace), lit=s.lit.includes(p.id);
    body.innerHTML=`<div class="heart-town"><section class="town-view"><div class="town-heading"><h1>Lantern Town</h1><span>${s.lit.length} / 10 places lit</span></div><div class="town-scroll"><div class="town-panorama">${townArt(s)}${D.places.map((p,i)=>`<button type="button" data-place="${p.id}" class="town-place ${s.lit.includes(p.id)?'lit':''} ${selectedPlace===p.id?'selected':''}" style="left:${pos[i][0]/10}%;top:${i===8?49:89}%" aria-pressed="${selectedPlace===p.id}">${s.lit.includes(p.id)?'✓':'◇'} ${p.name}</button>`).join('')}</div></div><p class="town-caption">Tap a place to see what it needs. Swipe the town to explore.</p></section>
      <aside class="town-requirements"><p class="heart-kicker">${lit?'A MEMORY, KEPT WARM':'ONE SMALL LIGHT AT A TIME'}</p><h2>${p.name}</h2><p>${p.memory}</p><ul>${Object.entries(p.needs).map(([id,n])=>`<li>${face(id)}<span>${name(id)} ×${n}<small>${lit?'Brought home':!s.discovered.includes(id)?'Discover in the Workshop':`${s.stock[id]} in your shelf`}</small></span><b>${lit || s.stock[id]>=n?'✓':'·'}</b></li>`).join('')}</ul><button type="button" class="heart-primary" data-heart="light" ${lit||!store.can(p.needs)?'disabled':''}>${lit?'Already glowing':'Light it ✦'}</button><p class="heart-reward">${lit?'Reward received':'Reward'}: 30 Glow + ${bridge.rewardName(p.reward)}</p><button type="button" data-heart="workshop">Mix the feelings I need →</button><button type="button" data-heart="ending" ${store.ready()?'':'disabled'}>${s.ending?'Watch the true ending again':'Let the sky lanterns rise'}</button><small>Light all 10 places and discover Whole Heart.</small></aside></div>`;
  }
  function close() {el.hidden=true;bridge.home();focusReturn?.focus({preventScroll:true});}
  function pick(id,index) {
    index=Math.min(index,slots.length);
    const s=store.snapshot(), used=slots.filter((x,i)=>x===id && i!==index).length;
    if (s.stock[id]<=used) {announce('No spare light of that feeling. Finish another night to collect more.');return;}
    slots[index]=id; slots=slots.filter(Boolean);render();
  }
  el.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b || b.disabled)return;
    if(b.dataset.feeling) {if(slots.length===2)slots=[];pick(b.dataset.feeling,slots.length);return;}
    if(b.dataset.slot!==undefined) {slots.splice(+b.dataset.slot,1);render();return;}
    if(b.dataset.detail) {
      const f=D.byId[b.dataset.detail], known=store.snapshot().discovered.includes(f.id);
      if(known){result=f;announce(f.ingredients?`${f.name}: ${f.ingredients.map(name).join(' + ')}. ${f.line}`:`${f.name}: catch this light during the nights.`);render();}
      else announce(f.tier?`An undiscovered layer ${f.tier} feeling. Try mixing the feelings you know.`:'A night feeling. Keep exploring the chapters.');
      return;
    }
    if(b.dataset.place) {selectedPlace=b.dataset.place;render();return;}
    const action=b.dataset.heart;
    if(action==='back')close();
    else if(action==='workshop'||action==='town'){page=action;message='';render();}
    else if(action==='play'){close();bridge.play();}
    else if(action==='mix') {
      const out=store.mix(...slots);
      if(out.error)announce(out.error);
      else {result=out.recipe;slots=[];hint=null;bridge.chime();announce(`${out.fresh?'New feeling!':'Made another light:'} ${result.name}. Saved to your shelf.`);render();}
    } else if(action==='hint') {
      if(hint){announce(hint+' Your current hint is still here; no more Glow spent.');return;}
      const f=store.hint();if(!f)return;
      if(!bridge.spend(20)){announce('You need 20 Glow for a hint.');return;}
      hint=`Try ${name(f.ingredients[0])} with a feeling that says: “${D.byId[f.ingredients[1]].line}”`;
      announce(hint);render();
    } else if(action==='light') {
      if(store.light(selectedPlace)){bridge.rewards(store.snapshot().lit);bridge.chime();announce(D.places.find(p=>p.id===selectedPlace).memory);render();}
      else announce('Could not light this place. Check your lights and browser storage.');
    } else if(action==='ending') {
      if(!store.end())return;
      bridge.collar();bridge.chime();
      body.innerHTML=`<section class="heart-ending"><h1>Every feeling belongs.</h1>${townArt(store.snapshot(),true)}<p>Thiri opens her sketchbook. She draws the town, Hnin, and Shwe with a golden collar.<br>“I do not have to feel happy all the time to have a whole heart.”</p><button type="button" class="heart-primary" data-heart="town">Our glowing town →</button></section>`;
      announce('Whole Heart · true ending unlocked. Golden collar awarded to Shwe.');
    }
  });
  el.addEventListener('dragstart',e=>{const b=e.target.closest('[data-feeling]');if(b)e.dataTransfer.setData('text/plain',b.dataset.feeling);});
  el.addEventListener('dragover',e=>{if(e.target.closest('[data-slot]'))e.preventDefault();});
  el.addEventListener('drop',e=>{const b=e.target.closest('[data-slot]');if(!b)return;e.preventDefault();const id=e.dataTransfer.getData('text/plain');if(D.byId[id])pick(id,+b.dataset.slot);});
  el.addEventListener('keydown',e=>{
    e.stopPropagation();
    if(e.key==='Escape'){e.preventDefault();close();}
    if(e.key==='Tab') {
      const buttons=[...el.querySelectorAll('button:not(:disabled)')].filter(b=>b.getClientRects().length);
      if(e.shiftKey && document.activeElement===buttons[0]){e.preventDefault();buttons.at(-1)?.focus();}
      else if(!e.shiftKey && document.activeElement===buttons.at(-1)){e.preventDefault();buttons[0]?.focus();}
    }
  });
  window.TCHeart={
    bind(api){bridge=api;bridge.rewards(store.snapshot().lit);if(store.snapshot().ending)bridge.collar();
      const links=document.createElement('div');links.className='heart-home-links';
      links.innerHTML='<button type="button" id="heartWorkshopBtn">✦ Heart Workshop</button><button type="button" id="lanternTownBtn">♧ Lantern Town</button>';
      document.querySelector('.hub-content-heading').append(links);
      links.children[0].onclick=()=>this.open('workshop');links.children[1].onclick=()=>this.open('town');
    },
    open(which='workshop'){focusReturn=document.activeElement;page=which;slots=[];message=this.bank([])?'':'Your latest lights could not be saved. Keep this page open, free browser storage, then return here to retry.';bridge.enter();el.hidden=false;render();el.querySelector('[data-heart="back"]').focus();},
    bank(ids){pendingLights.push(...ids);if(!pendingLights.length)return true;if(!store.bank(pendingLights))return false;pendingLights=[];return true;},
    isOpen:()=>!el.hidden
  };
})();
