import { useMemo, useRef } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { LOCATION_IMAGES } from "../types";
import {
  CARD_ASPECT,
  CARD_HEIGHT,
  CARD_WIDTH,
  LOCATION_META,
  TRACK_MAX,
  TRACK_MIN,
} from "../config/locations";

/** Bild ohne Verzerrung in 16:9 einpassen (wie CSS object-fit: cover) */
function applyCoverTexture(texture: THREE.Texture, planeAspect: number) {
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.center.set(0.5, 0.5);

  const img = texture.image as HTMLImageElement | { width?: number; height?: number } | undefined;
  const w = img?.width ?? 0;
  const h = img?.height ?? 0;
  if (!w || !h) return;

  const imageAspect = w / h;
  if (imageAspect > planeAspect) {
    const repeatX = planeAspect / imageAspect;
    texture.repeat.set(repeatX, 1);
    texture.offset.set((1 - repeatX) / 2, 0);
  } else {
    const repeatY = imageAspect / planeAspect;
    texture.repeat.set(1, repeatY);
    texture.offset.set(0, (1 - repeatY) / 2);
  }
}

interface FloatingImagesProps {
  imagePaths: Record<string, string>;
}

function DestinationCard({
  texture,
  label,
  tagline,
  laneY,
  depthZ,
  direction,
  speed,
  startX,
}: {
  texture: THREE.Texture;
  label: string;
  tagline: string;
  laneY: number;
  depthZ: number;
  direction: 1 | -1;
  speed: number;
  startX: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const xRef = useRef(startX);
  const halfH = CARD_HEIGHT / 2;

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const dt = Math.min(delta, 1 / 30);
    xRef.current += direction * speed * dt;
    if (xRef.current > TRACK_MAX) xRef.current = TRACK_MIN;
    if (xRef.current < TRACK_MIN) xRef.current = TRACK_MAX;
    groupRef.current.position.set(xRef.current, laneY, depthZ);
  });

  return (
    <group ref={groupRef} position={[startX, laneY, depthZ]} renderOrder={Math.round(-depthZ * 10)}>
      {/* dezenter Rahmen */}
      <mesh position={[0, 0, -0.02]}>
        <planeGeometry args={[CARD_WIDTH + 0.18, CARD_HEIGHT + 0.18]} />
        <meshBasicMaterial color="#ffe600" transparent opacity={0.18} toneMapped={false} />
      </mesh>

      {/* Foto */}
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[CARD_WIDTH, CARD_HEIGHT]} />
        <meshBasicMaterial
          map={texture}
          transparent
          opacity={0.92}
          toneMapped={false}
          side={THREE.FrontSide}
        />
      </mesh>

      {/* leichtes Verwaschungs-Overlay */}
      <mesh position={[0, 0, 0.01]}>
        <planeGeometry args={[CARD_WIDTH, CARD_HEIGHT]} />
        <meshBasicMaterial
          color="#120820"
          transparent
          opacity={0.18}
          toneMapped={false}
          depthWrite={false}
        />
      </mesh>

      {/* dezenter Farbstich */}
      <mesh position={[0, 0, 0.02]}>
        <planeGeometry args={[CARD_WIDTH, CARD_HEIGHT]} />
        <meshBasicMaterial
          color="#6a4088"
          transparent
          opacity={0.07}
          toneMapped={false}
          depthWrite={false}
        />
      </mesh>

      {/* Beschriftung auf dem Foto */}
      <Html
        transform
        occlude={false}
        distanceFactor={7.2}
        position={[0, -halfH + CARD_HEIGHT * 0.18, 0.05]}
        center
        style={{ pointerEvents: "none", userSelect: "none" }}
      >
        <div className="dest-label dest-label--overlay">
          <span className="dest-label__eyebrow">✈ Reiseziel</span>
          <span className="dest-label__name">{label}</span>
          <span className="dest-label__tagline">{tagline}</span>
        </div>
      </Html>
    </group>
  );
}

export function FloatingImages({ imagePaths }: FloatingImagesProps) {
  const urls = LOCATION_IMAGES.map((id) => imagePaths[id] ?? `/assets/images/${id}.jpg`);
  const textures = useLoader(THREE.TextureLoader, urls);

  textures.forEach((tex) => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    applyCoverTexture(tex, CARD_ASPECT);
  });

  const cards = useMemo(
    () =>
      LOCATION_IMAGES.map((id, i) => ({
        id,
        texture: textures[i],
        ...LOCATION_META[id],
      })),
    [textures],
  );

  return (
    <group>
      {cards.map((card) => (
        <DestinationCard
          key={card.id}
          texture={card.texture}
          label={card.label}
          tagline={card.tagline}
          laneY={card.laneY}
          depthZ={card.depthZ}
          direction={card.direction}
          speed={card.speed}
          startX={card.startX}
        />
      ))}
    </group>
  );
}

export function SceneDecor() {
  const particles = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        x: (i * 2.3) % 18 - 9,
        y: (i * 1.7) % 8 - 4,
        z: -5 - (i % 5) * 1.1,
        color: ["#ffe600", "#ff0040", "#ff69b4", "#9b30ff"][i % 4],
        size: 0.02 + (i % 3) * 0.012,
      })),
    [],
  );

  return (
    <>
      {particles.map((p, i) => (
        <mesh key={i} position={[p.x, p.y, p.z]}>
          <sphereGeometry args={[p.size, 6, 6]} />
          <meshBasicMaterial color={p.color} transparent opacity={0.22} />
        </mesh>
      ))}
    </>
  );
}
