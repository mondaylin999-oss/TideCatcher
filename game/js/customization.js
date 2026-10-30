
/* Player-chosen names and cat coat. Story text is written with the default names
   (Thiri / Shwe); every piece of on-screen text is swapped to the chosen names here,
   both in the page and on the canvas. */
var MK_COATS = {
  ginger: { name: 'Ginger Tabby', body: '#f0a050', dark: '#c0702c', belly: '#fbd2a0', alt: '#f0a050', img: 'assets/cats/ginger-toon.png', heroImg: 'assets/cats/ginger-cute-sit.png' },
  burmese: { name: 'Burmese', body: '#efb44a', dark: '#c98a2c', belly: '#fbd98f', alt: '#efb44a', img: 'assets/cats/burmese-toon.png', heroImg: 'assets/cats/burmese-cute-sit.png' },
  siamese: { name: 'Siamese', body: '#efdcc0', dark: '#4a2c22', belly: '#f8ecd8', alt: '#efdcc0', img: 'assets/cats/siamese-toon.png', heroImg: 'assets/cats/siamese-cute-sit.png' },
  persian: { name: 'Persian', body: '#f1ebe4', dark: '#c9bcb0', belly: '#fffaf4', alt: '#f1ebe4', img: 'assets/cats/persian-toon.png', heroImg: 'assets/cats/persian-cute-sit.png' },
  mainecoon: { name: 'Maine Coon', body: '#8a6440', dark: '#4a3220', belly: '#d8c3a0', alt: '#8a6440', img: 'assets/cats/mainecoon-toon.png', heroImg: 'assets/cats/mainecoon-cute-sit.png' },
  ragdoll: { name: 'Ragdoll', body: '#ecdfcc', dark: '#6e4a33', belly: '#fff8ee', alt: '#ecdfcc', img: 'assets/cats/ragdoll-toon.png', heroImg: 'assets/cats/ragdoll-cute-sit.png' },
  british: { name: 'British Shorthair', body: '#8a8d99', dark: '#5c5f6b', belly: '#a9acb6', alt: '#8a8d99', img: 'assets/cats/british-toon.png', heroImg: 'assets/cats/british-cute-sit.png' },
  bengal: { name: 'Bengal', body: '#d98a2c', dark: '#3a2414', belly: '#f2c98a', alt: '#d98a2c', img: 'assets/cats/bengal-toon.png', heroImg: 'assets/cats/bengal-cute-sit.png' },
  sphynx: { name: 'Sphynx', body: '#f0a6a6', dark: '#c97a80', belly: '#f8c4c0', alt: '#f0a6a6', img: 'assets/cats/sphynx-toon.png', heroImg: 'assets/cats/sphynx-cute-sit.png' }
};
var MK_OLD_COATS = { golden: 'ginger', silver: 'british', midnight: 'british', calico: 'ragdoll' };
var MK_SPRITES = Object.create(null);
function mkGetSprite(key) {
  if (!MK_SPRITES[key] && MK_COATS[key]) { var im = new Image(); MK_SPRITES[key] = im; im.src = MK_COATS[key].img; }
  return MK_SPRITES[key];
}
/* Cat animation rig: each sprite is cut into body, tail and four paw regions,
   which can follow a staggered, natural four-beat walk cycle. */
