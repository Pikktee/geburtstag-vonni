import type { LOCATION_IMAGES } from "../types";

export interface LocationMeta {
  label: string;
  laneY: number;
  depthZ: number;
  direction: 1 | -1;
  speed: number;
  startX: number;
}

export const LOCATION_META: Record<(typeof LOCATION_IMAGES)[number], LocationMeta> = {
  beirut: {
    label: "Beirut",
    laneY: 5.4,
    depthZ: -4.2,
    direction: 1,
    speed: 0.34,
    startX: -22,
  },
  sauna: {
    label: "Sauna",
    laneY: 2.2,
    depthZ: -7.4,
    direction: -1,
    speed: 0.3,
    startX: 16,
  },
  bielefeld: {
    label: "Bielefeld",
    laneY: -1.2,
    depthZ: -5.6,
    direction: 1,
    speed: 0.32,
    startX: -4,
  },
  niedwald: {
    label: "Niedwald",
    laneY: -4.0,
    depthZ: -9.2,
    direction: -1,
    speed: 0.28,
    startX: 20,
  },
  "thai-beach": {
    label: "Thailand",
    laneY: -6.8,
    depthZ: -6.4,
    direction: 1,
    speed: 0.36,
    startX: -14,
  },
};

/** 16:9-Karten — Breite/Höhe immer im korrekten Verhältnis */
export const CARD_ASPECT = 16 / 9;
export const CARD_WIDTH = 10.8;
export const CARD_HEIGHT = CARD_WIDTH / CARD_ASPECT;
export const TRACK_MIN = -32;
export const TRACK_MAX = 32;
