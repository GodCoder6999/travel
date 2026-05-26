"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Environment } from "@react-three/drei";
import { Suspense, useRef, useState, useEffect, useMemo } from "react";
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

// Per-mode animation profile (camera handled by auto-fit)
const PROFILE: Record<Mode, {
  spin: number; bobAmp: number; bobSpeed: number; tilt?: number;
}> = {
  flight: { spin: 0.6, bobAmp: 0.08, bobSpeed: 1.8, tilt: 0.1 },
  train:  { spin: 0.0, bobAmp: 0.02, bobSpeed: 6.0 },
  metro:  { spin: 0.0, bobAmp: 0.03, bobSpeed: 4.0 },
  taxi:   { spin: 0.4, bobAmp: 0.04, bobSpeed: 5.0 },
  drive:  { spin: 0.4, bobAmp: 0.03, bobSpeed: 5.5 },
  walk:   { spin: 0.0, bobAmp: 0.06, bobSpeed: 3.5 },
};

// Target fit size — model auto-scaled so its largest dim equals this.
// Must be smaller than the vertical/horizontal frustum at camera Z.
// Camera z=3.6 + fov=24 → view height = 2 * 3.6 * tan(12°) ≈ 1.53. Fit at 1.0 = comfy margin.
const FIT_SIZE = 1.0;

function GLTFThing({ mode }: { mode: Mode }) {
  const { scene } = useGLTF(MODEL_URL[mode]);
  const fitted = useMemo(() => {
    const c = scene.clone(true);
    // Force-update matrices so SkinnedMesh / rigged GLBs report real bbox
    c.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(c, true);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    c.position.sub(center);
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    c.scale.setScalar(FIT_SIZE / maxDim);
    return c;
  }, [scene]);

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
    <group ref={ref}>
      <primitive object={fitted} />
    </group>
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
  return (
    <div style={{ width: size, height: size }} className="inline-block">
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0.15, 3.6], fov: 24 }}
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
