const assert = require('node:assert/strict');
const fs = require('node:fs');
const layers = require('../game/js/parallax-layers.js');

const expectedMaps = ['school', 'rooftop', 'park', 'festival', 'hill', 'lake', 'market', 'garden', 'pagoda', 'train', 'free'];
assert.deepEqual(layers.maps, expectedMaps, 'every map needs its own parallax palette');

function traceDraw(options = {}) {
  const calls = [];
  const context = new Proxy({}, {
    get(_target, key) {
      if (key === 'globalAlpha' || key === 'fillStyle' || key === 'strokeStyle' || key === 'lineWidth') return undefined;
      return (...args) => calls.push([key, ...args]);
    },
    set() { return true; }
  });
  layers.draw(context, 'school', { cam: 1000, width: 960, ground: 470, time: 2, ...options });
  return calls;
}

const moving = traceDraw();
assert.ok(moving.some(([name, x, y]) => name === 'translate' && x === 880 && y === 0), 'far layer should travel slowly');
assert.ok(moving.some(([name, x, y]) => name === 'translate' && x === 120 && y === 0), 'near layer should follow the camera more closely');
const reduced = traceDraw({ reduced: true });
assert.ok(reduced.some(([name, x, y]) => name === 'translate' && x === 60 && y === 0), 'reduced motion should minimize far-layer drift');
assert.ok(reduced.some(([name, x, y]) => name === 'translate' && x === 0 && y === 0), 'reduced motion should stop near-layer drift and foliage sway');

const game = fs.readFileSync('game/js/game.js', 'utf8');
assert.match(game, /window\.TCParallaxLayers\?\.draw\(ctx, currentLevel\?\.map \|\| currentMapKey\(\)/, 'the renderer should select parallax by the active map');
assert.match(game, /drawWorld\(\);\s*window\.TCParallaxLayers\?\.draw[\s\S]*?drawHazards\(\)/, 'parallax scenery must stay behind gameplay objects');
const moduleSource = fs.readFileSync('game/js/parallax-layers.js', 'utf8');
assert.match(moduleSource, /o\.pits \|\| \[\]/, 'near rails must respect pit coordinates');
assert.match(moduleSource, /o\.reduced \? \.94 : \.12/, 'far layer should use a distinct slow camera factor');
assert.match(moduleSource, /o\.reduced \? 1 : \.88/, 'near layer should use a faster camera factor');

const originalDocument = global.document, originalDpr = global.devicePixelRatio;
let bitmapCreations = 0;
global.devicePixelRatio = 1;
global.document = { createElement: () => {
  bitmapCreations++;
  const bitmapContext = new Proxy({}, { get: () => () => {}, set: () => true });
  return { width: 0, height: 0, getContext: () => bitmapContext };
} };
const compositeCalls = [];
const composite = new Proxy({}, {
  get(_target, key) { return (...args) => compositeCalls.push([key, ...args]); },
  set() { return true; }
});
layers.draw(composite, 'park', { cam: 0, width: 960, ground: 470, time: 1 });
const drawImageCount = compositeCalls.filter(([key]) => key === 'drawImage').length;
assert.equal(bitmapCreations, 2, 'the skyline and foreground should be rasterized once per map');
assert.ok(drawImageCount <= 14, 'each frame should composite a small fixed number of cached tiles');
layers.draw(composite, 'park', { cam: 300, width: 960, ground: 470, time: 2 });
assert.equal(bitmapCreations, 2, 'same-map frames must reuse both cached layers');
layers.draw(composite, 'train', { cam: 0, width: 960, ground: 470, time: 0 });
assert.equal(bitmapCreations, 4, 'switching maps should replace the one-map bitmap cache');
if (originalDocument === undefined) delete global.document; else global.document = originalDocument;
if (originalDpr === undefined) delete global.devicePixelRatio; else global.devicePixelRatio = originalDpr;

console.log('Parallax layers cover every map and respect camera speed, reduced motion, and pit clearance.');
