/* Endless Nights map versions, drawn in code over each place's painting (no new art):
   rainy · sunrise · blossom · autumn · fireworks · candle · foggy · shooting-star · snowy · moonlit,
   plus the Storm night (dark, lightning reveals) and All-Golden nights.
   back(): world space, right after the place is painted.  front(): world space, over everything in the
   world (weather).  screen(): screen space, before the HUD (fog / storm darkness with a clear circle
   around the cat).  revealing(): 0..1 while a firework or lightning lights everything up. */
(function (root) {
  'use strict';
  let bursts = [], nextBurst = 1.2, flash = 0, bolt = null, nextBolt = 3, stars = [], nextStar = 1.5, lastT = 0;
  const hash = i => { const n = Math.sin(i * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); };
  const wrap = (v, m) => ((v % m) + m) % m;
  const FIRE = ['#ffd166', '#ff6b9a', '#8fd6ff', '#b39dff', '#9dffb0', '#ffb36b'];
  function reset() { bursts = []; nextBurst = 1.2; flash = 0; bolt = null; nextBolt = 3; stars = []; nextStar = 1.5; lastT = 0; }
  const has = (o, k) => o.fx.includes(k);
  function tint(g, o, top, bottom, a) {
    const gr = g.createLinearGradient(0, -o.OY, 0, o.ground + 40); gr.addColorStop(0, top); gr.addColorStop(1, bottom);
    g.save(); g.globalAlpha = a; g.fillStyle = gr; g.fillRect(o.cam - 60, -o.OY - 40, o.W + 120, o.H + o.OY * 2 + 80); g.restore();
  }
  // soft round glows are pre-rendered once per colour and stamped, instead of a new gradient every frame
  const glowCache = {};
  function glowSprite(c) {
    if (glowCache[c]) return glowCache[c];
    const cv = document.createElement('canvas'); cv.width = cv.height = 128; const x = cv.getContext('2d');
    const gr = x.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, `rgba(${c},1)`); gr.addColorStop(1, `rgba(${c},0)`);
    x.fillStyle = gr; x.fillRect(0, 0, 128, 128); return (glowCache[c] = cv);
  }
  // colour grade: blend a two-colour wash over the whole place (soft-light keeps the painting, adds colour)
  function grade(g, o, op, top, bottom, a) {
    const gr = g.createLinearGradient(0, -o.OY, 0, o.ground + 40); gr.addColorStop(0, top); gr.addColorStop(1, bottom);
    g.save(); g.globalCompositeOperation = op; g.globalAlpha = a; g.fillStyle = gr; g.fillRect(o.cam - 60, -o.OY - 40, o.W + 120, o.H + o.OY * 2 + 80); g.restore();
  }
  // every map version has its own look: [blend, top colour, bottom colour, strength] passes
  const GRADES = {
    base: [['soft-light', '#b9c8ff', '#ffd2a1', .32], ['screen', '#2a2f6a', '#3a2a4a', .18]],
    rainy: [['color', '#1fb6d6', '#2a8cff', .32], ['soft-light', '#43d6ff', '#1f8bff', .6], ['screen', '#1c4a6a', '#123a52', .28]],
    sunrise: [['color', '#ffb070', '#ff8a6a', .26], ['soft-light', '#ff9a6b', '#ffd36b', .7], ['screen', '#6a3a5a', '#7a4a2a', .3]],
    blossom: [['color', '#ff6fb0', '#ff9ccc', .34], ['soft-light', '#ff8fc8', '#ffe1f0', .7], ['screen', '#5a2a5a', '#4a2a4a', .26]],
    autumn: [['color', '#ff8a2a', '#e0522a', .4], ['soft-light', '#ffa04a', '#e0522a', .7], ['screen', '#5a3010', '#4a2a10', .24]],
    fireworks: [['color', '#6a3aff', '#ff3fa0', .18], ['overlay', '#4a3aff', '#ff4fa8', .22], ['screen', '#2a1a5a', '#3a1a3a', .2]],
    candle: [['color', '#ffb347', '#ff8a3d', .32], ['soft-light', '#ffd27a', '#ff8a3d', .7], ['screen', '#5a3a1a', '#4a2a1a', .26]],
    foggy: [['soft-light', '#e8e0ff', '#c9d6ff', .6], ['screen', '#4a4a6a', '#5a5a7a', .3]],
    shooting: [['color', '#3f5bff', '#1fa8ff', .28], ['soft-light', '#6f6bff', '#2bd4ff', .6], ['screen', '#1a1a5a', '#102a4a', .24]],
    snowy: [['color', '#8fd6ff', '#b8e8ff', .36], ['soft-light', '#d6f1ff', '#ffffff', .7], ['screen', '#3a5a7a', '#4a6a8a', .32]],
    moonlit: [['color', '#7f9cff', '#a7b8ff', .3], ['soft-light', '#a9c4ff', '#e6ecff', .6], ['screen', '#2a3a6a', '#3a4a7a', .3]],
    storm: [['soft-light', '#6a7aa8', '#3a4a6a', .5]],
    golden: [['color', '#ffc94a', '#ffb03a', .34], ['soft-light', '#ffd36b', '#ffb03a', .65], ['screen', '#5a4210', '#4a3010', .26]]
  };
  // the plain version of each place still gets its own tone, so no two places look alike
  const BASE_BY_PLACE = {
    school: [['soft-light', '#ffd9a8', '#b9c8ff', .4], ['screen', '#3a2a4a', '#2a2a4a', .2]],
    park: [['color', '#34d17f', '#2fbf9a', .36], ['soft-light', '#d8ffcf', '#b8f0d0', .45], ['screen', '#1a3a2a', '#1a3a2a', .24]],
    festival: [['soft-light', '#ffc2e8', '#ffb36b', .42], ['screen', '#3a1a4a', '#3a2a2a', .18]],
    hill: [['soft-light', '#c8b8ff', '#9ce0ff', .45], ['screen', '#2a2a5a', '#1a3a4a', .2]],
    lake: [['color', '#ff9ab0', '#ffb88a', .16], ['soft-light', '#ffd0e0', '#ffe2b0', .45], ['screen', '#3a2a4a', '#3a2a3a', .2]],
    rooftop: [['color', '#ff8f6a', '#9a7aff', .42], ['soft-light', '#ffd0a8', '#c8b0ff', .6], ['screen', '#4a2a3a', '#2a2a4a', .3]],
    market: [['screen', '#1a1030', '#201030', .1]],
    garden: [['screen', '#1a1030', '#201030', .1]]
  };
  function glow(g, x, y, r, c, a) { if (a <= 0) return; const ga = g.globalAlpha; g.globalAlpha = ga * Math.min(1, a); g.drawImage(glowSprite(c), x - r, y - r, r * 2, r * 2); g.globalAlpha = ga; }

  function back(g, o) {
    const dt = Math.max(0, Math.min(.05, o.t - lastT)); lastT = o.t;
    flash = Math.max(0, flash - dt * 1.6);
    const sky = o.ground - 150;
    // the colour grade for this version (base places get a gentle lift so no night looks muddy)
    const keyFx = o.fx.find(k => GRADES[k]) || 'base';
    const passes = keyFx === 'base' ? (BASE_BY_PLACE[o.map] || GRADES.base) : GRADES[keyFx];
    for (const [op, a, b, k] of passes) grade(g, o, op, a, b, k);
    if (o.fx.includes('storm') && keyFx !== 'storm') for (const [op, a, b, k] of GRADES.storm) grade(g, o, op, a, b, k * .7);
    if (has(o, 'sunrise')) {
      g.save(); g.globalCompositeOperation = 'screen'; glow(g, o.cam + o.W * .78, o.ground - 60, o.W * .45, '255,170,110', .55); glow(g, o.cam + o.W * .78, o.ground - 60, 70, '255,230,170', .8); g.restore();
    }
    if (has(o, 'shooting')) {
      // aurora ribbons across the sky
      g.save(); g.globalCompositeOperation = 'screen';
      for (let k = 0; k < 3; k++) {
        const c = ['80,255,190', '120,160,255', '220,120,255'][k], y0 = 40 + k * 34;
        g.beginPath(); g.moveTo(o.cam - 60, y0);
        for (let x = 0; x <= o.W + 120; x += 40) g.lineTo(o.cam - 60 + x, y0 + Math.sin(x / 140 + o.t * .4 + k) * 22);
        for (let x = o.W + 120; x >= 0; x -= 40) g.lineTo(o.cam - 60 + x, y0 + 60 + Math.sin(x / 120 + o.t * .5 + k * 2) * 18);
        g.closePath(); const gr = g.createLinearGradient(0, y0, 0, y0 + 70); gr.addColorStop(0, `rgba(${c},0)`); gr.addColorStop(.5, `rgba(${c},.42)`); gr.addColorStop(1, `rgba(${c},0)`); g.fillStyle = gr; g.fill();
      }
      g.restore();
    }
    if (has(o, 'moonlit')) {
      const mx = o.cam + o.W * .44, my = 92;
      g.save(); g.globalCompositeOperation = 'screen'; glow(g, mx, my, 260, '200,215,255', .35);
      g.fillStyle = '#fff8e6'; g.beginPath(); g.arc(mx, my, 34, 0, 7); g.fill();
      g.fillStyle = 'rgba(200,190,170,.35)'; g.beginPath(); g.arc(mx - 9, my - 6, 7, 0, 7); g.arc(mx + 10, my + 8, 5, 0, 7); g.fill();
      for (let k = 0; k < 3; k++) { g.globalAlpha = .07 + .03 * Math.sin(o.t * .6 + k); g.fillStyle = '#dfe8ff'; g.beginPath(); g.moveTo(mx - 10 + k * 18, my); g.lineTo(mx + 120 + k * 150, o.ground); g.lineTo(mx + 40 + k * 150, o.ground); g.closePath(); g.fill(); }
      g.restore();
    }
    if (has(o, 'shooting')) {
      g.save();
      for (let i = 0; i < 60; i++) { const x = o.cam + wrap(hash(i) * 3000 - o.cam * .05, o.W + 40) - 20, y = 20 + hash(i + 9) * (sky - 40), tw = .4 + .6 * Math.abs(Math.sin(o.t * (1 + hash(i + 3) * 2) + i)); g.fillStyle = `rgba(255,250,220,${tw})`; g.fillRect(x, y, 2, 2); }
      nextStar -= dt; if (nextStar <= 0) { nextStar = 1.6 + Math.random() * 2.2; stars.push({ x: o.cam + Math.random() * o.W, y: 20 + Math.random() * 120, life: 1 }); }
      for (const s of stars) { s.life -= dt * 1.4; s.x += dt * 520; s.y += dt * 210; const a = Math.max(0, s.life); const gr = g.createLinearGradient(s.x, s.y, s.x - 120, s.y - 48); gr.addColorStop(0, `rgba(255,248,210,${a})`); gr.addColorStop(1, 'rgba(255,248,210,0)'); g.strokeStyle = gr; g.lineWidth = 2.5; g.lineCap = 'round'; g.beginPath(); g.moveTo(s.x, s.y); g.lineTo(s.x - 120, s.y - 48); g.stroke(); }
      stars = stars.filter(s => s.life > 0); g.restore();
    }
    if (has(o, 'fireworks')) {
      nextBurst -= dt;
      if (nextBurst <= 0) {
        nextBurst = .7 + Math.random() * 1.1;
        const x = o.cam + 120 + Math.random() * (o.W - 240), y = 50 + Math.random() * (sky - 80), c = FIRE[Math.floor(Math.random() * FIRE.length)], n = 34;
        bursts.push({ x, y, c, life: 1.6, parts: Array.from({ length: n }, (_, k) => { const a = k / n * Math.PI * 2, sp = 120 + Math.random() * 60; return { vx: Math.cos(a) * sp, vy: Math.sin(a) * sp }; }) });
        flash = Math.max(flash, .8); o.onBurst && o.onBurst(x);
      }
      g.save(); g.globalCompositeOperation = 'lighter';
      for (const b of bursts) {
        b.life -= dt; const age = 1.6 - b.life, a = Math.max(0, Math.min(1, b.life / .8));
        if (age < .18) glow(g, b.x, b.y, 60, '255,240,210', .5 * (1 - age / .18));
        for (const p of b.parts) { const x = b.x + p.vx * age * (1 - age * .3), y = b.y + p.vy * age * (1 - age * .3) + 40 * age * age; g.fillStyle = b.c; g.globalAlpha = a; g.beginPath(); g.arc(x, y, 2.2, 0, 7); g.fill(); g.globalAlpha = a * .35; g.beginPath(); g.arc(x, y, 5, 0, 7); g.fill(); }
      }
      g.restore(); bursts = bursts.filter(b => b.life > 0);
      if (flash > 0) { g.save(); g.globalAlpha = flash * .14; g.fillStyle = '#fff3e0'; g.fillRect(o.cam - 60, -o.OY - 40, o.W + 120, o.H + o.OY * 2 + 80); g.restore(); }
    }
    if (has(o, 'snowy') && o.terrainY) {
      // snow resting along the ground line
      g.save(); g.fillStyle = 'rgba(245,250,255,.88)';
      g.beginPath(); const x0 = Math.floor((o.cam - 40) / 20) * 20; g.moveTo(x0, o.terrainY(x0) + 2);
      for (let x = x0; x <= o.cam + o.W + 40; x += 20) g.lineTo(x, o.terrainY(x) - 3 - 2.5 * hash(x));
      for (let x = o.cam + o.W + 40; x >= x0; x -= 20) g.lineTo(x, o.terrainY(x) + 4);
      g.closePath(); g.fill(); g.restore();
    }
  }
  function front(g, o) {
    const W = o.W + 100, top = -o.OY - 20, span = o.ground + o.OY + 40, still = o.reduced;
    const t = still ? 0 : o.t;
    g.save();
    if (has(o, 'rainy') || has(o, 'storm')) {
      const n = has(o, 'storm') ? 140 : 90; g.strokeStyle = 'rgba(190,215,255,.42)'; g.lineWidth = 1.3; g.beginPath();
      for (let i = 0; i < n; i++) { const x = o.cam - 50 + wrap(hash(i) * W - t * 120 - o.cam * .1, W), y = top + wrap(hash(i + 50) * span + t * (680 + hash(i) * 200), span); g.moveTo(x, y); g.lineTo(x - 5, y + 16); }
      g.stroke();
      if (o.terrainY) { g.strokeStyle = 'rgba(200,225,255,.4)'; for (let i = 0; i < 14; i++) { const ph = wrap(t * 1.7 + hash(i + 7), 1), x = o.cam + hash(i + 31) * o.W; g.globalAlpha = 1 - ph; g.beginPath(); g.ellipse(x, o.terrainY(x) + 2, 3 + ph * 12, 1 + ph * 3, 0, 0, 7); g.stroke(); } g.globalAlpha = 1; }
    }
    if (has(o, 'snowy')) {
      for (let i = 0; i < 80; i++) { const d = .5 + hash(i + 3), x = o.cam - 50 + wrap(hash(i) * W + Math.sin(t * .8 + i) * 18 - o.cam * .08 * d, W), y = top + wrap(hash(i + 70) * span + t * 38 * d, span); g.fillStyle = `rgba(255,255,255,${.5 + .4 * hash(i + 5)})`; g.beginPath(); g.arc(x, y, 1.2 + 1.6 * d, 0, 7); g.fill(); }
    }
    const fallers = (n, cols, sp, size) => {
      for (let i = 0; i < n; i++) {
        const x = o.cam - 50 + wrap(hash(i) * W + t * 36 + Math.sin(t * 1.3 + i) * 26 - o.cam * .1, W), y = top + wrap(hash(i + 40) * span + t * sp * (.7 + hash(i + 2) * .6), span);
        g.save(); g.translate(x, y); g.rotate(t * (1 + hash(i)) * 2 + i); g.scale(1, .55 + .45 * Math.sin(t * 3 + i));
        g.fillStyle = cols[i % cols.length]; g.globalAlpha = .85; g.beginPath(); g.ellipse(0, 0, size, size * .62, 0, 0, 7); g.fill(); g.restore();
      }
    };
    if (has(o, 'blossom')) fallers(46, ['#ffc4dc', '#ffb0cf', '#fff0f6', '#ff9ec4'], 46, 4.2);
    if (has(o, 'autumn')) fallers(36, ['#e8732c', '#c9442b', '#f2a93b', '#9a5a2a'], 58, 5.4);
    if (has(o, 'candle')) {
      g.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 22; i++) { const x = o.cam - 50 + wrap(hash(i) * W + Math.sin(t * .5 + i) * 30 - o.cam * .15, W), y = top + span - wrap(hash(i + 20) * span + t * 16, span) - 60, f = .7 + .3 * Math.sin(t * 9 + i * 3); glow(g, x, y, 22, '255,190,110', .32 * f); g.fillStyle = `rgba(255,230,170,${.9 * f})`; g.beginPath(); g.ellipse(x, y, 2.4, 4, 0, 0, 7); g.fill(); }
      g.globalCompositeOperation = 'source-over';
    }
    if (has(o, 'sunrise') || has(o, 'golden')) {
      g.globalCompositeOperation = 'lighter';
      const c = has(o, 'golden') ? '255,214,90' : '255,220,170';
      for (let i = 0; i < (has(o, 'golden') ? 40 : 24); i++) { const x = o.cam - 50 + wrap(hash(i) * W + Math.sin(t * .7 + i) * 20 - o.cam * .05, W), y = top + span - wrap(hash(i + 60) * span + t * 22, span), tw = .4 + .6 * Math.abs(Math.sin(t * 2 + i)); glow(g, x, y, 7, c, .7 * tw); }
      g.globalCompositeOperation = 'source-over';
    }
    if (has(o, 'foggy')) {
      for (let k = 0; k < 4; k++) { const y = o.ground - 30 - k * 46, x = o.cam - wrap(t * (10 + k * 6) + k * 300, 600); for (let j = 0; j < 4; j++) { g.globalAlpha = .1; g.fillStyle = '#e6ecff'; g.beginPath(); g.ellipse(x + j * 600, y, 360, 34 + k * 6, 0, 0, 7); g.fill(); } }
      g.globalAlpha = 1;
    }
    g.restore();
  }
  // screen space: darkness / fog that leaves a soft clear circle around the cat
  function screen(g, o) {
    const dt = Math.max(0, Math.min(.05, o.dt || 0));
    let dark = 0, col = '8,10,26', r = 170;
    if (has(o, 'storm')) {
      dark = .52;
      nextBolt -= dt; if (nextBolt <= 0) { nextBolt = 4 + Math.random() * 3.5; bolt = { x: Math.random() * o.W, life: .28 }; flash = 1; o.onBolt && o.onBolt(); }
    }
    if (has(o, 'foggy')) { dark = Math.max(dark, .55); col = '226,228,245'; r = 210; }
    if (o.eyes) r = Math.max(r, o.eyesR || 300);
    if (dark > 0) {
      const lit = has(o, 'storm') ? Math.min(1, flash * 1.3) : 0, a = dark * (1 - lit);
      if (a > .01) {
        const gr = g.createRadialGradient(o.catX, o.catY, r * .45, o.catX, o.catY, r * 1.25);
        gr.addColorStop(0, `rgba(${col},0)`); gr.addColorStop(1, `rgba(${col},${a})`);
        g.fillStyle = gr; g.fillRect(0, -o.OY, o.W, o.H + o.OY * 2);
      }
    }
    if (bolt) {
      bolt.life -= dt;
      if (bolt.life > 0) {
        g.save(); g.globalAlpha = Math.min(1, bolt.life / .12) * .9; g.strokeStyle = '#f4f7ff'; g.lineWidth = 3; g.shadowColor = '#bcd2ff'; g.shadowBlur = 18;
        g.beginPath(); let x = bolt.x, y = -o.OY; g.moveTo(x, y); while (y < o.ground * .7) { x += (hash(x + y) - .5) * 60; y += 30 + hash(y) * 30; g.lineTo(x, y); } g.stroke(); g.restore();
        g.save(); g.globalAlpha = bolt.life * 1.4; g.fillStyle = '#e8eeff'; g.fillRect(0, -o.OY, o.W, o.H + o.OY * 2); g.restore();
      } else bolt = null;
    }
    if (has(o, 'golden')) { const v = g.createRadialGradient(o.W / 2, o.H / 2, o.H * .4, o.W / 2, o.H / 2, o.W * .75); v.addColorStop(0, 'rgba(255,200,80,0)'); v.addColorStop(1, 'rgba(255,190,60,.18)'); g.fillStyle = v; g.fillRect(0, -o.OY, o.W, o.H + o.OY * 2); }
  }
  root.TCEndlessFX = { back, front, screen, reset, revealing: () => flash };
})(typeof window !== 'undefined' ? window : globalThis);
