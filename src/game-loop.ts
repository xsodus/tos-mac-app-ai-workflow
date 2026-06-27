export type GameState =
  | "not-running"
  | "title"
  | "barrack"
  | "character-select"
  | "in-game-no-fellow"
  | "main-quest"
  | "sub-quest"
  | "quest-dialogue-auto-off"
  | "quest-dialogue"
  | "quest-reward"
  | "quest-progressing"
  | "loading"
  | "disconnected"
  | "quests-exhausted"
  | "unknown";

export type Observation = {
  state: GameState;
  description?: string;
};

export type GameAction =
  | "launch"
  | "enter-title"
  | "start-barrack"
  | "select-character"
  | "summon-fellow"
  | "advance-main-quest"
  | "advance-sub-quest"
  | "enable-auto-talk"
  | "accept-quest-reward"
  | "wait";

export interface GameAdapter {
  observe(): Promise<Observation>;
  act(action: GameAction): Promise<void>;
}

export type LoopEvent = {
  step: number;
  observation: Observation;
  action?: GameAction;
};

export type LoopResult = {
  status: "completed" | "stuck" | "step-limit";
  events: LoopEvent[];
  reason: string;
};

export type GameLoopOptions = {
  maxSteps?: number;
  maxRepeatedRecoveryStates?: number;
  requiredEmptyObservations?: number;
};

export async function playFullLoop(
  adapter: GameAdapter,
  options: GameLoopOptions = {},
): Promise<LoopResult> {
  const maxSteps = options.maxSteps ?? 200;
  const maxRepeatedRecoveryStates = options.maxRepeatedRecoveryStates ?? 3;
  const requiredEmptyObservations = options.requiredEmptyObservations ?? 3;
  const events: LoopEvent[] = [];
  let previousRecoveryState: GameState | undefined;
  let repeatedRecoveryStates = 0;
  let emptyObservations = 0;

  for (let step = 1; step <= maxSteps; step += 1) {
    const observation = await adapter.observe();

    if (observation.state === "quests-exhausted") {
      emptyObservations += 1;
      if (emptyObservations >= requiredEmptyObservations) {
        events.push({ step, observation });
        return {
          status: "completed",
          events,
          reason: `No quests or quest prompts remained across ${emptyObservations} consecutive observations.`,
        };
      }

      events.push({ step, observation, action: "wait" });
      await adapter.act("wait");
      continue;
    }

    emptyObservations = 0;
    const action = actionFor(observation.state);
    events.push({ step, observation, action });

    if (isRecoveryState(observation.state)) {
      repeatedRecoveryStates =
        previousRecoveryState === observation.state ? repeatedRecoveryStates + 1 : 1;
      previousRecoveryState = observation.state;

      if (repeatedRecoveryStates >= maxRepeatedRecoveryStates) {
        return {
          status: "stuck",
          events,
          reason: `${observation.state} repeated ${repeatedRecoveryStates} times.`,
        };
      }
    } else {
      previousRecoveryState = undefined;
      repeatedRecoveryStates = 0;
    }

    await adapter.act(action);
  }

  return {
    status: "step-limit",
    events,
    reason: `Reached the safety limit of ${maxSteps} steps.`,
  };
}

function actionFor(state: GameState): GameAction {
  switch (state) {
    case "not-running":
      return "launch";
    case "title":
      return "enter-title";
    case "barrack":
      return "start-barrack";
    case "character-select":
      return "select-character";
    case "in-game-no-fellow":
      return "summon-fellow";
    case "main-quest":
      return "advance-main-quest";
    case "sub-quest":
      return "advance-sub-quest";
    case "quest-dialogue-auto-off":
      return "enable-auto-talk";
    case "quest-dialogue":
      return "wait";
    case "quest-reward":
      return "accept-quest-reward";
    case "quest-progressing":
      return "wait";
    case "loading":
    case "unknown":
      return "wait";
    case "disconnected":
      return "launch";
    case "quests-exhausted":
      throw new Error("Completed state does not require an action");
  }
}

function isRecoveryState(state: GameState): boolean {
  return state === "loading" || state === "disconnected" || state === "unknown";
}
