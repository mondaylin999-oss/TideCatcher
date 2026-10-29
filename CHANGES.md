# Hidden paper stars and bonus diary pages

- Added three fixed paper-star collectibles to every story night. They sit on raised ledges or require a timed jump; stars placed on moving ledges travel with them.
- Paper-star progress saves independently per night in `mk-paper-stars`, without changing score stars, Glow, Moodling catches, or existing save keys.
- Night-map entries and the night briefing/endless selection cards show the `0–3` paper-star count. Finding all three unlocks a bonus diary page on Thiri’s shelf.
- Added a placement check for all 50 nights and included it in the game-integrity workflow.

## Swaying lights and a brief recovery window

- Caught lights now sway gently along Shwe’s tail-tied trail as she moves.
- When Shwe is hit and loses a carried light, it floats nearby with a visible three-second countdown. Pounce on it before it fades to return it to the trail without earning duplicate score or Glow.
- If the light fades, its Moodling returns at the drop point, preserving the existing catch and progress rules. Ambushes retain their existing number of lost lights.

## Sunrise countdown

- Outdoor story skies now warm and brighten gradually as each night’s timer runs down; school interiors retain their indoor look.
- During the final 20 seconds, a soft sunrise glow and partial sun rise at the screen edge. The movement is held still when reduced motion is enabled.
- The current music eases up to 1.16× speed in the final 20 seconds, then returns smoothly to normal when time is added, play is paused, or the run ends.
- Night 7’s lakeside dawn now follows the same countdown across the night. Scoring, catch rules, and saves are unchanged.

## Nightly weather

- Each run rolls one steady weather condition: light rain, a gentle wind, or moon fog. Its icon and localized name appear in the HUD, with an accessible canvas label.
- Rain makes Shwe slide more on the ground and brings Lonely back sooner, with an extra early Lonely where the night calls for one. Wind shifts jump height slightly in either direction. Fog extends Night Eyes' reveal radius by 35%.
- Outdoor rain uses a soft falling-rain effect; school interiors keep their established indoor scenery. Weather tips are localized in English and Burmese and appear once per weather type using the existing saved tip history.
- Catch, scoring, and existing save data formats are unchanged. Reduced-motion mode keeps rain still.

# Gameplay catch clips and a trail that follows Shwe

- The catch guide in How to play now shows a short real gameplay clip of Shwe catching each Moodling (recorded from the game itself in Free Play), with the three translated steps and their keyboard/touch controls beside it. Rare variants share their family's clip; Calm and Breathing Calm have their own.
- Clips live in `game/assets/clips` as WebM (VP9) with an MP4 fallback and a poster frame (about 2.5 MB for all ten). They load only when a guide is opened, loop silently, pause when the tab is hidden, and start paused with a play button when reduced motion is on.
- Clips are recorded at double resolution and 60 fps and encoded at 1280×720, so they stay sharp on high-DPI screens (about 0.3–1.3 MB per clip). Clip URLs carry a version tag so browsers fetch new recordings.
- `catch-clips.js` keeps the same `open`/`close` API and the three-step storyboard, so the integrity test and the How to play buttons are unchanged.
- The light trail is now tied at the base of Shwe's tail and trails behind her: a jump makes it sweep up in a soft curve instead of a vertical column, and on landing the lights settle on the ground (or her platform or wall top) instead of floating.

# Picture-based Moodling catch guides

- Replaced the timed catch-clip animation with three illustrated, step-by-step cards for each Moodling, including rare variants.
- Cards use the live game cat rig and Moodling portraits, plus movement arrows, action cues, catch effects, translated captions and keyboard/touch control badges.
- Desktop shows all three pictures together. Phones show one swipeable picture with previous/next buttons and step dots; arrow keys navigate on every screen. Start again returns to step one.
- Removed the redundant progress strip and numeric step counter to keep attention on the picture cards.
- Removed the extra Start again footer button for a cleaner guide panel.
- Timing-sensitive artwork uses a subtle one-second loop and becomes fully still with reduced motion enabled. Captions, close behavior, Escape and focus trapping remain accessible.
- The integrity check verifies all Moodling types, both caption languages and three-picture coverage. Game scoring and catch rules are unchanged.

# Wall jumps and ledge grabs

- Added wall-jump routes on Nights 12, 23, 34, 45 and 50, with the walls becoming taller as the challenge advances. Their themed stone surfaces are separate collision scenery, so non-pit nights still have no roost platforms.
- Shwe can spring away from a wall with Jump, catch the edge of a wall or static shelf, and automatically climb onto it after 0.2 seconds. Moving, crumbling, bouncy and swinging platforms keep their existing behavior.
- Added a first-use wall-jump tip in English and Burmese. It uses the existing tips-seen save, sound cues and reduced-motion-compatible game rendering; no save format, scoring or Moodling rules changed.
- Added layout checks for route placement, reachability, selected nights and separation from pits/roosts; the existing integrity test also checks the mechanic and translations.

