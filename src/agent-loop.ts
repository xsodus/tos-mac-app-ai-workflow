export type WorkflowState =
  | "not-running"
  | "ready"
  | "selection-required"
  | "actionable-item"
  | "detail-view"
  | "confirmation-required"
  | "in-progress"
  | "follow-up-required"
  | "idle-complete"
  | "blocked"
  | "unknown";

export type Observation = {
  state: WorkflowState;
  description?: string;
};

export type WorkflowAction =
  | "launch"
  | "open-workspace"
  | "select-item"
  | "process-item"
  | "confirm"
  | "continue"
  | "wait";

export interface WorkflowAdapter {
  observe(): Promise<Observation>;
  act(action: WorkflowAction): Promise<void>;
}

export type LoopEvent = {
  step: number;
  observation: Observation;
  action?: WorkflowAction;
};

export type LoopResult = {
  status: "completed" | "stuck" | "step-limit";
  events: LoopEvent[];
  reason: string;
};

export type AgentLoopOptions = {
  maxSteps?: number;
  maxRepeatedRecoveryStates?: number;
  requiredIdleObservations?: number;
};

export async function runAgentLoop(
  adapter: WorkflowAdapter,
  options: AgentLoopOptions = {},
): Promise<LoopResult> {
  const maxSteps = options.maxSteps ?? Number.POSITIVE_INFINITY;
  const maxRepeatedRecoveryStates =
    options.maxRepeatedRecoveryStates ?? Number.POSITIVE_INFINITY;
  const requiredIdleObservations = options.requiredIdleObservations ?? 3;
  const events: LoopEvent[] = [];
  let previousRecoveryState: WorkflowState | undefined;
  let repeatedRecoveryStates = 0;
  let idleObservations = 0;

  for (let step = 1; step <= maxSteps; step += 1) {
    const observation = await adapter.observe();

    if (observation.state === "idle-complete") {
      idleObservations += 1;
      if (idleObservations >= requiredIdleObservations) {
        events.push({ step, observation });
        return {
          status: "completed",
          events,
          reason: `The workflow remained idle across ${idleObservations} consecutive observations.`,
        };
      }

      events.push({ step, observation, action: "wait" });
      await adapter.act("wait");
      continue;
    }

    idleObservations = 0;
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

function actionFor(state: WorkflowState): WorkflowAction {
  switch (state) {
    case "not-running":
      return "launch";
    case "ready":
      return "open-workspace";
    case "selection-required":
      return "select-item";
    case "actionable-item":
      return "process-item";
    case "detail-view":
    case "in-progress":
      return "continue";
    case "confirmation-required":
    case "follow-up-required":
      return "confirm";
    case "blocked":
    case "unknown":
      return "wait";
    case "idle-complete":
      throw new Error("Completed state does not require an action");
  }
}

function isRecoveryState(state: WorkflowState): boolean {
  return state === "blocked" || state === "unknown";
}
