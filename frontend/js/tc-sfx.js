/* TideCatcher Cat & Moodlings sound effects (no dependencies). Load BEFORE game.js.
   Files: assets/audio/ogg/*.ogg, with assets/audio/mp3/*.mp3 for browsers that cannot play Ogg.

   TCSfx.moodling('F')  -> that Moodling's voice (F N L C S J E B G)
   TCSfx.caught('G')    -> soft "pon" catch chime + the Moodling's happy voice
   TCSfx.cat('meow')    -> meow | trill | purr | sad | hiss
   TCSfx.level()        -> 0..1 effects volume (0 when muted); game.js uses it for its small tone() blips too
   Settings: the "Sound effects" slider and "Mute all" switch in the hub settings are saved in localStorage. */
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
  let ctx = null, master = null, volume = 0.8, muted = false;
  try { const s = JSON.parse(localStorage.getItem('tc-audio') || 'null'); if (s) { if (typeof s.effects === 'number') volume = s.effects; muted = !!s.mute; } } catch (e) {}
  const save = () => { try { localStorage.setItem('tc-audio', JSON.stringify({ effects: volume, mute: muted })); } catch (e) {} };
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
    const g = volume * vol * (LEVEL[name] || 1), rate = 0.97 + Math.random() * 0.06;
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
    mute: m => { muted = !!m; save(); },
  };
  window.TCSfx = api;
  // browsers only allow sound after a tap/key: unlock + preload on first interaction
  const unlock = () => { ensure(); api.preload(); removeEventListener('pointerdown', unlock); removeEventListener('keydown', unlock); };
  addEventListener('pointerdown', unlock); addEventListener('keydown', unlock);

  // connect the "Sounds of the night" settings (Sound effects slider + Mute all)
  function bindSettings() {
    const fx = document.querySelector('[data-audio="effects"]'), mute = document.querySelector('[data-audio="mute"]');
    if (fx) {
      fx.value = Math.round(volume * 100);
      fx.addEventListener('input', () => api.setVolume(fx.value / 100));
      fx.addEventListener('change', () => api.cat('meow'));
    }
    if (mute) { mute.checked = muted; mute.addEventListener('change', () => api.mute(mute.checked)); }
  }
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', bindSettings); else bindSettings();
})();
