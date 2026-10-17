# TideCatcher

TideCatcher is a static browser Canvas game by **NextCrown** for Digit7 Jam 2026. Vercel should keep the repository root as its project root.

## Project structure

```text
frontend/
  index.html              Game markup and metadata
  css/styles.css          All page and game interface styles
  js/customization.js     Cat breeds, chosen-name support, and text customization
  js/game.js              Canvas game, world, input, progression, and UI logic
  assets/cats/            The 8 cat breed sprites (PNG)
docs/
  design/                 Design roles and instruction pictures for designers
  proof/                  Proof of how the art was made (cats, Moodlings, intro scenes)
backend/
  README.md               Backend status and future guidance
index.html                Vercel root entry; forwards to the frontend
TideCatcher.html          Legacy entry URL; forwards to the frontend
AI-DECLARATION.md         Every AI tool used and what for
CREDITS.md                Team roles, fonts and other credits
```

## Run locally

From the repository root, run `python -m http.server 8000` and open `http://localhost:8000/` or `http://localhost:8000/frontend/`. The root entry and the legacy `/TideCatcher.html` URL both forward to the game.

## Adding art

- Put game images in `frontend/assets/` and refer to them with a relative path (for example `'assets/cats/bengal.png'`). Do not paste images into JS as base64.
- For every new piece of art, add its sketches, progress and final version to `docs/proof/`, and update `AI-DECLARATION.md` if AI was used. See [`docs/proof/README.md`](docs/proof/README.md).

## Backend status

There is currently no backend service or API in this project. See [`backend/README.md`](backend/README.md); the game remains deployable as a static Vercel site.
