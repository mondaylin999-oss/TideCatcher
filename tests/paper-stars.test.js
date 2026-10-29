'use strict';
const assert = require('node:assert/strict');
global.window = global;
const levels = require('../game/js/levels.js');
require('../game/js/paper-stars.js');

function groundY(level, x) {
  const pts = level.ground.points;
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i];
    if (x <= bx) return ay + (by - ay) * ((x - ax) / Math.max(1, bx - ax));
  }
  return pts.at(-1)[1];
}
function inPit(level, x) { return (level.pits || []).some(([a, b]) => x > a + 10 && x < b - 10); }

for (let night = 1; night <= 50; night++) {
  const level = levels[night];
  const stars = window.TCPaperStars.positionsFor(level);
  assert.equal(stars.length, 3, `Night ${night} has exactly three paper stars`);
  assert.equal(new Set(stars.map(s => s.id)).size, 3, `Night ${night} star IDs are distinct`);
  for (const star of stars) {
    assert.ok(star.x >= 70 && star.x <= level.width - 60, `Night ${night} star is in bounds`);
    if (star.platformIndex == null) {
      assert.ok(!inPit(level, star.x), `Night ${night} jump star is over safe ground`);
      assert.ok(star.y < groundY(level, star.x), `Night ${night} jump star is above the floor`);
    } else {
      const platform = level.platforms[star.platformIndex];
      assert.ok(platform, `Night ${night} star platform exists`);
      assert.ok(star.x >= platform[0] && star.x <= platform[0] + platform[2], `Night ${night} star sits above its ledge`);
      assert.ok(Math.abs(star.y - (platform[1] - 30)) < 1, `Night ${night} star sits above the ledge surface`);
    }
  }
}

for (let night = 8; night <= 50; night++) {
  for (const map of ['school', 'park', 'festival', 'hill', 'lake']) {
    const level = window.TC_ENDLESS_LEVEL(night, map, []);
    assert.equal(window.TCPaperStars.positionsFor(level).length, 3, `Night ${night} ${map} card has three paper stars`);
  }
}

console.log('Paper-star placement passed for all 50 nights and Endless map cards.');
