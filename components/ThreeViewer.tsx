"use client";
import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import * as THREE from "three";

export type Mesh3D = {
  type: "box" | "cylinder" | "sphere";
  x?: number; y?: number; z?: number;
  color?: string;
  // box
  w?: number; h?: number; d?: number;
  // cylinder
  rt?: number; rb?: number;
  // sphere
  r?: number;
};

function MeshShape({ m }: { m: Mesh3D }) {
  const ref = useRef<THREE.Mesh>(null);

  let geometry: THREE.BufferGeometry;
  if (m.type === "box") {
    geometry = new THREE.BoxGeometry(m.w ?? 1, m.h ?? 1, m.d ?? 1);
  } else if (m.type === "cylinder") {
    geometry = new THREE.CylinderGeometry(m.rt ?? 0.5, m.rb ?? 0.5, m.h ?? 1, 32);
  } else {
    geometry = new THREE.SphereGeometry(m.r ?? 0.5, 32, 16);
  }

  return (
    <mesh ref={ref} position={[m.x ?? 0, m.y ?? 0, m.z ?? 0]} geometry={geometry}>
      <meshStandardMaterial color={m.color ?? "#60a5fa"} roughness={0.3} metalness={0.1} />
    </mesh>
  );
}

function RotatingGroup({ meshes }: { meshes: Mesh3D[] }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.4;
  });
  return (
    <group ref={ref}>
      {meshes.map((m, i) => (
        <MeshShape key={i} m={m} />
      ))}
    </group>
  );
}

export default function ThreeViewer({ meshes }: { meshes: Mesh3D[] }) {
  return (
    <div className="w-full h-full rounded-xl overflow-hidden bg-[#0d1117]">
      <Canvas camera={{ position: [5, 4, 5], fov: 45 }}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 10, 5]} intensity={1.2} />
        <directionalLight position={[-5, -5, -5]} intensity={0.3} color="#6366f1" />
        <RotatingGroup meshes={meshes} />
        <OrbitControls enablePan={false} minDistance={3} maxDistance={15} />
        <Environment preset="city" />
        <gridHelper args={[10, 10, "#1f2937", "#111827"]} position={[0, -3, 0]} />
      </Canvas>
    </div>
  );
}
