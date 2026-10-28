/* Endless Nights film: five painted frames from the team, played once when the player first steps past
   the seventh night. Slow drifts across each painting, soft cross-fades, sparkles and one narrated line
   per frame. Tap / click / Space / → goes to the next frame; "Skip" ends it. */
(function (root) {
  'use strict';
  const FRAMES = [
    { img: 'e1', vo: 'e1', text: 'Thiri sleeps a little easier now. But far away, Shwe hears something.', move: 'lt-zoom-in', focus: '70% 45%' },
    { img: 'e2', vo: 'e2', text: 'Across the rooftops, more feelings are lost in the night.', move: 'lt-pan-right', focus: '30% 50%' },
    { img: 'e3', vo: 'e3', text: 'In other windows, other little lights have gone dim.', move: 'lt-zoom-out', focus: '55% 50%' },
    { img: 'e4', vo: 'e4', text: 'So Shwe sits close, and is gentle, until the light glows again.', move: 'lt-zoom-in', focus: '65% 55%' },
    { img: 'e5', vo: 'e5', text: 'Endless Nights · as many lights as Shwe can bring home.', move: 'lt-pan-left', focus: '40% 55%', last: true }
  ];
  const name = s => s.replace(/Shwe/g, (root.MK_PROFILE && MK_PROFILE.cat) || 'Shwe').replace(/Thiri/g, (root.MK_PROFILE && MK_PROFILE.girl) || 'Thiri');
  let el, i = 0, timer = 0, audio = null, done = null;

  function build() {
    el = document.createElement('section'); el.id = 'endlessFilm'; el.hidden = true;
    el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', 'Endless Nights');
    el.innerHTML = `<div class="ef-stage">${FRAMES.map((f, k) => `<div class="ef-frame" data-k="${k}"><img src="assets/endless/${f.img}.webp" alt="" style="object-position:${f.focus}"></div>`).join('')}
      <div class="ef-sparks" aria-hidden="true">${Array.from({ length: 26 }, (_, k) => `<i style="left:${(k * 37) % 100}%;animation-delay:${(k * .37) % 6}s;animation-duration:${5 + (k % 5)}s"></i>`).join('')}</div>
      <div class="ef-bars" aria-hidden="true"></div></div>
      <p class="ef-caption" aria-live="polite"></p>
      <div class="ef-dots" aria-hidden="true">${FRAMES.map(() => '<i></i>').join('')}</div>
      <button type="button" class="ef-skip">Skip ›</button>
      <button type="button" class="ef-next" aria-label="Next">›</button>`;
    document.body.appendChild(el);
    el.querySelector('.ef-skip').addEventListener('click', e => { e.stopPropagation(); finish(); });
    el.addEventListener('click', e => { if (!e.target.closest('.ef-skip')) next(); });
    el.addEventListener('keydown', e => {
      e.stopPropagation();
      if (e.key === 'Escape') { e.preventDefault(); finish(); }
      else if ([' ', 'Enter', 'ArrowRight'].includes(e.key)) { e.preventDefault(); next(); }
    });
  }
  function show(k) {
    i = k; clearTimeout(timer);
    const f = FRAMES[k];
    el.querySelectorAll('.ef-frame').forEach((n, j) => { n.classList.toggle('on', j === k); n.querySelector('img').className = j === k ? f.move : ''; });
    el.querySelectorAll('.ef-dots i').forEach((n, j) => n.classList.toggle('on', j <= k));
    const cap = el.querySelector('.ef-caption'); cap.classList.remove('in'); void cap.offsetWidth; cap.textContent = name(f.text); cap.classList.add('in');
    el.querySelector('.ef-next').textContent = f.last ? 'Begin ✦' : '›';
    el.classList.toggle('ef-last', !!f.last);
    if (audio) { audio.pause(); audio = null; }
    let wait = 6200;
    try {
      const vol = root.TCSfx && TCSfx.level ? Math.min(1, TCSfx.level() / .8) : .9;
      if (vol > .02) { audio = new Audio(`assets/audio/voice/endless/${f.vo}.mp3`); audio.volume = vol; audio.play().catch(() => {}); audio.addEventListener('loadedmetadata', () => { clearTimeout(timer); timer = setTimeout(next, Math.max(5200, audio.duration * 1000 + 1400)); }); }
    } catch (e) {}
    timer = setTimeout(next, wait + 2000);
  }
  function next() { if (el.hidden) return; if (i >= FRAMES.length - 1) finish(); else show(i + 1); }
  function finish() {
    clearTimeout(timer); if (audio) { audio.pause(); audio = null; }
    try { localStorage.setItem('mk-endless-film', '1'); } catch (e) {}
    el.classList.add('ef-out');
    setTimeout(() => { el.hidden = true; el.classList.remove('ef-out'); const d = done; done = null; d && d(); }, 450);
  }
  function play(onDone) {
    if (!el) build();
    done = onDone; el.hidden = false; el.tabIndex = -1; el.focus({ preventScroll: true }); show(0);
  }
  const seen = () => { try { return localStorage.getItem('mk-endless-film') === '1'; } catch (e) { return true; } };
  root.TCEndlessFilm = { play, seen };
})(typeof window !== 'undefined' ? window : globalThis);
