import assert from "node:assert/strict";
import { mkdtemp, utimes, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  recordObservation,
  resetObservationLoopTracker,
} from "../src/observation-loop-tracker.ts";

test("requires three fresh idle screenshots and resets on activity", async () => {
  const directory = await mkdtemp(join(tmpdir(), "workflow-loop-"));
  const screenshot = join(directory, "current.png");
  const state = join(directory, "state.json");
  const base = Date.now() - 20_000;
  await resetObservationLoopTracker(state);

  await freshen(screenshot, base);
  assert.equal((await recordObservation("idle", screenshot, state, base)).mustContinue, true);
  await freshen(screenshot, base + 5_000);
  assert.equal((await recordObservation("idle", screenshot, state, base + 5_000)).idleObservationCount, 2);
  await freshen(screenshot, base + 10_000);
  assert.equal((await recordObservation("activity", screenshot, state, base + 10_000)).idleObservationCount, 0);
  await freshen(screenshot, base + 15_000);
  await recordObservation("idle", screenshot, state, base + 15_000);
  await freshen(screenshot, base + 20_000);
  await recordObservation("idle", screenshot, state, base + 20_000);
  await freshen(screenshot, base + 25_000);
  const result = await recordObservation("idle", screenshot, state, base + 25_000);

  assert.equal(result.complete, true);
  assert.equal(result.mustContinue, false);
});

test("rejects reused and too-closely-spaced idle screenshots", async () => {
  const directory = await mkdtemp(join(tmpdir(), "workflow-loop-"));
  const screenshot = join(directory, "current.png");
  const state = join(directory, "state.json");
  const base = Date.now() - 10_000;

  await freshen(screenshot, base);
  await recordObservation("idle", screenshot, state, base);
  await assert.rejects(recordObservation("idle", screenshot, state, base), /already recorded/);
  await freshen(screenshot, base + 4_000);
  await assert.rejects(recordObservation("idle", screenshot, state, base + 4_000), /at least 5 seconds/);
});

async function freshen(path: string, mtimeMs: number): Promise<void> {
  await writeFile(path, "screenshot");
  const time = new Date(mtimeMs);
  await utimes(path, time, time);
}
