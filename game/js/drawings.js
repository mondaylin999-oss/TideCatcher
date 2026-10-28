/* Thiri's Sketchbook: six crayon drawings, one for each place she loved (and a last one for all of her
   feelings). Each is torn into 6 pieces that Shwe finds on Endless Nights. Drawn as SVG in a child's crayon
   style (wobbly lines, waxy grain) and shown as images, so the filters work anywhere on the page. */
(function (root) {
  'use strict';
  const W = 400, H = 300;
  // waxy crayon: grainy fill + a little wobble on every edge
  const DEFS = `<filter id="cr" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="3" result="n"/>
    <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.25 1.42" result="m"/>
    <feComposite in="SourceGraphic" in2="m" operator="in" result="g"/><feTurbulence type="turbulence" baseFrequency=".03" numOctaves="2" seed="7" result="w"/>
    <feDisplacementMap in="g" in2="w" scale="5" xChannelSelector="R" yChannelSelector="G"/></filter>
    <filter id="wob"><feTurbulence type="turbulence" baseFrequency=".04" numOctaves="2" seed="2" result="w"/><feDisplacementMap in="SourceGraphic" in2="w" scale="4" xChannelSelector="R" yChannelSelector="G"/></filter>
    <pattern id="paper" width="40" height="40" patternUnits="userSpaceOnUse"><rect width="40" height="40" fill="#fbf6e6"/><path d="M0 39.5H40" stroke="#dfe7f3" stroke-width="1"/></pattern>`;
  const s = (d, c, w = 4) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const f = (d, c) => `<path d="${d}" fill="${c}"/>`;
  const circ = (x, y, r, c, line = '') => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"${line ? ` stroke="${line}" stroke-width="3"` : ''}/>`;
  const sun = (x, y, r = 26) => circ(x, y, r, '#ffd23f') + Array.from({ length: 10 }, (_, i) => { const a = i * Math.PI / 5; return s(`M${x + Math.cos(a) * (r + 6)} ${y + Math.sin(a) * (r + 6)}L${x + Math.cos(a) * (r + 18)} ${y + Math.sin(a) * (r + 18)}`, '#ffb703', 4); }).join('') + s(`M${x - 9} ${y + 4}q9 9 18 0`, '#c76b00', 3) + circ(x - 8, y - 5, 2.6, '#7a4100') + circ(x + 8, y - 5, 2.6, '#7a4100');
  const cloud = (x, y, k = 1) => `<g transform="translate(${x} ${y}) scale(${k})">${circ(0, 0, 16, '#fff')}${circ(18, -6, 20, '#fff')}${circ(38, 0, 15, '#fff')}${s('M-14 6q28 10 64 0', '#bcd3ef', 3)}</g>`;
  // a kid-drawn person: round head, triangle dress (or shirt), stick limbs, big smile
  function kid(x, y, o = {}) {
    const k = o.k || 1, dress = o.dress || '#ff6b9a', hair = o.hair || '#5a3420', armUp = o.armUp || 0;
    return `<g transform="translate(${x} ${y}) scale(${k})">
      ${s(`M-8 40L-12 66M8 40L12 66`, '#5a3a2a', 4)}${s(`M-12 66h-7M12 66h7`, '#5a3a2a', 4)}
      ${o.pants ? f('M-15 8h30l3 34h-36z', dress) : f('M0 6L-19 44H19Z', dress)}
      ${s(`M-9 14L-26 ${30 - armUp * 34}M9 14L26 ${30 - armUp * 34 * (o.oneArm ? 0 : 1)}`, '#e9a37a', 4)}
      ${circ(0, -8, 15, '#f7c9a3')}
      ${f('M-16 -10q0-20 16-20t16 20q-4-10-16-9q-12-1-16 9z', hair)}${o.long ? f('M-16 -10q-6 18 2 26l3-20zM16 -10q6 18-2 26l-3-20z', hair) : ''}
      ${o.bow ? f('M-6 -26l-9-6v12zM-6 -26l9-6v12z', o.bow) : ''}
      ${circ(-5, -9, 2.2, '#3a2418')}${circ(5, -9, 2.2, '#3a2418')}${s('M-6 -2q6 6 12 0', '#c0392b', 2.5)}
      ${circ(-10, -3, 3, 'rgba(255,120,140,.45)')}${circ(10, -3, 3, 'rgba(255,120,140,.45)')}</g>`;
  }
  const cat = (x, y, k = 1) => `<g transform="translate(${x} ${y}) scale(${k})">${f('M-26 8q-4-26 22-28q26 0 26 22q0 14-24 14q-22 0-24-8z', '#f39a3d')}
    ${s('M22 0q20-6 14-28', '#f39a3d', 7)}${circ(-14, -22, 15, '#f39a3d')}${f('M-27 -30l2-16l10 9zM-1 -30l-2-16l-10 9z', '#f39a3d')}
    ${s('M-20 -22l3 0M-9 -22l3 0', '#3a2418', 3)}${s('M-17 -15q3 3 6 0', '#3a2418', 2)}${s('M-8 0l2 8M2 2l2 8M-18 4l-2 6', '#d97c22', 3)}</g>`;
  const mood = (x, y, c, face = 'smile', k = 1) => `<g transform="translate(${x} ${y}) scale(${k})">${circ(0, 0, 17, c, 'rgba(60,30,40,.55)')}${circ(-6, -3, 2.4, '#2b1b2e')}${circ(6, -3, 2.4, '#2b1b2e')}${face === 'sad' ? s('M-6 8q6-5 12 0', '#2b1b2e', 2.2) : face === 'o' ? circ(0, 7, 3, '#2b1b2e') : s('M-6 5q6 6 12 0', '#2b1b2e', 2.2)}</g>`;
  const grass = (y, c = '#4caf50') => f(`M0 ${y}q100-14 200 0t200 0V300H0z`, c) + Array.from({ length: 26 }, (_, i) => s(`M${8 + i * 15} ${y + 6}l-3-10M${12 + i * 15} ${y + 6}l2-9`, '#2f8a3a', 2)).join('');
  const label = t => `<text x="200" y="290" font-family="'Comic Sans MS','Chalkboard SE','Gaegu',cursive" font-size="19" font-weight="700" text-anchor="middle" fill="#2f3fb0" stroke="#fbf6e6" stroke-width="4" paint-order="stroke">${t}</text>`;

  const ART = {
    school: () => `${f('M0 0h400v210H0z', '#ffe9b0')}${f('M0 210h400v90H0z', '#c98a52')}${s('M0 212h400', '#8a5a33', 4)}
      ${f('M30 30h150v95H30z', '#2f5d50')}${s('M30 30h150v95H30z', '#7a4a2a', 6)}${s('M48 60l10-18l10 18M52 52h12', '#fff', 3)}${s('M82 42v18q14 0 14-9q0-9-14-9M82 51q16 0 16 9q0 9-16 0', '#fff', 3)}${s('M120 46q-12-6-14 6q-2 12 14 8', '#fff', 3)}${s('M44 100q40-10 120 0', '#ffd23f', 3)}
      ${f('M250 25h120v95H250z', '#9fd8ff')}${s('M250 25h120v95H250zM310 25v95M250 72h120', '#fff', 6)}${sun(340, 52, 15)}${cloud(262, 50, .6)}
      ${f('M90 190h220v14H90z', '#9b6a40')}${s('M100 204v40M300 204v40', '#6b4426', 6)}
      ${kid(150, 140, { dress: '#ff6b9a', bow: '#ff3d7f', long: 1, armUp: .15 })}${kid(255, 140, { dress: '#6ab7ff', hair: '#2b1b14' })}
      ${f('M170 178h60v14h-60z', '#fff')}${sun(200, 184, 6)}${s('M120 186l14-6M268 186l14-8', '#e63946', 5)}${s('M276 182l10-4', '#2a9d8f', 5)}
      `,
    park: () => `${f('M0 0h400v300H0z', '#bfe6ff')}${sun(345, 52)}${cloud(40, 50)}${cloud(170, 34, .8)}${grass(232)}
      ${s('M60 232L110 60L160 232M240 232L290 60L340 232M100 62h200', '#c0392b', 7)}
      ${s('M150 64v108M190 64v108', '#6b4426', 2.5)}${f('M138 172h64v9h-64z', '#8d5524')}${s('M230 64q8 50 20 104M270 64q-4 52 6 106', '#6b4426', 2.5)}${f('M236 166l52 8l-2 9l-52-8z', '#8d5524')}
      ${kid(170, 118, { dress: '#ff6b9a', bow: '#ff3d7f', long: 1, armUp: .6 })}${kid(262, 112, { dress: '#ffd23f', hair: '#2b1b14', armUp: .6, k: 1 })}
      ${s('M30 232q5-80 30-110', '#7a4a2a', 10)}${circ(40, 120, 34, '#3fa34d')}${circ(70, 140, 26, '#4caf50')}${circ(18, 146, 24, '#4caf50')}
      ${s('M330 120q8-8 16 0M350 110q8-8 16 0', '#555', 2.5)}`,
    festival: () => `${f('M0 0h400v300H0z', '#20234f')}${Array.from({ length: 18 }, (_, i) => circ(15 + i * 22, 20 + (i * 37) % 70, 2.2, '#fff6b0')).join('')}
      ${f('M320 160l20-70l20 70z', '#ffcf4d')}${f('M310 165h60v12h-60z', '#ffcf4d')}${s('M340 90v-26', '#ffcf4d', 4)}${circ(340, 62, 4, '#fff')}
      ${f('M0 196q100-14 200 0t200 0V300H0z', '#2c5aa0')}${s('M20 230q30-8 60 0M150 250q30-8 60 0M280 225q30-8 60 0', '#7fb3ff', 3)}
      ${[[60, 70], [120, 40], [190, 80], [250, 50], [300, 110], [90, 130]].map(([x, y]) => `${f(`M${x - 11} ${y}h22l-4 26h-14z`, '#ff9f43')}${circ(x, y + 10, 4, '#ffe08a')}${s(`M${x} ${y + 26}v8`, '#ffe08a', 2)}`).join('')}
      ${[[70, 232], [210, 244], [320, 228]].map(([x, y]) => `${f(`M${x - 14} ${y}h28l-4 10h-20z`, '#ffb347')}${circ(x, y - 6, 6, '#ffe08a')}`).join('')}
      ${kid(140, 168, { dress: '#ff6b9a', bow: '#ff3d7f', long: 1, k: .9, armUp: .1 })}${kid(185, 160, { dress: '#9b59b6', hair: '#cfcfcf', k: 1.05 })}${s('M156 182q8 4 13 0', '#e9a37a', 4)}
      `,
    hill: () => `${f('M0 0h400v300H0z', '#9fd8ff')}${cloud(30, 40)}${cloud(250, 30, .9)}${sun(360, 44, 20)}
      ${f('M0 210q120-110 260-40t140 10V300H0z', '#6cc070')}${f('M0 250q200-40 400 0V300H0z', '#4caf50')}
      ${f('M250 70l26-28l26 28l-26 30z', '#e63946')}${s('M250 70h52M276 42v58', '#fff', 2)}${s('M276 100q-20 30 0 50t-10 50', '#555', 2)}${[0, 1, 2].map(i => f(`M${270 - i * 4} ${118 + i * 24}l8 4l-8 4z`, ['#ffd23f', '#6ab7ff', '#ff6b9a'][i])).join('')}
      ${s('M266 200L232 150', '#555', 2)}
      ${kid(150, 150, { dress: '#ff6b9a', bow: '#ff3d7f', long: 1, k: .9, armUp: .9, oneArm: 1 })}${kid(220, 140, { pants: 1, dress: '#2a9d8f', hair: '#2b1b14', k: 1.1, armUp: .8, oneArm: 1 })}
      ${s('M40 120q20-10 40 0q-20 10-40 0M60 150q14-8 28 0', '#fff', 3)}${s('M120 60q6-6 12 0q6-6 12 0', '#555', 2.5)}`,
    lake: () => `${f('M0 0h400v300H0z', '#ffd9a8')}${circ(300, 120, 34, '#ff8a5b')}${f('M0 140q200-20 400 0V300H0z', '#5aa9e6')}
      ${s('M240 170h120M260 186h80M280 200h40', '#ffcf9a', 4)}${f('M0 222q120-24 230 0t170 0V300H0z', '#7bc96f')}
      ${[[110, 170], [160, 182]].map(([x, y]) => `${f(`M${x - 16} ${y}q16 12 32 0q-6-12-16-10z`, '#fff')}${circ(x + 12, y - 10, 7, '#fff')}${f(`M${x + 18} ${y - 11}l8 2l-8 3z`, '#ff9f1c')}${circ(x + 13, y - 12, 1.6, '#222')}`).join('')}
      ${s('M30 222v-50M44 222v-60M56 222v-44', '#3c8d40', 4)}${f('M26 172h8v-16h-8zM40 162h8v-16h-8z', '#8d5524')}
      ${kid(230, 222, { dress: '#ff6b9a', bow: '#ff3d7f', long: 1, k: .95 })}${cat(300, 250, .95)}${s('M246 236q20 0 34 6', '#e9a37a', 4)}
      `,
    all: () => `${f('M0 0h400v300H0z', '#fff4fb')}${['#e63946', '#ff9f1c', '#ffd23f', '#4caf50', '#4dabf7', '#9b59b6'].map((c, i) => s(`M${20 + i * 9} 250A${180 - i * 9} ${180 - i * 9} 0 0 1 ${380 - i * 9} 250`, c, 8)).join('')}
      ${f('M200 150c-30-34-80 0-40 40l40 36l40-36c40-40-10-74-40-40z', '#ff6b9a')}
      ${kid(200, 168, { dress: '#ff6b9a', bow: '#ff3d7f', long: 1, armUp: .9 })}${cat(255, 254, .7)}
      ${mood(70, 120, '#ff5a5f', 'sad')}${mood(110, 72, '#9b7bff', 'o')}${mood(165, 46, '#5aa9ff')}${mood(235, 46, '#ff8fc3')}${mood(290, 72, '#ffd23f')}${mood(330, 120, '#ff9f43', 'o')}${mood(90, 200, '#a0703c')}${mood(312, 200, '#5fd38a')}
      `
  };
  const LIST = [
    { id: 'school', place: 'school', title: 'Hnin and me drawing at school', memory: 'Hnin always shared her blue crayon with me. We drew the same sun.' },
    { id: 'park', place: 'park', title: 'Hnin and me on the swing', memory: 'We swung so high we said we could touch the clouds.' },
    { id: 'festival', place: 'festival', title: 'Lanterns over the river', memory: 'Grandma held my hand. She said every light is a wish that someone keeps.' },
    { id: 'hill', place: 'hill', title: 'Kites on the windy hill', memory: 'The string slipped and the kite flew away. Papa laughed, so I laughed too.' },
    { id: 'lake', place: 'lake', title: 'Shwe and me by the lake', memory: 'Shwe watched the ducks. I watched Shwe. It was the quietest, nicest day.' },
    { id: 'all', place: null, title: 'All of my feelings', memory: 'Even the angry ones. Even the shy ones. They are all mine, and that is okay.' }
  ];
  // 3 × 2 torn pieces: shared jagged seams so neighbours fit together
  const nm = t => t.replace(/Shwe/g, (root.MK_PROFILE && root.MK_PROFILE.cat) || 'Shwe').replace(/Thiri/g, (root.MK_PROFILE && root.MK_PROFILE.girl) || 'Thiri').replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const COLS = 3, ROWS = 2;
  const jag = (x0, y0, x1, y1, seed) => { const pts = []; const n = 7; for (let i = 0; i <= n; i++) { const t = i / n, j = i === 0 || i === n ? 0 : (Math.sin(seed * 12.9 + i * 78.2) * 43758.5 % 1) * 9; pts.push([x0 + (x1 - x0) * t + (x0 === x1 ? j : 0), y0 + (y1 - y0) * t + (y0 === y1 ? j : 0)]); } return pts; };
  function piecePath(i) {
    const c = i % COLS, r = Math.floor(i / COLS), x0 = c * W / COLS, x1 = (c + 1) * W / COLS, y0 = r * H / ROWS, y1 = (r + 1) * H / ROWS;
    const top = r === 0 ? [[x0, y0], [x1, y0]] : jag(x0, y0, x1, y0, 10 + c);
    const right = c === COLS - 1 ? [[x1, y0], [x1, y1]] : jag(x1, y0, x1, y1, 20 + c * 3 + r);
    const bottom = r === ROWS - 1 ? [[x1, y1], [x0, y1]] : jag(x0, y1, x1, y1, 10 + c).reverse();
    const left = c === 0 ? [[x0, y1], [x0, y0]] : jag(x0, y0, x0, y1, 20 + (c - 1) * 3 + r).reverse();
    return 'M' + [...top, ...right, ...bottom, ...left].map(p => p.map(v => v.toFixed(1)).join(' ')).join('L') + 'Z';
  }
  // the drawing as an SVG string: only the pieces found so far, the rest as faint dashed gaps
  function svg(id, have = [0, 1, 2, 3, 4, 5]) {
    const art = ART[id] ? ART[id]() : '';
    const set = new Set(have), all = set.size >= COLS * ROWS;
    const clip = all ? '' : `<clipPath id="have">${[...set].map(i => `<path d="${piecePath(i)}"/>`).join('')}</clipPath>`;
    const gaps = all ? '' : Array.from({ length: COLS * ROWS }, (_, i) => set.has(i) ? '' : `<path d="${piecePath(i)}" fill="rgba(120,110,150,.08)" stroke="#b9b0cc" stroke-width="2" stroke-dasharray="6 6"/>`).join('');
    const seams = all ? '' : [...set].map(i => `<path d="${piecePath(i)}" fill="none" stroke="rgba(120,90,60,.35)" stroke-width="1.2"/>`).join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><defs>${DEFS}${clip}</defs>
      <rect width="${W}" height="${H}" fill="url(#paper)"/>${gaps}
      <g ${all ? '' : 'clip-path="url(#have)"'}><g filter="url(#cr)">${art}</g><g filter="url(#wob)">${label(nm((LIST.find(d => d.id === id) || {}).title || ''))}</g></g>${seams}</svg>`;
  }
  const url = (id, have) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg(id, have));
  root.TCDrawings = { LIST, svg, url, piecePath, W, H };
})(typeof window !== 'undefined' ? window : globalThis);
