'use strict';
const assert = require('node:assert/strict');
require('../game/js/levels.js');

for (let night = 18; night <= 50; night++) {
  const level = global.TC_ENDLESS_LEVEL(night, 'market', []);
  assert.equal(level.map, 'market', `Night ${night}: market map selected`);
  assert.ok(level.platforms.some(p => p[4]?.skin === 'awning' && p[3] === 'bouncy'), `Night ${night}: bounce awnings exist`);
  assert.ok(level.platforms.some(p => p[4]?.skin === 'lantern-rope' && p[3] === 'swinging'), `Night ${night}: lantern ropes exist`);
  assert.ok(level.hazards.filter(h => h.kind === 'puddle').length >= 2, `Night ${night}: visible puddle hazards exist`);

  for (const puddle of level.hazards.filter(h => h.kind === 'puddle')) {
    assert.ok(puddle.x >= 0 && puddle.x + puddle.w <= level.width, `Night ${night}: puddle is in bounds`);
    assert.ok(!(level.pits || []).some(([a, b]) => puddle.x < b && puddle.x + puddle.w > a), `Night ${night}: puddle stays off pits`);
  }
  for (const awning of level.platforms.filter(p => p[4]?.skin === 'awning')) {
    assert.ok(!(level.pits || []).some(([a, b]) => awning[0] < b && awning[0] + awning[2] > a), `Night ${night}: awning stays off pits`);
  }
  for (const rope of level.platforms.filter(p => p[4]?.skin === 'lantern-rope')) {
    const [ax] = rope[4].anchor;
    assert.ok(!(level.pits || []).some(([a, b]) => ax > a - 90 && ax < b + 90), `Night ${night}: rope stays clear of pit approaches`);
  }
  for (const [a, b] of level.pits || []) {
    const bridges = level.platforms.filter(p => p[3] === 'moving' && p[4]?.path?.length > 1
      && Math.min(...p[4].path.map(([x]) => x)) <= a
      && Math.max(...p[4].path.map(([x]) => x)) + p[2] >= b);
    assert.equal(bridges.length, 1, `Night ${night}: pit keeps its single moving bridge`);
  }
}
console.log('Night Market layouts passed for nights 18–50');
