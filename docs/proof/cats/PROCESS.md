# Cats: process

The 8 cat breeds the player can choose: Burmese, Siamese, Persian, Maine Coon, Ragdoll, British Shorthair, Bengal, Sphynx.

## 1. Source (`01-source/`)
- `eight-cats-source.png` — the original 8-breed pixel-art sheet the team supplied on **16 Oct 2026**.
- **Made by:** _TEAM TO FILL — who made it, and with which tool. If an AI image tool was used, write its name and the prompt here._

## 2. Work in progress (`02-progress/`)
All steps on 16 Oct 2026, done with Claude (Anthropic) at the team's direction. Code ran locally in Python (OpenCV, Pillow).

| File | Step |
|---|---|
| `1-cut-out.png` | Each cat cut out from the sheet onto a transparent background |
| `2-rig-measuring-grid.png` | Measuring where to split body, tail, back legs and front legs for animation |
| `3-night-style-compare.png` | Softer night colours so the cats fit the dark backgrounds |
| `4-chibi-compare.png` | Team feedback "not cute enough" → bigger head (×1.4), shorter legs (×0.76), pink blush |
| `5-animation-poses.png` | Poses made by bending the parts in code: walk, sneak, jump, pounce, scratch, idle |
| `6-animation.gif` | The animation running |

## 3. Final (`03-final/`)
- `all-8-cats.png` — all 8 final cats side by side.
- Game files: [`frontend/assets/cats/`](../../../frontend/assets/cats/)
- Animation code: `mkDrawRig()` in [`frontend/js/customization.js`](../../../frontend/js/customization.js), poses in `mkDrawSprite()` in `frontend/js/game.js`.

## Still to do
- Real hand-drawn walk frames from the team's designers would replace the code-bent poses.
