/* Optional second-leap availability, kept separate from wall-jump and ledge mechanics. */
(function (root) {
  'use strict';
  const prime = (cat, owned) => { cat.extraJumpAvailable = !!owned; };
  const canUse = (cat, owned) => !!owned && !!cat.extraJumpAvailable;
  const consume = cat => {
    if (!cat.extraJumpAvailable) return false;
    cat.extraJumpAvailable = false;
    return true;
  };
  const land = cat => { cat.extraJumpAvailable = false; };
  root.TCJumpUpgrade = Object.freeze({ prime, canUse, consume, land });
})(typeof window !== 'undefined' ? window : globalThis);
