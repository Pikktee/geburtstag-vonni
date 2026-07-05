import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Html, Stars } from "@react-three/drei";
import * as THREE from "three";
import { FloatingImages, SceneDecor } from "./FloatingImages";
import { Fireworks } from "./Fireworks";
import { MobileImageStrip } from "./MobileImageStrip";
import { useIsMobile } from "../hooks/useIsMobile";

interface Scene3DProps {
  imagePaths: Record<string, string>;
  showFireworks: boolean;
  fireworksIntensity?: number;
}

function LoadingFallback() {
  return (
    <Html center>
      <div
        style={{
          color: "#ffe600",
          fontFamily: "Comic Sans MS, cursive",
          fontSize: "1rem",
          whiteSpace: "nowrap",
        }}
      >
        Reise-Teaser laden… 🌍
      </div>
    </Html>
  );
}

function SceneContent({
  imagePaths,
  showFireworks,
  showFloatingCards,
  fireworksIntensity = 1,
}: Scene3DProps & { showFloatingCards: boolean }) {
  return (
    <>
      <color attach="background" args={["#0a0014"]} />
      <fog attach="fog" args={["#0a0014", 28, 55]} />
      <Stars radius={80} depth={40} count={1800} factor={2} saturation={0.4} fade speed={0.5} />
      <Fireworks active={showFireworks} intensity={fireworksIntensity} />
      {showFloatingCards && (
        <Suspense fallback={<LoadingFallback />}>
          <FloatingImages imagePaths={imagePaths} />
        </Suspense>
      )}
      <SceneDecor />
    </>
  );
}

export function Scene3D({ imagePaths, showFireworks, fireworksIntensity = 1 }: Scene3DProps) {
  const isMobile = useIsMobile();

  return (
    <div className={`canvas-layer${isMobile ? " canvas-layer--mobile" : ""}`}>
      {isMobile && <MobileImageStrip imagePaths={imagePaths} />}
      <Canvas
        camera={{ position: [0, 0.8, 8], fov: 72 }}
        dpr={[1, isMobile ? 1.5 : 2]}
        gl={{ antialias: !isMobile, alpha: false, toneMapping: THREE.NoToneMapping }}
      >
        <SceneContent
          imagePaths={imagePaths}
          showFireworks={showFireworks}
          showFloatingCards={!isMobile}
          fireworksIntensity={fireworksIntensity}
        />
      </Canvas>
    </div>
  );
}
