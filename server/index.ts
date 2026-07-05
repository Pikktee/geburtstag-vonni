import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { dispatchNotification, type NotifyEvent } from "./notify.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.join(__dirname, "..", "dist");
const port = Number(process.env.PORT ?? 4173);

const app = express();
app.use(express.json({ limit: "16kb" }));

app.post("/api/notify", async (req, res) => {
  const secret = process.env.NOTIFY_SECRET;
  if (secret && req.headers["x-notify-secret"] !== secret) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const body = req.body as NotifyEvent;
  if (!body?.type || !["gift_accepted", "booking_submitted"].includes(body.type)) {
    res.status(400).json({ error: "Invalid event type" });
    return;
  }

  try {
    const result = await dispatchNotification(body);
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error("Notify error:", err);
    res.status(500).json({ error: "Notification failed" });
  }
});

app.use(express.static(distPath));

app.get("*", (_req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
