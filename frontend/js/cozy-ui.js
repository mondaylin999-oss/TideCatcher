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
  $('pauseQuitBtn').addEventListener('click', event => {
    if (!window.confirm('Leave this night? Unbanked run rewards will be lost.')) {
      event.preventDefault(); event.stopImmediatePropagation();
    }
  }, true);
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
