const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');

const game = readFileSync('game/js/game.js', 'utf8');
const tips = readFileSync('game/js/tips.js', 'utf8');
const levels = require('../game/js/levels.js');

assert.match(game, /function startNightPan\(after\)/, 'story night startup should initialize the intro pan');
assert.match(game, /function finishNightPan\(\)/, 'the intro must have a shared completion path');
assert.match(game, /if \(nightPan\.active\) \{ e\.preventDefault\(\); e\.stopImmediatePropagation\(\); finishNightPan\(\); return; \}/, 'any keyboard key should skip without becoming a gameplay input');
assert.match(game, /document\.addEventListener\('pointerdown',[\s\S]*?finishNightPan\(\)/, 'a screen tap should skip on touch devices');
assert.match(game, /if \(nightPan\.active\) \{ updateNightPan\(dt\); return; \}/, 'the timer and gameplay simulation must pause during the intro');
assert.match(game, /const startedTutorial = startGuidedTutorial\(\)/, 'Night 1 tutorial should be deferred until the pan ends');
assert.match(game, /copy\.title \|\| 'Tonight’s route'/, 'the overlay should identify the night route');
assert.match(game, /Press any key or tap to skip/, 'the overlay should explain how to skip');
assert.match(game, /nightPan\.goal = clamp\(\(currentLevel\.homeLight\?\.\[0\] \?\? WORLD - 80\)/, 'the route pan should use the authored home goal');
assert.match(tips, /nightPreview: \{ title: 'Tonight’s route/, 'English route guidance is required');

for (let night = 1; night <= 50; night++) {
  const level = levels[night];
  assert.ok(level, `Night ${night} level should exist`);
  assert.ok(Array.isArray(level.homeLight) && Number.isFinite(level.homeLight[0]), `Night ${night} should provide a finite goal coordinate`);
  assert.ok(level.homeLight[0] >= 0 && level.homeLight[0] <= level.width, `Night ${night} goal should be inside the camera route`);
}

console.log('Night preview pan checks passed for all 50 story nights.');
