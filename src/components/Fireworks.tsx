import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

type FireworkPattern =
  | "chrysanthemum"
  | "ring"
  | "heart"
  | "palm"
  | "willow"
  | "crossette"
  | "glitter"
  | "double";

interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  color: THREE.Color;
  life: number;
  maxLife: number;
  size: number;
  drag: number;
  gravity: number;
  sparkle: boolean;
  smoke: boolean;
  delay: number;
}

interface Rocket {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  color: THREE.Color;
  life: number;
  maxLife: number;
  pattern: FireworkPattern;
  intensity: number;
  trailTimer: number;
}

interface FlashLight {
  position: THREE.Vector3;
  color: THREE.Color;
  life: number;
  maxLife: number;
}

const PALETTE = ["#ff0040", "#ffe600", "#00ffaa", "#ff69b4", "#9b30ff", "#00ccff", "#ff8800", "#ffffff"];
const PATTERNS: FireworkPattern[] = [
  "chrysanthemum", "ring", "heart", "palm", "willow", "crossette", "glitter", "double",
];
const MAX_PARTICLES = 4500;

function pickColor() {
  return new THREE.Color(PALETTE[Math.floor(Math.random() * PALETTE.length)]);
}

function pickPattern(): FireworkPattern {
  return PATTERNS[Math.floor(Math.random() * PATTERNS.length)];
}

function spawnRocket(x?: number, intensity = 0.7): Rocket {
  const edgeX =
    x ??
    (Math.random() > 0.5
      ? -9 - Math.random() * 7
      : 9 + Math.random() * 7);
  return {
    position: new THREE.Vector3(edgeX, -6.5, -14 - Math.random() * 4),
    velocity: new THREE.Vector3((Math.random() - 0.5) * 0.8, 6 + Math.random() * 3, 0),
    color: pickColor(),
    life: 0,
    maxLife: 0.75 + Math.random() * 0.5,
    pattern: pickPattern(),
    intensity,
    trailTimer: 0,
  };
}

function pushParticle(
  pool: Particle[],
  p: Omit<Particle, "life" | "delay" | "smoke"> & { delay?: number; smoke?: boolean },
) {
  if (pool.length >= MAX_PARTICLES) pool.shift();
  pool.push({ ...p, life: 0, delay: p.delay ?? 0, smoke: p.smoke ?? false });
}

function burstChrysanthemum(pool: Particle[], origin: THREE.Vector3, color: THREE.Color, n: number) {
  for (let i = 0; i < n; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const speed = 2.2 + Math.random() * 3.5;
    pushParticle(pool, {
      position: origin.clone(),
      velocity: new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta) * speed,
        Math.sin(phi) * Math.sin(theta) * speed,
        Math.cos(phi) * speed * 0.6,
      ),
      color: color.clone().offsetHSL(Math.random() * 0.1 - 0.05, 0, Math.random() * 0.2),
      maxLife: 1.6 + Math.random() * 1.1,
      size: 0.07 + Math.random() * 0.1,
      drag: 0.984,
      gravity: 1.6,
      sparkle: Math.random() > 0.45,
    });
  }
}

function burstRing(pool: Particle[], origin: THREE.Vector3, color: THREE.Color, n: number) {
  for (let i = 0; i < n; i++) {
    const angle = (i / n) * Math.PI * 2;
    const speed = 2.8 + Math.random() * 0.8;
    pushParticle(pool, {
      position: origin.clone(),
      velocity: new THREE.Vector3(Math.cos(angle) * speed, Math.sin(angle) * speed * 0.5 + 0.5, Math.sin(angle) * 0.4),
      color: color.clone(),
      maxLife: 1.3 + Math.random() * 0.5,
      size: 0.08 + Math.random() * 0.06,
      drag: 0.987,
      gravity: 1.0,
      sparkle: true,
    });
  }
}

function burstHeart(pool: Particle[], origin: THREE.Vector3, color: THREE.Color, n: number) {
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    const hx = 16 * Math.pow(Math.sin(t), 3);
    const hy = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    const dir = new THREE.Vector3(hx, hy, 0).normalize();
    pushParticle(pool, {
      position: origin.clone(),
      velocity: dir.multiplyScalar(1.6 + Math.random() * 1.4),
      color: new THREE.Color("#ff69b4").lerp(color, 0.3),
      maxLife: 1.8 + Math.random() * 0.8,
      size: 0.07 + Math.random() * 0.06,
      drag: 0.981,
      gravity: 1.2,
      sparkle: true,
    });
  }
}

