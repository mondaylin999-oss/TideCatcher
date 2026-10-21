# Voices, bedroom Thiri and Persian tail

## Voice acting in the intro and ending

- Every spoken line of the intro and the morning ending now has its voice clip (`frontend/assets/audio/voice`). The words type out at the speed they are spoken, the next line starts after the voice ends, and the music dips while someone speaks.
- Clicking or pressing Space still skips ahead and stops the current clip. With sound muted (or effects at 0) the cutscenes play silently at the old pace.
- Shwe meows first, then says the words in brackets. Thiri laughs before "This time I'll draw all of you", and Shy giggles before her line.
- Intro text now says the Moodlings "walked" to the window, to match the voice and the walking Moodlings.

## Thiri in the bedroom (coming-home scene)

- Replaced the six flat sleeping poses with Thiri cut from the team's painted reference of the same room (brown hair, blue scrunchie, blue star hoodie), placed exactly where she lies in that picture.
- The poses follow her mood: tears on the first nights, tears fading, peaceful, a small smile, then eyes open on the last night. Grey versions match the grey room.

## Persian tail

- Fixed thin see-through lines down fluffy tails while they sway (most visible on the white Persian). The tail strips now overlap enough to cover the gaps between them.

# Cozy night sticker book

## Home cat rendering

- Replaced the SVG-embedded raster cat with a normal HTML image, aligned to the same pier coordinates at every viewport size. This bypasses the SVG image rendering path implicated by the mobile artifact photos.
- Removed the remaining artwork filter and an obsolete duplicate shop-refresh function. The affected device still needs confirmation.

## Two-speed mobile joystick

- Added a visible inner slow-movement ring and outer normal-speed ring, with a smaller thumb knob and active-zone feedback.
- Inner movement uses the existing sneak speed; outer movement uses the normal upgraded speed. A neutral centre stops movement.

## Mobile joystick area

- Reduced the joystick activation zone from the left 50% to the left 25% of the screen width. The visible circle cannot expand the touch target outside that zone; an active drag continues to use pointer capture.

## Compact post-night screens

- Fit the bedroom moment and results into landscape viewports with visible action buttons.
- Removed duplicate bedroom narration, repeated story details, tips, secondary statistics and the shop shortcut from results. Kept score, feelings brought home, Glow, outcome and continue/retry/menu actions.
- Used a side-by-side bedroom composition on short phones and a three-column summary on results.

## Hidden canvas rendering

- Stopped drawing the game world while its canvas is hidden behind DOM menus and while the browser tab is hidden. This removes unnecessary mobile graphics work; gameplay resumes rendering when visible.
- The latest phone photo confirms artifacts can occur on the updated home layout; the exact device-specific cause remains unconfirmed.

## Mobile home rendering follow-up

- Added content-versioned stylesheet and script URLs so refreshed pages do not reuse older asset versions.
- Simplified decorative home-screen filters and animations on touch devices to reduce compositor artifacts; retained the artwork and all controls.
- The reported photo includes the removed goals panel, so its deployment/browser cache still needs confirmation.

## Mobile rendering fixes

- Removed the browser tap highlight flashing blue over the mobile intro; keyboard focus outlines remain intact.
- Added a rounded-canvas fallback for browsers without roundRect, preventing repeated rendering exceptions.
- Avoided clearing the canvas on resize events when its pixel dimensions have not changed.

## Audio packs

- Added supplied intro, menu, bedroom and ending music to their matching scenes.
- Added location ambience for the school, park, festival, hilltop and lake, using environment-only loops beneath the level music.
- Added movement, sneaking, action, menu, completion, failure and unlock effects with existing volume/mute controls and synthesized fallbacks.
- Bundled Ogg and MP3 versions and retained the supplied audio credits.

## Screen changes

- **Profile badge spacing:** Sized the preview card and cat canvas together so the cat-name badge remains inside the card and clear of the footer note at different landscape heights.

- **One screen profile setup:** Removed the desktop height breakpoint from the compact profile editor so it also stays balanced at browser zoom and shorter landscape heights. The cat preview is capped to a short landscape card; both setup steps fit without page scrolling at desktop and mobile landscape sizes.

- **Flexible profile editor:** The name and cat setup panel now sizes to its content on large screens, with a balanced landscape preview and aligned fields instead of a stretched full-height column. Kept the compact layout on short screens and portrait phones.

- **Map road scale:** Narrowed the river channel and banks so chapter nodes remain the trail’s focus and the road reads smaller than the surrounding trees across screen sizes.

