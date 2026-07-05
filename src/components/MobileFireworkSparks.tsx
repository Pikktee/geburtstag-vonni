import { useEffect } from "react";
import confetti from "canvas-confetti";

const COLORS = ["#ff0040", "#ffe600", "#00ff66", "#ff69b4", "#9b30ff", "#0066ff", "#ffffff"];

interface MobileFireworkSparksProps {
  active: boolean;
  intensity?: number;
}

/** Sichtbare 2D-Feuerwerk-Bursts auf Mobile (Safari-tauglich, hinter der Karte). */
export function MobileFireworkSparks({ active, intensity = 1 }: MobileFireworkSparksProps) {
  useEffect(() => {
    if (!active) return undefined;

    const level = Math.max(0.5, Math.min(1, intensity));

    const burst = () => {
      const x = 0.12 + Math.random() * 0.76;
      confetti({
        particleCount: Math.round(18 + level * 22),
        angle: 90,
        spread: 48 + level * 18,
        startVelocity: 42 + level * 18,
        origin: { x, y: 0.94 },
        colors: COLORS,
        ticks: 110,
        gravity: 0.88,
        scalar: 0.95 + level * 0.35,
        disableForReducedMotion: true,
        zIndex: 14,
      });
      if (Math.random() > 0.45) {
        window.setTimeout(() => {
          confetti({
            particleCount: Math.round(10 + level * 14),
            spread: 360,
            startVelocity: 18 + level * 12,
            origin: { x, y: 0.55 + Math.random() * 0.15 },
            colors: COLORS,
            ticks: 90,
            gravity: 0.65,
            scalar: 0.75,
            disableForReducedMotion: true,
            zIndex: 14,
          });
        }, 280);
      }
    };

    burst();
    const id = window.setInterval(burst, 1100 + (1 - level) * 900);

    return () => window.clearInterval(id);
  }, [active, intensity]);

  return null;
}
