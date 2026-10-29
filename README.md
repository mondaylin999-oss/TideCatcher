![TideCatcher by NextCrown × Digit7 Jam 2026](docs/brand/github-banner-1280x640.png)

# TideCatcher

TideCatcher is a static browser Canvas game by **NextCrown** for Digit7 Jam 2026. Vercel uses the repository root as its project root; Cloudflare Workers serves the `game/` static assets.

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

## Adding art

- Put game images in `game/assets/` and refer to them with a relative path (for example `'assets/cats/bengal.png'`). Do not paste images into JS as base64.
- For every new piece of art, add its sketches, progress and final version to `docs/proof/`, and update `AI-DECLARATION.md` if AI was used. See [`docs/proof/README.md`](docs/proof/README.md).
