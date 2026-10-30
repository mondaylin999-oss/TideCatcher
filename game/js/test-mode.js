/* Test mode: open the game with ?test=1 (TideCatcher-TEST.html does this).
   - Keeps a separate save: every saved key is stored as "tc-test:<key>", so testing never touches real progress.
   - Unlocks every night, cat, trail and item, and gives unlimited Glow (see game.js, search TC_TEST).
   - Shows a small "TEST MODE" badge so it is never confused with the real game.
   Without ?test=1 this file does nothing. */
(function () {
  'use strict';
  var on = /[?&]test=1\b/.test(location.search) || /#test\b/.test(location.hash);
  if (!on) return;
  window.TC_TEST = true;
  var P = 'tc-test:', proto = Storage.prototype, get = proto.getItem, set = proto.setItem, rem = proto.removeItem;
  // settings worth carrying over from the real save (names, cat, sound, controls); progress is not copied
  var CARRY = { 'mk-profile': 1, 'mk-onboarding': 1, 'tc-audio': 1, 'mk-controls-v1': 1 };
  proto.getItem = function (k) {
    if (this !== window.localStorage) return get.call(this, k);
    var v = get.call(this, P + k);
    if (v === null && CARRY[k]) v = get.call(this, k);
    return v;
  };
  proto.setItem = function (k, v) { return this === window.localStorage ? set.call(this, P + k, v) : set.call(this, k, v); };
  proto.removeItem = function (k) { return this === window.localStorage ? rem.call(this, P + k) : rem.call(this, k); };
  try {
    var ls = window.localStorage;
    ls.setItem('mk-progress', '50');                    // every story night and endless night open
    ls.setItem('mk-glow', '999999');
    if (ls.getItem('mk-profile') === null) ls.setItem('mk-onboarding', JSON.stringify({ welcomeSeen: true, tutorialDone: true, tipsSeen: [], showTips: true }));
  } catch (e) {}
  document.addEventListener('DOMContentLoaded', function () {
    var b = document.createElement('div');
    b.textContent = 'TEST MODE · everything unlocked · unlimited Glow';
    b.setAttribute('aria-hidden', 'true');
    b.style.cssText = 'position:fixed;left:50%;top:max(4px,env(safe-area-inset-top));transform:translateX(-50%);z-index:99999;pointer-events:none;font:700 11px/1.6 system-ui,sans-serif;letter-spacing:.06em;color:#1b1030;background:#ffd36e;padding:1px 10px;border-radius:99px;opacity:.85';
    document.body.appendChild(b);
  });
})();
