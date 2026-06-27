import assert from "node:assert/strict";
import test from "node:test";
import {
  playFullLoop,
  type GameAction,
  type GameAdapter,
  type GameState,
  type Observation,
} from "../src/game-loop.ts";

class ScriptedAdapter implements GameAdapter {
  readonly actions: GameAction[] = [];
  private index = 0;
  private readonly states: GameState[];

  constructor(states: GameState[]) {
    this.states = states;
  }

  async observe(): Promise<Observation> {
    const state = this.states[this.index];
    assert.ok(state, "Script ran out of observations");
    this.index += 1;
    return { state };
  }

  async act(action: GameAction): Promise<void> {
    this.actions.push(action);
  }
}

test("plays the complete title-to-quest-exhaustion loop", async () => {
  const adapter = new ScriptedAdapter([
    "not-running",
    "title",
    "barrack",
    "character-select",
    "in-game-no-fellow",
    "main-quest",
    "quest-dialogue-auto-off",
    "quest-dialogue",
    "quest-reward",
    "main-quest",
    "sub-quest",
    "quests-exhausted",
  ]);

  const result = await playFullLoop(adapter);

  assert.equal(result.status, "completed");
  assert.deepEqual(adapter.actions, [
    "launch",
    "enter-title",
    "start-barrack",
    "select-character",
    "summon-fellow",
    "advance-main-quest",
    "enable-auto-talk",
    "wait",
    "accept-quest-reward",
    "advance-main-quest",
    "advance-sub-quest",
  ]);
});

test("stops after three repeated recovery failures", async () => {
  const adapter = new ScriptedAdapter(["loading", "loading", "loading"]);
  const result = await playFullLoop(adapter);

  assert.equal(result.status, "stuck");
  assert.equal(adapter.actions.length, 2);
});
