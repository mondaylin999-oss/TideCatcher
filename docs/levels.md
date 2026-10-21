# TideCatcher level layouts

Each run loads one `LEVELS` record from `frontend/js/levels.js`. The existing place backgrounds, Moodling behavior, controls, score rules and map-specific rendering remain in `game.js`; the level record supplies world width, ground profile, fall pits, roosts, checkpoints, hide/burial markers, spawn zones, start and scenery props. `F2` draws a development-only geometry overlay when opened on `localhost` or `127.0.0.1` with `?debug=1`.

Legend: `=` walkable ground, `/` or `\\` slope/step, `v` lethal pit, `P` roost route, `~` water, `H` hide spot, `B` burial spot, `*` destination light. Shwe has three lives per story night; Gentle mode removes the life cost. Free Play falls cost five seconds. Sketches are schematic (not to scale); coordinates and authoritative geometry are in the data file.

## Night 1 — School hallway, width 2,500

```text
start -> H  B  P   B  H  P   B   P   B  P  H -> *
======== mild shallow rises / mostly flat tutorial floor ============
```

Short, gentle route with low static shelves and roomy spawn lanes. Books, school bags and lost-and-found-style burial objects are on open floor rather than inside desk or chair props.

## Night 2 — School hallway, width 3,323

```text
start -> P   P  H/B   P   B/H   [moving bridge over pit]  P -> *
====================|  dark school stairwell  |======================
```

A longer hallway adds the first fall pit, 3.25 times wider than its moving bridge. The gap is too wide to jump across without the bridge. A lantern checkpoint sits before the gap, and the first approach explains that Shwe can fall.

## Night 3 — Park, width 3,705

```text
start -> P   slide   P(bouncy)   H/B   P   swing   P   H/B   P -> *
terrain: gentle rolling hills and changing ground height
```

The park adds two ravine pits, each 3.5 times wider than its moving bridge, bouncy ledges, a slide and bushes. Neighboring roosts stay separate from the bridge paths. Lantern checkpoints precede the harder crossings. Hiding and burial markers stay on walkable ground.

## Night 4 — Festival boardwalk, width 4,246

```text
start -> P  stall/H  P   lantern span   P   boat~moving~P   stall/H -> *
================== v water v ================ v water v =================
```

The boardwalk introduces three water gaps, each 3.75 times wider than its moving boat bridge. Lantern checkpoints sit before each gap. Bamboo baskets, clay pots and folded mats are on dry boardwalk only.

## Night 5 — Hilltop terraces, width 4,395

```text
start -> gate/H -> P -> bench step -> P(crumble) -> low rail/H -> branch P -> *
          _|￣￣|__|￣￣|__|￣￣|__|￣￣|__|￣￣|__|￣￣|__|￣￣|_
```

The familiar 1,400-unit terrace profile repeats three times to fit the longer level. Cliff gaps are four times wider than their moving stone bridges; crumbling steps shake for 0.6 seconds, fall, then return after three seconds.

## Night 6 — Lakeside, width 4,416

```text
start -> jetty -> P -> log~moving~P -> stepping stones -> P -> log~moving~P -> *
================== v lake v ================= v lake v ====================
```

A calm shore route introduces three lake gaps, each 4.5 times wider than its moving log bridge, plus jetties and a swinging lantern that Shwe can hold and release to launch. Burial objects stay on shore.

## Night 7 — Sunrise, width 6,160

```text
start -> P -> raised/moving high route -> P(bouncy) -> P(crumble) -> moving P -> *
=========== hill rise =========== v ========== hill rise ================
           safe lower walking route under the higher platform chain
```

The longest route combines slopes, four water gaps, each five times wider than its moving log bridge, a swinging lantern, a bouncy platform, a crumbling step and place-fitting props. Extra checkpoints make the finale more forgiving.

## Free Play — three randomized trails

```text
Gentle:     rolling low hills, one pit 3.25 times wider than its moving log bridge
Stepping:   three pits, each four times wider than its moving log bridge
High route: one pit five times wider than its moving log bridge, higher platforms and branch/jetty scenery
Final world widths: 4,223, 4,518 and 4,380 units, respectively.
```

A new Free Play run chooses one of the three records; continuing a paused run does not re-roll its layout.

## Challenge routes — Levels 8–50

After the seven story nights, 43 challenge routes continue the same cozy campaign and rotate through the five map settings. Their Moodling requirements and behavior stay at the established finale rules; the added challenge comes from platforming. Every pit is five times as wide as its moving bridge. Pit counts rise from four on Level 8 to eighteen on Level 50, bridge speed rises each level, and the route adds crumbling roosts, bouncy ledges and occasional swinging lanterns. Checkpoints become more frequent in the later routes to keep long runs fair. Difficulty data is generated deterministically, so each level keeps its layout when replayed.

## Reachability and safety

The dependency-free regression test is `node tests/level-layouts.test.js`. It checks all 50 story layouts and all three Free Play variants: pit bounds and jump spans, spawn-zone exclusion, hide/burial/start/checkpoint clearance, burial-marker clearance from props/platforms (including moving paths), supported platform types, platform path bounds and reach against each chapter's jump settings (`jumpSpeed=830`, `gravity=2300`, approximately 150 px maximum rise). Pits are too wide for a running jump; moving bridges provide the crossings.
