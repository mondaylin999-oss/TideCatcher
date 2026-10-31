# TideCatcher — README

**Digit7 Jam 2026 · Team NextCrown**

## 1. Game title
TideCatcher

## 2. Team name
NextCrown

## 3. Main contact person
_TEAM TO FILL: name, email, phone_

## 4. Short game description
When Thiri falls asleep with a heavy heart after losing a drawing contest, her little feelings (Moodlings) run away into the night. You play Shwe, her cat, and bring them home before sunrise. Each feeling is caught in its own way: dodge Frustrated's charge, sneak up on Nervous, sit beside Lonely, freeze when Shy looks back, catch Excited at the top of its bounce, dig up buried feelings with Night Eyes.

- **Story:** 7 levels (11 PM to sunrise), each in a new place: school, park, lighting festival, hilltop, lakeside, sunrise. Thiri's room gets its colour back as you go, and the morning ending plays after Level 7.
- **After the story:** Levels 8–50 (pick one of three level cards), Free Play, the Heart Workshop (mix feelings into new ones), Lantern Town, the Mood Book (62 pages), keepsakes, daily tasks, 8 cat breeds and treats.

## 5. How to open and play the game
- **Online:** open the playable link: _TEAM TO FILL: Digit7 hosting URL_
- **From the build ZIP:** unzip and open `index.html` in a browser, or serve the folder (`python -m http.server 8000`, then open `http://localhost:8000/`).
- **From the repository:** double-click `TideCatcher.html` (it opens `game/index.html`).
- Press **Play**, pick names for the girl and the cat, watch the short intro, then choose **Story Mode** in Thiri's room.

## 6. Supported browsers
Current versions of Chrome, Edge, Firefox and Safari (desktop and mobile). Tested mostly in Chrome and Firefox.

## 7. Supported devices
- Windows and macOS laptops and desktops (keyboard).
- Android and iOS phones and tablets (touch), in landscape.

## 8. Controls and gameplay instructions
| Action | Keyboard | Touch |
|---|---|---|
| Move | ← → or A D | Joystick (left side) |
| Jump | Space, ↑ or W | Jump button |
| Sneak (hold) | Shift | Push the joystick a little |
| Pounce / catch | J or X | Pounce button |
| Night Eyes | E or L | Eyes button |
| Scratch (dig, hiding spots) | S | Scratch button |
| Purr | K | Purr button |
| Go home (moon door) | H | Go home button |
| Notes on/off | N | Pause menu |
| Pause | P | Pause button |

Keys can be changed in Settings → Controls. Touch buttons can be moved, resized and made brighter or dimmer.

**Goal of each level:** catch the feelings shown in the counters at the top right before the clock runs out, then walk through the moon door. Hidden keepsakes, paper stars and secret rooms are optional. How to Play (corkboard in Thiri's room) has a short clip for every Moodling, and a button tour explains the home screen and the pause menu.

## 9. Known bugs or limitations
- Phones and tablets are landscape only; in portrait the game pauses and asks you to turn the device.
- Opened straight from a file (double-click), some browsers limit audio, so music plays through a simpler path. Hosting the folder gives the full audio mix.
- Myanmar language covers the tips, welcome cards and button tour; some other screens are still in English.
- _TEAM TO FILL: anything found in final playtesting._

## 10. Third-party tools or libraries used
- No game engine or JavaScript library. Plain HTML, CSS and JavaScript (Canvas 2D, Web Audio API).
- Google Fonts: Fredoka, Nunito, Padauk (loaded online; the game falls back to system fonts offline). Gaegu is self-hosted in `game/assets/fonts/`. All under the SIL Open Font License.
- Asset tools: Python (Pillow, OpenCV, NumPy, SciPy) for image cut-outs and audio synthesis; Real-ESRGAN (open-source upscaler) for some backgrounds; ffmpeg for audio/video conversion.

## 11. Asset credit summary
- **Cat sounds** (meow, purr, sad mew): Kerzoven, *Cat Purr & Meow*, OpenGameArt, CC0 1.0.
- **Music:** five original night pieces synthesised in code by the team (`docs/proof/audio/`).
- **Moodling voices and sound effects:** original, synthesised in code.
- **Backgrounds:** school, park and festival backgrounds started from ChatGPT images and were edited for the game; the hilltop and lakeside maps are drawn in code; Thiri's bedroom is the team's design. See `docs/proof/`.
- **Cats, Moodlings, intro scenes:** see `CREDITS.md` and `AI-DECLARATION.md`.

## 12. Special testing instructions
- `TideCatcher-TEST.html` (or `game/index.html?test=1`) opens a **test mode**: every level unlocked, unlimited Glow, all cats and treats. It does not touch normal saves.
- Progress is saved in the browser (localStorage). To start fresh, use the reset button in Thiri's room or clear site data.
- Automated checks: `for f in tests/*.test.js; do node "$f"; done` (Node 18+).
- Add `?debug=1` on localhost and press F2 for the level geometry overlay.

## 13. Recommended orientation, resolution and aspect ratio
Landscape, 16:9. Recommended 1280 × 720 or larger on desktop. On phones, any landscape screen from 640 × 360 up. Keyboard on desktop, touch on phones and tablets.

## 14. Internet connection, external API or third-party services
The game runs fully in the browser with no server, account, analytics or tracking. The only online request is Google Fonts; without internet the game still works with fallback fonts.

## 15. AI tools used
Claude (Anthropic) was used for most of the code, level tools and tests, plus art editing and the story text; ChatGPT (OpenAI) generated three starting background images; Real-ESRGAN upscaled some art. Full list, with the code and assets affected, in [`AI-DECLARATION.md`](AI-DECLARATION.md).

## 16. Private repository access and submission commit/tag
- Repository: `github.com/mondaylin999-oss/TideCatcher` (private). Reviewer access: _TEAM TO FILL: who to invite / how access was granted_.
- Submission tag: `v1.0.0-jam` _(TEAM TO FILL: the commit hash after tagging)_.

## 17. Build version
TideCatcher v1.0.0 (Digit7 Jam 2026 submission build), 31 October 2026.
