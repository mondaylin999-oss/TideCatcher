# TideCatcher level layouts

Each run loads one `LEVELS` record from `frontend/js/levels.js`. The existing place backgrounds, Moodling behavior, controls, score rules and map-specific rendering remain in `game.js`; the level record now supplies world width, ground profile, safe drop pits, platforms, hide/burial markers, spawn zones, start and scenery props. `F2` draws a development-only geometry overlay when opened on `localhost` or `127.0.0.1` with `?debug=1`.

Legend: `=` walkable ground, `/` or `\\` slope/step, `v` safe drop to a lower floor and back, `P` platform route, `~` water, `H` hide spot, `B` burial spot, `*` destination light. Sketches are schematic (not to scale); coordinates and authoritative geometry are in the data file.

## Night 1 — School hallway, width 2,500

```text
start -> H  B  P   B  H  P   B   P   B  P  H -> *
======== mild shallow rises / mostly flat tutorial floor ============
```

Short, gentle route with low static shelves and roomy spawn lanes. Books, school bags and lost-and-found-style burial objects are on open floor rather than inside desk or chair props.

## Night 2 — School hallway, width 3,300

```text
start -> P   P  H/B   P~moving~P   B/H   P   P   H/B  P -> *
==================\\__ safe lower-floor drop __/====================
```

A longer two-height hallway adds a first short safe pit, varied shelf spacing and a moving shelf. The lower floor is a walkable recovery path; there is no lethal fall.

## Night 3 — Park, width 3,600

```text
start -> P   slide   P(bouncy)   H/B   P   swing   P   H/B   P -> *
terrain: gentle rolling hills and changing ground height
```

The park adds low hills, a slide, bouncy bench-like platforms, swings and bushes. Hiding and burial markers are placed on walkable ground and kept clear of playground props.

## Night 4 — Festival boardwalk, width 4,000

```text
start -> P  stall/H  P   lantern span   P   boat~moving~P   stall/H -> *
================== v water v ================ v water v =================
```

The boardwalk introduces three short water gaps with safe lower floors, a moving boat over a gap, raised platforms and festival stalls/lanterns. Bamboo baskets, clay pots and folded mats are on dry boardwalk only.

## Night 5 — Hilltop terraces, width 4,200

```text
start -> gate/H -> P -> bench step -> P(crumble) -> low rail/H -> branch P -> *
          _|￣￣|__|￣￣|__|￣￣|__|￣￣|__|￣￣|__|￣￣|__|￣￣|_
```

The familiar 1,400-unit terrace profile repeats three times to fit the longer level. Stone ledges and tree branches create alternate jumps; one low stone step crumbles after a landing and returns after a short rest.

## Night 6 — Lakeside, width 3,900

```text
start -> jetty -> P -> log~moving~P -> stepping stones -> P -> log~moving~P -> *
================== v lake v ================= v lake v ====================
```

A calm shore route introduces three short safe lake drops, jetties, stepping stones and two moving floating logs. Burial objects stay on the shore, away from the logs and water.

## Night 7 — Sunrise, width 5,400

```text
start -> P -> raised/moving high route -> P(bouncy) -> P(crumble) -> moving P -> *
=========== hill rise =========== v ========== hill rise ================
           safe lower walking route under the higher platform chain
```

The longest route combines slopes, four safe drops, moving platforms, a bouncy platform, a crumbling step and place-fitting props. The raised platform chain is quicker but asks for more jumps; the ground route remains the safer, slower option.

## Free Play — three randomized trails, width 4,200 each

```text
Gentle:     rolling low hills, static shelves, widely spaced markers
Stepping:   three safe lower-floor drops, alternating static platforms, one jetty/log/stones set
High route: repeated higher platforms with branch, slide and jetty scenery
```

A new Free Play run chooses one of the three records; continuing a paused run does not re-roll its layout.

## Reachability and safety

The dependency-free regression test is `node tests/level-layouts.test.js`. It checks all seven story layouts and all three Free Play variants: ground-point order and bounds, every configured drop width and lower-floor height, spawn-zone exclusion of pits, all spots and starts in bounds and out of pits, burial-marker clearance from props/platforms (including moving prop/platform paths), valid platform types and path bounds, and platform rise against the current cat jump envelope (`jumpSpeed=830`, `gravity=2300`, approximately 150 px maximum rise). Configured gaps are capped at 360 px, with the test treating them as jump/pounce assisted spans; the authored gaps are shorter and also provide a lower walkable floor.
