'use strict';
const assert = require('node:assert/strict');
const LEVELS = require('../game/js/levels.js');

// These are the matching player settings in NIGHT_CHAPTERS (game.js).
const JUMP_SPEED = 830, GRAVITY = 2300, BASE_RUN_SPEED = 6 * 48, CAT_HALF_WIDTH = 16;
const MAX_JUMP_HEIGHT = JUMP_SPEED * JUMP_SPEED / (2 * GRAVITY);
const MAX_FLAT_JUMP = BASE_RUN_SPEED * (2 * JUMP_SPEED / GRAVITY) + CAT_HALF_WIDTH * 2;

function groundY(level, x) {
  const pts = level.ground.points;
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i];
    if (x <= bx) return ay + (by - ay) * ((x - ax) / Math.max(1, bx - ax));
  }
  return pts.at(-1)[1];
}
function layouts() { return [...Array(50)].map((_, i) => LEVELS[i + 1]).concat(LEVELS.free.variants); }
function pitAt(level, x) { return (level.pits || []).find(([a, b]) => x > a + 10 && x < b - 10); }
function platformPositions([x, y, , type, extra]) { return type === 'moving' ? extra.path : [[x, y]]; }
function check(level) {
  assert.ok(level.width > 1800, `${level.night}: usable width`);
  assert.equal(level.ground.points[0][0], 0, `${level.night}: ground starts at 0`);
  assert.equal(level.ground.points.at(-1)[0], level.width, `${level.night}: ground ends at width`);
  for (let i = 1; i < level.ground.points.length; i++) assert.ok(level.ground.points[i][0] > level.ground.points[i - 1][0], `${level.night}: ground points sorted`);
  for (const [a, b] of level.pits || []) {
    assert.ok(a >= 0 && b <= level.width && b > a, `${level.night}: pit within level`);
    const movingBridges = level.platforms.filter(p => p[3] === 'moving' && p[4]?.path?.length > 1
      && Math.min(...p[4].path.map(([x]) => x)) <= a
      && Math.max(...p[4].path.map(([x]) => x)) + p[2] >= b);
    assert.equal(b - a > MAX_FLAT_JUMP, true, `${level.night}: pit is too wide for an unaided jump`);
    assert.equal(movingBridges.length, 1, `${level.night}: pit has exactly one moving bridge`);
    assert.ok(b - a >= movingBridges[0][2] * level.pitToBridgeRatio, `${level.night}: pit matches its difficulty-based bridge ratio`);
    const pitPlatforms = level.platforms.filter(p => p[0] < b && p[0] + p[2] > a);
    assert.equal(pitPlatforms.length, 1, `${level.night}: pit has no duplicate roosts`);
    assert.equal(pitPlatforms[0][3], 'moving', `${level.night}: pit can only be crossed by its moving bridge`);
    assert.ok(!pitAt(level, level.catStart) || level.catStart !== a, `${level.night}: start outside pit`);
  }
  for (const [a, b] of level.spawnZones) {
    assert.ok(a >= 80 && b <= level.width - 80 && b > a, `${level.night}: valid spawn zone`);
    assert.ok(!(level.pits || []).some(([x, y]) => a < y && b > x), `${level.night}: spawn zone excludes pits`);
  }
  for (const x of [...level.hideSpots, ...level.burySpots, level.catStart]) {
    assert.ok(x >= 0 && x <= level.width, `${level.night}: spot/start within width`);
    assert.ok(!pitAt(level, x), `${level.night}: hide, burial and start points outside pits`);
  }
  for (const x of level.checkpoints || []) {
    assert.ok(x >= 0 && x <= level.width, `${level.night}: checkpoint within level`);
    assert.ok(!pitAt(level, x), `${level.night}: checkpoint on safe ground`);
    assert.ok(!(level.pits || []).some(([a]) => Math.abs(x - a) < 20), `${level.night}: checkpoint has a safe lead-in`);
  }
  for (const x of level.burySpots) {
    for (const prop of level.props) {
      const pathX = prop.path?.map(([px]) => px) || [prop.x], minX=Math.min(...pathX), maxX=Math.max(...pathX)+(prop.w||80);
      assert.ok(x < minX - 30 || x > maxX + 30, `${level.night}: burial spot ${x} overlaps ${prop.kind}`);
    }
    for (const p of level.platforms) {
      const [,,w] = p, floor=groundY(level,x);
      assert.ok(!platformPositions(p).some(([sx,sy]) => x+40 >= sx && x-40 <= sx+w && sy <= floor && sy+12 >= floor-40), `${level.night}: burial spot ${x} is hidden under platform`);
    }
  }
  for (const p of level.platforms) {
    const [x, y, w, type, extra] = p;
    assert.ok(x >= 0 && x + w <= level.width, `${level.night}: platform within level`);
    assert.ok(['static', 'moving', 'crumbling', 'bouncy', 'swinging'].includes(type), `${level.night}: supported platform type`);
    const positions = platformPositions(p);
    assert.ok(positions?.length, `${level.night}: moving platform path`);
    for (const [px, py] of positions) {
      const floor = groundY(level, px);
      assert.ok(py < floor, `${level.night}: platform surface above ground`);
      assert.ok(floor - py <= MAX_JUMP_HEIGHT + 1, `${level.night}: platform reachable with configured jump`);
      if (type === 'moving') assert.ok(px >= 0 && px + w <= level.width, `${level.night}: moving path stays in bounds`);
    }
    if (type === 'swinging') {
      assert.ok(extra?.anchor, `${level.night}: swinging platform has an anchor`);
      assert.ok(groundY(level, extra.anchor[0]) - extra.anchor[1] <= MAX_JUMP_HEIGHT, `${level.night}: swing anchor reachable with configured jump`);
    }
  }
  for (const [a, b] of level.pits || []) {
    const movingBridge = level.platforms.some(p => p[3] === 'moving' && p[4]?.path?.length > 1
      && Math.min(...p[4].path.map(([x]) => x)) <= a
      && Math.max(...p[4].path.map(([x]) => x)) + p[2] >= b);
    assert.ok(b - a <= MAX_FLAT_JUMP || movingBridge, `${level.night}: no impossible pit`);
  }
  assert.ok(level.catStart > 0 && level.catStart < level.width, `${level.night}: valid cat start`);
}

