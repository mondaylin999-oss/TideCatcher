# TideCatcher

TideCatcher is a static browser Canvas game. Vercel should keep the repository root as its project root.

## Project structure

```text
frontend/
  index.html              Game markup and metadata
  css/styles.css          All page and game interface styles
  js/customization.js     Cat coat assets, chosen-name support, and text customization
  js/game.js              Canvas game, world, input, progression, and UI logic
backend/
  README.md               Backend status and future guidance
index.html                Vercel root entry; forwards to the frontend
TideCatcher.html          Legacy entry URL; forwards to the frontend
```

## Run locally

From the repository root, run `python -m http.server 8000` and open `http://localhost:8000/` or `http://localhost:8000/frontend/`. The root entry and the legacy `/TideCatcher.html` URL both forward to the game.

## Backend status

There is currently no backend service or API in this project. See [`backend/README.md`](backend/README.md); the game remains deployable as a static Vercel site.
