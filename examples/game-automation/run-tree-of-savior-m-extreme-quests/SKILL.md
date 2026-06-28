---
name: run-tree-of-savior-m-extreme-quests
description: Run visible main and sub quests in Tree of Savior M Extreme on macOS using visual Computer Use until no quests remain. Use when the user wants to continue, resume, or complete TOS M Extreme quests; launch and session-entry steps are only setup or recovery for reaching the quest loop.
---

# Run Tree Of Savior M Extreme Quests

> Example only. Verify compliance with software Terms of Service before use.

## When To Use

Use this skill when the goal is to keep playing visible main and sub quests in
`Tree of Savior M Extreme` until the quest list is exhausted. Launch, title
screen, barrack, and character-selection actions exist only to reach or recover
the active quest session.

The game may be installed as an iOS-on-Mac wrapper. Spotlight can surface the
app even when LaunchServices rejects path-based `open` commands against the
top-level container or nested `Wrapper/TOSM TH.app` bundle.

## Workflow

### Controller Contract

Run the TypeScript controller from the repository root. Resolve that root from
the current Git worktree; never assume a user name or an absolute checkout
location:

```bash
cd "$(git rev-parse --show-toplevel)"
pnpm workflow doctor
```

If the current directory is not inside the controller repository, first locate
the checkout containing this skill, `package.json`, and `src/cli.ts`, then run
the commands from that checkout's root.

The controller is the primary keyboard, pointer, and screenshot interface for
this skill. Before launch, require both `accessibility` and `screenRecording` to
be `true`. If either is false, stop and tell the user which macOS permission is
missing; do not pretend the live loop ran.

Available commands:

```bash
pnpm workflow launch "Tree of Savior M Extreme" "TOSM TH"
pnpm workflow focus "TOSM TH"
pnpm workflow window-screenshot artifacts/tos-current.png "TOSM TH"
pnpm workflow window-click <image-x> <image-y> artifacts/tos-current.png "TOSM TH"
pnpm workflow key <macOS-key-code> [command|control|option|shift ...]
pnpm workflow loop-reset
pnpm workflow loop-observe <idle|activity> artifacts/tos-current.png
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

Run `pnpm workflow loop-reset` once before entering the quest loop. After inspecting
every fresh screenshot, run `loop-observe activity` if any quest,
objective, dialogue, reward, loading, combat, transition, or recovery state is
visible. Run `loop-observe idle` only for an idle, unobstructed in-game
screen with none of those states. The command persists `empty_state_count`,
rejects reused or insufficiently separated empty screenshots, and returns
`mustContinue: true` until three valid empty observations have accumulated.
Never send a final response while it returns `mustContinue: true`.

### Launch

1. Run `pnpm workflow launch "Tree of Savior M Extreme" "TOSM TH"` to open Spotlight, type the exact app name, press Return,
   wait for the game process, and bring its window to the front.
2. If the full title is not resolving, run `pnpm workflow launch "TOSM TH" "TOSM TH"`.
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

This is a persistent loop. Do not return control to the user after launching,
entering the game, accepting one reward, or starting one objective. Continue
capturing and acting until the explicit exhaustion check below succeeds.

1. If the app is not frontmost, run the launch workflow first.
   A `TOSM TH` process with no window does not count as running: relaunch it.
2. If the game is on the barrack screen, click the visible `Start` button to enter the session.
3. On the character screen, select the available or previously used character, then activate the visible enter/start control.
4. Once in game, inspect the quest tracker and nearby objective markers.
5. Check whether fellows are deployed before running objectives. The circular
   portraits beside the skill bar do not prove that fellows occupy the active
   team. Open `Fellow` with the fourth icon in the top-right menu row and inspect
   the two team slots in the lower-right `จัดทีม` panel.
6. Fill both empty team slots when two safe fellows are available. Select the
   previously used, highest-level, or clearly recommended fellow, click `Join`,
   click the intended `+` team slot, then confirm `ร่วมทาง` in the notification.
   Joining deducts one point from that fellow's stamina; this is normal
   deployment, not a purchase. Repeat for the second slot and verify that both
   slots show fellow cards before closing the screen.
7. Do not treat the selected fellow's large center model or the bottom roster as
   deployed-state evidence. Do not click `Remove`, purchase, fuse, dismiss,
   delete, or upgrade fellows unless the user explicitly asks. If fewer than two
   fellows can be safely selected, deploy the available fellow and continue.
8. Before activating each new main or sub quest, inspect the first slot in the
   top row at the left edge of the skill bar. This is the configurable
   auto-potion slot. A potion marked with a Roman numeral I–VI and a positive
   quantity is the assigned stack; for example, `IV` with `131` means Potion IV
   is assigned with 131 remaining. Do not confuse the lower red-outlined
   utility slots with auto-potion slots.
9. Do not click the assigned potion merely to verify it: clicking the potion
   consumes one immediately. Preserve a visible existing assignment. Only open
   configuration when the first top-row slot is empty or its automatic-use
   state is ambiguous; then assign an available I–VI potion, confirm a positive
   quantity, and preserve the existing trigger threshold. If the threshold is
   unset, use the game's default or clearly recommended value. Do not buy
   potions or spend currency. Capture a fresh screenshot after any change and
   verify the first top-row slot before closing the controls.
10. Re-run the auto-potion check even if it passed for the previous quest.
   Re-check it after recovery, character reload, or any map/session transition.
   Do not activate the new quest until the check passes. Use potions already in
   inventory; do not buy potions or spend currency without explicit permission.
11. Prioritize main quests first, then sub quests. A visible quest tracker entry
   is not necessarily active, even when unrelated auto-combat is running. Click
   the highest-priority visible quest entry to activate it, capture a fresh
   screenshot, and confirm that auto-path, dialogue, an objective marker, or
   another quest-specific state begins. If it does not activate, click the next
   visible quest entry and verify again.
11. When dialogue first appears, inspect the visible auto-talk control. If it is
   `None` or off, click its slider once and confirm it displays a timed interval
   such as `6 seconds`. Leave auto-talk enabled for the rest of the loop so
   dialogue pages advance without blocking.
12. Treat a normal quest-completion reward dialog as the highest-priority
    actionable state. Immediately click the teal `ตอบรับ` (Accept) button
    before waiting, relaunching, or interacting with the quest tracker. Do not
    click `ปฏิเสธ` (Decline). This permission applies only to ordinary quest
    rewards and does not authorize purchases or premium-currency choices.
13. Immediately after accepting a reward, capture a fresh screenshot. Before
    clicking the next visible main or sub quest, complete the auto-potion check
    again. Accepting a reward is never a stopping condition.
14. While dialogue with auto-talk is active, wait only 5 through 8 seconds,
    capture a fresh screenshot, and immediately accept any resulting `ตอบรับ`
    reward dialog. While verified quest auto-path, quest combat, loading, or an
    objective animation is visibly progressing, choose a new random wait from
    15 through 60 seconds, wait that duration, capture a fresh screenshot, and
    continue the loop. Do not repeatedly click the tracker while verified quest
    progress is active. Generic auto-combat without a quest-specific indicator
    does not count as verified quest progress.
15. If any quest tracker entry is visible and no verified quest progress is
    active, first pass the auto-potion check, then click the highest-priority
    visible entry: main quest first, then sub quest. Do this even if the
    character is fighting nearby enemies. Capture a fresh screenshot after
    every click and activate the next visible entry if the first one does not
    start a quest-specific state.
16. Re-check for a fellow after session recovery, map changes, or character
    reloads. If the fellow disappears, repeat the fellow check before continuing
    quests.
17. Never infer exhaustion from a hidden tracker during combat, dialogue,
    loading, a reward dialog, a transition, or a cinematic.
18. Count an empty state only when a fresh screenshot shows an idle,
    unobstructed in-game UI with no main quest, sub quest, objective marker, or
    quest action prompt. Require three empty states, each separated by 5
    seconds. Reset the count to zero whenever any quest or progress state
    appears.
19. Stop only after the third consecutive confirmed empty state. Report that
    the quest list appears exhausted.

Use this literal control structure; a status update never exits it:

```text
empty_state_count = 0
while empty_state_count < 3:
    capture and inspect a fresh game-window screenshot
    record it with loop-observe
    if empty and idle: wait 5 seconds
    else: reset the count and handle the highest-priority state
