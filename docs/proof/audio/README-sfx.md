# TideCatcher - Cat & Moodlings SFX (v2, 14 files)

Made by our team member for the game. The files used by the game are in `game/assets/audio/ogg/` (and `mp3/` for browsers that cannot play Ogg); the player is `game/js/tc-sfx.js`.
Files: `game/assets/audio/wav/` (44.1 kHz 16-bit mono) and `.../ogg/` (use these in the web game). Player: `game/js/tc-sfx.js`.

## Shwe (kitten) - real CC0 cat recordings, light edit
| file | length | notes |
|---|---|---|
| sfx_cat_meow | 0.6 s | soft meow, nudged ~10% higher so Shwe sounds like a kitten |
| sfx_cat_happy_trill | 0.3 s | short bright chirp-mew (not a rolling trill) |
| sfx_cat_purr | 1.4 s | gentle purr slice |
| sfx_cat_sad_mew | 0.6 s | soft mew, drooping pitch |
| sfx_cat_hiss | 0.6 s | **synthetic soft "pssh" (filtered noise), not a real cat.** No verified CC0 cat hiss was available. Put your own recording at `source/cat_hiss_user.wav` and re-run `build_pack.py` to replace it |

## Moodlings - one voice per character (soft synthesized "creature talk", no samples)
| file | character | sound |
|---|---|---|
| sfx_mood_frustrated_growl | Frustrated, red | grumpy "hm-hmf!" |
| sfx_mood_nervous_squeak | Nervous, lavender | "pi-pi-pi" tremble |
| sfx_mood_lonely_sigh | Lonely, blue | falling "oo... ooh" + sigh |
| sfx_mood_excited_boing | Excited, yellow | bouncy "ya-ya-yoo!" |
| sfx_mood_calm_chime | Calm, green | warm "mm-loo" + tiny bell |
| sfx_mood_shy_giggle | Shy, pink | "eep!" + "mi" |
| sfx_mood_jealous_hmph | Jealous, orange | pouty "hmph" |
| sfx_mood_golden_sparkle | Golden, yellow | warm sparkle |
| sfx_catch_happy_chime | catch | soft "pon" + two-note bell |

## Honest limits
- I cannot hear audio. Lengths, levels, clipping and file validity were checked by script. **Cuteness was not judged by ear**: please listen and tell me which to change.
- Moodling voices are synthesized (this was a change from v1, which sped up cat recordings). They are soft tones with vowel colour, wobble and breath, so they may still sound a little "game-like".
- Copyright risk is low, not zero. See `CREDITS.md`.
