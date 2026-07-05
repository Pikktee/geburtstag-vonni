import { useCallback, useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";

interface ConfettiOverlayProps {
  active: boolean;
  burst?: boolean;
  intensity?: number;
  /** Kein Vollbild-Konfetti — nur dezente fallende Partikel (Mobile). */
  subtle?: boolean;
}

const COLORS = ["#ff0040", "#ffe600", "#00ff66", "#ff69b4", "#9b30ff", "#0066ff", "#ffffff"];

type ConfettiShape = ReturnType<typeof confetti.shapeFromPath>;
type ConfettiFire = ReturnType<typeof confetti.create>;

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

function fireEdgeBursts(fire: ConfettiFire, scale = 1) {
  const shapes: ConfettiShape[] = [getHeartShape(), "star", "circle"];
  const count = Math.max(12, Math.round(45 * scale));
  fire({
    ...BASE_OPTS,
    particleCount: count,
    angle: 58,
    spread: 55,
    origin: { x: 0.08, y: 0.65 },
    colors: COLORS,
    shapes,
    scalar: 1.25,
    gravity: 0.9,
    ticks: 240,
  });
  fire({
    ...BASE_OPTS,
    particleCount: count,
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

function fireTopShower(fire: ConfettiFire, scale = 1) {
  const count = Math.max(6, Math.round(18 * scale));
  fire({
    ...BASE_OPTS,
    particleCount: count,
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
  fire({
    ...BASE_OPTS,
    particleCount: count,
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

function fireCornerPop(fire: ConfettiFire, scale = 1) {
  const x = Math.random() > 0.5 ? 0.12 : 0.88;
  fire({
    ...BASE_OPTS,
    particleCount: Math.max(10, Math.round(35 * scale)),
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

function FallingParticles({
  active,
  intensity = 1,
  subtle = false,
}: {
  active: boolean;
  intensity?: number;
  subtle?: boolean;
}) {
  const pieceCount = subtle
    ? Math.max(4, Math.round(10 * intensity))
    : Math.max(8, Math.round(28 * intensity));
  const [pieces] = useState(() => Array.from({ length: pieceCount }, (_, i) => createPiece(i)));

  if (!active) return null;

  return (
    <div className={`falling-particles${subtle ? " falling-particles--subtle" : ""}`} aria-hidden="true">
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

export function ConfettiOverlay({ active, burst, intensity = 1, subtle = false }: ConfettiOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fireRef = useRef<ConfettiFire | null>(null);
  const edgeInterval = useRef<number | null>(null);
  const showerInterval = useRef<number | null>(null);
  const cornerInterval = useRef<number | null>(null);
  const level = Math.max(0.2, Math.min(1, intensity));
  const burstScale = subtle ? level * 0.28 : level;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    fireRef.current = confetti.create(canvas, { resize: true });
    return () => {
      fireRef.current = null;
    };
  }, []);

  const fireBurst = useCallback(() => {
    const fire = fireRef.current;
    if (!fire || subtle) return;
    fireEdgeBursts(fire, burstScale);
    fireTopShower(fire, burstScale);
    fireCornerPop(fire, burstScale);
  }, [burstScale, subtle]);

  useEffect(() => {
    if (burst && !subtle) fireBurst();
  }, [burst, fireBurst, subtle]);

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

    if (subtle) {
      return undefined;
    }

    getHeartShape();
    fireBurst();
    edgeInterval.current = window.setInterval(() => {
      const fire = fireRef.current;
      if (fire) fireEdgeBursts(fire, level);
    }, 2800 / level);
    showerInterval.current = window.setInterval(() => {
      const fire = fireRef.current;
      if (fire) fireTopShower(fire, level);
    }, 900 / level);
    cornerInterval.current = window.setInterval(() => {
      const fire = fireRef.current;
      if (fire) fireCornerPop(fire, level);
    }, 2200 / level);

    return () => {
      [edgeInterval, showerInterval, cornerInterval].forEach((ref) => {
        if (ref.current) window.clearInterval(ref.current);
      });
    };
  }, [active, fireBurst, level, subtle]);

  return (
    <>
      {!subtle && <canvas ref={canvasRef} className="confetti-canvas" aria-hidden />}
      {!subtle && <FallingParticles active={active} intensity={level} subtle={subtle} />}
    </>
  );
};