assert.equal(layouts().length, 53, '50 story levels plus three Free Play trails');
for (const level of layouts()) check(level);
for (let night = 1; night <= 50; night++) {
  const level = LEVELS[night];
  if (night % 5 !== 0) {
    assert.equal(level.pits.length, 0, `Night ${night} has no pit`);
    assert.equal(level.platforms.length, 0, `Night ${night} has no roost platforms`);
    continue;
  }
  assert.ok(level.pits.length > 0, `Night ${night} includes a pit section`);
  assert.equal(level.platforms.length, level.pits.length, `Night ${night} has exactly one roost per pit`);
  assert.ok(level.pits.every(([a, b]) => b - a > MAX_FLAT_JUMP), `Night ${night} gaps cannot be jumped across`);
  assert.ok(level.platforms.every(p => p[3] === 'moving'), `Night ${night} crossings use moving roosts only`);
  assert.ok(level.platforms.every(p => p[2] * 5 <= level.pits[level.platforms.indexOf(p)][1] - level.pits[level.platforms.indexOf(p)][0]), `Night ${night} gaps are at least five roost-widths`);
}
assert.equal(LEVELS[5].pitToBridgeRatio, 5, 'Night 5 gaps use the five-to-one bridge ratio');
assert.ok(LEVELS.free.variants.every(level => level.pits?.length), 'Every Free Play trail includes a fall-risk crossing');
assert.deepEqual(LEVELS.free.variants.map(level => level.pitToBridgeRatio), [5,5,5], 'Free Play pits also require moving roost crossings');
assert.ok([...Array(43)].every((_, i) => LEVELS[i + 8].pitToBridgeRatio === 5), 'Challenge levels keep the maximum five-to-one pit ratio');
assert.ok([...Array(8)].every((_, i) => LEVELS[15 + i * 5].pits.length > LEVELS[10 + i * 5].pits.length), 'Pit count grows between challenge pit nights');
assert.ok([...Array(8)].every((_, i) => LEVELS[15 + i * 5].platforms[0][4].speed > LEVELS[10 + i * 5].platforms[0][4].speed), 'Bridge speed rises between challenge pit nights');
console.log(`Validated ${layouts().length} level layouts; ${MAX_JUMP_HEIGHT.toFixed(1)}px jump rise and ${MAX_FLAT_JUMP.toFixed(1)}px safe jump span.`);
