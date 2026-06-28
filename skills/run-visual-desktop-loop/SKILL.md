---
name: run-visual-desktop-loop
description: Run a screenshot-driven desktop workflow on macOS using an observe-decide-act-verify loop. Use when the user wants to process repetitive UI tasks, monitor a dashboard, or work through a queue with explicit verification after each action.
---

# Run Visual Desktop Loop

## When To Use

Use this skill when the goal is to operate a desktop application through fresh
visual observations instead of a brittle fixed script.

Typical use cases:

- inbox processing
- repetitive data entry
- dashboard checks
- queue-based review workflows

## Workflow

### Controller Contract

Run the TypeScript controller from the repository root:

```bash
cd "$(git rev-parse --show-toplevel)"
pnpm workflow doctor
```

Continue only when both `accessibility` and `screenRecording` are `true`.

Available commands:

```bash
pnpm workflow launch <Spotlight-query> [process-name]
pnpm workflow focus <process-name>
pnpm workflow window-screenshot artifacts/current-window.png <process-name>
pnpm workflow window-click <image-x> <image-y> artifacts/current-window.png <process-name>
pnpm workflow key <macOS-key-code> [command|control|option|shift ...]
pnpm workflow loop-reset
pnpm workflow loop-observe <idle|activity> artifacts/current-window.png
```

Use `window-screenshot`, not a whole-desktop screenshot, for workflow
decisions. After every state-changing input, capture a fresh screenshot and
inspect it before choosing the next action.

Run `pnpm workflow loop-reset` once before entering the main loop. After
inspecting every fresh screenshot:

- run `loop-observe activity` when work, progress, loading, or a modal is visible
- run `loop-observe idle` only when the window is unobstructed and no actionable
  work remains

Never report completion while `mustContinue` is `true`.

### Core Loop

Use this literal control structure:

```text
idle_count = 0
while idle_count < 3:
    capture and inspect a fresh window screenshot
    classify the visible state
    record it with loop-observe
    if actionable work is visible:
        perform exactly one highest-priority action
    elif progress is visible:
        wait briefly and re-check
    else:
        wait 5 seconds before the next idle confirmation
```

### Decision Rules

1. Observe fresh reality after every action.
2. Use named states instead of vague heuristics.
3. Perform one meaningful action per iteration.
4. Re-check the result before advancing.
5. Stop only after repeated idle confirmation.

## Notes

- Prefer reversible, low-risk actions unless the user explicitly requests more.
- Keep the target app frontmost before clicking.
- Do not assume static coordinates across window size changes.
- Verify compliance requirements before automating third-party software.