```

Do not report completion unless three final screenshots visibly confirm that no
main quest, sub quest, objective marker, or quest action prompt remains.

### Timeout Recovery

If the session times out, disconnects, returns to title, or gets stuck on a loading/session screen:

1. If a controller screenshot fails because the `TOSM TH` window or process is
   temporarily unavailable, run `pnpm workflow launch "Tree of Savior M Extreme" "TOSM TH"`, capture a fresh screenshot,
   and inspect the recovered state before counting a retry.
2. If the recovered state contains a `ตอบรับ` reward dialog, click it
   immediately and resume the quest loop. Do not classify the interruption as
   a repeated loading failure.
3. Otherwise return to the launch/start flow.
4. Touch/click to start the game.
5. Select the character again if prompted.
6. Resume the quest loop.

Keep running recovery while a timeout, loading, or pre-game state remains
visible. Repeated recovery states are not quest exhaustion and cannot authorize
a final response.

## Notes

- Use this workflow for the specific game, not as a generic app-launch pattern.
- Favor the exact app title when available, since it avoids ambiguity in Spotlight.
- A wrapper installation may contain the nested bundle at `Tree of Savior M Extreme.app/Wrapper/TOSM TH.app`; direct `open` can fail with `incorrect executable format`.
- Treat the visible game window title as the success check.
- Treat the title/server screen as a real pre-game state, not as launch failure.
- Treat the barrack screen as the handoff point into the session via `Start`.
- Keep a fellow/companion active when the UI provides a safe summon or deploy action.
- Treat an empty or ambiguous tracker as non-terminal until the three-screenshot
  exhaustion check succeeds. Do not invent an objective; capture again and
  continue the loop.
- Do not spend premium currency, delete items, change account settings, or make irreversible choices unless the user explicitly asks.
