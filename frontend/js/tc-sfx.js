/* TideCatcher Cat & Moodlings sound effects (no dependencies). Load BEFORE game.js.
   Files: assets/audio/ogg/*.ogg, with assets/audio/mp3/*.mp3 for browsers that cannot play Ogg.

   TCSfx.moodling('F')  -> that Moodling's voice (F N L C S J E B G)
   TCSfx.caught('G')    -> soft "pon" catch chime + the Moodling's happy voice
   TCSfx.cat('meow')    -> meow | trill | purr | sad | hiss
   TCSfx.level()        -> 0..1 effects volume (0 when muted); game.js uses it for its small tone() blips too
   TCMusic.play('school') -> loops that place's night music, fading from the previous one
   TCMusic.stop(), TCMusic.duck(0.45) (quieter during the bedroom scene and pauses), TCMusic.duck(1) to restore
   Settings: the "Music" and "Sound effects" sliders and the "Mute all" switch are saved in localStorage. */
(function () {
  const ogg = (() => { try { return !!new Audio().canPlayType('audio/ogg; codecs="vorbis"'); } catch (e) { return false; } })();
  const BASE = ogg ? 'assets/audio/ogg/' : 'assets/audio/mp3/', EXT = ogg ? '.ogg' : '.mp3';
  const VOICE = { F: 'sfx_mood_frustrated_growl', N: 'sfx_mood_nervous_squeak', L: 'sfx_mood_lonely_sigh',
    C: 'sfx_mood_calm_chime', S: 'sfx_mood_shy_giggle', J: 'sfx_mood_jealous_hmph',
    E: 'sfx_mood_excited_boing', B: 'sfx_mood_shy_giggle', G: 'sfx_mood_golden_sparkle' };
  const CAT = { meow: 'sfx_cat_meow', trill: 'sfx_cat_happy_trill', purr: 'sfx_cat_purr',
    sad: 'sfx_cat_sad_mew', hiss: 'sfx_cat_hiss' };
  const LEVEL = { sfx_cat_purr: .5, sfx_mood_golden_sparkle: .55, sfx_mood_calm_chime: .7 };  // keep loudness even
  const names = [...new Set([...Object.values(VOICE), ...Object.values(CAT), 'sfx_catch_happy_chime'])];
  let ctx = null, master = null, volume = 0.8, muted = false, musicVol = 0.75;
  try { const s = JSON.parse(localStorage.getItem('tc-audio') || 'null'); if (s) { if (typeof s.effects === 'number') volume = s.effects; if (typeof s.music === 'number') musicVol = s.music; muted = !!s.mute; } } catch (e) {}
  const save = () => { try { localStorage.setItem('tc-audio', JSON.stringify({ effects: volume, music: musicVol, mute: muted })); } catch (e) {} };
  const buffers = {}, elems = {}, last = {};

  function ensure() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); master = ctx.createGain(); master.connect(ctx.destination); } catch (e) { ctx = null; }
    }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  async function load(name) {
    if (buffers[name] || elems[name]) return;
    const url = BASE + name + EXT;
    try {
      if (!ensure() || location.protocol === 'file:') throw 0;          // fetch() is blocked on file://, fall back to <audio>
      buffers[name] = await ctx.decodeAudioData(await (await fetch(url)).arrayBuffer());
    } catch (e) { const a = new Audio(url); a.preload = 'auto'; elems[name] = a; }
  }
  function play(name, vol = 1) {
    if (muted || volume <= 0) return;
    const now = performance.now();
    if (now - (last[name] || 0) < 90) return;           // never machine-gun the same sound
    last[name] = now;
    const g = volume * vol * (LEVEL[name] || 1), rate = 1;   // play every sound exactly as it was made
    if (buffers[name] && ensure()) {
      const s = ctx.createBufferSource(), gn = ctx.createGain();
      s.buffer = buffers[name]; s.playbackRate.value = rate; gn.gain.value = g;
      s.connect(gn).connect(master); s.start();
    } else if (elems[name]) {
      const a = elems[name].cloneNode(); a.volume = Math.min(1, g); a.playbackRate = rate; a.play().catch(() => {});
    } else load(name).then(() => { last[name] = 0; play(name, vol); });
  }
  const api = {
    play, preload: () => names.forEach(load),
    moodling: (type, vol) => VOICE[type] && play(VOICE[type], vol),
    cat: (what, vol) => CAT[what] && play(CAT[what], vol),
    caught: (type) => { play('sfx_catch_happy_chime', .8); if (VOICE[type]) setTimeout(() => play(VOICE[type], .7), 140); },
    level: () => muted ? 0 : volume,
    setVolume: v => { volume = Math.max(0, Math.min(1, v)); save(); },
    mute: m => { muted = !!m; save(); if (window.TCMusic) TCMusic.refresh(); },
  };
  window.TCSfx = api;
  // browsers only allow sound after a tap/key: unlock + preload on first interaction
  const unlock = () => { ensure(); api.preload(); removeEventListener('pointerdown', unlock); removeEventListener('keydown', unlock); };
  addEventListener('pointerdown', unlock); addEventListener('keydown', unlock);

  // ---------- night music: one piece per place, played like a calm sandbox game ----------
  // A piano piece plays once, then the night is quiet for a while, then it plays again.
  // To use the team's looping tracks instead, set STYLE to 'loop' (files music_<place>).
  const STYLE = 'piano';
  const MBASE = (ogg ? 'assets/audio/music/ogg/' : 'assets/audio/music/mp3/') + (STYLE === 'piano' ? 'piano_' : 'music_');
  const GAP = [25, 45];          // seconds of quiet between plays
  const music = { cur: null, el: null, duck: 1, timer: 0 };
  const musicGain = () => muted ? 0 : Math.min(1, musicVol * 1.15 * music.duck);
  function fadeTo(el, target, ms, done) {
    const from = el.volume, t0 = performance.now();
    const step = now => { const k = Math.min(1, (now - t0) / ms); el.volume = Math.max(0, Math.min(1, from + (target - from) * k)); if (k < 1) requestAnimationFrame(step); else if (done) done(); };
    requestAnimationFrame(step);
  }
  function startEl(el) {
    const go = () => { if (music.el !== el) return; el.volume = 0; el.play().then(() => fadeTo(el, musicGain(), 2500)).catch(() => {}); };
    go(); addEventListener('pointerdown', go, { once: true }); addEventListener('keydown', go, { once: true });   // in case the browser waits for a tap or key
  }
  const TCMusic = {
    play(name) {
      clearTimeout(music.timer);
      if (music.cur === name && music.el) { fadeTo(music.el, musicGain(), 600); return; }
      const old = music.el; if (old) fadeTo(old, 0, 1500, () => old.pause());
      if (!name) { music.cur = null; music.el = null; return; }
      const el = new Audio(MBASE + name + EXT); el.preload = 'auto'; el.loop = STYLE !== 'piano'; el.volume = 0;
      music.cur = name; music.el = el;
      el.addEventListener('ended', () => {
        if (music.el !== el) return;
        const wait = (GAP[0] + Math.random() * (GAP[1] - GAP[0])) * 1000;
        music.timer = setTimeout(() => { if (music.el === el) { el.currentTime = 0; startEl(el); } }, wait);
      });
      music.timer = setTimeout(() => startEl(el), STYLE === 'piano' ? 2500 : 0);   // let the night settle before the first notes
    },
    stop() { TCMusic.play(null); },
    duck(k) { music.duck = k; if (music.el && !music.el.paused) fadeTo(music.el, musicGain(), 500); },
    refresh() { if (music.el && !music.el.paused) fadeTo(music.el, musicGain(), 300); },
    setVolume(v) { musicVol = Math.max(0, Math.min(1, v)); save(); TCMusic.refresh(); },
  };
  window.TCMusic = TCMusic;

  // connect the "Sounds of the night" settings (Sound effects slider + Mute all)
  function bindSettings() {
    const fx = document.querySelector('[data-audio="effects"]'), mute = document.querySelector('[data-audio="mute"]'), mus = document.querySelector('[data-audio="music"]');
    if (mus) { mus.disabled = false; mus.value = Math.round(musicVol * 100); mus.addEventListener('input', () => TCMusic.setVolume(mus.value / 100)); }
    if (fx) {
      fx.value = Math.round(volume * 100);
      fx.addEventListener('input', () => api.setVolume(fx.value / 100));
      fx.addEventListener('change', () => api.cat('meow'));
    }
    if (mute) { mute.checked = muted; mute.addEventListener('change', () => api.mute(mute.checked)); }
  }
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', bindSettings); else bindSettings();
})();
