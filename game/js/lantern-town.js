/* Lantern Town: all 50 places gathered into one little night town.
   Districts from left to right: the harbour, the market street, the town square around the Great Sky
   Lantern, the park with its stream, and the home lane under the hill. Each district has three rows
   (back street, middle street, front street) so the buildings overlap like a real town.
   World units: 3000 x 900. Building art: assets/town/<art>.webp (drawn at its own pixel size x row scale). */
(function (root) {
  'use strict';
  const W = 3000, H = 900;
  const ROW = { back: { y: 478, s: .62 }, mid: { y: 650, s: .8 }, front: { y: 846, s: .95 } };
  // [art number, x, row, optional baseline y (hill), optional extra scale]
  const LAYOUT = [
    // harbour
    [3, 140, 'back', 492], [48, 395, 'mid', 640], [34, 165, 'front', 850], [40, 420, 'front', 862, .82],
    // market street
    [4, 620, 'back'], [18, 760, 'back'], [6, 895, 'back'], [16, 1030, 'back'],
    [5, 615, 'mid'], [17, 745, 'mid'], [25, 875, 'mid'], [41, 1000, 'mid'], [24, 1120, 'mid'],
    [22, 640, 'front'], [32, 800, 'front'], [29, 960, 'front'], [42, 1110, 'front'],
    // town square
    [2, 1225, 'back'], [11, 1350, 'back'], [50, 1515, 'back', null, 1.25], [9, 1675, 'back'], [45, 1810, 'back', null, 1.05],
    [35, 1235, 'mid'], [13, 1375, 'mid'], [23, 1660, 'mid'], [10, 1800, 'mid'],
    [14, 1235, 'front'], [38, 1385, 'front'], [43, 1515, 'front'], [49, 1660, 'front'],
    // park and stream
    [28, 1935, 'back'], [27, 2070, 'back'], [37, 2205, 'back'],
    [30, 1945, 'mid'], [31, 2085, 'mid'], [26, 2235, 'mid'],
    [8, 1940, 'front'], [36, 2125, 'front', 856],
    // home lane and the hill
    [33, 2470, 'back', 466], [46, 2625, 'back', 392, 1.1], [20, 2775, 'back', 338], [39, 2905, 'back', 384],
    [7, 2465, 'mid'], [19, 2600, 'mid'], [12, 2735, 'mid'], [1, 2870, 'mid'],
    [44, 2465, 'front', null, 1.05], [47, 2620, 'front'], [21, 2775, 'front'], [15, 2905, 'front', null, .88]
  ];
  const SIZE = {"b01":[140,154],"b02":[102,164],"b03":[142,160],"b04":[153,168],"b05":[157,128],"b06":[154,108],"b07":[159,106],"b08":[146,150],"b09":[118,148],"b10":[153,108],"b11":[137,100],"b12":[143,100],"b13":[144,124],"b14":[134,104],"b15":[162,102],"b16":[111,131],"b17":[148,111],"b18":[136,110],"b19":[141,101],"b20":[138,128],"b21":[155,102],"b22":[157,116],"b23":[150,128],"b24":[150,108],"b25":[151,111],"b26":[158,85],"b27":[122,130],"b28":[148,118],"b29":[137,126],"b30":[157,134],"b31":[138,116],"b32":[144,135],"b33":[74,148],"b34":[161,83],"b35":[160,120],"b36":[180,86],"b37":[149,132],"b38":[166,111],"b39":[144,154],"b40":[167,131],"b41":[121,124],"b42":[125,163],"b43":[156,206],"b44":[149,169],"b45":[172,184],"b46":[181,222],"b47":[144,145],"b48":[194,78],"b49":[190,97],"b50":[188,323]};
  const SCALE = 1.25;   // art pixels -> world units at row scale 1
  const WAVE = { back: [20, 250, 0], mid: [18, 310, 130], front: [10, 400, 40] };
  const rowY = (row, x) => { const [a, p, ph] = WAVE[row]; return ROW[row].y + a * Math.sin((x + ph) / p) + a * .4 * Math.sin((x * 2.3 + ph) / p); };

  function scenery(litCount, total) {
    const warm = litCount / total;                       // the sky warms as the town lights up
    const horizon = mixHex('#1e1b36', '#5a3e52', warm);
    const stars = Array.from({ length: 90 }, (_, i) => `<circle cx="${(i * 337 + 61) % W}" cy="${(i * 97 + 19) % 330}" r="${i % 5 === 0 ? 2.2 : 1.2}" fill="#fff4d8" opacity="${.35 + (i % 4) * .15}"/>`).join('');
    // a street that follows its row's curve, from x0 to x1, h units deep
    const road = (row, x0, x1, h) => {
      const pts = []; for (let x = x0; x <= x1; x += 20) pts.push([x, rowY(row, x)]);
      const top = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y.toFixed(1)}`).join(''), bot = pts.slice().reverse().map(([x, y]) => `L${x} ${(y + h).toFixed(1)}`).join('');
      return `<path d="${top}${bot}Z" fill="url(#ltRoad)"/><path d="${top}${bot}Z" fill="url(#ltStones)"/><path d="${top}" fill="none" stroke="#d8c6ae" stroke-opacity=".35" stroke-width="2.5"/>`;
    };
    // grass from a row's street down to the bottom of the world
    const field = (row, x0, x1, fill) => { let d = ''; for (let x = x0; x <= x1; x += 20) d += `${d ? 'L' : 'M'}${x} ${rowY(row, x).toFixed(1)}`; return `<path d="${d}L${x1} ${H}L${x0} ${H}Z" fill="${fill}"/>`; };
    // little lanes that join the streets, so you can walk up and down through town
    const lane = (x, a, b, lean) => { const y0 = rowY(a, x) + 18, y1 = rowY(b, x + lean); return `<path d="M${x - 16} ${y0}L${x + 16} ${y0}L${x + lean + 26} ${y1}L${x + lean - 26} ${y1}Z" fill="url(#ltRoad)" opacity=".9"/><path d="M${x - 16} ${y0}L${x + 16} ${y0}L${x + lean + 26} ${y1}L${x + lean - 26} ${y1}Z" fill="url(#ltStones)"/>`; };
    // dark rooftops behind the back street make the town feel deeper than one row
    const skyline = Array.from({ length: 34 }, (_, i) => {
      const x = 560 + i * 54 + (i * 37) % 23, w = 44 + (i * 13) % 26, h = 40 + (i * 29) % 46, y = rowY('back', x) - 18;
      if (x > 2380 || Math.abs(x - 1515) < 90) return '';
      const roof = i % 3 ? `<path d="M${x - 5} ${y - h}L${x + w / 2} ${y - h - 22}L${x + w + 5} ${y - h}Z" fill="#18152c"/>` : `<rect x="${x - 3}" y="${y - h - 8}" width="${w + 6}" height="8" fill="#18152c"/>`;
      const win = (i * 7) % 4 === 0 ? `<rect x="${x + w / 2 - 4}" y="${y - h + 12}" width="8" height="10" rx="1" fill="#f5d48a" opacity="${.35 + warm * .5}"/>` : '';
      return `<rect x="${x}" y="${y - h}" width="${w}" height="${h + 20}" fill="#141226"/>${roof}${win}`;
    }).join('');
    const lamp = (x, row) => { const y = rowY(row, x) + 4; return `<g><rect x="${x - 2}" y="${y - 54}" width="4" height="54" fill="#3b3352"/><rect x="${x - 7}" y="${y - 66}" width="14" height="14" rx="3" fill="#ffd98a" opacity="${.45 + warm * .5}"/><circle cx="${x}" cy="${y - 59}" r="26" fill="#ffd98a" opacity="${.05 + warm * .12}"/></g>`; };
    const tree = (x, y, r, c) => `<g><rect x="${x - 4}" y="${y - 30}" width="8" height="32" rx="3" fill="#4a3b3a"/><circle cx="${x}" cy="${y - 40}" r="${r}" fill="${c}"/><circle cx="${x - r * .55}" cy="${y - 30}" r="${r * .7}" fill="${c}"/><circle cx="${x + r * .55}" cy="${y - 32}" r="${r * .72}" fill="${c}"/></g>`;
    const hedge = (x, row, w) => { const y = rowY(row, x) + 6; return `<rect x="${x}" y="${y - 12}" width="${w}" height="16" rx="8" fill="#1c372e"/>${Array.from({ length: Math.floor(w / 22) }, (_, i) => `<circle cx="${x + 11 + i * 22}" cy="${y - 13}" r="3" fill="${['#ff9fc3', '#ffe27a', '#a9d8ff'][i % 3]}" opacity=".8"/>`).join('')}`; };
    return `<svg class="lt-scenery" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><defs>
      <linearGradient id="ltSky" x2="0" y2="1"><stop stop-color="#05081a"/><stop offset=".55" stop-color="#110f2a"/><stop offset="1" stop-color="${horizon}"/></linearGradient>
      <linearGradient id="ltSea" x2="0" y2="1"><stop stop-color="#16293f"/><stop offset="1" stop-color="#0a1424"/></linearGradient>
      <linearGradient id="ltHill" x2="0" y2="1"><stop stop-color="#223630"/><stop offset="1" stop-color="#121d21"/></linearGradient>
      <linearGradient id="ltRoad" x2="0" y2="1"><stop stop-color="#433949"/><stop offset="1" stop-color="#2c2536"/></linearGradient>
      <radialGradient id="ltMoon"><stop stop-color="#fff3cf" stop-opacity=".5"/><stop offset="1" stop-color="#fff3cf" stop-opacity="0"/></radialGradient>
      <radialGradient id="ltPool"><stop stop-color="#ffd98a" stop-opacity="${.18 + warm * .3}"/><stop offset="1" stop-color="#ffd98a" stop-opacity="0"/></radialGradient>
      <pattern id="ltStones" width="34" height="16" patternUnits="userSpaceOnUse"><path d="M0 8H34M17 0V8M0 8v8M34 8v8" stroke="#2c2538" stroke-opacity=".4" fill="none" stroke-width="1.2"/></pattern>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#ltSky)"/>${stars}
    <circle cx="2350" cy="120" r="140" fill="url(#ltMoon)"/><path d="M2330 78a46 46 0 1 0 52 66 40 40 0 0 1-52-66Z" fill="#fff1c9"/>
    <path d="M0 420 160 330 300 390 470 300 650 380 820 320 1000 390 1180 330 1360 400 1560 320 1760 395 1960 335 2160 400 2320 350 2460 300 2600 230 2760 200 2920 240 3000 260V900H0Z" fill="#171830" opacity=".95"/>
    ${skyline}
    <path d="M2330 520Q2470 470 2540 440Q2650 380 2760 330Q2830 320 2900 372Q2960 400 3000 410V900H2330Z" fill="url(#ltHill)"/>
    <path d="M2420 500Q2560 440 2650 400T2790 345T2930 390" fill="none" stroke="#c9b7a2" stroke-opacity=".3" stroke-width="7" stroke-dasharray="14 10"/>
    ${field('back', 520, 2460, '#182628')}${field('mid', 520, 3000, '#162423')}${field('front', 460, 3000, '#121e1f')}
    <!-- park stream under the wishing bridge -->
    <path d="M2160 ${rowY('back', 2160) + 24}Q2120 580 2150 650Q2170 760 2110 900H2165Q2222 760 2198 650Q2172 580 2196 ${rowY('back', 2196) + 24}Z" fill="#18304a"/>
    ${road('back', 540, 2460, 24)}${road('mid', 540, 3000, 30)}${road('front', 470, 3000, 50)}
    ${lane(1180, 'back', 'mid', -20)}${lane(1170, 'mid', 'front', 10)}${lane(2390, 'mid', 'front', -10)}${lane(560, 'mid', 'front', -40)}${lane(1880, 'back', 'mid', 15)}
    <!-- the square around the fountain, under the Great Sky Lantern -->
    <ellipse cx="1515" cy="${rowY('mid', 1515) + 18}" rx="190" ry="44" fill="#3d3446"/><ellipse cx="1515" cy="${rowY('mid', 1515) + 18}" rx="190" ry="44" fill="url(#ltStones)"/>
    <g transform="translate(1515 ${rowY('mid', 1515) + 10})"><ellipse rx="70" ry="18" fill="#3e5c7a"/><ellipse rx="70" ry="18" fill="none" stroke="#c9b7a2" stroke-width="6"/><rect x="-6" y="-50" width="12" height="46" fill="#c9b7a2"/><ellipse cy="-52" rx="26" ry="7" fill="#c9b7a2"/><path d="M-4-56q-20 -26 -30 4M4-56q20 -26 30 4" fill="none" stroke="#a9d4ff" stroke-width="3" opacity=".7"/></g>
    <ellipse cx="1515" cy="${rowY('front', 1515) - 70}" rx="260" ry="120" fill="url(#ltPool)"/>
    <!-- harbour: sea with a curved shore, the lake bridge crosses a little inlet -->
    <path d="M0 505Q140 492 270 520Q350 545 330 600Q310 640 420 650Q520 655 545 700Q560 760 520 900H0Z" fill="url(#ltSea)"/>
    <path d="M0 505Q140 492 270 520Q350 545 330 600Q310 640 420 650Q520 655 545 700Q560 760 520 900" fill="none" stroke="#d8c6ae" stroke-opacity=".35" stroke-width="5"/>
    ${Array.from({ length: 14 }, (_, i) => `<path d="M${20 + (i * 151) % 420} ${560 + (i * 37) % 320}h${30 + i % 3 * 12}" stroke="#a9d4ff" stroke-opacity=".15" stroke-width="3" stroke-linecap="round"/>`).join('')}
    <path d="M90 492Q140 470 200 488L210 500H80Z" fill="#2a2638"/>
    ${[[640, 'back'], [1100, 'back'], [1930, 'back'], [700, 'mid'], [1450, 'mid'], [1600, 'mid'], [2330, 'mid'], [820, 'front'], [1320, 'front'], [1720, 'front'], [2030, 'front'], [2560, 'front']].map(([x, r]) => lamp(x, r)).join('')}
    ${[[560, 'back', 22, '#1c3830'], [1135, 'back', 20, '#234035'], [1880, 'back', 22, '#1a302b'], [2300, 'back', 24, '#1c3830'], [540, 'mid', 18, '#234035'], [1150, 'mid', 22, '#1a302b'], [1880, 'mid', 20, '#1c3830'], [2330, 'mid', 24, '#234035'], [2540, 'mid', 18, '#1a302b'], [530, 'front', 20, '#1c3830'], [1880, 'front', 22, '#234035'], [2400, 'front', 24, '#1a302b']].map(([x, r, rr, c]) => tree(x, rowY(r, x) + 4, rr, c)).join('')}
    ${hedge(1050, 'mid', 66)}${hedge(2280, 'front', 88)}${hedge(1580, 'front', 0)}${hedge(2700, 'mid', 44)}
    </svg>`;
  }
  function mixHex(a, b, k) {
    const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
    const A = p(a), B = p(b);
    return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * Math.max(0, Math.min(1, k))).toString(16).padStart(2, '0')).join('');
  }

  // places: TCHeartData.places; state: {lit:[]}; opts: {selected, canLight(place) -> bool, ending}
  function render(places, state, opts = {}) {
    const byArt = Object.fromEntries(places.map(p => [p.art, p]));
    const rows = { back: [], mid: [], front: [] };
    for (const [n, x, row, y, k] of LAYOUT) rows[row].push({ p: byArt['b' + String(n).padStart(2, '0')], n, x, row, y, k });
    const litN = state.lit.length;
    let html = `<div class="lt-world${opts.ending ? ' lt-ending' : ''}" style="--lt-w:${W};--lt-h:${H}">${scenery(litN, places.length)}`;
    let z = 1, chips = '';
    for (const row of ['back', 'mid', 'front']) {
      for (const b of rows[row].sort((a, c) => (a.y || rowY(row, a.x)) - (c.y || rowY(row, c.x)))) {
        if (!b.p) continue;
        if (opts.only && !opts.only.includes(b.p.id)) continue;   // each page shows only its own buildings
        const [aw, ah] = SIZE[b.p.art], s = ROW[row].s * (b.k || 1) * SCALE, w = aw * s, h = ah * s, base = b.y || rowY(row, b.x);
        const lit = opts.ending || state.lit.includes(b.p.id), sel = opts.selected === b.p.id, ready = !lit && opts.canLight && opts.canLight(b.p);
        const style = `left:${(b.x - w / 2) / W * 100}%;top:${(base - h) / H * 100}%;width:${w / W * 100}%;height:${h / H * 100}%;z-index:${z++}`;
        html += `<button type="button" class="lt-place${b.x > 2780 ? ' lt-r' : b.x < 220 ? ' lt-l' : ''}${lit ? ' lit' : ''}${sel ? ' selected' : ''}${ready ? ' ready' : ''}${b.p.story ? ' story' : ''}" data-place="${b.p.id}" style="${style}" aria-pressed="${sel}" aria-label="${b.p.name}${lit ? ', glowing' : ready ? ', ready to light' : ''}">`
          + `<span class="lt-glow" aria-hidden="true"></span><img src="assets/town/${b.p.art}.webp" alt="" draggable="false" loading="lazy">`
          + `<span class="lt-name">${b.p.name}</span>${ready ? '<span class="lt-ready" aria-hidden="true">✦</span>' : ''}</button>`;
        if (!lit && opts.chip) chips += `<span class="lt-chip${ready ? ' ready' : ''}" style="left:${b.x / W * 100}%;top:${(base + 6) / H * 100}%" aria-hidden="true">${opts.chip(b.p)}</span>`;
      }
    }
    return html + `<div class="lt-chips">${chips}</div></div>`;
  }
  // world x of a place, for scrolling the view to it
  function xOf(places, id) { const p = places.find(q => q.id === id); const L = p && LAYOUT.find(l => 'b' + String(l[0]).padStart(2, '0') === p.art); return L ? L[1] / W : .5; }
  // The town is shown as two pages that share the town square, so every building is seen whole
  // on at least one page: [first world x, last world x, title]
  // Every building belongs to exactly one page (no repeats): page 1 = x < SPLIT, page 2 = the rest.
  const SPLIT = 1500;
  const PAGES = [[0, 1500, 'Harbour · Market street · Old town'], [1410, 3000, 'Lantern square · Park · Home lane & hill']];
  function pageOf(places, id) { const x = xOf(places, id) * W; return x < SPLIT ? 0 : 1; }
  function onPage(places, page) { return places.filter(p => pageOf(places, p.id) === page).map(p => p.id); }
  root.TCTown = { render, xOf, pageOf, onPage, PAGES, W, H };
})(typeof window !== 'undefined' ? window : globalThis);