function burstPalm(pool: Particle[], origin: THREE.Vector3, color: THREE.Color, n: number) {
  const fronds = 9;
  for (let f = 0; f < fronds; f++) {
    const angle = (f / fronds) * Math.PI * 2;
    const base = new THREE.Vector3(Math.cos(angle) * 0.7, 1.1, Math.sin(angle) * 0.35).normalize();
    for (let i = 0; i < Math.floor(n / fronds); i++) {
      pushParticle(pool, {
        position: origin.clone(),
        velocity: base.clone().multiplyScalar(2.8 + Math.random() * 2.5),
        color: color.clone(),
        maxLife: 2.5 + Math.random() * 1.5,
        size: 0.05 + Math.random() * 0.04,
        drag: 0.993,
        gravity: 0.45,
        sparkle: false,
      });
    }
  }
}

function burstWillow(pool: Particle[], origin: THREE.Vector3, color: THREE.Color, n: number) {
  for (let i = 0; i < n; i++) {
    const theta = Math.random() * Math.PI * 2;
    const speed = 1.4 + Math.random() * 2.2;
    pushParticle(pool, {
      position: origin.clone(),
      velocity: new THREE.Vector3(Math.cos(theta) * speed, 1 + Math.random() * 2, Math.sin(theta) * 0.5),
      color: color.clone().lerp(new THREE.Color("#ffe600"), 0.3),
      maxLife: 3 + Math.random() * 1.8,
      size: 0.045 + Math.random() * 0.035,
      drag: 0.997,
      gravity: 0.3,
      sparkle: Math.random() > 0.5,
    });
  }
}

function burstCrossette(pool: Particle[], origin: THREE.Vector3, color: THREE.Color, n: number) {
  for (let a = 0; a < 6; a++) {
    const angle = (a / 6) * Math.PI * 2;
    const dir = new THREE.Vector3(Math.cos(angle), 0.5, Math.sin(angle) * 0.3).normalize();
    for (let i = 0; i < Math.floor(n / 6); i++) {
      pushParticle(pool, {
        position: origin.clone(),
        velocity: dir.clone().multiplyScalar(2.5 + Math.random() * 1.5),
        color: color.clone(),
        maxLife: 0.7 + Math.random() * 0.3,
        size: 0.09,
        drag: 0.96,
        gravity: 1.4,
        sparkle: false,
      });
    }
    pushParticle(pool, {
      position: origin.clone().add(dir.clone().multiplyScalar(1.2)),
      velocity: dir.clone().multiplyScalar(0.8),
      color: pickColor(),
      maxLife: 1.1,
      size: 0.06,
      drag: 0.985,
      gravity: 1.0,
      sparkle: true,
      delay: 0.15,
    });
  }
}

function burstGlitter(pool: Particle[], origin: THREE.Vector3, color: THREE.Color, n: number) {
  for (let i = 0; i < n + 30; i++) {
    const theta = Math.random() * Math.PI * 2;
    const speed = 0.8 + Math.random() * 3;
    pushParticle(pool, {
      position: origin.clone(),
      velocity: new THREE.Vector3(Math.cos(theta) * speed, Math.random() * 3, Math.sin(theta) * speed),
      color: new THREE.Color("#ffffff").lerp(color, Math.random() * 0.5),
      maxLife: 2 + Math.random() * 1.6,
      size: 0.03 + Math.random() * 0.06,
      drag: 0.992,
      gravity: 0.2,
      sparkle: true,
    });
  }
}

function burstDouble(pool: Particle[], origin: THREE.Vector3, color: THREE.Color, n: number) {
  burstChrysanthemum(pool, origin, color, Math.floor(n * 0.5));
  burstRing(pool, origin.clone().add(new THREE.Vector3(0, 0.15, 0)), pickColor(), Math.floor(n * 0.35));
  burstGlitter(pool, origin, new THREE.Color("#ffffff"), Math.floor(n * 0.25));
}

function explode(pool: Particle[], origin: THREE.Vector3, pattern: FireworkPattern, color: THREE.Color, intensity: number) {
  const n = Math.floor(30 + intensity * 55);
  switch (pattern) {
    case "chrysanthemum": burstChrysanthemum(pool, origin, color, n); break;
    case "ring": burstRing(pool, origin, color, n); break;
    case "heart": burstHeart(pool, origin, color, n); break;
    case "palm": burstPalm(pool, origin, color, n); break;
    case "willow": burstWillow(pool, origin, color, n); break;
    case "crossette": burstCrossette(pool, origin, color, n); break;
    case "glitter": burstGlitter(pool, origin, color, n); break;
    case "double": burstDouble(pool, origin, color, n); break;
  }
  for (let i = 0; i < 14; i++) {
    pushParticle(pool, {
      position: origin.clone(),
      velocity: new THREE.Vector3((Math.random() - 0.5) * 0.6, Math.random() * 0.4, (Math.random() - 0.5) * 0.3),
      color: new THREE.Color("#553377"),
      maxLife: 2.5 + Math.random(),
      size: 0.18 + Math.random() * 0.12,
      drag: 0.998,
      gravity: -0.05,
      sparkle: false,
      smoke: true,
    });
  }
}

