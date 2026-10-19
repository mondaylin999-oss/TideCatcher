# Night music (process)

| file in game | place / hours | source file from our member |
|---|---|---|
| music_school | School · 11 PM–Midnight | music_school.mp3 |
| music_park | Park · 1 AM (also Free Play) | music_park.mp3 |
| music_festival | Lighting Festival · 2 AM | music_lighting_festival.mp3 |
| music_hilltop | Hilltop Park · 3 AM | music_hilltop_park.mp3 |
| music_lakeside | Lakeside · 4–5 AM | music_lakeside.mp3 |

**Source and licence: TO FILL IN by the member who found the tracks** (website link or tool, licence, AI or not).

Editing for the game (script, 19 Oct 2026):
- Cut the fade-in/fade-out and blended the last 2.5 s into the start so each track loops without a gap.
- Lowered to about -20 LUFS with peaks under -1.5 dBFS (the originals were about -12 LUFS and clipped slightly), so music sits under the sound effects.
- Saved as Ogg (`assets/audio/music/ogg/`) with MP3 copies (`assets/audio/music/mp3/`) for browsers without Ogg.
- In the game: each hour plays its place's track, fades between tracks, goes quieter during pause and the bedroom scene, and stops on the menus. "Music" slider in Settings.

## Update 19 Oct 2026: calm night pieces (in use now)
The game now plays five original pieces (`assets/audio/music/*/piano_<place>.ogg|mp3`), each with its own sound so every place feels different:

| place | feel | instruments |
|---|---|---|
| School | light, curious little waltz (3/4) | music box + piano |
| Park | calm and warm, rolling arpeggios | piano + soft strings + far crickets |
| Lighting Festival | gentle festival, Myanmar touch | plucked harp (saung-like) + temple bell + soft hand drum |
| Hilltop Park | mysterious and wide, free time | low drone + night wind + strings + far piano calls |
| Lakeside | lullaby (6/8), the most peaceful | warm electric piano + water plinks |

- All written and synthesised in code (`night_music.py` with `piano_music.py`, NumPy/SciPy). No samples, no existing music, no AI audio model; the scripts were written with an AI assistant (Claude), which we declare.
- Played like a calm sandbox game: the piece plays once after the hour starts, then 25-45 s of quiet, then again.
- The team's looping tracks above are still in the folder; set `STYLE = 'loop'` in `js/tc-sfx.js` to use them instead.
