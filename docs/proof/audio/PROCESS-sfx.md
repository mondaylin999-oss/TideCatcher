# Process (v2)
1. Read the game (https://tidecatcher.vercel.app/ and its js/game.js) to learn the characters: Shwe the kitten, Thiri, and Moodlings F/N/L/C/S/J/E/B/G, and how sounds are triggered (WebAudio `tone()` beeps).
2. Cat sounds: 4 CC0 Kerzoven WAVs (see CREDITS.md) -> cut, trim, 60-90 Hz high-pass, fades, loudness. Meow/sad mew nudged up/down in pitch by playback speed (kitten feel).
3. Moodling voices: `build_pack.py` synthesizes short rounded syllables (harmonic tone + vowel formants + gentle vibrato/jitter + breath + tiny room), one personality per Moodling. Bells for chimes.
4. Hiss: filtered noise (synthetic) because no verified CC0 cat hiss was available.
5. Loudness about -22 to -27 dBFS RMS, peaks under 0.85, WAV 16-bit + Vorbis OGG.
6. Automated checks only (decode, no NaN, no clipping, 0.3-1.5 s). No listening review.
Rebuild: ask for `build_pack.py` (kept outside the ZIP) then `python -I build_pack.py` (numpy, soundfile). Original recordings are fetched separately into `_downloads_untrusted/oga/` (not in this ZIP).

## Update 19 Oct 2026 (integration)
- `sfx_mood_jealous_hmph`: we tried a re-made version but kept the member's original.
- MP3 copies of every sound were added for browsers without Ogg support.
- Wired into the game (`js/tc-sfx.js` + calls in `js/game.js`): catch chime + Moodling voice, Moodling reactions, Shwe's meow/hurt/purr/hiss/trill, Golden sparkle; "Sound effects" slider and "Mute all" in Settings.
