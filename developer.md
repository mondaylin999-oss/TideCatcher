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
