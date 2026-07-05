import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LOCATION_IMAGES } from "../types";
import { LOCATION_META } from "../config/locations";

const SLIDE_MS = 620;

interface MobileDestinationMontageProps {
  imagePaths: Record<string, string>;
  onComplete: () => void;
  onSlideReveal?: (slideIndex: number) => void;
}

export function MobileDestinationMontage({
  imagePaths,
  onComplete,
  onSlideReveal,
}: MobileDestinationMontageProps) {
  const [index, setIndex] = useState(0);
  const total = LOCATION_IMAGES.length;
  const done = index >= total;
  const currentId = !done ? LOCATION_IMAGES[index] : null;
  const remaining = total - index;
  const countdownLabel = done ? "LOS!!!" : String(remaining);

  useEffect(() => {
    if (done) return;
    onSlideReveal?.(index);
  }, [index, done, onSlideReveal]);

  useEffect(() => {
    if (done) {
      const id = window.setTimeout(onComplete, 480);
      return () => window.clearTimeout(id);
    }
    const id = window.setTimeout(() => setIndex((i) => i + 1), SLIDE_MS);
    return () => window.clearTimeout(id);
  }, [index, done, onComplete]);

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

      <div className="mobile-montage__countdown" aria-live="polite" aria-atomic="true">
        <AnimatePresence mode="wait">
          <motion.div
            key={countdownLabel}
            className="mobile-montage__countdown-burst"
            initial={{ scale: 0.25, rotate: -14, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 1.35, rotate: 8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 520, damping: 16 }}
          >
            <span
              className={`mobile-montage__countdown-num${done ? " mobile-montage__countdown-num--go" : ""}`}
            >
              {countdownLabel}
            </span>
            {!done && (
              <span className="mobile-montage__countdown-label blink">
                {remaining === 1 ? "LETZTES ZIEL!!!" : "GEHEIME ZIELE ÜBRIG!!!"}
              </span>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <p className="mobile-montage__hint">Wohin geht die Reise? Gleich erfährst du mehr…</p>
    </div>
  );
}