var MK_RIGS = {
  ginger: { hip: 0.763, split: .519, tailW: .318, tailH: 0.639, tailAmp: .75, low: 0.565 },
  burmese: { hip: 0.741, split: .452, tailW: .286, tailH: 0.589, tailAmp: 1, low: 0.562 },
  siamese: { hip: 0.761, split: .469, tailW: .304, tailH: 0.590, tailAmp: 1, low: 0.521 },
  persian: { hip: 0.817, split: .462, tailW: .333, tailH: 0.667, tailAmp: .6 },
  mainecoon: { hip: 0.754, split: .519, tailW: .318, tailH: 0.632, tailAmp: .75 },
  ragdoll: { hip: 0.834, split: .433, tailW: .300, tailH: 0.638, tailAmp: .75, low: 0.521 },
  british: { hip: 0.802, split: .490, tailW: .283, tailH: 0.523, tailAmp: .9, low: 0.597 },
  bengal: { hip: 0.762, split: .457, tailW: .284, tailH: 0.646, tailAmp: 1, low: 0.534 },
  sphynx: { hip: 0.732, split: .488, tailW: .285, tailH: 0.687, tailAmp: 1, low: 0.580 }
};
// The big painted sprite (about 500px) is drawn only ~70px tall in game. Shrinking it that much in one step
// every frame makes the fur shimmer and blur as the cat moves, so a smooth copy at the on-screen size is
// made once (halving step by step, which keeps the picture clean) and the rig draws from that.
var MK_SMALL = {};
function mkSmallSprite(key, spr, px) {
  var bucket = Math.max(24, Math.round(px / 2) * 2), id = key + ':' + bucket;
  if (MK_SMALL[id]) return MK_SMALL[id];
  var cur = spr, w = spr.naturalWidth, h = spr.naturalHeight;
  var tw = Math.round(w * bucket / h), th = bucket;
  while (h / 2 > th) {
    var c = document.createElement('canvas'); c.width = Math.round(w / 2); c.height = Math.round(h / 2);
    var cg = c.getContext('2d'); cg.imageSmoothingQuality = 'high'; cg.drawImage(cur, 0, 0, c.width, c.height);
    cur = c; w = c.width; h = c.height;
  }
  var out = document.createElement('canvas'); out.width = tw; out.height = th;
  var og = out.getContext('2d'); og.imageSmoothingQuality = 'high'; og.drawImage(cur, 0, 0, tw, th);
  return (MK_SMALL[id] = out);
}
// Where each leg sits in each cat painting, measured once from the images:
// [left, right, paw bottom] as fractions of the sprite, plus which gait slot it follows
// (0/1 hind paws, 2/3 fore paws). Stored as data so the walk works in every browser, including
// Firefox opening the game straight from a file, where reading image pixels is blocked.
var MK_LEG_MAP = {
  ginger: [[0.0, 0.271, 0.963, 0], [0.271, 0.574, 0.96, 1], [0.574, 1.0, 0.997, 2]],
  burmese: [[0.0, 0.265, 0.937, 0], [0.265, 0.565, 0.923, 1], [0.565, 0.721, 0.957, 2], [0.721, 1.0, 0.997, 3]],
  siamese: [[0.0, 0.244, 0.943, 0], [0.244, 0.523, 0.923, 1], [0.523, 0.697, 0.957, 2], [0.697, 1.0, 0.997, 3]],
  persian: [[0.0, 0.278, 0.96, 0], [0.278, 0.531, 0.957, 1], [0.531, 1.0, 0.997, 2]],
  mainecoon: [[0.0, 0.291, 0.96, 0], [0.291, 0.591, 0.957, 1], [0.591, 1.0, 0.997, 2]],
  ragdoll: [[0.0, 0.267, 0.927, 0], [0.267, 0.52, 0.913, 1], [0.52, 1.0, 0.997, 2]],
  british: [[0.0, 0.288, 0.933, 0], [0.288, 0.599, 0.927, 1], [0.599, 1.0, 0.997, 2]],
  bengal: [[0.0, 0.247, 0.933, 0], [0.247, 0.562, 0.93, 1], [0.562, 0.779, 0.997, 2], [0.779, 1.0, 0.99, 3]],
  sphynx: [[0.0, 0.254, 0.943, 0], [0.254, 0.599, 0.933, 1], [0.599, 1.0, 0.993, 2]]
};
function mkFindLegs(key, sw, sh) {
  var m = MK_LEG_MAP[key]; if (!m) return null;
  return m.map(function (l) { return { x0: Math.round(l[0] * sw), x1: Math.round(l[1] * sw), bottom: Math.round(l[2] * sh), slot: l[3] }; });
}
function mkDrawRig(g, key, dx, dy, dw, dh, pose) {
  var big = mkGetSprite(key), r = MK_RIGS[key];
  if (!big || !big.complete || !big.naturalWidth || !r) return false;
  var m = g.getTransform ? g.getTransform() : null, scl = m ? Math.hypot(m.c, m.d) || 1 : 1;
  // draw from a copy made at exactly the on-screen size, so the browser does not shrink it again (sharper fur and face)
  var spr = mkSmallSprite(key, big, Math.min(big.naturalHeight, dh * scl));
  var sw = spr.width, sh = spr.height, kx = dw / sw, ky = dh / sh;
  var hipS = Math.round(sh * r.hip), splitS = Math.round(sw * r.split);
  var tW = Math.round(sw * r.tailW), tH = Math.round(sh * r.tailH);
  var legS = sh - hipS, dHip = hipS * ky, legD = legS * ky;
  // bodyY (draw px, negative = up) moves only the body; the feet stay on the ground line.
  // backLift / frontLift (0..1 of the leg length) raise a paw while that leg swings forward.
  var bodyY = pose.bodyY || 0;
  function piece(sx, sy, sW, sH) { g.drawImage(spr, sx, sy, sW, sH, dx + sx * kx, dy + bodyY + sy * ky, sW * kx, sH * ky); }
  // legs first (behind the body edge), with a static belly patch to hide the gap between them
  // a static strip of thigh fur just under the body, so no gap opens at the hip as a leg swings
  piece(0, hipS - 2, sw, Math.round(legS * .2) + 2);
  // Start the paw crops slightly above the visible feet so the rig's joints stay hidden.
  var footS = hipS + Math.round(legS * .22);
  // Each leg is a two-joint limb cut from the painting: the thigh swings from the hip and the
  // shin folds at the knee, so a stepping paw really lifts and plants instead of just leaning.
  var ov = Math.max(2, Math.round(sh * .012));
  function leg(x0, x1, swing, lift, bottom) {
    if (x1 <= x0) return;
    var kneeS = hipS + Math.round((bottom - hipS) * .5);
    var px = dx + (x0 + x1) / 2 * kx, hy = dy + dHip + bodyY, w = (x1 - x0) * kx;
    var upper = (kneeS - hipS) * ky, lower = (sh - kneeS) * ky;
    var a = -swing * .62, bend = Math.min(1.1, (lift || 0) * 2.6);
    // a swung leg is shorter vertically; push a planted leg down by that much so its paw stays on the ground
    var plant = Math.max(0, 1 - (lift || 0) * 5), drop = (upper + lower) * (1 - Math.cos(a)) * plant;
    g.save(); g.translate(px, hy + drop); g.rotate(a);
    g.save(); g.translate(0, upper); g.rotate(bend);
    g.drawImage(spr, x0, kneeS - ov, x1 - x0, sh - kneeS + ov, -w / 2, -ov * ky, w, lower + ov * ky);
    g.restore();
    var up = Math.round(legS * .12);   // the thigh starts a little inside the body, so the hip joint stays hidden
    g.drawImage(spr, x0, hipS - up, x1 - x0, kneeS - hipS + up + 1, -w / 2, -up * ky, w, upper + (up + 1) * ky);
    g.restore();
  }
  var legAngles = pose.legAngles || [pose.back || 0, pose.back || 0, pose.front || 0, pose.front || 0];
  var legLifts = pose.legLifts || [pose.backLift || 0, pose.backLift || 0, pose.frontLift || 0, pose.frontLift || 0];
  var found = mkFindLegs(key, sw, sh), regions = [];
  if (found) found.forEach(function (l) { regions.push([l.x0, l.x1, legAngles[l.slot], legLifts[l.slot], l.bottom]); });
  else { regions.push([0, splitS, legAngles[0], legLifts[0], sh]); regions.push([splitS, sw, legAngles[2], legLifts[2], sh]); }
  // legs mid-stride (lifted) are drawn first, so the planted legs sit in front
  regions.sort(function (p, q) { return (q[3] || 0) - (p[3] || 0); });
  for (var li = 0; li < regions.length; li++) leg(regions[li][0], regions[li][1], regions[li][2], regions[li][3], regions[li][4]);
  // upper body (breathes from the hip line), then the tail swaying from its base
  g.save(); g.translate(0, dy + dHip + bodyY); g.scale(1, 1 + (pose.breath || 0)); g.translate(0, -(dy + dHip + bodyY));
  piece(tW, 0, sw - tW, hipS + 1);
  piece(0, tH, tW, hipS + 1 - tH);
  // tail box in vertical strips: full sway at the tip side, none where it meets the body.
  // Neighbouring strips sway by slightly different amounts, so each one is widened by
  // more than that difference; otherwise thin see-through lines appear in fluffy tails.
  var TS = 16, tk = (pose.tail || 0) * r.tailAmp;
  var pad = Math.ceil(Math.abs(tk) * tH * ky / kx / TS) + 2;
  for (var i = 0; i < TS; i++) {
    var a = Math.floor(tW * i / TS), b = Math.ceil(tW * (i + 1) / TS), f = 1 - (i + 1) / TS;
    var x0 = Math.max(0, a - 1), x1 = i === TS - 1 ? Math.min(sw, tW + 1) : Math.min(tW, b + pad);
    g.save(); g.translate(dx + x0 * kx, dy + bodyY + tH * ky); g.transform(1, 0, tk * f, 1, 0, 0);
    g.drawImage(spr, x0, 0, x1 - x0, tH + 1, 0, -tH * ky, (x1 - x0) * kx, (tH + 1) * ky); g.restore();
  }
  g.restore();
  return true;
}

