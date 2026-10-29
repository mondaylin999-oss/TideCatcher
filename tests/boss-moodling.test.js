const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');

const context = { console };
context.globalThis = context;
vm.runInNewContext(readFileSync('game/js/levels.js', 'utf8'), context, { filename: 'game/js/levels.js' });
const levels = context.TC_LEVELS;
assert.ok(levels, 'levels config should load');
for (const night of [3, 5, 7]) {
  assert.deepEqual(JSON.parse(JSON.stringify(levels[night].boss)), { type: 'F', name: 'Storm Frustrated', phases: 3 });
}
for (let night = 1; night <= 50; night++) {
  if (![3, 5, 7].includes(night)) assert.equal(levels[night].boss, undefined, `Night ${night} must not inherit a story boss`);
}

const game = readFileSync('game/js/game.js', 'utf8');
assert.match(game, /function tryBossPounce\(\)/);
assert.match(game, /b\.mode !== 'dizzy'/);
assert.match(game, /b\.health = Math\.max\(0, b\.health - 1\)/);
assert.match(game, /if \(!gentleMode\) \{ lives = Math\.max\(0, lives - 1\)/);
assert.match(game, /!bossEncounter\) timeLeft -= dt/);
console.log('Storm boss configuration and encounter guards passed for Nights 3, 5, and 7.');
