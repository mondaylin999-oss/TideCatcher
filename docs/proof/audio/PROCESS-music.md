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
