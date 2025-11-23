import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function VaultDoor({ isOpening }: { isOpening: boolean }) {
  const doorRef = useRef<THREE.Group>(null);
  const leftDoorRef = useRef<THREE.Mesh>(null);
  const rightDoorRef = useRef<THREE.Mesh>(null);
  const targetRotation = useRef(0);

  useEffect(() => {
    if (isOpening) {
      targetRotation.current = Math.PI * 0.6;
    }
  }, [isOpening]);

  useFrame(() => {
    if (leftDoorRef.current && rightDoorRef.current) {
      leftDoorRef.current.rotation.y = THREE.MathUtils.lerp(
        leftDoorRef.current.rotation.y,
        -targetRotation.current,
        0.05
      );
      rightDoorRef.current.rotation.y = THREE.MathUtils.lerp(
        rightDoorRef.current.rotation.y,
        targetRotation.current,
        0.05
      );
    }
  });

  return (
    <group ref={doorRef}>
      <ambientLight intensity={0.5} />
      <pointLight position={[0, 0, 5]} intensity={1} />

      <mesh ref={leftDoorRef} position={[-1, 0, 0]}>
        <boxGeometry args={[2, 3, 0.3]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.9} roughness={0.2} />
      </mesh>

      <mesh ref={rightDoorRef} position={[1, 0, 0]}>
        <boxGeometry args={[2, 3, 0.3]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.9} roughness={0.2} />
      </mesh>

      <mesh position={[0, 0, 0.2]}>
        <cylinderGeometry args={[0.3, 0.3, 0.1, 32]} />
        <meshStandardMaterial color="#FFC700" metalness={1} roughness={0.1} />
      </mesh>
    </group>
  );
}
