import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LOCATION_IMAGES } from "../types";
import { LOCATION_META } from "../config/locations";

const SLIDE_MS = 620;

interface MobileDestinationMontageProps {
  imagePaths: Record<string, string>;
  onComplete: () => void;
}

export function MobileDestinationMontage({ imagePaths, onComplete }: MobileDestinationMontageProps) {
  const [index, setIndex] = useState(0);
  const total = LOCATION_IMAGES.length;
  const done = index >= total;
  const currentId = !done ? LOCATION_IMAGES[index] : null;

  useEffect(() => {
    if (done) {
      const id = window.setTimeout(onComplete, 380);
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

      <div className="mobile-montage__progress" aria-hidden="true">
        {LOCATION_IMAGES.map((id, i) => (
          <span
            key={id}
            className={`mobile-montage__dot${i <= index ? " mobile-montage__dot--on" : ""}`}
          />
        ))}
      </div>

      <p className="mobile-montage__hint">Wohin geht die Reise? Gleich erfährst du mehr…</p>
    </div>
  );
}
