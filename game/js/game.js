
(() => {
  const cv = document.getElementById('game');
  let ctx = cv.getContext('2d'); // swapped briefly when drawing Moodling portraits for the Mood Book
  const $ = s => document.querySelector(s);
  const pauseBtn = document.getElementById('pauseBtn');
  const pauseScreen = document.getElementById('pauseScreen');
  const pauseContinueBtn = document.getElementById('pauseContinueBtn');
  const pauseQuitBtn = document.getElementById('pauseQuitBtn');
  const pauseHelpBtn = document.getElementById('pauseHelpBtn');
  let pauseTouchWasHidden = true;
  let pauseCoachWasHidden = true;
  const orientationGate = document.getElementById('orientationGate');
  const orientationTryBtn = document.getElementById('orientationTryBtn');
  const orientationStatus = document.getElementById('orientationStatus');
  const mobilePortraitQuery = window.matchMedia('(orientation: portrait)');
  const mobileLandscapeRequired = window.matchMedia('(pointer: coarse)').matches || (navigator.maxTouchPoints || 0) > 0;
  const mobileScreenOrientation = window.screen && window.screen.orientation;
  let orientationReturnFocus = null;
  function syncMobileOrientationGate() {
    const showGate = mobileLandscapeRequired && mobilePortraitQuery.matches;
    const wasVisible = !orientationGate.hidden;
    orientationGate.hidden = !showGate;
    if (showGate && !wasVisible) {
      orientationReturnFocus = document.activeElement;
      requestAnimationFrame(() => orientationTryBtn.focus({ preventScroll: true }));
    } else if (!showGate && wasVisible) {
      const target = orientationReturnFocus;
      orientationReturnFocus = null;
      if (target && target.isConnected && !target.closest('[hidden]')) target.focus({ preventScroll: true });
    }
  }
  async function tryMobileLandscape() {
    if (!mobileLandscapeRequired) return;
    if (!mobileScreenOrientation || typeof mobileScreenOrientation.lock !== 'function') {
      orientationStatus.textContent = 'Automatic rotation is unavailable in this browser. Turn your device sideways to continue.';
      return;
    }
    let enteredFullscreen = false;
    orientationTryBtn.disabled = true;
    orientationStatus.textContent = 'Trying to switch to landscape…';
    try {
      const root = document.documentElement;
      if (!document.fullscreenElement && typeof root.requestFullscreen === 'function') {
        try { await root.requestFullscreen(); enteredFullscreen = !!document.fullscreenElement; } catch (error) {}
      }
      await mobileScreenOrientation.lock('landscape');
      orientationStatus.textContent = 'Landscape requested. If the screen does not rotate, turn your device sideways.';
    } catch (error) {
      if (enteredFullscreen && document.fullscreenElement && typeof document.exitFullscreen === 'function') {
        try { await document.exitFullscreen(); } catch (exitError) {}
      }
      orientationStatus.textContent = 'Your browser blocked automatic rotation. Turn your device sideways to continue.';
    } finally {
      orientationTryBtn.disabled = false;
      syncMobileOrientationGate();
    }
  }
  orientationTryBtn.addEventListener('click', tryMobileLandscape);
  orientationGate.addEventListener('keydown', e => {
    e.stopPropagation();
    if (e.key === 'Tab') { e.preventDefault(); orientationTryBtn.focus({ preventScroll: true }); }
    else if (e.key === 'Escape') e.preventDefault();
  });
  window.addEventListener('resize', syncMobileOrientationGate, { passive: true });
  window.addEventListener('orientationchange', syncMobileOrientationGate, { passive: true });
  document.addEventListener('visibilitychange', syncMobileOrientationGate);
  if (typeof mobilePortraitQuery.addEventListener === 'function') mobilePortraitQuery.addEventListener('change', syncMobileOrientationGate);
  else mobilePortraitQuery.addListener(syncMobileOrientationGate);
  if (mobileScreenOrientation && typeof mobileScreenOrientation.addEventListener === 'function') mobileScreenOrientation.addEventListener('change', syncMobileOrientationGate);

  const T = 48, VH = 540, GROUND = 470;
  let WORLD = 4200;
  // Canvas UI shares the same palette and typography as the DOM menus.
  const uiTheme = getComputedStyle(document.documentElement);
  const uiToken = name => uiTheme.getPropertyValue(name).trim();
  const BLUE = uiToken('--sky'), RED = uiToken('--coral'), VIOLET = uiToken('--lilac'), GOLD = uiToken('--honey'), CALM = uiToken('--mint'), INK = uiToken('--cream'), MUTED = uiToken('--muted');
  const EXC = GOLD, SHY = uiToken('--pink'), JEAL = uiToken('--peach');
  const DISP = uiToken('--display'), BODY = uiToken('--body');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const col = ty => ty === 'F' ? RED : ty === 'N' ? VIOLET : ty === 'L' ? BLUE : ty === 'C' ? CALM : ty === 'B' ? '#a67646' : ty === 'E' ? EXC : ty === 'S' ? SHY : ty === 'J' ? JEAL : GOLD;

  // Scalar-radius fallback for older mobile WebViews.
  function canvasRoundRect(c, x, y, w, h, radius) {
    if (typeof c.roundRect === 'function') { c.roundRect(x, y, w, h, radius); return; }
    const r = Math.max(0, Math.min(radius, Math.abs(w) / 2, Math.abs(h) / 2));
    c.moveTo(x + r, y); c.lineTo(x + w - r, y);
    c.quadraticCurveTo(x + w, y, x + w, y + r);
    c.lineTo(x + w, y + h - r); c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    c.lineTo(x + r, y + h); c.quadraticCurveTo(x, y + h, x, y + h - r);
    c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y); c.closePath();
  }

  // ---------- sizing ----------
  let VW = 960, S = 1, OY = 0, dpr = 1, HUD_X = 68, HUD_CARD_W = 158;
  (function capGlow(c) {
    const d = Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype, 'shadowBlur');
    Object.defineProperty(c, 'shadowBlur', { get() { return d.get.call(this); }, set(v) { d.set.call(this, Math.min(v, 7)); } });
  })(ctx);
  function resize() {
    const w = innerWidth, h = innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    if (w * h * dpr * dpr > 1600000) dpr = Math.max(.75, Math.sqrt(1600000 / (w * h)));
    const pixelWidth = Math.round(w * dpr), pixelHeight = Math.round(h * dpr);
    // Assigning an unchanged size also clears the canvas.
    if (cv.width !== pixelWidth) cv.width = pixelWidth;
    if (cv.height !== pixelHeight) cv.height = pixelHeight;
    S = h / VH; VW = w / S; OY = 0;
    if (VW < 760) { S = w / 760; VW = 760; OY = (h / S - VH) / 2; }
    const pauseStyle = getComputedStyle(pauseBtn);
    const pauseLeft = parseFloat(pauseStyle.left) || 10;
    const pauseWidth = parseFloat(pauseStyle.width) || 48;
    HUD_X = (pauseLeft + pauseWidth + 10) / S;
    HUD_CARD_W = innerWidth <= 400 ? 150 : 158;
  }
  addEventListener('resize', resize); resize();

  // ---------- audio ----------
  let ac = null;
  const activeTones = new Map();
  // sound effects from the Cat & Moodlings pack (js/tc-sfx.js); safe to call even if the file is missing
  const sfx = (kind, ...args) => { try { if (window.TCSfx) TCSfx[kind](...args); } catch (e) {} };
  let nextCatVoiceAt = 0;
  function catVoice(kind, volume = .28, cooldown = 1100) {
    const now = performance.now();
    if (now < nextCatVoiceAt) return;
    nextCatVoiceAt = now + cooldown;
    sfx('cat', kind, volume);
  }
  // night music per place (js/tc-sfx.js): School 11 PM–Midnight, Park 1 AM, Festival 2 AM, Hilltop 3 AM, Lakeside 4–5 AM
  const music = (fn, a) => { try { if (window.TCMusic) TCMusic[fn](a); } catch (e) {} };
  function tone(f, d = .12, type = 'sine', v = .1, slide = 0) {
    if (!ac) return;
    const lv = window.TCSfx ? TCSfx.level() : 1; if (lv <= 0) return; v *= lv / .8;
    const key = `${type}:${Math.round(f / 10)}`;
    const copies = activeTones.get(key) || 0; if (copies >= 4) return;
    activeTones.set(key, copies + 1);
    try {
      const t0 = ac.currentTime, o = ac.createOscillator(), g = ac.createGain();
      const pitch = .95 + Math.random() * .1;
      o.type = type; o.frequency.setValueAtTime(f * pitch, t0);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, (f + slide) * pitch), t0 + d);
      g.gain.setValueAtTime(v, t0); g.gain.exponentialRampToValueAtTime(.0001, t0 + d);
      o.connect(g).connect(ac.destination); o.onended = () => activeTones.set(key, Math.max(0, (activeTones.get(key) || 1) - 1)); o.start(t0); o.stop(t0 + d + .03);
    } catch (e) { activeTones.set(key, Math.max(0, copies)); }
  }

  // ---------- input ----------
  const keys = {};
  const DEBUG_ALLOWED = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) && new URLSearchParams(location.search).get('debug') === '1';
  let debugLayout = false;
  let jumpQ = false, jumpHeld = false, pounceQ = false, scratchQ = false, scratchHeld = false, touchAxis = 0, mouseSneakHeld = false, mouseSneakPointerId = null, mouseSneakPress = null;
  addEventListener('keydown', e => {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'KeyS'].includes(e.code) && (state === 'play' || state === 'home')) e.preventDefault();
    keys[e.code] = true;
    if (e.code === 'F2' && DEBUG_ALLOWED) { e.preventDefault(); debugLayout = !debugLayout; return; }
    if (e.repeat) return;
    if ((e.code === 'Escape' || e.code === 'KeyP') && state === 'play') { e.preventDefault(); pauseGame(); return; }
    if ((e.code === 'Escape' || e.code === 'KeyP') && state === 'paused') { e.preventDefault(); sfx('ui', 'resume'); resumeGame(); return; }
    if ($('#nightWakeScreen') && !$('#nightWakeScreen').hidden) { if (['Space','Enter','Escape'].includes(e.code)) { e.preventDefault(); closeNightWake(); } return; }
    if (state === 'home' && (e.code === 'Space' || e.code === 'Enter')) { e.preventDefault(); homeKey(); return; }
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') { jumpQ = true; jumpHeld = true; }
    if (e.code === 'KeyJ' || e.code === 'KeyX') pounceQ = true;
    if (e.code === 'KeyK') purrQ = true;
    if (e.code === 'KeyE' || e.code === 'KeyL') eyesQ = true;
    if (e.code === 'KeyS') scratchQ = true;
    if (e.code === 'KeyH' && state === 'play') { e.preventDefault(); enterPortal(); }
  });
  addEventListener('keyup', e => { keys[e.code] = false; if (['Space', 'ArrowUp', 'KeyW'].includes(e.code)) jumpHeld = false; });
  addEventListener('blur', () => { for (const k in keys) keys[k] = false; scratchHeld = false; jumpHeld = false; mouseSneakHeld = false; mouseSneakPointerId = null; mouseSneakPress = null; });
  function axisNow() {
    const kb = ((keys.ArrowRight || keys.KeyD) ? 1 : 0) - ((keys.ArrowLeft || keys.KeyA) ? 1 : 0);
    const scale = (keys.ShiftLeft || keys.ShiftRight || mouseSneakHeld) ? .4 : 1;
    if (kb) return kb * scale;
    return touchAxis * scale;
  }
  const touchUI = $('#touch'), zone = $('#stickZone'), stick = $('#stick'), knob = $('#knob');
  cv.addEventListener('pointerdown', e => {
    if (state !== 'play' || e.pointerType !== 'mouse' || e.button !== 0 || mouseSneakPointerId !== null) return;
    e.preventDefault(); mouseSneakPointerId = e.pointerId; mouseSneakHeld = true; mouseSneakPress = { x: e.clientX, y: e.clientY, at: performance.now(), moved: false };
    try { cv.setPointerCapture(e.pointerId); } catch (err) {}
  });
  cv.addEventListener('pointermove', e => {
    if (e.pointerId !== mouseSneakPointerId || !mouseSneakPress) return;
    if (Math.hypot(e.clientX - mouseSneakPress.x, e.clientY - mouseSneakPress.y) > 9) mouseSneakPress.moved = true;
  });
  const mouseSneakEnd = e => {
    if (e.pointerId !== mouseSneakPointerId) return;
    const quickClick = state === 'play' && mouseSneakPress && !mouseSneakPress.moved && performance.now() - mouseSneakPress.at <= 300;
    mouseSneakPointerId = null; mouseSneakHeld = false; mouseSneakPress = null;
    if (quickClick) pounceQ = true;
  };
  const mouseSneakCancel = e => { if (e.pointerId !== mouseSneakPointerId) return; mouseSneakPointerId = null; mouseSneakHeld = false; mouseSneakPress = null; };
  addEventListener('pointerup', mouseSneakEnd); addEventListener('pointercancel', mouseSneakCancel);
  let sid = null, sx = 0, sy = 0;
  function stickMove(e) {
    let dx = clamp(e.clientX - sx, -58, 58);
    const distance = Math.abs(dx);
    // Match the visible 64px inner ring; retain a small neutral centre.
    touchAxis = distance < 7 ? 0 : Math.sign(dx) * (distance <= 32 ? .4 : 1);
    stick.dataset.speed = distance < 7 ? 'idle' : distance <= 32 ? 'slow' : 'fast';
    knob.style.transform = `translate(calc(-50% + ${dx}px),-50%)`;
  }
  zone.addEventListener('pointerdown', e => {
    if (sid !== null) return;
    e.preventDefault(); sid = e.pointerId; sx = e.clientX; sy = e.clientY;
    const r = zone.getBoundingClientRect();
    stick.style.left = (sx - r.left) + 'px'; stick.style.top = (sy - r.top) + 'px'; stick.hidden = false;
    try { zone.setPointerCapture(sid); } catch (err) {}
    stickMove(e);
  });
  zone.addEventListener('pointermove', e => { if (e.pointerId === sid) stickMove(e); });
  const stickEnd = e => { if (e.pointerId !== sid) return; sid = null; touchAxis = 0; stick.hidden = true; knob.style.transform = 'translate(-50%,-50%)'; };
  zone.addEventListener('pointerup', stickEnd); zone.addEventListener('pointercancel', stickEnd);
  $('#bJump').addEventListener('pointerdown', e => { e.preventDefault(); jumpHeld = true; jumpQ = true; });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => $('#bJump').addEventListener(ev, () => { jumpHeld = false; }));
  $('#bPounce').addEventListener('pointerdown', e => { e.preventDefault(); pounceQ = true; });
  $('#bPurr').addEventListener('pointerdown', e => { e.preventDefault(); purrQ = true; });
  $('#bEyes').addEventListener('pointerdown', e => { e.preventDefault(); eyesQ = true; });
  $('#bScratch').addEventListener('pointerdown', e => { e.preventDefault(); scratchQ = true; scratchHeld = true; });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => $('#bScratch').addEventListener(ev, () => { scratchHeld = false; }));
  const coarse = matchMedia('(pointer: coarse)').matches;
  addEventListener('touchstart', () => { if (state === 'play') touchUI.hidden = false; }, { passive: true });

  // ---------- world ----------
  let currentLevel = window.TC_LEVELS?.[1] || { width: 4200, ground: { points: [[0, GROUND], [4200, GROUND]] }, pits: [], platforms: [], hideSpots: [], burySpots: [], spawnZones: [[120, 4080]], catStart: 200, props: [] };
  let activePlats = [];
  let currentProps = [];
  const levelGroundY = x => {
    const pts = currentLevel.ground.points, px = clamp(x, 0, currentLevel.width);
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i];
      if (px <= b[0]) return a[1] + (b[1] - a[1]) * ((px - a[0]) / Math.max(1, b[0] - a[0]));
    }
    return pts[pts.length - 1][1];
  };
  function terrainY(x) {
    return levelGroundY(x);
  }
  const pitAt = x => (currentLevel.pits || []).find(([a, b]) => x > a + 10 && x < b - 10) || null;
  function loadLevelGeometry() {
    WORLD = currentLevel.width;
    currentProps = (currentLevel.props || []).map(prop => ({ ...prop, baseX: prop.x, baseY: prop.y || 0 }));
    activePlats = (currentLevel.platforms || []).map(spec => {
      const info = spec[4] || {}, p = [spec[0], spec[1], spec[2]];
      Object.assign(p, { type: spec[3] || 'static', path: info.path || null, speed: info.speed || 0, skin: info.skin || '', anchor: info.anchor || null, baseX: spec[0], baseY: spec[1], active: true, crumbleRemaining: 0, restRemaining: 0, movingPhase: 0 });
      return p;
    });
  }
  function updateLevelPlatforms(dt) {
    for (const p of activePlats) {
      p.prevX = p[0]; p.prevY = p[1];
      if (p.type === 'moving' && p.path?.length > 1) {
        const phase = ((t * p.speed) % 1 + 1) % 1, u = (1 - Math.cos(phase * Math.PI * 2)) * .5;
        p[0] = p.path[0][0] + (p.path[1][0] - p.path[0][0]) * u;
        p[1] = p.path[0][1] + (p.path[1][1] - p.path[0][1]) * u;
      }
      if (p.type === 'crumbling') {
        if (p.crumbleRemaining > 0) { p.crumbleRemaining -= dt; if (p.crumbleRemaining <= 0) { p.active = false; p.restRemaining = 3; burst(p[0] + p[2] / 2, p[1] + 8, 'rgba(196,186,170,.85)', 14); tone(110, .25, 'triangle', .05, -40); } }
        else if (!p.active) { p.restRemaining -= dt; if (p.restRemaining <= 0) { p.active = true; puff({ x: p[0] + p[2] / 2, y: p[1] + 18 }); } }
      }
      if (p.type === 'sinking') {
        // lily pad: sinks while Shwe stands on it, dunks under after SINK_TIME, then floats back up
        if (!p.active) { p.restRemaining -= dt; if (p.restRemaining <= 0) { p.active = true; p.sinkT = 0; p[1] = p.baseY; } }
        else {
          const on = cat?.platform === p && cat.on;
          p.sinkT = Math.max(0, (p.sinkT || 0) + (on ? dt : -dt * 1.4));
          p[1] = p.baseY + 34 * Math.min(1, p.sinkT / SINK_TIME);
          if (on && !p.warned) { p.warned = true; float(p[0] + p[2] / 2, p[1] - 50, 'The lily pad is sinking!', '#9fe8ff'); }
          if (p.sinkT >= SINK_TIME + .35) { p.active = false; p.restRemaining = 2.2; burst(p[0] + p[2] / 2, p[1], '#9cdaee', 16); sfx('ui', 'land'); }
        }
      }
      if (cat?.platform === p && cat.on && p.active) { cat.x += p[0] - p.prevX; cat.y += p[1] - p.prevY; }
    }
    for (const prop of currentProps) if (prop.path?.length > 1) {
      const phase = ((t * (prop.speed || .5)) % 1 + 1) % 1, u = (1 - Math.cos(phase * Math.PI * 2)) * .5;
      prop.x = prop.path[0][0] + (prop.path[1][0] - prop.path[0][0]) * u;
      prop.y = prop.path[0][1] + (prop.path[1][1] - prop.path[0][1]) * u;
    }
  }
  function platformDrawY(p) { return p.type === 'crumbling' && p.crumbleRemaining > 0 ? p[1] + Math.sin((.6 - p.crumbleRemaining) * 54) * 3 : p[1]; }
  function safeLevelX(x) {
    x = clamp(x, 80, WORLD - 80);
    const pit = pitAt(x);
    return pit ? (x - pit[0] < pit[1] - x ? pit[0] - 48 : pit[1] + 48) : x;
  }
  function levelSpawnX() {
    const zones = currentLevel.spawnZones?.length ? currentLevel.spawnZones : [[100, WORLD - 100]];
    const clear = x => !(currentProps || []).some(p => x >= p.x - 34 && x <= p.x + (p.w || 80) + 34);
    for (let i = 0; i < 48; i++) { const [a,b] = zones[Math.floor(Math.random() * zones.length)], x = safeLevelX(a + Math.random() * (b-a)); if (clear(x)) return x; }
    return safeLevelX(zones[0][0]);
  }
  function safeSpawnX(x) {
    x = safeLevelX(x);
    if (!(currentProps || []).some(p => x >= p.x - 34 && x <= p.x + (p.w || 80) + 34)) return x;
    const zones = currentLevel.spawnZones || [[100, WORLD - 100]], candidates = [];
    for (const [a,b] of zones) { candidates.push(a+40,b-40,(a+b)/2); for (const p of currentProps) candidates.push(p.x-45,p.x+(p.w||80)+45); }
    return candidates.map(safeLevelX).filter(v => v >= 80 && v <= WORLD-80 && zones.some(([a,b]) => v >= a && v <= b) && !(currentProps || []).some(p => v >= p.x-34 && v <= p.x+(p.w||80)+34)).sort((a,b) => Math.abs(a-x)-Math.abs(b-x))[0] ?? levelSpawnX();
  }
  // Free Play maps: the classic free routes, or any story map Shwe has already reached
  const FREE_MAPS = [
    { id: 'classic', name: 'Classic routes', note: 'The original Free Play paths', level: 0, opens: 1 },
    { id: 'school', name: 'School', note: '11 PM · the school hallway', level: 2, opens: 1 },
    { id: 'park', name: 'The Park', note: '1 AM · swings and slides', level: 3, opens: 3 },
    { id: 'festival', name: 'Lighting Festival', note: '2 AM · lanterns and boats', level: 4, opens: 4 },
    { id: 'hill', name: 'Hilltop Park', note: '3 AM · windy stone steps', level: 5, opens: 5 },
    { id: 'lake', name: 'Lakeside', note: '4 AM · logs and lily pads', level: 6, opens: 6 }
  ];
  let freeMap = 'classic';
  try { const saved = localStorage.getItem('mk-free-map'); if (FREE_MAPS.some(m => m.id === saved)) freeMap = saved; } catch (e) {}
  const freeMapOpen = m => m.id === 'classic' || unlockedLevel >= m.opens;
  function selectLevelForRun() {
    if (mode === 'story') return window.TC_LEVELS[storyNight];
    const pick = FREE_MAPS.find(m => m.id === freeMap);
    if (pick && pick.level && freeMapOpen(pick) && window.TC_LEVELS[pick.level]) return window.TC_LEVELS[pick.level];
    const variants = window.TC_LEVELS.free.variants;
    return variants[Math.floor(Math.random() * variants.length)];
  }
  let state = 'menu', t = 0, timeLeft = 90, score = 0, combo = 0, comboT = 0, bestCombo = 1, hitstop = 0, slowmo = 0, chaos = false, endT = 0, warmup = 0;
  let lives = 3, checkpointX = 0, fallDimT = 0, respawnT = 0, pitTipShown = false, edgeSoundAt = 0, pendingFallFail = false;
  let gentleMode = false;
  try { gentleMode = localStorage.getItem('mk-gentle-mode') === '1'; } catch (e) {}
  const nightGuide = { active: false, step: 0, success: 0, pendingWin: false, buffered: [] };
  let jitTipQueue = [], activeJitTip = null, struggleTimer = 0, guidanceCaught = 0, guidanceHits = {}, helpReturn = 'hub', helpReturnFocus = null, welcomeCardIndex = 0, welcomeCardScrollTimer = 0;
  const FRUST_SLEEP = 5; // Frustrated sleeps for the first 5 seconds of the night clock
  const FRUST_WARN = 3;  // a Frustrated that appears later shows a 3-second warning before it can charge
  let frustWakeAt = FRUST_SLEEP + 1.5;
  let mode = 'story', storyNight = 1, freeT = 0, level = 0, nextGold = 18, caughtN = 0;
  // School hallways use cached architectural variants; playable shelves stay separate.
  const SCHOOL_NIGHTS = [1, 2];
  const SCHOOL_WALL = new Image();
  SCHOOL_WALL.src = 'assets/school/hallway-night.webp';
  const SCHOOL_WALL_W = 2445, SCHOOL_WALL_H = 474, SCHOOL_PARALLAX = .9;
  function inSchool() { return (mode === 'story' && (SCHOOL_NIGHTS.includes(storyNight) || currentLevel?.map === 'school')) || (mode === 'free' && currentLevel?.map === 'school'); }
  function inRooftop() { return mode === 'story' && currentLevel?.map === 'rooftop'; }
  // ---------- Hilltop park map (Night 5) ----------
  // Layout from the team's level design: a stepped stone terrace (high gate terrace, bench step,
  // lamp step, low walkway along the railing, back up), tree-branch ledges and stone pillars to jump on,
  // and a tree hollow, bin and bushes to hide in. The far city view comes from the team's picture.
  const HILL_NIGHTS = [5];
  function inHill() { return (mode === 'story' && (HILL_NIGHTS.includes(storyNight) || currentLevel?.map === 'hill')) || (mode === 'free' && currentLevel?.map === 'hill'); }
  const HILL_W = 1400;
  function hillY(x) { return terrainY(x); }
  const HILL_VISTA = new Image();
  HILL_VISTA.src = 'assets/hill/hill-vista.webp';
  function drawHillSky() {
    const y0 = -OY;
    const sky = ctx.createLinearGradient(0, y0, 0, 300); sky.addColorStop(0, '#0d0720'); sky.addColorStop(1, '#2a1150');
    ctx.fillStyle = sky; ctx.fillRect(0, y0, VW, VH + OY * 2);
    for (let i = 0; i < 40; i++) {
      const x = ((i * 157.7 - camX * .03) % (VW + 20) + VW + 20) % (VW + 20) - 10, y = 10 + (i * 47.3 % 150);
      ctx.globalAlpha = .3 + .5 * (.5 + .5 * Math.sin(t * (.6 + i % 5 * .1) + i)); ctx.fillStyle = '#efe6ff'; ctx.beginPath(); ctx.arc(x, y, i % 9 ? .9 : 1.5, 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (HILL_VISTA.complete && HILL_VISTA.naturalWidth) {
      const k = Math.max(330 / HILL_VISTA.naturalHeight, VW * 1.12 / HILL_VISTA.naturalWidth);
      const w = HILL_VISTA.naturalWidth * k, h = HILL_VISTA.naturalHeight * k;
      const pan = (w - VW) * clamp(camX / Math.max(1, WORLD - VW), 0, 1);
      const top = 470 - h;
      const fade = ctx.createLinearGradient(0, top, 0, top + 40);
      ctx.drawImage(HILL_VISTA, -pan, top, w, h);
      fade.addColorStop(0, 'rgba(42,17,80,1)'); fade.addColorStop(1, 'rgba(42,17,80,0)');
      ctx.fillStyle = fade; ctx.fillRect(0, top - 1, VW, 41);
    }
  }
  function drawHillTree(x, gy, flip, hollow) {
    const d = flip ? -1 : 1;
    ctx.fillStyle = '#3a2440';
    ctx.beginPath(); ctx.moveTo(x - 22, gy); ctx.quadraticCurveTo(x - 10, gy - 90, x - 14, gy - 200); ctx.lineTo(x + 14, gy - 200); ctx.quadraticCurveTo(x + 8, gy - 90, x + 26, gy); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#3a2440'; ctx.lineWidth = 14; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, gy - 150); ctx.quadraticCurveTo(x + d * 60, gy - 150, x + d * 120, gy - 112); ctx.stroke();
    ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(190,170,230,.35)'; ctx.beginPath(); ctx.moveTo(x - 8, gy - 10); ctx.quadraticCurveTo(x - 4, gy - 100, x - 8, gy - 190); ctx.stroke();
    if (hollow) {
      ctx.fillStyle = '#120a1e'; ctx.beginPath(); ctx.ellipse(x + 2, gy - 22, 11, 18, 0, 0, 7); ctx.fill();
      const g = ctx.createRadialGradient(x + 2, gy - 18, 1, x + 2, gy - 18, 16); g.addColorStop(0, 'rgba(255,190,120,.45)'); g.addColorStop(1, 'rgba(255,190,120,0)'); ctx.fillStyle = g; ctx.fillRect(x - 16, gy - 36, 36, 36);
    }
    const blobs = [[-70,-210,46],[-20,-250,56],[40,-240,52],[90,-205,44],[-40,-190,40],[20,-195,44],[d*120,-150,38],[d*80,-170,40]];
    for (const [dx, dy, r] of blobs) { const g = ctx.createRadialGradient(x + dx - r * .3, gy + dy - r * .4, 2, x + dx, gy + dy, r); g.addColorStop(0, '#4fae8e'); g.addColorStop(1, '#1f5a58'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x + dx, gy + dy, r, 0, 7); ctx.fill(); }
  }
  function drawHillLamp(x, gy) {
    ctx.fillStyle = '#2a2040'; ctx.fillRect(x - 2, gy - 92, 4, 92); ctx.fillRect(x - 6, gy - 4, 12, 4);
    ctx.fillStyle = '#ffe2a8'; ctx.beginPath(); ctx.moveTo(x - 7, gy - 100); ctx.lineTo(x + 7, gy - 100); ctx.lineTo(x + 5, gy - 88); ctx.lineTo(x - 5, gy - 88); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#2a2040'; ctx.beginPath(); ctx.moveTo(x - 9, gy - 100); ctx.lineTo(x, gy - 108); ctx.lineTo(x + 9, gy - 100); ctx.closePath(); ctx.fill();
    const g = ctx.createRadialGradient(x, gy - 94, 2, x, gy - 94, 70); g.addColorStop(0, 'rgba(255,214,150,.35)'); g.addColorStop(1, 'rgba(255,214,150,0)'); ctx.fillStyle = g; ctx.fillRect(x - 70, gy - 164, 140, 140);
    const pool = ctx.createRadialGradient(x, gy, 2, x, gy, 80); pool.addColorStop(0, 'rgba(255,214,150,.22)'); pool.addColorStop(1, 'rgba(255,214,150,0)'); ctx.fillStyle = pool; ctx.beginPath(); ctx.ellipse(x, gy, 80, 14, 0, 0, 7); ctx.fill();
  }
  function drawHillBench(x, gy) {
    ctx.fillStyle = '#6a4a58'; ctx.fillRect(x - 34, gy - 22, 68, 5); ctx.fillRect(x - 34, gy - 40, 68, 5); ctx.fillRect(x - 34, gy - 32, 68, 4);
    ctx.fillStyle = '#2a2040'; ctx.fillRect(x - 30, gy - 22, 4, 22); ctx.fillRect(x + 26, gy - 22, 4, 22);
    ctx.fillStyle = 'rgba(255,230,210,.25)'; ctx.fillRect(x - 34, gy - 40, 68, 1);
  }
  function drawHillBush(x, gy, seed) {
    for (const [dx, dy, r] of [[-26,-14,20],[0,-24,26],[24,-14,20],[0,-8,24]]) { const g = ctx.createLinearGradient(0, gy - 50, 0, gy); g.addColorStop(0, '#3f9a80'); g.addColorStop(1, '#1d4c4c'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x + dx, gy + dy, r, 0, 7); ctx.fill(); }
    for (let k = 0; k < 5; k++) { ctx.fillStyle = `rgb(${festCol(k + seed)})`; ctx.beginPath(); ctx.arc(x - 28 + k * 14, gy - 18 - (k % 2) * 14, 2.4, 0, 7); ctx.fill(); }
  }
  function drawHillWorld(x0, x1) {
    // mid layer: dark pines on the slope below the terrace
    ctx.save(); const sp = .4; ctx.translate(camX * (1 - sp), 0);
    ctx.fillStyle = '#1e1238';
    for (let x = Math.floor((camX * sp - 60) / 46) * 46; x < camX * sp + VW + 60; x += 46) {
      const h = 50 + Math.abs(Math.sin(x * .07)) * 60, b = 470;
      ctx.beginPath(); ctx.moveTo(x - 20, b); ctx.lineTo(x, b - h); ctx.lineTo(x + 20, b); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    const startO = Math.floor((x0 - 200) / HILL_W) * HILL_W;
    // railing along the low walkway (behind)
    for (let o = startO; o < x1 + 200; o += HILL_W) {
      const a = o + 905, b = o + 1150, y = 502;
      ctx.fillStyle = '#4c4478'; ctx.fillRect(a, y - 40, b - a, 6); ctx.fillRect(a, y - 12, b - a, 5);
      for (let x = a + 8; x < b; x += 16) { ctx.fillStyle = '#3e3868'; ctx.beginPath(); ctx.ellipse(x, y - 24, 4, 11, 0, 0, 7); ctx.fill(); }
      ctx.fillStyle = 'rgba(200,190,255,.35)'; ctx.fillRect(a, y - 40, b - a, 1.5);
    }
    // trees, gate, lamps, benches, bushes, bin (behind the cat)
    for (let o = startO; o < x1 + 200; o += HILL_W) {
      if (o + HILL_W + 200 < x0) continue;
      // gate on the high terrace
      for (const gx of [o + 50, o + 290]) { ctx.fillStyle = '#4c4478'; ctx.fillRect(gx - 14, 440 - 92, 28, 92); ctx.fillStyle = '#6a62a0'; ctx.fillRect(gx - 17, 440 - 98, 34, 8); drawHillLamp(gx, 440 - 98 + 100 - 100); }
      ctx.strokeStyle = '#4c4478'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(o + 64, 440 - 76); ctx.quadraticCurveTo(o + 170, 440 - 120, o + 276, 440 - 76); ctx.stroke();
      drawHillTree(o + 120, 440, false, false);
      drawHillBush(o + 200, 440, o);
      drawHillBench(o + 470, 460);
      drawHillLamp(o + 560, 460);
      drawHillBush(o + 790, 478, o + 3);
      drawHillLamp(o + 860, 478);
      drawHillBush(o + 960, 502, o + 5);
      // bin
      const bx = o + 1090, by = 502;
      ctx.fillStyle = '#3e3868'; ctx.fillRect(bx - 14, by - 38, 28, 38); ctx.fillStyle = '#5a5290'; ctx.fillRect(bx - 17, by - 44, 34, 7);
      ctx.strokeStyle = 'rgba(20,14,40,.6)'; ctx.lineWidth = 1; for (let k = -8; k <= 8; k += 8) { ctx.beginPath(); ctx.moveTo(bx + k, by - 34); ctx.lineTo(bx + k, by - 4); ctx.stroke(); }
      drawHillBench(o + 1225, 478);
      drawHillTree(o + 1345, 458, true, true);
    }
    // stone terrace following the stepped ground
    const ground = ctx.createLinearGradient(0, 430, 0, VH + OY + 60); ground.addColorStop(0, '#4a4274'); ground.addColorStop(.25, '#2e2650'); ground.addColorStop(1, '#120c24');
    ctx.fillStyle = ground; ctx.beginPath(); ctx.moveTo(x0, VH + OY + 60);
    for (let x = Math.floor(x0 / 6) * 6; x <= x1 + 6; x += 6) ctx.lineTo(x, hillY(x));
    ctx.lineTo(x1 + 6, VH + OY + 60); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(16,10,32,.45)'; ctx.lineWidth = 1;
    for (let row = 0; row < 4; row++) for (let x = Math.floor(x0 / 34) * 34; x < x1; x += 34) { const y = hillY(x) + 12 + row * 14; ctx.strokeRect(x + (row % 2) * 17, y, 34, 14); }
    ctx.strokeStyle = '#b4a8ec'; ctx.lineWidth = 2.5; ctx.beginPath();
    for (let x = Math.floor(x0 / 6) * 6; x <= x1 + 6; x += 6) { const y = hillY(x); x === Math.floor(x0 / 6) * 6 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
    ctx.stroke();
    ctx.fillStyle = 'rgba(80,170,130,.8)';
    for (let x = Math.floor(x0 / 22) * 22; x < x1; x += 22) { if (Math.sin(x * 3.1) < .2) continue; const y = hillY(x); ctx.beginPath(); ctx.moveTo(x - 4, y); ctx.lineTo(x, y - 6); ctx.lineTo(x + 4, y); ctx.fill(); }
    // platforms: mossy branch ledges and stone pillars
    for (const p of activePlats) {
      if (!p.active || p[0] + p[2] < x0 || p[0] > x1) continue;
      const x = p[0], y = platformDrawY(p), w = p[2];
      if (w <= 95) {
        const base = hillY(x + w / 2);
        ctx.fillStyle = '#4c4478'; ctx.fillRect(x, y + 6, w, base - y - 6);
        ctx.strokeStyle = 'rgba(16,10,32,.45)'; ctx.lineWidth = 1; for (let yy = y + 18; yy < base; yy += 14) for (let xx = x + ((yy / 14) % 2 ? 0 : 15); xx < x + w; xx += 30) ctx.strokeRect(xx, yy, 30, 14);
        ctx.fillStyle = '#6a62a0'; ctx.fillRect(x - 4, y - 2, w + 8, 10);
      } else {
        ctx.fillStyle = '#5a3a58'; ctx.beginPath(); canvasRoundRect(ctx, x - 3, y - 2, w + 6, 12, 5); ctx.fill();
        ctx.fillStyle = '#4fae8e'; ctx.beginPath(); canvasRoundRect(ctx, x - 1, y - 4, w + 2, 5, 3); ctx.fill();
      }
      ctx.strokeStyle = 'rgba(230,220,255,.55)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x, y - 2); ctx.lineTo(x + w, y - 2); ctx.stroke();
    }
    for (const spot of scratchSpots) { if (spot.x < x0 - 60 || spot.x > x1 + 60) continue; drawScratchSpot(spot.x, spot.y, spot.moodType, spot); }
    for (const rock of rocks) { if (rock.x < x0 - 80 || rock.x > x1 + 80) continue; drawRockFormation(rock.x, rock.y, rock, rockHoldsFeeling(rock)); }
  }
  // ---------- Lakeside map (Nights 6-7) ----------
  // Painted entirely in code: dawn sky that warms up (and on Night 7 the sun rises as the timer runs),
  // mountains, a lake with the sun's reflection, a rowboat, then the shore path, reed beds and
  // Calm's lily pads and wooden jetties (platforms).
  const LAKE_NIGHTS = [6, 7];
  function inLake() { return (mode === 'story' && (LAKE_NIGHTS.includes(storyNight) || currentLevel?.map === 'lake')) || (mode === 'free' && currentLevel?.map === 'lake'); }
  const hex = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
  const lerpC = (a, b, u) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * u)).join(',')})`; };
  function dawnP() {
    if (storyNight !== 7) return .3;
    const lim = chapterFor(7).timeLimit || 135;
    return .42 + .58 * clamp(1 - timeLeft / lim, 0, 1);
  }
  function drawLakeSky() {
    const p = dawnP(), y0 = -OY, H = 362;
    const sky = ctx.createLinearGradient(0, y0, 0, H);
    sky.addColorStop(0, lerpC('#120c3a', '#3f5fc0', p));
    sky.addColorStop(.5, lerpC('#45207a', '#f07aa8', p));
    sky.addColorStop(1, lerpC('#a2408e', '#ffc46e', p));
    ctx.fillStyle = sky; ctx.fillRect(0, y0, VW, H - y0 + 2);
    const sa = clamp(1 - p * 1.7, 0, 1);
    if (sa > 0) for (let i = 0; i < 48; i++) {
      const x = ((i * 157.7 - camX * .04) % (VW + 20) + VW + 20) % (VW + 20) - 10, y = 14 + (i * 61.3 % 200);
      ctx.globalAlpha = sa * (.35 + .5 * (.5 + .5 * Math.sin(t * (.6 + i % 5 * .1) + i))); ctx.fillStyle = '#f2ecff';
      ctx.beginPath(); ctx.arc(x, y, i % 9 === 0 ? 1.6 : .9, 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1;
    // the sun: a glow under the horizon on Night 6, rising on Night 7
    const sx = VW * .64 - camX * .03, sy = 300 - clamp((p - .42) / .58, 0, 1) * 200;
    const glow = ctx.createRadialGradient(sx, sy, 4, sx, sy, 260 + p * 120);
    glow.addColorStop(0, `rgba(255,226,160,${.25 + p * .45})`); glow.addColorStop(1, 'rgba(255,200,150,0)');
    ctx.fillStyle = glow; ctx.fillRect(0, y0, VW, H - y0);
    if (p > .4) { ctx.fillStyle = '#fff1c2'; ctx.globalAlpha = clamp((p - .4) * 6, 0, 1); ctx.beginPath(); ctx.arc(sx, sy, 34, 0, 7); ctx.fill(); ctx.globalAlpha = 1; }
    // soft cloud streaks lit from below
    for (let i = 0; i < 6; i++) {
      const cx = ((i * 260 - camX * .06) % (VW + 300) + VW + 300) % (VW + 300) - 150, cy = 70 + (i * 47 % 170);
      const g = ctx.createLinearGradient(0, cy - 8, 0, cy + 10);
      g.addColorStop(0, lerpC('#5a3a9a', '#ffb0c8', p)); g.addColorStop(1, lerpC('#9a4f9a', '#ffd9a0', p));
      ctx.fillStyle = g; ctx.globalAlpha = .55; ctx.beginPath(); ctx.ellipse(cx, cy, 120 + i * 12, 7 + i % 3 * 2, 0, 0, 7); ctx.ellipse(cx + 60, cy - 5, 70, 6, 0, 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1;
    // two mountain ranges
    const ridge = (sp, base, amp, col, seed) => {
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, 380);
      for (let x = -20; x <= VW + 20; x += 20) { const wx = x + camX * sp; ctx.lineTo(x, base - amp * (.55 + .45 * Math.sin(wx * .004 + seed) * Math.sin(wx * .0017 + seed * 2)) - Math.abs(Math.sin(wx * .011 + seed)) * amp * .25); }
      ctx.lineTo(VW + 20, 380); ctx.closePath(); ctx.fill();
    };
    ridge(.06, 345, 95, lerpC('#3a2a78', '#9a5aa0', p), 1.3);
    ridge(.14, 360, 62, lerpC('#231a58', '#5e3a7e', p), 4.1);
    if (p > .4) { const h2 = ctx.createRadialGradient(sx, sy, 20, sx, sy, 140); h2.addColorStop(0, `rgba(255,214,150,${(p - .4) * .5})`); h2.addColorStop(1, 'rgba(255,214,150,0)'); ctx.fillStyle = h2; ctx.fillRect(sx - 140, sy - 140, 280, 280); }
  }
  function drawLakeWorld(x0, x1) {
    const p = dawnP();
    // lake between the mountains and the shore, drawn in screen space
    ctx.save(); ctx.translate(camX, 0);
    const lake = ctx.createLinearGradient(0, 356, 0, GROUND);
    lake.addColorStop(0, lerpC('#7a3f9a', '#ff9fb4', p)); lake.addColorStop(1, lerpC('#1e1452', '#3a4a9a', p));
    ctx.fillStyle = lake; ctx.fillRect(0, 356, VW, GROUND - 356);
    const sx = VW * .64 - camX * .03;
    for (let k = 0; k < 16; k++) {
      const y = 362 + k * 7, w = (60 - k * 2.5) * (.6 + p) + Math.sin(t * 2 + k) * 8;
      ctx.fillStyle = `rgba(255,232,180,${(.12 + p * .4) * (1 - k / 18)})`; ctx.fillRect(sx - w / 2 + Math.sin(t * 1.3 + k * 1.7) * 6, y, w, 2);
    }
    ctx.strokeStyle = `rgba(255,255,255,${.08 + p * .1})`; ctx.lineWidth = 1;
    for (let k = 0; k < 5; k++) { const y = 380 + k * 18; ctx.beginPath(); for (let x = 0; x < VW; x += 50) { const o = Math.sin(x * .02 + t + k) * 2; ctx.moveTo(x + (k * 23 % 50), y + o); ctx.lineTo(x + 20 + (k * 23 % 50), y + o); } ctx.stroke(); }
    // far shore pines
    ctx.fillStyle = lerpC('#160f3a', '#33204e', p);
    for (let i = -1; i < VW / 34 + 2; i++) {
      const wx = i * 34 + Math.floor(camX * .3 / 34) * 34, x = wx - camX * .3, h = 18 + Math.abs(Math.sin(wx * .13)) * 26;
      ctx.beginPath(); ctx.moveTo(x - 10, 362); ctx.lineTo(x, 362 - h); ctx.lineTo(x + 10, 362); ctx.closePath(); ctx.fill();
    }
    ctx.fillRect(0, 358, VW, 6);
    // rowboat bobbing on the lake
    const bx = ((900 - camX * .5) % (VW + 400) + VW + 400) % (VW + 400) - 200, by = 418 + Math.sin(t * 1.2) * 2;
    ctx.save(); ctx.translate(bx, by); ctx.rotate(Math.sin(t * .9) * .03);
    ctx.fillStyle = '#5a3a3a'; ctx.beginPath(); ctx.moveTo(-34, -6); ctx.lineTo(34, -6); ctx.quadraticCurveTo(26, 8, 0, 9); ctx.quadraticCurveTo(-26, 8, -34, -6); ctx.fill();
    ctx.fillStyle = '#8a5a4a'; ctx.fillRect(-34, -8, 68, 3); ctx.restore();
    ctx.fillStyle = `rgba(20,16,40,.25)`; ctx.beginPath(); ctx.ellipse(bx, by + 12, 34, 3, 0, 0, 7); ctx.fill();
    ctx.restore();
    // shore: grass edge, sandy path, earth
    const earth = ctx.createLinearGradient(0, GROUND, 0, VH + OY + 60); earth.addColorStop(0, '#5a4060'); earth.addColorStop(1, '#1e1530');
    ctx.fillStyle = earth; ctx.fillRect(x0, GROUND, x1 - x0, VH + OY + 60 - GROUND);
    ctx.fillStyle = lerpC('#9a6a9a', '#e8b080', p); ctx.fillRect(x0, GROUND + 6, x1 - x0, 14);
    ctx.fillStyle = 'rgba(255,240,220,.25)'; ctx.fillRect(x0, GROUND + 6, x1 - x0, 1.5);
    const grass = ctx.createLinearGradient(0, GROUND - 6, 0, GROUND + 7); grass.addColorStop(0, lerpC('#4f9a7a', '#8fcf7a', p)); grass.addColorStop(1, '#2a5a4c');
    ctx.fillStyle = grass; ctx.beginPath(); ctx.moveTo(x0, GROUND + 7);
    for (let x = Math.floor(x0 / 8) * 8; x < x1 + 8; x += 8) ctx.lineTo(x, GROUND - 2 - Math.abs(Math.sin(x * 1.3)) * 5);
    ctx.lineTo(x1 + 8, GROUND + 7); ctx.closePath(); ctx.fill();
    // reed beds (Calm sits on a lily pad beside one)
    for (const rx of caveXsForMap()) {
      if (rx < x0 - 90 || rx > x1 + 90) continue;
      for (let k = 0; k < 16; k++) {
        const bx = rx - 56 + k * 7.5, h = 60 + Math.abs(Math.sin(k * 2.3 + rx)) * 48, sw = Math.sin(t * 1.4 + k * .6 + rx) * 4;
        ctx.strokeStyle = k % 3 ? '#2f6a54' : '#3f8462'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(bx, GROUND); ctx.quadraticCurveTo(bx + sw * .5, GROUND - h * .5, bx + sw, GROUND - h); ctx.stroke();
        if (k % 3 === 1) { ctx.fillStyle = '#7a4a34'; ctx.beginPath(); ctx.ellipse(bx + sw, GROUND - h + 8, 3.2, 9, 0, 0, 7); ctx.fill(); }
      }
      ctx.fillStyle = '#2a5a48'; ctx.beginPath(); ctx.ellipse(rx, GROUND - 4, 66, 10, 0, 0, 7); ctx.fill();
    }
    // wooden jetties = platforms
    for (const pl of activePlats) {
      if (!pl.active || pl.type === 'sinking' || pl[0] + pl[2] < x0 || pl[0] > x1) continue;
      const x = pl[0], y = pl[1], w = pl[2];
      ctx.fillStyle = '#3a2830';
      if (pl.type !== 'moving') for (const px of [x + 8, x + w / 2 - 3, x + w - 14]) ctx.fillRect(px, y + 8, 6, GROUND - y - 8);
      const wood = ctx.createLinearGradient(0, y - 2, 0, y + 11); wood.addColorStop(0, '#b4876a'); wood.addColorStop(.4, '#7d5444'); wood.addColorStop(1, '#45293a');
      ctx.fillStyle = wood; ctx.beginPath(); canvasRoundRect(ctx, x - 3, y - 2, w + 6, 12, 3); ctx.fill();
      ctx.strokeStyle = 'rgba(30,16,26,.5)'; ctx.lineWidth = 1; for (let k = x + 16; k < x + w; k += 18) { ctx.beginPath(); ctx.moveTo(k, y - 1); ctx.lineTo(k, y + 9); ctx.stroke(); }
      ctx.strokeStyle = 'rgba(255,226,190,.6)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x + 1, y - 1); ctx.lineTo(x + w - 1, y - 1); ctx.stroke();
    }
    for (const spot of scratchSpots) { if (spot.x < x0 - 60 || spot.x > x1 + 60) continue; drawScratchSpot(spot.x, spot.y, spot.moodType, spot); }
    for (const rock of rocks) { if (rock.x < x0 - 80 || rock.x > x1 + 80) continue; drawRockFormation(rock.x, rock.y, rock, rockHoldsFeeling(rock)); }
  }
  // ---------- Park map (Night 3) ----------
  // Night park picture behind (mirrored repeats, like the school); grass, path, flowers, bushes,
  // and playground decks (platforms) are drawn in code.
  const PARK_NIGHTS = [3];
  const PARK_WALL = new Image();
  PARK_WALL.src = 'assets/park/park-night.webp';
  function inPark() { return (mode === 'story' && (PARK_NIGHTS.includes(storyNight) || currentLevel?.map === 'park')) || (mode === 'free' && currentLevel?.map === 'park'); }
  // ---------- Lighting festival map (Night 4) ----------
  // Far back: sky + pagoda hill picture (barely moves). Middle: palm and roof silhouettes in code.
  // Front: boardwalk over dark water, stalls (hiding spots), a few lantern strings, raised decks.
  const FESTIVAL_NIGHTS = [4];
  const FEST_BACK = new Image();
  FEST_BACK.src = 'assets/festival/festival-back.webp';
  const FEST_COLORS = ['255,156,207', '185,162,255', '143,227,224', '255,227,163', '255,143,163', '160,200,255'];
  const FEST_CLOTH = ['#7b2d8e', '#b8336a', '#1f7f86', '#3a5fc0', '#8e3fb0', '#2f8f5e'];
  const festCol = i => FEST_COLORS[((Math.floor(i) % FEST_COLORS.length) + FEST_COLORS.length) % FEST_COLORS.length];
  function inFestival() { return (mode === 'story' && (FESTIVAL_NIGHTS.includes(storyNight) || currentLevel?.map === 'festival')) || (mode === 'free' && currentLevel?.map === 'festival'); }
  function currentMapKey() {
    if (inSchool()) return 'school';
    if (inRooftop()) return 'rooftop';
    if (inPark()) return 'park';
    if (inFestival()) return 'festival';
    if (inHill()) return 'hill';
    if (inLake()) return 'lake';
    return 'free';
  }
  const CAVE_LABELS = { school: 'locker', rooftop: 'roof nook', park: 'bush', festival: 'stall', hill: 'tree hollow', lake: 'reed bed', free: 'cave' };
  function caveXsForMap() { return currentLevel.hideSpots || []; }
  const NIGHT_CHAPTERS = [
    { night: 1, name: 'First Night', sub: 'Learn to dodge Frustrated', theme: '#7893bb', musicRoot: 196, timeLimit: 120, rareChance: 0, feelingsNeeded: { F: 3 }, newMoodling: 'Frustrated charges when you get close; dodge, then pounce while it is dizzy', diary: 'She stopped crying in her sleep. That is something.', moodlingSpeed: .65, frustratedChargeSpeed: .60, frustratedWindup: 1.10, nervousHearingMul: 1, nervousPanicTime: 1.1, initialSpawns: { F: 1 }, respawnDelay: 3.5, goldensAllowed: 0, chaosWave: false, chaosSize: {}, tutorialHints: true, tutorialHint: 'Frustrated charges when you get close. Dodge, then pounce while it is dizzy.' , sky: { A: 0, B: 0, C: 0, wait: 2.0, fallSpeed: 90, gravity: 900, scratchWindow: 1.6, ambushBase: 2, pounceWindowMul: 1.0, hintShown: false }},
    { night: 2, name: 'The Winners’ Wall', sub: 'Move quietly around Nervous, and watch for Jealous', theme: '#8e78ae', musicRoot: 207.65, timeLimit: 130, rareChance: 0, feelingsNeeded: { F: 1, N: 3, J: 2 }, newMoodling: 'Nervous hears running; sneak or walk slowly, then pounce. Jealous steals lights from your trail; catch it when it is tired.', diary: 'She turned a little toward the window.', moodlingSpeed: .75, frustratedChargeSpeed: .70, frustratedWindup: .95, nervousHearingMul: .70, nervousPanicTime: .80, nervousAlarmThreshold: .55, initialSpawns: { F: 1, N: 2, J: 1 }, respawnDelay: 3.2, goldensAllowed: 0, chaosWave: false, chaosSize: {}, tutorialHints: true, tutorialHint: 'Nervous hears you running. Sneak with Shift. Watch out: Jealous steals trail lights. Catch it when it is tired.' , sky: { A: 1, B: 0, C: 0, types: { A: ['N'], B: [], C: [] }, wait: 2.5, fallSpeed: 70, gravity: 900, scratchWindow: 1.6, ambushBase: 2, pounceWindowMul: 1.0, hintShown: false }},
    { night: 3, name: 'The Park', sub: 'Sit still beside Lonely, and freeze when Shy peeks', theme: '#628aa0', musicRoot: 220, timeLimit: 130, rareChance: .05, feelingsNeeded: { N: 1, L: 3, S: 3 }, newMoodling: 'Lonely stays visible; walk slowly, then sit still beside it. Shy peeks back: freeze when it looks, move when it hides its face.', diary: 'Her hand found Shwe in the dark.', moodlingSpeed: .85, frustratedChargeSpeed: .80, frustratedWindup: .85, nervousHearingMul: .80, nervousPanicTime: .90, initialSpawns: { N: 1, L: 1, S: 1 }, respawnDelay: 3.0, goldensAllowed: 0, chaosWave: false, chaosSize: {}, tutorialHints: true, tutorialHint: 'Lonely hides in the open. Sit still beside it. Shy peeks back: freeze when it looks, move when it hides its face.' , sky: { A: 2, B: 0, C: 0, types: { A: ['L', 'N'], B: [], C: [] }, wait: 2.2, fallSpeed: 85, gravity: 800, scratchWindow: 1.6, ambushBase: 2, pounceWindowMul: 1.20, hintShown: false }},
    { night: 4, name: 'Lighting Festival', sub: 'Catch Excited at the top of its bounce', theme: '#c17679', musicRoot: 233.08, timeLimit: 130, rareChance: .14, feelingsNeeded: { F: 1, N: 2, S: 2, E: 3 }, newMoodling: 'Excited bounces higher and higher: jump, then pounce at the very top of its bounce', diary: 'She dreamed of the drawing, not the tearing.', moodlingSpeed: .95, frustratedChargeSpeed: .90, frustratedWindup: .75, nervousHearingMul: .90, nervousPanicTime: 1.00, initialSpawns: { F: 1, N: 1, S: 1, E: 2 }, respawnDelay: 2.8, goldensAllowed: 1, chaosWave: false, chaosSize: {}, tutorialHints: true, tutorialHint: 'The festival is full of Excited. Jump, then pounce at the very top of its bounce.' , sky: { A: 1, B: 2, C: 1, types: { A: ['N'], B: ['E'], C: ['F'] }, wait: 2.0, fallSpeed: 100, gravity: 900, scratchWindow: 2.0, ambushBase: 2, pounceWindowMul: 1.10, hintShown: false }},
    { night: 5, name: 'Hilltop Park', sub: 'Dig up what is buried on the quiet hill', theme: '#7181aa', musicRoot: 246.94, timeLimit: 135, rareChance: .22, feelingsNeeded: { F: 2, L: 3, B: 2 }, newMoodling: 'A feeling is buried under mossy stones, fallen branches and leaf piles: use Night Eyes to spot the right place, then scratch it. Golden feelings sparkle more often up here', diary: 'Almost a smile.', moodlingSpeed: 1.10, frustratedChargeSpeed: 1.05, frustratedWindup: .65, nervousHearingMul: 1.00, nervousPanicTime: 1.10, initialSpawns: { F: 1, L: 1, B: 1 }, respawnDelay: 2.5, goldensAllowed: 2, chaosWave: true, chaosSize: { F: 2 }, tutorialHints: false, tutorialHint: 'Something is buried under the hill’s mossy stones, branches and leaf piles. Press E for Night Eyes, then scratch the glowing spot.' , sky: { A: 2, B: 0, C: 1, types: { A: ['L'], B: [], C: ['F'] }, wait: 1.6, fallSpeed: 115, gravity: 1000, scratchWindow: 1.7, ambushBase: 2, pounceWindowMul: 1.00, hintShown: false }},
    { night: 6, name: 'Lakeside', sub: 'Meet Calm for the first time', theme: '#729579', musicRoot: 261.63, timeLimit: 135, rareChance: .22, feelingsNeeded: { L: 2, C: 2, S: 1, E: 1 }, newMoodling: 'Calm is too dim to come home. Walk slowly to gather 3 fireflies, then bring them to Calm', diary: 'She murmured something kind.', moodlingSpeed: 1.15, frustratedChargeSpeed: 1.10, frustratedWindup: .60, nervousHearingMul: 1.05, nervousPanicTime: 1.15, initialSpawns: { L: 1, C: 1, S: 1, E: 1 }, respawnDelay: 2.3, goldensAllowed: 1, chaosWave: false, chaosSize: {}, tutorialHints: false, tutorialHint: 'Calm sits dim by the lake. Walk slowly into 3 fireflies, then bring their light to Calm.' , sky: { A: 2, B: 1, C: 0, types: { A: ['L'], B: ['E'], C: [] }, wait: 1.4, fallSpeed: 130, gravity: 1100, scratchWindow: 1.4, ambushBase: 2, pounceWindowMul: 0.92, hintShown: false }},
    { night: 7, name: 'Sunrise', sub: 'Bring every feeling home before the sun rises', theme: '#d6a866', musicRoot: 293.66, timeLimit: 150, rareChance: .30, feelingsNeeded: { F: 3, N: 2, J: 2, L: 2, S: 2, E: 2, B: 2, C: 2 }, newMoodling: 'Every mechanic returns for the finale', diary: 'Morning.', moodlingSpeed: 1.25, frustratedChargeSpeed: 1.20, frustratedWindup: .55, nervousHearingMul: 1.10, nervousPanicTime: 1.20, initialSpawns: { F: 1, N: 1, J: 1, L: 1, S: 1, E: 1, B: 1, C: 1 }, respawnDelay: 2.0, goldensAllowed: 2, chaosWave: true, chaosSize: { F: 2, N: 2 }, tutorialHints: false, tutorialHint: 'Everything returns tonight. Keep calm and bring every feeling home.' , sky: { A: 4, B: 3, C: 3, wait: 1.1, fallSpeed: 145, gravity: 1200, scratchWindow: 1.1, ambushBase: 2, pounceWindowMul: 0.85, hintShown: false }}
  ];
  const CHALLENGE_THEMES = ['#7893bb', '#8e78ae', '#628aa0', '#c17679', '#7181aa', '#729579', '#d6a866'];
  const CHALLENGE_NAMES = ['Lantern Walk', 'Mossy Switchback', 'Moonlit Boardwalk', 'Quiet Rooftops', 'Reedbed Passage'];
  const finalChapter = NIGHT_CHAPTERS[6];
  for (let night = 8; night <= 50; night++) {
    const chapter = {
      ...finalChapter,
      night,
      name: `${CHALLENGE_NAMES[(night - 8) % CHALLENGE_NAMES.length]} ${String(night).padStart(2, '0')}`,
      sub: (night - 8) % 5 === 3 ? `Endless Nights · route ${night - 7} · chimneys and quiet roof ledges` : `Endless Nights · route ${night - 7} · more gaps and quicker bridges`,
      theme: CHALLENGE_THEMES[(night - 8) % CHALLENGE_THEMES.length],
      musicRoot: finalChapter.musicRoot * Math.pow(2, ((night - 8) % 9 - 4) / 12),
      feelingsNeeded: { ...finalChapter.feelingsNeeded },
      initialSpawns: { ...finalChapter.initialSpawns },
      chaosSize: { ...finalChapter.chaosSize },
      sky: { ...finalChapter.sky, hintShown: false }
    };
    NIGHT_CHAPTERS.push(chapter);
  }
  // These match the original movement curve; keeping them authored with the chapters lets the
  // layout regression verify that every pit and roost remains reachable at its night's gravity.
  NIGHT_CHAPTERS.forEach(chapter => { chapter.jumpSpeed = 830; chapter.jumpGravity = 2300; });
  const chapterFor = night => NIGHT_CHAPTERS[clamp(night - 1, 0, NIGHT_CHAPTERS.length - 1)];
  // The whole story is one night: each level is one hour, from 11 PM to sunrise.
  const NIGHT_HOURS = ['11 PM', 'Midnight', '1 AM', '2 AM', '3 AM', '4 AM', '5 AM'];
  const hourOf = night => Math.floor(night) <= NIGHT_HOURS.length
    ? NIGHT_HOURS[clamp(Math.floor(night) - 1, 0, NIGHT_HOURS.length - 1)]
    : `Night ${String(Math.floor(night)).padStart(2, '0')}`;
  const SLEEP_STAGES = [
    { faceVisible: 0, blanketLift: 0, handOut: 0, eyesOpen: 0, smile: 0, plant: 0, curtain: 0, room: .15 },
    { faceVisible: 1, blanketLift: 2, handOut: 0, eyesOpen: 0, smile: 0, plant: .15, curtain: .05, room: .22 },
    { faceVisible: 1, blanketLift: 4, handOut: 0, eyesOpen: 0, smile: 0, plant: .3, curtain: .18, room: .30 },
    { faceVisible: 1, blanketLift: 6, handOut: .5, eyesOpen: 0, smile: .1, plant: .5, curtain: .3, room: .40 },
    { faceVisible: 1, blanketLift: 8, handOut: 1, eyesOpen: 0, smile: .4, plant: .7, curtain: .45, room: .52 },
    { faceVisible: 1, blanketLift: 10, handOut: 1, eyesOpen: .3, smile: .7, plant: .9, curtain: .6, room: .65 },
    { faceVisible: 1, blanketLift: 14, handOut: 1, eyesOpen: .5, smile: 1, plant: 1, curtain: .8, room: .78 },
    { faceVisible: 1, blanketLift: 18, handOut: 1, eyesOpen: 1, smile: 1, plant: 1, curtain: 1, room: 1 }
  ];
  const STAGE_LINES = ['', 'She stopped crying in her sleep. I stayed close.', 'She turned toward the window. The moon touched her cheek.', 'Her hand found me in the dark. I did not move.', 'Her face is softer tonight. Something is mending.', 'Her eyelids fluttered. Almost, almost.', 'She stretched. The room smells like morning.', 'Morning. She opened her eyes.'];
  let unlockedLevel = 1, thiriSleepStage = 0, finalAwakeningSeen = false;
  try { unlockedLevel = clamp(Math.floor(+localStorage.getItem('mk-progress') || 1), 1, 50); } catch (e) {}
  try { thiriSleepStage = clamp(Math.floor(+localStorage.getItem('mk-thiri') || 0), 0, 7); } catch (e) {}
  try { finalAwakeningSeen = localStorage.getItem('mk-awakening-seen') === '1'; } catch (e) {}
  function saveStoryProgress() {
    try { localStorage.setItem('mk-progress', String(unlockedLevel)); localStorage.setItem('mk-thiri', String(thiriSleepStage)); } catch (e) {}
  }
  const moonHollow = () => mode === 'story' && storyNight === 7;
  let skyTutorialSeen = {};
  try { const saved = JSON.parse(localStorage.getItem('mk-skyTutorial') || '{}'); if (saved && typeof saved === 'object' && !Array.isArray(saved)) skyTutorialSeen = saved; } catch (e) {}
  function showSkyTutorial(feature) {
    if (skyTutorialSeen[feature]) return;
    skyTutorialSeen[feature] = true;
    try { localStorage.setItem('mk-skyTutorial', JSON.stringify(skyTutorialSeen)); } catch (e) {}
    announce(guideCopy().sky?.[feature] || 'Watch the sky, then bring the feeling home.', feature === 'C' ? RED : feature === 'B' ? GOLD : BLUE, 2.8);
  }
  function skyTotalFor(chapter) { return chapter?.sky ? chapter.sky.A + chapter.sky.B + chapter.sky.C : 0; }
  function skyRemaining(chapter = chapterFor(storyNight)) {
    if (!chapter?.sky) return 0;
    return ['A', 'B', 'C'].reduce((sum, feature) => sum + Math.max(0, chapter.sky[feature] - skyUsed[feature]), 0);
  }

  // ---------- upgrades (Glow treats) ----------
  // 7 levels each. Every second level matches the old 3-level values, so older saves keep their power (old level n = new level 2n).
  const UPG_MAX = 7;
  const UPG = [
    { id: 'pounce', name: 'Pounce', desc: 'A bigger, more forgiving pounce.', costs: [40, 80, 130, 200, 290, 400, 540], vals: [46, 50, 54, 58, 62, 67, 72, 76], fmt: v => `catch reach ${v}` },
    { id: 'swift', name: 'Swift paws', desc: 'Run faster across the Night Side.', costs: [50, 90, 140, 210, 300, 410, 550], vals: [6, 6.3, 6.6, 6.9, 7.2, 7.5, 7.8, 8.1], fmt: v => `${v} tiles per second` },
    { id: 'paws', name: 'Soft paws', desc: 'Nervous Moodlings hear you from less far away.', costs: [70, 120, 180, 260, 360, 480, 620], vals: [5, 4.5, 4, 3.6, 3.2, 2.85, 2.5, 2.2], fmt: v => `heard from ${v} tiles` },
    { id: 'eyes', name: 'Night eyes', desc: 'Press E (or the Eyes button) to highlight nearby scratch spots. Upgrades let Shwe find them from further away.', costs: [60, 100, 160, 240, 340, 460, 600], vals: [4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5], fmt: v => `see ${v} tiles` },
    { id: 'purr', name: 'Purr', desc: 'Press K (or the Purr button) to slow nearby Moodlings for 3 seconds.', costs: [100, 150, 220, 300, 400, 520, 660], vals: [0, 16, 15, 12, 10, 8, 6, 5], fmt: v => v ? `${v}s cooldown` : 'not unlocked' }
  ];
  let upg = { pounce: 0, swift: 0, paws: 0, eyes: 0, purr: 0 }, glow = 0, glowRun = 0, lastGlow = 0;
  try {
    const s = JSON.parse(localStorage.getItem('mk-upg') || '{}');
    const v7 = localStorage.getItem('mk-upg-v') === '7';
    for (const k in upg) if (Number.isInteger(s[k])) upg[k] = clamp(v7 ? s[k] : s[k] * 2, 0, UPG_MAX);
    glow = Math.max(0, +localStorage.getItem('mk-glow') || 0);
  } catch (e) {}
  function saveUpg() { try { localStorage.setItem('mk-upg-v', '7'); localStorage.setItem('mk-upg', JSON.stringify(upg)); localStorage.setItem('mk-glow', String(glow)); } catch (e) {} }
  // Cats: everyone starts with the story cat (Ginger Tabby, as in the intro). The others are bought with Glow; each has one small perk.
  const CAT_SHOP = {
    ginger: { cost: 0, perk: 'Shwe from the story. Good at everything, best at nothing.' },
    burmese: { cost: 600, perk: 'Lucky golden coat: Golden Moodlings give +10 extra Glow.' },
    bengal: { cost: 800, perk: 'Runs 8% faster.' },
    persian: { cost: 700, perk: 'So fluffy and quiet: Nervous hears you 15% less far.' },
    mainecoon: { cost: 800, perk: 'Big and sturdy: the first bump each hour drops no light.' },
    siamese: { cost: 600, perk: 'Talkative: Purr lasts 1 second longer.' },
    sphynx: { cost: 600, perk: 'Sharp eyes: Night Eyes stay open 1.5 seconds longer.' },
    ragdoll: { cost: 700, perk: 'Loves to cuddle: sitting with Lonely takes 30% less time.' },
    british: { cost: 700, perk: 'Long paws: pounce reaches 10% further.' }
  };
  // Comfort items: bought with Glow, used up on your next story hour.
  const ITEMS = [
    { id: 'scarf', icon: '🧣', name: 'Cozy Scarf', cost: 350, desc: 'The first time a Frustrated bumps you, you keep all your lights.' },
    { id: 'bell', icon: '🔔', name: 'Soft Bell', cost: 400, desc: 'Nervous Moodlings hear you 20% less far for the whole hour.' },
    { id: 'jar', icon: '🫙', name: 'Firefly Jar', cost: 250, desc: 'At the lake, the first firefly you scare stays with you instead of flying off.' },
    { id: 'sand', icon: '⏳', name: 'Moon Sand', cost: 300, desc: '+10 seconds on the clock.' }
  ];
  const TRAILS = {
    honey: { name: 'Honey', c: '246,196,83', cost: 0 },
    mint: { name: 'Mint', c: '125,220,139', cost: 150 },
    rose: { name: 'Rose', c: '255,122,184', cost: 150 },
    sky: { name: 'Sky', c: '111,182,255', cost: 150 },
    lilac: { name: 'Lilac', c: '185,162,255', cost: 150 },
    rainbow: { name: 'Rainbow', c: '255,255,255', cost: 180, rainbow: true },
    moon: { name: 'Moonlight', c: '214,226,255', cost: 0, stars: 12 },
    starlight: { name: 'Starlight', c: '255,226,140', cost: 0, stars: 21 }
  };
  const SCORE_PTS = { F: 100, N: 120, L: 150, C: 180, B: 160, E: 140, S: 150, J: 170 };
  const STAR_GLOW = [0, 0, 25, 50];   // Glow for reaching 2 and 3 stars on an hour (first time only)
  let nightStars = (() => { try { return JSON.parse(localStorage.getItem('mk-stars') || '{}') || {}; } catch (e) { return {}; } })();
  function saveStars() { try { localStorage.setItem('mk-stars', JSON.stringify(nightStars)); } catch (e) {} }
  function totalStars() { let s = 0; for (let n = 1; n <= 7; n++) s += nightStars[n] || 0; return s; }
  function starGoals(night) {
    const need = chapterFor(night)?.feelingsNeeded || {}, base = Object.entries(need).reduce((s, [k, v]) => s + v * (SCORE_PTS[k] || 0), 0);
    const r = v => Math.round(v / 50) * 50;
    return [0, r(base * 1.8 + 500), r(base * 2.6 + 1000)];
  }
  function starsFor(night, final, won) { if (!won) return 0; const g = starGoals(night); return final >= g[2] ? 3 : final >= g[1] ? 2 : 1; }
  function grantStarTrails() {
    const got = [];
    for (const [k, tr] of Object.entries(TRAILS)) if (tr.stars && totalStars() >= tr.stars && !ownedTrails.includes(k)) { ownedTrails.push(k); got.push(tr.name); }
    return got;
  }
  let ownedCats = ['ginger'], itemStock = {}, ownedTrails = ['honey'], trailPick = 'honey', activeItems = {}, perkShield = 0;
  try {
    const oc = JSON.parse(localStorage.getItem('mk-cats') || 'null');
    // (an earlier build saved ["burmese"] as the starter: that was never bought, so it is dropped)
    if (Array.isArray(oc)) ownedCats = ['ginger', ...oc.filter((k, i) => k !== 'ginger' && CAT_SHOP[k] && !(k === 'burmese' && i === 0))];
    else if (MK_HAS_PROFILE && !['ginger', 'burmese'].includes(MK_PROFILE.coat)) ownedCats.push(MK_PROFILE.coat);   // keep a cat an older save chose
    const it = JSON.parse(localStorage.getItem('mk-items') || '{}'); ITEMS.forEach(i => { itemStock[i.id] = Math.max(0, Math.floor(+it[i.id] || 0)); });
    const tr = JSON.parse(localStorage.getItem('mk-trails') || 'null'); if (Array.isArray(tr)) ownedTrails = ['honey', ...tr.filter(k => k !== 'honey' && TRAILS[k])];
    const tp = localStorage.getItem('mk-trail'); if (TRAILS[tp] && ownedTrails.includes(tp)) trailPick = tp;
  } catch (e) {}
  if (!ownedCats.includes(MK_PROFILE.coat)) { MK_PROFILE.coat = 'ginger'; COAT = MK_COATS.ginger; }
  function saveShop() {
    try {
      localStorage.setItem('mk-cats', JSON.stringify(ownedCats)); localStorage.setItem('mk-items', JSON.stringify(itemStock));
      localStorage.setItem('mk-trails', JSON.stringify(ownedTrails)); localStorage.setItem('mk-trail', trailPick);
    } catch (e) {}
  }
  const catPerk = () => MK_PROFILE.coat;
  const uv = id => {
    let v = UPG.find(u => u.id === id).vals[upg[id]];
    if (id === 'swift' && catPerk() === 'bengal') v *= 1.08;
    if (id === 'pounce' && catPerk() === 'british') v *= 1.1;
    if (id === 'paws') { if (catPerk() === 'persian') v *= .85; if (activeItems.bell) v *= .8; }
    return v;
  };
  const FREE_GLOW_CAP = 150;
  let freeCapShown = false, freeLightCapShown = false;
  // Free mode is for practice: it brings home at most a few lights for the Heart Workshop per run, so the story stays the way to grow Lantern Town
  const FREE_LIGHT_CAP = 6;
  const purrDur = () => catPerk() === 'siamese' ? 4 : 3;
  const eyesDur = () => catPerk() === 'sphynx' ? 5.5 : 4;
  const sitNeed = () => catPerk() === 'ragdoll' ? 1.4 : 2;
  let purrT = 0, purrCd = 0, purrQ = false, eyesT = 0, eyesCd = 0, eyesQ = false;

  // ---------- Mood Book (collection with rare variants) ----------
  const VARS = {
    F: [
      { n: 'Frustrated', c: '#ff6168', r: 'Common', d: 'Charges when you get close. Dodge, then pounce while it is dizzy.', line: '“I was angry because I really cared about that drawing.”' },
      { n: 'Stormy Frustrated', c: '#d23a55', r: 'Rare', d: 'A tiny thundercloud follows it everywhere.', line: '“Sometimes the anger stays all day, like weather.”' },
      { n: 'Sulky Frustrated', c: '#ff94a6', r: 'Rare', d: 'Pouts instead of stamping. Still charges, though.', line: '“I wasn’t angry at Hnin. I was angry at me.”' }
    ],
    N: [
      { n: 'Nervous', c: '#a98bff', r: 'Common', d: 'Panics if you run or jump nearby. Sneak, then pounce.', line: '“I was scared everyone would see I lost.”' },
      { n: 'Shivery Nervous', c: '#c4cdff', r: 'Rare', d: 'Leaves little frost sparkles when it shakes.', line: '“My hands get cold before I show anyone my drawings.”' },
      { n: 'Sparkly Nervous', c: '#e58bff', r: 'Rare', d: 'Nervous, but a little bit excited too.', line: '“Butterflies feel the same as fear, at first.”' }
    ],
    L: [
      { n: 'Lonely', c: '#6fb6ff', r: 'Common', d: 'Listen for its soft chime; scratch a marked spot, then sit still nearby.', line: '“I thought nobody would notice if I disappeared. Hnin did.”' },
      { n: 'Sleepy Lonely', c: '#8fa8dc', r: 'Rare', d: 'Dozes in its hiding spot. Easy to sit with, hard to find.', line: '“I slept a lot this week. It was easier than talking.”' },
      { n: 'Rainy Lonely', c: '#4fd1c5', r: 'Rare', d: 'Tiny raindrops fall around it.', line: '“Rainy days feel lonely. Rainy days with friends don’t.”' }
    ],
    G: [{ n: 'Golden', c: '#f6c453', r: 'Special', d: 'Rare and fast. Worth 500 points and 5 extra seconds.', line: '“Some days have one small good thing. That counts.”' }],
    E: [{ n: 'Excited', c: '#ffd23f', r: 'Common', d: 'Bounces higher and higher. Jump, then pounce at the very top of its bounce.', line: '“I used to count the days until art club.”' }],
    S: [{ n: 'Shy', c: '#ff7ab8', r: 'Common', d: 'Peeks back over its shoulder. Freeze while it looks; move while it hides its face.', line: '“I wanted to show my drawing to Hnin, but I was too shy to ask.”' }],
    J: [{ n: 'Jealous', c: '#ff9a3c', r: 'Common', d: 'Steals lights from your trail, then runs. Catch it when it gets tired to win them back.', line: '“The winning drawing really was good. That is why it hurt.”' }],
    C: [
      { n: 'Calm', c: '#7ddc8b', r: 'Story', d: 'Gather three fireflies slowly, then bring their light to Calm.', line: '“It’s okay. You can rest now.”', lock: 'Meet it by the lake at 4 AM.' },
      { n: 'Breathing Calm', c: '#a8f0c8', r: 'Rare', d: 'Floats in a soft bubble. Hold S while it grows, let go while it shrinks. Three slow breaths.', line: '“Breathe in… and out. There. That’s better.”', lock: 'A rare Calm by the lake. Look for a bubble.' }
    ],
    B: [
      { n: 'Buried', c: '#a67646', r: 'Common', d: 'Hides beneath a place-specific object. Reveal it with Night Eyes, then scratch the marked spot. A wrong spot shakes the ground.', line: '“I put it somewhere deep so I wouldn’t have to look at it.”' },
      { n: 'Petrified Buried', c: '#8c5a3a', r: 'Rare', d: 'So deep it has almost turned to stone. Same scratch rules.', line: '“It was easier to be numb than to feel it.”' },
      { n: 'Fossil Buried', c: '#c8a56a', r: 'Rare', d: 'Leaves a faint amber trail when it flees.', line: '“Some things stay with you even after you bury them.”' }
    ]
  };
  const BOOK_ORDER = ['F0', 'F1', 'F2', 'N0', 'N1', 'N2', 'L0', 'L1', 'L2', 'B0', 'B1', 'B2', 'E0', 'S0', 'J0', 'C0', 'C1', 'G0'];
  let book = {};
  try { book = JSON.parse(localStorage.getItem('mk-book') || '{}') || {}; } catch (e) { book = {}; }
  let encounteredMoodlings = {};
  try { const seen = JSON.parse(localStorage.getItem('mk-moodling-seen') || '[]'); if (Array.isArray(seen)) seen.forEach(key => { if (typeof key === 'string') encounteredMoodlings[key] = true; }); } catch (e) {}
  function rememberMoodlingEncounter(type, variant = 0) {
    const key = `${type}${variant}`;
    if (encounteredMoodlings[key]) return;
    encounteredMoodlings[key] = true;
    try { localStorage.setItem('mk-moodling-seen', JSON.stringify(Object.keys(encounteredMoodlings))); } catch (e) {}
  }
  const saveBook = () => { try { localStorage.setItem('mk-book', JSON.stringify(book)); } catch (e) {} };
  const vinfo = (ty, v = 0) => VARS[ty][v] || VARS[ty][0];
  const vcol = (ty, v = 0) => vinfo(ty, v).c;
  const BOOK_GOAL_KEYS = BOOK_ORDER.filter(key => key !== 'G0');
  const guideCopy = () => { const bank = window.TC_TIPS || {}; return bank[MK_PROFILE.tipLanguage] || bank.en || {}; };
  function persistGuidanceProgress() {
    const data = { welcomeSeen: !!MK_PROFILE.welcomeSeen, tutorialDone: !!MK_PROFILE.tutorialDone, tipsSeen: Array.isArray(MK_PROFILE.tipsSeen) ? MK_PROFILE.tipsSeen.slice(-100) : [], showTips: MK_PROFILE.showTips !== false, tipLanguage: MK_PROFILE.tipLanguage === 'my' ? 'my' : 'en' };
    try { localStorage.setItem('mk-onboarding', JSON.stringify(data)); if (MK_HAS_PROFILE) localStorage.setItem('mk-profile', JSON.stringify(MK_PROFILE)); } catch (e) {}
  }
  function guidanceSeen(key) { return Array.isArray(MK_PROFILE.tipsSeen) && MK_PROFILE.tipsSeen.includes(key); }
  function rememberGuidance(key) {
    if (!Array.isArray(MK_PROFILE.tipsSeen)) MK_PROFILE.tipsSeen = [];
    if (!MK_PROFILE.tipsSeen.includes(key)) { MK_PROFILE.tipsSeen.push(key); MK_PROFILE.tipsSeen = MK_PROFILE.tipsSeen.slice(-100); persistGuidanceProgress(); }
  }
  function renderTipControl(action) {
    const host = $('#tipCoachControl'); host.replaceChildren();
    if (!action) { host.hidden = true; return; }
    const labels = guideCopy().controlLabels?.[action] || guideCopy().controlLabels?.move;
    const isTouch = touchUI && !touchUI.hidden;
    host.hidden = false;
    if (isTouch) {
      if (['move', 'dodge', 'sneak'].includes(action)) {
        const joystick = document.createElement('span'); joystick.className = 'tip-joystick-icon'; joystick.setAttribute('aria-hidden', 'true'); host.appendChild(joystick);
      } else {
        const icon = document.createElement('span'); icon.className = 'tip-touch-icon'; icon.setAttribute('aria-hidden', 'true');
        icon.textContent = action === 'jump' ? 'JUMP' : action === 'eyes' ? 'EYES' : action === 'scratch' ? 'SCRATCH' : 'POUNCE'; host.appendChild(icon);
      }
      const label = document.createElement('span'); label.textContent = labels?.touch || ''; host.appendChild(label);
    } else {
      const icon = document.createElement('span'); icon.className = 'tip-key-icon'; icon.textContent = '⌨'; icon.setAttribute('aria-hidden', 'true'); host.appendChild(icon);
      const label = document.createElement('span'); label.className = 'tip-key-label'; label.textContent = labels?.keyboard || ''; host.appendChild(label);
    }
  }
  function showCoachTip({ kicker = '', title = '', text = '', action = null, skip = false, success = false } = {}) {
    $('#tipCoachKicker').textContent = kicker; $('#tipCoachTitle').textContent = title; $('#tipCoachText').textContent = text;
    $('#tutorialSkipBtn').textContent = guideCopy().skipTutorial || 'Skip tutorial';
    $('#tipCoach').hidden = false; $('#tutorialSkipBtn').hidden = !skip;
    $('#tipCoach').querySelector('.tip-coach-card').classList.toggle('tip-success', !!success);
    renderTipControl(action);
  }
  function hideCoachTip() { $('#tipCoach').hidden = true; $('#tutorialSkipBtn').hidden = true; $('#tipCoachControl').replaceChildren(); }
  function renderWelcomeCard(index, scroll = true) {
    const list = guideCopy().welcome || [], carousel = $('#welcomeCarousel');
    welcomeCardIndex = clamp(index, 0, Math.max(0, list.length - 1));
    Array.from($('#welcomeCardTrack').querySelectorAll('.welcome-card')).forEach((card, i) => {
      const item = list[i] || { title: '', text: '' };
      card.querySelector('h3').textContent = item.title; card.querySelector('p').textContent = item.text;
      card.setAttribute('aria-hidden', String(i !== welcomeCardIndex));
    });
    $('#welcomeDots').querySelectorAll('.welcome-dot').forEach((dot, i) => {
      const active = i === welcomeCardIndex; dot.classList.toggle('is-active', active); dot.setAttribute('aria-selected', String(active));
    });
    const copy = guideCopy(); $('#welcomeNextBtn').textContent = welcomeCardIndex === list.length - 1 ? copy.finishWelcome : copy.next;
    $('#welcomeSkipBtn').textContent = copy.skipWelcome; $('#welcomeCardsKicker').textContent = copy.welcomeLabel;
    if (scroll && carousel) carousel.scrollTo({ left: welcomeCardIndex * carousel.clientWidth, behavior: reduce ? 'auto' : 'smooth' });
  }
  function showWelcomeCards(startIndex = 0) {
    state = 'menu'; cv.hidden = true; $('#welcomeScreen').hidden = true; $('#setupScreen').hidden = true; $('#startScreen').hidden = true;
    $('#prologueScreen').hidden = true; $('#welcomeCardsScreen').hidden = false; renderWelcomeCard(startIndex, false); $('#welcomeNextBtn').focus({ preventScroll: true });
  }
  function finishWelcomeCards() {
    MK_PROFILE.welcomeSeen = true; persistGuidanceProgress(); $('#welcomeCardsScreen').hidden = true;
    // names were chosen before the intro, so the welcome cards lead straight to the map
    if (MK_HAS_PROFILE) { mapGuidePending = true; showStoryMap(true); } else showSetup(true);
  }
  function welcomeNext() { if (welcomeCardIndex >= (guideCopy().welcome || []).length - 1) finishWelcomeCards(); else renderWelcomeCard(welcomeCardIndex + 1); }
  function welcomePrevious() { if (welcomeCardIndex > 0) renderWelcomeCard(welcomeCardIndex - 1); }
  function tutorialSpotX() { const spots = currentLevel.hideSpots || []; return clamp(Number(spots[0]) || cat.x + 190, 80, WORLD - 80); }
  function ensureTutorialCatchMoodling() {
    let target = mood.find(m => !m.dead && m.tutorialCatch);
    if (!target && nightGuide.active && storyNight === 1) {
      target = spawn('F', clamp(cat.x + (cat.face || 1) * 130, 80, WORLD - 80));
      target.tutorialOnly = true; target.tutorialCatch = true; target.state = 'dizzy'; target.st = Infinity; target.slept = 2; target.cd = 99; target.home = target.x;
    }
    return target;
  }
  function ensureTutorialFrustrated() {
    let target = mood.find(m => !m.dead && m.tutorialDodge);
    if (!target && nightGuide.active && storyNight === 1) {
      target = spawn('F', clamp(cat.x + (cat.face || 1) * 220, 80, WORLD - 80));
      target.tutorialOnly = true; target.tutorialDodge = true; target.state = 'patrol'; target.slept = 2; target.cd = .3; target.home = target.x;
    }
    return target;
  }
  function tutorialTarget() {
    if (nightGuide.active) {
      const action = (guideCopy().tutorial || [])[nightGuide.step]?.action;
      if (action === 'move' || action === 'sneak') return { x: clamp(nightGuide.origin + 80, 40, WORLD - 40), y: terrainY(nightGuide.origin + 80) - 25 };
      if (action === 'catch') { const m = ensureTutorialCatchMoodling(); return m || { x: cat.x + cat.face * 110, y: terrainY(cat.x) - 34 }; }
      if (action === 'dodge' || action === 'dizzy-pounce') { const m = ensureTutorialFrustrated(); return m || { x: cat.x + cat.face * 100, y: terrainY(cat.x) - 20 }; }
      if (action === 'eyes' || action === 'scratch') { const x = tutorialSpotX(); return { x, y: terrainY(x) - 14 }; }
      return { x: cat.x, y: cat.y - 28 };
    }
    return activeJitTip?.target || null;
  }
  function drawGuidanceMarker() {
    if ((!nightGuide.active && !activeJitTip) || !MK_PROFILE.showTips) return;
    const target = tutorialTarget(); if (!target) return;
    const pulse = reduce ? 1 : .94 + Math.sin(performance.now() / 230) * .06;
    const x = target.x, y = target.y;
    ctx.save(); ctx.globalAlpha = .78; ctx.shadowColor = GOLD; ctx.shadowBlur = reduce ? 0 : 16;
    ctx.strokeStyle = GOLD; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, 34 * pulse, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = 'rgba(255,216,112,.14)'; ctx.beginPath(); ctx.arc(x, y, 27 * pulse, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x, y - 59); ctx.lineTo(x - 8, y - 72); ctx.lineTo(x + 8, y - 72); ctx.closePath(); ctx.fillStyle = GOLD; ctx.fill();
    ctx.restore();
  }
  function showTutorialStep() {
    const step = (guideCopy().tutorial || [])[nightGuide.step];
    if (!step) { finishGuidedTutorial(); return; }
    nightGuide.origin = cat.x; nightGuide.jumped = false;
    $('#shweTeacher').src = COAT.heroImg || COAT.img;
    $('#tipCoach').classList.add('shwe-lesson');
    showCoachTip({ kicker: `${MK_PROFILE.cat} · ${nightGuide.step + 1} / 4`, title: step.title, text: step.text, action: step.action, skip: true });
    if (step.action === 'catch') ensureTutorialCatchMoodling();
    if (step.action === 'dodge' || step.action === 'dizzy-pounce') ensureTutorialFrustrated();
    if (step.action === 'home' && nightGuide.pendingWin) onTutorialAction('home', cat);
  }
  function startGuidedTutorial() {
    if (!MK_PROFILE.showTips || MK_PROFILE.tutorialDone || mode !== 'story' || storyNight !== 1) return false;
    nightGuide.active = true; nightGuide.step = 0; nightGuide.success = 0; nightGuide.pendingWin = false; nightGuide.buffered = [];
    document.body.classList.add('learning-with-shwe');
    showTutorialStep(); return true;
  }
  // When every feeling is home the night no longer ends by itself: a moon door opens near Shwe.
  // The player can keep exploring (trinkets, keepsakes, score) and stand at the door and press H to go home;
  // if the timer runs out first, the night still ends safely.
  let allHome = false, portal = null;
  function reachAllHome() {
    if (allHome || state !== 'play') return;
    allHome = true; sfx('ui', 'reward'); openPortal();
    announce('All feelings found! A moon door opened. Stand in it and press H to go home.', GOLD, 3.6);
    float(cat.x, cat.y - 90, 'Time left still adds +20 points a second', GOLD);
  }
  function openPortal() {
    const face = cat.face || 1, place = d => safeLevelX(clamp(cat.x + d, 160, WORLD - 160));
    let x = place(face * 3 * T);
    if (Math.abs(x - cat.x) < 1.5 * T) x = place(-face * 3 * T);
    portal = { x, y: terrainY(x), open: 0, born: t };
    burst(x, portal.y - 60, '#cfe0ff', 30); sfx('ui', 'unlock');
  }
  function updPortal(dt) {
    if (!portal) return;
    portal.open = Math.min(1, portal.open + dt / .8);
  }
  // Shwe has to stand at the moon door and press H (or tap the Go home button) to go through it.
  function atPortal() { return !!portal && state === 'play' && portal.open >= 1 && !cat.falling && Math.abs(cat.x - portal.x) < 60 && Math.abs(cat.y - portal.y) < 90; }
  function enterPortal() { if (!atPortal()) return; burst(portal.x, portal.y - 60, '#fff3c4', 36); goHome(); }
  function drawPortal() {
    if (!portal) return;
    const k = portal.open, e = 1 - Math.pow(1 - k, 3), x = portal.x, y = portal.y, w = 34 * e, h = 62 * e, cy = y - 66;
    ctx.save();
    ctx.drawImage(glowImg('#bcd0ff'), x - 90, cy - 90, 180, 180);
    const g = ctx.createRadialGradient(x, cy, 4, x, cy, h);
    g.addColorStop(0, '#fff6d8'); g.addColorStop(.35, '#9fb8ff'); g.addColorStop(1, '#2b2560');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, cy, w, h, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = '#ffe9a8'; ctx.lineWidth = 4; ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) { const a = t * 1.6 + i * 2.1; ctx.beginPath(); ctx.ellipse(x, cy, w * .7, h * .7, 0, a, a + 1.2); ctx.stroke(); }
    ctx.fillStyle = '#fff'; for (let i = 0; i < 6; i++) { const a = t * .9 + i, r = h * (.3 + .1 * (i % 3)); ctx.globalAlpha = .5 + .5 * Math.sin(t * 3 + i); ctx.fillRect(x + Math.cos(a) * w * .55, cy + Math.sin(a) * r, 2, 2); }
    ctx.globalAlpha = 1;
    if (k >= 1) {
      const bob = Math.sin(t * 3) * 3; ctx.font = `700 22px ${HAND}`; ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(15,10,35,.55)'; ctx.fillText('Home', x + 1, cy - h - 12 + bob + 1);
      ctx.fillStyle = '#fff3c4'; ctx.fillText('Home', x, cy - h - 12 + bob);
      // when the door is off screen, a small sign at the edge points back to it
      const left = camX + 26, right = camX + VW - 26;
      if (x < left || x > right) {
        const ax = x < left ? left : right, dir = x < left ? -1 : 1, ay = cat.y - 120;
        ctx.fillStyle = 'rgba(255,243,196,.92)'; ctx.beginPath(); ctx.moveTo(ax + dir * 14, ay); ctx.lineTo(ax - dir * 6, ay - 12); ctx.lineTo(ax - dir * 6, ay + 12); ctx.closePath(); ctx.fill();
        ctx.font = `700 18px ${HAND}`; ctx.textAlign = dir < 0 ? 'left' : 'right'; ctx.fillText('Home', ax - dir * 10, ay - 18);
      }
    }
    ctx.restore();
  }
  function goHome() { if (!allHome || state !== 'play') return; initAudio(); sfx('ui', 'start'); beginStoryEnding(); }
  function beginStoryEnding() {
    if (state !== 'play') return;
    state = 'ending'; endT = 1.1; announce(moonHollow() ? 'The sun is up. Every feeling is home!' : 'All feelings found!', GOLD, 1.2);
  }
  function finishGuidedTutorial() {
    nightGuide.active = false; nightGuide.success = 0; nightGuide.buffered = [];
    document.body.classList.remove('learning-with-shwe');
    mood = mood.filter(m => !m.tutorialOnly); hideCoachTip(); $('#tipCoach').classList.remove('shwe-lesson');
    cat.x = currentLevel.catStart ?? 200; cat.y = terrainY(cat.x); cat.vx = 0; cat.vy = 0; cat.on = true; cat.platform = null; cat.pounce = 0; cat.inv = 1.5; hist = []; camX = 0;
    announce(guideCopy().tutorialComplete || 'You did it! Let’s bring the feelings home.', GOLD, 2.5);
    warmup = 1.5; frustWakeAt = t + FRUST_SLEEP + warmup;
    MK_PROFILE.tutorialDone = true; persistGuidanceProgress();
    if (nightGuide.pendingWin) beginStoryEnding();
  }
  function skipGuidedTutorial() {
    if (!nightGuide.active) return;
    finishGuidedTutorial();
  }
  $('#tutorialSkipBtn').addEventListener('click', skipGuidedTutorial);
  function onTutorialAction(action, target = null) {
    if (!nightGuide.active) return;
    const steps = guideCopy().tutorial || [], current = steps[nightGuide.step];
    if (!current) return;
    if (nightGuide.success > 0) return;
    if (current.action === 'jump' && action === 'jump') { nightGuide.jumped = true; return; }
    if (current.action === 'jump' && action === 'land' && nightGuide.jumped) action = 'jump';
    if (current.action !== action) return;
    if ((action === 'move' || action === 'sneak') && (!cat.on || Math.abs(cat.x - nightGuide.origin) < 70)) return;
    if (action === 'catch' && !target?.tutorialCatch) return;
    if (action === 'dodge' && target?.tutorialDodge) { target.state = 'dizzy'; target.st = 3; }
    nightGuide.success = .52;
    const point = target && Number.isFinite(target.x) ? target : cat;
    burst(point.x, point.y - 18, GOLD, 13); sfx('ui', 'sparkle'); tone(880, .12, 'sine', .04, 180);
    showCoachTip({ kicker: `${MK_PROFILE.cat} · ${nightGuide.step + 1} / 4`, title: current.title, text: guideCopy().success, action: current.action, skip: true, success: true });
  }
  function guidanceTimerPaused() { return nightGuide.active || !!activeJitTip; }
  function queueJitTip(key, target = null, title = null, text = null, seenId = null) {
    if (!MK_PROFILE.showTips || nightGuide.active || guidanceSeen(seenId || `mechanic:${key}`)) return;
    const id = seenId || `mechanic:${key}`;
    if (activeJitTip?.id === id || jitTipQueue.some(item => item.id === id)) return;
    jitTipQueue.push({ id, key, text, target: target && Number.isFinite(target.x) ? { x: target.x, y: target.y } : null, title });
    if (state === 'play') showNextJitTip();
  }
  function showNextJitTip() {
    if (state !== 'play' || nightGuide.active || activeJitTip || !jitTipQueue.length) return;
    const item = jitTipQueue.shift(); if (guidanceSeen(item.id)) return showNextJitTip();
    const copy = item.text || guideCopy().mechanics?.[item.key]; if (!copy) return showNextJitTip();
    activeJitTip = { ...item, text: copy, time: 4 };
    rememberGuidance(item.id);
    if (mode === 'story') { const chapter = chapterFor(storyNight); if (chapter?.sky) chapter.sky.hintShown = true; }
    showCoachTip({ kicker: guideCopy().jitLabel || 'A little tip', title: item.title || item.key[0].toUpperCase() + item.key.slice(1), text: copy });
  }
  function onGuidanceSpawn(m) {
    if (!m || m.tutorialOnly || !VARS[m.type]) return;
    const variant = Math.min(VARS[m.type].length - 1, Math.max(0, Math.floor(m.v || 0)));
    const key = `${m.type}${variant}`;
    rememberMoodlingEncounter(m.type, variant);
    if (!MK_PROFILE.showTips || nightGuide.active) return;
    const info = vinfo(m.type, variant), id = `moodling:${key}`, guides = guideCopy().help?.catchGuides || {};
    const text = [guides[key] || guides[m.type] || info.d, guideCopy().catchClipHint].filter(Boolean).join(' ');
    queueJitTip(`moodling-${key}`, m, info.n, text, id);
  }
  let struggleTipShownThisRun = false;
  function maybeStruggleTip(kind, target = null) {
    if (!MK_PROFILE.showTips || nightGuide.active || activeJitTip || jitTipQueue.length) return;
    if (struggleTipShownThisRun) return;
    struggleTipShownThisRun = true;
    const suffix = mode === 'free' ? 'free' : `night-${storyNight}`, id = `struggle:${suffix}`;
    const key = kind === 'hits' ? 'struggleHits' : 'struggleQuiet';
    activeJitTip = { id, key, text: guideCopy().mechanics?.[key] || '', target: target ? { x: target.x, y: target.y } : null, time: 4 };
    showCoachTip({ kicker: guideCopy().struggleLabel || 'A gentle hint', title: guideCopy().struggleTitle || 'Take your time', text: activeJitTip.text });
  }
  function onGuidanceCatch(m) {
    guidanceCaught = caughtN; struggleTimer = 0; guidanceHits = {};
    if (nightGuide.active) onTutorialAction('catch', m);
    if (combo >= 2 && !guidanceSeen('mechanic:combo')) queueJitTip('combo', m, guideCopy().mechanicTitles?.combo || 'Combo');
  }
  function updateGuidance(dt) {
    if (nightGuide.active && nightGuide.jumped && cat.justLanded) onTutorialAction('land', cat);
    if (nightGuide.active) {
      const action = (guideCopy().tutorial || [])[nightGuide.step]?.action;
      if (action === 'dodge' || action === 'dizzy-pounce') ensureTutorialFrustrated();
    }
    if (nightGuide.active && nightGuide.success > 0) {
      nightGuide.success -= dt;
      if (nightGuide.success <= 0) {
        nightGuide.success = 0; nightGuide.step++;
        if (nightGuide.step >= (guideCopy().tutorial || []).length) finishGuidedTutorial();
        else {
          const next = (guideCopy().tutorial || [])[nightGuide.step], bufferedAt = nightGuide.buffered.findIndex(item => item.action === next.action);
          const buffered = bufferedAt >= 0 ? nightGuide.buffered.splice(bufferedAt, 1)[0] : null;
          showTutorialStep(); if (buffered) onTutorialAction(buffered.action, buffered.target);
        }
      }
    }
    if (activeJitTip) {
      activeJitTip.time -= dt;
      if (activeJitTip.time <= 0) { activeJitTip = null; hideCoachTip(); showNextJitTip(); }
    } else if (jitTipQueue.length) showNextJitTip();
    if (state === 'play' && !nightGuide.active && !activeJitTip && MK_PROFILE.showTips) {
      if (guidanceCaught !== caughtN) { guidanceCaught = caughtN; struggleTimer = 0; }
      else { struggleTimer += dt; if (struggleTimer >= 30) { struggleTimer = 0; maybeStruggleTip('quiet'); } }
    }
  }
  let runNew = [], runDone = [], runN = 0;

  // ---------- Daily missions ----------
  const MISSIONS = [
    { id: 'catchF', text: 'Catch 6 Frustrated Moodlings', goal: 6, reward: 50 },
    { id: 'catchN', text: 'Catch 5 Nervous Moodlings', goal: 5, reward: 50 },
    { id: 'catchL', text: 'Bring home 3 Lonely Moodlings', goal: 3, reward: 60 },
    { id: 'combo4', text: 'Reach a ×4 combo', goal: 1, reward: 60 },
    { id: 'quietN', text: 'Catch 3 Nervous in one run without startling any', goal: 1, reward: 80 },
    { id: 'golden', text: 'Catch a Golden Moodling', goal: 1, reward: 50 },
    { id: 'catchS', text: 'Catch 4 Shy Moodlings in the story', goal: 4, reward: 60 },
    { id: 'nohit', text: 'Finish the 11 PM hour without being hit', goal: 1, reward: 80 },
    { id: 'rare', text: 'Catch a rare Moodling (look for sparkles)', goal: 1, reward: 70 },
    { id: 'glow', text: 'Earn 150 Glow today', goal: 150, reward: 40 }
  ];
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const mdef = id => MISSIONS.find(m => m.id === id);
  let ms = null;
  function saveMissions() { try { localStorage.setItem('mk-missions', JSON.stringify(ms)); } catch (e) {} }
  function loadMissions() {
    try { ms = JSON.parse(localStorage.getItem('mk-missions') || 'null'); } catch (e) { ms = null; }
    if (!ms || ms.date !== today() || !Array.isArray(ms.ids) || ms.ids.some(id => !mdef(id))) {
      let h = 7; for (const ch of today()) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
      const pool = MISSIONS.map(m => m.id), ids = [];
      while (ids.length < 3) { h = (Math.imul(h, 1103515245) + 12345) >>> 0; ids.push(pool.splice(h % pool.length, 1)[0]); }
      ms = { date: today(), ids, prog: {}, claimed: {} }; saveMissions();
    }
  }
  function bump(id, n = 1) {
    if (!ms) return;
    if (ms.date !== today()) loadMissions();
    if (!ms.ids.includes(id)) return;
    const d = mdef(id), p = ms.prog[id] || 0;
    if (p >= d.goal) return;
    ms.prog[id] = Math.min(d.goal, p + n); saveMissions();
    if (ms.prog[id] >= d.goal) {
      runDone.push(d.text);
      if (state === 'play' || state === 'ending') { announce('Mission complete!', GOLD, 1.6); sfx('cat', 'trill'); }
    }
  }
  loadMissions();
  let need = { F: 4, N: 4, L: 2 }, got = { F: 0, N: 0, L: 0 }, hits = 0, startles = 0, goldDone = { a: false, b: false }, lastTick = 99;
  const requiredTotal = () => Object.values(need).reduce((sum, n) => sum + n, 0);
  const caughtTotal = () => Object.values(got).reduce((sum, n) => sum + n, 0);
  let cat, mood = [], parts = [], floats = [], trail = [], hist = [], camX = 0, respawnQ = [], banner = null;
  // Workshop lights are banked only at the run's normal completion boundary.
  let workshopRun = [], goldenCollar = false;
  let scratchSpots = [], scratchTarget = null, scratchAnim = 0, rocks = [], buriedHome = null, shake = 0;
  // Calm (4 AM, Lakeside): it sits dim on a lily pad. Shwe gathers FLY_NEED fireflies by walking slowly,
  // then brings them to Calm, which lights up and comes home. Running/jumping/pouncing near a firefly scatters it.
  const FLY_NEED = 3, FLY_SLOW = 140;
  let fireflies = [], flyMsgAt = -9, flyHintShown = false;
  let skyUsed = { A: 0, B: 0, C: 0 }, skyPerfect = 0, skySpawned = 0, skyNextAt = 15;
  // Themed traps and hidden keepsakes (data in levels.js: hazards, keepsakes, 'sinking' platforms)
  const SINK_TIME = 1.6;
  const KEEPSAKE_GLOW = 25;
  const KEEPSAKE_ART = { school: ['paper star', '#ffe39a'], rooftop: ['little bell', '#ffe1a3'], park: ['lost marble', '#9fd7ff'], festival: ['lucky charm', '#ff9fb4'], hill: ['acorn', '#e2b07a'], lake: ['seashell', '#ffe2c5'], free: ['star', '#ffe39a'] };
  let hazards = [], keepsakes = [], hazSeen = {}, buriedHintShown = false;
  let foundKeeps = (() => { try { return new Set(JSON.parse(localStorage.getItem('mk-keepsakes') || '[]')); } catch (e) { return new Set(); } })();
  function saveKeeps() { try { localStorage.setItem('mk-keepsakes', JSON.stringify([...foundKeeps])); } catch (e) {} }
  function keepsakeTotal(night) { const L = window.TC_LEVELS?.[night]; return L ? (L.keepsakes || []).length + ((chapterFor(night)?.feelingsNeeded?.B || 0) ? 0 : 1) : 0; }
  function keepsakesFound(night) { let n = 0; for (const id of foundKeeps) if (id.startsWith(`n${night}-`)) n++; return n; }
  function initHazards() {
    hazards = []; keepsakes = []; hazSeen = {}; buriedHintShown = false;
    if (mode !== 'story') return;
    hazards = (currentLevel.hazards || []).map((h, i) => ({ ...h, i, cd: 0, tt: 0, phase: 'idle', off: (i * 2.3) % 5, drops: [], squeakT: 0, sneakShown: false, splashShown: false }));
    keepsakes = (currentLevel.keepsakes || []).map(([x, y], i) => ({ x, y, id: `n${storyNight}-${i}`, found: foundKeeps.has(`n${storyNight}-${i}`), bob: Math.random() * 6, got: 0 }));
    // nights without Buried hide one keepsake under a dig spot instead (other spots still rumble)
    if (!need.B && rocks.length && !foundKeeps.has(`n${storyNight}-dig`)) rocks[Math.floor(Math.random() * rocks.length)].keepsake = true;
  }
  function collectKeepsake(id, x, y) {
    if (foundKeeps.has(id)) return;
    foundKeeps.add(id); saveKeeps();
    const [name, c] = KEEPSAKE_ART[currentMapKey()] || KEEPSAKE_ART.free;
    glowRun += KEEPSAKE_GLOW; bump('glow', KEEPSAKE_GLOW);
    burst(x, y, c, 26); sfx('ui', 'sparkle');
    tone(988, .14, 'sine', .05); setTimeout(() => tone(1319, .22, 'sine', .045), 90);
    float(x, y - 40, `+${KEEPSAKE_GLOW} Glow`, GOLD);
    announce(`Found Thiri’s ${name}! Keepsakes ${keepsakesFound(storyNight)}/${keepsakeTotal(storyNight)}`, c, 2.4);
  }
  function knockCat(dir, msg) {
    if (cat.inv > 0) return;
    cat.inv = 1; cat.vx = dir * 380; cat.vy = -380; cat.on = false; cat.pounce = 0; combo = 0; comboT = 0;
    timeLeft = Math.max(0, timeLeft - 1); shake = Math.max(shake, 8);
    sfx('ui', 'hit'); sfx('cat', 'sad'); float(cat.x, cat.y - 80, msg + '  −1s', RED);
  }
  function onSlick(x) { return hazards.some(h => h.kind === 'slick' && x >= h.a && x <= h.b); }
  function hazNotice(kind, text, c) { if (hazSeen[kind]) return; hazSeen[kind] = true; announce(text, c, 2.4); }
  function hazPhase(h, period, idle, warn) { const q = ((t + h.off) % period + period) % period; return q < idle ? 'idle' : q < idle + warn ? 'warn' : 'on'; }
  function updHazards(dt) {
    if (nightGuide.active) return;
    if (state !== 'play' && state !== 'ending') return;
    for (const h of hazards) {
      h.cd = Math.max(0, h.cd - dt); h.squeakT = Math.max(0, h.squeakT - dt);
      if (h.kind === 'squeak') {
        const onBoard = cat.on && cat.x >= h.x && cat.x <= h.x + h.w;
        if (!onBoard) continue;
        if (cat.sneak || Math.abs(cat.vx) < 90) { if (!cat.sneak || h.sneakShown) continue; h.sneakShown = true; float(cat.x, cat.y - 74, 'Tiptoe… no squeak', '#c8ff8a'); continue; }
        if (h.cd > 0 && !cat.justLanded) continue;
        if (h.cd > 0) continue;
        h.cd = 1.1; h.squeakT = .5;
        tone(620, .09, 'square', .045, 340); setTimeout(() => tone(470, .12, 'square', .035, -120), 80);
        float(h.x + h.w / 2, terrainY(h.x) - 30, 'SQUEAK!', '#ffd28a');
        hazNotice('squeak', 'Creaky floorboard! Sneak across to keep it quiet.', '#ffd28a');
        if (t < 3) continue;
        for (const m of mood) {
          if (m.dead || m.sky || Math.abs(m.x - cat.x) > 8 * T) continue;
          if (m.type === 'N' && m.state === 'wander') panic(m, cat.x - m.x);
          else if (m.type === 'S' && (m.state === 'walk' || m.state === 'look' || m.state === 'turn')) { m.state = 'hide'; m.st = 2.2; float(m.x, m.y - 40, 'Shy jumped at the squeak!', '#ff9ccb'); startles++; }
        }
      } else if (h.kind === 'sprinkler') {
        const ph = hazPhase(h, 6.5, 3.8, 1);
        if (ph === 'warn' && h.phase !== 'warn' && Math.abs(cat.x - h.x) < VW * .6) tone(300, .06, 'square', .02);
        h.phase = ph;
        if (ph !== 'on') { h.splashShown = false; continue; }
        if (Math.random() < dt * 40) for (const s of [-1, 1]) parts.push({ x: h.x, y: terrainY(h.x) - 18, vx: s * (120 + Math.random() * 160), vy: -260 - Math.random() * 120, life: .8, max: .8, c: 'rgba(160,220,255,.75)', r: 2 + Math.random() * 2, g: 600 });
        const dx = cat.x - h.x;
        if (Math.abs(dx) < 120 && cat.y > terrainY(h.x) - 150) {
          const dir = Math.sign(dx) || -cat.face;
          if (cat.pounce <= 0) cat.vx = dir * Math.max(Math.abs(cat.vx) * .3, 300);
          if (!h.splashShown) { h.splashShown = true; float(cat.x, cat.y - 76, 'Splash!', '#9fd7ff'); sfx('ui', 'land'); }
          hazNotice('sprinkler', 'Sprinkler! Wait for it to stop, then run past.', '#9fd7ff');
        }
      } else if (h.kind === 'lantern') {
        // one lantern at a time: wobble + growing shadow (warn), drop, then it glows on the ground
        if (h.phase === 'idle') {
          h.tt -= dt;
          if (h.tt <= 0 && cat.x > h.x - 160 && cat.x < h.x + h.w + 160) {
            h.phase = 'warn'; h.tt = 1.1; h.lx = clamp(cat.x + cat.vx * .55, h.x + 12, h.x + h.w - 12);
            tone(880, .05, 'sine', .02); hazNotice('lantern', 'A lantern is wobbling! Watch for its shadow.', '#ffc887');
          }
        } else if (h.phase === 'warn') { h.tt -= dt; if (h.tt <= 0) { h.phase = 'fall'; h.ly = terrainY(h.lx) - 102; h.lvy = 0; } }
        else if (h.phase === 'fall') {
          h.lvy += 2000 * dt; h.ly += h.lvy * dt;
          const gy = terrainY(h.lx) - 8;
          if (h.ly >= gy) {
            h.ly = gy; h.phase = 'lit'; h.tt = 2.2; burst(h.lx, gy, '#ffc887', 14); tone(150, .2, 'triangle', .05, -50);
            if (Math.abs(cat.x - h.lx) < 34 && cat.y > gy - 70) knockCat(Math.sign(cat.x - h.lx) || -cat.face, 'Bonk!');
          }
        } else if (h.phase === 'lit') { h.tt -= dt; if (h.tt <= 0) { h.phase = 'idle'; h.tt = 2.6 + Math.random() * 2.2; } }
      } else if (h.kind === 'slick') {
        if (cat.on && cat.x >= h.a && cat.x <= h.b && Math.abs(cat.vx) > 120) {
          hazNotice('slick', 'Wet mossy stones! Shwe slides, so slow down early.', '#9fe8ff');
          if (Math.random() < dt * 14) parts.push({ x: cat.x - Math.sign(cat.vx) * 14, y: cat.y - 2, vx: -cat.vx * .2, vy: -60 - Math.random() * 50, life: .45, max: .45, c: 'rgba(160,225,240,.8)', r: 1.6 + Math.random() * 1.6, g: 500 });
        }
      } else if (h.kind === 'wind') {
        const ph = hazPhase(h, 8, 4.4, 1.1); h.phase = ph;
        const near = cat.x > h.a - 300 && cat.x < h.b + 300;
        if (ph !== 'idle' && near && Math.random() < dt * (ph === 'on' ? 26 : 8)) {
          const sx = h.dir > 0 ? camX - 10 : camX + VW + 10;
          parts.push({ x: sx, y: 220 + Math.random() * 240, vx: h.dir * (ph === 'on' ? 520 : 200) + Math.random() * 60, vy: (Math.random() - .5) * 40, life: 2.4, max: 2.4, c: Math.random() < .5 ? 'rgba(131,173,112,.8)' : 'rgba(210,168,95,.8)', r: 2.5 + Math.random() * 2, g: 10 });
        }
        if (ph === 'on' && cat.x > h.a && cat.x < h.b) {
          cat.x = clamp(cat.x + h.dir * (cat.on ? 75 : 150) * dt, 30, WORLD - 30);
          hazNotice('wind', h.dir < 0 ? 'A gust of wind! Hold on, it pushes you back.' : 'A tail wind! It blows you forward.', '#cfe6c4');
        }
      }
    }
    for (const k of keepsakes) {
      k.got = Math.max(0, k.got - dt);
      if (k.found) continue;
      if (Math.abs(cat.x - k.x) < 34 && Math.abs(cat.y - 28 - k.y) < 48) { k.found = true; k.got = 1; collectKeepsake(k.id, k.x, k.y); }
    }
    // Buried: one nudge if it has not been dug up after a while
    if (!buriedHintShown && need.B && !got.B && t > 40 && mood.some(m => m.type === 'B' && m.state === 'buried')) {
      buriedHintShown = true; announce('Listen: the chime gets faster near the buried feeling. Night Eyes show the spot.', '#c0b1ff', 3.4);
    }
  }
  function drawHazards() {
    const x0 = camX - 60, x1 = camX + VW + 60;
    ctx.save();
    for (const p of activePlats) {
      if (p.type !== 'sinking' || !p.active || p[0] + p[2] < x0 || p[0] > x1) continue;
      const cx = p[0] + p[2] / 2, y = p[1] + 4, rx = p[2] / 2 + 6, sunk = Math.min(1, (p.sinkT || 0) / SINK_TIME);
      ctx.strokeStyle = `rgba(170,232,244,${.25 + .35 * sunk})`; ctx.lineWidth = 1.4;
      for (let k = 0; k < 2; k++) { const r = ((t * .8 + k * .5) % 1); ctx.globalAlpha = 1 - r; ctx.beginPath(); ctx.ellipse(cx, y + 6, rx + r * 20, 5 + r * 4, 0, 0, 7); ctx.stroke(); }
      ctx.globalAlpha = 1;
      const g = ctx.createLinearGradient(0, y - 6, 0, y + 8); g.addColorStop(0, sunk > .6 ? '#5f9d7a' : '#73c08b'); g.addColorStop(1, '#2f6b55');
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(cx, y, rx, 9, 0, .25, Math.PI * 2 - .05); ctx.lineTo(cx, y); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(30,70,55,.8)'; ctx.lineWidth = 1; for (const a of [-.9, -.3, .4, 1, 2.2, 2.9]) { ctx.beginPath(); ctx.moveTo(cx, y); ctx.lineTo(cx + Math.cos(a) * rx * .8, y + Math.sin(a) * 7); ctx.stroke(); }
      if (sunk > .05) { ctx.fillStyle = 'rgba(200,240,255,.7)'; for (let k = 0; k < 3; k++) { const bt = (t * 1.6 + k / 3) % 1; ctx.beginPath(); ctx.arc(cx - rx * .6 + k * rx * .6, y + 4 - bt * 16, 1.5 + bt, 0, 7); ctx.fill(); } }
    }
    for (const h of hazards) {
      if (h.kind === 'squeak') {
        if (h.x + h.w < x0 || h.x > x1) continue;
        const y = terrainY(h.x), wob = h.squeakT > 0 ? Math.sin(t * 60) * 2 * (h.squeakT / .5) : 0;
        ctx.fillStyle = '#6b4a35'; ctx.fillRect(h.x, y - 3 + wob, h.w, 5);
        ctx.fillStyle = '#8a6448'; ctx.fillRect(h.x + 2, y - 4 + wob, h.w - 4, 2);
        ctx.strokeStyle = 'rgba(30,18,12,.7)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(h.x + h.w * .3, y - 3 + wob); ctx.lineTo(h.x + h.w * .38, y + 2 + wob); ctx.lineTo(h.x + h.w * .45, y - 1 + wob); ctx.stroke();
        ctx.fillStyle = '#cfb79a'; for (const nx of [6, h.w - 6]) { ctx.beginPath(); ctx.arc(h.x + nx, y - 2 + wob, 1.4, 0, 7); ctx.fill(); }
        if (h.squeakT > 0) { ctx.strokeStyle = `rgba(255,210,138,${h.squeakT * 1.6})`; ctx.lineWidth = 2; for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(h.x + h.w / 2 + s * 30, y - 16, 8, s > 0 ? -1 : 2.1, s > 0 ? 1 : 4.2); ctx.stroke(); } }
      } else if (h.kind === 'sprinkler') {
        if (h.x < x0 - 140 || h.x > x1 + 140) continue;
        const y = terrainY(h.x);
        ctx.fillStyle = '#5c6670'; ctx.fillRect(h.x - 4, y - 18, 8, 18); ctx.fillStyle = '#9aa7b2'; ctx.beginPath(); ctx.ellipse(h.x, y - 19, 8, 4, 0, 0, 7); ctx.fill();
        ctx.fillStyle = '#3d474f'; ctx.beginPath(); ctx.ellipse(h.x, y, 12, 3, 0, 0, 7); ctx.fill();
        if (h.phase === 'warn') { ctx.fillStyle = 'rgba(160,220,255,.8)'; for (let k = 0; k < 3; k++) { const q = (t * 3 + k / 3) % 1; ctx.beginPath(); ctx.arc(h.x + (k - 1) * 6, y - 22 - q * 10, 1.8, 0, 7); ctx.fill(); } }
        if (h.phase === 'on') { const g = ctx.createRadialGradient(h.x, y - 20, 4, h.x, y - 40, 130); g.addColorStop(0, 'rgba(160,220,255,.28)'); g.addColorStop(1, 'rgba(160,220,255,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(h.x, y - 50, 125, 95, 0, Math.PI, Math.PI * 2); ctx.fill(); }
      } else if (h.kind === 'lantern') {
        if (h.phase === 'idle' || h.lx == null || h.lx < x0 || h.lx > x1) continue;
        const gy = terrainY(h.lx);
        if (h.phase === 'warn' || h.phase === 'fall') {
          const k = h.phase === 'warn' ? 1 - h.tt / 1.1 : 1;
          ctx.fillStyle = `rgba(255,120,90,${.18 + .3 * k})`; ctx.beginPath(); ctx.ellipse(h.lx, gy - 2, 10 + 22 * k, 4 + 3 * k, 0, 0, 7); ctx.fill();
        }
        const ly = h.phase === 'warn' ? gy - 102 + Math.sin(t * 22) * 2 : h.ly, rot = h.phase === 'warn' ? Math.sin(t * 18) * .25 : h.phase === 'fall' ? .15 : .9;
        ctx.save(); ctx.translate(h.lx, ly); ctx.rotate(rot);
        const glowA = h.phase === 'lit' ? Math.min(1, h.tt) : 1, gg = ctx.createRadialGradient(0, 6, 2, 0, 6, 34); gg.addColorStop(0, `rgba(255,200,120,${.45 * glowA})`); gg.addColorStop(1, 'rgba(255,200,120,0)');
        ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(0, 6, 34, 0, 7); ctx.fill();
        ctx.fillStyle = '#ff8f6b'; ctx.beginPath(); ctx.roundRect(-8, -2, 16, 18, 5); ctx.fill(); ctx.fillStyle = '#ffd38a'; ctx.fillRect(-8, 5, 16, 3); ctx.fillStyle = '#7a3d33'; ctx.fillRect(-5, -5, 10, 4); ctx.fillRect(-5, 15, 10, 3);
        ctx.restore();
      } else if (h.kind === 'slick') {
        if (h.b < x0 || h.a > x1) continue;
        for (let x = Math.max(h.a, Math.floor(x0 / 22) * 22); x < Math.min(h.b, x1); x += 22) {
          const r = Math.abs(Math.sin(x * 12.9898) * 43758.5453) % 1, y = terrainY(x + 11);
          ctx.fillStyle = 'rgba(120,200,230,.28)'; ctx.beginPath(); ctx.ellipse(x + 11, y + 1, 15, 3, 0, 0, 7); ctx.fill(); ctx.fillStyle = r > .5 ? '#5b8f86' : '#6f9e8a'; ctx.beginPath(); ctx.ellipse(x + 11, y, 10 + r * 3, 6 + r * 2, 0, Math.PI, Math.PI * 2); ctx.fill(); ctx.fillStyle = 'rgba(70,140,80,.9)'; ctx.beginPath(); ctx.ellipse(x + 13, y - 5 - r * 2, 6, 2, .1, Math.PI, Math.PI * 2); ctx.fill();
          ctx.fillStyle = `rgba(210,245,255,${.55 + .35 * Math.sin(t * 2 + x)})`; ctx.beginPath(); ctx.ellipse(x + 7, y - 4 - r * 1.5, 3.5, 1.4, -.2, 0, 7); ctx.fill();
        }
      } else if (h.kind === 'wind') {
        if (h.phase !== 'on' || h.b < x0 || h.a > x1) continue;
        ctx.strokeStyle = 'rgba(220,235,255,.22)'; ctx.lineWidth = 2; ctx.lineCap = 'round';
        for (let k = 0; k < 7; k++) { const yy = 250 + k * 34, sx = h.a + (((t * 520 * h.dir + k * 211) % (h.b - h.a)) + (h.b - h.a)) % (h.b - h.a); ctx.beginPath(); ctx.moveTo(sx, yy); ctx.quadraticCurveTo(sx + h.dir * 40, yy - 8, sx + h.dir * 80, yy); ctx.stroke(); }
      }
    }
    // keepsakes: hidden until Shwe is close (or Night Eyes are open)
    const [kname, kc] = KEEPSAKE_ART[currentMapKey()] || KEEPSAKE_ART.free;
    for (const k of keepsakes) {
      if (k.x < x0 || k.x > x1) continue;
      if (k.found && k.got <= 0) continue;
      const d = Math.hypot(cat.x - k.x, cat.y - 28 - k.y), eyes = eyesT > 0 && Math.abs(cat.x - k.x) <= uv('eyes') * T;
      const a = k.found ? k.got : eyes ? 1 : clamp(1 - (d - 2.5 * T) / (2 * T), 0, 1) * .9;
      if (a <= .02) { if (Math.sin(t * 2.3 + k.bob) > .985) { ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.arc(k.x, k.y, 1.6, 0, 7); ctx.fill(); } continue; }
      const y = k.y + Math.sin(t * 2.4 + k.bob) * 3 - (k.found ? (1 - k.got) * 30 : 0);
      ctx.globalAlpha = a; ctx.drawImage(glowImg(kc), k.x - 30, y - 30, 60, 60);
      drawKeepsake(currentMapKey(), k.x, y, kc);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }
  function drawKeepsake(map, x, y, c) {
    ctx.save(); ctx.translate(x, y); ctx.lineJoin = 'round';
    if (map === 'park') { const g = ctx.createRadialGradient(-3, -3, 1, 0, 0, 9); g.addColorStop(0, '#fff'); g.addColorStop(.35, c); g.addColorStop(1, '#3d6fb0'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 8, 0, 7); ctx.fill(); ctx.strokeStyle = '#ffb4d3'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 4.5, .5, 2.6); ctx.stroke(); }
    else if (map === 'festival') { ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(0, 9); ctx.bezierCurveTo(-12, 0, -8, -10, 0, -4); ctx.bezierCurveTo(8, -10, 12, 0, 0, 9); ctx.fill(); ctx.strokeStyle = '#c23d5a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(0, -12); ctx.stroke(); ctx.fillStyle = '#ffd38a'; ctx.beginPath(); ctx.arc(0, -13, 2.2, 0, 7); ctx.fill(); }
    else if (map === 'hill') { ctx.fillStyle = '#b97a45'; ctx.beginPath(); ctx.ellipse(0, 3, 6.5, 8, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#6e4a2c'; ctx.beginPath(); ctx.ellipse(0, -4, 8, 4.5, 0, Math.PI, Math.PI * 2); ctx.fill(); ctx.fillRect(-1, -11, 2, 4); ctx.fillStyle = 'rgba(255,240,210,.6)'; ctx.beginPath(); ctx.ellipse(-2.5, 2, 1.6, 3, 0, 0, 7); ctx.fill(); }
    else if (map === 'rooftop') { ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(-6,-4);ctx.quadraticCurveTo(-6,-10,0,-10);ctx.quadraticCurveTo(6,-10,6,-4);ctx.lineTo(8,5);ctx.lineTo(-8,5);ctx.closePath();ctx.fill();ctx.fillStyle='#856875';ctx.fillRect(-9,4,18,2);ctx.beginPath();ctx.arc(0,8,2,0,7);ctx.fill(); }
    else if (map === 'lake') { ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(0, 8); ctx.lineTo(-10, -3); ctx.quadraticCurveTo(0, -12, 10, -3); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#d39b7a'; ctx.lineWidth = 1.2; for (const a of [-.9, -.45, 0, .45, .9]) { ctx.beginPath(); ctx.moveTo(0, 7); ctx.lineTo(Math.sin(a) * 9, -6 + Math.abs(a) * 3); ctx.stroke(); } }
    else { ctx.fillStyle = c; ctx.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 4.2 : 10, a = -Math.PI / 2 + i * Math.PI / 5; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(160,120,60,.7)'; ctx.lineWidth = 1; ctx.stroke(); }
    ctx.restore();
  }
  // ---------- Night trinkets and Shwe's pouch ----------
  // Little things to sell. A few turn up in every run (not just once, unlike Thiri's keepsakes).
  // They reach the pouch only when the night ends well; a failed night drops them.
  // The pouch holds 12; trinkets are sold for Glow at the Treat box (shop, Pouch tab).
  const TRINKETS = {
    button: { name: 'Lost button', glow: 5, c: '#c9a2ff', w: 20 },
    pebble: { name: 'Shiny pebble', glow: 5, c: '#bcd3e6', w: 20 },
    feather: { name: 'Soft feather', glow: 6, c: '#f4efff', w: 20 },
    cap: { name: 'Bottle cap', glow: 10, c: '#ff8f6b', w: 15 },
    ribbon: { name: 'Ribbon scrap', glow: 12, c: '#ff9ab8', w: 15 },
    goldbutton: { name: 'Golden button', glow: 30, c: '#ffd25a', w: 10 }
  };
  const POUCH_SIZE = 12;
  let pouch = (() => { try { const a = JSON.parse(localStorage.getItem('mk-pouch') || '[]'); return Array.isArray(a) ? a.filter(k => TRINKETS[k]).slice(0, POUCH_SIZE) : []; } catch (e) { return []; } })();
  function savePouch() { try { localStorage.setItem('mk-pouch', JSON.stringify(pouch)); } catch (e) {} }
  let trinkets = [], trinketRun = [], trinketIds = [], lastTrinkets = null, pouchFullAt = -9;
  function pickTrinket(rare, rnd = Math.random) {
    if (rare) return 'goldbutton';
    const keys = Object.keys(TRINKETS), total = keys.reduce((n, k) => n + TRINKETS[k].w, 0);
    let r = rnd() * total;
    for (const k of keys) { r -= TRINKETS[k].w; if (r <= 0) return k; }
    return 'button';
  }
  // Story trinkets sit in the same places every time you play a night, and once one is safely
  // in the pouch it is gone from that night for good. Free mode still scatters new ones each run.
  let foundTrinkets = (() => { try { return new Set(JSON.parse(localStorage.getItem('mk-trinkets-found') || '[]')); } catch (e) { return new Set(); } })();
  function saveFoundTrinkets() { try { localStorage.setItem('mk-trinkets-found', JSON.stringify([...foundTrinkets])); } catch (e) {} }
  function seededRnd(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let r = Math.imul(a ^ (a >>> 15), 1 | a); r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r; return ((r ^ (r >>> 14)) >>> 0) / 4294967296; }; }
  function initTrinkets() {
    trinkets = []; trinketRun = []; trinketIds = []; pouchFullTold = false;
    if (mode === 'free') return;
    const story = mode === 'story', rnd = story ? seededRnd(storyNight * 7919 + 17) : Math.random;
    const n = mode === 'free' ? 4 : 5, xs = [];
    const plats = activePlats.filter(p => p.type !== 'crumbling' && p.type !== 'moving' && p[2] >= 60);
    for (let i = 0; i < n; i++) {
      const onPlat = plats.length > 0 && i % 2 === 1;   // every other one sits up on a ledge, a little harder to reach
      let x, y;
      if (onPlat) { const p = plats[Math.floor(rnd() * plats.length)]; x = p[0] + 20 + rnd() * (p[2] - 40); y = p[1] - 26; }
      else { x = safeLevelX(300 + (WORLD - 600) * ((i + .3 + rnd() * .4) / n)); y = terrainY(x) - 26; }
      if (xs.some(v => Math.abs(v - x) < 140) || keepsakes.some(k => Math.abs(k.x - x) < 120)) continue;
      xs.push(x);
      const type = pickTrinket(onPlat && rnd() < .35, rnd), id = story ? `n${storyNight}-t${i}` : null, gone = !!id && foundTrinkets.has(id);
      trinkets.push({ x, y, type, id, bob: rnd() * 6, got: 0, taken: gone, gone });
    }
  }
  function pouchFull() { return pouch.length + trinketRun.length >= POUCH_SIZE; }
  let pouchFullTold = false;
  function updTrinkets(dt) {
    if (pouchFull() && !pouchFullTold && trinkets.some(k => !k.taken)) { pouchFullTold = true; announce('Shwe\u2019s pouch is full. Sell trinkets at the Treat box to find more.', '#ffb3c0', 2.6); }
    for (const k of trinkets) {
      k.got = Math.max(0, k.got - dt);
      if (k.taken || Math.abs(cat.x - k.x) >= 34 || Math.abs(cat.y - 28 - k.y) >= 48) continue;
      if (pouchFull()) continue;
      const info = TRINKETS[k.type];
      k.taken = true; k.got = 1; trinketRun.push(k.type); if (k.id) (trinketIds || (trinketIds = [])).push(k.id);
      burst(k.x, k.y, info.c, k.type === 'goldbutton' ? 22 : 12);
      tone(k.type === 'goldbutton' ? 1175 : 880, .12, 'sine', .04);
      float(k.x, k.y - 40, `${info.name} · pouch ${pouch.length + trinketRun.length}/${POUCH_SIZE}`, info.c);
    }
  }
  function drawTrinket(type, x, y, g = ctx) {
    g.save(); g.translate(x, y); g.lineJoin = 'round';
    g.strokeStyle = 'rgba(43,37,71,.85)'; g.lineWidth = 1.5; g.fillStyle = TRINKETS[type].c;
    if (type === 'button' || type === 'goldbutton') {
      g.beginPath(); g.arc(0, 0, 8, 0, 7); g.fill(); g.stroke();
      g.fillStyle = 'rgba(43,37,71,.75)';
      for (const [a, b] of [[-2.5, -2.5], [2.5, -2.5], [-2.5, 2.5], [2.5, 2.5]]) { g.beginPath(); g.arc(a, b, 1.3, 0, 7); g.fill(); }
    } else if (type === 'pebble') {
      g.beginPath(); g.ellipse(0, 0, 9, 6.5, -.3, 0, 7); g.fill(); g.stroke();
      g.fillStyle = 'rgba(255,255,255,.85)'; g.beginPath(); g.ellipse(-3, -2, 2.5, 1.4, -.3, 0, 7); g.fill();
    } else if (type === 'feather') {
      g.rotate(-.6); g.beginPath(); g.ellipse(0, 0, 4.5, 11, 0, 0, 7); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(0, -11); g.lineTo(0, 13); g.stroke();
    } else if (type === 'cap') {
      g.beginPath(); for (let i = 0; i < 16; i++) { const r = i % 2 ? 7 : 8.6, a = i * Math.PI / 8; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); g.fill(); g.stroke();
      g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.arc(0, 0, 4, 0, 7); g.fill();
    } else {
      g.beginPath(); g.moveTo(-10, -4); g.quadraticCurveTo(0, -9, 10, -4); g.lineTo(8, 4); g.quadraticCurveTo(0, 0, -8, 4); g.closePath(); g.fill(); g.stroke();
    }
    g.restore();
  }
  function drawTrinkets() {
    const x0 = camX - 60, x1 = camX + VW + 60;
    for (const k of trinkets) {
      // a full pouch hides the trinkets that are left: they stay for a later night once there is room
      if (k.x < x0 || k.x > x1 || (k.taken && k.got <= 0) || (!k.taken && pouchFull())) continue;
      const y = k.y + Math.sin(t * 2.6 + k.bob) * 2.5 - (k.taken ? (1 - k.got) * 30 : 0);
      ctx.globalAlpha = k.taken ? k.got : 1;
      if (k.type === 'goldbutton') ctx.drawImage(glowImg(TRINKETS.goldbutton.c), k.x - 26, y - 26, 52, 52);
      else if (Math.sin(t * 3 + k.bob) > .9) { ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.beginPath(); ctx.arc(k.x + 7, y - 7, 1.8, 0, 7); ctx.fill(); }
      drawTrinket(k.type, k.x, y);
      ctx.globalAlpha = 1;
    }
  }
  function drawTrinketIcon(cv) {
    const g = cv.getContext('2d'); g.clearRect(0, 0, cv.width, cv.height);
    g.save(); g.scale(cv.width / 28, cv.height / 28); drawTrinket(cv.dataset.t, 14, 14, g); g.restore();
  }
  // ---------- Thiri's shelf: every keepsake found goes back on her shelf ----------
  const SHELF_BONUS = 100;
  let shelfClaimed = (() => { try { return new Set(JSON.parse(localStorage.getItem('mk-shelf-claimed') || '[]')); } catch (e) { return new Set(); } })();
  function keepsakeIds(night) {
    const L = window.TC_LEVELS?.[night]; if (!L) return [];
    const ids = (L.keepsakes || []).map((_, i) => `n${night}-${i}`);
    if (!(chapterFor(night)?.feelingsNeeded?.B)) ids.push(`n${night}-dig`);
    return ids;
  }
  function shelfTotals() {
    let have = 0, all = 0;
    for (let n = 1; n <= 7; n++) { const ids = keepsakeIds(n); all += ids.length; have += ids.filter(id => foundKeeps.has(id)).length; }
    return { have, all };
  }
  function drawKeepIcon(cv) {
    const main = ctx; ctx = cv.getContext('2d');
    try { ctx.clearRect(0, 0, cv.width, cv.height); ctx.save(); ctx.scale(cv.width / 30, cv.height / 30); drawKeepsake(cv.dataset.map, 15, 15, cv.dataset.c); ctx.restore(); } finally { ctx = main; }
  }
  function renderShelf() {
    const rows = [];
    for (let n = 1; n <= 7; n++) {
      const ids = keepsakeIds(n); if (!ids.length) continue;
      const map = window.TC_LEVELS[n]?.map || 'free', [name, c] = KEEPSAKE_ART[map] || KEEPSAKE_ART.free;
      const have = ids.filter(id => foundKeeps.has(id)).length, done = have === ids.length, claimed = shelfClaimed.has(`n${n}`);
      const side = done ? (claimed ? '<button class="buy" disabled>Set complete ✓</button>' : `<button class="buy" data-shelf="${n}">Claim +${SHELF_BONUS} Glow</button>`) : `<span class="shelf-count">${have} / ${ids.length}</span>`;
      const icons = ids.map(id => `<canvas class="keep-ico${foundKeeps.has(id) ? '' : ' missing'}" data-map="${map}" data-c="${c}" width="48" height="48" aria-hidden="true"></canvas>`).join('');
      rows.push(`<div class="item shelf-row${done ? ' done' : ''}"><h3>${hourOf(n)} · ${chapterFor(n).name}</h3><div class="side">${side}</div><p class="shelf-icons">${icons}</p><p>${name[0].toUpperCase() + name.slice(1)}s · ${have} of ${ids.length} found${done ? '' : '. Look closer, or open Night Eyes.'}</p></div>`);
    }
    let eh = 0, ea = 0;
    for (let n = 8; n <= 50; n++) { const ids = keepsakeIds(n); ea += ids.length; eh += ids.filter(id => foundKeeps.has(id)).length; }
    if (ea) rows.push(`<div class="item shelf-row"><h3>Endless Nights</h3><div class="side"><span class="shelf-count">${eh} / ${ea}</span></div><p>Keepsakes found on the Endless routes.</p></div>`);
    $('#shelfList').innerHTML = rows.join('');
    document.querySelectorAll('#shelfList canvas.keep-ico').forEach(drawKeepIcon);
  }
  function openShelf() {
    music('play', 'menu'); music('ambience', 'menu');
    $('#startScreen').hidden = true; renderShelf(); $('#shelfScreen').hidden = false; $('#shelfScreen').scrollTop = 0; $('#shelfBack').focus({ preventScroll: true });
  }

  const BURY_SPOTS = {
    school: { kind: 'school supplies', label: 'book pile', labelMarked: 'marked book pile', labels: ['book pile', 'school bag', 'lost-and-found box'], xs: [100, 550, 850, 1200, 1770, 2630, 3000, 3440, 3720], draw: drawSchoolBurySpot, debris: [{ shape: 'paper', color: '#f4dce8' }, { shape: 'paper', color: '#fff0bd' }, { shape: 'paper', color: '#b8c9eb' }], glow: '#a8dfff' },
    rooftop: { kind: 'roof finds', label: 'loose tiles', labelMarked: 'marked loose tiles', labels: ['loose tiles', 'folded cloth', 'roof basket'], xs: [], draw: drawRoofBurySpot, debris: [{ shape: 'chip', color: '#b59a92' }, { shape: 'paper', color: '#c9c3d4' }, { shape: 'straw', color: '#b69c79' }], glow: '#f3d9ac' },
    park: { kind: 'park groundcover', label: 'leaf pile', labelMarked: 'marked leaf pile', labels: ['leaf pile', 'sand mound', 'flower-bed mound'], xs: [100, 550, 850, 1140, 1800, 2630, 3000, 3440, 3740], draw: drawParkBurySpot, debris: [{ shape: 'leaf', color: '#86bd77' }, { shape: 'petal', color: '#ffb4d3' }, { shape: 'leaf', color: '#d2a85f' }], glow: '#9bf0c5' },
    festival: { kind: 'festival goods', label: 'bamboo basket', labelMarked: 'marked bamboo basket', labels: ['bamboo basket', 'clay pots', 'folded mat'], xs: [150, 600, 810, 1200, 1700, 2600, 3000, 3500, 4150], draw: drawFestivalBurySpot, debris: [{ shape: 'straw', color: '#d9b66f' }, { shape: 'spark', color: '#ffd58a' }, { shape: 'straw', color: '#b88952' }], glow: '#ffc887' },
    hill: { kind: 'hilltop finds', label: 'mossy stones', labelMarked: 'marked mossy stones', labels: ['mossy stones', 'fallen branch', 'leaf pile'], xs: [80, 350, 450, 550, 800, 910, 1020, 1130], draw: drawHillBurySpot, debris: [{ shape: 'moss', color: '#77a77c' }, { shape: 'twig', color: '#9b7659' }, { shape: 'leaf', color: '#83ad70' }], glow: '#c0b1ff' },
    lake: { kind: 'lakeshore finds', label: 'sand mound', labelMarked: 'marked sand mound', labels: ['sand mound', 'driftwood', 'pebble stack'], xs: [100, 650, 1200, 1800, 2220, 2630, 3000, 3600, 4150], draw: drawLakeBurySpot, debris: [{ shape: 'sand', color: '#e8c58a' }, { shape: 'splash', color: '#9cdaee' }, { shape: 'shell', color: '#ffe2c5' }], glow: '#9fe8ff' },
    free: { kind: 'classic stones', label: 'rock', labelMarked: 'marked rock', xs: [], draw: drawClassicRockBase, debris: [{ shape: 'chip', color: '#77736f' }, { shape: 'chip', color: '#a29b8d' }, { shape: 'chip', color: '#5f6260' }], glow: '#c8baff' }
  };

  function newCat() { const x = currentLevel.catStart ?? 200; return { x, y: terrainY(x), vx: 0, vy: 0, on: true, face: 1, pounce: 0, pcd: 0, inv: 0, squash: 0, walk: 0, sneak: false, justLanded: false, bounced: false, platform: null, coyote: 0, jumpBuffer: 0, fallTime: 0, fallFromX: x, falling: false, respawning: false, swinging: null, alpha: 1 }; }
  function pickX() { let x, n = 0; do { x = levelSpawnX(); n++; } while ((Math.abs(x - cat.x) < 380 || (mode === 'story' && rocks.some(spot => Math.abs(x - spot.x) < 100))) && n < 40); return x; }
  function pickCaveX() {
    const occupied = new Set(mood.filter(m => !m.dead && m.caveX != null).map(m => m.caveX));
    const caveXs = currentLevel.hideSpots || [];
    const open = caveXs.filter(x => !occupied.has(x));
    const distant = open.filter(x => Math.abs(x - cat.x) > 220);
    const pool = distant.length ? distant : open.length ? open : caveXs;
    return pool[Math.floor(Math.random() * pool.length)];
  }
  function makeScratchSpot(x, type) {
    const caveCalm = mode === 'story' && storyNight >= 6 && type === 'C';
    const variants = caveCalm ? ['cracked rock', 'loose dirt', 'under bush'] : ['loose dirt', 'cracked rock', 'leaf pile', 'under bush'];
    const spot = { x, y: terrainY(x), kind: variants[Math.floor(Math.random() * variants.length)], moodType: type, used: false, usedAt: 0, scratching: false, phase: Math.random() * Math.PI * 2 };
    scratchSpots.push(spot);
    return spot;
  }
  function hideFeeling(m, x) {
    if (m.spot) { m.spot.used = true; m.spot.usedAt = t; m.spot.scratching = false; }
    const inCave = mode === 'story' && ((m.type === 'C' && storyNight >= 6) || (m.type === 'L' && storyNight >= 7));
    m.x = x ?? (inCave ? pickCaveX() : pickX()); m.caveX = inCave ? m.x : null;
    m.y = terrainY(m.x) - (m.type === 'C' ? 46 : 30); m.st = 0; m.sit = 0; m.rev = 0; m.fleeAlarm = 0;
    const tutorialLonely = m.type === 'L' && mode === 'story' && storyNight <= 3;
    m.alpha = tutorialLonely ? 1 : 0; m.state = tutorialLonely ? 'revealed' : 'hide';
    m.spot = tutorialLonely ? null : makeScratchSpot(m.x, m.type);
  }
  function flySpotNear(x) {
    let fx, n = 0;
    do { fx = safeLevelX(clamp(x + (Math.random() < .5 ? -1 : 1) * (200 + Math.random() * 480), 120, WORLD - 120)); n++; }
    while (n < 24 && (Math.abs(fx - cat.x) < 170 || fireflies.some(f => f.state === 'free' && Math.abs(f.hx - fx) < 110)));
    return fx;
  }
  function addFireflies(m) {
    for (let i = 0; i < FLY_NEED; i++) {
      const fx = flySpotNear(m.x);
      fireflies.push({ x: fx, y: terrainY(fx) - 46, hx: fx, hy: terrainY(fx) - 34 - Math.random() * 30, ox: m.x, state: 'free', phase: Math.random() * 7, st: 0, fast: 0, calm: null, dead: false });
    }
  }
  const carriedFlies = () => fireflies.filter(f => f.state === 'follow');
  function scatterFly(f, fromCat) {
    if (!fromCat && activeItems.jar) { activeItems.jar = false; burst(cat.x - cat.face * 8, cat.y - 50, '#e8ff8a', 10); f.state = 'follow'; float(f.x, f.y - 26, '🫙 The jar caught it!', '#e8ff8a'); tone(1046, .14, 'sine', .045); return; }
    const fx = flySpotNear(f.ox);
    f.state = 'free'; f.hx = fx; f.hy = terrainY(fx) - 34 - Math.random() * 30; f.fast = 1.4;
    for (let k = 0; k < 6; k++) parts.push({ x: f.x, y: f.y, vx: (Math.random() - .5) * 120, vy: (Math.random() - .5) * 120, life: .5, max: .5, c: '#e8ff8a', r: 2, g: 0 });
    if (!fromCat && t - flyMsgAt > 1.2) {
      flyMsgAt = t; float(f.x, f.y - 26, 'Too fast! The firefly flew off', '#e8ff8a');
      if (!flyHintShown) { flyHintShown = true; announce('Walk slowly to gather fireflies (hold Shift)', CALM, 2.6); }
    }
    tone(1400, .08, 'sine', .03, -500);
  }
  // Breathing Calm (rare): its bubble grows for 2 s (hold S = breathe in) and shrinks for 2 s (let go = breathe out).
  const BREATH = 4, BREATHS_NEED = 3;
  let breathTipShown = false;
  function resetBreath(m) { m.breaths = 0; m.watch = false; m.inHeld = 0; m.outFree = 0; m.tried = false; m.wasHeld = false; }
  const breathSize = p => { const u = p < .5 ? p * 2 : 1 - (p - .5) * 2; return u * u * (3 - 2 * u); };
  const nearBreath = m => cat.on && Math.abs(cat.x - m.x) < 2.2 * T && Math.abs(cat.y - terrainY(m.x)) < 60;
  function updBreath(m, dt) {
    m.y = terrainY(m.x) - 74 + Math.sin(t * 1.2 + m.phase) * 3;
    if (m.state === 'popping') { m.st -= dt; if (m.st <= 0) { m.state = 'bubble'; resetBreath(m); catchIt(m); } return; }
    const prev = m.bphase; m.bphase = (m.bphase + dt / BREATH) % 1;
    if (!breathTipShown && state === 'play' && Math.abs(cat.x - m.x) < 5 * T) {
      breathTipShown = true; announce('A rare Calm! Hold S as its bubble grows, let go as it shrinks', CALM, 3.2);
    }
    const held = !!(keys.KeyS || scratchHeld);
    if (!nearBreath(m) || cat.pounce > 0) { if (m.watch && m.breaths) float(m.x, m.y - 80, 'Stay close and breathe slowly', MUTED); if (m.watch) resetBreath(m); return; }
    if (prev > m.bphase) {   // one full breath just finished
      if (m.watch) {
        if (m.inHeld >= .6 && m.outFree >= .6) {
          m.breaths++;
          tone(523 * Math.pow(2, m.breaths * 2 / 12), .35, 'sine', .05);
          float(m.x, m.y - 84, m.breaths >= BREATHS_NEED ? 'Ahh… calm.' : `Breath ${m.breaths}/${BREATHS_NEED}`, CALM);
          if (m.breaths >= BREATHS_NEED) {
            m.state = 'popping'; m.st = .55;
            for (let k = 0; k < 18; k++) { const a = k / 18 * Math.PI * 2; parts.push({ x: m.x + Math.cos(a) * 50, y: m.y - 6 + Math.sin(a) * 50, vx: Math.cos(a) * 90, vy: Math.sin(a) * 90, life: .6, max: .6, c: '#c9fff0', r: 2.5, g: 0 }); }
            tone(988, .25, 'sine', .05); return;
          }
        } else if (m.tried) float(m.x, m.y - 84, 'Follow the bubble: in… and out', MUTED);
      }
      m.watch = true; m.inHeld = 0; m.outFree = 0; m.tried = false;
    }
    if (m.watch) {
      if (m.bphase < .5) { if (held) { m.inHeld += dt / (BREATH / 2); m.tried = true; if (!m.wasHeld) tone(392, .6, 'sine', .025, 180); } }
      else { if (!held) m.outFree += dt / (BREATH / 2); else m.tried = true; }
    }
    m.wasHeld = held;
  }
  function updFireflies(dt) {
    if (!fireflies.length) return;
    const gentle = cat.on && Math.abs(cat.vx) <= FLY_SLOW && cat.pounce <= 0;
    let k = 0;
    for (const f of fireflies) {
      f.phase += dt; f.fast = Math.max(0, f.fast - dt);
      if (f.state === 'free') {
        const rate = Math.min(1, dt * (f.fast > 0 ? 2.4 : 1.6));
        f.x += (f.hx + Math.sin(f.phase * .9) * 18 - f.x) * rate;
        f.y += (f.hy + Math.sin(f.phase * 1.7) * 8 - f.y) * rate;
        if (f.fast > 0) continue;
        const d = Math.hypot(cat.x - f.x, cat.y - 24 - f.y);
        if (d < 90 && !gentle) scatterFly(f, false);
        else if (d < 36) {
          f.state = 'follow';
          const n = carriedFlies().length;
          float(f.x, f.y - 24, n >= FLY_NEED ? 'Bring the light to Calm!' : `Firefly ${n}/${FLY_NEED}`, '#e8ff8a');
          tone(1046 + n * 160, .14, 'sine', .045);
        }
      } else if (f.state === 'follow') {
        k++;
        const tx = cat.x - cat.face * (14 + k * 20), ty = cat.y - 58 - Math.sin(t * 3 + k * 1.7) * 7;
        f.x += (tx - f.x) * Math.min(1, dt * 5); f.y += (ty - f.y) * Math.min(1, dt * 5);
      } else if (f.state === 'give') {
        f.st -= dt; const c = f.calm;
        f.x += (c.x - f.x) * Math.min(1, dt * 4); f.y += (c.y - f.y) * Math.min(1, dt * 4);
        if (f.st <= 0) f.dead = true;
      }
    }
    fireflies = fireflies.filter(f => !f.dead);
  }
  function drawFireflies() {
    for (const f of fireflies) {
      const tw = .7 + .3 * Math.sin(f.phase * 6), a = f.state === 'give' ? clamp(f.st / .4, 0, 1) : 1;
      const r = 15 * tw;
      const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, r * 1.8);
      g.addColorStop(0, `rgba(255,251,194,${.95 * a})`); g.addColorStop(.35, `rgba(232,255,138,${.6 * a})`); g.addColorStop(1, 'rgba(200,255,106,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(f.x, f.y, r * 1.8, 0, 7); ctx.fill();
      ctx.fillStyle = `rgba(255,253,224,${a})`; ctx.beginPath(); ctx.arc(f.x, f.y, 2.8, 0, 7); ctx.fill();
      if (f.state === 'free') { ctx.strokeStyle = `rgba(255,255,255,${.35 * tw})`; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(f.x - 4, f.y - 3, 4, 2, -.5, 0, 7); ctx.ellipse(f.x + 4, f.y - 3, 4, 2, .5, 0, 7); ctx.stroke(); }
    }
    const n = carriedFlies().length;
    if (n && state === 'play') {
      ctx.font = `800 14px ${DISP}`; ctx.textAlign = 'center'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(18,12,36,.8)'; ctx.fillStyle = '#e8ff8a';
      const s = `✦ ${Math.min(n, FLY_NEED)}/${FLY_NEED}`; ctx.strokeText(s, cat.x, cat.y - 88); ctx.fillText(s, cat.x, cat.y - 88);
    }
  }
  function spawn(type, x) {
    const hidesInCave = type === 'C' || (type === 'L' && moonHollow());
    x = safeLevelX(x ?? (hidesInCave ? pickCaveX() : pickX()));
    if (!hidesInCave && type !== 'B') x = safeSpawnX(x);
    const m = { type, x, y: 0, dir: Math.random() < .5 ? -1 : 1, phase: Math.random() * 6, alpha: 1, cd: 1 + Math.random(), st: 0, alarm: 0, state: '', home: x, dead: false, life: 0, caveX: hidesInCave ? x : null, sky: false, skyFeature: null, skyPhase: 'ground', skyTimer: 0, skyStartY: 0, skyTargetY: 0, skyVY: 0, skyHit: false, scratchNeed: 0, ambushWave: [], hitCooldown: 0, skyGroundStun: 0 };
    const rareChance = mode === 'story' ? chapterFor(storyNight).rareChance : .1;
    m.v = (type === 'F' || type === 'N' || type === 'L' || type === 'B') && Math.random() < rareChance ? (Math.random() < .5 ? 1 : 2) : 0;
    if (type === 'C') m.v = Math.random() < rareChance ? 1 : 0;   // rare Calm = Breathing Calm
    if (type === 'F') { m.y = terrainY(x) - 20; m.state = 'patrol'; }
    if (type === 'N') { m.y = terrainY(x) - 46; m.state = 'wander'; }
    if (type === 'G') { m.y = 200; m.state = 'fly'; m.life = 6.5; }
    if (type === 'E') { m.y = terrainY(x) - 24; m.vy = 0; m.state = 'squash'; m.st = .3; m.bounces = 0; m.apex = false; }
    if (type === 'S') { m.y = terrainY(x) - 26; m.state = 'walk'; m.st = 2 + Math.random() * 1.5; }
    if (type === 'J') { m.y = terrainY(x) - 30; m.state = 'wander'; m.cd = 3; m.stolen = []; }
    if (type === 'B') { const rock = rocks.find(r => r.marked) || rocks[0]; m.x = rock.x; m.y = rock.y - 12; m.state = 'buried'; m.alpha = 0; m.rock = rock; m.chime = 0; }
    if (type === 'C') {
      m.x = x = clamp(x + 125, 80, WORLD - 80); m.alpha = 0; m.st = 0; m.sit = 0;
      if (m.v === 1) { m.y = terrainY(x) - 74; m.state = 'bubble'; m.light = 1; resetBreath(m); m.bphase = Math.random(); }
      else { m.y = terrainY(x) - 44; m.state = 'dim'; m.light = 0; addFireflies(m); }
    }
    if (type === 'L') {
      m.y = terrainY(x) - 30; m.st = 0; m.rev = 0; m.sit = 0; m.chime = 0; m.fleeAlarm = 0;
      const tutorialLonely = type === 'L' && mode === 'story' && storyNight <= 3;
      m.state = tutorialLonely ? 'revealed' : 'hide'; m.alpha = tutorialLonely ? 1 : 0; m.spot = tutorialLonely ? null : makeScratchSpot(x, type);
    }
    if (type === 'F' && !m.sky && state === 'play' && t > frustWakeAt - .5) { m.state = 'warn'; m.st = FRUST_WARN; }
    mood.push(m); onGuidanceSpawn(m); return m;
  }
  function skyTypeFor(feature) {
    const own = chapterFor(storyNight).sky?.types?.[feature];
    const choices = own && own.length ? own : feature === 'A' ? ['N', 'L'] : feature === 'B' ? ['E', 'J'] : ['F'];
    const stillNeeded = choices.filter(type => (need[type] || 0) > (got[type] || 0));
    const pool = stillNeeded.length ? stillNeeded : choices;
    return pool[Math.floor(Math.random() * pool.length)];
  }
  function skyWaitFor(feature, chapter) {
    if (feature === 'A') return clamp(chapter.sky.wait + (Math.random() - .5) * .6, 1.2, 2.5);
    if (feature === 'B') return clamp(2 - Math.max(0, storyNight - 3) * .3, .8, 2.0);
    return Math.min(1.6, chapter.sky.wait);
  }
  function spawnSky(feature) {
    const chapter = chapterFor(storyNight);
    if (!chapter.sky || !['A', 'B', 'C'].includes(feature) || skyUsed[feature] >= chapter.sky[feature]) return null;
    const type = skyTypeFor(feature);
    const existing = mood.find(x => !x.dead && !x.sky && !x.ambush && x.type === type && (type !== 'J' || !(x.stolen || []).length));
    if (existing) {
      if (existing.spot) { existing.spot.used = true; existing.spot.usedAt = t; existing.spot.scratching = false; }
      existing.dead = true; existing.alpha = 0;
    }
    const spawnX = type === 'L' && moonHollow() ? pickCaveX() : pickX(), m = spawn(type, spawnX);
    const restOffset = { F: 20, N: 46, L: 30, E: 24, J: 30 }[type] || 24;
    m.sky = true; m.skyFeature = feature; m.skyPhase = 'wait'; m.skyTimer = 0;
    m.skyStartY = -80; m.skyTargetY = terrainY(m.x) - restOffset; m.skyVY = 0;
    m.skyHit = false; m.scratchNeed = feature === 'C' ? 1 : 0; m.ambushWave = [];
    m.hitCooldown = 0; m.skyGroundStun = 0; m.skyWait = skyWaitFor(feature, chapter);
    m.skyChimeAt = 1; m.skyEmberTimer = .04; m.skyMissed = false; m.skyReplacedNormal = !!existing; m.alpha = 1; m.y = m.skyStartY;
    skyUsed[feature]++; skySpawned++; showSkyTutorial(feature);
    return m;
  }
  function maybeSpawnSky() {
    if (mode !== 'story' || state !== 'play') return;
    const chapter = chapterFor(storyNight), config = chapter.sky;
    if (!config || skyRemaining(chapter) <= 0) return;
    const elapsed = chapter.timeLimit - timeLeft, deadline = chapter.timeLimit - 25;
    if (elapsed < skyNextAt || elapsed > deadline) return;
    const available = ['A', 'B', 'C'].filter(feature => skyUsed[feature] < config[feature]);
    if (!available.length) return;
    const feature = available[Math.floor(Math.random() * available.length)];
    if (!spawnSky(feature)) return;
    const remaining = skyRemaining(chapter);
    if (!remaining) { skyNextAt = Infinity; return; }
    const slots = deadline - elapsed, maxGap = Math.min(12, slots / remaining);
    const desiredGap = 8 + Math.random() * 4;
    skyNextAt = elapsed + (maxGap >= 8 ? clamp(desiredGap, 8, maxGap) : Math.max(.2, maxGap));
  }
  function reset() {
    currentLevel = selectLevelForRun();
    loadLevelGeometry();
    const chapter = mode === 'story' ? chapterFor(storyNight) : null;
    t = 0; warmup = mode === 'free' ? 0 : 1.5; frustWakeAt = warmup + FRUST_SLEEP; timeLeft = mode === 'free' ? 60 : chapter.timeLimit; score = 0; freeT = 0; level = 0; struggleTipShownThisRun = false;
    nextGold = 18; caughtN = 0; glowRun = 0; purrT = 0; purrCd = 0; purrQ = false; eyesT = 0; eyesCd = 0; eyesQ = false;
    combo = 0; comboT = 0; bestCombo = 1; hitstop = 0; slowmo = 0; chaos = false; endT = 0;
    freeCapShown = false; freeLightCapShown = false; activeItems = {}; perkShield = catPerk() === 'mainecoon' ? 1 : 0;
    lives = 3; checkpointX = currentLevel.catStart ?? 200; fallDimT = 0; respawnT = 0; pitTipShown = false; edgeSoundAt = 0; pendingFallFail = false; jumpHeld = false;
    need = mode === 'story' ? { ...chapter.feelingsNeeded } : { F: 4, N: 4, L: 2 };
    got = Object.fromEntries(Object.keys(need).map(type => [type, 0])); runN = 0; runNew = []; runDone = []; hits = 0; startles = 0;
    workshopRun = []; allHome = false; portal = null;
    goldDone = { a: false, b: false }; skyUsed = { A: 0, B: 0, C: 0 }; skyPerfect = chapter ? skyTotalFor(chapter) : 0; skySpawned = 0; skyNextAt = 15; lastTick = 99; cat = newCat(); mood = []; parts = []; floats = []; trail = []; hist = []; respawnQ = []; camX = 0;
    scratchSpots = []; scratchTarget = null; scratchAnim = 0; scratchQ = false; shake = 0; fireflies = []; flyMsgAt = -9; flyHintShown = false; breathTipShown = false;
    const buryStyle = BURY_SPOTS[currentMapKey()];
    rocks = (currentLevel.burySpots || []).map((x, i) => {
      const variant = i % (buryStyle.labels?.length || 1), label = buryStyle.labels?.[variant] || buryStyle.label;
      return { x, y: terrainY(x), marked: false, scratched: false, wrongUsed: false, phase: Math.random() * Math.PI * 2, holeDepth: 0, burialKind: buryStyle.kind, variant, label, labelMarked: label === buryStyle.label ? buryStyle.labelMarked : `marked ${label}`, draw: buryStyle.draw, debris: buryStyle.debris, glow: buryStyle.glow };
    });
    buriedHome = null;
    if (need.B > 0) { buriedHome = rocks[Math.floor(Math.random() * rocks.length)]; buriedHome.marked = true; }
    initHazards(); initTrinkets();
    if (mode === 'free') {
      goldDone = { a: true, b: true }; chaos = true;
      const zones = currentLevel.spawnZones || [[120, WORLD - 120]];
      const atZone = i => { const [a, b] = zones[i % zones.length]; return safeLevelX(a + (b - a) * (.28 + .44 * ((i * .37) % 1))); };
      for (let i = 0; i < 6; i++) spawn(i % 2 ? 'N' : 'F', atZone(i));
      [0, 2].forEach(i => spawn('L', atZone(i + 1)));
      return;
    }
    for (const type of Object.keys(need)) {
      const base = chapter.initialSpawns?.[type] || 0;
      const count = ['F', 'N', 'L', 'E', 'S', 'J'].includes(type) ? Math.max(base, Math.min(need[type], 2)) : base;
      for (let i = 0; i < count; i++) {
        if (!need[type]) continue;
        spawn(type);
      }
    }
  }
  reset();

  // ---------- effects ----------
  function float(x, y, text, c) { floats.push({ x, y, text, c, life: 1.2 }); }
  function burst(x, y, c, n) {
    for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, s = 80 + Math.random() * 260; parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 60, life: .7 + Math.random() * .4, max: 1.1, c, r: 2 + Math.random() * 3, g: 300 }); }
  }
  function puff(m) { parts.push({ x: m.x + (Math.random() - .5) * 20, y: m.y - 18, vx: (Math.random() - .5) * 30, vy: -60 - Math.random() * 40, life: .6, max: .6, c: 'rgba(240,230,255,.55)', r: 4 + Math.random() * 4, g: -20 }); }
  function dust(m) { parts.push({ x: m.x - m.dir * 18, y: terrainY(m.x) - 4, vx: -m.dir * 60, vy: -30 * Math.random(), life: .4, max: .4, c: 'rgba(255,97,104,.5)', r: 3 + Math.random() * 3, g: 0 }); }
  function announce(text, c = INK, life = 1.8) { banner = { text, c, life, max: life }; }

  // ---------- gameplay ----------
  function panic(m, dx) {
    const chapter = mode === 'story' ? chapterFor(storyNight) : null;
    m.state = 'panic'; m.st = chapter?.nervousPanicTime ?? 1.1; m.dir = -(Math.sign(dx) || 1); m.alarm = 0; startles++;
    float(m.x, m.y - 34, 'Startled!', VIOLET); sfx('moodling', 'N');
  }
  function beginFall() {
    if (cat.falling || cat.respawning || state !== 'play') return;
    cat.y = Math.min(cat.y, VH + OY - 10);
    cat.falling = true; cat.fallTime = 0; cat.fallFromX = cat.x; cat.vx = 0; cat.platform = null; cat.swinging = null;
    jumpHeld = false; jumpQ = false; burst(cat.x, cat.y - 18, GOLD, 24); burst(cat.x, cat.y - 24, CALM, 14);
    sfx('cat', 'sad'); sfx('ui', 'fall'); sfx('ui', 'poof');
  }
  function detachTrail(count) {
    let dropped = 0;
    for (let i = 0; i < count && trail.length; i++) {
      const l = trail.pop();
      got[l.type] = Math.max(0, (got[l.type] || 0) - 1);
      const nm = spawn(l.type, clamp(l.x, 60, WORLD - 60));
      if (l.type === 'B' && nm.rock) { nm.rock.scratched = false; nm.rock.holeDepth = 0; }
      if (l.type === 'N') panic(nm, cat.x - nm.x);
      float(l.x, l.y - 20, 'A light drifted away', col(l.type));
      if (count > 1) burst(l.x, l.y, col(l.type), 8);
      dropped++;
    }
    return dropped;
  }
  function hitCat(m) {
    hits++; cat.inv = 1.2; cat.vx = m.dir * 420; cat.vy = -420; cat.on = false; cat.pounce = 0;
    if (m?.type) { guidanceHits[m.type] = (guidanceHits[m.type] || 0) + 1; if (guidanceHits[m.type] >= 3) maybeStruggleTip('hits', m); }
    combo = 0; comboT = 0; sfx('cat', 'sad'); sfx('ui', 'hit'); sfx('ui', 'comboLost');
    shake = Math.max(shake, m.ambush ? 16 : 10);
    if (m.ambush) {
      const n = clamp((storyNight || 1) - 3, 1, 3);
      const dropped = detachTrail(n);
      float(cat.x, cat.y - 100, `−${dropped} feeling${dropped === 1 ? '' : 's'}`, RED);
      if (mode === 'story') timeLeft = Math.max(0, timeLeft - 2);
      announce("The angry ground tore a light away", RED, 1.6);
    } else if (trail.length && (activeItems.scarf || perkShield > 0)) {
      if (activeItems.scarf) { activeItems.scarf = false; burst(cat.x, cat.y - 44, '#e0565b', 12); float(cat.x, cat.y - 72, '🧣 The scarf kept your lights safe', GOLD); }
      else { perkShield--; float(cat.x, cat.y - 72, 'Big and sturdy! No light lost', GOLD); }
    } else if (trail.length) detachTrail(1);
    else float(cat.x, cat.y - 64, 'Ouch!', RED);
  }
  function buriedAmbushSize(night) { return night < 5 ? 0 : clamp(night - 3, 1, 4); }
  function triggerBuriedAmbush(sizeOverride = null, message = null, options = null) {
    const n = sizeOverride == null ? buriedAmbushSize(storyNight) : sizeOverride;
    if (!n) { timeLeft = Math.max(0, timeLeft - 2); announce('The ground rumbles…', RED, 2); return; }
    const away = -(cat.face || 1);
    for (let i = 0; i < n; i++) {
      const fallbackSide = i === 0 ? away : i % 2 ? -away : away;
      const wave = options?.wave?.[i], side = wave?.side ?? fallbackSide;
      const x = wave?.x ?? clamp(cat.x + side * (140 + Math.random() * 120), 60, WORLD - 60);
      const type = options?.frustratedOnly ? 'F' : i === n - 1 && n >= 3 ? 'N' : 'F';
      const amb = spawn(type, x);
      amb.ambush = true; amb.dir = -side;
      if (type === 'F') { amb.state = 'warn'; amb.st = FRUST_WARN; }
      else { amb.state = 'panic'; amb.st = 1.2; }
    }
    announce(message || `The ground woke ${n} angrier feelings`, RED, 2); shake = Math.max(shake, options?.shake ?? 10);
  }
  function failSkyChallenge(m) {
    if (!m || m.dead || m.skyPhase === 'cleared') return false;
    const chapter = chapterFor(storyNight), n = chapter.sky.ambushBase + Math.max(0, storyNight - 4);
    m.skyPhase = 'cleared'; m.dead = true; m.alpha = 0; m.skyTimer = 0;
    skyPerfect = Math.max(0, skyPerfect - 1);
    if ((got.F || 0) < (need.F || 0) && !respawnQ.some(r => r.type === 'F')) respawnQ.push({ type: 'F', at: chapter.respawnDelay + Math.random() * .8 });
    m.ambushWave = [];
    const away = -(cat.face || 1);
    for (let i = 0; i < n; i++) {
      const side = i === 0 ? away : i % 2 ? -away : away;
      m.ambushWave.push({ x: clamp(cat.x + side * (140 + Math.random() * 120), 60, WORLD - 60), side, type: 'F' });
    }
    float(cat.x, cat.y - 88, 'It got away…', RED);
    triggerBuriedAmbush(n, 'It got away…', { frustratedOnly: true, wave: m.ambushWave, shake: 12 });
    setTimeout(() => tone(80, .55, 'sawtooth', .09, -40), 120);
    return true;
  }
  function landSkyMood(m, chapter) {
    if (m.skyFeature === 'C' && !m.skyHit) { failSkyChallenge(m); return; }
    m.y = m.skyTargetY; m.skyVY = 0; m.skyTimer = 0; m.skyPhase = 'ground';
    if (m.skyFeature === 'A' && cat.on && Math.abs(cat.x - m.x) < 36 && Math.abs(cat.y - terrainY(m.x)) < 10) {
      const catOnLeft = cat.x <= m.x;
      cat.vx = catOnLeft ? -120 : 120;
      m.x = clamp(cat.x + (catOnLeft ? 52 : -52), 60, WORLD - 60);
      if (m.spot) { m.spot.x = m.x; m.spot.y = terrainY(m.x); }
      if (m.caveX != null) m.caveX = m.x;
      m.skyTargetY = terrainY(m.x) - ({ N: 46, L: 30 }[m.type] || 30); m.y = m.skyTargetY;
      float(cat.x, cat.y - 72, 'Mind the landing!', GOLD); tone(660, .12, 'sine', .035, 160);
    }
    if (m.skyFeature === 'B') {
      if (!m.skyHit) {
        m.skyMissed = true; skyPerfect = Math.max(0, skyPerfect - 1);
        float(m.x, m.y - 34, 'Missed sky interception', MUTED);
      } else {
        m.skyGroundStun = .6;
        if (m.type === 'E') { m.state = 'squash'; m.st = .6; m.vy = 0; m.apex = false; }
        else { m.state = 'tired'; m.st = .6; }
      }
    }
  }
  function updateSkyMood(m, dt, chapter) {
    m.hitCooldown = Math.max(0, (m.hitCooldown || 0) - dt);
    if (m.skyPhase === 'wait') {
      m.skyTimer += dt; m.y = m.skyStartY + Math.sin(t * 4 + m.phase) * 3;
      while (m.skyTimer >= m.skyChimeAt && m.skyChimeAt < m.skyWait) { tone(740, .10, 'sine', .018, 90); m.skyChimeAt += 1; }
      if (m.skyTimer >= m.skyWait) { m.skyPhase = 'falling'; m.skyTimer = 0; m.skyVY = 0; m.y = m.skyStartY; }
      return;
    }
    if (m.skyPhase === 'scratchReq') {
      m.skyTimer += dt;
      const walkedAway = Math.abs(cat.x - m.skyAnchorX) > 120 || Math.abs(cat.x - m.x) > 165;
      if (walkedAway || m.skyTimer >= chapter.sky.scratchWindow) failSkyChallenge(m);
      return;
    }
    if (!['falling', 'struck', 'scratched'].includes(m.skyPhase)) return;
    m.skyTimer += dt;
    if (m.skyFeature === 'C' && (m.skyPhase === 'falling' || m.skyPhase === 'scratched')) {
      m.skyEmberTimer -= dt;
      if (m.skyEmberTimer <= 0) { m.skyEmberTimer = .055; parts.push({ x: m.x + (Math.random() - .5) * 12, y: m.y - 14, vx: (Math.random() - .5) * 35, vy: -25 - Math.random() * 30, life: .42, max: .42, c: '#ff6168', r: 2 + Math.random() * 2.4, g: -10 }); }
    }
    if (m.skyPhase === 'falling' && m.skyFeature === 'A') m.y += chapter.sky.fallSpeed * dt;
    else if (m.skyPhase === 'falling' && m.skyFeature === 'C') {
      m.skyVY = Math.min(m.skyVY + chapter.sky.gravity * .52 * dt, Math.max(180, chapter.sky.fallSpeed * 1.6)); m.y += m.skyVY * dt;
    } else {
      const gravityScale = m.skyPhase === 'scratched' ? 1.2 : 1;
      m.skyVY += chapter.sky.gravity * gravityScale * dt;
      if (m.skyPhase === 'scratched') m.skyVY = Math.max(m.skyVY, Math.max(260, chapter.sky.fallSpeed * 2));
      m.y += m.skyVY * dt;
    }
    if (m.y >= m.skyTargetY) landSkyMood(m, chapter);
  }
  function catchIt(m) {
    if (m.tutorialOnly) { onTutorialAction('catch', m); m.dead = true; m.alpha = 0; cat.pounce = 0; burst(m.x, m.y, GOLD, 12); sfx('ui', 'catch'); return; }
    if (mode === 'free') {
      // free play: catches are only for fun. No score, Glow, Mood Book, missions or Workshop lights.
      m.dead = true; m.alpha = 0; cat.pounce = 0; hitstop = .05; caughtN++;
      trail.push({ type: m.type, v: m.v, x: m.x, y: m.y }); if (trail.length > 8) trail.shift();
      burst(m.x, m.y, col(m.type), 18); float(m.x, m.y - 36, ['Hello!', 'Got you!', 'Hi there', 'Come along'][caughtN % 4], col(m.type));
      if (window.TCSfx) sfx('caught', m.type); else tone(660, .14, 'triangle', .07);
      return;
    }
    // an angry Frustrated from the rocks still counts if Shwe needs more of that feeling tonight
    if (m.ambush && mode === 'story' && Object.prototype.hasOwnProperty.call(got, m.type) && got[m.type] < need[m.type]) m.ambush = false;
    if (m.ambush) {
      const gain = 8 + 2 * combo;
      glowRun += gain; bump('glow', gain);
      m.dead = true; m.alpha = 0; hitstop = .05;
      burst(m.x, m.y, col(m.type), 18);
      float(m.x, m.y - 36, `+${gain} Glow · ambush cleared`, col(m.type));
      tone(660, .18, 'triangle', .08);
      return;
    }
    if (mode !== 'free' || workshopRun.length < FREE_LIGHT_CAP) workshopRun.push(m.type);
    else if (!freeLightCapShown) { freeLightCapShown = true; announce(`Workshop lights full for this run (${FREE_LIGHT_CAP}). The story brings more home!`, GOLD, 2.6); }
    if (mode === 'story' && m.type !== 'G' && got[m.type] >= need[m.type]) {
      // an extra catch (this feeling is already home): no penalty, half the usual Glow, and it floats home too
      cat.pounce = 0; cat.bounced = true;
      const extra = Math.ceil({ F: 10, N: 12, L: 14, C: 16, B: 13, E: 13, S: 14, J: 16 }[m.type] / 2);
      glowRun += extra; bump('glow', extra);
      float(m.x, m.y - 34, `+${extra} Glow · extra`, col(m.type)); burst(m.x, m.y, col(m.type), 16);
      if (m.type === 'B' && m.rock) { m.rock.scratched = false; m.rock.holeDepth = 0; }
      if (m.sky) { m.skyPhase = 'cleared'; m.skyTimer = 0; }
      m.dead = true; m.alpha = 0; hitstop = .05;
      if (window.TCSfx) sfx('caught', m.type); else tone(880, .12, 'sine', .05);
      tcLight(m.type);
      return;
    }
    if (m.sky) { m.skyPhase = 'cleared'; m.skyTimer = 0; }
    combo = comboT > 0 ? Math.min(5, combo + 1) : 1; comboT = 4; bestCombo = Math.max(bestCombo, combo); sfx('combo', combo);
    const pts = { F: 100, N: 120, L: 150, C: 180, B: 160, E: 140, S: 150, J: 170, G: 500 }[m.type] * combo; score += pts;
    const gain = { F: 10, N: 12, L: 14, C: 16, B: 13, E: 13, S: 14, J: 16, G: 40 }[m.type] + 2 * (combo - 1) + (m.type === 'G' && catPerk() === 'burmese' ? 10 : 0);
    // Free mode is for fun and practice: half Glow, and at most FREE_GLOW_CAP per run, so the story stays the best way to earn
    let glowGain = gain;
    if (mode === 'free') {
      glowGain = Math.min(Math.ceil(gain / 2), Math.max(0, FREE_GLOW_CAP - glowRun));
      if (glowGain === 0 && !freeCapShown) { freeCapShown = true; announce('Glow full for this run. The story earns more!', GOLD, 2.4); }
    }
    glowRun += glowGain; bump('glow', glowGain);
    caughtN++;
    onGuidanceCatch(m);
    if (m.type === 'G') { timeLeft += 5; slowmo = .6; announce('Golden catch! +5 seconds', GOLD, 1.4); }
    else if (mode === 'free') { timeLeft += 2; trail.push({ type: m.type, v: m.v, x: m.x, y: m.y }); if (trail.length > 12) trail.shift(); }
    else { const chapter = chapterFor(storyNight); if (Object.prototype.hasOwnProperty.call(got, m.type)) { got[m.type]++; if (got[m.type] < need[m.type]) respawnQ.push({ type: m.type, at: chapter.respawnDelay + Math.random() * .8 }); } trail.push({ type: m.type, v: m.v, x: m.x, y: m.y }); if (m.type === 'B' && m.rock) { m.rock.scratched = false; m.rock.holeDepth = 0; } }
    const key = m.type + (m.v || 0), info = vinfo(m.type, m.v || 0);
    if (!book[key]) {
      const bonus = m.v ? 30 : m.type === 'G' ? 20 : 10;
      glowRun += bonus; bump('glow', bonus); runNew.push(info.n);
      announce(`New in the Mood Book: ${info.n}  +${bonus} Glow`, info.c, 2.2);
    }
    book[key] = (book[key] || 0) + 1; saveBook(); tcLight(m.type);
    if (m.type === 'F' || m.type === 'N' || m.type === 'L' || m.type === 'S') bump('catch' + m.type);
    if (m.type === 'N') runN++;
    if (m.type === 'G') bump('golden');
    if (m.v) bump('rare');
    if (combo >= 4) bump('combo4');
    m.dead = true; hitstop = .07;
    burst(m.x, m.y, col(m.type), m.type === 'G' ? 40 : 22);
    float(m.x, m.y - 36, `+${pts}${combo > 1 ? '  ×' + combo : ''}${mode === 'free' && m.type !== 'G' ? '  +2s' : ''}`, col(m.type));
    const f = 523.25 * Math.pow(2, (combo - 1) * 2 / 12);
    if (window.TCSfx) sfx('caught', m.type); else { tone(f, .18, 'triangle', .09); setTimeout(() => tone(f * 1.5, .22, 'sine', .07), 70); }
    if (mode === 'story' && Object.entries(need).every(([type, count]) => got[type] >= count) && state === 'play') {
      if (nightGuide.active) { nightGuide.pendingWin = true; if (nightGuide.step === 8 && nightGuide.success <= 0) onTutorialAction('home', m); }
      else reachAllHome();
    }
  }

  function updCat(dt) {
    const c = cat;
    if (c.falling) {
      c.fallTime += dt;
      if (c.fallTime >= .38) {
        c.falling = false; c.respawning = true; c.swinging = null; c.platform = null;
        if (mode === 'story' && !gentleMode) { lives = Math.max(0, lives - 1); sfx('ui', 'lifeLost'); }
        if (mode === 'story' && !gentleMode && lives <= 0 && allHome) { lives = 1; c.respawning = true; respawnT = .5; fallDimT = .5; beginStoryEnding(); return; }
        if (mode === 'story' && !gentleMode && lives <= 0) {
          // Catches already recorded in the Mood Book remain banked; this run's carried lights do not.
          trail = []; got = Object.fromEntries(Object.keys(need).map(type => [type, 0])); glowRun = 0; pendingFallFail = true;
        } else if (mode === 'free') { announce('Soft landing · off you go again', CALM, 1.4); }
        else announce(gentleMode ? 'Gentle landing · try again' : `A life left · ${lives} remaining`, gentleMode ? CALM : GOLD, 1.7);
        c.respawning = true; respawnT = .5; fallDimT = .5;
      }
      return;
    }
    if (c.respawning) {
      respawnT -= dt; fallDimT = Math.max(0, fallDimT - dt);
      if (respawnT <= 0) {
        if (pendingFallFail) { pendingFallFail = false; finish(false, 'fall'); return; }
        c.x = checkpointX; c.y = terrainY(checkpointX); c.vx = 0; c.vy = 0; c.on = true;
        c.inv = 1.5; c.respawning = false; c.coyote = 0; c.jumpBuffer = 0;
        hist = []; sfx('ui', 'respawn'); burst(c.x, c.y - 20, CALM, 16); announce('Back at the lantern!', CALM, 1.2);
      }
      return;
    }
    c.justLanded = false;
    if (jumpQ) c.jumpBuffer = .12; else c.jumpBuffer = Math.max(0, c.jumpBuffer - dt);
    const a = axisNow(), sneaking = a !== 0 && Math.abs(a) < .55;
    if (a !== 0) onTutorialAction('move', c);
    if (sneaking) onTutorialAction('sneak', c);
    const target = a === 0 ? 0 : Math.sign(a) * (sneaking ? 2 * T : uv('swift') * T);
    c.sneak = sneaking;
    window.TCGameAudio?.setSneaking(sneaking);
    if (c.pounce > 0) c.pounce -= dt;
    else { const slick = c.on && onSlick(c.x), acc = slick ? (Math.abs(target) > Math.abs(c.vx) && Math.sign(target) === Math.sign(c.vx || target) ? 700 : 220) : c.on ? 2600 : 1500; c.vx += clamp(target - c.vx, -acc * dt, acc * dt); if (a) c.face = Math.sign(a); }
    const chapter = mode === 'story' ? chapterFor(storyNight) : null;
    const jumpSpeed = chapter?.jumpSpeed || 830, gravity = chapter?.jumpGravity || 2300;
    if (c.swinging) {
      if (jumpHeld) {
        const p = c.swinging, anchor = p.anchor || [p[0] + p[2] / 2, p[1] - 60];
        c.x = anchor[0] + Math.sin(t * 2.5) * 28; c.y = anchor[1] + 34 + Math.sin(t * 2.5 + .4) * 14;
        c.vx = Math.cos(t * 2.5) * 70; c.vy = 0; c.on = false; c.platform = null; jumpQ = false; return;
      }
      c.swinging = null; c.vx = c.face * 360; c.vy = -720; c.on = false; c.jumpBuffer = 0; sfx('ui', 'jump');
    }
    const wasOn = c.on, py = c.y;
    if (c.jumpBuffer > 0 && (c.on || c.coyote > 0) && c.pounce <= 0) {
      c.vy = -jumpSpeed; c.on = false; c.coyote = 0; c.jumpBuffer = 0;
      onTutorialAction('jump', c); if (window.TCSfx) sfx('ui', 'jump'); else tone(380, .12, 'triangle', .05, 240);
    }
    jumpQ = false;
    if (pounceQ && c.pcd <= 0) { c.pounce = .3; c.pcd = .55; c.bounced = false; c.vx = c.face * 560; c.vy = c.on ? -360 : Math.min(c.vy, -220); c.on = false; if (window.TCSfx) { sfx('ui', 'pounce'); catVoice('trill', .25); } else tone(240, .1, 'square', .035, 320); }
    pounceQ = false;
    c.pcd -= dt; c.inv -= dt; c.squash = Math.max(0, c.squash - dt);
    if (c.platform && !c.platform.active) c.platform = null;
    c.vy += gravity * dt; c.x += c.vx * dt; c.y += c.vy * dt; c.x = clamp(c.x, 30, WORLD - 30);
    let landed = false, landedOn = null;
    const floorY = terrainY(c.x);
    const pit = pitAt(c.x);
    // the ground is solid everywhere except the pits; a step up of up to 40px (a steep stone step) is climbed
    // instead of letting Shwe slip under it and fall through the map
    if (!pit && c.vy >= 0 && py <= floorY + (wasOn ? 40 : 4) && c.y >= floorY) { c.y = floorY; landed = true; }
    else if (c.vy >= 0) {
      for (const p of activePlats) {
        if (!p.active || p.type === 'swinging') continue;
        const pad = p.type === 'moving' ? 16 : 6;
        if (c.x > p[0] - pad && c.x < p[0] + p[2] + pad && py <= p[1] + .5 && c.y >= p[1]) { c.y = p[1]; landed = true; landedOn = p; break; }
      }
    }
    if (jumpHeld && !landed) {
      const rope = activePlats.find(p => p.type === 'swinging' && p.anchor && Math.abs(c.x - p.anchor[0]) < p[2] / 2 + 24 && Math.abs(c.y - p.anchor[1]) < 34);
      if (rope) { c.swinging = rope; c.on = false; c.vy = 0; jumpQ = false; return; }
    }
    if (landed) {
      if (!wasOn) { c.justLanded = true; if (c.vy > 500) { c.squash = .16; sfx('ui', 'land'); } }
      c.vy = 0; c.platform = landedOn;
      if (landedOn?.type === 'crumbling' && landedOn.crumbleRemaining <= 0) { landedOn.crumbleRemaining = .6; sfx('ui', 'crumble'); }
      if (landedOn?.type === 'moving' && !wasOn) sfx('ui', 'platformHum');
      if (landedOn?.type === 'bouncy' && !wasOn) { c.vy = -960; c.on = false; c.bounced = true; sfx('ui', 'jump'); }
    } else c.platform = null;
    c.on = landed && !(landedOn?.type === 'bouncy' && !wasOn);
    c.coyote = c.on ? .1 : Math.max(0, c.coyote - dt);
    if (c.on && !pitAt(c.x)) {
      for (const mark of currentLevel.checkpoints || []) if (Math.abs(c.x - mark) < 30 && Math.abs(checkpointX - mark) > 20) { checkpointX = mark; sfx('ui', 'checkpoint'); burst(mark, terrainY(mark) - 8, GOLD, 12); announce('Lantern checkpoint saved', GOLD, 1.5); }
    }
    if (!pitTipShown && (currentLevel.pits || []).some(([a, b]) => c.x >= a - 190 && c.x <= b + 190)) {
      pitTipShown = true; announce(mode === 'story' && storyNight === 2 ? 'Careful! Shwe can fall here' : 'Careful near the edge!', GOLD, 2); sfx('ui', 'edge');
    }
    if (Math.abs(c.vx) > 0 && (currentLevel.pits || []).some(([a, b]) => c.x >= a - 52 && c.x <= b + 52) && t >= edgeSoundAt) { edgeSoundAt = t + 1.2; sfx('ui', 'edge'); }
    if (c.y > VH + OY - 10) beginFall();
    if (c.on && Math.abs(c.vx) > 90) {
      c.walk += dt * Math.min(Math.abs(c.vx), 300) / 27;   // calm steps: about 1.7 strides a second at full speed, so the legs never flutter
      const stepBeat = Math.floor(c.walk / Math.PI);
      if (stepBeat !== c.stepBeat) { c.stepBeat = stepBeat; sfx('ui', 'step'); }
    }
  }

  function updMood(m, dt) {
    if (nightGuide.active && !m.tutorialOnly) return;
    const chapter = mode === 'story' ? chapterFor(storyNight) : { moodlingSpeed: 1, frustratedChargeSpeed: 1, frustratedWindup: .55, nervousHearingMul: 1, nervousPanicTime: 1.1 };
    const sp = mode === 'free' ? 1 + Math.min(.6, level * .1) : (chapter.moodlingSpeed * (chaos ? 1.25 : 1));
    if (m.sky && m.skyPhase === 'cleared') return;
    if (m.sky && m.skyPhase !== 'ground') { updateSkyMood(m, dt, chapter); return; }
    if (m.sky && m.skyGroundStun > 0) {
      m.skyGroundStun = Math.max(0, m.skyGroundStun - dt); m.y = m.skyTargetY;
      if (m.skyGroundStun === 0) {
        if (m.type === 'E') { m.state = 'bounce'; m.vy = -180; m.apex = true; }
        else if (m.type === 'J') { m.state = 'tired'; m.st = 1.2; }
      }
      return;
    }
    if (m.type === 'F') {
      if (!m.ambush || m.state !== 'charge') m.y = terrainY(m.x) - 20;
      const dx = cat.x - m.x, dy = cat.y - (m.y + 20);
      if (m.state === 'patrol') {
        const asleep = !m.ambush && t < frustWakeAt; if (asleep && !m.slept) m.slept = 1;
        if (!asleep && m.slept === 1) { m.slept = 2; float(m.x, m.y - 46, 'grr!', RED); sfx('moodling', 'F'); }
        if (!asleep) m.x += m.dir * 55 * dt * sp; if (Math.abs(m.x - m.home) > 140) m.dir = Math.sign(m.home - m.x) || 1;
        m.x = clamp(m.x, 40, WORLD - 40); m.cd -= dt;
        if (m.cd <= 0 && t >= frustWakeAt && Math.abs(dx) < 4 * T && Math.abs(dy) < 90) { m.state = 'windup'; m.st = chapter.frustratedWindup; m.dir = Math.sign(dx) || 1; sfx('play', 'sfx_mood_frustrated_charge'); }
      } else if (m.state === 'warn') {
        m.st -= dt; m.dir = Math.sign(dx) || m.dir;
        if (m.st <= 0) { float(m.x, m.y - 46, 'grr!', RED); sfx('moodling', 'F'); if (m.ambush) { m.state = 'windup'; m.st = .4; sfx('play', 'sfx_mood_frustrated_charge'); } else { m.state = 'patrol'; m.cd = .8; m.home = m.x; } }
      } else if (m.state === 'windup') {
        m.st -= dt; if (Math.random() < .5) puff(m); if (m.st <= 0) { m.state = 'charge'; m.st = m.ambush ? 2.2 : 1.5; }
      } else if (m.state === 'charge') {
        if (m.ambush) {
          const tx = cat.x, dy = cat.y - m.y;
          const ang = Math.atan2(dy, tx - m.x);
          m.x += Math.cos(ang) * 8 * T * sp * chapter.frustratedChargeSpeed * dt;
          m.y += Math.sin(ang) * 3 * T * sp * chapter.frustratedChargeSpeed * dt;
          const floorY = terrainY(m.x) - 20;
          if (m.y > floorY) m.y = floorY;
        } else m.x += m.dir * 8 * T * sp * chapter.frustratedChargeSpeed * dt;
        m.st -= dt; if (Math.random() < .6) dust(m);
        if (m.x < 40 || m.x > WORLD - 40) { m.x = clamp(m.x, 40, WORLD - 40); m.st = 0; }
        if (m.tutorialDodge && Math.abs(cat.vx) > 60 && Math.abs(dx) > 44) { onTutorialAction('dodge', m); return; }
        if (cat.inv <= 0 && Math.abs(dx) < 34 && Math.abs(dy) < 46) {
          if (m.tutorialOnly) { m.state = 'dizzy'; m.st = 3; if (Math.abs(cat.vx) > 60 || !cat.on) onTutorialAction('dodge', m); float(m.x, m.y - 40, 'Dizzy! Pounce now', RED); sfx('play', 'sfx_mood_frustrated_dizzy'); }
          else if (storyNight <= 3 && cat.sneak) { m.state = 'dizzy'; m.st = 3; onTutorialAction('dodge', m); float(m.x, m.y - 40, 'Dizzy! Pounce now', RED); sfx('play', 'sfx_mood_frustrated_dizzy'); }
          else { hitCat(m); m.state = 'patrol'; m.cd = 2.2; m.home = m.x; }
        }
        else if (m.st <= 0) { m.state = 'dizzy'; m.st = 3; onTutorialAction('dodge', m); sfx('play', 'sfx_mood_frustrated_dizzy'); float(m.x, m.y - 40, 'Dizzy! Pounce now', RED); }
      } else if (m.state === 'dizzy') {
        m.st -= dt; if (m.st <= 0) { m.state = 'patrol'; m.cd = 1.2; m.home = m.x; }
      }
    } else if (m.type === 'N') {
      const dx = cat.x - m.x, d = Math.hypot(dx, cat.y - 24 - m.y), R = uv('paws') * T * chapter.nervousHearingMul;
      if (m.state === 'wander') {
        m.x += m.dir * 45 * dt * sp; m.cd -= dt; if (m.cd <= 0) { m.dir *= -1; m.cd = 1 + Math.random() * 2.5; }
        if (m.x < 60 || m.x > WORLD - 60) m.dir *= -1;
        m.y = terrainY(m.x) - 46 + Math.sin(t * 3 + m.phase) * 8;
        const loud = Math.abs(cat.vx) > 3.2 * T || !cat.on || cat.justLanded;
        if (d < R && loud && cat.pounce <= 0) { m.alarm += dt; if (m.alarm > (chapter.nervousAlarmThreshold ?? .3) && t >= 10) panic(m, dx); }
        else m.alarm = Math.max(0, m.alarm - dt);
        if (m.alpha < 1) m.alpha = Math.min(1, m.alpha + dt * 2);
      } else if (m.state === 'panic') {
        m.x += m.dir * 7 * T * sp * dt; m.st -= dt; m.y = terrainY(m.x) - 46 + Math.sin(t * 20) * 6;
        if (m.x < 40 || m.x > WORLD - 40) { m.dir *= -1; m.x = clamp(m.x, 40, WORLD - 40); }
        if (m.st <= 0) { m.state = 'hidden'; m.st = 5; }
      } else if (m.state === 'hidden') {
        m.st -= dt; m.alpha = Math.max(0, m.alpha - dt * 3);
        if (m.st <= 0) { m.x = pickX(); m.state = 'wander'; m.alpha = 0; }
      }
    } else if (m.type === 'B') {
      const rock = m.rock || buriedHome; m.x = rock.x; m.y = rock.y - 12;
      if (m.state === 'buried') { m.alpha = 0; const bd = Math.abs(cat.x - m.x), br = 7 * T; if (bd < br) { m.chime -= dt; if (m.chime <= 0) { const q = bd / br; m.chime = .35 + 1.3 * q; tone(440 + (1 - q) * 220, .12, 'sine', .02 + .03 * (1 - q)); } } }
      else if (m.state === 'scratching') { m.alpha = 0; m.st -= dt; if (m.st <= 0) { m.state = 'emerging'; m.st = .5; rock.holeDepth = 0; } }
      else if (m.state === 'emerging') { m.alpha = Math.min(1, m.alpha + dt * 2.4); m.st -= dt; rock.holeDepth = Math.min(1, rock.holeDepth + dt * 2); if (m.st <= 0) { m.state = 'revealed'; m.alpha = 1; } }
      else if (m.state === 'revealed') { rock.holeDepth = 1; }
    } else if (m.type === 'C') {
      m.alpha = Math.min(1, m.alpha + dt * 2);
      if (m.v === 1) updBreath(m, dt);
      else m.y = terrainY(m.x) - 44 + Math.sin(t * 1.6 + m.phase) * 3;
      if (m.v === 1) { /* breathing handled above */ }
      else if (m.state === 'dim') {
        const carried = carriedFlies();
        if (carried.length >= FLY_NEED && cat.on && Math.abs(cat.x - m.x) < 1.6 * T && Math.abs(cat.y - terrainY(m.x)) < 60) {
          carried.slice(0, FLY_NEED).forEach((f, i) => { f.state = 'give'; f.st = .55 + i * .15; f.calm = m; });
          m.state = 'glowing'; m.st = 1.2;
          float(m.x, m.y - 64, '“It’s okay. You can rest now.”', CALM);
          tone(659, .3, 'sine', .05); setTimeout(() => tone(784, .3, 'sine', .05), 180); setTimeout(() => tone(988, .4, 'sine', .05), 360);
        }
      } else if (m.state === 'glowing') {
        m.st -= dt; m.light = clamp(1 - m.st / 1.2, 0, 1);
        if (Math.random() < .4) parts.push({ x: m.x + (Math.random() - .5) * 40, y: m.y + (Math.random() - .5) * 30, vx: 0, vy: -30, life: .7, max: .7, c: CALM, r: 2, g: 0 });
        if (m.st <= 0) { m.state = 'lit'; m.light = 1; catchIt(m); }
      }
    } else if (m.type === 'L') {
      const dx = cat.x - m.x, moodColor = m.type === 'C' ? CALM : BLUE, floorY = terrainY(m.x);
      if (m.state === 'hide') { m.alpha = 0; m.sit = 0; }
      else if (m.state === 'scratching') {
        m.st -= dt;
        if (m.st <= 0) { m.state = 'emerging'; m.st = .38; m.alpha = .04; m.spot.used = true; m.spot.usedAt = t; m.spot.scratching = false; burst(m.x, floorY - 22, m.type === 'C' ? '#a8e7a3' : '#c8a47a', 14); float(m.x, floorY - 68, m.type === 'C' ? 'A quiet glow!' : 'Someone was hiding here', moodColor); tone(m.type === 'C' ? 740 : 988, .2, 'sine', .045); }
      } else if (m.state === 'emerging') {
        m.alpha = Math.min(1, m.alpha + dt * 2.7); m.st -= dt;
        if (m.st <= 0) { m.state = 'revealed'; m.alpha = 1; sfx('moodling', m.type === 'C' ? 'C' : 'L'); }
      } else if (m.state === 'revealed' || m.state === 'flee') {
        m.y = floorY - (m.type === 'C' ? 46 : 30) + Math.sin(t * 2 + m.phase) * 4;
        if (m.state === 'revealed' && m.type === 'L') {
          const close = Math.abs(dx) < 115, startled = !cat.on || cat.justLanded || Math.abs(cat.vx) > 110;
          m.fleeAlarm = close && startled ? m.fleeAlarm + dt : Math.max(0, m.fleeAlarm - dt * 1.8);
          if (m.fleeAlarm > .48) { m.state = 'flee'; m.st = .72; m.dir = -(Math.sign(dx) || 1); m.sit = 0; float(m.x, m.y - 36, 'Lonely darted away!', BLUE); sfx('moodling', 'L'); }
        }
        if (m.state === 'flee') {
          m.x += m.dir * 240 * sp * dt; m.alpha = Math.max(0, m.alpha - dt * .7); m.st -= dt;
          if (m.st <= 0) { m.state = 'rest'; m.st = 1.05; }
        } else {
          const still = cat.on && Math.abs(cat.vx) < 25 && cat.pounce <= 0;
          const sitRadius = mode === 'story' && storyNight === 3 ? 2.2 * T : 1.4 * T;
          if (still && Math.abs(dx) < sitRadius) {
            if (m.sit === 0) tone(523, .2, 'sine', .03);
            m.sit += dt;
            if (m.sit >= sitNeed()) { m.sit = 0; catchIt(m); }
          } else m.sit = Math.max(0, m.sit - dt * 2);
        }
      } else if (m.state === 'rest') {
        m.alpha = Math.max(0, m.alpha - dt * 4); m.st -= dt;
        if (m.st <= 0) hideFeeling(m);
      }
      if (m.state === 'hide' && Math.abs(dx) < 5 * T) {
        m.chime -= dt;
        if (m.chime <= 0) { m.chime = 1.6; tone(m.type === 'C' ? 784 : 1318, .12, 'sine', .025); for (let k = 0; k < 3; k++) parts.push({ x: m.x + (Math.random() - .5) * 30, y: floorY - 20 + (Math.random() - .5) * 20, vx: 0, vy: -20, life: .7, max: .7, c: moodColor, r: 2, g: 0 }); }
      }
    } else if (m.type === 'E') {
      const floor = terrainY(m.x) - 24;
      if (m.state === 'squash') { m.y = floor; m.st -= dt; if (m.st <= 0) { m.state = 'bounce'; m.vy = m.bounces % 3 === 2 ? -660 : -560; m.bounces++; } }
      else {
        m.vy += 1400 * dt; m.y += m.vy * dt; m.x += m.dir * 70 * sp * dt; m.cd -= dt;
        if (m.x < 60 || m.x > WORLD - 60) { m.dir *= -1; m.x = clamp(m.x, 60, WORLD - 60); }
        if (m.cd <= 0) { m.dir *= -1; m.cd = 2 + Math.random() * 3; }
        if (m.y >= floor && m.vy > 0) { m.y = floor; m.vy = 0; m.state = 'squash'; m.st = m.bounces % 3 === 2 ? .45 : .22; }
      }
      m.apex = m.state === 'bounce' && Math.abs(m.vy) < 230;
      if (m.alpha < 1) m.alpha = Math.min(1, m.alpha + dt * 2);
    } else if (m.type === 'S') {
      const dx = cat.x - m.x; m.y = terrainY(m.x) - 26 + Math.sin(t * 3 + m.phase) * 2;
      if (m.state === 'walk') {
        m.x += m.dir * 38 * sp * dt; m.st -= dt; m.alpha = Math.min(1, m.alpha + dt * 2);
        if (m.x < 60 || m.x > WORLD - 60) { m.dir *= -1; m.x = clamp(m.x, 60, WORLD - 60); }
        if (m.st <= 0) { m.state = 'turn'; m.st = .55; }
      } else if (m.state === 'turn') { m.st -= dt; if (m.st <= 0) { m.state = 'look'; m.st = 1.3; } }
      else if (m.state === 'look') {
        m.st -= dt; const moving = Math.abs(cat.vx) > 30 || !cat.on;
        if (Math.abs(dx) < 6 * T && moving && t >= 3) { m.state = 'hide'; m.st = 2.2; float(m.x, m.y - 40, 'Shy saw you move and hid!', SHY); sfx('moodling', 'S'); startles++; }
        else if (m.st <= 0) { m.state = 'walk'; m.st = 1.8 + Math.random() * 1.6; m.dir = -(Math.sign(dx) || 1); }
      } else if (m.state === 'hide') {
        m.alpha = Math.max(0, m.alpha - dt * 3); m.st -= dt;
        if (m.st <= 0) { m.x = clamp(m.x + (Math.random() < .5 ? -1 : 1) * (3 + Math.random() * 3) * T, 60, WORLD - 60); m.state = 'walk'; m.st = 2; m.alpha = 0; }
      }
    } else if (m.type === 'J') {
      const dx = cat.x - m.x, floor = terrainY(m.x) - 30;
      if (m.state === 'wander') {
        m.x += m.dir * 80 * sp * dt; m.cd -= dt; m.y = floor + Math.sin(t * 5 + m.phase) * 4; m.alpha = Math.min(1, m.alpha + dt * 2);
        if (m.x < 60 || m.x > WORLD - 60) { m.dir *= -1; m.x = clamp(m.x, 60, WORLD - 60); }
        if (Math.random() < dt * .35) m.dir *= -1;
        if (m.cd <= 0 && trail.length && cat.inv <= 0 && Math.abs(dx) < 2.6 * T && Math.abs(cat.y - 24 - m.y) < 70 && t >= 4) {
          const l = trail.pop(); if (got[l.type] !== undefined) got[l.type] = Math.max(0, got[l.type] - 1);
          m.stolen.push(l); m.state = 'flee'; m.st = 1.5; m.dir = -(Math.sign(dx) || 1); combo = 0; comboT = 0;
          float(cat.x, cat.y - 84, 'Jealous stole a light!', JEAL); sfx('moodling', 'J');
        }
      } else if (m.state === 'flee') {
        m.x += m.dir * 7.5 * T * sp * dt; m.y = floor + Math.sin(t * 14) * 3; m.st -= dt;
        if (m.x < 60 || m.x > WORLD - 60) { m.dir *= -1; m.x = clamp(m.x, 60, WORLD - 60); }
        if (m.st <= 0) { m.state = 'tired'; m.st = 3; float(m.x, m.y - 44, 'Jealous is tired. Catch it!', JEAL); }
      } else if (m.state === 'tired') { m.x += m.dir * 15 * dt; m.y = floor + 5; m.st -= dt; if (m.st <= 0) { m.state = 'wander'; m.cd = 5; } }
    } else if (m.type === 'G') {
      m.life -= dt; m.x += Math.cos(t * 2.2 + m.phase) * 260 * sp * dt + m.dir * 120 * sp * dt;
      m.y = 205 + Math.sin(t * 3.1 + m.phase) * 85;
      if (m.x < 80 || m.x > WORLD - 80) m.dir *= -1;
      if (m.life < 1.2) m.alpha = Math.max(0, m.life / 1.2);
      if (m.life <= 0) m.dead = true;
      if (Math.random() < .3) parts.push({ x: m.x, y: m.y, vx: 0, vy: 20, life: .5, max: .5, c: GOLD, r: 2, g: 0 });
    }
  }

  function returnStolen(m) {
    m.stolen.forEach(l => { trail.push({ type: l.type, v: l.v, x: m.x, y: m.y }); if (mode === 'story' && got[l.type] !== undefined) got[l.type]++; });
    float(m.x, m.y - 60, `${m.stolen.length} light${m.stolen.length === 1 ? '' : 's'} back!`, GOLD); m.stolen = [];
  }
  function checkCatches() {
    if (cat.pounce <= 0) return;
    const cx = cat.x + cat.face * 16, cy = cat.y - 24;
    for (const m of mood) {
      if (m.dead) continue;
      if (nightGuide.active && !m.tutorialOnly) continue;
      if (m.sky && m.skyFeature === 'C' && m.skyPhase === 'scratchReq') { failSkyChallenge(m); cat.pounce = 0; return; }
      if (m.sky && m.skyPhase !== 'ground') {
        if (m.skyPhase === 'falling' && m.hitCooldown <= 0 && (m.skyFeature === 'B' || m.skyFeature === 'C')) {
          const chapter = chapterFor(storyNight), base = uv('pounce') * chapter.sky.pounceWindowMul;
          const reach = base * (m.skyFeature === 'B' ? .9 : 1);
          if (Math.hypot(cat.x - m.x, cat.y - 24 - m.y) < reach) {
            m.skyHit = true; m.hitCooldown = .55;
            if (m.skyFeature === 'B') {
              m.skyPhase = 'struck'; m.skyTimer = 0; m.skyVY *= -.35;
              cat.vx = -cat.face * 180; cat.vy = -120; cat.on = false; cat.pounce = 0; cat.bounced = true;
              burst(m.x, m.y, col(m.type), 14); float(m.x, m.y - 36, 'Mid-air hit!', col(m.type)); tone(620, .16, 'triangle', .08, 320);
            } else {
              m.skyPhase = 'scratchReq'; m.skyTimer = 0; m.scratchNeed = 1; m.skyAnchorX = cat.x; m.skyAnchorY = cat.y;
              cat.pounce = 0; cat.bounced = true; announce('Scratch it! (S)', RED, chapter.sky.scratchWindow); burst(m.x, m.y, RED, 12); tone(420, .18, 'triangle', .07, 260);
            }
            return;
          }
        }
        continue;
      }
      if (m.sky && m.skyGroundStun > 0) continue;
      if (m.noCatchUntil && t < m.noCatchUntil) continue;
      if (Math.hypot(m.x - cx, m.y - cy) > uv('pounce')) continue;
      if (m.type === 'B' && m.state === 'buried') { cat.bounced = true; cat.vx = -cat.face * 260; cat.pounce = 0; const label = (m.rock || buriedHome)?.label || 'marked spot'; float(cat.x, cat.y - 70, `It’s still buried. Scratch the ${label}.`, '#a67646'); tone(150, .12, 'square', .05); continue; }
      if (m.alpha < .5) continue;
      if (m.type === 'F' && m.state !== 'dizzy') {
        if (!cat.bounced) { cat.bounced = true; cat.vx = -cat.face * 300; cat.pounce = 0; float(m.x, m.y - 40, "Wait until it's dizzy", RED); sfx('cat', 'hiss'); }
        continue;
      }
      if (m.type === 'F' && m.state === 'dizzy') onTutorialAction('dizzy-pounce', m);
      if (m.tutorialOnly) { catchIt(m); continue; }
      if (m.type === 'L' && mode === 'story' && storyNight === 1) {
        m.state = 'revealed'; m.alpha = 1; m.sit = 0; cat.pounce = 0;
        float(cat.x, cat.y - 70, 'Sit quietly beside Lonely', BLUE); tone(330, .15, 'sine', .035); continue;
      }
      if (m.type === 'C' && m.v === 1) {
        if (!cat.bounced && m.state === 'bubble') { cat.bounced = true; cat.vx = -cat.face * 220; cat.pounce = 0; resetBreath(m); float(m.x, m.y - 70, 'Shh… breathe slowly with it', CALM); tone(300, .2, 'sine', .04, -100); }
        continue;
      }
      if (m.type === 'C') {
        if (!cat.bounced && m.state === 'dim') {
          cat.bounced = true; cat.vx = -cat.face * 240; cat.pounce = 0;
          const lost = carriedFlies()[0];
          if (lost) scatterFly(lost, true);
          float(m.x, m.y - 56, lost ? 'Too quick! A firefly flew away' : 'Too quick! Calm needs gentle light', CALM); tone(300, .2, 'sine', .04, -100);
        }
        continue;
      }
      if (m.type === 'L') {
        hideFeeling(m);
        float(cat.x, cat.y - 70, 'Too fast. It hid again', BLUE); tone(300, .2, 'sine', .04, -100);
        continue;
      }
      if (m.type === 'N' && m.state !== 'wander') continue;
      if (m.type === 'E' && !m.apex) {
        if (!cat.bounced) { cat.bounced = true; cat.vx = -cat.face * 260; cat.pounce = 0; float(m.x, m.y - 40, 'Too bouncy! Catch it at the top', EXC); sfx('moodling', 'E'); }
        continue;
      }
      if (m.type === 'S' && (m.state === 'look' || m.state === 'hide')) {
        if (m.state === 'look') { m.state = 'hide'; m.st = 2.2; float(m.x, m.y - 40, 'It saw you coming!', SHY); sfx('moodling', 'S'); }
        continue;
      }
      if (m.type === 'J' && m.state === 'flee') {
        if (!cat.bounced) { cat.bounced = true; cat.vx = -cat.face * 240; cat.pounce = 0; float(m.x, m.y - 40, 'Too fast! Wait until it is tired', JEAL); tone(180, .12, 'square', .04); }
        continue;
      }
      if (m.type === 'J' && m.stolen && m.stolen.length) returnStolen(m);
      catchIt(m);
    }
  }

  function freeTick(dt) {
    freeT += dt;
    // a calm, steady number of feelings out in the night; never Golden, never a rush
    const pop = mood.filter(m => m.type !== 'G').length, want = 8;
    const lonely = mood.filter(m => m.type === 'L').length;
    if (pop < want && Math.random() < dt * 1.2) { const r = Math.random(); spawn(lonely < 2 && r < .2 ? 'L' : r > .7 ? ['E', 'S', 'J', 'C'][Math.floor(Math.random() * 4)] : Math.random() < .5 ? 'N' : 'F'); }
  }
  function update(dt) {
    t += dt;
    shake = Math.max(0, shake - dt * 24);
    updateLevelPlatforms(dt);
    updCat(dt);
    if (cat.falling || cat.respawning) {
      for (const p of parts) { p.life -= dt; p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .98; }
      parts = parts.filter(p => p.life > 0);
      for (const f of floats) { f.life -= dt; f.y -= 40 * dt; }
      floats = floats.filter(f => f.life > 0);
      if (banner) { banner.life -= dt; if (banner.life <= 0) banner = null; }
      const target = clamp(cat.x - VW * .36, 0, Math.max(0, WORLD - VW));
      camX += (target - camX) * Math.min(1, dt * 6);
      return;
    }
    const last = hist[hist.length - 1];
    if (!last || Math.hypot(last.x - cat.x, last.y - cat.y) > 3) { hist.push({ x: cat.x, y: cat.y }); if (hist.length > 500) hist.shift(); }
    if (purrQ && upg.purr > 0 && purrCd <= 0) {
      purrT = purrDur(); purrCd = uv('purr');
      float(cat.x, cat.y - 70, 'Purrr…', '#c8ff8a'); sfx('cat', 'purr');
    }
    purrQ = false; purrT = Math.max(0, purrT - dt); purrCd = Math.max(0, purrCd - dt);
    if (eyesQ && eyesCd <= 0) { eyesT = eyesDur(); eyesCd = 9; onTutorialAction('eyes', cat); if (window.TCSfx) sfx('ui', 'eyes'); else tone(740, .25, 'sine', .05, 300); }
    eyesQ = false; eyesT = Math.max(0, eyesT - dt); eyesCd = Math.max(0, eyesCd - dt);
    scratchAnim = Math.max(0, scratchAnim - dt);
    checkScratchProximity();
    if (scratchQ) performScratch();
    scratchQ = false;
    if (activeItems.sand && state === 'play' && t > 2.6) { activeItems.sand = false; burst(cat.x - cat.face * 8, cat.y - 50, GOLD, 14); float(cat.x, cat.y - 78, '⏳ The sand poured into your clock', GOLD); }
    for (const m of mood) updMood(m, purrT > 0 && Math.abs(m.x - cat.x) < 6 * T ? dt * .4 : dt);
    updFireflies(dt);
    updHazards(dt); updTrinkets(dt); updPortal(dt);
    checkCatches();
    mood = mood.filter(m => !m.dead);
    for (const r of respawnQ) r.at -= dt;
    respawnQ = respawnQ.filter(r => { if (r.at <= 0) { spawn(r.type); return false; } return true; });
    if (comboT > 0) { comboT -= dt; if (comboT <= 0) { combo = 0; sfx('ui', 'comboLost'); } }
    updateGuidance(dt);
    if (state === 'play') {
      if (mode === 'story') warmup = Math.max(0, warmup - dt);
      if (warmup <= 0 && !guidanceTimerPaused() && mode !== 'free') timeLeft -= dt;
      if (mode === 'free') freeTick(dt);
      const chapter = mode === 'story' ? chapterFor(storyNight) : null;
      if (mode === 'story') maybeSpawnSky();
      if (mode !== 'free' && chapter.goldensAllowed > 0) {
        if (!goldDone.a && timeLeft <= 62 && (mode === 'free' || chapter.goldensAllowed >= 1)) { goldDone.a = true; spawn('G', clamp(cat.x + (Math.random() < .5 ? -1 : 1) * 320, 120, WORLD - 120)); sfx('moodling', 'G'); announce('A golden Moodling appeared!', GOLD); tone(1046, .3, 'sine', .06); }
        if (!goldDone.b && timeLeft <= 28 && (mode === 'free' || chapter.goldensAllowed >= 2)) { goldDone.b = true; spawn('G', clamp(cat.x + (Math.random() < .5 ? -1 : 1) * 320, 120, WORLD - 120)); sfx('moodling', 'G'); announce('Golden Moodling! Catch it!', GOLD); tone(1046, .3, 'sine', .06); }
      }
      if (!chaos && mode !== 'free' && timeLeft <= 15 && chapter.chaosWave) {
        chaos = true;
        const wave = mode === 'free' ? { F: 1, N: 2 } : chapter.chaosSize;
        for (const [type, count] of Object.entries(wave || {})) for (let i = 0; i < count; i++) spawn(type);
        announce('Last 15 seconds!', RED, 1.6);
      }
      const sec = Math.ceil(timeLeft);
      if (sec <= 10 && sec < lastTick) { lastTick = sec; if (window.TCSfx) sfx('ui', sec <= 3 ? 'urgent' : 'countdown'); else tone(sec <= 3 ? 1200 : 880, .06, 'square', .03); }
      if (mode !== 'free' && timeLeft <= 0 && !pendingFallFail) { timeLeft = 0; if (allHome) beginStoryEnding(); else { sfx('ui', 'timeup'); finish(false); } }
    } else if (state === 'ending') {
      endT -= dt; if (endT <= 0) finish(true);
    }
    // trail follow
    trail.forEach((l, i) => {
      const idx = Math.max(0, hist.length - 1 - (i + 1) * 9), h = hist[idx] || cat;
      const tx = h.x, ty = h.y - 34 - Math.sin(t * 4 + i) * 4;
      l.x += (tx - l.x) * Math.min(1, dt * 8); l.y += (ty - l.y) * Math.min(1, dt * 8);
    });
    for (const p of parts) { p.life -= dt; p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .98; }
    parts = parts.filter(p => p.life > 0);
    for (const f of floats) { f.life -= dt; f.y -= 40 * dt; }
    floats = floats.filter(f => f.life > 0);
    if (banner) { banner.life -= dt; if (banner.life <= 0) banner = null; }
    const target = clamp(cat.x - VW * .36, 0, Math.max(0, WORLD - VW));
    camX += (target - camX) * Math.min(1, dt * 6);
    scratchSpots = scratchSpots.filter(spot => !spot.used || t - spot.usedAt < 1.3);
  }

  function checkScratchProximity() {
    scratchTarget = null;
    const skyChallenge = mood.find(m => !m.dead && m.sky && m.skyFeature === 'C' && m.skyPhase === 'scratchReq');
    if (skyChallenge) {
      const walkedAway = Math.abs(cat.x - skyChallenge.skyAnchorX) > 120 || Math.abs(cat.x - skyChallenge.x) > 165;
      if (walkedAway) failSkyChallenge(skyChallenge); else scratchTarget = { type: 'sky', mood: skyChallenge };
      $('#bScratch').hidden = !scratchTarget || touchUI.hidden;
      return scratchTarget;
    }
    const breathCalm = mood.find(m => !m.dead && m.type === 'C' && m.v === 1 && m.state === 'bubble' && nearBreath(m));
    if (breathCalm) { scratchTarget = { type: 'breath', mood: breathCalm }; $('#bScratch').hidden = touchUI.hidden; return scratchTarget; }
    let best = 74;
    const reachableHeight = Math.abs(cat.y - terrainY(cat.x)) <= 115;
    for (const m of mood) {
      if (!reachableHeight) break;
      if (m.dead || !m.spot || m.state !== 'hide' || m.spot.used) continue;
      const d = Math.hypot(cat.x - m.spot.x, Math.max(0, Math.abs(cat.y - m.spot.y) - 12));
      if (d < best) { best = d; scratchTarget = m; }
    }
    if (need.B > 0 || rocks.some(r => r.keepsake)) for (const rock of rocks) { if (rock.scratched || Math.abs(cat.y - rock.y) > 115) continue; const d = Math.hypot(cat.x - rock.x, Math.max(0, Math.abs(cat.y - rock.y) - 12)); if (d < best) { best = d; scratchTarget = { kind: 'rock', rock }; } }
    if (nightGuide.active && (guideCopy().tutorial || [])[nightGuide.step]?.action === 'scratch' && reachableHeight) {
      const x = tutorialSpotX(); if (Math.abs(cat.x - x) <= 74) scratchTarget = { kind: 'tutorial', x, y: terrainY(x) };
    }
    $('#bScratch').hidden = !scratchTarget || touchUI.hidden;
    return scratchTarget;
  }
  function performScratch() {
    if (scratchTarget?.kind === 'tutorial') {
      const target = scratchTarget; if (!cat.on || Math.abs(cat.y - target.y) > 115 || Math.abs(cat.x - target.x) > 76) return false;
      cat.vx = 0; cat.walk = 0; scratchAnim = .58; sfx('ui', 'scratch'); burst(target.x, target.y - 18, GOLD, 14); float(target.x, target.y - 58, 'A little light was hiding here', GOLD); tone(520, .18, 'triangle', .07, 300);
      onTutorialAction('scratch', target); scratchTarget = null; return true;
    }
    if (scratchTarget?.type === 'breath') return false;
    if (scratchTarget?.type === 'sky') {
      const m = scratchTarget.mood;
      if (!m || m.dead || m.skyPhase !== 'scratchReq') { if (m) failSkyChallenge(m); return false; }
      if (Math.abs(cat.x - m.skyAnchorX) > 120 || Math.abs(cat.x - m.x) > 165) { failSkyChallenge(m); scratchTarget = null; return false; }
      m.skyPhase = 'scratched'; m.skyTimer = 0; m.scratchNeed = 0; m.skyVY = Math.max(260, chapterFor(storyNight).sky.fallSpeed * 2); sfx('ui', 'scratch');
      scratchAnim = .45; scratchTarget = null; burst(m.x, m.y, RED, 16); float(m.x, m.y - 58, 'Scratched! Let it land', RED); tone(520, .18, 'triangle', .07, 300);
      return true;
    }
    const activeSkyChallenge = mood.find(m => !m.dead && m.sky && m.skyFeature === 'C' && m.skyPhase === 'scratchReq');
    if (activeSkyChallenge) { failSkyChallenge(activeSkyChallenge); return false; }
    if (scratchTarget?.kind === 'rock') {
      const rock = scratchTarget.rock; if (!rock || rock.scratched || !cat.on || Math.abs(cat.y - rock.y) > 115) return false;
      rock.scratched = true; rock.holeDepth = 0; scratchAnim = .8; shake = Math.max(shake, rock.marked ? 0 : 10); sfx('ui', 'scratch');
      if (rock.marked) { const m = mood.find(x => x.type === 'B' && !x.dead); if (m) { m.state = 'scratching'; m.st = .8; m.rock = rock; } burst(rock.x, rock.y - 22, rock.debris?.[0]?.color || '#8a6a45', 12); float(rock.x, rock.y - 68, 'Something was buried here.', '#a67646'); tone(190 + Math.random() * 40, .12, 'triangle', .03, 100); }
      else if (rock.keepsake) { rock.keepsake = false; rock.holeDepth = 1; burst(rock.x, rock.y - 22, rock.debris?.[0]?.color || '#8a6a45', 12); collectKeepsake(`n${storyNight}-dig`, rock.x, rock.y - 30); }
      else { rock.wrongUsed = true; tone(80, .5, 'sawtooth', .09, -40); announce('The ground rumbles…', RED, 2); triggerBuriedAmbush(); }
      scratchTarget = null; return true;
    }
    const m = scratchTarget;
    if (!m || m.dead || m.state !== 'hide' || !m.spot || m.spot.used || !cat.on || Math.abs(cat.y - m.spot.y) > 115) return false;
    m.state = 'scratching'; m.st = .58; m.spot.scratching = true; m.spot.scratchAt = t; m.sit = 0; scratchAnim = .58; sfx('ui', 'scratch');
    cat.vx = 0; cat.walk = 0;
    const dirt = m.spot.kind === 'leaf pile' ? '#c78d57' : m.spot.kind === 'under bush' ? '#7ea66a' : '#b99a70';
    for (let i = 0; i < 12; i++) parts.push({ x: m.x + (Math.random() - .5) * 30, y: m.spot.y - 7, vx: (Math.random() - .5) * 130, vy: -55 - Math.random() * 95, life: .45 + Math.random() * .25, max: .7, c: dirt, r: 2 + Math.random() * 2.5, g: 260 });
    tone(190 + Math.random() * 40, .12, 'triangle', .03, 100);
    return true;
  }

  // ---------- drawing ----------
  function star(x, y, n, r1, r2, rot) {
    ctx.beginPath();
    for (let i = 0; i < n * 2; i++) { const r = i % 2 ? r2 : r1, a = rot + i * Math.PI / n; ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); }
    ctx.closePath();
  }
  function zig(x, y, r, wob) {
    ctx.beginPath();
    const n = 14;
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, rr = (i % 2 ? r * .66 : r) + Math.sin(t * 9 + i) * wob; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    ctx.closePath();
  }
  function tear(x, y, r) {
    ctx.beginPath(); ctx.moveTo(x, y - r * 1.7);
    ctx.bezierCurveTo(x + r * 1.1, y - r * .4, x + r, y + r, x, y + r);
    ctx.bezierCurveTo(x - r, y + r, x - r * 1.1, y - r * .4, x, y - r * 1.7);
    ctx.closePath();
  }
  function drawRare(m) {
    const k = m.type + m.v;
    for (let i = 0; i < 3; i++) { const a = t * 2 + i * 2.09; ctx.fillStyle = '#fff6d6'; star(m.x + Math.cos(a) * 30, m.y + Math.sin(a) * 22, 4, 4.5, 1.4, 0); ctx.fill(); }
    if (k === 'F1') {
      ctx.fillStyle = 'rgba(120,110,150,.9)'; ctx.beginPath(); ctx.arc(m.x - 8, m.y - 40, 8, 0, 7); ctx.arc(m.x + 4, m.y - 43, 10, 0, 7); ctx.arc(m.x + 14, m.y - 39, 7, 0, 7); ctx.fill();
      if (Math.sin(t * 7) > .85) { ctx.strokeStyle = GOLD; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(m.x + 2, m.y - 33); ctx.lineTo(m.x - 3, m.y - 25); ctx.lineTo(m.x + 3, m.y - 25); ctx.lineTo(m.x - 2, m.y - 16); ctx.stroke(); }
    } else if (k === 'L1') {
      ctx.fillStyle = INK; ctx.font = `800 13px ${DISP}`; ctx.textAlign = 'left'; ctx.fillText('z', m.x + 14, m.y - 18 - Math.sin(t * 2) * 3);
    } else if (k === 'L2') {
      ctx.strokeStyle = 'rgba(160,230,255,.8)'; ctx.lineWidth = 1.5;
      for (let i = 0; i < 4; i++) { const yy = ((t * 60 + i * 13) % 40); ctx.beginPath(); ctx.moveTo(m.x - 15 + i * 10, m.y - 34 + yy); ctx.lineTo(m.x - 16 + i * 10, m.y - 29 + yy); ctx.stroke(); }
    } else if (k === 'N1') {
      ctx.fillStyle = 'rgba(230,240,255,.85)'; for (let i = 0; i < 5; i++) { ctx.fillRect(m.x - 22 + ((i * 11 + t * 30) % 44), m.y + 18 + (i % 2) * 4, 2, 2); }
    }
    if (Math.abs(cat.x - m.x) < 6 * T) { ctx.font = `600 11px ${BODY}`; ctx.textAlign = 'center'; ctx.fillStyle = GOLD; ctx.fillText('RARE', m.x, m.y - (k === 'F1' ? 56 : 44)); }
  }
  // The little lights in Shwe's trail (and in the coming-home scene) are tiny versions of the real Moodlings,
  // so they look the same as in the Night Side and the Mood Book.
  const lightSprites = {};
  function lightSprite(type, v = 0) {
    const key = type + (v || 0); if (lightSprites[key]) return lightSprites[key];
    const c = document.createElement('canvas'); c.width = c.height = 120; const main = ctx; ctx = c.getContext('2d');
    try { drawCuteMood(type, 60, 64, .82, { ...moodLook(type, v), t: 0 }); } finally { ctx = main; }
    return (lightSprites[key] = c);
  }
  function lightShape(type, x, y, s, v) {
    const w = 40 * s; ctx.drawImage(lightSprite(type, v), x - w / 2, y - w / 2, w, w);
  }

  function drawBG() {
    if (inSchool()) { ctx.fillStyle = '#16122a'; ctx.fillRect(0, -OY, VW, VH + OY * 2); return; }
    if (inFestival()) { drawFestivalSky(); return; }
    if (inPark()) { ctx.fillStyle = '#1a1338'; ctx.fillRect(0, -OY, VW, VH + OY * 2); return; }
    if (inLake()) { drawLakeSky(); return; }
    if (inHill()) { drawHillSky(); return; }
    const y0 = -OY, h = VH + OY * 2;
    const sky = ctx.createLinearGradient(0, y0, 0, y0 + h);
    sky.addColorStop(0, '#0a1128'); sky.addColorStop(.55, '#14213c'); sky.addColorStop(1, '#1a2a4a');
    ctx.fillStyle = sky; ctx.fillRect(0, y0, VW, h);
    if (mode === 'story') { ctx.save(); ctx.globalAlpha = .11; ctx.fillStyle = chapterFor(storyNight).theme; ctx.fillRect(0, y0, VW, h); ctx.restore(); }
    const moonX = VW * .77 - (camX * .035 % (VW + 140)), moonY = 102 - OY * .12;
    const halo = ctx.createRadialGradient(moonX, moonY, 8, moonX, moonY, 115);
    halo.addColorStop(0, 'rgba(222,233,230,.2)'); halo.addColorStop(.38, 'rgba(164,193,211,.09)'); halo.addColorStop(1, 'rgba(128,164,196,0)');
    ctx.fillStyle = halo; ctx.fillRect(moonX - 120, moonY - 120, 240, 240);
    ctx.fillStyle = '#e3e8dc'; ctx.beginPath(); ctx.arc(moonX, moonY, 25, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(161,178,178,.34)'; [[-8,-7,4],[8,7,3],[-2,11,2]].forEach(([dx,dy,r]) => { ctx.beginPath(); ctx.arc(moonX+dx,moonY+dy,r,0,Math.PI*2); ctx.fill(); });
    for (let i = 0; i < 58; i++) {
      const x = ((i * 157.7 - camX * .075) % (VW + 24) + VW + 24) % (VW + 24) - 12;
      const y = 22 + (i * 67.3 % Math.max(80, VH * .49));
      ctx.globalAlpha = .28 + .55 * (.5 + .5 * Math.sin(t * (.7 + i % 5 * .11) + i));
      ctx.fillStyle = i % 7 === 0 ? '#c7dfdf' : '#e4e9f2'; ctx.beginPath(); ctx.arc(x, y, i % 11 === 0 ? 1.8 : .9, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    const mist = ctx.createLinearGradient(0, 300, 0, 460); mist.addColorStop(0, 'rgba(148,183,201,0)'); mist.addColorStop(1, 'rgba(148,183,201,.13)');
    ctx.fillStyle = mist; ctx.fillRect(0, 280, VW, 190);
  }
  function drawParallaxLayer(layerIndex, scrollSpeed) {
    const px = camX * scrollSpeed, left = Math.floor(px / 360) * 360 - 720, right = px + VW + 720;
    ctx.save(); ctx.translate(camX * (1 - scrollSpeed), 0);
    if (layerIndex === 0) {
      ctx.save();
      ctx.fillStyle = '#294763'; ctx.beginPath(); ctx.moveTo(left, GROUND);
      for (let x = left; x < right; x += 420) {
        const peak = 96 + Math.sin(x * .0024) * 25 + Math.sin(x * .006) * 10;
        ctx.lineTo(x + 32, peak + 136);
        ctx.bezierCurveTo(x + 76, peak + 72, x + 118, peak + 8, x + 174, peak);
        ctx.bezierCurveTo(x + 220, peak + 1, x + 263, peak + 82, x + 307, peak + 112);
        ctx.lineTo(x + 420, GROUND);
      }
      ctx.lineTo(right, GROUND); ctx.closePath(); ctx.fill(); ctx.restore();
      ctx.strokeStyle = 'rgba(174,199,211,.58)'; ctx.lineWidth = 2; ctx.beginPath();
      for (let x = left; x < right; x += 420) { const peak = 96 + Math.sin(x * .0024) * 25 + Math.sin(x * .006) * 10; ctx.moveTo(x+150,peak+24);ctx.lineTo(x+174,peak+2);ctx.lineTo(x+188,peak+24);ctx.moveTo(x+166,peak+12);ctx.lineTo(x+175,peak+4);ctx.lineTo(x+184,peak+14); }
      ctx.stroke();
      ctx.fillStyle = '#203954'; ctx.beginPath(); ctx.moveTo(left, GROUND);
      for (let x = left; x < right; x += 360) {
        const peak = 197 + Math.sin(x * .0033 + 1.2) * 29;
        ctx.lineTo(x+26,peak+107);ctx.bezierCurveTo(x+72,peak+62,x+99,peak-3,x+151,peak);
        ctx.bezierCurveTo(x+205,peak+4,x+230,peak+75,x+286,peak+103);ctx.lineTo(x+360,GROUND);
      }
      ctx.lineTo(right,GROUND);ctx.closePath();ctx.fill();
      const fog = ctx.createLinearGradient(0, 325, 0, GROUND); fog.addColorStop(0, 'rgba(145,177,195,0)'); fog.addColorStop(1, 'rgba(145,177,195,.13)'); ctx.fillStyle = fog; ctx.fillRect(left, 325, right-left, GROUND-325);
    } else if (layerIndex === 1) {
      for (let x = left; x < right; x += 360) {
        const ridge = 270 + Math.sin(x * .0031) * 28;
        ctx.fillStyle = x % 2 ? '#344b58' : '#2d414f'; ctx.beginPath(); ctx.moveTo(x,GROUND);ctx.lineTo(x,ridge+76);
        ctx.lineTo(x+48,ridge+38);ctx.lineTo(x+73,ridge+43);ctx.lineTo(x+111,ridge-7);
        ctx.lineTo(x+148,ridge+7);ctx.lineTo(x+186,ridge-61);ctx.lineTo(x+211,ridge-76);
        ctx.lineTo(x+238,ridge-24);ctx.lineTo(x+275,ridge+2);ctx.lineTo(x+318,ridge-13);
        ctx.lineTo(x+360,ridge+62);ctx.lineTo(x+360,GROUND);ctx.closePath();ctx.fill();
        ctx.strokeStyle='rgba(174,193,184,.43)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+108,ridge-5);ctx.lineTo(x+148,ridge+7);ctx.lineTo(x+185,ridge-59);ctx.lineTo(x+211,ridge-74);ctx.lineTo(x+237,ridge-22);ctx.stroke();
        ctx.strokeStyle='rgba(11,23,31,.65)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+81,ridge+50);ctx.lineTo(x+94,ridge+81);ctx.lineTo(x+87,ridge+110);ctx.moveTo(x+268,ridge+16);ctx.lineTo(x+250,ridge+58);ctx.stroke();
        ctx.fillStyle='rgba(67,103,69,.8)';ctx.beginPath();ctx.ellipse(x+139,ridge+2,25,5,-.08,0,Math.PI*2);ctx.ellipse(x+305,ridge+3,19,4,.08,0,Math.PI*2);ctx.fill();
      }
      const treeStart = Math.floor(left / 176) * 176;
      for (let x = treeStart; x < right; x += 176) {
        const base = 416 + Math.sin(x * .03) * 9, ht = 42 + (Math.abs(Math.sin(x * .017)) * 31);
        ctx.fillStyle = '#0f1a25'; ctx.beginPath(); ctx.moveTo(x,base-ht); ctx.lineTo(x-18,base-ht*.56); ctx.lineTo(x-10,base-ht*.58); ctx.lineTo(x-27,base-ht*.25); ctx.lineTo(x-13,base-ht*.29); ctx.lineTo(x-34,base); ctx.lineTo(x+34,base); ctx.lineTo(x+13,base-ht*.29); ctx.lineTo(x+27,base-ht*.25); ctx.lineTo(x+10,base-ht*.58); ctx.lineTo(x+18,base-ht*.56); ctx.closePath(); ctx.fill();
        ctx.fillRect(x-3,base-5,6,9);
      }
      for (let x = left + 250; x < right; x += 760) {
        const y = 300 + Math.sin(x * .01) * 40;
        const water = ctx.createLinearGradient(x,y,x+16,GROUND); water.addColorStop(0,'rgba(172,217,222,.5)'); water.addColorStop(.6,'rgba(128,186,202,.21)'); water.addColorStop(1,'rgba(166,210,204,0)');
        ctx.fillStyle = water; ctx.beginPath(); ctx.moveTo(x,y); ctx.bezierCurveTo(x+12,y+42,x-8,y+91,x+8,y+140); ctx.bezierCurveTo(x+19,y+205,x+2,GROUND-10,x+16,GROUND); ctx.lineTo(x+25,GROUND); ctx.lineTo(x+22,y); ctx.closePath(); ctx.fill();
        for(let k=0;k<3;k++){const mx=x+20+k*8+Math.sin(t*1.8+k)*4;ctx.globalAlpha=.22+.12*Math.sin(t*2+k);ctx.fillStyle='#c7e1df';ctx.beginPath();ctx.arc(mx,GROUND-5-k*3,2+k%2,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;
      }
    } else {
      ctx.fillStyle = 'rgba(12,23,31,.72)'; ctx.beginPath(); ctx.moveTo(left, GROUND);
      for(let x=left;x<right;x+=280){const y=438+Math.sin(x*.008)*12;ctx.lineTo(x,y+25);ctx.lineTo(x+31,y-3);ctx.lineTo(x+62,y+7);ctx.lineTo(x+105,y-25);ctx.lineTo(x+139,y-12);ctx.lineTo(x+181,y+11);ctx.lineTo(x+219,y-17);ctx.lineTo(x+248,y-8);ctx.lineTo(x+280,y+18);}
      ctx.lineTo(right,GROUND);ctx.closePath();ctx.fill();
      ctx.strokeStyle='rgba(123,146,145,.32)';ctx.lineWidth=2;for(let x=left;x<right;x+=280){const y=438+Math.sin(x*.008)*12;ctx.beginPath();ctx.moveTo(x+63,y+15);ctx.lineTo(x+104,y-16);ctx.lineTo(x+130,y-7);ctx.moveTo(x+185,y+16);ctx.lineTo(x+217,y-9);ctx.stroke();}
    }
    ctx.restore();
  }
  function drawScratchSpot(x, y, type, spot) {
    const kind = spot.kind;
    const visible = eyesT > 0 && Math.abs(cat.x - x) <= uv('eyes') * T;
    const near = Math.abs(cat.x - x) <= 5 * T;
    if (spot.used) { const fade = clamp(1 - (t - spot.usedAt) / 1.3, 0, 1); if (!fade) return; ctx.globalAlpha = fade; }
    if (visible) {
      const c = type === 'C' ? '#8fe7a0' : '#83cfff', pulse = .75 + .25 * Math.sin(t * 4 + spot.phase);
      const glow = ctx.createRadialGradient(x,y-10,3,x,y-10,52); glow.addColorStop(0, type === 'C' ? `rgba(123,230,145,${.31*pulse})` : `rgba(102,193,255,${.32*pulse})`); glow.addColorStop(1,'rgba(110,190,230,0)');
      ctx.fillStyle=glow;ctx.beginPath();ctx.ellipse(x,y-10,52,34,0,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle=c;ctx.globalAlpha*=.7;ctx.setLineDash([2,6]);ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,y-7,23,12,0,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=spot.used?clamp(1-(t-spot.usedAt)/1.3,0,1):1;
      for(let k=0;k<3;k++){const a=t*1.4+k*2.1+spot.phase;ctx.fillStyle=c;ctx.globalAlpha*=.72;ctx.beginPath();ctx.arc(x+Math.cos(a)*29,y-17+Math.sin(a)*13,1.6,0,Math.PI*2);ctx.fill();ctx.globalAlpha=spot.used?clamp(1-(t-spot.usedAt)/1.3,0,1):1;}
    }
    if(kind==='loose dirt'){
      const g=ctx.createLinearGradient(x,y-19,x,y+2);g.addColorStop(0,'#685340');g.addColorStop(1,'#382f2d');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(x-25,y);ctx.bezierCurveTo(x-20,y-13,x-10,y-16,x-4,y-18);ctx.bezierCurveTo(x+8,y-22,x+20,y-11,x+25,y);ctx.closePath();ctx.fill();
      ctx.fillStyle='#8b7354';for(let k=0;k<5;k++){ctx.beginPath();ctx.ellipse(x-16+k*8,y-5-(k%2)*4,3,1.5,-.3,0,Math.PI*2);ctx.fill();}
    }else if(kind==='cracked rock'){
      ctx.fillStyle='#35434a';ctx.beginPath();ctx.moveTo(x-25,y);ctx.lineTo(x-18,y-12);ctx.lineTo(x-6,y-19);ctx.lineTo(x+9,y-16);ctx.lineTo(x+24,y-5);ctx.lineTo(x+27,y);ctx.closePath();ctx.fill();
      ctx.strokeStyle='#b7a891';ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(x-3,y-17);ctx.lineTo(x+2,y-10);ctx.lineTo(x-4,y-6);ctx.lineTo(x+5,y-1);ctx.stroke();
      ctx.strokeStyle='rgba(12,20,28,.8)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x-3,y-17);ctx.lineTo(x+2,y-10);ctx.lineTo(x-4,y-6);ctx.lineTo(x+5,y-1);ctx.stroke();
    }else if(kind==='leaf pile'){
      const cols=['#a85f40','#d18a4b','#8b6746','#b77943'];for(let k=0;k<7;k++){const dx=(k-3)*6,dy=(k%3)*-3;ctx.fillStyle=cols[k%cols.length];ctx.beginPath();ctx.ellipse(x+dx,y-4+dy,8,3.7,(k-3)*.19,0,Math.PI*2);ctx.fill();ctx.strokeStyle='rgba(60,42,32,.55)';ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(x+dx-4,y-4+dy);ctx.lineTo(x+dx+4,y-4+dy);ctx.stroke();}
    }else{
      ctx.fillStyle='#263e30';ctx.beginPath();ctx.moveTo(x-30,y);ctx.bezierCurveTo(x-27,y-22,x-10,y-29,x-2,y-13);ctx.bezierCurveTo(x+8,y-31,x+26,y-23,x+30,y);ctx.closePath();ctx.fill();
      for(let k=0;k<5;k++){const a=k/4*Math.PI;ctx.strokeStyle='#547856';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x-19+k*9,y-3);ctx.quadraticCurveTo(x-12+k*7,y-14-(k%2)*5,x-8+k*7,y-20);ctx.stroke();}
    }
    if(spot.scratching){ctx.strokeStyle=spot.moodType==='C'?'#a5edac':'#a7dcff';ctx.lineWidth=2.3;ctx.lineCap='round';for(let k=0;k<3;k++){const sx=x-10+k*10,sw=Math.sin((t-spot.scratchAt)*25+k)*4;ctx.beginPath();ctx.moveTo(sx-4,y-28+sw);ctx.lineTo(sx+4,y-21+sw);ctx.stroke();}}
    if(near && !spot.used){
      const py=y-43-Math.sin(t*3+spot.phase)*2;ctx.save();ctx.globalAlpha=.36+.35*(.5+.5*Math.sin(t*4+spot.phase));ctx.fillStyle='#f4f1de';
      [[-5,0,2.5],[5,0,2.5],[-7,-6,2],[0,-8,2],[7,-6,2]].forEach(([dx,dy,r])=>{ctx.beginPath();ctx.arc(x+dx,py+dy,r,0,Math.PI*2);ctx.fill();});ctx.restore();
    }
    ctx.globalAlpha=1;
  }
  function hexRgba(hex, alpha) {
    const value = (hex || '#a67646').replace('#', '');
    const full = value.length === 3 ? value.split('').map(c => c + c).join('') : value;
    const n = parseInt(full, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
  }
  function drawClassicRockBase(x, y) {
    const stones = [[-28,0,30,24,'#4a4340'],[0,-10,34,29,'#5c524a'],[28,2,29,23,'#6f645a'],[-9,6,23,18,'#514943']];
    for (const [dx,dy,rx,ry,c] of stones) { ctx.fillStyle=c; ctx.beginPath(); ctx.moveTo(x+dx-rx,y+dy); ctx.lineTo(x+dx-rx*.55,y+dy-ry); ctx.lineTo(x+dx+rx*.2,y+dy-ry*.8); ctx.lineTo(x+dx+rx,y+dy-ry*.25); ctx.lineTo(x+dx+rx*.72,y+dy); ctx.closePath(); ctx.fill(); ctx.strokeStyle='#8a8074'; ctx.lineWidth=1.4; ctx.beginPath(); ctx.moveTo(x+dx-rx*.5,y+dy-ry*.78); ctx.lineTo(x+dx+rx*.15,y+dy-ry*.58); ctx.lineTo(x+dx+rx*.48,y+dy-ry*.25); ctx.stroke(); }
  }
  function drawSchoolBurySpot(x, y, spot) {
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle='rgba(8,7,20,.34)'; ctx.beginPath(); ctx.ellipse(0,1,39,5,0,0,7); ctx.fill();
    if (spot.variant === 0) {
      ctx.save(); ctx.translate(-7,-8); ctx.rotate(-.10); ctx.fillStyle='#d7d7df'; ctx.fillRect(-29,-13,39,20); ctx.fillStyle='#f3e9cf'; ctx.fillRect(-25,-17,36,19); ctx.fillStyle='#b8a6cf'; ctx.fillRect(-22,-20,36,18); ctx.strokeStyle='#896f91'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(-5,-20); ctx.lineTo(-5,-2); ctx.stroke(); ctx.restore();
      ctx.fillStyle='#ffd98a'; ctx.beginPath(); ctx.moveTo(20,-17); ctx.lineTo(27,-14); ctx.lineTo(22,-7); ctx.lineTo(16,-11); ctx.closePath(); ctx.fill();
    } else if (spot.variant === 1) {
      ctx.strokeStyle='#49385b'; ctx.lineWidth=4; ctx.beginPath(); ctx.moveTo(-14,-31); ctx.quadraticCurveTo(0,-47,14,-31); ctx.stroke();
      ctx.fillStyle='#7860a0'; ctx.beginPath(); canvasRoundRect(ctx, -29,-34,58,34,10); ctx.fill(); ctx.fillStyle='#a48bc4'; ctx.beginPath(); canvasRoundRect(ctx, -20,-19,40,15,5); ctx.fill(); ctx.fillStyle='#d5c7e8'; ctx.fillRect(-3,-18,6,9);
      ctx.strokeStyle='#cdbb7d'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(30,-22); ctx.lineTo(37,-16); ctx.stroke(); ctx.fillStyle='#f3ca69'; ctx.beginPath(); ctx.arc(39,-13,4,0,7); ctx.fill();
    } else {
      ctx.fillStyle='#76543e'; ctx.fillRect(-34,-29,68,29); ctx.fillStyle='#a47a55'; ctx.fillRect(-38,-34,76,8); ctx.strokeStyle='#49352f'; ctx.lineWidth=2; ctx.strokeRect(-34,-29,68,29); ctx.fillStyle='#f2dfb6'; ctx.beginPath(); canvasRoundRect(ctx, -20,-24,40,14,3); ctx.fill(); ctx.fillStyle='#684c42'; ctx.fillRect(-14,-19,28,2); ctx.fillRect(-10,-15,20,2); ctx.fillStyle='#efb4ce'; ctx.fillRect(19,-34,10,7);
    }
    ctx.restore();
  }
  function drawRoofBurySpot(x, y, spot) {
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle='rgba(8,12,27,.38)'; ctx.beginPath(); ctx.ellipse(0,1,40,5,0,0,7); ctx.fill();
    if (spot.variant === 0) {
      for (const [dx,dy] of [[-23,-8],[0,-15],[19,-7]]) {
        ctx.fillStyle='#716674'; ctx.fillRect(dx-14,dy-13,28,14);
        ctx.strokeStyle='#c0a9a5'; ctx.lineWidth=1.5; ctx.beginPath();ctx.moveTo(dx-11,dy-10);ctx.lineTo(dx+10,dy-10);ctx.stroke();
      }
    } else if (spot.variant === 1) {
      ctx.fillStyle='#8e849e'; ctx.beginPath();canvasRoundRect(ctx,-34,-20,68,20,5);ctx.fill();
      ctx.fillStyle='#c7b8cd';ctx.fillRect(-25,-19,50,3);ctx.strokeStyle='#695d76';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-8,-17);ctx.lineTo(4,-2);ctx.stroke();
    } else {
      ctx.fillStyle='#765e5f';ctx.fillRect(-31,-25,62,25);ctx.fillStyle='#ac8b78';ctx.fillRect(-34,-27,68,5);
      for(let i=0;i<5;i++){ctx.strokeStyle='#d1b39b';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-25+i*12,-22);ctx.lineTo(-25+i*12,-3);ctx.stroke();}
    }
    ctx.restore();
  }
  function drawParkBurySpot(x, y, spot) {
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle='rgba(5,18,20,.32)'; ctx.beginPath(); ctx.ellipse(0,1,39,5,0,0,7); ctx.fill();
    if (spot.variant === 0 || spot.variant === 2) {
      const leafColors=spot.variant===0?['#9d7547','#c59a54','#6f9a59','#a76e55']:['#587748','#6f8e59','#9c6f56','#4f7650'];
      for (let i=0;i<7;i++) { const a=i*2.4, px=Math.cos(a)*22, py=-7-Math.abs(Math.sin(a))*15; ctx.fillStyle=leafColors[i%leafColors.length]; ctx.beginPath(); ctx.ellipse(px,py,12,5,a*.6,0,7); ctx.fill(); ctx.strokeStyle='rgba(236,222,168,.42)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(px-7,py); ctx.lineTo(px+7,py); ctx.stroke(); }
      if (spot.variant === 2) { for(let i=0;i<5;i++){const fx=-24+i*12,fy=-23-(i%2)*7;ctx.strokeStyle='#5e805c';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(fx,fy+13);ctx.lineTo(fx,fy);ctx.stroke();ctx.fillStyle=['#f5a6cc','#ffe18b','#bda9ff'][i%3];for(let k=0;k<4;k++){const a=k*Math.PI/2;ctx.beginPath();ctx.ellipse(fx+Math.cos(a)*4,fy+Math.sin(a)*4,3,2,a,0,7);ctx.fill();}ctx.fillStyle='#f5d47e';ctx.beginPath();ctx.arc(fx,fy,2,0,7);ctx.fill();} }
    } else {
      ctx.fillStyle='#9a7651'; ctx.beginPath(); ctx.moveTo(-36,0); ctx.quadraticCurveTo(-28,-27,0,-28); ctx.quadraticCurveTo(28,-25,37,0); ctx.closePath(); ctx.fill(); ctx.fillStyle='#c29a6c'; ctx.beginPath(); ctx.ellipse(0,-17,26,7,0,0,7); ctx.fill();
      for(let i=0;i<7;i++){const sx=-25+i*8;ctx.fillStyle=i%2?'#dfc28d':'#aa875f';ctx.beginPath();ctx.arc(sx,-16-Math.abs(Math.sin(i*2))*5,1.2,0,7);ctx.fill();}
    }
    ctx.restore();
  }
  function drawFestivalBurySpot(x, y, spot) {
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle='rgba(18,9,20,.35)'; ctx.beginPath(); ctx.ellipse(0,1,40,5,0,0,7); ctx.fill();
    if (spot.variant === 0) {
      for(const [bx,by,w,h] of [[-18,-23,34,22],[15,-17,28,16]]) { ctx.fillStyle='#9d6747';ctx.beginPath();ctx.moveTo(bx-w/2,by-h);ctx.lineTo(bx+w/2,by-h);ctx.lineTo(bx+w*.42,by);ctx.quadraticCurveTo(bx,by+5,bx-w*.42,by);ctx.closePath();ctx.fill();ctx.fillStyle='#d3a76a';ctx.beginPath();ctx.ellipse(bx,by-h,w/2,5,0,0,7);ctx.fill();ctx.strokeStyle='rgba(237,194,125,.8)';ctx.lineWidth=1;for(let k=-1;k<=1;k++){ctx.beginPath();ctx.moveTo(bx+k*7,by-h+2);ctx.lineTo(bx+k*6,by-2);ctx.stroke();}ctx.beginPath();ctx.moveTo(bx-w*.4,by-h*.48);ctx.lineTo(bx+w*.4,by-h*.48);ctx.stroke();}
    } else if (spot.variant === 1) {
      for(const [px,py,r,c] of [[-19,-13,15,'#a85d52'],[9,-11,18,'#8e514d'],[22,-7,12,'#bb755d']]) {ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(px-r,py-2);ctx.quadraticCurveTo(px-r,py-r,px,py-r);ctx.quadraticCurveTo(px+r,py-r,px+r,py-2);ctx.quadraticCurveTo(px+r,py+r,px,py+r);ctx.quadraticCurveTo(px-r,py+r,px-r,py-2);ctx.closePath();ctx.fill();ctx.fillStyle='#d89577';ctx.beginPath();ctx.ellipse(px,py-r+2,r*.55,3,0,0,7);ctx.fill();ctx.fillStyle='rgba(56,29,34,.5)';ctx.beginPath();ctx.ellipse(px,py+1,r*.45,2,0,0,7);ctx.fill();}
    } else {
      ctx.fillStyle='#9d704c'; ctx.beginPath(); canvasRoundRect(ctx, -37,-20,74,18,3); ctx.fill(); ctx.strokeStyle='#d0aa73';ctx.lineWidth=1.4;for(let xx=-28;xx<38;xx+=8){ctx.beginPath();ctx.moveTo(xx,-19);ctx.lineTo(xx,-3);ctx.stroke();}for(let yy=-15;yy<-2;yy+=6){ctx.beginPath();ctx.moveTo(-35,yy);ctx.lineTo(35,yy);ctx.stroke();}
      for(const [lx,ly,c] of [[-20,-41,'#ffb569'],[20,-45,'#ffc7a2']]) {ctx.strokeStyle='#765249';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(lx,ly-7);ctx.lineTo(lx,ly-1);ctx.stroke();ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(lx-7,ly);ctx.lineTo(lx+7,ly);ctx.lineTo(lx+5,ly+17);ctx.lineTo(lx-5,ly+17);ctx.closePath();ctx.fill();ctx.strokeStyle='#8f554e';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(lx-6,ly+5);ctx.lineTo(lx+6,ly+5);ctx.moveTo(lx-5,ly+12);ctx.lineTo(lx+5,ly+12);ctx.stroke();ctx.fillStyle='#8f554e';ctx.fillRect(lx-2,ly+17,4,3);}
    }
    ctx.restore();
  }
  function drawHillBurySpot(x, y, spot) {
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle='rgba(9,7,25,.35)'; ctx.beginPath(); ctx.ellipse(0,1,38,5,0,0,7); ctx.fill();
    if (spot.variant === 0) {
      for(const [sx,sy,rx,ry,c] of [[-22,-5,20,16,'#4f5960'],[0,-12,23,21,'#59655d'],[22,-4,18,15,'#444f55']]){ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(sx,sy,rx,ry,-.08,Math.PI,Math.PI*2);ctx.lineTo(sx+rx,0);ctx.lineTo(sx-rx,0);ctx.closePath();ctx.fill();ctx.fillStyle='#5b9b77';ctx.beginPath();ctx.ellipse(sx,sy-ry+4,rx*.6,3,0,0,7);ctx.fill();}
    } else if (spot.variant === 1) {
      ctx.strokeStyle='#79583e';ctx.lineWidth=9;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-34,-7);ctx.quadraticCurveTo(-5,-16,35,-32);ctx.stroke();ctx.strokeStyle='#b18a5e';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-25,-9);ctx.quadraticCurveTo(0,-16,30,-30);ctx.stroke();
      for(const [tx,ty,rot] of [[-21,-12,-.5],[4,-18,.3],[22,-28,-.3]]){ctx.save();ctx.translate(tx,ty);ctx.rotate(rot);ctx.fillStyle='#698c5b';ctx.beginPath();ctx.ellipse(0,0,10,4,0,0,7);ctx.fill();ctx.restore();}
    } else {
      const leafColors=['#73884f','#aa8054','#557a52','#9b694d'];
      for(let i=0;i<8;i++){const a=i*2.4,dx=Math.cos(a)*21,dy=-6-Math.abs(Math.sin(a))*12;ctx.fillStyle=leafColors[i%leafColors.length];ctx.beginPath();ctx.ellipse(dx,dy,11,4,(i-3)*.16,0,7);ctx.fill();ctx.strokeStyle='rgba(223,204,154,.4)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(dx-5,dy);ctx.lineTo(dx+5,dy);ctx.stroke();}
    }
    ctx.restore();
  }
  function drawLakeBurySpot(x, y, spot) {
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle='rgba(10,16,26,.32)'; ctx.beginPath(); ctx.ellipse(0,1,39,5,0,0,7); ctx.fill();
    if (spot.variant === 0) {
      ctx.fillStyle='#c4a078';ctx.beginPath();ctx.moveTo(-37,0);ctx.quadraticCurveTo(-24,-25,0,-27);ctx.quadraticCurveTo(24,-23,38,0);ctx.closePath();ctx.fill();ctx.fillStyle='#e1c397';ctx.beginPath();ctx.ellipse(0,-17,25,6,0,0,7);ctx.fill();
      for(const [sx,sy] of [[-18,-19],[17,-14]]){ctx.fillStyle='#f5dfbd';ctx.beginPath();ctx.ellipse(sx,sy,7,4,.2,0,7);ctx.fill();ctx.strokeStyle='#c18d73';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(sx-5,sy);ctx.quadraticCurveTo(sx,sy-4,sx+5,sy);ctx.stroke();}
    } else if (spot.variant === 1) {
      ctx.strokeStyle='#684a3b';ctx.lineWidth=12;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-38,-9);ctx.quadraticCurveTo(-7,-28,34,-18);ctx.stroke();ctx.strokeStyle='#a47a59';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-29,-12);ctx.quadraticCurveTo(-5,-25,27,-19);ctx.stroke();ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-12,-20);ctx.lineTo(-20,-31);ctx.moveTo(10,-20);ctx.lineTo(19,-29);ctx.stroke();
    } else {
      for(const [sx,sy,r,c] of [[-22,-5,12,'#626b72'],[-8,-13,13,'#82858a'],[8,-8,15,'#555e68'],[24,-4,10,'#9b9286']]){ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(sx,sy,r,r*.67,0,0,7);ctx.fill();ctx.strokeStyle='rgba(220,222,215,.45)';ctx.lineWidth=1;ctx.beginPath();ctx.arc(sx-r*.2,sy-r*.2,2,0,7);ctx.stroke();}
    }
    ctx.restore();
  }
  function drawBuryDebris(x, y, spot) {
    const pieces = spot.debris || [];
    if (!pieces.length) return;
    const positions = [[-43,-3,-.3],[43,-5,.4],[-30,-9,.7]];
    for (let i=0;i<positions.length;i++) {
      const [dx,dy,angle]=positions[i], piece=pieces[(i+spot.variant)%pieces.length];
      ctx.save();ctx.translate(x+dx,y+dy);ctx.rotate(angle);ctx.fillStyle=piece.color;ctx.strokeStyle=piece.color;ctx.lineWidth=1.5;
      if(piece.shape==='paper'){ctx.fillRect(-6,-4,12,8);ctx.strokeStyle='rgba(70,55,70,.38)';ctx.beginPath();ctx.moveTo(-3,-1);ctx.lineTo(4,-1);ctx.stroke();}
      else if(piece.shape==='leaf'||piece.shape==='petal'||piece.shape==='moss'||piece.shape==='sand'||piece.shape==='shell'||piece.shape==='chip'){ctx.beginPath();ctx.ellipse(0,0,piece.shape==='sand'?7:5,piece.shape==='sand'?2.5:3,0,0,7);ctx.fill();if(piece.shape==='leaf'||piece.shape==='shell'){ctx.beginPath();ctx.moveTo(-4,0);ctx.lineTo(4,0);ctx.stroke();}}
      else if(piece.shape==='straw'||piece.shape==='twig'){ctx.beginPath();ctx.moveTo(-7,2);ctx.lineTo(6,-2);ctx.moveTo(-4,-3);ctx.lineTo(3,3);ctx.stroke();}
      else if(piece.shape==='spark'){ctx.beginPath();ctx.moveTo(0,-6);ctx.lineTo(1.5,-1.5);ctx.lineTo(6,0);ctx.lineTo(1.5,1.5);ctx.lineTo(0,6);ctx.lineTo(-1.5,1.5);ctx.lineTo(-6,0);ctx.lineTo(-1.5,-1.5);ctx.closePath();ctx.fill();}
      else if(piece.shape==='splash'){ctx.beginPath();ctx.arc(0,0,5,Math.PI,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.arc(-4,-3,1.5,0,7);ctx.arc(4,-3,1.5,0,7);ctx.fill();}
      else {ctx.beginPath();ctx.arc(0,0,3,0,7);ctx.fill();}
      ctx.restore();
    }
  }
  function drawRockFormation(x, y, rock, moodHolding) {
    ctx.save();
    const pulse = .5 + .5 * Math.sin(t * 4 + rock.phase), markedGlow = eyesT > 0 && (rock.marked || rock.keepsake) && !rock.scratched && Math.abs(cat.x - x) <= uv('eyes') * T;
    const glow = rock.glow || '#a67646';
    if (markedGlow) { const g = ctx.createRadialGradient(x, y - 24, 3, x, y - 24, 66); g.addColorStop(0, hexRgba(glow,.35)); g.addColorStop(1, hexRgba(glow,0)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y - 24, 66, 0, 7); ctx.fill(); }
    (rock.draw || drawClassicRockBase)(x, y, rock, moodHolding);
    drawBuryDebris(x, y, rock);
    if (moodHolding && rock.marked && !rock.scratched) {
      ctx.strokeStyle = 'rgba(194,205,199,.9)'; ctx.lineWidth = 1.35; ctx.lineCap = 'round';
      for (let k = 0; k < 2; k++) { const age = (t * .32 + rock.phase * .1 + k * .5) % 1, rise = age * 18, drift = Math.sin(t * 1.2 + rock.phase + k * 2.2) * (2 + age * 2.5), sx = x + drift, sy = y - 39 - rise; ctx.globalAlpha = (Math.abs(cat.x - x) < 3 * T ? .42 : .17) * (1 - age); ctx.beginPath(); ctx.moveTo(sx, sy + 8); ctx.bezierCurveTo(sx - 3, sy + 5, sx + 4, sy + 3, sx + 1, sy); ctx.stroke(); }
      ctx.globalAlpha = 1;
    }
    if (rock.holeDepth > 0) { ctx.fillStyle=`rgba(12,13,16,${.55 + .3 * rock.holeDepth})`; ctx.beginPath(); ctx.ellipse(x, y - 4, 18, 9, 0, 0, 7); ctx.fill(); ctx.fillStyle=`rgba(166,118,70,${.45 * rock.holeDepth})`; ctx.beginPath(); ctx.arc(x, y - 7, 6, 0, 7); ctx.fill(); }
    if (markedGlow) { ctx.strokeStyle=hexRgba(glow,.55 + .35 * pulse); ctx.lineWidth=2; for (const off of [-13,2,15]) { ctx.beginPath(); ctx.moveTo(x+off,y-27); ctx.lineTo(x+off+4,y-18); ctx.lineTo(x+off-1,y-11); ctx.stroke(); } const py=y-53-Math.sin(t*3+rock.phase)*2; ctx.fillStyle=glow; [[-5,0,2.5],[5,0,2.5],[-7,-6,2],[0,-8,2],[7,-6,2]].forEach(([dx,dy,r])=>{ctx.beginPath();ctx.arc(x+dx,py+dy,r,0,7);ctx.fill();}); }
    ctx.restore();
  }
  function rockHoldsFeeling(rock) {
    return !!rock && rock.marked && !rock.scratched && mood.some(m => m.type === 'B' && !m.dead && m.state === 'buried' && m.rock === rock);
  }
  function drawMoonHollowWorld(x0,x1) {
    for(const x of caveXsForMap()){if(x<x0-100||x>x1+100)continue;
      ctx.save();ctx.translate(0,terrainY(x)-GROUND);
      ctx.fillStyle='#35444a';ctx.beginPath();ctx.moveTo(x-93,GROUND+4);ctx.bezierCurveTo(x-83,GROUND-43,x-65,GROUND-88,x-29,GROUND-83);ctx.bezierCurveTo(x-8,GROUND-103,x+13,GROUND-94,x+34,GROUND-79);ctx.bezierCurveTo(x+72,GROUND-79,x+88,GROUND-31,x+96,GROUND+4);ctx.closePath();ctx.fill();
      const glow=ctx.createRadialGradient(x,GROUND-38,2,x,GROUND-38,61);glow.addColorStop(0,'rgba(242,169,103,.19)');glow.addColorStop(.55,'rgba(182,133,100,.08)');glow.addColorStop(1,'rgba(150,120,99,0)');ctx.fillStyle=glow;ctx.fillRect(x-65,GROUND-102,130,115);
      ctx.fillStyle='#09131d';ctx.beginPath();ctx.moveTo(x-54,GROUND+3);ctx.bezierCurveTo(x-49,GROUND-45,x-38,GROUND-67,x-17,GROUND-69);ctx.bezierCurveTo(x-1,GROUND-83,x+19,GROUND-66,x+31,GROUND-64);ctx.bezierCurveTo(x+49,GROUND-51,x+54,GROUND-22,x+57,GROUND+3);ctx.closePath();ctx.fill();
      ctx.save();ctx.beginPath();ctx.moveTo(x-53,GROUND+2);ctx.bezierCurveTo(x-48,GROUND-44,x-37,GROUND-66,x-17,GROUND-68);ctx.bezierCurveTo(x-1,GROUND-81,x+18,GROUND-65,x+30,GROUND-63);ctx.bezierCurveTo(x+48,GROUND-50,x+53,GROUND-21,x+56,GROUND+2);ctx.closePath();ctx.clip();
      const inner=ctx.createRadialGradient(x,GROUND-26,2,x,GROUND-26,57);inner.addColorStop(0,'rgba(255,192,132,.3)');inner.addColorStop(.48,'rgba(196,143,112,.13)');inner.addColorStop(1,'rgba(94,84,78,0)');ctx.fillStyle=inner;ctx.fillRect(x-58,GROUND-86,116,92);ctx.restore();
      ctx.strokeStyle='rgba(171,190,177,.76)';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(x-61,GROUND-2);ctx.bezierCurveTo(x-56,GROUND-53,x-37,GROUND-84,x-20,GROUND-81);ctx.bezierCurveTo(x-2,GROUND-100,x+24,GROUND-83,x+37,GROUND-73);ctx.bezierCurveTo(x+54,GROUND-60,x+64,GROUND-27,x+62,GROUND-4);ctx.stroke();
      ctx.strokeStyle='rgba(107,139,113,.85)';ctx.lineWidth=2;for(let k=0;k<4;k++){const vx=x-38+k*24;ctx.beginPath();ctx.moveTo(vx,GROUND-72-(k%2)*7);ctx.bezierCurveTo(vx-7,GROUND-54,vx+5,GROUND-48,vx-3,GROUND-31);ctx.stroke();}
      ctx.fillStyle='#18232a';ctx.beginPath();ctx.moveTo(x-44,GROUND-63);ctx.lineTo(x-35,GROUND-40);ctx.lineTo(x-26,GROUND-61);ctx.closePath();ctx.moveTo(x+13,GROUND-62);ctx.lineTo(x+21,GROUND-38);ctx.lineTo(x+31,GROUND-57);ctx.closePath();ctx.fill();
      ctx.fillStyle='#59624f';ctx.beginPath();ctx.moveTo(x-70,GROUND+3);ctx.lineTo(x-57,GROUND-12);ctx.lineTo(x-45,GROUND+4);ctx.closePath();ctx.moveTo(x+45,GROUND+3);ctx.lineTo(x+57,GROUND-11);ctx.lineTo(x+73,GROUND+4);ctx.closePath();ctx.fill();
      ctx.restore();
    }
  }
  function drawFestivalSky() {
    const y0 = -OY, h = VH + OY * 2;
    const sky = ctx.createLinearGradient(0, y0, 0, 420);
    sky.addColorStop(0, '#1c0f40'); sky.addColorStop(1, '#4a2470');
    ctx.fillStyle = sky; ctx.fillRect(0, y0, VW, h);
    if (FEST_BACK.complete && FEST_BACK.naturalWidth) {
      const k = Math.max(VW * 1.14 / FEST_BACK.naturalWidth, 420 / FEST_BACK.naturalHeight);
      const w = FEST_BACK.naturalWidth * k, hh = FEST_BACK.naturalHeight * k;
      const pan = (w - VW) * clamp(camX / Math.max(1, WORLD - VW), 0, 1);
      ctx.drawImage(FEST_BACK, -pan, 420 - hh, w, hh);
    }
    // sky lanterns drifting up (small, dim, no faces, so never mistaken for Moodlings)
    for (let i = 0; i < 9; i++) {
      const sp = 7 + (i % 4) * 2.5, life = (t * sp + i * 61) % 470;
      const x = ((i * 173.3 - camX * .05) % (VW + 60) + VW + 60) % (VW + 60) - 30 + Math.sin(t * .4 + i) * 10;
      const y = 400 - life, a = Math.min(1, life / 60) * Math.min(1, (y + 30) / 90) * .55;
      if (a <= 0) continue;
      const lc = festCol(i);
      const g = ctx.createRadialGradient(x, y, 1, x, y, 14); g.addColorStop(0, `rgba(${lc},${a * .5})`); g.addColorStop(1, `rgba(${lc},0)`);
      ctx.fillStyle = g; ctx.fillRect(x - 14, y - 14, 28, 28);
      ctx.fillStyle = `rgba(${lc},${a + .2})`; ctx.fillRect(x - 2.5, y - 3.5, 5, 7);
    }
  }
  function drawFestivalWorld(x0, x1) {
    // middle layer: palm trees and tiered roofs, very dark, a few warm windows
    ctx.save(); const sp = .45; ctx.translate(camX * (1 - sp), 0);
    const px0 = camX * sp - 60, px1 = camX * sp + VW + 60;
    ctx.fillStyle = '#2b1550';
    for (let x = Math.floor(px0 / 230) * 230; x < px1; x += 230) {
      const seed = Math.abs(Math.sin(x * .013)), base = GROUND - 6;
      if (seed > .45) { // tiered roof pavilion
        const w = 100 + seed * 36, top = base - 70 - seed * 26;
        ctx.fillRect(x + 20, top + 40, w - 40, base - top - 40);
        for (let k = 0; k < 3; k++) { const ww = w - k * 26, yy = top + 40 - k * 22; ctx.beginPath(); ctx.moveTo(x + (w - ww) / 2 - 8, yy + 14); ctx.lineTo(x + w / 2, yy - 10); ctx.lineTo(x + (w + ww) / 2 + 8, yy + 14); ctx.closePath(); ctx.fill(); }
        ctx.fillRect(x + w / 2 - 2, top - 40, 4, 22);
        ctx.fillStyle = `rgba(${festCol(x / 230)},.55)`; ctx.fillRect(x + w / 2 - 9, top + 46, 6, 8); ctx.fillRect(x + w / 2 + 4, top + 46, 6, 8); ctx.fillStyle = '#2b1550';
      } else { // palm
        const tx = x + 60, ty = base - 120 - seed * 50;
        ctx.strokeStyle = '#2b1550'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(tx, base); ctx.quadraticCurveTo(tx + 14, (ty + base) / 2, tx + 6, ty); ctx.stroke();
        for (let k = 0; k < 8; k++) {
          const side = k % 2 ? 1 : -1, L = 26 + (k >> 1) * 11, droop = 18 + (k >> 1) * 13, cx = tx + 6;
          ctx.beginPath(); ctx.moveTo(cx, ty);
          ctx.quadraticCurveTo(cx + side * L * .6, ty - 10, cx + side * L, ty + droop);
          ctx.quadraticCurveTo(cx + side * L * .62, ty - 2, cx, ty + 4); ctx.closePath(); ctx.fill();
        }
      }
    }
    ctx.restore();
    // water
    const water = ctx.createLinearGradient(0, GROUND, 0, VH + OY + 60);
    water.addColorStop(0, '#3d2470'); water.addColorStop(1, '#12082a');
    ctx.fillStyle = water; ctx.fillRect(x0, GROUND, x1 - x0, VH + OY + 60 - GROUND);
    ctx.strokeStyle = 'rgba(214,180,255,.2)'; ctx.lineWidth = 1;
    for (let k = 0; k < 6; k++) { const yy = GROUND + 26 + k * 9; ctx.beginPath(); for (let x = Math.floor(x0 / 40) * 40; x < x1; x += 40) { const o = Math.sin(x * .03 + t * 1.3 + k) * 2; ctx.moveTo(x, yy + o); ctx.lineTo(x + 18, yy + o); } ctx.stroke(); }
    // floating lamps on the water
    for (let x = Math.floor(x0 / 290) * 290 + 140; x < x1; x += 290) {
      const fx = x + Math.sin(t * .3 + x) * 12, fy = GROUND + 44 + Math.sin(t * 1.4 + x * .01) * 2;
      const fc = festCol(x / 290);
      const g = ctx.createRadialGradient(fx, fy, 1, fx, fy, 24); g.addColorStop(0, `rgba(${fc},.45)`); g.addColorStop(1, `rgba(${fc},0)`);
      ctx.fillStyle = g; ctx.fillRect(fx - 24, fy - 24, 48, 48);
      ctx.fillStyle = '#4a2a5a'; ctx.fillRect(fx - 7, fy, 14, 4);
      ctx.fillStyle = `rgba(${fc},.95)`; ctx.fillRect(fx - 3, fy - 6, 6, 6);
      ctx.fillStyle = `rgba(${fc},.25)`; ctx.fillRect(fx - 2, fy + 6, 4, 22);
    }
    // posts + boardwalk
    ctx.fillStyle = '#24171f';
    for (let x = Math.floor(x0 / 120) * 120; x < x1; x += 120) ctx.fillRect(x + 50, GROUND + 10, 9, 46);
    const deck = ctx.createLinearGradient(0, GROUND - 2, 0, GROUND + 16);
    deck.addColorStop(0, '#b0805e'); deck.addColorStop(.3, '#7a5040'); deck.addColorStop(1, '#40243a');
    ctx.fillStyle = deck; ctx.fillRect(x0, GROUND - 2, x1 - x0, 18);
    ctx.strokeStyle = 'rgba(20,10,18,.55)'; ctx.lineWidth = 1;
    for (let x = Math.floor(x0 / 34) * 34; x < x1; x += 34) { ctx.beginPath(); ctx.moveTo(x, GROUND); ctx.lineTo(x, GROUND + 15); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,214,170,.35)'; ctx.fillRect(x0, GROUND - 2, x1 - x0, 1.5);
    // stalls (Lonely's hiding places) and the lantern strings between them
    const stallTop = x => GROUND - 152, caveXs = caveXsForMap();
    for (let i = 0; i < caveXs.length - 1; i++) {
      const a = caveXs[i], b = caveXs[i + 1];
      if (b - a > 720 || b + 80 < x0 || a - 80 > x1) continue;
      const ya = stallTop(a) - 6, sag = 48;
      ctx.strokeStyle = 'rgba(30,20,30,.9)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(a, ya); ctx.quadraticCurveTo((a + b) / 2, ya + sag * 2, b, ya); ctx.stroke();
      for (let k = 1; k <= 5; k++) {
        const u = k / 6, lx = a + (b - a) * u, ly = ya + sag * 4 * u * (1 - u) + 4 + Math.sin(t * 1.5 + k + i) * 1.5;
        const lc = festCol(k + i);
        const g = ctx.createRadialGradient(lx, ly + 8, 1, lx, ly + 8, 22); g.addColorStop(0, `rgba(${lc},.32)`); g.addColorStop(1, `rgba(${lc},0)`);
        ctx.fillStyle = g; ctx.fillRect(lx - 22, ly - 14, 44, 44);
        ctx.fillStyle = `rgb(${lc})`; ctx.beginPath(); canvasRoundRect(ctx, lx - 6, ly, 12, 16, 4); ctx.fill();
        ctx.strokeStyle = 'rgba(150,40,40,.8)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(lx - 6, ly + 4); ctx.lineTo(lx + 6, ly + 4); ctx.moveTo(lx - 6, ly + 12); ctx.lineTo(lx + 6, ly + 12); ctx.stroke();
        ctx.fillStyle = '#b8323a'; ctx.fillRect(lx - 1, ly + 16, 2, 8);
      }
    }
    for (const sx of caveXs) {
      if (sx < x0 - 110 || sx > x1 + 110) continue;
      const w = 150, l = sx - w / 2, top = stallTop(sx);
      ctx.fillStyle = '#2b1b22'; ctx.fillRect(l + 6, top + 16, 8, GROUND - top - 16); ctx.fillRect(l + w - 14, top + 16, 8, GROUND - top - 16);
      const si = caveXs.indexOf(sx), cloth = FEST_CLOTH[si % FEST_CLOTH.length], flag = FEST_CLOTH[(si + 2) % FEST_CLOTH.length];
      ctx.fillStyle = cloth; ctx.fillRect(l + 4, GROUND - 52, w - 8, 50);                                     // counter cloth
      ctx.fillStyle = '#c99a4a'; ctx.fillRect(l + 4, GROUND - 52, w - 8, 3); ctx.fillRect(l + 4, GROUND - 12, w - 8, 2);
      ctx.fillStyle = 'rgba(201,154,74,.6)'; for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.arc(l + 20 + k * 22, GROUND - 32, 3, 0, 7); ctx.fill(); }
      ctx.fillStyle = flag; ctx.fillRect(l + 16, top + 18, 16, 54); ctx.beginPath(); ctx.moveTo(l + 16, top + 72); ctx.lineTo(l + 24, top + 64); ctx.lineTo(l + 32, top + 72); ctx.fill();  // banner
      ctx.fillStyle = '#2e1648';                                                                                   // two-tier roof
      ctx.beginPath(); ctx.moveTo(l - 14, top + 20); ctx.lineTo(sx, top - 12); ctx.lineTo(l + w + 14, top + 20); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(l + 30, top - 6); ctx.lineTo(sx, top - 34); ctx.lineTo(l + w - 30, top - 6); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(214,170,90,.75)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(l - 14, top + 20); ctx.lineTo(sx, top - 12); ctx.lineTo(l + w + 14, top + 20); ctx.moveTo(l + 30, top - 6); ctx.lineTo(sx, top - 34); ctx.lineTo(l + w - 30, top - 6); ctx.stroke();
      ctx.fillStyle = '#d6aa5a'; ctx.fillRect(sx - 1.5, top - 50, 3, 18);
      const g = ctx.createRadialGradient(sx + 40, GROUND - 60, 1, sx + 40, GROUND - 60, 26); g.addColorStop(0, 'rgba(255,200,130,.4)'); g.addColorStop(1, 'rgba(255,200,130,0)');
      ctx.fillStyle = g; ctx.fillRect(sx + 14, GROUND - 86, 52, 52);
      ctx.fillStyle = '#ffd9a0'; ctx.fillRect(sx + 38, GROUND - 64, 4, 6);                                        // small oil lamp
    }
    // raised wooden decks = platforms
    for (const p of activePlats) {
      if (!p.active || p[0] + p[2] < x0 || p[0] > x1) continue;
      const x = p[0], y = platformDrawY(p), w = p[2];
      if (p.type !== 'moving') {
      ctx.fillStyle = '#2a1a20'; ctx.fillRect(x + 10, y + 8, 7, GROUND - y - 8); ctx.fillRect(x + w - 17, y + 8, 7, GROUND - y - 8);
      ctx.strokeStyle = 'rgba(42,26,32,.9)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + 14, y + 12); ctx.lineTo(x + w - 14, GROUND - 20); ctx.stroke();
      }
      const wood = ctx.createLinearGradient(0, y - 2, 0, y + 11);
      wood.addColorStop(0, '#a77a5a'); wood.addColorStop(.4, '#74503e'); wood.addColorStop(1, '#3e2832');
      ctx.fillStyle = wood; ctx.beginPath(); canvasRoundRect(ctx, x - 3, y - 2, w + 6, 12, 3); ctx.fill();
      ctx.strokeStyle = 'rgba(255,214,160,.6)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x + 2, y); ctx.lineTo(x + w - 2, y); ctx.stroke();
    }
    for (const spot of scratchSpots) { if (spot.x < x0 - 60 || spot.x > x1 + 60) continue; drawScratchSpot(spot.x, spot.y, spot.moodType, spot); }
    for (const rock of rocks) { if (rock.x < x0 - 80 || rock.x > x1 + 80) continue; drawRockFormation(rock.x, rock.y, rock, rockHoldsFeeling(rock)); }
  }
  function drawSchoolWall(alpha = 1, mirrorY = false) { return drawPictureLayer(SCHOOL_WALL, SCHOOL_WALL_W, SCHOOL_WALL_H, SCHOOL_PARALLAX, alpha, mirrorY); }
  function drawPictureLayer(IMG, W, H, parallax, alpha = 1, mirrorY = false) {
    if (!IMG.complete || !IMG.naturalWidth) return false;
    const off = camX * parallax;
    ctx.save(); ctx.globalAlpha = alpha;
    for (let k = Math.floor(off / W); k * W - off < VW; k++) {
      const sx = camX + k * W - off;                     // world x of this repeat
      ctx.save();
      if (mirrorY) { ctx.translate(0, GROUND * 1.55); ctx.scale(1, -.55); }
      if (k % 2) { ctx.translate(sx + W, 0); ctx.scale(-1, 1); ctx.drawImage(IMG, 0, 0, W, H); }
      else ctx.drawImage(IMG, sx, 0, W, H);
      ctx.restore();
    }
    ctx.restore(); return true;
  }
  function drawParkWorld(x0, x1) {
    ctx.fillStyle = '#1a1338'; ctx.fillRect(x0, -OY - 10, x1 - x0, 486 + OY);
    if (!drawPictureLayer(PARK_WALL, 1685, 474, .85)) { ctx.fillStyle = '#2a2458'; ctx.fillRect(x0, 0, x1 - x0, GROUND); }
    // soil, stone path and grass edge
    const soil = ctx.createLinearGradient(0, GROUND, 0, VH + OY + 60); soil.addColorStop(0, '#2a2152'); soil.addColorStop(1, '#100b24');
    ctx.fillStyle = soil; ctx.fillRect(x0, GROUND, x1 - x0, VH + OY + 60 - GROUND);
    ctx.fillStyle = '#5a5690'; ctx.fillRect(x0, GROUND + 8, x1 - x0, 16);
    ctx.fillStyle = 'rgba(210,200,255,.25)'; ctx.fillRect(x0, GROUND + 8, x1 - x0, 2);
    ctx.strokeStyle = 'rgba(20,14,40,.5)'; ctx.lineWidth = 1;
    for (let x = Math.floor(x0 / 44) * 44; x < x1; x += 44) { ctx.beginPath(); ctx.moveTo(x, GROUND + 9); ctx.lineTo(x + 6, GROUND + 24); ctx.stroke(); }
    const grass = ctx.createLinearGradient(0, GROUND - 6, 0, GROUND + 9); grass.addColorStop(0, '#5fc59a'); grass.addColorStop(.4, '#2e8a72'); grass.addColorStop(1, '#1d5050');
    ctx.fillStyle = grass; ctx.beginPath(); ctx.moveTo(x0, GROUND + 9);
    for (let x = Math.floor(x0 / 8) * 8; x < x1 + 8; x += 8) ctx.lineTo(x, GROUND - 2 - (Math.abs(Math.sin(x * 1.7)) * 5));
    ctx.lineTo(x1 + 8, GROUND + 9); ctx.closePath(); ctx.fill();
    // little flowers along the grass
    for (let x = Math.floor(x0 / 37) * 37; x < x1; x += 37) {
      const r = Math.abs(Math.sin(x * 12.9898) * 43758.5453) % 1; if (r < .45) continue;
      ctx.fillStyle = `rgb(${festCol(x / 37)})`; ctx.beginPath(); ctx.arc(x + r * 20, GROUND - 4 - r * 4, 2.2, 0, 7); ctx.fill();
    }
    // bushes (hiding places)
    for (const bx of caveXsForMap()) {
      if (bx < x0 - 90 || bx > x1 + 90) continue;
      const g = ctx.createLinearGradient(0, GROUND - 70, 0, GROUND); g.addColorStop(0, '#3fa07e'); g.addColorStop(1, '#1b4c4a');
      ctx.fillStyle = g;
      for (const [dx, dy, r] of [[-40, -22, 26], [-14, -38, 32], [18, -34, 30], [44, -20, 24], [0, -16, 34]]) { ctx.beginPath(); ctx.arc(bx + dx, GROUND + dy, r, 0, 7); ctx.fill(); }
      ctx.fillStyle = 'rgba(160,240,200,.25)'; ctx.beginPath(); ctx.arc(bx - 20, GROUND - 52, 12, 0, 7); ctx.arc(bx + 14, GROUND - 50, 10, 0, 7); ctx.fill();
      for (let k = 0; k < 6; k++) { ctx.fillStyle = `rgb(${festCol(k + bx)})`; ctx.beginPath(); ctx.arc(bx - 40 + k * 16, GROUND - 26 - (k % 3) * 12, 2.6, 0, 7); ctx.fill(); }
    }
    // playground decks = platforms
    const PARK_DECKS = ['#2fa69a', '#8b6fe0', '#3fb98a'];
    for (const p of activePlats) {
      if (!p.active || p[0] + p[2] < x0 || p[0] > x1) continue;
      // colour comes from where the deck starts, so a moving deck keeps one colour while it glides
      const home = p.type === 'moving' && p.path?.length ? p.path[0][0] : p[0];
      const x = p[0], y = platformDrawY(p), w = p[2], c = PARK_DECKS[Math.abs(Math.round(home / 97)) % PARK_DECKS.length];
      if (p.type === 'moving') {
        // a gliding deck floats on its own: soft glow underneath instead of legs that would slide along the grass
        ctx.fillStyle = 'rgba(255,233,165,.16)'; ctx.beginPath(); ctx.ellipse(x + w / 2, y + 16, w * .42, 7, 0, 0, 7); ctx.fill();
        ctx.fillStyle = 'rgba(8,6,18,.3)'; ctx.beginPath(); ctx.ellipse(x + w / 2, terrainY(x + w / 2) - 2, w * .4, 5, 0, 0, 7); ctx.fill();
      } else {
        ctx.fillStyle = '#6f6aa0'; ctx.fillRect(x + 10, y + 8, 6, GROUND - y - 8); ctx.fillRect(x + w - 16, y + 8, 6, GROUND - y - 8);
        ctx.fillStyle = 'rgba(200,196,240,.35)'; ctx.fillRect(x + 10, y + 8, 2, GROUND - y - 8); ctx.fillRect(x + w - 16, y + 8, 2, GROUND - y - 8);
      }
      ctx.fillStyle = c; ctx.beginPath(); canvasRoundRect(ctx, x - 3, y - 2, w + 6, 13, 5); ctx.fill();
      ctx.strokeStyle = 'rgba(10,8,30,.6)'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x + 3, y + 1); ctx.lineTo(x + w - 3, y + 1); ctx.stroke();
    }
    for (const spot of scratchSpots) { if (spot.x < x0 - 60 || spot.x > x1 + 60) continue; drawScratchSpot(spot.x, spot.y, spot.moodType, spot); }
    for (const rock of rocks) { if (rock.x < x0 - 80 || rock.x > x1 + 80) continue; drawRockFormation(rock.x, rock.y, rock, rockHoldsFeeling(rock)); }
  }
  function drawRooftopWorld(x0, x1) {
    // Distant roofs and chimneys sit behind the playable route.
    for (let k = Math.floor(camX * .27 / 260) - 1; k * 260 - camX * .27 < VW + 260; k++) {
      const x = camX + k * 260 - camX * .27, h = 84 + (Math.abs(k * 37) % 78);
      ctx.fillStyle = k % 2 ? '#27334b' : '#303b50'; ctx.fillRect(x, 380 - h, 214, 220);
      ctx.fillStyle = '#39445a'; ctx.beginPath();ctx.moveTo(x - 12, 380 - h);ctx.lineTo(x + 107, 345 - h);ctx.lineTo(x + 226, 380 - h);ctx.closePath();ctx.fill();
      ctx.fillStyle='#202b40';ctx.fillRect(x + 164, 320 - h, 25, 63);ctx.fillRect(x + 157, 315 - h, 39, 9);
      for(let j=0;j<3;j++){ctx.fillStyle=(k+j)%3?'#d5bd8a77':'#66738b';ctx.fillRect(x+24+j*61,406-h,22,35);}
    }
    // A second row gives depth without placing false platforms in Shwe's path.
    for(let k=Math.floor(x0/620)-1;k*620<x1+620;k++){
      const x=k*620,top=338+(k%2)*13;
      ctx.fillStyle='#374050';ctx.fillRect(x+35,top,550,GROUND-top);
      ctx.fillStyle='#565365';ctx.beginPath();ctx.moveTo(x+21,top);ctx.lineTo(x+310,top-28);ctx.lineTo(x+599,top);ctx.closePath();ctx.fill();
      ctx.strokeStyle='#ae9c92aa';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+28,top);ctx.lineTo(x+310,top-27);ctx.lineTo(x+592,top);ctx.stroke();
      // Chimneys remain in the back plane, clear of the playable floor.
      const cx=x+120+(k%2)*280;
      ctx.fillStyle='#706274';ctx.fillRect(cx,top-84,43,86);ctx.fillStyle='#a58a8c';ctx.fillRect(cx-6,top-90,55,11);
      ctx.fillStyle='#292d43';ctx.fillRect(cx+6,top-87,30,5);
      // Low laundry between roof posts adds life without blocking jump targets.
      const left=x+190,right=x+500,ropeY=top-112;
      ctx.strokeStyle='#b8adadbb';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(left,top-126);ctx.quadraticCurveTo((left+right)/2,ropeY+22,right,top-126);ctx.stroke();
      for(let i=0;i<4;i++){
        const lx=left+46+i*67,ly=ropeY+13+(i===1||i===2?3:0);
        ctx.fillStyle=['#baaaa7','#7a9caa','#c4b88f','#9d88a5'][(i+k+400)%4];
        ctx.beginPath();ctx.moveTo(lx-14,ly);ctx.lineTo(lx+14,ly);ctx.lineTo(lx+11,ly+35+(i%2)*8);ctx.lineTo(lx-10,ly+35+(i%2)*8);ctx.closePath();ctx.fill();
        ctx.fillStyle='#e6d6b4';ctx.fillRect(lx-11,ly-2,4,4);ctx.fillRect(lx+8,ly-2,4,4);
      }
    }
    const roof=ctx.createLinearGradient(0,GROUND,0,VH+OY+60);roof.addColorStop(0,'#5c5365');roof.addColorStop(.23,'#39354b');roof.addColorStop(1,'#19192c');
    ctx.fillStyle=roof;ctx.fillRect(x0,GROUND,x1-x0,VH+OY+60-GROUND);
    ctx.fillStyle='#a998a0';ctx.fillRect(x0,GROUND-4,x1-x0,5);
    ctx.fillStyle='#282639';ctx.fillRect(x0,GROUND+1,x1-x0,9);
    ctx.strokeStyle='rgba(199,178,185,.18)';ctx.lineWidth=1;
    for(let x=Math.floor(x0/82)*82;x<x1+82;x+=82){ctx.beginPath();ctx.moveTo(x,GROUND+10);ctx.lineTo(x-19,VH+OY+60);ctx.stroke();}
    for(let y=GROUND+39;y<VH+OY+60;y+=38){ctx.beginPath();ctx.moveTo(x0,y);ctx.lineTo(x1,y);ctx.stroke();}
    // The glowing cushions are on solid, checkpoint-safe roof sections.
    for(const x of currentLevel.restSpots||[]){
      if(x<x0-65||x>x1+65)continue;
      const y=terrainY(x),glow=ctx.createRadialGradient(x,y-22,2,x,y-22,55);glow.addColorStop(0,'#ffdca844');glow.addColorStop(1,'#ffdca800');
      ctx.fillStyle=glow;ctx.fillRect(x-55,y-77,110,110);
      ctx.fillStyle='#3c394b';ctx.beginPath();canvasRoundRect(ctx,x-41,y-13,82,12,6);ctx.fill();
      ctx.fillStyle='#b0a3b4';ctx.beginPath();canvasRoundRect(ctx,x-34,y-14,68,7,4);ctx.fill();
      ctx.fillStyle='#f0d6a6';ctx.beginPath();ctx.arc(x,y-32,3,0,Math.PI*2);ctx.fill();
      ctx.font=`700 11px ${BODY}`;ctx.textAlign='center';ctx.fillStyle='#f5e5c8';ctx.fillText('REST',x,y-47);
    }
    // Short dormer nooks identify the existing hiding locations.
    for(const x of currentLevel.hideSpots||[]){
      if(x<x0-60||x>x1+60)continue;
      const y=terrainY(x);ctx.fillStyle='#343447';ctx.fillRect(x-32,y-51,64,50);
      ctx.fillStyle='#777085';ctx.beginPath();ctx.moveTo(x-38,y-51);ctx.lineTo(x,y-72);ctx.lineTo(x+38,y-51);ctx.closePath();ctx.fill();
      ctx.fillStyle='#1e2c3e';ctx.fillRect(x-19,y-43,38,34);ctx.fillStyle='#a5969b';ctx.fillRect(x-3,y-42,5,32);
    }
    // Only actual platform geometry receives a ledge top.
    for(const p of activePlats){
      if(!p.active||p[0]+p[2]<x0||p[0]>x1)continue;
      const x=p[0],y=platformDrawY(p),w=p[2];
      if(p.type!=='moving'){ctx.fillStyle='#2b2636';ctx.fillRect(x+12,y+8,7,GROUND-y-8);ctx.fillRect(x+w-19,y+8,7,GROUND-y-8);}
      ctx.fillStyle='#6d6170';ctx.beginPath();canvasRoundRect(ctx,x-3,y-3,w+6,14,3);ctx.fill();
      ctx.fillStyle='#bba9a3';ctx.fillRect(x+3,y-3,w-6,3);
    }
    for(const spot of scratchSpots){if(spot.x<x0-60||spot.x>x1+60)continue;drawScratchSpot(spot.x,spot.y,spot.moodType,spot);}
    for(const rock of rocks){if(rock.x<x0-80||rock.x>x1+80)continue;drawRockFormation(rock.x,rock.y,rock,rockHoldsFeeling(rock));}
  }
  const SCHOOL_STRINGS = [[10, 838, 168, 34], [872, 1292, 168, 26], [1328, 1868, 168, 34], [1904, 2440, 168, 30]];   // [x0, x1, y, sag] in picture units
  const SCHOOL_BULBS = ['#ffb3d1', '#b8f0d8', '#fff0a8', '#d9c4ff', '#a8dcff'];
  function drawSchoolCute(x0, x1) {
    const W = SCHOOL_WALL_W, off = camX * SCHOOL_PARALLAX;
    ctx.save();
    for (let k = Math.floor(off / W); k * W - off < VW; k++) {
      const sx = camX + k * W - off, X = px => k % 2 ? sx + W - px : sx + px;
      SCHOOL_STRINGS.forEach(([a, b, y, sag], si) => {
        const n = Math.round((b - a) / 26), pts = [];
        for (let i = 0; i <= n; i++) { const u = i / n; pts.push([X(a + (b - a) * u), y + sag * Math.sin(Math.PI * u)]); }
        ctx.strokeStyle = 'rgba(40,28,60,.75)'; ctx.lineWidth = 1.6; ctx.beginPath(); pts.forEach(([x, yy], i) => i ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy)); ctx.stroke();
        pts.forEach(([x, yy], i) => {
          if (i === 0 || i === n || x < x0 - 30 || x > x1 + 30) return;
          const c = SCHOOL_BULBS[(i + si * 2) % SCHOOL_BULBS.length], tw = .55 + .45 * Math.sin(t * (1.1 + (i % 4) * .35) + i * 1.7 + si);
          ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .2 * tw;
          ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, yy + 6, 9, 0, 7); ctx.fill();
          ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = .6 + .4 * tw;
          ctx.beginPath(); ctx.ellipse(x, yy + 6, 3.6, 5, 0, 0, 7); ctx.fill();
          ctx.globalAlpha = 1;
          // a little paper star hanging from some of the bulbs
          if ((i + si) % 5 === 2) {
            const sw = Math.sin(t * 1.3 + i) * .12, hx = x + Math.sin(sw) * 26, hy = yy + 6 + Math.cos(sw) * 26;
            ctx.strokeStyle = 'rgba(243,236,255,.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, yy + 8); ctx.lineTo(hx, hy); ctx.stroke();
            ctx.fillStyle = (i + si) % 2 ? '#ffd6e8' : '#fff3b8'; star(hx, hy + 5, 5, 7, 3, sw); ctx.fill();
          }
        });
      });
    }
    // rainbow paper bunting lower on the wall
    const FLAGS = ['#ff8fb8', '#ffb877', '#ffe27a', '#8fe0a8', '#7cc6ff', '#b99bff'];
    for (let k = Math.floor(off / W); k * W - off < VW; k++) {
      const sx = camX + k * W - off, X = px => k % 2 ? sx + W - px : sx + px;
      [[18, 820, 236, 22], [1340, 1860, 236, 18]].forEach(([a, b, y, sag]) => {
        const n = Math.round((b - a) / 30);
        ctx.strokeStyle = 'rgba(255,240,250,.55)'; ctx.lineWidth = 1.2; ctx.beginPath();
        for (let i = 0; i <= n; i++) { const u = i / n, x = X(a + (b - a) * u), yy = y + sag * Math.sin(Math.PI * u); i ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy); }
        ctx.stroke();
        for (let i = 0; i < n; i++) {
          const u = (i + .5) / n, x = X(a + (b - a) * u), yy = y + sag * Math.sin(Math.PI * u);
          if (x < x0 - 20 || x > x1 + 20) continue;
          const sway = Math.sin(t * 1.2 + i * .9) * 1.5;
          ctx.fillStyle = FLAGS[i % FLAGS.length]; ctx.globalAlpha = .9;
          ctx.beginPath(); ctx.moveTo(x - 10, yy); ctx.lineTo(x + 10, yy); ctx.lineTo(x + sway, yy + 18); ctx.closePath(); ctx.fill();
          ctx.globalAlpha = 1;
        }
      });
    }
    // slow floating sparkles in the air
    for (let i = 0; i < 26; i++) {
      const wx = ((i * 397) % 1600) + Math.floor((camX - 300) / 1600) * 1600 + (i % 2 ? 800 : 0), x = wx + Math.sin(t * .4 + i) * 20;
      if (x < x0 - 20 || x > x1 + 20) continue;
      const y = 140 + ((i * 131 + t * 9) % 300), a = .35 + .35 * Math.sin(t * 1.6 + i * 2.3);
      ctx.fillStyle = `rgba(255,240,250,${Math.max(0, a)})`; star(x, y, 4, 3.2, 1.1, t * .5 + i); ctx.fill();
    }
    ctx.restore();
  }
  function drawSchoolWorld(x0, x1) {
    ctx.fillStyle = '#16122a'; ctx.fillRect(x0, -OY - 10, x1 - x0, SCHOOL_WALL_H + OY + 12);
    if (!drawSchoolWall()) { ctx.fillStyle = '#2b2546'; ctx.fillRect(x0, 0, x1 - x0, GROUND); }
    else drawSchoolCute(x0, x1);
    // glossy hallway floor with a faint reflection of the wall
    const floor = ctx.createLinearGradient(0, GROUND, 0, VH + OY + 60);
    floor.addColorStop(0, '#4a3c63'); floor.addColorStop(.18, '#30284a'); floor.addColorStop(1, '#130f22');
    ctx.fillStyle = floor; ctx.fillRect(x0, GROUND, x1 - x0, VH + OY + 60 - GROUND);
    ctx.save(); ctx.beginPath(); ctx.rect(x0, GROUND, x1 - x0, 110); ctx.clip(); drawSchoolWall(.32, true);
    const fade = ctx.createLinearGradient(0, GROUND, 0, GROUND + 110); fade.addColorStop(0, 'rgba(19,15,34,0)'); fade.addColorStop(1, 'rgba(19,15,34,.95)');
    ctx.fillStyle = fade; ctx.fillRect(x0, GROUND, x1 - x0, 110); ctx.restore();
    ctx.strokeStyle = 'rgba(120,108,170,.22)'; ctx.lineWidth = 1;
    for (let x = Math.floor(x0 / 96) * 96; x < x1; x += 96) { ctx.beginPath(); ctx.moveTo(x, GROUND + 4); ctx.lineTo(x - 22, VH + OY + 60); ctx.stroke(); }
    for (const yy of [GROUND + 26, GROUND + 62]) { ctx.beginPath(); ctx.moveTo(x0, yy); ctx.lineTo(x1, yy); ctx.stroke(); }
    ctx.fillStyle = '#4b4170'; ctx.fillRect(x0, GROUND - 2, x1 - x0, 4);
    ctx.fillStyle = 'rgba(16,12,30,.55)'; ctx.fillRect(x0, GROUND + 2, x1 - x0, 3);
    // wooden wall shelves = the platforms
    for (const p of activePlats) {
      if (!p.active || p[0] + p[2] < x0 || p[0] > x1) continue;
      const x = p[0], y = platformDrawY(p), w = p[2];
      ctx.fillStyle = 'rgba(8,6,18,.35)'; ctx.beginPath(); ctx.ellipse(x + w / 2, y + 30, w * .45, 7, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#3a2a35';
      for (const bx of [x + 16, x + w - 26]) { ctx.beginPath(); ctx.moveTo(bx, y + 9); ctx.lineTo(bx + 10, y + 9); ctx.lineTo(bx + 10, y + 26); ctx.closePath(); ctx.fill(); }
      const wood = ctx.createLinearGradient(0, y - 2, 0, y + 11);
      wood.addColorStop(0, '#8a5e4c'); wood.addColorStop(.4, '#6a4438'); wood.addColorStop(1, '#3a2430');
      ctx.fillStyle = wood; ctx.beginPath(); canvasRoundRect(ctx, x - 3, y - 2, w + 6, 12, 4); ctx.fill();
      ctx.strokeStyle = 'rgba(16,10,22,.8)'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.strokeStyle = 'rgba(255,214,160,.75)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x + 2, y); ctx.lineTo(x + w - 2, y); ctx.stroke();
    }
    for (const spot of scratchSpots) { if (spot.x < x0 - 60 || spot.x > x1 + 60) continue; drawScratchSpot(spot.x, spot.y, spot.moodType, spot); }
    for (const rock of rocks) { if (rock.x < x0 - 80 || rock.x > x1 + 80) continue; drawRockFormation(rock.x, rock.y, rock, rockHoldsFeeling(rock)); }
  }
  function drawLevelDecor(x0, x1) {
    const map = currentLevel.map, palette = map === 'school' ? ['#8a5e4c','#d4a66b','#f5d8a5'] : map === 'rooftop' ? ['#635568','#b5a0a6','#f2d5ae'] : map === 'park' ? ['#3f9b83','#8ed7a1','#f4c985'] : map === 'festival' ? ['#77503f','#d6aa5a','#ef8fbd'] : map === 'hill' ? ['#555078','#9a8cc4','#64aa8b'] : map === 'lake' ? ['#5a3d4b','#a77a5a','#9fe8ff'] : ['#4d5054','#818b83','#c0b1ff'];
    const [dark, mid, light] = palette;
    if (map !== 'hill') {
      const bottom = VH + OY + 60, floor = ctx.createLinearGradient(0, GROUND - 28, 0, bottom);
      floor.addColorStop(0, map === 'festival' ? '#76513e' : map === 'lake' ? '#694a57' : map === 'park' ? '#3c705f' : map === 'school' ? '#58475c' : '#47514d');
      floor.addColorStop(.22, map === 'festival' ? '#46313a' : map === 'lake' ? '#493247' : map === 'park' ? '#2a4550' : map === 'school' ? '#342b43' : '#303a38'); floor.addColorStop(1, '#151421');
      const left = Math.max(0, Math.floor(x0 / 8) * 8), right = Math.min(WORLD, x1 + 8);
      ctx.fillStyle = floor; ctx.beginPath(); ctx.moveTo(left, terrainY(left));
      for (let x = left + 8; x <= right; x += 8) ctx.lineTo(x, terrainY(x));
      ctx.lineTo(right, bottom); ctx.lineTo(left, bottom); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = map === 'festival' ? 'rgba(218,174,120,.65)' : map === 'lake' ? 'rgba(170,232,244,.48)' : map === 'park' ? 'rgba(133,210,157,.52)' : 'rgba(255,226,180,.36)';
      ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(left, terrainY(left));
      for (let x = left + 8; x <= right; x += 8) ctx.lineTo(x, terrainY(x)); ctx.stroke();
    }
    // A quiet contour trace makes the authored steps and slopes legible over the existing place art.
    ctx.strokeStyle = map === 'school' ? 'rgba(255,226,180,.38)' : map === 'festival' ? 'rgba(255,210,160,.46)' : map === 'lake' ? 'rgba(170,232,244,.5)' : 'rgba(195,220,180,.42)';
    ctx.lineWidth = 2; ctx.beginPath();
    const start = Math.max(0, Math.floor(x0 / 18) * 18), end = Math.min(WORLD, x1);
    for (let x = start; x <= end; x += 18) { const y = terrainY(x); x === start ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
    ctx.stroke();
    // Dark, open gaps cut through each map's floor; edge lights make every landing decision readable.
    for (const [a,b] of currentLevel.pits || []) {
      if (b < x0 || a > x1) continue;
      const top = Math.min(levelGroundY(a), levelGroundY(b)), bottom = VH + OY + 70;
      const glow = map === 'festival' || map === 'lake' ? 'rgba(32,75,105,.82)' : map === 'park' ? 'rgba(12,30,42,.9)' : map === 'hill' ? 'rgba(14,11,32,.96)' : 'rgba(12,9,24,.94)';
      const g = ctx.createLinearGradient(0, top, 0, bottom); g.addColorStop(0, glow); g.addColorStop(.35, 'rgba(8,9,21,.98)'); g.addColorStop(1, '#080814');
      ctx.fillStyle = g; ctx.fillRect(a, top - 4, b - a, bottom - top + 8);
      ctx.fillStyle = dark; ctx.beginPath(); ctx.moveTo(a - 2, top - 3); ctx.lineTo(a + 8, top + 10); ctx.lineTo(a + 8, bottom); ctx.lineTo(a - 2, bottom); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(b + 2, top - 3); ctx.lineTo(b - 8, top + 10); ctx.lineTo(b - 8, bottom); ctx.lineTo(b + 2, bottom); ctx.closePath(); ctx.fill();
      if (map === 'school') {
        ctx.strokeStyle = 'rgba(201,181,221,.38)'; ctx.lineWidth = 2;
        for (const ex of [a + 9, b - 9]) for (let n = 0; n < 5; n++) { const yy = top + 24 + n * 23; ctx.beginPath(); ctx.moveTo(ex, yy); ctx.lineTo(ex + (ex < (a+b)/2 ? 1 : -1) * (10 + n * 3), yy + 6); ctx.stroke(); }
      } else if (map === 'festival' || map === 'lake') {
        ctx.strokeStyle = 'rgba(143,222,241,.42)'; ctx.lineWidth = 1.5;
        for (let y = top + 32; y < bottom; y += 18) { ctx.beginPath(); ctx.moveTo(a + 7, y + Math.sin(t * 2 + y) * 2); ctx.quadraticCurveTo((a+b)/2, y - 3, b - 7, y + Math.sin(t * 2.3 + y) * 2); ctx.stroke(); }
      }
      const edgeColor = map === 'festival' ? 'rgba(255,193,124,.9)' : map === 'lake' ? 'rgba(143,222,241,.9)' : map === 'park' ? 'rgba(166,237,192,.84)' : 'rgba(255,220,164,.82)';
      ctx.strokeStyle = edgeColor; ctx.lineWidth = 3;
      for (const edge of [a, b]) { ctx.beginPath(); ctx.moveTo(edge - 14, levelGroundY(edge) - 3); ctx.lineTo(edge + (edge === a ? 10 : -10), levelGroundY(edge) + 5); ctx.stroke(); }
      for (const edge of [a + 15, b - 15]) for (let n = 0; n < 3; n++) { const sx = edge + n * (edge === a + 15 ? 12 : -12), sy = top - 9 - Math.sin(t * 3 + n) * 2; ctx.fillStyle = edgeColor; ctx.beginPath(); ctx.arc(sx, sy, 1.8, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = 'rgba(24,17,42,.92)'; ctx.strokeStyle = edgeColor; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc((a+b)/2, top - 22, 10, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.font = `800 13px ${DISP}`; ctx.textAlign = 'center'; ctx.fillStyle = INK; ctx.fillText('!', (a+b)/2, top - 17);
    }
    for (const mark of currentLevel.checkpoints || []) {
      if (mark < x0 - 30 || mark > x1 + 30) continue;
      const gy = terrainY(mark), pulse = .7 + .3 * Math.sin(t * 3 + mark);
      ctx.fillStyle = `rgba(255,210,110,${.12 * pulse})`; ctx.beginPath(); ctx.arc(mark, gy - 26, 27, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = 'rgba(145,103,77,.9)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(mark - 8, gy); ctx.lineTo(mark - 8, gy - 30); ctx.lineTo(mark + 8, gy - 30); ctx.lineTo(mark + 8, gy); ctx.stroke();
      ctx.fillStyle = `rgba(255,219,135,${pulse})`; ctx.beginPath(); canvasRoundRect(ctx, mark - 5, gy - 27, 10, 15, 4); ctx.fill();
      ctx.fillStyle = 'rgba(246,236,190,.85)'; ctx.fillRect(mark - 2, gy - 24, 4, 7);
      ctx.fillStyle = 'rgba(243,236,255,.8)'; ctx.beginPath(); ctx.arc(mark, gy + 3, 3, 0, Math.PI*2); ctx.fill();
    }
    // Existing map-specific platform rendering remains; this adds distinct type cues and state.
    for (const p of activePlats) {
      if (!p.active || p[0] + p[2] < x0 || p[0] > x1) continue;
      const x=p[0], y=platformDrawY(p), w=p[2];
      if (p.type === 'moving') { ctx.strokeStyle='rgba(255,233,165,.42)'; ctx.lineWidth=1; ctx.setLineDash([5,5]); ctx.strokeRect(x-3,y-5,w+6,17); ctx.setLineDash([]); }
      if (p.skin === 'boat' || p.skin === 'log') {
        ctx.fillStyle = p.skin === 'boat' ? '#704b4b' : '#72523c'; ctx.beginPath(); ctx.moveTo(x - 2, y + 2); ctx.lineTo(x + w + 2, y + 2); ctx.quadraticCurveTo(x + w * .84, y + 16, x + w * .5, y + 15); ctx.quadraticCurveTo(x + w * .14, y + 16, x - 2, y + 2); ctx.fill();
        ctx.fillStyle = p.skin === 'boat' ? '#d6aa5a' : '#ad8055'; ctx.fillRect(x + 5, y - 2, w - 10, 4);
      }
      if (p.type === 'swinging' && p.anchor) {
        const [ax, ay] = p.anchor, sway = Math.sin(t * (p.speed || .8)) * 15;
        ctx.strokeStyle = 'rgba(255,220,164,.82)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(ax - 18, ay - 28); ctx.quadraticCurveTo(ax + sway, ay - 14, ax + sway, ay + 4); ctx.stroke();
        ctx.fillStyle = 'rgba(255,205,111,.18)'; ctx.beginPath(); ctx.arc(ax + sway, ay + 10, 20, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffd98a'; ctx.beginPath(); canvasRoundRect(ctx, ax + sway - 8, ay + 3, 16, 19, 5); ctx.fill();
        ctx.strokeStyle = 'rgba(113,74,96,.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(ax + sway - 4, ay + 10); ctx.lineTo(ax + sway + 4, ay + 10); ctx.stroke();
      }
      if (p.type === 'crumbling') { const fade = p.crumbleRemaining > 0 ? .45 + .4 * p.crumbleRemaining : 1; ctx.globalAlpha=fade; ctx.strokeStyle=dark; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(x+w*.34,y+1); ctx.lineTo(x+w*.42,y+7); ctx.lineTo(x+w*.48,y+3); ctx.moveTo(x+w*.68,y+1); ctx.lineTo(x+w*.61,y+6); ctx.stroke(); ctx.globalAlpha=1; }
      if (p.type === 'bouncy') { ctx.fillStyle=mid; ctx.beginPath(); ctx.ellipse(x+w/2,y+3,w*.34,7,0,Math.PI,Math.PI*2); ctx.fill(); ctx.strokeStyle=light; ctx.lineWidth=1.5; ctx.beginPath(); ctx.ellipse(x+w/2,y+3,w*.34,7,0,Math.PI,Math.PI*2); ctx.stroke(); }
    }
    for (const prop of currentProps) {
      // The hallway picture already supplies furniture; omit extra chair stacks.
      if (map === 'school' && prop.kind === 'chairs') continue;
      const x=prop.x, w=prop.w || 80, gy=terrainY(x+w/2); if (x+w < x0 || x > x1) continue;
      ctx.save(); ctx.lineCap='round'; ctx.lineJoin='round';
      if (prop.kind === 'desk') { ctx.fillStyle=dark; ctx.fillRect(x,gy-32,w,8); ctx.fillRect(x+8,gy-24,7,24); ctx.fillRect(x+w-15,gy-24,7,24); ctx.fillStyle=light; ctx.fillRect(x+12,gy-38,24,5); ctx.fillStyle=mid; ctx.fillRect(x+42,gy-40,18,8); }
      else if (prop.kind === 'chairs') { for(let i=0;i<3;i++){const xx=x+i*18;ctx.strokeStyle=dark;ctx.lineWidth=4;ctx.strokeRect(xx,gy-34-i*4,15,17);ctx.fillStyle=mid;ctx.fillRect(xx,gy-18-i*4,17,4);ctx.fillRect(xx+2,gy-14-i*4,3,14);ctx.fillRect(xx+13,gy-14-i*4,3,14);} }
      else if (prop.kind === 'slide') { ctx.strokeStyle=mid;ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(x+15,gy-75);ctx.lineTo(x+15,gy);ctx.moveTo(x+48,gy-75);ctx.lineTo(x+48,gy);ctx.stroke();ctx.strokeStyle=light;ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(x+15,gy-70);ctx.lineTo(x+w*.65,gy-62);ctx.lineTo(x+w,gy-4);ctx.stroke();for(let yy=gy-58;yy<gy;yy+=14){ctx.strokeStyle=dark;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x+17,yy);ctx.lineTo(x+45,yy);ctx.stroke();} }
      else if (prop.kind === 'bench') { ctx.fillStyle=dark;ctx.fillRect(x,gy-28,w,6);ctx.fillRect(x,gy-42,w,6);ctx.fillRect(x+8,gy-22,6,22);ctx.fillRect(x+w-14,gy-22,6,22);ctx.strokeStyle=light;ctx.lineWidth=1;ctx.strokeRect(x+2,gy-40,w-4,3); }
      else if (prop.kind === 'swing') { ctx.strokeStyle=dark;ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(x,gy);ctx.lineTo(x+12,gy-88);ctx.lineTo(x+w-12,gy-88);ctx.lineTo(x+w,gy);ctx.stroke();ctx.strokeStyle=light;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+35,gy-86);ctx.lineTo(x+35,gy-24);ctx.moveTo(x+w-35,gy-86);ctx.lineTo(x+w-35,gy-24);ctx.stroke();ctx.fillStyle=mid;ctx.fillRect(x+27,gy-25,w-54,6); }
      else if (prop.kind === 'stall') { ctx.fillStyle=dark;ctx.fillRect(x+10,gy-54,7,54);ctx.fillRect(x+w-17,gy-54,7,54);ctx.fillStyle=mid;ctx.beginPath();ctx.moveTo(x,gy-50);ctx.lineTo(x+w/2,gy-82);ctx.lineTo(x+w,gy-50);ctx.closePath();ctx.fill();ctx.fillStyle=light;for(let k=0;k<4;k++)ctx.fillRect(x+8+k*(w-16)/4,gy-52,(w-16)/8,7); }
      else if (prop.kind === 'lanterns') { ctx.strokeStyle=dark;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,gy-102);ctx.quadraticCurveTo(x+w/2,gy-62,x+w,gy-102);ctx.stroke();for(let k=1;k<6;k++){const lx=x+k*w/6,ly=gy-102+40*(4*k/6)*(1-k/6);ctx.fillStyle=light;ctx.beginPath();canvasRoundRect(ctx, lx-5,ly,10,15,3);ctx.fill();ctx.fillRect(lx-1,ly+15,2,7);} }
      else if (prop.kind === 'boat' || prop.kind === 'log') { const yy=prop.kind==='boat'?gy-9:gy-12;ctx.fillStyle=dark;ctx.beginPath();ctx.moveTo(x,yy);ctx.lineTo(x+w,yy);ctx.quadraticCurveTo(x+w*.8,yy+19,x+w*.5,yy+18);ctx.quadraticCurveTo(x+w*.15,yy+18,x,yy);ctx.fill();ctx.fillStyle=mid;ctx.fillRect(x+8,yy-4,w-16,5);if(prop.kind==='boat'){ctx.strokeStyle=light;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+w*.5,yy-6);ctx.lineTo(x+w*.5,yy-42);ctx.lineTo(x+w*.75,yy-10);ctx.stroke();} }
      else if (prop.kind === 'branch') { ctx.strokeStyle=dark;ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(x,gy-12);ctx.quadraticCurveTo(x+w*.45,gy-50,x+w,gy-30);ctx.stroke();ctx.strokeStyle=mid;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x+w*.4,gy-28);ctx.lineTo(x+w*.3,gy-56);ctx.moveTo(x+w*.72,gy-32);ctx.lineTo(x+w*.82,gy-58);ctx.stroke(); }
      else if (prop.kind === 'stone' || prop.kind === 'stones') { for(let k=0;k<3;k++){const xx=x+k*(w/3),ww=Math.min(40,w/3-4),yy=gy-7-(k%2)*7;ctx.fillStyle=k%2?mid:dark;ctx.beginPath();ctx.ellipse(xx+ww/2,yy,ww/2,7,0,Math.PI,Math.PI*2);ctx.fill();ctx.strokeStyle=light;ctx.lineWidth=1;ctx.stroke();} }
      else if (prop.kind === 'jetty') { ctx.fillStyle=dark;for(let k=0;k<5;k++)ctx.fillRect(x+k*w/5,gy-5,w/5-2,7);ctx.fillStyle=mid;ctx.fillRect(x+4,gy-8,w-8,4); }
      else if (prop.kind === 'bush') { for(const [dx,dy,r] of [[18,-20,20],[48,-30,25],[75,-18,20]]){ctx.fillStyle=mid;ctx.beginPath();ctx.arc(x+dx,gy+dy,r,0,Math.PI*2);ctx.fill();} }
      ctx.restore();
    }
    if (currentLevel.homeLight) {
      const [hx, hy] = currentLevel.homeLight;
      if (hx >= x0 - 60 && hx <= x1 + 60) { const glow=ctx.createRadialGradient(hx,hy,2,hx,hy,48);glow.addColorStop(0,'rgba(255,229,165,.42)');glow.addColorStop(1,'rgba(255,211,133,0)');ctx.fillStyle=glow;ctx.beginPath();ctx.arc(hx,hy,48,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ffd98a';ctx.beginPath();ctx.arc(hx,hy,5+Math.sin(t*3)*.7,0,Math.PI*2);ctx.fill(); }
    }
  }
  function drawLevelDebug() {
    if (!debugLayout) return;
    ctx.save(); ctx.strokeStyle='#ff5c88'; ctx.fillStyle='#ffe78a'; ctx.lineWidth=2;
    for (const p of activePlats) { if (!p.active) continue; ctx.strokeRect(p[0],p[1],p[2],12); }
    for (const [kx,ky] of currentLevel.keepsakes || []) { ctx.fillStyle='#ff9fd0';ctx.fillRect(kx-5,ky-5,10,10); }
    for (const x of currentLevel.hideSpots || []) { ctx.fillStyle='#80f0ce';ctx.beginPath();ctx.arc(x,terrainY(x)-8,6,0,Math.PI*2);ctx.fill(); }
    for (const x of currentLevel.burySpots || []) { ctx.fillStyle='#ffcf72';ctx.beginPath();ctx.moveTo(x,terrainY(x)-12);ctx.lineTo(x-6,terrainY(x));ctx.lineTo(x+6,terrainY(x));ctx.closePath();ctx.fill(); }
    // approximate jump arc at the current player jump impulse for quick reach inspection
    ctx.strokeStyle='rgba(255,245,170,.85)';ctx.beginPath();
    for(let i=0;i<=28;i++){const q=i/28, xx=cat.x+cat.face*360*q, yy=cat.y-830*(.72*q)+.5*2300*(.72*q)*(.72*q);i?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy);}ctx.stroke();
    ctx.restore();
  }
  function drawWorld() {
    const x0=camX-50,x1=camX+VW+50;
    if (inSchool()) drawSchoolWorld(x0, x1);
    else if (inRooftop()) drawRooftopWorld(x0, x1);
    else if (inFestival()) drawFestivalWorld(x0, x1);
    else if (inPark()) drawParkWorld(x0, x1);
    else if (inLake()) drawLakeWorld(x0, x1);
    else if (inHill()) drawHillWorld(x0, x1);
    else {
    drawParallaxLayer(0,.10);drawParallaxLayer(1,.38);drawParallaxLayer(2,.78);
    const ground=ctx.createLinearGradient(0,410,0,VH+OY+60);ground.addColorStop(0,'#394440');ground.addColorStop(.18,'#303a38');ground.addColorStop(1,'#151f27');
    const rockEdge=x=>{const seed=Math.sin(x*12.9898+7.31)*43758.5453;return terrainY(x)+(seed-Math.floor(seed)-.5)*4;};
    const groundStart=Math.floor(x0/24)*24;
    ctx.fillStyle=ground;ctx.beginPath();ctx.moveTo(groundStart,rockEdge(groundStart));
    for(let x=groundStart;x<x1+24;x+=24)ctx.lineTo(x+24,rockEdge(x+24));
    ctx.lineTo(x1,VH+OY+60);ctx.lineTo(groundStart,VH+OY+60);ctx.closePath();ctx.fill();
    ctx.strokeStyle='rgba(190,199,165,.7)';ctx.lineWidth=2.2;ctx.beginPath();ctx.moveTo(groundStart,rockEdge(groundStart));for(let x=groundStart;x<x1+24;x+=24)ctx.lineTo(x+24,rockEdge(x+24));ctx.stroke();
    // Loose scree and long fractured strata follow the fixed stone shelves and hollows.
    for(let x=Math.floor(x0/31)*31;x<x1;x+=31){const seed=Math.sin(x*12.9898)*43758.5453,f=seed-Math.floor(seed),yy=terrainY(x)+12+f*43;ctx.fillStyle=f>.5?'rgba(175,184,163,.48)':'rgba(8,15,21,.54)';ctx.beginPath();ctx.ellipse(x+f*12,yy,2+f*3.4,1+f*1.7,f,0,Math.PI*2);ctx.fill();}
    ctx.strokeStyle='rgba(143,159,151,.18)';ctx.lineWidth=1;for(let x=Math.floor(x0/175)*175;x<x1;x+=175){const y=terrainY(x)+50;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+24,y-5);ctx.lineTo(x+42,y+1);ctx.moveTo(x+90,y+34);ctx.lineTo(x+108,y+24);ctx.lineTo(x+126,y+29);ctx.stroke();}
    for(const [hx,off,rx,ry] of [[390,31,42,23],[1045,38,52,28],[1710,47,45,24],[2075,34,49,26]]){const hy=terrainY(hx)+off;ctx.fillStyle='rgba(5,13,20,.83)';ctx.beginPath();ctx.moveTo(hx-rx,hy+ry);ctx.quadraticCurveTo(hx-rx*.88,hy-ry*.2,hx-rx*.3,hy-ry*.65);ctx.quadraticCurveTo(hx,hy-ry*1.05,hx+rx*.32,hy-ry*.55);ctx.quadraticCurveTo(hx+rx*.9,hy-.1*ry,hx+rx,hy+ry);ctx.closePath();ctx.fill();ctx.strokeStyle='rgba(134,151,144,.34)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(hx-rx*.82,hy+ry*.1);ctx.quadraticCurveTo(hx,hy-ry*.9,hx+rx*.8,hy+ry*.05);ctx.stroke();}
    drawMoonHollowWorld(x0,x1);
    for(const spot of scratchSpots){if(spot.x<x0-60||spot.x>x1+60)continue;drawScratchSpot(spot.x,spot.y,spot.moodType,spot);}
    for(const rock of rocks){if(rock.x<x0-80||rock.x>x1+80)continue;drawRockFormation(rock.x,rock.y,rock,rockHoldsFeeling(rock));}
    for(const p of activePlats){if(!p.active||p[0]+p[2]<x0||p[0]>x1)continue;
      const x=p[0],y=platformDrawY(p),w=p[2];ctx.fillStyle='#27333a';ctx.beginPath();ctx.moveTo(x-4,y+13);ctx.lineTo(x+4,y+4);ctx.quadraticCurveTo(x+w*.21,y+12,x+w*.34,y+6);ctx.quadraticCurveTo(x+w*.58,y-1,x+w*.76,y+8);ctx.lineTo(x+w+5,y+11);ctx.lineTo(x+w-8,y+28);ctx.lineTo(x+10,y+28);ctx.closePath();ctx.fill();
      const rock=ctx.createLinearGradient(0,y,0,y+18);rock.addColorStop(0,'#596458');rock.addColorStop(.36,'#49514b');rock.addColorStop(1,'#303a3b');ctx.fillStyle=rock;ctx.beginPath();ctx.moveTo(x-2,y+7);ctx.quadraticCurveTo(x+w*.2,y+3,x+w*.4,y+8);ctx.quadraticCurveTo(x+w*.72,y+2,x+w+3,y+6);ctx.lineTo(x+w-4,y+15);ctx.quadraticCurveTo(x+w*.6,y+12,x+w*.35,y+16);ctx.quadraticCurveTo(x+w*.1,y+12,x-2,y+17);ctx.closePath();ctx.fill();
      ctx.strokeStyle='rgba(168,183,150,.68)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y+7);ctx.quadraticCurveTo(x+w*.3,y+2,x+w*.55,y+7);ctx.quadraticCurveTo(x+w*.8,y+3,x+w,y+6);ctx.stroke();
      ctx.strokeStyle='rgba(12,22,27,.62)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x+w*.28,y+9);ctx.lineTo(x+w*.32,y+15);ctx.lineTo(x+w*.36,y+17);ctx.moveTo(x+w*.78,y+7);ctx.lineTo(x+w*.74,y+12);ctx.stroke();
      ctx.fillStyle='rgba(48,85,57,.82)';for(let k=0;k<4;k++){const gx=x+12+k*31,gy=y+5+(k%2)*2;ctx.beginPath();ctx.ellipse(gx,gy,5,1.5,-.15,0,Math.PI*2);ctx.fill();}
    }
    // Small fern silhouettes frame the near trail.
    for(let x=Math.floor(x0/190)*190;x<x1;x+=190){const y=terrainY(x)+6;ctx.strokeStyle='rgba(90,129,82,.65)';ctx.lineWidth=1.5;for(let k=0;k<5;k++){const side=k%2?1:-1,yy=y-k*4;ctx.beginPath();ctx.moveTo(x,yy);ctx.quadraticCurveTo(x+side*9,yy-8,x+side*17,yy-12);ctx.stroke();}}
    for(let x=Math.floor((x0+95)/330)*330;x<x1;x+=330){const y=terrainY(x)+3;ctx.strokeStyle='rgba(91,135,91,.68)';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(x,y+6);ctx.quadraticCurveTo(x+1,y,x,y-5);ctx.stroke();for(let k=0;k<5;k++){const a=k*Math.PI*2/5;ctx.fillStyle=k%2?'#e5c28b':'#e7d5bc';ctx.beginPath();ctx.arc(x+Math.cos(a)*3,y-5+Math.sin(a)*3,1.7,0,Math.PI*2);ctx.fill();}ctx.fillStyle='#d4a84f';ctx.beginPath();ctx.arc(x,y-5,1.5,0,Math.PI*2);ctx.fill();}
    }
    if (mode === 'story') window.TCVisualChapters?.draw(ctx, { level: storyNight, cam: camX, width: VW, height: VH, ground: GROUND, time: t, reduced: reduce, map: currentMapKey() });
    drawLevelDecor(x0, x1);
  }
  // ---------- cute Moodling art (from the character sheet; drawn with SVG paths) ----------
  const MP = s => new Path2D(s);
  const MOOD_ART = {
    F: { body: MP('M60 34 L74.7 47.8 L92.3 57.5 L83.8 75.7 L80 95.5 L60 93 L40 95.5 L36.2 75.7 L27.7 57.5 L45.3 47.8 Z'), steam: MP('M88 30 q-4 -6 2 -9 q2 -6 8 -3 q6 -1 6 5 q5 3 1 8 z'), mouth: MP('M55 84 Q60 80 65 84'), brows: MP('M44 62 L54 66 M76 62 L66 66') },
    N: { body: MP('M30 70 Q28 58 36 52 Q36 40 50 40 Q56 32 66 38 Q80 36 84 48 Q94 54 90 66 Q96 78 86 86 Q84 98 70 96 Q60 102 50 96 Q36 98 34 86 Q24 80 30 70 Z'), mouth: MP('M54 84 q2 -2 4 0 q2 2 4 0 q2 -2 4 0'), sweat: MP('M86 42 Q91 50 86 53 Q81 50 86 42 Z'), shiver: MP('M20 62 l-5 -2 M19 72 l-6 0 M100 62 l5 -2 M101 72 l6 0') },
    L: { body: MP('M60 26 C66 40 93 58 93 77 A33 29 0 0 1 27 77 C27 58 54 40 60 26 Z'), shine: MP('M53 44 C47 52 41 60 40 68'), brows: MP('M43 63 Q48 61 53 64 M67 64 Q72 61 77 63'), mouth: MP('M56 88 q4 -2.5 8 0'), tear: MP('M80 74 Q83 79 80 81 Q77 79 80 74 Z') },
    E: { mouth: MP('M53 74 Q60 84 67 74 Z'), tongue: MP('M56 78.5 Q60 82 64 78.5 Q60 76.5 56 78.5 Z'), spark: MP('M52.5 58.5 l1 2.5 2.5 1 -2.5 1 -1 2.5 -1 -2.5 -2.5 -1 2.5 -1 z M72.5 58.5 l1 2.5 2.5 1 -2.5 1 -1 2.5 -1 -2.5 -2.5 -1 2.5 -1 z') },
    C: { stem: MP('M60 42 Q58 32 62 26'), leafR: MP('M62 28 Q72 16 86 22 Q78 36 62 28 Z'), leafL: MP('M60 30 Q52 20 40 24 Q46 36 60 30 Z'), eyes: MP('M44 70 q6 -7 12 0 M64 70 q6 -7 12 0'), mouth: MP('M55 80 q5 5 10 0') },
    J: { tail: MP('M86 86 Q106 90 102 70 Q99 60 91 65'), body: MP('M60 28 C64 36 70 38 72 44 C76 40 76 34 78 32 C86 42 90 56 90 70 C90 88 76 98 60 98 C44 98 30 88 30 70 C30 56 36 46 44 40 C46 46 48 48 50 48 C50 40 54 34 60 28 Z'), lids: MP('M44.5 66 Q51 64 57.5 66 M62.5 66 Q69 64 75.5 66'), mouth: MP('M56 85 q4 -3 8 0') },
    B: { body: MP('M30 74 C28 56 42 46 60 46 C80 46 92 58 90 75 C89 91 76 99 60 99 C42 99 31 91 30 74 Z'), cap: MP('M31 64 C29 45 43 34 60 34 C78 34 91 45 89 64 C82 58 74 61 67 56 C59 62 51 57 45 61 C40 58 35 61 31 64 Z'), crack: MP('M58 35 L62 43 L57 48 L61 55'), mouth: MP('M55 88 Q60 93 65 88') },
    G: { body: MP('M60 42 L67 57 L84 59 L71.5 70.5 L75 87 L60 79 L45 87 L48.5 70.5 L36 59 L53 57 Z'), eyes: MP('M51 66 q3.5 -4 7 0 M62 66 q3.5 -4 7 0'), mouth: MP('M57 72 q3 3 6 0') }
  };
  const glowCache = {};
  function glowImg(c) {
    if (glowCache[c]) return glowCache[c];
    const o = document.createElement('canvas'); o.width = o.height = 96; const g = o.getContext('2d');
    const gr = g.createRadialGradient(48, 48, 4, 48, 48, 48); gr.addColorStop(0, c); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.globalAlpha = .5; g.fillStyle = gr; g.fillRect(0, 0, 96, 96); return (glowCache[c] = o);
  }
  function mEll(x, y, rx, ry, rot, fill, stroke, lw) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot, 0, 7); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 2.5; ctx.stroke(); } }
  function mStroke(p, c, w) { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke(p); }
  function mEyes(lx, rx, y, rw, rh, c, look, hi) {
    mEll(lx + look, y, rw, rh, 0, c); mEll(rx + look, y, rw, rh, 0, c);
    if (hi) { mEll(lx + look + rw * .35, y - rh * .35, hi, hi, 0, '#fff'); mEll(rx + look + rw * .35, y - rh * .35, hi, hi, 0, '#fff'); mEll(lx + look - rw * .3, y + rh * .45, hi * .45, hi * .45, 0, '#fff'); mEll(rx + look - rw * .3, y + rh * .45, hi * .45, hi * .45, 0, '#fff'); }
  }
  // draws one Moodling centred on (x, y); k = size, o = per-state options
  function drawFrustSleep(x, y, p = clamp(t / frustWakeAt, 0, 1), left = frustWakeAt - t, warn = false) {
    const waking = warn || left < 1.5;
    const cx = x, cy = y - 56, r = 16;
    ctx.save();
    ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(20,12,40,.55)'; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    const pulse = waking ? .65 + .35 * Math.sin(t * 14) : 1;
    ctx.strokeStyle = waking ? `rgba(255,97,104,${pulse})` : 'rgba(243,236,255,.9)';
    ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2); ctx.stroke();
    ctx.fillStyle = waking ? '#ff6168' : '#f3ecff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = '800 16px Lexend, Arial, sans-serif'; ctx.fillText(warn ? String(Math.max(1, Math.ceil(left))) : waking ? '!' : 'z', cx, cy + 1);
    if (!waking) {
      for (let k = 0; k < 2; k++) {
        const ph = (t * .7 + k * .5) % 1;
        ctx.globalAlpha = Math.sin(ph * Math.PI) * .9;
        ctx.font = `800 ${10 + k * 4}px Lexend, Arial, sans-serif`;
        ctx.fillText('z', cx + 16 + ph * 10 + k * 6, cy - 8 - ph * 18 - k * 4);
      }
      ctx.globalAlpha = 1;
    }
    if (warn || (mode === 'story' && chapterFor(storyNight).tutorialHints)) {
      ctx.font = '700 13px Lexend, Arial, sans-serif'; ctx.fillStyle = waking ? '#ff8a8f' : 'rgba(243,236,255,.8)';
      ctx.fillText(warn ? 'angry soon!' : waking ? 'waking up!' : 'sleepy', cx, cy - 27);
    }
    ctx.restore();
  }
  function drawCuteMood(type, x, y, k, o = {}) {
    const A = MOOD_ART[type], body = o.color;
    ctx.save(); ctx.translate(x, y);
    const gl = glowImg(o.glow || body); const gs = 120 * k; ctx.drawImage(gl, -gs / 2, -gs / 2, gs, gs);
    ctx.scale(k * (o.flip || 1) * (o.sx || 1), k * (o.sy || 1)); ctx.translate(-60, -(o.cy || 66));
    const look = o.look || 0;
    if (type === 'F') {
      mEll(48, 100, 8, 5, 0, '#E04848', '#5A0D16', 2.5); mEll(72, 100, 8, 5, 0, '#E04848', '#5A0D16', 2.5);
      mStroke(A.body, '#5A0D16', 15); mStroke(A.body, body, 9); ctx.fillStyle = body; ctx.fill(A.body);
      if (o.flash) { ctx.globalAlpha *= o.flash; mStroke(A.body, '#fff', 9); ctx.fillStyle = '#fff'; ctx.fill(A.body); ctx.globalAlpha /= o.flash; }
      mEll(50, 52, 9, 5, 0, 'rgba(255,190,180,.8)');
      mEll(42, 80, 6, 4, 0, '#FF9EB0'); mEll(78, 80, 6, 4, 0, '#FF9EB0');
      if (o.sleepy) {
        ctx.strokeStyle = '#3A0A10'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
        [51, 69].forEach(ex => { ctx.beginPath(); ctx.arc(ex, 70, 4.5, .15 * Math.PI, .85 * Math.PI); ctx.stroke(); });
        ctx.beginPath(); ctx.arc(60, 84, 2.5, 0, Math.PI * 2); ctx.stroke();
      } else if (o.dizzy) {
        ctx.strokeStyle = '#3A0A10'; ctx.lineWidth = 2.5;
        [51, 69].forEach(ex => { ctx.beginPath(); ctx.arc(ex, 72, 4.5, o.t * 8, o.t * 8 + 5); ctx.stroke(); });
        mEll(60, 85, 3.5, 3, 0, '#3A0A10');
      } else {
        mStroke(A.brows, '#5A0D16', 3); mEyes(51, 69, 72, 4.5, 5.5, '#3A0A10', look, 1.8); mStroke(A.mouth, '#3A0A10', 2.5);
        ctx.fillStyle = 'rgba(236,230,245,.85)'; ctx.fill(A.steam);
      }
    } else if (type === 'N') {
      mEll(48, 100, 7, 4.5, 0, '#8A5CE6', '#2E1760', 2.5); mEll(72, 100, 7, 4.5, 0, '#8A5CE6', '#2E1760', 2.5);
      ctx.fillStyle = body; ctx.fill(A.body); mStroke(A.body, '#2E1760', 3);
      mEll(50, 52, 9, 5, 0, 'rgba(217,199,255,.8)');
      mEyes(50, 70, 69, 7, 8.5, '#2E1760', look, 3);
      mEll(40, 81, 5, 3.2, 0, 'rgba(255,158,200,.8)'); mEll(80, 81, 5, 3.2, 0, 'rgba(255,158,200,.8)');
      mStroke(A.mouth, '#2E1760', 2.2);
      if (o.panic || o.alarm) { ctx.fillStyle = '#BDEBFF'; ctx.fill(A.sweat); mStroke(A.sweat, '#2E1760', 1.5); mStroke(A.shiver, '#D9C7FF', 2.5); }
    } else if (type === 'L') {
      ctx.fillStyle = body; ctx.fill(A.body); mStroke(A.body, '#10306B', 3); mStroke(A.shine, 'rgba(191,224,255,.8)', 5);
      mEyes(50, 70, 74, 7.5, 8.5, '#10306B', look, 3.4); mStroke(A.brows, '#10306B', 2.2);
      mEll(39, 86, 5, 3.2, 0, 'rgba(255,158,194,.8)'); mEll(81, 86, 5, 3.2, 0, 'rgba(255,158,194,.8)');
      mStroke(A.mouth, '#10306B', 2.2); mEll(54, 98, 6, 4.5, 0, '#7DBBFF', '#10306B', 2.2); mEll(66, 98, 6, 4.5, 0, '#7DBBFF', '#10306B', 2.2);
      ctx.fillStyle = '#E2F2FF'; ctx.fill(A.tear);
    } else if (type === 'E') {
      const up = o.armsUp ?? 1;
      mEll(28, 48 + (1 - up) * 26, 6, 8, -.5 * up, '#FFD23F', '#6B4A00', 2.5); mEll(92, 48 + (1 - up) * 26, 6, 8, .5 * up, '#FFD23F', '#6B4A00', 2.5);
      mEll(50, 96, 7, 4.5, 0, '#F2B90F', '#6B4A00', 2.5); mEll(70, 96, 7, 4.5, 0, '#F2B90F', '#6B4A00', 2.5);
      mEll(60, 64, 30, 30, 0, body, '#6B4A00', 3); mEll(49, 48, 10, 6, 0, 'rgba(255,243,184,.9)');
      mEyes(50, 70, 64, 6.5, 7.5, '#4A3300', look, 0); ctx.fillStyle = '#fff'; ctx.save(); ctx.translate(look, 0); ctx.fill(A.spark); ctx.restore();
      mEll(40, 74, 5, 3.2, 0, '#FF9E8A'); mEll(80, 74, 5, 3.2, 0, '#FF9E8A');
      ctx.fillStyle = '#7A3A00'; ctx.fill(A.mouth); mStroke(A.mouth, '#6B4A00', 2); ctx.fillStyle = '#FF7A8A'; ctx.fill(A.tongue);
    } else if (type === 'C') {
      mStroke(A.stem, '#0F4D2C', 3); ctx.fillStyle = '#7BEAAE'; ctx.fill(A.leafR); ctx.fill(A.leafL); mStroke(A.leafR, '#0F4D2C', 2.5); mStroke(A.leafL, '#0F4D2C', 2.5);
      mEll(49, 99, 7, 4.5, 0, '#33B873', '#0F4D2C', 2.5); mEll(71, 99, 7, 4.5, 0, '#33B873', '#0F4D2C', 2.5);
      mEll(60, 70, 31, 28, 0, body, '#0F4D2C', 3); mEll(48, 54, 9, 5, 0, 'rgba(182,245,210,.85)');
      mStroke(A.eyes, '#0F4D2C', 3); mEll(41, 79, 5.5, 3.4, 0, 'rgba(255,158,194,.8)'); mEll(79, 79, 5.5, 3.4, 0, 'rgba(255,158,194,.8)'); mStroke(A.mouth, '#0F4D2C', 2.5);
    } else if (type === 'S') {
      const hy = o.handsY ?? 85;
      mEll(60, 34, 8, 11, 0, '#FFB0D4', '#6B1640', 2.5); mEll(46, 38, 8, 11, -.6, '#FFB0D4', '#6B1640', 2.5); mEll(74, 38, 8, 11, .6, '#FFB0D4', '#6B1640', 2.5);
      mEll(60, 70, 28, 28, 0, body, '#6B1640', 3); mEll(49, 55, 8, 4.5, 0, 'rgba(255,204,228,.85)');
      mEyes(51, 69, 66, 6, 7, '#6B1640', look, 2.6);
      mEll(41, 74, 6.5, 4, 0, 'rgba(255,61,139,.7)'); mEll(79, 74, 6.5, 4, 0, 'rgba(255,61,139,.7)');
      mEll(50, hy, 10, 11, -.35, '#FFC2DE', '#6B1640', 2.5); mEll(70, hy, 10, 11, .35, '#FFC2DE', '#6B1640', 2.5);
    } else if (type === 'J') {
      mStroke(A.tail, '#6B2E06', 10); mStroke(A.tail, body, 5);
      mEll(49, 100, 7, 4.5, 0, '#EE7E1E', '#6B2E06', 2.5); mEll(71, 100, 7, 4.5, 0, '#EE7E1E', '#6B2E06', 2.5);
      ctx.fillStyle = body; ctx.fill(A.body); mStroke(A.body, '#6B2E06', 3); mEll(48, 56, 8, 4.5, 0, 'rgba(255,211,160,.85)');
      mEll(51, 70, 6.5, 7.5, 0, '#fff', '#6B2E06', 2); mEll(69, 70, 6.5, 7.5, 0, '#fff', '#6B2E06', 2);
      mEll(51 - 4, 72, 3.5, 4.5, 0, '#4A1E00'); mEll(69 - 4, 72, 3.5, 4.5, 0, '#4A1E00');
      if (o.tired) { ctx.fillStyle = body; ctx.fillRect(43, 61, 16, 8); ctx.fillRect(61, 61, 16, 8); }
      mStroke(A.lids, '#6B2E06', 2.5);
      mEll(40, 81, 7, 5, 0, 'rgba(255,122,106,.75)'); mEll(80, 81, 7, 5, 0, 'rgba(255,122,106,.75)'); mStroke(A.mouth, '#6B2E06', 2.5);
    } else if (type === 'B') {
      const ink = '#4A2F17';
      mEll(49, 100, 7, 4.5, 0, '#8A5E36', ink, 2.5); mEll(71, 100, 7, 4.5, 0, '#8A5E36', ink, 2.5);
      ctx.fillStyle = body; ctx.fill(A.body); mStroke(A.body, ink, 3);
      mEyes(50, 70, 76, 7, 7.5, '#2E1A0B', look, 2.6);
      ctx.save(); ctx.beginPath(); ctx.rect(36, 60, 48, 11.5); ctx.clip(); mEll(50, 76, 8.2, 8.6, 0, body); mEll(70, 76, 8.2, 8.6, 0, body); ctx.restore();
      ctx.strokeStyle = ink; ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(50, 76, 7.6, 1.17 * Math.PI, 1.83 * Math.PI); ctx.moveTo(77.6, 76); ctx.arc(70, 76, 7.6, 1.17 * Math.PI, 1.83 * Math.PI); ctx.stroke();
      mEll(41, 86, 5, 3.2, 0, 'rgba(255,158,140,.7)'); mEll(79, 86, 5, 3.2, 0, 'rgba(255,158,140,.7)'); mStroke(A.mouth, ink, 2.2);
      ctx.fillStyle = 'rgba(74,47,23,.45)'; [[40, 92, 1.8], [80, 70, 1.6], [72, 94, 1.4], [38, 78, 1.3]].forEach(d => { ctx.beginPath(); ctx.arc(d[0], d[1], d[2], 0, 7); ctx.fill(); });
      ctx.fillStyle = '#9B92A6'; ctx.fill(A.cap); mStroke(A.cap, '#3B3446', 3); mEll(48, 42, 8, 3.5, -.3, 'rgba(255,255,255,.28)'); mStroke(A.crack, '#3B3446', 2);
    } else if (type === 'G') {
      ctx.beginPath(); ctx.ellipse(60, 30, 13, 3.5, 0, 0, 7); ctx.strokeStyle = '#FFF6D0'; ctx.lineWidth = 2.5; ctx.stroke();
      mStroke(A.body, '#8A5A00', 13); mStroke(A.body, '#FFE27A', 7); ctx.fillStyle = '#FFE27A'; ctx.fill(A.body);
      mEll(55, 52, 5, 3, 0, 'rgba(255,255,255,.85)'); mStroke(A.eyes, '#8A5A00', 2.4);
      mEll(48, 72, 3.6, 2.4, 0, '#FFAE8A'); mEll(72, 72, 3.6, 2.4, 0, '#FFAE8A'); mStroke(A.mouth, '#8A5A00', 2.2);
    }
    ctx.restore();
  }
  function sitRing(m, c, r) {
    if (m.sit > 0) {
      ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(m.x, m.y + 2, r, 0, 7); ctx.stroke();
      ctx.strokeStyle = c; ctx.beginPath(); ctx.arc(m.x, m.y + 2, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, m.sit / sitNeed())); ctx.stroke(); return true;
    }
    return false;
  }
  function moodLabel(m, text, c, dy = 40) { ctx.font = `600 13px ${BODY}`; ctx.textAlign = 'center'; ctx.fillStyle = c; ctx.fillText(text, m.x, m.y - dy); }
  function drawMoods() {
    for (const m of mood) {
      if (nightGuide.active && !m.tutorialOnly) continue;
      if (m.alpha < .02) continue;
      ctx.save(); ctx.globalAlpha = m.alpha;
      const look = clamp((cat.x - m.x) / 160, -2.5, 2.5), near = Math.abs(cat.x - m.x) < 3 * T;
      if (m.sky && m.skyPhase !== 'ground' && m.skyPhase !== 'cleared') {
        const skyColor = m.v ? vcol(m.type, m.v) : col(m.type);
        if (m.skyPhase === 'wait') {
          const ay = terrainY(m.x) - 70 - Math.sin(t * 3 + m.phase) * 2;
          ctx.globalAlpha = .55 + .25 * Math.sin(t * 5 + m.phase); ctx.fillStyle = skyColor;
          ctx.font = `800 22px ${DISP}`; ctx.textAlign = 'center'; ctx.fillText('↓', m.x, ay); ctx.globalAlpha = m.alpha;
          if (m.skyFeature === 'B') for (let k = 0; k < 5; k++) { const yy = 18 + k * 15 + Math.sin(t * 4 + k) * 2; ctx.fillStyle = skyColor; star(m.x + Math.sin(t * 2 + k) * 4, yy, 4, 3.5, 1.2, t + k); ctx.fill(); }
        } else {
          const shadowWidth = 22 * (1 - Math.min(1, (m.y - GROUND) / -600)) + 6;
          ctx.fillStyle = 'rgba(8,10,24,.28)'; ctx.beginPath(); ctx.ellipse(m.x, terrainY(m.x), shadowWidth, 5, 0, 0, 7); ctx.fill();
        }
        const size = m.type === 'F' ? .62 : m.type === 'N' ? .58 : m.type === 'L' ? .5 : .55;
        const cy = m.type === 'F' || m.type === 'N' || m.type === 'L' ? 70 : m.type === 'J' ? 68 : 72;
        drawCuteMood(m.type, m.x, m.y, size, { color: skyColor, glow: skyColor, look, cy });
        if (m.skyPhase === 'struck' && m.skyHit) for (let k = 0; k < 3; k++) { const a = t * 5 + k * 2.1; ctx.fillStyle = GOLD; star(m.x + Math.cos(a) * 24, m.y - 22 + Math.sin(a) * 7, 5, 4.5, 1.8, a); ctx.fill(); }
        if (m.skyPhase === 'scratchReq') {
          ctx.strokeStyle = `rgba(255,97,104,${.65 + .28 * Math.sin(t * 12)})`; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(m.x, m.y, 39 + Math.sin(t * 10) * 3, 0, Math.PI * 2); ctx.stroke();
          ctx.font = `800 22px ${DISP}`; ctx.textAlign = 'center'; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(8,14,22,.9)'; ctx.fillStyle = RED; ctx.strokeText('Scratch it! (S)', m.x, m.y - 56); ctx.fillText('Scratch it! (S)', m.x, m.y - 56);
        }
        if (m.v) drawRare(m);
        ctx.restore(); continue;
      }
      if (m.type === 'F') {
        let x = m.x, y = m.y;
        if (m.state === 'windup') x += (Math.random() - .5) * 5;
        if (m.state === 'charge') { ctx.strokeStyle = 'rgba(255,97,104,.45)'; ctx.lineWidth = 3; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(x - m.dir * (26 + k * 10), y - 10 + k * 10); ctx.lineTo(x - m.dir * (60 + k * 14), y - 10 + k * 10); ctx.stroke(); } }
        const puffUp = m.state === 'windup' ? 1.12 : 1;
        const sleepy = m.state === 'patrol' && !m.ambush && t < frustWakeAt;
        drawCuteMood('F', x, y, .62 * puffUp, { color: vcol('F', m.v), look, dizzy: m.state === 'dizzy', sleepy: sleepy && t < frustWakeAt - 1.2, t, flash: m.state === 'windup' ? .25 + .25 * Math.sin(t * 30) : 0, cy: 70 });
        if (sleepy) drawFrustSleep(x, y);
        else if (m.state === 'warn') drawFrustSleep(x, y, clamp(1 - m.st / FRUST_WARN, 0, 1), m.st, true);
        if (m.state === 'dizzy') for (let k = 0; k < 3; k++) { const a = t * 4 + k * 2.1; ctx.fillStyle = GOLD; star(x + Math.cos(a) * 20, y - 30 + Math.sin(a) * 5, 5, 5, 2, 0); ctx.fill(); }
      } else if (m.type === 'N') {
        const d = Math.hypot(cat.x - m.x, cat.y - 24 - m.y), R = uv('paws') * T;
        if (m.state === 'wander' && d < R * 1.5) {
          ctx.save(); ctx.globalAlpha = m.alpha * (m.alarm > 0 ? .45 : .16); ctx.strokeStyle = m.alarm > 0 ? RED : VIOLET; ctx.setLineDash([6, 8]); ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(m.x, m.y, R + Math.sin(t * 3) * 4, 0, 7); ctx.stroke(); ctx.restore();
        }
        const wob = m.state === 'panic' ? 1 + Math.sin(t * 40) * .06 : 1;
        drawCuteMood('N', m.x, m.y, .58, { color: vcol('N', m.v), look, panic: m.state === 'panic', alarm: m.alarm > 0, sx: wob, cy: 70 });
        if (m.alarm > 0 && m.state === 'wander') { ctx.font = `800 18px ${DISP}`; ctx.textAlign = 'center'; ctx.fillStyle = GOLD; ctx.fillText('!', m.x + 20, m.y - 26); }
      } else if (m.type === 'L') {
        drawCuteMood('L', m.x, m.y, .5, { color: vcol('L', m.v), look, cy: 70 });
        if (!sitRing(m, BLUE, 30) && near) moodLabel(m, 'Sit still beside me', BLUE, 34);
      } else if (m.type === 'C') {
        const floorY = terrainY(m.x), li = m.light || 0;
        // lily pad on the water, with soft ripples
        ctx.strokeStyle = 'rgba(190,220,255,.25)'; ctx.lineWidth = 1.5;
        for (let k = 0; k < 2; k++) { const rr = 34 + ((t * 14 + k * 16) % 32); ctx.globalAlpha = m.alpha * (1 - (rr - 34) / 32) * .8; ctx.beginPath(); ctx.ellipse(m.x, floorY - 8, rr, rr * .22, 0, 0, 7); ctx.stroke(); }
        ctx.globalAlpha = m.alpha;
        mEll(m.x, floorY - 8, 36, 8, 0, '#3f8a4c', '#24583a', 2); ctx.fillStyle = '#5fae6a'; ctx.beginPath(); ctx.ellipse(m.x - 6, floorY - 10, 22, 4, 0, 0, 7); ctx.fill();
        ctx.fillStyle = '#1b3a2a'; ctx.beginPath(); ctx.moveTo(m.x, floorY - 8); ctx.lineTo(m.x + 30, floorY - 12); ctx.lineTo(m.x + 30, floorY - 5); ctx.closePath(); ctx.fill();
        if (m.v === 1) {
          const pop = m.state === 'popping' ? 1 - m.st / .55 : 0, r = (34 + 26 * breathSize(m.bphase)) * (1 + pop * .4), by = m.y - 6;
          drawCuteMood('C', m.x, m.y, .5, { color: '#a8f0c8', glow: '#c9fff0', look: 0, cy: 70 });
          ctx.globalAlpha = m.alpha * (1 - pop);
          const bg = ctx.createRadialGradient(m.x - r * .3, by - r * .35, r * .1, m.x, by, r);
          bg.addColorStop(0, 'rgba(233,255,244,.22)'); bg.addColorStop(.8, 'rgba(159,240,200,.1)'); bg.addColorStop(1, 'rgba(201,255,240,.5)');
          ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(m.x, by, r, 0, 7); ctx.fill();
          ctx.strokeStyle = 'rgba(201,255,240,.75)'; ctx.lineWidth = 2; ctx.stroke();
          ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(m.x, by, r * .78, Math.PI * 1.15, Math.PI * 1.45); ctx.stroke();
          ctx.globalAlpha = m.alpha;
          if (m.v) drawRare(m);
          if (m.state === 'bubble') {
            for (let k = 0; k < BREATHS_NEED; k++) { ctx.beginPath(); ctx.arc(m.x - 18 + k * 18, by - r - 16, 6, 0, 7); ctx.lineWidth = 2; ctx.strokeStyle = CALM; ctx.stroke(); if (k < m.breaths) { ctx.fillStyle = CALM; ctx.fill(); } }
            if (near) { const inhale = m.bphase < .5; moodLabel(m, inhale ? 'Breathe in… hold S' : '…and out, let go', inhale ? '#9ff0c8' : '#ffd9a0', r + 38); }
          }
          ctx.restore(); continue;
        }
        if (li < 1) { ctx.globalAlpha = m.alpha * (1 - li); ctx.filter = 'grayscale(.85) brightness(.8)'; drawCuteMood('C', m.x, m.y, .55, { color: '#7f9a88', glow: '#33413b', look: 0, cy: 70 }); ctx.filter = 'none'; }
        if (li > 0) { ctx.globalAlpha = m.alpha * li; drawCuteMood('C', m.x, m.y, .55 + li * .05, { color: '#4FDB92', glow: CALM, look, cy: 70 }); }
        ctx.globalAlpha = m.alpha;
        if (m.state === 'dim' && near) {
          const n = carriedFlies().length;
          moodLabel(m, n >= FLY_NEED ? 'Come close… share the light' : `Bring me fireflies  ✦ ${n}/${FLY_NEED}`, CALM, 42);
        }
      } else if (m.type === 'B') {
        drawCuteMood('B', m.x, m.y, .52, { color: vcol('B', m.v), look, cy: 70 });
      } else if (m.type === 'E') {
        const sq = m.state === 'squash' ? 1 - m.st * 1.2 : 1;
        const sy = m.state === 'squash' ? .78 : m.apex ? 1 : 1.06, sx = m.state === 'squash' ? 1.18 : m.apex ? 1 : .96;
        drawCuteMood('E', m.x, m.y, .55, { color: EXC, look, sx, sy, armsUp: m.state === 'squash' ? .2 : 1, cy: 72 });
        if (m.apex) { ctx.strokeStyle = 'rgba(255,243,184,.9)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(m.x, m.y, 30, 0, 7); ctx.stroke(); ctx.fillStyle = '#fff'; star(m.x + 22, m.y - 24, 4, 7, 2.5, t * 4); ctx.fill(); }
        if (near && m.state === 'squash' && sq > 0) moodLabel(m, 'Jump + pounce at the top!', EXC, 34);
      } else if (m.type === 'S') {
        const hy = m.state === 'walk' ? 66 : m.state === 'turn' ? 76 : m.state === 'hide' ? 66 : 85;
        drawCuteMood('S', m.x, m.y, .55, { color: SHY, look: m.state === 'look' ? look : 0, handsY: hy, cy: 70 });
        if (m.state === 'turn') { ctx.font = `800 18px ${DISP}`; ctx.textAlign = 'center'; ctx.fillStyle = SHY; ctx.fillText('?', m.x + 18, m.y - 30); }
        if (m.state === 'look' && Math.abs(cat.x - m.x) < 6 * T) {
          ctx.save(); ctx.globalAlpha = m.alpha * .22; ctx.fillStyle = SHY; const dir = Math.sign(cat.x - m.x) || 1;
          ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(m.x + dir * 6 * T, m.y - 70); ctx.lineTo(m.x + dir * 6 * T, m.y + 50); ctx.closePath(); ctx.fill(); ctx.restore();
          moodLabel(m, 'Freeze! Shy is looking', SHY, 36);
        } else if (near && m.state === 'walk') moodLabel(m, 'Now, while it hides its face!', SHY, 36);
      } else if (m.type === 'J') {
        if (m.state === 'flee') { ctx.strokeStyle = 'rgba(255,154,60,.45)'; ctx.lineWidth = 3; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(m.x - m.dir * (24 + k * 8), m.y - 8 + k * 9); ctx.lineTo(m.x - m.dir * (52 + k * 12), m.y - 8 + k * 9); ctx.stroke(); } }
        drawCuteMood('J', m.x, m.y, .55, { color: JEAL, flip: -(m.dir || 1), tired: m.state === 'tired', cy: 68 });
        (m.stolen || []).forEach((l, i) => { const a = t * 3 + i * 2.1; lightShape(l.type, m.x + Math.cos(a) * 26, m.y - 6 + Math.sin(a) * 14, .8, l.v); });
        if (m.state === 'tired') { ctx.font = `800 13px ${DISP}`; ctx.textAlign = 'left'; ctx.fillStyle = INK; ctx.fillText('z', m.x + 16, m.y - 26 - Math.sin(t * 2) * 3); if (near) moodLabel(m, 'Tired! Catch it now', JEAL, 40); }
        else if (near && m.state === 'wander' && trail.length) moodLabel(m, 'Careful, it wants your lights', JEAL, 40);
      } else {
        const pulse = .5 + .5 * Math.sin(t * 2.2 + m.phase);
        ctx.strokeStyle = `rgba(255,229,161,${.5 + pulse * .2})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(m.x, m.y, 38, 0, Math.PI * 2); ctx.stroke();
        drawCuteMood('G', m.x, m.y, .62, { color: '#FFE27A', glow: '#fff3c4', cy: 64 });
        for (let k = 0; k < 4; k++) { const a = t * 3 + k * Math.PI / 2; ctx.fillStyle = '#fff3c4'; star(m.x + Math.cos(a) * 26, m.y + Math.sin(a) * 26, 4, 5, 1.5, 0); ctx.fill(); }
      }
      if (m.sky && m.skyPhase === 'ground' && m.skyHit && m.skyGroundStun > 0) { for (let k = 0; k < 3; k++) { const a = t * 5 + k * 2.1; ctx.fillStyle = GOLD; star(m.x + Math.cos(a) * 24, m.y - 22 + Math.sin(a) * 7, 5, 4.5, 1.8, a); ctx.fill(); } }
      if (m.v && m.alpha > .05) drawRare(m);
      ctx.restore();
    }
  }

  // Comfort items packed for this hour are worn by the cat: scarf + bell on the neck, jar + hourglass on the back.
  // Positions are fractions of each cat picture: n = [neck x, neck y, neck half-width], b = [back x, back y].
  const GEAR_POS = {
    ginger: { n: [.73, 0.57, .13], b: [.40, 0.45] }, mainecoon: { n: [.73, 0.56, .13], b: [.40, 0.44] },
    burmese: { n: [.69, 0.56, .11], b: [.38, 0.53] }, siamese: { n: [.69, 0.60, .11], b: [.40, 0.60] },
    persian: { n: [.67, 0.64, .14], b: [.36, 0.49] }, ragdoll: { n: [.63, 0.65, .14], b: [.34, 0.52] },
    british: { n: [.68, 0.62, .14], b: [.36, 0.51] }, bengal: { n: [.73, 0.58, .11], b: [.42, 0.55] },
    sphynx: { n: [.73, 0.56, .10], b: [.40, 0.57] }
  };
  // Draws the packed comfort items on the cat. Everything is designed on a 70px-tall cat and scaled with it
  // (k = hh / 70), with dark outlines like the cat sprites so it reads clearly at game size.
  function drawCatGear(c, x0, y0, ww, hh, moving, force) {
    const has = force || activeItems || {};
    if (!force && state !== 'play' && state !== 'paused' && state !== 'ending') return;
    const showGoldenCollar = !force && goldenCollar;
    if (!has.scarf && !has.bell && !has.jar && !has.sand && !showGoldenCollar) return;
    const P = GEAR_POS[MK_PROFILE.coat] || GEAR_POS.ginger, k = hh / 70;
    const nx = x0 + (P.n[0] - .03) * ww, ny = y0 + (P.n[1] + .12) * hh, nr = P.n[2] * ww * .85 / k;
    const bx = x0 + (P.b[0] - .02) * ww, by = y0 + (P.b[1] - .045) * hh;
    const tt = force ? 0 : t, sway = moving ? Math.sin(tt * 13) : Math.sin(tt * 2.5) * .35;
    const OL = '#2b1730';
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    if (has.jar || has.sand) {
      ctx.save(); ctx.translate(bx, by); ctx.scale(k, k);
      // small leather strap pad sitting on the back
      ctx.beginPath(); ctx.moveTo(-8.5, 1.5); ctx.quadraticCurveTo(0, -1, 8.5, 1.5); ctx.lineTo(8, 4); ctx.quadraticCurveTo(0, 1.8, -8, 4); ctx.closePath();
      ctx.fillStyle = '#9a6038'; ctx.fill(); ctx.lineWidth = .9; ctx.strokeStyle = OL; ctx.stroke();
      ctx.strokeStyle = '#f2c98a'; ctx.lineWidth = .5; ctx.setLineDash([1, 1]); ctx.beginPath(); ctx.moveTo(-7, 2.3); ctx.quadraticCurveTo(0, .2, 7, 2.3); ctx.stroke(); ctx.setLineDash([]);
      if (has.sand) {   // wooden hourglass with golden sand
        ctx.save(); ctx.translate(has.jar ? -4.2 : 0, .6);
        ctx.fillStyle = 'rgba(225,245,255,.55)'; ctx.strokeStyle = '#3a4a66'; ctx.lineWidth = .8;
        ctx.beginPath(); ctx.moveTo(-3.2, -10); ctx.quadraticCurveTo(-3.4, -6.5, -.5, -5); ctx.quadraticCurveTo(-3.4, -3.5, -3.2, 0); ctx.lineTo(3.2, 0); ctx.quadraticCurveTo(3.4, -3.5, .5, -5); ctx.quadraticCurveTo(3.4, -6.5, 3.2, -10); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#f6c453'; ctx.beginPath(); ctx.moveTo(-2.6, -.4); ctx.quadraticCurveTo(0, -3.4, 2.6, -.4); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(-1.8, -8.6); ctx.lineTo(1.8, -8.6); ctx.lineTo(0, -6.2); ctx.closePath(); ctx.fill();
        ctx.fillRect(-.25, -5.4, .5, 2.8);
        ctx.fillStyle = '#a0683c'; ctx.strokeStyle = OL; ctx.lineWidth = .8;
        for (const yy of [-11.6, 0]) { ctx.beginPath(); canvasRoundRect(ctx, -4.4, yy, 8.8, 1.8, .6); ctx.fill(); ctx.stroke(); }
        ctx.fillStyle = '#7a4a2a'; ctx.fillRect(-4, -10, .9, 10); ctx.fillRect(3.1, -10, .9, 10);
        ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.fillRect(-2.2, -9, .6, 2.4);
        ctx.restore();
      }
      if (has.jar) {   // glass jar with cork, twine and a firefly glowing inside
        ctx.save(); ctx.translate(has.sand ? 3.8 : 0, .6);
        const pulse = .65 + .35 * Math.sin(tt * 5);
        const g = ctx.createRadialGradient(0, -5, 0, 0, -5, 10); g.addColorStop(0, `rgba(232,255,138,${.55 * pulse})`); g.addColorStop(1, 'rgba(232,255,138,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, -5, 10, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.moveTo(-3, -9); ctx.lineTo(3, -9); ctx.quadraticCurveTo(4.6, -8, 4.6, -5.5); ctx.lineTo(4.6, -1.2); ctx.quadraticCurveTo(4.6, 0, 3.2, 0); ctx.lineTo(-3.2, 0); ctx.quadraticCurveTo(-4.6, 0, -4.6, -1.2); ctx.lineTo(-4.6, -5.5); ctx.quadraticCurveTo(-4.6, -8, -3, -9); ctx.closePath();
        ctx.fillStyle = 'rgba(200,236,255,.45)'; ctx.fill(); ctx.strokeStyle = '#2f4f66'; ctx.lineWidth = .9; ctx.stroke();
        ctx.fillStyle = `rgba(255,252,200,${.9 * pulse})`; ctx.beginPath(); ctx.arc(Math.sin(tt * 3) * 1.4, -4 + Math.cos(tt * 4) * 1.2, 1.4, 0, 7); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(-3, -6.5); ctx.lineTo(-3, -2); ctx.stroke();
        ctx.fillStyle = '#b07a48'; ctx.strokeStyle = OL; ctx.lineWidth = .8; ctx.beginPath(); canvasRoundRect(ctx, -2.8, -11.6, 5.6, 2.8, .8); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = '#e8d2a0'; ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(-3.6, -8.4); ctx.lineTo(3.6, -8.4); ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
    }
    ctx.translate(nx, ny); ctx.scale(k, k);
    if ((has.bell || showGoldenCollar) && !has.scarf) {   // thin ribbon collar with a tiny buckle
      ctx.beginPath(); ctx.moveTo(-nr, -3.5); ctx.quadraticCurveTo(0, 2.6, nr, -4.5);
      ctx.strokeStyle = OL; ctx.lineWidth = 3.6; ctx.stroke(); ctx.strokeStyle = showGoldenCollar ? '#ffe08a' : '#4f7bff'; ctx.lineWidth = 2.2; ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(-nr * .8, -3.4); ctx.quadraticCurveTo(0, 1.6, nr * .8, -4.2); ctx.stroke();
    }
    if (has.scarf) {
      const kx = -nr * .45, ky = 1.2;   // knot position on the front of the neck
      // two scarf tails hanging from the knot, swinging gently
      const tail = (len, w, ang, dark) => {
        ctx.save(); ctx.translate(kx, ky); ctx.rotate(ang);
        ctx.beginPath(); ctx.moveTo(-w / 2, 0); ctx.lineTo(w / 2, 0); ctx.lineTo(w / 2 + .6, len); ctx.lineTo(-w / 2 - .6, len); ctx.closePath();
        ctx.fillStyle = dark ? '#b8333f' : '#e2505b'; ctx.fill(); ctx.strokeStyle = '#5a1420'; ctx.lineWidth = .9; ctx.stroke();
        ctx.fillStyle = '#ffe2b0'; ctx.fillRect(-w / 2 - .2, len * .45, w + .4, 1.3); ctx.fillRect(-w / 2 - .3, len * .7, w + .6, 1.3);
        ctx.strokeStyle = '#ffe2b0'; ctx.lineWidth = .7; ctx.beginPath(); for (let f = -w / 2; f <= w / 2 + .01; f += w / 3) { ctx.moveTo(f * 1.1, len); ctx.lineTo(f * 1.1, len + 2); } ctx.stroke();
        ctx.restore();
      };
      tail(10, 3.6, .55 + sway * .12, true);
      tail(12, 4.2, .2 + sway * .16, false);
      // the band wrapped around the neck: a soft curved shape, not a stick
      ctx.beginPath(); ctx.moveTo(-nr - .5, -5.2); ctx.quadraticCurveTo(0, .2, nr + .5, -6.4); ctx.lineTo(nr + .3, -1.8); ctx.quadraticCurveTo(0, 5.4, -nr - .3, -.6); ctx.closePath();
      const sg = ctx.createLinearGradient(0, -6, 0, 5); sg.addColorStop(0, '#f2707a'); sg.addColorStop(1, '#c43c48');
      ctx.fillStyle = sg; ctx.fill(); ctx.strokeStyle = '#5a1420'; ctx.lineWidth = 1; ctx.stroke();
      ctx.save(); ctx.clip(); ctx.strokeStyle = 'rgba(120,20,35,.35)'; ctx.lineWidth = .6;
      for (let x = -nr; x <= nr; x += 1.8) { ctx.beginPath(); ctx.moveTo(x, -8); ctx.lineTo(x + .8, 6); ctx.stroke(); }
      ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(-nr * .8, -3.6); ctx.quadraticCurveTo(0, .6, nr * .8, -4.6); ctx.stroke();
      ctx.restore();
      // knot
      ctx.beginPath(); ctx.ellipse(kx, ky, 2.6, 2.2, 0, 0, 7); ctx.fillStyle = '#d8434e'; ctx.fill(); ctx.strokeStyle = '#5a1420'; ctx.lineWidth = .9; ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.beginPath(); ctx.ellipse(kx - .7, ky - .8, .9, .5, 0, 0, 7); ctx.fill();
    }
    if (has.bell) {   // little golden bell that swings as the cat moves
      ctx.save(); ctx.translate(nr * .3, has.scarf ? 2.4 : 1.2); ctx.rotate(sway * (moving ? .35 : .15));
      ctx.strokeStyle = '#7a5410'; ctx.lineWidth = .9; ctx.beginPath(); ctx.arc(0, .6, 1, 0, 7); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-3.6, 6.2); ctx.quadraticCurveTo(-3.4, 1.4, 0, 1.4); ctx.quadraticCurveTo(3.4, 1.4, 3.6, 6.2); ctx.quadraticCurveTo(4.4, 6.6, 4.2, 7.2); ctx.lineTo(-4.2, 7.2); ctx.quadraticCurveTo(-4.4, 6.6, -3.6, 6.2); ctx.closePath();
      const bg = ctx.createLinearGradient(-3.5, 1, 3.5, 7); bg.addColorStop(0, '#fff3b8'); bg.addColorStop(.45, '#f6c453'); bg.addColorStop(1, '#c08a24');
      ctx.fillStyle = bg; ctx.fill(); ctx.strokeStyle = '#6b4a10'; ctx.lineWidth = .9; ctx.stroke();
      ctx.fillStyle = '#6b4a10'; ctx.beginPath(); ctx.arc(0, 7.6, 1, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.beginPath(); ctx.ellipse(-1.4, 3.4, .7, 1.2, -.4, 0, 7); ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }
  // Shop preview: the current cat wearing one item, drawn straight into a <canvas> in the shop card
  // (no toDataURL, so it also works when the game is opened from a local file)
  function drawGearPreview(cvs, items) {
    const spr = mkGetSprite(MK_PROFILE.coat);
    if (!spr || !spr.complete || !spr.naturalWidth) { spr && spr.addEventListener('load', () => drawGearPreview(cvs, items), { once: true }); return; }
    const main = ctx; ctx = cvs.getContext('2d');
    try {
      ctx.clearRect(0, 0, cvs.width, cvs.height);
      const hh = 190, ww = hh * spr.naturalWidth / spr.naturalHeight, x0 = cvs.width / 2 - ww / 2, y0 = 18;
      ctx.fillStyle = 'rgba(8,10,24,.35)'; ctx.beginPath(); ctx.ellipse(cvs.width / 2, y0 + hh - 6, ww * .34, 9, 0, 0, 7); ctx.fill();
      if (!mkDrawRig(ctx, MK_PROFILE.coat, x0, y0, ww, hh, { back: 0, front: 0, tail: 0, breath: 0 })) ctx.drawImage(spr, x0, y0, ww, hh);
      drawCatGear(null, x0, y0, ww, hh, false, items);
    } finally { ctx = main; }
  }
  function mkDrawSprite(c) {
    const spr = mkGetSprite(MK_PROFILE.coat);
    if (!spr || !spr.complete || !spr.naturalWidth) return false;
    const hh = 70, ww = hh * spr.naturalWidth / spr.naturalHeight;
    const speed = Math.abs(c.vx), moving = c.on && speed > 10, ph = c.walk;
    // Stride grows smoothly with speed (no jump between walk and run), and the body rises and
    // falls on a soft wave instead of a sharp bounce at every step.
    // Gait: each leg pair swings forward with its paw lifted, then pushes back with the paw on the
    // ground. Only the body bobs; the standing paws never leave the floor.
    const pace = clamp((speed - 10) / 280, 0, 1), amp = c.sneak ? .22 : .32 + .22 * pace;
    let back = 0, front = 0, tail, breath = 0, bodyY = 0, backLift = 0, frontLift = 0;
    if (scratchAnim > 0 && c.on) { front = Math.sin(t * 20) * .58; frontLift = Math.max(0, Math.sin(t * 20)) * .25; back = -.08; tail = .28 + Math.sin(t * 8) * .12; breath = .01; bodyY = 1.3; }
    else if (c.pounce > 0) { back = -.62; front = .72; tail = -.42; backLift = .12; frontLift = .2; }
    else if (!c.on) { const rising = c.vy < 0; back = rising ? -.38 : .25; front = rising ? .32 : -.24; tail = rising ? -.32 : .3; backLift = rising ? .1 : .2; frontLift = rising ? .22 : .08; }
    else if (moving) {
      const lift = c.sneak ? .12 : .2 + .1 * pace;
      const vary = 1 + .1 * Math.sin(ph * .37) + .05 * Math.sin(ph * .91 + 2);   // no two steps exactly alike
      back = Math.sin(ph) * amp * vary; backLift = Math.max(0, Math.cos(ph)) ** 1.5 * lift * vary;
      front = -Math.sin(ph + 1.2) * amp * .95 * vary; frontLift = Math.max(0, -Math.cos(ph + 1.2)) ** 1.5 * lift;
      tail = Math.sin(ph * .5 + 1.1) * (.12 + .12 * pace);
      bodyY = -(1 - Math.cos(ph * 2)) * .5 * (c.sneak ? .4 : .6 + .8 * pace);
    }
    else { tail = Math.sin(t * 1.7) * .12 + Math.pow(Math.max(0, Math.sin(t * .83 + .7)), 8) * .28; breath = Math.sin(t * 2.2) * .016; }
    // ease every pose change (start, stop, jump, land) over a few frames instead of snapping
    const P = c.rigPose || (c.rigPose = { back, front, tail, bodyY, backLift, frontLift, at: t });
    const k = scratchAnim > 0 ? 1 : 1 - Math.exp(-Math.max(0, Math.min(.1, t - P.at)) * (moving ? 30 : 16));
    for (const [key, v] of [['back', back], ['front', front], ['tail', tail], ['bodyY', bodyY], ['backLift', backLift], ['frontLift', frontLift]]) P[key] += (v - P[key]) * k;
    P.at = t;
    back = P.back; front = P.front; tail = P.tail; bodyY = P.bodyY; backLift = P.backLift; frontLift = P.frontLift;
    const bob = 0;
    if (c.on) { ctx.fillStyle = 'rgba(8,10,24,.35)'; ctx.beginPath(); ctx.ellipse(-2, 2, ww * .36, 4.5, 0, 0, 7); ctx.fill(); }
    if (eyesT > 0) { ctx.shadowColor = '#c8ff8a'; ctx.shadowBlur = 16; }
    // cat.y is the paw baseline; keep the sprite's bottom edge on that line.
    const spriteY = -hh + bob;
    // a gentle rock of the body with each step (and a lean into jumps) so the walk feels alive
    const tilt = c.on ? (moving ? Math.sin(ph * 2 + .6) * .018 * (1 + pace) : 0) : clamp(c.vy / 9000, -.06, .06);
    ctx.save(); ctx.translate(0, -2); ctx.rotate(tilt); ctx.translate(0, 2);
    const ok = mkDrawRig(ctx, MK_PROFILE.coat, -ww / 2 - 2, spriteY, ww, hh, { back, front, tail, breath, bodyY, backLift, frontLift });
    if (!ok) ctx.drawImage(spr, -ww / 2 - 2, spriteY, ww, hh);
    ctx.restore();
    ctx.shadowBlur = 0;
    drawCatGear(c, -ww / 2 - 2, spriteY, ww, hh, moving);
    return true;
  }
  function drawCat() {
    const c = cat; if (c.respawning) return; ctx.save();
    if (c.falling) ctx.globalAlpha = clamp(1 - c.fallTime / .38, 0, 1);
    if (c.inv > 0 && Math.floor(c.inv * 12) % 2) ctx.globalAlpha = .45;
    { const px = dpr * S; ctx.translate(Math.round(c.x * px) / px, Math.round(c.y * px) / px); } ctx.scale(c.face, 1);
    let sxs = 1, sys = 1;
    if (c.pounce > 0) { sxs = 1.12; sys = .9; } else if (scratchAnim > 0 && c.on) { sxs = 1.03; sys = .92; } else if (c.squash > 0) { sxs = 1.04; sys = .95; } else if (c.sneak) { sys = .91; sxs = .98; } else if (!c.on) { sxs = .96; sys = 1.06; }
    // (removed: a lean that switched on and off right at top speed and made the cat flicker)
    ctx.scale(sxs, sys);
    if (!mkDrawSprite(c)) {
    const body = COAT.body, dark = COAT.dark, belly = COAT.belly;
    // tail
    ctx.strokeStyle = body; ctx.lineWidth = 7; ctx.lineCap = 'round';
    const sw = Math.sin(t * 5) * 8;
    ctx.beginPath(); ctx.moveTo(-22, -20); ctx.bezierCurveTo(-40, -24, -44, -46 + sw, -32, -54 + sw); ctx.stroke();
    // legs
    ctx.strokeStyle = dark; ctx.lineWidth = 6;
    const ph = c.walk, st = c.on ? 6 : 2;
    [[-14, 0], [-6, Math.PI], [10, Math.PI], [18, 0]].forEach(([lx, o]) => { const s = Math.sin(ph + o) * st; ctx.beginPath(); ctx.moveTo(lx, -12); ctx.lineTo(lx + s, -2); ctx.stroke(); });
    // body
    ctx.fillStyle = body; ctx.beginPath(); ctx.ellipse(0, -20, 26, 14, 0, 0, 7); ctx.fill();
    ctx.fillStyle = belly; ctx.beginPath(); ctx.ellipse(4, -14, 16, 6, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = dark; ctx.lineWidth = 3;
    [-12, -3, 6].forEach(sx2 => { ctx.beginPath(); ctx.moveTo(sx2, -33); ctx.lineTo(sx2 + 3, -26); ctx.stroke(); });
    // head
    ctx.fillStyle = body; ctx.beginPath(); ctx.arc(22, -32, 14, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.moveTo(12, -42); ctx.lineTo(14, -56); ctx.lineTo(22, -45); ctx.fill();
    ctx.beginPath(); ctx.moveTo(24, -45); ctx.lineTo(32, -56); ctx.lineTo(34, -40); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#f59a9a'; ctx.beginPath(); ctx.moveTo(15, -45); ctx.lineTo(15.5, -51); ctx.lineTo(19, -46); ctx.fill();
    // eyes (night eyes glow)
    ctx.fillStyle = '#c8ff8a'; ctx.shadowColor = '#c8ff8a'; ctx.shadowBlur = eyesT > 0 ? 26 : 10;
    ctx.beginPath(); ctx.ellipse(21, -34, 2.6, 3.6, 0, 0, 7); ctx.ellipse(29, -34, 2.6, 3.6, 0, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
    ctx.fillStyle = '#1a1206'; ctx.fillRect(21.2, -36.5, 1, 5); ctx.fillRect(29.2, -36.5, 1, 5);
    ctx.fillStyle = '#e07a6a'; ctx.beginPath(); ctx.arc(34, -28, 2, 0, 7); ctx.fill();
    }
    ctx.restore();
    if (purrT > 0) {
      for (let k = 0; k < 2; k++) {
        const ph = ((3 - purrT) * 1.2 + k * .5) % 1;
        ctx.strokeStyle = `rgba(200,255,138,${.45 * (1 - ph)})`; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(c.x, c.y - 24, 20 + ph * 6 * T, 0, 7); ctx.stroke();
      }
    }
    if (c.sneak && c.on) { ctx.fillStyle = 'rgba(246,196,83,.25)'; for (let k = 1; k <= 3; k++) { const h = hist[Math.max(0, hist.length - 1 - k * 6)]; if (h) { ctx.beginPath(); ctx.arc(h.x, h.y - 3, 3, 0, 7); ctx.fill(); } } }
  }

  function drawTrail() {
    if (trail.length > 0) {   // the string shows as soon as the first light follows Shwe
      if (TRAILS[trailPick].rainbow) {
        // each piece of the trail gets the next colour of the rainbow, slowly shifting
        ctx.lineWidth = 5; ctx.lineCap = 'round';
        let px = cat.x, py = cat.y - 34;
        trail.forEach((l, i) => { ctx.strokeStyle = `hsla(${(i * 40 + t * 90) % 360},90%,70%,.9)`; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(l.x, l.y); ctx.stroke(); px = l.x; py = l.y; });
      } else {
        // the original thin string, just a little lighter so it reads on dark maps
        ctx.strokeStyle = `rgba(${TRAILS[trailPick].c},${trailPick === 'honey' ? .32 : .6})`; ctx.lineWidth = trailPick === 'honey' ? 2.5 : 3; ctx.lineCap = 'round'; ctx.beginPath();
        ctx.moveTo(cat.x, cat.y - 34); trail.forEach(l => ctx.lineTo(l.x, l.y)); ctx.stroke();
      }
    }
    trail.forEach(l => lightShape(l.type, l.x, l.y, 1, l.v));
  }
  function drawParts() {
    for (const p of parts) { ctx.globalAlpha = clamp(p.life / p.max, 0, 1); ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill(); }
    ctx.globalAlpha = 1; ctx.textAlign = 'center';
    for (const f of floats) { ctx.globalAlpha = clamp(f.life / .4, 0, 1); ctx.font = `800 18px ${DISP}`; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(18,12,36,.8)'; ctx.strokeText(f.text, f.x, f.y); ctx.fillStyle = f.c; ctx.fillText(f.text, f.x, f.y); }
    ctx.globalAlpha = 1;
  }

  // ---- sketchbook HUD helpers: paper notes, washi tape, crayon ink ----
  const HAND = '"Gaegu", ' + DISP, PAPER = '#f6eedc', PAPER2 = '#fffdf6', SB_INK = '#2b2547', SB_INK2 = '#4a4460';
  function sbPaper(x, y, w, h, rot = 0, fill = PAPER) {
    ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.rotate(rot);
    ctx.shadowColor = 'rgba(8,5,25,.45)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 5;
    ctx.fillStyle = fill; ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.restore();
  }
  function sbTape(cx, cy, w, h, rot, color) {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.fillStyle = color;
    const z = h / 4; ctx.beginPath(); ctx.moveTo(-w / 2, -h / 2); ctx.lineTo(w / 2, -h / 2);
    for (let i = 1; i <= 4; i++) ctx.lineTo(w / 2 - (i % 2 ? 4 : 0), -h / 2 + z * i);
    ctx.lineTo(-w / 2, h / 2);
    for (let i = 3; i >= 0; i--) ctx.lineTo(-w / 2 + (i % 2 ? 4 : 0), -h / 2 + z * i);
    ctx.closePath(); ctx.fill(); ctx.restore();
  }
  function sbPaw(x, y, k, alive) {
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
    ctx.lineWidth = 1.4; ctx.strokeStyle = alive ? '#4a1830' : 'rgba(59,53,80,.55)'; ctx.fillStyle = alive ? '#e8587a' : 'rgba(0,0,0,0)';
    if (!alive) ctx.setLineDash([2, 2]);
    for (const [cx, cy, rx, ry] of [[0, 4, 6.5, 5.5], [-7.5, -3, 2.8, 2.8], [-2.5, -7, 2.8, 2.8], [2.5, -7, 2.8, 2.8], [7.5, -3, 2.8, 2.8]]) { ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
    ctx.restore();
  }
  function sbSticker(x, y, r, ring, ready, glowing, key, icon) {
    ctx.save();
    ctx.shadowColor = 'rgba(8,5,25,.45)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3;
    ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.beginPath(); ctx.arc(x, y, r + 4, 0, Math.PI * 2); ctx.fill();
    ctx.shadowColor = 'rgba(0,0,0,0)';
    ctx.strokeStyle = glowing ? '#c8ff8a' : ready ? '#8fe0ff' : 'rgba(255,255,255,.75)'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(x, y, r + 2, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * clamp(ring, 0, 1)); ctx.stroke();
    ctx.fillStyle = ready || glowing ? PAPER : '#d9d0bd'; ctx.beginPath(); ctx.arc(x, y, r - 1, 0, Math.PI * 2); ctx.fill();
    icon(x, y);
    ctx.fillStyle = SB_INK; rrect(x + r - 10, y + r - 12, 18, 18, 4); ctx.fill();
    ctx.fillStyle = PAPER; ctx.font = `800 11px ${BODY}`; ctx.textAlign = 'center'; ctx.fillText(key, x + r - 1, y + r + 1);
    ctx.restore();
  }
  function chip(x, y, type, have, needN, width = 104, compact = false) {
    const done = have >= needN;
    const h = compact ? 30 : 40, iconX = compact ? 17 : 22, iconY = compact ? 15 : 20;
    ctx.fillStyle = PAPER; ctx.strokeStyle = done ? '#2f9a63' : 'rgba(59,53,80,.18)'; ctx.lineWidth = done ? 2.5 : 1.5;
    ctx.beginPath(); ctx.roundRect ? canvasRoundRect(ctx, x, y, width, h, h / 2) : ctx.rect(x, y, width, h); ctx.fill(); ctx.stroke();
    // a feeling Shwe hasn't caught yet tonight stays in pencil grey
    if (!have) { ctx.save(); ctx.filter = 'grayscale(1) opacity(.55)'; }
    lightShape(type, x + iconX, y + iconY, compact ? .74 : .95);
    if (!have) ctx.restore();
    ctx.fillStyle = done ? '#2f7a52' : have ? SB_INK : '#6b6480'; ctx.font = `700 ${compact ? 17 : 26}px ${HAND}`; ctx.textAlign = 'left';
    ctx.fillText(`${have}/${needN}`, x + (compact ? 31 : 44), y + (compact ? 21 : 29));
    if (done) {
      ctx.save(); ctx.strokeStyle = '#2f9a63'; ctx.lineWidth = compact ? 3 : 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      const cx = x + width - (compact ? 8 : 10), cy = y + (compact ? 2 : 0);
      ctx.beginPath(); ctx.moveTo(cx - 9, cy + 1); ctx.lineTo(cx - 4, cy + 6); ctx.lineTo(cx + 6, cy - 7); ctx.stroke(); ctx.restore();
    }
  }
  // "Found" strip under the counters: trinkets picked up this run and Thiri's keepsakes on this night.
  // It can be turned off in Settings (Show items found).
  let showItemsHud = (() => { try { return localStorage.getItem('mk-show-items') !== '0'; } catch (e) { return true; } })();
  function drawItemsFound(yTop) {
    if (!showItemsHud) return;
    const parts = [];
    // only list a kind of item while some of it is still out on this map to find
    if (trinkets.some(k => !k.taken) && !pouchFull()) parts.push({ kind: 't', text: `${trinkets.filter(k => k.taken).length}/${trinkets.length}` });
    if (mode === 'story' && keepsakesFound(storyNight) < keepsakeTotal(storyNight)) parts.push({ kind: 'k', text: `${keepsakesFound(storyNight)}/${keepsakeTotal(storyNight)}` });
    if (!parts.length) return;
    ctx.save();
    ctx.font = `700 12px ${BODY}`; const lw = ctx.measureText('FOUND').width + 10;
    ctx.font = `700 19px ${HAND}`;
    const widths = parts.map(p => 28 + ctx.measureText(p.text).width + 12), w = lw + widths.reduce((a, b) => a + b, 0) + 14, h = 30, x = VW - 22 - w, y = yTop;
    sbPaper(x, y, w, h, .015, PAPER2);
    ctx.font = `700 12px ${BODY}`; ctx.textAlign = 'left'; ctx.fillStyle = SB_INK2; ctx.fillText('FOUND', x + 10, y + h / 2 + 4);
    let cx = x + 10 + lw;
    parts.forEach((p, i) => {
      const cy = y + h / 2;
      if (p.kind === 't') drawTrinket('button', cx + 10, cy, ctx);
      else { const [, c] = KEEPSAKE_ART[currentMapKey()] || KEEPSAKE_ART.free; ctx.save(); ctx.translate(cx + 10, cy); ctx.scale(.85, .85); drawKeepsake(currentMapKey(), 0, 0, c); ctx.restore(); }
      ctx.font = `700 19px ${HAND}`; ctx.textAlign = 'left'; ctx.fillStyle = SB_INK; ctx.fillText(p.text, cx + 24, cy + 6);
      cx += widths[i];
    });
    ctx.restore();
  }
  function drawHUD() {
    if (state === 'menu') return;
    const top = 16 - Math.min(0, OY);
    const tl = Math.max(0, timeLeft), m = Math.floor(tl / 60), s = Math.floor(tl % 60);
    const urgent = tl <= 15 && state === 'play';
    ctx.textAlign = 'left';
    const hudCompact = innerWidth <= 400;
    sbPaper(HUD_X, top - 2, HUD_CARD_W, 74, -.025);
    sbTape(HUD_X + HUD_CARD_W / 2, top - 4, 54, 16, -.04, 'rgba(154,130,232,.72)');
    if (mode === 'free') {
      // free play is a chill wander: no clock, no score, nothing to lose
      ctx.font = `700 ${hudCompact ? 26 : 30}px ${HAND}`; ctx.fillStyle = SB_INK; ctx.fillText('Free play', HUD_X + 12, top + 32);
      ctx.font = `700 ${hudCompact ? 12 : 13}px ${BODY}`; ctx.fillStyle = SB_INK2; ctx.fillText('no clock · just wander', HUD_X + 13, top + 58);
    } else {
    ctx.font = `700 ${urgent ? (hudCompact ? 42 : 46) + Math.sin(t * 10) * 2 : hudCompact ? 40 : 44}px ${HAND}`; ctx.fillStyle = urgent ? '#c2473f' : SB_INK;
    ctx.fillText(`${m}:${String(s).padStart(2, '0')}`, HUD_X + 12, top + 36);
    ctx.font = `700 ${hudCompact ? 12 : 13}px ${BODY}`; ctx.fillStyle = SB_INK2; ctx.fillText('SCORE', HUD_X + 13, top + 60);
    ctx.font = `700 ${hudCompact ? 24 : 26}px ${HAND}`; ctx.fillStyle = SB_INK; ctx.fillText(score.toLocaleString(), HUD_X + 66, top + 62);
    }
    if (mode === 'story') {
      const lx = HUD_X + HUD_CARD_W + 10, ly = top + 8;
      sbPaper(lx, ly, 74, 34, .03, PAPER2);
      for (let i = 0; i < 3; i++) sbPaw(lx + 15 + i * 22, ly + 18, .82, i < lives);
    }
    const hudChapter = mode === 'story' ? chapterFor(storyNight) : null;
    const skyEnabled = !!hudChapter && skyTotalFor(hudChapter) > 0;
    const skyLive = skyEnabled && mood.some(m => m.sky && !m.dead && ['wait', 'falling', 'struck', 'scratchReq', 'scratched'].includes(m.skyPhase));
    const compactSky = VW < 900;
    if (skyEnabled) {
      const sx = compactSky ? HUD_X : HUD_X + HUD_CARD_W + 86, sy = top + (compactSky ? 72 : 8), sw = 112, sh = 28;
      ctx.save(); ctx.globalAlpha = skyLive ? .84 + .16 * Math.sin(t * 5) : 1;
      ctx.fillStyle = PAPER2; ctx.strokeStyle = skyLive ? '#4d6fd6' : 'rgba(59,53,80,.25)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.roundRect ? canvasRoundRect(ctx, sx, sy, sw, sh, 14) : ctx.rect(sx, sy, sw, sh); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#f2b53a'; ctx.beginPath(); ctx.arc(sx + 15, sy + 14, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = PAPER2; ctx.beginPath(); ctx.arc(sx + 19, sy + 11, 6, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = SB_INK; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(sx + 25, sy + 10); ctx.lineTo(sx + 25, sy + 20); ctx.lineTo(sx + 22, sy + 17); ctx.moveTo(sx + 25, sy + 20); ctx.lineTo(sx + 28, sy + 17); ctx.stroke();
      ctx.font = `700 18px ${HAND}`; ctx.textAlign = 'left'; ctx.fillStyle = SB_INK; ctx.fillText(skyLive ? 'Sky · ↓' : `Sky ×${skyRemaining(hudChapter)}`, sx + 35, sy + 20);
      ctx.restore();
    }
    const comboY = top + 96 + (skyEnabled && compactSky ? 32 : 0);
    if (combo > 1) {
      sbPaper(12, comboY - 28, 140 + combo * 3, 50, .02, combo >= 5 ? '#ffd3e3' : combo >= 3 ? '#d9f2c8' : '#ffe28a');
      ctx.font = `700 ${30 + combo}px ${HAND}`; ctx.fillStyle = SB_INK; ctx.fillText(`×${combo} combo`, 22, comboY);
      ctx.fillStyle = 'rgba(59,53,80,.18)'; ctx.fillRect(22, comboY + 8, 120, 5);
      ctx.fillStyle = combo >= 5 ? '#c24f86' : combo >= 3 ? '#2f9a63' : '#c48a10'; ctx.fillRect(22, comboY + 8, 120 * clamp(comboT / 4, 0, 1), 5);
    }
    if (skyEnabled && skySpawned > 0) {
      const perfectY = top + (combo > 1 ? (compactSky ? 160 : 128) : (compactSky ? 104 : 92));
      ctx.textAlign = 'left'; ctx.font = `600 12px ${BODY}`; ctx.fillStyle = MUTED; ctx.fillText(`Perfect skies: ${skyPerfect}`, 22, perfectY);
    }
    {
      let ay = skyEnabled ? top + (combo > 1 ? (compactSky ? 186 : 153) : (compactSky ? 128 : 116)) : top + (combo > 1 ? 132 : 92);
      const sr = 19, sy0 = ay + 8;
      sbSticker(22 + sr, sy0, sr, eyesT > 0 ? 1 : eyesCd > 0 ? 1 - eyesCd / 9 : 1, eyesCd <= 0, eyesT > 0, 'E', (x, y) => {
        ctx.fillStyle = '#cfe6ff'; ctx.strokeStyle = SB_INK; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x - 11, y); ctx.quadraticCurveTo(x, y - 10, x + 11, y); ctx.quadraticCurveTo(x, y + 10, x - 11, y); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = SB_INK; ctx.beginPath(); ctx.arc(x, y, 3.6, 0, Math.PI * 2); ctx.fill();
      });
      let nx = 22 + sr * 2 + 16;
      if (upg.purr > 0) {
        const full = uv('purr') || 1;
        sbSticker(nx + sr, sy0, sr, purrCd > 0 ? 1 - purrCd / full : 1, purrCd <= 0, purrT > 0, 'K', (x, y) => {
          ctx.fillStyle = '#ffd3e3'; ctx.strokeStyle = SB_INK; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(x, y + 8); ctx.bezierCurveTo(x - 12, y, x - 9, y - 9, x, y - 4); ctx.bezierCurveTo(x + 9, y - 9, x + 12, y, x, y + 8); ctx.closePath(); ctx.fill(); ctx.stroke();
        });
        nx += sr * 2 + 16;
      }
      const packed = ITEMS.filter(i => activeItems[i.id] && i.id !== 'sand').map(i => i.icon).join(' ');
      if (packed) { ctx.textAlign = 'left'; ctx.font = `600 18px ${BODY}`; ctx.fillStyle = INK; ctx.fillText(packed, nx, sy0 + 6); }
    }
    if (mode === 'story') {
      const types = Object.keys(need).filter(type => need[type] > 0), compactNeeds = types.length >= 7 && VW < 1050;
      {
        const n = compactNeeds ? Math.min(4, types.length) : types.length, w0 = compactNeeds ? 72 : types.length >= 7 ? 64 : types.length >= 5 ? 78 : types.length === 4 ? 88 : 96, g0 = compactNeeds ? 6 : 8;
        const rows = compactNeeds ? Math.ceil(types.length / 4) : 1, tw = n * (w0 + g0) - g0 + 28, th = compactNeeds ? rows * 34 + 14 : 56;
        const tx = VW - 22 - (n * (w0 + g0) - g0) - 14, ty = top - 2;
        ctx.save(); ctx.translate(tx + tw / 2, ty + th / 2); ctx.rotate(-.008);
        ctx.shadowColor = 'rgba(8,5,25,.35)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3;
        ctx.fillStyle = 'rgba(154,130,232,.86)'; ctx.beginPath(); ctx.moveTo(-tw / 2, -th / 2); ctx.lineTo(tw / 2, -th / 2);
        for (let i = 1; i <= 6; i++) ctx.lineTo(tw / 2 - (i % 2 ? 6 : 0), -th / 2 + th * i / 6);
        ctx.lineTo(-tw / 2, th / 2);
        for (let i = 5; i >= 0; i--) ctx.lineTo(-tw / 2 + (i % 2 ? 6 : 0), -th / 2 + th * i / 6);
        ctx.closePath(); ctx.fill(); ctx.restore();
      }
      if (compactNeeds) {
        const columns = 4, width = 72, gap = 6, rowStep = 34, startX = VW - 22 - columns * (width + gap) + gap;
        types.forEach((type, i) => chip(startX + (i % columns) * (width + gap), top + 6 + Math.floor(i / columns) * rowStep, type, got[type] || 0, need[type], width, true));
      } else {
        const width = types.length >= 7 ? 64 : types.length >= 5 ? 78 : types.length === 4 ? 88 : 96, gap = 8;
        let x = VW - 22 - types.length * (width + gap) + gap;
        for (const type of types) { chip(x, top + 6, type, got[type] || 0, need[type], width); x += width + gap; }
      }
      ctx.font = `700 12px ${BODY}`; ctx.textAlign = 'right'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(12,8,28,.7)'; ctx.fillStyle = '#f6eedc';
      const hl = `${hourOf(storyNight).toUpperCase()} · ${chapterFor(storyNight).name.toUpperCase()}`, hy = top + (compactNeeds ? 96 : 72);
      ctx.strokeText(hl, VW - 22, hy); ctx.fillText(hl, VW - 22, hy);
      drawItemsFound(hy + 8);
    } else {
      ctx.textAlign = 'right'; ctx.font = `700 15px ${BODY}`; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(12,8,28,.7)'; ctx.fillStyle = '#f6eedc';
      ctx.strokeText('Nothing is counted here. Pause to go home.', VW - 22, top + 30); ctx.fillText('Nothing is counted here. Pause to go home.', VW - 22, top + 30);
      drawItemsFound(top + 66);
    }
    if (atPortal()) {
      const bob = Math.sin(t * 4) * 2;
      ctx.textAlign='center';ctx.font=`800 20px ${DISP}`;ctx.lineWidth=5;ctx.strokeStyle='rgba(8,14,22,.92)';ctx.fillStyle='#fff3c4';
      const msg = touchUI && !touchUI.hidden ? 'Tap  Go home  to go through the moon door' : 'H  Go home through the moon door';
      ctx.strokeText(msg,VW/2,VH - 104 + bob);ctx.fillText(msg,VW/2,VH - 104 + bob);
    }
    if (scratchTarget && (scratchTarget.kind === 'rock' || scratchTarget.type === 'sky' || scratchTarget.state === 'hide')) {
      ctx.textAlign='center';ctx.font=`800 17px ${DISP}`;ctx.lineWidth=4;ctx.strokeStyle='rgba(8,14,22,.92)';ctx.fillStyle='#f4e8c7';
      const prompt = scratchTarget.type === 'breath' ? (scratchTarget.mood.bphase < .5 ? 'Hold S · breathe in…' : 'Let go · breathe out…') : scratchTarget.type === 'sky' ? 'Scratch it! (S)' : scratchTarget.kind === 'rock' ? `S  Scratch ${scratchTarget.rock.marked && eyesT > 0 ? scratchTarget.rock.labelMarked : scratchTarget.rock.label}` : `S  Scratch ${scratchTarget.caveX != null ? CAVE_LABELS[currentMapKey()] : 'hiding spot'}`, py=VH-74;
      ctx.strokeText(prompt,VW/2,py);ctx.fillText(prompt,VW/2,py);
    } else if (scratchAnim>0) {
      ctx.textAlign='center';ctx.font=`800 16px ${DISP}`;ctx.fillStyle='#f4e8c7';ctx.fillText('Scratching…',VW/2,VH-74);
    }
    if (banner) {
      const a = clamp(banner.life / .3, 0, 1) * clamp((banner.max - banner.life) / .2, 0, 1);
      ctx.globalAlpha = a; ctx.textAlign = 'center';
      // wrap long tips onto several lines so they always fit the screen
      const maxW = Math.min(VW - 80, 900); let size = 30, lines;
      for (;;) {
        ctx.font = `700 ${Math.round(size * 1.15)}px ${HAND}`; lines = []; let line = '';
        for (const w of banner.text.split(' ')) { const tryL = line ? line + ' ' + w : w; if (ctx.measureText(tryL).width > maxW && line) { lines.push(line); line = w; } else line = tryL; }
        lines.push(line); if (lines.length <= 3 || size <= 18) break; size -= 3;
      }
      const bubbleW = Math.min(maxW + 36, Math.max(...lines.map(line => ctx.measureText(line).width)) + 36);
      const bh = lines.length * size * 1.2 + 26;
      sbPaper((VW - bubbleW) / 2, 124, bubbleW, bh, -.006, PAPER2);
      sbTape(VW / 2, 124, 70, 18, .03, 'rgba(255,207,92,.75)');
      ctx.font = `700 ${Math.round(size * 1.15)}px ${HAND}`;
      lines.forEach((ln, i) => {
        const y = 160 + i * size * 1.2, w = ctx.measureText(ln).width;
        ctx.strokeStyle = banner.c; ctx.globalAlpha = a * .55; ctx.lineWidth = 5; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(VW / 2 - w / 2, y + 6); ctx.quadraticCurveTo(VW / 2, y + 9, VW / 2 + w / 2, y + 5); ctx.stroke();
        ctx.globalAlpha = a; ctx.fillStyle = SB_INK; ctx.fillText(ln, VW / 2, y);
      });
      ctx.globalAlpha = 1;
    }
  }

  function render(dt) {
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#120c24'; ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.setTransform(dpr * S, 0, 0, dpr * S, 0, dpr * S * OY);
    if (shake > 0) ctx.translate((Math.random() - .5) * shake, (Math.random() - .5) * shake);
    drawBG();
    // snap the camera to whole screen pixels: a camera between pixels makes posts, trunks and the cat's
    // stripes shimmer (like 'lllll') as the town scrolls, especially on screens scaled to 125% or 150%
    { const px = dpr * S; ctx.save(); ctx.translate(-Math.round(camX * px) / px, 0); }
    drawWorld(); drawHazards(); drawTrinkets(); drawPortal(); drawMoods(); drawGuidanceMarker(); drawFireflies(); drawTrail();
    drawCat(); drawParts(); drawLevelDebug();
    ctx.restore();
    if (eyesT > 0) {
      const sx = cat.x - camX, sy = cat.y - 24, r = uv('eyes') * T, fade = Math.min(1, eyesT / .4, (eyesDur() - eyesT) / .25);
      const g = ctx.createRadialGradient(sx, sy, r * .75, sx, sy, r * 1.15);
      g.addColorStop(0, 'rgba(6,12,24,0)'); g.addColorStop(1, `rgba(6,12,24,${.6 * fade})`);
      ctx.fillStyle = g; ctx.fillRect(0, -OY, VW, VH + OY * 2);
      ctx.strokeStyle = `rgba(200,255,138,${.35 * fade})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(sx, sy, r, 0, 7); ctx.stroke();
    }
    drawHUD();
    if (fallDimT > 0) { ctx.save(); ctx.globalAlpha = clamp(fallDimT / .5, 0, 1) * .46; ctx.fillStyle = '#080817'; ctx.fillRect(0, -OY, VW, VH + OY * 2); ctx.restore(); }
  }

  // ---------- flow ----------
  function getBest(k = 'mk-best') { try { return +localStorage.getItem(k) || 0; } catch (e) { return 0; } }
  function setBest(k, v) { try { localStorage.setItem(k, String(v)); } catch (e) {} }
  let R = null;
  function finish(won, failReason = null) {
    if (state === 'over' || state === 'home') return;
    if (won || mode === 'free') window.TCHeart?.bank(workshopRun);
    // trinkets carried this run are only safe once the night ends well
    if (won || mode === 'free') { const kept = trinketRun.slice(0, Math.max(0, POUCH_SIZE - pouch.length)); pouch.push(...kept); savePouch(); lastTrinkets = { kept: kept.length, lost: 0 }; trinketIds.slice(0, kept.length).forEach(id => foundTrinkets.add(id)); saveFoundTrinkets(); }
    else lastTrinkets = { kept: 0, lost: trinketRun.length };
    trinketRun = []; trinketIds = [];
    workshopRun = [];
    state = 'over'; pauseBtn.hidden = true; pauseScreen.hidden = true; touchUI.hidden = true; mouseSneakHeld = false; mouseSneakPointerId = null; mouseSneakPress = null;
    if (runN >= 3 && startles === 0) bump('quietN');
    if (mode === 'story' && storyNight === 1 && won && hits === 0) bump('nohit');
    let unlockedNow = false;
    if (mode === 'story' && won) {
      const before = unlockedLevel;
      unlockedLevel = clamp(Math.max(unlockedLevel, storyNight + 1), 1, 50);
      thiriSleepStage = clamp(Math.max(thiriSleepStage, storyNight), 0, 7);
      unlockedNow = unlockedLevel > before; saveStoryProgress();
    }
    lastGlow = glowRun; glow += glowRun; glowRun = 0; saveUpg(); refreshShopBtns();
    if (mode === 'free') {
      state = 'menu'; cv.hidden = true; showMainMenu(true); return;
    }
    if (false) {
      const best = 0;
      R = {
        free: true, final: score, best, combo: bestCombo, home: caughtN, survived: freeT, level: level + 1,
        tip: hits > 0 ? 'Tip: getting hit costs 3 seconds. Let charges miss, then pounce on the dizzy ones.' : 'Tip: chain catches within 4 seconds. A ×5 combo is where the big scores come from.'
      };
      tone(330, .35, 'triangle', .08, -80); showEnd(); return;
    }
    let final = score;
    const left = Math.max(0, timeLeft), bestKey = storyNight >= 7 ? `mk-best-night-${storyNight}` : 'mk-best';
    if (won) final += Math.round(left) * 20;
    setBest(bestKey, Math.max(getBest(bestKey), final));
    const best = Math.max(getBest(`mk-best-n${storyNight}`), final); setBest(`mk-best-n${storyNight}`, best);
    const starsN = starsFor(storyNight, final, won), prevStars = nightStars[storyNight] || 0;
    let starGlow = 0;
    if (starsN > prevStars) { for (let s = prevStars + 1; s <= starsN; s++) starGlow += STAR_GLOW[s]; nightStars[storyNight] = starsN; saveStars(); }
    const newTrails = grantStarTrails();
    if (starGlow || newTrails.length) { glow += starGlow; lastGlow += starGlow; saveUpg(); refreshShopBtns(); }
    R = {
      won, night: storyNight, total: requiredTotal(), left, final, best, combo: bestCombo, home: caughtTotal(), unlocked: unlockedNow, stage: thiriSleepStage, failReason,
      starsN, prevStars, starGlow, goals: starGoals(storyNight), newTrails,
      tip: chapterFor(storyNight).tutorialHints
        ? `Tip: ${chapterFor(storyNight).tutorialHint}`
        : hits > 0
          ? 'Tip: Frustrated charges when you get close. Let the charge miss, then pounce while it is dizzy.'
          : startles > 2
            ? 'Tip: Nervous Moodlings panic when you run or jump nearby. Sneak with Shift, or push the stick only halfway.'
            : 'Tip: catch again within 4 seconds to grow your combo up to ×5.'
    };
    tone(won ? 784 : 330, .35, 'triangle', .08, won ? 260 : -80);
    const types = trail.map(l => l.type), completedNight = storyNight;
    if (types.length) setTimeout(() => startHome(won, types, false, completedNight), 500);
    else showEnd();
  }
  function animateHubNumber(el, value, format = n => String(n)) {
    if (!el) return;
    const target = Math.max(0, Math.round(+value || 0));
    const from = Math.max(0, Math.round(+(el.dataset.displayed || el.textContent.replace(/[^0-9]/g, '')) || 0));
    const run = (+(el.dataset.animRun || 0)) + 1; el.dataset.animRun = String(run);
    if (from === target) { el.textContent = format(target); el.dataset.displayed = String(target); return; }
    const began = performance.now(), duration = 480;
    const tick = now => {
      if (+el.dataset.animRun !== run) return;
      const p = Math.min(1, (now - began) / duration), eased = 1 - Math.pow(1 - p, 3);
      el.textContent = format(Math.round(from + (target - from) * eased));
      if (p < 1) requestAnimationFrame(tick); else { el.textContent = format(target); el.dataset.displayed = String(target); }
    };
    requestAnimationFrame(tick);
  }
  const heroArt = document.querySelector('.hub-hero-art');
  function sizeHubCat() {
    const w = heroArt.clientWidth, h = heroArt.clientHeight;
    if (!w || !h) return;
    const scale = Math.max(w / 520, h / 620), catImage = $('#hubHeroCat');
    catImage.style.left = ((w - 520 * scale) / 2 + 175 * scale) + 'px';
    catImage.style.top = ((h - 620 * scale) / 2 + 255 * scale) + 'px';
    catImage.style.width = (210 * scale) + 'px';
    catImage.style.height = (190 * scale) + 'px';
  }
  if (typeof ResizeObserver === 'function') new ResizeObserver(sizeHubCat).observe(heroArt);
  addEventListener('resize', sizeHubCat);
  // Every page in the Mood Book: the night Moodlings plus the feelings made in the Heart Workshop.
  function bookTotals() {
    const HD = window.TCHeartData; let made = [], mixed = [];
    if (HD) { mixed = HD.feelings.filter(f => f.tier > 0); try { const d = HD.create(localStorage).snapshot().discovered; made = mixed.filter(f => d.includes(f.id)); } catch (e) {} }
    return { found: BOOK_ORDER.filter(k => book[k]).length + made.length, total: BOOK_ORDER.length + mixed.length };
  }
  function refreshHubStats() {
    const { found, total } = bookTotals();
    animateHubNumber($('#hubGlowValue'), glow);
    animateHubNumber($('#hubBookValue'), found, n => `${n} / ${total}`);
    $('#shopBtnValue').textContent = `${glow} Glow`;
    $('#bookBtnValue').textContent = `${found} / ${total} found`;
    { const tv = $('#roomTownValue'); if (tv && window.TCHeartData) { let lit = 0; try { lit = window.TCHeartData.create(localStorage).snapshot().lit.length; } catch (e) {} tv.textContent = `${lit} / ${window.TCHeartData.places.length} lit`; } }
    { const sc = $('#shelfCount'); if (sc) { const s2 = shelfTotals(); sc.textContent = `${s2.have} / ${s2.all} keepsakes`; } }
    sizeHubCat();
    $('#hubCatName').textContent = MK_PROFILE.cat.toUpperCase();
    $('#profileBtn').setAttribute('aria-label', `Profile and cat settings for ${MK_PROFILE.cat}`);
    const heroCat = $('#hubHeroCat');
    if (heroCat && COAT) heroCat.setAttribute('src', COAT.heroImg || COAT.img);
    const heroSvg = $('#hubHeroSvg');
    if (heroSvg && COAT) heroSvg.setAttribute('aria-label', `${MK_PROFILE.cat}, the ${COAT.name} cat on a moonlit pier beside a lantern and fishing net`);
    $('#profileBtn').style.setProperty?.('--hub-cat-color', (COAT && COAT.body) || '#e0b04a');
  }
  function refreshShopBtns() {
    const label = `Upgrade Shwe · ${glow} Glow`;
    $('#endShopBtn').textContent = label;
    refreshHubStats();
    renderMissions();
  }
  function renderMissions() {
    if (!ms || ms.date !== today()) loadMissions();
    const now = new Date(), mid = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const mins = Math.max(0, Math.round((mid - now) / 60000));
    $('#mReset').textContent = `New missions in ${Math.floor(mins / 60)}h ${mins % 60}m`;
    $('#mList').innerHTML = ms.ids.map(id => {
      const d = mdef(id), p = ms.prog[id] || 0, done = p >= d.goal, claimed = !!ms.claimed[id];
      const prog = d.goal > 1 ? `${p}/${d.goal}` : done ? 'Done' : '0/1';
      const side = claimed ? '<span class="ok">Claimed ✓</span>'
        : done ? `<button class="claim" data-mid="${id}">Claim +${d.reward}</button>`
          : `<span>+${d.reward} Glow</span><span>${prog}</span>`;
      return `<div class="mrow${done ? ' done' : ''}"><span class="mtext">${d.text}</span><div class="mside">${side}</div><div class="mbar"><i style="width:${Math.round(p / d.goal * 100)}%"></i></div></div>`;
    }).join('');
  }
  $('#mList').addEventListener('click', e => {
    const b = e.target.closest('button[data-mid]'); if (!b) return;
    const id = b.dataset.mid, d = mdef(id);
    if (!ms || ms.claimed[id] || (ms.prog[id] || 0) < d.goal) return;
    initAudio(); ms.claimed[id] = true; saveMissions(); glow += d.reward; saveUpg();
    tone(660, .15, 'triangle', .07); setTimeout(() => tone(990, .25, 'sine', .06), 90);
    refreshShopBtns(); $('#settingsCloseBtn').focus({ preventScroll: true });
  });
  // Mood Book portraits use the same Moodling art as the game, so every page matches what you catch.
  const bookPortraits = {};
  function moodLook(ty, v = 0) {
    return { F: { color: vcol('F', v), cy: 70 }, N: { color: vcol('N', v), cy: 70 }, L: { color: vcol('L', v), cy: 70 }, B: { color: vcol('B', v), cy: 70 },
      C: v === 1 ? { color: '#a8f0c8', glow: '#c9fff0', cy: 70 } : { color: '#4FDB92', glow: CALM, cy: 70 }, E: { color: EXC, cy: 72 }, S: { color: SHY, cy: 70 }, J: { color: JEAL, cy: 68 }, G: { color: '#FFE27A', glow: '#fff3c4', cy: 64 } }[ty] || { color: vcol(ty, v), cy: 70 };
  }
  function bookPortrait(ty, v, known) {
    const key = ty + v + (known ? 'k' : 'u');
    if (bookPortraits[key]) return bookPortraits[key];
    const c = document.createElement('canvas'); c.width = c.height = 168;
    const main = ctx; ctx = c.getContext('2d');
    try {
      drawCuteMood(ty, 84, 86, 1.55, { ...moodLook(ty, v), t: 0 });
      if (!known) { ctx.globalCompositeOperation = 'source-in'; ctx.fillStyle = 'rgba(243,236,255,.16)'; ctx.fillRect(0, 0, 168, 168); }
    } finally { ctx = main; }
    return (bookPortraits[key] = c.toDataURL());
  }
  function iconSVG(ty, v, known) {
    const poly = (n, r1, r2) => Array.from({ length: n * 2 }, (_, i) => { const r = i % 2 ? r2 : r1, a = -Math.PI / 2 + i * Math.PI / n; return `${(Math.cos(a) * r).toFixed(1)},${(Math.sin(a) * r).toFixed(1)}`; }).join(' ');
    const art = `<image href="${bookPortrait(ty, v, known)}" x="-28" y="-28" width="56" height="56"/>`;
    const mark = known ? '' : '<text y="6" text-anchor="middle" font-size="16" font-weight="800" fill="rgba(243,236,255,.55)">?</text>';
    const sparkle = known && v ? `<polygon points="${poly(4, 5, 1.6)}" transform="translate(19,-18)" fill="#fff6d6"/><polygon points="${poly(4, 4, 1.3)}" transform="translate(-20,15)" fill="#fff6d6"/>` : '';
    return `<svg viewBox="-28 -28 56 56" aria-hidden="true">${art}${mark}${sparkle}</svg>`;
  }
  function renderHelp() {
    const copy = guideCopy().help || {}, controls = guideCopy().controlLabels || {}, names = copy.controlNames || {};
    $('#helpTitle').textContent = copy.title || 'How to play'; $('#helpSubtitle').textContent = copy.subtitle || '';
    $('#helpControlsTitle').textContent = copy.controls || 'Controls'; $('#helpMoodsTitle').textContent = copy.moods || 'Moodlings';
    $('#helpMoodsNote').textContent = copy.moodsNote || '';
    $('#helpGlowTitle').textContent = copy.glow || 'Glow & upgrades'; $('#helpGlowText').textContent = copy.glowText || '';
    $('#helpCombosTitle').textContent = copy.combos || 'Combos'; $('#helpComboText').textContent = copy.comboText || '';
    $('#helpDoneBtn').textContent = copy.close || 'Back'; $('#helpReplayStory').textContent = copy.story || 'Replay the story';
    $('#helpCloseBtn').setAttribute('aria-label', copy.close || 'Close Help');
    const rows = $('#helpControls'); rows.replaceChildren();
    for (const action of ['move', 'jump', 'sneak', 'catch', 'eyes', 'scratch', 'purr', 'pause']) {
      const pair = controls[action]; if (!pair) continue;
      const row = document.createElement('div'); row.className = 'help-control-row';
      const title = document.createElement('strong'); title.textContent = names[action] || action; row.appendChild(title);
      const values = document.createElement('div');
      const keyboard = document.createElement('span'); keyboard.textContent = `${copy.keyboard || 'Keyboard'}: ${pair.keyboard}`;
      const touch = document.createElement('span'); touch.textContent = `${copy.touch || 'Touch'}: ${pair.touch}`;
      values.append(keyboard, touch); row.appendChild(values); rows.appendChild(row);
    }
    const moods = $('#helpMoods'); moods.replaceChildren(); moods.setAttribute('aria-label', copy.moods || 'Moodlings');
    for (const [type, variants] of Object.entries(VARS)) for (let variant = 0; variant < variants.length; variant++) {
      const key = `${type}${variant}`, known = (book[key] || 0) > 0, met = known || !!encounteredMoodlings[key], info = vinfo(type, variant);
      const item = document.createElement('article'); item.className = `help-mood-entry${met ? '' : ' unknown'}`; item.setAttribute('role', 'listitem');
      const art = document.createElement('div'); art.className = 'help-mood-art'; art.setAttribute('aria-hidden', 'true'); art.innerHTML = iconSVG(type, variant, met); item.appendChild(art);
      const details = document.createElement('div'); details.className = 'help-mood-copy';
      const title = document.createElement('strong'), desc = document.createElement('span');
      title.textContent = met ? info.n : (copy.unknown || '???');
      desc.textContent = met ? (copy.catchGuides?.[key] || copy.catchGuides?.[type] || info.d) : (copy.unknownHint || 'Meet it in a night to unlock its catch guide.');
      details.append(title, desc);
      if (met) {
        const watch = document.createElement('button'); watch.type = 'button'; watch.className = 'help-clip-button'; watch.dataset.catchClip = key;
        watch.textContent = copy.catchClipButton || '▶ Watch catch clip';
        watch.setAttribute('aria-label', `${copy.catchClipButton || 'Watch catch clip'} · ${info.n}`);
        details.appendChild(watch);
      }
      item.appendChild(details); moods.appendChild(item);
    }
  }
  let catchClipTimer = 0, catchClipReturnFocus = null;
  function runCatchClip(type, variant) {
    const stage = $('#catchClipStage'), copy = guideCopy().help || {}, key = `${type}${variant}`, steps = copy.catchClipSteps?.[key] || copy.catchClipSteps?.[type] || [copy.catchGuides?.[key] || copy.catchGuides?.[type] || vinfo(type, variant).d];
    const captions = steps.length ? steps : [vinfo(type, variant).d];
    if (catchClipTimer) { clearInterval(catchClipTimer); catchClipTimer = 0; }
    stage.classList.remove('is-playing'); stage.dataset.type = type; stage.dataset.variant = String(variant);
    stage.style.setProperty('--clip-mood-color', vcol(type, variant));
    $('#catchClipMoodling').src = bookPortrait(type, variant, true);
    $('#catchClipCat').src = COAT.img;
    $('#catchClipCue').textContent = type === 'C' && variant === 1 ? '◯' : ({ F: '⚡', N: '…', L: 'EYES', B: 'EYES', E: '↑', S: '…', J: '✦', C: '✧', G: '✦' })[type] || '✦';
    $('#catchClipTitle').textContent = `${guideCopy().help?.catchClipLabel || 'Short guided clip'} · ${vinfo(type, variant).n}`;
    $('#catchClipClose').setAttribute('aria-label', copy.catchClipClose || 'Close clip');
    $('#catchClipReplay').textContent = copy.catchClipReplay || 'Replay clip';
    const tagLabels = copy.catchClipStages || ['NOTICE', 'TRY IT', 'BRING IT HOME'];
    const showStep = index => {
      const at = Math.min(index, captions.length - 1);
      $('#catchClipCaption').textContent = captions[at];
      $('#catchClipTag').textContent = `${at + 1} / ${captions.length} · ${tagLabels[Math.min(at, tagLabels.length - 1)] || ''}`;
      $('#catchClipProgress').textContent = `${copy.catchClipStep || 'Step'} ${at + 1} / ${captions.length}`;
    };
    showStep(0); $('#catchClipProgress').textContent = copy.catchClipPlaying || `${copy.catchClipStep || 'Step'} 1 / ${captions.length}`;
    void stage.offsetWidth; stage.classList.add('is-playing');
    let index = 0;
    catchClipTimer = setInterval(() => {
      index++;
      if (index < captions.length) showStep(index);
      else {
        clearInterval(catchClipTimer); catchClipTimer = 0;
        $('#catchClipProgress').textContent = copy.catchClipProgress || 'Clip finished · replay any time';
      }
    }, 2000);
  }
  function openCatchClip(type, variant, trigger) {
    catchClipReturnFocus = trigger || document.activeElement;
    $('#helpPanel').setAttribute('aria-hidden', 'true');
    $('#catchClipView').hidden = false;
    runCatchClip(type, variant);
    $('#catchClipClose').focus({ preventScroll: true });
  }
  function closeCatchClip(restoreFocus = true) {
    if (catchClipTimer) { clearInterval(catchClipTimer); catchClipTimer = 0; }
    $('#catchClipView').hidden = true; $('#catchClipStage').classList.remove('is-playing');
    $('#helpPanel').removeAttribute('aria-hidden');
    if (restoreFocus && catchClipReturnFocus?.isConnected) catchClipReturnFocus.focus({ preventScroll: true });
  }
  $('#helpMoods').addEventListener('click', e => {
    const button = e.target.closest('button[data-catch-clip]'); if (!button) return;
    const key = button.dataset.catchClip, type = key[0], variant = Number(key.slice(1));
    if (VARS[type]?.[variant]) openCatchClip(type, variant, button);
  });
  $('#catchClipReplay').addEventListener('click', () => runCatchClip($('#catchClipStage').dataset.type, Number($('#catchClipStage').dataset.variant) || 0));
  $('#catchClipClose').addEventListener('click', () => closeCatchClip());
  $('#catchClipView').addEventListener('click', e => { if (e.target.id === 'catchClipView') closeCatchClip(); });
  $('#catchClipView').addEventListener('keydown', e => {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeCatchClip(); }
    if (e.key === 'Tab') {
      e.stopPropagation();
      const close = $('#catchClipClose'), replay = $('#catchClipReplay');
      if (e.shiftKey && document.activeElement === close) { e.preventDefault(); replay.focus({ preventScroll: true }); }
      else if (!e.shiftKey && document.activeElement === replay) { e.preventDefault(); close.focus({ preventScroll: true }); }
    }
  });
  function openHelp(source = 'hub') {
    helpReturn = source; helpReturnFocus = document.activeElement;
    if (source === 'pause') { pauseScreen.hidden = true; $('#helpReplayStory').hidden = true; }
    else { $('#helpReplayStory').hidden = false; if (source === 'settings') $('#hubSettingsScreen').hidden = true; }
    renderHelp(); $('#helpScreen').hidden = false; $('#helpDoneBtn').focus({ preventScroll: true });
  }
  function closeHelp() {
    closeCatchClip(false);
    $('#helpScreen').hidden = true;
    if (helpReturn === 'pause') { pauseScreen.hidden = false; pauseHelpBtn.focus({ preventScroll: true }); }
    else if (helpReturn === 'settings') { $('#hubSettingsScreen').hidden = false; $('#settingsHelpBtn').focus({ preventScroll: true }); }
    else if (helpReturnFocus?.isConnected) helpReturnFocus.focus({ preventScroll: true });
  }
  $('#helpCloseBtn').addEventListener('click', closeHelp); $('#helpDoneBtn').addEventListener('click', closeHelp);
  $('#helpScreen').addEventListener('click', e => { if (e.target.id === 'helpScreen') closeHelp(); });
  $('#helpReplayStory').addEventListener('click', () => { $('#helpScreen').hidden = true; playIntro('hub'); });
  $('#helpScreen').addEventListener('keydown', e => {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeHelp(); return; }
    if (e.key !== 'Tab') return;
    const focusable = Array.from($('#helpScreen').querySelectorAll('button:not([disabled])')).filter(el => !el.closest('[hidden]'));
    if (!focusable.length) return;
    if (e.shiftKey && document.activeElement === focusable[0]) { e.preventDefault(); focusable[focusable.length - 1].focus(); }
    else if (!e.shiftKey && document.activeElement === focusable[focusable.length - 1]) { e.preventDefault(); focusable[0].focus(); }
  });
  function renderBook() {
    const found = BOOK_ORDER.filter(k => book[k]).length;
    { const T = bookTotals(); $('#bookCount').textContent = `${T.found} / ${T.total} found`; } refreshHubStats();
    $('#bookList').innerHTML = `<h2 class="book-section">Night Moodlings <small>${found} / ${BOOK_ORDER.length}</small></h2>` + BOOK_ORDER.map(k => {
      const ty = k[0], v = +k[1], info = vinfo(ty, v), n = book[k] || 0, known = n > 0;
      const tag = `<span class="tag${info.r === 'Rare' || info.r === 'Special' ? ' rare' : ''}">${info.r}${known ? ` · caught ×${n}` : ''}</span>`;
      if (known) return `<div class="entry" data-feeling="${ty}">${iconSVG(ty, v, true)}<h3>${info.n}</h3>${tag}<p>${info.d}</p><p class="line">${info.line}</p></div>`;
      const hint = info.lock || (info.r === 'Rare' ? `A rare form of ${vinfo(ty, 0).n}. Look for sparkles.` : 'Catch one to fill this page.');
      return `<div class="entry unknown">${iconSVG(ty, v, false)}<h3>???</h3>${tag}<p>${hint}</p></div>`;
    }).join('') + heartBookPages();
  }
  // Feelings made in the Heart Workshop get their own pages after the night Moodlings.
  function heartBookPages() {
    const HD = window.TCHeartData, art = window.TCMoodArt; if (!HD || !art) return '';
    let made = [];
    try { made = HD.create(localStorage).snapshot().discovered; } catch (e) {}
    const mixed = HD.feelings.filter(f => f.tier > 0), have = mixed.filter(f => made.includes(f.id)).length;
    const layer = ['', 'Layer 1', 'Layer 2', 'Deep feeling', 'The final feeling'];
    return `<h2 class="book-section">Made in the Heart Workshop <small>${have} / ${mixed.length}</small></h2>` + mixed.map(f => {
      const tag = `<span class="tag${f.tier >= 3 ? ' rare' : ''}">${layer[f.tier]}</span>`;
      if (made.includes(f.id)) return `<div class="entry heart-page">${art.svg(f.id, 'book-mood')}<h3>${f.name}</h3>${tag}<p>${HD.byId[f.ingredients[0]].name} + ${HD.byId[f.ingredients[1]].name}</p><p class="line">${f.line}</p></div>`;
      return `<div class="entry unknown heart-page"><span class="heart-secret">${art.svg(f.id, 'book-mood')}</span><h3>???</h3>${tag}<p>Mix two feelings in the Heart Workshop to find this one.</p></div>`;
    }).join('');
  }
  $('#bookBtn').addEventListener('click', () => { music('play', 'menu'); music('ambience', 'menu'); $('#startScreen').hidden = true; renderBook(); $('#bookScreen').hidden = false; $('#bookScreen').scrollTop = 0; $('#bookBack').focus({ preventScroll: true }); });
  $('#bookBack').addEventListener('click', () => { $('#bookScreen').hidden = true; showMainMenu(true); });
  // Heart Workshop jar and Lantern Town model in Thiri's room
  $('#roomHeartBtn')?.addEventListener('click', () => window.TCHeart?.open('workshop'));
  $('#roomTownBtn')?.addEventListener('click', () => window.TCHeart?.open('town'));
  // The Glow and Mood Book counters at the top of the room open the Treat box and the Mood Book too.
  [['#hubBookValue', '#bookBtn', 'Open the Mood Book'], ['#hubGlowValue', '#shopBtn', 'Open the Treat box']].forEach(([val, target, label]) => {
    const pill = $(val)?.closest('.hub-currency-pill'); if (!pill) return;
    pill.classList.add('is-link'); pill.setAttribute('role', 'button'); pill.tabIndex = 0; pill.setAttribute('aria-label', label); pill.title = label;
    const go = () => $(target)?.click();
    pill.addEventListener('click', go);
    pill.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
  });
  let shopFrom = null;
  let shopTab = 'upgrades';
  (function () {
    const st = document.createElement('style');
    st.textContent = '.shop-tabs{display:flex;gap:8px;flex-wrap:wrap}.shop-tab{font-family:var(--display);font-weight:800;font-size:15px;border:2px solid var(--line);background:transparent;color:var(--ink);border-radius:999px;padding:8px 16px;cursor:pointer}.shop-tab[aria-selected="true"]{background:var(--honey);border-color:var(--honey);color:var(--bg-deep)}.shop-cat{height:44px;width:56px;object-fit:contain;vertical-align:middle;margin-right:8px}.shop-icon{font-size:26px;vertical-align:middle;margin-right:8px}.swatch{display:inline-block;width:26px;height:26px;border-radius:50%;vertical-align:middle;margin-right:8px;border:2px solid rgba(255,255,255,.6)}.item.in-use{border-color:var(--honey)}.item .gear-prev{grid-row:span 3;width:96px;height:88px;object-fit:contain;background:radial-gradient(circle at 50% 60%,rgba(246,196,83,.18),transparent 70%);border-radius:14px}.item:has(.gear-prev){grid-template-columns:auto minmax(0,1fr) auto}.item:has(.gear-prev)>h3,.item:has(.gear-prev)>p{grid-column:2}.item:has(.gear-prev)>.side{grid-column:3;grid-row:1/span 3}.item .gear-prev{grid-column:1;grid-row:1/span 3!important}.pips .pip{width:13px}';
    document.head.appendChild(st);
    const tabs = document.createElement('div'); tabs.className = 'shop-tabs'; tabs.setAttribute('role', 'tablist');
    [['upgrades', 'Upgrades'], ['cats', 'Cats'], ['items', 'Comfort items'], ['style', 'Style'], ['pouch', 'Pouch']].forEach(([id, label]) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'shop-tab'; b.dataset.tab = id; b.textContent = label; b.setAttribute('role', 'tab');
      b.addEventListener('click', () => { shopTab = id; renderShop(); }); tabs.appendChild(b);
    });
    $('#shopList').before(tabs);
  })();
  function renderShop() {
    $('#glowAmt').textContent = glow;
    document.querySelectorAll('.shop-tab').forEach(b => b.setAttribute('aria-selected', String(b.dataset.tab === shopTab)));
    const price = (cost, attrs, verb = 'Buy') => `<button class="buy" ${attrs} ${glow < cost ? 'disabled' : ''}>${glow < cost ? '🔒 Can’t afford' : verb} · ${cost} Glow</button>`;
    if (shopTab === 'pouch') {
      const counts = {}; pouch.forEach(k => { counts[k] = (counts[k] || 0) + 1; });
      const total = pouch.reduce((n, k) => n + TRINKETS[k].glow, 0);
      const slots = Array.from({ length: POUCH_SIZE }, (_, i) => pouch[i]).map(k => k ? `<div class="pouch-slot" title="${TRINKETS[k].name}"><canvas class="trinket-ico" data-t="${k}" width="56" height="56" aria-hidden="true"></canvas><span>${TRINKETS[k].name}</span></div>` : '<div class="pouch-slot empty" aria-hidden="true"></div>').join('');
      const rows = Object.keys(TRINKETS).filter(k => counts[k]).map(k => `<div class="item"><h3>${TRINKETS[k].name} ×${counts[k]}</h3><div class="side"><button class="buy" data-sell="${k}">Sell one · +${TRINKETS[k].glow} Glow</button></div><p>Worth ${TRINKETS[k].glow} Glow each.</p></div>`).join('');
      $('#shopList').innerHTML = `<div class="pouch-box"><div class="pouch-slots" aria-label="${pouch.length} of ${POUCH_SIZE} pouch slots used">${slots}</div><p class="pouch-note">${pouch.length} / ${POUCH_SIZE} in the pouch. Trinkets turn up on every night. A night that fails drops the ones you were carrying.</p></div>${rows}${pouch.length ? `<div class="item"><h3>Everything</h3><div class="side"><button class="buy" data-sell="all">Sell all · +${total} Glow</button></div><p>Empty the pouch for ${total} Glow.</p></div>` : '<p class="pouch-note">The pouch is empty. Look out for shiny little things on the way: buttons, pebbles, feathers, bottle caps, ribbons and, now and then, a golden button.</p>'}`;
      document.querySelectorAll('#shopList canvas.trinket-ico').forEach(drawTrinketIcon);
      return;
    }
    if (shopTab === 'cats') {
      $('#shopList').innerHTML = Object.keys(MK_COATS).map(k => {
        const owned = ownedCats.includes(k), using = MK_PROFILE.coat === k, info = CAT_SHOP[k];
        const btn = using ? '<button class="buy" disabled>With you now</button>' : owned ? `<button class="buy" data-cat="${k}" data-act="use">Choose</button>` : price(info.cost, `data-cat="${k}" data-act="buy"`);
        return `<div class="item${using ? ' in-use' : ''}"><h3><img class="shop-cat" src="${MK_COATS[k].img}" alt="">${MK_COATS[k].name}</h3><div class="side">${btn}</div><p>${info.perk}</p><p>${owned ? 'Yours' : 'Not yet yours'}</p></div>`;
      }).join('');
      return;
    }
    if (shopTab === 'items') {
      $('#shopList').innerHTML = ITEMS.map(i => `<div class="item"><canvas class="gear-prev" data-gear="${i.id}" width="240" height="220" aria-hidden="true"></canvas><h3><span class="shop-icon">${i.icon}</span>${i.name}</h3><div class="side">${price(i.cost, `data-item="${i.id}"`)}</div><p>${i.desc}</p><p>Packed for your next hour: ${itemStock[i.id] || 0}. Used up when the hour starts.</p></div>`).join('');
      document.querySelectorAll('#shopList canvas.gear-prev').forEach(cv => drawGearPreview(cv, { [cv.dataset.gear]: true }));
      return;
    }
    if (shopTab === 'style') {
      $('#shopList').innerHTML = Object.entries(TRAILS).map(([k, tr]) => {
        const owned = ownedTrails.includes(k), using = trailPick === k;
        const btn = using ? '<button class="buy" disabled>In use</button>' : owned ? `<button class="buy" data-trail="${k}" data-act="use">Use</button>` : tr.stars ? `<button class="buy" disabled>★ ${totalStars()}/${tr.stars}</button>` : price(tr.cost, `data-trail="${k}" data-act="buy"`);
        return `<div class="item${using ? ' in-use' : ''}"><h3><span class="swatch" style="background:${tr.rainbow ? 'conic-gradient(#ff6b6b,#ffd23f,#7ddc8b,#6fb6ff,#b9a2ff,#ff6b6b)' : `rgb(${tr.c})`}"></span>${tr.name} trail</h3><div class="side">${btn}</div><p>The colour of the light trail that follows your cat.</p></div>`;
      }).join('');
      return;
    }
    $('#shopList').innerHTML = UPG.map(u => {
      const lv = upg[u.id], max = lv >= UPG_MAX, cost = u.costs[lv];
      const now = u.fmt(u.vals[lv]), next = max ? '' : ` · next: ${u.fmt(u.vals[lv + 1])}`;
      const btn = max ? '<button class="buy" disabled>Maxed</button>'
        : `<button class="buy" data-id="${u.id}" ${glow < cost ? 'disabled' : ''}>${glow < cost ? '🔒 Can’t afford' : lv === 0 && u.id === 'purr' ? 'Unlock' : 'Buy'} · ${cost} Glow</button>`;
      return `<div class="item" data-upgrade="${u.id}"><h3>${u.name}</h3><div class="side"><div class="pips" aria-label="Level ${lv} of ${UPG_MAX}">${Array.from({ length: UPG_MAX }, (_, i) => i).map(i => `<span class="pip${i < lv ? ' on' : ''}"></span>`).join('')}</div>${btn}</div><p>${u.desc}</p><p>Now: ${now}${next}</p></div>`;
    }).join('');
  }
  // selling trinkets from the pouch, and claiming a full shelf set
  $('#shopList').addEventListener('click', e => {
    const b = e.target.closest('button[data-sell]'); if (!b) return;
    let gain = 0;
    if (b.dataset.sell === 'all') { gain = pouch.reduce((n, k) => n + TRINKETS[k].glow, 0); pouch = []; }
    else { const i = pouch.indexOf(b.dataset.sell); if (i < 0) return; gain = TRINKETS[pouch[i]].glow; pouch.splice(i, 1); }
    initAudio(); glow += gain; saveUpg(); savePouch(); sfx('ui', 'buy');
    renderShop(); refreshShopBtns(); $('#shopBack').focus({ preventScroll: true });
  });
  $('#shelfList').addEventListener('click', e => {
    const b = e.target.closest('button[data-shelf]'); if (!b) return;
    const key = `n${b.dataset.shelf}`; if (shelfClaimed.has(key)) return;
    shelfClaimed.add(key); try { localStorage.setItem('mk-shelf-claimed', JSON.stringify([...shelfClaimed])); } catch (err) {}
    initAudio(); glow += SHELF_BONUS; saveUpg(); sfx('ui', 'reward'); renderShelf(); refreshShopBtns();
  });
  $('#roomShelfBtn')?.addEventListener('click', openShelf);
  $('#showItemsToggle')?.addEventListener('change', e => { showItemsHud = e.target.checked; try { localStorage.setItem('mk-show-items', showItemsHud ? '1' : '0'); } catch (err) {} });
  $('#settingsBtn').addEventListener('click', () => { const tg = $('#showItemsToggle'); if (tg) tg.checked = showItemsHud; });
  $('#shelfBack').addEventListener('click', () => { $('#shelfScreen').hidden = true; showMainMenu(true); });
  function openShop(from) {
    music('play', 'menu'); music('ambience', 'menu');
    shopFrom = from; $('#startScreen').hidden = true; $('#endScreen').hidden = true;
    renderShop(); $('#shopScreen').hidden = false; $('#shopScreen').scrollTop = 0; $('#shopBack').focus({ preventScroll: true });
  }
  function chooseCat(k) {
    MK_PROFILE.coat = k; COAT = MK_COATS[k];
    try { localStorage.setItem('mk-profile', JSON.stringify(MK_PROFILE)); } catch (err) {}
    paintCoat(COAT); refreshShopBtns(); syncSetupCats();
  }
  $('#shopList').addEventListener('click', e => {
    const x = e.target.closest('button[data-cat],button[data-item],button[data-trail]');
    if (x && !x.disabled) {
      initAudio();
      const ding = () => sfx('ui', 'buy');
      if (x.dataset.cat) {
        const k = x.dataset.cat;
        if (x.dataset.act === 'buy') { const c = CAT_SHOP[k].cost; if (glow < c) return; glow -= c; ownedCats.push(k); saveUpg(); ding(); sfx('cat', 'meow'); }
        chooseCat(k);
      } else if (x.dataset.item) {
        const it = ITEMS.find(i => i.id === x.dataset.item); if (glow < it.cost) return;
        glow -= it.cost; itemStock[it.id] = (itemStock[it.id] || 0) + 1; saveUpg(); ding();
      } else if (x.dataset.trail) {
        const k = x.dataset.trail;
        if (x.dataset.act === 'buy') { const c = TRAILS[k].cost; if (TRAILS[k].stars || glow < c) return; glow -= c; ownedTrails.push(k); saveUpg(); ding(); }
        trailPick = k;
      }
      saveShop(); renderShop(); refreshShopBtns(); $('#shopBack').focus({ preventScroll: true });
      return;
    }
    const b = e.target.closest('button[data-id]'); if (!b) return;
    const u = UPG.find(x => x.id === b.dataset.id), lv = upg[u.id];
    if (lv >= UPG_MAX || glow < u.costs[lv]) return;
    initAudio(); glow -= u.costs[lv]; upg[u.id]++; saveUpg();
    sfx('ui', 'buy');
    renderShop(); refreshShopBtns();
    const again = $(`#shopList button[data-id="${u.id}"]`);
    $(`#shopList [data-upgrade="${u.id}"]`)?.classList.add('cozy-purchased');
    (again && !again.disabled ? again : $('#shopBack')).focus();
  });
  $('#shopBack').addEventListener('click', () => { $('#shopScreen').hidden = true; (shopFrom === 'end' ? $('#endScreen') : $('#startScreen')).hidden = false; });
  $('#shopBtn').addEventListener('click', () => openShop('start'));
  $('#endShopBtn').addEventListener('click', () => openShop('end'));
  refreshShopBtns();

  function playNightComplete(night) {
    const chapter = chapterFor(night), next = Math.min(50, night + 1);
    $('#nightStoryline').hidden = false;
    $('#endThiriArt').dataset.stage = String(Math.min(7, thiriSleepStage));
    { const st = Math.min(7, thiriSleepStage), mood = st <= 1 ? 1 : st <= 3 ? 2 : st <= 5 ? 3 : 4, art = $('#endThiriArt');
      let img = art.querySelector('img.thiri-mood'); if (!img) { img = document.createElement('img'); img.className = 'thiri-mood'; img.alt = ''; art.appendChild(img); }
      img.src = `assets/thiri-moods/m${mood}.webp`; art.classList.add('has-mood'); }
    $('#endDiaryLine').textContent = `“${chapter.diary}”`;
    $('#endStageLine').textContent = `Thiri’s room is changing · sleep stage ${thiriSleepStage} of 7`;
    $('#endUnlockBadge').hidden = !R.unlocked;
    if (R.unlocked) setTimeout(() => { if (!$('#endScreen').hidden) sfx('ui', 'unlock'); }, 900);
    $('#endUnlockBadge').textContent = R.unlocked ? `${hourOf(next).toUpperCase()} UNLOCKED` : '';
    $('#endEyebrow').textContent = `${hourOf(night)} · ${chapter.name} · done`;
    $('#endTitle').textContent = night === 50 ? 'All 50 routes are home' : R.unlocked ? `${hourOf(night)} done. ${hourOf(next)} is open!` : night === 7 ? 'The lake is quiet' : 'A little more of Thiri returns';
    $('#endMsg').textContent = `You brought all ${R.total} feelings home. ${R.unlocked ? `${hourOf(next)} is now playable from the map.` : 'Your story progress is saved.'}`;
  }

  // The three choices after a night: play it again, continue to the next hour, or go back to the levels.
  function canContinue() { return !!R && !R.free && R.night < 50 && unlockedLevel > R.night; }
  function setEndButtons() {
    const again = $('#againBtn'), cont = $('#endContinueBtn');
    again.textContent = R.free ? 'Play again' : R.won ? 'Play again' : `Try ${hourOf(R.night)} again`;
    again.classList.toggle('ghost', canContinue());
    cont.hidden = !canContinue();
    if (!cont.hidden) cont.textContent = `Continue → ${hourOf(R.night + 1)}`;
    $('#menuBtn').textContent = R.free ? 'Pick a place' : 'Levels';
  }
  function showEnd() {
    music('play', 'results'); music('ambience', null); sfx('ui', R.won ? 'reward' : 'result');
    if (R.final > 0 && R.final >= R.best) setTimeout(() => sfx('ui', 'sparkle'), 420);
    state = 'over'; mouseSneakHeld = false; mouseSneakPointerId = null; mouseSneakPress = null;
    $('#sGlow').textContent = '+' + lastGlow;
    $('#newBestSticker').hidden = !(R.final > 0 && R.final >= R.best);
    const extra = [];
    if (runDone.length) extra.push(`Mission complete: ${runDone.join('; ')}. Claim the reward on the main menu.`);
    if (runNew.length) extra.push(`New in the Mood Book: ${runNew.join(', ')}.`);
    if (!R.free && R.won) {
      if (R.starGlow) extra.push(`New ${'★'.repeat(R.starsN)} on this hour! +${R.starGlow} Glow.`);
      extra.push(R.starsN < 3 ? `Score ${R.goals[R.starsN].toLocaleString()} for ${'★'.repeat(R.starsN + 1)}.` : 'Top rank on this hour: ★★★');
    }
    if (!R.free && R.newTrails?.length) extra.push(`★ ${totalStars()} stars! You unlocked the ${R.newTrails.join(' and ')} trail in the shop.`);
    if (!R.free && R.night && keepsakeTotal(R.night)) extra.push(`Thiri’s keepsakes on this night: ${keepsakesFound(R.night)}/${keepsakeTotal(R.night)}.`);
    if (lastTrinkets?.kept) extra.push(`${lastTrinkets.kept} trinket${lastTrinkets.kept > 1 ? 's' : ''} safe in the pouch (${pouch.length}/${POUCH_SIZE}). Sell them at the Treat box.`);
    if (lastTrinkets?.lost) extra.push(`${lastTrinkets.lost} trinket${lastTrinkets.lost > 1 ? 's were' : ' was'} dropped. They are only safe once the night ends well.`);
    $('#endMissions').textContent = extra.join(' '); $('#endMissions').hidden = !extra.length;
    $('#nightStoryline').hidden = true;
    if (R.free) {
      const mm = Math.floor(R.survived / 60), ss = Math.floor(R.survived % 60);
      $('#endEyebrow').textContent = 'Free Mode · run over';
      $('#endTitle').textContent = R.final > 0 && R.final >= R.best ? 'New best score!' : 'The night is over';
      $('#endStars').hidden = true;
      $('#endMsg').textContent = `You lasted ${mm}:${String(ss).padStart(2, '0')}, reached level ${R.level} and brought home ${R.home} feelings.`;
      $('#sScore').textContent = R.final.toLocaleString();
      $('#sBest').textContent = R.best.toLocaleString();
      $('#sCombo').textContent = '×' + R.combo;
      $('#sHome').textContent = String(R.home);
      $('#endTip').textContent = R.tip;
      setEndButtons();
      setTimeout(() => { $('#endScreen').hidden = false; $('#againBtn').focus(); }, 280);
      return;
    }
    $('#nightStoryline').hidden = true;
    $('#endEyebrow').textContent = R.won ? `${hourOf(R.night)} · done` : R.failReason === 'fall' ? `${hourOf(R.night)} · night failed` : `${hourOf(R.night)} · time's up`;
    $('#endTitle').textContent = R.won ? 'A little more of Thiri returns' : R.failReason === 'fall' ? 'Night failed' : 'Some feelings need more time';
    $('#endStars').innerHTML = [0, 1, 2].map(i => `<span class="${i < R.starsN ? '' : 'off'}">★</span>`).join('');
    $('#endStars').hidden = !R.won;
    $('#endMsg').textContent = R.won
      ? `You brought all ${R.total} feelings home with ${Math.round(R.left)} seconds to spare. Time bonus: +${Math.round(R.left) * 20}. Score ${R.goals[1].toLocaleString()} for ★★ and ${R.goals[2].toLocaleString()} for ★★★.`
      : R.failReason === 'fall' ? 'Shwe ran out of lives. The lights from this run were lost, but anything already in the Mood Book is safe.' : "That's okay. Let's try again.";
    $('#sScore').textContent = R.final.toLocaleString();
    $('#sBest').textContent = R.best.toLocaleString();
    $('#sCombo').textContent = '×' + R.combo;
    $('#sHome').textContent = `${R.home}/${R.total}`;
    $('#endTip').textContent = R.tip;
    if (R.won) playNightComplete(R.night);
    setEndButtons();
    setTimeout(() => { $('#endScreen').hidden = false; (canContinue() ? $('#endContinueBtn') : $('#againBtn')).focus(); }, 280);
  }

  // ---------- Thiri's bedroom (painted room for the coming-home scene) ----------
  // The room starts grey. Each feeling Shwe brings home gives the colour back to one part of the room.
  // It stays night for every hour; only after 5 AM does the dawn start to show at the windows.
  const ROOM_W = 2000, ROOM_H = 857;
  const ROOM_IMG = new Image(), ROOM_GREY = new Image();
  ROOM_IMG.src = 'assets/home/room.webp'; ROOM_GREY.src = 'assets/home/room-grey.webp';
  const roomReady = () => ROOM_IMG.complete && ROOM_IMG.naturalWidth > 0 && ROOM_GREY.complete && ROOM_GREY.naturalWidth > 0;
  // [x, y, w, h] in room units (the picture is 2000 units wide)
  const ROOM_PARTS = {
    F: [[60, 415, 495, 245]],                                                              // Frustrated: her bed and blanket
    N: [[400, 55, 115, 400], [742, 55, 118, 400], [1675, 28, 92, 330], [1878, 28, 120, 335], [1688, 288, 95, 66]], // Nervous: the curtains
    J: [[878, 248, 220, 165], [1042, 128, 96, 92], [1148, 168, 64, 64], [1378, 298, 76, 96], [1578, 98, 76, 92], [155, 322, 258, 120], [170, 112, 145, 100]], // Jealous: her photos and drawings on the wall
    L: [[488, 665, 1018, 88], [1318, 468, 274, 180], [145, 212, 120, 72], [892, 120, 115, 98], [1372, 110, 160, 72]], // Lonely: the rug and her books
    S: [[1645, 410, 210, 210], [1625, 598, 365, 98], [1460, 192, 195, 112], [1872, 455, 120, 160]], // Shy: her plush toys and the beanbag
    E: [[85, 118, 340, 112], [15, 372, 78, 132], [852, 342, 92, 130], [720, 330, 60, 62], [1515, 268, 110, 150]], // Excited: the lights and the stars
    B: [[570, 430, 460, 225], [950, 510, 120, 140], [1060, 400, 250, 250]],                 // Buried: her desk, drawings and school bag
    C: [[0, 25, 115, 220], [292, 205, 82, 100], [488, 296, 76, 94], [942, 110, 96, 190], [1100, 215, 210, 200], [1326, 86, 82, 222], [1872, 262, 125, 165], [0, 436, 48, 96], [1945, 185, 55, 215]], // Calm: the plants
    G: [[508, 72, 274, 320], [1742, 72, 150, 255]]                                           // Golden: the night sky in the windows
  };
  const NIGHT_TYPES = [[], ['F'], ['N', 'J'], ['L', 'S'], ['E'], ['B', 'G'], ['C'], ['F', 'N', 'J', 'L', 'S', 'B', 'E', 'G', 'C']];
  const ROOM_ORDER = ['F', 'N', 'J', 'L', 'S', 'B', 'E', 'G', 'C'];
  const partCentre = ty => { const r = ROOM_PARTS[ty][0]; return { x: r[0] + r[2] / 2, y: r[1] + r[3] / 2 }; };
  const roomLayers = {};
  function roomLayer(ty) {
    if (roomLayers[ty]) return roomLayers[ty];
    if (!roomReady()) return null;
    const rects = ROOM_PARTS[ty], pad = 30;
    const bx = Math.max(0, Math.min(...rects.map(r => r[0])) - pad), by = Math.max(0, Math.min(...rects.map(r => r[1])) - pad);
    const bx1 = Math.min(ROOM_W, Math.max(...rects.map(r => r[0] + r[2])) + pad), by1 = Math.min(ROOM_H, Math.max(...rects.map(r => r[1] + r[3])) + pad);
    const sc = 1.3, c = document.createElement('canvas'); c.width = Math.ceil((bx1 - bx) * sc); c.height = Math.ceil((by1 - by) * sc);
    const g = c.getContext('2d'), off = c.width + 4000;
    // soft-edged mask: draw the shapes far away and keep only their blurred shadow
    g.save(); g.shadowColor = '#000'; g.shadowBlur = 26 * sc; g.shadowOffsetX = off; g.fillStyle = '#000';
    for (const r of rects) { g.beginPath(); const x = (r[0] - bx) * sc - off, y = (r[1] - by) * sc, w = r[2] * sc, h = r[3] * sc; if (g.roundRect) g.roundRect(x, y, w, h, 22 * sc); else g.rect(x, y, w, h); g.fill(); }
    g.restore();
    g.globalCompositeOperation = 'source-in';
    const kx = ROOM_IMG.naturalWidth / ROOM_W, ky = ROOM_IMG.naturalHeight / ROOM_H;
    g.drawImage(ROOM_IMG, bx * kx, by * ky, (bx1 - bx) * kx, (by1 - by) * ky, 0, 0, c.width, c.height);
    return (roomLayers[ty] = { c, x: bx, y: by, w: bx1 - bx, h: by1 - by });
  }
  // colour amounts for the parts that are already home before this scene starts
  function roomColoursFor(stage, skipNight = 0) {
    const out = {}; ROOM_ORDER.forEach(k => { out[k] = 0; });
    for (let n = 1; n <= clamp(stage, 0, 7); n++) if (n !== skipNight) NIGHT_TYPES[n].forEach(k => { out[k] = 1; });
    return out;
  }
  const roomWash = pose => pose >= 7 ? 1 : clamp(pose, 0, 7) / 7 * .45;  // how much colour the walls and floor have

  // Thiri asleep in her bed: painted poses (colour and grey), placed over the bed in room units.
  const THIRI_POSES = ['s0', 's1', 's2', 's3', 's5', 's7'], THIRI_AT = [0, 1, 2, 3, 5, 7];
  const THIRI_IMG = {};
  THIRI_POSES.forEach(k => { const c = new Image(), g = new Image(); c.src = `assets/home/thiri-${k}.webp`; g.src = `assets/home/thiri-${k}-grey.webp`; THIRI_IMG[k] = { c, g }; });
  const imgOk = im => im && im.complete && im.naturalWidth > 0;
  // where the Thiri pictures sit in the room (room units): the whole bed with Thiri tucked in under the blanket
  const TB = [83.8, 373.3, 464.9, 270.9];
  function drawThiriInBed(pose, warm, dawn, breath) {
    // pick the two nearest poses and blend between them
    const p = clamp(pose, 0, 7); let i = 0; while (i < THIRI_AT.length - 1 && THIRI_AT[i + 1] <= p) i++;
    const j = Math.min(THIRI_AT.length - 1, i + 1), f = j === i ? 0 : clamp(p - (THIRI_AT[j] - 1), 0, 1);  // change pose during the last hour before the next one
    const layers = [[THIRI_POSES[i], 1 - f], [THIRI_POSES[j], f]];
    // soft moonlight on her so she is easy to find
    const gl = ctx.createRadialGradient(225, 478, 10, 225, 478, 150); gl.addColorStop(0, `rgba(214,206,255,${.16 + .08 * warm})`); gl.addColorStop(1, 'rgba(214,206,255,0)');
    ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = gl; ctx.fillRect(75, 328, 300, 300); ctx.globalCompositeOperation = 'source-over';
    const lift = breath * .35;
    for (const [k, a] of layers) {
      if (a <= .01) continue; const im = THIRI_IMG[k];
      if (imgOk(im.g) && warm < 1) { ctx.globalAlpha = a; ctx.drawImage(im.g, TB[0], TB[1] + lift, TB[2], TB[3]); }
      if (imgOk(im.c) && warm > 0) { ctx.globalAlpha = a * warm; ctx.drawImage(im.c, TB[0], TB[1] + lift, TB[2], TB[3]); }
    }
    ctx.globalAlpha = 1;
  }
  // calm night details drawn over the painting: moonbeam, drifting dust, twinkling stars
  const ROOM_STARS = [[548, 120], [596, 170], [652, 104], [688, 214], [742, 162], [560, 248], [1770, 110], [1812, 150], [1856, 102], [1838, 214]];
  function drawRoomNight(dawn) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const [w, a] of [[0, .035], [28, .03], [56, .025]]) {  // three soft layers so the moonbeam has gentle edges
      const beam = ctx.createLinearGradient(640, 300, 470, 760); beam.addColorStop(0, `rgba(190,184,255,${a * (1 - dawn)})`); beam.addColorStop(1, 'rgba(190,184,255,0)');
      ctx.fillStyle = beam; ctx.beginPath(); ctx.moveTo(520 + w, 382); ctx.lineTo(778 - w, 382); ctx.lineTo(660 - w * 1.4, 770); ctx.lineTo(300 + w * 1.4, 770); ctx.closePath(); ctx.fill();
    }
    for (let i = 0; i < 18; i++) {
      const ph = (t * .025 + i * .137) % 1, x = 380 + ((i * 97) % 300) + Math.sin(t * .6 + i) * 14 - ph * 60, y = 400 + ph * 340;
      const a = Math.sin(ph * Math.PI) * (.35 + .25 * Math.sin(t * 1.3 + i)) * (1 - dawn);
      ctx.fillStyle = `rgba(236,232,255,${Math.max(0, a)})`; ctx.beginPath(); ctx.arc(x, y, 1.6 + (i % 3) * .6, 0, 7); ctx.fill();
    }
    ROOM_STARS.forEach(([x, y], i) => {
      const a = (.35 + .45 * Math.max(0, Math.sin(t * (.8 + i * .13) + i * 2))) * (1 - dawn * .8);
      ctx.fillStyle = `rgba(255,250,232,${a})`; ctx.beginPath(); ctx.moveTo(x, y - 5); ctx.lineTo(x + 1.3, y - 1.3); ctx.lineTo(x + 5, y); ctx.lineTo(x + 1.3, y + 1.3); ctx.lineTo(x, y + 5); ctx.lineTo(x - 1.3, y + 1.3); ctx.lineTo(x - 5, y); ctx.lineTo(x - 1.3, y - 1.3); ctx.closePath(); ctx.fill();
    });
    ctx.restore();
  }
  // Draws the bedroom. cam = { x, y, z } (room point at the screen centre, zoom). W/H = screen size.
  function drawRoomScene(W, H, cam, look) {
    const z = cam.z, ox = W / 2 - cam.x * z, oy = H / 2 - cam.y * z;
    ctx.fillStyle = '#0c0818'; ctx.fillRect(-W, -H, W * 3, H * 3);
    if (!roomReady()) return { ox, oy, z };
    ctx.save(); ctx.translate(ox, oy); ctx.scale(z, z);
    ctx.drawImage(ROOM_GREY, 0, 0, ROOM_W, ROOM_H);
    const wash = look.wash;
    if (wash > 0) { ctx.globalAlpha = wash; ctx.drawImage(ROOM_IMG, 0, 0, ROOM_W, ROOM_H); ctx.globalAlpha = 1; }
    for (const ty of ROOM_ORDER) {
      const a = (look.col[ty] || 0) * (1 - wash); if (a <= .01) continue;
      const L = roomLayer(ty); if (!L) continue;
      ctx.globalAlpha = a; ctx.drawImage(L.c, L.x, L.y, L.w, L.h);
    }
    ctx.globalAlpha = 1;
    // the moon gets a soft halo once Golden is home; dawn only after 5 AM
    const moonA = .25 + .5 * (look.col.G || 0);
    const mg = ctx.createRadialGradient(715, 135, 8, 715, 135, 120); mg.addColorStop(0, `rgba(255,246,214,${.35 * moonA})`); mg.addColorStop(1, 'rgba(255,246,214,0)');
    ctx.fillStyle = mg; ctx.fillRect(595, 15, 240, 240);
    if (look.dawn > 0) {
      for (const w of [[512, 78, 266, 300], [1748, 78, 140, 245]]) {
        const g = ctx.createLinearGradient(0, w[1], 0, w[1] + w[3]); g.addColorStop(0, 'rgba(255,170,120,0)'); g.addColorStop(1, `rgba(255,186,120,${.55 * look.dawn})`);
        ctx.fillStyle = g; ctx.fillRect(w[0], w[1], w[2], w[3]);
      }
      ctx.fillStyle = `rgba(255,200,150,${.1 * look.dawn})`; ctx.fillRect(0, 0, ROOM_W, ROOM_H);
    }
    drawRoomNight(look.dawn || 0);
    // Thiri, then Shwe curled up beside her
    const warm = Math.max(look.wash * 1.6, look.col.F || 0) * .85 + (look.pose >= 7 ? .15 : 0);
    drawThiriInBed(look.pose, clamp(warm, 0, 1), look.dawn || 0, Math.sin(t * 2.2) * 1.4);
    if (look.cat) drawRoomCat(look.cat.x, look.cat.y, look.cat.sleep ? 'sleep' : 'sit');
    // night shade and vignette
    ctx.restore();
    const v = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .35, W / 2, H / 2, Math.max(W, H) * .75);
    v.addColorStop(0, 'rgba(8,5,22,0)'); v.addColorStop(1, `rgba(8,5,22,${.55 - .25 * (look.dawn || 0)})`);
    ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
    return { ox, oy, z };
  }

  // ---------- Coming Home scene ----------
  const hx = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  function mix(a, b, p) { const A = hx(a), B = hx(b); p = clamp(p, 0, 1); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * p)).join(',')})`; }
  const ease = k => k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
  function makeDrawing(c) {
    const o = document.createElement('canvas'); o.width = 120; o.height = 90; const g = o.getContext('2d');
    g.fillStyle = c ? '#fff3dc' : '#9a96a3'; g.fillRect(0, 0, 120, 90);
    g.fillStyle = c ? '#ffcf5a' : '#bdb9c4'; g.beginPath(); g.arc(92, 22, 12, 0, 7); g.fill();
    g.fillStyle = c ? '#7cc48a' : '#84808c'; g.beginPath(); g.moveTo(0, 90); g.quadraticCurveTo(30, 52, 62, 72); g.quadraticCurveTo(90, 50, 120, 66); g.lineTo(120, 90); g.fill();
    g.fillStyle = c ? COAT.body : '#6e6a76';
    g.beginPath(); g.ellipse(40, 66, 10, 12, 0, 0, 7); g.fill(); g.beginPath(); g.arc(40, 50, 7, 0, 7); g.fill();
    g.beginPath(); g.moveTo(34, 46); g.lineTo(35, 38); g.lineTo(39, 44); g.fill(); g.beginPath(); g.moveTo(41, 44); g.lineTo(45, 38); g.lineTo(46, 46); g.fill();
    g.fillStyle = c ? '#ff6b8a' : '#8f8b97'; g.beginPath(); g.moveTo(70, 40); g.bezierCurveTo(60, 32, 64, 24, 70, 30); g.bezierCurveTo(76, 24, 80, 32, 70, 40); g.fill();
    g.strokeStyle = c ? '#3b2a55' : '#5e5a66'; g.lineWidth = 2; g.strokeRect(1, 1, 118, 88);
    return o;
  }
  const DRAW_G = makeDrawing(false), DRAW_C = makeDrawing(true);
  const THIRI = { x: 650, y: 300 };
  let H = null;

  function startHome(won, types, preview, night = storyNight) {
    music('duck', .65); music('play', 'bedroom'); music('ambience', null);
    const n = types.length, stage = Math.min(7, thiriSleepStage);
    const poseTo = stage, poseFrom = won && night >= stage ? Math.max(0, night - 1) : stage;
    const base = roomColoursFor(poseFrom);
    H = {
      won, preview, night, stage, diary: chapterFor(night).diary, phase: 'enter', pt: 0, p: 0, m: 0, capT: 0, total: n, given: { F: 0, N: 0, L: 0, C: 0, B: 0, E: 0, S: 0, J: 0, G: 0 },
      nF: types.filter(x => x === 'F').length, nN: types.filter(x => x === 'N').length,
      lights: types.map((ty, i) => ({ type: ty, x: VW * .42, y: 150, sx: VW / 2 - (n - 1) * 20 + i * 40, sy: 112, state: 'wait', delay: .55 + i * .12, ft: 0, fx: 0, fy: 0 })),
      catX: 440, catY: 477, poseFrom, poseTo, poseK: 0, zoom: 0, focus: null, base, col: { ...base }, grow: {}, travel: [], rings: [],
      parts: [], floats: [], react: 0, reactCol: INK, drag: null, canContinue: false, caption: false, finished: false
    };
    cv.hidden = false; mouseSneakHeld = false; mouseSneakPointerId = null; mouseSneakPress = null; state = 'home'; touchUI.hidden = true;
    $('#startScreen').hidden = true; $('#endScreen').hidden = true;
    tone(523, .25, 'sine', .05); setTimeout(() => tone(659, .3, 'sine', .04), 120);
  }
  function give(L) {
    if (!H || H.phase !== 'give' || (L.state !== 'hover' && L.state !== 'drag')) return;
    L.state = 'fly'; L.ft = 0; L.fx = L.x; L.fy = L.y;
    tone(440, .12, 'sine', .04, 220);
  }
  function arrive(L) {
    const h = H; h.given[L.type]++;
    if (ROOM_PARTS[L.type]) { const c = partCentre(L.type); h.travel.push({ type: L.type, tx: c.x, ty: c.y, k: 0 }); }
    h.react = .9; h.reactCol = col(L.type);
    for (let i = 0; i < 22; i++) { const a = Math.random() * Math.PI * 2, s = 40 + Math.random() * 140; h.parts.push({ x: THIRI.x, y: THIRI.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 30, life: .8 + Math.random() * .4, max: 1.2, c: col(L.type), r: 1.5 + Math.random() * 2.5 }); }
    const cnt = Object.values(h.given).reduce((sum, n) => sum + n, 0);
    const homeLine = { F: 'Her frustration came home', N: 'Her nerves came home', L: 'Her loneliness came home', C: 'A little calm came home', B: 'A buried feeling came home', E: 'Her excitement came home', S: 'Her shyness came home', J: 'Her jealousy came home', G: 'A bright feeling came home' }[L.type] || 'A feeling came home';
    h.floats.push({ x: THIRI.x + 60, y: THIRI.y - 40 - (cnt % 2) * 24, text: homeLine, c: col(L.type), life: 1.6 });
    const f = 523.25 * Math.pow(2, (cnt - 1) * 2 / 12);
    if (window.TCSfx) sfx('caught', L.type); else { tone(f, .3, 'sine', .07); setTimeout(() => tone(f * 1.5, .35, 'triangle', .04), 90); }
  }
  function homeKey() {
    if (!H) return;
    if (H.canContinue) { finishHome(); return; }
    if (H.phase === 'give') { const L = H.lights.find(l => l.state === 'hover'); if (L) give(L); }
  }
  let wakeTimer = 0, wakeRaf = 0, wakeStage = 0;
  function drawWakeCard(stage, blend = 1) {
    const c = $('#nightWakeCanvas'), main = ctx; ctx = c.getContext('2d');
    try {
      const pose = Math.max(0, stage - 1) + blend, z = c.width / 1150;
      const col = roomColoursFor(stage - 1); NIGHT_TYPES[stage].forEach(k => { col[k] = Math.max(col[k], blend); });
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
      drawRoomScene(c.width, c.height, { x: 575, y: 470, z }, { col, wash: roomWash(stage - 1) + (roomWash(stage) - roomWash(stage - 1)) * blend, pose, dawn: stage >= 7 ? .5 * blend : 0, cat: { x: 440, y: 477, sleep: true } });
      ctx.restore();
    } finally { ctx = main; }
  }
  function closeNightWake() {
    clearTimeout(wakeTimer); cancelAnimationFrame(wakeRaf); $('#nightWakeScreen').hidden = true;
    if (wakeStage === 7 && !finalAwakeningSeen) playFinalAwakening(); else showEnd();
  }
  function showNightWake(night) {
    music('play', 'bedroom'); music('ambience', null);
    wakeStage = clamp(thiriSleepStage, 1, 7); const ch = chapterFor(night);
    $('#nightWakeEyebrow').textContent = `AFTER ${hourOf(night).toUpperCase()}`;
    $('#nightWakeTitle').textContent = night > 7 ? 'One more route brought home.' : wakeStage === 7 ? 'Morning is almost here.' : 'She stirs in her sleep.';
    $('#nightWakeDiary').textContent = `“${ch.diary}”`; $('#nightWakeLine').textContent = `Shwe: “${STAGE_LINES[wakeStage]}”`;
    $('#nightWakeContinue').textContent = night <= 7 && wakeStage === 7 ? 'See the morning →' : 'Continue →';
    $('#nightWakeScreen').hidden = false; $('#nightWakeContinue').focus({ preventScroll: true });
    const from = SLEEP_STAGES[Math.max(0, wakeStage - 1)], to = SLEEP_STAGES[wakeStage], started = performance.now(), tween = reduce ? .1 : 1.5;
    const animateWake = now => { const q = clamp((now - started) / 1000 / tween, 0, 1); drawWakeCard(wakeStage, ease(q)); if (q < 1) wakeRaf = requestAnimationFrame(animateWake); };
    wakeRaf = requestAnimationFrame(animateWake); wakeTimer = setTimeout(closeNightWake, reduce ? 2000 : 6000);
  }
  function finishHome() {
    if (!H || H.finished) return; H.finished = true;
    if (H.preview) { state = 'menu'; cv.hidden = true; showStoryMap(false); setTimeout(() => $('#playBtn').focus(), 50); }
    else if (H.won) showNightWake(H.night);
    else showEnd();
  }
  function homeUpdate(dt) {
    const h = H; t += dt; h.pt += dt;
    const target = h.total ? Object.values(h.given).reduce((sum, n) => sum + n, 0) / h.total : 0;
    h.p += (target - h.p) * Math.min(1, dt * 2.5);
    if (h.phase === 'enter') {
      const k = Math.min(1, h.pt / 1.1), e = ease(k);
      for (const L of h.lights) if (L.state === 'wait' && h.pt >= L.delay) L.state = 'hover';
      if (h.pt > .55 + h.total * .12 + .8) { h.phase = 'give'; h.pt = 0; }
    }
    for (const L of h.lights) {
      if (L.state === 'hover') { L.x += (L.sx - L.x) * Math.min(1, dt * 5); L.y += (L.sy - L.y) * Math.min(1, dt * 5); }
      if (L.state === 'fly') {
        L.ft = Math.min(1, L.ft + dt / .6);
        const k = L.ft, cx = (L.fx + THIRI.x) / 2, cy = Math.min(L.fy, THIRI.y) - 110;
        L.x = (1 - k) * (1 - k) * L.fx + 2 * (1 - k) * k * cx + k * k * THIRI.x;
        L.y = (1 - k) * (1 - k) * L.fy + 2 * (1 - k) * k * cy + k * k * THIRI.y;
        if (k >= 1) { L.state = 'done'; arrive(L); }
      }
    }
    // sparks travel to their part of the room, which then gets its colour back
    for (const sp of h.travel) {
      sp.k += dt / .8;
      if (sp.k >= 1 && !sp.done) {
        sp.done = true; h.grow[sp.type] = true; h.rings.push({ type: sp.type, x: sp.tx, y: sp.ty, life: 1.2 });
        const cam = homeCam(h), hw = VW / 2 / cam.z;
        if (Math.abs(sp.tx - cam.x) > hw * .8 && !h.focus) h.focus = { x: sp.tx, y: sp.ty, t: 0, k: 0 };
      }
    }
    h.travel = h.travel.filter(sp => !sp.done);
    for (const r of h.rings) r.life -= dt;
    h.rings = h.rings.filter(r => r.life > 0);
    for (const ty of Object.keys(h.grow)) h.col[ty] = Math.min(1, (h.col[ty] || 0) + dt / 1.1);
    if (h.focus) { const f = h.focus; f.t += dt; f.k = f.t < .5 ? f.t / .5 : f.t < 1.7 ? 1 : 1 - (f.t - 1.7) / .6; if (f.t > 2.3) h.focus = null; }
    if (h.phase === 'night') for (const ty of Object.keys(h.grow)) { if (!h.base[ty]) h.col[ty] = Math.max(.12, h.col[ty] - dt * .35); }
    if (h.phase === 'give' && h.lights.every(l => l.state === 'done')) { h.phase = 'settle'; h.pt = 0; }
    if (h.phase === 'settle' && h.pt > 1.3) {
      h.phase = h.won ? 'morning' : 'night'; h.pt = 0;
      if (h.won) { tone(392, .6, 'sine', .05); setTimeout(() => tone(523, .6, 'sine', .05), 260); setTimeout(() => tone(659, .9, 'sine', .05), 520); }
    }
    if (h.phase === 'morning') { const k = Math.min(1, h.pt / 2.6); h.m = k * k * (3 - 2 * k); h.poseK = h.m; h.zoom = h.m; if (h.pt < .1) NIGHT_TYPES[h.night].forEach(ty => { if (h.won) h.grow[ty] = true; }); if (h.pt > 2.4) h.caption = true; if (h.pt > 3.2) h.canContinue = true; if (h.pt > 12) finishHome(); }
    if (h.phase === 'night') { h.zoom = Math.min(.6, h.zoom + dt * .3); h.caption = true; if (h.pt > 1) h.canContinue = true; if (h.pt > 10) finishHome(); }
    if (h.caption) h.capT += dt;
    h.react = Math.max(0, h.react - dt);
    for (const p of h.parts) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .96; p.vy *= .96; }
    h.parts = h.parts.filter(p => p.life > 0);
    for (const f of h.floats) { f.life -= dt; f.y -= 26 * dt; }
    h.floats = h.floats.filter(f => f.life > 0);
  }

  function toView(e) { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / S, y: (e.clientY - r.top) / S - OY }; }
  cv.addEventListener('pointerdown', e => {
    if (state !== 'home' || !H) return;
    e.preventDefault();
    if (H.canContinue) { finishHome(); return; }
    if (H.phase !== 'give') return;
    const v = toView(e), x = v.x, y = v.y;
    let best = null, bd = 44;
    for (const L of H.lights) { if (L.state !== 'hover') continue; const d = Math.hypot(L.x - x, L.y - y); if (d < bd) { bd = d; best = L; } }
    if (!best) return;
    H.drag = { L: best, id: e.pointerId, sx: x, sy: y, moved: false }; best.state = 'drag';
    try { cv.setPointerCapture(e.pointerId); } catch (err) {}
  });
  cv.addEventListener('pointermove', e => {
    if (!H || !H.drag || e.pointerId !== H.drag.id) return;
    const v = toView(e), x = v.x, y = v.y, d = H.drag;
    if (Math.hypot(x - d.sx, y - d.sy) > 8) d.moved = true;
    if (d.moved) { d.L.x = x; d.L.y = y; }
  });
  const dragEnd = e => {
    if (!H || !H.drag || e.pointerId !== H.drag.id) return;
    const d = H.drag; H.drag = null;
    if (!d.moved || Math.hypot(d.L.x - THIRI.x, d.L.y - THIRI.y) < 140) { d.L.state = 'hover'; give(d.L); }
    else d.L.state = 'hover';
  };
  cv.addEventListener('pointerup', dragEnd); cv.addEventListener('pointercancel', dragEnd);

  // Shwe as he looks in the game: the chosen cat's sprite and rig, facing Thiri
  function drawRoomCat(x, y, pose) {
    const coat = MK_PROFILE.coat, spr = mkGetSprite(coat);
    if (!spr || !spr.complete || !spr.naturalWidth) { ctx.save(); ctx.translate(x, y); ctx.scale(1.25, 1.25); drawCurled(0, 0, pose === 'sleep'); ctx.restore(); return; }
    const hh = 68, ww = hh * spr.naturalWidth / spr.naturalHeight, jump = pose === 'jump';
    const rig = jump ? { back: -.38, front: .32, tail: -.32 } : { back: 0, front: 0, tail: Math.sin(t * 1.7) * .12, breath: Math.sin(t * (pose === 'sleep' ? 1.3 : 2.2)) * .016 };
    ctx.save(); ctx.translate(x, y); ctx.scale(-1, 1);
    if (!jump) { ctx.fillStyle = 'rgba(40,12,40,.3)'; ctx.beginPath(); ctx.ellipse(-2, 2, ww * .34, 4, 0, 0, 7); ctx.fill(); }
    ctx.filter = 'brightness(.9)';
    if (!mkDrawRig(ctx, coat, -ww / 2, -hh + 6, ww, hh, rig)) ctx.drawImage(spr, -ww / 2, -hh + 6, ww, hh);
    ctx.restore();
  }
  function drawCurled(x, y, sleep) {
    ctx.save(); ctx.translate(x, y);
    ctx.strokeStyle = COAT.body; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(-2, 2, 24, .15 * Math.PI, .85 * Math.PI); ctx.stroke();
    ctx.fillStyle = COAT.body; ctx.beginPath(); ctx.ellipse(0, 0, 24, 13, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = COAT.dark; ctx.lineWidth = 3;
    [-12, -3, 6].forEach(s => { ctx.beginPath(); ctx.moveTo(s, -12); ctx.lineTo(s + 3, -5); ctx.stroke(); });
    ctx.fillStyle = COAT.body; ctx.beginPath(); ctx.arc(18, -6, 10, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.moveTo(12, -13); ctx.lineTo(13, -22); ctx.lineTo(18, -15); ctx.fill();
    ctx.beginPath(); ctx.moveTo(20, -15); ctx.lineTo(25, -22); ctx.lineTo(27, -11); ctx.fill();
    if (sleep) {
      ctx.strokeStyle = '#4a3010'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.arc(15, -8, 2.5, .1 * Math.PI, .9 * Math.PI); ctx.stroke();
      ctx.beginPath(); ctx.arc(22, -8, 2.5, .1 * Math.PI, .9 * Math.PI); ctx.stroke();
    } else {
      ctx.fillStyle = '#c8ff8a'; ctx.shadowColor = '#c8ff8a'; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.ellipse(15, -7, 2.2, 3, 0, 0, 7); ctx.ellipse(22, -7, 2.2, 3, 0, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
    }
    ctx.restore();
  }
  function rrect(x, y, w, h, r) { ctx.beginPath(); if (ctx.roundRect) canvasRoundRect(ctx, x, y, w, h, r); else ctx.rect(x, y, w, h); }

  // camera for the coming-home scene: the whole bed-to-dresser side of the room, zooming in on Thiri at the end
  function homeCam(h) {
    const fullH = VH + OY * 2;
    const z0 = Math.max(VW / 1150, fullH / ROOM_H);
    const settle = h.zoom || 0, z = z0 * (1 + .45 * settle);
    let cx = 575 + (330 - 575) * settle, cy = 440 + (470 - 440) * settle;
    if (h.focus && h.focus.k > 0) { const f = ease(clamp(h.focus.k, 0, 1)); cx += (h.focus.x - cx) * f; cy += (h.focus.y - cy) * f * .5; }
    const hw = VW / 2 / z, hh = fullH / 2 / z;
    return { x: clamp(cx, hw, ROOM_W - hw), y: clamp(cy, hh, ROOM_H - hh), z };
  }
  const roomToView = (cam, x, y) => ({ x: VW / 2 + (x - cam.x) * cam.z, y: (VH + OY * 2) / 2 + (y - cam.y) * cam.z - OY });
  function homeLook(h) {
    const pose = h.poseFrom + (h.poseTo - h.poseFrom) * (h.poseK || 0);
    return { col: h.col, wash: roomWash(h.poseFrom) + (roomWash(h.poseTo) - roomWash(h.poseFrom)) * (h.poseK || 0), pose, dawn: h.night === 7 && h.won ? h.m : 0,
      cat: h.phase === 'enter' ? null : { x: h.catX, y: h.catY, sleep: h.phase === 'morning' || h.phase === 'night' } };
  }
  function drawHome() {
    const h = H, fullH = VH + OY * 2, cam = homeCam(h);
    ctx.save(); ctx.translate(0, -OY);
    drawRoomScene(VW, fullH, cam, homeLook(h));
    ctx.restore();
    // where Thiri is on screen (the lights fly to her)
    const head = roomToView(cam, 243, 470); THIRI.x = head.x; THIRI.y = head.y;
    // Shwe jumping in through the window
    if (h.phase === 'enter') {
      const k = clamp(h.pt / 1.1, 0, 1), e = ease(k), a = roomToView(cam, 645, 360), b = roomToView(cam, h.catX, h.catY);
      const x = a.x + (b.x - a.x) * e, y = a.y + (b.y - a.y) * e - Math.sin(Math.PI * k) * 80 * cam.z;
      ctx.save(); ctx.translate(x, y); ctx.scale(cam.z, cam.z); drawRoomCat(0, 0, 'jump'); ctx.restore();
    }
    // a little spark travels from Thiri to the part of the room that gets its colour back
    for (const s of h.travel) {
      const p = roomToView(cam, s.tx, s.ty), k = ease(clamp(s.k, 0, 1)), x = THIRI.x + (p.x - THIRI.x) * k, y = THIRI.y + (p.y - THIRI.y) * k - Math.sin(Math.PI * k) * 60;
      ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(x, y, 1, x, y, 26); g.addColorStop(0, col(s.type)); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 26, 0, 7); ctx.fill(); ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, 3, 0, 7); ctx.fill();
    }
    for (const r of h.rings) {
      const p = roomToView(cam, r.x, r.y), a = clamp(r.life / 1.2, 0, 1), rad = (1.2 - r.life) * 90 + 10;
      ctx.strokeStyle = col(r.type); ctx.globalAlpha = a * .8; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(p.x, p.y, rad, 0, 7); ctx.stroke(); ctx.globalAlpha = 1;
    }
    if (h.react > 0) {
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(THIRI.x, THIRI.y, 4, THIRI.x, THIRI.y, 90);
      g.addColorStop(0, h.reactCol); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha = .55 * (h.react / .9); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(THIRI.x, THIRI.y, 90, 0, 7); ctx.fill();
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    }
    for (const L of h.lights) {
      if (L.state === 'wait' || L.state === 'done') continue;
      const bob = L.state === 'hover' ? Math.sin(t * 2.4 + L.sx * .05) * 5 : 0;
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .28;
      const g = ctx.createRadialGradient(L.x, L.y + bob, 2, L.x, L.y + bob, 46); g.addColorStop(0, col(L.type)); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(L.x, L.y + bob, 46, 0, 7); ctx.fill();
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      lightShape(L.type, L.x, L.y + bob, L.state === 'drag' ? 1.8 : 1.5);
    }
    for (const q of h.parts) { ctx.globalAlpha = clamp(q.life / q.max, 0, 1); ctx.fillStyle = q.c; ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, 7); ctx.fill(); }
    ctx.globalAlpha = 1; ctx.textAlign = 'center';
    for (const f of h.floats) { ctx.globalAlpha = clamp(f.life / .4, 0, 1); ctx.font = `800 17px ${DISP}`; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(18,12,36,.85)'; ctx.strokeText(f.text, f.x, f.y); ctx.fillStyle = f.c; ctx.fillText(f.text, f.x, f.y); }
    ctx.globalAlpha = 1;
    // she murmurs in her sleep once she is nearly well
    if ((h.phase === 'morning' || h.phase === 'night') && h.poseTo >= 6 && h.poseTo < 7 && h.won) {
      const a = clamp((h.pt - 1) / .6, 0, 1); ctx.globalAlpha = a; ctx.font = `italic 600 15px ${BODY}`; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(18,12,36,.8)';
      const s = `“…${MK_PROFILE.cat}…”`; ctx.strokeText(s, THIRI.x + 10, THIRI.y - 34); ctx.fillStyle = '#f3ecff'; ctx.fillText(s, THIRI.x + 10, THIRI.y - 34); ctx.globalAlpha = 1;
    }
    // clock
    const top = Math.min(40, 40 - OY), cx = VW / 2;
    ctx.textAlign = 'right'; ctx.font = `800 15px ${DISP}`; ctx.fillStyle = 'rgba(243,236,255,.75)';
    ctx.fillText(h.won && (h.phase === 'morning') ? `${hourOf(h.night)} · ${h.night === 7 ? 'dawn' : 'still night'}` : hourOf(h.night), VW - 20, top);
    ctx.textAlign = 'center';
    if (h.phase === 'enter') {
      ctx.font = `600 13px ${BODY}`; ctx.fillStyle = MUTED; ctx.fillText(`${MK_PROFILE.cat.toUpperCase()} IS HOME`, cx, top);
    } else if (h.phase === 'give') {
      const cnt = Object.values(h.given).reduce((sum, n) => sum + n, 0);
      ctx.font = `800 22px ${DISP}`; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(18,12,36,.8)';
      ctx.strokeText(`Tap each light to give it back to ${mkName('Thiri')}`, cx, top); ctx.fillStyle = INK; ctx.fillText(`Tap each light to give it back to ${mkName('Thiri')}`, cx, top);
      ctx.font = `600 13px ${BODY}`; ctx.fillStyle = MUTED; ctx.fillText(`${cnt} of ${h.total} home · watch the room get its colour back`, cx, top + 22);
    }
    if (h.caption) {
      const a = clamp(h.capT / .5, 0, 1), w = Math.min(560, VW - 32), x = cx - w / 2, y = VH + OY - 118;
      ctx.globalAlpha = a; ctx.fillStyle = 'rgba(22,15,44,.9)'; rrect(x, y, w, 100, 14); ctx.fill();
      ctx.strokeStyle = 'rgba(243,236,255,.16)'; ctx.lineWidth = 1; ctx.stroke();
      ctx.font = `600 12px ${BODY}`; ctx.fillStyle = GOLD; ctx.fillText(h.won ? `AFTER ${hourOf(h.night).toUpperCase()}` : `${hourOf(h.night).toUpperCase()} · NOT YET`, cx, y + 24);
      ctx.font = `800 24px ${DISP}`; ctx.fillStyle = INK;
      ctx.fillText(h.won ? (h.night === 7 ? 'The sky is getting lighter.' : 'A little more colour came back.') : 'Some feelings are still out there.', cx, y + 56);
      ctx.font = `italic 400 15px ${BODY}`; ctx.fillStyle = MUTED;
      ctx.fillText(h.won ? `“${mkName(h.diary)}”` : `${MK_PROFILE.cat} will go back out and try this hour again.`, cx, y + 82);
      ctx.globalAlpha = 1;
    }
    if (h.canContinue) {
      ctx.globalAlpha = .6 + .4 * Math.sin(t * 3); ctx.font = `600 15px ${BODY}`; ctx.fillStyle = INK;
      ctx.fillText(h.preview ? 'Tap anywhere to go back' : 'Tap anywhere to continue the story', cx, top);
      ctx.globalAlpha = 1;
    }
  }

  function initAudio() {
    if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }
    if (ac && ac.state === 'suspended') ac.resume();
  }
  function markMode() { document.body.dataset.playMode = mode; }
  function startGame(m, night = storyNight) {
    // the first step past the seventh night plays the team's Endless Nights film, once
    if ((typeof m === 'string' ? m : mode) === 'story' && +night >= 8 && window.TCEndlessFilm && !TCEndlessFilm.seen()) {
      $('#levelBriefingScreen').hidden = true; $('#startScreen').hidden = true; $('#endScreen').hidden = true;
      music('duck', .25); TCEndlessFilm.play(() => { music('duck', 1); startGame(m, night); }); return;
    }
    document.body.classList.remove('learning-with-shwe'); $('#tipCoach').classList.remove('shwe-lesson');
    if (typeof m === 'string') mode = m;
    markMode();
    storyNight = mode === 'story' ? clamp(Math.floor(+night) || 1, 1, 50) : 1;
    nightGuide.active = false; nightGuide.success = 0; nightGuide.pendingWin = false; activeJitTip = null; jitTipQueue = []; struggleTimer = 0; struggleTipShownThisRun = false; guidanceCaught = caughtN; guidanceHits = {}; hideCoachTip();
    initAudio(); sfx('ui', 'start'); setTimeout(() => sfx('cat', 'meow'), 400);
    const freePick = FREE_MAPS.find(m => m.id === freeMap), mapKey = mode === 'story' ? window.TC_LEVELS[storyNight]?.map : (freePick && freePick.level && freeMapOpen(freePick) ? freePick.id : 'free');
    const sceneTrack = ({ school: 'school', rooftop: 'hilltop', park: 'park', festival: 'festival', hill: 'hilltop', lake: 'lakeside' })[mapKey] || 'park';
    music('duck', 1); music('play', sceneTrack);
    music('ambience', sceneTrack);
    cv.hidden = false;
    $('#welcomeScreen').hidden = true; $('#levelBriefingScreen').hidden = true; $('#nightReadyScreen').hidden = true; $('#welcomeCardsScreen').hidden = true; $('#helpScreen').hidden = true;
    $('#prologueScreen').hidden = true; $('#awakeningScreen').hidden = true;
    $('#bPurr').hidden = upg.purr === 0; $('#bScratch').hidden = true; $('#shopScreen').hidden = true; $('#bookScreen').hidden = true;
    mouseSneakHeld = false; mouseSneakPointerId = null; mouseSneakPress = null; reset(); state = 'play';
    if (mode === 'story') {   // pack one of each comfort item for this hour
      ITEMS.forEach(i => { if (itemStock[i.id] > 0) { itemStock[i.id]--; activeItems[i.id] = true; } });
      if (activeItems.sand) { timeLeft += 10; float(cat.x, cat.y - 90, '⏳ +10 seconds', GOLD); }
      saveShop();
    }
    $('#startScreen').hidden = true; $('#endScreen').hidden = true; pauseScreen.hidden = true; pauseBtn.hidden = false;
    touchUI.hidden = !coarse && !('ontouchstart' in window && navigator.maxTouchPoints > 0);
    const chapter = mode === 'story' ? chapterFor(storyNight) : null;
    const visualTheme = mode === 'story' ? window.TCVisualChapters?.forLevel(storyNight) : null;
    announce(mode === 'free' ? 'Free play · no clock, no score. Just wander with Shwe.' : `${visualTheme?.name || chapter.name} · ${chapter.sub}`, INK, 2.1);
    if (chapter) { tone(chapter.musicRoot, .9, 'sine', .025); setTimeout(() => tone(chapter.musicRoot * 1.25, .8, 'sine', .018), 180); setTimeout(() => tone(chapter.musicRoot * 1.5, .9, 'triangle', .014), 380); }
    if (mode === 'free') queueJitTip('free', cat, guideCopy().mechanicTitles?.free || 'Free Play');
    if (!startGuidedTutorial()) showNextJitTip();
    cv.focus?.();
  }
  const LEVEL_MAP_LIMIT = 50, LEVEL_MAP_STEP = 240;
  const LEVEL_MAP_CHAPTERS = new Map(NIGHT_CHAPTERS.map(chapter => [chapter.night, chapter]));
  // Seeded variation gives each stretch its own shape and keeps it stable on revisit.
  const mapRandom = seed => { const n = Math.sin(seed * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); };
  const mapStops = [];
  for (let level = 1, x = 140; level <= LEVEL_MAP_LIMIT; level++) {
    if (level > 1) x += 230 + mapRandom(level + 91) * 100;
    mapStops.push({ x, bend: mapRandom(level + 17) });
  }
  function mapPoint(level) {
    const height = Math.max(180, $('#levelMapViewport').clientHeight);
    const stop = mapStops[level - 1];
    return { x: stop.x, y: height * (.25 + stop.bend * .41) };
  }
  // Pixel coordinates keep the illustrated terrain proportional at every screen size.
  function drawNightMap(width, height, river) {
    const random = mapRandom;
    const parts = [
      `<defs><linearGradient id="trailGround" x2="0" y2="1"><stop stop-color="#243d45"/><stop offset="1" stop-color="#172d39"/></linearGradient><linearGradient id="trailWater" x2="0" y2="1"><stop stop-color="#367a91"/><stop offset="1" stop-color="#224b70"/></linearGradient></defs>`,
      `<rect width="${width}" height="${height}" fill="url(#trailGround)"/>`
    ];
    // Mossy clearings and small stones give the banks a hand-illustrated texture.
    for (let i = 0; i < width / 35; i++) {
      const x = random(i + 3) * width, y = random(i + 8) * height;
      parts.push(`<ellipse cx="${x}" cy="${y}" rx="${12 + random(i) * 30}" ry="${5 + random(i + 6) * 12}" fill="#507365" opacity=".17"/>`);
    }
    parts.push(`<path d="${river}" class="map-river-cliff"/><path d="${river}" class="map-river-bank"/><path d="${river}" class="map-river-water"/><path d="${river}" class="map-river-ripple"/>`);
    const tree = (x, y, scale) => `<g transform="translate(${x} ${y}) scale(${scale})"><ellipse cy="6" rx="24" ry="9" fill="#0b1825" opacity=".5"/><path d="M-4 2L-3-37H4L5 2Z" fill="#6a5358"/><path d="M0-82L-27-43H-17L-34-20Q0-9 34-20L17-43H27Z" fill="#24434c" stroke="#41616a" stroke-width="2"/><path d="M0-81L-26-43H-15L-32-21" fill="none" stroke="#709187" stroke-opacity=".5" stroke-width="3"/></g>`;
    for (let level = 1; level <= LEVEL_MAP_LIMIT; level++) {
      const point = mapPoint(level), x = point.x;
      const scale = Math.min(1.3, height / 310);
      const treeCount = Math.floor(random(level + 200) * 4);
      for (let j = 0; j < treeCount; j++) {
        const seed = level * 19 + j;
        const size = scale * (.55 + random(seed + 400) * .55);
        const tx = x - 100 + random(seed + 500) * 190;
        const ty = random(seed + 600) > .5 ? height - 8 - random(seed + 700) * 20 : 76 * size + random(seed + 800) * 10;
        parts.push(tree(tx, ty, size));
      }
      // River stones and fireflies sit outside the chapter labels and hit areas.
      parts.push(`<path d="M${x - 27} ${point.y + 17}q27-15 55 0l-5 17q-22 9-47-1Z" fill="#102b43" opacity=".6"/>`);
      for (let j = 0; j < 4; j++) {
        const fx = x - 105 + random(level * 9 + j) * 200, fy = height * (.12 + random(level * 8 + j) * .76);
        parts.push(`<circle cx="${fx}" cy="${fy}" r="6" fill="#ffe9a0" opacity=".05"/><circle cx="${fx}" cy="${fy}" r="1.5" fill="#ffe9a0" opacity=".8"/>`);
      }
      if (random(level + 1000) < .36) {
        const ly = Math.max(34, height * (.11 + random(level + 1100) * .09)), lx = x + 75 + random(level + 1200) * 30;
        parts.push(`<g transform="translate(${lx} ${ly})"><circle r="30" fill="#ffe6a0" opacity=".06"/><path d="M0 22V-10h-12" fill="none" stroke="#a69b89" stroke-width="3"/><rect x="-20" y="-12" width="15" height="20" rx="4" fill="#efd58b"/><path d="M-18-6h11M-18 2h11" stroke="#ad8d64"/></g>`);
      }
      if (random(level + 1300) < .27) {
        parts.push(`<g transform="translate(${x + 30} 30)"><circle r="25" fill="#eff3cf" opacity=".05"/><path d="M6-15A17 17 0 1 0 16 10 15 15 0 0 1 6-15Z" fill="#e6ebc9" opacity=".9"/></g>`);
        const ly = height - 12 - random(level + 1400) * 25, lx = x - 65 + random(level + 1500) * 130, scale = Math.min(.85, height / 420) * (.8 + random(level + 1600) * .3);
        const kind = Math.floor(random(level + 1700) * 5);
        const landmarks = [
          '<path d="M-40 0v-52h80V0Z" fill="#576378"/><path d="M-47-52L0-77l47 25Z" fill="#aa8190"/><path d="M-9 0v-26H9V0" fill="#d6b675"/><path d="M-27-39h12v13h-12m42-13h12v13H15" fill="#f8dca0"/>',
          '<path d="M-38 0v-27m76 27v-27M-45-23h90M-42-34h84" stroke="#ba9d86" stroke-width="6"/><path d="M-42-60h84" stroke="#536c6d" stroke-width="3"/>',
          '<path d="M-38 0v-38h76V0" fill="#79637e"/><path d="M-47-38L0-70l47 32Z" fill="#cd9e97"/><path d="M-42-36h84" stroke="#f8dc9a" stroke-width="5"/><path d="M-25-24h50v17h-50Z" fill="#e1c88e"/>',
          '<path d="M-50 0L-22-52 0-21 22-71 53 0Z" fill="#73828b"/><path d="M22-71L8-40l14 6 11-12Z" fill="#bdc6c0"/>',
          '<path d="M-46 0h92M-35-7v-22m70 22v-22M-45-23h90" stroke="#af9c88" stroke-width="6"/><path d="M-23-39q23 20 46 0l-8 14h-30Z" fill="#ba8a81"/>'
        ];
        parts.push(`<g transform="translate(${lx} ${ly}) scale(${scale})">${landmarks[kind]}</g>`);
      }
    }
    $('#mapScenery').innerHTML = parts.join('');
  }
  const HOUR_DOODLE = {
    1: { c: '#e65a5f', art: '<path d="M-26 -2 L0 -24 L26 -2" FILL STROKE/><rect x="-21" y="-2" width="42" height="30" FILL2 STROKE/><rect x="-6" y="10" width="12" height="18" FILL STROKE/><path d="M0 -24 L0 -36 L12 -32 L0 -28" fill="#f2b53a" STROKE/>' },
    2: { c: '#9a82e8', art: '<path d="M-18 -26 L18 -26 L16 -2 C14 10 6 14 0 14 C-6 14 -14 10 -16 -2 Z" fill="#f2b53a" STROKE/><path d="M-18 -20 C-30 -20 -30 -4 -16 -4 M18 -20 C30 -20 30 -4 16 -4" fill="none" STROKE/><path d="M0 14 L0 24 M-12 28 L12 28" STROKE/>' },
    3: { c: '#4d9be6', art: '<path d="M-30 32 L-16 -30 L16 -30 L30 32" fill="none" STROKE/><path d="M-8 -30 L-8 10 M8 -30 L8 10" STROKE/><rect x="-14" y="8" width="28" height="7" rx="2" FILL STROKE/><path d="M-38 34 C-16 28 16 28 38 34" fill="none" stroke="#3fae74" stroke-width="3.5" stroke-linecap="round"/>' },
    4: { c: '#f2b53a', art: '<path d="M0 -40 L0 -30" STROKE/><rect x="-12" y="-32" width="24" height="6" rx="2" fill="#7a3d33" STROKE/><path d="M-16 -24 C-22 -12 -22 4 -16 16 L16 16 C22 4 22 -12 16 -24 Z" fill="#ff8f6b" STROKE/><path d="M-18 -12 L18 -12 M-19 2 L19 2" stroke="#ffd38a" stroke-width="3"/><rect x="-12" y="16" width="24" height="6" rx="2" fill="#7a3d33" STROKE/><path d="M0 22 L0 36" stroke="#e65a5f" stroke-width="3" stroke-linecap="round"/>' },
    5: { c: '#a67646', art: '<path d="M-40 32 C-22 6 -2 0 18 12 C28 18 36 24 42 32" fill="none" STROKE/><path d="M10 10 L10 -12" STROKE/><path d="M10 -34 C22 -34 28 -24 24 -16 C28 -8 20 -2 10 -4 C0 -2 -8 -8 -4 -16 C-8 -24 -2 -34 10 -34 Z" FILL STROKE/>' },
    6: { c: '#3fae74', art: '<path d="M-40 10 C-28 4 -16 16 -2 10 C12 4 24 16 40 10" fill="none" stroke="#4d9be6" stroke-width="3" stroke-linecap="round"/><path d="M-40 24 C-28 18 -16 30 -2 24 C12 18 24 30 40 24" fill="none" stroke="#4d9be6" stroke-width="3" stroke-linecap="round"/><path d="M-22 -2 L22 -2 L14 8 L-14 8 Z" fill="#c9915a" STROKE/><path d="M0 -2 L0 -28 L16 -8 Z" FILL STROKE/>' },
    7: { c: '#f59b57', art: '<path d="M-30 20 A30 30 0 0 1 30 20 Z" FILL STROKE/><path d="M0 -22 L0 -32 M-22 -12 L-29 -19 M22 -12 L29 -19 M-34 8 L-44 6 M34 8 L44 6" STROKE/><path d="M-44 22 L44 22" STROKE/>' }
  };
  function hourDoodle(level, x, y, state) {
    const d = HOUR_DOODLE[level]; if (!d) return '';
    const done = state === 'done', cur = state === 'current';
    const ink = done ? '#3b3550' : '#7d7894';
    const stroke = `stroke="${ink}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"${done ? '' : ' stroke-dasharray="5 4"'}`;
    const art = d.art.replace(/ STROKE/g, ' ' + stroke).replace(/ FILL2/g, done ? ' fill="#fff3ea"' : ' fill="none"').replace(/ FILL/g, done ? ` fill="${d.c}"` : ' fill="none"');
    const blob = done ? `<path d="M2 -46 C30 -48 50 -26 48 2 C46 30 24 48 -2 46 C-30 46 -48 26 -46 -2 C-44 -28 -26 -46 2 -46 Z" fill="${d.c}" opacity=".26"/>` : '';
    const ring = cur ? `<path d="M2 -50 C34 -52 54 -26 52 4 C50 34 24 54 -4 52 C-34 50 -52 26 -50 -4 C-48 -32 -26 -50 8 -48" fill="none" stroke="#e65a5f" stroke-width="3.5" stroke-linecap="round"/><text x="0" y="-60" text-anchor="middle" font-family="Gaegu, Fredoka, sans-serif" font-weight="700" font-size="20" fill="#c2473f">Shwe is here!</text>` : '';
    return `<g transform="translate(${x} ${y})" opacity="${state === 'locked' ? .75 : 1}">${blob}${ring}${art}</g>`;
  }
  function drawSketchMap(width, height, segs, current) {
    const R = mapRandom, parts = [];
    parts.push(`<defs><pattern id="sbDots" width="26" height="26" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.3" fill="rgba(86,112,170,.24)"/></pattern></defs>`);
    parts.push(`<rect width="${width}" height="${height}" fill="#f6eedc"/><rect width="${width}" height="${height}" fill="url(#sbDots)"/>`);
    // the Endless Nights pages are washed in lilac
    const e0 = mapPoint(Math.min(8, LEVEL_MAP_LIMIT)).x - 120;
    parts.push(`<rect x="${e0}" y="0" width="${width - e0}" height="${height}" fill="rgba(154,130,232,.12)"/>`);
    // a fold every two pages of the sketchbook
    for (let x = 1180; x < width; x += 1180) parts.push(`<rect x="${x - 26}" y="0" width="52" height="${height}" fill="url(#sbFold)"/>`);
    parts.unshift(`<defs><linearGradient id="sbFold" x2="1"><stop offset="0" stop-color="rgba(60,40,80,0)"/><stop offset=".48" stop-color="rgba(60,40,80,.16)"/><stop offset=".52" stop-color="rgba(255,255,255,.4)"/><stop offset="1" stop-color="rgba(60,40,80,0)"/></linearGradient></defs>`);
    // little pencil stars and moons in the margins
    for (let i = 0; i < width / 140; i++) {
      const x = R(i + 31) * width, y = R(i + 57) < .5 ? 14 + R(i + 77) * height * .12 : height - 18 - R(i + 99) * height * .1;
      parts.push(R(i + 5) < .7 ? `<path d="M${x} ${y - 6} L${x + 1.6} ${y - 1.6} L${x + 6} ${y} L${x + 1.6} ${y + 1.6} L${x} ${y + 6} L${x - 1.6} ${y + 1.6} L${x - 6} ${y} L${x - 1.6} ${y - 1.6} Z" fill="none" stroke="#9a95a8" stroke-width="1.4"/>`
        : `<path d="M${x + 4} ${y - 9} A9 9 0 1 0 ${x + 9} ${y + 5} A7 7 0 1 1 ${x + 4} ${y - 9} Z" fill="none" stroke="#9a95a8" stroke-width="1.4"/>`);
    }
    // the path: a soft crayon band, dark dashes where Shwe has walked, pencil dashes ahead
    const all = segs.join(' '), done = segs.slice(0, Math.max(0, current - 1)).join(' '), ahead = segs.slice(Math.max(0, current - 1)).join(' ');
    parts.push(`<path d="${all}" fill="none" stroke="#f2b53a" stroke-width="16" stroke-linecap="round" opacity=".28"/>`);
    if (done) parts.push(`<path d="${done}" fill="none" stroke="#3b3550" stroke-width="3.2" stroke-linecap="round" stroke-dasharray="2 12"/>`);
    if (ahead) parts.push(`<path d="${ahead}" fill="none" stroke="#9a95a8" stroke-width="3" stroke-linecap="round" stroke-dasharray="2 12"/>`);
    // Shwe's paw prints on the part of the walk that is done
    for (let level = 1; level < Math.min(current, LEVEL_MAP_LIMIT); level++) {
      const a = mapPoint(level), b = mapPoint(level + 1), mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2 - 22, ang = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI + 90;
      parts.push(`<g transform="translate(${mx} ${my}) rotate(${ang})" fill="#3b3550" opacity=".4"><ellipse rx="5" ry="6"/><circle cx="-6" cy="-7" r="2.2"/><circle cx="0" cy="-9" r="2.2"/><circle cx="6" cy="-7" r="2.2"/></g>`);
    }
    for (let level = 1; level <= Math.min(7, LEVEL_MAP_LIMIT); level++) {
      const pt = mapPoint(level);
      parts.push(hourDoodle(level, pt.x, pt.y, level < current ? 'done' : level === current ? 'current' : 'locked'));
    }
    // headings written on the page
    const s0 = mapPoint(1);
    parts.push(`<text x="${Math.max(20, s0.x - 110)}" y="${Math.max(30, height * .1)}" font-family="Gaegu, Fredoka, sans-serif" font-weight="700" font-size="26" fill="#2b2547">Shwe's Night Map</text>`);
    parts.push(`<text x="${e0 + 30}" y="${Math.max(30, height * .1)}" font-family="Gaegu, Fredoka, sans-serif" font-weight="700" font-size="26" fill="#6a4ab8">Endless Nights · after sunrise</text>`);
    $('#mapScenery').innerHTML = parts.join('');
  }
  function syncStoryMapBackdrop() {
    const viewport = $('#levelMapViewport');
    $('#mapPrevious').disabled = viewport.scrollLeft <= 1;
    $('#mapNext').disabled = viewport.scrollLeft >= viewport.scrollWidth - viewport.clientWidth - 1;
  }
  function buildLevelMap() {
    const track = $('#levelMapTrack'), path = $('#levelMapPath'), route = $('#levelMapRoute'), svg = $('#levelMapSvg');
    track.querySelectorAll('.level-entry').forEach(entry => entry.remove());
    const height = Math.max(180, $('#levelMapViewport').clientHeight), width = mapStops[LEVEL_MAP_LIMIT - 1].x + 150;
    track.style.height = `${height}px`; track.style.width = `${width}px`;
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    let d = '', prev = null; const segs = [];
    for (let level = 1; level <= LEVEL_MAP_LIMIT; level++) {
      const point = mapPoint(level);
      if (!prev) d = `M ${point.x} ${point.y}`;
      else {
        const span = point.x - prev.x;
        const bend = .28 + mapRandom(level + 1800) * .4;
        const seg = ` C ${prev.x + span * bend} ${prev.y} ${point.x - span * (1 - bend)} ${point.y} ${point.x} ${point.y}`;
        d += seg; segs.push(`M ${prev.x} ${prev.y}${seg}`);
      }
      prev = point;
    }
    drawSketchMap(width, height, segs, unlockedLevel);
    route.setAttribute('d', d); path.setAttribute('d', d);
    svg.querySelector('.path-halo').setAttribute('d', d);
    $('#levelMapCount').textContent = `${unlockedLevel} / 50 levels unlocked · ★ ${totalStars()}/21`;
    $('#roomStatus').textContent = thiriSleepStage >= 7 ? 'Thiri woke up' : thiriSleepStage >= 5 ? 'Thiri is almost awake' : thiriSleepStage >= 3 ? 'Thiri is stirring' : 'Thiri is sleeping';
    for (let level = 1; level <= LEVEL_MAP_LIMIT; level++) {
      const chapter = LEVEL_MAP_CHAPTERS.get(level), point = mapPoint(level);
      const entry = document.createElement('div');
      entry.className = `level-entry${point.y > height * .43 ? ' label-above' : ''}${level <= 7 ? ' sb-hour-entry' : ''}`;
      entry.style.left = `${point.x}px`;
      entry.style.top = `${point.y}px`;
      const button = document.createElement('button');
      const playable = level <= unlockedLevel;
      button.type = 'button'; button.dataset.level = String(level);
      button.className = `level-node${playable ? ' is-playable' : ''}${level === unlockedLevel ? ' is-current' : ''} ${level <= 7 ? 'sb-hour' : 'sb-route'}`;
      const visualTheme = window.TCVisualChapters?.forLevel(level);
      if (visualTheme) { button.style.borderColor = visualTheme.accent; entry.dataset.visualChapter = String(visualTheme.index + 1); }
      button.textContent = String(level); button.disabled = !playable;
      button.setAttribute('aria-label', playable ? `${hourOf(level)}, ${chapter.name}, playable${level === unlockedLevel ? ', current hour' : ''}` : `${hourOf(level)}, ${chapter.name}, locked until ${hourOf(level - 1)} is complete`);
      button.title = playable ? `Play ${hourOf(level)} · ${chapter.name}` : `${hourOf(level)} · complete ${hourOf(level - 1)} to unlock`;
      if (level === unlockedLevel) button.id = 'playBtn';
      entry.appendChild(button);
      if (chapter) {
        const caption = document.createElement('span'); caption.className = 'level-caption';
        const name = document.createElement('strong'); name.textContent = `${hourOf(level)} · ${chapter.name}`;
        const sub = document.createElement('span'); sub.textContent = level < unlockedLevel ? 'Completed · Play again' : level === unlockedLevel ? 'Your next adventure' : 'Complete the previous chapter';
        if (visualTheme) { sub.textContent = `${visualTheme.name} · ${level < unlockedLevel ? 'Completed' : level === unlockedLevel ? 'Up next' : 'Locked'}`; sub.style.color = visualTheme.accent; }
        caption.appendChild(name); caption.appendChild(sub);
        const bestScore = getBest(`mk-best-n${level}`), st = nightStars[level] || 0;
        if (playable && (bestScore || st)) {
          const rec = document.createElement('span'); rec.className = 'level-best';
          rec.innerHTML = [1, 2, 3].map(i => `<b style="color:${i <= st ? '#e0a12a' : 'rgba(59,53,80,.25)'}">★</b>`).join('') + (bestScore ? ` Best ${bestScore.toLocaleString()}` : '');
          rec.setAttribute('aria-label', `${st} of 3 stars${bestScore ? `, best score ${bestScore}` : ''}`);
          caption.appendChild(rec);
        }
        entry.appendChild(caption);
      }
      track.appendChild(entry);
    }
  }
  function focusLevelMap(level = unlockedLevel) {
    const viewport = $('#levelMapViewport');
    viewport.scrollLeft = mapPoint(level).x - viewport.clientWidth / 2;
    syncStoryMapBackdrop();
  }
  const mapViewport = $('#levelMapViewport');
  mapViewport.addEventListener('scroll', syncStoryMapBackdrop, { passive: true });
  let mapPointerDrag = null, mapSuppressClickUntil = 0;
  mapViewport.addEventListener('pointerdown', event => {
    if ((event.pointerType === 'mouse' && event.button !== 0) || event.target.closest('button,a,input')) return;
    mapPointerDrag = { id: event.pointerId, x: event.clientX, scrollLeft: mapViewport.scrollLeft, moved: false };
    mapViewport.setPointerCapture(event.pointerId);
  });
  mapViewport.addEventListener('pointermove', event => {
    if (!mapPointerDrag || event.pointerId !== mapPointerDrag.id) return;
    const distance = event.clientX - mapPointerDrag.x;
    if (!mapPointerDrag.moved && Math.abs(distance) < 4) return;
    mapPointerDrag.moved = true;
    mapViewport.scrollLeft = mapPointerDrag.scrollLeft - distance;
    event.preventDefault();
  });
  const finishMapDrag = event => {
    if (!mapPointerDrag || event.pointerId !== mapPointerDrag.id) return;
    if (mapPointerDrag.moved) mapSuppressClickUntil = performance.now() + 350;
    mapPointerDrag = null;
  };
  mapViewport.addEventListener('pointerup', finishMapDrag);
  mapViewport.addEventListener('pointercancel', finishMapDrag);
  mapViewport.addEventListener('click', event => {
    if (performance.now() > mapSuppressClickUntil) return;
    event.preventDefault(); event.stopPropagation(); mapSuppressClickUntil = 0;
  }, true);
  mapViewport.addEventListener('wheel', event => {
    if (event.ctrlKey || Math.abs(event.deltaX) >= Math.abs(event.deltaY)) return;
    event.preventDefault();
    mapViewport.scrollLeft += event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? mapViewport.clientWidth : 1);
  }, { passive: false });
  function panLevelMap(direction) {
    mapViewport.scrollBy({ left: direction * Math.max(LEVEL_MAP_STEP, mapViewport.clientWidth * .75), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }
  $('#mapPrevious').addEventListener('click', () => panLevelMap(-1));
  $('#mapNext').addEventListener('click', () => panLevelMap(1));
  $('#mapCurrent').addEventListener('click', () => focusLevelMap());
  mapViewport.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'Home' || event.key === 'End') focusLevelMap(event.key === 'Home' ? 1 : LEVEL_MAP_LIMIT);
    else panLevelMap(event.key === 'ArrowLeft' ? -1 : 1);
  });
  new ResizeObserver(() => {
    if ($('#storyMapScreen').hidden) return;
    const height = Math.max(180, mapViewport.clientHeight);
    if ($('#levelMapTrack').style.height !== `${height}px`) { buildLevelMap(); focusLevelMap(); }
  }).observe(mapViewport);
  function showHub(focus = true) {
    music('duck', 1); music('play', 'menu'); music('ambience', 'menu');
    $('#startScreen').hidden = false; $('#menuHub').hidden = false; $('#storyMapScreen').hidden = true;
    $('#hubSettingsScreen').hidden = true;
    refreshHubStats();
    if (focus) $('#storyBtn').focus({ preventScroll: true });
  }
  function showStoryMap(focus = true) {
    music('duck', 1); music('play', 'menu'); music('ambience', 'menu');
    $('#startScreen').hidden = false; $('#menuHub').hidden = true; $('#storyMapScreen').hidden = false;
    $('#hubSettingsScreen').hidden = true; $('#levelBriefingScreen').hidden = true;
    buildLevelMap(); requestAnimationFrame(() => { focusLevelMap(unlockedLevel); syncStoryMapBackdrop(); });
    // once the story is finished, the ending can be watched again from the map
    let endBtn = $('#watchEndingBtn');
    if (!endBtn) {
      endBtn = document.createElement('button'); endBtn.type = 'button'; endBtn.id = 'watchEndingBtn'; endBtn.className = 'btn ghost';
      endBtn.textContent = '🌅 Watch the ending'; endBtn.style.cssText = 'margin-left:10px;padding:8px 16px;font-size:14px';
      endBtn.addEventListener('click', () => playEnding());
      $('#levelMapCount').after(endBtn);
    }
    endBtn.hidden = !(finalAwakeningSeen || thiriSleepStage >= 7);
    let mapTipSeen = false;
    try { mapTipSeen = localStorage.getItem('mk-map-guide-seen') === '1'; } catch (e) {}
    if (mapGuidePending || !mapTipSeen) showMapGuide();
    else if (focus) $(`#levelMapTrack button[data-level="${unlockedLevel}"]`)?.focus({ preventScroll: true });
  }
  addEventListener('resize', () => { if (!$('#storyMapScreen').hidden) requestAnimationFrame(() => { focusLevelMap(unlockedLevel); syncStoryMapBackdrop(); }); }, { passive: true });
  function showMainMenu(focusCurrent = true) {
    music('duck', 1); music('play', 'menu'); music('ambience', 'menu');
    state = 'menu'; cv.hidden = true; pauseBtn.hidden = true; pauseScreen.hidden = true; touchUI.hidden = true;
    $('#welcomeScreen').hidden = true; $('#welcomeCardsScreen').hidden = true; $('#helpScreen').hidden = true; $('#levelBriefingScreen').hidden = true; $('#nightReadyScreen').hidden = true;
    $('#prologueScreen').hidden = true; $('#awakeningScreen').hidden = true;
    $('#endScreen').hidden = true; $('#shopScreen').hidden = true; $('#bookScreen').hidden = true;
    buildLevelMap(); showHub(focusCurrent);
  }
  function pauseGame() {
    if (state !== 'play') return;
    $('#pauseChaptersBtn').textContent = mode === 'story' ? 'Back to chapters' : 'Back to menu';    pauseTouchWasHidden = touchUI.hidden; pauseCoachWasHidden = $('#tipCoach').hidden; $('#tipCoach').hidden = true;
    state = 'paused'; pauseBtn.hidden = true; touchUI.hidden = true;
    for (const key in keys) keys[key] = false;
    jumpQ = false; pounceQ = false; scratchQ = false; purrQ = false; eyesQ = false;
    touchAxis = 0; sid = null; stick.hidden = true; knob.style.transform = 'translate(-50%,-50%)';
    mouseSneakHeld = false; mouseSneakPointerId = null; mouseSneakPress = null;
    pauseScreen.hidden = false; pauseContinueBtn.focus({ preventScroll: true }); music('duck', .3);
  }
  function resumeGame() {
    if (state !== 'paused') return;
    pauseScreen.hidden = true; state = 'play'; touchUI.hidden = pauseTouchWasHidden; music('duck', 1);
    pauseBtn.hidden = false; pauseBtn.focus({ preventScroll: true });
    if (!pauseCoachWasHidden && (nightGuide.active || activeJitTip)) $('#tipCoach').hidden = false;
  }
  function quitPausedRun() {
    if (state !== 'paused') return;
    showMainMenu(true);
  }

  // ---- Opening cutscene ----
  // Eight story pictures with gentle camera motion and typed dialogue.
  // Names are written as Thiri / Shwe and swapped for the player's chosen names by mkName().
  const INTRO_SCENES = [
    { img: '01-contest', alt: 'At the school drawing contest, Thiri holds her cat drawing while three other girls celebrate with the prizes.', ox: '24%', oy: '46%', k0: 1.02, k1: 1.13, dx: '1%', dy: '0%', note: 392 },
    { img: '02-walk-home', alt: 'Thiri walks home at sunset, head down, holding her drawing. Shwe trots beside her.', ox: '52%', oy: '48%', k0: 1.04, k1: 1.12, dx: '-1.5%', dy: '0%', note: 349 },
    { img: '03-tear-drawing', alt: 'In her room, Thiri tears her drawing in half while Shwe watches.', ox: '62%', oy: '40%', k0: 1.03, k1: 1.16, dx: '0%', dy: '1%', note: 330 },
    { img: '04-dont-want-to-feel', alt: 'Thiri hugs her knees on the bed, eyes closed. Shwe lies beside her.', ox: '30%', oy: '42%', k0: 1.04, k1: 1.15, dx: '0%', dy: '0%', note: 294 },
    { img: '05-colours-fade', alt: 'The room turns grey and dark. Thiri sits still, Shwe looks out at the moon.', ox: '50%', oy: '45%', k0: 1.14, k1: 1.03, dx: '0%', dy: '0%', note: 262 },
    { img: '06-cat-eyes-glow', alt: 'Thiri is asleep. In the grey room, Shwe’s eyes glow.', ox: '62%', oy: '50%', k0: 1.03, k1: 1.2, dx: '-1%', dy: '0%', note: 440 },
    { img: '07-moodlings-leave', alt: 'Small glowing Moodlings drift sadly from the sleeping girl toward the window as Shwe watches.', ox: '62%', oy: '28%', k0: 1.04, k1: 1.2, dx: '-3%', dy: '1%', note: 330, fx: 'leave' },
    { img: '08-cat-follows', alt: 'Shwe leaps out of the window into the night sky after the Moodlings.', ox: '58%', oy: '38%', k0: 1.03, k1: 1.15, dx: '0%', dy: '1%', note: 587 }
  ];
  const INTRO_WHO = {
    girl: { name: 'Thiri', color: '#8fc3ff' }, cat: { name: 'Shwe', color: '#f6c453' },
    F: { name: 'Frustrated', color: '#ff8a8f' }, N: { name: 'Nervous', color: '#c3adff' }, L: { name: 'Lonely', color: '#8fc3ff' },
    E: { name: 'Excited', color: '#ffe066' }, C: { name: 'Calm', color: '#8fe0a0' }, S: { name: 'Shy', color: '#ff9ccb' }, J: { name: 'Jealous', color: '#ffb36b' }
  };
  const INTRO_FX_COLORS = ['#ff6168', '#a98bff', '#6fb6ff', '#ffd23f', '#7ddc8b', '#ff7ab8', '#ff9a3c'];
  const INTRO_LINES = [
    { s: 0, text: 'The school drawing contest. Thiri drew the one she loves most: her cat, Shwe.' },
    { s: 0, text: 'Three names were called. Hers was not one of them.' },
    { s: 0, who: 'girl', text: '…I really thought this one was good.' },
    { s: 1, text: 'She walked home without a word. Shwe stayed close the whole way.' },
    { s: 1, who: 'girl', text: 'Don’t look at me like that, Shwe. I’m fine.' },
    { s: 2, who: 'girl', text: 'If I never draw again… I never have to lose again.' },
    { s: 2, sfx: true, text: 'RRRIP.' },
    { s: 3, who: 'girl', text: 'I don’t want to feel anything anymore.' },
    { s: 4, text: 'And just like that, the colour drained out of her room.' },
    { s: 4, text: 'She fell asleep without noticing.' },
    { s: 5, text: 'But Shwe noticed. Cats can see what people can’t.' },
    { s: 5, who: 'cat', text: '…Mrrow?' },
    { s: 6, text: 'Deep in her heart, her feelings heard every word. The little Moodlings.' },
    { s: 6, who: 'L', text: 'She… doesn’t want us anymore?' },
    { s: 6, who: 'S', text: '(sniff) We were only trying to help…' },
    { s: 6, who: 'F', text: 'Fine. If she doesn’t want us… we’ll go.' },
    { s: 6, who: 'C', text: 'Goodbye, Thiri.' },
    { s: 6, text: 'One by one, they walked to the window. Their lights grew dimmer… and dimmer.' },
    { s: 6, text: 'Frustrated. Nervous. Lonely. Excited. Calm. Shy. Jealous. All of them, gone.' },
    { s: 6, text: 'Without them, she would wake up empty.' },
    { s: 7, who: 'cat', text: 'Mrrp! (Wait for me!)' },
    { s: 7, text: 'So Shwe leapt into the Night Side, to bring every feeling home before sunrise.' }
  ];
  const INTRO_CPS = 46;
  // Morning ending: plays after every feeling is home (5 AM cleared). Same player as the intro.
  const ENDING_SCENES = [
    { img: '01-sunrise-return', dir: 'ending', alt: 'At sunrise, Shwe leaps back in through the window with all the Moodlings glowing behind. Thiri is still asleep.', ox: '60%', oy: '30%', k0: 1.03, k1: 1.14, dx: '-1%', dy: '1%', note: 392 },
    { img: '02-wake-up', dir: 'ending', alt: 'Morning sun fills the room. Thiri sits up and stretches, laughing, the Moodlings swirling around her and Shwe on the bed.', ox: '52%', oy: '40%', k0: 1.04, k1: 1.13, dx: '0%', dy: '0%', note: 440 },
    { img: '03-taping-drawing', dir: 'ending', alt: 'Thiri sits on the floor, smiling softly as she tapes her torn cat drawing back together. Shwe and the Moodlings watch.', ox: '45%', oy: '62%', k0: 1.03, k1: 1.16, dx: '0%', dy: '-1%', note: 523 },
    { img: '04-new-drawing', dir: 'ending', alt: 'At her desk, Thiri laughs as she draws a new picture of Shwe and the Moodlings, while they peek over her shoulder.', ox: '52%', oy: '55%', k0: 1.03, k1: 1.14, dx: '0%', dy: '0%', note: 587 }
  ];
  const ENDING_LINES = [
    { s: 0, text: 'The sky turned gold. And through the window came a very tired, very proud cat.' },
    { s: 0, who: 'cat', text: 'Mrrrow! (I brought everyone home!)' },
    { s: 0, text: 'Behind Shwe, the Moodlings floated in, one by one, glowing brighter than ever.' },
    { s: 1, text: 'Colour poured back into the room. And Thiri woke up.' },
    { s: 1, who: 'girl', text: 'Mmh… good morning, Shwe. I had the strangest dream…' },
    { s: 1, who: 'E', text: 'She’s awake! She’s awake!' },
    { s: 1, who: 'F', text: 'Hmph. About time.' },
    { s: 2, text: 'The torn drawing was still on the floor.' },
    { s: 2, who: 'girl', text: 'I was so upset I didn’t win… but I still love this drawing.' },
    { s: 2, who: 'C', text: 'It’s okay to feel sad. It means it mattered.' },
    { s: 2, text: 'One piece of tape at a time, she put it back together.' },
    { s: 3, text: 'Then she picked up her crayons again.' },
    { s: 3, who: 'girl', text: 'This time I’ll draw all of you. Every single feeling.' },
    { s: 3, who: 'S', text: '(giggle) Make me look cute…' },
    { s: 3, who: 'J', text: 'Draw me bigger than Excited!' },
    { s: 3, text: 'Frustrated, Nervous, Lonely, Excited, Calm, Shy, Jealous. All of them, home where they belong.' },
    { s: 3, who: 'girl', text: 'Thank you, Shwe. I’m ready to try again.' }
  ];
  // ---- Voice acting for the intro and ending (clips in assets/audio/voice/intro and /ending, one per line) ----
  // Per line: [clip length in seconds (0 = no clip: sound effects and the plain meow), pause after it in ms, reaction played first]
  const CS_VOICE = {
    intro: [[4.91,700],[3.23,1100],[2.41,1000],[3.96,700],[3.24,1300],[3.94,900],[0,1200],[2.8,1800],[3.17,900],[2.31,1300],[3.45,900],[0,900],[4.4,800],[2.14,600],[2.13,600],[2.47,600],[1.36,1400],[4.35,800],[5.23,1000],[2.38,1400],[1.03,700],[5.02,2500]],
    ending: [[4.54,700],[1.4,800],[4.48,900],[3.15,800],[4,900],[1.66,500],[1.32,1000],[2.11,900],[3.85,800],[3.16,1300],[2.88,800],[1.91,700],[2.96,600,'laugh'],[1.61,400,'giggle'],[1.98,900],[5.55,1200],[2.76,3000]]
  };
  const csVo = { clips: {}, playing: [], timers: [], restore: 0 };
  const reduceVoice = false;
  const csVoLevel = () => { try { return window.TCSfx ? Math.min(1, TCSfx.level() / .8) : 1; } catch (e) { return 1; } };
  function csVoClip(path) {
    if (!csVo.clips[path]) { const a = new Audio(path); a.preload = 'auto'; csVo.clips[path] = a; }
    return csVo.clips[path];
  }
  // When the player chose their own names, lines that say "Thiri" or "Shwe" use a name-free recording
  // (vo_XX-n.mp3, "the girl" / "her cat" instead of the name, see assets/audio/voice/NAME-FREE-LINES.md).
  const CS_NAMED = { intro: { 0: 4.62, 3: 3.93, 4: 2.81, 10: 3.49, 16: .62, 21: 5.06 }, ending: { 2: 4.74, 3: 3.51, 4: 3.54, 16: 2.4 } };   // clip lengths in seconds
  const csCustomLine = (kind, i) => {
    if (!(i in CS_NAMED[kind])) return false;
    const txt = ((kind === 'ending' ? ENDING_LINES : INTRO_LINES)[i] || {}).text || '';
    return (MK_PROFILE.girl !== 'Thiri' && txt.includes('Thiri')) || (MK_PROFILE.cat !== 'Shwe' && txt.includes('Shwe'));
  };
  const csVoPath = (kind, i) => `assets/audio/voice/${kind}/vo_${String(i).padStart(2, '0')}${csCustomLine(kind, i) ? '-n' : ''}.mp3`;
  const csVoInfo = (kind, i) => { const v = CS_VOICE[kind]?.[i]; return v && csCustomLine(kind, i) ? [CS_NAMED[kind][i], v[1], v[2]] : v; };
  function csVoPreload(kind) { CS_VOICE[kind].forEach((v, i) => { if (v[0]) csVoClip(csVoPath(kind, i)); }); }
  function csVoStop() {
    csVo.timers.forEach(clearTimeout); csVo.timers = [];
    csVo.playing.forEach(a => { try { a.pause(); a.currentTime = 0; } catch (e) {} }); csVo.playing = [];
  }
  function csVoUnduck() { clearTimeout(csVo.restore); music('duck', 1); }
  // Starts the voice for one line. Returns a tracker the typing and auto-advance read, or null when there is no voice.
  function csVoLine(kind, i, line) {
    csVoStop();
    const v = csVoInfo(kind, i), lv = csVoLevel();
    if (!v || !v[0] || lv <= 0 || reduceVoice) return null;
    const lead = (i === 0 ? 1.4 : .3) + (line.who === 'cat' ? .8 : 0);   // let the meow finish before Shwe speaks
    const vo = { start: performance.now(), lead, dur: v[0] + (v[2] ? .7 : 0), gap: v[1], state: 'wait', endAt: 0 };
    const play = (path, then) => {
      const a = csVoClip(path); a.volume = lv; a.currentTime = 0; csVo.playing.push(a);
      a.onended = () => { csVo.playing = csVo.playing.filter(x => x !== a); then && then(); };
      a.onerror = () => { if (vo.state !== 'done') { vo.state = 'fail'; csVoUnduck(); } };
      const pr = a.play(); if (pr && pr.catch) pr.catch(() => { if (vo.state !== 'done') { vo.state = 'fail'; csVoUnduck(); } });
    };
    const speak = () => { if (vo.state === 'fail') return; vo.state = 'play'; play(csVoPath(kind, i), () => { vo.state = 'done'; vo.endAt = performance.now(); clearTimeout(csVo.restore); csVo.restore = setTimeout(() => music('duck', 1), 350); }); };
    csVo.timers.push(setTimeout(() => {
      clearTimeout(csVo.restore); music('duck', .5);
      if (v[2]) play(`assets/audio/voice/reactions/${v[2]}.mp3`, () => csVo.timers.push(setTimeout(speak, 140))); else speak();
    }, lead * 1000));
    return vo;
  }
  let CS_SCENES = INTRO_SCENES, CS_LINES = INTRO_LINES, csKind = 'intro';
  const introImgs = INTRO_SCENES.map(() => new Image());
  const endingImgs = ENDING_SCENES.map(() => new Image());
  let csImgs = introImgs;
  let introRaf = 0, introI = 0, introScene = -1, introTyped = 0, introLineStart = 0, introDoneAt = 0, introShot = 0;
  let mapGuidePending = false;
  function introPreload(onProgress = null, scenes = INTRO_SCENES, imgs = introImgs) {
    let finished = 0;
    const report = () => { finished++; if (onProgress) onProgress(finished, scenes.length); };
    return Promise.all(scenes.map((sc, i) => {
      const img = imgs[i];
      return new Promise(resolve => {
        let done = false;
        const finish = () => { if (done) return; done = true; img.onload = img.onerror = null; report(); resolve(img.naturalWidth > 0); };
        img.onload = finish; img.onerror = finish;
        if (!img.src) img.src = `assets/${sc.dir || 'intro'}/${sc.img}.webp`;
        if (img.complete) finish();
      });
    }));
  }
  function introShowScene(i) {
    const sc = CS_SCENES[i], shots = [$('#introShotA'), $('#introShotB')];
    sfx('ui', 'page');
    introShot ^= 1;
    const inc = shots[introShot], out = shots[introShot ^ 1];
    inc.src = csImgs[i].src || `assets/${sc.dir || 'intro'}/${sc.img}.webp`; inc.alt = sc.alt;
    const vv = csVoLevel() > 0 ? (CS_VOICE[csKind] || []).map((v, k) => csVoInfo(csKind, k)) : [];   // voiced scenes last as long as their lines take to say
    const dur = CS_LINES.reduce((t, l, k) => l.s !== i ? t : t + (vv[k]?.[0] ? .3 + vv[k][0] + (vv[k][2] ? .7 : 0) + vv[k][1] / 1000 : l.text.length / INTRO_CPS + .9 + l.text.length * .018), 1.5);
    [['--ox', sc.ox], ['--oy', sc.oy], ['--k0', sc.k0], ['--k1', sc.k1], ['--dx', sc.dx], ['--dy', sc.dy], ['--dur', dur.toFixed(1) + 's']]
      .forEach(([k, v]) => inc.style.setProperty(k, v));
    inc.classList.remove('move'); void inc.offsetWidth; inc.classList.add('move', 'on');
    out.classList.remove('on');
    $('#introDots').querySelectorAll('i').forEach((d, k) => { d.className = k < i ? 'done' : k === i ? 'now' : ''; });
    introFx(sc.fx, dur);
    tone(sc.note, .6, 'sine', .022); setTimeout(() => tone(sc.note * 1.5, .4, 'triangle', .012), 140);
  }
  // Scene 7: the Moodlings' lights drift sadly to the window and fade while the room dims.
  function introFx(kind, dur) {
    const fx = $('#introFx'), stage = $('#introArt');
    stage.classList.toggle('dim', kind === 'leave'); stage.style.setProperty('--dim-dur', (dur * .8).toFixed(1) + 's');
    if (kind !== 'leave') { fx.innerHTML = ''; return; }
    fx.innerHTML = [...INTRO_FX_COLORS, ...INTRO_FX_COLORS].map((c, k) => `<i style="--c:${c};--d:${(.8 + k * 1.3).toFixed(1)}s;--y:${(k % 3) * 5 - 5}%"></i>`).join('');
    if (!reduce) [523, 494, 440, 392].forEach((f, k) => setTimeout(() => state === 'intro' && tone(f, .9, 'sine', .016), 600 + k * 700));
  }
  function introShowLine(i) {
    const line = CS_LINES[i]; introI = i;
    if (line.s !== introScene) { introScene = line.s; introShowScene(line.s); }
    const who = line.who && INTRO_WHO[line.who], sp = $('#introSpeaker'), el = $('#introSubtitle');
    sp.hidden = !who;
    if (who) { sp.textContent = mkName(who.name); sp.style.setProperty('--who', who.color); }
    el.className = 'cs-line' + (line.sfx ? ' sfx' : who ? '' : ' narration');
    line.full = mkName(line.text);
    $('#introLive').textContent = (who ? mkName(who.name) + ': ' : '') + line.full;
    introTyped = reduce ? line.full.length : 0; el.textContent = reduce ? line.full : '';
    introLineStart = performance.now(); introDoneAt = reduce ? introLineStart : 0;
    $('#introHint').classList.remove('show');
    line.vo = csVoLine(csKind, i, line);
    // with a voice, the words appear at the speed they are spoken
    line.cps = line.vo ? Math.max(8, line.full.length / (line.vo.lead + line.vo.dur * .86)) : INTRO_CPS;
    if (line.who === 'cat') sfx('cat', 'meow', .42);
    else if (!line.vo && ['F', 'N', 'L', 'C', 'S', 'J', 'E'].includes(line.who)) sfx('moodling', line.who, .34);
    if (line.sfx) { sfx('ui', 'swish'); tone(820, .2, 'sawtooth', .03, -600); setTimeout(() => tone(620, .16, 'sawtooth', .024, -450), 90); }
  }
  function introFinish() {
    $('#introHint').classList.remove('show');
    const b = $('#introContinueBtn');
    if (b.hidden) { b.hidden = false; b.focus({ preventScroll: true }); }
  }
  function introTick(now) {
    if (state !== 'intro') return;
    const line = CS_LINES[introI], el = $('#introSubtitle');
    if (introTyped < line.full.length) {
      const n = Math.min(line.full.length, Math.floor((now - introLineStart) / 1000 * (line.cps || INTRO_CPS)));
      if (n !== introTyped) { introTyped = n; el.textContent = line.full.slice(0, n); }
      if (n >= line.full.length) introDoneAt = now;
    } else {
      if (!introDoneAt) introDoneAt = now;
      if (introI === CS_LINES.length - 1) { introFinish(); return; }
      $('#introHint').classList.add('show');
      const vo = line.vo;
      // voiced lines move on after the voice ends (plus a short pause); a clip that never starts or ends gives up after a few seconds
      const late = vo && now - vo.start > (vo.lead + vo.dur) * 1000 + 4000;
      const next = vo && vo.state !== 'fail' && !late ? vo.state === 'done' && now - vo.endAt > vo.gap : now - introDoneAt > 900 + line.full.length * 18;
      if (next) introShowLine(introI + 1);
    }
    introRaf = requestAnimationFrame(introTick);
  }
  function introAdvance() {
    if (state !== 'intro') return;
    const line = CS_LINES[introI];
    if (introTyped < line.full.length) {
      introTyped = line.full.length; $('#introSubtitle').textContent = line.full; introDoneAt = performance.now();
      return;
    }
    if (introI < CS_LINES.length - 1) introShowLine(introI + 1); else leaveIntro();
  }
  let introReturnView = 'storyMap';
  function leaveIntro() {
    cancelAnimationFrame(introRaf); $('#prologueScreen').hidden = true;
    csVoStop(); csVoUnduck();
    [$('#introShotA'), $('#introShotB')].forEach(im => im.classList.remove('on', 'move'));
    introFx(null, 0); state = 'menu'; cv.hidden = true;
    if (csKind === 'ending') { csKind = 'intro'; CS_SCENES = INTRO_SCENES; CS_LINES = INTRO_LINES; csImgs = introImgs; showEndingDone(); return; }
    if (introReturnView === 'first-run') showWelcomeCards();
    else if (introReturnView === 'hub') showHub(true);
    else showStoryMap(true);
  }
  function playIntro(returnView = 'storyMap') {
    csKind = 'intro'; CS_SCENES = INTRO_SCENES; CS_LINES = INTRO_LINES; csImgs = introImgs; $('#introSkipBtn').textContent = 'Skip intro →';
    csVoPreload('intro');
    music('play', 'intro'); music('ambience', 'intro');
    introReturnView = returnView;
    initAudio(); state = 'intro'; cv.hidden = true;
    $('#welcomeScreen').hidden = true; $('#welcomeCardsScreen').hidden = true; $('#helpScreen').hidden = true; $('#levelBriefingScreen').hidden = true; $('#nightReadyScreen').hidden = true;
    $('#startScreen').hidden = true; $('#endScreen').hidden = true; $('#awakeningScreen').hidden = true;
    $('#prologueScreen').hidden = false; $('#introContinueBtn').hidden = true;
    introPreload();
    $('#introDots').innerHTML = CS_SCENES.map(() => '<i></i>').join('');
    [$('#introShotA'), $('#introShotB')].forEach(im => im.classList.remove('on', 'move'));
    introScene = -1; introShowLine(0);
    $('#introArt').focus({ preventScroll: true });
    tone(196, 2.4, 'sine', .018, 12);
    cancelAnimationFrame(introRaf); introRaf = requestAnimationFrame(introTick);
  }
  // ---- Morning ending cutscene ----
  function playEnding() {
    csKind = 'ending'; CS_SCENES = ENDING_SCENES; CS_LINES = ENDING_LINES; csImgs = endingImgs;
    csVoPreload('ending');
    music('duck', 1); music('play', 'ending'); music('ambience', null); initAudio(); state = 'intro'; cv.hidden = true;
    ['#welcomeScreen', '#welcomeCardsScreen', '#helpScreen', '#levelBriefingScreen', '#nightReadyScreen', '#startScreen', '#endScreen', '#awakeningScreen', '#shopScreen', '#bookScreen'].forEach(id => { const el = $(id); if (el) el.hidden = true; });
    const sm = $('#storyMapScreen'); if (sm) sm.hidden = true;
    $('#prologueScreen').hidden = false; $('#introContinueBtn').hidden = true; $('#introSkipBtn').textContent = 'Skip →';
    introPreload(null, ENDING_SCENES, endingImgs);
    $('#introDots').innerHTML = CS_SCENES.map(() => '<i></i>').join('');
    [$('#introShotA'), $('#introShotB')].forEach(im => im.classList.remove('on', 'move'));
    introScene = -1; introShowLine(0);
    $('#introArt').focus({ preventScroll: true });
    tone(392, 2, 'sine', .02); setTimeout(() => tone(523, 2, 'sine', .018), 400); setTimeout(() => tone(659, 2.4, 'sine', .016), 800);
    cancelAnimationFrame(introRaf); introRaf = requestAnimationFrame(introTick);
  }
  function showEndingDone() {
    state = 'awakening'; cv.hidden = true; $('#awakeningScreen').hidden = false;
    revealAwakeningActions();
    // the final card shows Thiri's new drawing instead of the old simple bedroom art
    const art = $('#awakeningArt');
    if (art && !art.querySelector('.ending-final')) {
      const im = document.createElement('img'); im.className = 'ending-final'; im.src = 'assets/ending/04-new-drawing.webp';
      im.alt = 'Thiri happily drawing Shwe and all the Moodlings in the morning sun.';
      im.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:1;border-radius:inherit';
      if (getComputedStyle(art).position === 'static') art.style.position = 'relative';
      art.appendChild(im);
    }
    [...art.children].forEach(ch => { if (!ch.classList.contains('ending-final') && !/subtitle/i.test(ch.id || '')) ch.style.visibility = 'hidden'; });
    const sub = $('#awakeningSubtitle'); if (sub) { sub.style.position = 'relative'; sub.style.zIndex = 2; sub.style.visibility = 'visible'; }
    $('#awakeningSkipBtn').hidden = true;
  }
  window.TCPlayEnding = playEnding;
  // ---- after the story: Heart Workshop and Lantern Town (js/afterstory.js) use these ----
  function tcLight(type) { try { window.dispatchEvent(new CustomEvent('tc:light', { detail: { type } })); } catch (e) {} }
  window.TCBridge = {
    glow: () => glow,
    addGlow(n) { glow = Math.max(0, glow + Math.round(n)); saveUpg(); try { refreshShopBtns(); refreshHubStats(); } catch (e) {} },
    storyDone: () => finalAwakeningSeen || thiriSleepStage >= 7,
    portrait: ty => { try { return bookPortrait(ty, 0, true); } catch (e) { return ''; } },
    sfx: (a, b) => { try { sfx(a, b); } catch (e) {} },
    book: () => ({ ...book })
  };
  // test shortcut: open the game with ?ending in the address to jump straight to the morning ending
  if (/[?&]ending\b/.test(location.search)) setTimeout(() => playEnding(), 900);
  $('#storyBtn').addEventListener('click', () => showStoryMap(true));
  $('#mapHubBackBtn').addEventListener('click', () => showHub(true));
  $('#infoBtn').addEventListener('click', () => openHelp('hub'));
  $('#introSkipBtn').addEventListener('click', leaveIntro);
  $('#introContinueBtn').addEventListener('click', leaveIntro);
  $('#prologueScreen').addEventListener('click', e => { if (!e.target.closest('button')) introAdvance(); });
  addEventListener('keydown', e => {
    if (state !== 'intro' || e.repeat) return;
    if (e.code === 'Escape') { e.preventDefault(); leaveIntro(); return; }
    if (['Space', 'Enter', 'ArrowRight'].includes(e.code)) {
      if (e.target.closest && e.target.closest('button')) return;
      e.preventDefault(); introAdvance();
    }
  });

  $('#nightWakeContinue').addEventListener('click', closeNightWake);
  const AWAKENING_BEATS = [
    { t: 0, dur: 2, anim: 'sunrise', text: 'She stirred. Then she opened her eyes.' },
    { t: 2, dur: 2.5, anim: 'sunrise', text: 'Sunrise light floods the room, warm and gold.' },
    { t: 4.5, dur: 2.5, anim: 'stretch', text: 'Thiri sits up and stretches into the morning.' },
    { t: 7, dur: 2.5, anim: 'drawing', text: 'The scattered pieces are together again. Her drawing is whole.' },
    { t: 9.5, dur: 2.5, anim: 'message', text: 'Her phone lights up: Hnin is waiting at art club.' },
    { t: 12, dur: 3, anim: 'message', text: '“Thank you. I think I’m ready to try again.”' },
    { t: 15, dur: 2.5, anim: 'window', text: 'Morning. She opens the curtains. Thiri woke up.' }
  ];
  let awakeningRaf = 0;
  function revealAwakeningActions() {
    cancelAnimationFrame(awakeningRaf); $('#awakeningArt').dataset.anim = 'window';
    $('#awakeningTitle').textContent = 'Day 7 — Thiri woke up.';
    $('#awakeningSubtitle').textContent = 'Thiri smiles at Shwe. Tomorrow is something she can try again.';
    $('#awakeningCompleteLine').hidden = false; $('#awakeningActions').hidden = false; $('#awakeningReplayBtn').focus({ preventScroll: true });
  }
  function playFinalAwakening() {
    music('duck', 1); music('play', 'ending'); music('ambience', null);
    if (finalAwakeningSeen) { showEnd(); return; }
    finalAwakeningSeen = true;
    if (thiriSleepStage < 7) { thiriSleepStage = 7; saveStoryProgress(); }
    try { localStorage.setItem('mk-awakening-seen', '1'); } catch (e) {}
    playEnding(); return;
    state = 'awakening'; cv.hidden = true; $('#endScreen').hidden = true; $('#startScreen').hidden = true;
    $('#prologueScreen').hidden = true; $('#awakeningScreen').hidden = false; $('#awakeningActions').hidden = true;
    $('#awakeningArt').dataset.anim = 'sunrise'; $('#awakeningSubtitle').textContent = 'Sunrise light spills across the room…';
    $('#awakeningSkipBtn').focus({ preventScroll: true });
    const started = performance.now(), scale = reduce ? .72 : 1, duration = 17.5;
    let active = -1;
    const tick = now => {
      if (state !== 'awakening') return;
      const elapsed = (now - started) / 1000 / scale;
      let index = AWAKENING_BEATS.findIndex((beat, i) => elapsed >= beat.t && elapsed < beat.t + beat.dur);
      if (index < 0 && elapsed >= duration) index = AWAKENING_BEATS.length - 1;
      if (index !== active && index >= 0) {
        active = index; const beat = AWAKENING_BEATS[index];
        if (index === AWAKENING_BEATS.length - 1) $('#awakeningTitle').textContent = 'Day 7 — Thiri woke up.';
        $('#awakeningArt').dataset.anim = beat.anim; $('#awakeningSubtitle').textContent = beat.text;
        const root = [392, 440, 523, 587, 659, 784, 880][index]; tone(root, .9, 'sine', .03); setTimeout(() => tone(root * 1.5, .8, 'triangle', .018), 150);
      }
      if (elapsed >= duration) { revealAwakeningActions(); return; }
      awakeningRaf = requestAnimationFrame(tick);
    };
    awakeningRaf = requestAnimationFrame(tick);
  }
  $('#awakeningSkipBtn').addEventListener('click', revealAwakeningActions);
  $('#awakeningReplayBtn').addEventListener('click', () => startGame('story', 7));
  $('#awakeningBookBtn').addEventListener('click', () => { $('#awakeningScreen').hidden = true; state = 'menu'; renderBook(); $('#bookScreen').hidden = false; $('#bookScreen').scrollTop = 0; $('#bookBack').focus({ preventScroll: true }); });
  $('#awakeningFreeBtn').addEventListener('click', () => openFreeMapPicker($('#awakeningFreeBtn')));

  // ---- Names + coat setup ----
  const coatTargets = [];
  document.querySelectorAll('svg [fill="#efb44a"],svg [stroke="#efb44a"],svg [fill="#efa93f"],svg [stroke="#efa93f"],svg [fill="#c98a2c"],svg [stroke="#c98a2c"]').forEach(el => {
    if (el.closest('#setupScreen')) return;
    const attr = el.getAttribute('fill') && el.getAttribute('fill') !== 'none' ? 'fill' : 'stroke';
    const v = el.getAttribute(attr).toLowerCase();
    coatTargets.push({ el, attr, part: v === '#c98a2c' ? 'dark' : v === '#efa93f' ? 'alt' : 'body' });
  });
  // Story pictures (intro + final wake-up) show the chosen cat sprite.
  const sceneCats = [];
  [['#introShwe', 350, 160, 100, 95], ['#awakeShwe', 338, 200, 100, 94]].forEach(([sel, x, y, w, h]) => {
    const g = document.querySelector(sel); if (!g) return;
    [...g.children].forEach(ch => ch.style.display = 'none');
    const im = document.createElementNS('http://www.w3.org/2000/svg', 'image');
    im.setAttribute('x', x); im.setAttribute('y', y); im.setAttribute('width', w); im.setAttribute('height', h);
    im.setAttribute('preserveAspectRatio', 'xMidYMax meet'); g.appendChild(im); sceneCats.push(im);
  });
  const breedBox = $('#breedOptions');
  Object.keys(MK_COATS).forEach((k, i) => {
    const lab = document.createElement('label'); lab.className = 'coat-opt';
    const r = document.createElement('input'); r.type = 'radio'; r.name = 'coat'; r.value = k; if (i === 0) r.checked = true;
    const im = document.createElement('img'); im.loading = 'lazy'; im.decoding = 'async'; im.src = MK_COATS[k].img; im.alt = '';
    const sp = document.createElement('span'); sp.textContent = MK_COATS[k].name;
    lab.append(r, im, sp); breedBox.appendChild(lab);
  });
  function syncSetupCats() {
    breedBox.querySelectorAll('label.coat-opt').forEach(lab => {
      const r = lab.querySelector('input'), owned = ownedCats.includes(r.value);
      r.disabled = !owned; lab.style.opacity = owned ? '' : '.45'; lab.title = owned ? '' : 'Unlock this cat in the Shop with Glow';
      const sp = lab.querySelector('span'); sp.textContent = MK_COATS[r.value].name + (owned ? '' : ' 🔒');
    });
    const r = breedBox.querySelector(`input[value="${MK_PROFILE.coat}"]`); if (r) r.checked = true;
  }
  syncSetupCats();
  function paintCoat(c, scope) {
    if (!scope) sceneCats.forEach(im => im.setAttribute('href', c.img));
    if (scope) { $('#breedName').textContent = c.name; }
    if (!scope) coatTargets.forEach(o => o.el.setAttribute(o.attr, c[o.part]));
    (scope || document).querySelectorAll('#setupScreen [data-coat]').forEach(el => {
      const v = c[el.dataset.coat]; el.setAttribute(el.dataset.attr, v || 'none');
    });
  }
  // Swap the default names in every bit of page text, now and whenever the game updates text.
  const nameOrig = new Map(), nameSet = new WeakMap();
  function nameNode(node) {
    const d = node.data;
    if (nameSet.get(node) === d) return;
    if (!/Thiri|Shwe|SHWE/.test(d)) { nameOrig.delete(node); return; }
    nameOrig.set(node, d);
    const nd = mkName(d); nameSet.set(node, nd); if (nd !== d) node.data = nd;
  }
  function nameTree(root) {
    if (root.nodeType === 3) { if (!root.parentElement || !root.parentElement.closest('script,style,#setupScreen')) nameNode(root); return; }
    if (root.nodeType !== 1 || root.closest('script,style,#setupScreen')) return;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) if (!n.parentElement.closest('script,style,#setupScreen')) nameNode(n);
    root.querySelectorAll && [root, ...root.querySelectorAll('[aria-label]')].forEach(el => {
      if (!el.getAttribute || !el.hasAttribute('aria-label')) return;
      if (!el.dataset.mkAria) { const a = el.getAttribute('aria-label'); if (!/Thiri|Shwe/.test(a)) return; el.dataset.mkAria = a; }
      el.setAttribute('aria-label', mkName(el.dataset.mkAria));
    });
  }
  function renameAll() {
    nameOrig.forEach((orig, node) => { if (!node.isConnected) { nameOrig.delete(node); return; } const nd = mkName(orig); nameSet.set(node, nd); node.data = nd; });
    nameTree(document.body);
    document.title = mkName('TideCatcher Prototype');
  }
  new MutationObserver(list => {
    for (const m of list) {
      if (m.type === 'characterData') nameTree(m.target);
      else m.addedNodes.forEach(nameTree);
    }
  }).observe(document.body, { subtree: true, childList: true, characterData: true });

  const setupEl = $('#setupScreen'), girlIn = $('#girlNameInput'), catIn = $('#catNameInput');
  let setupFirstRun = false;
  [girlIn, catIn].forEach(i => i.addEventListener('keydown', e => e.stopPropagation()));
  setupEl.addEventListener('keydown', e => { if (e.target.name === 'coat') e.stopPropagation(); });
  function setupCoat() { const v = (setupEl.querySelector('input[name="coat"]:checked') || {}).value; return ownedCats.includes(v) ? v : 'ginger'; }
  function refreshSetupPreview() {
    paintCoat(MK_COATS[setupCoat()], setupEl);
    $('#setupCatTag').textContent = catIn.value.trim() || 'Shwe';
  }
  catIn.addEventListener('input', refreshSetupPreview);
  setupEl.querySelectorAll('input[name="coat"]').forEach(r => r.addEventListener('change', refreshSetupPreview));
  // Animated preview: the chosen cat walks, pauses, then hops, on a loop.
  let previewRaf = 0;
  function previewLoop(now) {
    if (setupEl.hidden) { previewRaf = 0; return; }
    const cvp = $('#setupCatCanvas'), g = cvp.getContext('2d'), key = setupCoat(), spr = mkGetSprite(key);
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cvp.width, cvp.height);
    if (spr && spr.complete && spr.naturalWidth) {
      const s2 = now / 1000, cyc = s2 % 8, hh = 230, ww = hh * spr.naturalWidth / spr.naturalHeight;
      let pose, lift = 0;
      if (cyc < 1.4) pose = { tail: Math.sin(s2 * 1.7) * .12, breath: Math.sin(s2 * 2.2) * .016 };
      else if (cyc < 3.2) { const ph = s2 * 5; pose = { back: Math.sin(ph) * .34, front: -Math.sin(ph + .18) * .31, tail: Math.sin(ph * .48 + 1.1) * .18 }; lift = Math.abs(Math.sin(ph)) * 4; }
      else if (cyc < 5.1) { const ph = s2 * 9; pose = { back: Math.sin(ph) * .52, front: -Math.sin(ph + .18) * .48, tail: Math.sin(ph * .48 + 1.1) * .28 }; lift = Math.abs(Math.sin(ph)) * 7; }
      else if (cyc < 6.1) pose = { back: -.08, front: Math.sin(s2 * 20) * .58, tail: .28 + Math.sin(s2 * 8) * .12, breath: .01 };
      else { const j = (cyc - 6.1) / 1.9, up = Math.sin(j * Math.PI), rising = j < .5; pose = { back: rising ? -.38 * up : .25 * up, front: rising ? .32 * up : -.24 * up, tail: rising ? -.32 * up : .3 * up }; lift = up * 34; }
      g.fillStyle = 'rgba(0,0,0,.28)'; g.beginPath(); g.ellipse(170, 288, ww * .38 * (1 - lift / 90), 7, 0, 0, 7); g.fill();
      mkDrawRig(g, key, 170 - ww / 2, 290 - hh - lift, ww, hh, pose);
    }
    previewRaf = requestAnimationFrame(previewLoop);
  }
  let welcomeLoadRun = 0, briefingNight = 1, briefingReturnButton = null, readyTimers = [];
  const BRIEFING_FEELING_NAMES = { F: 'Frustrated', N: 'Nervous', L: 'Lonely', C: 'Calm', B: 'Buried', E: 'Excited', S: 'Shy', J: 'Jealous' };
  function showWelcome() {
    const run = ++welcomeLoadRun, welcome = $('#welcomeScreen'), start = $('#welcomeBeginBtn');
    state = 'menu'; cv.hidden = true;
    ['#setupScreen', '#prologueScreen', '#startScreen', '#endScreen', '#awakeningScreen', '#levelBriefingScreen', '#nightReadyScreen', '#shopScreen', '#bookScreen'].forEach(id => { const el = $(id); if (el) el.hidden = true; });
    welcome.hidden = false;
    const coat = MK_COATS[MK_PROFILE.coat] || MK_COATS.ginger;
    $('#welcomeCat').src = coat.img; $('#welcomeCat').alt = `${MK_PROFILE.cat}, ready to follow the night lights`;
    $('#welcomeCatName').textContent = MK_PROFILE.cat;
    $('#welcomeLoadStatus').textContent = 'Gathering the moonlight…';
    $('#welcomeLoadCount').textContent = `0 / ${INTRO_SCENES.length}`;
    $('#welcomeProgress').style.width = '0%'; $('#welcomeProgressBar').setAttribute('aria-valuenow', '0');
    start.disabled = true;
    introPreload((loaded, total) => {
      if (run !== welcomeLoadRun) return;
      $('#welcomeLoadCount').textContent = `${loaded} / ${total}`;
      $('#welcomeProgress').style.width = `${Math.round(loaded / total * 100)}%`;
      $('#welcomeProgressBar').setAttribute('aria-valuenow', String(loaded));
      if (loaded === total) $('#welcomeLoadStatus').textContent = 'The night is ready.';
    }).then(results => {
      if (run !== welcomeLoadRun || welcome.hidden) return;
      const loaded = results.filter(Boolean).length;
      $('#welcomeLoadStatus').textContent = loaded === INTRO_SCENES.length ? 'The night is ready.' : `The story is ready · ${loaded} of ${INTRO_SCENES.length} scenes loaded.`;
      start.disabled = false;
      start.focus({ preventScroll: true });
    }).catch(() => {
      if (run !== welcomeLoadRun || welcome.hidden) return;
      $('#welcomeLoadStatus').textContent = 'The night is ready when you are.';
      start.disabled = false;
      start.focus({ preventScroll: true });
    });
  }
  function showMapGuide() {
    mapGuidePending = true;
    const coat = MK_COATS[MK_PROFILE.coat] || MK_COATS.ginger;
    $('#mapGuideCat').src = coat.img; $('#mapGuideName').textContent = MK_PROFILE.cat;
    $('#mapGuideText').textContent = `${MK_PROFILE.cat} will follow the glowing path with you. Swipe along the trail and choose a glowing chapter to see its goal.`;
    $('#mapGuide').hidden = false; $('#mapGuideDismiss').focus({ preventScroll: true });
  }
  function dismissMapGuide() {
    $('#mapGuide').hidden = true; mapGuidePending = false;
    try { localStorage.setItem('mk-map-guide-seen', '1'); } catch (e) {}
  }
  function showLevelBriefing(night, returnButton = null) {
    if (mapGuidePending) dismissMapGuide();
    briefingNight = clamp(Math.floor(+night) || 1, 1, LEVEL_MAP_LIMIT);
    briefingReturnButton = returnButton || $(`#levelMapTrack button[data-level="${briefingNight}"]`);
    const chapter = LEVEL_MAP_CHAPTERS.get(briefingNight) || chapterFor(briefingNight);
    if (!chapter) return;
    $('#levelBriefingEyebrow').textContent = `${hourOf(briefingNight).toUpperCase()} · THE NIGHT SIDE`;
    $('#levelBriefingTitle').textContent = chapter.name;
    const visualChapter = window.TCVisualChapters?.forLevel(briefingNight);
    const hallway = null;
    $('#levelBriefingSub').textContent = visualChapter ? `${hallway ? hallway.name + ' · ' : ''}${visualChapter.name} · Levels ${visualChapter.first}–${visualChapter.last}. ${visualChapter.description}` : chapter.sub;
    const goal = Object.entries(chapter.feelingsNeeded || {}).map(([type, count]) => `${BRIEFING_FEELING_NAMES[type] || type} ×${count}`).join(' · ');
    $('#levelBriefingGoal').textContent = goal ? `Bring home: ${goal}` : 'Find the little lights that are ready to come home.';
    $('#levelBriefingTip').textContent = chapter.tutorialHint || chapter.newMoodling || chapter.sub;
    if (window.TC_LEVELS?.[briefingNight]?.map === 'rooftop') $('#levelBriefingTip').textContent = 'Cross the rooftops past chimneys and laundry. Warm roof cushions mark clear places to pause.';
    const seconds = Math.max(0, Math.floor(chapter.timeLimit || 0));
    { const g = starGoals(briefingNight); $('#levelBriefingTime').textContent = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')} before sunrise · ★★ ${g[1].toLocaleString()} · ★★★ ${g[2].toLocaleString()}`; }
    $('#levelBriefingScreen').hidden = false; $('#levelBriefingStart').focus({ preventScroll: true });
  }
  function closeLevelBriefing() {
    $('#levelBriefingScreen').hidden = true;
    const target = briefingReturnButton || $(`#levelMapTrack button[data-level="${unlockedLevel}"]`);
    if (target) target.focus({ preventScroll: true });
  }
  function beginNightSequence() {
    const chapter = LEVEL_MAP_CHAPTERS.get(briefingNight) || chapterFor(briefingNight);
    if (!chapter) return;
    initAudio(); readyTimers.forEach(clearTimeout); readyTimers = [];
    $('#levelBriefingScreen').hidden = true;
    const screen = $('#nightReadyScreen'), word = $('#nightReadyWord');
    screen.hidden = false; screen.dataset.phase = 'ready';
    $('#readyNightEyebrow').textContent = `${hourOf(briefingNight).toUpperCase()} · ${chapter.name}`;
    word.textContent = 'Ready?'; $('#nightReadyCaption').textContent = 'Bring every little light home.';
    tone(chapter.musicRoot, .45, 'sine', .018);
    readyTimers.push(setTimeout(() => {
      if (screen.hidden) return;
      screen.dataset.phase = 'go'; word.textContent = 'Go!';
      $('#nightReadyCaption').textContent = `${MK_PROFILE.cat} will follow the last light.`;
      tone(chapter.musicRoot * 1.5, .35, 'triangle', .022);
    }, 680));
    readyTimers.push(setTimeout(() => {
      if (screen.hidden) return;
      screen.hidden = true; startGame('story', briefingNight);
    }, 1180));
  }
  function showSetup(firstRun) {
    setupFirstRun = firstRun;
    welcomeLoadRun++;
    state = 'menu'; cv.hidden = true;
    ['#welcomeScreen', '#welcomeCardsScreen', '#helpScreen', '#startScreen', '#hubSettingsScreen', '#prologueScreen', '#endScreen', '#levelBriefingScreen', '#nightReadyScreen', '#shopScreen', '#bookScreen'].forEach(id => { const el = $(id); if (el) el.hidden = true; });
    girlIn.value = MK_HAS_PROFILE ? MK_PROFILE.girl : ''; catIn.value = MK_HAS_PROFILE ? MK_PROFILE.cat : '';
    syncSetupCats();
    $('#setupGo').textContent = firstRun ? 'Begin the story →' : 'Save';
    $('#setupBackBtn').hidden = !firstRun;
    $('#setupNote').textContent = firstRun ? 'You can change these later from the menu.' : 'Your progress stays the same.';
    $('#setupError').textContent = '';
    refreshSetupPreview();
    setupEl.hidden = false; setupEl.scrollTop = 0; girlIn.focus({ preventScroll: true });
    if (!previewRaf) previewRaf = requestAnimationFrame(previewLoop);
  }
  $('#setupForm').addEventListener('submit', e => {
    e.preventDefault();
    const girl = girlIn.value.trim() || 'Thiri', catName = catIn.value.trim() || 'Shwe';
    if (girl.toLowerCase() === catName.toLowerCase()) { $('#setupError').textContent = 'Give the girl and the cat different names.'; return; }
    MK_PROFILE.girl = girl.slice(0, 12); MK_PROFILE.cat = catName.slice(0, 12); MK_PROFILE.coat = setupCoat();
    MK_PROFILE.welcomeSeen = true;
    COAT = MK_COATS[MK_PROFILE.coat]; MK_HAS_PROFILE = true;
    persistGuidanceProgress();
    try { localStorage.setItem('mk-profile', JSON.stringify(MK_PROFILE)); } catch (err) {}
    paintCoat(COAT); renameAll();
    setupEl.hidden = true;
    // first run: the names are chosen first, so the intro can use them
    if (setupFirstRun) playIntro('first-run'); else showMainMenu(true);
  });
  $('#welcomeBeginBtn').addEventListener('click', () => { initAudio(); showSetup(true); });
  $('#welcomeSkipBtn').addEventListener('click', finishWelcomeCards);
  $('#welcomeNextBtn').addEventListener('click', welcomeNext);
  $('#welcomeDots').addEventListener('click', e => { const dot = e.target.closest('.welcome-dot'); if (dot) renderWelcomeCard(+dot.dataset.slide); });
  $('#welcomeCarousel').addEventListener('scroll', () => {
    clearTimeout(welcomeCardScrollTimer);
    welcomeCardScrollTimer = setTimeout(() => { const width = $('#welcomeCarousel').clientWidth; if (width) renderWelcomeCard(Math.round($('#welcomeCarousel').scrollLeft / width), false); }, 70);
  }, { passive: true });
  $('#welcomeCardsScreen').addEventListener('keydown', e => {
    if (e.key === 'Escape') { e.preventDefault(); finishWelcomeCards(); return; }
    if (document.activeElement === $('#welcomeCarousel') && e.key === 'ArrowRight') { e.preventDefault(); welcomeNext(); }
    if (document.activeElement === $('#welcomeCarousel') && e.key === 'ArrowLeft') { e.preventDefault(); welcomePrevious(); }
    if (e.key !== 'Tab') return;
    const focusable = Array.from($('#welcomeCardsScreen').querySelectorAll('button:not([disabled]),[tabindex="0"]')).filter(el => !el.hidden);
    if (!focusable.length) return;
    if (e.shiftKey && document.activeElement === focusable[0]) { e.preventDefault(); focusable[focusable.length - 1].focus(); }
    else if (!e.shiftKey && document.activeElement === focusable[focusable.length - 1]) { e.preventDefault(); focusable[0].focus(); }
  });
  $('#setupBackBtn').addEventListener('click', () => { if (setupFirstRun) showWelcome(); });
  $('#mapGuideDismiss').addEventListener('click', () => { dismissMapGuide(); const current = $(`#levelMapTrack button[data-level="${unlockedLevel}"]`); if (current) current.focus({ preventScroll: true }); });
  $('#levelBriefingBack').addEventListener('click', closeLevelBriefing);
  $('#levelBriefingStart').addEventListener('click', beginNightSequence);
  $('#levelBriefingScreen').addEventListener('click', e => { if (e.target.id === 'levelBriefingScreen') closeLevelBriefing(); });
  $('#levelBriefingScreen').addEventListener('keydown', e => {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeLevelBriefing(); return; }
    if (e.key === 'Tab') {
      const buttons = Array.from($('#levelBriefingScreen').querySelectorAll('button:not([disabled])'));
      if (!buttons.length) return;
      const first = buttons[0], last = buttons[buttons.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  $('#profileBtn').addEventListener('click', () => showSetup(false));
  function refreshLanguagePicker() {
    const language = MK_PROFILE.tipLanguage === 'my' ? 'my' : 'en';
    const myanmar = language === 'my';
    $('#languageCurrentFlag').textContent = myanmar ? '🇲🇲' : '🇬🇧';
    $('#languageCurrentLabel').textContent = myanmar ? 'မြန်မာ' : 'English';
    $('#languageOptionMy').classList.toggle('is-selected', myanmar);
    $('#languageOptionMy').setAttribute('aria-pressed', String(myanmar));
    $('#languageOptionEn').classList.toggle('is-selected', !myanmar);
    $('#languageOptionEn').setAttribute('aria-pressed', String(!myanmar));
  }
  function closeLanguagePicker(restoreFocus = true) {
    $('#languagePickerScreen').hidden = true;
    $('#languagePickerBtn').setAttribute('aria-expanded', 'false');
    if (restoreFocus) $('#languagePickerBtn').focus({ preventScroll: true });
  }
  $('#languagePickerBtn').addEventListener('click', () => {
    refreshLanguagePicker();
    $('#languagePickerScreen').hidden = false;
    $('#languagePickerBtn').setAttribute('aria-expanded', 'true');
    $(`#languagePickerScreen [data-language="${MK_PROFILE.tipLanguage === 'my' ? 'my' : 'en'}"]`).focus({ preventScroll: true });
  });
  $('#languagePickerScreen').addEventListener('click', event => {
    if (event.target.id === 'languagePickerScreen' || event.target.id === 'languagePickerClose') closeLanguagePicker();
    const option = event.target.closest('[data-language]');
    if (!option) return;
    MK_PROFILE.tipLanguage = option.dataset.language === 'my' ? 'my' : 'en';
    persistGuidanceProgress(); refreshLanguagePicker();
  });
  $('#languagePickerScreen').addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); closeLanguagePicker(); return; }
    if (event.key !== 'Tab') return;
    const buttons = Array.from($('#languagePickerScreen').querySelectorAll('button:not([disabled])'));
    const first = buttons[0], last = buttons[buttons.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  $('#settingsBtn').addEventListener('click', () => {
    $('#showTipsToggle').checked = MK_PROFILE.showTips !== false; refreshLanguagePicker();
    $('#gentleModeToggle').checked = gentleMode;
    $('#settingsReplayTutorial').disabled = MK_PROFILE.showTips === false;
    $('#settingsGuidanceStatus').textContent = ''; $('#hubSettingsScreen').hidden = false; $('#settingsCloseBtn').focus({ preventScroll: true });
  });
  $('#settingsCloseBtn').addEventListener('click', () => { $('#hubSettingsScreen').hidden = true; $('#settingsBtn').focus({ preventScroll: true }); });
  $('#settingsHelpBtn').addEventListener('click', () => openHelp('settings'));
  $('#showTipsToggle').addEventListener('change', e => {
    MK_PROFILE.showTips = !!e.target.checked;
    if (!MK_PROFILE.showTips) { activeJitTip = null; jitTipQueue = []; hideCoachTip(); }
    $('#settingsReplayTutorial').disabled = !MK_PROFILE.showTips; persistGuidanceProgress();
  });
  $('#gentleModeToggle').addEventListener('change', e => { gentleMode = !!e.target.checked; try { localStorage.setItem('mk-gentle-mode', gentleMode ? '1' : '0'); } catch (err) {} });
  $('#settingsReplayTutorial').addEventListener('click', () => {
    if (!MK_PROFILE.showTips) return;
    MK_PROFILE.tutorialDone = false; persistGuidanceProgress(); $('#hubSettingsScreen').hidden = true;
    startGame('story', 1);
  });
  $('#hubSettingsScreen').addEventListener('click', e => { if (e.target.id === 'hubSettingsScreen') { $('#hubSettingsScreen').hidden = true; $('#settingsBtn').focus({ preventScroll: true }); } });
  $('#hubSettingsScreen').addEventListener('keydown', e => {
    if (e.key === 'Escape') { e.preventDefault(); $('#hubSettingsScreen').hidden = true; $('#settingsBtn').focus({ preventScroll: true }); return; }
    if (e.key !== 'Tab') return;
    const focusable = Array.from($('#hubSettingsScreen').querySelectorAll('button:not([disabled]), summary, a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'))
      .filter(el => !el.hidden && el.offsetParent !== null);
    if (!focusable.length) return;
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  // ---- Reset progress ----
  // Deletes every saved 'mk-' key on this device, then reloads so the game starts like a new player.
  function openReset() { $('#resetScreen').hidden = false; $('#resetCancel').focus({ preventScroll: true }); }
  function closeReset() { $('#resetScreen').hidden = true; $('#resetBtn').focus({ preventScroll: true }); }
  function resetProgress() {
    try {
      Object.keys(localStorage).filter(k => k.startsWith('mk-')).forEach(k => localStorage.removeItem(k));
    } catch (e) {}
    location.reload();
  }
  $('#resetBtn').addEventListener('click', openReset);
  $('#resetCancel').addEventListener('click', closeReset);
  $('#resetConfirm').addEventListener('click', resetProgress);
  $('#resetScreen').addEventListener('click', e => { if (e.target.id === 'resetScreen') closeReset(); });
  $('#resetScreen').addEventListener('keydown', e => { if (e.key === 'Escape') { e.stopPropagation(); closeReset(); } });
  paintCoat(COAT); renameAll();

  const bootScreen = $('#bootLoadingScreen'), bootStartedAt = performance.now();
  buildLevelMap();
  if (!MK_HAS_PROFILE && MK_PROFILE.welcomeSeen) showSetup(true);
  else if (!MK_HAS_PROFILE) showWelcome();
  else showMainMenu(false);
  syncMobileOrientationGate();
  const pageReady = document.readyState === 'complete' ? Promise.resolve() : new Promise(resolve => addEventListener('load', resolve, { once: true }));
  const fontsReady = document.fonts?.ready || Promise.resolve();
  const fontWait = Promise.race([fontsReady.catch(() => {}), new Promise(resolve => setTimeout(resolve, 1600))]);
  const minimumBoot = new Promise(resolve => setTimeout(resolve, Math.max(0, 800 - (performance.now() - bootStartedAt))));
  Promise.all([pageReady, fontWait, minimumBoot]).then(() => {
    bootScreen.classList.add('is-leaving');
    setTimeout(() => { bootScreen.hidden = true; }, 260);
  });
  pauseBtn.addEventListener('click', pauseGame);
  pauseContinueBtn.addEventListener('click', resumeGame);
  pauseHelpBtn.addEventListener('click', () => openHelp('pause'));
  $('#pauseRestartBtn').addEventListener('click', () => startGame(mode, storyNight));
  $('#pauseChaptersBtn').addEventListener('click', () => {
    pauseScreen.hidden = true; touchUI.hidden = true; cv.hidden = true; state = 'menu';
    if (mode === 'story') showStoryMap(true); else showMainMenu(true);
  });
  pauseQuitBtn.addEventListener('click', quitPausedRun);
  pauseScreen.addEventListener('keydown', e => {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); resumeGame(); return; }
    if (e.key !== 'Tab') return;
    const first = pauseContinueBtn, last = pauseQuitBtn;
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  $('#levelMapTrack').addEventListener('click', e => {
    const button = e.target.closest('button[data-level]'); if (!button || button.disabled) return;
    const night = +button.dataset.level; if (night <= unlockedLevel) showLevelBriefing(night, button);
  });
  // Free Play opens a map picker: every map Shwe has reached in the story, plus the classic routes
  const FREE_MAP_ART = { school: 'assets/school/hallway-night.webp', park: 'assets/park/park-night.webp', festival: 'assets/festival/festival-back.webp', hill: 'assets/hill/hill-vista.webp' };
  function openFreeMapPicker(returnFocus) {
    let scr = $('#freeMapScreen');
    if (!scr) {
      scr = document.createElement('div'); scr.className = 'overlay free-map-screen'; scr.id = 'freeMapScreen'; scr.hidden = true;
      scr.setAttribute('role', 'dialog'); scr.setAttribute('aria-modal', 'true'); scr.setAttribute('aria-labelledby', 'freeMapTitle');
      scr.innerHTML = '<section class="panel free-map-panel"><p class="eyebrow">Free Play</p><h2 id="freeMapTitle">Where should Shwe play?</h2><p class="muted">Pick any place you have reached in the story. No clock and no score: just a quiet wander with Shwe.</p><div class="free-map-grid" id="freeMapGrid"></div><div class="actions"><button class="btn ghost" type="button" id="freeMapBack">Back</button></div></section>';
      document.body.appendChild(scr);
      $('#freeMapBack').addEventListener('click', () => { scr.hidden = true; (scr._return || $('#freeBtn'))?.focus?.(); });
      scr.addEventListener('keydown', e => { if (e.key === 'Escape') { e.stopPropagation(); scr.hidden = true; (scr._return || $('#freeBtn'))?.focus?.(); } });
    }
    scr._return = returnFocus || $('#freeBtn');
    const grid = $('#freeMapGrid'); grid.textContent = '';
    for (const m of FREE_MAPS) {
      const open = freeMapOpen(m), b = document.createElement('button');
      b.type = 'button'; b.className = `free-map-card map-${m.id}${open ? '' : ' locked'}${m.id === freeMap ? ' chosen' : ''}`; b.disabled = !open;
      b.setAttribute('aria-label', open ? `Play Free Mode at ${m.name}` : `${m.name}, locked until you reach ${hourOf(m.opens)} in the story`);
      const art = document.createElement('span'); art.className = 'free-map-art'; art.setAttribute('aria-hidden', 'true');
      if (FREE_MAP_ART[m.id]) art.style.backgroundImage = `url("${FREE_MAP_ART[m.id]}")`;
      const nm = document.createElement('strong'); nm.textContent = m.name;
      const nt = document.createElement('span'); nt.textContent = open ? m.note : `Reach ${hourOf(m.opens)} in the story`;
      b.append(art, nm, nt);
      b.addEventListener('click', () => { freeMap = m.id; try { localStorage.setItem('mk-free-map', m.id); } catch (e) {} scr.hidden = true; startGame('free'); });
      grid.appendChild(b);
    }
    scr.hidden = false;
    setTimeout(() => (grid.querySelector('.chosen:not([disabled])') || grid.querySelector('button:not([disabled])'))?.focus(), 30);
  }
  $('#freeBtn').addEventListener('click', () => openFreeMapPicker($('#freeBtn')));
  $('#againBtn').addEventListener('click', () => startGame(mode, storyNight));
  $('#endContinueBtn').addEventListener('click', () => { if (canContinue()) startGame('story', R.night + 1); });
  $('#menuBtn').addEventListener('click', () => {
    mouseSneakHeld = false; mouseSneakPointerId = null; mouseSneakPress = null; refreshShopBtns();
    if (mode === 'story') { $('#endScreen').hidden = true; showStoryMap(true); }
    else { showMainMenu(true); openFreeMapPicker($('#freeBtn')); }
  });

  const goHomeBtn = document.getElementById('goHomeBtn');
  goHomeBtn?.addEventListener('click', enterPortal);
  let last = performance.now();
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(.033, (now - last) / 1000); last = now;
    if (document.hidden) return;
    pauseBtn.hidden = state !== 'play';
    if (goHomeBtn) goHomeBtn.hidden = !atPortal();   // only while Shwe is standing at the moon door
    if (mobileLandscapeRequired && !orientationGate.hidden) return;
    if (state === 'intro' || state === 'awakening') { t += dt; return; }
    if (state === 'play' || state === 'ending') {
      if (hitstop > 0) hitstop -= dt;
      else { let sdt = dt; if (slowmo > 0) { slowmo -= dt; sdt = dt * .35; } update(sdt); }
    } else if (state === 'menu') { t += dt; }
    else if (state === 'home' && H) homeUpdate(dt);
    if (state === 'home' && H) {
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#120c24'; ctx.fillRect(0, 0, cv.width, cv.height);
      ctx.setTransform(dpr * S, 0, 0, dpr * S, 0, dpr * S * OY);
      drawHome();
      return;
    }
    // DOM menus have their own artwork. Do not repaint the hidden game world
    // underneath them: it wastes mobile GPU memory and rendering time.
    if (!cv.hidden) render(dt);
  }
  window.TCHeart?.bind({
    glow: () => glow,
    spend: amount => { if (glow < amount) return false; glow -= amount; saveUpg(); refreshHubStats(); return true; },
    enter: () => { state = 'menu'; $('#startScreen').hidden = true; cv.hidden = true; },
    home: () => showMainMenu(true),
    play: () => showStoryMap(true),
    chime: () => tone(784, .25, 'sine', .06, 180),
    portrait: id => bookPortrait(id, 0, true),
    rewardName: id => TRAILS[id] ? TRAILS[id].name + ' trail' : (ITEMS.find(i => i.id === id)?.name || id),
    rewards: lit => {
      let claimed = [];
      try { const saved = JSON.parse(localStorage.getItem('mk-town-rewards') || '[]'); if (Array.isArray(saved)) claimed = saved; } catch (_) {}
      for (const place of window.TCHeartData.places) {
        if (!lit.includes(place.id) || claimed.includes(place.id)) continue;
        glow += 30;
        if (!place.reward) {}
        else if (TRAILS[place.reward]) { if (!ownedTrails.includes(place.reward)) ownedTrails.push(place.reward); }
        else itemStock[place.reward] = (itemStock[place.reward] || 0) + 1;
        claimed.push(place.id);
      }
      saveUpg(); saveShop();
      try { localStorage.setItem('mk-town-rewards', JSON.stringify(claimed)); } catch (_) {}
    },
    collar: () => { goldenCollar = true; }
  });
  requestAnimationFrame(frame);
})();
