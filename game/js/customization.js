
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
  var bucket = Math.max(24, Math.round(px / 6) * 6), id = key + ':' + bucket;
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
// Find where to separate the near and far paw of each leg pair: the emptiest column of the
// leg area. Cutting anywhere else slices through a paw and tears it apart while walking.
var MK_CUTS = {};
function mkPawCuts(spr, splitS, hipS) {
  var id = spr.width + 'x' + spr.height + ':' + splitS + ':' + hipS;
  if (MK_CUTS[id]) return MK_CUTS[id];
  var sw = spr.width, sh = spr.height, band = sh - hipS, cuts = [0, null, splitS, null, sw];
  try {
    var d = spr.getContext('2d').getImageData(0, hipS, sw, band).data, col = new Array(sw).fill(0);
    for (var y = 0; y < band; y++) for (var x = 0; x < sw; x++) if (d[(y * sw + x) * 4 + 3] > 40) col[x]++;
    var pick = function (a, b) {
      var best = -1, bestN = Infinity;
      for (var x = Math.round(a + (b - a) * .25); x <= Math.round(a + (b - a) * .75); x++) if (col[x] < bestN) { bestN = col[x]; best = x; }
      return bestN <= Math.max(1, band * .06) ? best : null;
    };
    cuts[1] = pick(0, splitS); cuts[3] = pick(splitS, sw);
  } catch (e) {}
  return (MK_CUTS[id] = cuts);
}
function mkDrawRig(g, key, dx, dy, dw, dh, pose) {
  var big = mkGetSprite(key), r = MK_RIGS[key];
  if (!big || !big.complete || !big.naturalWidth || !r) return false;
  var m = g.getTransform ? g.getTransform() : null, scl = m ? Math.hypot(m.c, m.d) || 1 : 1;
  var spr = mkSmallSprite(key, big, Math.min(big.naturalHeight, dh * scl * 1.5));
  var sw = spr.width, sh = spr.height, kx = dw / sw, ky = dh / sh;
  var hipS = Math.round(sh * r.hip), splitS = Math.round(sw * r.split);
  var tW = Math.round(sw * r.tailW), tH = Math.round(sh * r.tailH);
  var legS = sh - hipS, dHip = hipS * ky, legD = legS * ky;
  // bodyY (draw px, negative = up) moves only the body; the feet stay on the ground line.
  // backLift / frontLift (0..1 of the leg length) raise a paw while that leg swings forward.
  var bodyY = pose.bodyY || 0;
  function piece(sx, sy, sW, sH) { g.drawImage(spr, sx, sy, sW, sH, dx + sx * kx, dy + bodyY + sy * ky, sW * kx, sH * ky); }
  // legs first (behind the body edge), with a static belly patch to hide the gap between them
  var mid0 = Math.max(0, splitS - Math.round(sw * .08)), mid1 = Math.min(sw, splitS + Math.round(sw * .08));
  piece(mid0, hipS, mid1 - mid0, Math.round(legS * .22));
  // Start the paw crops slightly above the visible feet so the rig's joints stay hidden.
  var footS = hipS + Math.round(legS * .22);
  // each paw hangs from the hip and reaches down to the ground, or a little above it while lifted
  function legPart(x0, x1, sy, sH, shear, lift) {
    if (x1 <= x0 || sH <= 0) return;
    var reach = legD - (lift || 0) * legD - bodyY, sc = Math.max(.55, reach / legD);
    g.save(); g.translate(dx + x0 * kx, dy + dHip + bodyY); g.transform(1, 0, shear * sc, sc, 0, 0);
    g.drawImage(spr, x0, sy, x1 - x0, sH, 0, (sy - hipS) * ky, (x1 - x0) * kx, sH * ky); g.restore();
  }
  // Separate each silhouette into near/far paws. A small overlap avoids seams where the
  // source painting has paws touching; each paw can now plant and lift on its own beat.
  var ov = Math.max(2, Math.round(sh * .008)), pawCuts = mkPawCuts(spr, splitS, hipS);
  var legAngles = pose.legAngles || [pose.back || 0, pose.back || 0, pose.front || 0, pose.front || 0];
  var legLifts = pose.legLifts || [pose.backLift || 0, pose.backLift || 0, pose.frontLift || 0, pose.frontLift || 0];
  // A leg pair with no clear gap between its two paws moves as one piece, so a paw is never torn in half.
  if (pawCuts[1] === null) { legAngles = [(legAngles[0] + legAngles[1]) / 2, 0, legAngles[2], legAngles[3]]; legLifts = [(legLifts[0] + legLifts[1]) / 2, 0, legLifts[2], legLifts[3]]; }
  if (pawCuts[3] === null) { legAngles = [legAngles[0], legAngles[1], (legAngles[2] + legAngles[3]) / 2, 0]; legLifts = [legLifts[0], legLifts[1], (legLifts[2] + legLifts[3]) / 2, 0]; }
  pawCuts = [0, pawCuts[1] === null ? splitS : pawCuts[1], splitS, pawCuts[3] === null ? sw : pawCuts[3], sw];
  for (var li = 0; li < 4; li++) {
    var x0 = Math.max(0, pawCuts[li] - (li ? 1 : 0)), x1 = Math.min(sw, pawCuts[li + 1] + (li < 3 ? 1 : 0));
    legPart(x0, x1, hipS, footS - hipS, legAngles[li] || 0, legLifts[li] || 0);
    legPart(x0, x1, footS - ov, sh - footS + ov, legAngles[li] || 0, legLifts[li] || 0);
  }
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