# Voices, bedroom Thiri and Persian tail

## Moving roosts only on pit nights

- Story pits and their moving roost bridges now appear every fifth level only. Other story levels use continuous ground and have no roost platforms.
- Each pit is at least five bridge-widths and wider than Shwe's unaided jump; each pit has exactly one moving bridge and no overlapping duplicate roosts.
- Free Play pit routes use the same five-to-one bridge width. Updated the level-layout regression test and map notes to enforce the schedule.

## Quiet Rooftops

- The eight "Quiet Rooftops" challenge nights now use a rooftop map instead of hill scenery. Distant houses, chimneys, laundry lines and tiled roofs form a readable moonlit route.
- Warm roof cushions sit on solid sections, including the existing checkpoint positions. Dormer nooks mark hiding locations and the existing platform geometry is drawn as roof ledges.
- Added rooftop-themed buried finds and map labels. Scoring, Moodling behavior and level geometry are unchanged.
- Browser checked all eight rooftop nights, a rooftop briefing and compact mobile landscape; script checks and the level-data comparison passed.

## Outdoor passages at school

- School routes now open outdoors once every three background sections, starting after the first hallway. The scene rotates among a moonlit courtyard, a covered walkway and a quiet garden across school visits.
- The outdoor sections have matching passage piers, distant school windows, restrained moonlight and stone paving. Existing level geometry, platforms and collectibles remain in place.
- Outdoor backgrounds are cached with the hallway tiles; their scenery has no fake roosts or gameplay collisions.
- Browser checked all eleven school levels, scene transitions and all three outdoor styles. Level data stayed unchanged.

## Cleaner school hallway variations

- Replaced the repeated illustrated school wall with five architectural backgrounds: classroom wing, window gallery, art corridor, library passage and courtyard arcade. Consecutive school visits rotate through the styles, with alternating bay arrangements along longer routes.
- Added recessed windows, door frames, quiet notice/art displays, glazed library shelves and fixed wall lights. Removed the old decorative string-light layer; lower walls stay clear around playable roosts.
- Kept platform geometry and interaction objects in their existing rendering layers. School visual chapters now apply lighting/dust without drawing outdoor landmark silhouettes inside corridors. Briefings identify the hallway style.
- Background tiles are drawn once and cached, with a four-tile cache limit to control mobile memory usage.
- Browser checks covered all eleven school levels, all five styles, scrolling across tile joins, the hallway name in a briefing and a compact landscape view. Level data remained unchanged; desktop artwork was visually inspected.

## Ten visual chapters across fifty levels

- Added one visual identity for each consecutive group of five levels: Lamplit Beginnings (1–5), Misty Gardens (6–10), River Lanterns (11–15), Amber Autumn (16–20), Silver Rain (21–25), Bamboo Shadows (26–30), Indigo Ruins (31–35), Winter Starlight (36–40), Cloud Terraces (41–45) and Dawn Blossoms (46–50).
- Each chapter adds its own light palette, distant scenery and atmospheric details, including garden trees, festival gates, autumn branches, rain shelters, bamboo, old arches, frosted pines, terraces and blossoms. Indoor school scenery stays sparse and uses colored light/dust instead of indoor weather.
- Map nodes and captions identify each visual chapter; level briefings describe its atmosphere. Existing story locations, collision geometry, difficulty, collectibles and Free Play remain intact.
- Effects use lightweight canvas shapes without image filters; reduced-motion mode freezes decorative movement.
- Browser checks rendered all fifty levels, verified chapter boundaries and unchanged level data, checked a chapter briefing and inspected desktop/compact-landscape views.

## Learn with Shwe

- Replaced the nine-step first-night sequence with four short playable lessons: walk, jump and land, sneak, and pounce on a harmless practice Moodling. Shwe appears beside localized dialogue and a step counter, with keyboard or touch control hints.
- Movement and sneaking require actual ground travel; jumping requires a completed landing. Fixed the practice target's catch path so a successful pounce advances the tutorial.
- Normal Moodlings and hazards wait while the night timer is paused. Practice catches grant no score, Glow, Mood Book entries or Workshop lights. Finishing or skipping returns Shwe to the start of the normal first night.
- Settings → Replay tutorial now launches practice immediately. Completion is saved using the existing tutorial preference.
- Checked all four lessons using real keyboard input in a browser, including catch completion, timer/reward isolation and skipping. Inspected desktop and compact landscape layouts.

## Quieter school scenery

- Removed the extra rainbow bunting, dangling paper stars, floating decorative sparkles and chair stacks from school maps. Kept two sparse strings of steady warm lights instead of four dense animated strings.
- Kept school platforms, pits, checkpoints, hiding spots, collectibles and Moodlings in place so the playable route remains intact. Applies to every school-themed night.

