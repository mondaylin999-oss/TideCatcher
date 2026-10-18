
(() => {
  const cv = document.getElementById('game'), ctx = cv.getContext('2d');
  const $ = s => document.querySelector(s);
  const pauseBtn = document.getElementById('pauseBtn');
  const pauseScreen = document.getElementById('pauseScreen');
  const pauseContinueBtn = document.getElementById('pauseContinueBtn');
  const pauseQuitBtn = document.getElementById('pauseQuitBtn');
  let pauseTouchWasHidden = true;
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

  const T = 48, VH = 540, WORLD = 4200, GROUND = 470;
  const BLUE = '#6fb6ff', RED = '#ff6168', VIOLET = '#a98bff', GOLD = '#f6c453', CALM = '#7ddc8b', INK = '#f3ecff', MUTED = '#b7acd3';
  const EXC = '#ffd23f', SHY = '#ff7ab8', JEAL = '#ff9a3c';
  const DISP = '"Grandstander","Trebuchet MS",sans-serif', BODY = '"Lexend",system-ui,sans-serif';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const col = ty => ty === 'F' ? RED : ty === 'N' ? VIOLET : ty === 'L' ? BLUE : ty === 'C' ? CALM : ty === 'B' ? '#a67646' : ty === 'E' ? EXC : ty === 'S' ? SHY : ty === 'J' ? JEAL : GOLD;

  // ---------- sizing ----------
  let VW = 960, S = 1, OY = 0, dpr = 1;
  (function capGlow(c) {
    const d = Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype, 'shadowBlur');
    Object.defineProperty(c, 'shadowBlur', { get() { return d.get.call(this); }, set(v) { d.set.call(this, Math.min(v, 7)); } });
  })(ctx);
  function resize() {
    const w = innerWidth, h = innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    if (w * h * dpr * dpr > 1600000) dpr = Math.max(.75, Math.sqrt(1600000 / (w * h)));
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    S = h / VH; VW = w / S; OY = 0;
    if (VW < 760) { S = w / 760; VW = 760; OY = (h / S - VH) / 2; }
  }
  addEventListener('resize', resize); resize();

  // ---------- audio ----------
  let ac = null;
  function tone(f, d = .12, type = 'sine', v = .1, slide = 0) {
    if (!ac) return;
    try {
      const t0 = ac.currentTime, o = ac.createOscillator(), g = ac.createGain();
      o.type = type; o.frequency.setValueAtTime(f, t0);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, f + slide), t0 + d);
      g.gain.setValueAtTime(v, t0); g.gain.exponentialRampToValueAtTime(.0001, t0 + d);
      o.connect(g).connect(ac.destination); o.start(t0); o.stop(t0 + d + .03);
    } catch (e) {}
  }

  // ---------- input ----------
  const keys = {};
  let jumpQ = false, pounceQ = false, scratchQ = false, touchAxis = 0, mouseSneakHeld = false, mouseSneakPointerId = null, mouseSneakPress = null;
  addEventListener('keydown', e => {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'KeyS'].includes(e.code) && (state === 'play' || state === 'home')) e.preventDefault();
    keys[e.code] = true;
    if (e.repeat) return;
    if ((e.code === 'Escape' || e.code === 'KeyP') && state === 'play') { e.preventDefault(); pauseGame(); return; }
    if ((e.code === 'Escape' || e.code === 'KeyP') && state === 'paused') { e.preventDefault(); resumeGame(); return; }
    if ($('#nightWakeScreen') && !$('#nightWakeScreen').hidden) { if (['Space','Enter','Escape'].includes(e.code)) { e.preventDefault(); closeNightWake(); } return; }
    if (state === 'home' && (e.code === 'Space' || e.code === 'Enter')) { e.preventDefault(); homeKey(); return; }
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') jumpQ = true;
    if (e.code === 'KeyJ' || e.code === 'KeyX') pounceQ = true;
    if (e.code === 'KeyK') purrQ = true;
    if (e.code === 'KeyE' || e.code === 'KeyL') eyesQ = true;
    if (e.code === 'KeyS') scratchQ = true;
  });
  addEventListener('keyup', e => { keys[e.code] = false; });
  addEventListener('blur', () => { for (const k in keys) keys[k] = false; mouseSneakHeld = false; mouseSneakPointerId = null; mouseSneakPress = null; });
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
    touchAxis = dx / 58; if (Math.abs(touchAxis) < .12) touchAxis = 0;
    knob.style.transform = `translate(calc(-50% + ${dx}px),-50%)`;
  }
  zone.addEventListener('pointerdown', e => {
    e.preventDefault(); sid = e.pointerId; sx = e.clientX; sy = e.clientY;
    const r = zone.getBoundingClientRect();
    stick.style.left = (sx - r.left) + 'px'; stick.style.top = (sy - r.top) + 'px'; stick.hidden = false;
    try { zone.setPointerCapture(sid); } catch (err) {}
    stickMove(e);
  });
  zone.addEventListener('pointermove', e => { if (e.pointerId === sid) stickMove(e); });
  const stickEnd = e => { if (e.pointerId !== sid) return; sid = null; touchAxis = 0; stick.hidden = true; knob.style.transform = 'translate(-50%,-50%)'; };
  zone.addEventListener('pointerup', stickEnd); zone.addEventListener('pointercancel', stickEnd);
  $('#bJump').addEventListener('pointerdown', e => { e.preventDefault(); jumpQ = true; });
  $('#bPounce').addEventListener('pointerdown', e => { e.preventDefault(); pounceQ = true; });
  $('#bPurr').addEventListener('pointerdown', e => { e.preventDefault(); purrQ = true; });
  $('#bEyes').addEventListener('pointerdown', e => { e.preventDefault(); eyesQ = true; });
  $('#bScratch').addEventListener('pointerdown', e => { e.preventDefault(); scratchQ = true; });
  const coarse = matchMedia('(pointer: coarse)').matches;
  addEventListener('touchstart', () => { if (state === 'play') touchUI.hidden = false; }, { passive: true });

  // ---------- world ----------
  const plats = [[300, 385, 170], [640, 330, 150], [930, 390, 210], [1260, 305, 170], [1520, 385, 190], [1830, 325, 160], [2120, 390, 210], [2380, 315, 150], [2730, 360, 180], [3100, 330, 190], [3500, 370, 170], [3920, 330, 180]];
  let activePlats = plats;
  const CAVE_XS = [430, 960, 1480, 2020, 2440, 2780, 3320, 3860];
  const TRAIL_PROFILE = [[0,425],[120,432],[225,454],[320,480],[390,494],[470,486],[540,455],[620,415],[700,388],[820,382],[905,396],[980,438],[1030,476],[1100,490],[1180,478],[1240,438],[1310,390],[1390,365],[1510,360],[1600,372],[1680,398],[1770,405],[1850,396],[1920,430],[1990,474],[2070,496],[2160,482],[2230,448],[2300,405],[2360,375],[2440,360],[2530,385],[2600,430],[2700,462],[2800,490],[2880,480],[3000,438],[3120,390],[3210,368],[3300,380],[3400,420],[3500,470],[3580,494],[3650,487],[3760,445],[3860,400],[3960,368],[4050,385],[4140,440],[4200,470]];
  function terrainY(x) {
    if (inHill()) return hillY(x);
    if (inSchool() || inFestival() || inPark() || inLake()) return GROUND;
    if (x <= TRAIL_PROFILE[0][0]) return TRAIL_PROFILE[0][1];
    for (let i = 1; i < TRAIL_PROFILE.length; i++) {
      const a = TRAIL_PROFILE[i-1], b = TRAIL_PROFILE[i];
      if (x <= b[0]) return a[1] + (b[1]-a[1]) * ((x-a[0])/(b[0]-a[0]));
    }
    return TRAIL_PROFILE[TRAIL_PROFILE.length-1][1];
  }
  let state = 'menu', t = 0, timeLeft = 90, score = 0, combo = 0, comboT = 0, bestCombo = 1, hitstop = 0, slowmo = 0, chaos = false, endT = 0, warmup = 0;
  const FRUST_SLEEP = 5; // Frustrated sleeps for the first 5 seconds of the night clock
  let frustWakeAt = FRUST_SLEEP + 1.5;
  let mode = 'story', storyNight = 1, freeT = 0, level = 0, nextGold = 18, caughtN = 0;
  // ---------- School map (Nights 1-2) ----------
  // Night-time school hallway behind a flat floor. The wall picture is one 2445-wide image (drawn
  // mirrored every other repeat so it never shows a seam); platforms are drawn in code as wooden shelves.
  const SCHOOL_NIGHTS = [1, 2];
  const SCHOOL_WALL = new Image();
  SCHOOL_WALL.src = 'assets/school/hallway-night.webp';
  const SCHOOL_WALL_W = 2445, SCHOOL_WALL_H = 474, SCHOOL_PARALLAX = .9;
  function inSchool() { return mode === 'story' && SCHOOL_NIGHTS.includes(storyNight); }
  // ---------- Hilltop park map (Night 5) ----------
  // Layout from the team's level design: a stepped stone terrace (high gate terrace, bench step,
  // lamp step, low walkway along the railing, back up), tree-branch ledges and stone pillars to jump on,
  // and a tree hollow, bin and bushes to hide in. The far city view comes from the team's picture.
  const HILL_NIGHTS = [5];
  function inHill() { return mode === 'story' && HILL_NIGHTS.includes(storyNight); }
  const HILL_W = 1400;
  const HILL_PROFILE = [[0,440],[330,440],[352,460],[600,460],[620,478],[880,478],[905,502],[1150,502],[1172,478],[1290,478],[1312,458],[1378,458],[1400,440]];
  function hillY(x) {
    const m = ((x % HILL_W) + HILL_W) % HILL_W;
    for (let i = 1; i < HILL_PROFILE.length; i++) { const a = HILL_PROFILE[i - 1], b = HILL_PROFILE[i]; if (m <= b[0]) return a[1] + (b[1] - a[1]) * ((m - a[0]) / (b[0] - a[0])); }
    return HILL_PROFILE[0][1];
  }
  const HILL_PLATS = [];
  for (let o = 0; o < 4200; o += HILL_W) HILL_PLATS.push([o + 165, 330, 120], [o + 655, 420, 90], [o + 1185, 348, 120]);
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
      if (p[0] + p[2] < x0 || p[0] > x1) continue;
      const x = p[0], y = p[1], w = p[2];
      if (w <= 95) {
        const base = hillY(x + w / 2);
        ctx.fillStyle = '#4c4478'; ctx.fillRect(x, y + 6, w, base - y - 6);
        ctx.strokeStyle = 'rgba(16,10,32,.45)'; ctx.lineWidth = 1; for (let yy = y + 18; yy < base; yy += 14) for (let xx = x + ((yy / 14) % 2 ? 0 : 15); xx < x + w; xx += 30) ctx.strokeRect(xx, yy, 30, 14);
        ctx.fillStyle = '#6a62a0'; ctx.fillRect(x - 4, y - 2, w + 8, 10);
      } else {
        ctx.fillStyle = '#5a3a58'; ctx.beginPath(); ctx.roundRect(x - 3, y - 2, w + 6, 12, 5); ctx.fill();
        ctx.fillStyle = '#4fae8e'; ctx.beginPath(); ctx.roundRect(x - 1, y - 4, w + 2, 5, 3); ctx.fill();
      }
      ctx.strokeStyle = 'rgba(230,220,255,.55)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x, y - 2); ctx.lineTo(x + w, y - 2); ctx.stroke();
    }
    for (const spot of scratchSpots) { if (spot.x < x0 - 60 || spot.x > x1 + 60) continue; drawScratchSpot(spot.x, spot.y, spot.moodType, spot); }
    for (const rock of rocks) { if (rock.x < x0 - 80 || rock.x > x1 + 80) continue; drawRockFormation(rock.x, rock.y, rock, rockHoldsFeeling(rock)); }
  }
  // ---------- Lakeside map (Nights 6-7) ----------
  // Painted entirely in code: dawn sky that warms up (and on Night 7 the sun rises as the timer runs),
  // mountains, a lake with the sun's reflection, a rowboat, then the shore path, reed beds (Calm's
  // hiding places) and wooden jetties (platforms).
  const LAKE_NIGHTS = [6, 7];
  function inLake() { return mode === 'story' && LAKE_NIGHTS.includes(storyNight); }
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
    // reed beds (Calm's hiding places)
    for (const rx of CAVE_XS) {
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
      if (pl[0] + pl[2] < x0 || pl[0] > x1) continue;
      const x = pl[0], y = pl[1], w = pl[2];
      ctx.fillStyle = '#3a2830';
      for (const px of [x + 8, x + w / 2 - 3, x + w - 14]) ctx.fillRect(px, y + 8, 6, GROUND - y - 8);
      const wood = ctx.createLinearGradient(0, y - 2, 0, y + 11); wood.addColorStop(0, '#b4876a'); wood.addColorStop(.4, '#7d5444'); wood.addColorStop(1, '#45293a');
      ctx.fillStyle = wood; ctx.beginPath(); ctx.roundRect(x - 3, y - 2, w + 6, 12, 3); ctx.fill();
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
  function inPark() { return mode === 'story' && PARK_NIGHTS.includes(storyNight); }
  // ---------- Lighting festival map (Night 4) ----------
  // Far back: sky + pagoda hill picture (barely moves). Middle: palm and roof silhouettes in code.
  // Front: boardwalk over dark water, stalls (hiding spots), a few lantern strings, raised decks.
  const FESTIVAL_NIGHTS = [4];
  const FEST_BACK = new Image();
  FEST_BACK.src = 'assets/festival/festival-back.webp';
  const FEST_COLORS = ['255,156,207', '185,162,255', '143,227,224', '255,227,163', '255,143,163', '160,200,255'];
  const FEST_CLOTH = ['#7b2d8e', '#b8336a', '#1f7f86', '#3a5fc0', '#8e3fb0', '#2f8f5e'];
  const festCol = i => FEST_COLORS[((Math.floor(i) % FEST_COLORS.length) + FEST_COLORS.length) % FEST_COLORS.length];
  function inFestival() { return mode === 'story' && FESTIVAL_NIGHTS.includes(storyNight); }
  const NIGHT_CHAPTERS = [
    { night: 1, name: 'First Night', sub: 'Learn to dodge Frustrated', theme: '#7893bb', musicRoot: 196, timeLimit: 120, rareChance: 0, feelingsNeeded: { F: 3 }, newMoodling: 'Frustrated charges when you get close; dodge, then pounce while it is dizzy', diary: 'She stopped crying in her sleep. That is something.', moodlingSpeed: .65, frustratedChargeSpeed: .60, frustratedWindup: 1.10, nervousHearingMul: 1, nervousPanicTime: 1.1, initialSpawns: { F: 1, N: 0, L: 0, C: 0 }, respawnDelay: 3.5, goldensAllowed: 0, chaosWave: false, chaosSize: {}, tutorialHints: true, tutorialHint: 'Frustrated charges when you get close. Dodge, then pounce while it is dizzy.' , sky: { A: 0, B: 0, C: 0, wait: 2.0, fallSpeed: 90, gravity: 900, scratchWindow: 1.6, ambushBase: 2, pounceWindowMul: 1.0, hintShown: false }},
    { night: 2, name: 'The Winners’ Wall', sub: 'Move quietly around Nervous, and watch for Jealous', theme: '#8e78ae', musicRoot: 207.65, timeLimit: 130, rareChance: 0, feelingsNeeded: { F: 3, N: 3, J: 1 }, newMoodling: 'Nervous hears running; sneak or walk slowly, then pounce. Jealous steals lights from your trail; catch it when it is tired.', diary: 'She turned a little toward the window.', moodlingSpeed: .75, frustratedChargeSpeed: .70, frustratedWindup: .95, nervousHearingMul: .70, nervousPanicTime: .80, nervousAlarmThreshold: .55, initialSpawns: { F: 1, N: 1, L: 0, C: 0, J: 1 }, respawnDelay: 3.2, goldensAllowed: 0, chaosWave: false, chaosSize: {}, tutorialHints: true, tutorialHint: 'Nervous hears you running. Sneak with Shift. Watch out: Jealous steals trail lights. Catch it when it is tired.' , sky: { A: 1, B: 0, C: 0, wait: 2.5, fallSpeed: 70, gravity: 900, scratchWindow: 1.6, ambushBase: 2, pounceWindowMul: 1.0, hintShown: false }},
    { night: 3, name: 'The Park', sub: 'Sit still beside Lonely, and freeze when Shy peeks', theme: '#628aa0', musicRoot: 220, timeLimit: 130, rareChance: .05, feelingsNeeded: { F: 3, N: 3, L: 2, S: 2 }, newMoodling: 'Lonely stays visible; walk slowly, then sit still beside it. Shy peeks back: freeze when it looks, move when it hides its face.', diary: 'Her hand found Shwe in the dark.', moodlingSpeed: .85, frustratedChargeSpeed: .80, frustratedWindup: .85, nervousHearingMul: .80, nervousPanicTime: .90, initialSpawns: { F: 2, N: 1, L: 0, C: 0, S: 1 }, respawnDelay: 3.0, goldensAllowed: 0, chaosWave: false, chaosSize: {}, tutorialHints: true, tutorialHint: 'Lonely hides in the open. Sit still beside it. Shy peeks back: freeze when it looks, move when it hides its face.' , sky: { A: 2, B: 1, C: 0, wait: 2.2, fallSpeed: 85, gravity: 800, scratchWindow: 1.6, ambushBase: 2, pounceWindowMul: 1.20, hintShown: false }},
    { night: 4, name: 'Lighting Festival', sub: 'Scratch to reveal what is buried', theme: '#c17679', musicRoot: 233.08, timeLimit: 122, rareChance: .14, feelingsNeeded: { F: 4, N: 3, L: 2, B: 1, E: 2 }, newMoodling: 'A feeling is buried under the rocks: use Night Eyes to spot the right rock, then scratch it. Excited bounces high: pounce at the top of its bounce.', diary: 'She dreamed of the drawing, not the tearing.', moodlingSpeed: .95, frustratedChargeSpeed: .90, frustratedWindup: .75, nervousHearingMul: .90, nervousPanicTime: 1.00, initialSpawns: { F: 2, N: 2, L: 0, C: 0, B: 1, E: 1 }, respawnDelay: 2.8, goldensAllowed: 1, chaosWave: false, chaosSize: {}, tutorialHints: true, tutorialHint: 'Something is buried under the rocks. Press E for Night Eyes, then scratch the glowing rock. Excited bounces high: pounce at the top.' , sky: { A: 2, B: 1, C: 1, wait: 2.0, fallSpeed: 100, gravity: 900, scratchWindow: 2.0, ambushBase: 2, pounceWindowMul: 1.10, hintShown: false }},
    { night: 5, name: 'Hilltop Park', sub: 'Climb the old park above the sleeping city', theme: '#7181aa', musicRoot: 246.94, timeLimit: 117, rareChance: .22, feelingsNeeded: { F: 5, N: 4, L: 3, B: 1, J: 2 }, newMoodling: 'Up on the hill, sparkling Golden feelings appear more often; they are worth extra Glow', diary: 'Almost a smile.', moodlingSpeed: 1.10, frustratedChargeSpeed: 1.05, frustratedWindup: .65, nervousHearingMul: 1.00, nervousPanicTime: 1.10, initialSpawns: { F: 3, N: 2, L: 1, C: 0, B: 1, J: 1 }, respawnDelay: 2.5, goldensAllowed: 2, chaosWave: true, chaosSize: { F: 1, N: 1 }, tutorialHints: false, tutorialHint: 'Golden feelings sparkle more often up here. They are worth extra Glow.' , sky: { A: 3, B: 2, C: 1, wait: 1.6, fallSpeed: 115, gravity: 1000, scratchWindow: 1.7, ambushBase: 2, pounceWindowMul: 1.00, hintShown: false }},
    { night: 6, name: 'Lakeside', sub: 'Meet Calm for the first time', theme: '#729579', musicRoot: 261.63, timeLimit: 125, rareChance: .22, feelingsNeeded: { F: 4, N: 4, L: 2, C: 2, B: 2, S: 2, E: 1 }, newMoodling: 'Calm hides in the reeds; find the marked reed bed, scratch, then sit quietly', diary: 'She murmured something kind.', moodlingSpeed: 1.15, frustratedChargeSpeed: 1.10, frustratedWindup: .60, nervousHearingMul: 1.05, nervousPanicTime: 1.15, initialSpawns: { F: 3, N: 3, L: 1, C: 1, B: 1, S: 1, E: 1 }, respawnDelay: 2.3, goldensAllowed: 2, chaosWave: true, chaosSize: { F: 2, N: 1 }, tutorialHints: false, tutorialHint: 'Calm hides in the reeds. Scratch the marked reed bed, then sit quietly.' , sky: { A: 3, B: 2, C: 2, wait: 1.4, fallSpeed: 130, gravity: 1100, scratchWindow: 1.4, ambushBase: 2, pounceWindowMul: 0.92, hintShown: false }},
    { night: 7, name: 'Sunrise', sub: 'Bring every feeling home before the sun rises', theme: '#d6a866', musicRoot: 293.66, timeLimit: 135, rareChance: .30, feelingsNeeded: { F: 5, N: 5, L: 3, C: 3, B: 2, E: 2, S: 1, J: 2 }, newMoodling: 'Every mechanic returns for the finale', diary: 'Morning.', moodlingSpeed: 1.25, frustratedChargeSpeed: 1.20, frustratedWindup: .55, nervousHearingMul: 1.10, nervousPanicTime: 1.20, initialSpawns: { F: 3, N: 3, L: 2, C: 1, B: 1, E: 1, S: 1, J: 1 }, respawnDelay: 2.0, goldensAllowed: 2, chaosWave: true, chaosSize: { F: 2, N: 2 }, tutorialHints: false, tutorialHint: 'Everything returns tonight. Keep calm and bring every feeling home.' , sky: { A: 4, B: 3, C: 3, wait: 1.1, fallSpeed: 145, gravity: 1200, scratchWindow: 1.1, ambushBase: 2, pounceWindowMul: 0.85, hintShown: false }}
  ];
  const PERCH_BUDGET = { 1: 12, 2: 10, 3: 9, 4: 8, 5: 6, 6: 4, 7: 2 };
  function activePlatsForNight(night) {
    if (mode === 'story' && HILL_NIGHTS.includes(night)) return HILL_PLATS;
    if (mode !== 'story') return plats;
    const budget = PERCH_BUDGET[night] ?? plats.length;
    if (budget >= plats.length) return plats;
    const step = (plats.length - 1) / Math.max(1, budget - 1);
    const kept = [];
    for (let i = 0; i < budget; i++) kept.push(plats[Math.round(i * step)]);
    return kept;
  }
  const chapterFor = night => NIGHT_CHAPTERS[clamp(night - 1, 0, NIGHT_CHAPTERS.length - 1)];
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
  try { unlockedLevel = clamp(Math.floor(+localStorage.getItem('mk-progress') || 1), 1, 7); } catch (e) {}
  try { thiriSleepStage = clamp(Math.floor(+localStorage.getItem('mk-thiri') || 0), 0, 7); } catch (e) {}
  try { finalAwakeningSeen = localStorage.getItem('mk-awakening-seen') === '1'; } catch (e) {}
  function saveStoryProgress() {
    try { localStorage.setItem('mk-progress', String(unlockedLevel)); localStorage.setItem('mk-thiri', String(thiriSleepStage)); } catch (e) {}
  }
  const moonHollow = () => mode === 'story' && storyNight === 7;
  const SKY_TUTORIALS = {
    A: 'A feeling is falling. Wait for it to land, then pounce.',
    B: 'Hit it mid-air! Pounce while it is falling.',
    C: 'Pounce it mid-air, then scratch with S before it escapes.'
  };
  let skyTutorialSeen = {};
  try { const saved = JSON.parse(localStorage.getItem('mk-skyTutorial') || '{}'); if (saved && typeof saved === 'object' && !Array.isArray(saved)) skyTutorialSeen = saved; } catch (e) {}
  function showSkyTutorial(feature) {
    if (skyTutorialSeen[feature]) return;
    skyTutorialSeen[feature] = true;
    try { localStorage.setItem('mk-skyTutorial', JSON.stringify(skyTutorialSeen)); } catch (e) {}
    announce(SKY_TUTORIALS[feature], feature === 'C' ? RED : feature === 'B' ? GOLD : BLUE, 2.8);
  }
  function skyTotalFor(chapter) { return chapter?.sky ? chapter.sky.A + chapter.sky.B + chapter.sky.C : 0; }
  function skyRemaining(chapter = chapterFor(storyNight)) {
    if (!chapter?.sky) return 0;
    return ['A', 'B', 'C'].reduce((sum, feature) => sum + Math.max(0, chapter.sky[feature] - skyUsed[feature]), 0);
  }

  // ---------- upgrades (Glow treats) ----------
  const UPG = [
    { id: 'pounce', name: 'Pounce', desc: 'A bigger, more forgiving pounce.', costs: [50, 150, 400], vals: [46, 54, 62, 72], fmt: v => `catch reach ${v}` },
    { id: 'swift', name: 'Swift paws', desc: 'Run faster across the Night Side.', costs: [60, 180, 400], vals: [6, 6.6, 7.2, 7.8], fmt: v => `${v} tiles per second` },
    { id: 'paws', name: 'Soft paws', desc: 'Nervous Moodlings hear you from less far away.', costs: [100, 250, 500], vals: [5, 4, 3.2, 2.5], fmt: v => `heard from ${v} tiles` },
    { id: 'eyes', name: 'Night eyes', desc: 'Press E (or the Eyes button) to highlight nearby scratch spots. Upgrades let Shwe find them from further away.', costs: [80, 200, 450], vals: [4, 5, 6, 7], fmt: v => `see ${v} tiles` },
    { id: 'purr', name: 'Purr', desc: 'Press K (or the Purr button) to slow nearby Moodlings for 3 seconds.', costs: [120, 300, 600], vals: [0, 15, 10, 6], fmt: v => v ? `${v}s cooldown` : 'not unlocked' }
  ];
  let upg = { pounce: 0, swift: 0, paws: 0, eyes: 0, purr: 0 }, glow = 0, glowRun = 0, lastGlow = 0;
  try {
    const s = JSON.parse(localStorage.getItem('mk-upg') || '{}');
    for (const k in upg) if (Number.isInteger(s[k])) upg[k] = clamp(s[k], 0, 3);
    glow = Math.max(0, +localStorage.getItem('mk-glow') || 0);
  } catch (e) {}
  function saveUpg() { try { localStorage.setItem('mk-upg', JSON.stringify(upg)); localStorage.setItem('mk-glow', String(glow)); } catch (e) {} }
  const uv = id => UPG.find(u => u.id === id).vals[upg[id]];
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
    C: [{ n: 'Calm', c: '#7ddc8b', r: 'Story', d: 'Scratch a marked reed bed, then sit quietly beside Calm.', lock: 'Meet it in the reeds on Night 6.' }],
    B: [
      { n: 'Buried', c: '#a67646', r: 'Common', d: 'Hides deep under a rock. Reveal it with Night Eyes, then scratch the marked rock. A wrong rock shakes the ground.', line: '“I put it somewhere deep so I wouldn’t have to look at it.”' },
      { n: 'Petrified Buried', c: '#8c5a3a', r: 'Rare', d: 'So deep it has almost turned to stone. Same scratch rules.', line: '“It was easier to be numb than to feel it.”' },
      { n: 'Fossil Buried', c: '#c8a56a', r: 'Rare', d: 'Leaves a faint amber trail when it flees.', line: '“Some things stay with you even after you bury them.”' }
    ]
  };
  const BOOK_ORDER = ['F0', 'F1', 'F2', 'N0', 'N1', 'N2', 'L0', 'L1', 'L2', 'B0', 'B1', 'B2', 'E0', 'S0', 'J0', 'C0', 'G0'];
  let book = {};
  try { book = JSON.parse(localStorage.getItem('mk-book') || '{}') || {}; } catch (e) { book = {}; }
  const saveBook = () => { try { localStorage.setItem('mk-book', JSON.stringify(book)); } catch (e) {} };
  const vinfo = (ty, v = 0) => VARS[ty][v] || VARS[ty][0];
  const vcol = (ty, v = 0) => vinfo(ty, v).c;
  let runNew = [], runDone = [], runN = 0;

  // ---------- Daily missions ----------
  const MISSIONS = [
    { id: 'catchF', text: 'Catch 6 Frustrated Moodlings', goal: 6, reward: 50 },
    { id: 'catchN', text: 'Catch 5 Nervous Moodlings', goal: 5, reward: 50 },
    { id: 'catchL', text: 'Bring home 3 Lonely Moodlings', goal: 3, reward: 60 },
    { id: 'combo4', text: 'Reach a ×4 combo', goal: 1, reward: 60 },
    { id: 'quietN', text: 'Catch 3 Nervous in one run without startling any', goal: 1, reward: 80 },
    { id: 'golden', text: 'Catch a Golden Moodling', goal: 1, reward: 50 },
    { id: 'survive', text: 'Last 90 seconds in Free Mode', goal: 1, reward: 70 },
    { id: 'nohit', text: 'Finish Story Night 1 without being hit', goal: 1, reward: 80 },
    { id: 'rare', text: 'Catch a rare Moodling (look for sparkles)', goal: 1, reward: 70 },
    { id: 'glow', text: 'Earn 150 Glow today', goal: 150, reward: 40 }
  ];
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const mdef = id => MISSIONS.find(m => m.id === id);
  let ms = null;
  function saveMissions() { try { localStorage.setItem('mk-missions', JSON.stringify(ms)); } catch (e) {} }
  function loadMissions() {
    try { ms = JSON.parse(localStorage.getItem('mk-missions') || 'null'); } catch (e) { ms = null; }
    if (!ms || ms.date !== today() || !Array.isArray(ms.ids)) {
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
      if (state === 'play' || state === 'ending') { announce('Mission complete!', GOLD, 1.6); tone(880, .2, 'triangle', .06); setTimeout(() => tone(1175, .3, 'sine', .05), 120); }
    }
  }
  loadMissions();
  let need = { F: 4, N: 4, L: 2 }, got = { F: 0, N: 0, L: 0 }, hits = 0, startles = 0, goldDone = { a: false, b: false }, lastTick = 99;
  const requiredTotal = () => Object.values(need).reduce((sum, n) => sum + n, 0);
  const caughtTotal = () => Object.values(got).reduce((sum, n) => sum + n, 0);
  let cat, mood = [], parts = [], floats = [], trail = [], hist = [], camX = 0, respawnQ = [], banner = null;
  let scratchSpots = [], scratchTarget = null, scratchAnim = 0, rocks = [], buriedHome = null, shake = 0;
  let skyUsed = { A: 0, B: 0, C: 0 }, skyPerfect = 0, skySpawned = 0, skyNextAt = 15;
  const ROCK_XS = [560, 1120, 1680, 2260, 2520, 2860, 3180, 3560, 3940];

  function newCat() { return { x: 200, y: terrainY(200), vx: 0, vy: 0, on: true, face: 1, pounce: 0, pcd: 0, inv: 0, squash: 0, walk: 0, sneak: false, justLanded: false, bounced: false }; }
  function pickX() { let x, n = 0; do { x = 150 + Math.random() * (WORLD - 300); n++; } while (Math.abs(x - cat.x) < 380 && n < 40); return x; }
  function pickCaveX() {
    const occupied = new Set(mood.filter(m => !m.dead && m.caveX != null).map(m => m.caveX));
    const open = CAVE_XS.filter(x => !occupied.has(x));
    const distant = open.filter(x => Math.abs(x - cat.x) > 220);
    const pool = distant.length ? distant : open.length ? open : CAVE_XS;
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
    const inCave = mode === 'story' && ((m.type === 'C' && storyNight >= 6) || (m.type === 'L' && storyNight === 7));
    m.x = x ?? (inCave ? pickCaveX() : pickX()); m.caveX = inCave ? m.x : null;
    m.y = terrainY(m.x) - (m.type === 'C' ? 46 : 30); m.st = 0; m.sit = 0; m.rev = 0; m.fleeAlarm = 0;
    const tutorialLonely = m.type === 'L' && mode === 'story' && storyNight <= 3;
    m.alpha = tutorialLonely ? 1 : 0; m.state = tutorialLonely ? 'revealed' : 'hide';
    m.spot = tutorialLonely ? null : makeScratchSpot(m.x, m.type);
  }
  function spawn(type, x) {
    const hidesInCave = type === 'C' || (type === 'L' && moonHollow());
    x = x ?? (hidesInCave ? pickCaveX() : pickX());
    const m = { type, x, y: 0, dir: Math.random() < .5 ? -1 : 1, phase: Math.random() * 6, alpha: 1, cd: 1 + Math.random(), st: 0, alarm: 0, state: '', home: x, dead: false, life: 0, caveX: hidesInCave ? x : null, sky: false, skyFeature: null, skyPhase: 'ground', skyTimer: 0, skyStartY: 0, skyTargetY: 0, skyVY: 0, skyHit: false, scratchNeed: 0, ambushWave: [], hitCooldown: 0, skyGroundStun: 0 };
    const rareChance = mode === 'story' ? chapterFor(storyNight).rareChance : .1;
    m.v = (type === 'F' || type === 'N' || type === 'L' || type === 'B') && Math.random() < rareChance ? (Math.random() < .5 ? 1 : 2) : 0;
    if (type === 'F') { m.y = terrainY(x) - 20; m.state = 'patrol'; }
    if (type === 'N') { m.y = terrainY(x) - 46; m.state = 'wander'; }
    if (type === 'G') { m.y = 200; m.state = 'fly'; m.life = 6.5; }
    if (type === 'E') { m.y = terrainY(x) - 24; m.vy = 0; m.state = 'squash'; m.st = .3; m.bounces = 0; m.apex = false; }
    if (type === 'S') { m.y = terrainY(x) - 26; m.state = 'walk'; m.st = 2 + Math.random() * 1.5; }
    if (type === 'J') { m.y = terrainY(x) - 30; m.state = 'wander'; m.cd = 3; m.stolen = []; }
    if (type === 'B') { const rock = rocks.find(r => r.marked) || rocks[0]; m.x = rock.x; m.y = rock.y - 12; m.state = 'buried'; m.alpha = 0; m.rock = rock; m.chime = 0; }
    if (type === 'L' || type === 'C') {
      m.y = terrainY(x) - (type === 'C' ? 46 : 30); m.st = 0; m.rev = 0; m.sit = 0; m.chime = 0; m.fleeAlarm = 0;
      const tutorialLonely = type === 'L' && mode === 'story' && storyNight <= 3;
      m.state = tutorialLonely ? 'revealed' : 'hide'; m.alpha = tutorialLonely ? 1 : 0; m.spot = tutorialLonely ? null : makeScratchSpot(x, type);
    }
    mood.push(m); return m;
  }
  function skyTypeFor(feature) {
    const choices = feature === 'A' ? ['N', 'L'] : feature === 'B' ? ['E', 'J'] : ['F'];
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
    activePlats = activePlatsForNight(storyNight);
    const chapter = mode === 'story' ? chapterFor(storyNight) : null;
    t = 0; warmup = mode === 'free' ? 0 : 1.5; frustWakeAt = warmup + FRUST_SLEEP; timeLeft = mode === 'free' ? 60 : chapter.timeLimit; score = 0; freeT = 0; level = 0;
    nextGold = 18; caughtN = 0; glowRun = 0; purrT = 0; purrCd = 0; purrQ = false; eyesT = 0; eyesCd = 0; eyesQ = false;
    combo = 0; comboT = 0; bestCombo = 1; hitstop = 0; slowmo = 0; chaos = false; endT = 0;
    need = mode === 'story' ? { ...chapter.feelingsNeeded } : { F: 4, N: 4, L: 2 };
    got = Object.fromEntries(Object.keys(need).map(type => [type, 0])); runN = 0; runNew = []; runDone = []; hits = 0; startles = 0;
    goldDone = { a: false, b: false }; skyUsed = { A: 0, B: 0, C: 0 }; skyPerfect = chapter ? skyTotalFor(chapter) : 0; skySpawned = 0; skyNextAt = 15; lastTick = 99; cat = newCat(); mood = []; parts = []; floats = []; trail = []; hist = []; respawnQ = []; camX = 0;
    scratchSpots = []; scratchTarget = null; scratchAnim = 0; scratchQ = false; shake = 0;
    rocks = mode === 'story' ? ROCK_XS.map(x => ({ x, y: terrainY(x), marked: false, scratched: false, wrongUsed: false, phase: Math.random() * Math.PI * 2, holeDepth: 0 })) : [];
    buriedHome = null;
    if (need.B > 0) { buriedHome = rocks[Math.floor(Math.random() * rocks.length)]; buriedHome.marked = true; }
    if (mode === 'free') {
      goldDone = { a: true, b: true }; chaos = true;
      [700, 1000, 1350, 1650, 2050, 2300].forEach((x, i) => spawn(i % 2 ? 'N' : 'F', x));
      [1180, 2480].forEach(x => spawn('L', x));
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
    float(m.x, m.y - 34, 'Startled!', VIOLET); tone(900, .15, 'square', .03, 400);
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
    combo = 0; comboT = 0; tone(90, .3, 'sawtooth', .08, -40);
    shake = Math.max(shake, m.ambush ? 16 : 10);
    if (mode === 'free') { timeLeft = Math.max(0, timeLeft - 3); float(cat.x, cat.y - 88, '−3s', RED); }
    if (m.ambush) {
      const n = clamp((storyNight || 1) - 3, 1, 3);
      const dropped = detachTrail(n);
      float(cat.x, cat.y - 100, `−${dropped} feeling${dropped === 1 ? '' : 's'}`, RED);
      if (mode === 'story') timeLeft = Math.max(0, timeLeft - 2);
      announce("The angry ground tore a light away", RED, 1.6);
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
      if (type === 'F') { amb.state = 'windup'; amb.st = .4; }
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
    if (m.ambush) {
      const gain = 8 + 2 * combo;
      glowRun += gain; bump('glow', gain);
      m.dead = true; m.alpha = 0; hitstop = .05;
      burst(m.x, m.y, col(m.type), 18);
      float(m.x, m.y - 36, `+${gain} Glow · ambush cleared`, col(m.type));
      tone(660, .18, 'triangle', .08);
      return;
    }
    if (mode === 'story' && m.type !== 'G' && got[m.type] >= need[m.type]) {
      float(m.x, m.y - 34, 'Not needed tonight  −3s', MUTED);
      timeLeft = Math.max(0, timeLeft - 3); combo = 0; comboT = 0;
      if (m.type === 'N') panic(m, cat.x - m.x);
      else if (m.type === 'L' || m.type === 'C') hideFeeling(m);
      else if (m.type === 'B') { if (m.rock) m.rock.scratched = false; m.dead = false; m.state = 'buried'; m.alpha = 0; m.rock = buriedHome; m.x = buriedHome.x; m.y = buriedHome.y - 12; m.chime = 0; }
      else if (m.type === 'S') { m.state = 'hide'; m.st = 2; }
      else if (m.type === 'E' || m.type === 'J') { if (m.type === 'J') { m.state = 'wander'; m.cd = 4; } }
      else { m.state = 'patrol'; m.cd = 2; m.home = m.x; }
      tone(200, .2, 'sine', .05, -80); return;
    }
    if (m.sky) { m.skyPhase = 'cleared'; m.skyTimer = 0; }
    combo = comboT > 0 ? Math.min(5, combo + 1) : 1; comboT = 4; bestCombo = Math.max(bestCombo, combo);
    const pts = { F: 100, N: 120, L: 150, C: 180, B: 160, E: 140, S: 150, J: 170, G: 500 }[m.type] * combo; score += pts;
    const gain = { F: 10, N: 12, L: 14, C: 16, B: 13, E: 13, S: 14, J: 16, G: 40 }[m.type] + 2 * (combo - 1);
    glowRun += gain; bump('glow', gain);
    caughtN++;
    if (m.type === 'G') { timeLeft += 5; slowmo = .6; announce('Golden catch! +5 seconds', GOLD, 1.4); }
    else if (mode === 'free') { timeLeft += 2; trail.push({ type: m.type, v: m.v, x: m.x, y: m.y }); if (trail.length > 12) trail.shift(); }
    else { const chapter = chapterFor(storyNight); if (Object.prototype.hasOwnProperty.call(got, m.type)) { got[m.type]++; if (got[m.type] < need[m.type]) respawnQ.push({ type: m.type, at: chapter.respawnDelay + Math.random() * .8 }); } trail.push({ type: m.type, v: m.v, x: m.x, y: m.y }); if (m.type === 'B' && m.rock) { m.rock.scratched = false; m.rock.holeDepth = 0; } }
    const key = m.type + (m.v || 0), info = vinfo(m.type, m.v || 0);
    if (!book[key]) {
      const bonus = m.v ? 30 : m.type === 'G' ? 20 : 10;
      glowRun += bonus; bump('glow', bonus); runNew.push(info.n);
      announce(`New in the Mood Book: ${info.n}  +${bonus} Glow`, info.c, 2.2);
    }
    book[key] = (book[key] || 0) + 1; saveBook();
    if (m.type === 'F' || m.type === 'N' || m.type === 'L') bump('catch' + m.type);
    if (m.type === 'N') runN++;
    if (m.type === 'G') bump('golden');
    if (m.v) bump('rare');
    if (combo >= 4) bump('combo4');
    m.dead = true; hitstop = .07;
    burst(m.x, m.y, col(m.type), m.type === 'G' ? 40 : 22);
    float(m.x, m.y - 36, `+${pts}${combo > 1 ? '  ×' + combo : ''}${mode === 'free' && m.type !== 'G' ? '  +2s' : ''}`, col(m.type));
    const f = 523.25 * Math.pow(2, (combo - 1) * 2 / 12);
    tone(f, .18, 'triangle', .09); setTimeout(() => tone(f * 1.5, .22, 'sine', .07), 70);
    if (mode === 'story' && Object.entries(need).every(([type, count]) => got[type] >= count) && state === 'play') { state = 'ending'; endT = 1.1; announce(moonHollow() ? 'The sun is up. Every feeling is home!' : 'All feelings found!', GOLD, 1.2); }
  }

  function updCat(dt) {
    const c = cat; c.justLanded = false;
    const a = axisNow(), sneaking = a !== 0 && Math.abs(a) < .55;
    const target = a === 0 ? 0 : Math.sign(a) * (sneaking ? 2 * T : uv('swift') * T);
    c.sneak = sneaking;
    if (c.pounce > 0) c.pounce -= dt;
    else { const acc = c.on ? 2600 : 1500; c.vx += clamp(target - c.vx, -acc * dt, acc * dt); if (a) c.face = Math.sign(a); }
    if (jumpQ && c.on && c.pounce <= 0) { c.vy = -830; c.on = false; tone(380, .12, 'triangle', .05, 240); }
    jumpQ = false;
    if (pounceQ && c.pcd <= 0) { c.pounce = .3; c.pcd = .55; c.bounced = false; c.vx = c.face * 560; c.vy = c.on ? -360 : Math.min(c.vy, -220); c.on = false; tone(240, .1, 'square', .035, 320); }
    pounceQ = false;
    c.pcd -= dt; c.inv -= dt; c.squash = Math.max(0, c.squash - dt);
    const wasOn = c.on, py = c.y, wasOnTrail = wasOn && Math.abs(c.y - terrainY(c.x)) < 2;
    c.vy += 2300 * dt; c.x += c.vx * dt; c.y += c.vy * dt; c.x = clamp(c.x, 30, WORLD - 30);
    let landed = false;
    const floorY = terrainY(c.x);
    if (c.y >= floorY || (wasOnTrail && c.vy >= 0)) { c.y = floorY; landed = true; }
    else if (c.vy >= 0) { for (const p of activePlats) { if (c.x > p[0] - 6 && c.x < p[0] + p[2] + 6 && py <= p[1] + .5 && c.y >= p[1]) { c.y = p[1]; landed = true; break; } } }
    if (landed) { if (!wasOn) { c.justLanded = true; if (c.vy > 500) c.squash = .16; } c.vy = 0; }
    c.on = landed;
    if (c.on && Math.abs(c.vx) > 10) c.walk += dt * Math.abs(c.vx) / 30;
  }

  function updMood(m, dt) {
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
        if (!asleep && m.slept === 1) { m.slept = 2; float(m.x, m.y - 46, 'grr!', RED); tone(140, .25, 'sawtooth', .025, -30); }
        if (!asleep) m.x += m.dir * 55 * dt * sp; if (Math.abs(m.x - m.home) > 140) m.dir = Math.sign(m.home - m.x) || 1;
        m.x = clamp(m.x, 40, WORLD - 40); m.cd -= dt;
        if (m.cd <= 0 && t >= frustWakeAt && Math.abs(dx) < 4 * T && Math.abs(dy) < 90) { m.state = 'windup'; m.st = chapter.frustratedWindup; m.dir = Math.sign(dx) || 1; tone(120, .45, 'sawtooth', .035, -40); }
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
        if (cat.inv <= 0 && Math.abs(dx) < 34 && Math.abs(dy) < 46) {
          if (storyNight <= 3 && cat.sneak) { m.state = 'dizzy'; m.st = 3; float(m.x, m.y - 40, 'Dizzy! Pounce now', RED); }
          else { hitCat(m); m.state = 'patrol'; m.cd = 2.2; m.home = m.x; }
        }
        else if (m.st <= 0) { m.state = 'dizzy'; m.st = 3; tone(660, .3, 'triangle', .05, -300); float(m.x, m.y - 40, 'Dizzy! Pounce now', RED); }
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
      if (m.state === 'buried') { m.alpha = 0; if (Math.abs(cat.x - m.x) < 4 * T) { m.chime -= dt; if (m.chime <= 0) { m.chime = 1.6; tone(440, .12, 'sine', .025); } } }
      else if (m.state === 'scratching') { m.alpha = 0; m.st -= dt; if (m.st <= 0) { m.state = 'emerging'; m.st = .5; rock.holeDepth = 0; } }
      else if (m.state === 'emerging') { m.alpha = Math.min(1, m.alpha + dt * 2.4); m.st -= dt; rock.holeDepth = Math.min(1, rock.holeDepth + dt * 2); if (m.st <= 0) { m.state = 'revealed'; m.alpha = 1; } }
      else if (m.state === 'revealed') { rock.holeDepth = 1; }
    } else if (m.type === 'L' || m.type === 'C') {
      const dx = cat.x - m.x, moodColor = m.type === 'C' ? CALM : BLUE, floorY = terrainY(m.x);
      if (m.state === 'hide') { m.alpha = 0; m.sit = 0; }
      else if (m.state === 'scratching') {
        m.st -= dt;
        if (m.st <= 0) { m.state = 'emerging'; m.st = .38; m.alpha = .04; m.spot.used = true; m.spot.usedAt = t; m.spot.scratching = false; burst(m.x, floorY - 22, m.type === 'C' ? '#a8e7a3' : '#c8a47a', 14); float(m.x, floorY - 68, m.type === 'C' ? 'A quiet glow!' : 'Someone was hiding here', moodColor); tone(m.type === 'C' ? 740 : 988, .2, 'sine', .045); }
      } else if (m.state === 'emerging') {
        m.alpha = Math.min(1, m.alpha + dt * 2.7); m.st -= dt;
        if (m.st <= 0) { m.state = 'revealed'; m.alpha = 1; tone(m.type === 'C' ? 988 : 1318, .24, 'sine', .035); }
      } else if (m.state === 'revealed' || m.state === 'flee') {
        m.y = floorY - (m.type === 'C' ? 46 : 30) + Math.sin(t * 2 + m.phase) * 4;
        if (m.state === 'revealed' && m.type === 'L') {
          const close = Math.abs(dx) < 115, startled = !cat.on || cat.justLanded || Math.abs(cat.vx) > 110;
          m.fleeAlarm = close && startled ? m.fleeAlarm + dt : Math.max(0, m.fleeAlarm - dt * 1.8);
          if (m.fleeAlarm > .48) { m.state = 'flee'; m.st = .72; m.dir = -(Math.sign(dx) || 1); m.sit = 0; float(m.x, m.y - 36, 'Lonely darted away!', BLUE); tone(840, .16, 'sine', .035, -300); }
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
            if (m.sit >= 2) { m.sit = 0; catchIt(m); }
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
        if (Math.abs(dx) < 6 * T && moving && t >= 3) { m.state = 'hide'; m.st = 2.2; float(m.x, m.y - 40, 'Shy saw you move and hid!', SHY); tone(700, .15, 'sine', .035, -250); startles++; }
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
          float(cat.x, cat.y - 84, 'Jealous stole a light!', JEAL); tone(300, .2, 'sawtooth', .04, -150);
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
      if (Math.hypot(m.x - cx, m.y - cy) > uv('pounce')) continue;
      if (m.type === 'B' && m.state === 'buried') { cat.bounced = true; cat.vx = -cat.face * 260; cat.pounce = 0; float(cat.x, cat.y - 70, 'It’s still buried. Scratch the rock.', '#a67646'); tone(150, .12, 'square', .05); continue; }
      if (m.alpha < .5) continue;
      if (m.type === 'F' && m.state !== 'dizzy') {
        if (!cat.bounced) { cat.bounced = true; cat.vx = -cat.face * 300; cat.pounce = 0; float(m.x, m.y - 40, "Wait until it's dizzy", RED); tone(150, .12, 'square', .05); }
        continue;
      }
      if (m.type === 'L' && mode === 'story' && storyNight === 1) {
        m.state = 'revealed'; m.alpha = 1; m.sit = 0; cat.pounce = 0;
        float(cat.x, cat.y - 70, 'Sit quietly beside Lonely', BLUE); tone(330, .15, 'sine', .035); continue;
      }
      if (m.type === 'L' || m.type === 'C') {
        hideFeeling(m);
        float(cat.x, cat.y - 70, m.type === 'C' ? 'Too quick. Calm slipped back into the reeds' : 'Too fast. It hid again', m.type === 'C' ? CALM : BLUE); tone(300, .2, 'sine', .04, -100);
        continue;
      }
      if (m.type === 'N' && m.state !== 'wander') continue;
      if (m.type === 'E' && !m.apex) {
        if (!cat.bounced) { cat.bounced = true; cat.vx = -cat.face * 260; cat.pounce = 0; float(m.x, m.y - 40, 'Too bouncy! Catch it at the top', EXC); tone(180, .12, 'square', .04); }
        continue;
      }
      if (m.type === 'S' && (m.state === 'look' || m.state === 'hide')) {
        if (m.state === 'look') { m.state = 'hide'; m.st = 2.2; float(m.x, m.y - 40, 'It saw you coming!', SHY); tone(700, .15, 'sine', .035, -250); }
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
    if (freeT >= 90) bump('survive');
    const lv = Math.floor(freeT / 20);
    if (lv > level) { level = lv; announce(`Level ${level + 1} · more feelings are out`, VIOLET, 1.8); tone(660, .2, 'triangle', .05, 200); }
    const pop = mood.filter(m => m.type !== 'G').length, want = Math.min(14, 6 + level * 2);
    const lonely = mood.filter(m => m.type === 'L').length;
    if (pop < want && Math.random() < dt * 2) { const r = Math.random(); spawn(lonely < 2 && r < .2 ? 'L' : level >= 1 && r > .82 ? ['E', 'S', 'J'][Math.floor(Math.random() * 3)] : Math.random() < .5 ? 'F' : 'N'); }
    if (freeT >= nextGold) { nextGold += 25; spawn('G', clamp(cat.x + (Math.random() < .5 ? -1 : 1) * 320, 120, WORLD - 120)); announce('Golden Moodling! +5 seconds', GOLD); tone(1046, .3, 'sine', .06); }
  }
  function update(dt) {
    t += dt;
    shake = Math.max(0, shake - dt * 24);
    updCat(dt);
    const last = hist[hist.length - 1];
    if (!last || Math.hypot(last.x - cat.x, last.y - cat.y) > 3) { hist.push({ x: cat.x, y: cat.y }); if (hist.length > 500) hist.shift(); }
    if (purrQ && upg.purr > 0 && purrCd <= 0) {
      purrT = 3; purrCd = uv('purr');
      float(cat.x, cat.y - 70, 'Purrr…', '#c8ff8a'); tone(110, .7, 'sine', .09, -15); setTimeout(() => tone(165, .6, 'sine', .05, -20), 60);
    }
    purrQ = false; purrT = Math.max(0, purrT - dt); purrCd = Math.max(0, purrCd - dt);
    if (eyesQ && eyesCd <= 0) { eyesT = 4; eyesCd = 9; tone(740, .25, 'sine', .05, 300); }
    eyesQ = false; eyesT = Math.max(0, eyesT - dt); eyesCd = Math.max(0, eyesCd - dt);
    scratchAnim = Math.max(0, scratchAnim - dt);
    checkScratchProximity();
    if (scratchQ) performScratch();
    scratchQ = false;
    for (const m of mood) updMood(m, purrT > 0 && Math.abs(m.x - cat.x) < 6 * T ? dt * .4 : dt);
    checkCatches();
    mood = mood.filter(m => !m.dead);
    for (const r of respawnQ) r.at -= dt;
    respawnQ = respawnQ.filter(r => { if (r.at <= 0) { spawn(r.type); return false; } return true; });
    if (comboT > 0) { comboT -= dt; if (comboT <= 0) combo = 0; }
    if (state === 'play') {
      if (mode === 'story') warmup = Math.max(0, warmup - dt);
      if (warmup <= 0) timeLeft -= dt;
      if (mode === 'free') freeTick(dt);
      const chapter = mode === 'story' ? chapterFor(storyNight) : null;
      if (mode === 'story') maybeSpawnSky();
      if (mode === 'free' || chapter.goldensAllowed > 0) {
        if (!goldDone.a && timeLeft <= 62 && (mode === 'free' || chapter.goldensAllowed >= 1)) { goldDone.a = true; spawn('G', clamp(cat.x + (Math.random() < .5 ? -1 : 1) * 320, 120, WORLD - 120)); announce('A golden Moodling appeared!', GOLD); tone(1046, .3, 'sine', .06); }
        if (!goldDone.b && timeLeft <= 28 && (mode === 'free' || chapter.goldensAllowed >= 2)) { goldDone.b = true; spawn('G', clamp(cat.x + (Math.random() < .5 ? -1 : 1) * 320, 120, WORLD - 120)); announce('Golden Moodling! Catch it!', GOLD); tone(1046, .3, 'sine', .06); }
      }
      if (!chaos && timeLeft <= 15 && (mode === 'free' || chapter.chaosWave)) {
        chaos = true;
        const wave = mode === 'free' ? { F: 1, N: 2 } : chapter.chaosSize;
        for (const [type, count] of Object.entries(wave || {})) for (let i = 0; i < count; i++) spawn(type);
        announce('Last 15 seconds!', RED, 1.6);
      }
      const sec = Math.ceil(timeLeft);
      if (sec <= 10 && sec < lastTick) { lastTick = sec; tone(sec <= 3 ? 1200 : 880, .06, 'square', .03); }
      if (timeLeft <= 0) { timeLeft = 0; finish(false); }
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
    const target = clamp(cat.x - VW * .42, 0, Math.max(0, WORLD - VW));
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
    let best = 74;
    const reachableHeight = Math.abs(cat.y - terrainY(cat.x)) <= 115;
    for (const m of mood) {
      if (!reachableHeight) break;
      if (m.dead || !m.spot || m.state !== 'hide' || m.spot.used) continue;
      const d = Math.hypot(cat.x - m.spot.x, Math.max(0, Math.abs(cat.y - m.spot.y) - 12));
      if (d < best) { best = d; scratchTarget = m; }
    }
    if (need.B > 0) for (const rock of rocks) { if (rock.scratched || Math.abs(cat.y - rock.y) > 115) continue; const d = Math.hypot(cat.x - rock.x, Math.max(0, Math.abs(cat.y - rock.y) - 12)); if (d < best) { best = d; scratchTarget = { kind: 'rock', rock }; } }
    $('#bScratch').hidden = !scratchTarget || touchUI.hidden;
    return scratchTarget;
  }
  function performScratch() {
    if (scratchTarget?.type === 'sky') {
      const m = scratchTarget.mood;
      if (!m || m.dead || m.skyPhase !== 'scratchReq') { if (m) failSkyChallenge(m); return false; }
      if (Math.abs(cat.x - m.skyAnchorX) > 120 || Math.abs(cat.x - m.x) > 165) { failSkyChallenge(m); scratchTarget = null; return false; }
      m.skyPhase = 'scratched'; m.skyTimer = 0; m.scratchNeed = 0; m.skyVY = Math.max(260, chapterFor(storyNight).sky.fallSpeed * 2);
      scratchAnim = .45; scratchTarget = null; burst(m.x, m.y, RED, 16); float(m.x, m.y - 58, 'Scratched! Let it land', RED); tone(520, .18, 'triangle', .07, 300);
      return true;
    }
    const activeSkyChallenge = mood.find(m => !m.dead && m.sky && m.skyFeature === 'C' && m.skyPhase === 'scratchReq');
    if (activeSkyChallenge) { failSkyChallenge(activeSkyChallenge); return false; }
    if (scratchTarget?.kind === 'rock') {
      const rock = scratchTarget.rock; if (!rock || rock.scratched || !cat.on || Math.abs(cat.y - rock.y) > 115) return false;
      rock.scratched = true; rock.holeDepth = 0; scratchAnim = .8; shake = Math.max(shake, rock.marked ? 0 : 10);
      if (rock.marked) { const m = mood.find(x => x.type === 'B' && !x.dead); if (m) { m.state = 'scratching'; m.st = .8; m.rock = rock; } burst(rock.x, rock.y - 22, '#8a6a45', 12); float(rock.x, rock.y - 68, 'Something was buried here.', '#a67646'); tone(190 + Math.random() * 40, .12, 'triangle', .03, 100); }
      else { rock.wrongUsed = true; tone(80, .5, 'sawtooth', .09, -40); announce('The ground rumbles…', RED, 2); triggerBuriedAmbush(); }
      scratchTarget = null; return true;
    }
    const m = scratchTarget;
    if (!m || m.dead || m.state !== 'hide' || !m.spot || m.spot.used || !cat.on || Math.abs(cat.y - m.spot.y) > 115) return false;
    m.state = 'scratching'; m.st = .58; m.spot.scratching = true; m.spot.scratchAt = t; m.sit = 0; scratchAnim = .58;
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
  function lightShape(type, x, y, s, v) {
    if (type === 'E' || type === 'S' || type === 'J') {
      const cc = col(type); ctx.fillStyle = cc; ctx.shadowColor = cc; ctx.shadowBlur = 14; ctx.beginPath();
      if (type === 'E') { ctx.arc(x, y, 7 * s, 0, 7); ctx.fill(); ctx.fillStyle = '#fff6c8'; star(x + 7 * s, y - 7 * s, 4, 3.5 * s, 1.2 * s, 0); ctx.fill(); }
      else if (type === 'S') { ctx.arc(x, y + 1 * s, 6.5 * s, 0, 7); ctx.fill(); [-1, 0, 1].forEach(k => { ctx.beginPath(); ctx.ellipse(x + k * 4.5 * s, y - 6 * s, 2.6 * s, 3.6 * s, k * .5, 0, 7); ctx.fill(); }); }
      else { ctx.moveTo(x, y - 10 * s); ctx.bezierCurveTo(x + 4 * s, y - 4 * s, x + 8 * s, y - 1 * s, x + 7 * s, y + 4 * s); ctx.bezierCurveTo(x + 6 * s, y + 9 * s, x - 6 * s, y + 9 * s, x - 7 * s, y + 4 * s); ctx.bezierCurveTo(x - 8 * s, y - 1 * s, x - 3 * s, y - 3 * s, x, y - 10 * s); ctx.fill(); }
      ctx.shadowBlur = 0; return;
    }
    const cc = v ? vcol(type, v) : col(type);
    ctx.fillStyle = cc; ctx.shadowColor = cc; ctx.shadowBlur = 14;
    if (type === 'F') star(x, y, 5, 9 * s, 4 * s, t * 2); else if (type === 'N') zig(x, y, 8 * s, .6); else if (type === 'L') tear(x, y + 2 * s, 6 * s); else if (type === 'C') { ctx.beginPath(); ctx.arc(x, y, 7 * s, 0, 7); ctx.fill(); ctx.strokeStyle = cc; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 10 * s, t, t + Math.PI * 1.5); ctx.stroke(); } else if (type === 'B') { ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + i * Math.PI / 3; ctx.lineTo(x + Math.cos(a) * 7 * s, y + Math.sin(a) * 7 * s); } ctx.closePath(); } else { ctx.beginPath(); ctx.arc(x, y, 7 * s, 0, 7); }
    if (type !== 'C') ctx.fill(); ctx.shadowBlur = 0;
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
  function drawRockFormation(x, y, rock, moodHolding) {
    ctx.save(); const pulse = .5 + .5 * Math.sin(t * 4 + rock.phase), markedGlow = eyesT > 0 && rock.marked && !rock.scratched && Math.abs(cat.x - x) <= uv('eyes') * T;
    if (markedGlow) { const g = ctx.createRadialGradient(x, y - 24, 3, x, y - 24, 66); g.addColorStop(0, 'rgba(166,118,70,.35)'); g.addColorStop(1, 'rgba(166,118,70,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y - 24, 66, 0, 7); ctx.fill(); }
    const stones = [[-28,0,30,24,'#4a4340'],[0,-10,34,29,'#5c524a'],[28,2,29,23,'#6f645a'],[-9,6,23,18,'#514943']];
    for (const [dx,dy,rx,ry,c] of stones) { ctx.fillStyle=c; ctx.beginPath(); ctx.moveTo(x+dx-rx,y+dy); ctx.lineTo(x+dx-rx*.55,y+dy-ry); ctx.lineTo(x+dx+rx*.2,y+dy-ry*.8); ctx.lineTo(x+dx+rx,y+dy-ry*.25); ctx.lineTo(x+dx+rx*.72,y+dy); ctx.closePath(); ctx.fill(); ctx.strokeStyle='#8a8074'; ctx.lineWidth=1.4; ctx.beginPath(); ctx.moveTo(x+dx-rx*.5,y+dy-ry*.78); ctx.lineTo(x+dx+rx*.15,y+dy-ry*.58); ctx.lineTo(x+dx+rx*.48,y+dy-ry*.25); ctx.stroke(); }
    if (moodHolding && rock.marked && !rock.scratched) {
      ctx.strokeStyle = 'rgba(194,205,199,.9)'; ctx.lineWidth = 1.35; ctx.lineCap = 'round';
      for (let k = 0; k < 2; k++) {
        const age = (t * .32 + rock.phase * .1 + k * .5) % 1;
        const rise = age * 18, drift = Math.sin(t * 1.2 + rock.phase + k * 2.2) * (2 + age * 2.5);
        const sx = x + drift, sy = y - 39 - rise;
        ctx.globalAlpha = .17 * (1 - age); ctx.beginPath(); ctx.moveTo(sx, sy + 8);
        ctx.bezierCurveTo(sx - 3, sy + 5, sx + 4, sy + 3, sx + 1, sy); ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    if (rock.holeDepth > 0) { ctx.fillStyle=`rgba(12,13,16,${.55 + .3 * rock.holeDepth})`; ctx.beginPath(); ctx.ellipse(x, y - 4, 18, 9, 0, 0, 7); ctx.fill(); ctx.fillStyle=`rgba(166,118,70,${.45 * rock.holeDepth})`; ctx.beginPath(); ctx.arc(x, y - 7, 6, 0, 7); ctx.fill(); }
    if (markedGlow) { ctx.strokeStyle=`rgba(166,118,70,${.55 + .35 * pulse})`; ctx.lineWidth=2; for (const off of [-13,2,15]) { ctx.beginPath(); ctx.moveTo(x+off,y-27); ctx.lineTo(x+off+4,y-18); ctx.lineTo(x+off-1,y-11); ctx.stroke(); } const py=y-53-Math.sin(t*3+rock.phase)*2; ctx.fillStyle='#a67646'; [[-5,0,2.5],[5,0,2.5],[-7,-6,2],[0,-8,2],[7,-6,2]].forEach(([dx,dy,r])=>{ctx.beginPath();ctx.arc(x+dx,py+dy,r,0,7);ctx.fill();}); }
    ctx.restore();
  }
  function rockHoldsFeeling(rock) {
    return !!rock && rock.marked && !rock.scratched && mood.some(m => m.type === 'B' && !m.dead && m.state === 'buried' && m.rock === rock);
  }
  function drawMoonHollowWorld(x0,x1) {
    for(const x of CAVE_XS){if(x<x0-100||x>x1+100)continue;
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
    const stallTop = x => GROUND - 152;
    for (let i = 0; i < CAVE_XS.length - 1; i++) {
      const a = CAVE_XS[i], b = CAVE_XS[i + 1];
      if (b - a > 720 || b + 80 < x0 || a - 80 > x1) continue;
      const ya = stallTop(a) - 6, sag = 48;
      ctx.strokeStyle = 'rgba(30,20,30,.9)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(a, ya); ctx.quadraticCurveTo((a + b) / 2, ya + sag * 2, b, ya); ctx.stroke();
      for (let k = 1; k <= 5; k++) {
        const u = k / 6, lx = a + (b - a) * u, ly = ya + sag * 4 * u * (1 - u) + 4 + Math.sin(t * 1.5 + k + i) * 1.5;
        const lc = festCol(k + i);
        const g = ctx.createRadialGradient(lx, ly + 8, 1, lx, ly + 8, 22); g.addColorStop(0, `rgba(${lc},.32)`); g.addColorStop(1, `rgba(${lc},0)`);
        ctx.fillStyle = g; ctx.fillRect(lx - 22, ly - 14, 44, 44);
        ctx.fillStyle = `rgb(${lc})`; ctx.beginPath(); ctx.roundRect(lx - 6, ly, 12, 16, 4); ctx.fill();
        ctx.strokeStyle = 'rgba(150,40,40,.8)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(lx - 6, ly + 4); ctx.lineTo(lx + 6, ly + 4); ctx.moveTo(lx - 6, ly + 12); ctx.lineTo(lx + 6, ly + 12); ctx.stroke();
        ctx.fillStyle = '#b8323a'; ctx.fillRect(lx - 1, ly + 16, 2, 8);
      }
    }
    for (const sx of CAVE_XS) {
      if (sx < x0 - 110 || sx > x1 + 110) continue;
      const w = 150, l = sx - w / 2, top = stallTop(sx);
      ctx.fillStyle = '#2b1b22'; ctx.fillRect(l + 6, top + 16, 8, GROUND - top - 16); ctx.fillRect(l + w - 14, top + 16, 8, GROUND - top - 16);
      const si = CAVE_XS.indexOf(sx), cloth = FEST_CLOTH[si % FEST_CLOTH.length], flag = FEST_CLOTH[(si + 2) % FEST_CLOTH.length];
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
      if (p[0] + p[2] < x0 || p[0] > x1) continue;
      const x = p[0], y = p[1], w = p[2];
      ctx.fillStyle = '#2a1a20'; ctx.fillRect(x + 10, y + 8, 7, GROUND - y - 8); ctx.fillRect(x + w - 17, y + 8, 7, GROUND - y - 8);
      ctx.strokeStyle = 'rgba(42,26,32,.9)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + 14, y + 12); ctx.lineTo(x + w - 14, GROUND - 20); ctx.stroke();
      const wood = ctx.createLinearGradient(0, y - 2, 0, y + 11);
      wood.addColorStop(0, '#a77a5a'); wood.addColorStop(.4, '#74503e'); wood.addColorStop(1, '#3e2832');
      ctx.fillStyle = wood; ctx.beginPath(); ctx.roundRect(x - 3, y - 2, w + 6, 12, 3); ctx.fill();
      ctx.strokeStyle = 'rgba(255,214,160,.6)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x + 2, y); ctx.lineTo(x + w - 2, y); ctx.stroke();
    }
    for (const spot of scratchSpots) { if (spot.x < x0 - 60 || spot.x > x1 + 60) continue; drawScratchSpot(spot.x, spot.y, spot.moodType, spot); }
    for (const rock of rocks) { if (rock.x < x0 - 80 || rock.x > x1 + 80) continue; drawRockFormation(rock.x, rock.y, rock, rockHoldsFeeling(rock)); }
  }
  function drawSchoolWall(alpha = 1, mirrorY = false) { return drawPictureLayer(SCHOOL_WALL, SCHOOL_WALL_W, SCHOOL_WALL_H, SCHOOL_PARALLAX, alpha, mirrorY); }
  // Draws a hallway/park picture that repeats along the level, mirrored every other time (no seams).
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
    for (const bx of CAVE_XS) {
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
      if (p[0] + p[2] < x0 || p[0] > x1) continue;
      const x = p[0], y = p[1], w = p[2], c = PARK_DECKS[Math.abs(Math.round(x / 97)) % PARK_DECKS.length];
      ctx.fillStyle = '#6f6aa0'; ctx.fillRect(x + 10, y + 8, 6, GROUND - y - 8); ctx.fillRect(x + w - 16, y + 8, 6, GROUND - y - 8);
      ctx.fillStyle = 'rgba(200,196,240,.35)'; ctx.fillRect(x + 10, y + 8, 2, GROUND - y - 8); ctx.fillRect(x + w - 16, y + 8, 2, GROUND - y - 8);
      ctx.fillStyle = c; ctx.beginPath(); ctx.roundRect(x - 3, y - 2, w + 6, 13, 5); ctx.fill();
      ctx.strokeStyle = 'rgba(10,8,30,.6)'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x + 3, y + 1); ctx.lineTo(x + w - 3, y + 1); ctx.stroke();
    }
    for (const spot of scratchSpots) { if (spot.x < x0 - 60 || spot.x > x1 + 60) continue; drawScratchSpot(spot.x, spot.y, spot.moodType, spot); }
  }
  function drawSchoolWorld(x0, x1) {
    ctx.fillStyle = '#16122a'; ctx.fillRect(x0, -OY - 10, x1 - x0, SCHOOL_WALL_H + OY + 12);
    if (!drawSchoolWall()) { ctx.fillStyle = '#2b2546'; ctx.fillRect(x0, 0, x1 - x0, GROUND); }
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
      if (p[0] + p[2] < x0 || p[0] > x1) continue;
      const x = p[0], y = p[1], w = p[2];
      ctx.fillStyle = 'rgba(8,6,18,.35)'; ctx.beginPath(); ctx.ellipse(x + w / 2, y + 30, w * .45, 7, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#3a2a35';
      for (const bx of [x + 16, x + w - 26]) { ctx.beginPath(); ctx.moveTo(bx, y + 9); ctx.lineTo(bx + 10, y + 9); ctx.lineTo(bx + 10, y + 26); ctx.closePath(); ctx.fill(); }
      const wood = ctx.createLinearGradient(0, y - 2, 0, y + 11);
      wood.addColorStop(0, '#8a5e4c'); wood.addColorStop(.4, '#6a4438'); wood.addColorStop(1, '#3a2430');
      ctx.fillStyle = wood; ctx.beginPath(); ctx.roundRect(x - 3, y - 2, w + 6, 12, 4); ctx.fill();
      ctx.strokeStyle = 'rgba(16,10,22,.8)'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.strokeStyle = 'rgba(255,214,160,.75)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x + 2, y); ctx.lineTo(x + w - 2, y); ctx.stroke();
    }
    for (const spot of scratchSpots) { if (spot.x < x0 - 60 || spot.x > x1 + 60) continue; drawScratchSpot(spot.x, spot.y, spot.moodType, spot); }
  }
  function drawWorld() {
    const x0=camX-50,x1=camX+VW+50;
    if (inSchool()) { drawSchoolWorld(x0, x1); return; }
    if (inFestival()) { drawFestivalWorld(x0, x1); return; }
    if (inPark()) { drawParkWorld(x0, x1); return; }
    if (inLake()) { drawLakeWorld(x0, x1); return; }
    if (inHill()) { drawHillWorld(x0, x1); return; }
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
    for(const p of activePlats){if(p[0]+p[2]<x0||p[0]>x1)continue;
      const x=p[0],y=p[1],w=p[2];ctx.fillStyle='#27333a';ctx.beginPath();ctx.moveTo(x-4,y+13);ctx.lineTo(x+4,y+4);ctx.quadraticCurveTo(x+w*.21,y+12,x+w*.34,y+6);ctx.quadraticCurveTo(x+w*.58,y-1,x+w*.76,y+8);ctx.lineTo(x+w+5,y+11);ctx.lineTo(x+w-8,y+28);ctx.lineTo(x+10,y+28);ctx.closePath();ctx.fill();
      const rock=ctx.createLinearGradient(0,y,0,y+18);rock.addColorStop(0,'#596458');rock.addColorStop(.36,'#49514b');rock.addColorStop(1,'#303a3b');ctx.fillStyle=rock;ctx.beginPath();ctx.moveTo(x-2,y+7);ctx.quadraticCurveTo(x+w*.2,y+3,x+w*.4,y+8);ctx.quadraticCurveTo(x+w*.72,y+2,x+w+3,y+6);ctx.lineTo(x+w-4,y+15);ctx.quadraticCurveTo(x+w*.6,y+12,x+w*.35,y+16);ctx.quadraticCurveTo(x+w*.1,y+12,x-2,y+17);ctx.closePath();ctx.fill();
      ctx.strokeStyle='rgba(168,183,150,.68)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y+7);ctx.quadraticCurveTo(x+w*.3,y+2,x+w*.55,y+7);ctx.quadraticCurveTo(x+w*.8,y+3,x+w,y+6);ctx.stroke();
      ctx.strokeStyle='rgba(12,22,27,.62)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x+w*.28,y+9);ctx.lineTo(x+w*.32,y+15);ctx.lineTo(x+w*.36,y+17);ctx.moveTo(x+w*.78,y+7);ctx.lineTo(x+w*.74,y+12);ctx.stroke();
      ctx.fillStyle='rgba(48,85,57,.82)';for(let k=0;k<4;k++){const gx=x+12+k*31,gy=y+5+(k%2)*2;ctx.beginPath();ctx.ellipse(gx,gy,5,1.5,-.15,0,Math.PI*2);ctx.fill();}
    }
    // Small fern silhouettes frame the near trail.
    for(let x=Math.floor(x0/190)*190;x<x1;x+=190){const y=terrainY(x)+6;ctx.strokeStyle='rgba(90,129,82,.65)';ctx.lineWidth=1.5;for(let k=0;k<5;k++){const side=k%2?1:-1,yy=y-k*4;ctx.beginPath();ctx.moveTo(x,yy);ctx.quadraticCurveTo(x+side*9,yy-8,x+side*17,yy-12);ctx.stroke();}}
    for(let x=Math.floor((x0+95)/330)*330;x<x1;x+=330){const y=terrainY(x)+3;ctx.strokeStyle='rgba(91,135,91,.68)';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(x,y+6);ctx.quadraticCurveTo(x+1,y,x,y-5);ctx.stroke();for(let k=0;k<5;k++){const a=k*Math.PI*2/5;ctx.fillStyle=k%2?'#e5c28b':'#e7d5bc';ctx.beginPath();ctx.arc(x+Math.cos(a)*3,y-5+Math.sin(a)*3,1.7,0,Math.PI*2);ctx.fill();}ctx.fillStyle='#d4a84f';ctx.beginPath();ctx.arc(x,y-5,1.5,0,Math.PI*2);ctx.fill();}
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
  function drawFrustSleep(x, y) {
    const p = clamp(t / frustWakeAt, 0, 1), left = frustWakeAt - t, waking = left < 1.5;
    const cx = x, cy = y - 56, r = 16;
    ctx.save();
    ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(20,12,40,.55)'; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    const pulse = waking ? .65 + .35 * Math.sin(t * 14) : 1;
    ctx.strokeStyle = waking ? `rgba(255,97,104,${pulse})` : 'rgba(243,236,255,.9)';
    ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2); ctx.stroke();
    ctx.fillStyle = waking ? '#ff6168' : '#f3ecff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = '800 16px Lexend, Arial, sans-serif'; ctx.fillText(waking ? '!' : 'z', cx, cy + 1);
    if (!waking) {
      for (let k = 0; k < 2; k++) {
        const ph = (t * .7 + k * .5) % 1;
        ctx.globalAlpha = Math.sin(ph * Math.PI) * .9;
        ctx.font = `800 ${10 + k * 4}px Lexend, Arial, sans-serif`;
        ctx.fillText('z', cx + 16 + ph * 10 + k * 6, cy - 8 - ph * 18 - k * 4);
      }
      ctx.globalAlpha = 1;
    }
    if (mode === 'story' && chapterFor(storyNight).tutorialHints) {
      ctx.font = '700 13px Lexend, Arial, sans-serif'; ctx.fillStyle = waking ? '#ff8a8f' : 'rgba(243,236,255,.8)';
      ctx.fillText(waking ? 'waking up!' : 'sleepy', cx, cy - 27);
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
      ctx.strokeStyle = c; ctx.beginPath(); ctx.arc(m.x, m.y + 2, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (m.sit / 2)); ctx.stroke(); return true;
    }
    return false;
  }
  function moodLabel(m, text, c, dy = 40) { ctx.font = `600 13px ${BODY}`; ctx.textAlign = 'center'; ctx.fillStyle = c; ctx.fillText(text, m.x, m.y - dy); }
  function drawMoods() {
    for (const m of mood) {
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
        drawCuteMood('C', m.x, m.y, .55, { color: '#4FDB92', glow: CALM, look, cy: 70 });
        if (!sitRing(m, CALM, 32) && near) moodLabel(m, 'Sit quietly with Calm', CALM, 38);
      } else if (m.type === 'B') {
        lightShape('B', m.x, m.y, 1.8, m.v); ctx.strokeStyle = '#493321'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(m.x - 5, m.y - 2); ctx.lineTo(m.x, m.y + 3); ctx.lineTo(m.x + 5, m.y - 2); ctx.stroke();
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

  function mkDrawSprite(c) {
    const spr = MK_SPRITES[MK_PROFILE.coat];
    if (!spr || !spr.complete || !spr.naturalWidth) return false;
    const hh = 70, ww = hh * spr.naturalWidth / spr.naturalHeight;
    const moving = c.on && Math.abs(c.vx) > 10, ph = c.walk, amp = c.sneak ? .2 : .34;
    let back = 0, front = 0, tail, breath = 0, bob = 0;
    if (scratchAnim > 0 && c.on) { front = Math.sin(t * 28) * .45; back = -.05; tail = Math.sin(t * 9) * .2; }
    else if (c.pounce > 0) { back = -.5; front = .55; tail = -.25; }
    else if (!c.on) { back = c.vy < 0 ? -.4 : -.15; front = c.vy < 0 ? .3 : .45; tail = -.2; }
    else if (moving) { back = Math.sin(ph) * amp; front = -Math.sin(ph) * amp; tail = Math.sin(t * 6) * .12; bob = -Math.abs(Math.sin(ph)) * (c.sneak ? 1 : 2.2); }
    else { tail = Math.sin(t * 2.2) * .18; breath = Math.sin(t * 2.6) * .02; }
    if (c.on) { ctx.fillStyle = 'rgba(8,10,24,.35)'; ctx.beginPath(); ctx.ellipse(-2, 2, ww * .36, 4.5, 0, 0, 7); ctx.fill(); }
    if (eyesT > 0) { ctx.shadowColor = '#c8ff8a'; ctx.shadowBlur = 16; }
    const ok = mkDrawRig(ctx, MK_PROFILE.coat, -ww / 2 - 2, -hh + 6 + bob, ww, hh, { back, front, tail, breath });
    if (!ok) ctx.drawImage(spr, -ww / 2 - 2, -hh + 6 + bob, ww, hh);
    ctx.shadowBlur = 0;
    return true;
  }
  function drawCat() {
    const c = cat; ctx.save();
    if (c.inv > 0 && Math.floor(c.inv * 12) % 2) ctx.globalAlpha = .45;
    ctx.translate(c.x, c.y); ctx.scale(c.face, 1);
    let sxs = 1, sys = 1;
    if (c.pounce > 0) { sxs = 1.22; sys = .84; } else if (c.squash > 0) { sxs = 1.15; sys = .85; } else if (c.sneak) { sys = .86; sxs = 1.06; } else if (!c.on) { sxs = .94; sys = 1.08; }
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
    if (trail.length > 1) {
      ctx.strokeStyle = 'rgba(246,196,83,.18)'; ctx.lineWidth = 2; ctx.beginPath();
      ctx.moveTo(cat.x, cat.y - 34); trail.forEach(l => ctx.lineTo(l.x, l.y)); ctx.stroke();
    }
    trail.forEach(l => lightShape(l.type, l.x, l.y, 1, l.v));
  }
  function drawParts() {
    for (const p of parts) { ctx.globalAlpha = clamp(p.life / p.max, 0, 1); ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill(); }
    ctx.globalAlpha = 1; ctx.textAlign = 'center';
    for (const f of floats) { ctx.globalAlpha = clamp(f.life / .4, 0, 1); ctx.font = `800 18px ${DISP}`; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(18,12,36,.8)'; ctx.strokeText(f.text, f.x, f.y); ctx.fillStyle = f.c; ctx.fillText(f.text, f.x, f.y); }
    ctx.globalAlpha = 1;
  }

  function chip(x, y, type, have, needN, width = 104) {
    const done = have >= needN;
    ctx.fillStyle = 'rgba(22,15,44,.75)'; ctx.strokeStyle = done ? col(type) : 'rgba(243,236,255,.16)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, width, 40, 20) : ctx.rect(x, y, width, 40); ctx.fill(); ctx.stroke();
    lightShape(type, x + 22, y + 20, 1.1);
    ctx.fillStyle = INK; ctx.font = `800 20px ${DISP}`; ctx.textAlign = 'left';
    ctx.fillText(done ? '✓' : `${have}/${needN}`, x + 44, y + 27);
  }
  function drawHUD() {
    if (state === 'menu') return;
    const top = 16 - Math.min(0, OY);
    const tl = Math.max(0, timeLeft), m = Math.floor(tl / 60), s = Math.floor(tl % 60);
    const urgent = tl <= 15 && state === 'play';
    ctx.textAlign = 'left';
    ctx.font = `800 ${urgent ? 38 + Math.sin(t * 10) * 2 : 36}px ${DISP}`; ctx.fillStyle = urgent ? RED : INK;
    ctx.fillText(`${m}:${String(s).padStart(2, '0')}`, 20, top + 34);
    ctx.font = `600 15px ${BODY}`; ctx.fillStyle = MUTED; ctx.fillText('SCORE', 22, top + 60);
    ctx.font = `800 22px ${DISP}`; ctx.fillStyle = INK; ctx.fillText(score.toLocaleString(), 82, top + 61);
    const hudChapter = mode === 'story' ? chapterFor(storyNight) : null;
    const skyEnabled = !!hudChapter && skyTotalFor(hudChapter) > 0;
    const skyLive = skyEnabled && mood.some(m => m.sky && !m.dead && ['wait', 'falling', 'struck', 'scratchReq', 'scratched'].includes(m.skyPhase));
    const compactSky = VW < 900;
    if (skyEnabled) {
      const sx = compactSky ? 22 : 122, sy = top + (compactSky ? 72 : 8), sw = 112, sh = 28;
      ctx.save(); ctx.globalAlpha = skyLive ? .84 + .16 * Math.sin(t * 5) : 1;
      ctx.fillStyle = 'rgba(22,15,44,.78)'; ctx.strokeStyle = skyLive ? 'rgba(205,224,255,.62)' : 'rgba(243,236,255,.22)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.roundRect ? ctx.roundRect(sx, sy, sw, sh, 14) : ctx.rect(sx, sy, sw, sh); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#e7edff'; ctx.beginPath(); ctx.arc(sx + 15, sy + 14, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(22,15,44,.95)'; ctx.beginPath(); ctx.arc(sx + 19, sy + 11, 6, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#e7edff'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(sx + 25, sy + 10); ctx.lineTo(sx + 25, sy + 20); ctx.lineTo(sx + 22, sy + 17); ctx.moveTo(sx + 25, sy + 20); ctx.lineTo(sx + 28, sy + 17); ctx.stroke();
      ctx.font = `800 13px ${DISP}`; ctx.textAlign = 'left'; ctx.fillStyle = INK; ctx.fillText(skyLive ? 'Sky · ↓' : `Sky ×${skyRemaining(hudChapter)}`, sx + 35, sy + 19);
      ctx.restore();
    }
    const comboY = top + 96 + (skyEnabled && compactSky ? 32 : 0);
    if (combo > 1) {
      ctx.font = `800 26px ${DISP}`; ctx.fillStyle = GOLD; ctx.fillText(`×${combo} combo`, 20, comboY);
      ctx.fillStyle = 'rgba(246,196,83,.25)'; ctx.fillRect(22, comboY + 8, 120, 5);
      ctx.fillStyle = GOLD; ctx.fillRect(22, comboY + 8, 120 * clamp(comboT / 4, 0, 1), 5);
    }
    if (skyEnabled && skySpawned > 0) {
      const perfectY = top + (combo > 1 ? (compactSky ? 160 : 128) : (compactSky ? 104 : 92));
      ctx.textAlign = 'left'; ctx.font = `600 12px ${BODY}`; ctx.fillStyle = MUTED; ctx.fillText(`Perfect skys: ${skyPerfect}`, 22, perfectY);
    }
    {
      let ay = skyEnabled ? top + (combo > 1 ? (compactSky ? 186 : 153) : (compactSky ? 128 : 116)) : top + (combo > 1 ? 132 : 92);
      ctx.textAlign = 'left'; ctx.font = `600 14px ${BODY}`;
      ctx.fillStyle = eyesT > 0 ? '#c8ff8a' : eyesCd > 0 ? MUTED : BLUE;
      ctx.fillText(eyesT > 0 ? 'Night eyes open' : eyesCd > 0 ? `Eyes in ${Math.ceil(eyesCd)}s` : 'Night eyes ready · E', 22, ay);
      if (upg.purr > 0) {
        ay += 20; ctx.fillStyle = purrCd > 0 ? MUTED : '#c8ff8a';
        ctx.fillText(purrCd > 0 ? `Purr in ${Math.ceil(purrCd)}s` : 'Purr ready · K', 22, ay);
      }
    }
    if (mode === 'story') {
      const types = Object.keys(need).filter(type => need[type] > 0), width = types.length >= 7 ? 64 : types.length >= 5 ? 78 : types.length === 4 ? 88 : 96, gap = 8;
      let x = VW - 22 - types.length * (width + gap) + gap;
      for (const type of types) { chip(x, top + 6, type, got[type] || 0, need[type], width); x += width + gap; }
      ctx.font = `600 12px ${BODY}`; ctx.fillStyle = MUTED; ctx.textAlign = 'right';
      ctx.fillText(`NIGHT ${storyNight} · ${chapterFor(storyNight).name.toUpperCase()}`, VW - 22, top + 64);
    } else {
      ctx.textAlign = 'right'; ctx.font = `800 28px ${DISP}`; ctx.fillStyle = INK;
      ctx.fillText(`${caughtN} caught`, VW - 22, top + 34);
      ctx.font = `600 13px ${BODY}`; ctx.fillStyle = VIOLET;
      ctx.fillText(`FREE MODE · LEVEL ${level + 1}`, VW - 22, top + 58);
    }
    if (scratchTarget && (scratchTarget.kind === 'rock' || scratchTarget.type === 'sky' || scratchTarget.state === 'hide')) {
      ctx.textAlign='center';ctx.font=`800 17px ${DISP}`;ctx.lineWidth=4;ctx.strokeStyle='rgba(8,14,22,.92)';ctx.fillStyle='#f4e8c7';
      const prompt = scratchTarget.type === 'sky' ? 'Scratch it! (S)' : scratchTarget.kind === 'rock' ? `S  Scratch ${scratchTarget.rock.marked && eyesT > 0 ? 'marked rock' : 'rock'}` : `S  Scratch ${scratchTarget.type==='C'?(inLake()?'reed bed':'cave mark'):'hiding spot'}`, py=VH-74;
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
        ctx.font = `800 ${size}px ${DISP}`; lines = []; let line = '';
        for (const w of banner.text.split(' ')) { const tryL = line ? line + ' ' + w : w; if (ctx.measureText(tryL).width > maxW && line) { lines.push(line); line = w; } else line = tryL; }
        lines.push(line); if (lines.length <= 3 || size <= 18) break; size -= 3;
      }
      ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(18,12,36,.85)'; ctx.fillStyle = banner.c;
      lines.forEach((ln, i) => { const y = 160 + i * size * 1.2; ctx.strokeText(ln, VW / 2, y); ctx.fillText(ln, VW / 2, y); });
      ctx.globalAlpha = 1;
    }
  }

  function render(dt) {
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#120c24'; ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.setTransform(dpr * S, 0, 0, dpr * S, 0, dpr * S * OY);
    if (shake > 0) ctx.translate((Math.random() - .5) * shake, (Math.random() - .5) * shake);
    drawBG();
    ctx.save(); ctx.translate(-camX, 0);
    drawWorld(); drawMoods(); drawTrail();
    drawCat(); drawParts();
    ctx.restore();
    if (eyesT > 0) {
      const sx = cat.x - camX, sy = cat.y - 24, r = uv('eyes') * T, fade = Math.min(1, eyesT / .4, (4 - eyesT) / .25);
      const g = ctx.createRadialGradient(sx, sy, r * .75, sx, sy, r * 1.15);
      g.addColorStop(0, 'rgba(6,12,24,0)'); g.addColorStop(1, `rgba(6,12,24,${.6 * fade})`);
      ctx.fillStyle = g; ctx.fillRect(0, -OY, VW, VH + OY * 2);
      ctx.strokeStyle = `rgba(200,255,138,${.35 * fade})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(sx, sy, r, 0, 7); ctx.stroke();
    }
    drawHUD();
  }

  // ---------- flow ----------
  function getBest(k = 'mk-best') { try { return +localStorage.getItem(k) || 0; } catch (e) { return 0; } }
  function setBest(k, v) { try { localStorage.setItem(k, String(v)); } catch (e) {} }
  let R = null;
  function finish(won) {
    if (state === 'over' || state === 'home') return;
    state = 'over'; pauseBtn.hidden = true; pauseScreen.hidden = true; touchUI.hidden = true; mouseSneakHeld = false; mouseSneakPointerId = null; mouseSneakPress = null;
    if (runN >= 3 && startles === 0) bump('quietN');
    if (mode === 'story' && storyNight === 1 && won && hits === 0) bump('nohit');
    let unlockedNow = false;
    if (mode === 'story' && won) {
      const before = unlockedLevel;
      unlockedLevel = clamp(Math.max(unlockedLevel, storyNight + 1), 1, 7);
      thiriSleepStage = clamp(Math.max(thiriSleepStage, storyNight), 0, 7);
      unlockedNow = unlockedLevel > before; saveStoryProgress();
    }
    lastGlow = glowRun; glow += glowRun; glowRun = 0; saveUpg(); refreshShopBtns();
    if (mode === 'free') {
      const best = Math.max(getBest('mk-best-free'), score); setBest('mk-best-free', best);
      R = {
        free: true, final: score, best, combo: bestCombo, home: caughtN, survived: freeT, level: level + 1,
        tip: hits > 0 ? 'Tip: getting hit costs 3 seconds. Let charges miss, then pounce on the dizzy ones.' : 'Tip: chain catches within 4 seconds. A ×5 combo is where the big scores come from.'
      };
      tone(330, .35, 'triangle', .08, -80); showEnd(); return;
    }
    let final = score;
    const left = Math.max(0, timeLeft), bestKey = storyNight === 7 ? 'mk-best-night-7' : 'mk-best';
    if (won) final += Math.round(left) * 20;
    const best = Math.max(getBest(bestKey), final); setBest(bestKey, best);
    R = {
      won, night: storyNight, total: requiredTotal(), left, final, best, combo: bestCombo, home: caughtTotal(), unlocked: unlockedNow, stage: thiriSleepStage,
      starsN: won ? (left >= 30 ? 3 : left >= 10 ? 2 : 1) : 0,
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
  function refreshHubStats(found = BOOK_ORDER.filter(k => book[k]).length) {
    animateHubNumber($('#hubGlowValue'), glow);
    animateHubNumber($('#hubBookValue'), found, n => `${n} / ${BOOK_ORDER.length}`);
    $('#shopBtnValue').textContent = `${glow} Glow`;
    $('#bookBtnValue').textContent = `${found} / ${BOOK_ORDER.length} found`;
    $('#hubCatName').textContent = MK_PROFILE.cat.toUpperCase();
    $('#profileBtn').setAttribute('aria-label', `Profile and cat settings for ${MK_PROFILE.cat}`);
    const heroCat = $('#hubHeroCat');
    if (heroCat && COAT) heroCat.setAttribute('href', COAT.img);
    const heroSvg = $('#hubHeroSvg');
    if (heroSvg && COAT) heroSvg.setAttribute('aria-label', `${MK_PROFILE.cat}, the ${COAT.name} cat on a moonlit pier beside a lantern and fishing net`);
    $('#profileBtn').style.setProperty?.('--hub-cat-color', (COAT && COAT.body) || '#e0b04a');
  }
  function refreshShopBtns() {
    const label = `Upgrade Shwe · ${glow} Glow`;
    if (heroCat && COAT) heroCat.setAttribute('href', COAT.img);
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
  function iconSVG(ty, v, known) {
    const c = known ? vcol(ty, v) : 'rgba(243,236,255,.16)';
    const poly = (n, r1, r2) => Array.from({ length: n * 2 }, (_, i) => { const r = i % 2 ? r2 : r1, a = -Math.PI / 2 + i * Math.PI / n; return `${(Math.cos(a) * r).toFixed(1)},${(Math.sin(a) * r).toFixed(1)}`; }).join(' ');
    let shape;
    if (ty === 'F') shape = `<polygon points="${poly(9, 20, 12)}"/>`;
    else if (ty === 'N') shape = `<polygon points="${poly(7, 19, 13)}"/>`;
    else if (ty === 'L') shape = '<path d="M0,-21 C13,-6 12,12 0,12 C-12,12 -13,-6 0,-21Z"/>';
    else if (ty === 'C') shape = '<path d="M0,-20 C15,-10 15,10 0,20 C-15,10 -15,-10 0,-20Z"/>';
    else shape = `<circle r="${ty === 'G' ? 15 : 17}"/>`;
    const glowC = known ? `<circle r="26" fill="${c}" opacity=".18"/>` : '';
    const face = known ? '<circle cx="-6" cy="1" r="2.6" fill="#1d1238"/><circle cx="6" cy="1" r="2.6" fill="#1d1238"/>' : '<text y="6" text-anchor="middle" font-size="16" font-weight="800" fill="rgba(243,236,255,.5)">?</text>';
    const sparkle = known && v ? `<polygon points="${poly(4, 5, 1.6)}" transform="translate(19,-18)" fill="#fff6d6"/><polygon points="${poly(4, 4, 1.3)}" transform="translate(-20,15)" fill="#fff6d6"/>` : '';
    return `<svg viewBox="-28 -28 56 56" aria-hidden="true">${glowC}<g fill="${c}">${shape}</g>${face}${sparkle}</svg>`;
  }
  function renderBook() {
    const found = BOOK_ORDER.filter(k => book[k]).length;
    $('#bookCount').textContent = `${found} / ${BOOK_ORDER.length} found`; refreshHubStats(found);
    $('#bookList').innerHTML = BOOK_ORDER.map(k => {
      const ty = k[0], v = +k[1], info = vinfo(ty, v), n = book[k] || 0, known = n > 0;
      const tag = `<span class="tag${info.r === 'Rare' || info.r === 'Special' ? ' rare' : ''}">${info.r}${known ? ` · caught ×${n}` : ''}</span>`;
      if (known) return `<div class="entry">${iconSVG(ty, v, true)}<h3>${info.n}</h3>${tag}<p>${info.d}</p><p class="line">${info.line}</p></div>`;
      const hint = info.lock || (info.r === 'Rare' ? `A rare form of ${vinfo(ty, 0).n}. Look for sparkles.` : 'Catch one to fill this page.');
      return `<div class="entry unknown">${iconSVG(ty, v, false)}<h3>???</h3>${tag}<p>${hint}</p></div>`;
    }).join('');
  }
  $('#bookBtn').addEventListener('click', () => { $('#startScreen').hidden = true; renderBook(); $('#bookScreen').hidden = false; $('#bookScreen').scrollTop = 0; $('#bookBack').focus({ preventScroll: true }); });
  $('#bookBack').addEventListener('click', () => { $('#bookScreen').hidden = true; showMainMenu(true); });
  let shopFrom = null;
  function renderShop() {
    $('#glowAmt').textContent = glow;
    $('#shopList').innerHTML = UPG.map(u => {
      const lv = upg[u.id], max = lv >= 3, cost = u.costs[lv];
      const now = u.fmt(u.vals[lv]), next = max ? '' : ` · next: ${u.fmt(u.vals[lv + 1])}`;
      const btn = max ? '<button class="buy" disabled>Maxed</button>'
        : `<button class="buy" data-id="${u.id}" ${glow < cost ? 'disabled' : ''}>${lv === 0 && u.id === 'purr' ? 'Unlock' : 'Buy'} · ${cost}</button>`;
      return `<div class="item"><h3>${u.name}</h3><div class="side"><div class="pips" aria-label="Level ${lv} of 3">${[0, 1, 2].map(i => `<span class="pip${i < lv ? ' on' : ''}"></span>`).join('')}</div>${btn}</div><p>${u.desc}</p><p>Now: ${now}${next}</p></div>`;
    }).join('');
  }
  function openShop(from) {
    shopFrom = from; $('#startScreen').hidden = true; $('#endScreen').hidden = true;
    renderShop(); $('#shopScreen').hidden = false; $('#shopScreen').scrollTop = 0; $('#shopBack').focus({ preventScroll: true });
  }
  $('#shopList').addEventListener('click', e => {
    const b = e.target.closest('button[data-id]'); if (!b) return;
    const u = UPG.find(x => x.id === b.dataset.id), lv = upg[u.id];
    if (lv >= 3 || glow < u.costs[lv]) return;
    initAudio(); glow -= u.costs[lv]; upg[u.id]++; saveUpg();
    tone(660, .15, 'triangle', .07); setTimeout(() => tone(990, .25, 'sine', .06), 90);
    renderShop(); refreshShopBtns();
    const again = $(`#shopList button[data-id="${u.id}"]`); (again || $('#shopBack')).focus();
  });
  $('#shopBack').addEventListener('click', () => { $('#shopScreen').hidden = true; (shopFrom === 'end' ? $('#endScreen') : $('#startScreen')).hidden = false; });
  $('#shopBtn').addEventListener('click', () => openShop('start'));
  $('#endShopBtn').addEventListener('click', () => openShop('end'));
  refreshShopBtns();

  function playNightComplete(night) {
    const chapter = chapterFor(night), next = Math.min(7, night + 1);
    $('#nightStoryline').hidden = true;
    $('#endThiriArt').dataset.stage = String(Math.min(7, thiriSleepStage));
    $('#endDiaryLine').textContent = `“${chapter.diary}”`;
    $('#endStageLine').textContent = `Thiri’s room is changing · sleep stage ${thiriSleepStage} of 7`;
    $('#endUnlockBadge').hidden = !R.unlocked;
    $('#endUnlockBadge').textContent = R.unlocked ? `NIGHT ${next} UNLOCKED` : '';
    $('#endEyebrow').textContent = `Night ${night} complete · ${chapter.name}`;
    $('#endTitle').textContent = R.unlocked ? `Night ${night} complete — Night ${next} unlocked!` : night === 7 ? 'The lake is quiet' : 'A little more of Thiri returns';
    $('#endMsg').textContent = `You brought all ${R.total} feelings home. ${R.unlocked ? `Night ${next} is now playable from the map.` : 'Your story progress is saved.'}`;
    $('#againBtn').textContent = night < 7 ? `Play Night ${night + 1}` : 'Replay Night 7';
  }

  function showEnd() {
    state = 'over'; mouseSneakHeld = false; mouseSneakPointerId = null; mouseSneakPress = null;
    $('#sGlow').textContent = '+' + lastGlow;
    const extra = [];
    if (runDone.length) extra.push(`Mission complete: ${runDone.join('; ')}. Claim the reward on the main menu.`);
    if (runNew.length) extra.push(`New in the Mood Book: ${runNew.join(', ')}.`);
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
      setTimeout(() => { $('#endScreen').hidden = false; $('#againBtn').focus(); }, 280);
      return;
    }
    $('#nightStoryline').hidden = true;
    $('#endEyebrow').textContent = R.won ? `Night ${R.night} complete` : `Night ${R.night} · time's up`;
    $('#endTitle').textContent = R.won ? 'A little more of Thiri returns' : 'Some feelings need more time';
    $('#endStars').innerHTML = [0, 1, 2].map(i => `<span class="${i < R.starsN ? '' : 'off'}">★</span>`).join('');
    $('#endStars').hidden = !R.won;
    $('#endMsg').textContent = R.won
      ? `You brought all ${R.total} feelings home with ${Math.round(R.left)} seconds to spare. Time bonus: +${Math.round(R.left) * 20}.`
      : "That's okay. Let's try again.";
    $('#sScore').textContent = R.final.toLocaleString();
    $('#sBest').textContent = R.best.toLocaleString();
    $('#sCombo').textContent = '×' + R.combo;
    $('#sHome').textContent = `${R.home}/${R.total}`;
    $('#againBtn').textContent = R.won ? (R.night < 7 ? `Play Night ${R.night + 1}` : 'Replay Night 7') : `Retry Night ${R.night}`;
    $('#endTip').textContent = R.tip;
    if (R.won) playNightComplete(R.night);
    setTimeout(() => { $('#endScreen').hidden = false; $('#againBtn').focus(); }, 280);
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
    const n = types.length;
    const floorP = [[300, 452, -.5], [388, 470, .4], [470, 450, -.25], [548, 468, .7]];
    H = {
      won, preview, night, stage: Math.min(7, thiriSleepStage), diary: chapterFor(night).diary, phase: 'enter', pt: 0, p: 0, m: 0, capT: 0, total: n, given: { F: 0, N: 0, L: 0, C: 0, B: 0, E: 0, S: 0, J: 0, G: 0 },
      nF: types.filter(x => x === 'F').length, nN: types.filter(x => x === 'N').length,
      lights: types.map((ty, i) => ({ type: ty, x: 120, y: 190, sx: 440 - (n - 1) * 20 + i * 40, sy: 222, state: 'wait', delay: .55 + i * .12, ft: 0, fx: 0, fy: 0 })),
      cat: { x: 120, y: 262 },
      pieces: [0, 1, 2, 3].map(q => ({ q, sx: (q % 2) * 60, sy: Math.floor(q / 2) * 45, fx: floorP[q][0], fy: floorP[q][1], fr: floorP[q][2], on: false, k: 0 })),
      papers: [[150, 462, .3], [186, 452, -.6], [140, 446, 1.1], [208, 470, -.2]].map(a => ({ x: a[0], y: a[1], r: a[2], on: false, k: 0 })),
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
    if (L.type === 'F') { const pc = h.pieces[h.given.F - 1]; if (pc) pc.on = true; }
    if (L.type === 'N') { const pp = h.papers[h.given.N - 1]; if (pp) pp.on = true; }
    if (L.type === 'L') h.phone = Math.max(h.phone || 0, .01);
    h.react = .9; h.reactCol = col(L.type);
    for (let i = 0; i < 22; i++) { const a = Math.random() * Math.PI * 2, s = 40 + Math.random() * 140; h.parts.push({ x: THIRI.x, y: THIRI.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 30, life: .8 + Math.random() * .4, max: 1.2, c: col(L.type), r: 1.5 + Math.random() * 2.5 }); }
    const cnt = Object.values(h.given).reduce((sum, n) => sum + n, 0);
    const homeLine = { F: 'Her frustration came home', N: 'Her nerves came home', L: 'Her loneliness came home', C: 'A little calm came home', B: 'A buried feeling came home', E: 'Her excitement came home', S: 'Her shyness came home', J: 'Her jealousy came home', G: 'A bright feeling came home' }[L.type] || 'A feeling came home';
    h.floats.push({ x: THIRI.x - 40, y: 262 - (cnt % 2) * 24, text: homeLine, c: col(L.type), life: 1.6 });
    const f = 523.25 * Math.pow(2, (cnt - 1) * 2 / 12);
    tone(f, .3, 'sine', .07); setTimeout(() => tone(f * 1.5, .35, 'triangle', .04), 90);
  }
  function homeKey() {
    if (!H) return;
    if (H.canContinue) { finishHome(); return; }
    if (H.phase === 'give') { const L = H.lights.find(l => l.state === 'hover'); if (L) give(L); }
  }
  let wakeTimer = 0, wakeRaf = 0, wakeStage = 0;
  function drawWakeCard(stage) {
    const c = $('#nightWakeCanvas'), g = c.getContext('2d'), d = SLEEP_STAGES[clamp(stage, 0, 7)];
    g.clearRect(0, 0, c.width, c.height); const light = d.room;
    g.fillStyle = mix('#15132b', '#f3c98b', light); g.fillRect(0, 0, c.width, c.height);
    g.fillStyle = mix('#202040', '#8eb9d8', light); g.fillRect(55, 28, 150, 140); g.fillStyle = mix('#403253', '#fff0b0', light); g.fillRect(72, 42, 116, 112);
    const cw = 55 - d.curtain * 42; g.fillStyle = mix('#4b3b62', '#cf8194', light); g.fillRect(48, 22, cw, 155); g.fillRect(212 - cw, 22, cw, 155);
    g.fillStyle = '#855978'; g.fillRect(270, 132, 340, 82); g.fillStyle = '#f5e4e7'; g.fillRect(292, 120, 300, 36);
    g.fillStyle = '#d28aa4'; g.beginPath(); g.moveTo(280, 168); g.quadraticCurveTo(400, 105 - d.blanketLift * 2, 570, 160); g.lineTo(590, 214); g.lineTo(275, 214); g.closePath(); g.fill();
    if (!d.faceVisible) { ctx.fillStyle = '#2a2532'; ctx.beginPath(); ctx.ellipse(656, 314, 25, 10, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.moveTo(638, 314); ctx.lineTo(646, 296); ctx.lineTo(654, 313); ctx.lineTo(664, 294); ctx.lineTo(674, 315); ctx.closePath(); ctx.fill(); }
    if (d.faceVisible) { g.fillStyle = '#e9b993'; g.beginPath(); g.arc(500, 121 - d.blanketLift, 25, 0, 7); g.fill(); g.fillStyle = '#30243a'; g.beginPath(); g.arc(500, 111 - d.blanketLift, 28, Math.PI, 0); g.fill(); g.strokeStyle = '#493143'; g.lineWidth = 3; g.beginPath(); g.moveTo(487, 126 - d.blanketLift); g.quadraticCurveTo(492, 131 - d.blanketLift, 497, 126 - d.blanketLift); g.stroke(); }
    if (d.handOut) { g.strokeStyle = '#e9b993'; g.lineWidth = 9; g.beginPath(); g.moveTo(425, 172); g.lineTo(370, 185); g.stroke(); }
    g.fillStyle = COAT.body; g.beginPath(); g.ellipse(230, 203, 32, 17, 0, 0, 7); g.fill(); g.beginPath(); g.arc(253, 186, 14, 0, 7); g.fill();
    g.fillStyle = mix('#5e5b66', '#5fbf72', d.plant); g.fillRect(620, 177, 24, 30); g.strokeStyle = g.fillStyle; g.lineWidth = 5; for (const x of [614,630,646]) { g.beginPath(); g.moveTo(632,180); g.lineTo(x,150); g.stroke(); }
  }
  function closeNightWake() {
    clearTimeout(wakeTimer); cancelAnimationFrame(wakeRaf); $('#nightWakeScreen').hidden = true;
    if (wakeStage === 7 && !finalAwakeningSeen) playFinalAwakening(); else showEnd();
  }
  function showNightWake(night) {
    wakeStage = clamp(thiriSleepStage, 1, 7); const ch = chapterFor(night);
    $('#nightWakeEyebrow').textContent = `AFTER NIGHT ${night}`;
    $('#nightWakeTitle').textContent = wakeStage === 7 ? 'Morning is almost here.' : 'She stirs in her sleep.';
    $('#nightWakeDiary').textContent = `“${ch.diary}”`; $('#nightWakeLine').textContent = `Shwe: “${STAGE_LINES[wakeStage]}”`;
    $('#nightWakeContinue').textContent = wakeStage === 7 ? 'See the morning →' : 'Continue →';
    $('#nightWakeScreen').hidden = false; $('#nightWakeContinue').focus({ preventScroll: true });
    const from = SLEEP_STAGES[Math.max(0, wakeStage - 1)], to = SLEEP_STAGES[wakeStage], started = performance.now(), tween = reduce ? .1 : 1.5;
    const animateWake = now => { const q = clamp((now - started) / 1000 / tween, 0, 1), e = ease(q), blended = {}; for (const key of Object.keys(to)) blended[key] = from[key] + (to[key] - from[key]) * e; const original = SLEEP_STAGES[wakeStage]; SLEEP_STAGES[wakeStage] = blended; drawWakeCard(wakeStage); SLEEP_STAGES[wakeStage] = original; if (q < 1) wakeRaf = requestAnimationFrame(animateWake); };
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
      h.cat.x = 120 + (360 - 120) * e; h.cat.y = 262 + (322 - 262) * e - Math.sin(Math.PI * k) * 90;
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
    for (const pc of h.pieces) if (pc.on) pc.k = Math.min(1, pc.k + dt / .9);
    for (const pp of h.papers) if (pp.on) pp.k = Math.min(1, pp.k + dt / .7);
    if (h.phone > 0) h.phone = Math.min(1, h.phone + dt / .8);
    if (h.phase === 'give' && h.lights.every(l => l.state === 'done')) { h.phase = 'settle'; h.pt = 0; }
    if (h.phase === 'settle' && h.pt > 1.3) {
      h.phase = h.won ? 'morning' : 'night'; h.pt = 0;
      if (h.won) { tone(392, .6, 'sine', .05); setTimeout(() => tone(523, .6, 'sine', .05), 260); setTimeout(() => tone(659, .9, 'sine', .05), 520); }
    }
    if (h.phase === 'morning') { const k = Math.min(1, h.pt / 2.6); h.m = k * k * (3 - 2 * k); if (h.pt > 2.4) h.caption = true; if (h.pt > 3.2) h.canContinue = true; if (h.pt > 12) finishHome(); }
    if (h.phase === 'night') { h.caption = true; if (h.pt > 1) h.canContinue = true; if (h.pt > 10) finishHome(); }
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
    const v = toView(e), rx = (VW - 760) / 2, x = v.x - rx, y = v.y;
    let best = null, bd = 44;
    for (const L of H.lights) { if (L.state !== 'hover') continue; const d = Math.hypot(L.x - x, L.y - y); if (d < bd) { bd = d; best = L; } }
    if (!best) return;
    H.drag = { L: best, id: e.pointerId, sx: x, sy: y, moved: false }; best.state = 'drag';
    try { cv.setPointerCapture(e.pointerId); } catch (err) {}
  });
  cv.addEventListener('pointermove', e => {
    if (!H || !H.drag || e.pointerId !== H.drag.id) return;
    const v = toView(e), x = v.x - (VW - 760) / 2, y = v.y, d = H.drag;
    if (Math.hypot(x - d.sx, y - d.sy) > 8) d.moved = true;
    if (d.moved) { d.L.x = x; d.L.y = y; }
  });
  const dragEnd = e => {
    if (!H || !H.drag || e.pointerId !== H.drag.id) return;
    const d = H.drag; H.drag = null;
    const onBed = d.L.x > 300 && d.L.x < 740 && d.L.y > 250 && d.L.y < 400;
    if (!d.moved || onBed || Math.hypot(d.L.x - THIRI.x, d.L.y - THIRI.y) < 120) { d.L.state = 'hover'; give(d.L); }
    else d.L.state = 'hover';
  };
  cv.addEventListener('pointerup', dragEnd); cv.addEventListener('pointercancel', dragEnd);

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
  function rrect(x, y, w, h, r) { ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h); }

  function drawThiriAwakening(stage, morning, h) {
    const d = SLEEP_STAGES[clamp(stage, 0, 7)], skin = mix('#8c8794', '#e9b993', d.room);
    const share = h.nN ? h.given.N / h.nN : 1, amp = 3.4 - 2 * share, spd = 3.4 - 1.8 * share, br = Math.sin(t * spd) * amp;
    if (d.faceVisible) {
      ctx.fillStyle = '#2a2532'; ctx.beginPath(); ctx.ellipse(676, 320 - d.blanketLift * .3, 22, 9, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(656, 302 - d.blanketLift * .3, 21, 0, 7); ctx.fill();
      ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(645, 309 - d.blanketLift * .3, 16, 0, 7); ctx.fill(); ctx.fillStyle = '#2a2532'; ctx.beginPath(); ctx.arc(650, 300 - d.blanketLift * .3, 15, Math.PI * 1.05, Math.PI * 1.9); ctx.fill();
      ctx.strokeStyle = '#2a2532'; ctx.lineWidth = 1.8; ctx.lineCap = 'round';
      if (d.eyesOpen > 0 && Math.sin(t * 2.4) > .94) { ctx.fillStyle = '#372b3b'; ctx.beginPath(); ctx.ellipse(639, 305, 2.1, 2.7 * d.eyesOpen, 0, 0, 7); ctx.fill(); } else { ctx.beginPath(); ctx.moveTo(636, 305); ctx.quadraticCurveTo(639, 308, 642, 305); ctx.stroke(); }
      const smile = -2.6 - 2.2 * d.smile - 1.5 * morning; ctx.beginPath(); ctx.moveTo(632, 317); ctx.quadraticCurveTo(637, 317 + smile, 642, 317); ctx.stroke();
    }
    if (d.handOut > 0) { ctx.strokeStyle = '#e9b995'; ctx.lineWidth = 8 * d.handOut; ctx.beginPath(); ctx.moveTo(520, 345 - d.blanketLift); ctx.quadraticCurveTo(492, 360, 468, 348); ctx.stroke(); }
    const blanketLift = d.blanketLift;
    ctx.fillStyle = mix('#55525e', '#d98aa6', Math.max(morning * .25, d.room)); ctx.beginPath(); ctx.moveTo(312, 380); ctx.lineTo(312, 336 - blanketLift); ctx.bezierCurveTo(380, 318 - blanketLift, 430, 296 + br - blanketLift, 500, 298 + br - blanketLift); ctx.bezierCurveTo(570, 300 + br - blanketLift, 600, 306 - blanketLift, 632, 324 - d.faceVisible * 6); ctx.lineTo(640, 380); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.12)'; for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.arc(340 + i * 32, 352 - (i % 2) * 14 - blanketLift * .35, 3, 0, 7); ctx.fill(); }
  }

  function drawHome() {
    const h = H, rx = (VW - 760) / 2, p = h.p, m = h.m, stage = clamp(h.stage || 0, 0, 7), stageDef = SLEEP_STAGES[stage], roomLight = Math.max(m, stageDef.room), y0 = -OY, fullH = VH + OY * 2;
    // Wall and room light gradually change with each completed night.
    ctx.fillStyle = mix('#34313d', '#72627a', roomLight); ctx.fillRect(0, y0, VW, fullH);
    ctx.fillStyle = 'rgba(255,255,255,.035)'; for (let x = 0; x < VW; x += 44) ctx.fillRect(x, y0, 20, 430 - y0);
    ctx.fillStyle = mix('#2a2830', '#6b5148', roomLight); ctx.fillRect(0, 430, VW, VH + OY - 420);
    ctx.strokeStyle = 'rgba(0,0,0,.18)'; ctx.lineWidth = 1;
    for (let y = 452; y < VH + OY; y += 26) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(VW, y); ctx.stroke(); }

    ctx.save(); ctx.translate(rx, 0);
    // window
    const sky = ctx.createLinearGradient(0, 70, 0, 270);
    sky.addColorStop(0, mix('#120c2a', '#8fc2ef', roomLight)); sky.addColorStop(1, mix('#2a1f55', '#ffd2a1', roomLight));
    ctx.fillStyle = sky; ctx.fillRect(40, 70, 160, 200);
    ctx.fillStyle = `rgba(255,255,255,${.7 * (1 - roomLight)})`;
    [[62, 92], [150, 84], [178, 130], [96, 140], [70, 200]].forEach(s => ctx.fillRect(s[0], s[1], 2, 2));
    ctx.fillStyle = `rgba(255,244,214,${.75 * (1 - roomLight)})`; ctx.beginPath(); ctx.arc(160, 112, 14, 0, 7); ctx.fill();
    if (m > 0) { ctx.fillStyle = `rgba(255,226,150,${m})`; ctx.shadowColor = '#ffd27a'; ctx.shadowBlur = 30 * m; ctx.beginPath(); ctx.arc(110, 268 - 80 * m, 20, 0, 7); ctx.fill(); ctx.shadowBlur = 0; }
    ctx.strokeStyle = mix('#5a5662', '#f3e7d0', p); ctx.lineWidth = 6; ctx.strokeRect(40, 70, 160, 200);
    ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(120, 70); ctx.lineTo(120, 270); ctx.moveTo(40, 170); ctx.lineTo(200, 170); ctx.stroke();
    // curtains
    const curtainOpen = Math.max(m, stageDef.curtain), cw = 84 - 64 * curtainOpen, curt = mix('#4a4752', '#e0798e', roomLight);
    ctx.fillStyle = curt; ctx.fillRect(28, 60, cw, 222); ctx.fillRect(212 - cw, 60, cw, 222);
    ctx.fillStyle = 'rgba(0,0,0,.12)'; for (let i = 1; i < 4; i++) { ctx.fillRect(28 + cw * i / 4, 60, 2, 222); ctx.fillRect(212 - cw * i / 4, 60, 2, 222); }
    ctx.fillStyle = mix('#3e3b46', '#8a5a44', p); ctx.fillRect(22, 54, 196, 6);
    ctx.fillStyle = mix('#46434e', '#a26f52', p); ctx.fillRect(30, 270, 180, 12);
    // plant
    const health = Math.max(p * .25, roomLight, stageDef.plant);
    ctx.strokeStyle = mix('#5e5b66', '#5fbf72', health); ctx.lineWidth = 4; ctx.lineCap = 'round';
    [-1, 0, 1].forEach(s => { const a = -Math.PI / 2 + s * (.5 + (1 - health) * .9); ctx.beginPath(); ctx.moveTo(176, 250); ctx.quadraticCurveTo(176 + Math.cos(a) * 14, 250 + Math.sin(a) * 14 - 4, 176 + Math.cos(a) * 26, 250 + Math.sin(a) * 26 + (1 - health) * 14); ctx.stroke(); });
    if (m > .5) { ctx.fillStyle = `rgba(255,120,160,${(m - .5) * 2})`; ctx.beginPath(); ctx.arc(176, 222, 6, 0, 7); ctx.fill(); }
    ctx.fillStyle = mix('#5a5560', '#c9744a', p); ctx.fillRect(164, 250, 24, 20);

    // drawing frame and pieces
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(340, 92, 120, 90);
    ctx.strokeStyle = mix('#5b5862', '#c9a35c', p); ctx.lineWidth = 5; ctx.strokeRect(335, 87, 130, 100);
    for (const pc of h.pieces) {
      const k = ease(pc.k), tx = 340 + pc.sx + 30, ty = 92 + pc.sy + 22.5;
      const x = pc.fx + (tx - pc.fx) * k, y = pc.fy + (ty - pc.fy) * k - Math.sin(Math.PI * pc.k) * 70, r = pc.fr * (1 - k);
      ctx.save(); ctx.translate(x, y); ctx.rotate(r);
      ctx.drawImage(DRAW_G, pc.sx, pc.sy, 60, 45, -30, -22.5, 60, 45);
      ctx.globalAlpha = Math.max(p, k); ctx.drawImage(DRAW_C, pc.sx, pc.sy, 60, 45, -30, -22.5, 60, 45);
      ctx.restore();
    }
    // school bag and papers
    ctx.fillStyle = mix('#4d4a55', '#4f7ad8', p); rrect(60, 408, 72, 52, 10); ctx.fill();
    ctx.fillStyle = mix('#423f4a', '#3c5fb3', p); rrect(60, 408, 72, 22, 10); ctx.fill();
    ctx.strokeStyle = mix('#3a3742', '#2e4a8f', p); ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(96, 408, 16, Math.PI, 0); ctx.stroke();
    for (const pp of h.papers) {
      if (pp.k >= 1) continue;
      const k = ease(pp.k), x = pp.x + (96 - pp.x) * k, y = pp.y + (414 - pp.y) * k - Math.sin(Math.PI * pp.k) * 40;
      ctx.save(); ctx.globalAlpha = 1 - pp.k; ctx.translate(x, y); ctx.rotate(pp.r * (1 - k));
      ctx.fillStyle = mix('#8f8b97', '#f6f1ff', p); ctx.fillRect(-14, -10, 28, 20);
      ctx.fillStyle = 'rgba(0,0,0,.18)'; for (let i = 0; i < 3; i++) ctx.fillRect(-10, -5 + i * 5, 20, 1.5);
      ctx.restore();
    }
    // nightstand and phone (lights up when loneliness comes home)
    const ph = Math.max(h.phone || 0, stage >= 3 ? .65 : 0);
    ctx.fillStyle = mix('#3e3b46', '#8a5a44', p); rrect(236, 384, 58, 46, 6); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fillRect(244, 402, 42, 2);
    ctx.fillStyle = ph > 0 ? mix('#2a2832', '#9fd0ff', ph) : '#2a2832'; rrect(250, 377, 30, 7, 2); ctx.fill();
    if (ph > 0) {
      ctx.save(); ctx.globalAlpha = ph;
      ctx.fillStyle = 'rgba(111,182,255,.25)'; ctx.beginPath(); ctx.arc(265, 378, 22, 0, 7); ctx.fill();
      ctx.fillStyle = '#f3ecff'; rrect(142, 318, 210, 36, 12); ctx.fill();
      ctx.beginPath(); ctx.moveTo(250, 354); ctx.lineTo(262, 366); ctx.lineTo(268, 354); ctx.fill();
      ctx.fillStyle = '#2a1f45'; ctx.font = `600 13px ${BODY}`; ctx.textAlign = 'center';
      ctx.fillText('Hnin: art club tomorrow?', 247, 341);
      ctx.restore();
    }
    // bed
    ctx.fillStyle = mix('#3a3742', '#7a4e3a', p); ctx.fillRect(306, 370, 10, 62); ctx.fillRect(700, 370, 10, 62);
    ctx.fillStyle = mix('#47444f', '#8a5a44', p); rrect(704, 238, 28, 150, 8); ctx.fill();
    ctx.fillStyle = mix('#6a6672', '#efe6ff', p); rrect(300, 330, 420, 44, 8); ctx.fill();
    ctx.fillStyle = mix('#77737f', '#fff4fb', p); ctx.beginPath(); ctx.ellipse(662, 324, 42, 14, 0, 0, 7); ctx.fill();
    drawThiriAwakening(stage, m, h);
    // cat
    drawCurled(h.cat.x, h.cat.y, m > .3);
    if (m > .3) { ctx.fillStyle = `rgba(243,236,255,${.6 * m})`; ctx.font = `800 14px ${DISP}`; ctx.textAlign = 'left'; ctx.fillText('z', h.cat.x + 30, h.cat.y - 26 - Math.sin(t * 2) * 3); ctx.fillText('z', h.cat.x + 40, h.cat.y - 40 - Math.sin(t * 2 + 1) * 3); }
    ctx.restore();

    // night dimming, then morning light
    ctx.fillStyle = `rgba(8,5,22,${.42 * (1 - m)})`; ctx.fillRect(0, y0, VW, fullH);
    if (m > 0) {
      ctx.save(); ctx.translate(rx, 0); ctx.globalAlpha = .22 * m;
      const beam = ctx.createLinearGradient(120, 70, 420, 540); beam.addColorStop(0, '#ffe2a8'); beam.addColorStop(1, 'rgba(255,226,168,0)');
      ctx.fillStyle = beam; ctx.beginPath(); ctx.moveTo(40, 70); ctx.lineTo(200, 70); ctx.lineTo(600, 540); ctx.lineTo(180, 540); ctx.closePath(); ctx.fill();
      ctx.restore();
    }

    // lights, sparks, words
    ctx.save(); ctx.translate(rx, 0);
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
    ctx.restore();

    // guidance text
    const cx = VW / 2, top = Math.min(40, 40 - OY);
    ctx.textAlign = 'center';
    if (h.phase === 'enter') {
      ctx.font = `600 13px ${BODY}`; ctx.fillStyle = MUTED; ctx.fillText('HOME BEFORE SUNRISE', cx, top);
    } else if (h.phase === 'give') {
      const cnt = Object.values(h.given).reduce((sum, n) => sum + n, 0);
      ctx.font = `800 22px ${DISP}`; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(18,12,36,.8)';
      ctx.strokeText('Tap each light to give it back to Thiri', cx, top); ctx.fillStyle = INK; ctx.fillText('Tap each light to give it back to Thiri', cx, top);
      ctx.font = `600 13px ${BODY}`; ctx.fillStyle = MUTED; ctx.fillText(`${cnt} of ${h.total} home · you can also drag them onto her`, cx, top + 22);
    }
    if (h.caption) {
      const a = clamp(h.capT / .5, 0, 1), w = Math.min(560, VW - 32), x = cx - w / 2, y = 432;
      ctx.globalAlpha = a; ctx.fillStyle = 'rgba(22,15,44,.9)'; rrect(x, y, w, 100, 14); ctx.fill();
      ctx.strokeStyle = 'rgba(243,236,255,.16)'; ctx.lineWidth = 1; ctx.stroke();
      ctx.font = `600 12px ${BODY}`; ctx.fillStyle = GOLD; ctx.fillText(h.won ? `AFTER NIGHT ${h.night}` : 'BEFORE SUNRISE', cx, y + 24);
      ctx.font = `800 26px ${DISP}`; ctx.fillStyle = INK; ctx.fillText(h.won ? 'The room feels a little lighter.' : 'Some feelings are still out there.', cx, y + 56);
      ctx.font = `italic 400 15px ${BODY}`; ctx.fillStyle = MUTED;
      ctx.fillText(h.won ? `“${h.diary}”` : 'Shwe will look for them again tomorrow night.', cx, y + 82);
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
  function startGame(m, night = storyNight) {
    if (typeof m === 'string') mode = m;
    storyNight = mode === 'story' ? clamp(Math.floor(+night) || 1, 1, 7) : 1;
    initAudio();
    cv.hidden = false;
    $('#welcomeScreen').hidden = true; $('#levelBriefingScreen').hidden = true; $('#nightReadyScreen').hidden = true;
    $('#prologueScreen').hidden = true; $('#awakeningScreen').hidden = true;
    $('#bPurr').hidden = upg.purr === 0; $('#bScratch').hidden = true; $('#shopScreen').hidden = true; $('#bookScreen').hidden = true;
    mouseSneakHeld = false; mouseSneakPointerId = null; mouseSneakPress = null; reset(); state = 'play';
    $('#startScreen').hidden = true; $('#endScreen').hidden = true; pauseScreen.hidden = true; pauseBtn.hidden = false;
    touchUI.hidden = !coarse && !('ontouchstart' in window && navigator.maxTouchPoints > 0);
    const chapter = mode === 'story' ? chapterFor(storyNight) : null;
    announce(mode === 'free' ? 'Free Mode · every catch adds time' : `${chapter.name} · ${chapter.sub}`, INK, 2.1);
    if (chapter) { tone(chapter.musicRoot, .9, 'sine', .025); setTimeout(() => tone(chapter.musicRoot * 1.25, .8, 'sine', .018), 180); setTimeout(() => tone(chapter.musicRoot * 1.5, .9, 'triangle', .014), 380); if (chapter.tutorialHints) announce(chapter.tutorialHint, INK, 8); }
    cv.focus?.();
  }
  const LEVEL_MAP_LIMIT = 7, LEVEL_MAP_STEP = 92;
  const LEVEL_MAP_CHAPTERS = new Map(NIGHT_CHAPTERS.map(chapter => [chapter.night, chapter]));
  const levelMapX = level => 50 + Math.sin(level * .72) * 24;
  const mapRandom = seed => { const n = Math.sin(seed * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); };
  function buildMapScenery(height) {
    const parts = [`<rect x="0" y="0" width="100" height="${height}" fill="url(#mapNightFill)"/>`];
    const y7 = (LEVEL_MAP_LIMIT - 7) * LEVEL_MAP_STEP + LEVEL_MAP_STEP / 2;
    for (let i = 0; i < 280; i++) {
      const x = 2 + mapRandom(i + 11) * 96, y = mapRandom(i + 901) * height;
      const rx = .12 + mapRandom(i + 1901) * .2, ry = .45 + mapRandom(i + 2901) * 1.15;
      const alpha = .18 + mapRandom(i + 3901) * .48;
      parts.push(`<ellipse class="map-stars" cx="${x.toFixed(2)}" cy="${y.toFixed(1)}" rx="${rx.toFixed(2)}" ry="${ry.toFixed(2)}" opacity="${alpha.toFixed(2)}"/>`);
    }
    const ridge = (side, base, spread, seed, className) => {
      const pts = [], step = 720, count = Math.ceil(height / step);
      for (let i = 0; i <= count; i++) {
        const y = Math.min(height, i * step);
        let x = base + mapRandom(seed + i * 7.31) * spread + Math.sin(i * .43 + seed) * 2.4 + Math.sin(i * .13 + seed * .7) * 3.2;
        x = Math.max(2, Math.min(43, x)); if (side === 'right') x = 100 - x;
        pts.push({ x, y });
      }
      const edge = pts.map(p => `${p.x.toFixed(2)} ${p.y.toFixed(1)}`).join(' L ');
      const boundary = side === 'left' ? `M 0 0 L 0 ${height} L ${pts[pts.length - 1].x.toFixed(2)} ${height} L ${pts.slice(0, -1).reverse().map(p => `${p.x.toFixed(2)} ${p.y.toFixed(1)}`).join(' L ')}` : `M 100 0 L 100 ${height} L ${pts[pts.length - 1].x.toFixed(2)} ${height} L ${pts.slice(0, -1).reverse().map(p => `${p.x.toFixed(2)} ${p.y.toFixed(1)}`).join(' L ')}`;
      return `<path class="${className}" d="${boundary} Z"/><path class="map-ridge-edge" d="M ${edge}"/>`;
    };
    for (const side of ['left', 'right']) {
      parts.push(ridge(side, 18, 13, side === 'left' ? 4 : 29, 'map-ridge-far'));
      parts.push(ridge(side, 9, 12, side === 'left' ? 51 : 76, 'map-ridge-mid'));
    }
    const mountainBand = (y, seed, className, peakHeight, depth) => {
      let peaks = '';
      for (let i = 0; i <= 25; i++) {
        const x = i * 4, peak = y + 10 + mapRandom(seed + i * 3.71) * peakHeight + Math.sin(i * .9 + seed) * 10;
        peaks += `L${x.toFixed(1)} ${peak.toFixed(1)} `;
      }
      const baseline = y + depth, bottom = baseline + 120;
      return `<path class="${className}" d="M0 ${bottom}L0 ${baseline}${peaks}L100 ${baseline}L100 ${bottom}Z"/>`;
    };
    for (let i = 0, y = 160; y < height; i++, y += 1120) {
      parts.push(mountainBand(y, i + 401, 'map-range-far', 170, 250));
      parts.push(mountainBand(y + 360, i + 709, 'map-range-mid', 110, 150));
    }
    parts.push(mountainBand(y7 + 35, 3217, 'map-range-far', 165, 230));
    parts.push(mountainBand(y7 + 120, 4217, 'map-range-mid', 110, 145));
    for (let i = 0; i < 20; i++) {
      const y = 500 + i * 2780 + mapRandom(i + 8001) * 800;
      parts.push(`<ellipse class="map-fog" cx="${(34 + mapRandom(i + 8101) * 32).toFixed(1)}" cy="${y.toFixed(1)}" rx="${(28 + mapRandom(i + 8201) * 14).toFixed(1)}" ry="${(42 + mapRandom(i + 8301) * 46).toFixed(1)}"/>`);
    }
    for (const side of ['left', 'right']) parts.push(ridge(side, 2, 8, side === 'left' ? 103 : 128, 'map-ridge-near'));
    for (let i = 0, y = 170; y < height - 36; i++, y += 480 + mapRandom(i + 9001) * 390) {
      const tree = (x, py, seed) => {
        const h = 18 + mapRandom(seed) * 12, w = 1.55 + mapRandom(seed + 1) * .75;
        const d = `M 0 0 L ${-w} ${h * .35} L ${-w * .35} ${h * .35} L ${-w * 1.25} ${h * .68} L ${-w * .55} ${h * .68} L ${-w * 1.75} ${h} L ${w * 1.75} ${h} L ${w * .55} ${h * .68} L ${w * 1.25} ${h * .68} L ${w * .35} ${h * .35} L ${w} ${h * .35} Z M -.45 ${h} L -.45 ${h + 4} L .45 ${h + 4} L .45 ${h} Z`;
        return `<path class="map-tree" transform="translate(${x.toFixed(2)} ${py.toFixed(1)})" d="${d}"/>`;
      };
      parts.push(tree(3 + mapRandom(i + 9101) * 14, y, i + 9201));
      parts.push(tree(83 + mapRandom(i + 9301) * 14, y + 35 + mapRandom(i + 9401) * 65, i + 9501));
    }
    for (let i = 0, level = 120; level < LEVEL_MAP_LIMIT; i++, level += 145) {
      const x = i % 2 ? 21 + mapRandom(i + 9701) * 8 : 71 + mapRandom(i + 9801) * 8;
      const y = (LEVEL_MAP_LIMIT - level) * LEVEL_MAP_STEP + 24;
      parts.push(`<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})"><path class="map-shrine" d="M-9 0V-39H9V0 M-14 -39H14L12 -44H-12Z M-10 -25H10L9 -29H-9Z M-4 -39V-51H4V-39Z M-6 -51H6L5 -55H-5Z"/><path class="map-shrine-light" d="M-14 -39H14 M-10 -25H10 M-7 -5H7"/></g>`);
    }
    parts.push(`<ellipse class="map-fog" cx="82" cy="${(y7 + 62).toFixed(1)}" rx="10" ry="45" opacity=".5"/><ellipse class="map-moon" cx="82" cy="${(y7 + 25).toFixed(1)}" rx="4.8" ry="26"/><g transform="translate(80 ${(y7 + 115).toFixed(1)})"><path class="map-cave" d="M-8 26V-7Q-8 -27 0 -29Q8 -27 8 -7V26Z"/><path class="map-cave-inner" d="M-5 26V-6Q-5 -19 0 -21Q5 -19 5 -6V26Z"/><ellipse class="map-cave-light" cx="-6.7" cy="8" rx=".55" ry="2.2"/></g>`);
    for (let level = 25; level <= LEVEL_MAP_LIMIT; level += 25) {
      const x = levelMapX(level), y = (LEVEL_MAP_LIMIT - level) * LEVEL_MAP_STEP + 19;
      parts.push(`<path class="map-ledge" d="M${(x - 7.5).toFixed(2)} ${y.toFixed(1)}l1.8-5h11.4l1.8 5-2 3h-11Z"/><path class="map-ledge-top" d="M${(x - 5.8).toFixed(2)} ${(y - 4.8).toFixed(1)}h11.6l1.4 3h-14.4Z"/>`);
    }
    for (const level of LEVEL_MAP_CHAPTERS.keys()) {
      const x = levelMapX(level), y = (LEVEL_MAP_LIMIT - level) * LEVEL_MAP_STEP + 19;
      parts.push(`<path class="map-ledge" d="M${(x - 8.5).toFixed(2)} ${y.toFixed(1)}l2-5h13l2 5-2 3h-15Z"/><path class="map-ledge-top" d="M${(x - 6.5).toFixed(2)} ${(y - 4.8).toFixed(1)}h13l1.5 3h-16Z"/>`);
    }
    $('#mapScenery').innerHTML = parts.join('');
  }
  function buildLevelMap() {
    const track = $('#levelMapTrack'), path = $('#levelMapPath'), route = $('#levelMapRoute'), svg = $('#levelMapSvg');
    track.querySelectorAll('.level-entry').forEach(entry => entry.remove());
    const height = LEVEL_MAP_LIMIT * LEVEL_MAP_STEP;
    track.style.height = `${height}px`; svg.setAttribute('viewBox', `0 0 100 ${height}`);
    buildMapScenery(height);
    let d = '', prev = null;
    for (let level = LEVEL_MAP_LIMIT; level >= 1; level--) {
      const point = { x: levelMapX(level), y: (LEVEL_MAP_LIMIT - level) * LEVEL_MAP_STEP + LEVEL_MAP_STEP / 2 };
      if (!prev) d = `M ${point.x.toFixed(2)} ${point.y}`;
      else d += ` Q ${((prev.x + point.x) / 2 + Math.sin(level * .29) * 3).toFixed(2)} ${((prev.y + point.y) / 2).toFixed(1)} ${point.x.toFixed(2)} ${point.y}`;
      prev = point;
    }
    route.setAttribute('d', d); path.setAttribute('d', d);
    svg.querySelector('.path-halo').setAttribute('d', d);
    $('#levelMapCount').textContent = `${unlockedLevel} / 7 nights unlocked`;
    $('#roomStatus').textContent = thiriSleepStage >= 7 ? 'Thiri woke up' : thiriSleepStage >= 5 ? 'Thiri is almost awake' : thiriSleepStage >= 3 ? 'Thiri is stirring' : 'Thiri is sleeping';
    for (let level = 1; level <= LEVEL_MAP_LIMIT; level++) {
      const chapter = LEVEL_MAP_CHAPTERS.get(level), x = levelMapX(level);
      const entry = document.createElement('div');
      entry.className = `level-entry ${x > 50 ? 'caption-left' : 'caption-right'}`;
      entry.style.left = `${x}%`;
      entry.style.top = `${(LEVEL_MAP_LIMIT - level) * LEVEL_MAP_STEP + LEVEL_MAP_STEP / 2}px`;
      const button = document.createElement('button');
      const playable = level <= unlockedLevel;
      button.type = 'button'; button.dataset.level = String(level);
      button.className = `level-node${playable ? ' is-playable' : ''}${level === unlockedLevel ? ' is-current' : ''}`;
      button.textContent = String(level); button.disabled = !playable;
      button.setAttribute('aria-label', playable ? `Night ${level}, ${chapter.name}, playable${level === unlockedLevel ? ', current night' : ''}` : `Night ${level}, ${chapter.name}, locked until Night ${level - 1} is complete`);
      button.title = playable ? `Play Night ${level} · ${chapter.name}` : `Night ${level} · complete Night ${level - 1} to unlock`;
      if (level === unlockedLevel) button.id = 'playBtn';
      entry.appendChild(button);
      if (chapter) {
        const caption = document.createElement('span'); caption.className = 'level-caption';
        const name = document.createElement('strong'); name.textContent = `Level ${level} · ${chapter.name}`;
        const sub = document.createElement('span'); sub.textContent = chapter.sub;
        caption.appendChild(name); caption.appendChild(sub); entry.appendChild(caption);
      }
      track.appendChild(entry);
    }
  }
  function focusLevelMap(level = unlockedLevel) {
    const viewport = $('#levelMapViewport');
    const y = (LEVEL_MAP_LIMIT - level) * LEVEL_MAP_STEP + LEVEL_MAP_STEP / 2;
    viewport.scrollTop = Math.max(0, y - 34);
  }
  function showHub(focus = true) {
    $('#startScreen').hidden = false; $('#menuHub').hidden = false; $('#storyMapScreen').hidden = true;
    $('#hubSettingsScreen').hidden = true;
    refreshHubStats();
    if (focus) $('#storyBtn').focus({ preventScroll: true });
  }
  function showStoryMap(focus = true) {
    $('#startScreen').hidden = false; $('#menuHub').hidden = true; $('#storyMapScreen').hidden = false;
    $('#hubSettingsScreen').hidden = true; $('#levelBriefingScreen').hidden = true;
    buildLevelMap(); focusLevelMap(unlockedLevel);
    let mapTipSeen = false;
    try { mapTipSeen = localStorage.getItem('mk-map-guide-seen') === '1'; } catch (e) {}
    if (mapGuidePending || !mapTipSeen) showMapGuide();
    else if (focus) $(`#levelMapTrack button[data-level="${unlockedLevel}"]`)?.focus({ preventScroll: true });
  }
  function showMainMenu(focusCurrent = true) {
    state = 'menu'; cv.hidden = true; pauseBtn.hidden = true; pauseScreen.hidden = true; touchUI.hidden = true;
    $('#welcomeScreen').hidden = true; $('#levelBriefingScreen').hidden = true; $('#nightReadyScreen').hidden = true;
    $('#prologueScreen').hidden = true; $('#awakeningScreen').hidden = true;
    $('#endScreen').hidden = true; $('#shopScreen').hidden = true; $('#bookScreen').hidden = true;
    buildLevelMap(); showHub(focusCurrent);
  }
  function pauseGame() {
    if (state !== 'play') return;
    pauseTouchWasHidden = touchUI.hidden;
    state = 'paused'; pauseBtn.hidden = true; touchUI.hidden = true;
    for (const key in keys) keys[key] = false;
    jumpQ = false; pounceQ = false; scratchQ = false; purrQ = false; eyesQ = false;
    touchAxis = 0; sid = null; stick.hidden = true; knob.style.transform = 'translate(-50%,-50%)';
    mouseSneakHeld = false; mouseSneakPointerId = null; mouseSneakPress = null;
    pauseScreen.hidden = false; pauseContinueBtn.focus({ preventScroll: true });
  }
  function resumeGame() {
    if (state !== 'paused') return;
    pauseScreen.hidden = true; state = 'play'; touchUI.hidden = pauseTouchWasHidden;
    pauseBtn.hidden = false; pauseBtn.focus({ preventScroll: true });
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
    { s: 6, text: 'One by one, they drifted to the window. Their lights grew dimmer… and dimmer.' },
    { s: 6, text: 'Frustrated. Nervous. Lonely. Excited. Calm. Shy. Jealous. All of them, gone.' },
    { s: 6, text: 'Without them, she would wake up empty.' },
    { s: 7, who: 'cat', text: 'Mrrp! (Wait for me!)' },
    { s: 7, text: 'So Shwe leapt into the Night Side, to bring every feeling home before sunrise.' }
  ];
  const INTRO_CPS = 46;
  const introImgs = INTRO_SCENES.map(() => new Image());
  let introRaf = 0, introI = 0, introScene = -1, introTyped = 0, introLineStart = 0, introDoneAt = 0, introShot = 0;
  let mapGuidePending = false;
  function introPreload(onProgress = null) {
    let finished = 0;
    const report = () => { finished++; if (onProgress) onProgress(finished, INTRO_SCENES.length); };
    return Promise.all(INTRO_SCENES.map((sc, i) => {
      const img = introImgs[i];
      return new Promise(resolve => {
        let done = false;
        const finish = () => { if (done) return; done = true; img.onload = img.onerror = null; report(); resolve(img.naturalWidth > 0); };
        img.onload = finish; img.onerror = finish;
        if (!img.src) img.src = `assets/intro/${sc.img}.webp`;
        if (img.complete) finish();
      });
    }));
  }
  function introShowScene(i) {
    const sc = INTRO_SCENES[i], shots = [$('#introShotA'), $('#introShotB')];
    introShot ^= 1;
    const inc = shots[introShot], out = shots[introShot ^ 1];
    inc.src = introImgs[i].src; inc.alt = sc.alt;
    const sceneLines = INTRO_LINES.filter(l => l.s === i);
    const dur = sceneLines.reduce((t, l) => t + l.text.length / INTRO_CPS + .9 + l.text.length * .018, 1.5);
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
    const line = INTRO_LINES[i]; introI = i;
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
    if (line.sfx) { tone(820, .2, 'sawtooth', .03, -600); setTimeout(() => tone(620, .16, 'sawtooth', .024, -450), 90); }
  }
  function introFinish() {
    $('#introHint').classList.remove('show');
    const b = $('#introContinueBtn');
    if (b.hidden) { b.hidden = false; b.focus({ preventScroll: true }); }
  }
  function introTick(now) {
    if (state !== 'intro') return;
    const line = INTRO_LINES[introI], el = $('#introSubtitle');
    if (introTyped < line.full.length) {
      const n = Math.min(line.full.length, Math.floor((now - introLineStart) / 1000 * INTRO_CPS));
      if (n !== introTyped) { introTyped = n; el.textContent = line.full.slice(0, n); }
      if (n >= line.full.length) introDoneAt = now;
    } else {
      if (!introDoneAt) introDoneAt = now;
      if (introI === INTRO_LINES.length - 1) { introFinish(); return; }
      $('#introHint').classList.add('show');
      if (now - introDoneAt > 900 + line.full.length * 18) introShowLine(introI + 1);
    }
    introRaf = requestAnimationFrame(introTick);
  }
  function introAdvance() {
    if (state !== 'intro') return;
    const line = INTRO_LINES[introI];
    if (introTyped < line.full.length) {
      introTyped = line.full.length; $('#introSubtitle').textContent = line.full; introDoneAt = performance.now();
      return;
    }
    if (introI < INTRO_LINES.length - 1) introShowLine(introI + 1); else leaveIntro();
  }
  let introReturnView = 'storyMap';
  function leaveIntro() {
    cancelAnimationFrame(introRaf); $('#prologueScreen').hidden = true;
    [$('#introShotA'), $('#introShotB')].forEach(im => im.classList.remove('on', 'move'));
    introFx(null, 0); state = 'menu'; cv.hidden = true;
    if (introReturnView === 'hub') showHub(true); else showStoryMap(true);
  }
  function playIntro(returnView = 'storyMap') {
    introReturnView = returnView;
    initAudio(); state = 'intro'; cv.hidden = true;
    $('#welcomeScreen').hidden = true; $('#levelBriefingScreen').hidden = true; $('#nightReadyScreen').hidden = true;
    $('#startScreen').hidden = true; $('#endScreen').hidden = true; $('#awakeningScreen').hidden = true;
    $('#prologueScreen').hidden = false; $('#introContinueBtn').hidden = true;
    introPreload();
    $('#introDots').innerHTML = INTRO_SCENES.map(() => '<i></i>').join('');
    [$('#introShotA'), $('#introShotB')].forEach(im => im.classList.remove('on', 'move'));
    introScene = -1; introShowLine(0);
    $('#introArt').focus({ preventScroll: true });
    tone(196, 2.4, 'sine', .018, 12);
    cancelAnimationFrame(introRaf); introRaf = requestAnimationFrame(introTick);
  }
  $('#storyBtn').addEventListener('click', () => showStoryMap(true));
  $('#mapHubBackBtn').addEventListener('click', () => showHub(true));
  $('#mapHubBackBtnSecondary').addEventListener('click', () => showHub(true));
  $('#infoBtn').addEventListener('click', () => playIntro('hub'));
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
    { t: 15, dur: 2.5, anim: 'window', text: 'Morning. She opens the curtains. Day 7 — Thiri woke up.' }
  ];
  let awakeningRaf = 0;
  function revealAwakeningActions() {
    cancelAnimationFrame(awakeningRaf); $('#awakeningArt').dataset.anim = 'window';
    $('#awakeningTitle').textContent = 'Day 7 — Thiri woke up.';
    $('#awakeningSubtitle').textContent = 'Thiri smiles at Shwe. Tomorrow is something she can try again.';
    $('#awakeningCompleteLine').hidden = false; $('#awakeningActions').hidden = false; $('#awakeningReplayBtn').focus({ preventScroll: true });
  }
  function playFinalAwakening() {
    if (finalAwakeningSeen) { showEnd(); return; }
    finalAwakeningSeen = true;
    if (thiriSleepStage < 7) { thiriSleepStage = 7; saveStoryProgress(); }
    try { localStorage.setItem('mk-awakening-seen', '1'); } catch (e) {}
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
  $('#awakeningFreeBtn').addEventListener('click', () => startGame('free'));

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
    const im = document.createElement('img'); im.src = MK_COATS[k].img; im.alt = '';
    const sp = document.createElement('span'); sp.textContent = MK_COATS[k].name;
    lab.append(r, im, sp); breedBox.appendChild(lab);
  });
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
  function setupCoat() { return (setupEl.querySelector('input[name="coat"]:checked') || {}).value || 'burmese'; }
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
    const cvp = $('#setupCatCanvas'), g = cvp.getContext('2d'), key = setupCoat(), spr = MK_SPRITES[key];
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cvp.width, cvp.height);
    if (spr && spr.complete && spr.naturalWidth) {
      const s2 = now / 1000, cyc = s2 % 6, hh = 230, ww = hh * spr.naturalWidth / spr.naturalHeight;
      let pose, lift = 0;
      if (cyc < 3.2) { const ph = s2 * 9; pose = { back: Math.sin(ph) * .34, front: -Math.sin(ph) * .34, tail: Math.sin(s2 * 6) * .12 }; lift = Math.abs(Math.sin(ph)) * 5; }
      else if (cyc < 4.8) pose = { tail: Math.sin(s2 * 2.2) * .18, breath: Math.sin(s2 * 2.6) * .02 };
      else { const j = (cyc - 4.8) / 1.2, up = Math.sin(j * Math.PI); pose = { back: -.4 * up, front: .35 * up, tail: -.2 * up }; lift = up * 34; }
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
    const coat = MK_COATS[MK_PROFILE.coat] || MK_COATS.burmese;
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
    const coat = MK_COATS[MK_PROFILE.coat] || MK_COATS.burmese;
    $('#mapGuideCat').src = coat.img; $('#mapGuideName').textContent = MK_PROFILE.cat;
    $('#mapGuideText').textContent = `${MK_PROFILE.cat} will follow the glowing path with you. Choose the lit night at its base to see the first goal.`;
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
    $('#levelBriefingEyebrow').textContent = `NIGHT ${briefingNight} · THE NIGHT SIDE`;
    $('#levelBriefingTitle').textContent = chapter.name;
    $('#levelBriefingSub').textContent = chapter.sub;
    const goal = Object.entries(chapter.feelingsNeeded || {}).map(([type, count]) => `${BRIEFING_FEELING_NAMES[type] || type} ×${count}`).join(' · ');
    $('#levelBriefingGoal').textContent = goal ? `Bring home: ${goal}` : 'Find the little lights that are ready to come home.';
    $('#levelBriefingTip').textContent = chapter.tutorialHint || chapter.newMoodling || chapter.sub;
    const seconds = Math.max(0, Math.floor(chapter.timeLimit || 0));
    $('#levelBriefingTime').textContent = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')} before sunrise`;
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
    $('#readyNightEyebrow').textContent = `NIGHT ${briefingNight} · ${chapter.name}`;
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
    ['#welcomeScreen', '#startScreen', '#hubSettingsScreen', '#prologueScreen', '#endScreen', '#levelBriefingScreen', '#nightReadyScreen', '#shopScreen', '#bookScreen'].forEach(id => { const el = $(id); if (el) el.hidden = true; });
    girlIn.value = MK_HAS_PROFILE ? MK_PROFILE.girl : ''; catIn.value = MK_HAS_PROFILE ? MK_PROFILE.cat : '';
    const r = setupEl.querySelector(`input[name="coat"][value="${MK_PROFILE.coat}"]`); if (r) r.checked = true;
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
    COAT = MK_COATS[MK_PROFILE.coat]; MK_HAS_PROFILE = true;
    try { localStorage.setItem('mk-profile', JSON.stringify(MK_PROFILE)); } catch (err) {}
    paintCoat(COAT); renameAll();
    setupEl.hidden = true;
    if (setupFirstRun) { mapGuidePending = true; playIntro(); } else showMainMenu(true);
  });
  $('#welcomeBeginBtn').addEventListener('click', () => showSetup(true));
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
  $('#settingsBtn').addEventListener('click', () => { $('#hubSettingsScreen').hidden = false; $('#settingsCloseBtn').focus({ preventScroll: true }); });
  $('#settingsCloseBtn').addEventListener('click', () => { $('#hubSettingsScreen').hidden = true; $('#settingsBtn').focus({ preventScroll: true }); });
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

  buildLevelMap();
  if (!MK_HAS_PROFILE) showWelcome();
  else showMainMenu(false);
  syncMobileOrientationGate();
  pauseBtn.addEventListener('click', pauseGame);
  pauseContinueBtn.addEventListener('click', resumeGame);
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
  $('#freeBtn').addEventListener('click', () => startGame('free'));
  $('#againBtn').addEventListener('click', () => {
    if (R && R.won && !R.free && R.night < 7) startGame('story', R.night + 1);
    else startGame(mode, storyNight);
  });
  $('#menuBtn').addEventListener('click', () => { mouseSneakHeld = false; mouseSneakPointerId = null; mouseSneakPress = null; refreshShopBtns(); showMainMenu(true); });
  $('#previewBtn').addEventListener('click', () => { initAudio(); startHome(true, ['F', 'F', 'F', 'F', 'L', 'N', 'N', 'N', 'N', 'L'], true); });

  let last = performance.now();
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(.033, (now - last) / 1000); last = now;
    pauseBtn.hidden = state !== 'play';
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
    render(dt);
  }
  requestAnimationFrame(frame);
})();
