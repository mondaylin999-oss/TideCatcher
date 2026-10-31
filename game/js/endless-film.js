/* Endless Nights film: five painted frames from the team, played once when the player first steps past
   the seventh night. Drawn on a canvas (high-quality scaling instead of the browser's soft, fast filter for
   animated CSS transforms): slow eased camera moves, long dream dissolves, drifting bokeh at three depths,
   soft light shafts, gentle grade, vignette and film grain. One narrated line per frame, revealed word by word.
   Tap / click / Space / → goes to the next frame; "Skip" ends it. */
(function (root) {
  'use strict';
  // cam: [scale, focusX, focusY] at the start and end of each shot (focus as 0..1 of the painting)
  const FRAMES = [
    { img: 'e1', vo: 'e1', text: 'Thiri sleeps a little easier now. But far away, Shwe hears something.', from: [1.12, .68, .42], to: [1.0, .55, .5], tint: '255,214,150', rays: .5 },
    { img: 'e2', vo: 'e2', text: 'Across the rooftops, more feelings are lost in the night.', from: [1.06, .32, .5], to: [1.08, .66, .46], tint: '150,170,255', rays: .2 },
    { img: 'e3', vo: 'e3', text: 'In other windows, other little lights have gone dim.', from: [1.0, .5, .5], to: [1.1, .56, .46], tint: '170,150,255', rays: .25 },
    { img: 'e4', vo: 'e4', text: 'So Shwe sits close, and is gentle, until the light glows again.', from: [1.02, .55, .52], to: [1.12, .62, .5], tint: '255,190,110', rays: .8 },
    { img: 'e5', vo: 'e5', text: 'Endless Levels · as many lights as Shwe can bring home.', from: [1.1, .5, .62], to: [1.0, .5, .48], tint: '255,226,150', rays: .6, last: true }
  ];
  const FADE = 1.6, MIN_SHOT = 6.2;
  const name = s => s.replace(/Shwe/g, (root.MK_PROFILE && MK_PROFILE.cat) || 'Shwe').replace(/Thiri/g, (root.MK_PROFILE && MK_PROFILE.girl) || 'Thiri');
  const ease = x => .5 - .5 * Math.cos(Math.PI * Math.min(1, Math.max(0, x)));
  const reduced = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };
  let el, cv, g, W = 0, H = 0, dpr = 1, imgs = [], i = 0, shotT = 0, shotLen = MIN_SHOT, prev = null, prevT = 0, raf = 0, last = 0, audio = null, done = null, grain = null, bokeh = [], clock = 0, open = false;

  function build() {
    el = document.createElement('section'); el.id = 'endlessFilm'; el.hidden = true;
    el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', 'Endless Levels');
    el.innerHTML = `<canvas class="ef-canvas" aria-hidden="true"></canvas><div class="ef-bars" aria-hidden="true"></div>
      <p class="ef-caption" aria-live="polite"></p>
      <div class="ef-dots" aria-hidden="true">${FRAMES.map(() => '<i></i>').join('')}</div>
      <button type="button" class="ef-skip">Skip ›</button>
      <button type="button" class="ef-next" aria-label="Next">›</button>`;
    document.body.appendChild(el);
    cv = el.querySelector('canvas'); g = cv.getContext('2d', { alpha: false });
    imgs = FRAMES.map(f => { const im = new Image(); im.decoding = 'async'; im.src = `assets/endless/${f.img}.webp`; return im; });
    el.querySelector('.ef-skip').addEventListener('click', e => { e.stopPropagation(); finish(); });
    el.addEventListener('click', e => { if (!e.target.closest('.ef-skip')) next(); });
    el.addEventListener('keydown', e => {
      e.stopPropagation();
      if (e.key === 'Escape') { e.preventDefault(); finish(); }
      else if ([' ', 'Enter', 'ArrowRight'].includes(e.key)) { e.preventDefault(); next(); }
    });
    addEventListener('resize', size);
    // a small tile of soft noise, shifted every frame for a living film grain
    grain = document.createElement('canvas'); grain.width = grain.height = 160;
    const gg = grain.getContext('2d'), d = gg.createImageData(160, 160);
    for (let k = 0; k < d.data.length; k += 4) { const v = 110 + Math.random() * 90; d.data[k] = d.data[k + 1] = d.data[k + 2] = v; d.data[k + 3] = 255; }
    gg.putImageData(d, 0, 0);
    for (let k = 0; k < 46; k++) bokeh.push({ x: Math.random(), y: Math.random(), z: k % 3, r: .4 + Math.random() * .6, ph: Math.random() * 7, sp: .4 + Math.random() * .6 });
  }
  function size() {
    if (!cv) return;
    dpr = Math.min(2, root.devicePixelRatio || 1); W = innerWidth; H = innerHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cv.style.width = W + 'px'; cv.style.height = H + 'px';
  }
  // draws one painting with its camera at progress p (0..1), cover-fitted to the screen
  function paint(k, p, alpha) {
    const im = imgs[k], f = FRAMES[k];
    if (!im || !im.complete || !im.naturalWidth) return;
    const q = reduced() ? 0 : ease(p);
    const sc = f.from[0] + (f.to[0] - f.from[0]) * q, fx = f.from[1] + (f.to[1] - f.from[1]) * q, fy = f.from[2] + (f.to[2] - f.from[2]) * q;
    const cover = Math.max(W / im.naturalWidth, H / im.naturalHeight) * sc;
    const dw = im.naturalWidth * cover, dh = im.naturalHeight * cover;
    // keep the focus point near the centre without ever showing an edge
    const x = Math.min(0, Math.max(W - dw, W / 2 - fx * dw)), y = Math.min(0, Math.max(H - dh, H / 2 - fy * dh));
    g.globalAlpha = alpha; g.drawImage(im, x, y, dw, dh); g.globalAlpha = 1;
  }
  function overlays(k, p, dt) {
    const f = FRAMES[k], still = reduced();
    // warm or cool grade, very light
    g.globalCompositeOperation = 'soft-light'; g.fillStyle = `rgba(${f.tint},.22)`; g.fillRect(0, 0, W, H);
    // soft light shafts from the top corner, slowly breathing
    if (f.rays > 0) {
      g.globalCompositeOperation = 'screen';
      for (let r = 0; r < 4; r++) {
        const a = (.035 + .02 * Math.sin(clock * .5 + r * 1.7)) * f.rays, x0 = W * (.62 + r * .09), w = W * (.06 + r * .025);
        const gr = g.createLinearGradient(x0, 0, x0 - W * .3, H); gr.addColorStop(0, `rgba(${f.tint},${a})`); gr.addColorStop(1, `rgba(${f.tint},0)`);
        g.fillStyle = gr; g.beginPath(); g.moveTo(x0, 0); g.lineTo(x0 + w, 0); g.lineTo(x0 + w - W * .32, H); g.lineTo(x0 - W * .32, H); g.closePath(); g.fill();
      }
    }
    // bokeh at three depths: far ones small and slow, near ones large, soft and quick (parallax with the camera)
    g.globalCompositeOperation = 'lighter';
    const drift = ease(p) - .5;
    for (const b of bokeh) {
      if (!still) { b.y -= dt * .012 * b.sp * (b.z + 1); if (b.y < -.1) { b.y = 1.1; b.x = Math.random(); } }
      const depth = [.5, 1, 1.9][b.z], R = (3 + b.r * 7) * depth * Math.min(W, H) / 700;
      const x = (b.x + drift * .04 * depth) * W + Math.sin(clock * .3 * b.sp + b.ph) * 14 * depth, y = b.y * H;
      const tw = .45 + .55 * Math.sin(clock * 1.3 * b.sp + b.ph) ** 2, a = (b.z === 2 ? .1 : .2) * tw;
      const gr = g.createRadialGradient(x, y, 0, x, y, R * 2.2); gr.addColorStop(0, `rgba(255,236,190,${a})`); gr.addColorStop(.4, `rgba(${f.tint},${a * .5})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, R * 2.2, 0, 7); g.fill();
    }
    g.globalCompositeOperation = 'source-over';
    // vignette
    const v = g.createRadialGradient(W / 2, H * .48, Math.min(W, H) * .35, W / 2, H * .5, Math.max(W, H) * .78);
    v.addColorStop(0, 'rgba(4,5,15,0)'); v.addColorStop(1, 'rgba(4,5,15,.62)'); g.fillStyle = v; g.fillRect(0, 0, W, H);
    // caption shade
    const sh = g.createLinearGradient(0, H * .58, 0, H); sh.addColorStop(0, 'rgba(4,5,15,0)'); sh.addColorStop(1, 'rgba(4,5,15,.7)'); g.fillStyle = sh; g.fillRect(0, H * .58, W, H * .42);
    // grain
    if (!still && grain) {
      g.globalAlpha = .055; g.globalCompositeOperation = 'overlay';
      const pat = g.createPattern(grain, 'repeat'); g.save(); g.translate(Math.random() * 160, Math.random() * 160); g.fillStyle = pat; g.fillRect(-160, -160, W + 320, H + 320); g.restore();
      g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    }
  }
  function frame(now) {
    if (!open) return;
    const dt = Math.min(.05, (now - last) / 1000 || 0); last = now; clock += dt;
    shotT += dt; if (prev !== null) prevT += dt;
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    g.fillStyle = '#04050f'; g.fillRect(0, 0, W, H);
    const fadeIn = Math.min(1, shotT / FADE);
    if (prev !== null && fadeIn < 1) paint(prev, Math.min(1, prevT / (shotLen + FADE)), 1);
    paint(i, shotT / (shotLen + FADE), prev !== null ? ease(fadeIn) : Math.min(1, shotT / .9));
    if (fadeIn >= 1) prev = null;
    overlays(i, shotT / (shotLen + FADE), dt);
    if (shotT >= shotLen) next();
    raf = requestAnimationFrame(frame);
  }
  function caption(text) {
    const cap = el.querySelector('.ef-caption');
    cap.innerHTML = name(text).split(' ').map((w, k) => `<span style="animation-delay:${(.45 + k * .085).toFixed(2)}s">${w}</span>`).join(' ');
  }
  function show(k) {
    if (k !== i || prev === null) { prev = (k === i && shotT === 0) ? null : i; prevT = shotT; }
    i = k; shotT = 0; shotLen = MIN_SHOT;
    const f = FRAMES[k];
    el.querySelectorAll('.ef-dots i').forEach((n, j) => n.classList.toggle('on', j <= k));
    caption(f.text);
    el.querySelector('.ef-next').textContent = f.last ? 'Begin ✦' : '›';
    el.classList.toggle('ef-last', !!f.last);
    if (audio) { audio.pause(); audio = null; }
    try {
      const vol = root.TCSfx && TCSfx.level ? Math.min(1, TCSfx.level() / .8) : .9;
      if (vol > .02) {
        audio = new Audio(`assets/audio/voice/endless/${f.vo}.mp3`); audio.volume = vol; audio.play().catch(() => {});
        audio.addEventListener('loadedmetadata', () => { if (FRAMES[i] === f && !f.last && isFinite(audio?.duration)) shotLen = Math.max(MIN_SHOT, audio.duration + 1.6); });
      }
    } catch (e) {}
    if (f.last) shotLen = 9e9;     // the last frame waits for "Begin"
  }
  function next() { if (!open) return; if (i >= FRAMES.length - 1) finish(); else show(i + 1); }
  function finish() {
    if (!open) return;
    open = false; cancelAnimationFrame(raf); if (audio) { audio.pause(); audio = null; }
    try { localStorage.setItem('mk-endless-film', '1'); } catch (e) {}
    el.classList.add('ef-out');
    setTimeout(() => { el.hidden = true; el.classList.remove('ef-out'); const d = done; done = null; d && d(); }, 650);
  }
  function play(onDone) {
    if (!el) build();
    done = onDone; el.hidden = false; el.tabIndex = -1; el.focus({ preventScroll: true }); size();
    open = true; i = 0; prev = null; shotT = 0; clock = 0; last = performance.now();
    show(0); raf = requestAnimationFrame(frame);
  }
  const seen = () => { try { return localStorage.getItem('mk-endless-film') === '1'; } catch (e) { return true; } };
  root.TCEndlessFilm = { play, seen };
})(typeof window !== 'undefined' ? window : globalThis);
