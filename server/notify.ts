import type { NotifyEvent } from "../src/types.js";

async function sendTelegram(text: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return false;

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });

  if (!res.ok) {
    console.error("Telegram failed:", await res.text());
    return false;
  }
  return true;
}

async function sendEmail(subject: string, html: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.NOTIFY_EMAIL;
  if (!apiKey || !to) return false;

  const from = process.env.RESEND_FROM ?? "Vonni Geschenk <onboarding@resend.dev>";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html }),
  });

  if (!res.ok) {
    console.error("Resend failed:", await res.text());
    return false;
  }
  return true;
}

function formatEvent(event: NotifyEvent): { subject: string; text: string; html: string } {
  if (event.type === "gift_accepted") {
    const subject = "🐨 Vonnie hat das Geschenk angenommen!";
    const text = `Vonnilein hat das Geburtstags-Geschenk angenommen.\n\nZeitpunkt: ${event.acceptedAt}\n\nSie kommt gleich zum Kalender-Schritt.`;
    const html = `<p><strong>Vonnilein hat das Geburtstags-Geschenk angenommen.</strong></p><p>Zeitpunkt: ${event.acceptedAt}</p><p>Sie kommt gleich zum Kalender-Schritt.</p>`;
    return { subject, text, html };
  }

  const subject = "📅 Vonnie: Terminvorschlag fürs Geschenk";
  const noteLine = event.note ? `\n\nNotiz:\n${event.note}` : "";
  const text = `Neuer Terminvorschlag von Vonnilein:\n\nDatum: ${event.date}${noteLine}\n\nEingegangen: ${event.submittedAt}`;
  const html = `<p><strong>Neuer Terminvorschlag von Vonnilein</strong></p><p>Datum: <strong>${event.date}</strong></p>${event.note ? `<p>Notiz: ${event.note}</p>` : ""}<p>Eingegangen: ${event.submittedAt}</p>`;
  return { subject, text, html };
}

export async function dispatchNotification(event: NotifyEvent): Promise<{ sent: string[] }> {
  const { subject, text, html } = formatEvent(event);
  const sent: string[] = [];

  if (await sendTelegram(text)) sent.push("telegram");
  if (await sendEmail(subject, html)) sent.push("email");

  if (sent.length === 0) {
    console.warn("No notification channel configured. Event:", event);
  }

  return { sent };
}

export type { NotifyEvent };
