![TideCatcher by NextCrown × Digit7 Jam 2026](docs/brand/github-banner-1280x640.png)

# TideCatcher

TideCatcher is a static browser Canvas game by **NextCrown** for Digit7 Jam 2026. Vercel uses the repository root as its project root; Cloudflare Workers serves the `game/` static assets.

## What's new

- **Heights on Levels 1-4:** desks, shelves, the slide, a bench and the stall roofs can be stood on, each hiding a keepsake (3 per level).
- **Levels 8-50:** shorter (4,500-6,000 wide), gently rolling ground, a hazard that fits each map in every level, and hide/dig spots that no longer repeat.
- **Upper levels:** tougher Moodlings from Level 15 (helmeted Frustrated, Nervous that slip away once, Lonely that need company twice), favourite hiding places for each feeling, and heights to climb in every level.
- **Fair rewards:** lights reach the Heart Workshop only when a level is beaten for the first time; torn drawing pieces are kept only if the level is beaten.
- **Catch clips:** every Moodling has a short "how to catch" clip in How to Play, and a level with a new Moodling plays its clip first.

## Project structure

```text
game/                       Static game site
  index.html                Game markup and metadata
  css/                      Game and interface styles
  js/                       Game, levels, UI and customization
  assets/                   Cat art, scenes, fonts and audio
docs/                       Level notes, design briefs and art proof
tests/                      Game integrity and level layout checks
.github/workflows/          GitHub Actions checks
index.html                  Root entry point for Vercel
TideCatcher.html            Legacy game entry point
wrangler.jsonc              Cloudflare Workers static asset settings
```

The project is a static browser game; gameplay and progress saves run entirely in the browser.

## Run locally

From the repository root, run `python -m http.server 8000` and open `http://localhost:8000/` or `http://localhost:8000/game/`. The root entry forwards to the game. Older `/frontend/` links continue to redirect to the current game path.

## Tests

Run `for f in tests/*.test.js; do node "$f"; done` from the repository root. Every test must pass.

## Adding art

- Put game images in `game/assets/` and refer to them with a relative path (for example `'assets/cats/bengal.png'`). Do not paste images into JS as base64.
- For every new piece of art, add its sketches, progress and final version to `docs/proof/`, and update `AI-DECLARATION.md` if AI was used. See [`docs/proof/README.md`](docs/proof/README.md).
