"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Center, Environment } from "@react-three/drei";
import { Suspense, useRef, useState, useEffect } from "react";
import * as THREE from "three";

type Mode = "walk" | "metro" | "taxi" | "drive" | "train" | "flight";

const MODEL_URL: Record<Mode, string> = {
  flight: "/models/plane.glb",
  train:  "/models/train.glb",
  metro:  "/models/metro.glb",
  taxi:   "/models/taxi.glb",
  drive:  "/models/car.glb",
  walk:   "/models/walker.glb",
};

// Per-mode camera + animation profile
const PROFILE: Record<Mode, {
  camY: number; camZ: number; scale: number; spin: number; bobAmp: number; bobSpeed: number; tilt?: number;
}> = {
  flight: { camY: 0.4, camZ: 2.2, scale: 0.9, spin: 0.6, bobAmp: 0.08, bobSpeed: 1.8, tilt: 0.1 },
  train:  { camY: 0.6, camZ: 2.6, scale: 0.6, spin: 0.0, bobAmp: 0.02, bobSpeed: 6.0 },
  metro:  { camY: 0.5, camZ: 2.4, scale: 0.7, spin: 0.0, bobAmp: 0.03, bobSpeed: 4.0 },
  taxi:   { camY: 0.6, camZ: 2.4, scale: 0.7, spin: 0.4, bobAmp: 0.04, bobSpeed: 5.0 },
  drive:  { camY: 0.6, camZ: 2.4, scale: 0.7, spin: 0.4, bobAmp: 0.03, bobSpeed: 5.5 },
  walk:   { camY: 0.7, camZ: 2.2, scale: 0.9, spin: 0.0, bobAmp: 0.06, bobSpeed: 3.5 },
};

function GLTFThing({ mode }: { mode: Mode }) {
  const { scene } = useGLTF(MODEL_URL[mode]);
  const clone = useRef(scene.clone(true)).current;
  const ref = useRef<THREE.Group>(null!);
  const p = PROFILE[mode];
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime;
    ref.current.rotation.y = p.spin ? t * p.spin : Math.sin(t * 0.5) * 0.3;
    ref.current.rotation.x = p.tilt || 0;
    ref.current.position.y = Math.sin(t * p.bobSpeed) * p.bobAmp;
  });
  return (
    <Center>
      <group ref={ref} scale={p.scale}>
        <primitive object={clone} />
      </group>
    </Center>
  );
}

// Probe asset existence — if 404, parent falls back to SVG.
function useAssetExists(url: string): boolean | null {
  const [ok, setOk] = useState<boolean | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch(url, { method: "HEAD" })
      .then((r) => { if (!cancelled) setOk(r.ok); })
      .catch(() => { if (!cancelled) setOk(false); });
    return () => { cancelled = true; };
  }, [url]);
  return ok;
}

export function TransportIcon3D({ mode, size = 64 }: { mode: Mode; size?: number }) {
  const have = useAssetExists(MODEL_URL[mode]);
  if (have === false) return null; // signals to caller "use fallback"
  if (have === null) {
    return <div style={{ width: size, height: size }} />; // probe pending
  }
  const p = PROFILE[mode];
  return (
    <div style={{ width: size, height: size }} className="inline-block">
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, p.camY, p.camZ], fov: 35 }}
        frameloop="always"
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[3, 4, 3]} intensity={1.2} />
        <directionalLight position={[-2, -1, -2]} intensity={0.4} color="#7ec0e0" />
        <Suspense fallback={null}>
          <GLTFThing mode={mode} />
          <Environment preset="city" />
        </Suspense>
      </Canvas>
    </div>
  );
}

// Preload all model URLs at module init so first render is snappy.
// useGLTF.preload is a no-op if the URL eventually 404s.
Object.values(MODEL_URL).forEach((u) => useGLTF.preload(u));
