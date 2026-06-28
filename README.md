# Desktop AI Loop Engineering

An experiment in AI workflow automation, visual decision loops, and reusable
macOS desktop control.

## Disclaimer

This repository is intended for educational and research purposes related to
AI-assisted desktop workflows. Users are responsible for complying with the
Terms of Service of any software they automate.

## Overview

This project packages three ideas into one reusable framework:

- loop engineering for reliable agent behavior
- visual AI workflows that reason over fresh screenshots
- skill-based desktop automation on macOS

The repository is structured for people who want to study or extend:

- desktop automation primitives
- agent loops with explicit stop conditions
- skill-driven orchestration
- recovery-aware UI workflows

## Features

- Visual observe-decide-act-verify loop for UI automation
- macOS controller for app launch, focus, screenshots, clicks, and key presses
- Skill folders that document policy separately from implementation
- Loop-state tracker that requires repeated confirmation before completion
- CLI harness for repeatable local testing
- Example archive for domain-specific workflows

## How It Works

The core agent pattern is:

`Observe -> Decide -> Act -> Verify`

1. Observe
   Capture fresh UI state from the target application.
2. Decide
   Classify the current state and choose the highest-priority next action.
3. Act
   Perform one meaningful action through the controller.
4. Verify
   Capture a new observation and confirm the result before continuing.

This loop reduces brittle script behavior by checking reality after every step
instead of assuming that a click, key press, or wait completed the workflow.

## Architecture

The repository separates policy, control, and state tracking:

```mermaid
flowchart TD
    U["User or agent request"] --> S["Skill policy<br/>Defines workflow rules and allowed actions"]
    S --> D["CLI diagnostics<br/>pnpm workflow doctor"]
    D --> C["CLI surface<br/>src/cli.ts"]
    C --> M["macOS controller<br/>src/macos-controller.ts"]
    M --> A["Target desktop application"]
    A --> O["Fresh screenshot / UI observation"]
    O --> L["Agent loop<br/>src/agent-loop.ts"]
    L --> T["Observation tracker<br/>src/observation-loop-tracker.ts"]
    T --> S
```

### Components

- `src/cli.ts` exposes the command surface used by skills and local experiments.
- `src/macos-controller.ts` handles app launch, focus, screenshots, pointer
  input, and keyboard input.
- `src/agent-loop.ts` demonstrates a reusable loop with explicit
  state-to-action mapping.
- `src/observation-loop-tracker.ts` enforces safe completion through repeated
  fresh observations.
- `skills/launch-app-via-spotlight/SKILL.md` shows how skills document a
  workflow policy independently of code.

## Skill System

Skills are the human-readable policy layer. They describe:

- when a workflow should run
- what to inspect on screen
- which actions are allowed
- how to recover from failures
- when the loop is allowed to stop

That makes the decision logic auditable without burying everything inside
controller code.

## Agent Loop

Loop engineering matters most in workflows where UI state can drift. Common
examples include:

- email processing and inbox triage
- repetitive data entry across internal tools
- dashboard monitoring with escalation actions
- routine desktop tasks that require verification after each step

The included loop examples favor:

- fresh observations over cached assumptions
- named states over vague heuristics
- one action per iteration
- explicit completion checks
- recovery rules for blocked or unknown states

## macOS Automation

The controller targets macOS and depends on:

- Accessibility permission for input control
- Screen Recording permission for screenshot capture

Example commands:

```bash
pnpm install
pnpm workflow doctor
pnpm workflow launch "Notes"
pnpm workflow focus "Notes"
pnpm workflow window-screenshot artifacts/current-window.png "Notes"
pnpm workflow window-click 640 420 artifacts/current-window.png "Notes"
pnpm test
```

## Repository Layout

- `skills/` reusable, neutral workflow skills
- `examples/` archived or domain-specific examples
- `src/` controller and loop implementation
- `test/` coverage for loop and controller behavior
- `scripts/nemo.mjs` interactive skill symlink installer

## Safety Considerations

- Verify software Terms of Service before automating it.
- Prefer reversible actions and explicit confirmation points.
- Re-capture screenshots after every state-changing action.
- Avoid hardcoding personal paths, credentials, or machine-specific settings.
- Keep domain-specific automation examples outside the core framework.

## Future Roadmap

- Add more neutral skill examples for email, monitoring, and data-entry flows
- Introduce pluggable state classifiers for different desktop applications
- Expand test fixtures for screenshot-driven workflows
- Add structured telemetry for loop decisions and recovery behavior
- Package the controller and skill templates for easier onboarding

## Examples

Domain-specific examples live under:

- `examples/game-automation/`

These are intentionally separated from the main framework so the repository can
stay focused on reusable automation architecture.
