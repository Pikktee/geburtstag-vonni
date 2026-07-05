import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import type { FlowStep, BookingRequest } from "../types";
import type { AudioKey } from "../hooks/useAudio";
import { CalendarPicker } from "./CalendarPicker";
import { IdentityCaptcha } from "./IdentityCaptcha";
import { sendNotification } from "../lib/notify";

type SfxKey = Exclude<AudioKey, "birthday-soundtrack">;

interface GiftFlowProps {
  step: FlowStep;
  onStepChange: (step: FlowStep) => void;
  onAccept: () => void;
  onDecline: () => void;
  onPlaySfx: (key: SfxKey, volume?: number) => void;
  imagePaths: Record<string, string>;
}

function FakeCountdown() {
  const [seconds, setSeconds] = useState(47);

  useEffect(() => {
    const id = window.setInterval(() => {
      setSeconds((s) => (s <= 1 ? 59 : s - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <span className="blink" style={{ color: "var(--scam-red)", fontWeight: 700 }}>
      ⏰ Nur noch {seconds} Sekunden!!!
    </span>
  );
}

export function GiftFlow({
  step,
  onStepChange,
  onAccept,
  onDecline,
  onPlaySfx,
  imagePaths,
}: GiftFlowProps) {
  const [booking, setBooking] = useState<BookingRequest | null>(null);

  const handleAccept = () => {
    onPlaySfx("win-fanfare", 0.6);
    setTimeout(() => onPlaySfx("cash-register", 0.55), 600);
    onAccept();
    onStepChange("verification");
  };

  const handleDecline = () => {
    onDecline();
    onStepChange("declined");
  };

  const handleVerificationSuccess = () => {
    onPlaySfx("magic-sparkle", 0.5);
    onPlaySfx("confetti-pop", 0.6);
    void sendNotification({ type: "gift_accepted", acceptedAt: new Date().toISOString() });
    onStepChange("accepted");
  };

  const handleBooking = (date: Date, note: string) => {
    const request: BookingRequest = {
      date: format(date, "yyyy-MM-dd"),
      note: note.trim() || undefined,
      submittedAt: new Date().toISOString(),
    };
    setBooking(request);
    localStorage.setItem("vonni-geburtstag-booking", JSON.stringify(request));
    void sendNotification({
      type: "booking_submitted",
      date: format(date, "EEEE, d. MMMM yyyy", { locale: de }),
      note: request.note,
      submittedAt: request.submittedAt,
    });
    onPlaySfx("confetti-pop", 0.55);
    onPlaySfx("party-whoosh", 0.35);
    onStepChange("confirmed");
  };

  const showMainGreeting = !["verification", "accepted", "calendar", "confirmed"].includes(step);

  return (
    <div
      className="gift-flow"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100dvh",
        padding: "1rem 1rem 4rem",
        gap: "1rem",
      }}
    >
      <div className="panel-backdrop" aria-hidden="true" />
      <motion.div
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="scam-panel"
        style={{
          width: "min(560px, 100%)",
          padding: "clamp(1rem, 4vw, 2rem)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "0.75rem",
            flexWrap: "wrap",
            marginBottom: "1rem",
          }}
        >
          <img
            src={imagePaths.koala ?? "/assets/images/koala.jpg"}
            alt="Vonnilein"
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              border: "3px solid var(--scam-pink)",
              objectFit: "cover",
              animation: "float-badge 2s ease-in-out infinite",
            }}
          />
          <img
            src={imagePaths.alpaka ?? "/assets/images/alpaka.jpg"}
            alt="Hennilein"
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              border: "3px solid var(--scam-yellow)",
              objectFit: "cover",
              animation: "float-badge 2.5s ease-in-out infinite",
            }}
          />
        </div>

        {showMainGreeting && (
          <>
            <p
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(0.75rem, 2vw, 0.9rem)",
                color: "var(--scam-green)",
                letterSpacing: "0.15em",
                margin: "0 0 0.5rem",
              }}
            >
              ★ NUR FÜR DICH ★
            </p>

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "0.5rem",
                flexWrap: "wrap",
                marginBottom: "0.75rem",
              }}
            >
              {["100% LEGIT", "VIP ONLY", "SSL 🔒", "KEIN BETRUG"].map((badge) => (
                <span
                  key={badge}
                  style={{
                    background: "var(--scam-red)",
                    color: "#fff",
                    padding: "0.15rem 0.5rem",
                    fontSize: "0.65rem",
                    fontFamily: "var(--font-display)",
                    letterSpacing: "0.05em",
                    border: "1px solid var(--scam-yellow)",
                    transform: `rotate(${(badge.length % 2 === 0 ? 1 : -1) * 2}deg)`,
                  }}
                >
                  {badge}
                </span>
              ))}
            </div>

            <h1
              className="rainbow-text"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(2rem, 8vw, 3.5rem)",
                lineHeight: 1,
                margin: "0 0 0.5rem",
                animationDuration: "4s",
              }}
            >
              Alles Liebe, Vonnilein
            </h1>

            <p style={{ fontSize: "clamp(1rem, 3vw, 1.25rem)", margin: "0.5rem 0" }}>
              <span className="blink">🎂</span> Zum{" "}
              <strong style={{ color: "var(--scam-pink)" }}>6. Juli</strong> — von mir für dich.{" "}
              <span className="blink">🎂</span>
            </p>

            {step !== "declined" && (
              <div className="gift-intro">
                <p className="gift-intro__text">
                  Ich habe ein Geschenk für Dich: Eine Reise nur für Dich! Wohin es geht wird nicht
                  verraten (ok, vielleicht weiß es der Schenker auch noch nicht genau) — aber es
                  wird schön!
                </p>
                <p className="gift-intro__signature">
                  Das Geschenk wird dir überreicht von{" "}
                  <strong className="gift-intro__from">Hennilein</strong> 🦙
                </p>
              </div>
            )}
          </>
        )}

        <AnimatePresence mode="wait">
          {(step === "intro" || step === "offer") && (
            <motion.div
              key="offer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div
                style={{
                  background: "linear-gradient(90deg, rgba(255,0,64,0.3), rgba(155,48,255,0.3))",
                  padding: "1rem",
                  margin: "1.25rem 0",
                  border: "2px solid var(--scam-yellow)",
                }}
              >
                <p
                  style={{
                    fontFamily: "var(--font-marker)",
                    fontSize: "clamp(1.05rem, 3.5vw, 1.35rem)",
                    margin: 0,
                    color: "var(--scam-yellow)",
                  }}
                >
                  Willst du dein Geschenk annehmen?
                </p>
                <p style={{ margin: "0.5rem 0 0", fontSize: "0.85rem" }}>
                  <FakeCountdown />
                </p>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                  alignItems: "center",
                }}
              >
                <button type="button" className="scam-btn scam-btn--accept" onClick={handleAccept}>
                  ✅ Ja, bitte!!!
                </button>
                <button type="button" className="scam-btn scam-btn--decline" onClick={handleDecline}>
                  nein danke lieber nicht
                </button>
              </div>
            </motion.div>
          )}

          {step === "declined" && (
            <motion.div
              key="declined"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              style={{ marginTop: "1.5rem" }}
            >
              <p
                style={{
                  fontFamily: "var(--font-marker)",
                  color: "var(--scam-red)",
                  fontSize: "1.2rem",
                }}
              >
                Moment mal…
              </p>
              <p style={{ color: "#ccc", lineHeight: 1.6 }}>
                Willst du das wirklich? Das ist deine{" "}
                <strong style={{ color: "var(--scam-red)", fontWeight: 700 }}>LETZTE</strong> Chance!!!
                Nutze sie!
              </p>
              <button
                type="button"
                className="scam-btn scam-btn--accept"
                style={{ marginTop: "1rem" }}
                onClick={() => onStepChange("offer")}
              >
                🐨 DOOOOCH, ICH WILL ES!
              </button>
            </motion.div>
          )}

          {step === "verification" && (
            <motion.div key="verification" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <IdentityCaptcha
                onSuccess={handleVerificationSuccess}
                puzzleImageSrc={imagePaths["koala-alpaka-frankfurt"]}
              />
            </motion.div>
          )}

          {step === "accepted" && (
            <motion.div
              key="accepted"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ marginTop: "0.5rem" }}
            >
              <p
                className="rainbow-text"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(1.5rem, 5vw, 2.2rem)",
                  margin: "0 0 0.5rem",
                }}
              >
                Identität bestätigt ✓
              </p>
              <p style={{ lineHeight: 1.65, color: "#e8dce8" }}>
                Herzlichen Glückwunsch, deine Identität wurde bestätigt! Wähle jetzt deinen
                unverbindlichen Wunschtermin, um dein Geschenk an diesem Datum beim Veranstalter
                anzufragen.
              </p>
              <button
                type="button"
                className="scam-btn scam-btn--confirm"
                style={{ marginTop: "1.25rem" }}
                onClick={() => onStepChange("calendar")}
              >
                📅 Wunschtermin wählen
              </button>
            </motion.div>
          )}

          {step === "calendar" && (
            <motion.div key="calendar" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <CalendarPicker onConfirm={handleBooking} />
            </motion.div>
          )}

          {step === "confirmed" && booking && (
            <motion.div
              key="confirmed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ marginTop: "0.5rem" }}
            >
              <p
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(1.3rem, 4vw, 1.8rem)",
                  color: "var(--scam-green)",
                }}
              >
                Deine Anfrage ist eingegangen
              </p>
              <p style={{ lineHeight: 1.7, color: "#e8dce8" }}>
                Dein Wunschtermin{" "}
                <strong>
                  {format(new Date(booking.date), "EEEE, d. MMMM yyyy", { locale: de })}
                </strong>{" "}
                — du erhältst in Kürze Rückmeldung.
              </p>
              <p
                style={{
                  background: "rgba(255,230,0,0.12)",
                  border: "1px dashed var(--scam-yellow)",
                  padding: "0.75rem",
                  borderRadius: 4,
                  fontSize: "0.9rem",
                  color: "#ddd",
                  lineHeight: 1.55,
                }}
              >
                Beachte, dass der Termin noch verifiziert werden muss. Du erhältst Bescheid, wenn es
                steht. 🦙
              </p>
              {booking.note && (
                <p style={{ fontSize: "0.85rem", color: "#aaa", fontStyle: "italic" }}>
                  Deine Notiz: „{booking.note}"
                </p>
              )}
              <p
                style={{
                  marginTop: "1.5rem",
                  fontFamily: "var(--font-marker)",
                  color: "var(--scam-pink)",
                  fontSize: "1.05rem",
                  lineHeight: 1.5,
                }}
              >
                Ich hab dich lieb, Vonnilein. Happy Birthday. 💕
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
