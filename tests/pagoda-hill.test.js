'use strict';
const assert = require('node:assert/strict');
require('../game/js/levels.js');
require('../game/js/endless.js');

const place = global.TCEndless.PLACES.pagoda;
assert.equal(place.map, 'pagoda');
assert.equal(place.from, 34);
assert.ok(global.TCEndless.UNLOCKS.some(x => x.place === 'pagoda' && x.level === 34));

function groundY(level, x) {
  const points = level.ground.points;
  for (let i = 1; i < points.length; i++) {
    const [ax, ay] = points[i - 1], [bx, by] = points[i];
    if (x <= bx) return ay + (by - ay) * ((x - ax) / Math.max(1, bx - ax));
  }
  return points.at(-1)[1];
}

for (let night = 34; night <= 50; night++) {
  const level = global.TC_ENDLESS_LEVEL(night, 'pagoda', []);
  assert.equal(level.map, 'pagoda', `Night ${night}: map set`);
  assert.ok(level.ground.points.length > 30, `Night ${night}: repeated stone-step profile`);
  assert.ok(Math.max(...level.ground.points.map(p => p[1])) - Math.min(...level.ground.points.map(p => p[1])) >= 35, `Night ${night}: steps have visible rise`);
  assert.ok(level.hazards.some(h => h.kind === 'bell'), `Night ${night}: touch bells placed`);
  assert.ok(level.platforms.some(p => p[4]?.skin === 'oil-lamp'), `Night ${night}: oil-lamp platforms placed`);

  for (let i = 1; i < level.ground.points.length; i++) assert.ok(level.ground.points[i][0] > level.ground.points[i - 1][0], `Night ${night}: terrain coordinates sorted`);
  for (const bell of level.hazards.filter(h => h.kind === 'bell')) {
    assert.ok(bell.x >= 0 && bell.x <= level.width, `Night ${night}: bell in bounds`);
    assert.ok(!(level.pits || []).some(([a, b]) => bell.x > a - 110 && bell.x < b + 110), `Night ${night}: bell has safe footing`);
  }
  for (const lamp of level.platforms.filter(p => p[4]?.skin === 'oil-lamp')) {
    assert.ok(!(level.pits || []).some(([a, b]) => lamp[0] < b && lamp[0] + lamp[2] > a), `Night ${night}: lamp stays off pits`);
    assert.ok(groundY(level, lamp[0]) - lamp[1] <= 150, `Night ${night}: lamp reachable with the configured jump`);
  }
  for (const [a, b] of level.pits || []) {
    const bridges = level.platforms.filter(p => p[3] === 'moving' && p[4]?.path?.length > 1
      && Math.min(...p[4].path.map(([x]) => x)) <= a
      && Math.max(...p[4].path.map(([x]) => x)) + p[2] >= b);
    assert.equal(bridges.length, 1, `Night ${night}: pit retains one moving bridge`);
  }
}
console.log('Pagoda Hill unlocks, steps, bells, lamps, and pit routes passed for nights 34–50');
