import { readFile, stat, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

export type QuestLoopClassification = "empty-idle" | "quest-or-progress";

type TrackerState = {
  emptyStateCount: number;
  lastScreenshotMtimeMs?: number;
  lastEmptyScreenshotMtimeMs?: number;
};

export type QuestLoopStatus = TrackerState & {
  complete: boolean;
  mustContinue: boolean;
};

const REQUIRED_EMPTY_STATES = 3;
const EMPTY_INTERVAL_MS = 5_000;
const MAX_SCREENSHOT_AGE_MS = 30_000;

export async function resetQuestLoopTracker(statePath: string): Promise<QuestLoopStatus> {
  const state: TrackerState = { emptyStateCount: 0 };
  await writeFile(resolve(statePath), JSON.stringify(state, null, 2));
  return statusFor(state);
}

export async function recordQuestLoopObservation(
  classification: QuestLoopClassification,
  screenshotPath: string,
  statePath: string,
  nowMs = Date.now(),
): Promise<QuestLoopStatus> {
  const screenshot = await stat(resolve(screenshotPath));
  if (nowMs - screenshot.mtimeMs > MAX_SCREENSHOT_AGE_MS) {
    throw new Error("Screenshot is stale; capture and inspect a fresh game-window screenshot.");
  }

  const state = await readState(statePath);
  if (
    state.lastScreenshotMtimeMs !== undefined &&
    screenshot.mtimeMs <= state.lastScreenshotMtimeMs
  ) {
    throw new Error("Screenshot was already recorded; capture a fresh game-window screenshot.");
  }

  if (
    classification === "empty-idle" &&
    state.lastEmptyScreenshotMtimeMs !== undefined &&
    screenshot.mtimeMs - state.lastEmptyScreenshotMtimeMs < EMPTY_INTERVAL_MS
  ) {
    throw new Error("Empty-state screenshots must be separated by at least 5 seconds.");
  }

  const next: TrackerState = {
    emptyStateCount: classification === "empty-idle" ? state.emptyStateCount + 1 : 0,
    lastScreenshotMtimeMs: screenshot.mtimeMs,
    lastEmptyScreenshotMtimeMs:
      classification === "empty-idle" ? screenshot.mtimeMs : undefined,
  };
  await writeFile(resolve(statePath), JSON.stringify(next, null, 2));
  return statusFor(next);
}

async function readState(statePath: string): Promise<TrackerState> {
  try {
    return JSON.parse(await readFile(resolve(statePath), "utf8")) as TrackerState;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return { emptyStateCount: 0 };
    }
    throw error;
  }
}

function statusFor(state: TrackerState): QuestLoopStatus {
  const complete = state.emptyStateCount >= REQUIRED_EMPTY_STATES;
  return { ...state, complete, mustContinue: !complete };
}
