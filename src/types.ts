export type FlowStep =
  | "intro"
  | "offer"
  | "verification"
  | "accepted"
  | "declined"
  | "calendar"
  | "confirmed";

export interface AssetManifest {
  images: Record<string, string>;
  audio: Record<string, string>;
  generatedAt: string;
}

export interface BookingRequest {
  date: string;
  note?: string;
  submittedAt: string;
}

export type NotifyEvent =
  | { type: "gift_accepted"; acceptedAt: string }
  | { type: "booking_submitted"; date: string; note?: string; submittedAt: string };

export const LOCATION_IMAGES = [
  "bielefeld",
  "beirut",
  "sauna",
  "niedwald",
  "thai-beach",
] as const;

export const ORGANIZER_NAME = "Henni";
