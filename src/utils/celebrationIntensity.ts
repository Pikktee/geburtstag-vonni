import type { FlowStep } from "../types";

const DECAY_DURATION_MS = 9 * 60 * 1000;
const MIN_INTENSITY = 0.1;
const MAX_INTENSITY = 1;
const FIREWORK_CALM_AFTER_MS = 20_000;
const FIREWORK_CALM_RAMP_MS = 10_000;

export function computeCelebrationIntensity(
  startedAt: number,
  now = Date.now(),
  step?: FlowStep,
): number {
  const elapsed = Math.max(0, now - startedAt);
  const decay = Math.pow(1 - Math.min(1, elapsed / DECAY_DURATION_MS), 1.4);
  let intensity = MIN_INTENSITY + (MAX_INTENSITY - MIN_INTENSITY) * decay;

  if (step === "verification") intensity *= 0.55;
  else if (step === "accepted" || step === "calendar") intensity *= 0.75;

  return Math.max(MIN_INTENSITY, Math.min(MAX_INTENSITY, intensity));
}

/** Konfetti — dezent auf Mobile. */
export const MOBILE_CELEBRATION_SCALE = 0.58;

export function scaleCelebrationForMobile(intensity: number, isMobile: boolean): number {
  if (!isMobile) return intensity;
  return Math.max(0.14, intensity * MOBILE_CELEBRATION_SCALE);
}

/** Feuerwerk — auf Mobile bewusst nicht abschwächen. */
export function scaleFireworksForMobile(intensity: number, isMobile: boolean): number {
  if (!isMobile) return intensity;
  return Math.max(0.82, Math.min(1, intensity * 1.08));
}

/** 1 = volle Kraft; nach ~20 s wird es ruhiger (Mobile stärker). */
export function fireworkCalmFactor(elapsedMs: number, isMobile = false): number {
  if (elapsedMs < FIREWORK_CALM_AFTER_MS) return 1;
  const t = Math.min(1, (elapsedMs - FIREWORK_CALM_AFTER_MS) / FIREWORK_CALM_RAMP_MS);
  const floor = isMobile ? 0.22 : 0.42;
  return 1 - t * (1 - floor);
}

export function fireworkIntervalMs(
  intensity: number,
  musicPlaying: boolean,
  isMobile = false,
  elapsedMs = 0,
): number {
  const calm = fireworkCalmFactor(elapsedMs, isMobile);
  const base = musicPlaying ? 2_400 : 2_000;
  let interval = base + (1 - intensity * calm) * 14_000;
  if (isMobile) interval *= 1.65;
  interval /= Math.max(0.2, calm);
  return interval;
}

export function fireworkVolume(
  intensity: number,
  musicPlaying: boolean,
  isMobile = false,
  elapsedMs = 0,
): number {
  const calm = fireworkCalmFactor(elapsedMs, isMobile);
  let volume: number;
  if (musicPlaying) {
    volume = 0.34 + intensity * calm * 0.42;
  } else {
    volume = 0.44 + intensity * calm * 0.38;
  }
  if (isMobile) volume *= 0.86;
  return volume;
}
