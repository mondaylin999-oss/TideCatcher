'use strict';
// Story-night heights (Nights 1-4): solidTops are optional scenery tops. They stay clear of pits, hide/bury spots and the
// secret room, are reachable with one jump from the surface below, and every keepsake is reachable from ground or a top.
const assert = require('node:assert/strict');
const LEVELS = require('../game/js/levels.js');
const JUMP = 830 * 830 / (2 * 2300);   // ~150
function groundY(L, x) { const p = L.ground.points; for (let i = 1; i < p.length; i++) if (x <= p[i][0]) { const [x0, y0] = p[i - 1], [x1, y1] = p[i]; return y0 + (y1 - y0) * (x - x0) / (x1 - x0 || 1); } return p.at(-1)[1]; }
let n = 0;
for (let night = 1; night <= 50; night++) {
  const L = LEVELS[night], tops = (L.solidTops || []).map(t => ({ ...t, y: groundY(L, t.x + t.w / 2) - t.h }));
  for (const t of tops) {
    assert.ok(t.x >= 0 && t.x + t.w <= L.width, `Night ${night}: ${t.kind} inside the level`);
    assert.ok(!(L.pits || []).some(([a, b]) => t.x < b + 110 && t.x + t.w > a - 110), `Night ${night}: ${t.kind} clear of pits`);
    assert.ok(![...L.hideSpots, ...L.burySpots].some(x => x > t.x - 10 && x < t.x + t.w + 10), `Night ${night}: ${t.kind} clear of hide/bury spots`);
    assert.ok(!L.secretRoom || t.x + t.w < L.secretRoom.x - 95 || t.x > L.secretRoom.x + 95, `Night ${night}: ${t.kind} clear of the secret room`);
    // reachable: one jump from the ground, or from another top under it
    const below = Math.min(groundY(L, t.x + t.w / 2), ...tops.filter(o => o !== t && o.y > t.y && o.x < t.x + t.w && o.x + o.w > t.x).map(o => o.y));
    assert.ok(below - t.y < JUMP - 8, `Night ${night}: ${t.kind} top is reachable with one jump (${(below - t.y).toFixed(0)} up)`);
    assert.ok(!L.platforms.some(p => p[0] === t.x && p[2] === t.w), `Night ${night}: ${t.kind} is not a roost platform`);
    n++;
  }
  for (const k of L.keepsakes || []) {
    const surfaces = [groundY(L, k[0]), ...tops.filter(t => k[0] >= t.x - 8 && k[0] <= t.x + t.w + 8).map(t => t.y)];
    assert.ok(surfaces.some(s => k[1] > s - JUMP - 28 - 40 && k[1] < s - 28 + 40), `Night ${night}: keepsake at ${k[0]},${k[1]} is reachable`);
  }
}
for (const night of [1, 2, 3, 4]) assert.ok((LEVELS[night].solidTops || []).length >= 2, `Night ${night} has heights to explore`);
for (const night of [1, 2, 3, 4]) assert.ok(LEVELS[night].keepsakes.length >= 3, `Night ${night} has 3 keepsakes`);
console.log(`Checked ${n} solid tops and every story keepsake.`);
