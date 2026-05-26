"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sphere, OrbitControls, Float } from "@react-three/drei";
import { useRef, useMemo } from "react";
import * as THREE from "three";

function EarthLike({ scrollY }: { scrollY: { current: number } }) {
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
    // fake continents
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

export default function Globe3D({ scrollY }: { scrollY: { current: number } }) {
  return (
    <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 5.2], fov: 45 }}>
      <ambientLight intensity={0.9} />
      <directionalLight position={[5, 3, 5]} intensity={1.4} color="#fff5e0" />
      <directionalLight position={[-5, -2, -3]} intensity={0.5} color="#5b9fcd" />
      <Float speed={1.2} floatIntensity={0.4} rotationIntensity={0.3}>
        <EarthLike scrollY={scrollY} />
      </Float>
      <Plane scrollY={scrollY} />
      <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.4} />
    </Canvas>
  );
}
