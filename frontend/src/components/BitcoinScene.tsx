import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

export function BitcoinScene() {
  const mainRef = useRef<THREE.Mesh>(null);
  const orb1Ref = useRef<THREE.Mesh>(null);
  const orb2Ref = useRef<THREE.Mesh>(null);
  const orb3Ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (mainRef.current) {
      mainRef.current.rotation.y = clock.getElapsedTime() * 0.3;
    }

    if (orb1Ref.current) {
      orb1Ref.current.position.x = Math.sin(clock.getElapsedTime() * 0.5) * 3;
      orb1Ref.current.position.y = Math.cos(clock.getElapsedTime() * 0.5) * 2;
    }

    if (orb2Ref.current) {
      orb2Ref.current.position.x = Math.sin(clock.getElapsedTime() * 0.7 + 2) * 3;
      orb2Ref.current.position.y = Math.cos(clock.getElapsedTime() * 0.7 + 2) * 2;
    }

    if (orb3Ref.current) {
      orb3Ref.current.position.x = Math.sin(clock.getElapsedTime() * 0.4 + 4) * 3;
      orb3Ref.current.position.y = Math.cos(clock.getElapsedTime() * 0.4 + 4) * 2;
    }
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />

      <Sphere ref={mainRef} args={[1.5, 64, 64]} position={[0, 0, 0]}>
        <MeshDistortMaterial
          color="#FFC700"
          attach="material"
          distort={0.3}
          speed={1.5}
          roughness={0.2}
          metalness={0.8}
        />
      </Sphere>

      <Sphere ref={orb1Ref} args={[0.3, 32, 32]} position={[3, 0, -2]}>
        <meshStandardMaterial color="#00D4FF" emissive="#00D4FF" emissiveIntensity={0.5} />
      </Sphere>

      <Sphere ref={orb2Ref} args={[0.25, 32, 32]} position={[-3, 0, -2]}>
        <meshStandardMaterial color="#00FF85" emissive="#00FF85" emissiveIntensity={0.5} />
      </Sphere>

      <Sphere ref={orb3Ref} args={[0.35, 32, 32]} position={[0, 3, -2]}>
        <meshStandardMaterial color="#FFC700" emissive="#FFC700" emissiveIntensity={0.5} />
      </Sphere>
    </>
  );
}
