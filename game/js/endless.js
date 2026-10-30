/* Endless Nights (levels 8–50): every level is built from its number.
   Before each level the player picks 1 of 3 night cards (a place, its version, the Moodlings it needs and
   whether a torn drawing piece is hidden there), and may add optional challenges for a bigger reward.
   Pure data + rules: game.js asks for cards and a plan, then plays it. Progress lives in localStorage. */
(function (root) {
  'use strict';
  const KEY = 'mk-endless-v1';
  const PLACES = {
    school: { name: 'School', icon: '🏫', map: 'school', types: ['F', 'N', 'J', 'S'], color: '#b9a4ff' },
    park: { name: 'Park', icon: '🌳', map: 'park', types: ['L', 'S', 'F', 'E'], color: '#8fd6a0' },
    festival: { name: 'Festival', icon: '🏮', map: 'festival', types: ['E', 'N', 'S', 'J'], color: '#ffb36b' },
    hill: { name: 'Hilltop', icon: '⛰️', map: 'hill', types: ['B', 'F', 'L', 'N'], color: '#a9b8d8' },
    lake: { name: 'Lake', icon: '🌊', map: 'lake', types: ['C', 'L', 'S', 'E'], color: '#8fd0ff' },
    rooftop: { name: 'Rooftops', icon: '🏘️', map: 'rooftop', types: ['J', 'N', 'E', 'F'], color: '#ffd38a', from: 11 },
    market: { name: 'Night Market', icon: '🍢', map: 'market', types: ['E', 'J', 'N', 'S'], color: '#ff7ab6', from: 18 },
    garden: { name: 'Pagoda Garden', icon: '🪷', map: 'garden', types: ['C', 'L', 'S', 'B'], color: '#ffd166', from: 28 },
    pagoda: { name: 'Pagoda Hill', icon: '🛕', map: 'pagoda', types: ['C', 'L', 'N', 'S'], color: '#e9cb91', from: 34 },
    train: { name: 'Night Train Platform', icon: '🚂', map: 'train', types: ['N', 'L', 'J', 'S'], color: '#9fd6d2', from: 39 }
  };
  const PLACE_ORDER = ['school', 'park', 'festival', 'hill', 'lake', 'rooftop', 'market', 'garden', 'pagoda', 'train'];
  // Each card selects its place and version; painted and code-drawn maps share the same level flow.
  const VARIANTS = {
    school: [{ id: '', from: 8 }, { id: 'rainy', from: 12 }, { id: 'sunrise', from: 36 }],
    park: [{ id: '', from: 8 }, { id: 'blossom', from: 16 }, { id: 'autumn', from: 38 }],
    festival: [{ id: '', from: 8 }, { id: 'fireworks', from: 22 }, { id: 'candle', from: 42 }],
    hill: [{ id: '', from: 8 }, { id: 'foggy', from: 26 }, { id: 'shooting', from: 44 }],
    lake: [{ id: '', from: 8 }, { id: 'snowy', from: 32 }, { id: 'moonlit', from: 47 }],
    rooftop: [{ id: '', from: 11 }],
    market: [{ id: '', from: 18 }],
    garden: [{ id: '', from: 28 }],
    pagoda: [{ id: '', from: 34 }],
    train: [{ id: '', from: 39 }]
  };
  const TWISTS = {
    rainy: { name: 'Rainy', icon: '🌧️', twist: 'Rain hides your footsteps: Nervous hardly hears you. Puddles are slippery.' },
    sunrise: { name: 'Sunrise', icon: '🌅', twist: 'The sun is close: 15 seconds less, but every catch adds 2 seconds.' },
    blossom: { name: 'Blossom', icon: '🌸', twist: 'Petal gusts push Shwe along the path.' },
    autumn: { name: 'Autumn', icon: '🍂', twist: 'Leaf piles: one more buried feeling to dig up.' },
    fireworks: { name: 'Fireworks', icon: '🎆', twist: 'Each burst lights the whole street, and anything hidden in it.' },
    candle: { name: 'Candle', icon: '🕯️', twist: 'Candle lanterns drift down. Step out of their glow.' },
    foggy: { name: 'Foggy', icon: '🌫️', twist: 'Fog hides the Moodlings until you are close. Night Eyes cut through it.' },
    shooting: { name: 'Shooting-Star', icon: '🌠', twist: 'More feelings fall from the sky tonight.' },
    snowy: { name: 'Snowy', icon: '❄️', twist: 'Snow drifts sparkle along the path.' },
    moonlit: { name: 'Moonlit', icon: '🌙', twist: 'A bright moon: Night Eyes last twice as long.' }
  };
  const CHALLENGES = [
    { id: 'short', icon: '⏱️', name: 'Short night', reward: '+20% Glow', note: 'A quarter less time.' },
    { id: 'noeyes', icon: '🙈', name: 'No Night Eyes', reward: '+1 star', note: 'Night Eyes stay closed.' },
    { id: 'fast', icon: '⚡', name: 'Fast feelings', reward: '+20% Glow', note: 'Moodlings move faster.' },
    { id: 'onebump', icon: '💔', name: 'One bump', reward: '×2 Glow', note: 'One hit or fall ends the night.' },
    { id: 'rainy', icon: '🌧️', name: 'Rainy', reward: '+lights', note: 'Slippery puddles. Every 2nd catch brings an extra light.' }
  ];
  const SPECIALS = {
    10: { id: 'golden', icon: '⭐', name: 'All-Golden night', note: 'Golden lights everywhere. Double Glow.' },
    40: { id: 'golden', icon: '⭐', name: 'All-Golden night', note: 'Golden lights everywhere. Double Glow.' },
    20: { id: 'storm', icon: '⛈️', name: 'Storm', note: 'It is dark. Lightning reveals where everything is.' },
    30: { id: 'rush', icon: '🔥', name: 'Frustrated rush', note: 'Mostly Frustrated tonight, and they charge faster.' },
    50: { id: 'finale', icon: '🏆', name: 'Finale', note: 'Every Moodling comes out. Bring them all home to become Keeper of Dreams.' }
  };
  const FINALE_NEED = { F: 3, N: 3, L: 3, S: 3, E: 2, J: 2, B: 2, C: 2 };
  const NAMES = { F: 'Frustrated', N: 'Nervous', L: 'Lonely', S: 'Shy', E: 'Excited', J: 'Jealous', B: 'Buried', C: 'Calm', G: 'Golden' };
  const CAPS = { C: 4, B: 4 }, CAP = 8;
  const DRAWING_PLACES = ['school', 'park', 'festival', 'hill', 'lake'];
  const PIECES = 6;

  const rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const load = () => { try { return Object.assign({ seen: [], pieces: {}, chests: [], badge: false, best: {} }, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { return { seen: [], pieces: {}, chests: [], badge: false, best: {} }; } };
  let S = load();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };

  // ---------- difficulty: grows, then caps ----------
  function difficulty(night) {
    const n = Math.max(8, Math.min(50, night));
    if (n <= 25) return { count: Math.round(10 + (n - 8) * 5 / 17), time: Math.round(140 - (n - 8) * 25 / 17) };
    if (n <= 45) return { count: Math.round(15 + (n - 25) * 5 / 20), time: Math.round(115 - (n - 25) * 25 / 20) };
    return { count: 20, time: 90 };
  }
  const placesOpen = night => PLACE_ORDER.filter(p => night >= (PLACES[p].from || 8));
  const variantsOpen = (place, night) => VARIANTS[place].filter(v => night >= v.from);
  const newOn = night => { for (const p of PLACE_ORDER) for (const v of VARIANTS[p]) if ((v.id || PLACES[p].from) && v.from === night) return { place: p, variant: v.id }; return null; };
  const mapName = (place, variant) => `${variant ? TWISTS[variant].name + ' ' : ''}${PLACES[place].name}`;
  const mapIcon = (place, variant) => variant ? TWISTS[variant].icon : PLACES[place].icon;

  function split(types, total, r) {
    const need = {};
    let w = types.map(() => .7 + r() * .6); const sum = w.reduce((a, b) => a + b, 0);
    types.forEach((t, i) => { need[t] = Math.max(1, Math.round(total * w[i] / sum)); });
    let diff = total - Object.values(need).reduce((a, b) => a + b, 0);
    need[types[0]] += diff;
    // no single Moodling asked for too many times (Calm and Buried take longest, so fewer of those)
    for (let pass = 0; pass < 4; pass++) for (const t of types) {
      const cap = CAPS[t] || CAP; if (need[t] <= cap) continue;
      const over = need[t] - cap; need[t] = cap;
      const to = types.filter(x => need[x] < (CAPS[x] || CAP)).sort((a, b) => need[a] - need[b])[0];
      if (to) need[to] += over;
    }
    for (const t of Object.keys(need)) if (need[t] <= 0) delete need[t];
    return need;
  }
  // ---------- the three night cards ----------
  function cards(night) {
    const r = rng(night * 7919 + 131), forced = newOn(night), d = difficulty(night);
    let pool = placesOpen(night).slice();
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    if (forced) pool = [forced.place, ...pool.filter(p => p !== forced.place)];
    return pool.slice(0, 3).map((place, k) => {
      const open = variantsOpen(place, night);
      let variant = forced && forced.place === place ? forced.variant : open[Math.floor(r() * open.length)].id;
      const nTypes = d.count < 13 ? 2 : d.count < 18 ? 3 : 4;
      const types = PLACES[place].types.slice().sort(() => r() - .5).slice(0, nTypes);
      const need = split(types, d.count, r);
      const drawing = DRAWING_PLACES.includes(place) ? place : null;
      const done = drawing ? piecesOf(drawing).length >= PIECES : true;
      const piece = drawing && !done && (forced?.place === place || r() < .6) ? drawing : null;
      return { k, place, variant, need, piece, pieceDone: !!drawing && done, newMap: (!!variant || !!PLACES[place].from) && !S.seen.includes(place + ':' + variant), name: mapName(place, variant), icon: mapIcon(place, variant) };
    });
  }
  // ---------- one level, from a card and the chosen challenges ----------
  function plan(night, card, chosen = []) {
    const d = difficulty(night), sp = SPECIALS[night] || null, ch = new Set(chosen);
    let need = { ...card.need };
    if (sp?.id === 'rush') { const others = Object.keys(need).filter(t => t !== 'F'), f = Math.ceil(d.count * .65); need = { F: f, ...split(others.length ? others : ['N'], d.count - f, rng(night)) }; }
    if (sp?.id === 'finale') need = { ...FINALE_NEED };
    if (card.variant === 'autumn') need.B = Math.min(CAPS.B, (need.B || 0) + 1);
    let time = d.time;
    if (card.variant === 'sunrise') time -= 15;
    if (ch.has('short')) time = Math.round(time * .75);
    if (sp?.id === 'finale') time += 30;
    const twists = [card.variant, ch.has('rainy') ? 'rain' : ''].filter(Boolean);
    const rain = card.variant === 'rainy' || ch.has('rainy');
    let glowMult = 1 + (ch.has('short') ? .2 : 0) + (ch.has('fast') ? .2 : 0);
    if (ch.has('onebump')) glowMult *= 2;
    if (sp?.id === 'golden') glowMult *= 2;
    return {
      night, card, place: card.place, variant: card.variant, map: PLACES[card.place].map, special: sp, need, time, twists, challenges: [...ch],
      glowMult, extraStar: ch.has('noeyes'), noEyes: ch.has('noeyes'), oneBump: ch.has('onebump'), extraLights: ch.has('rainy'),
      hearing: rain ? .55 : 1, speed: ch.has('fast') ? 1.25 : 1, charge: sp?.id === 'rush' ? 1.3 : 1, skyBonus: card.variant === 'shooting' ? 2 : 0,
      eyesMul: card.variant === 'moonlit' ? 2 : 1, catchBonus: card.variant === 'sunrise' ? 2 : 0,
      fog: card.variant === 'foggy', storm: sp?.id === 'storm', golden: sp?.id === 'golden', reveal: card.variant === 'fireworks' || sp?.id === 'storm',
      fx: [card.variant, rain && card.variant !== 'rainy' ? 'rainy' : '', sp?.id === 'storm' ? 'storm' : '', sp?.id === 'golden' ? 'golden' : ''].filter(Boolean),
      piece: card.piece,
      title: `${mapName(card.place, card.variant)}${sp ? ' · ' + sp.name : ''}`
    };
  }
  function markPlayed(p) { const id = p.place + ':' + p.variant; if (!S.seen.includes(id)) { S.seen.push(id); save(); } }

  // ---------- Thiri's sketchbook: 5 drawings × 6 torn pieces, then a 6th ----------
  function piecesOf(place) { return (S.pieces[place] || []).slice(); }
  function nextPiece(place) { const have = piecesOf(place); for (let i = 0; i < PIECES; i++) if (!have.includes(i)) return i; return -1; }
  function addPiece(place, i) {
    const have = S.pieces[place] || (S.pieces[place] = []);
    if (i < 0 || have.includes(i)) return null;
    have.push(i); save();
    const complete = have.length >= PIECES, all = DRAWING_PLACES.every(p => piecesOf(p).length >= PIECES);
    return { place, count: have.length, of: PIECES, complete, all };
  }
  const piecesTotal = () => DRAWING_PLACES.reduce((s, p) => s + piecesOf(p).length, 0);
  const drawingsDone = () => DRAWING_PLACES.filter(p => piecesOf(p).length >= PIECES);

  // ---------- rewards ----------
  function chest(night) {
    if (night % 10 !== 0 || S.chests.includes(night)) return null;
    return { night, glow: 150 + night * 6, lights: Math.round(2 + night / 10) };
  }
  function claimChest(night) { if (!S.chests.includes(night)) { S.chests.push(night); save(); } }
  function giveBadge() { const was = S.badge; S.badge = true; save(); return !was; }

  const UNLOCKS = [];
  for (const p of PLACE_ORDER) for (const v of VARIANTS[p]) if (v.id) UNLOCKS.push({ level: v.from, place: p, variant: v.id, label: mapName(p, v.id), icon: mapIcon(p, v.id) });
  for (const p of ['rooftop', 'market', 'garden', 'pagoda', 'train']) UNLOCKS.push({ level: PLACES[p].from, place: p, variant: '', label: PLACES[p].name, icon: PLACES[p].icon });
  UNLOCKS.sort((a, b) => a.level - b.level);

  root.TCEndless = {
    PLACES, VARIANTS, TWISTS, CHALLENGES, SPECIALS, NAMES, DRAWING_PLACES, PIECES, UNLOCKS,
    difficulty, cards, plan, markPlayed, mapName, mapIcon,
    piecesOf, nextPiece, addPiece, piecesTotal, drawingsDone,
    chest, claimChest, giveBadge, hasBadge: () => !!S.badge,
    reload() { S = load(); }, current: null
  };
})(typeof window !== 'undefined' ? window : globalThis);
