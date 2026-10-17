  // ---------- cute Moodling art (from the character sheet; drawn with SVG paths) ----------
  const MP = s => new Path2D(s);
  const MOOD_ART = {
    F: { body: MP('M60 34 L74.7 47.8 L92.3 57.5 L83.8 75.7 L80 95.5 L60 93 L40 95.5 L36.2 75.7 L27.7 57.5 L45.3 47.8 Z'), steam: MP('M88 30 q-4 -6 2 -9 q2 -6 8 -3 q6 -1 6 5 q5 3 1 8 z'), mouth: MP('M55 84 Q60 80 65 84'), brows: MP('M44 62 L54 66 M76 62 L66 66') },
    N: { body: MP('M30 70 Q28 58 36 52 Q36 40 50 40 Q56 32 66 38 Q80 36 84 48 Q94 54 90 66 Q96 78 86 86 Q84 98 70 96 Q60 102 50 96 Q36 98 34 86 Q24 80 30 70 Z'), mouth: MP('M54 84 q2 -2 4 0 q2 2 4 0 q2 -2 4 0'), sweat: MP('M86 42 Q91 50 86 53 Q81 50 86 42 Z'), shiver: MP('M20 62 l-5 -2 M19 72 l-6 0 M100 62 l5 -2 M101 72 l6 0') },
    L: { body: MP('M60 26 C66 40 93 58 93 77 A33 29 0 0 1 27 77 C27 58 54 40 60 26 Z'), shine: MP('M53 44 C47 52 41 60 40 68'), brows: MP('M43 63 Q48 61 53 64 M67 64 Q72 61 77 63'), mouth: MP('M56 88 q4 -2.5 8 0'), tear: MP('M80 74 Q83 79 80 81 Q77 79 80 74 Z') },
    E: { mouth: MP('M53 74 Q60 84 67 74 Z'), tongue: MP('M56 78.5 Q60 82 64 78.5 Q60 76.5 56 78.5 Z'), spark: MP('M52.5 58.5 l1 2.5 2.5 1 -2.5 1 -1 2.5 -1 -2.5 -2.5 -1 2.5 -1 z M72.5 58.5 l1 2.5 2.5 1 -2.5 1 -1 2.5 -1 -2.5 -2.5 -1 2.5 -1 z') },
    C: { stem: MP('M60 42 Q58 32 62 26'), leafR: MP('M62 28 Q72 16 86 22 Q78 36 62 28 Z'), leafL: MP('M60 30 Q52 20 40 24 Q46 36 60 30 Z'), eyes: MP('M44 70 q6 -7 12 0 M64 70 q6 -7 12 0'), mouth: MP('M55 80 q5 5 10 0') },
    J: { tail: MP('M86 86 Q106 90 102 70 Q99 60 91 65'), body: MP('M60 28 C64 36 70 38 72 44 C76 40 76 34 78 32 C86 42 90 56 90 70 C90 88 76 98 60 98 C44 98 30 88 30 70 C30 56 36 46 44 40 C46 46 48 48 50 48 C50 40 54 34 60 28 Z'), lids: MP('M44.5 66 Q51 64 57.5 66 M62.5 66 Q69 64 75.5 66'), mouth: MP('M56 85 q4 -3 8 0') },
    G: { body: MP('M60 42 L67 57 L84 59 L71.5 70.5 L75 87 L60 79 L45 87 L48.5 70.5 L36 59 L53 57 Z'), eyes: MP('M51 66 q3.5 -4 7 0 M62 66 q3.5 -4 7 0'), mouth: MP('M57 72 q3 3 6 0') }
  };
  const glowCache = {};
  function glowImg(c) {
    if (glowCache[c]) return glowCache[c];
    const o = document.createElement('canvas'); o.width = o.height = 96; const g = o.getContext('2d');
    const gr = g.createRadialGradient(48, 48, 4, 48, 48, 48); gr.addColorStop(0, c); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.globalAlpha = .5; g.fillStyle = gr; g.fillRect(0, 0, 96, 96); return (glowCache[c] = o);
  }
  function mEll(x, y, rx, ry, rot, fill, stroke, lw) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot, 0, 7); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 2.5; ctx.stroke(); } }
  function mStroke(p, c, w) { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke(p); }
  function mEyes(lx, rx, y, rw, rh, c, look, hi) {
    mEll(lx + look, y, rw, rh, 0, c); mEll(rx + look, y, rw, rh, 0, c);
    if (hi) { mEll(lx + look + rw * .35, y - rh * .35, hi, hi, 0, '#fff'); mEll(rx + look + rw * .35, y - rh * .35, hi, hi, 0, '#fff'); mEll(lx + look - rw * .3, y + rh * .45, hi * .45, hi * .45, 0, '#fff'); mEll(rx + look - rw * .3, y + rh * .45, hi * .45, hi * .45, 0, '#fff'); }
  }
  // draws one Moodling centred on (x, y); k = size, o = per-state options
  function drawCuteMood(type, x, y, k, o = {}) {
    const A = MOOD_ART[type], body = o.color;
    ctx.save(); ctx.translate(x, y);
    const gl = glowImg(o.glow || body); const gs = 120 * k; ctx.drawImage(gl, -gs / 2, -gs / 2, gs, gs);
    ctx.scale(k * (o.flip || 1) * (o.sx || 1), k * (o.sy || 1)); ctx.translate(-60, -(o.cy || 66));
    const look = o.look || 0;
    if (type === 'F') {
      mEll(48, 100, 8, 5, 0, '#E04848', '#5A0D16', 2.5); mEll(72, 100, 8, 5, 0, '#E04848', '#5A0D16', 2.5);
      mStroke(A.body, '#5A0D16', 15); mStroke(A.body, body, 9); ctx.fillStyle = body; ctx.fill(A.body);
      if (o.flash) { ctx.globalAlpha *= o.flash; mStroke(A.body, '#fff', 9); ctx.fillStyle = '#fff'; ctx.fill(A.body); ctx.globalAlpha /= o.flash; }
      mEll(50, 52, 9, 5, 0, 'rgba(255,190,180,.8)');
      mEll(42, 80, 6, 4, 0, '#FF9EB0'); mEll(78, 80, 6, 4, 0, '#FF9EB0');
      if (o.dizzy) {
        ctx.strokeStyle = '#3A0A10'; ctx.lineWidth = 2.5;
        [51, 69].forEach(ex => { ctx.beginPath(); ctx.arc(ex, 72, 4.5, o.t * 8, o.t * 8 + 5); ctx.stroke(); });
        mEll(60, 85, 3.5, 3, 0, '#3A0A10');
      } else {
        mStroke(A.brows, '#5A0D16', 3); mEyes(51, 69, 72, 4.5, 5.5, '#3A0A10', look, 1.8); mStroke(A.mouth, '#3A0A10', 2.5);
        ctx.fillStyle = 'rgba(236,230,245,.85)'; ctx.fill(A.steam);
      }
    } else if (type === 'N') {
      mEll(48, 100, 7, 4.5, 0, '#8A5CE6', '#2E1760', 2.5); mEll(72, 100, 7, 4.5, 0, '#8A5CE6', '#2E1760', 2.5);
      ctx.fillStyle = body; ctx.fill(A.body); mStroke(A.body, '#2E1760', 3);
      mEll(50, 52, 9, 5, 0, 'rgba(217,199,255,.8)');
      mEyes(50, 70, 69, 7, 8.5, '#2E1760', look, 3);
      mEll(40, 81, 5, 3.2, 0, 'rgba(255,158,200,.8)'); mEll(80, 81, 5, 3.2, 0, 'rgba(255,158,200,.8)');
      mStroke(A.mouth, '#2E1760', 2.2);
      if (o.panic || o.alarm) { ctx.fillStyle = '#BDEBFF'; ctx.fill(A.sweat); mStroke(A.sweat, '#2E1760', 1.5); mStroke(A.shiver, '#D9C7FF', 2.5); }
    } else if (type === 'L') {
      ctx.fillStyle = body; ctx.fill(A.body); mStroke(A.body, '#10306B', 3); mStroke(A.shine, 'rgba(191,224,255,.8)', 5);
      mEyes(50, 70, 74, 7.5, 8.5, '#10306B', look, 3.4); mStroke(A.brows, '#10306B', 2.2);
      mEll(39, 86, 5, 3.2, 0, 'rgba(255,158,194,.8)'); mEll(81, 86, 5, 3.2, 0, 'rgba(255,158,194,.8)');
      mStroke(A.mouth, '#10306B', 2.2); mEll(54, 98, 6, 4.5, 0, '#7DBBFF', '#10306B', 2.2); mEll(66, 98, 6, 4.5, 0, '#7DBBFF', '#10306B', 2.2);
      ctx.fillStyle = '#E2F2FF'; ctx.fill(A.tear);
    } else if (type === 'E') {
      const up = o.armsUp ?? 1;
      mEll(28, 48 + (1 - up) * 26, 6, 8, -.5 * up, '#FFD23F', '#6B4A00', 2.5); mEll(92, 48 + (1 - up) * 26, 6, 8, .5 * up, '#FFD23F', '#6B4A00', 2.5);
      mEll(50, 96, 7, 4.5, 0, '#F2B90F', '#6B4A00', 2.5); mEll(70, 96, 7, 4.5, 0, '#F2B90F', '#6B4A00', 2.5);
      mEll(60, 64, 30, 30, 0, body, '#6B4A00', 3); mEll(49, 48, 10, 6, 0, 'rgba(255,243,184,.9)');
      mEyes(50, 70, 64, 6.5, 7.5, '#4A3300', look, 0); ctx.fillStyle = '#fff'; ctx.save(); ctx.translate(look, 0); ctx.fill(A.spark); ctx.restore();
      mEll(40, 74, 5, 3.2, 0, '#FF9E8A'); mEll(80, 74, 5, 3.2, 0, '#FF9E8A');
      ctx.fillStyle = '#7A3A00'; ctx.fill(A.mouth); mStroke(A.mouth, '#6B4A00', 2); ctx.fillStyle = '#FF7A8A'; ctx.fill(A.tongue);
    } else if (type === 'C') {
      mStroke(A.stem, '#0F4D2C', 3); ctx.fillStyle = '#7BEAAE'; ctx.fill(A.leafR); ctx.fill(A.leafL); mStroke(A.leafR, '#0F4D2C', 2.5); mStroke(A.leafL, '#0F4D2C', 2.5);
      mEll(49, 99, 7, 4.5, 0, '#33B873', '#0F4D2C', 2.5); mEll(71, 99, 7, 4.5, 0, '#33B873', '#0F4D2C', 2.5);
      mEll(60, 70, 31, 28, 0, body, '#0F4D2C', 3); mEll(48, 54, 9, 5, 0, 'rgba(182,245,210,.85)');
      mStroke(A.eyes, '#0F4D2C', 3); mEll(41, 79, 5.5, 3.4, 0, 'rgba(255,158,194,.8)'); mEll(79, 79, 5.5, 3.4, 0, 'rgba(255,158,194,.8)'); mStroke(A.mouth, '#0F4D2C', 2.5);
    } else if (type === 'S') {
      const hy = o.handsY ?? 85;
      mEll(60, 34, 8, 11, 0, '#FFB0D4', '#6B1640', 2.5); mEll(46, 38, 8, 11, -.6, '#FFB0D4', '#6B1640', 2.5); mEll(74, 38, 8, 11, .6, '#FFB0D4', '#6B1640', 2.5);
      mEll(60, 70, 28, 28, 0, body, '#6B1640', 3); mEll(49, 55, 8, 4.5, 0, 'rgba(255,204,228,.85)');
      mEyes(51, 69, 66, 6, 7, '#6B1640', look, 2.6);
      mEll(41, 74, 6.5, 4, 0, 'rgba(255,61,139,.7)'); mEll(79, 74, 6.5, 4, 0, 'rgba(255,61,139,.7)');
      mEll(50, hy, 10, 11, -.35, '#FFC2DE', '#6B1640', 2.5); mEll(70, hy, 10, 11, .35, '#FFC2DE', '#6B1640', 2.5);
    } else if (type === 'J') {
      mStroke(A.tail, '#6B2E06', 10); mStroke(A.tail, body, 5);
      mEll(49, 100, 7, 4.5, 0, '#EE7E1E', '#6B2E06', 2.5); mEll(71, 100, 7, 4.5, 0, '#EE7E1E', '#6B2E06', 2.5);
      ctx.fillStyle = body; ctx.fill(A.body); mStroke(A.body, '#6B2E06', 3); mEll(48, 56, 8, 4.5, 0, 'rgba(255,211,160,.85)');
      mEll(51, 70, 6.5, 7.5, 0, '#fff', '#6B2E06', 2); mEll(69, 70, 6.5, 7.5, 0, '#fff', '#6B2E06', 2);
      mEll(51 - 4, 72, 3.5, 4.5, 0, '#4A1E00'); mEll(69 - 4, 72, 3.5, 4.5, 0, '#4A1E00');
      if (o.tired) { ctx.fillStyle = body; ctx.fillRect(43, 61, 16, 8); ctx.fillRect(61, 61, 16, 8); }
      mStroke(A.lids, '#6B2E06', 2.5);
      mEll(40, 81, 7, 5, 0, 'rgba(255,122,106,.75)'); mEll(80, 81, 7, 5, 0, 'rgba(255,122,106,.75)'); mStroke(A.mouth, '#6B2E06', 2.5);
    } else if (type === 'G') {
      ctx.beginPath(); ctx.ellipse(60, 30, 13, 3.5, 0, 0, 7); ctx.strokeStyle = '#FFF6D0'; ctx.lineWidth = 2.5; ctx.stroke();
      mStroke(A.body, '#8A5A00', 13); mStroke(A.body, '#FFE27A', 7); ctx.fillStyle = '#FFE27A'; ctx.fill(A.body);
      mEll(55, 52, 5, 3, 0, 'rgba(255,255,255,.85)'); mStroke(A.eyes, '#8A5A00', 2.4);
      mEll(48, 72, 3.6, 2.4, 0, '#FFAE8A'); mEll(72, 72, 3.6, 2.4, 0, '#FFAE8A'); mStroke(A.mouth, '#8A5A00', 2.2);
    }
    ctx.restore();
  }
