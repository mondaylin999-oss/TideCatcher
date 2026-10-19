'use strict';
const assert = require('node:assert/strict');
const LEVELS = require('../frontend/js/levels.js');
const JUMP_SPEED = 830, GRAVITY = 2300;
const MAX_JUMP_HEIGHT = JUMP_SPEED * JUMP_SPEED / (2 * GRAVITY);
const MAX_JUMP_GAP = 360; // running jump plus pounce-assisted horizontal travel

function groundY(level, x) {
  const pts = level.ground.points;
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i];
    if (x <= bx) return ay + (by - ay) * ((x - ax) / Math.max(1, bx - ax));
  }
  return pts.at(-1)[1];
}
function terrainY(level, x) {
  const gap = (level.gaps || []).find(([a,b]) => x >= a && x <= b);
  if (!gap) return groundY(level,x);
  const [a,b,lower]=gap, ramp=Math.min(30,(b-a)*.24), left=groundY(level,a), right=groundY(level,b);
  if (x<a+ramp) return left+(lower-left)*(x-a)/ramp;
  if (x>b-ramp) return lower+(right-lower)*(x-(b-ramp))/ramp;
  return lower;
}
function layouts() { return [...Array(7)].map((_, i) => LEVELS[i + 1]).concat(LEVELS.free.variants); }
function check(level) {
  assert.ok(level.width > 1800, `${level.night}: usable width`);
  assert.equal(level.ground.points[0][0], 0, `${level.night}: ground starts at 0`);
  assert.equal(level.ground.points.at(-1)[0], level.width, `${level.night}: ground ends at width`);
  for (let i = 1; i < level.ground.points.length; i++) assert.ok(level.ground.points[i][0] > level.ground.points[i - 1][0], `${level.night}: ground points sorted`);
  for (const [a, b, floor] of level.gaps || []) {
    assert.ok(a >= 0 && b <= level.width && b > a, `${level.night}: gap within level`);
    assert.ok(b - a <= MAX_JUMP_GAP, `${level.night}: gap within jump/pounce reach`);
    assert.ok(floor >= Math.max(groundY(level, a), groundY(level, b)) && floor <= 550, `${level.night}: safe lower floor`);
  }
  for (const [a, b] of level.spawnZones) {
    assert.ok(a >= 80 && b <= level.width - 80 && b > a, `${level.night}: valid spawn zone`);
    assert.ok(!(level.gaps || []).some(([x, y]) => a < y && b > x), `${level.night}: spawn zone excludes pit`);
  }
  const allPoints = [...level.hideSpots, ...level.burySpots, level.catStart];
  for (const x of allPoints) {
    assert.ok(x >= 0 && x <= level.width, `${level.night}: spot/start within width`);
    assert.ok(!(level.gaps || []).some(([a, b]) => x > a && x < b), `${level.night}: spot/start outside pit`);
  }
  for (const x of level.burySpots) {
    for (const prop of level.props) {
      const pathX = prop.path?.map(([px]) => px) || [prop.x], minX=Math.min(...pathX), maxX=Math.max(...pathX)+(prop.w||80);
      assert.ok(x < minX - 30 || x > maxX + 30, `${level.night}: burial spot ${x} overlaps ${prop.kind}`);
    }
    for (const [px,py,w,type,extra] of level.platforms) {
      const path=type==='moving'?extra.path:[[px,py]], floor=terrainY(level,x);
      assert.ok(!path.some(([sx,sy]) => x+40 >= sx && x-40 <= sx+w && sy <= floor && sy+12 >= floor-40), `${level.night}: burial spot ${x} is hidden under platform`);
    }
  }
  for (const p of level.platforms) {
    const [x, y, w, type, extra] = p;
    assert.ok(x >= 0 && x + w <= level.width, `${level.night}: platform within width`);
    assert.ok(['static', 'moving', 'crumbling', 'bouncy'].includes(type), `${level.night}: supported platform type`);
    const positions = type === 'moving' ? extra.path : [[x, y]];
    assert.ok(positions?.length, `${level.night}: moving platform path`);
    for (const [px, py] of positions) {
      const floor = terrainY(level, px);
      assert.ok(py < floor, `${level.night}: platform surface above ground`);
      assert.ok(floor - py <= MAX_JUMP_HEIGHT + 1, `${level.night}: platform reachable from ground with configured jump`);
      if (type === 'moving') assert.ok(px >= 0 && px + w <= level.width, `${level.night}: moving path stays in bounds`);
    }
  }
  assert.ok(level.catStart > 0 && level.catStart < level.width, `${level.night}: valid cat start`);
}
assert.equal(layouts().length, 10, 'seven story nights plus three Free Play trails');
for (const level of layouts()) check(level);
console.log(`Validated ${layouts().length} level layouts; max jump rise ${MAX_JUMP_HEIGHT.toFixed(1)}px and max jump/pounce gap ${MAX_JUMP_GAP}px.`);
