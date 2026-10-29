/* Player-editable controls.
   Keyboard: every action can use up to two keys, rebound in Settings → Controls (or from the pause menu).
   Touch: the on-screen buttons can be dragged anywhere, resized, made brighter or dimmer, and the joystick
   can sit on the left or the right. Everything is saved in this browser (localStorage). */
(function (root) {
  'use strict';
  const KEY = 'mk-controls-v1';
  const ACTIONS = [
    { id: 'left', name: 'Move left', keys: ['ArrowLeft', 'KeyA'] },
    { id: 'right', name: 'Move right', keys: ['ArrowRight', 'KeyD'] },
    { id: 'jump', name: 'Jump', keys: ['Space', 'ArrowUp'] },
    { id: 'sneak', name: 'Sneak (hold)', keys: ['ShiftLeft', 'ShiftRight'] },
    { id: 'pounce', name: 'Pounce / catch', keys: ['KeyJ', 'KeyX'] },
    { id: 'eyes', name: 'Night Eyes', keys: ['KeyE', 'KeyL'] },
    { id: 'scratch', name: 'Scratch', keys: ['KeyS', ''] },
    { id: 'purr', name: 'Purr', keys: ['KeyK', ''] },
    { id: 'home', name: 'Go home (moon door)', keys: ['KeyH', ''] },
    { id: 'notes', name: 'Notes on / off', keys: ['KeyN', ''] },
    { id: 'pause', name: 'Pause', keys: ['KeyP', ''] }
  ];
  // Space / ↑ / W all jumped before; W stays a quiet extra so old habits keep working unless rebound
  const EXTRA = { jump: ['KeyW'] };
  const TOUCH_BUTTONS = [
    { id: 'bJump', name: 'Jump' }, { id: 'bPounce', name: 'Pounce' }, { id: 'bEyes', name: 'Eyes' },
    { id: 'bScratch', name: 'Scratch' }, { id: 'bPurr', name: 'Purr' }
  ];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const defaults = () => ({ keys: Object.fromEntries(ACTIONS.map(a => [a.id, a.keys.slice()])), extra: true, touch: { opacity: .72, size: 1, stick: 'left', pos: {}, btn: {} } });
  let S = load(), ver = 1;
  function load() {
    const d = defaults();
    try {
      const s = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (s && typeof s === 'object') {
        for (const a of ACTIONS) if (Array.isArray(s.keys?.[a.id])) d.keys[a.id] = [s.keys[a.id][0] || '', s.keys[a.id][1] || ''];
        if (typeof s.extra === 'boolean') d.extra = s.extra;
        if (s.touch) Object.assign(d.touch, s.touch, { pos: { ...(s.touch.pos || {}) }, btn: { ...(s.touch.btn || {}) } });
        d.touch.opacity = clamp(+d.touch.opacity || .72, .2, 1);
        d.touch.size = clamp(+d.touch.size || 1, .7, 1.8);
      }
    } catch (e) {}
    return d;
  }
  function save() { ver++; try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} applyTouch(); root.dispatchEvent?.(new CustomEvent('tc-controls')); }
  const codesOf = id => [...(S.keys[id] || []), ...(S.extra ? EXTRA[id] || [] : [])].filter(Boolean);
  const is = (code, id) => !!code && codesOf(id).includes(code);
  const held = (keys, id) => codesOf(id).some(c => keys[c]);
  const isGameKey = code => ACTIONS.some(a => is(code, a.id));
  const custom = () => ACTIONS.some(a => a.keys.join('|') !== S.keys[a.id].join('|'));
  function keyName(code) {
    if (!code) return '—';
    const M = { Space: 'Space', ArrowLeft: '←', ArrowRight: '→', ArrowUp: '↑', ArrowDown: '↓', ShiftLeft: 'Shift', ShiftRight: 'Right Shift', ControlLeft: 'Ctrl', ControlRight: 'Right Ctrl', AltLeft: 'Alt', AltRight: 'Right Alt', Enter: 'Enter', Tab: 'Tab', Backquote: '`', Minus: '-', Equal: '=', BracketLeft: '[', BracketRight: ']', Semicolon: ';', Quote: "'", Comma: ',', Period: '.', Slash: '/', Backslash: '\\' };
    if (M[code]) return M[code];
    if (/^Key[A-Z]$/.test(code)) return code.slice(3);
    if (/^Digit\d$/.test(code)) return code.slice(5);
    if (/^Numpad/.test(code)) return 'Num ' + code.slice(6);
    return code;
  }
  const label = id => { const ks = (S.keys[id] || []).filter(Boolean).map(keyName); return ks.length ? ks.join(' or ') : 'not set'; };
  const short = id => keyName((S.keys[id] || []).find(Boolean) || '');
  // swap the keyboard names in the guide and tip cards for the player's own keys
  let patched = null, patchedFor = 0, patchedSrc = null;
  function patchCopy(copy) {
    if (!custom() || !copy?.controlLabels) return copy;
    if (patched && patchedFor === ver && patchedSrc === copy) return patched;
    const L = { ...copy.controlLabels }, set = (k, v) => { if (L[k]) L[k] = { ...L[k], keyboard: v }; };
    set('move', `${label('left')} / ${label('right')}`); set('dodge', `${label('left')} / ${label('right')}`);
    set('jump', label('jump')); set('sneak', `Hold ${label('sneak')} while moving`); set('catch', label('pounce')); set('dizzy-pounce', label('pounce'));
    set('eyes', label('eyes')); set('scratch', label('scratch')); set('purr', label('purr')); set('pause', `Esc or ${label('pause')}`);
    patched = { ...copy, controlLabels: L }; patchedFor = ver; patchedSrc = copy; return patched;
  }
  function bind(id, slot, code) {
    // a key belongs to one action only: take it away from any other action first
    const moved = [];
    if (code) for (const a of ACTIONS) for (let i = 0; i < 2; i++) if (S.keys[a.id][i] === code && !(a.id === id && i === slot)) { S.keys[a.id][i] = ''; moved.push(a.name); }
    if (code && EXTRA.jump.includes(code) && id !== 'jump') S.extra = false;
    S.keys[id][slot] = code || ''; save(); return moved;
  }

  // ---------- touch buttons ----------
  const btnTune = id => S.touch.btn[id] || {};
  function applyTouch() {
    const t = S.touch, el = document.getElementById('touch'); if (!el) return;
    el.style.setProperty('--tc-op', String(t.opacity));
    el.style.setProperty('--tc-size', String(t.size));
    el.classList.toggle('tc-stick-right', t.stick === 'right');
    for (const b of TOUCH_BUTTONS) {
      const n = document.getElementById(b.id); if (!n) continue;
      const p = t.pos[b.id], tune = btnTune(b.id);
      n.classList.toggle('tc-placed', !!p);
      n.style.setProperty('--tc-size', String(clamp(tune.size ?? t.size, .7, 1.8)));
      n.style.setProperty('--tc-op', String(clamp(tune.opacity ?? t.opacity, .2, 1)));
      if (p) { n.style.setProperty('--tc-x', p.x + '%'); n.style.setProperty('--tc-y', p.y + '%'); }
      else { n.style.removeProperty('--tc-x'); n.style.removeProperty('--tc-y'); }
    }
  }
  let layout = null;
  function editLayout(onDone) {
    const el = document.getElementById('touch'); if (!el) return;
    const wasHidden = el.hidden, hiddenBtns = TOUCH_BUTTONS.map(b => document.getElementById(b.id)).filter(n => n && n.hidden);
    hiddenBtns.forEach(n => { n.hidden = false; });
    el.hidden = false; el.classList.add('tc-editing');
    const bar = document.createElement('div'); bar.className = 'tc-layout-bar'; bar.setAttribute('role', 'toolbar');
    bar.innerHTML = `<div class="tc-layout-head">
        <p><b>Drag a button</b> · tap it to size or dim it</p>
        <div class="tc-layout-actions"><button type="button" class="btn ghost" data-l="reset">Reset</button><button type="button" class="btn" data-l="done">Done</button></div>
      </div>
      <p class="tc-layout-sel" data-sel>All buttons</p>
      <div class="tc-layout-tune">
        <div class="tc-stepper"><span>Size</span><button type="button" data-l="size:-" aria-label="Smaller">−</button><output data-out="size">100%</output><button type="button" data-l="size:+" aria-label="Bigger">+</button></div>
        <div class="tc-stepper"><span>Brightness</span><button type="button" data-l="op:-" aria-label="Dimmer">−</button><output data-out="op">72%</output><button type="button" data-l="op:+" aria-label="Brighter">+</button></div>
      </div>`;
    document.body.appendChild(bar);
    let drag = null, selected = null, pinch = null;
    const view = () => {
      const v = window.visualViewport;
      return v ? { w: v.width, h: v.height, x: v.offsetLeft || 0, y: v.offsetTop || 0 } : { w: innerWidth, h: innerHeight, x: 0, y: 0 };
    };
    const nameOf = id => TOUCH_BUTTONS.find(b => b.id === id)?.name || 'Button';
    const live = () => {
      const tune = selected ? btnTune(selected) : S.touch;
      const size = clamp(tune.size ?? S.touch.size, .7, 1.8), op = clamp(tune.opacity ?? S.touch.opacity, .2, 1);
      bar.querySelector('[data-out="size"]').textContent = Math.round(size * 100) + '%';
      bar.querySelector('[data-out="op"]').textContent = Math.round(op * 100) + '%';
      bar.querySelector('[data-sel]').textContent = selected ? nameOf(selected) : 'All buttons';
    };
    const mark = () => {
      for (const b of TOUCH_BUTTONS) document.getElementById(b.id)?.classList.toggle('tc-selected', b.id === selected);
      live();
    };
    const nudge = (kind, dir) => {
      if (kind === 'size') {
        const next = clamp(((selected ? btnTune(selected).size : null) ?? S.touch.size) + dir * .1, .7, 1.8);
        if (selected) { S.touch.btn[selected] = { ...btnTune(selected), size: +next.toFixed(2) }; }
        else { S.touch.size = +next.toFixed(2); }
      } else {
        const next = clamp(((selected ? btnTune(selected).opacity : null) ?? S.touch.opacity) + dir * .05, .2, 1);
        if (selected) { S.touch.btn[selected] = { ...btnTune(selected), opacity: +next.toFixed(2) }; }
        else { S.touch.opacity = +next.toFixed(2); }
      }
      applyTouch(); live(); save();
    };
    const down = e => {
      const b = e.target.closest('.tbtn'); if (!b) return;
      e.preventDefault(); e.stopPropagation();
      selected = b.id; mark();
      const r = b.getBoundingClientRect();
      drag = { b, id: e.pointerId, dx: e.clientX - (r.left + r.width / 2), dy: e.clientY - (r.top + r.height / 2), moved: false };
      try { b.setPointerCapture(e.pointerId); } catch (err) {}
      b.classList.add('tc-dragging');
    };
    const move = e => {
      if (!drag || e.pointerId !== drag.id) return;
      const vs = view(), padT = Math.max(12, (bar.getBoundingClientRect().bottom - vs.y) / vs.h * 100 + 4);
      const x = clamp((e.clientX - drag.dx - vs.x) / vs.w * 100, 6, 94);
      const y = clamp((e.clientY - drag.dy - vs.y) / vs.h * 100, padT, 94);
      if (Math.abs(x - (S.touch.pos[drag.b.id]?.x || x)) > .3 || Math.abs(y - (S.touch.pos[drag.b.id]?.y || y)) > .3) drag.moved = true;
      S.touch.pos[drag.b.id] = { x: +x.toFixed(2), y: +y.toFixed(2) }; applyTouch();
    };
    const up = e => { if (!drag || e.pointerId !== drag.id) return; drag.b.classList.remove('tc-dragging'); drag = null; save(); };
    const pinchDist = ev => {
      if (!ev.touches || ev.touches.length < 2) return 0;
      const a = ev.touches[0], b = ev.touches[1];
      return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    };
    const onPinchStart = e => {
      if (e.touches.length !== 2) return;
      const id = selected || e.target.closest?.('.tbtn')?.id; if (!id) return;
      selected = id; mark(); pinch = { d: pinchDist(e), size: (btnTune(id).size ?? S.touch.size) };
    };
    const onPinchMove = e => {
      if (!pinch || e.touches.length !== 2 || !selected) return;
      e.preventDefault();
      const next = clamp(pinch.size * (pinchDist(e) / Math.max(8, pinch.d)), .7, 1.8);
      S.touch.btn[selected] = { ...btnTune(selected), size: +next.toFixed(2) }; applyTouch(); live();
    };
    const onPinchEnd = () => { if (pinch) { pinch = null; save(); } };
    el.addEventListener('pointerdown', down, true); addEventListener('pointermove', move); addEventListener('pointerup', up); addEventListener('pointercancel', up);
    el.addEventListener('touchstart', onPinchStart, { passive: true }); el.addEventListener('touchmove', onPinchMove, { passive: false }); el.addEventListener('touchend', onPinchEnd); el.addEventListener('touchcancel', onPinchEnd);
    const finish = () => {
      el.removeEventListener('pointerdown', down, true); removeEventListener('pointermove', move); removeEventListener('pointerup', up); removeEventListener('pointercancel', up);
      el.removeEventListener('touchstart', onPinchStart); el.removeEventListener('touchmove', onPinchMove); el.removeEventListener('touchend', onPinchEnd); el.removeEventListener('touchcancel', onPinchEnd);
      for (const b of TOUCH_BUTTONS) document.getElementById(b.id)?.classList.remove('tc-selected', 'tc-dragging');
      el.classList.remove('tc-editing'); hiddenBtns.forEach(n => { n.hidden = true; }); el.hidden = wasHidden; bar.remove(); layout = null; save(); onDone && onDone();
    };
    bar.addEventListener('click', e => {
      const a = e.target.closest('[data-l]')?.dataset.l; if (!a) return;
      if (a === 'reset') { S.touch.pos = {}; S.touch.btn = {}; S.touch.size = defaults().touch.size; S.touch.opacity = defaults().touch.opacity; selected = null; mark(); applyTouch(); save(); }
      if (a === 'done') finish();
      if (a === 'size:+') nudge('size', 1);
      if (a === 'size:-') nudge('size', -1);
      if (a === 'op:+') nudge('op', 1);
      if (a === 'op:-') nudge('op', -1);
    });
    bar.addEventListener('pointerdown', e => e.stopPropagation());
    mark(); applyTouch();
    layout = { finish };
  }

  // ---------- the Controls screen ----------
  let capture = null;
  function screen() {
    let scr = document.getElementById('controlsScreen');
    if (scr) return scr;
    scr = document.createElement('div'); scr.className = 'overlay controls-screen'; scr.id = 'controlsScreen'; scr.hidden = true;
    scr.setAttribute('role', 'dialog'); scr.setAttribute('aria-modal', 'true'); scr.setAttribute('aria-labelledby', 'ctlTitle');
    document.body.appendChild(scr);
    scr.addEventListener('click', e => {
      const t = e.target.closest('[data-ctl]'); if (!t) return;
      const [kind, a, b] = t.dataset.ctl.split(':');
      if (kind === 'tab') { scr.dataset.tab = a; render(); }
      if (kind === 'key') { capture = { id: a, slot: +b }; render(); }
      if (kind === 'clear') { bind(a, +b, ''); render(); }
      if (kind === 'reset-keys') { S.keys = defaults().keys; S.extra = true; save(); render(); }
      if (kind === 'stick') { S.touch.stick = a; save(); render(); }
      if (kind === 'reset-touch') { S.touch = defaults().touch; save(); render(); }
      if (kind === 'layout') { scr.hidden = true; editLayout(() => { scr.hidden = false; render(); }); }
      if (kind === 'close') close();
    });
    scr.addEventListener('input', e => {
      if (e.target.dataset.range === 'opacity') S.touch.opacity = +e.target.value / 100;
      if (e.target.dataset.range === 'size') S.touch.size = clamp(+e.target.value / 100, .7, 1.8);
      const out = e.target.parentElement.querySelector('output'); if (out) out.textContent = e.target.value + '%';
      applyTouch(); clearTimeout(scr._t); scr._t = setTimeout(save, 250);
    });
    // key capture runs before the game sees the key
    document.addEventListener('keydown', e => {
      if (scr.hidden) return;
      if (capture) {
        e.preventDefault(); e.stopPropagation();
        if (e.code === 'Escape') { capture = null; render(); return; }
        if (e.code === 'Backspace' || e.code === 'Delete') { bind(capture.id, capture.slot, ''); capture = null; render(); return; }
        const moved = bind(capture.id, capture.slot, e.code); capture = null; render(moved.length ? `${keyName(e.code)} moved here from ${moved.join(', ')}.` : '');
        return;
      }
      if (e.code === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
    }, true);
    return scr;
  }
  let onClose = null;
  function open(where, done) {
    const scr = screen(); onClose = done || null; capture = null;
    scr.dataset.tab = where || scr.dataset.tab || (matchMedia('(pointer: coarse)').matches ? 'touch' : 'keys');
    render(); scr.hidden = false;
    setTimeout(() => scr.querySelector('[data-ctl^="tab"][aria-selected="true"]')?.focus(), 30);
  }
  function close() { const scr = document.getElementById('controlsScreen'); if (scr) scr.hidden = true; capture = null; const d = onClose; onClose = null; d && d(); }
  function render(msg = '') {
    const scr = screen(), tab = scr.dataset.tab || 'keys', t = S.touch;
    const keyRows = ACTIONS.map(a => `<div class="ctl-row"><span>${a.name}</span>${[0, 1].map(i => {
      const on = capture && capture.id === a.id && capture.slot === i, code = S.keys[a.id][i];
      return `<span class="ctl-key-wrap"><button type="button" class="ctl-key${on ? ' listening' : ''}${code ? '' : ' empty'}" data-ctl="key:${a.id}:${i}" aria-label="${a.name}, key ${i + 1}: ${on ? 'press a key' : keyName(code)}">${on ? 'Press a key…' : keyName(code)}</button>${code && !on ? `<button type="button" class="ctl-clear" data-ctl="clear:${a.id}:${i}" aria-label="Clear ${a.name} key ${i + 1}">×</button>` : ''}</span>`;
    }).join('')}</div>`).join('');
    scr.innerHTML = `<section class="panel ctl-panel"><header class="ctl-head"><div><p class="eyebrow">SETTINGS</p><h2 id="ctlTitle">Controls</h2></div><button type="button" class="btn ghost" data-ctl="close" aria-label="Close controls">×</button></header>
      <div class="ctl-tabs" role="tablist"><button type="button" role="tab" aria-selected="${tab === 'keys'}" data-ctl="tab:keys">⌨️ Keyboard</button><button type="button" role="tab" aria-selected="${tab === 'touch'}" data-ctl="tab:touch">📱 Touch buttons</button></div>
      ${tab === 'keys' ? `<p class="ctl-note">Click a key box, then press the new key. <b>Backspace</b> clears it, <b>Esc</b> cancels. Esc always pauses.</p>
        <div class="ctl-keys">${keyRows}</div>${msg ? `<p class="ctl-msg" role="status">${msg}</p>` : ''}
        <div class="ctl-actions"><button type="button" class="btn ghost" data-ctl="reset-keys">Reset keys</button><button type="button" class="btn" data-ctl="close">Done</button></div>`
      : `<p class="ctl-note">How the on-screen buttons look and where they sit on phones and tablets. In Move buttons you can also size and brighten each one.</p>
        <label class="ctl-range">Brightness <input type="range" min="20" max="100" step="5" value="${Math.round(t.opacity * 100)}" data-range="opacity"><output>${Math.round(t.opacity * 100)}%</output></label>
        <label class="ctl-range">Size <input type="range" min="70" max="180" step="5" value="${Math.round(t.size * 100)}" data-range="size"><output>${Math.round(t.size * 100)}%</output></label>
        <div class="ctl-row ctl-stick"><span>Joystick side</span><div><button type="button" class="ctl-pill${t.stick !== 'right' ? ' on' : ''}" data-ctl="stick:left" aria-pressed="${t.stick !== 'right'}">Left</button><button type="button" class="ctl-pill${t.stick === 'right' ? ' on' : ''}" data-ctl="stick:right" aria-pressed="${t.stick === 'right'}">Right</button></div></div>
        <div class="ctl-preview" aria-hidden="true" style="--op:${t.opacity};--sz:${t.size}"><span class="${t.stick === 'right' ? 'r' : ''}">◎</span>${TOUCH_BUTTONS.slice(0, 3).map(b => `<i>${b.name}</i>`).join('')}</div>
        <div class="ctl-actions"><button type="button" class="btn ghost" data-ctl="reset-touch">Reset touch</button><button type="button" class="btn" data-ctl="layout">✋ Move, size &amp; brightness</button><button type="button" class="btn" data-ctl="close">Done</button></div>`}
    </section>`;
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', applyTouch); else applyTouch();
  root.TCControls = { ACTIONS, is, held, isGameKey, label, short, keyName, patchCopy, custom, open, close, editLayout, applyTouch, get settings() { return S; } };
})(typeof window !== 'undefined' ? window : globalThis);
