export const TOS_CLICK_PRESETS = {
  "yellow-quest": { x: 0.14, y: 0.17 },
  "quest-accept": { x: 0.809, y: 0.549 },
  "quest-action": { x: 0.754, y: 0.549 },
  "fellow-menu": { x: 0.823, y: 0.088 },
} as const;

export type TosClickPreset = keyof typeof TOS_CLICK_PRESETS;

export function isTosClickPreset(value: string): value is TosClickPreset {
  return value in TOS_CLICK_PRESETS;
}

export function tosPresetPoint(
  preset: TosClickPreset,
): { x: number; y: number } {
  return TOS_CLICK_PRESETS[preset];
}
