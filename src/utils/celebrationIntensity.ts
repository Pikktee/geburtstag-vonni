import type { FlowStep } from "../types";

const DECAY_DURATION_MS = 9 * 60 * 1000;
const MIN_INTENSITY = 0.1;
const MAX_INTENSITY = 1;

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

/** Mobile Hochformat: sichtbar durch die Karte, Text bleibt lesbar. */
export const MOBILE_CELEBRATION_SCALE = 0.58;

export function scaleCelebrationForMobile(intensity: number, isMobile: boolean): number {
  if (!isMobile) return intensity;
  return Math.max(0.14, intensity * MOBILE_CELEBRATION_SCALE);
}

export function fireworkIntervalMs(
  intensity: number,
  musicPlaying: boolean,
  isMobile = false,
): number {
  const base = musicPlaying ? 2_400 : 2_000;
  let interval = base + (1 - intensity) * 14_000;
  if (isMobile) interval *= 1.65;
  return interval;
}

export function fireworkVolume(intensity: number, musicPlaying: boolean, isMobile = false): number {
  let volume: number;
  if (musicPlaying) {
    volume = 0.34 + intensity * 0.42;
  } else {
    volume = 0.44 + intensity * 0.38;
  }
  if (isMobile) volume *= 0.86;
  return volume;
}
