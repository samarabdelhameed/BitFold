import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function CoinRain() {
  const count = 50;
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const coins = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      temp.push({
        x: Math.random() * 10 - 5,
        y: Math.random() * 10 + 5,
        z: Math.random() * 4 - 2,
        speed: Math.random() * 0.05 + 0.02,
        rotation: Math.random() * Math.PI * 2
      });
    }
    return temp;
  }, []);

  useFrame(() => {
    if (!meshRef.current) return;

    const dummy = new THREE.Object3D();

    coins.forEach((coin, i) => {
      coin.y -= coin.speed;
      if (coin.y < -5) {
        coin.y = 10;
        coin.x = Math.random() * 10 - 5;
      }

      coin.rotation += 0.05;

      dummy.position.set(coin.x, coin.y, coin.z);
      dummy.rotation.set(0, coin.rotation, 0);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[0, 5, 5]} intensity={1} />
      <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
        <cylinderGeometry args={[0.15, 0.15, 0.05, 32]} />
        <meshStandardMaterial color="#FFC700" metalness={0.9} roughness={0.1} />
      </instancedMesh>
    </>
  );
}
