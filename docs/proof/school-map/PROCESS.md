# School map: process

Background for **Nights 1–2** (School). In the game: [`game/assets/school/hallway-night.webp`](../../../game/assets/school/hallway-night.webp), drawn by `drawSchoolWorld()` in `game/js/game.js`.

| File | Step |
|---|---|
| `1-original-chatgpt.webp` | First version, generated with **ChatGPT** by _TEAM TO FILL (name)_ on 17 Oct 2026 |
| `2-shelves-removed.webp` | Painted-in floating shelves, orange springs, pink balls and the items sitting on the shelves removed, so the game can draw its own platforms where the collisions are |
| `3-night-version.webp` | Turned into night (Chapters 1–2 are 9 PM and 10:30 PM): cooler and darker colours, reds toned down so the red Moodling stands out, lamps dimmed, moon and night sky in the window, moonbeam |
| `4-in-game.png` | Screenshot in the game |

Steps 2–3 were done on 17 Oct 2026 with Claude (Anthropic), using OpenCV in Python.

## How it is used in the game
- The picture is cropped to the hallway (ceiling to floor line) and scaled to 2445 × 474 game pixels (saved at 1.5× for sharp screens).
- It repeats along the 4200-px level, mirrored every other time so there is no seam, and moves at 0.9× camera speed for depth.
- The floor, its faint reflection, and the wooden shelves the cat jumps on are drawn in code, so they always match the collision boxes.