## Heart Workshop and Lantern Town

- Refined the artwork with layered hills, moon haze, shaded masonry, roof tiles, framed windows, building shadows, a leafy tree, bridge railings and water reflections. The Workshop now has ceramic mixing bowls and subtle wood-like surfaces. These are lightweight SVG/CSS details; recipes, rewards and progression are unchanged.

- Added two home destinations with landscape layouts, touch scrolling, keyboard navigation and reduced-motion support.
- Heart Workshop has 50 handmade feelings: nine catchable basics, 18 first mixes, 15 second mixes, seven deep feelings and Whole Heart. Tap ingredients or drag them into bowls; valid recipes consume one of each light and save their result. Unknown pairs cost nothing. Discovered recipes remain visible even after spending their lights. Hints cost 20 Glow.
- Added a separate saved light inventory. New catches (including Golden and extra catches, excluding tutorial/ambush-only catches) bank after successful story nights or completed Free Play runs. Abandoned and failed story nights do not bank lights. Existing Mood Book records are preserved; historical catches are not retroactively converted into spendable stock. Scoring and Moodling behavior are unchanged.
- Lantern Town has ten illustrated places with ingredient requirements, memories, warm windows, 30 Glow per place and existing trail/comfort-item rewards. Spending lights never removes discoveries. Place rewards are tracked once per save.
- Discover all seven deep feelings, then combine Happiness and Love for Whole Heart. Lighting all ten places and discovering Whole Heart unlocks a replayable sky-lantern ending with Thiri drawing her town and a permanent cosmetic golden collar for Shwe. The existing chapter ending remains available.
- Progress uses the existing browser save/reset model. No external service or AI generation is required. Recipe and place transactions refuse consumption when browser storage cannot save.

## Startup loading screen

- Added a moonlit startup screen with an animated cat paw trail while the page and fonts finish loading. The home screen stays hidden until startup is ready, avoiding a flash of the home page before the app initializes.

## Language picker

- Replaced the tip-language dropdown in Settings with a compact flag-based dialog matching the supplied reference, including clear selection feedback and keyboard/touch-friendly close behavior.
- Kept the picker open after a choice so the selected-language checkmark is immediately visible; removed the white disks behind the flag icons.

## Mobile level-map dragging

- Enabled finger and stylus dragging on the horizontal level map. Dragging starts on the map surface; level buttons remain tappable.

## Shwe's feet alignment

- Aligned Shwe's animated sprite and worn items to the gameplay paw baseline, fixing the feet clipping below the ground in the attached gameplay recording.

## Voice acting in the intro and ending

- Every spoken line of the intro and the morning ending now has its voice clip (`game/assets/audio/voice`). The words type out at the speed they are spoken, the next line starts after the voice ends, and the music dips while someone speaks.
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
- **Per-night level layouts:** Nights 1–7 load independent ground profiles, world widths, pits, roosts, checkpoints, spawn zones and hide/burial markers from `game/js/levels.js`. Night 1 teaches safely; later nights add static, moving, crumbling, swinging and bouncy crossings. Free Play randomly selects one of three trails per run. Moodling rules and scoring remain unchanged.
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

`game/css/theme.css` centralizes palette, font stacks, radii and shadows, including original CSS art details. `cozy.css` supplies the presentation layer; `cozy-ui.js` handles presentation steps, progress and dynamic `data-sfx` hooks. Existing IDs/classes and illustrated assets are retained. Google Fonts: Fredoka, Nunito and Padauk fallback. Reduced-motion disables decorative animation. Keyboard focus uses honey outlines; interactive targets are at least 44px.

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
- **Preferences and saves:** `mk-profile`/`mk-onboarding` now safely retain `welcomeSeen`, `tutorialDone`, `tipsSeen`, Show tips, and the English/Burmese-ready copy choice. Reset still removes every `mk-` key. Settings includes Show tips, an English/Burmese-ready tip language selector, and Replay tutorial. All editable Welcome, tutorial, just-in-time, struggle, and sky-tip copy lives in `game/js/tips.js`.

## Cloudflare deployment

- Added explicit Wrangler static-assets configuration for `game/`, preventing Git history and repository-only files from being uploaded. The failed build included a 65 MiB Git pack, exceeding Cloudflare's 25 MiB asset limit.
- Preserved the legacy `/frontend/` and `TideCatcher.html` entry URLs with redirects after the game directory rename.

## Pit frequency

- Story pits now appear only on levels 5, 10, 15, 20, 25, 30, 35, 40, 45 and 50. Other story levels have solid ground beneath their existing roosts. Free Play layouts are unchanged.
## Smooth Moodling catch guides

