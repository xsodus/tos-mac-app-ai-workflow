---
name: launch-tree-of-savior-m-extreme
description: Launch and operate Tree of Savior M Extreme on macOS using Spotlight and visual Computer Use. Use when the user wants to open this specific game, pass the title/server screen, start or resume a session from the barrack screen, select a character, ensure a fellow/companion is present when possible, or loop through main and sub quests until there are no visible quests left.
---

# Launch Tree Of Savior M Extreme

## When To Use

Use this skill when the goal is to open `Tree of Savior M Extreme` from the keyboard on macOS, move through the title/server screen into the barrack screen, or keep playing visible main and sub quests until the quest list is exhausted.

The install on this machine is an iOS-on-Mac wrapper. Spotlight can surface the app, but path-based `open` commands against the top-level container or nested `Wrapper/TOSM TH.app` bundle may be rejected by LaunchServices.

## Workflow

### Controller Contract

Run the TypeScript controller from the repository root:

```bash
cd /Users/akkaponsomjai/personal/tos-mac-app-ai-workflow
pnpm tos doctor
```

The controller is the primary keyboard, pointer, and screenshot interface for
this skill. Before launch, require both `accessibility` and `screenRecording` to
be `true`. If either is false, stop and tell the user which macOS permission is
missing; do not pretend the live loop ran.

Available commands:

```bash
pnpm tos launch
pnpm tos focus
pnpm tos window-screenshot artifacts/tos-current.png
pnpm tos window-click <image-x> <image-y> artifacts/tos-current.png
pnpm tos key <macOS-key-code> [command|control|option|shift ...]
```

Use `window-screenshot`, not a whole-desktop screenshot, for game decisions. It
returns the game window bounds, pixel dimensions, and an image whose top-left
corner is `(0, 0)`. Calculate every click in pixels from that current image, then
pass the pixel point and image path to `window-click`. The controller handles
Retina scaling, translates the result to the correct global point, and injects
the click through Core Graphics even when the game is on a monitor above or to
the left of the primary display.

After every state-changing input, capture a fresh window screenshot and inspect
it before choosing the next input. Never reuse coordinates from a previous
window size.

### Launch

1. Run `pnpm tos launch` to open Spotlight, type the exact app name, press Return,
   wait for the game process, and bring its window to the front.
2. If the full title is not resolving, run `pnpm tos launch "TOSM TH"`.
3. If multiple results appear, select the application result, not a document or web suggestion.
4. Capture a window screenshot and confirm the title screen appears.
6. If Spotlight does not show the app, refine the query with more of the title. Do not rely on `open` with the app path as the primary fallback for this wrapper.

### Title Screen

1. If the game opens on the title/server screen, keep the default server unless the user asked for a different one.
2. Click or tap the main title screen area to enter the game.
3. If the title screen returns after a timeout, repeat the same click-to-enter step before looking for deeper UI.

### Quest Loop

Use controller screenshots for visual decisions and controller click/key commands
for interaction with the game UI.

1. If the app is not frontmost, run the launch workflow first.
2. If the game is on the barrack screen, click the visible `Start` button to enter the session.
3. On the character screen, select the available or previously used character, then activate the visible enter/start control.
4. Once in game, inspect the quest tracker and nearby objective markers.
5. Check whether a fellow/companion is present before running objectives. If no fellow is visible, use the fellow/companion menu, summon control, or visible fellow prompt to deploy an available fellow.
6. If the game offers multiple fellows, choose the previously used or clearly recommended fellow. Do not purchase, fuse, dismiss, delete, or upgrade fellows unless the user explicitly asks.
7. If no fellow can be safely selected, continue the quest loop without one and mention that no fellow was available.
8. Prioritize main quests first, then sub quests. Follow the visible quest prompt, auto-path button, objective marker, or dialogue/action control provided by the game UI.
9. When dialogue first appears, inspect the visible auto-talk control. If it is
   `None` or off, click its slider once and confirm it displays a timed interval
   such as `6 seconds`. Leave auto-talk enabled for the rest of the loop so
   dialogue pages advance without blocking.
10. When a normal quest-completion reward dialog appears, click the teal
    `ตอบรับ` (Accept) button. Do not click `ปฏิเสธ` (Decline). This permission
    applies only to ordinary quest rewards and does not authorize purchases or
    premium-currency choices.
11. After each quest interaction, wait for the next clear state: movement finished, dialogue advanced, reward accepted, combat resolved, or a new objective displayed.
12. Re-check for a fellow after session recovery, map changes, or character reloads. If the fellow disappears, repeat the fellow check before continuing quests.
13. Repeat until neither main nor sub quest entries are visible and no quest objective marker or quest action prompt remains.
14. Stop the loop when no quests are visible. Report that the quest list appears exhausted.

Do not report completion unless the final screenshot visibly confirms that no
main quest, sub quest, objective marker, or quest action prompt remains.

### Timeout Recovery

If the session times out, disconnects, returns to title, or gets stuck on a loading/session screen:

1. Return to the launch/start flow.
2. Touch/click to start the game.
3. Select the character again if prompted.
4. Resume the quest loop.

Stop retrying if the same timeout or loading failure repeats three times without reaching the character or in-game screen.

## Notes

- Use this workflow for the specific game, not as a generic app-launch pattern.
- Favor the exact app title when available, since it avoids ambiguity in Spotlight.
- This installation uses a wrapper; the nested bundle lives at `Tree of Savior M Extreme.app/Wrapper/TOSM TH.app`, but direct `open` can fail with `incorrect executable format`.
- Treat the visible game window title as the success check.
- Treat the title/server screen as a real pre-game state, not as launch failure.
- Treat the barrack screen as the handoff point into the session via `Start`.
- Keep a fellow/companion active when the UI provides a safe summon or deploy action.
- Stop rather than inventing objectives when the quest tracker is empty or ambiguous.
- Do not spend premium currency, delete items, change account settings, or make irreversible choices unless the user explicitly asks.
