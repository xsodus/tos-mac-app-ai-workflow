import assert from "node:assert/strict";
import test from "node:test";
import {
  runAgentLoop,
  type Observation,
  type WorkflowAction,
  type WorkflowAdapter,
  type WorkflowState,
} from "../src/agent-loop.ts";

class ScriptedAdapter implements WorkflowAdapter {
  readonly actions: WorkflowAction[] = [];
  private index = 0;
  private readonly states: WorkflowState[];

  constructor(states: WorkflowState[]) {
    this.states = states;
  }

  async observe(): Promise<Observation> {
    const state = this.states[this.index];
    assert.ok(state, "Script ran out of observations");
    this.index += 1;
    return { state };
  }

  async act(action: WorkflowAction): Promise<void> {
    this.actions.push(action);
  }
}

test("runs a complete workflow loop until repeated idle confirmation", async () => {
  const adapter = new ScriptedAdapter([
    "not-running",
    "ready",
    "selection-required",
    "actionable-item",
    "confirmation-required",
    "in-progress",
    "follow-up-required",
    "idle-complete",
    "idle-complete",
    "idle-complete",
  ]);

  const result = await runAgentLoop(adapter);

  assert.equal(result.status, "completed");
  assert.deepEqual(adapter.actions, [
    "launch",
    "open-workspace",
    "select-item",
    "process-item",
    "confirm",
    "continue",
    "confirm",
    "wait",
    "wait",
  ]);
});

test("stops after repeated recovery failures", async () => {
  const adapter = new ScriptedAdapter(["blocked", "blocked", "blocked"]);
  const result = await runAgentLoop(adapter, { maxRepeatedRecoveryStates: 3 });

  assert.equal(result.status, "stuck");
  assert.equal(adapter.actions.length, 2);
});

test("resets idle confirmation when activity returns", async () => {
  const adapter = new ScriptedAdapter([
    "idle-complete",
    "idle-complete",
    "actionable-item",
    "idle-complete",
    "idle-complete",
    "idle-complete",
  ]);

  const result = await runAgentLoop(adapter);

  assert.equal(result.status, "completed");
  assert.deepEqual(adapter.actions, ["wait", "wait", "process-item", "wait", "wait"]);
});
