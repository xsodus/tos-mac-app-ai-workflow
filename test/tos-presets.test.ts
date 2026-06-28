import assert from "node:assert/strict";
import test from "node:test";
import {
  isTosClickPreset,
  tosPresetPoint,
} from "../src/tos-presets.ts";

test("returns normalized TOS preset points", () => {
  assert.deepEqual(tosPresetPoint("yellow-quest"), { x: 0.14, y: 0.17 });
  assert.deepEqual(tosPresetPoint("quest-accept"), { x: 0.809, y: 0.549 });
  assert.deepEqual(tosPresetPoint("quest-action"), { x: 0.754, y: 0.549 });
  assert.deepEqual(tosPresetPoint("fellow-menu"), { x: 0.823, y: 0.088 });
});

test("recognizes only configured TOS presets", () => {
  assert.equal(isTosClickPreset("yellow-quest"), true);
  assert.equal(isTosClickPreset("buy-item"), false);
});
