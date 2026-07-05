import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LOCATION_IMAGES } from "../types";
import { LOCATION_META } from "../config/locations";

const COUNTDOWN_NUMBERS = [5, 4, 3, 2, 1] as const;
const TICK_MS = 900;

interface MobileDestinationMontageProps {
  imagePaths: Record<string, string>;
  onComplete: () => void;
  onCountdownTick?: (value: (typeof COUNTDOWN_NUMBERS)[number]) => void;
}

export function MobileDestinationMontage({
  imagePaths,
  onComplete,
  onCountdownTick,
}: MobileDestinationMontageProps) {
  const [step, setStep] = useState(0);
  const tickPlayedRef = useRef(-1);
  const total = LOCATION_IMAGES.length;
  const finished = step >= COUNTDOWN_NUMBERS.length;
  const countdownValue = finished ? null : COUNTDOWN_NUMBERS[step];
  const imageIndex = Math.min(step, total - 1);
  const currentId = finished ? null : LOCATION_IMAGES[imageIndex];

  useEffect(() => {
    if (finished) {
      const id = window.setTimeout(onComplete, 320);
      return () => window.clearTimeout(id);
    }

    if (tickPlayedRef.current !== step) {
      tickPlayedRef.current = step;
      onCountdownTick?.(COUNTDOWN_NUMBERS[step]);
    }

    const id = window.setTimeout(() => setStep((s) => s + 1), TICK_MS);
    return () => window.clearTimeout(id);
  }, [step, finished, onComplete, onCountdownTick]);

  return (
    <div className="mobile-montage" role="dialog" aria-label="Geheime Reiseziele">
      <div className="mobile-montage__scrim" />

      <AnimatePresence mode="wait">
        {currentId && (
          <motion.figure
            key={currentId}
            className="mobile-montage__slide"
            initial={{ opacity: 0, scale: 1.06 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.32 }}
          >
            <img
              src={imagePaths[currentId] ?? `/assets/images/${currentId}.jpg`}
              alt=""
              className="mobile-montage__img"
            />
            <figcaption className="mobile-montage__caption">
              <span className="mobile-montage__eyebrow blink">★ Ziel streng geheim ★</span>
              <span className="mobile-montage__name">{LOCATION_META[currentId].label}</span>
            </figcaption>
          </motion.figure>
        )}
      </AnimatePresence>

      {countdownValue !== null && (
        <div className="mobile-montage__countdown" aria-live="polite" aria-atomic="true">
          <AnimatePresence mode="wait">
            <motion.span
              key={countdownValue}
              className="mobile-montage__countdown-num"
              initial={{ scale: 0.15, rotate: -18, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              exit={{ scale: 1.25, rotate: 10, opacity: 0 }}
              transition={{ type: "spring", stiffness: 560, damping: 17 }}
            >
              {countdownValue}
            </motion.span>
          </AnimatePresence>
        </div>
      )}

      <p className="mobile-montage__hint">Wohin geht die Reise? Gleich erfährst du mehr…</p>
    </div>
  );
}
