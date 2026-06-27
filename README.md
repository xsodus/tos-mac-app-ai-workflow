# Tree of Savior Extreme TH Mac App - AI workflow

Shared AI agent skills and harness configs for the Tree of Savior Extreme app workflow only.

## Stack

- Node.js 22
- pnpm
- ES modules
- `yargs` for the CLI
- `@inquirer/prompts` for interactive install selection

## Layout

- `skills/` - Codex skill source of truth
- `scripts/nemo.mjs` - interactive symlink installer

## Install

```bash
pnpm install
pnpm nemo symlink
```

The `nemo` command lets you choose whether to install:

- skills
You can install into this project or into your home directory so the same skills are available across projects.

## Scope

This project only focuses on the Tree of Savior Extreme app and its related automation tasks.

Current skills:

- `launch-app-via-spotlight`
- `launch-tree-of-savior-m-extreme`

Each skill lives under `skills/<skill-name>/SKILL.md` and should stay specific to Tree of Savior Extreme use cases.

## macOS Controller

The TypeScript controller provides the low-level interface used by the game loop:

```bash
pnpm tos launch
pnpm tos screenshot artifacts/tos-screen.png
pnpm tos click 640 420
pnpm tos window-screenshot artifacts/tos-window.png
pnpm tos window-click 640 420
pnpm tos key 36
pnpm tos doctor
pnpm test
```

The terminal or Codex process running these commands needs macOS Accessibility
permission for keyboard and mouse control, plus Screen Recording permission for
screenshots. `src/game-loop.ts` keeps visual state detection behind `GameAdapter`;
the next adapter can use screenshots or recorded UI events without changing the
quest-loop safety rules.
