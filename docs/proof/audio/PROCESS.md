# Audio process and provenance

Updated 2026-10-20. Audio stays local to the game; this change adds no external audio URLs. `frontend/js/tc-sfx.js` extends the existing player, volume controls, and music routing. All newly synthesized interface/gameplay cues and the new screen beds below are **code placeholder** sounds made at runtime with the Web Audio API (oscillators, envelopes, filtering, and generated noise); they are not downloaded or model-generated files.

## Shipped sound-effect files

Each listed stem is shipped in both `frontend/assets/audio/ogg/<stem>.ogg` and `frontend/assets/audio/mp3/<stem>.mp3` (the MP3 is the browser fallback copy).

| File stem | Who made it | Tool or source | Licence / status |
|---|---|---|---|
| `sfx_cat_meow` | Recording by Kerzoven; edited for TideCatcher by the game team | Kerzoven's *Cat Purr & Meow* pack, OpenGameArt; cat recordings edited/trimmed and converted for the game | CC0 1.0 as listed on the asset page; optional credit. The original pack ownership was not independently verified. |
| `sfx_cat_happy_trill` | Game team | Existing edited cat pack sound; source pack described in `CREDITS-sfx.md` | CC0 source pack declared there; see the ownership caveat above. |
| `sfx_cat_purr` | Recording by Kerzoven; edited for TideCatcher by the game team | Kerzoven's *Cat Purr & Meow* pack, OpenGameArt | CC0 1.0 as listed on the asset page; ownership caveat as above. |
| `sfx_cat_sad_mew` | Recording by Kerzoven; edited for TideCatcher by the game team | Kerzoven's *Cat Purr & Meow* pack, OpenGameArt | CC0 1.0 as listed on the asset page; ownership caveat as above. |
| `sfx_cat_hiss` | TideCatcher team | Synthetic filtered-noise hiss produced by the existing `build_pack.py` asset-generation process; no cat sample | Original scripted effect; no third-party licence. |
| `sfx_catch_happy_chime` | TideCatcher team | Original synthesized chime in the existing `build_pack.py` process | Original team-created audio; no third-party samples. |
| `sfx_mood_frustrated_growl` | TideCatcher team | `build_pack.py` (NumPy): synthesized creature voice, harmonic/vowel tones, breath and motion | Original scripted audio; no third-party samples. |
| `sfx_mood_nervous_squeak` | TideCatcher team | `build_pack.py` (NumPy): synthesized creature voice with tremble/wobble | Original scripted audio; no third-party samples. |
| `sfx_mood_lonely_sigh` | TideCatcher team | `build_pack.py` (NumPy): synthesized falling voice and breath | Original scripted audio; no third-party samples. |
| `sfx_mood_calm_chime` | TideCatcher team | `build_pack.py` (NumPy): synthesized creature voice and bell-like partials | Original scripted audio; no third-party samples. |
| `sfx_mood_shy_giggle` | TideCatcher team | `build_pack.py` (NumPy): synthesized creature voice | Original scripted audio; no third-party samples. |
| `sfx_mood_jealous_hmph` | TideCatcher team | Existing original pack member; a remake was tried and rejected | Original team-provided effect; no third-party source declared. |
| `sfx_mood_excited_boing` | TideCatcher team | `build_pack.py` (NumPy): synthesized bouncy creature voice | Original scripted audio; no third-party samples. |
| `sfx_mood_golden_sparkle` | TideCatcher team | `build_pack.py` (NumPy): original bell/chime synthesis | Original scripted audio; no third-party samples. |
| `sfx_mood_frustrated_charge` | TideCatcher team | Existing original pack-generated cue | Original scripted audio; no third-party source declared. |
| `sfx_mood_frustrated_dizzy` | TideCatcher team | Existing original pack-generated cue | Original scripted audio; no third-party source declared. |

See `CREDITS-sfx.md` and `PROCESS-sfx.md` for the original pack notes, asset-generation method, and exact CC0 source URL. The historic build script itself is not included in this change.

## Shipped music files

All music stems are available in `frontend/assets/audio/music/ogg/` and `frontend/assets/audio/music/mp3/`. The player currently selects the five `piano_` arrangements (`STYLE = 'piano'`); the `music_` loop stems remain available as an alternate style.

