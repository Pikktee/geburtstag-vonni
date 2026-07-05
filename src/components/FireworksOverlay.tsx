import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { Fireworks } from "./Fireworks";
import { useIsMobilePortrait } from "../hooks/useIsMobile";

interface FireworksOverlayProps {
  active: boolean;
  intensity?: number;
}

export function FireworksOverlay({ active, intensity = 1 }: FireworksOverlayProps) {
  const isPortraitMobile = useIsMobilePortrait();

  return (
    <div className="fireworks-layer" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0.8, 8], fov: 72 }}
        dpr={[1, isPortraitMobile ? 1.5 : 2]}
        gl={{
          antialias: !isPortraitMobile,
          alpha: true,
          toneMapping: THREE.NoToneMapping,
        }}
        style={{ background: "transparent" }}
      >
        <Fireworks active={active} intensity={intensity} mobileReduced={isPortraitMobile} />
      </Canvas>
    </div>
  );
}