- Rebuilt the catch guide as a canvas mini-player using the game's live cat rig and Moodling portraits, with eased movement, facing, gait, jump/landing effects, scene highlights and a catch-to-trail Glow ending.
- Each complete clip now runs in two seconds, with three timed caption beats, synchronized input badges for keyboard or touch, segmented progress, pause/play, beat stepping, manual replay and playback speed. Closing or hiding the tab pauses playback; reduced-motion users get still frames with manual beat navigation.
- Added illustrated storyboards for Frustrated, Nervous, Lonely, Buried, Excited, Shy, Jealous, Calm, breathing Calm and Golden. Kept existing catch rules, scoring and Moodling behavior unchanged.
- Localized clip controls and catch captions in English and Burmese. Removed the former CSS slide keyframes and kept the stage at 16:9 on mobile and desktop.
- Verified JavaScript syntax and game-source integrity. Browser-checked the Frustrated clip at 375px and 1280px, including its Space-or-A/D badge, final catch and Glow animation, exact 16:9 scene, and Burmese captions/controls.

## Storm Moodling encounters

- Added a three-pounce Storm Frustrated encounter after all required feelings are home on Nights 3, 5 and 7. The encounter is separate from normal Moodling catches, so it grants no catch score or collection progress.
- Added a short translated intro, visible attack wind-up and charge lane, dizzy pounce windows, a three-mark health ring, checkpoint respawn, life loss, Gentle mode support, and the existing Night failed results flow. The night timer pauses for the encounter and the moon door opens after the boss is defeated.
- Verified JavaScript syntax, source integrity and all 53 authored layouts. Automated browser gameplay smoke testing could not run in this turn because the computer-use tool stopped on the unsupported Firefox URL policy.

## Second Leap upgrade

- Added the optional, one-purchase Second Leap upgrade to the Treat box Shop. It starts off, costs 220 Glow, and lets Shwe jump once more in mid-air after a normal jump; the second leap is shorter and leaves a brief cozy sparkle trail.
- Reuses the existing Jump input on keyboard and touch. Wall jumps, ledge grabs, and rope releases keep their own movement behavior; landing clears the extra jump. Reduced-motion mode omits the added sparkle trail and squash effect.
- Kept old upgrade saves compatible while adding the new save field. The upgrade does not alter any level layout or its required jump settings.
- Added focused boss-night and Second Leap regression tests and wired them into GitHub Actions. JavaScript syntax, game integrity, both new tests, and all 53 level-layout checks pass.

# Rainy Night Market chapter map

- Expanded the existing Night Market Endless map with striped awning bounce pads, hanging lantern ropes, and glossy puddles that splash and startle nearby Nervous Moodlings unless Shwe sneaks through.
- Made the market stay rainy with a gentle animated drizzle, added a one-time localized puddle tip, and themed its ground, lanterns, and keepsakes for the market.
- Market platforms and puddles stay on solid ground; pit nights retain exactly one moving bridge per pit, so the market decorations never create a duplicate crossing.
- Added a layout check for all market levels 18–50 and included it in game-integrity CI.
# Pagoda Hill map

- Added Pagoda Hill as a new Endless place unlocked at Night 34, with its own moonlit ridge scenery and subdued colors alongside the existing Pagoda Garden.
- Pagoda routes use shallow repeating stone-step terrain, safe oil-lamp platforms, and hanging bells. Touching a bell plays a soft chime, briefly stills nearby Moodlings, and clears Nervous panic; the first bell tip is available in English and Burmese.
- Kept all lamps and bells on solid ground and retained each pit's single moving bridge. Added the map to existing keep-sake and burial-site art so Endless setup remains compatible.
- Added Pagoda Hill layout and unlock checks to game-integrity CI.
# Night Train Platform map

- Added Night Train Platform to Endless maps starting at Night 39, with a quiet station canopy, clock, rails, town lights, and matching night palette.
- Each layout includes one slow moving train carriage that uses the game's existing moving-platform collision/carry behavior. Its route stays on solid track outside pit approaches, so required pit bridges remain the only gap crossings.
- Added benches and ticket-booth hiding spots, including ticket-booth scenery and map-specific hiding prompts/keepsakes.
- Added layout checks for Nights 39–50 covering carriage routes, pit clearance/bridge uniqueness, reachable ride height, and safe hiding spots.

# Scratchable secret rooms

- Added one cracked-wall secret room to every story night, Free Play route, and Endless map. Rooms are positioned on solid ground with clearance from pits.
- Shwe can scratch each wall three times to open a softly lit alcove. Its reward is either a rare Frustrated/Nervous Moodling or a collectible diary page, selected for the map.
- Secret diary pages save under a new `mk-secret-pages` localStorage key and appear on Thiri’s shelf; existing save keys, score, and Moodling rules are unchanged. Page text and prompts are available in English and Burmese.
- Added placement and reward coverage for all story levels, Free Play variants, and Endless map families, and wired the check into GitHub Actions.
