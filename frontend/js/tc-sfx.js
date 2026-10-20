/* TideCatcher audio: real cat/Moodling assets plus small original Web Audio UI/gameplay placeholders.
   Loaded before game.js. No audio is created until a user gesture unlocks the browser context. */
(function () {
  const ogg = (() => { try { return !!new Audio().canPlayType('audio/ogg; codecs="vorbis"'); } catch (e) { return false; } })();
  const BASE = ogg ? 'assets/audio/ogg/' : 'assets/audio/mp3/', EXT = ogg ? '.ogg' : '.mp3';
  const VOICE = { F: 'sfx_mood_frustrated_growl', N: 'sfx_mood_nervous_squeak', L: 'sfx_mood_lonely_sigh',
    C: 'sfx_mood_calm_chime', S: 'sfx_mood_shy_giggle', J: 'sfx_mood_jealous_hmph',
    E: 'sfx_mood_excited_boing', B: 'sfx_mood_shy_giggle', G: 'sfx_mood_golden_sparkle' };
  const CAT = { meow: 'sfx_cat_meow', trill: 'sfx_cat_happy_trill', purr: 'sfx_cat_purr', sad: 'sfx_cat_sad_mew', hiss: 'sfx_cat_hiss' };
  const LEVEL = { sfx_cat_purr: .5, sfx_mood_golden_sparkle: .55, sfx_mood_calm_chime: .7 };
  const names = [...new Set([...Object.values(VOICE), ...Object.values(CAT), 'sfx_catch_happy_chime', 'sfx_mood_frustrated_charge', 'sfx_mood_frustrated_dizzy'])];
  const profiles = {
    click: { f: 740, d: .045, w: 'sine', v: .045 }, hover: { f: 1040, d: .035, w: 'sine', v: .018 },
    back: { f: 520, to: 390, d: .09, w: 'sine', v: .055 }, toggle: { f: 580, to: 850, d: .09, w: 'triangle', v: .06 },
    tick: { f: 920, d: .028, w: 'sine', v: .025 }, tab: { f: 660, to: 880, d: .1, w: 'sine', v: .05 },
    page: { f: 560, to: 780, d: .16, w: 'triangle', v: .055, noise: .12 }, pop: { f: 490, to: 740, d: .19, w: 'sine', v: .075 },
    swish: { f: 420, to: 980, d: .2, w: 'sine', v: .045, noise: .16 }, error: { f: 220, to: 165, d: .16, w: 'triangle', v: .06 },
    buy: { f: 660, to: 990, d: .24, w: 'sine', v: .08 }, select: { f: 540, to: 810, d: .15, w: 'triangle', v: .065 },
    title: { f: 523.25, d: .62, w: 'sine', v: .06, notes: [523.25, 659.25, 783.99] },
    intro: { f: 392, d: .38, w: 'sine', v: .045, notes: [392, 523.25, 659.25] }, ready: { f: 392, d: .3, w: 'triangle', v: .08, notes: [392, 523.25, 659.25] },
    start: { f: 523.25, d: .46, w: 'sine', v: .075, notes: [523.25, 659.25, 783.99] },
    countdown: { f: 780, d: .085, w: 'sine', v: .07 }, urgent: { f: 980, d: .09, w: 'triangle', v: .085 }, timeup: { f: 330, to: 165, d: .55, w: 'triangle', v: .08 },
    pause: { f: 523.25, d: .2, w: 'sine', v: .055, notes: [523.25, 392] }, resume: { f: 392, d: .26, w: 'sine', v: .06, notes: [392, 523.25, 659.25] },
    jump: { f: 340, to: 620, d: .14, w: 'triangle', v: .045 }, land: { f: 180, to: 105, d: .12, w: 'sine', v: .045 },
    edge: { f: 880, to: 660, d: .12, w: 'sine', v: .035 }, crumble: { f: 210, to: 145, d: .22, w: 'triangle', v: .045, noise: .12 },
    platformHum: { f: 174, to: 196, d: .3, w: 'sine', v: .025 }, fall: { f: 560, to: 220, d: .42, w: 'sine', v: .05 },
    respawn: { f: 440, d: .24, w: 'sine', v: .05, notes: [440, 587, 784] },
    checkpoint: { f: 659, d: .3, w: 'sine', v: .055, notes: [659, 784, 988] },
    lifeLost: { f: 392, to: 196, d: .3, w: 'triangle', v: .05 },
    poof: { f: 740, to: 370, d: .28, w: 'sine', v: .04 },
    step: { f: 165, d: .045, w: 'sine', v: .018, noise: .12 }, pounce: { f: 270, to: 740, d: .17, w: 'triangle', v: .06, noise: .15 },
    scratch: { f: 430, to: 240, d: .17, w: 'triangle', v: .04, noise: .2 }, eyes: { f: 740, d: .34, w: 'sine', v: .045, notes: [740, 988] },
    combo: { f: 620, to: 1240, d: .22, w: 'sine', v: .065 }, comboLost: { f: 330, to: 220, d: .16, w: 'triangle', v: .04 },
    hit: { f: 250, to: 120, d: .17, w: 'triangle', v: .055, noise: .18 }, appear: { f: 470, to: 710, d: .2, w: 'sine', v: .05 },
    sparkle: { f: 1047, to: 1568, d: .32, w: 'sine', v: .045, notes: [1047, 1318, 1568] },
    result: { f: 440, d: .38, w: 'sine', v: .06, notes: [440, 554, 659] }, resultTick: { f: 720, d: .05, w: 'sine', v: .022 }, reward: { f: 523.25, d: .5, w: 'sine', v: .075, notes: [523.25, 659, 784, 1047] },
  };
  const UI_ALIAS = { click: 'click', hover: 'hover', back: 'back', cancel: 'back', toggle: 'toggle', tab: 'tab', page: 'page',
    buy: 'buy', select: 'select', error: 'error', pause: 'pause', resume: 'resume', jump: 'jump', pounce: 'pounce', purr: 'click', eyes: 'eyes', scratch: 'scratch',
    edge: 'edge', crumble: 'crumble', platformHum: 'platformHum', fall: 'fall', respawn: 'respawn', checkpoint: 'checkpoint', lifeLost: 'lifeLost', poof: 'poof',
    close: 'back', chapter: 'select', start: 'start', continue: 'select', confirm: 'select', reset: 'error' };
  let ctx = null, master = null, volume = .8, muted = false, musicVol = .75, ambienceVol = .65, unlocked = false;
  try { const s = JSON.parse(localStorage.getItem('tc-audio') || 'null'); if (s) { if (typeof s.effects === 'number') volume = s.effects; if (typeof s.music === 'number') musicVol = s.music; if (typeof s.ambience === 'number') ambienceVol = s.ambience; muted = !!s.mute; } } catch (e) {}
  const save = () => { try { localStorage.setItem('tc-audio', JSON.stringify({ effects: volume, music: musicVol, ambience: ambienceVol, mute: muted })); } catch (e) {} };
  const buffers = {}, elems = {}, last = {}, active = Object.create(null), warned = new Set();
  const warnMissing = url => { if (warned.has(url)) return; warned.add(url); console.warn('[TideCatcher audio] Could not load audio asset:', url); };
  function ensure() {
    if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); master = ctx.createGain(); master.gain.value = 1; master.connect(ctx.destination); } catch (e) { ctx = null; } }
    if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  }
  async function load(name) {
    if (buffers[name] || elems[name]) return;
    const url = BASE + name + EXT;
    try {
      if (!ensure() || location.protocol === 'file:') throw 0;
      buffers[name] = await ctx.decodeAudioData(await (await fetch(url)).arrayBuffer());
    } catch (e) {
      const a = new Audio(url); a.preload = 'auto'; a.addEventListener('error', () => warnMissing(url), { once: true }); elems[name] = a;
    }
  }
  function claim(name) { active[name] = active[name] || 0; if (active[name] >= 4) return false; active[name]++; return true; }
  function releaseLater(name, ms) { setTimeout(() => { active[name] = Math.max(0, (active[name] || 1) - 1); }, ms); }
  function synth(name, val = 1, pitch = 1) {
    const spec = profiles[name] || profiles.click, ac = ensure(); if (!unlocked || muted || volume <= 0 || !ac || !claim(name)) return;
    const now = ac.currentTime, dur = spec.d, baseGain = volume * val * spec.v, tunedPitch = pitch * (.95 + Math.random() * .1);
    const notes = spec.notes || [spec.f];
    notes.forEach((freq, i) => {
      const osc = ac.createOscillator(), env = ac.createGain(); osc.type = spec.w || 'sine';
      const startAt = now + i * (spec.notes ? .055 : 0), noteDur = spec.notes ? Math.max(.09, dur - i * .045) : dur;
      osc.frequency.setValueAtTime(freq * tunedPitch, startAt);
      if (spec.to) osc.frequency.exponentialRampToValueAtTime(Math.max(40, spec.to * tunedPitch), startAt + noteDur);
      env.gain.setValueAtTime(.0001, startAt); env.gain.linearRampToValueAtTime(baseGain / Math.max(1, notes.length) * (spec.notes ? 1.2 : 1), startAt + Math.min(.018, noteDur * .2));
      env.gain.exponentialRampToValueAtTime(.0001, startAt + noteDur);
      osc.connect(env).connect(master); osc.start(startAt); osc.stop(startAt + noteDur + .02);
    });
    if (spec.noise) {
      const len = Math.max(1, Math.floor(ac.sampleRate * Math.min(.24, dur))), buf = ac.createBuffer(1, len, ac.sampleRate), data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = ac.createBufferSource(), filter = ac.createBiquadFilter(), env = ac.createGain(); src.buffer = buf;
      filter.type = 'lowpass'; filter.frequency.value = 1700; env.gain.setValueAtTime(baseGain * spec.noise, now); env.gain.exponentialRampToValueAtTime(.0001, now + dur);
      src.connect(filter).connect(env).connect(master); src.start(now); src.stop(now + dur + .02);
    }
    releaseLater(name, (dur + .25) * 1000);
  }
  function play(name, vol = 1) {
    if (profiles[name]) { synth(name, vol); return; }
    if (!unlocked || muted || volume <= 0) return;
    const now = performance.now(); if (now - (last[name] || 0) < 90 || !claim(name)) return; last[name] = now;
    const g = volume * vol * (LEVEL[name] || 1), rate = .95 + Math.random() * .1;
    if (buffers[name] && ensure()) {
      const s = ctx.createBufferSource(), gn = ctx.createGain(); s.buffer = buffers[name]; s.playbackRate.value = rate; gn.gain.value = g;
      s.connect(gn).connect(master); s.addEventListener('ended', () => { active[name] = Math.max(0, active[name] - 1); }, { once: true }); s.start();
    } else if (elems[name]) {
      const a = elems[name].cloneNode(); a.volume = Math.min(1, g); a.playbackRate = rate;
      const done = () => { active[name] = Math.max(0, active[name] - 1); };
      a.addEventListener('ended', done, { once: true }); a.addEventListener('error', () => { warnMissing(BASE + name + EXT); done(); }, { once: true });
      const p = a.play(); if (p && p.catch) p.catch(() => { done(); warnMissing(BASE + name + EXT); });
    } else { load(name).then(() => { active[name] = Math.max(0, (active[name] || 1) - 1); last[name] = 0; play(name, vol); }); }
  }
  const api = {
    play, preload: () => names.forEach(load),
    moodling: (type, vol) => VOICE[type] && play(VOICE[type], vol),
    cat: (what, vol) => CAT[what] && play(CAT[what], vol),
    caught: type => { play('sfx_catch_happy_chime', .8); if (VOICE[type]) setTimeout(() => play(VOICE[type], .7), 140); },
    ui: (kind, strength = 1) => synth(UI_ALIAS[kind] || kind || 'click', strength),
    combo: count => synth('combo', .72, Math.pow(2, Math.max(0, Math.min(5, Number(count) || 1) - 1) / 12)),
    level: () => muted ? 0 : volume,
    setVolume: v => { volume = Math.max(0, Math.min(1, v)); save(); },
    mute: m => { muted = !!m; save(); if (window.TCMusic) TCMusic.refresh(); },
  };
  window.TCSfx = api;
  const unlock = () => {
    unlocked = true; ensure(); api.preload(); removeEventListener('pointerdown', unlock); removeEventListener('keydown', unlock);
    const welcome = document.getElementById('welcomeScreen'), begin = document.getElementById('welcomeBeginBtn');
    if (welcome && !welcome.hidden && begin?.disabled) { TCMusic.play('intro'); TCMusic.ambience('intro'); }
  };
  addEventListener('pointerdown', unlock); addEventListener('keydown', unlock);

  // ---------- music: existing real place pieces plus procedural screen beds ----------
  const STYLE = 'piano';
  const MBASE = (ogg ? 'assets/audio/music/ogg/' : 'assets/audio/music/mp3/') + (STYLE === 'piano' ? 'piano_' : 'music_');
  const STORY_TRACKS = new Set(['intro', 'menu', 'bedroom', 'ending']);
  const GAP = [25, 45];
  const music = { cur: null, el: null, media: null, generated: null, duck: 1, timer: 0 };
  const musicGain = () => muted ? 0 : Math.min(1, musicVol * 1.15 * music.duck);
  function fadeTo(el, target, ms, done) {
    if (el._tcGain && ctx) {
      const p = el._tcGain.gain, start = p.value, t0 = performance.now();
      const step = now => { const k = Math.min(1, (now - t0) / ms); p.setValueAtTime(Math.max(0, start + (target - start) * k), ctx.currentTime); if (k < 1) requestAnimationFrame(step); else if (done) done(); };
      requestAnimationFrame(step); return;
    }
    const from = el.volume, t0 = performance.now();
    const step = now => { const k = Math.min(1, (now - t0) / ms); el.volume = Math.max(0, Math.min(1, from + (target - from) * k)); if (k < 1) requestAnimationFrame(step); else if (done) done(); };
    requestAnimationFrame(step);
  }
  function routeMusic(el) {
    const ac = ensure(); if (!ac || el._tcGain) return;
    try {
      const source = ac.createMediaElementSource(el), filter = ac.createBiquadFilter(), gain = ac.createGain();
      filter.type = 'lowpass'; filter.frequency.value = music.duck < 1 ? 1800 : 20000; gain.gain.value = 0;
      source.connect(filter).connect(gain).connect(ac.destination); el._tcSource = source; el._tcFilter = filter; el._tcGain = gain; music.media = { el, filter, gain };
    } catch (e) { music.media = null; }
  }
  function startEl(el) {
    const go = () => {
      if (music.el !== el) return;
      routeMusic(el); el.volume = el._tcGain ? 1 : 0;
      el.play().then(() => fadeTo(el, musicGain(), 1500)).catch(() => {});
    };
    go(); addEventListener('pointerdown', go, { once: true }); addEventListener('keydown', go, { once: true });
  }
  function stopGenerated(ms = 1500) {
    const g = music.generated; if (!g) return; music.generated = null;
    const now = ctx ? ctx.currentTime : 0;
    if (ctx) { g.gain.gain.cancelScheduledValues(now); g.gain.gain.setValueAtTime(g.gain.gain.value, now); g.gain.gain.linearRampToValueAtTime(.0001, now + ms / 1000); }
    setTimeout(() => { g.nodes.forEach(n => { try { n.stop(); } catch (e) {} }); }, ms + 50);
  }
  function startGenerated(name) {
    const ac = ensure(); if (!ac || !unlocked) return;
    const chords = { menu: [110, 164.81, 220], intro: [130.81, 196, 261.63], results: [174.61, 220, 261.63] }[name] || [110, 164.81, 220];
    const filter = ac.createBiquadFilter(), gain = ac.createGain(), nodes = [];
    filter.type = 'lowpass'; filter.frequency.value = 20000; gain.gain.setValueAtTime(.0001, ac.currentTime);
    gain.gain.linearRampToValueAtTime(musicGain() * .11, ac.currentTime + 2); filter.connect(gain).connect(ac.destination);
    chords.forEach((f, i) => { const o = ac.createOscillator(), g = ac.createGain(); o.type = i === 1 ? 'triangle' : 'sine'; o.frequency.value = f; g.gain.value = i === 0 ? .17 : .085; o.connect(g).connect(filter); o.start(); nodes.push(o, g); });
    music.generated = { nodes, gain, filter };
  }
  const TCMusic = {
    play(name) {
      clearTimeout(music.timer);
      if (music.cur === name && (music.el || music.generated)) { TCMusic.refresh(); return; }
      const old = music.el; if (old) fadeTo(old, 0, 1500, () => old.pause());
      if (music.generated) stopGenerated(1500);
      music.el = null; music.media = null; music.cur = name || null;
      if (!name) return;
      if (name === 'results') { startGenerated(name); return; }
      const story = STORY_TRACKS.has(name);
      const el = new Audio(story ? `assets/audio/story/${name}${EXT}` : MBASE + name + EXT); el.preload = 'auto'; el.loop = story || STYLE !== 'piano'; el.volume = 0; music.el = el;
      el.addEventListener('error', () => {
        if (music.el !== el) return;
        el.pause(); music.el = null; music.media = null; startGenerated(name);
      }, { once: true });
      el.addEventListener('ended', () => {
        if (music.el !== el) return;
        const wait = (GAP[0] + Math.random() * (GAP[1] - GAP[0])) * 1000;
        music.timer = setTimeout(() => { if (music.el === el) { el.currentTime = 0; startEl(el); } }, wait);
      });
      music.timer = setTimeout(() => startEl(el), !story && STYLE === 'piano' ? 1800 : 0);
    },
    stop() { TCMusic.play(null); },
    duck(k) {
      music.duck = Math.max(0, Math.min(1, k)); if (music.el && !music.el.paused) fadeTo(music.el, musicGain(), 420);
      const cutoff = music.duck < 1 ? 1800 : 20000;
      if (music.media && ctx) music.media.filter.frequency.setTargetAtTime(cutoff, ctx.currentTime, .11);
      if (music.generated && ctx) { music.generated.gain.gain.setTargetAtTime(musicGain() * .11, ctx.currentTime, .12); music.generated.filter.frequency.setTargetAtTime(cutoff, ctx.currentTime, .12); }
      if (ambience.current && ctx) {
        setAmbienceGain(ambience.current, muted ? 0 : ambienceVol * .06 * music.duck);
        ambience.current.filter.frequency.setTargetAtTime(music.duck < 1 ? Math.max(280, ambience.current.cut * .5) : ambience.current.cut, ctx.currentTime, .12);
      }
    },
    refresh() {
      if (music.el && !music.el.paused) fadeTo(music.el, musicGain(), 300);
      if (music.media && ctx) { music.media.gain.gain.setTargetAtTime(musicGain(), ctx.currentTime, .08); music.media.filter.frequency.setTargetAtTime(music.duck < 1 ? 1800 : 20000, ctx.currentTime, .1); }
      if (music.generated && ctx) music.generated.gain.gain.setTargetAtTime(musicGain() * .11, ctx.currentTime, .08);
      if (ambience.current) {
        setAmbienceGain(ambience.current, muted ? 0 : ambienceVol * .06 * music.duck);
        ambience.current.filter.frequency.setTargetAtTime(music.duck < 1 ? Math.max(280, ambience.current.cut * .5) : ambience.current.cut, ctx.currentTime, .12);
      }
    },
    setVolume(v) { musicVol = Math.max(0, Math.min(1, v)); save(); TCMusic.refresh(); },
    setAmbience(v) { ambienceVol = Math.max(0, Math.min(1, v)); save(); TCMusic.refresh(); },
    ambience(name) { setAmbience(name); },
  };
  window.TCMusic = TCMusic;

  // Original, low-level noise/tonal ambience; each map crossfades over 1.5 seconds.
  const ambience = { current: null, noise: null };
  const AMB = { school: [760, 58], park: [2200, 310], festival: [1250, 92], hilltop: [900, 74], lakeside: [1450, 165], menu: [1200, 110], intro: [680, 82] };
  function setAmbienceGain(track, target) { if (!track || !ctx) return; track.gain.gain.setTargetAtTime(Math.max(.0001, target), ctx.currentTime, .22); }
  function setAmbience(name) {
    if (name === ambience.current?.name) return; const ac = ensure(), old = ambience.current;
    ambience.current = null;
    if (old && ac) { old.gain.gain.cancelScheduledValues(ac.currentTime); old.gain.gain.setValueAtTime(old.gain.gain.value, ac.currentTime); old.gain.gain.linearRampToValueAtTime(.0001, ac.currentTime + 1.5); setTimeout(() => old.nodes.forEach(n => { try { n.stop(); } catch (e) {} }), 1550); }
    if (!name || !ac || !unlocked) return;
    const [cut, pitch] = AMB[name] || AMB.park;
    if (!ambience.noise) { ambience.noise = ac.createBuffer(1, ac.sampleRate * 3, ac.sampleRate); const d = ambience.noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * .25; }
    const src = ac.createBufferSource(), filter = ac.createBiquadFilter(), gain = ac.createGain(), hum = ac.createOscillator(), humGain = ac.createGain();
    src.buffer = ambience.noise; src.loop = true; filter.type = 'lowpass'; filter.frequency.value = cut; src.connect(filter).connect(gain).connect(ac.destination);
    hum.type = 'sine'; hum.frequency.value = pitch; humGain.gain.value = .08; hum.connect(humGain).connect(gain);
    gain.gain.setValueAtTime(.0001, ac.currentTime); gain.gain.linearRampToValueAtTime(muted ? .0001 : ambienceVol * .06 * music.duck, ac.currentTime + 1.5);
    src.start(); hum.start(); ambience.current = { name, gain, filter, cut, nodes: [src, hum] };
  }

  let tabDuckRestore = null;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (tabDuckRestore === null) tabDuckRestore = music.duck;
      TCMusic.duck(Math.min(music.duck, .3));
      if (music.el && !music.el.paused) music.el.pause();
    } else {
      const restore = tabDuckRestore; tabDuckRestore = null; ensure();
      if (music.el && music.cur) music.el.play().then(() => TCMusic.refresh()).catch(() => {});
      if (restore !== null) TCMusic.duck(restore);
    }
  });

  function bindSettings() {
    const fx = document.querySelector('[data-audio="effects"]'), mute = document.querySelector('[data-audio="mute"]'), mus = document.querySelector('[data-audio="music"]'), amb = document.querySelector('[data-audio="ambience"]');
    if (mus) { mus.disabled = false; mus.value = Math.round(musicVol * 100); mus.addEventListener('input', () => TCMusic.setVolume(mus.value / 100)); }
    if (amb) { amb.disabled = false; amb.value = Math.round(ambienceVol * 100); amb.addEventListener('input', () => TCMusic.setAmbience(amb.value / 100)); }
    if (fx) { fx.disabled = false; fx.value = Math.round(volume * 100); fx.addEventListener('input', () => api.setVolume(fx.value / 100)); fx.addEventListener('change', () => api.cat('meow')); }
    if (mute) { mute.checked = muted; mute.addEventListener('change', () => api.mute(mute.checked)); }
  }
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', bindSettings); else bindSettings();
})();
