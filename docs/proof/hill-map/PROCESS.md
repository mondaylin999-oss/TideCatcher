# Hilltop park map: process

Map for **Night 5 · Hilltop Park**. Drawn by `drawHillSky()` and `drawHillWorld()` in `game/js/game.js`; the city view is [`game/assets/hill/hill-vista.webp`](../../../game/assets/hill/hill-vista.webp).

| File | Step |
|---|---|
| `1-team-level-design.webp` | Level design by _TEAM TO FILL (name, tool)_: stepped stone terrace, tree-branch ledges, hiding spots in bushes, bin and tree hollow |
| `2-city-view-background.webp` | The city-and-moon view from the middle of that design, used as the far background: lamp removed, recoloured to the purple theme (darker so the purple Nervous stays visible), upscaled with Real-ESRGAN |
| `3-in-game.png` | Screenshot in the game |

Steps 2–3 were done on 17 Oct 2026 with Claude (Anthropic).

## How the design became a level
The layout repeats every 1400 px along the 4200-px level:
- **Ground steps** (`HILL_PROFILE`): high gate terrace → bench step → lamp step → low walkway along the railing → back up. Steps are short ramps so the cat walks up them.
- **Platforms** (`HILL_PLATS`): a branch ledge off the left tree, a stone pillar, a branch ledge off the right tree, all within the cat's jump height (about 150 px).
- **Hiding places / decoration:** gate with lamps, flowering bushes, benches, lamps with warm light pools, a bin on the walkway and a glowing hollow in the right tree.
