# TideCatcher level layouts

Each run loads one `LEVELS` record from `game/js/levels.js`. The existing place backgrounds, Moodling behavior, controls, score rules and map-specific rendering remain in `game.js`; the level record supplies world width, ground profile, fall pits, roosts, checkpoints, hide/burial markers, spawn zones, start and scenery props. `F2` draws a development-only geometry overlay when opened on `localhost` or `127.0.0.1` with `?debug=1`.

Legend: `=` walkable ground, `/` or `\\` slope/step, `v` lethal pit, `P` roost route, `~` water, `H` hide spot, `B` burial spot, `*` destination light. Shwe has three lives per story night; Gentle mode removes the life cost. Free Play falls cost five seconds. Sketches are schematic (not to scale); coordinates and authoritative geometry are in the data file.

Story nights only have roosts on every fifth level. Nights 1-4 also have optional `solidTops`: desks, shelves, chairs, the slide, a bench and stall roofs that Shwe can stand on. They are one-way scenery tops, not platforms, so they do not change the roost rule; each is reachable with one jump from the ground (or from the top below it) and hides a keepsake. Night 6 has a tide-pool keepsake by the jetty that only shows once the Mood Tide is low.

Story nights only have roosts on every fifth level. Levels 5, 10, 15, and so on contain pits that are wider than Shwe's unaided jump; each pit has exactly one moving roost bridge. All other story levels have continuous ground and no roost platforms.

## Night 1 — School hallway, width 2,500

```text
start -> H  B  P   B  H  P   B   P   B  P  H -> *
======== mild shallow rises / mostly flat tutorial floor ============
```

Short, gentle route with a safe continuous floor and no roost platforms. Books, school bags and lost-and-found-style burial objects are on open floor rather than inside desk or chair props.

## Night 2 — School hallway, width 3,323

```text
start -> P   P  H/B   P   B/H   [moving bridge over pit]  P -> *
====================|  dark school stairwell  |======================
```

The hallway remains a safe continuous-floor night with no pit and no roost platforms. It gives Shwe more room to practice before the first required bridge crossing on Night 5.

## Night 3 — Park, width 3,705

```text
start -> P   slide   P(bouncy)   H/B   P   swing   P   H/B   P -> *
terrain: gentle rolling hills and changing ground height
```

The park is a continuous-ground night with no roost platforms. Its scenery and Moodling route introduce the outdoor setting before the first pit night.

## Night 4 — Festival boardwalk, width 4,246

```text
start -> P  stall/H  P   lantern span   P   boat~moving~P   stall/H -> *
================== v water v ================ v water v =================
```

The festival boardwalk has no pits or roost platforms; its route stays on continuous boardwalk.

## Night 5 — Hilltop terraces

```text
start -> gate/H -> P -> bench step -> P(crumble) -> low rail/H -> branch P -> *
          _|￣￣|__|￣￣|__|￣￣|__|￣￣|__|￣￣|__|￣￣|__|￣￣|_
```

The familiar terrace profile has two cliff gaps. Each gap is five times the width of its single moving stone bridge and cannot be jumped across. These are the only roost platforms on the night.

## Night 6 — Lakeside

```text
start -> jetty -> P -> log~moving~P -> stepping stones -> P -> log~moving~P -> *
================== v lake v ================= v lake v ====================
```

The lakeside route stays on continuous ground with no pit and no roost platforms. Burial objects stay on shore.

## Night 7 — Sunrise, width 6,160

```text
start -> P -> raised/moving high route -> P(bouncy) -> P(crumble) -> moving P -> *
=========== hill rise =========== v ========== hill rise ================
           safe lower walking route under the higher platform chain
```

The long sunrise route has no pits or roost platforms. Extra checkpoints and place-fitting scenery make the finale forgiving.

## Free Play — three randomized trails

```text
Gentle:     rolling low hills, one pit five times wider than its moving log bridge
Stepping:   three pits, each five times wider than its moving log bridge
High route: one pit five times wider than its moving log bridge, higher platforms and branch/jetty scenery
Final world widths: 4,223, 4,518 and 4,380 units, respectively.
```

A new Free Play run chooses one of the three records; continuing a paused run does not re-roll its layout.

## Challenge routes — Levels 8–50

After the seven story nights, 43 challenge routes continue the campaign. Only every fifth level has pits and roosts; each pit is five times as wide as its single moving bridge. **Width cap (changed in late October):** pit nights have 2-5 pits (at most about 6,000 wide) and other nights are 4,500-5,500 wide. The old rule grew the pit count every pit night, up to 18, which also made non-pit nights very long (Night 49 was about 16,000 units of empty floor), so the count now never drops but stops at 5. Bridge speed still rises by level.

Each night is built from a seeded random number generator, so it is identical on every load. The ground rolls gently (at most 16 units, kept flat within 140 of every pit). Hide and dig spots (4-8 each) are picked from safe ground at least 300 apart, clear of pits, checkpoints, props and the secret room. Nights without a twist get 1-3 hazards that fit the map (school squeak, park sprinkler, festival and market lanterns, hill and rooftop wind, lake puddles, pagoda and garden bells, train squeak), at least 110 from any pit.

## Reachability and safety

The dependency-free regression tests are `node tests/game-layouts.test.js`, `tests/endless-layouts.test.js` and `tests/solid-tops.test.js`. It checks the 50 story layouts and three Free Play variants, including the every-fifth-level pit schedule, no roosts on other story nights, one moving bridge per pit, gaps too wide for Shwe to jump, spawn-zone exclusion, hide/burial/start/checkpoint clearance, and platform reach against the configured jump settings (`jumpSpeed=830`, `gravity=2300`).
