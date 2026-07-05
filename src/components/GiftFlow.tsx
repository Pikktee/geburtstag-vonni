import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import type { FlowStep, BookingRequest } from "../types";
import type { AudioKey } from "../hooks/useAudio";
import { CalendarPicker } from "./CalendarPicker";
import { IdentityCaptcha } from "./IdentityCaptcha";
import { FinaleScreen } from "./FinaleScreen";
import { sendNotification } from "../lib/notify";

type SfxKey = Exclude<AudioKey, "birthday-intro-jingle" | "birthday-finale-jingle">;

interface GiftFlowProps {
  step: FlowStep;
  onStepChange: (step: FlowStep) => void;
  onAccept: () => void;
  onDecline: () => void;
  onPlaySfx: (key: SfxKey, volume?: number) => void;
  onPlayPartyHorn: (volume?: number) => void;
  onPlayFinale: () => void;
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
  onPlayPartyHorn,
  onPlayFinale,
  imagePaths,
}: GiftFlowProps) {
  const [booking, setBooking] = useState<BookingRequest | null>(null);

  if (step === "confirmed" && booking) {
    return (
      <FinaleScreen
        booking={booking}
        koalaSrc={imagePaths.koala ?? "/assets/images/koala.jpg"}
        alpakaSrc={imagePaths.alpaka ?? "/assets/images/alpaka.jpg"}
        onPlayFinale={onPlayFinale}
      />
    );
  }

  const handleAccept = () => {
    onPlaySfx("win-fanfare", 0.6);
    setTimeout(() => onPlaySfx("cash-register", 0.55), 600);
    onAccept();
    onStepChange("verification");
  };

  const handleDecline = () => {
    onPlaySfx("decline-whaaat", 0.82, 40);
    window.setTimeout(() => onPlaySfx("decline-zonk", 0.88, 30), 520);
    onDecline();
    onStepChange("declined");
  };

  const handleVerificationSuccess = () => {
    onPlaySfx("magic-sparkle", 0.55);
    onPlayPartyHorn();
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
    onPlayPartyHorn(0.68);
    onPlaySfx("party-whoosh", 0.38);
    void onPlayFinale();
    onStepChange("confirmed");
  };

  const showMainGreeting = !["verification", "accepted", "calendar", "confirmed"].includes(step);
  const isCompactOffer = showMainGreeting && ["intro", "offer", "declined"].includes(step);

  return (
    <div className={`gift-flow${isCompactOffer ? " gift-flow--compact" : ""}`}>
      <div className="panel-backdrop" aria-hidden="true" />
      <motion.div
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="scam-panel gift-flow__panel"
      >
        <div className="gift-flow__avatars">
          <img
            src={imagePaths.koala ?? "/assets/images/koala.jpg"}
            alt="Vonnilein"
            className="gift-flow__avatar gift-flow__avatar--koala"
          />
          <img
            src={imagePaths.alpaka ?? "/assets/images/alpaka.jpg"}
            alt="Hennilein"
            className="gift-flow__avatar gift-flow__avatar--alpaka"
          />
        </div>

        {showMainGreeting && (
          <>
            <p className="gift-flow__eyebrow">★ NUR FÜR DICH ★</p>

            <div className="gift-flow__badges">
              {["100% SERIÖS", "VIP-EXKLUSIV", "HAPPY GARANTIE", "KEIN BETRUG"].map((badge) => (
                <span
                  key={badge}
                  className="gift-flow__badge"
                  style={{
                    transform: `rotate(${(badge.length % 2 === 0 ? 1 : -1) * 2}deg)`,
                  }}
                >
                  {badge}
                </span>
              ))}
            </div>

            <h1 className="gift-flow__title rainbow-text">Alles Liebe, Vonnilein</h1>

            <p className="gift-flow__date">
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
              <div className="gift-offer-box">
                <p className="gift-offer-box__question">Willst du dein Geschenk annehmen?</p>
                <p className="gift-offer-box__countdown">
                  <FakeCountdown />
                </p>
              </div>

              <div className="gift-offer-actions">
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
              className="gift-declined"
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
                onPlayWarning={() => onPlaySfx("warning-alert", 0.8, 35)}
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
                unverbindlichen Wunschtermin, um dein Geschenk an diesem Datum
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
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
