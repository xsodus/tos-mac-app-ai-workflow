import { readFile, stat, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

export type ObservationClassification = "idle" | "activity";

type TrackerState = {
  idleObservationCount: number;
  lastScreenshotMtimeMs?: number;
  lastIdleScreenshotMtimeMs?: number;
};

export type ObservationLoopStatus = TrackerState & {
  complete: boolean;
  mustContinue: boolean;
};

const REQUIRED_IDLE_STATES = 3;
const IDLE_INTERVAL_MS = 5_000;
// Leave enough time for a high-resolution capture to be visually inspected
// before the next controller command. Reuse is still rejected by mtime below.
const MAX_SCREENSHOT_AGE_MS = 600_000;

export async function resetObservationLoopTracker(
  statePath: string,
): Promise<ObservationLoopStatus> {
  const state: TrackerState = { idleObservationCount: 0 };
  await writeFile(resolve(statePath), JSON.stringify(state, null, 2));
  return statusFor(state);
}

export async function recordObservation(
  classification: ObservationClassification,
  screenshotPath: string,
  statePath: string,
  nowMs = Date.now(),
): Promise<ObservationLoopStatus> {
  const screenshot = await stat(resolve(screenshotPath));
  if (nowMs - screenshot.mtimeMs > MAX_SCREENSHOT_AGE_MS) {
    throw new Error("Screenshot is stale; capture and inspect a fresh window screenshot.");
  }

  const state = await readState(statePath);
  if (
    state.lastScreenshotMtimeMs !== undefined &&
    screenshot.mtimeMs <= state.lastScreenshotMtimeMs
  ) {
    throw new Error("Screenshot was already recorded; capture a fresh window screenshot.");
  }

  if (
    classification === "idle" &&
    state.lastIdleScreenshotMtimeMs !== undefined &&
    screenshot.mtimeMs - state.lastIdleScreenshotMtimeMs < IDLE_INTERVAL_MS
  ) {
    throw new Error("Idle-state screenshots must be separated by at least 5 seconds.");
  }

  const next: TrackerState = {
    idleObservationCount: classification === "idle" ? state.idleObservationCount + 1 : 0,
    lastScreenshotMtimeMs: screenshot.mtimeMs,
    lastIdleScreenshotMtimeMs: classification === "idle" ? screenshot.mtimeMs : undefined,
  };
  await writeFile(resolve(statePath), JSON.stringify(next, null, 2));
  return statusFor(next);
}

async function readState(statePath: string): Promise<TrackerState> {
  try {
    return JSON.parse(await readFile(resolve(statePath), "utf8")) as TrackerState;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return { idleObservationCount: 0 };
    }
    throw error;
  }
}

function statusFor(state: TrackerState): ObservationLoopStatus {
  const complete = state.idleObservationCount >= REQUIRED_IDLE_STATES;
  return { ...state, complete, mustContinue: !complete };
}
