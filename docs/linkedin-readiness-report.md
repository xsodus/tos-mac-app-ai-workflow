# LinkedIn Readiness Report

## Repository Description

Skill-based macOS desktop automation framework for visual AI workflows, loop engineering, and reusable agent skills.

## GitHub Social Preview Text

An experiment in AI workflow automation and loop engineering for macOS: visual desktop control, skill-based agents, and reliable observe-decide-act-verify loops.

## LinkedIn Announcement Post

I’ve been refining an experiment in AI workflow automation and loop engineering.

The project explores how to build reliable desktop agents around an
observe-decide-act-verify loop instead of brittle one-shot scripts. The core
focus is reusable macOS automation primitives, screenshot-driven decision
making, and skill-based agent design that keeps policy separate from control
logic.

I also took time to clean up the repository for public sharing:

- repositioned the project as a generic desktop automation framework
- separated domain-specific examples from the core architecture
- added clearer safety and Terms-of-Service guidance
- tightened the docs for recruiters, engineering managers, and contributors

If you’re interested in visual AI workflows, agent loops, or desktop
automation design, I’d love to compare notes.

## Files Modified

- `README.md`
- `LICENSE.md`
- `package.json`
- `spec.md`
- `src/agent-loop.ts`
- `src/cli.ts`
- `src/macos-controller.ts`
- `src/observation-loop-tracker.ts`
- `test/agent-loop.test.ts`
- `test/observation-loop-tracker.test.ts`
- `skills/run-visual-desktop-loop/SKILL.md`
- `skills/run-visual-desktop-loop/agents/openai.yaml`
- `examples/game-automation/README.md`
- `examples/game-automation/run-tree-of-savior-m-extreme-quests/SKILL.md`
- `examples/game-automation/run-tree-of-savior-m-extreme-quests/agents/openai.yaml`

## Remaining Risks

- The archived game example still references game-specific automation behavior,
  even though it is separated and labeled as an example.
- The repository image `docs/images/actual-run-screenshot.png` may still look
  domain-specific if used as a social preview.
- The package script rename from `pnpm workflow` replacing the older game-specific alias is a breaking
  change for existing local usage.

## Recommendations Before Publishing

- Replace the current screenshot asset with a neutral workflow image or diagram.
- Consider renaming the repository itself to match the new framework identity.
- Review commit history if you want to remove old game-focused context from the
  public timeline.
- Add a contributor guide if you want open-source collaborators to engage
  quickly.
