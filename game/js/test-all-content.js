/* Seed data that depends on the game's published Heart Workshop content list. */
(function () {
  'use strict';
  if (!window.TC_TEST_ALL_UNLOCKED || !window.TCHeartData) return;
  const data = window.TCHeartData;
  const stock = Object.fromEntries(data.feelings.map(feeling => [feeling.id, 99]));
  const allFeelings = data.feelings.map(feeling => feeling.id);
  const heart = { stock, discovered: allFeelings, lit: data.places.map(place => place.id), ending: true };
  try { localStorage.setItem('mk-heart-v1', JSON.stringify(heart)); } catch (error) {}

  // The older story epilogue has its own ten-place town save alongside Heart Workshop's 50-place town.
  const oldTownPlaces = ['lamps','school','wall','swings','gate','tree','bridge','art','hnin','home'];
  try { localStorage.setItem('mk-town', JSON.stringify(Object.fromEntries(oldTownPlaces.map(id => [id, true])))); } catch (error) {}
  const levels = window.TC_LEVELS || {};
  const keepsakes = [];
  for (let night = 1; night <= 50; night++) {
    const level = levels[night];
    if (!level) continue;
    (level.keepsakes || []).forEach((_, index) => keepsakes.push(`n${night}-${index}`));
    if (!(level.feelingsNeeded || {}).B) keepsakes.push(`n${night}-dig`);
  }
  try { localStorage.setItem('mk-keepsakes', JSON.stringify(keepsakes)); } catch (error) {}
  try { localStorage.setItem('mk-mixes', JSON.stringify(Object.fromEntries([
    'anticipation','peaceful','determined','brave','admiration','relief','embarrassed','grumpy','nostalgia','hopeful','homesick','curious','sulky','proud','restless','cheerful','gentle','worried','confident','grateful','joy','friendship','kindness','courage','forgiving','comfort','patience','happiness','love','pride','wonder','belonging','wholeheart'
  ].map(id => [id, true])))); } catch (error) {}
})();
