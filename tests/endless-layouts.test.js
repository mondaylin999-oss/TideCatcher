'use strict';
// Nights 8-50 (Endless): seeded and repeatable, width-capped, map hazards clear of pits, spots on safe ground.
const assert = require('node:assert/strict');
require('../game/js/levels.js');
const build = globalThis.TC_ENDLESS_LEVEL;
const MAPS = ['school', 'park', 'festival', 'hill', 'lake', 'rooftop', 'market', 'garden', 'pagoda', 'train'];
let n = 0;
for (let night = 8; night <= 50; night++) for (const map of MAPS) {
  const a = build(night, map, []), b = build(night, map, []);
  assert.deepEqual(a, b, `Night ${night} ${map}: builds the same every time`);
  assert.ok(night % 5 === 0 ? a.width <= 6000 : a.width >= 4500 && a.width <= 5500, `Night ${night} ${map}: width ${a.width} within cap`);
  assert.ok(a.hazards.length >= 1, `Night ${night} ${map}: has a map hazard`);
  for (const h of a.hazards) {
    const lo = h.a ?? h.x, hi = h.b ?? h.x + (h.w || 0);
    assert.ok(lo >= 0 && hi <= a.width, `Night ${night} ${map}: ${h.kind} inside the level`);
    for (const [pa, pb] of a.pits) assert.ok(hi <= pa - 110 || lo >= pb + 110, `Night ${night} ${map}: ${h.kind} at least 110 from a pit`);
  }
  for (const x of [...a.hideSpots, ...a.burySpots]) for (const [pa, pb] of a.pits) assert.ok(x <= pa - 110 || x >= pb + 110, `Night ${night} ${map}: spot clear of pits`);
  n++;
}
// a twist night keeps its twist hazards
assert.ok(build(12, 'park', ['rain']).hazards.every(h => h.kind === 'slick'), 'twist hazards are kept as they were');
console.log(`Checked ${n} endless night builds: repeatable, capped, hazards and spots clear of pits.`);
