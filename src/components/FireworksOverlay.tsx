import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { Fireworks } from "./Fireworks";
import { MobileFireworkSparks } from "./MobileFireworkSparks";
import { useIsMobilePortrait } from "../hooks/useIsMobile";

interface FireworksOverlayProps {
  active: boolean;
  intensity?: number;
}

export function FireworksOverlay({ active, intensity = 1 }: FireworksOverlayProps) {
  const isPortraitMobile = useIsMobilePortrait();

  return (
    <div className={`fireworks-layer${isPortraitMobile ? " fireworks-layer--mobile" : ""}`} aria-hidden="true">
      {isPortraitMobile && active && <MobileFireworkSparks active intensity={intensity} />}
      <Canvas
        camera={{ position: [0, 0.5, 7.2], fov: isPortraitMobile ? 78 : 72 }}
        dpr={[1, isPortraitMobile ? 2 : 2]}
        gl={{
          antialias: true,
          alpha: true,
          premultipliedAlpha: false,
          powerPreference: "high-performance",
          toneMapping: THREE.NoToneMapping,
        }}
        style={{ background: "transparent" }}
      >
        <Fireworks active={active} intensity={intensity} mobileReduced={false} mobileBoost={isPortraitMobile} />
      </Canvas>
    </div>
  );
}
