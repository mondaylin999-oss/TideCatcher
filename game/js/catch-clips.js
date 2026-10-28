/* Catch guides: a short real gameplay clip of Shwe catching each Moodling, with the three step captions
   and their keyboard/touch controls underneath. Clips live in assets/clips (variants share their family's). */
(function (root) {
  'use strict';
  const stage = document.getElementById('catchClipStage');
  if (!stage) return;
  const gallery = document.getElementById('catchClipCards');
  const dots = document.getElementById('catchClipDots');
  const caption = document.getElementById('catchClipCaption');
  const tag = document.getElementById('catchClipTag');
  const back = document.getElementById('catchClipPrev'), next = document.getElementById('catchClipNext');
  const touchControls = document.getElementById('touch');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let data = null, video = null, toggle = null;
  const storyboard = {
    F: [{keys:[],action:'NOTICE',pose:'windup'}, {keys:['SPACE'],or:['A','D'],action:'DODGE',pose:'dodge',motion:true}, {keys:['J','X'],action:'POUNCE',pose:'catch',motion:true}],
    N: [{keys:['A','D'],action:'RUN',pose:'scared'}, {keys:['SHIFT'],action:'HOLD',pose:'sneak',held:true}, {keys:['J','X'],action:'POUNCE',pose:'calm'}],
    L: [{keys:['E'],action:'EYES',pose:'chime'}, {keys:['S'],action:'SCRATCH',pose:'scratch'}, {keys:[],action:'WAIT',pose:'wait'}],
    B: [{keys:['E'],action:'EYES',pose:'marked'}, {keys:['S'],action:'SCRATCH',pose:'dig'}, {keys:['J','X'],action:'POUNCE',pose:'catch'}],
    E: [{keys:[],action:'NOTICE',pose:'bounce'}, {keys:['SPACE'],action:'JUMP',pose:'top',motion:true}, {keys:['J','X'],action:'POUNCE',pose:'catch'}],
    S: [{keys:[],action:'NOTICE',pose:'peek'}, {keys:['A','D'],action:'RELEASE',pose:'freeze',motion:true}, {keys:['A','D'],then:['J','X'],action:'MOVE + POUNCE',pose:'catch'}],
    J: [{keys:[],action:'NOTICE',pose:'steal'}, {keys:['A','D'],action:'CHASE',pose:'chase'}, {keys:['J','X'],action:'POUNCE',pose:'catch'}],
    C: [{keys:['SHIFT'],action:'SLOW WALK',pose:'reeds'}, {keys:[],action:'WAIT',pose:'wait'}, {keys:[],action:'WAIT',pose:'catch'}],
    C1: [{keys:['S'],action:'HOLD',pose:'breathe',held:true,motion:true}, {keys:['S'],action:'RELEASE',pose:'breathe',motion:true}, {keys:[],action:'WAIT',pose:'catch'}],
    G: [{keys:[],action:'NOTICE',pose:'arc'}, {keys:['SPACE'],action:'JUMP',pose:'top',motion:true}, {keys:['J','X'],action:'POUNCE',pose:'catch'}]
  };
  const touchInput = { RUN:'move', DODGE:'jump', JUMP:'jump', POUNCE:'pounce', EYES:'eyes', SCRATCH:'scratch', HOLD:'sneak', RELEASE:'release', 'MOVE + POUNCE':'pounce', CHASE:'move', 'SLOW WALK':'sneak' };
  function isTouch() { return !!touchControls && !touchControls.hidden; }
  function layout() { return matchMedia('(max-width: 700px)').matches ? 'mobile' : 'desktop'; }
  function badgeMarkup(step) {
    const type = isTouch() ? 'touch' : 'keys';
    if (step.keys.length === 0 && !step.or) return `<span class="catch-clip-no-input">${data.copy.catchClipNoButton || 'No button — watch Shwe'}</span>`;
    if (type === 'touch') {
      if (data.type==='C'&&data.variant===1&&['HOLD','RELEASE'].includes(step.action)) {
        const scratch=data.touchLabels?.scratch||'SCRATCH',action=data.copy.catchClipActionLabels?.[step.action]||step.action;
        return `<span class="catch-clip-touch-badge"><b>${escapeHtml(scratch)}</b><span>${escapeHtml(action)}</span></span>`;
      }
      if (step.then) {
        const moveLabel = data.touchLabels?.move || 'MOVE', catchLabel = data.touchLabels?.pounce || 'POUNCE';
        return `<span class="catch-clip-touch-badge"><span class="tip-joystick-icon" aria-hidden="true"></span><b>${escapeHtml(moveLabel)}</b><span class="catch-clip-or">→</span><b>${escapeHtml(catchLabel)}</b></span>`;
      }
      const input = step.action==='HOLD'?'sneak':touchInput[step.action] || 'move';
      const label = data.touchLabels?.[input] || step.action;
      const icon = ['move','sneak'].includes(input) ? '<span class="tip-joystick-icon" aria-hidden="true"></span>' : '';
      return `<span class="catch-clip-touch-badge">${icon}<b>${escapeHtml(label)}</b></span>`;
    }
    const keys = step.keys.map(k => `<kbd>${escapeHtml(k)}</kbd>`).join('');
    const alt = step.or ? `<span class="catch-clip-or">${escapeHtml(data.copy.catchClipOr || 'or')}</span>${step.or.map(k => `<kbd>${escapeHtml(k)}</kbd>`).join('')}` : '';
    const then = step.then ? `<span class="catch-clip-or">→</span>${step.then.map(k => `<kbd>${escapeHtml(k)}</kbd>`).join('')}` : '';
    const action = step.action && data.copy.catchClipActionLabels?.[step.action] ? `<span class="catch-clip-or">${escapeHtml(data.copy.catchClipActionLabels[step.action])}</span>` : '';
    return `${keys}${alt}${then}${action}`;
  }
  function escapeHtml(text) { return String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  const clipFile = (type, variant) => type === 'C' ? (variant === 1 ? 'C1' : 'C0') : type;
  const canWebm = () => !!document.createElement('video').canPlayType?.('video/webm; codecs="vp9"');
  function syncToggle() {
    if (!video || !toggle) return;
    const playing = !video.paused;
    toggle.textContent = playing ? '❚❚' : '▶';
    toggle.setAttribute('aria-label', playing ? (data?.copy.catchClipPause || 'Pause clip') : (data?.copy.catchClipPlay || 'Play clip'));
    toggle.setAttribute('aria-pressed', String(!playing));
  }
  function play() { video?.play().then(syncToggle, syncToggle); }
  function build() {
    gallery.replaceChildren();
    const story = data.type === 'C' && data.variant === 1 ? 'C1' : data.type, steps = storyboard[story] || storyboard.F, file = clipFile(data.type, data.variant);
    const wrap = document.createElement('div'); wrap.className = 'catch-clip-video-wrap';
    video = document.createElement('video'); video.className = 'catch-clip-video';
    video.muted = true; video.loop = true; video.playsInline = true; video.setAttribute('playsinline', ''); video.preload = 'auto';
    video.poster = `assets/clips/${file}.jpg`; video.src = `assets/clips/${file}.${canWebm() ? 'webm' : 'mp4'}`;
    video.setAttribute('aria-label', `${data.copy.catchClipVideoLabel || 'Gameplay clip'}: ${data.moodName || ''}`);
    video.addEventListener('click', () => { video.paused ? play() : (video.pause(), syncToggle()); });
    video.addEventListener('play', syncToggle); video.addEventListener('pause', syncToggle);
    toggle = document.createElement('button'); toggle.type = 'button'; toggle.className = 'catch-clip-toggle';
    toggle.addEventListener('click', () => { video.paused ? play() : (video.pause(), syncToggle()); });
    wrap.append(video, toggle);
    const list = document.createElement('ol'); list.className = 'catch-clip-steps';
    list.setAttribute('aria-label', data.copy.catchClipStepsLabel || 'How to catch, step by step');
    steps.forEach((step, i) => {
      const li = document.createElement('li'); li.className = 'catch-clip-step';
      const num = document.createElement('span'); num.className = 'catch-clip-number'; num.textContent = String(i + 1); num.setAttribute('aria-hidden', 'true');
      const body = document.createElement('div'); body.className = 'catch-clip-step-body';
      const name = document.createElement('strong'); name.className = 'catch-clip-stage-name'; name.textContent = data.stages[i] || '';
      const text = document.createElement('p'); text.className = 'catch-clip-card-caption'; text.textContent = data.steps[i] || data.steps[0] || '';
      const badge = document.createElement('div'); badge.className = 'catch-clip-card-control'; badge.setAttribute('aria-label', data.copy.catchClipControlsLabel || 'Control'); badge.innerHTML = badgeMarkup(step);
      body.append(name, text); li.append(num, body, badge); list.appendChild(li);
    });
    gallery.append(wrap, list);
    gallery.setAttribute('aria-label', data.copy.catchClipGalleryLabel || 'Catch clip');
    caption.textContent = (data.steps || []).join(' ');
    // the clip replaces the old picture pager, so its controls and step tag stay hidden
    [back, next, dots, document.querySelector('.catch-clip-mobile-nav')].forEach(el => { if (el) el.hidden = true; }); if (tag) tag.hidden = true;
    stage.classList.add('is-video');
    syncToggle();
    if (!reducedMotion.matches) play();
  }
  function open(options) { close(); data = { ...options }; build(); }
  function close() {
    if (video) { video.pause(); video.removeAttribute('src'); video.load(); }
    video = null; toggle = null; data = null;
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden && video) video.pause(); });
  reducedMotion.addEventListener?.('change', () => { if (video && reducedMotion.matches) video.pause(); });
  root.TCCatchClipPlayer = { open, close };
})(window);
