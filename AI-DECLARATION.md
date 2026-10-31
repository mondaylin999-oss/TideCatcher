# AI declaration

TideCatcher was made by the NextCrown team for Digit7 Jam 2026 (1–31 Oct 2026). This file lists every AI tool used, what it was used for, and which code and assets it affected. The team came up with the game, made the final decisions, tested every change and directed all AI work.

## Claude (Anthropic): main assistant
Used through Claude and Claude Code across the whole project.

| Area | What Claude did | Affected files | What the team did |
|---|---|---|---|
| Game idea and story | Helped write the story outline, chapter plan, intro and ending dialogue, tips and UI text | `game/js/game.js` (INTRO_LINES, ENDING_LINES, chapter text), `game/js/tips.js` | Came up with the concept and story, chose the direction, made final decisions |
| Core gameplay code | Wrote most of the JavaScript: movement and physics, Moodling behaviours, bosses, levels, Endless Nights 8–50, Free Play, Heart Workshop and Lantern Town, Mood Book, shop, missions, saves | `game/js/*.js` | Designed the rules and Moodling behaviours, playtested, reported bugs, chose what shipped |
| Late features | Story-level heights (`solidTops`), Nights 8–50 width cap, rolling ground, seeded hide/dig spots and map hazards, daily tasks checklist, button tour, catch clips | `game/js/levels.js`, `game/js/button-tour.js`, `game/js/game.js` | Asked for the features, tested them on their own devices |
| Mobile and polish | Responsive layout, touch controls, zoom guard, sound start, performance and visual fixes | `game/css/mobile-fit.css`, `game/index.html`, `game/js/tc-sfx.js`, `game/js/tc-game-audio.js` | Tested on phones, tablets and laptops |
| Tests and level tools | Wrote the automated tests and reachability checks | `tests/*.test.js` | Ran them before each commit |
| Cat sprites | Cut out, recoloured, made "chibi" and animated the 8 cats | `game/assets/cats/`, `game/js/customization.js`, `docs/proof/cats/` | Supplied the source sheet, chose the breeds, gave feedback |
| Moodling art | Designed the vector art for the Moodlings | `game/js/moodling-art.js`, `docs/proof/moodlings/` | Defined each feeling, colour and behaviour |
| Intro scenes | Edited 4 of the 8 opening images and built the cutscene | `game/assets/intro/`, `docs/proof/intro-scenes/` | Made or supplied the base images |
| Bedroom and Thiri | Upscaled and regraded the room, cut Thiri's six sleeping poses from the team's painting and made small edits | `game/assets/home/`, `docs/proof/bedroom/` | Designed the room and the girl |
| Maps | Drew the hilltop and lakeside maps in code; edited the school, park and festival backgrounds | `game/js/*places*.js`, `game/assets/`, `docs/proof/*-map/` | Designed the level layouts, platforms and hiding places |
| Audio | Wrote the Python scripts that synthesise the music and Moodling sounds (no AI audio model) | `docs/proof/audio/*.py`, `game/assets/audio/` | Chose the mood of each piece |
| Designer briefs, team logo | Made instruction pictures for designers; helped design the NextCrown logo | `docs/design/`, `docs/brand/` | Chose the direction |
| Documentation | Helped write README, CHANGES, level notes and this file | `*.md`, `docs/` | Checked and approved them |

## Other tools
- **ChatGPT (OpenAI):** generated the starting images for the night park, the lighting festival landscape and the first school hallway (see `docs/proof/park-map/`, `festival-map/`, `school-map/`). Claude then edited them for the game.
- **Real-ESRGAN** (open-source AI upscaler, anime model): sharpened the park, festival and bedroom backgrounds.
- _TEAM TO FILL: the tool used for the 8-cat source sheet and the intro base images (or "drawn by hand by …")._
- **Manus** (AI agent): ran and checked the game in a browser during development and helped with code changes.

## Not made with AI
- Cat sounds: recorded by Kerzoven (CC0, OpenGameArt).
