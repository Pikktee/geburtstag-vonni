import type { NotifyEvent } from "../types";

export async function sendNotification(event: NotifyEvent): Promise<void> {
  try {
    await fetch("/api/notify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(import.meta.env.VITE_NOTIFY_SECRET
          ? { "X-Notify-Secret": import.meta.env.VITE_NOTIFY_SECRET }
          : {}),
      },
      body: JSON.stringify(event),
    });
  } catch {
    // Vonnie soll nichts merken, wenn die Benachrichtigung fehlschlägt
  }
}