| File stem | Who made it | Tool or source | Licence / status |
|---|---|---|---|
| `piano_school` | TideCatcher team | Original arrangement synthesized by `night_music.py` / `piano_music.py` (NumPy/SciPy), music-box and piano palette | Original team-created work; no third-party samples or AI audio model. Scripts were written with Claude assistance, as declared in `PROCESS-music.md`. |
| `piano_park` | TideCatcher team | Original arrangement synthesized by `night_music.py` / `piano_music.py` (NumPy/SciPy), piano, soft strings, distant-cricket texture | Original team-created work; no third-party samples or AI audio model. |
| `piano_festival` | TideCatcher team | Original arrangement synthesized by `night_music.py` / `piano_music.py` (NumPy/SciPy), plucked saung-like palette, bell, soft hand drum | Original team-created work; no third-party samples or AI audio model. |
| `piano_hilltop` | TideCatcher team | Original arrangement synthesized by `night_music.py` / `piano_music.py` (NumPy/SciPy), drone, wind, strings and piano calls | Original team-created work; no third-party samples or AI audio model. |
| `piano_lakeside` | TideCatcher team | Original arrangement synthesized by `night_music.py` / `piano_music.py` (NumPy/SciPy), warm electric-piano palette and water-like plinks | Original team-created work; no third-party samples or AI audio model. |
| `music_school` | A TideCatcher member supplied the source file | Member-provided `music_school.mp3`; game-loop edit and Ogg/MP3 versions are documented in `PROCESS-music.md` | **Source and licence not recorded in the repository.** Treat as unverified; confirm with the member before reuse or redistribution. Not selected by the current player style. |
| `music_park` | A TideCatcher member supplied the source file | Member-provided `music_park.mp3`; game-loop edit and Ogg/MP3 versions are documented in `PROCESS-music.md` | **Source and licence not recorded in the repository.** Treat as unverified; confirm with the member before reuse or redistribution. Not selected by the current player style. |
| `music_festival` | A TideCatcher member supplied the source file | Member-provided festival loop; repository process note calls the source `music_lighting_festival.mp3` | **Source and licence not recorded in the repository.** Treat as unverified; confirm with the member before reuse or redistribution. Not selected by the current player style. |
| `music_hilltop` | A TideCatcher member supplied the source file | Member-provided hilltop loop; repository process note calls the source `music_hilltop_park.mp3` | **Source and licence not recorded in the repository.** Treat as unverified; confirm with the member before reuse or redistribution. Not selected by the current player style. |
| `music_lakeside` | A TideCatcher member supplied the source file | Member-provided `music_lakeside.mp3`; game-loop edit and Ogg/MP3 versions are documented in `PROCESS-music.md` | **Source and licence not recorded in the repository.** Treat as unverified; confirm with the member before reuse or redistribution. Not selected by the current player style. |

The loop files were cut/crossfaded for looping and normalized according to `PROCESS-music.md`; their provenance gaps remain explicit here rather than being represented as CC0.

## Runtime code placeholders (Web Audio API)

There are no corresponding new audio files for these cues. Their producer and tool/source are `TideCatcher` code in `frontend/js/tc-sfx.js` using Web Audio oscillator/noise buffers, gain envelopes and filters; the entries are **code placeholder** sounds. They are original procedural app sounds with no third-party source or sample. They use the Effects slider and Mute state. Repeated effects randomize pitch by ±5%; no more than four simultaneous copies of one sound stem are allowed.

| Runtime sound / use | Who made it | Tool or source | Licence |
|---|---|---|---|
| `click`, `hover`, `back`, `toggle`, `tick`, `tab`, `page`, `pop`, `swish`, `error`, `buy`, `select` — button, hover, slider/loading, map/shop/book, and panel feedback | TideCatcher implementation | **code placeholder** — Web Audio API | Original runtime code; no third-party source. |
| `title`, `intro`, `ready`, `start`, `countdown`, `urgent`, `timeup` — logo/intro/start and clock cues | TideCatcher implementation | **code placeholder** — Web Audio API | Original runtime code; no third-party source. |
| `pause`, `resume` — pause overlay feedback | TideCatcher implementation | **code placeholder** — Web Audio API | Original runtime code; no third-party source. |
| `jump`, `land`, `step`, `pounce`, `scratch`, `eyes` — Shwe action feedback | TideCatcher implementation | **code placeholder** — Web Audio API | Original runtime code; no third-party source. |
| `combo` (pitch rises by combo count), `comboLost`, `hit`, `appear` — combat/progression feedback | TideCatcher implementation | **code placeholder** — Web Audio API | Original runtime code; no third-party source. |
| `sparkle`, `result`, `resultTick`, `reward` — result, score and reward feedback | TideCatcher implementation | **code placeholder** — Web Audio API | Original runtime code; no third-party source. |
| `menu`, `intro`, `results` music beds | TideCatcher implementation | **code placeholder** — generated oscillator chords/filtered pad in Web Audio API | Original runtime code; no third-party source. |
| `school`, `park`, `festival`, `hilltop`, `lakeside`, `menu`, `intro` ambience loops | TideCatcher implementation | **code placeholder** — looped generated noise, low-pass filter and a quiet tone in Web Audio API; 1.5-second crossfades | Original runtime code; no third-party source. |

The `appear` and `resultTick` profiles are available to the audio test page but are not currently used as repeated in-game sequencers; result/reward stingers play at the results transition. Effects, music, ambience and mute settings share the `tc-audio` localStorage record. Pause ducks music/ambience to 30%, applies a low-pass filter and restores over about 0.4 seconds. Browser tab hiding applies the same temporary duck and restores the prior pause/gameplay level on return.
