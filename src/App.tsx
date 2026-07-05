import { useCallback, useEffect, useState } from "react";
import { Scene3D } from "./components/Scene3D";
import { ConfettiOverlay } from "./components/ConfettiOverlay";
import { ScamMarquee, BOTTOM_MARQUEE_TEXT, TOP_MARQUEE_TEXT } from "./components/ScamMarquee";
import { GiftFlow } from "./components/GiftFlow";
import { useAudio } from "./hooks/useAudio";
import type { AssetManifest, FlowStep } from "./types";
import { LOCATION_IMAGES } from "./types";

const DEFAULT_IMAGES: Record<string, string> = Object.fromEntries([
  ...LOCATION_IMAGES.map((id) => [id, `/assets/images/${id}.jpg`]),
  ["koala", "/assets/images/koala.jpg"],
  ["alpaka", "/assets/images/alpaka.jpg"],
  ["koala-alpaka-frankfurt", "/assets/images/koala-alpaka-frankfurt.jpg"],
]);

export default function App() {
  const [manifest, setManifest] = useState<AssetManifest | null>(null);
  const [step, setStep] = useState<FlowStep>("intro");
  const [confettiBurst, setConfettiBurst] = useState(0);
  const [started, setStarted] = useState(false);
  const { unlockAudio, startMusic, playSfx } = useAudio(manifest?.audio);

  useEffect(() => {
    fetch("/assets/manifest.json")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: AssetManifest | null) => {
        if (data) setManifest(data);
      })
      .catch(() => undefined);
  }, []);

  const imagePaths = { ...DEFAULT_IMAGES, ...manifest?.images };

  const startExperience = useCallback(() => {
    if (started) return;
    setStarted(true);
    unlockAudio();
    startMusic();
    playSfx("fireworks", 0.3);
    playSfx("confetti-pop", 0.5);
    setConfettiBurst((b) => b + 1);
    setTimeout(() => setStep("offer"), 1200);
  }, [started, unlockAudio, startMusic, playSfx]);

  useEffect(() => {
    if (!started) return;
    const id = window.setInterval(() => {
      playSfx("fireworks", 0.28);
    }, 5000);
    return () => window.clearInterval(id);
  }, [started, playSfx]);

  const handleAccept = () => {
    setConfettiBurst((b) => b + 1);
    playSfx("confetti-pop", 0.6);
  };

  const showFireworks = started && step !== "confirmed";
  const showConfetti = started;

  return (
    <div className="app">
      <ScamMarquee text={TOP_MARQUEE_TEXT} duration={35} />

      <Scene3D imagePaths={imagePaths} showFireworks={showFireworks} />
      <ConfettiOverlay active={showConfetti} burst={confettiBurst > 0} />

      {!started && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.85)",
            padding: "1rem",
          }}
        >
          <div className="scam-panel" style={{ padding: "2rem", textAlign: "center", maxWidth: 420 }}>
            <p
              className="blink"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.5rem",
                color: "var(--scam-red)",
                letterSpacing: "0.06em",
              }}
            >
              Glückwunsch!!!
            </p>
            <p style={{ fontSize: "1.05rem", lineHeight: 1.7, margin: "1rem 0 0" }}>
              Für dich wurde ein Geburtstags-Geschenk hinterlegt!!!
              <br />
              <br />
              Hast du heute Geburtstag?! Dann hol es dir JETZT ab!!!
              <br />
              <br />
              Klick auf <strong style={{ color: "var(--scam-yellow)" }}>OK</strong> — bevor die
              Reservierung an jemand anderen geht!!!
            </p>
            <button
              id="audio-unlock"
              type="button"
              className="scam-btn scam-btn--accept"
              onClick={startExperience}
              style={{ marginTop: "1.5rem", width: "100%" }}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {started && (
        <div className="ui-layer">
          <GiftFlow
            step={step}
            onStepChange={setStep}
            onAccept={handleAccept}
            onDecline={() => setStep("declined")}
            onPlaySfx={playSfx}
            imagePaths={imagePaths}
          />
        </div>
      )}

      <ScamMarquee text={BOTTOM_MARQUEE_TEXT} fixed reverse duration={55} />
    </div>
  );
}
