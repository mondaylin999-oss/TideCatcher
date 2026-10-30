const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const levels = require('../game/js/levels.js');
require('../game/js/endless.js');
require('../game/js/tips.js');
require('../game/js/moodling-art.js');

const game = readFileSync('game/js/game.js', 'utf8');
const clips = readFileSync('game/js/catch-clips.js', 'utf8');
const sourceTypes = ['O', 'U', 'P'];

// Nights 1–10 retain their original data shape and no new unlock metadata.
for (let night = 1; night <= 10; night++) {
  assert.ok(levels[night], `level ${night} exists`);
  assert.equal(levels[night].introducedMoodlings, undefined, `level ${night} has no new Moodling`);
  assert.equal(levels[night].availableMoodlings, undefined, `level ${night} has no new Moodling pool`);
}
for (const [night, type] of [[11, 'O'], [14, 'U'], [17, 'P']]) {
  assert.deepEqual(levels[night].introducedMoodlings, [type], `level ${night} introduces only ${type}`);
  assert.ok(levels[night].availableMoodlings.includes(type), `${type} remains available after introduction`);
}
assert.deepEqual(levels[13].availableMoodlings, ['O']);
assert.deepEqual(levels[16].availableMoodlings, ['O', 'U']);
assert.deepEqual(levels[17].proudPerches, undefined, 'base route metadata stays map-neutral until a card is selected');
const proudRoute = globalThis.TC_ENDLESS_LEVEL(17, 'park', []);
assert.equal(proudRoute.proudPerches.length, 2, 'Proud’s first map has two high perches');
assert.ok(proudRoute.proudPerches.every(x => proudRoute.platforms.some(p => p[3] === 'static' && Math.abs(p[0] + p[2] / 2 - x) < 1)));
const jumpRise = 830 ** 2 / (2 * 2300);
assert.ok(proudRoute.platforms.filter(p => p[3] === 'static').every(p => 470 - p[1] <= jumpRise), 'both Proud perches are reachable with the default jump');

for (const night of [8, 9, 10]) {
  for (const card of globalThis.TCEndless.cards(night)) {
    assert.ok(!sourceTypes.some(type => card.need[type]), `level ${night} card stays within the original roster`);
  }
}
for (const [night, type] of [[11, 'O'], [14, 'U'], [17, 'P']]) {
  for (const card of globalThis.TCEndless.cards(night)) {
    assert.equal(card.need[type], 1, `all level ${night} choices teach ${type}`);
    assert.ok(Object.keys(card.need).filter(key => sourceTypes.includes(key)).length <= 1, `level ${night} adds no other new type`);
    const plan = globalThis.TCEndless.plan(night, card);
    assert.equal(plan.need[type], 1, `${type} survives the selected night plan`);
  }
}
for (let night = 11; night <= 50; night++) {
  for (const card of globalThis.TCEndless.cards(night)) {
    assert.ok(Object.keys(card.need).filter(key => sourceTypes.includes(key)).length <= 1, `night ${night} has at most one added Moodling type`);
  }
}

for (const type of sourceTypes) {
  const guide = globalThis.TC_TIPS.en.help.catchClipSteps[type];
  const myGuide = globalThis.TC_TIPS.my.help.catchClipSteps[type];
  assert.equal(guide.length, 3, `${type} has three English guide steps`);
  assert.equal(myGuide.length, 3, `${type} has three Burmese guide steps`);
  assert.ok(globalThis.TCMoodArt?.has(({ O: 'Bored', U: 'Guilty', P: 'Proud' })[type]), `${type} has Moodling art`);
  assert.match(game, new RegExp(`^\\s*${type}: \\[`, 'm'), `${type} has Mood Book variants`);
  assert.match(clips, new RegExp(`^\\s*${type}: \\[`, 'm'), `${type} has a three-step catch storyboard`);
}
for (const behavior of ['registerBoredAction', "m.lightState = 'carried'", "m.state = 'catchable'", 'm.sit / 2']) {
  assert.ok(game.includes(behavior), `game behavior exists: ${behavior}`);
}
assert.match(game, /Object\.keys\(encounteredMoodlings\)\.some\(key => key\.startsWith\(type\)\)/, 'Free Play gates new types on prior encounters');
assert.match(game, /function onGuidanceSpawn\(m\)/, 'first encounter feeds the existing guide system');
assert.match(game, /kind: 'bored', mood: bored/, 'the mobile scratch button becomes available beside Bored');
assert.match(clips, /step\.action === 'MIX'[\s\S]*step\.inputs/, 'Bored’s touch guide shows all available action controls');

console.log('New Moodlings unlocks, route cards, guides, art, and core catch behaviors passed.');
