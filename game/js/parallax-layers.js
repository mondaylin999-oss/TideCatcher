/* Small, low-cost skyline and foreground silhouettes for every Night Side map. */
(function (root) {
  'use strict';
  const MAPS = {
    school: { far: '#29243d', light: 'rgba(255,220,160,.44)', near: '#30494a', accent: '#799281', kind: 'school' },
    rooftop: { far: '#252d42', light: 'rgba(255,220,160,.46)', near: '#353448', accent: '#8f8291', kind: 'roof' },
    park: { far: '#202747', light: 'rgba(205,225,255,.42)', near: '#174f48', accent: '#65a88a', kind: 'leaves' },
    festival: { far: '#302044', light: 'rgba(255,211,135,.5)', near: '#4a293c', accent: '#d78c7b', kind: 'festival' },
    hill: { far: '#292447', light: 'rgba(226,218,255,.4)', near: '#254844', accent: '#658773', kind: 'hill' },
    lake: { far: '#1e2945', light: 'rgba(255,224,170,.42)', near: '#1e554e', accent: '#68a89c', kind: 'reeds' },
    market: { far: '#302044', light: 'rgba(255,191,129,.5)', near: '#47293e', accent: '#c86e87', kind: 'market' },
    garden: { far: '#34305b', light: 'rgba(255,224,155,.48)', near: '#315d54', accent: '#80aa76', kind: 'garden' },
    pagoda: { far: '#273349', light: 'rgba(232,211,163,.42)', near: '#3d4a43', accent: '#aa9673', kind: 'pagoda' },
    train: { far: '#252c3b', light: 'rgba(238,212,155,.42)', near: '#333542', accent: '#88858a', kind: 'train' },
    free: { far: '#263244', light: 'rgba(209,228,232,.4)', near: '#2d4946', accent: '#718c83', kind: 'leaves' }
  };
  let bitmapCache = null;

  function repeat(g, o, speed, step, draw) {
    const phase = o.cam * speed;
    const first = Math.floor(phase / step) - 1;
    const last = Math.ceil((phase + o.width) / step) + 1;
    // The caller is in world space (the main renderer has translated by -cam).
    // Add cam back, then subtract the layer's own travel speed.
    g.save(); g.translate(o.cam - phase, 0);
    for (let i = first; i <= last; i++) draw(g, i * step, i);
    g.restore();
  }

  function skyline(g, o, p, kind) {
    // School hallways already provide a night skyline through their windows; an extra
    // city silhouette here floats over the indoor walls like a row of dark towers.
    if (kind === 'school') return;
    const base = o.ground - (kind === 'train' ? 144 : 132);
    g.fillStyle = p.far;
    if (['park', 'hill', 'lake', 'free'].includes(kind)) {
      g.beginPath(); g.moveTo(-40, base + 80);
      for (let x = -40; x <= 300; x += 38) {
        const h = 30 + Math.abs(Math.sin(x * .031 + kind.length)) * 54;
        g.lineTo(x, base + 36 - h);
      }
      g.lineTo(320, base + 80); g.closePath(); g.fill();
      for (const x of [38, 126, 218]) {
        const h = 48 + Math.abs(Math.sin(x * .09 + kind.length)) * 32;
        g.beginPath(); g.moveTo(x - 20, base + 35); g.lineTo(x, base + 35 - h); g.lineTo(x + 20, base + 35); g.closePath(); g.fill();
      }
    } else if (['festival', 'garden', 'pagoda'].includes(kind)) {
      for (const x of [42, 142, 242]) {
        const y = base + 36, h = kind === 'pagoda' ? 60 : 46, w = 48;
        g.fillRect(x - 15, y - h + 20, 30, h - 20);
        for (let row = 0; row < 2; row++) {
          const yy = y - h + row * 18;
          g.beginPath(); g.moveTo(x - w / 2 - 8, yy + 8); g.lineTo(x, yy - 4); g.lineTo(x + w / 2 + 8, yy + 8); g.closePath(); g.fill();
        }
        g.fillStyle = p.light; g.fillRect(x - 3, y - h + 28, 6, 8); g.fillStyle = p.far;
      }
    } else {
      for (let x = 20; x < 310; x += 78) {
        const h = 58 + Math.abs(Math.sin(x * .067 + kind.length)) * 90, w = 34 + (x % 3) * 3;
        g.fillRect(x, base - h, w, h + 80);
        if (kind === 'roof') {
          g.beginPath(); g.moveTo(x - 5, base - h + 4); g.lineTo(x + w / 2, base - h - 12); g.lineTo(x + w + 5, base - h + 4); g.closePath(); g.fill();
        }
        if (kind === 'school' || kind === 'market' || kind === 'train') {
          g.fillStyle = p.light;
          for (let wy = base - h + 14; wy < base - h + 50; wy += 24) g.fillRect(x + 8, wy, 5, 7);
          g.fillStyle = p.far;
        }
      }
    }
    g.fillStyle = p.light;
    for (let i = 0; i < 3; i++) {
      const x = 34 + i * 101, y = base + 5 - (i % 2) * 14;
      g.globalAlpha = .52; g.fillRect(x, y, 3, 3); g.globalAlpha = 1;
    }
  }

  function foreground(g, o, p, kind, tile) {
    const ground = o.ground, sway = o.reduced ? 0 : Math.sin(o.time * .75) * 1.8;
    // Sparse framing details sit beneath Shwe and the Moodlings and do not alter collision geometry.
    if (['leaves', 'reeds', 'hill', 'garden'].includes(kind)) {
      const side = tile % 2 ? 1 : -1;
      {
        const x = side < 0 ? 22 : 278, base = ground + 54;
        for (let stem = 0; stem < 2; stem++) {
          const sx = x + stem * 12 * side, top = ground - 14 - (stem % 2) * 13;
          g.strokeStyle = p.accent; g.lineWidth = 2.4; g.beginPath(); g.moveTo(sx, base); g.quadraticCurveTo(sx + sway, ground + 12, sx + side * 6, top); g.stroke();
          for (let leaf = 0; leaf < 2; leaf++) {
            const ly = ground + 30 - leaf * 18;
            g.globalAlpha = .68; g.fillStyle = leaf % 2 ? p.near : p.accent;
            g.beginPath(); g.ellipse(sx + side * (9 + sway), ly, 9, 3.7, side * -.35, 0, Math.PI * 2); g.fill(); g.globalAlpha = 1;
          }
        }
      }
      if (kind === 'reeds') {
        g.strokeStyle = p.accent; g.lineWidth = 2;
        for (let i = 0; i < 3; i++) { const x = 105 + i * 26 + sway; g.beginPath(); g.moveTo(x, ground + 35); g.quadraticCurveTo(x - 4, ground + 10, x + 3, ground - 24 - (i % 3) * 8); g.stroke(); }
      }
    } else if (kind === 'festival' || kind === 'market') {
      // Low, intermittent stall posts and bunting add a nearer plane without cluttering the route.
      g.strokeStyle = p.near; g.lineWidth = 4;
      for (const x of [tile % 2 ? 258 : 44]) {
        g.beginPath(); g.moveTo(x, ground + 42); g.lineTo(x, ground - 4); g.stroke();
        g.strokeStyle = p.accent; g.lineWidth = 1.4; g.beginPath(); g.moveTo(x - 17, ground - 10); g.quadraticCurveTo(x, ground + 4, x + 18, ground - 10); g.stroke();
        g.fillStyle = p.accent; g.beginPath(); g.arc(x, ground - 1, 4, 0, Math.PI * 2); g.fill();
        g.strokeStyle = p.near; g.lineWidth = 4;
      }
    } else {
      // A low railing/coping strip: visible along the near edge, safely below the playable floor.
      g.strokeStyle = p.near; g.lineWidth = 3;
      for (const y of [ground + 16, ground + 37]) {
        for (let x = 0; x < 320; x += 44) {
          const worldX = tile * 320 + x + 22;
          if ((o.pits || []).some(([a, b]) => worldX >= a - 16 && worldX <= b + 16)) continue;
          g.beginPath(); g.moveTo(x, y); g.lineTo(x + 40, y); g.stroke();
        }
      }
      for (let x = 18; x < 320; x += 48) {
        const worldX = tile * 320 + x;
        if ((o.pits || []).some(([a, b]) => worldX >= a && worldX <= b)) continue;
        g.lineWidth = 2; g.beginPath(); g.moveTo(x, ground + 10); g.lineTo(x, ground + 44); g.stroke();
      }
      g.fillStyle = p.accent; g.globalAlpha = .55;
      for (let x = 36; x < 320; x += 96) g.fillRect(x, ground + 12, 3, 4);
      g.globalAlpha = 1;
      if (kind === 'school' || kind === 'train' || kind === 'roof') {
        g.strokeStyle = p.accent; g.lineWidth = 1.5;
        for (let x = 62; x < 280; x += 108) { g.beginPath(); g.moveTo(x, ground + 12); g.lineTo(x, ground - 2); g.lineTo(x + 18, ground - 2); g.stroke(); }
      }
    }
  }

  function makeBitmap(width, height, scale, paint) {
    const canvas = root.document.createElement('canvas');
    canvas.width = Math.ceil(width * scale); canvas.height = Math.ceil(height * scale);
    const g = canvas.getContext('2d'); g.scale(scale, scale); paint(g);
    return canvas;
  }

  function getBitmaps(map, p, o) {
    const scale = Math.min(root.devicePixelRatio || 1, 1.5), key = `${map}:${o.ground}:${scale}`;
    if (bitmapCache?.key === key) return bitmapCache;
    const staticOptions = { ...o, cam: 0, time: 0, reduced: true, pits: [] };
    const far = makeBitmap(310, o.ground + 60, scale, g => skyline(g, staticOptions, p, p.kind));
    const near = makeBitmap(640, 120, scale, g => {
      g.save(); g.translate(0, -(o.ground - 42));
      foreground(g, staticOptions, p, p.kind, 0);
      g.save(); g.translate(320, 0); foreground(g, staticOptions, p, p.kind, 1); g.restore();
      g.restore();
    });
    bitmapCache = { key, scale, far, near };
    return bitmapCache;
  }

  function drawBitmaps(g, map, p, o) {
    const cache = getBitmaps(map, p, o);
    const farSpeed = o.reduced ? .94 : .12, nearSpeed = o.reduced ? 1 : .88;
    const paint = (bitmap, tileWidth, speed, y, near = false) => {
      const phase = o.cam * speed, first = Math.floor(phase / tileWidth) - 1, last = Math.ceil((phase + o.width) / tileWidth) + 1;
      g.save(); g.translate(o.cam - phase, y);
      for (let i = first; i <= last; i++) {
        const x = i * tileWidth;
        if (near && (o.pits || []).some(([a, b]) => a < x + tileWidth && b > x)) continue;
        g.globalAlpha = near ? .72 : .48;
        g.drawImage(bitmap, x, 0, tileWidth, near ? 120 : o.ground + 60);
      }
      g.globalAlpha = 1;
      g.restore();
    };
    paint(cache.far, 310, farSpeed, 0);
    const sway = o.reduced ? 0 : Math.sin(o.time * .75) * 1.5;
    paint(cache.near, 640, nearSpeed, o.ground - 42 + sway, true);
  }

  function draw(g, map, options) {
    const p = MAPS[map] || MAPS.free;
    const o = { cam: Math.max(0, options.cam || 0), width: options.width || 960, ground: options.ground || 470, time: options.time || 0, reduced: !!options.reduced, pits: options.pits || [] };
    if (root.document?.createElement && typeof g.drawImage === 'function') { drawBitmaps(g, map in MAPS ? map : 'free', p, o); return; }
    repeat(g, o, o.reduced ? .94 : .12, 310, (ctx, x, tile) => { ctx.save(); ctx.translate(x, 0); skyline(ctx, o, p, p.kind); ctx.restore(); });
    repeat(g, o, o.reduced ? 1 : .88, 320, (ctx, x, tile) => { ctx.save(); ctx.translate(x, 0); foreground(ctx, o, p, p.kind, tile); ctx.restore(); });
  }

  root.TCParallaxLayers = { maps: Object.freeze(Object.keys(MAPS)), draw };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.TCParallaxLayers;
})(typeof window !== 'undefined' ? window : globalThis);
