'use strict';
const assert = require('node:assert/strict');
require('../game/js/levels.js');
require('../game/js/endless.js');

function checkRoom(level, label) {
  const room = level.secretRoom;
  assert.ok(room, `${label}: has one secret room`);
  assert.equal(room.id, level.map || 'free', `${label}: room follows its map`);
  assert.equal(room.scratches, 3, `${label}: wall needs three scratches`);
  assert.ok(room.x > 0 && room.x < level.width, `${label}: wall is in bounds`);
  assert.ok(room.x - room.width / 2 >= 0 && room.x + room.width / 2 <= level.width, `${label}: room is in bounds`);
  assert.ok(!level.pits.some(([a, b]) => room.x - room.width / 2 < b + 130 && room.x + room.width / 2 > a - 130), `${label}: room stays clear of pits`);
  assert.ok(['page', 'moodling'].includes(room.reward.kind), `${label}: room contains a supported reward`);
  if (room.reward.kind === 'page') assert.ok(['school', 'festival', 'lake', 'market', 'pagoda', 'free'].includes(room.id), `${label}: page reward is listed in the diary`);
  if (room.reward.kind === 'moodling') {
    assert.ok(['F', 'N'].includes(room.reward.type), `${label}: rare Moodling has supported rare art`);
    assert.equal(room.reward.variant, 1, `${label}: Moodling is a rare variant`);
  }
}

for (let night = 1; night <= 50; night++) checkRoom(global.TC_LEVELS[night], `Night ${night}`);
for (const variant of global.TC_LEVELS.free.variants) checkRoom(variant, variant.night);

const maps = ['school', 'park', 'festival', 'hill', 'lake', 'rooftop', 'market', 'garden', 'pagoda', 'train'];
for (const map of maps) for (const night of [8, 19, 30, 39, 50]) {
  checkRoom(global.TC_ENDLESS_LEVEL(night, map, []), `${map} Endless night ${night}`);
}
console.log('Secret-room placements, rewards and pit clearance passed for story, Free Play and all map families.');