- **Map cursor scrolling:** Added mouse drag-to-scroll with click protection for chapter stops, and a visible horizontal scrollbar for cursor users. Touch swipe, wheel and arrow navigation still work.

- **Organic map layout:** Varied chapter spacing, river bend heights and curve lengths with a repeatable seed. Trees now appear in uneven clusters with varied sizes, while lanterns and landmarks have irregular placement. The trail stays stable when revisiting chapters and resizing.

- **Moonlit adventure map:** A winding river with rocky banks, stepping-stone chapter stops, glowing lanterns, pine trees, fireflies and school/park/festival/hill/lake landmarks now fills the landscape chapter map. Completed, current and locked chapters keep their existing progression and show clear status labels.

- **Landscape chapter map:** Replaced the vertical 50-level tower and stretched scenery with a left-to-right trail using the full screen width. Added swipe, mouse-wheel, keyboard and previous/current/next navigation, readable chapter cards, and compact controls for mobile landscape. Unlocks and gameplay are unchanged.

- **Title/loading:** floating Fredoka logo, existing cat sprite, pastel Moodlings, eight loading stars and honey start button.
- **Intro:** rounded speech bubble, twinkling night backdrop, pill skip button and pulsing continuation hint; original story and timing retained.
- **Setup/profile:** two presentation steps, paw-marked name fields, round cat cards, selected checkmarks and keyboard navigation. Original validation and save handler retained.
- **Hub:** Glow and collection chips, collection progress, labeled round utility buttons and separated coral Reset.
- **Destinations/map:** four pastel sticker cards in a desktop 2×2 grid and a mobile single column; rounded chapter map and guide card. Existing unlock rules retained.
- **Shop:** soft item cards, Glow prices, locked unaffordable buttons, purchase pop and reliable keyboard focus after purchases.
- **Mood Book:** silhouettes, feeling-colored tags, rare sparkle borders and striped collection progress.
- **Briefing/Ready:** night chip, sunrise time pill, padded objectives and contained decorative wave.
- **Gameplay:** translucent timer/score and combo pills, combo color/size progression, speech-bubble announcements and softer joystick. Scoring, timers, saves and Moodling rules unchanged.
- **Per-night level layouts:** Nights 1–7 load independent ground profiles, world widths, pits, roosts, checkpoints, spawn zones and hide/burial markers from `frontend/js/levels.js`. Night 1 teaches safely; later nights add static, moving, crumbling, swinging and bouncy crossings. Free Play randomly selects one of three trails per run. Moodling rules and scoring remain unchanged.
- **Pit sizing and crossings:** Pit-to-bridge ratios now scale by difficulty: Nights 2–7 progress from 3.25× to 5×, while Free Play trails use 3.25×, 4× and 5×. Every gap is too wide for Shwe to jump across unaided and has one moving bridge; level geometry and markers shift with each widened pit.
- **50-level campaign:** Added challenge Levels 8–50 with rotating place themes, a steadily increasing bridge speed, and pit counts that rise from four to eighteen. Later routes combine moving bridges with crumbling ledges, bouncy roosts and swinging lanterns; checkpoints increase in frequency on the hardest routes. The chapter map, saved unlock progression and continue/replay flow now support all 50 levels. Moodling requirements, behavior and scoring remain unchanged.
- **Park crossing cleanup:** Removed overlapping static platforms at Night 3’s second pit and widened the gap from 105 to 385 units. One moving bridge spans the gap; hiding and burial spots remain on safe ground.
- **Duplicate roost cleanup:** Removed overlapping or visually duplicated ledges across Nights 2–7 and Free Play, spaced adjacent ledges around moving bridges, and removed scenic boats/logs that duplicated playable platforms.
- **Fall hazards:** Gaps expose dark, place-themed drops with edge marks and a first-pit warning. Story nights start with three lives; falling animates a soft light poof and sad meow, dims the screen, then respawns at the last lantern checkpoint with brief invulnerability. Losing all lives opens the existing results flow as **Night failed**, with Retry and Back to map; unbanked run lights are discarded. Free Play falls cost five seconds. Gentle mode makes story falls life-free.
- **Roosts and fairness:** Static ledges, moving shelves/boats/logs, crumbling steps, swinging lanterns and bouncy awnings/mushrooms provide crossings. Moving platforms carry Shwe, crumbling ones reset after three seconds, and jumps use coyote time and buffering. The camera biases toward the landing area. Settings adds Gentle mode; existing sound hooks include fall, poof, edge, crumble, platform, checkpoint, respawn and life-lost cues.
- **Buried-feeling props:** school books/bag/box, park leaf/sand/flower mounds, festival baskets/pots/mats, hill stones/branches/leaves and lakeshore sand/driftwood/pebbles. Map-specific labels, debris and Night Eyes glow; burial interaction and scoring unchanged.
- **Results:** bold stat cards, home progress, best-score sticker, Continue and separate replay action after a story win.
- **Settings:** styled missions and controls; disabled, explicitly unconnected Music/Sound effects/Ambience/Mute controls with `data-audio` hooks. Fall and platform cues use the existing sound system.
- **Other existing screens:** pause, reset confirmation, wake-up, final awakening and orientation prompt share the theme. Quitting a paused run now asks for confirmation; Reset retains its existing confirmation dialog.

