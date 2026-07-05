import { useCallback, useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";

interface ConfettiOverlayProps {
  active: boolean;
  burst?: boolean;
}

const COLORS = ["#ff0040", "#ffe600", "#00ff66", "#ff69b4", "#9b30ff", "#0066ff", "#ffffff"];

type ConfettiShape = ReturnType<typeof confetti.shapeFromPath>;

let heartShape: ConfettiShape | null = null;

function getHeartShape() {
  if (!heartShape) {
    heartShape = confetti.shapeFromPath({
      path: "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z",
    });
  }
  return heartShape;
}

const BASE_OPTS = { flat: false, disableForReducedMotion: true };

function fireEdgeBursts() {
  const shapes: ConfettiShape[] = [getHeartShape(), "star", "circle"];
  confetti({
    ...BASE_OPTS,
    particleCount: 45,
    angle: 58,
    spread: 55,
    origin: { x: 0.08, y: 0.65 },
    colors: COLORS,
    shapes,
    scalar: 1.25,
    gravity: 0.9,
    ticks: 240,
  });
  confetti({
    ...BASE_OPTS,
    particleCount: 45,
    angle: 122,
    spread: 55,
    origin: { x: 0.92, y: 0.65 },
    colors: COLORS,
    shapes,
    scalar: 1.25,
    gravity: 0.9,
    ticks: 240,
  });
}

function fireTopShower() {
  confetti({
    ...BASE_OPTS,
    particleCount: 18,
    spread: 70,
    startVelocity: 22,
    origin: { x: Math.random() * 0.35 + 0.05, y: -0.02 },
    colors: ["#ff69b4", "#ff0040", "#ffe600", "#ffffff"],
    shapes: [getHeartShape(), "star"],
    scalar: 1.1,
    gravity: 1.05,
    ticks: 350,
    drift: (Math.random() - 0.5) * 0.6,
  });
  confetti({
    ...BASE_OPTS,
    particleCount: 18,
    spread: 70,
    startVelocity: 22,
    origin: { x: Math.random() * 0.35 + 0.6, y: -0.02 },
    colors: COLORS,
    shapes: ["circle", "star", getHeartShape()],
    scalar: 0.95,
    gravity: 1.0,
    ticks: 320,
    drift: (Math.random() - 0.5) * 0.6,
  });
}

function fireCornerPop() {
  const x = Math.random() > 0.5 ? 0.12 : 0.88;
  confetti({
    ...BASE_OPTS,
    particleCount: 35,
    angle: x < 0.5 ? 45 : 135,
    spread: 50,
    origin: { x, y: 0.78 },
    colors: COLORS,
    shapes: [getHeartShape(), "star"],
    scalar: 1.15,
    gravity: 0.85,
    ticks: 200,
  });
}

interface FallingPiece {
  id: number;
  kind: "heart" | "star" | "dot";
  left: number;
  delay: number;
  duration: number;
  size: number;
  spin: number;
  color: string;
}

function createPiece(id: number): FallingPiece {
  const kinds: FallingPiece["kind"][] = ["heart", "heart", "star", "dot"];
  return {
    id,
    kind: kinds[Math.floor(Math.random() * kinds.length)],
    left: Math.random() * 100,
    delay: Math.random() * 6,
    duration: 5 + Math.random() * 5,
    size: 0.65 + Math.random() * 0.9,
    spin: (Math.random() - 0.5) * 720,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
  };
}

function FallingParticles({ active }: { active: boolean }) {
  const [pieces] = useState(() => Array.from({ length: 28 }, (_, i) => createPiece(i)));

  if (!active) return null;

  return (
    <div className="falling-particles" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          className={`falling-particles__item falling-particles__item--${p.kind}`}
          style={{
            left: `${p.left}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            fontSize: `${p.size}rem`,
            color: p.kind === "dot" ? p.color : undefined,
            ["--spin" as string]: `${p.spin}deg`,
          }}
        >
          {p.kind === "heart" ? "♥" : p.kind === "star" ? "★" : "●"}
        </span>
      ))}
    </div>
  );
}

export function ConfettiOverlay({ active, burst }: ConfettiOverlayProps) {
  const edgeInterval = useRef<number | null>(null);
  const showerInterval = useRef<number | null>(null);
  const cornerInterval = useRef<number | null>(null);

  const fireBurst = useCallback(() => {
    fireEdgeBursts();
    fireTopShower();
    fireCornerPop();
  }, []);

  useEffect(() => {
    if (burst) fireBurst();
  }, [burst, fireBurst]);

  useEffect(() => {
    if (!active) {
      [edgeInterval, showerInterval, cornerInterval].forEach((ref) => {
        if (ref.current) {
          window.clearInterval(ref.current);
          ref.current = null;
        }
      });
      return;
    }

    getHeartShape();
    fireBurst();
    edgeInterval.current = window.setInterval(fireEdgeBursts, 2800);
    showerInterval.current = window.setInterval(fireTopShower, 900);
    cornerInterval.current = window.setInterval(fireCornerPop, 2200);

    return () => {
      [edgeInterval, showerInterval, cornerInterval].forEach((ref) => {
        if (ref.current) window.clearInterval(ref.current);
      });
    };
  }, [active, fireBurst]);

  return <FallingParticles active={active} />;
}
