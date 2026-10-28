'use strict';
const assert = require('node:assert/strict');
require('../game/js/levels.js');
require('../game/js/endless.js');
require('../game/js/endless-places.js');

const place = global.TCEndless.PLACES.train;
assert.equal(place.map, 'train');
assert.equal(place.from, 39);
assert.ok(global.TCEndless.UNLOCKS.some(x => x.place === 'train' && x.level === 39));
assert.ok(global.TCPlaces.has('train'), 'Train station art is registered');
assert.ok(global.TCPlaces.FLOOR.train, 'Train station floor palette is registered');

function groundY(level, x) {
  const points = level.ground.points;
  for (let i = 1; i < points.length; i++) {
    const [ax, ay] = points[i - 1], [bx, by] = points[i];
    if (x <= bx) return ay + (by - ay) * ((x - ax) / Math.max(1, bx - ax));
  }
  return points.at(-1)[1];
}

for (let night = 39; night <= 50; night++) {
  const level = global.TC_ENDLESS_LEVEL(night, 'train', []);
  assert.equal(level.map, 'train');
  const trains = level.platforms.filter(p => p[4]?.skin === 'train');
  assert.equal(trains.length, 1, `Night ${night}: one moving train carriage`);
  const train = trains[0];
  assert.equal(train[3], 'moving', `Night ${night}: train is rideable/moving`);
  assert.equal(train[4].path.length, 2, `Night ${night}: train has a passing route`);
  assert.ok(train[4].speed > 0 && train[4].speed <= .02, `Night ${night}: carriage passes slowly`);
  const minX = Math.min(...train[4].path.map(p => p[0])), maxX = Math.max(...train[4].path.map(p => p[0])) + train[2];
  assert.ok(maxX - minX >= train[2] + 24, `Night ${night}: carriage moves across the platform`);
  assert.ok(groundY(level, minX) - train[1] <= 150, `Night ${night}: train is jump-reachable`);
  for (const [a, b] of level.pits || []) {
    assert.ok(maxX <= a - 110 || minX >= b + 110, `Night ${night}: train route stays on solid track away from pit ${a}-${b}`);
    const bridges = level.platforms.filter(p => p[3] === 'moving' && p[4]?.path?.length > 1
      && Math.min(...p[4].path.map(([x]) => x)) <= a
      && Math.max(...p[4].path.map(([x]) => x)) + p[2] >= b);
    assert.equal(bridges.length, 1, `Night ${night}: pit retains exactly one crossing bridge`);
  }
  assert.ok(level.props.some(p => p.kind === 'bench'), `Night ${night}: station benches exist`);
  assert.ok(level.hideSpots.length > 0, `Night ${night}: ticket-booth hiding positions exist`);
  for (const x of level.hideSpots) {
    assert.ok(x >= 0 && x <= level.width, `Night ${night}: hiding spot stays in bounds`);
    assert.ok(!(level.pits || []).some(([a, b]) => x > a - 120 && x < b + 120), `Night ${night}: hiding spot stays clear of pit edges`);
    assert.ok(level.props.some(p => p.kind === 'ticket-booth' && x >= p.x + 35 && x <= p.x + p.w - 35), `Night ${night}: hiding spot has a booth`);
  }
}
console.log('Night Train Platform unlock, scenery placements, moving carriage and pit safety passed for nights 39–50');