## Shared implementation

`frontend/css/theme.css` centralizes palette, font stacks, radii and shadows, including original CSS art details. `cozy.css` supplies the presentation layer; `cozy-ui.js` handles presentation steps, progress and dynamic `data-sfx` hooks. Existing IDs/classes and illustrated assets are retained. Google Fonts: Fredoka, Nunito and Padauk fallback. Reduced-motion disables decorative animation. Keyboard focus uses honey outlines; interactive targets are at least 44px.

## Validation

- Edge/Playwright screenshots and overflow checks for 19 screen/state views at **375×900** and **1280×900**, including both setup steps and win/loss results. No horizontal overflow or JavaScript errors in the final pass.
- Additional **360px** hub check; touch portrait orientation prompt and **812×375** landscape transition checked. The existing touch-device landscape requirement remains intact; narrow menu layout checks use a non-touch browser viewport.
- Verified movement, pause/resume timer behavior, purchase spending/feedback, profile validation and persistence, keyboard setup, reset cancellation, quit confirmation and reduced-motion styles. Late-game presentation states used isolated browser fixtures without adding test hooks to shipped code.
- Burial visual changes: static placement checks passed for all six map configs; the headless regression renders Nights 1–7 and Free Play, checks per-map labels/counts, and confirms Free Play retains its original stone scene.
- **Layout validation:** `node tests/level-layouts.test.js` checks all 50 story levels plus three Free Play variants for pit clearance, roost reachability under night jump settings, spawn/checkpoint/spot safety and platform path bounds. Development overlay: `?debug=1` on localhost, then `F2`. Layout sketches: `docs/levels.md`.
- Contrast: cream/card **14.21:1**; muted/raised card **8.0:1**; dark text on honey/lilac/coral buttons exceeds **6:1**.
- JavaScript syntax, `git diff --check` and the 10-layout reachability regression pass. Local browser smoke checks reached Night 3, Night 7 and Free Play; forced falls consumed three lives, showed **Night failed**, preserved banked Mood Book progress, and exposed Retry and Back to map. Full traversal of every route was not performed.

## New-player guidance

- **Why to play:** First launches now progress from the existing intro into three swipeable Welcome cards before setup. The cards explain Thiri and the Night Side, the before-sunrise goal, Glow and upgrades, the 17-feeling Mood Book, seven nights, and the sunrise ending. A compact, linked **Your goals** card on the hub points to the next chapter, Mood Book progress, and the next available upgrade.
- **Guided Night 1:** The real Night 1 pauses its countdown while each accessible coach step waits for movement, jumping, sneaking, a harmless practice catch, a Frustrated dodge and dizzy pounce, Night Eyes, scratching, and completing the required lights. Each step has an on-canvas target marker, device-specific keyboard/touch control art, a success sparkle/chime, and an always-visible Skip tutorial control.
- **Later help:** New-mechanic, Free Play, combo, and gentle struggle hints use one-time four-second coach bubbles and the existing chapter hint state; a per-run struggle hint appears after three hits from one Moodling or 30 seconds without a catch. The Info button and pause menu both open a full How to play guide with keyboard/touch controls, known and unknown Moodlings, upgrades, and combos.
- **Preferences and saves:** `mk-profile`/`mk-onboarding` now safely retain `welcomeSeen`, `tutorialDone`, `tipsSeen`, Show tips, and the English/Burmese-ready copy choice. Reset still removes every `mk-` key. Settings includes Show tips, an English/Burmese-ready tip language selector, and Replay tutorial. All editable Welcome, tutorial, just-in-time, struggle, and sky-tip copy lives in `frontend/js/tips.js`.

## Cloudflare deployment

- Added explicit Wrangler static-assets configuration for frontend/, preventing Git history and repository-only files from being uploaded. The failed build included a 65 MiB Git pack, exceeding Cloudflare's 25 MiB asset limit.
- Preserved legacy frontend and TideCatcher.html entry URLs with redirects.
