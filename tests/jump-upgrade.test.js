const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');

const context = { window: {} };
vm.runInNewContext(readFileSync('game/js/jump-upgrade.js', 'utf8'), context, { filename: 'game/js/jump-upgrade.js' });
const jump = context.window.TCJumpUpgrade;
const cat = { extraJumpAvailable: false };

assert.equal(jump.canUse(cat, true), false, 'air leap must not be available before a normal jump');
jump.prime(cat, false);
assert.equal(jump.canUse(cat, false), false, 'unowned upgrade stays disabled');
jump.prime(cat, true);
assert.equal(jump.canUse(cat, true), true, 'ground jump grants one optional air leap');
assert.equal(jump.consume(cat), true, 'air leap is consumed once');
assert.equal(jump.consume(cat), false, 'there is no third jump');
assert.equal(jump.canUse(cat, true), false);
jump.land(cat);
assert.equal(jump.canUse(cat, true), false, 'landing clears the previous jump state');
jump.prime(cat, true);
assert.equal(jump.consume(cat), true, 'a new ground jump primes one new air leap');

const game = readFileSync('game/js/game.js', 'utf8');
assert.match(game, /id: 'secondLeap', name: 'Second Leap'/);
assert.match(game, /id: 'secondLeap', name: 'Second Leap',[\s\S]*?max: 1/);
assert.match(game, /currentVersion = version === '7' \|\| version === '8'/);
assert.match(game, /c\.vy = -jumpSpeed \* \.78/);
assert.match(game, /!c\.wallTouch && !c\.ledgeGrab && !c\.swinging/);
assert.match(game, /if \(!reduce\) burst\(c\.x, c\.y - 22, '#c8adff', 9\)/);
console.log('Second Leap gating, one-use reset, legacy-save migration, and reduced-motion guard passed.');
