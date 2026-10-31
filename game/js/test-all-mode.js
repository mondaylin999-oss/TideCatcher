/* Isolated all-unlocked test profile. Enabled only by index.html?testAll=1. */
(function () {
  'use strict';
  const params = new URLSearchParams(location.search);
  if (params.get('testAll') !== '1') return;

  let nativeStorage;
  try { nativeStorage = window.localStorage; void nativeStorage.length; }
  catch (error) {
    const memory = new Map();
    nativeStorage = {
      get length() { return memory.size; },
      key(index) { return [...memory.keys()][index] ?? null; },
      getItem(key) { return memory.has(String(key)) ? memory.get(String(key)) : null; },
      setItem(key, value) { memory.set(String(key), String(value)); },
      removeItem(key) { memory.delete(String(key)); }
    };
  }
  const prefix = 'tidecatcher-test-all:';
  const keys = () => {
    const found = [];
    for (let i = 0; i < nativeStorage.length; i++) {
      const key = nativeStorage.key(i);
      if (key && key.startsWith(prefix)) found.push(key.slice(prefix.length));
    }
    return found;
  };
  const storage = {
    get length() { return keys().length; },
    key(index) { return keys()[index] ?? null; },
    getItem(key) { const value = nativeStorage.getItem(prefix + String(key)); return value === null ? null : value; },
    setItem(key, value) { nativeStorage.setItem(prefix + String(key), String(value)); },
    removeItem(key) { nativeStorage.removeItem(prefix + String(key)); },
    clear() { keys().forEach(key => nativeStorage.removeItem(prefix + key)); }
  };
  const facade = new Proxy(storage, {
    ownKeys: target => [...Reflect.ownKeys(target), ...keys()],
    getOwnPropertyDescriptor(target, key) {
      if (Reflect.has(target, key)) return Object.getOwnPropertyDescriptor(target, key);
      if (typeof key === 'string' && keys().includes(key)) return { configurable: true, enumerable: true, writable: true, value: storage.getItem(key) };
    },
    get(target, key, receiver) {
      if (typeof key === 'string' && !Reflect.has(target, key)) return storage.getItem(key);
      return Reflect.get(target, key, receiver);
    },
    set(target, key, value) {
      if (typeof key === 'string' && !Reflect.has(target, key)) { storage.setItem(key, value); return true; }
      return Reflect.set(target, key, value);
    },
    has(target, key) { return Reflect.has(target, key) || (typeof key === 'string' && storage.getItem(key) !== null); }
  });
  try { Object.defineProperty(window, 'localStorage', { configurable: true, value: facade }); }
  catch (error) { console.error('TideCatcher test profile could not isolate browser storage.', error); return; }

  window.TC_TEST_ALL_UNLOCKED = true;
  const book = Object.fromEntries(['F0','F1','F2','F3','N0','N1','N2','N3','L0','L1','L2','L3','B0','B1','B2','E0','S0','J0','C0','C1','G0'].map(key => [key, 1]));
  const seed = {
    'mk-progress': '50', 'mk-thiri': '7', 'mk-awakening-seen': '1',
    'mk-profile': JSON.stringify({ girl: 'Thiri', cat: 'Shwe', coat: 'ginger', welcomeSeen: true, tutorialDone: true, tipsSeen: [], showTips: true, tipLanguage: 'en' }),
    'mk-onboarding': JSON.stringify({ welcomeSeen: true, tutorialDone: true, tipsSeen: [], showTips: true, tipLanguage: 'en' }),
    'mk-upg-v': '8', 'mk-upg': JSON.stringify({ pounce: 7, swift: 7, paws: 7, eyes: 7, purr: 7, secondLeap: 1 }), 'mk-glow': 'Infinity',
    'mk-cats': JSON.stringify(['ginger','burmese','bengal','persian','mainecoon','siamese','sphynx','ragdoll','british']),
    'mk-items': JSON.stringify({ scarf: 99, bell: 99, jar: 99, sand: 99 }),
    'mk-trails': JSON.stringify(['honey','mint','rose','sky','lilac','rainbow','moon','starlight']), 'mk-trail': 'rainbow',
    'mk-book': JSON.stringify(book), 'mk-moodling-seen': JSON.stringify(Object.keys(book)),
    'mk-stars': JSON.stringify(Object.fromEntries(Array.from({ length: 50 }, (_, i) => [i + 1, 3]))),
    'mk-paper-stars': JSON.stringify(Array.from({ length: 50 }, (_, i) => [0,1,2].map(star => `n${i + 1}-paper-${star}`)).flat()),
    'mk-secret-pages': JSON.stringify(['school','festival','lake','market','pagoda','free']),
    'mk-keepsakes': JSON.stringify([]),
    'mk-trinkets-found': JSON.stringify(['button','pebble','feather','cap','ribbon','goldbutton']),
    'mk-pouch': JSON.stringify(['button','pebble','feather','cap','ribbon','goldbutton']),
    'mk-shelf-claimed': JSON.stringify([]), 'mk-town-rewards': JSON.stringify([]),
    'mk-lights': JSON.stringify({ F: 99, N: 99, L: 99, S: 99, E: 99, J: 99, B: 99, C: 99, G: 99 }),
    'mk-mixes': JSON.stringify({}), 'mk-mix-hints': JSON.stringify({}),
    'mk-free-map': 'classic', 'mk-missions': 'null', 'mk-gentle-mode': '0', 'mk-map-guide-seen': '1',
    'mk-endless-v1': JSON.stringify({ seen: [], pieces: Object.fromEntries(['school','park','festival','hill','lake'].map(place => [place, [0,1,2,3,4,5]])), chests: [], badge: false, best: {} }),
    'mk-skyTutorial': JSON.stringify({ A: true, B: true, C: true })
  };
  Object.entries(seed).forEach(([key, value]) => { if (storage.getItem(key) === null) storage.setItem(key, value); });

  document.addEventListener('DOMContentLoaded', () => {
    const badge = document.createElement('div');
    badge.setAttribute('role', 'status');
    badge.textContent = 'TEST BUILD · ALL UNLOCKED · separate save';
    badge.style.cssText = 'position:fixed;z-index:10000;left:12px;bottom:12px;padding:7px 11px;border:1px solid #b9a2ff;border-radius:999px;background:#1b1531ed;color:#fff3cf;font:600 12px/1.2 system-ui,sans-serif;box-shadow:0 3px 14px #08051588;pointer-events:none';
    document.body.appendChild(badge);
  }, { once: true });
})();
