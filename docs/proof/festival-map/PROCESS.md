# Lighting festival map: process

Map for **Night 4 · Lighting Festival** (Thadingyut). In the game: [`frontend/assets/festival/festival-back.webp`](../../../frontend/assets/festival/festival-back.webp), drawn by `drawFestivalSky()` and `drawFestivalWorld()` in `frontend/js/game.js`.

| File | Step |
|---|---|
| `1-original-chatgpt.webp` | Landscape generated with **ChatGPT** by _TEAM TO FILL (name)_ on 17 Oct 2026 |
| `2-back-layer.webp` | Only the sky, moon, mountains and pagoda hill are used, as the far background. Hanging lanterns and floating sky lanterns removed, pink sunset turned to a 3 AM night, everything darkened except the pagoda |
| `3-in-game.png` | Screenshot in the game |

Step 2 and the in-game parts were done on 17 Oct 2026 with Claude (Anthropic).

## Why the picture was changed
- **Too many lights:** Moodlings are glowing lights too, so hundreds of candles and lanterns would hide Excited (yellow) and Jealous (orange). The game now has only a few dim paper lanterns, small sky lanterns and floating lamps, none with faces.
- **No ground to walk on:** the original is a view from above with water in front. The cat needs a flat path, so a wooden boardwalk is drawn in code along the water.
- **Time of night:** Chapter 5 of the story is 3 AM, so the sky is darker than in the original.

## Layers in the game
1. **Far back:** the edited picture, barely moving as the cat runs, with small sky lanterns drifting up.
2. **Middle:** dark palm trees and tiered roofs (code), moving at 0.45× camera speed.
3. **Front:** boardwalk over dark water with floating lamps, stalls (Lonely's hiding places), paper-lantern strings between stalls, and raised wooden decks (the platforms).
