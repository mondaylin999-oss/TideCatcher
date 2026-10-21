
/* Player-chosen names and cat coat. Story text is written with the default names
   (Thiri / Shwe); every piece of on-screen text is swapped to the chosen names here,
   both in the page and on the canvas. */
var MK_COATS = {
  ginger: { name: 'Ginger Tabby', body: '#f0a050', dark: '#c0702c', belly: '#fbd2a0', alt: '#f0a050', img: 'assets/cats/ginger-realistic-sprite.png', heroImg: 'assets/cats/ginger-realistic.png' },
  burmese: { name: 'Burmese', body: '#efb44a', dark: '#c98a2c', belly: '#fbd98f', alt: '#efb44a', img: 'assets/cats/burmese-realistic.png' },
  siamese: { name: 'Siamese', body: '#efdcc0', dark: '#4a2c22', belly: '#f8ecd8', alt: '#efdcc0', img: 'assets/cats/siamese-realistic.png' },
  persian: { name: 'Persian', body: '#f1ebe4', dark: '#c9bcb0', belly: '#fffaf4', alt: '#f1ebe4', img: 'assets/cats/persian-realistic.png' },
  mainecoon: { name: 'Maine Coon', body: '#8a6440', dark: '#4a3220', belly: '#d8c3a0', alt: '#8a6440', img: 'assets/cats/mainecoon-realistic.png' },
  ragdoll: { name: 'Ragdoll', body: '#ecdfcc', dark: '#6e4a33', belly: '#fff8ee', alt: '#ecdfcc', img: 'assets/cats/ragdoll-realistic.png' },
  british: { name: 'British Shorthair', body: '#8a8d99', dark: '#5c5f6b', belly: '#a9acb6', alt: '#8a8d99', img: 'assets/cats/british-realistic.png' },
  bengal: { name: 'Bengal', body: '#d98a2c', dark: '#3a2414', belly: '#f2c98a', alt: '#d98a2c', img: 'assets/cats/bengal-realistic.png' },
  sphynx: { name: 'Sphynx', body: '#f0a6a6', dark: '#c97a80', belly: '#f8c4c0', alt: '#f0a6a6', img: 'assets/cats/sphynx-realistic.png' }
};
var MK_OLD_COATS = { golden: 'ginger', silver: 'british', midnight: 'british', calico: 'ragdoll' };
var MK_SPRITES = Object.create(null);
function mkGetSprite(key) {
  if (!MK_SPRITES[key] && MK_COATS[key]) { var im = new Image(); MK_SPRITES[key] = im; im.src = MK_COATS[key].img; }
  return MK_SPRITES[key];
}
/* Cat animation rig: each sprite is cut into body, tail, back legs and front legs,
   which bend separately to make walk, jump, pounce, scratch and idle poses. */
var MK_RIGS = {
  ginger: { hip: .750, split: .519, tailW: .318, tailH: .628, tailAmp: .75 },
  burmese: { hip: .725, split: .452, tailW: .286, tailH: .576, tailAmp: 1 },
  siamese: { hip: .706, split: .469, tailW: .304, tailH: .547, tailAmp: 1 },
  persian: { hip: .793, split: .462, tailW: .333, tailH: .647, tailAmp: .6 },
  mainecoon: { hip: .750, split: .519, tailW: .318, tailH: .628, tailAmp: .75 },
  ragdoll: { hip: .795, split: .433, tailW: .300, tailH: .608, tailAmp: .75 },
  british: { hip: .793, split: .490, tailW: .283, tailH: .517, tailAmp: .9 },
  bengal: { hip: .725, split: .457, tailW: .284, tailH: .614, tailAmp: 1 },
  sphynx: { hip: .713, split: .488, tailW: .285, tailH: .670, tailAmp: 1 }
};
function mkDrawRig(g, key, dx, dy, dw, dh, pose) {
  var spr = mkGetSprite(key), r = MK_RIGS[key];
  if (!spr || !spr.complete || !spr.naturalWidth || !r) return false;
  var sw = spr.naturalWidth, sh = spr.naturalHeight, kx = dw / sw, ky = dh / sh;
  var hipS = Math.round(sh * r.hip), splitS = Math.round(sw * r.split);
  var tW = Math.round(sw * r.tailW), tH = Math.round(sh * r.tailH);
  var legS = sh - hipS, dHip = hipS * ky, dLeg = legS * ky;
  function piece(sx, sy, sW, sH) { g.drawImage(spr, sx, sy, sW, sH, dx + sx * kx, dy + sy * ky, sW * kx, sH * ky); }
  // legs first (behind the body edge), with a static belly patch to hide the gap between them
  var mid0 = Math.max(0, splitS - Math.round(sw * .08)), mid1 = Math.min(sw, splitS + Math.round(sw * .08));
  piece(mid0, hipS, mid1 - mid0, Math.round(legS * .22));
  [[0, splitS, pose.back || 0], [splitS, sw - splitS, pose.front || 0]].forEach(function (p) {
    g.save(); g.translate(dx + p[0] * kx, dy + dHip); g.transform(1, 0, p[2], 1, 0, 0);
    g.drawImage(spr, p[0], hipS, p[1], legS, 0, 0, p[1] * kx, dLeg); g.restore();
  });
  // upper body (breathes from the hip line), then the tail swaying from its base
  g.save(); g.translate(0, dy + dHip); g.scale(1, 1 + (pose.breath || 0)); g.translate(0, -(dy + dHip));
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
    g.save(); g.translate(dx + x0 * kx, dy + tH * ky); g.transform(1, 0, tk * f, 1, 0, 0);
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
