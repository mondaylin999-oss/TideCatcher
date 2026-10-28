# Moodlings: process

The 8 feelings the cat catches: Frustrated (red), Nervous (purple), Lonely (blue), Excited (yellow), Calm (green), Shy (pink), Jealous (orange), and Golden (bonus).

## Idea (team)
- Game concept, the list of feelings, their colours and how each one behaves and is caught: **NextCrown team** (game design, 12–16 Oct 2026). See [`docs/design/design-roles.pdf`](../../design/design-roles.pdf).

## 1. Design (`01-design/`)
- `moodling-designs.png` — character sheet for all 8: look, warning sign, how to catch.
- Designed on **16 Oct 2026** with Claude (Anthropic), from the team's descriptions. Revised after team feedback ("make it cuter").
- Each Moodling has its own **shape** (star, blob, teardrop, ball, sprout, bud, flame, star with halo), so they can be told apart without colour.

## 2. Code (`02-code/`)
- `moodling-art.js` — the Moodlings are drawn as vector shapes in code (no image files). This is the version that went into the game.
- In the game: `MOOD_ART` and `drawCuteMood()` in [`game/js/game.js`](../../../game/js/game.js).

## 3. In game (`03-in-game/`)
- `nights-overview.png`, `night7-gameplay.png` — screenshots of the Moodlings in the game.

## Still to do
- **Buried** has no cute design yet.
- _TEAM TO FILL — add any hand sketches the designers made for the Moodlings to `01-design/`._
