"use client";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { Sphere, OrbitControls, Float } from "@react-three/drei";
import { Suspense, useRef, useMemo, useState, useEffect } from "react";
import * as THREE from "three";

/* ------------ Real (NASA-style) Earth ------------ */

const TEX = {
  day:    "/textures/earth_day.jpg",
  normal: "/textures/earth_normal.jpg",
  spec:   "/textures/earth_spec.jpg",
  clouds: "/textures/earth_clouds.jpg",
};

function RealEarth({ scrollY }: { scrollY: { current: number } }) {
  const [day, normal, spec, clouds] = useLoader(THREE.TextureLoader, [
    TEX.day, TEX.normal, TEX.spec, TEX.clouds,
  ]);
  // sRGB color space for the base color map
  day.colorSpace = THREE.SRGBColorSpace;

  const earthRef = useRef<THREE.Mesh>(null!);
  const cloudRef = useRef<THREE.Mesh>(null!);

  useFrame((_, dt) => {
    if (earthRef.current) {
      earthRef.current.rotation.y += dt * 0.06;
      const y = scrollY.current || 0;
      earthRef.current.rotation.x = y * 0.0008;
      earthRef.current.position.y = -y * 0.0015;
      earthRef.current.scale.setScalar(1 + Math.min(y * 0.0004, 0.6));
    }
    if (cloudRef.current) {
      cloudRef.current.rotation.y += dt * 0.085;
    }
  });

  return (
    <group>
      <Sphere ref={earthRef} args={[1.6, 128, 128]}>
        <meshStandardMaterial
          map={day}
          normalMap={normal}
          normalScale={new THREE.Vector2(0.85, 0.85)}
          roughnessMap={spec}
          roughness={0.9}
          metalness={0.05}
        />
      </Sphere>
      <Sphere ref={cloudRef} args={[1.612, 96, 96]}>
        <meshStandardMaterial
          map={clouds}
          transparent
          opacity={0.55}
          depthWrite={false}
        />
      </Sphere>
      {/* Atmospheric fresnel glow */}
      <Sphere args={[1.74, 64, 64]}>
        <shaderMaterial
          transparent
          side={THREE.BackSide}
          uniforms={{ glow: { value: new THREE.Color("#7ec0e0") } }}
          vertexShader={`
            varying vec3 vN;
            void main(){
              vN = normalize(normalMatrix * normal);
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }`}
          fragmentShader={`
            uniform vec3 glow;
            varying vec3 vN;
            void main(){
              float i = pow(0.78 - dot(vN, vec3(0.0, 0.0, 1.0)), 2.6);
              gl_FragColor = vec4(glow, i);
            }`}
        />
      </Sphere>
    </group>
  );
}

/* ------------ Procedural fallback (existing) ------------ */

function ProceduralEarth({ scrollY }: { scrollY: { current: number } }) {
  const ref = useRef<THREE.Mesh>(null!);
  const tex = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024; canvas.height = 512;
    const ctx = canvas.getContext("2d")!;
    const grad = ctx.createLinearGradient(0, 0, 1024, 512);
    grad.addColorStop(0, "#5b9fcd");
    grad.addColorStop(0.4, "#7ec0e0");
    grad.addColorStop(0.7, "#a8d8ef");
    grad.addColorStop(1, "#6cb3d8");
    ctx.fillStyle = grad; ctx.fillRect(0, 0, 1024, 512);
    ctx.fillStyle = "#7fa57a";
    for (let i = 0; i < 60; i++) {
      const x = Math.random() * 1024, y = Math.random() * 512;
      const r = 30 + Math.random() * 120;
      ctx.beginPath();
      for (let a = 0; a < Math.PI * 2; a += 0.2) {
        const rr = r * (0.6 + Math.random() * 0.6);
        ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.6);
      }
      ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    for (let i = 0; i < 30; i++) {
      ctx.beginPath();
      ctx.ellipse(Math.random() * 1024, Math.random() * 512, 80 + Math.random() * 120, 20 + Math.random() * 40, Math.random(), 0, Math.PI * 2);
      ctx.fill();
    }
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);

  useFrame((_, dt) => {
    if (!ref.current) return;
    ref.current.rotation.y += dt * 0.08;
    const y = scrollY.current || 0;
    ref.current.rotation.x = y * 0.0008;
    ref.current.position.y = -y * 0.0015;
    ref.current.scale.setScalar(1 + Math.min(y * 0.0004, 0.6));
  });

  return (
    <group>
      <Sphere ref={ref} args={[1.6, 96, 96]}>
        <meshStandardMaterial map={tex} roughness={0.7} metalness={0.15} />
      </Sphere>
      <Sphere args={[1.66, 64, 64]}>
        <meshBasicMaterial color="#f5b94e" transparent opacity={0.10} side={THREE.BackSide} />
      </Sphere>
    </group>
  );
}

/* ------------ Orbiting plane ------------ */

function Plane({ scrollY }: { scrollY: { current: number } }) {
  const ref = useRef<THREE.Group>(null!);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime;
    const y = scrollY.current || 0;
    ref.current.position.x = Math.cos(t * 0.4) * 2.6;
    ref.current.position.z = Math.sin(t * 0.4) * 2.6;
    ref.current.position.y = 0.4 + Math.sin(t) * 0.15 + y * 0.0008;
    ref.current.rotation.y = -t * 0.4 + Math.PI / 2;
  });
  return (
    <group ref={ref}>
      <mesh>
        <boxGeometry args={[0.35, 0.08, 0.08]} />
        <meshStandardMaterial color="#ff6a5b" emissive="#ff6a5b" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.08, 0.02, 0.4]} />
        <meshStandardMaterial color="#fff9ee" />
      </mesh>
      <mesh position={[-0.12, 0.02, 0]}>
        <boxGeometry args={[0.06, 0.06, 0.15]} />
        <meshStandardMaterial color="#fff9ee" />
      </mesh>
    </group>
  );
}

/* ------------ Asset probing — pick real vs procedural ------------ */

function useAssetAvailable(url: string): boolean | null {
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

export default function Globe3D({ scrollY }: { scrollY: { current: number } }) {
  const haveTextures = useAssetAvailable(TEX.day);

  return (
    <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 5.2], fov: 45 }}>
      <ambientLight intensity={0.85} />
      <directionalLight position={[5, 3, 5]} intensity={1.5} color="#fff5e0" />
      <directionalLight position={[-5, -2, -3]} intensity={0.45} color="#5b9fcd" />
      <Float speed={1.0} floatIntensity={0.35} rotationIntensity={0.25}>
        <Suspense fallback={<ProceduralEarth scrollY={scrollY} />}>
          {haveTextures ? <RealEarth scrollY={scrollY} /> : <ProceduralEarth scrollY={scrollY} />}
        </Suspense>
      </Float>
      <Plane scrollY={scrollY} />
      <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.35} />
    </Canvas>
  );
}
