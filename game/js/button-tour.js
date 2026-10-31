/* Button guide: a short on-screen tour that rings one button at a time and says what it does.
   Plays once on the home screen and once in the pause menu, and can be replayed from Settings or Pause.
   Text is English. */
(function () {
  'use strict';
  const EN = {
    next: 'Next', back: 'Back', done: 'Got it', skip: 'Skip guide', of: '{n} of {total}',
    hub: [
      ['storyBtn', 'Story Mode', 'Play the seven levels in order. This is where the story happens.'],
      ['freeBtn', 'Free Play', 'Wander any place you have opened, with no clock. Good for practice.'],
      ['bookBtn', 'Mood Book', 'Every Moodling you have caught, with its catch tips.'],
      ['shopBtn', 'Treat box (shop)', 'Spend Glow on upgrades, comfort items, trails and new cats. Sell trinkets here too.'],
      ['roomShelfBtn', 'Shelf', 'Keepsakes you found in each level. Finish a set to claim bonus Glow.'],
      ['roomHeartBtn', 'Heart Workshop', 'Mix feelings you caught into new ones.'],
      ['roomTownBtn', 'Lantern Town', 'Use the feelings you made to light up places in town and earn rewards.'],
      ['roomBedBtn', 'Names and cat', 'Change the girl’s name, your cat’s name or your cat.'],
      ['roomTasksBtn', 'Today’s tasks', 'Three daily tasks. Finish one in any level, then claim its Glow here.'],
      ['hubHeroCat', 'Your cat', 'Tap your cat on the window sill to change its name.'],
      ['roomHelpBtn', 'How to play', 'Controls, plus a short clip for catching every Moodling.'],
      ['profileBtn', 'Profile', 'Your names and your chosen cat.'],
      ['settingsBtn', 'Settings', 'Sound, controls, tips, language and this button guide.'],
      ['infoBtn', 'Info', 'About the game and the team.'],
      ['resetBtn', 'Reset', 'Start over from the beginning. Your progress is erased, so it asks first.']
    ],
    pause: [
      ['pauseContinueBtn', 'Resume', 'Back to the level, right where you stopped.'],
      ['pauseRestartBtn', 'Restart', 'Start this level again from the beginning.'],
      ['pauseChaptersBtn', 'Back to chapters', 'Leave this level and pick another one on the map.'],
      ['pauseHelpBtn', 'How to play', 'Controls and catch clips, without leaving the level.'],
      ['pauseNotesBtn', 'Notes', 'Turn the little hint notes over Moodlings on or off.'],
      ['pauseQuitBtn', 'Quit to menu', 'Go back home. Lights you carried this level are lost.'],
      ['pauseTourBtn', 'Button guide', 'Show this guide again any time.']
    ]
  };
  const copy = () => EN;
  const seenKey = name => 'tc-tour-' + name;
  const seen = name => { try { return localStorage.getItem(seenKey(name)) === '1'; } catch (e) { return false; } };
  const markSeen = name => { try { localStorage.setItem(seenKey(name), '1'); } catch (e) {} };
  const visible = el => { if (!el || el.closest('[hidden]')) return false; const r = el.getBoundingClientRect(); return r.width > 2 && r.height > 2 && r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth; };

  let ui = null, steps = [], at = 0, current = null, lastFocus = null;
  function build() {
    if (ui) return ui;
    const root = document.createElement('div'); root.className = 'tc-tour'; root.hidden = true; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-labelledby', 'tcTourTitle');
    root.innerHTML = '<div class="tc-tour-ring" aria-hidden="true"></div><div class="tc-tour-card"><p class="tc-tour-count" id="tcTourCount"></p><h3 id="tcTourTitle"></h3><p id="tcTourText"></p>' +
      '<div class="tc-tour-actions"><button type="button" class="tc-tour-skip" id="tcTourSkip"></button><span class="tc-tour-gap"></span><button type="button" class="tc-tour-back" id="tcTourBack"></button><button type="button" class="tc-tour-next" id="tcTourNext"></button></div></div>';
    document.body.appendChild(root);
    root.querySelector('#tcTourNext').addEventListener('click', () => go(1));
    root.querySelector('#tcTourBack').addEventListener('click', () => go(-1));
    root.querySelector('#tcTourSkip').addEventListener('click', end);
    root.addEventListener('click', e => { if (e.target === root) go(1); });
    root.addEventListener('keydown', e => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); end(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); go(1); } else if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
      e.stopPropagation();
    });
    addEventListener('resize', () => { if (!root.hidden) place(); });
    return (ui = root);
  }
  function place() {
    const s = steps[at]; if (!s) return;
    const el = document.getElementById(s[0]); const ring = ui.querySelector('.tc-tour-ring'), card = ui.querySelector('.tc-tour-card');
    const r = el.getBoundingClientRect(), pad = 8;
    Object.assign(ring.style, { left: (r.left - pad) + 'px', top: (r.top - pad) + 'px', width: (r.width + pad * 2) + 'px', height: (r.height + pad * 2) + 'px' });
    const cw = Math.min(320, innerWidth - 24); card.style.width = cw + 'px';
    const ch = card.offsetHeight || 150, below = r.bottom + 14 + ch < innerHeight - 8;
    let top = below ? r.bottom + 14 : r.top - 14 - ch; top = Math.max(8, Math.min(innerHeight - ch - 8, top));
    // if the card would cover the button, put it beside the button instead
    let left = Math.max(12, Math.min(innerWidth - cw - 12, r.left + r.width / 2 - cw / 2));
    if (top < r.bottom && top + ch > r.top) { left = r.right + 14 + cw < innerWidth ? r.right + 14 : Math.max(12, r.left - 14 - cw); top = Math.max(8, Math.min(innerHeight - ch - 8, r.top + r.height / 2 - ch / 2)); }
    card.style.left = left + 'px'; card.style.top = top + 'px';
  }
  function show() {
    const c = copy(), s = steps[at];
    ui.querySelector('#tcTourCount').textContent = c.of.replace('{n}', at + 1).replace('{total}', steps.length);
    ui.querySelector('#tcTourTitle').textContent = s[1]; ui.querySelector('#tcTourText').textContent = s[2];
    ui.querySelector('#tcTourBack').textContent = c.back; ui.querySelector('#tcTourBack').hidden = at === 0;
    ui.querySelector('#tcTourNext').textContent = at === steps.length - 1 ? c.done : c.next;
    ui.querySelector('#tcTourSkip').textContent = c.skip;
    place(); ui.querySelector('#tcTourNext').focus({ preventScroll: true });
  }
  function go(d) { at += d; if (at < 0) at = 0; if (at >= steps.length) return end(); show(); }
  function end() { if (!ui || ui.hidden) return; ui.hidden = true; if (current) markSeen(current); current = null; if (lastFocus && lastFocus.isConnected) lastFocus.focus({ preventScroll: true }); }
  function start(name) {
    build();
    steps = (copy()[name] || []).filter(s => visible(document.getElementById(s[0])));
    if (!steps.length) return false;
    current = name; at = 0; lastFocus = document.activeElement; ui.hidden = false; show(); return true;
  }
  window.TCTour = { start, seen, reset: name => { try { localStorage.removeItem(seenKey(name)); } catch (e) {} } };

  // ---- automatic first-time tours ----
  function watch(id, name, extraCheck) {
    const el = document.getElementById(id); if (!el) return;
    const tryStart = () => {
      if (seen(name) || el.hidden || (extraCheck && !extraCheck())) return;
      setTimeout(() => { if (!el.hidden && !seen(name) && (!ui || ui.hidden) && (!extraCheck || extraCheck())) start(name); }, 700);
    };
    new MutationObserver(tryStart).observe(el, { attributes: true, attributeFilter: ['hidden'] });
    tryStart();
  }
  function noOtherDialog() { return ![...document.querySelectorAll('.overlay')].some(o => !o.hidden && o.id !== 'startScreen' && o.id !== 'pauseScreen') && !(document.getElementById('titleScreen') && !document.getElementById('titleScreen').hidden); }
  function boot() {
    // "Button guide" replay buttons: one in the pause menu, one in home Settings
    const pauseActions = document.querySelector('#pauseScreen .pause-actions');
    if (pauseActions && !document.getElementById('pauseTourBtn')) {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'btn ghost'; b.id = 'pauseTourBtn'; b.textContent = 'Button guide';
      b.addEventListener('click', () => start('pause')); pauseActions.appendChild(b);
    }
    const settingsPanel = document.querySelector('#hubSettingsScreen .panel, #hubSettingsScreen section');
    if (settingsPanel && !document.getElementById('settingsTourBtn')) {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'btn ghost'; b.id = 'settingsTourBtn'; b.textContent = 'Show the button guide again';
      b.addEventListener('click', () => { const s = document.getElementById('hubSettingsScreen'); if (s) s.hidden = true; const hub = document.getElementById('startScreen'); if (hub) hub.hidden = false; setTimeout(() => start('hub'), 250); });
      settingsPanel.appendChild(b);
    }
    const hubReady = () => { const s = document.getElementById('startScreen'), h = document.getElementById('menuHub'); return s && !s.hidden && h && !h.hidden && noOtherDialog(); };
    const tryHub = () => { if (seen('hub') || !hubReady()) return; setTimeout(() => { if (!seen('hub') && hubReady() && (!ui || ui.hidden)) start('hub'); }, 900); };
    ['startScreen', 'menuHub', 'titleScreen'].forEach(id => { const el = document.getElementById(id); if (el) new MutationObserver(tryHub).observe(el, { attributes: true, attributeFilter: ['hidden'] }); });
    document.querySelectorAll('.overlay').forEach(o => new MutationObserver(tryHub).observe(o, { attributes: true, attributeFilter: ['hidden'] }));
    tryHub();
    watch('pauseScreen', 'pause');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
