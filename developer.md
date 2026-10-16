# Developer Log

This file records significant gameplay and world changes in chronological entries. Add new work at the end using the template below; keep notes concise but specific enough to understand the design, affected systems, and verification.

## Entry 001 — Expanded Moonlit Trail and Sky-Fall Feelings

**Date:** 2026-10-16

**Scope:** Expand the world to 4,200 units and add three chapter-scaled sky-fall variants using existing Moodling types.

### World and terrain

- Extended `WORLD` from 2,600 to 4,200 units and continued `TRAIL_PROFILE` beyond x=2,600 with connected, rolling terrain and several mid-height climbs.
- Added four late-world perches while keeping the total at 12; retained per-night perch budgets and spread reduced budgets across the full perch list, including both endpoints.
- Expanded the rock and cave positions across the full trail, with nine rocks and eight caves.
- Kept terrain and parallax rendering tied to the world width so the expanded route uses the existing drawing loops.

### Sky-fall mechanics

- Added a shared sky state machine to existing Moodling spawns and updates; ordinary Free Mode spawning remains unchanged.
- **Feature A — Slow Descender:** Nervous and Lonely wait above the screen, descend at a chapter-scaled speed, and continue with their regular ground behavior. A landing on the cat nudges the cat aside without removing the feeling.
- **Feature B — Pounce Target:** Excited and Jealous descend under gravity, can be intercepted with a mid-air pounce, and land stunned after a successful hit. A missed interception remains catchable but lowers the Perfect Sky count.
- **Feature C — Scratch Challenge:** Frustrated falls with an ember trail, pauses after a mid-air pounce, and must be scratched before the timer expires. A failure removes the sky feeling, reduces Perfect Sky, and summons the chapter-sized Frustrated ambush.
- Added chapter quotas and timing values for Nights 1–7, a remaining/live sky HUD chip, Perfect Sky feedback, and one-time-per-install tutorial banners stored under `mk-skyTutorial`.
- Scheduled sky variants replace a matching live normal Moodling when one is available, rather than needlessly increasing the active population; a failed Feature C restores an unmet Frustrated quota through the normal respawn queue.
- Sky catches continue through the normal score, Glow, combo, quota, trail, and Mood Book code paths. Bonus types absent from a chapter do not corrupt quota counters.

### Verification

- `node .work/scripts/test_skyfall.js` — passed. The harness parses and runs both inline scripts and covers world bounds/continuity at x=2,600, nine rocks, eight caves, all perch budgets, per-night quotas, HUD visibility, tutorial persistence, Free Mode gating, all A/B/C transitions, ordinary catch rewards, and ambush failure counts.
- `git diff --check` — passed for the implementation changes.
- Opened the local preview at a 520×555 viewport; confirmed the setup-to-prologue-to-level-map sequence and the scrollable level picker. The numerical regression checks confirm terrain continuity across the old world edge; the preview did not manually traverse the full gameplay route.

### Files

- `TideCatcher.html` — game implementation.
- `developer.md` — project change log and future-entry format.

---

## Entry 002 — Split Frontend and Backend Structure

**Date:** 2026-10-16

**Scope:** Extract the static game from one HTML file into separate frontend markup, styles, and ordered JavaScript modules while documenting the currently absent backend.

### Changes

- Moved game markup to `frontend/index.html`, CSS to `frontend/css/styles.css`, and the original JavaScript blocks to `frontend/js/customization.js` then `frontend/js/game.js` to preserve execution order.
- Added `backend/README.md` to state that the game currently has no server/API/database logic; no artificial backend process was introduced.
- Added root `index.html` and retained `TideCatcher.html` as forwarding entrypoints, preserving the Vercel root URL and existing legacy game URL.
- Added a root README with the static deployment layout and local preview instructions; updated the Sky-Fall QA harness to read the separated JS modules.

### Verification

- `node --check frontend/js/customization.js` and `node --check frontend/js/game.js` — passed.
- `node .work/scripts/test_skyfall.js` — passed for world continuity, perch budgets, Nights 1–7 quotas, HUD/tutorial, Free Mode gating, A/B/C sky-fall transitions, catch rewards, caves, and ambush failures.
- Python HTML/reference checks — passed; the frontend has no inline style/script blocks and both modules plus CSS resolve locally.
- Local HTTP checks for `/`, `/frontend/index.html`, CSS, both JS files, and `/TideCatcher.html` — all returned HTTP 200.
- Local browser preview — original start/customization screen rendered, with no browser console errors.

### Files

- `frontend/index.html`, `frontend/css/styles.css`, and `frontend/js/*.js` — separated static frontend.
- `backend/README.md` — backend status and future boundary.
- `index.html` and `TideCatcher.html` — root/legacy forwarding entrypoints.
- `README.md` and `developer.md` — project/developer documentation.

---

## Future entry template

## Entry NNN — Short descriptive title

**Date:** YYYY-MM-DD

**Scope:** One sentence describing the change.

### Changes

- What changed and why.
- Important gameplay, data, or compatibility decisions.

### Verification

- Tests, previews, and manual checks performed; include outcomes.

### Files

- List the files changed and their purpose.
