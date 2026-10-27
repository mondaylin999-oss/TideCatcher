/* Canvas based, pauseable catch-guide mini scenes. */
(function (root) {
  'use strict';
  const W = 1280, H = 720, BEAT = 3.25, DURATION = BEAT * 3, ease = t => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
  const lerp = (a, b, t) => a + (b - a) * t;
  const between = (t, a, b) => ease((t - a) / Math.max(.001, b - a));
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const stage = document.getElementById('catchClipStage');
  if (!stage) return;
  const canvas = document.getElementById('catchClipCanvas'), ctx = canvas.getContext('2d');
  const caption = document.getElementById('catchClipCaption'), tag = document.getElementById('catchClipTag');
  const progress = document.getElementById('catchClipProgress'), segments = [...document.querySelectorAll('.catch-clip-segment')];
  const badge = document.getElementById('catchClipInput'), back = document.getElementById('catchClipPrev');
  const next = document.getElementById('catchClipNext'), toggle = document.getElementById('catchClipPause');
  const replay = document.getElementById('catchClipReplay'), speed = document.getElementById('catchClipSpeed');
  let resizeObserver, frame = 0, lastFrame = 0, elapsed = 0, speedMul = 1, phase = 'stopped', resumePhase = 'playing';
  let restUntil = 0, autoReplays = 0, beatShown = -1, cameraX = 0, cycleEvents = new Set(), settings = null;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const getTouch = () => document.getElementById('touch') && !document.getElementById('touch').hidden;

  function resize() {
    const rect = stage.getBoundingClientRect(); if (!rect.width) return;
    const dpr = Math.max(1, Math.min(3, devicePixelRatio || 1));
    const width = Math.round(rect.width * dpr), height = Math.round(rect.width * 9 / 16 * dpr);
    if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
    ctx.setTransform(width / W, 0, 0, height / H, 0, 0); paint(elapsed);
  }
  if ('ResizeObserver' in root) { resizeObserver = new ResizeObserver(resize); resizeObserver.observe(stage); }
  else root.addEventListener('resize', resize);

  function inputFor(type, variant, t) {
  const catchTap = { from: 7.45, to: 8.25, keys: ['J', 'X'], touch: 'pounce', label: 'POUNCE', held: true };
    const events = {
      F: [{ from: 3.45, to: 4.65, keys: ['SPACE'], alternatives: ['A', 'D'], touch: 'jump', label: 'DODGE', held: true }, catchTap],
      N: [{ from: .15, to: 1.1, keys: ['A', 'D'], touch: 'move', label: 'RUN', held: true }, { from: 3.75, to: 6.55, keys: ['SHIFT'], touch: 'sneak', label: 'HOLD', held: true }, catchTap],
      L: [{ from: .75, to: 1.4, keys: ['E'], touch: 'eyes', label: 'EYES' }, { from: 4.2, to: 5.1, keys: ['S'], touch: 'scratch', label: 'SCRATCH' }],
      B: [{ from: .7, to: 1.35, keys: ['E'], touch: 'eyes', label: 'EYES' }, { from: 4.15, to: 5.05, keys: ['S'], touch: 'scratch', label: 'SCRATCH' }, catchTap],
      E: [{ from: 3.9, to: 4.8, keys: ['SPACE'], touch: 'jump', label: 'JUMP', held: true }, { from: 7.2, to: 8, keys: ['J', 'X'], touch: 'pounce', label: 'POUNCE', held: true }],
      S: [{ from: 3.75, to: 5.15, keys: ['A', 'D'], touch: 'release', label: 'LET GO', held: false }, { from: 6.35, to: 7.1, keys: ['A', 'D'], touch: 'move', label: 'MOVE' }, catchTap],
      J: [{ from: 3.55, to: 6.45, keys: ['A', 'D'], touch: 'move', label: 'CHASE' }, catchTap],
      C: [{ from: .2, to: 4.9, keys: ['SHIFT'], touch: 'sneak', label: 'SLOW WALK', held: true }],
      G: [{ from: 3.65, to: 4.55, keys: ['SPACE'], touch: 'jump', label: 'JUMP', held: true }, { from: 7.15, to: 7.9, keys: ['J', 'X'], touch: 'pounce', label: 'POUNCE', held: true }]
    };
    if (type === 'C' && variant === 1) {
      const phase = (t % 2.4) / 2.4;
      return phase < .42 ? { keys: ['S'], touch: 'hold', label: 'HOLD', held: true } : phase < .62 ? { keys: ['S'], touch: 'release', label: 'RELEASE' } : null;
    }
    return (events[type] || [catchTap]).find(e => t >= e.from && t <= e.to) || null;
  }
  // A single master clock drives captions and controls. Scene time is derived from it so
  // brief action windows linger at 0.6x without separate timers drifting out of sync.
  function sceneClock(type, t) {
    const slow = {
      F: [[3.45, 4.65], [7.45, 8.25]], N: [[7.45, 8.25]], L: [[3.2, 4.2]], B: [[4.15, 5.05], [7.45, 8.25]],
      E: [[3.9, 4.8], [7.2, 8]], S: [[3.75, 5.15], [7.45, 8.25]], J: [[7.45, 8.25]], C: [[6.5, 7.5]], G: [[3.65, 4.55], [7.15, 7.9]]
    }[type] || [];
    let offset = 0;
    for (const [start, end] of slow) {
      if (t <= start) break;
      offset += Math.max(0, Math.min(t, end) - start) * .4;
      if (t < end) break;
    }
    return Math.max(0, t - offset);
  }
  function actionFor(type, t) {
    const move = (a, b, start, end) => lerp(a, b, between(t, start, end));
    const state = { catX: 300, catY: 590, catAction: 'idle', catFacing: 1, moodX: 920, moodY: 500, moodScale: 1, moodAlpha: 1, moodRotation: 0, moodFace: 'normal', cue: '', cueAlpha: 0, ring: 0, fireflies: 0, tooLoud: false, stolen: false, landing: 0 };
    const setMove = (x, a, b, action = 'walk') => { state.catX = move(300, x, a, b); state.catAction = action; state.catFacing = state.catX >= 300 ? 1 : -1; };
    if (type === 'F') {
      state.moodX = t < 2.1 ? 920 + Math.sin(t * 31) * 8 : move(920, 540, 2.1, 2.85);
      state.moodFace = t > 3.9 && t < 7.5 ? 'dizzy' : t > 2.1 ? 'angry' : 'angry';
      if (t >= 3.35) { state.catX = move(300, 440, 3.35, 4.1); state.catFacing = 1; state.catAction = t < 4.45 ? 'jump' : t < 4.7 ? 'land' : 'idle'; state.catY = 590 - Math.sin(between(t, 3.35, 4.45) * Math.PI) * 155; state.landing = t >= 4.45 && t < 4.85 ? 1 - between(t, 4.45, 4.85) : 0; }
      if (t >= 7.15) { state.catX = move(440, 700, 7.15, 8.55); state.catFacing = 1; state.catAction = t < 8.7 ? 'pounce' : 'idle'; state.catY = 590 - Math.sin(between(t, 7.15, 8.7) * Math.PI) * 92; }
      state.cue = t < 2.1 ? '⚡' : state.moodFace === 'dizzy' ? '✦ ✦' : ''; state.cueAlpha = state.cue ? .9 : 0;
    } else if (type === 'N') {
      if (t < 1.25) setMove(430, 0, 1.15);
      else if (t < 3.5) { state.catX = move(430, 350, 1.25, 2.7); state.catFacing = -1; }
      else if (t < 6.7) { state.catX = move(350, 720, 3.5, 6.5); state.catFacing = 1; state.catAction = 'sneak'; }
      else if (t < 7.45) { state.catX = 720; state.catAction = 'idle'; }
      else { state.catX = move(720, 850, 7.45, 8.6); state.catFacing = 1; state.catAction = t < 8.75 ? 'pounce' : 'idle'; }
      state.tooLoud = t > .95 && t < 1.95;
      state.moodX = t < 2 ? 920 + Math.sin(t * 38) * 11 : move(950, 920, 2, 4);
      state.moodFace = t < 2 ? 'scared' : 'relaxed'; state.cue = state.tooLoud ? '✕ too loud' : t > 4.1 ? '…' : ''; state.cueAlpha = state.cue ? 1 : 0;
    } else if (type === 'L' || type === 'B') {
      state.catX = move(300, type === 'L' ? 700 : 665, .5, 4.1); state.catFacing = 1; state.catAction = t < 4.2 ? 'walk' : 'idle';
      if (t >= 4.2 && t < 5.15) state.catAction = 'scratch';
      if (t >= 5.2) state.catAction = type === 'L' ? 'sit' : 'idle';
      if (type === 'B' && t >= 7.45) { state.catX = move(665, 850, 7.45, 8.55); state.catFacing = 1; state.catAction = t < 8.7 ? 'pounce' : 'idle'; state.catY = 590 - Math.sin(between(t, 7.45, 8.7) * Math.PI) * 90; }
      state.moodX = 850; state.moodY = 515 - (type === 'B' ? 0 : 18);
      state.moodAlpha = type === 'B' ? between(t, 4.7, 5.35) : between(t, .9, 1.5);
      state.cue = t < 1.4 ? (type === 'L' ? '♪' : 'EYES') : t < 4.2 ? '✧' : '';
      state.cueAlpha = state.cue ? .9 : 0; state.ring = t >= 7 ? between(t, 7, 9.1) : 0;
    } else if (type === 'E') {
      state.moodX = 920; state.moodY = 485 - Math.abs(Math.sin(t * 2.45)) * 95; state.moodFace = 'happy';
      if (t >= 3.9) { state.catX = move(300, 660, 3.9, 5.9); state.catFacing = 1; state.catAction = t < 6.15 ? 'jump' : t < 6.45 ? 'land' : 'idle'; state.catY = 590 - Math.sin(between(t, 3.9, 6.15) * Math.PI) * 150; state.landing = t >= 6.15 && t < 6.55 ? 1 - between(t, 6.15, 6.55) : 0; }
      if (t >= 7.1) { state.catX = move(660, 820, 7.1, 8.6); state.catAction = t < 8.75 ? 'pounce' : 'idle'; state.catY = 590 - Math.sin(between(t, 7.1, 8.75) * Math.PI) * 138; }
      else if (t > 6.2 && t < 7.1) { state.catX = 660; state.catAction = 'idle'; }
      state.cue = t > 3.7 && t < 5.1 ? '↑' : ''; state.cueAlpha = state.cue ? 1 : 0;
    } else if (type === 'S') {
      state.moodAlpha = t < 1 ? .25 : 1; state.moodFace = t > 2 && t < 4.6 ? 'looking' : 'peek';
      if (t < 2.2) setMove(520, 0, 2.1);
      else if (t < 5.5) { state.catX = 520; state.catAction = 'idle'; }
      else if (t < 7.35) { state.catX = move(520, 720, 5.5, 7.25); state.catFacing = 1; state.catAction = 'walk'; }
      else { state.catX = move(720, 850, 7.35, 8.65); state.catFacing = 1; state.catAction = t < 8.75 ? 'pounce' : 'idle'; }
      state.cue = t > 3.7 && t < 5.4 ? 'LET GO' : ''; state.cueAlpha = state.cue ? .85 : 0;
    } else if (type === 'J') {
      state.stolen = t > .8 && t < 7.1; state.moodX = t < 3 ? 920 + between(t, .8, 1.2) * 30 : move(950, 790, 3, 6.3);
      state.moodFace = t < 3 ? 'sneaky' : t < 6.4 ? 'run' : 'tired';
      if (t >= 3.4 && t < 6.5) setMove(680, 3.4, 6.3, 'walk');
      else if (t >= 6.5 && t < 7.2) { state.catX = 680; state.catAction = 'idle'; }
      else if (t >= 7.2) { state.catX = move(680, 770, 7.2, 8.6); state.catFacing = 1; state.catAction = t < 8.7 ? 'pounce' : 'idle'; }
      state.cue = state.stolen ? '✦' : t > 6.3 ? '…' : ''; state.cueAlpha = state.cue ? .9 : 0;
    } else if (type === 'C') {
      if (variantForCalm(type) === 1) {
        state.catX = 460; state.catAction = 'idle'; state.ring = .5 + .5 * Math.sin(t * Math.PI / 1.2); state.cue = 'S'; state.cueAlpha = .8;
      } else {
        if (t < 5) setMove(710, 0, 4.9, 'sneak'); else { state.catX = 710; state.catAction = 'sit'; }
        state.fireflies = t < 5 ? between(t, .6, 1.6) : 1; state.ring = t > 6.5 ? between(t, 6.5, 9.1) : 0;
      }
    } else if (type === 'G') {
      const u = t / DURATION; state.moodX = 690 + Math.sin(u * Math.PI * 2) * 230; state.moodY = 430 - Math.sin(u * Math.PI * 3) * 155;
      state.moodRotation = Math.cos(u * Math.PI * 2) * .12; state.moodFace = 'sparkly';
      if (t >= 3.65) { state.catX = move(300, 650, 3.65, 5.6); state.catFacing = 1; state.catAction = t < 5.8 ? 'jump' : 'idle'; state.catY = 590 - Math.sin(between(t, 3.65, 5.8) * Math.PI) * 150; }
      if (t >= 7.1) { state.catX = move(650, 730, 7.1, 8.5); state.catAction = t < 8.65 ? 'pounce' : 'idle'; state.catY = 590 - Math.sin(between(t, 7.1, 8.65) * Math.PI) * 120; }
    }
    if (t > 9) { state.moodX = lerp(state.moodX, state.catX + 50, between(t, 9, 9.55)); state.moodY = lerp(state.moodY, state.catY - 75, between(t, 9, 9.55)); state.moodScale = lerp(1, .25, between(t, 9, 9.5)); state.cue = '✦'; state.cueAlpha = 1; }
    return state;
  }
  function variantForCalm(type) { return settings?.variant || 0; }
  function moodFace(g, mood, state, time) {
    const x = state.moodX, y = state.moodY, size = 98 * state.moodScale;
    g.save(); g.globalAlpha = state.moodAlpha; g.translate(x, y); g.rotate(state.moodRotation); g.scale(state.moodScale, state.moodScale);
    if (mood?.complete && mood.naturalWidth) { g.shadowColor = settings.color; g.shadowBlur = 22; g.drawImage(mood, -size / 2, -size / 2, size, size); g.shadowBlur = 0; }
    if (state.moodFace === 'dizzy') { g.fillStyle = '#fff4bc'; g.font = 'bold 27px sans-serif'; g.fillText('✦', -22 + Math.sin(time * 6) * 4, -62); g.fillText('✦', 22 + Math.cos(time * 6) * 4, -58); }
    g.restore();
  }
  function background(g, time) {
    const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#17142e'); sky.addColorStop(.58, '#28234b'); sky.addColorStop(1, '#34484b');
    g.fillStyle = sky; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 40; i++) { const x = (i * 317 + 71) % W, y = (i * 137 + 28) % 440; g.globalAlpha = .25 + .35 * Math.sin(time * 1.4 + i); g.fillStyle = '#f9eabf'; g.fillRect(x, y, i % 5 === 0 ? 3 : 2, i % 5 === 0 ? 3 : 2); }
    g.globalAlpha = 1; g.fillStyle = '#fff0c3'; g.shadowColor = '#fff0c3'; g.shadowBlur = 45; g.beginPath(); g.arc(1050, 132, 48, 0, Math.PI * 2); g.fill(); g.shadowBlur = 0;
    g.fillStyle = '#22233e'; g.beginPath(); g.moveTo(0, 510); g.quadraticCurveTo(290, 435, 570, 512); g.quadraticCurveTo(950, 433, 1280, 500); g.lineTo(1280, 600); g.lineTo(0, 600); g.fill();
    g.fillStyle = '#213943'; g.fillRect(0, 590, W, 130); g.strokeStyle = '#82c8b6'; g.lineWidth = 5; g.beginPath(); g.moveTo(0, 590); g.lineTo(W, 590); g.stroke();
    for (let i = 0; i < 44; i++) { const x = i * 31 + 4; const h = 10 + (i * 7 % 17); g.strokeStyle = i % 3 ? '#315b50' : '#647a50'; g.lineWidth = 3; g.beginPath(); g.moveTo(x, 590); g.quadraticCurveTo(x - 5, 590 - h, x + 4, 590 - h - 4); g.stroke(); }
  }
  function drawRing(g, x, y, amount, color) {
    if (!amount) return;
    g.save(); g.strokeStyle = `${color}66`; g.lineWidth = 8; g.beginPath(); g.arc(x, y, 67, 0, Math.PI * 2); g.stroke();
    g.strokeStyle = color; g.lineWidth = 8; g.lineCap = 'round'; g.beginPath(); g.arc(x, y, 67, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * amount); g.stroke(); g.restore();
  }
  function drawBadge(input) {
    badge.replaceChildren(); badge.classList.toggle('is-held', !!input?.held); badge.classList.toggle('is-visible', !!input);
    if (!input) return;
    if (getTouch()) {
      if (['move', 'sneak'].includes(input.touch)) { const j = document.createElement('span'); j.className = 'tip-joystick-icon'; j.setAttribute('aria-hidden', 'true'); badge.appendChild(j); }
      else { const key = document.createElement('span'); key.className = 'catch-clip-touch-key'; key.textContent = settings.touchLabels?.[input.touch] || input.touch.toUpperCase(); badge.appendChild(key); }
      const label = document.createElement('span'), control = settings.touchLabels?.[input.touch] || '';
      const action = settings.copy.catchClipActionLabels?.[input.label] || input.label || '';
      label.textContent = control && control.toLowerCase() !== action.toLowerCase() ? `${control} · ${action}` : (control || action); badge.appendChild(label);
    } else {
      for (const key of input.keys || []) { const cap = document.createElement('kbd'); cap.textContent = key; badge.appendChild(cap); }
      if (input.alternatives?.length) { const or = document.createElement('span'); or.textContent = settings.copy.catchClipOr || 'or'; badge.appendChild(or);
        for (const key of input.alternatives) { const cap = document.createElement('kbd'); cap.textContent = key; badge.appendChild(cap); } }
      if (input.label) { const label = document.createElement('span'); label.textContent = settings.copy.catchClipActionLabels?.[input.label] || input.label; badge.appendChild(label); }
    }
  }
  function paint(time) {
    if (!settings) return;
    const sceneTime = sceneClock(settings.type, time);
    const state = actionFor(settings.type, sceneTime), input = inputFor(settings.type, settings.variant, sceneTime);
    ctx.save(); ctx.clearRect(0, 0, W, H); background(ctx, sceneTime);
    const target = clamp(state.catX - 475, 0, 260); cameraX += (target - cameraX) * .09;
    ctx.translate(-cameraX, 0);
    if (settings.type === 'C' && settings.variant === 0) {
      for (let i = 0; i < 3; i++) { const x = 420 + i * 115, y = 545 + Math.sin(time * 2 + i) * 22; ctx.fillStyle = '#fff3aa'; ctx.shadowColor = '#fff3aa'; ctx.shadowBlur = 20; ctx.beginPath(); ctx.arc(x, y, 6, 0, 7); ctx.fill(); ctx.shadowBlur = 0; }
    }
    if (input && ['jump', 'pounce', 'release'].includes(input.touch)) {
      ctx.strokeStyle = `${settings.color}9c`; ctx.globalAlpha = .72 + .18 * Math.sin(time * 15); ctx.lineWidth = 5;
      ctx.beginPath(); ctx.arc(state.catX, state.catY - 85, 96, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1;
      ctx.fillStyle = '#fff6d6'; ctx.font = '800 18px Nunito, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('0.6×', state.catX, state.catY - 205);
    }
    if (state.stolen) { ctx.strokeStyle = '#fff0a055'; ctx.setLineDash([9, 13]); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(state.moodX, state.moodY); ctx.quadraticCurveTo(790, 420, 590, 500); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = '#fff3a0'; ctx.shadowColor = '#fff3a0'; ctx.shadowBlur = 18; ctx.beginPath(); ctx.arc(650, 500, 10, 0, 7); ctx.fill(); ctx.shadowBlur = 0; }
    ctx.strokeStyle = 'rgba(255,238,170,.25)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(state.catX - state.catFacing * 160, 558); ctx.quadraticCurveTo(state.catX - state.catFacing * 90, 550, state.catX, 565); ctx.stroke();
    for (let i = 1; i <= 3; i++) { ctx.fillStyle = `rgba(255,239,173,${.28 + i * .14})`; ctx.beginPath(); ctx.arc(state.catX - state.catFacing * i * 35, 555 - i % 2 * 7, 4, 0, Math.PI * 2); ctx.fill(); }
    if (settings.type === 'C' && settings.variant === 1) drawRing(ctx, state.catX, 456, state.ring, settings.color);
    else if (state.ring) drawRing(ctx, state.moodX, state.moodY, state.ring, settings.color);
    if (settings.type === 'B' && time > 3.5 && time < 5.6) {
      for (let i = 0; i < 9; i++) { const p = (time * 1.8 + i * .31) % 1; ctx.globalAlpha = 1 - p; ctx.fillStyle = i % 2 ? '#d5b48a' : '#fff0a0'; ctx.beginPath(); ctx.arc(850 + Math.sin(i * 8) * (18 + p * 28), 550 - p * 80, 3 + (i % 3), 0, Math.PI * 2); ctx.fill(); }
      ctx.globalAlpha = 1;
    }
    moodFace(ctx, settings.mood, state, sceneTime);
    if (state.cue && state.cueAlpha) { ctx.save(); ctx.globalAlpha = state.cueAlpha; ctx.fillStyle = settings.color; ctx.textAlign = 'center'; ctx.font = state.cue.length > 6 ? '700 25px Nunito, sans-serif' : '700 42px Nunito, sans-serif'; ctx.shadowColor = settings.color; ctx.shadowBlur = 18; ctx.fillText(state.cue, state.moodX, state.moodY - 85); ctx.restore(); }
    if (settings.type === 'C' && settings.variant === 0) for (let i = 0; i < 3; i++) { const fx = lerp(420 + i * 115, 710, between(sceneTime, 4.8 + i * .1, 6.1)); const fy = 528 + Math.sin(sceneTime * 3 + i) * 15; ctx.fillStyle = '#fff1a0'; ctx.shadowColor = '#fff1a0'; ctx.shadowBlur = 16; ctx.beginPath(); ctx.arc(fx, fy, 5, 0, 7); ctx.fill(); ctx.shadowBlur = 0; }
    ctx.fillStyle = 'rgba(8,10,24,.36)'; ctx.beginPath(); ctx.ellipse(state.catX, 594, 86, 10, 0, 0, Math.PI * 2); ctx.fill();
    const art = root.TCCatchClipArt;
    const pose = art?.drawCat(ctx, { x: state.catX, y: state.catY, height: 188, action: state.catAction, facing: state.catFacing, time: sceneTime, rigPose: settings.rigPose });
    if (pose) settings.rigPose = pose;
    if (state.landing) for (let i = 0; i < 6; i++) { const side = i % 2 ? 1 : -1, p = between(time, 0, .4); ctx.globalAlpha = state.landing * (1 - p); ctx.fillStyle = '#d9dec2'; ctx.beginPath(); ctx.arc(state.catX + side * (50 + p * 40) + Math.sin(time * 12 + i) * 5, 575 - p * (15 + i * 3), 3 + (i % 3), 0, Math.PI * 2); ctx.fill(); } ctx.globalAlpha = 1;
    if (time > 9 && time < 10.1) {
      const p = between(time, 9, 9.55), x = lerp(state.moodX, state.catX - state.catFacing * 50, p), y = lerp(state.moodY, state.catY - 50, p);
      ctx.fillStyle = '#fff0a0'; ctx.shadowColor = '#fff0a0'; ctx.shadowBlur = 24; ctx.beginPath(); ctx.arc(x, y, 12, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
      for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + time * 2.7, r = 32 + p * 28; ctx.fillStyle = '#fff0ae'; ctx.fillRect(x + Math.cos(a) * r, y + Math.sin(a) * r, 4, 4); }
      ctx.globalAlpha = 1 - between(time, 9.5, 10.05); ctx.font = '900 34px Nunito, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#ffe58b'; ctx.fillText(settings.copy.catchClipGlow || '+Glow', state.catX, state.catY - 220 - between(time, 9, 9.8) * 45); ctx.globalAlpha = 1;
    }
    if (state.fireflies) for (let i = 0; i < 3; i++) { const a = time * 1.4 + i * 2.1, x = 700 + Math.cos(a) * 75, y = 440 + Math.sin(a) * 45; ctx.fillStyle = '#fff2a6'; ctx.shadowColor = '#fff2a6'; ctx.shadowBlur = 18; ctx.beginPath(); ctx.arc(x, y, 4, 0, 7); ctx.fill(); ctx.shadowBlur = 0; }
    ctx.restore(); drawBadge(input);
  }
  function updateBeat(index) {
    index = clamp(index, 0, 2); if (index === beatShown) return; beatShown = index;
    const activeSettings = settings;
    caption.classList.add('is-fading');
    requestAnimationFrame(() => { if (!activeSettings || activeSettings !== settings) return; caption.textContent = activeSettings.steps[index] || activeSettings.steps[0] || ''; tag.textContent = `${index + 1} / 3 · ${activeSettings.stages[index] || ''}`; progress.textContent = activeSettings.copy.catchClipStepText.replace('{n}', String(index + 1));
      segments.forEach((el, i) => { el.classList.toggle('is-current', i === index); el.classList.toggle('is-complete', i < index); });
      requestAnimationFrame(() => caption.classList.remove('is-fading')); });
  }
  function sfx(name, strength = .45) { try { root.TCSfx?.ui(name, strength); } catch (_) {} }
  const soundMarks = { F: [[2.05, 'appear'], [3.4, 'jump'], [7.2, 'pounce']], N: [[1, 'error'], [3.7, 'step'], [7.4, 'pounce']], L: [[.7, 'eyes'], [4.2, 'scratch']], B: [[.7, 'eyes'], [4.15, 'scratch'], [7.4, 'pounce']], E: [[3.9, 'jump'], [7.2, 'pounce']], S: [[6.35, 'step'], [7.4, 'pounce']], J: [[.8, 'appear'], [3.5, 'step'], [7.2, 'pounce']], C: [[.3, 'step']], G: [[3.65, 'jump'], [7.15, 'pounce']] };
  function fireSounds(from, to) { for (const [at, sound] of soundMarks[settings.type] || []) { const key = `${settings.type}:${settings.cycle}:${at}`; if (at > from && at <= to && !cycleEvents.has(key)) { cycleEvents.add(key); sfx(sound, sound === 'step' ? .24 : .4); } }
    if (from < 9 && to >= 9) { const key = `catch:${settings.cycle}`; if (!cycleEvents.has(key)) { cycleEvents.add(key); sfx('sparkle', .5); } } }
  function finishCycle(now) { phase = 'rest'; restUntil = now + 1500; }
  function tick(now) {
    frame = 0;
    if (document.hidden) { pause(); return; }
    if (phase === 'playing') {
      const dt = lastFrame ? Math.min(.05, Math.max(0, (now - lastFrame) / 1000)) : 0; lastFrame = now;
      const old = elapsed; elapsed = Math.min(DURATION, elapsed + dt * speedMul);
      fireSounds(old, elapsed);
      updateBeat(Math.min(2, Math.floor(elapsed / BEAT))); paint(elapsed);
      if (elapsed >= DURATION) finishCycle(now);
    } else if (phase === 'rest') {
      paint(elapsed);
      if (now >= restUntil) {
        if (autoReplays < 1) { autoReplays++; settings.cycle++; cycleEvents = new Set(); elapsed = 0; lastFrame = now; phase = 'playing'; updateBeat(0); sfx('start', .25); }
        else { phase = 'finished'; drawBadge(null); progress.textContent = settings.copy.catchClipFinished; toggle.textContent = settings.copy.catchClipReplay; }
      }
    }
    if (phase === 'playing' || phase === 'rest') frame = requestAnimationFrame(tick);
  }
  function schedule() { if (!frame && (phase === 'playing' || phase === 'rest')) frame = requestAnimationFrame(tick); }
  function pause() { if (phase === 'playing' || phase === 'rest') { resumePhase = phase; phase = 'paused'; } if (frame) cancelAnimationFrame(frame); frame = 0; toggle.textContent = settings?.copy.catchClipPlay || 'Play'; }
  function play() { if (!settings || reduced.matches) return; if (phase === 'finished' || phase === 'stopped') { elapsed = 0; autoReplays = 0; settings.cycle = 0; cycleEvents = new Set(); updateBeat(0); }
    phase = resumePhase === 'rest' && phase === 'paused' ? 'rest' : 'playing'; resumePhase = 'playing'; lastFrame = 0; toggle.textContent = settings.copy.catchClipPause; schedule(); }
  function seekBeat(delta) { if (!settings) return; if (reduced.matches) { elapsed = clamp((Math.floor(elapsed / BEAT) + delta) * BEAT + .02, 0, DURATION - .01); updateBeat(Math.min(2, Math.floor(elapsed / BEAT))); paint(elapsed); return; }
    elapsed = clamp((Math.floor(elapsed / BEAT) + delta) * BEAT + .02, 0, DURATION - .01); updateBeat(Math.min(2, Math.floor(elapsed / BEAT))); paint(elapsed); if (phase !== 'playing') { phase = 'paused'; toggle.textContent = settings.copy.catchClipPlay; } }
  function replayClip() { if (!settings) return; phase = 'stopped'; if (frame) cancelAnimationFrame(frame); frame = 0; elapsed = 0; autoReplays = 0; settings.cycle = 0; settings.rigPose = null; cameraX = 0; cycleEvents = new Set(); beatShown = -1; updateBeat(0); paint(0);
    if (reduced.matches) { phase = 'paused'; toggle.disabled = true; toggle.textContent = settings.copy.catchClipStill || 'Still frames'; } else { phase = 'playing'; toggle.disabled = false; toggle.textContent = settings.copy.catchClipPause; lastFrame = 0; schedule(); } }
  toggle.addEventListener('click', () => phase === 'playing' || phase === 'rest' ? pause() : play());
  back.addEventListener('click', () => seekBeat(-1)); next.addEventListener('click', () => seekBeat(1)); replay.addEventListener('click', replayClip);
  speed.addEventListener('click', () => { speedMul = speedMul === 1 ? .5 : 1; speed.textContent = `${settings?.copy.catchClipSpeed || 'Speed'} ${speedMul}×`; });
  addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  reduced.addEventListener?.('change', () => { if (reduced.matches) { pause(); if (settings) { toggle.disabled = true; toggle.textContent = settings.copy.catchClipStill || 'Still frames'; } } else if (settings) { toggle.disabled = false; toggle.textContent = settings.copy.catchClipPlay; paint(elapsed); } });
  function setupCopy(copy) {
    back.textContent = copy.catchClipPrev; next.textContent = copy.catchClipNext; toggle.textContent = copy.catchClipPause; replay.textContent = copy.catchClipReplay; speed.textContent = `${copy.catchClipSpeed} ${speedMul}×`;
  }
  root.TCCatchClipPlayer = {
    open(options) {
      if (frame) cancelAnimationFrame(frame); frame = 0; phase = 'stopped'; elapsed = 0; autoReplays = 0; cameraX = 0; beatShown = -1; cycleEvents = new Set();
      settings = { ...options, cycle: 0, rigPose: null, copy: { ...options.copy } }; stage.dataset.type = options.type; stage.dataset.variant = String(options.variant || 0);
      const mood = new Image(); settings.mood = mood; mood.src = options.moodSrc; mood.onload = () => paint(elapsed);
      elapsed = 0; setupCopy(settings.copy); updateBeat(0); resize();
      if (reduced.matches) { phase = 'paused'; toggle.textContent = settings.copy.catchClipStill || 'Still frames'; toggle.disabled = true; paint(0); }
      else { toggle.disabled = false; phase = 'playing'; lastFrame = 0; schedule(); }
    },
    close() { pause(); phase = 'stopped'; settings = null; drawBadge(null); },
    replay: replayClip,
  };
})(window);
