/* Endless Nights places, drawn entirely in code (no image files):
   Night Market – neon streets, striped stall awnings, string lights and paper lanterns.
   Pagoda Garden – a dusk sky, golden stupas on misty hills, tiered temple roofs and a lotus pond.
   Pagoda Hill – a cool moonlit ridge, quiet temple silhouettes and stone stairways.
   draw() paints sky + parallax layers in world space; the game draws the floor, pits and Moodlings on top. */
(function (root) {
  'use strict';
  const hash = i => { const n = Math.sin(i * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); };
  const STALLS = [['#ff4f7b', '#fff1e0'], ['#2ec4b6', '#f4fff9'], ['#ffd166', '#e85d04'], ['#8d5cf6', '#f7f0ff'], ['#ff8a3d', '#fff4dd'], ['#4dabf7', '#eef8ff']];
  const BULBS = ['#ffd166', '#ff6b9a', '#7af0ff', '#b39dff', '#9dffb0'];
  // repeat a layer's items across the screen; f = how fast the layer follows the camera (1 = with the world)
  function layer(o, f, step, fn) {
    const off = o.cam * (1 - f), a = Math.floor((o.cam - off - step) / step), b = Math.ceil((o.cam + o.W - off + step) / step);
    for (let i = a; i <= b; i++) fn(off + i * step, i);
  }
  function glow(g, x, y, r, c, a) { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${c},${a})`); gr.addColorStop(1, `rgba(${c},0)`); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
  function sky(g, o, stops) {
    const gr = g.createLinearGradient(0, -o.OY - 40, 0, o.ground); stops.forEach(([p, c]) => gr.addColorStop(p, c));
    g.fillStyle = gr; g.fillRect(o.cam - 60, -o.OY - 60, o.W + 120, o.ground + o.OY + 120);
    for (let i = 0; i < 70; i++) { const x = o.cam + ((hash(i) * 4000 - o.cam * .03) % (o.W + 40) + o.W + 40) % (o.W + 40) - 20, y = -o.OY + hash(i + 9) * (o.ground * .45), tw = .35 + .65 * Math.abs(Math.sin(o.t * (1 + hash(i + 2) * 2) + i)); g.fillStyle = `rgba(255,250,230,${tw * .9})`; g.fillRect(x, y, hash(i + 4) > .85 ? 2.4 : 1.6, hash(i + 4) > .85 ? 2.4 : 1.6); }
  }

  function market(g, o) {
    const G = o.ground;
    sky(g, o, [[0, '#1b1650'], [.45, '#3b2283'], [.78, '#8a3a9c'], [1, '#ff7a8a']]);
    // crescent moon
    { const mx = o.cam + o.W * .8, my = 70; glow(g, mx, my, 120, '255,220,240', .25); g.fillStyle = '#fff3d6'; g.beginPath(); g.arc(mx, my, 26, 0, 7); g.fill(); g.fillStyle = '#3b2283'; g.beginPath(); g.arc(mx + 11, my - 7, 23, 0, 7); g.fill(); }
    // far city: tall blocks with lit windows and neon signs
    layer(o, .15, 120, (x, i) => {
      const h = 120 + hash(i) * 170, w = 80 + hash(i + 3) * 40, y = G - 120 - h;
      g.fillStyle = hash(i + 5) > .5 ? '#33206a' : '#2a1a5a'; g.fillRect(x, y, w, h + 120);
      for (let r = 0; r < h / 18; r++) for (let c = 0; c < w / 16; c++) if (hash(i * 31 + r * 7 + c) > .55) { g.fillStyle = hash(i + r + c * 3) > .7 ? 'rgba(122,240,255,.75)' : 'rgba(255,210,122,.8)'; g.fillRect(x + 6 + c * 16, y + 8 + r * 18, 7, 9); }
      if (hash(i + 11) > .55) { const c = ['255,79,123', '46,196,182', '141,92,246', '255,209,102'][i & 3], sx = x + w * .3, sy = y + 20, flick = .75 + .25 * Math.sin(o.t * 6 + i); glow(g, sx + 8, sy + 30, 60, c, .35 * flick); g.fillStyle = `rgba(${c},${.95 * flick})`; g.fillRect(sx, sy, 16, 62); g.fillStyle = '#1b1650'; for (let k = 0; k < 3; k++) g.fillRect(sx + 4, sy + 8 + k * 18, 8, 9); }
    });
    // mid: the row of market stalls with striped awnings and glowing counters
    layer(o, .5, 250, (x, i) => {
      const [c1, c2] = STALLS[((i % STALLS.length) + STALLS.length) % STALLS.length], top = G - 150, w = 190;
      glow(g, x + w / 2, G - 70, 150, '255,180,92', .32);
      g.fillStyle = '#4a2a3a'; g.fillRect(x + 6, top + 26, 8, 124); g.fillRect(x + w - 14, top + 26, 8, 124);
      g.fillStyle = '#ffb35c'; g.fillRect(x + 14, top + 34, w - 28, 66);
      g.fillStyle = 'rgba(255,240,200,.55)'; g.fillRect(x + 14, top + 34, w - 28, 10);
      // goods on the counter
      for (let k = 0; k < 9; k++) { g.fillStyle = BULBS[(k + i) % BULBS.length]; g.beginPath(); g.arc(x + 26 + k * 18, top + 92, 6 + hash(i + k) * 3, 0, 7); g.fill(); }
      g.fillStyle = '#7a3b2e'; g.fillRect(x + 4, top + 100, w - 8, 50); g.fillStyle = '#a0523d'; g.fillRect(x + 4, top + 100, w - 8, 8);
      // awning stripes with a scalloped edge
      for (let k = 0; k < 8; k++) { g.fillStyle = k % 2 ? c2 : c1; g.beginPath(); g.moveTo(x - 6 + k * (w + 12) / 8, top); g.lineTo(x - 6 + (k + 1) * (w + 12) / 8, top); g.lineTo(x - 6 + (k + 1) * (w + 12) / 8, top + 30); g.arc(x - 6 + (k + .5) * (w + 12) / 8, top + 30, (w + 12) / 16, 0, Math.PI); g.closePath(); g.fill(); }
      g.fillStyle = c1; g.fillRect(x - 10, top - 8, w + 20, 10);
      // a little sign
      g.fillStyle = '#fff6e3'; g.fillRect(x + w / 2 - 34, top - 30, 68, 22); g.fillStyle = c1; g.font = '700 13px Gaegu, Fredoka, sans-serif'; g.textAlign = 'center'; g.fillText(['noodles', 'mango', 'tea', 'toys', 'lanterns', 'snacks'][((i % 6) + 6) % 6], x + w / 2, top - 15);
      // steam from the noodle stalls
      if (((i % 6) + 6) % 6 === 0) for (let k = 0; k < 3; k++) { const ph = (o.t * .4 + k / 3) % 1; g.fillStyle = `rgba(255,255,255,${.25 * (1 - ph)})`; g.beginPath(); g.arc(x + 60 + k * 30 + Math.sin(o.t + k) * 6, top + 30 - ph * 60, 8 + ph * 10, 0, 7); g.fill(); }
    });
    // string lights draped between poles
    layer(o, .5, 250, (x, i) => {
      const x0 = x + 95, x1 = x + 345, y0 = G - 175, sag = 34;
      g.strokeStyle = 'rgba(40,24,60,.8)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo((x0 + x1) / 2, y0 + sag * 2, x1, y0); g.stroke();
      for (let k = 1; k < 12; k++) { const u = k / 12, bx = x0 + (x1 - x0) * u, by = y0 + sag * 4 * u * (1 - u) + 4, c = BULBS[(k + i) % BULBS.length], on = .7 + .3 * Math.sin(o.t * 3 + k + i); g.globalAlpha = on; g.fillStyle = c; g.beginPath(); g.arc(bx, by, 3.5, 0, 7); g.fill(); g.globalAlpha = 1; }
    });
    // near: paper lanterns swaying overhead
    layer(o, .85, 170, (x, i) => {
      const y = 20 + hash(i) * 50, sw = Math.sin(o.t * 1.4 + i) * .08, c = hash(i + 7) > .5 ? '#ff4f5e' : '#ff9f43';
      g.strokeStyle = 'rgba(30,20,40,.7)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x, -o.OY - 20); g.lineTo(x, y); g.stroke();
      g.save(); g.translate(x, y); g.rotate(sw); glow(g, 0, 18, 46, '255,150,90', .4);
      g.fillStyle = c; g.beginPath(); g.ellipse(0, 18, 15, 19, 0, 0, 7); g.fill(); g.fillStyle = '#ffd166'; g.fillRect(-9, -2, 18, 4); g.fillRect(-9, 35, 18, 4);
      g.strokeStyle = 'rgba(120,20,30,.45)'; for (let k = -1; k <= 1; k++) { g.beginPath(); g.ellipse(0, 18, Math.abs(k) * 9 + 2, 18, 0, 0, 7); g.stroke(); }
      g.strokeStyle = '#ffd166'; g.beginPath(); g.moveTo(0, 39); g.lineTo(0, 48); g.stroke(); g.restore();
    });
    // Steady rainy-night-market drizzle. Reduced-motion mode keeps the rain still.
    const rainT = o.reduced ? 0 : o.t * 150;
    g.save(); g.strokeStyle = 'rgba(190,220,255,.34)'; g.lineWidth = 1.3; g.lineCap = 'round';
    for (let i = 0; i < 58; i++) {
      const x = o.cam + ((i * 89 + rainT) % (o.W + 60) + o.W + 60) % (o.W + 60) - 30;
      const y = ((i * 67 + rainT * 1.25) % (G + 80) + G + 80) % (G + 80) - 20;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x - 4, y + 11); g.stroke();
    }
    g.restore();
  }

  function garden(g, o) {
    const G = o.ground;
    sky(g, o, [[0, '#1d2366'], [.42, '#5a3a98'], [.75, '#c2609a'], [1, '#ffb27a']]);
    { const mx = o.cam + o.W * .3 - o.cam * .01, my = 96; glow(g, mx, my, 170, '255,236,190', .3); g.fillStyle = '#fff1cf'; g.beginPath(); g.arc(mx, my, 40, 0, 7); g.fill(); g.fillStyle = 'rgba(230,200,160,.35)'; g.beginPath(); g.arc(mx - 12, my - 8, 8, 0, 7); g.arc(mx + 14, my + 10, 6, 0, 7); g.fill(); }
    // far misty hills with golden stupas glowing on top
    const hills = (f, base, amp, col, seed) => {
      const off = o.cam * (1 - f); g.fillStyle = col; g.beginPath(); g.moveTo(o.cam - 60, G);
      for (let x = o.cam - 60; x <= o.cam + o.W + 60; x += 30) { const u = (x - off) / 340; g.lineTo(x, base - amp * (.6 + .4 * Math.sin(u + seed) * Math.sin(u * .37 + seed * 2))); }
      g.lineTo(o.cam + o.W + 60, G); g.closePath(); g.fill();
    };
    hills(.08, G - 150, 90, '#4b3a8f', 1); hills(.18, G - 110, 70, '#6a4fa6', 3);
    const stupa = (x, y, k) => {
      g.save(); g.translate(x, y); g.scale(k, k); glow(g, 0, -40, 80, '255,207,90', .45);
      g.fillStyle = '#ffcf5a'; g.fillRect(-34, -8, 68, 8); g.fillRect(-28, -16, 56, 8); g.fillRect(-22, -24, 44, 8);
      g.beginPath(); g.moveTo(-20, -24); g.bezierCurveTo(-22, -52, -6, -60, 0, -78); g.bezierCurveTo(6, -60, 22, -52, 20, -24); g.closePath(); g.fill();
      g.fillStyle = '#ffe9a8'; g.fillRect(-1.5, -100, 3, 24); g.beginPath(); g.arc(0, -101, 3, 0, 7); g.fill();
      g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.moveTo(-10, -30); g.bezierCurveTo(-11, -48, -4, -56, 0, -70); g.lineTo(-2, -30); g.fill();
      g.restore();
    };
    layer(o, .18, 520, (x, i) => stupa(x + 140, G - 118 - hash(i) * 30, .55 + hash(i + 2) * .35));
    // drifting mist
    for (let k = 0; k < 3; k++) { g.globalAlpha = .13; g.fillStyle = '#f3e8ff'; const x = o.cam - ((o.t * (6 + k * 3) + k * 400) % 800); for (let j = 0; j < 4; j++) { g.beginPath(); g.ellipse(x + j * 800, G - 120 + k * 22, 420, 22, 0, 0, 7); g.fill(); } } g.globalAlpha = 1;
    // mid: tiered temple roofs and round bodhi trees with frangipani blossoms
    layer(o, .45, 300, (x, i) => {
      if (((i % 2) + 2) % 2 === 0) {
        const cx = x + 150, b = G - 40;
        g.fillStyle = '#7a2e3a'; g.fillRect(cx - 50, b - 70, 100, 70);
        g.fillStyle = '#ffd27a'; for (let k = 0; k < 3; k++) g.fillRect(cx - 34 + k * 26, b - 54, 16, 30);
        for (let k = 0; k < 3; k++) { const w = 130 - k * 34, y = b - 70 - k * 30; g.fillStyle = '#b0413e'; g.beginPath(); g.moveTo(cx - w / 2 - 14, y + 4); g.quadraticCurveTo(cx - w / 2, y - 6, cx - w / 2 + 10, y - 18); g.lineTo(cx + w / 2 - 10, y - 18); g.quadraticCurveTo(cx + w / 2, y - 6, cx + w / 2 + 14, y + 4); g.closePath(); g.fill(); g.strokeStyle = '#ffcf5a'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(cx - w / 2 - 14, y + 4); g.lineTo(cx + w / 2 + 14, y + 4); g.stroke(); }
        g.fillStyle = '#ffcf5a'; g.fillRect(cx - 2, b - 180, 4, 22); glow(g, cx, b - 100, 90, '255,190,110', .25);
      } else {
        const cx = x + 150, b = G - 30;
        g.fillStyle = '#4a3328'; g.fillRect(cx - 7, b - 90, 14, 90);
        for (const [dx, dy, r, c] of [[-40, -100, 46, '#2f6b5a'], [30, -110, 52, '#3a7d64'], [0, -140, 48, '#2f6b5a'], [-10, -96, 40, '#45906f']]) { g.fillStyle = c; g.beginPath(); g.arc(cx + dx, b + dy, r, 0, 7); g.fill(); }
        for (let k = 0; k < 14; k++) { g.fillStyle = hash(i * 9 + k) > .5 ? '#ffd6e8' : '#fff4c2'; g.beginPath(); g.arc(cx - 70 + hash(i + k) * 140, b - 160 + hash(i + k * 2) * 100, 3.4, 0, 7); g.fill(); }
      }
    });
    // stone lanterns with a warm flame
    layer(o, .7, 360, (x, i) => {
      const cx = x + 60, b = G - 18, f = .75 + .25 * Math.sin(o.t * 7 + i);
      g.fillStyle = '#8f8aa8'; g.fillRect(cx - 6, b - 40, 12, 40); g.fillRect(cx - 16, b - 52, 32, 10); g.fillRect(cx - 14, b - 74, 28, 22); g.beginPath(); g.moveTo(cx - 22, b - 74); g.lineTo(cx, b - 90); g.lineTo(cx + 22, b - 74); g.fill();
      glow(g, cx, b - 63, 40, '255,200,110', .55 * f); g.fillStyle = `rgba(255,214,140,${f})`; g.fillRect(cx - 7, b - 70, 14, 14);
    });
    // lotus pond just behind the path, with the pagodas' gold shimmering in it
    {
      const top = G - 34, gr = g.createLinearGradient(0, top, 0, G); gr.addColorStop(0, '#5aa3d8'); gr.addColorStop(1, '#2d5e9c');
      g.fillStyle = gr; g.fillRect(o.cam - 60, top, o.W + 120, 34);
      for (let k = 0; k < 18; k++) { const x = o.cam + ((k * 97 - o.cam * .05 + o.t * 10) % (o.W + 40) + o.W + 40) % (o.W + 40) - 20; g.strokeStyle = `rgba(255,230,170,${.35 + .25 * Math.sin(o.t * 2 + k)})`; g.lineWidth = 2; g.beginPath(); g.moveTo(x, top + 8 + (k % 3) * 8); g.lineTo(x + 16, top + 8 + (k % 3) * 8); g.stroke(); }
      layer(o, .9, 140, (x, i) => {
        g.fillStyle = '#3c9a5a'; g.beginPath(); g.ellipse(x + 20, top + 14, 22, 6, 0, .3, Math.PI * 2 - .3); g.lineTo(x + 20, top + 14); g.fill();
        if (hash(i) > .35) { const lx = x + 70, ly = top + 10; g.fillStyle = '#ff8fc3'; for (let p = -2; p <= 2; p++) { g.save(); g.translate(lx, ly); g.rotate(p * .35); g.beginPath(); g.ellipse(0, -9, 4.5, 10, 0, 0, 7); g.fill(); g.restore(); } g.fillStyle = '#ffe08a'; g.beginPath(); g.arc(lx, ly - 2, 3, 0, 7); g.fill(); }
      });
    }
  }
  function pagoda(g, o) {
    const G = o.ground, scene = o.reduced ? { ...o, t: 0 } : o;
    sky(g, scene, [[0, '#101b34'], [.5, '#253a59'], [.82, '#5b5274'], [1, '#b18b83']]);
    const moonX = o.cam + o.W * .78, moonY = 84;
    glow(g, moonX, moonY, 138, '255,229,183', .24); g.fillStyle = '#f7e9c5'; g.beginPath(); g.arc(moonX, moonY, 24, 0, Math.PI * 2); g.fill();
    const hills = (f, base, amp, color, seed) => {
      const off = o.cam * (1 - f); g.fillStyle = color; g.beginPath(); g.moveTo(o.cam - 50, G);
      for (let x = o.cam - 50; x <= o.cam + o.W + 50; x += 32) { const u = (x - off) / 370; g.lineTo(x, base - amp * (.62 + .38 * Math.sin(u + seed) * Math.sin(u * .41 + seed))); }
      g.lineTo(o.cam + o.W + 50, G); g.closePath(); g.fill();
    };
    hills(.08, G - 145, 75, '#26334d', 1); hills(.19, G - 95, 54, '#34415a', 3);
    // Distant pagodas remain quiet silhouettes on the ridge, with restrained gold light.
    const stupa = (x, base, scale) => {
      g.save(); g.translate(x, base); g.scale(scale, scale);
      g.fillStyle = '#625b68'; g.fillRect(-28, -5, 56, 6); g.fillRect(-23, -12, 46, 7); g.fillRect(-18, -20, 36, 8);
      g.fillStyle = '#756c71'; g.beginPath(); g.moveTo(-18, -20); g.bezierCurveTo(-20, -40, -5, -48, 0, -69); g.bezierCurveTo(5, -48, 20, -40, 18, -20); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(233,203,145,.72)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(0, -68); g.lineTo(0, -91); g.stroke(); g.beginPath(); g.arc(0, -93, 2, 0, Math.PI * 2); g.fillStyle = '#e9cb91'; g.fill();
      g.restore();
    };
    layer(scene, .24, 460, (x, i) => stupa(x + 180, G - 130 - hash(i) * 22, .62 + hash(i + 2) * .24));
    // A small monastery roof line sits among the trees; no sacred figures or props are placed on the path.
    layer(scene, .48, 360, (x, i) => {
      const cx = x + 170, base = G - 32;
      g.fillStyle = '#4a3a43'; g.fillRect(cx - 54, base - 64, 108, 64);
      g.fillStyle = '#6b4245';
      for (let row = 0; row < 3; row++) {
        const half = 76 - row * 19, y = base - 65 - row * 24;
        g.beginPath(); g.moveTo(cx - half - 10, y + 5); g.quadraticCurveTo(cx - half, y - 5, cx - half + 9, y - 16); g.lineTo(cx + half - 9, y - 16); g.quadraticCurveTo(cx + half, y - 5, cx + half + 10, y + 5); g.closePath(); g.fill();
        g.strokeStyle = 'rgba(233,203,145,.55)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(cx - half - 10, y + 5); g.lineTo(cx + half + 10, y + 5); g.stroke();
      }
      g.fillStyle = '#c4a978'; g.fillRect(cx - 24, base - 48, 12, 28); g.fillRect(cx + 12, base - 48, 12, 28);
      if (i % 2) {
        g.fillStyle = '#34483e'; g.beginPath(); g.arc(cx - 90, base - 95, 40, 0, Math.PI * 2); g.arc(cx - 58, base - 111, 35, 0, Math.PI * 2); g.arc(cx - 27, base - 94, 39, 0, Math.PI * 2); g.fill();
      }
    });
    // Muted lanterns and a still band of mist keep the ridge serene.
    layer(scene, .72, 330, (x, i) => {
      const lx = x + 54, by = G - 26;
      g.fillStyle = '#686674'; g.fillRect(lx - 3, by - 40, 6, 40); g.fillRect(lx - 12, by - 46, 24, 6);
      g.fillStyle = '#b88f53'; g.beginPath(); g.ellipse(lx, by - 58, 7, 10, 0, 0, Math.PI * 2); g.fill();
      glow(g, lx, by - 57, 34, '255,207,125', .23);
    });
    g.save(); g.fillStyle = 'rgba(222,226,232,.09)';
    for (let row = 0; row < 3; row++) { const y = G - 96 + row * 24, shift = o.reduced ? 0 : Math.sin(o.t * .22 + row) * 8; g.beginPath(); g.ellipse(o.cam + o.W * .5 + shift, y, o.W * .62, 13, 0, 0, Math.PI * 2); g.fill(); }
    g.restore();
  }
  const DRAW = { market, garden, pagoda };
  // floor colours the game uses for these places: [top, middle, edge line]
  const FLOOR = { market: ['#7a4256', '#4a2840', 'rgba(255,190,140,.75)'], garden: ['#8a7aa0', '#4f4466', 'rgba(255,228,170,.7)'], pagoda: ['#827a78', '#48454c', 'rgba(218,194,153,.72)'] };
  root.TCPlaces = { has: k => !!DRAW[k], draw: (g, k, o) => { g.save(); DRAW[k](g, o); g.restore(); }, FLOOR };
})(typeof window !== 'undefined' ? window : globalThis);