var MK_PROFILE = { girl: 'Thiri', cat: 'Shwe', coat: 'ginger', welcomeSeen: false, tutorialDone: false, tipsSeen: [], showTips: true, tipLanguage: 'en' };
var MK_HAS_PROFILE = false;
try {
  var _p = JSON.parse(localStorage.getItem('mk-profile') || 'null');
  if (_p && typeof _p === 'object') {
    MK_HAS_PROFILE = true;
    if (typeof _p.girl === 'string' && _p.girl.trim()) MK_PROFILE.girl = _p.girl.trim().slice(0, 12);
    if (typeof _p.cat === 'string' && _p.cat.trim()) MK_PROFILE.cat = _p.cat.trim().slice(0, 12);
    if (MK_COATS[_p.coat]) MK_PROFILE.coat = _p.coat; else if (MK_OLD_COATS[_p.coat]) MK_PROFILE.coat = MK_OLD_COATS[_p.coat];
    MK_PROFILE.welcomeSeen = typeof _p.welcomeSeen === 'boolean' ? _p.welcomeSeen : true;
    MK_PROFILE.tutorialDone = typeof _p.tutorialDone === 'boolean' ? _p.tutorialDone : true;
    MK_PROFILE.tipsSeen = Array.isArray(_p.tipsSeen) ? _p.tipsSeen.filter(function (key) { return typeof key === 'string' && key.length < 60; }).slice(-100) : [];
    MK_PROFILE.showTips = _p.showTips !== false;
    MK_PROFILE.tipLanguage = _p.tipLanguage === 'my' ? 'my' : 'en';
  }
} catch (e) {}
if (!MK_HAS_PROFILE) {
  try {
    var _o = JSON.parse(localStorage.getItem('mk-onboarding') || 'null');
    if (_o && typeof _o === 'object') {
      if (typeof _o.welcomeSeen === 'boolean') MK_PROFILE.welcomeSeen = _o.welcomeSeen;
      if (typeof _o.tutorialDone === 'boolean') MK_PROFILE.tutorialDone = _o.tutorialDone;
      if (Array.isArray(_o.tipsSeen)) MK_PROFILE.tipsSeen = _o.tipsSeen.filter(function (key) { return typeof key === 'string' && key.length < 60; }).slice(-100);
      if (typeof _o.showTips === 'boolean') MK_PROFILE.showTips = _o.showTips;
      if (_o.tipLanguage === 'my') MK_PROFILE.tipLanguage = 'my';
    }
  } catch (e) {}
}
var COAT = MK_COATS[MK_PROFILE.coat];
function mkName(str) {
  if (typeof str !== 'string' || !/Thiri|Shwe|SHWE/.test(str)) return str;
  return str.replace(/Thiri|Shwe|SHWE/g, function (m) {
    return m === 'Thiri' ? MK_PROFILE.girl : m === 'Shwe' ? MK_PROFILE.cat : MK_PROFILE.cat.toUpperCase();
  });
}
(function () {
  var P = CanvasRenderingContext2D.prototype;
  ['fillText', 'strokeText', 'measureText'].forEach(function (fn) {
    var orig = P[fn];
    P[fn] = function (text) {
      var args = Array.prototype.slice.call(arguments);
      args[0] = mkName(text);
      return orig.apply(this, args);
    };
  });
})();
