/* TideCatcher - game sounds + ambience add-on.
   Load AFTER js/tc-sfx.js and BEFORE js/game.js:
     <script src="js/tc-sfx.js"></script>
     <script src="js/tc-game-audio.js"></script>
     <script src="js/game.js"></script>
   It replaces the built-in placeholder tones for step / jump / land / pounce / scratch / eyes /
   click-type UI / reward / result / timeup with the new files, and replaces the placeholder noise
   ambience with the 5 loops (1.5 s crossfade). Anything it does not know is passed to the original
   code (set window.TC_FESTIVAL = 'gentle' before this script to use the Gentle festival), and if a file fails to load the original placeholder is used, so the game never goes silent.
   Uses the game's own settings (tc-audio in localStorage: effects, ambience, mute). */
(function () {
  if (!window.TCSfx || !window.TCMusic) { console.warn('[tc-game-audio] load after tc-sfx.js'); return; }
  const ogg = (() => { try { return !!new Audio().canPlayType('audio/ogg; codecs="vorbis"'); } catch (e) { return false; } })();
  const EXT = ogg ? '.ogg' : '.mp3';          // Both formats are bundled for browser compatibility
  const ROOT = window.TC_GAME_AUDIO_BASE || 'assets/audio/';
  const SFX = ROOT + 'sfx/';
  // Default to environment-only loops underneath the existing place music. Mixed versions remain available via TC_AMBIENCE_MUSIC = true.
  const AMB = ROOT + (window.TC_AMBIENCE_MUSIC === true ? 'ambience/' : 'ambience_dry/');
  const AMB_MAP = { school: 'amb_hallway', intro: 'amb_hallway', menu: 'amb_crickets', park: 'amb_crickets',
    festival: (window.TC_FESTIVAL === 'gentle' ? 'amb_festival_gentle' : 'amb_festival_quiet'), hilltop: 'amb_wind', lakeside: 'amb_lake_water' };
  const AMB_LEVEL = { amb_hallway: 1, amb_crickets: 0.9, amb_festival_quiet: 1, amb_festival_gentle: 1, amb_wind: 1, amb_lake_water: 1 };
  const CLICKS = ['click', 'select', 'tab', 'toggle', 'confirm', 'continue', 'chapter'];
  const BACKS = ['back', 'close', 'cancel'];
  const POUNCES = ['sfx_pounce', 'sfx_pounce_2', 'sfx_pounce_3', 'sfx_pounce_meow'];
  const SCRATCHES = ['sfx_scratch', 'sfx_scratch_2', 'sfx_scratch_3'];
  const lastPick = {};
  const pick = (key, list) => { let n; do { n = list[Math.floor(Math.random() * list.length)]; } while (list.length > 1 && n === lastPick[key]); return (lastPick[key] = n); };
  const STEPS = ['sfx_paw_steps', 'sfx_paw_steps_2', 'sfx_paw_steps_3'];
  const SFX_FILES = [...STEPS, 'sfx_paw_steps_sneak', 'sfx_jump', 'sfx_land', ...POUNCES, ...SCRATCHES,
    'sfx_night_eyes', 'sfx_button_click', 'sfx_night_complete', 'sfx_night_failed', 'sfx_unlock'];
  const LEVEL = { sfx_paw_steps: 0.9, sfx_paw_steps_2: 0.9, sfx_paw_steps_3: 0.9, sfx_paw_steps_sneak: 0.8, sfx_jump: 0.9,
    sfx_land: 0.9, sfx_pounce: 1, sfx_pounce_2: 1, sfx_pounce_3: 1, sfx_scratch: 1, sfx_scratch_2: 1, sfx_scratch_3: 1, sfx_night_eyes: 1, sfx_button_click: 0.9, sfx_night_complete: 1,
    sfx_night_failed: 0.9, sfx_unlock: 1 };
  let ac = null, out = null, ambienceOut = null, effectsOut = null, analyser = null, unlocked = false, sneaking = false, duck = 1, want = null, stepIx = 0, sfxDuck = 1, duckTimer = 0;
  const bufs = {}, loading = {}, last = {}, live = {}, failed = {};
  let cur = null;   // { name, gain, src, filter }
  const settings = () => { try { return JSON.parse(localStorage.getItem('tc-audio') || 'null') || {}; } catch (e) { return {}; } };
  function ensure() {
    if (!ac) {
      try {
        ac = new (window.AudioContext || window.webkitAudioContext)();
        out = ac.createGain(); out.connect(ac.destination);
        ambienceOut = ac.createGain(); ambienceOut.gain.value = ambGain(); ambienceOut.connect(out);
        effectsOut = ac.createGain(); effectsOut.gain.value = TCSfx.level(); effectsOut.connect(out);
        analyser = ac.createAnalyser(); analyser.fftSize = 2048; out.connect(analyser);
      } catch (e) { ac = null; }
    }
    if (ac && ac.state === 'suspended') ac.resume().catch(() => {});
    return ac;
  }
  function load(url) {
    if (bufs[url]) return Promise.resolve(bufs[url]);
    if (failed[url]) return Promise.reject();
    if (!loading[url]) {
      loading[url] = fetch(url).then(r => { if (!r.ok) throw 0; return r.arrayBuffer(); })
        .then(a => ensure().decodeAudioData(a)).then(b => (bufs[url] = b))
        .catch(e => { failed[url] = true; console.warn('[tc-game-audio] could not load', url); throw e; });
    }
    return loading[url];
  }
  // ---------- effects ----------
  function playSfx(name, vol = 1, rate = 1) {
    const url = SFX + name + EXT, b = bufs[url];
    if (!unlocked || !ensure()) return false;
    const lv = TCSfx.level(); if (lv <= 0) return true;          // muted or effects at 0: stay silent
    if (!b) { load(url).catch(() => {}); return false; }          // not ready yet -> original placeholder this time
    const now = performance.now();
    if (now - (last[name] || 0) < 55 || (live[name] || 0) >= 3) return true;   // never stack the same sound
    last[name] = now; live[name] = (live[name] || 0) + 1;
    const s = ac.createBufferSource(), g = ac.createGain();
    s.buffer = b; s.playbackRate.value = rate * (0.96 + Math.random() * 0.08);
    effectsOut.gain.value = lv;
    g.gain.value = vol * (LEVEL[name] || 1);
    s.connect(g).connect(effectsOut);
    s.onended = () => { live[name] = Math.max(0, (live[name] || 1) - 1); };
    s.start();
    duckForSfx(name);
    return true;
  }
  const origUi = TCSfx.ui;
  TCSfx.ui = function (kind, strength = 1) {
    let handled = false;
    if (kind === 'step') handled = sneaking ? playSfx('sfx_paw_steps_sneak', strength) : playSfx(STEPS[stepIx++ % STEPS.length], strength);
    else if (kind === 'jump') handled = playSfx('sfx_jump', strength);
    else if (kind === 'land') handled = playSfx('sfx_land', strength);
    else if (kind === 'pounce') handled = playSfx(pick('pounce', POUNCES), strength);
    else if (kind === 'scratch') handled = playSfx(pick('scratch', SCRATCHES), strength);
    else if (kind === 'eyes') handled = playSfx('sfx_night_eyes', strength);
    else if (CLICKS.includes(kind)) handled = playSfx('sfx_button_click', strength);
    else if (BACKS.includes(kind)) handled = playSfx('sfx_button_click', strength * 0.85, 0.88);
    else if (kind === 'reward') handled = playSfx('sfx_night_complete', strength);
    else if (kind === 'result' || kind === 'timeup') handled = playSfx('sfx_night_failed', strength);
    else if (kind === 'unlock') handled = playSfx('sfx_unlock', strength);
    if (!handled) return origUi.apply(this, arguments);
  };
  // ---------- ambience ----------
  function ambGain() {
    const s = settings();
    if (s.mute) return 0;
    const v = typeof s.ambience === 'number' ? s.ambience : 0.65;
    return v * 0.9 * duck * sfxDuck;
  }
  // gameplay effects briefly pull the ambience (and its music) down so they stay clearly audible
  const DUCKERS = /^sfx_(pounce|scratch|jump|land|night_eyes|night_complete|night_failed|unlock)/;
  function duckForSfx(name) {
    if (!DUCKERS.test(name) || !cur || !ac) return;
    sfxDuck = 0.55; applyAmbGain(0.03);
    clearTimeout(duckTimer);
    duckTimer = setTimeout(() => { sfxDuck = 1; applyAmbGain(0.35); }, /night_(complete|failed)|unlock/.test(name) ? 1400 : 420);
  }
  function applyAmbGain(tc = 0.2) {
    if (!ac) return;
    ambienceOut.gain.cancelScheduledValues(ac.currentTime);
    ambienceOut.gain.setTargetAtTime(ambGain(), ac.currentTime, tc);
    if (!cur) return;
    cur.filter.frequency.setTargetAtTime(duck < 1 ? 700 : 20000, ac.currentTime, 0.12);
  }
  function startAmbience(name) {
    const file = AMB_MAP[name];
    if (!file) return;
    load(AMB + file + EXT).then(buf => {
      if (want !== name || !ensure()) return;                    // user already moved on
      if (cur && cur.name === file) return;
      const old = cur, t = ac.currentTime;
      const src = ac.createBufferSource(), filter = ac.createBiquadFilter(), gain = ac.createGain();
      src.buffer = buf; src.loop = true; filter.type = 'lowpass'; filter.frequency.value = duck < 1 ? 700 : 20000;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime((AMB_LEVEL[file] || 1), t + 1.5);
      src.connect(filter).connect(gain).connect(ambienceOut);
      src.start(0, Math.random() * buf.duration);                 // start anywhere in the loop
      cur = { name: file, gain, src, filter };
      if (old) {
        old.gain.gain.cancelScheduledValues(t); old.gain.gain.setValueAtTime(Math.max(0.0001, old.gain.gain.value), t);
        old.gain.gain.linearRampToValueAtTime(0.0001, t + 1.5); setTimeout(() => { try { old.src.stop(); } catch (e) {} }, 1700);
      }
    }).catch(() => { if (want === name) { stopAmbience(); origAmbience.call(TCMusic, name); } });        // file missing -> original placeholder bed
  }
  function stopAmbience() {
    if (!cur || !ac) return;
    const old = cur, t = ac.currentTime; cur = null;
    old.gain.gain.cancelScheduledValues(t); old.gain.gain.setValueAtTime(Math.max(0.0001, old.gain.gain.value), t);
    old.gain.gain.linearRampToValueAtTime(0.0001, t + 1.5);
    setTimeout(() => { try { old.src.stop(); } catch (e) {} }, 1700);
  }
  const origAmbience = TCMusic.ambience, origDuck = TCMusic.duck, origRefresh = TCMusic.refresh;
  TCMusic.ambience = function (name) {
    want = name || null;
    if (!name) { stopAmbience(); return origAmbience.call(this, null); }
    if (!AMB_MAP[name]) { stopAmbience(); return origAmbience.call(this, name); }
    origAmbience.call(this, null);
    if (unlocked) startAmbience(name);                            // else it starts on the first tap/key
  };
  TCMusic.duck = function (k) { origDuck.apply(this, arguments); duck = Math.max(0, Math.min(1, k)); applyAmbGain(); };
  TCMusic.refresh = function () { origRefresh.apply(this, arguments); if (effectsOut) effectsOut.gain.value = TCSfx.level(); applyAmbGain(); };
  const origEffectsVolume = TCSfx.setVolume;
  TCSfx.setVolume = function (v) { origEffectsVolume.call(this, v); if (effectsOut) effectsOut.gain.value = TCSfx.level(); };
  // ---------- browser autoplay rule ----------
  const unlock = () => {
    unlocked = true; ensure();
    SFX_FILES.forEach(n => load(SFX + n + EXT).catch(() => {}));
    if (want) startAmbience(want);
    removeEventListener('pointerdown', unlock); removeEventListener('keydown', unlock);
  };
  addEventListener('pointerdown', unlock); addEventListener('keydown', unlock);
  window.TCGameAudio = {
    // call from game.js:  TCGameAudio.setSneaking(c.sneak)  -> paw steps become almost silent while sneaking
    setSneaking: b => { sneaking = !!b; },
    status: () => ({ unlocked, ctx: ac && ac.state, ambience: cur && cur.name, loaded: Object.keys(bufs).length, failed: Object.keys(failed) }),
    _level: () => { if (!analyser) return 0; const d = new Float32Array(analyser.fftSize); analyser.getFloatTimeDomainData(d); let s = 0; for (const v of d) s += v * v; return Math.sqrt(s / d.length); },
  };
})();
