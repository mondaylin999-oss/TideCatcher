/* After the story: Heart Workshop (mix feelings) and Lantern Town (light Thiri’s hometown).
   Every Moodling Shwe brings home becomes one "light" of that feeling (game.js sends tc:light).
   Heart Workshop: mix two lights to discover a new feeling; a mix uses one of each and makes one of the new feeling.
   Lantern Town: spend lights and mixed feelings to light ten places; each place plays a small memory.
   Levels 8–50 on the story map are the Endless Nights, where more lights are caught.
   Both places are open from the start. Saved in localStorage. */
(function () {
  'use strict';
  const $ = s => document.querySelector(s);
  const B = () => window.TCBridge || null;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // ---------- feelings ----------
  const BASIC = {
    F: { n: 'Frustrated', c: '#ff6168' }, N: { n: 'Nervous', c: '#b9a2ff' }, L: { n: 'Lonely', c: '#6fb6ff' },
    S: { n: 'Shy', c: '#ff9ccb' }, E: { n: 'Excited', c: '#ffe066' }, J: { n: 'Jealous', c: '#ffb36b' },
    B: { n: 'Buried', c: '#a67646' }, C: { n: 'Calm', c: '#4fdb92' }, G: { n: 'Golden', c: '#ffd84d' }
  };
  // [id, name, a, b, line] — a and b are what you mix; layers build on each other
  const MIXES = [
    ['anticipation', 'Anticipation', 'N', 'E', 'Butterflies before something big. “My heart is racing… in a good way?”'],
    ['peaceful', 'Peaceful', 'L', 'C', 'Being alone can feel quiet and soft, not empty.'],
    ['determined', 'Determined', 'F', 'C', 'Take a breath, then try again.'],
    ['brave', 'Brave', 'S', 'E', 'Scared and doing it anyway.'],
    ['admiration', 'Admiration', 'J', 'C', 'Someone else is good at this, and that is wonderful.'],
    ['relief', 'Relief', 'N', 'C', 'The scary part is over. Phew.'],
    ['embarrassed', 'Embarrassed', 'S', 'N', 'Cheeks hot, everyone looking. It passes.'],
    ['grumpy', 'Grumpy', 'F', 'J', 'Everything is annoying today. That is allowed.'],
    ['nostalgia', 'Nostalgia', 'L', 'E', 'Missing a happy day from before.'],
    ['hopeful', 'Hopeful', 'B', 'G', 'Something good might grow from this.'],
    ['homesick', 'Homesick', 'L', 'B', 'Wanting to be home, where it is safe.'],
    ['curious', 'Curious', 'E', 'B', 'What is under there? Let’s find out!'],
    ['sulky', 'Sulky', 'F', 'L', 'Arms crossed, wishing someone would notice.'],
    ['proud', 'Proud', 'J', 'G', 'I did that myself.'],
    ['restless', 'Restless', 'F', 'N', 'Can’t sit still, can’t settle down.'],
    ['cheerful', 'Cheerful', 'E', 'G', 'Humming a little song for no reason.'],
    ['gentle', 'Gentle', 'S', 'C', 'Soft hands, soft voice.'],
    ['worried', 'Worried', 'N', 'B', 'A small fear, hiding under everything.'],
    ['confident', 'Confident', 'brave', 'determined', 'I can do hard things.'],
    ['grateful', 'Grateful', 'peaceful', 'admiration', 'Thank you for being here.'],
    ['joy', 'Joy', 'relief', 'E', 'A big laugh that fills the whole room.'],
    ['friendship', 'Friendship', 'L', 'brave', 'Saying hello first.'],
    ['kindness', 'Kindness', 'C', 'embarrassed', 'Being soft with someone who feels silly.'],
    ['courage', 'Courage', 'anticipation', 'brave', 'Stepping forward even with shaky knees.'],
    ['forgiving', 'Forgiving', 'grumpy', 'peaceful', 'Letting the angry part go.'],
    ['comfort', 'Comfort', 'homesick', 'gentle', 'A warm blanket and someone who stays.'],
    ['patience', 'Patience', 'restless', 'C', 'Waiting, without needing it to be now.'],
    ['happiness', 'Happiness', 'joy', 'grateful', 'The warm, full feeling of a good day.'],
    ['love', 'Love', 'friendship', 'kindness', 'Caring for someone just as they are.'],
    ['pride', 'Pride', 'confident', 'hopeful', 'Look how far I came.'],
    ['wonder', 'Wonder', 'courage', 'nostalgia', 'The world is bigger and brighter than I knew.'],
    ['belonging', 'Belonging', 'friendship', 'comfort', 'There is a place for me here.'],
    ['wholeheart', 'Whole Heart', 'happiness', 'love', 'Every feeling, all together. Thiri can feel everything again.']
  ];
  const MIX = Object.fromEntries(MIXES.map(([id, n, a, b, line]) => [id, { id, n, a, b, line }]));
  const pairKey = (a, b) => [a, b].sort().join('+');
  const RECIPE = Object.fromEntries(MIXES.map(([id, , a, b]) => [pairKey(a, b), id]));
  const nameOf = id => (BASIC[id] || MIX[id] || { n: id }).n;
  function colours(id, depth = 0) {
    if (BASIC[id]) return [BASIC[id].c, BASIC[id].c];
    const m = MIX[id]; if (!m || depth > 6) return ['#ccc', '#ccc'];
    return [colours(m.a, depth + 1)[0], colours(m.b, depth + 1)[1]];
  }

  // ---------- places in Lantern Town ----------
  const PLACES = [
    { id: 'lamps', n: 'Street lamps', need: { F: 3 }, memory: 'The walk home from school doesn’t feel so dark any more.' },
    { id: 'school', n: 'School', need: { N: 2, determined: 1 }, memory: 'Thiri walks back into school with her head up.' },
    { id: 'wall', n: 'Winners’ Wall', need: { J: 2, admiration: 1 }, memory: 'She claps for the winner, and she means it.' },
    { id: 'swings', n: 'Park swings', need: { L: 2, brave: 1 }, memory: 'She asks a new girl if she wants to swing.' },
    { id: 'gate', n: 'Festival gate', need: { E: 3, anticipation: 1 }, memory: 'Lanterns, music, and a festival she loved.' },
    { id: 'tree', n: 'Hilltop tree', need: { B: 2, hopeful: 1 }, memory: 'She finds the old drawing she buried there, and keeps it.' },
    { id: 'bridge', n: 'Lake bridge', need: { C: 2, peaceful: 1 }, memory: 'Quiet water, a quiet heart.' },
    { id: 'art', n: 'Art club', need: { confident: 1, grateful: 1 }, memory: 'She signs up for the art club again.' },
    { id: 'hnin', n: 'Hnin’s house', need: { S: 2, friendship: 1 }, memory: 'Thiri finally shows Hnin her drawing.' },
    { id: 'home', n: 'Thiri’s home', need: { wholeheart: 1 }, memory: 'Thiri draws her whole town, every window glowing.' }
  ];
  const PLACE_GLOW = 30, TOWN_GLOW = 200;

  // ---------- saved state ----------
  const load = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k) || 'null'); return v && typeof v === 'object' ? v : d; } catch (e) { return d; } };
  const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  let lights = load('mk-lights', null);          // { F: 12, anticipation: 1, ... }
  let found = load('mk-mixes', {});              // { anticipation: true }
  let lit = load('mk-town', {});                 // { lamps: true }
  let hints = load('mk-mix-hints', {});
  function seedLights() {
    if (lights) return;
    lights = {};
    // players who already caught Moodlings start with those lights
    try { const book = (B() && B().book()) || JSON.parse(localStorage.getItem('mk-book') || '{}'); for (const k in book) { const t = k[0]; if (BASIC[t]) lights[t] = (lights[t] || 0) + (+book[k] || 0); } } catch (e) {}
    save('mk-lights', lights);
  }
  const have = id => Math.max(0, Math.floor(lights[id] || 0));
  addEventListener('tc:light', e => { seedLights(); const t = e.detail && e.detail.type; if (!BASIC[t]) return; lights[t] = have(t) + 1; save('mk-lights', lights); });

  // both places are open from the very start (they used to wait for the 5 AM ending)
  const open = () => true;

  // ---------- small drawing helpers ----------
  function face(id, size = 56) {
    if (BASIC[id]) {
      const src = B() ? B().portrait(id) : '';
      return src ? `<img class="as-face" src="${src}" alt="" width="${size}" height="${size}" style="width:${size}px;height:${size}px">` : `<span class="as-blob" style="width:${size}px;height:${size}px;background:${BASIC[id].c}"></span>`;
    }
    const [a, b] = colours(id);
    return `<span class="as-blob" style="width:${size}px;height:${size}px;background:linear-gradient(135deg,${a},${b})"><svg viewBox="0 0 56 40" aria-hidden="true"><ellipse cx="18" cy="15" rx="4.5" ry="6" fill="#2b2547"/><ellipse cx="38" cy="15" rx="4.5" ry="6" fill="#2b2547"/><circle cx="19.5" cy="12.5" r="1.6" fill="#fff"/><circle cx="39.5" cy="12.5" r="1.6" fill="#fff"/><path d="M19 26 Q28 34 37 26" fill="none" stroke="#2b2547" stroke-width="3" stroke-linecap="round"/><ellipse cx="10" cy="24" rx="4" ry="2.4" fill="#ff9ccb" opacity=".8"/><ellipse cx="46" cy="24" rx="4" ry="2.4" fill="#ff9ccb" opacity=".8"/></svg></span>`;
  }
  function toast(el, text, kind = '') { el.textContent = text; el.className = 'as-note ' + kind; }

  // ---------- screens ----------
  function makeScreen(id, title) {
    let el = document.getElementById(id);
    if (el) return el;
    el = document.createElement('div');
    el.className = 'overlay as-screen'; el.id = id; el.hidden = true;
    el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', title);
    el.innerHTML = `<button class="btn ghost as-back" type="button" aria-label="Back to Thiri’s room">← Thiri’s room</button><section class="panel as-panel"></section>`;
    document.body.appendChild(el);
    el.querySelector('.as-back').addEventListener('click', () => close(el));
    el.addEventListener('keydown', e => { if (e.key === 'Escape') { e.stopPropagation(); close(el); } });
    return el;
  }
  let lastFocus = null;
  function show(el) { lastFocus = document.activeElement; el.hidden = false; B() && B().sfx('ui', 'open'); setTimeout(() => el.querySelector('.as-back').focus(), 30); }
  function close(el) { el.hidden = true; refreshHub(); if (lastFocus && lastFocus.focus) lastFocus.focus(); }

  // ----- Heart Workshop -----
  const ws = { a: null, b: null, msg: 'Pick two feelings to mix.', kind: '', result: null };
  function renderWorkshop() {
    seedLights();
    const el = makeScreen('workshopScreen', 'Heart Workshop'), panel = el.querySelector('.as-panel');
    const total = MIXES.length, got = MIXES.filter(m => found[m[0]]).length;
    const jarIds = [...Object.keys(BASIC), ...MIXES.filter(m => found[m[0]]).map(m => m[0])];
    const jars = jarIds.map(id => {
      const n = have(id), sel = ws.a === id || ws.b === id;
      return `<button type="button" class="as-jar${sel ? ' on' : ''}${n ? '' : ' empty'}" data-pick="${id}" aria-pressed="${sel}" aria-label="${esc(nameOf(id))}, ${n} light${n === 1 ? '' : 's'}"${n ? '' : ' disabled'}>${face(id, 44)}<b>${esc(nameOf(id))}</b><i>×${n}</i></button>`;
    }).join('');
    const slot = id => id ? `<span class="as-slot full">${face(id, 64)}<b>${esc(nameOf(id))}</b></span>` : '<span class="as-slot">?</span>';
    const r = ws.result && MIX[ws.result];
    const grid = MIXES.map(([id, n]) => found[id] ? `<span class="as-found" title="${esc(n)}">${face(id, 34)}<em>${esc(n)}</em></span>` : `<span class="as-found unknown" aria-label="not found yet">?</span>`).join('');
    const hintable = MIXES.find(m => !found[m[0]] && (BASIC[m[2]] || found[m[2]]) && (BASIC[m[3]] || found[m[3]]) && !hints[m[0]]);
    const hintLines = Object.keys(hints).filter(id => !found[id]).map(id => `<li>${esc(nameOf(MIX[id].a))} + something…</li>`).join('');
    panel.innerHTML = `
      <p class="eyebrow">After sunrise</p><h2>Heart Workshop</h2>
      <p class="muted">Mix two feelings to discover a new one. A mix uses one light of each and gives you one of the new feeling. Discoveries are kept forever.</p>
      <div class="as-workshop">
        <div class="as-col"><h3>Your feeling lights</h3><div class="as-jars">${jars}</div><p class="muted as-small">Out of a feeling? Catch more in the Endless Nights (levels 8 and up on the story map).</p></div>
        <div class="as-col">
          <div class="as-pot" aria-live="polite">${slot(ws.a)}<span class="as-op">+</span>${slot(ws.b)}<span class="as-op">=</span>
            <span class="as-slot result${r ? ' full' : ''}">${r ? face(r.id, 72) + `<b>${esc(r.n)}</b>` : '✦'}</span></div>
          <div class="as-row"><button type="button" class="btn" data-mix ${ws.a && ws.b ? '' : 'disabled'}>Mix them</button><button type="button" class="btn ghost" data-clear>Empty the pot</button></div>
          <p class="${'as-note ' + ws.kind}" role="status">${esc(ws.msg)}</p>
          <h3>Discovered ${got} / ${total}</h3><div class="as-grid">${grid}</div>
          <div class="as-row"><button type="button" class="btn ghost" data-hint ${hintable ? '' : 'disabled'}>Buy a hint · 20 Glow</button></div>
          ${hintLines ? `<ul class="as-hints">${hintLines}</ul>` : ''}
        </div>
      </div>`;
    panel.querySelectorAll('[data-pick]').forEach(b => b.addEventListener('click', () => {
      const id = b.dataset.pick;
      if (ws.a === id && !ws.b && have(id) < 2) { ws.a = null; }
      else if (!ws.a) ws.a = id; else if (!ws.b) ws.b = id; else { ws.a = ws.b; ws.b = id; }
      ws.result = null; ws.msg = ws.a && ws.b ? 'Ready. Press “Mix them”.' : 'Pick one more feeling.'; ws.kind = '';
      B() && B().sfx('ui', 'toggle'); renderWorkshop();
      const again = $(`#workshopScreen [data-pick="${id}"]`); again && again.focus();
    }));
    panel.querySelector('[data-clear]').addEventListener('click', () => { ws.a = ws.b = ws.result = null; ws.msg = 'Pick two feelings to mix.'; ws.kind = ''; renderWorkshop(); });
    panel.querySelector('[data-mix]').addEventListener('click', doMix);
    panel.querySelector('[data-hint]').addEventListener('click', () => {
      if (!hintable || !B() || B().glow() < 20) { ws.msg = 'You need 20 Glow for a hint.'; ws.kind = 'bad'; renderWorkshop(); return; }
      B().addGlow(-20); hints[hintable[0]] = true; save('mk-mix-hints', hints);
      ws.msg = `Hint: try ${nameOf(hintable[2])} + something…`; ws.kind = 'good'; renderWorkshop();
    });
  }
  function doMix() {
    const a = ws.a, b = ws.b; if (!a || !b) return;
    if (a === b && have(a) < 2) { ws.msg = `You need two ${nameOf(a)} lights to mix it with itself.`; ws.kind = 'bad'; renderWorkshop(); return; }
    const id = RECIPE[pairKey(a, b)];
    if (!id) { ws.msg = 'These two need a little more time together. (No lights used.)'; ws.kind = 'bad'; ws.result = null; B() && B().sfx('ui', 'back'); renderWorkshop(); return; }
    if (have(a) < 1 || have(b) < 1) { ws.msg = 'Not enough lights for that mix.'; ws.kind = 'bad'; renderWorkshop(); return; }
    lights[a] = have(a) - 1; lights[b] = have(b) - 1; lights[id] = have(id) + 1; save('mk-lights', lights);
    const isNew = !found[id]; found[id] = true; save('mk-mixes', found);
    if (isNew && B()) B().addGlow(10);
    ws.result = id; ws.msg = isNew ? `New feeling: ${MIX[id].n}! ${MIX[id].line} (+10 Glow)` : `You made another ${MIX[id].n}. ${MIX[id].line}`; ws.kind = 'good';
    if (have(a) < 1) ws.a = null; if (have(b) < 1 || ws.a === null) ws.b = null;
    B() && B().sfx('ui', isNew ? 'reward' : 'sparkle');
    renderWorkshop();
  }

  // ----- Lantern Town -----
  let townPick = 'lamps', townMsg = '', townKind = '';
  function needRows(p) {
    return Object.entries(p.need).map(([id, n]) => {
      const h = have(id), known = BASIC[id] || found[id], ok = h >= n;
      return `<li class="${ok ? 'ok' : 'no'}">${known ? face(id, 30) : '<span class="as-blob q">?</span>'}<span>${esc(known ? nameOf(id) : 'A feeling not discovered yet')} ×${n}</span><b>${ok ? `✓ you have ${h}` : known ? `you have ${h}` : 'mix it in the Workshop'}</b></li>`;
    }).join('');
  }
  function canLight(p) { return Object.entries(p.need).every(([id, n]) => have(id) >= n); }
  function townSVG() {
    const L = id => !!lit[id];
    const win = (on) => on ? '#ffd66b' : 'rgba(255,255,255,.08)';
    const st = (on) => on ? 'stroke="#2b2040" stroke-width="3"' : 'stroke="#9a95b8" stroke-width="2.6" stroke-dasharray="6 5"';
    const glow = (x, y, r, on) => on ? `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#asGlow)"/>` : '';
    const g = (id, inner) => `<g class="as-place${townPick === id ? ' picked' : ''}" data-place="${id}" tabindex="0" role="button" aria-label="${esc(PLACES.find(p => p.id === id).n)}${L(id) ? ', lit' : ', dark'}">${inner}</g>`;
    const all = PLACES.every(p => lit[p.id]);
    const lanterns = all ? Array.from({ length: 16 }, (_, i) => `<g class="as-lantern" style="animation-delay:${(i * .37) % 4}s"><rect x="${40 + i * 70}" y="${60 + (i * 53) % 160}" width="12" height="16" rx="3" fill="#ffb36b"/><circle cx="${46 + i * 70}" cy="${68 + (i * 53) % 160}" r="16" fill="url(#asGlow)"/></g>`).join('') : '';
    return `<svg class="as-town" viewBox="0 0 1140 470" role="group" aria-label="Lantern Town">
      <defs><radialGradient id="asGlow"><stop offset="0" stop-color="#ffd66b" stop-opacity=".75"/><stop offset="1" stop-color="#ffd66b" stop-opacity="0"/></radialGradient>
      <linearGradient id="asSky" x2="0" y2="1"><stop stop-color="${all ? '#3a2d6e' : '#211b45'}"/><stop offset="1" stop-color="${all ? '#8a5a8e' : '#3f3270'}"/></linearGradient></defs>
      <rect width="1140" height="470" fill="url(#asSky)"/>
      <g fill="#fff6d6" opacity=".8"><circle cx="90" cy="50" r="2"/><circle cx="260" cy="34" r="1.6"/><circle cx="420" cy="70" r="2"/><circle cx="610" cy="30" r="1.6"/><circle cx="760" cy="62" r="2"/><circle cx="880" cy="26" r="1.6"/></g>
      <path d="M1046 46 A34 34 0 1 0 1076 100 A26 26 0 1 1 1046 46 Z" fill="#fff3c4"/>
      ${lanterns}
      <path d="M820 400 Q960 240 1140 300 L1140 470 L820 470 Z" fill="#33295a"/>
      <path d="M0 400 Q300 385 570 396 Q840 406 1140 392 L1140 470 L0 470 Z" fill="#241d40"/>
      ${g('lamps', `${glow(30, 330, 50, L('lamps'))}${glow(560, 330, 50, L('lamps'))}<path d="M30 398 L30 322 M560 396 L560 322" ${st(L('lamps'))}/><rect x="22" y="308" width="16" height="16" rx="3" fill="${win(L('lamps'))}" ${st(L('lamps'))}/><rect x="552" y="308" width="16" height="16" rx="3" fill="${win(L('lamps'))}" ${st(L('lamps'))}/>`)}
      ${g('school', `${glow(160, 330, 110, L('school'))}<path d="M70 270 L160 222 L250 270 Z" fill="${L('school') ? '#9a82e8' : 'none'}" ${st(L('school'))}/><rect x="80" y="270" width="160" height="126" fill="${L('school') ? '#6a58b8' : 'rgba(255,255,255,.04)'}" ${st(L('school'))}/>${[96, 132, 168, 204].map(x => `<rect x="${x}" y="286" width="24" height="22" fill="${win(L('school'))}" ${st(L('school'))}/>`).join('')}<rect x="148" y="344" width="26" height="52" fill="${L('school') ? '#2b2040' : 'none'}" ${st(L('school'))}/>`)}
      ${g('wall', `${glow(292, 350, 70, L('wall'))}<rect x="258" y="300" width="70" height="96" fill="${L('wall') ? '#6a58b8' : 'rgba(255,255,255,.04)'}" ${st(L('wall'))}/>${[266, 286, 306].map(x => `<rect x="${x}" y="310" width="16" height="22" fill="${L('wall') ? '#f59b57' : 'none'}" ${st(L('wall'))}/>`).join('')}`)}
      ${g('swings', `${glow(386, 350, 70, L('swings'))}<path d="M346 396 L362 310 L410 310 L426 396" fill="none" ${L('swings') ? 'stroke="#b9a2ff" stroke-width="4"' : st(false)}/><path d="M374 310 L374 370 M398 310 L398 370" stroke="${L('swings') ? '#f6eedc' : '#9a95b8'}" stroke-width="2"/><rect x="368" y="368" width="36" height="7" rx="2" fill="${win(L('swings'))}" ${st(L('swings'))}/>`)}
      ${g('hnin', `${glow(490, 340, 70, L('hnin'))}<path d="M440 290 L490 250 L540 290 Z" fill="${L('hnin') ? '#9a82e8' : 'none'}" ${st(L('hnin'))}/><rect x="450" y="290" width="80" height="106" fill="${L('hnin') ? '#6a58b8' : 'rgba(255,255,255,.04)'}" ${st(L('hnin'))}/><rect x="462" y="306" width="20" height="20" fill="${win(L('hnin'))}" ${st(L('hnin'))}/><rect x="498" y="306" width="20" height="20" fill="${win(L('hnin'))}" ${st(L('hnin'))}/>${L('hnin') ? '<path d="M490 270 c-6 -8 -16 0 0 10 c16 -10 6 -18 0 -10z" fill="#ff8fb8"/>' : ''}`)}
      ${g('gate', `${glow(650, 340, 90, L('gate'))}<path d="M600 290 L650 260 L700 290 Z" fill="${L('gate') ? '#f2b53a' : 'none'}" ${st(L('gate'))}/><path d="M590 302 L710 302 M612 302 L612 396 M688 302 L688 396" fill="none" ${L('gate') ? 'stroke="#f2b53a" stroke-width="8"' : st(false)}/>${L('gate') ? [620, 640, 660, 680].map(x => `<circle cx="${x}" cy="312" r="5" fill="#ffd66b"/>`).join('') : ''}`)}
      ${g('art', `${glow(778, 350, 70, L('art'))}<rect x="730" y="314" width="96" height="82" fill="${L('art') ? '#6a58b8' : 'rgba(255,255,255,.04)'}" ${st(L('art'))}/><rect x="744" y="328" width="68" height="30" fill="${L('art') ? '#fff6d6' : 'none'}" ${st(L('art'))}/>${L('art') ? ['#ff6168', '#ffe066', '#4fdb92', '#6fb6ff', '#ff9ccb'].map((c, i) => `<circle cx="${756 + i * 11}" cy="343" r="4" fill="${c}"/>`).join('') : ''}`)}
      ${g('home', `${glow(892, 330, 90, L('home'))}<path d="M842 280 L892 234 L942 280 Z" fill="${L('home') ? '#b9a2ff' : 'none'}" ${st(L('home'))}/><rect x="852" y="280" width="80" height="116" fill="${L('home') ? '#8a76d6' : 'rgba(255,255,255,.04)'}" ${st(L('home'))}/><rect x="866" y="294" width="52" height="34" fill="${win(L('home'))}" ${st(L('home'))}/>`)}
      ${g('tree', `${glow(1000, 200, 70, L('tree'))}<path d="M1000 300 L1000 240" stroke="${L('tree') ? '#7a5030' : '#9a95b8'}" stroke-width="6" stroke-linecap="round"/><circle cx="1000" cy="206" r="40" fill="${L('tree') ? '#4fdb92' : 'none'}" ${st(L('tree'))}/>${L('tree') ? [[984, 196], [1012, 190], [996, 222], [1018, 214]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.5" fill="#fff3a8"/>`).join('') : ''}`)}
      ${g('bridge', `${glow(1045, 420, 80, L('bridge'))}<path d="M960 432 Q1050 352 1130 432" fill="none" ${L('bridge') ? 'stroke="#d9a35a" stroke-width="7"' : st(false)}/>${L('bridge') ? [985, 1015, 1045, 1075, 1105].map((x, i) => `<circle cx="${x}" cy="${404 - Math.sin((i + .5) / 5 * Math.PI) * 30}" r="4" fill="#ffd66b"/>`).join('') : ''}`)}
    </svg>`;
  }
  function renderTown() {
    seedLights();
    const el = makeScreen('townScreen', 'Lantern Town'), panel = el.querySelector('.as-panel');
    const p = PLACES.find(x => x.id === townPick) || PLACES[0], count = PLACES.filter(x => lit[x.id]).length, all = count === PLACES.length;
    const chips = PLACES.map(x => `<button type="button" class="as-chip${lit[x.id] ? ' lit' : ''}${x.id === townPick ? ' on' : ''}" data-place="${x.id}" aria-pressed="${x.id === townPick}">${lit[x.id] ? '✓ ' : ''}${esc(x.n)}</button>`).join('');
    panel.innerHTML = `
      <p class="eyebrow">After sunrise</p><h2>Lantern Town</h2>
      <p class="muted">Thiri’s hometown at night. Light each place with the feelings you caught and mixed.</p>
      <p class="as-count">${count} / ${PLACES.length} places lit${all ? ' · the whole town is glowing!' : ''}</p>
      <div class="as-town-layout"><div><div class="as-townwrap">${townSVG()}</div>
      <div class="as-chips">${chips}</div></div>
      <div class="as-place-note">
        <h3>${esc(p.n)}</h3>
        ${lit[p.id] ? `<p class="as-memory">“${esc(p.memory)}”</p>` : `<ul class="as-needs">${needRows(p)}</ul>`}
        ${lit[p.id] ? '' : `<button type="button" class="btn" data-light ${canLight(p) ? '' : 'disabled'}>Light it</button>`}
        <p class="${'as-note ' + townKind}" role="status">${esc(townMsg)}</p>
      </div></div>`;
    panel.querySelectorAll('[data-place]').forEach(n => {
      const pick = () => { townPick = n.dataset.place; townMsg = ''; townKind = ''; renderTown(); const again = $(`#townScreen button[data-place="${townPick}"]`); again && again.focus(); };
      n.addEventListener('click', pick);
      if (n.tagName.toLowerCase() === 'g') n.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
    });
    const btn = panel.querySelector('[data-light]');
    if (btn) btn.addEventListener('click', () => {
      if (!canLight(p)) return;
      for (const [id, n] of Object.entries(p.need)) lights[id] = have(id) - n;
      lit[p.id] = true; save('mk-lights', lights); save('mk-town', lit);
      const nowAll = PLACES.every(x => lit[x.id]);
      if (B()) B().addGlow(PLACE_GLOW + (nowAll ? TOWN_GLOW : 0));
      townMsg = nowAll ? `The whole town is glowing. Sky lanterns rise for Thiri! (+${PLACE_GLOW + TOWN_GLOW} Glow)` : `${p.n} is glowing. +${PLACE_GLOW} Glow`; townKind = 'good';
      B() && B().sfx('ui', nowAll ? 'reward' : 'unlock');
      renderTown();
    });
  }

  // ---------- doors from Thiri’s room ----------
  function refreshHub() {
    const host = document.querySelector('.hub-content-heading');
    if (!host) return;
    let row = host.querySelector('.as-doors');
    if (!row) {
      row = document.createElement('div'); row.className = 'as-doors';
      row.innerHTML = `<button type="button" class="as-door" data-door="workshop"><svg class="as-door-ico" viewBox="0 0 32 32" aria-hidden="true"><rect x="10" y="3" width="12" height="4" rx="1.5" fill="#c9915a" stroke="#2b2547" stroke-width="1.6"/><path d="M8 9 h16 v15 a5 5 0 0 1 -5 5 h-6 a5 5 0 0 1 -5 -5 z" fill="#efe6ff" stroke="#2b2547" stroke-width="1.8"/><circle cx="13" cy="19" r="3.5" fill="#b9a2ff"/><circle cx="19.5" cy="21" r="3.5" fill="#ffe066"/></svg><span><b>Heart Workshop</b><i></i></span></button>
        <button type="button" class="as-door" data-door="town"><svg class="as-door-ico" viewBox="0 0 32 32" aria-hidden="true"><path d="M16 2 v4" stroke="#2b2547" stroke-width="2"/><rect x="11" y="6" width="10" height="3" rx="1" fill="#7a3d33"/><path d="M9 10 C6 14 6 20 9 24 L23 24 C26 20 26 14 23 10 Z" fill="#ff8f6b" stroke="#2b2547" stroke-width="1.8"/><path d="M8 15 h16 M8 19 h16" stroke="#ffd38a" stroke-width="1.6"/><rect x="11" y="24" width="10" height="3" rx="1" fill="#7a3d33"/><path d="M16 27 v3" stroke="#e65a5f" stroke-width="2"/></svg><span><b>Lantern Town</b><i></i></span></button>`;
      host.appendChild(row);
      row.querySelector('[data-door="workshop"]').addEventListener('click', () => { if (!open()) return lockedNote(row); renderWorkshop(); show($('#workshopScreen')); });
      row.querySelector('[data-door="town"]').addEventListener('click', () => { if (!open()) return lockedNote(row); renderTown(); show($('#townScreen')); });
    }
    const o = open();
    seedLights();
    row.classList.toggle('locked', !o);
    const wi = row.querySelector('[data-door="workshop"] i'), ti = row.querySelector('[data-door="town"] i');
    wi.textContent = o ? `${MIXES.filter(m => found[m[0]]).length} / ${MIXES.length} found` : 'Opens when Thiri wakes up';
    ti.textContent = o ? `${PLACES.filter(p => lit[p.id]).length} / ${PLACES.length} lit` : 'Opens when Thiri wakes up';
    row.querySelectorAll('.as-door').forEach(b => b.setAttribute('aria-disabled', String(!o)));
  }
  function lockedNote(row) {
    let n = row.querySelector('.as-lock-note');
    if (!n) { n = document.createElement('p'); n.className = 'as-lock-note'; n.setAttribute('role', 'status'); row.appendChild(n); }
    n.textContent = 'Bring every feeling home by 5 AM. When Thiri wakes up, these open.';
    B() && B().sfx('ui', 'back');
  }
  // the Endless Nights sign on the story map, before level 8
  function signMap() {
    // (the "Endless Nights" heading is written on the map page itself)
    const last = document.querySelector('#levelMapTrack button[data-level="50"]');
    if (last && !last.parentElement.querySelector('.as-sign')) { const t = document.createElement('span'); t.className = 'as-sign end'; t.textContent = 'To be continued…'; t.setAttribute('aria-hidden', 'true'); last.parentElement.appendChild(t); }
  }
  function init() {
    seedLights(); refreshHub(); signMap();
    const hub = document.getElementById('startScreen'), map = document.getElementById('storyMapScreen');
    if (hub) new MutationObserver(() => { refreshHub(); }).observe(hub, { attributes: true, attributeFilter: ['hidden'] });
    if (map) new MutationObserver(signMap).observe(map, { attributes: true, childList: true, subtree: true, attributeFilter: ['hidden'] });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  window.TCAfterStory = { renderWorkshop, renderTown, refreshHub, MIXES, PLACES };
})();
