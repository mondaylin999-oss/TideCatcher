# Cozy night sticker book

## Screen changes

- **Title/loading:** floating Fredoka logo, existing cat sprite, pastel Moodlings, eight loading stars and honey start button.
- **Intro:** rounded speech bubble, twinkling night backdrop, pill skip button and pulsing continuation hint; original story and timing retained.
- **Setup/profile:** two presentation steps, paw-marked name fields, round cat cards, selected checkmarks and keyboard navigation. Original validation and save handler retained.
- **Hub:** Glow and collection chips, collection progress, labeled round utility buttons and separated coral Reset.
- **Destinations/map:** four pastel sticker cards in a desktop 2×2 grid and a mobile single column; rounded chapter map and guide card. Existing unlock rules retained.
- **Shop:** soft item cards, Glow prices, locked unaffordable buttons, purchase pop and reliable keyboard focus after purchases.
- **Mood Book:** silhouettes, feeling-colored tags, rare sparkle borders and striped collection progress.
- **Briefing/Ready:** night chip, sunrise time pill, padded objectives and contained decorative wave.
- **Gameplay:** translucent timer/score and combo pills, combo color/size progression, speech-bubble announcements and softer joystick. Movement, hitboxes, scoring, timers, keyboard/touch bindings and saves unchanged.
- **Per-night level layouts:** Nights 1–7 now load independent ground profiles, world widths, platform sets, safe lower-floor gaps, spawn zones and hide/burial markers from `frontend/js/levels.js`. School, park, festival, hilltop and lake props follow their authored places; moving shelves/logs/boat, bouncy and crumbling platforms are supported. Free Play randomly selects one of three trails per run. Moodling rules, controls, scoring, saves and existing place art remain unchanged.
- **Buried-feeling props:** school books/bag/box, park leaf/sand/flower mounds, festival baskets/pots/mats, hill stones/branches/leaves and lakeshore sand/driftwood/pebbles. Map-specific labels, debris and Night Eyes glow; burial interaction and scoring unchanged.
- **Results:** bold stat cards, home progress, best-score sticker, Continue and separate replay action after a story win.
- **Settings:** styled missions and controls; disabled, explicitly unconnected Music/Sound effects/Ambience/Mute placeholders with `data-audio` hooks. No audio added.
- **Other existing screens:** pause, reset confirmation, wake-up, final awakening and orientation prompt share the theme. Quitting a paused run now asks for confirmation; Reset retains its existing confirmation dialog.

## Shared implementation

`frontend/css/theme.css` centralizes palette, font stacks, radii and shadows, including original CSS art details. `cozy.css` supplies the presentation layer; `cozy-ui.js` handles presentation steps, progress and dynamic `data-sfx` hooks. Existing IDs/classes and illustrated assets are retained. Google Fonts: Fredoka, Nunito and Padauk fallback. Reduced-motion disables decorative animation. Keyboard focus uses honey outlines; interactive targets are at least 44px.

## Validation

- Edge/Playwright screenshots and overflow checks for 19 screen/state views at **375×900** and **1280×900**, including both setup steps and win/loss results. No horizontal overflow or JavaScript errors in the final pass.
- Additional **360px** hub check; touch portrait orientation prompt and **812×375** landscape transition checked. The existing touch-device landscape requirement remains intact; narrow menu layout checks use a non-touch browser viewport.
- Verified movement, pause/resume timer behavior, purchase spending/feedback, profile validation and persistence, keyboard setup, reset cancellation, quit confirmation and reduced-motion styles. Late-game presentation states used isolated browser fixtures without adding test hooks to shipped code.
- Burial visual changes: static placement checks passed for all six map configs; the headless regression renders Nights 1–7 and Free Play, checks per-map labels/counts, and confirms Free Play retains its original stone scene.
- **Layout validation:** `node tests/level-layouts.test.js` checks all seven nights plus three Free Play variants for safe pits, spawn zones, spot/prop/platform clearance, platform path bounds and jump-rise reachability. Development overlay: `?debug=1` on localhost, then `F2`. Layout sketches: `docs/levels.md`.
- Contrast: cream/card **14.21:1**; muted/raised card **8.0:1**; dark text on honey/lilac/coral buttons exceeds **6:1**.
- JavaScript syntax, `git diff --check` and the 10-layout reachability regression pass. A local browser smoke test reached the Free Play canvas with no console errors; a full seven-night playthrough was not performed.

## New-player guidance

- **Why to play:** First launches now progress from the existing intro into three swipeable Welcome cards before setup. The cards explain Thiri and the Night Side, the before-sunrise goal, Glow and upgrades, the 17-feeling Mood Book, seven nights, and the sunrise ending. A compact, linked **Your goals** card on the hub points to the next chapter, Mood Book progress, and the next available upgrade.
- **Guided Night 1:** The real Night 1 pauses its countdown while each accessible coach step waits for movement, jumping, sneaking, a harmless practice catch, a Frustrated dodge and dizzy pounce, Night Eyes, scratching, and completing the required lights. Each step has an on-canvas target marker, device-specific keyboard/touch control art, a success sparkle/chime, and an always-visible Skip tutorial control.
- **Later help:** New-mechanic, Free Play, combo, and gentle struggle hints use one-time four-second coach bubbles and the existing chapter hint state; a per-run struggle hint appears after three hits from one Moodling or 30 seconds without a catch. The Info button and pause menu both open a full How to play guide with keyboard/touch controls, known and unknown Moodlings, upgrades, and combos.
- **Preferences and saves:** `mk-profile`/`mk-onboarding` now safely retain `welcomeSeen`, `tutorialDone`, `tipsSeen`, Show tips, and the English/Burmese-ready copy choice. Reset still removes every `mk-` key. Settings includes Show tips, an English/Burmese-ready tip language selector, and Replay tutorial. All editable Welcome, tutorial, just-in-time, struggle, and sky-tip copy lives in `frontend/js/tips.js`.
