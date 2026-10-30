'use strict';
// Mood Tide: the value stays in [0, 1] and falls as feelings come home; the Night 6 tide pool keepsake exists and is reachable.
const assert = require('node:assert/strict');
const tide = require('../game/js/mood-tide.js');
const LEVELS = require('../game/js/levels.js');
const need = { F: 3, N: 2, L: 1 };
assert.equal(tide.compute(need, { F: 0, N: 0, L: 0 }).v, 1, 'nothing caught: high tide');
assert.equal(tide.compute(need, { F: 3, N: 2, L: 1 }).v, 0, 'everything home: calm');
assert.equal(tide.compute(need, { F: 9, N: 9, L: 9 }).v, 0, 'extra catches never go below 0');
assert.equal(tide.compute({}, {}).v, 0, 'no feelings needed: calm');
assert.equal(tide.compute(need, { F: 3 }).lead, 'N', 'the gauge colour follows the feeling most still out');
tide.start({ active: true });
let last = 1;
for (const got of [{ F: 1 }, { F: 2, N: 1 }, { F: 3, N: 2 }, { F: 3, N: 2, L: 1 }]) {
  for (let i = 0; i < 120; i++) tide.update(1 / 30, need, got, null);
  const v = tide.value(); assert.ok(v >= 0 && v <= 1 && v <= last + 1e-9, `tide value ${v} in range and falling`); last = v;
}
assert.ok(tide.open(), 'tide pool opens at low tide');
tide.start({ active: true }); tide.update(1 / 30, need, {}, null); assert.ok(!tide.open(), 'tide pool is closed at high tide');
tide.start({ active: true, gentle: true }); assert.ok(tide.open(), 'Gentle mode: tide pool always open');
const L6 = LEVELS[6], pool = L6.keepsakes.find(k => k[2] === 'tide');
assert.ok(pool, 'Night 6 has a tide pool keepsake');
assert.ok(pool[0] > 0 && pool[0] < L6.width && !L6.pits.some(([a, b]) => pool[0] > a && pool[0] < b), 'tide pool keepsake is on solid ground');
assert.ok(470 - pool[1] < 150, 'tide pool keepsake is within one jump of the ground');
console.log('Mood Tide checks passed.');
