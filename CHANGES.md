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
- Contrast: cream/card **14.21:1**; muted/raised card **8.0:1**; dark text on honey/lilac/coral buttons exceeds **6:1**.
- JavaScript syntax and `git diff --check` pass. No full seven-night playthrough was performed.
