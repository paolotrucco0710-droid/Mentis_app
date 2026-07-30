export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

export function mergeRunningAverage(
  current: number | null,
  sampleCount: number,
  newValue?: number
): number | null {
  if (newValue === undefined) {
    return current;
  }

  if (current === null || sampleCount <= 0) {
    return newValue;
  }

  return Math.round((current * sampleCount + newValue) / (sampleCount + 1));
}
