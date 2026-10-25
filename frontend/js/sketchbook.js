/* Thiri's Sketchbook skin: colour comes back as feelings come home.
   Reads Thiri's progress (0 = asleep and grey … 7 = awake) and sets
   --sb-colour on the page, and colours the letters of the title one by one. */
(function () {
  'use strict';
  const CRAYONS = ['#e65a5f', '#e0a12a', '#4d9be6', '#3fae74', '#9a82e8', '#e8679f', '#ef8a43', '#e65a5f', '#4d9be6', '#3fae74', '#9a82e8'];
  function stage() {
    let s = 0;
    try { s = parseInt(localStorage.getItem('mk-thiri') || '0', 10) || 0; } catch (e) {}
    return Math.max(0, Math.min(7, s));
  }
  function paintTitle(k) {
    const el = document.querySelector('.hub-brand-copy strong');
    if (!el) return;
    if (!el.dataset.sbSplit) {
      const word = el.textContent.trim();
      el.textContent = '';
      el.setAttribute('aria-label', word);
      [...word].forEach((ch, i) => {
        const s = document.createElement('span');
        s.className = 'sb-letter'; s.textContent = ch; s.setAttribute('aria-hidden', 'true');
        s.style.setProperty('--c', CRAYONS[i % CRAYONS.length]);
        el.appendChild(s);
      });
      el.dataset.sbSplit = '1';
    }
    const letters = el.querySelectorAll('.sb-letter'), on = Math.round(k * letters.length);
    letters.forEach((s, i) => s.classList.toggle('on', i < on));
  }
  function refresh() {
    const st = stage(), k = st >= 7 ? 1 : st / 7;
    // never fully grey: a hint of colour keeps the first screen friendly
    document.documentElement.style.setProperty('--sb-colour', String(Math.max(.12, k)));
    document.documentElement.dataset.sbStage = String(st);
    paintTitle(Math.max(st >= 1 ? 0 : 0, k));
  }

  // ---------- story names: the player can rename Thiri and Shwe ----------
  function names() {
    let pr = {};
    try { pr = JSON.parse(localStorage.getItem('mk-profile') || '{}') || {}; } catch (e) {}
    const girl = (pr.girl || 'Thiri').trim() || 'Thiri', cat = (pr.cat || 'Shwe').trim() || 'Shwe';
    document.querySelectorAll('.sb-girl').forEach(el => { el.textContent = el.closest('.hub-content-heading>span,.hub-hero-label>span') ? girl.toUpperCase() : girl; });
    document.querySelectorAll('.sb-cat').forEach(el => { el.textContent = cat; });
  }

  // ---------- crayon doodles on the home cards (paper, not night photos) ----------
  const INK = '#3b3550';
  const DOODLES = {
    story: '<g filter="url(#sbCrayon)" fill="none" stroke-linecap="round" stroke-linejoin="round">'
      + '<path d="M360 210c60-70 110 20 170-30s90-90 150-40 60 60 90 30" stroke="#e0a12a" stroke-width="6" stroke-dasharray="3 14"/>'
      + '<path d="M392 92a30 30 0 1 0 26 44 24 24 0 1 1-26-44z" fill="#ffe28a" stroke="#c99a2a" stroke-width="4"/>'
      + '<g stroke="#9a82e8" stroke-width="4"><path d="M470 60l5 12 12 5-12 5-5 12-5-12-12-5 12-5z" fill="#e6dcff"/><path d="M560 40l3 8 8 3-8 3-3 8-3-8-8-3 8-3z"/></g>'
      + '<g transform="translate(520 150)" stroke="' + INK + '" stroke-width="4"><path d="M-14-30h28l6 10-6 34h-28l-6-34z" fill="#ff9a8a"/><path d="M-6 14v10m12-10v10M-20-20h40"/></g>'
      + '<g transform="translate(700 98)" stroke="' + INK + '" stroke-width="4"><path d="M-46 8l46-38 46 38" /><path d="M-36 2v58h72V2" fill="#fff3d6"/><rect x="-14" y="16" width="28" height="24" fill="#ffd25a"/><path d="M0 16v24M-14 28h28" stroke-width="3"/><path d="M14 -20v-14h12v24"/></g>'
      + '<g fill="#c2562a" stroke="none"><g transform="translate(600 205) rotate(-20)"><ellipse rx="7" ry="6"/><circle cx="-8" cy="-9" r="3"/><circle cx="0" cy="-12" r="3"/><circle cx="8" cy="-9" r="3"/></g><g transform="translate(640 175) rotate(-35)"><ellipse rx="7" ry="6"/><circle cx="-8" cy="-9" r="3"/><circle cx="0" cy="-12" r="3"/><circle cx="8" cy="-9" r="3"/></g></g>'
      + '<text x="612" y="262" fill="#6b6480" stroke="none" font-family="Gaegu,cursive" font-size="26" font-weight="700">12 → 6 AM</text>'
      + '</g>',
    free: '<g filter="url(#sbCrayon)" fill="none" stroke-linecap="round" stroke-linejoin="round">'
      + '<path d="M302 18a24 24 0 1 0 20 38 19 19 0 1 1-20-38z" fill="#ffe28a" stroke="#c99a2a" stroke-width="3.5"/>'
      + '<path d="M168 138q38-74 78-12q34-58 74-2" stroke="#3fae74" stroke-width="4" stroke-dasharray="2 10"/>'
      + '<path d="M150 154q20-7 40 0t40 0 40 0 40 0 40 0" stroke="#3fae74" stroke-width="4"/>'
      + '<g stroke="#e0a12a" stroke-width="3"><path d="M246 64l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="#fff3a8"/><path d="M208 88l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/></g>'
      + '<g fill="#ffe28a" stroke="#c99a2a" stroke-width="2"><circle cx="196" cy="58" r="4"/><circle cx="276" cy="98" r="4"/></g>'
      + '</g>',
    shop: '<g filter="url(#sbCrayon)" fill="none" stroke-linecap="round" stroke-linejoin="round">'
      + '<path d="M246 48h76M240 60h88" stroke="' + INK + '" stroke-width="4"/><rect x="243" y="36" width="82" height="14" rx="3" fill="#c9915a" stroke="' + INK + '" stroke-width="3.5"/>'
      + '<path d="M246 60q-14 10-14 30v42q0 18 18 18h68q18 0 18-18V90q0-20-14-30" fill="#eaf4ff" stroke="' + INK + '" stroke-width="4"/>'
      + '<g fill="#ffd25a" stroke="#e0a12a" stroke-width="2"><circle cx="262" cy="118" r="7"/><circle cx="286" cy="104" r="6"/><circle cx="306" cy="124" r="7"/><circle cx="276" cy="136" r="5"/><circle cx="300" cy="92" r="4"/></g>'
      + '<path d="M150 136q22-18 46 0-24 18-46 0zm46 0l12-10v20z" fill="#ff9ab8" stroke="' + INK + '" stroke-width="3.5"/><circle cx="162" cy="133" r="2" fill="' + INK + '" stroke="none"/>'
      + '</g>',
    book: '<g filter="url(#sbCrayon)" fill="none" stroke-linecap="round" stroke-linejoin="round">'
      + '<path d="M266 48q-34-14-74 4v94q40-18 74-4zm0 0q34-14 74 4v94q-40-18-74-4z" fill="#fffdf6" stroke="' + INK + '" stroke-width="4"/>'
      + '<circle cx="222" cy="86" r="14" fill="#ff8a7a" stroke="' + INK + '" stroke-width="3"/><circle cx="306" cy="80" r="14" fill="#b9a2ff" stroke="' + INK + '" stroke-width="3"/><circle cx="300" cy="120" r="12" fill="#8fd0ff" stroke="' + INK + '" stroke-width="3"/>'
      + '<g fill="' + INK + '" stroke="none"><circle cx="217" cy="84" r="2"/><circle cx="227" cy="84" r="2"/><circle cx="301" cy="78" r="2"/><circle cx="311" cy="78" r="2"/><circle cx="296" cy="118" r="1.8"/><circle cx="304" cy="118" r="1.8"/></g>'
      + '<path d="M217 92q5 4 10 0M301 86q5-3 10 0M296 125q4 3 8 0" stroke="' + INK + '" stroke-width="2"/><path d="M206 116h34M206 128h28" stroke="#9a95a8" stroke-width="3"/>'
      + '<path d="M352 40l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="#fff3a8" stroke="#e0a12a" stroke-width="2.5"/>'
      + '</g>'
  };
  function doodles() {
    if (!document.getElementById('sbCrayonDefs')) {
      const d = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      d.id = 'sbCrayonDefs'; d.setAttribute('aria-hidden', 'true'); d.setAttribute('width', '0'); d.setAttribute('height', '0'); d.style.position = 'absolute';
      d.innerHTML = '<filter id="sbCrayon" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="2" seed="4"/><feDisplacementMap in="SourceGraphic" scale="2.4"/></filter>';
      document.body.appendChild(d);
    }
    const put = (sel, key, box) => {
      const svg = document.querySelector(sel); if (!svg || svg.dataset.sb) return;
      svg.innerHTML = DOODLES[key]; svg.dataset.sb = '1'; svg.classList.add('sb-doodle');
      svg.setAttribute('viewBox', box); svg.setAttribute('preserveAspectRatio', 'xMaxYMax meet');
    };
    // each viewBox is cropped to its drawing, so the drawing sits beside the words instead of under them
    put('#storyBtn .hub-story-scene', 'story', '340 20 450 260');
    put('#freeBtn .hub-small-scene', 'free', '140 10 230 155');
    put('#shopBtn .hub-small-scene', 'shop', '140 28 200 128');
    put('#bookBtn .hub-small-scene', 'book', '186 34 184 118');
  }
  // the cover title is written in crayons
  function coverTitle() {
    const el = document.getElementById('welcomeTitle'); if (!el || el.dataset.sbSplit) return;
    const word = el.textContent.trim(); el.textContent = ''; el.setAttribute('aria-label', word);
    [...word].forEach((ch, i) => { const s = document.createElement('span'); s.className = 'sb-letter on'; s.textContent = ch; s.setAttribute('aria-hidden', 'true'); s.style.setProperty('--c', CRAYONS[i % CRAYONS.length]); s.style.setProperty('--r', ((i * 37) % 9 - 4) + 'deg'); el.appendChild(s); });
    el.dataset.sbSplit = '1';
  }

  // ---------- home is Thiri's room: her sleeping face follows the story ----------
  const POSES = [0, 1, 2, 3, 5, 7];
  function roomHub() {
    const st = stage(); let k = 0; POSES.forEach(p => { if (p <= st) k = p; });
    const c = document.getElementById('rhThiri'), g = document.getElementById('rhThiriGrey');
    if (c && !c.src.endsWith(`thiri-s${k}.webp`)) { c.src = `assets/home/thiri-s${k}.webp`; g.src = `assets/home/thiri-s${k}-grey.webp`; }
    const help = document.getElementById('roomHelpBtn'), bed = document.getElementById('roomBedBtn');
    if (help && !help.dataset.sb) { help.dataset.sb = '1'; help.addEventListener('click', () => document.getElementById('infoBtn')?.click()); }
    if (bed && !bed.dataset.sb) { bed.dataset.sb = '1'; bed.addEventListener('click', () => document.getElementById('profileBtn')?.click()); }
  }
  function watch() {
    refresh(); names(); doodles(); coverTitle(); roomHub();
    const hub = document.getElementById('startScreen');
    if (hub) new MutationObserver(refresh).observe(hub, { attributes: true, attributeFilter: ['hidden'] });
    addEventListener('storage', refresh);
    addEventListener('focus', () => { refresh(); names(); roomHub(); });
    if (hub) new MutationObserver(() => { names(); roomHub(); }).observe(hub, { attributes: true, attributeFilter: ['hidden'] });
  }
  // the game draws its HUD on a canvas, so ask for the handwriting font early
  try { if (document.fonts && document.fonts.load) { document.fonts.load('700 30px "Gaegu"'); document.fonts.load('400 20px "Gaegu"'); } } catch (e) {}
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watch); else watch();
  window.TCSketchbook = { refresh, names };
})();
