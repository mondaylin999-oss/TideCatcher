/* Visual enhancements only. No save, gameplay, input bindings, or audio state. */
(() => {
  const $ = id => document.getElementById(id);
  function soundHooks(root = document) {
    const controls = [...root.querySelectorAll('button,input,summary')];
    if (root.matches?.('button,input,summary')) controls.push(root);
    controls.forEach(el => {
      if (!el.dataset.sfx || el.dataset.uiSfx === 'true') { el.dataset.uiSfx = 'true'; el.dataset.sfx = el.matches(':disabled') ? 'error' : el.matches('.buy') ? 'buy' : /back|cancel|close|menu/i.test(el.id) ? 'back' : el.matches('input,summary') ? 'toggle' : 'click'; }
      if (el.matches('.hub-side-btn')) { el.setAttribute('aria-label', el.textContent.trim()); el.title = el.textContent.trim(); }
    });
  }
  function progress(source, label) {
    const bar = document.createElement('div'); bar.className = 'cozy-progress';
    bar.setAttribute('role', 'progressbar'); bar.setAttribute('aria-label', label);
    const fill = document.createElement('i'); bar.append(fill); source.after(bar);
    function sync() {
      const nums = source.textContent.match(/[\d,]+/g) || [];
      const value = Number((nums[0] || '0').replaceAll(',', '')), max = Number(nums[1]);
      bar.hidden = !max;
      if (!max) return;
      bar.setAttribute('aria-valuemin', '0'); bar.setAttribute('aria-valuemax', max);
      bar.setAttribute('aria-valuenow', value); fill.style.width = `${Math.min(100, value / max * 100)}%`;
    }
    new MutationObserver(sync).observe(source, { childList:true, characterData:true, subtree:true }); sync();
  }
  let activeLeavePromise = null;
  const replayedPauseActions = new WeakSet();
  function confirmLeave(options = {}) {
    if (activeLeavePromise) return activeLeavePromise;
    const screen = $('leaveNightScreen'), pauseScreen = $('pauseScreen');
    const stay = $('leaveNightStay'), confirm = $('leaveNightConfirm');
    const opener = document.activeElement, wasInert = pauseScreen.inert;
    const settings = Object.assign({
      title: 'Leave this night?',
      text: "Shwe hasn't brought these lights home yet. If you leave now, this run's rewards will be lost.",
      confirmLabel: 'Leave night'
    }, options);
    $('leaveNightTitle').textContent = settings.title;
    $('leaveNightText').textContent = settings.text;
    confirm.textContent = settings.confirmLabel;
    let resolvePromise;
    const promise = new Promise(resolve => { resolvePromise = resolve; });
    activeLeavePromise = promise;
    const focusable = () => Array.from(screen.querySelectorAll('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'))
      .filter(el => !el.hidden && el.offsetParent !== null);
    const finish = result => {
      if (activeLeavePromise !== promise) return;
      screen.removeEventListener('click', onBackground);
      screen.removeEventListener('keydown', onKeydown);
      stay.removeEventListener('click', onStay);
      confirm.removeEventListener('click', onConfirm);
      screen.hidden = true;
      pauseScreen.inert = wasInert;
      activeLeavePromise = null;
      if (opener && opener.isConnected && typeof opener.focus === 'function') opener.focus({ preventScroll: true });
      resolvePromise(result);
    };
    const onStay = () => finish(false);
    const onConfirm = () => finish(true);
    const onBackground = event => { if (event.target === screen) finish(false); };
    const onKeydown = event => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); finish(false); return; }
      if (event.key !== 'Tab') return;
      const items = focusable();
      if (!items.length) { event.preventDefault(); screen.focus(); return; }
      const first = items[0], last = items[items.length - 1];
      if (event.shiftKey && (document.activeElement === first || !screen.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !screen.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
    };
    stay.addEventListener('click', onStay);
    confirm.addEventListener('click', onConfirm);
    screen.addEventListener('click', onBackground);
    screen.addEventListener('keydown', onKeydown);
    pauseScreen.inert = true;
    screen.hidden = false;
    stay.focus({ preventScroll: true });
    return promise;
  }
  window.confirmLeave = confirmLeave;
  function confirmPauseAction(id, options) {
    const button = $(id);
    button.addEventListener('click', event => {
      if (replayedPauseActions.has(button)) { replayedPauseActions.delete(button); return; }
      event.preventDefault(); event.stopImmediatePropagation();
      const settings = typeof options === 'function' ? options() : options;
      confirmLeave(settings).then(confirmed => {
        if (!confirmed) return;
        replayedPauseActions.add(button);
        button.click();
      });
    }, true);
  }
  const lostRunText = "Shwe hasn't brought these lights home yet. If you leave now, this run's rewards will be lost.";
  confirmPauseAction('pauseQuitBtn', { title: 'Leave this night?', text: lostRunText, confirmLabel: 'Leave night' });
  confirmPauseAction('pauseRestartBtn', { title: 'Restart this night?', text: "Shwe hasn't brought these lights home yet. If you restart now, this run's rewards will be lost.", confirmLabel: 'Restart night' });
  confirmPauseAction('pauseChaptersBtn', () => {
    const toChapters = $('pauseChaptersBtn').textContent.toLowerCase().includes('chapters');
    return { title: toChapters ? 'Back to chapters?' : 'Back to menu?', text: lostRunText, confirmLabel: toChapters ? 'Back to chapters' : 'Back to menu' };
  });
  // Two presentation steps; the original submit handler still validates and saves.
  let setupStep = 1;
  function showSetupStep(step, focus = true) {
    setupStep = step;
    $('girlNameInput').closest('.field').hidden = step !== 1;
    $('catNameInput').closest('.field').hidden = step !== 2;
    document.querySelector('.coat-pick').hidden = step !== 2;
    $('setupNext').hidden = step !== 1;
    $('setupPrevious').hidden = step !== 2;
    $('setupGo').hidden = step !== 2;
    $('setupTitle').textContent = step === 1 ? 'Who are you?' : 'Who\u2019s your cat?';
    if (focus) (step === 1 ? $('girlNameInput') : $('catNameInput')).focus({preventScroll:true});
  }
  $('setupNext').addEventListener('click', () => showSetupStep(2));
  $('setupPrevious').addEventListener('click', () => showSetupStep(1));
  $('setupForm').addEventListener('submit', event => {
    if (setupStep === 1) { event.preventDefault(); event.stopImmediatePropagation(); showSetupStep(2); }
  }, true);
  new MutationObserver(() => {
    if (!$('setupScreen').hidden) showSetupStep(1);
  }).observe($('setupScreen'), {attributes:true,attributeFilter:['hidden']});
  showSetupStep(1, false);
  soundHooks();
  new MutationObserver(records => records.forEach(record => {
    if (record.type === 'attributes') soundHooks(record.target);
    record.addedNodes.forEach(node => { if (node.nodeType === Node.ELEMENT_NODE) soundHooks(node); });
  })).observe(document.body, { childList:true, subtree:true, attributes:true, attributeFilter:['disabled'] });
  progress($('hubBookValue'), 'Mood Book collected'); progress($('bookCount'), 'Mood Book collected'); progress($('sHome'), 'Feelings brought home');
  function stars() {
    const count = Number($('welcomeProgressBar').getAttribute('aria-valuenow'));
    [...$('loadingStars').children].forEach((star, i) => star.classList.toggle('filled', i < count));
  }
  new MutationObserver(stars).observe($('welcomeProgressBar'), { attributes:true, attributeFilter:['aria-valuenow'] }); stars();
})();