function burstShockwave(pool: Particle[], origin: THREE.Vector3, color: THREE.Color) {
  for (let i = 0; i < 32; i++) {
    const angle = (i / 32) * Math.PI * 2;
    const speed = 3.5 + Math.random() * 0.8;
    pushParticle(pool, {
      position: origin.clone(),
      velocity: new THREE.Vector3(Math.cos(angle) * speed, Math.sin(angle) * 0.35, Math.sin(angle) * 0.5),
      color: color.clone(),
      maxLife: 0.55 + Math.random() * 0.2,
      size: 0.1 + Math.random() * 0.05,
      drag: 0.975,
      gravity: 0.15,
      sparkle: true,
    });
  }
}

export function Fireworks({ active, intensity = 1 }: { active: boolean; intensity?: number }) {
  const coreRef = useRef<THREE.Points>(null);
  const sparkleRef = useRef<THREE.Points>(null);
  const glowRef = useRef<THREE.Points>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rocketsRef = useRef<Rocket[]>([]);
  const flashesRef = useRef<FlashLight[]>([]);
  const spawnTimer = useRef(0);
  const finaleTimer = useRef(0);
  const pointLightRef = useRef<THREE.PointLight>(null);
  const intensityRef = useRef(intensity);
  intensityRef.current = Math.max(0.15, Math.min(1, intensity));

  const { coreGeo, sparkleGeo, glowGeo, coreMat, sparkleMat, glowMat } = useMemo(() => {
    const mkGeo = (withSize = false) => {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(MAX_PARTICLES * 3), 3));
      geo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(MAX_PARTICLES * 3), 3));
      if (withSize) geo.setAttribute("size", new THREE.BufferAttribute(new Float32Array(MAX_PARTICLES), 1));
      return geo;
    };
    return {
      coreGeo: mkGeo(),
      sparkleGeo: mkGeo(),
      glowGeo: mkGeo(true),
      coreMat: new THREE.PointsMaterial({
        size: 0.12,
        vertexColors: true,
        transparent: true,
        opacity: 0.65,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true,
      }),
      sparkleMat: new THREE.PointsMaterial({
        size: 0.22,
        vertexColors: true,
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true,
      }),
      glowMat: new THREE.PointsMaterial({
        size: 0.4,
        vertexColors: true,
        transparent: true,
        opacity: 0.22,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true,
      }),
    };
  }, []);

  const triggerExplosion = (origin: THREE.Vector3, pattern: FireworkPattern, color: THREE.Color, burstIntensity: number) => {
    burstShockwave(particlesRef.current, origin, color);
    explode(particlesRef.current, origin, pattern, color, burstIntensity);
    flashesRef.current.push({
      position: origin.clone(),
      color: color.clone(),
      life: 0,
      maxLife: 0.4,
    });
  };

  useFrame((_, delta) => {
    if (!coreRef.current || !sparkleRef.current || !glowRef.current) return;

    const level = intensityRef.current;
    coreMat.opacity = 0.25 + level * 0.4;
    sparkleMat.opacity = 0.2 + level * 0.35;
    glowMat.opacity = 0.08 + level * 0.14;

    if (active) {
      spawnTimer.current += delta;
      finaleTimer.current += delta;

      const maxRockets = Math.max(2, Math.round(9 * level));
      const spawnDelay = 0.2 + (1.1 - level * 0.75) + Math.random() * (0.35 + (1 - level) * 0.5);

      if (spawnTimer.current > spawnDelay && rocketsRef.current.length < maxRockets) {
        spawnTimer.current = 0;
        rocketsRef.current.push(spawnRocket(undefined, 0.45 + level * 0.55));
      }

      if (level > 0.65 && finaleTimer.current > 6.5) {
        finaleTimer.current = 0;
        [-10, -5, 5, 10].forEach((fx, i) => {
          window.setTimeout(
            () => rocketsRef.current.push(spawnRocket(fx, 0.7 + level * 0.4)),
            i * 90,
          );
        });
      }
    }

    rocketsRef.current = rocketsRef.current.filter((rocket) => {
      rocket.life += delta;
      rocket.velocity.y -= delta * 3.2;
      rocket.position.addScaledVector(rocket.velocity, delta);
      rocket.trailTimer += delta;

      if (rocket.trailTimer > 0.016) {
        rocket.trailTimer = 0;
        pushParticle(particlesRef.current, {
          position: rocket.position.clone(),
          velocity: new THREE.Vector3((Math.random() - 0.5) * 0.25, -0.9, 0),
          color: rocket.color.clone(),
          maxLife: 0.5,
          size: 0.06,
          drag: 0.9,
          gravity: 0.35,
          sparkle: true,
        });
      }

      // Leuchtender Raketenkopf
      pushParticle(particlesRef.current, {
        position: rocket.position.clone(),
        velocity: new THREE.Vector3(0, 0, 0),
        color: rocket.color.clone(),
        maxLife: 0.06,
        size: 0.2,
        drag: 1,
        gravity: 0,
        sparkle: true,
      });

      if (rocket.life >= rocket.maxLife || rocket.velocity.y <= 0.3 || rocket.position.y > 6.5) {
        triggerExplosion(rocket.position.clone(), rocket.pattern, rocket.color, rocket.intensity);
        if (Math.random() > 0.35 + (1 - intensityRef.current) * 0.45) {
          const pos = rocket.position.clone();
          const pat = Math.random() > 0.5 ? "glitter" : ("ring" as FireworkPattern);
          window.setTimeout(
            () =>
              triggerExplosion(
                pos.clone().add(new THREE.Vector3(0, -0.25, 0)),
                pat,
                pickColor(),
                0.55 * intensityRef.current,
              ),
            140,
          );
        }
        return false;
      }
      return true;
    });

    let flashIntensity = 0;
    const flashColor = new THREE.Color("#ffffff");
    flashesRef.current.forEach((f) => {
      f.life += delta;
      const t = 1 - f.life / f.maxLife;
      if (t > flashIntensity) {
        flashIntensity = t;
        flashColor.copy(f.color);
      }
    });
    flashesRef.current = flashesRef.current.filter((f) => f.life < f.maxLife);

    if (pointLightRef.current) {
      pointLightRef.current.intensity = flashIntensity * 1.4 * intensityRef.current;
      pointLightRef.current.color.copy(flashColor);
    }

    particlesRef.current = particlesRef.current.filter((p) => {
      if (p.delay > 0) {
        p.delay -= delta;
        return true;
      }
      p.life += delta;
      p.velocity.multiplyScalar(p.drag);
      p.velocity.y -= delta * p.gravity;
      p.position.addScaledVector(p.velocity, delta);
      return p.life < p.maxLife;
    });

    const writeParticles = (
      geo: THREE.BufferGeometry,
      pick: (p: Particle) => boolean,
      glow = false,
    ) => {
      const pos = geo.attributes.position as THREE.BufferAttribute;
      const col = geo.attributes.color as THREE.BufferAttribute;
      const sizes = geo.attributes.size as THREE.BufferAttribute | undefined;
      let idx = 0;
      for (const p of particlesRef.current) {
        if (p.delay > 0 || !pick(p)) continue;
        const fade = 1 - p.life / p.maxLife;
        const alpha = p.smoke ? fade * 0.3 : fade * fade;
        pos.setXYZ(idx, p.position.x, p.position.y, p.position.z);
        col.setXYZ(idx, p.color.r * alpha, p.color.g * alpha, p.color.b * alpha);
        if (sizes) sizes.setX(idx, p.size * (glow ? 3 : 1));
        idx++;
        if (idx >= MAX_PARTICLES) break;
      }
      for (let i = idx; i < MAX_PARTICLES; i++) {
        pos.setXYZ(i, 0, -100, 0);
        col.setXYZ(i, 0, 0, 0);
        if (sizes) sizes.setX(i, 0);
      }
      pos.needsUpdate = true;
      col.needsUpdate = true;
      if (sizes) sizes.needsUpdate = true;
    };

    writeParticles(coreGeo, (p) => !p.sparkle && !p.smoke);
    writeParticles(sparkleGeo, (p) => p.sparkle && !p.smoke);
    writeParticles(glowGeo, (p) => p.smoke || p.sparkle, true);
  });

  return (
    <group>
      <pointLight ref={pointLightRef} position={[6, 2, 1]} intensity={0} distance={22} decay={2} />
      <points ref={glowRef} geometry={glowGeo} material={glowMat} />
      <points ref={coreRef} geometry={coreGeo} material={coreMat} />
      <points ref={sparkleRef} geometry={sparkleGeo} material={sparkleMat} />
    </group>
  );
}
