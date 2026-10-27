# Lighting festival map: process

Map for **Night 4 · Lighting Festival** (Thadingyut). In the game: [`game/assets/festival/festival-back.webp`](../../../game/assets/festival/festival-back.webp), drawn by `drawFestivalSky()` and `drawFestivalWorld()` in `game/js/game.js`.

| File | Step |
|---|---|
| `1-original-chatgpt.webp` | Landscape generated with **ChatGPT** by _TEAM TO FILL (name)_ on 17 Oct 2026 |
| `2-back-layer.webp` | Only the sky, moon, mountains and pagoda hill are used, as the far background. Hanging lanterns and floating sky lanterns removed, the sky turned to a vivid purple night (team's purple theme), the pagoda given a soft glow, then upscaled 4× with the Real-ESRGAN anime model (open-source AI upscaler) and scaled to 2× for sharp screens |
| `3-in-game.png` | Screenshot in the game |

Step 2 and the in-game parts were done on 17 Oct 2026 with Claude (Anthropic).

## Why the picture was changed
- **Too many lights:** Moodlings are glowing lights too, so hundreds of candles and lanterns would hide Excited (yellow) and Jealous (orange). The game now has only a few dim paper lanterns, small sky lanterns and floating lamps, none with faces.
- **No ground to walk on:** the original is a view from above with water in front. The cat needs a flat path, so a wooden boardwalk is drawn in code along the water.
- **Time of night:** the story's festival chapter is at 3 AM, so the sunset glow became a purple night sky.
- **Colour:** stalls, banners, paper lanterns and floating lamps use a set of pastel colours (pink, lilac, aqua, cream, rose, sky blue).

## Layers in the game
1. **Far back:** the edited picture, barely moving as the cat runs, with small sky lanterns drifting up.
2. **Middle:** dark palm trees and tiered roofs (code), moving at 0.45× camera speed.
3. **Front:** boardwalk over dark water with floating lamps, stalls (Lonely's hiding places), paper-lantern strings between stalls, and raised wooden decks (the platforms).
