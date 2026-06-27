import assert from "node:assert/strict";
import test from "node:test";
import {
  MacAppController,
  imagePointToWindowPoint,
  parseWindowBounds,
} from "../src/macos-controller.ts";

test("rejects unsupported AppleScript modifiers before executing", async () => {
  const controller = new MacAppController();

  await assert.rejects(
    controller.pressKey(36, ["totally-not-a-modifier"]),
    /Unsupported modifier/,
  );
});

test("rejects non-integer pointer coordinates before executing", async () => {
  const controller = new MacAppController();

  await assert.rejects(controller.click({ x: 1.5, y: 10 }), /must be an integer/);
});

test("parses secondary-display window bounds", () => {
  assert.deepEqual(parseWindowBounds("1920, 44, 1440, 900"), {
    x: 1920,
    y: 44,
    width: 1440,
    height: 900,
  });
});

test("supports displays positioned left of the primary display", () => {
  assert.deepEqual(parseWindowBounds("-1440, 0, 1440, 900"), {
    x: -1440,
    y: 0,
    width: 1440,
    height: 900,
  });
});

test("maps Retina image pixels to window points", () => {
  assert.deepEqual(
    imagePointToWindowPoint(
      { x: 1051, y: 1200 },
      { width: 2102, height: 1640 },
      { x: 396, y: -1009, width: 1051, height: 820 },
    ),
    { x: 526, y: 600 },
  );
});
