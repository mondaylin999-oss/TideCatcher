# TideCatcher Sound Audit

Audit date: 2026-10-19. Scope: `frontend/` HTML/CSS/JS and `frontend/assets/audio/` before adding sound coverage.

| Event / screen | Current sound | Audit result |
|---|---|---|
| Browser audio unlock | First pointer/key creates/resumes AudioContext and preloads existing effect assets | Present |
| Moodling voices / catch | Real cat/Moodling MP3/OGG clips and catch chime via `TCSfx` | Present |
| Shwe meow, trill, purr, sad, hiss | Real clips via `TCSfx.cat()` | Present |
| Frustrated charge / dizzy cues | Real clips via `TCSfx.play()` | Present |
| Map night music (school, park, festival, hilltop, lakeside) | Piano MP3/OGG loops are selected in `startGame`; fades between selected tracks | Present in nights |
| Hub / map / shop / Mood Book music | No screen-level music route | Missing |
| Intro music | A single quiet WebAudio tone at intro start; no sustained intro track | Partial; music missing |
| Title/logo sting | No sound on title appearance (correctly avoid autoplay before gesture) | Missing |
| Loading progress / ready | Progress observer updates stars/text only | Missing |
| Intro panel/line changes and skip | No page/skip cue; skip hides intro and stops current track | Missing |
| Button clicks / hover | `cozy-ui.js` assigns `data-sfx` labels to static/dynamic controls, but no delegated listener plays them; no hover cue | Missing playback |
| Back, toggle, slider, tab/page changes | No shared sound dispatch; audio sliders only persist music/effects, ambience is disabled | Missing / partial settings |
| Overlay open/close (pause, reset, leave-night, settings, info) | No generic pop/swish dispatch | Missing |
| Story map chapter selection | No selection chime | Missing |
| Mood Book page | No page-flip sound | Missing |
| Shop purchase / unlock | Some purchases use two built-in `tone()` notes; insufficient checks/error cue, Glow items have no dedicated jingle | Partial |
| Pause / resume | `TCMusic.duck(.35/1)` fades volume; no pause/resume effect | Partial (duck only) |
| Night ready / start | Existing tones for Ready/Go and a chapter-root sting | Partial; no consistent start cue |
| Countdown / time up | Timer is canvas-rendered; no last-ten-second tick or time-up cue found | Missing |
| Catch / rare | Existing catch chime/voice and some Golden `tone()` cue | Present / partial |
| Combo up / lost | Combo affects points/display; no dedicated combo sequence or lost cue found | Missing |
| Hit / lost light | Cat sad clip on some hit paths; no consistent soft hit/lost-light cue found | Partial |
| New feeling appears | Some Moodling voice cues; no generic appearance cue | Partial |
| Shwe movement (step/sneak, jump, land, pounce, scratch, eyes, purr) | Purr has clip; isolated breathing/eyes/firefly tones; no consistent set of action cues | Partial |
| Results / score count / best / row pops / Glow | Result values are displayed; no count-up, row, Glow or New Best sound found | Missing |
| Per-map ambience (hall hum, park crickets, festival, hill wind, lake water) | No ambience audio files; Settings slider is disabled | Missing |
| Tab hidden | Music/effects are not consistently suspended on document visibility changes | Missing |
| Audio settings persistence / mute | Music/effects/mute values stored in `tc-audio`; no active ambience control | Partial |
| Missing media handling / concurrency / pitch variation | Unknown media silently falls back to an audio element; no explicit once-only warning, voice cap, or pitch variance | Missing safeguards |

## Asset inventory

Real effect clips are available under `frontend/assets/audio/{mp3,ogg}/` for Moodling voices, cat sounds, and the catch chime. Five real night-music tracks and five piano arrangements are available under `frontend/assets/audio/music/{mp3,ogg}/` for school, park, festival, hilltop, and lakeside. No separate menu, intro, results, or ambience tracks were found in the audio asset tree. New missing cues should therefore use original Web Audio code placeholders, not borrowed game audio.


## After-change event-to-sound map

| Event / screen | Sound route after extension | Backing / behavior |
|---|---|---|
| Welcome/logo begin | `title`, then menu music and menu ambience | User-gesture gated; code placeholder sting and generated screen bed. |
| Welcome loading | `tick` for progress and `ready` when all resources finish; `intro` bed on first gesture while still loading | Delegated progress observer; no autoplay before audio unlock. |
| Button, hover, back, toggle, tab | `click`, `hover`, `back`, `toggle`, `tab` | Centralized delegated UI hooks; hover restricted to hover/fine-pointer devices. |
| Panel reveal/dismiss | `pop` / `swish` | Observes overlay visibility; pause has a dedicated pause cue. |
| Chapter map, Mood Book, shop | `chapter`, `page`, `select`/`buy` | Dynamic controls receive sound tags; successful purchases use a dedicated buy cue. |
| Intro | `intro` screen bed, `page` at scene changes, `swish` on marked beats/lines | Original generated screen bed; no external audio files. |
| Game start / clock | `start`; `countdown` for seconds 10–4; `urgent` for seconds 3–1; `timeup` | Game logic and timer thresholds remain unchanged. |
| Movement / abilities | `step`, `jump`, `land`, `pounce`, `scratch`, `eyes`; existing `cat.purr` remains | Step cue is throttled by stride; actions fire from existing successful action branches. |
| Combo / damage | `combo` with semitone rise by combo level, `comboLost`, `hit` | Added at existing score/hit branches; scoring values are untouched. |
| Results | `reward` or `result`, plus `sparkle` for a new/high best | `results` generated music bed; map ambience fades out. |
| Story night music | Existing `piano_school`, `piano_park`, `piano_festival`, `piano_hilltop`, `piano_lakeside` clips | OGG preferred with MP3 fallback; fades between tracks. |
| Menu, intro, results music | `menu`, `intro`, `results` | Original Web Audio **code placeholder** beds. |
| Per-map ambience | `school`, `park`, `festival`, `hilltop`, `lakeside`; menu and intro variants | Procedural noise/tones, 1.5-second crossfades, separate Ambience slider. |
| Pause, Esc/P, resume | `pause` / `resume`; music and ambience duck to 30%, low-pass at about 1.8 kHz (ambience cutoff halved), restored over ~0.4 s | Tab-hidden applies the same temporary duck/filter and restores the previous duck level when visible again. |
| Mute and settings | Effects, Music, Ambience sliders and Mute all | Values loaded from and saved to `localStorage` key `tc-audio`. |
| Repeated cues | ±5% pitch variation; maximum four simultaneous instances per effect/tone | Enforced for asset playback, synthesized effects and legacy direct game tones. |

New code-generated cues and beds are documented as **code placeholder** in `PROCESS.md`; shipped asset provenance and unresolved licence information are also recorded there.
