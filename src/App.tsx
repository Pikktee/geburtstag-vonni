import { useCallback, useEffect, useRef, useState } from "react";
import { Scene3D } from "./components/Scene3D";
import { FireworksOverlay } from "./components/FireworksOverlay";
import { ConfettiOverlay } from "./components/ConfettiOverlay";
import { ScamMarquee, BOTTOM_MARQUEE_TEXT, TOP_MARQUEE_TEXT } from "./components/ScamMarquee";
import { GiftFlow } from "./components/GiftFlow";
import { MobileDestinationMontage } from "./components/MobileDestinationMontage";
import { useAudio } from "./hooks/useAudio";
import { useIsMobilePortrait } from "./hooks/useIsMobile";
import type { AssetManifest, FlowStep } from "./types";
import { LOCATION_IMAGES } from "./types";
import {
  computeCelebrationIntensity,
  fireworkIntervalMs,
  fireworkVolume,
  scaleCelebrationForMobile,
  scaleFireworksForMobile,
} from "./utils/celebrationIntensity";

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
  const [mobileMontage, setMobileMontage] = useState(false);
  const [celebrationIntensity, setCelebrationIntensity] = useState(1);
  const startedAtRef = useRef<number | null>(null);
  const isPortraitMobile = useIsMobilePortrait();
  const { beginCelebration, playSfx, playFireworkBurst, playPartyHorn, playButtonClick, playFinaleJingle, musicPlayingRef } =
    useAudio(manifest?.audio);

  useEffect(() => {
    const onButtonClick = (event: MouseEvent) => {
      if (event.button !== 0) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (!target.closest("button:not(:disabled)")) return;
      playButtonClick();
    };

    document.addEventListener("click", onButtonClick, true);
    return () => document.removeEventListener("click", onButtonClick, true);
  }, [playButtonClick]);

  const isFinale = step === "confirmed";

  useEffect(() => {
    fetch("/assets/manifest.json")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: AssetManifest | null) => {
        if (data) setManifest(data);
      })
      .catch(() => undefined);
  }, []);

  const effectiveIntensity = scaleCelebrationForMobile(celebrationIntensity, isPortraitMobile);
  const fireworksIntensity = scaleFireworksForMobile(celebrationIntensity, isPortraitMobile);

  useEffect(() => {
    if (!started || startedAtRef.current === null || isFinale) return;

    const updateIntensity = () => {
      setCelebrationIntensity(
        computeCelebrationIntensity(startedAtRef.current!, Date.now(), step),
      );
    };

    updateIntensity();
    const id = window.setInterval(updateIntensity, 2500);
    return () => window.clearInterval(id);
  }, [started, step, isFinale]);

  useEffect(() => {
    if (!started || startedAtRef.current === null || isFinale) return;

    let cancelled = false;
    let timeoutId = 0;

    const schedule = () => {
      if (cancelled) return;

      const intensity = scaleFireworksForMobile(
        computeCelebrationIntensity(startedAtRef.current!, Date.now(), step),
        isPortraitMobile,
      );
      const isMusicPlaying = musicPlayingRef.current;
      const volume = fireworkVolume(intensity, isMusicPlaying, isPortraitMobile);
      playFireworkBurst(volume);

      const delay = fireworkIntervalMs(intensity, isMusicPlaying, isPortraitMobile);
      timeoutId = window.setTimeout(schedule, delay);
    };

    const initialDelay = musicPlayingRef.current ? 1_400 : 400;
    timeoutId = window.setTimeout(schedule, initialDelay);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [started, step, isFinale, isPortraitMobile, playFireworkBurst, musicPlayingRef]);

  const handlePlayFinale = useCallback(() => {
    void playFinaleJingle();
  }, [playFinaleJingle]);

  const imagePaths = { ...DEFAULT_IMAGES, ...manifest?.images };

  const launchExperience = useCallback(() => {
    if (started) return;
    startedAtRef.current = Date.now();
    setStarted(true);
    setConfettiBurst((b) => b + 1);

    void beginCelebration().then((playing) => {
      if (playing) {
        const burstVolume = isPortraitMobile ? 0.38 : 0.48;
        window.setTimeout(() => playFireworkBurst(burstVolume), 1_500);
        window.setTimeout(() => playFireworkBurst(burstVolume * 0.85), 3_200);
      }
    });

    setTimeout(() => setStep("offer"), 1_200);
  }, [started, beginCelebration, playFireworkBurst, isPortraitMobile]);

  const startExperience = useCallback(() => {
    if (started) return;
    if (isPortraitMobile) {
      setMobileMontage(true);
      return;
    }
    launchExperience();
  }, [started, isPortraitMobile, launchExperience]);

  const handleMontageComplete = useCallback(() => {
    setMobileMontage(false);
    launchExperience();
  }, [launchExperience]);

  const handleAccept = () => {
    setConfettiBurst((b) => b + 1);
  };

  const showFireworks = started && !isFinale;
  const showConfetti = started && !isFinale;

  return (
    <div className="app">
      {!isFinale && <ScamMarquee text={TOP_MARQUEE_TEXT} duration={35} fixed="top" />}

      {!isFinale && (
        <>
          <div className="celebration-layer" aria-hidden="true">
            <Scene3D imagePaths={imagePaths} showFireworks={false} fireworksIntensity={effectiveIntensity} />
            <ConfettiOverlay
              active={showConfetti}
              burst={confettiBurst > 0}
              intensity={effectiveIntensity}
              subtle={isPortraitMobile}
            />
          </div>
          <FireworksOverlay active={showFireworks} intensity={fireworksIntensity} />
        </>
      )}

      {mobileMontage && (
        <MobileDestinationMontage
          imagePaths={imagePaths}
          onComplete={handleMontageComplete}
          onCountdownTick={() => playSfx("montage-countdown-tick", 0.62, 25)}
        />
      )}

      {!started && !mobileMontage && (
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
              Klick auf <strong style={{ color: "var(--scam-yellow)" }}>OK</strong> — bevor das
              Angebot abläuft!!!
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
        <div className={`ui-layer${showFireworks ? " ui-layer--celebrating" : ""}`}>
          <GiftFlow
            step={step}
            onStepChange={setStep}
            onAccept={handleAccept}
            onDecline={() => setStep("declined")}
            onPlaySfx={playSfx}
            onPlayPartyHorn={playPartyHorn}
            onPlayFinale={handlePlayFinale}
            imagePaths={imagePaths}
          />
        </div>
      )}

      {!isFinale && <ScamMarquee text={BOTTOM_MARQUEE_TEXT} fixed="bottom" reverse duration={55} />}
    </div>
  );
}
