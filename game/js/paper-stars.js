/* Deterministic ledge positions for the three hidden paper stars in a night. */
(function () {
  'use strict';

  function positionsFor(level) {
    if (!level || !Number.isFinite(level.width) || !Array.isArray(level.platforms)) return [];
    const width = level.width;
    const groundPoints = level.ground?.points || [[0, 470], [width, 470]];
    const groundY = x => {
      for (let i = 1; i < groundPoints.length; i++) {
        const a = groundPoints[i - 1], b = groundPoints[i];
        if (x <= b[0]) return a[1] + (b[1] - a[1]) * ((x - a[0]) / Math.max(1, b[0] - a[0]));
      }
      return groundPoints[groundPoints.length - 1][1];
    };
    const safeGroundX = target => {
      let x = Math.max(70, Math.min(width - 70, target));
      for (let pass = 0; pass < (level.pits || []).length + 1; pass++) {
        const pit = (level.pits || []).find(([a, b]) => x > a - 20 && x < b + 20);
        if (!pit) break;
        const left = Math.max(70, pit[0] - 26), right = Math.min(width - 70, pit[1] + 26);
        x = Math.abs(target - left) <= Math.abs(target - right) ? left : right;
      }
      return Math.round(x);
    };
    const candidates = level.platforms
      .filter(p => Array.isArray(p) && ['static', 'bouncy', 'moving'].includes(p[3] || 'static') && p[2] >= 64)
      .map((p, index) => ({ x: p[0], y: p[1], w: p[2], type: p[3] || 'static', extra: p[4], index }))
      .filter(p => p.x >= 70 && p.x + p.w <= width - 60);
    const chosen = [];
    for (let i = 0; i < 3; i++) {
      const target = width * ((i + .5) / 3);
      const band = candidates.filter(p => p.x + p.w > width * (i / 3) && p.x < width * ((i + 1) / 3) && !chosen.includes(p));
      const pool = band.length ? band : [];
      if (!pool.length) {
        const x = safeGroundX(target);
        chosen.push({ fallback: true, x, y: groundY(x) - 155, index: -1 });
        continue;
      }
      // Favor raised ledges, but keep the choice close to its section of the route.
      const pick = pool.slice().sort((a, b) => {
        const score = p => Math.abs((p.x + p.w / 2) - target) * .12 + p.y * .22;
        return score(a) - score(b) || a.index - b.index;
      })[0];
      chosen.push(pick);
    }
    return chosen.map((p, i) => ({
      id: i,
      x: Math.round(p.x + (p.fallback ? 0 : Math.max(22, Math.min(p.w - 22, p.w * (i === 1 ? .74 : .26))))),
      y: p.fallback ? p.y : p.y - 30,
      platformIndex: p.fallback ? null : p.index,
      offsetX: p.fallback ? 0 : Math.max(22, Math.min(p.w - 22, p.w * (i === 1 ? .74 : .26)))
    }));
  }

  window.TCPaperStars = Object.freeze({ positionsFor });
})();
