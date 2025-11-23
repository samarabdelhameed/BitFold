import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function Fireworks() {
  const particlesCount = 1000;
  const particlesRef = useRef<THREE.Points>(null);

  const particles = useMemo(() => {
    const positions = new Float32Array(particlesCount * 3);
    const velocities = new Float32Array(particlesCount * 3);
    const colors = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount; i++) {
      const i3 = i * 3;

      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 0.05 + 0.02;

      positions[i3] = 0;
      positions[i3 + 1] = 0;
      positions[i3 + 2] = 0;

      velocities[i3] = Math.cos(angle) * speed;
      velocities[i3 + 1] = Math.random() * 0.1;
      velocities[i3 + 2] = Math.sin(angle) * speed;

      const color = new THREE.Color();
      color.setHSL(Math.random(), 1, 0.5);
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    }

    return { positions, velocities, colors };
  }, []);

  useFrame(() => {
    if (!particlesRef.current) return;

    const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < particlesCount; i++) {
      const i3 = i * 3;

      positions[i3] += particles.velocities[i3];
      positions[i3 + 1] += particles.velocities[i3 + 1];
      positions[i3 + 2] += particles.velocities[i3 + 2];

      particles.velocities[i3 + 1] -= 0.001;

      if (positions[i3 + 1] < -5) {
        positions[i3] = 0;
        positions[i3 + 1] = 0;
        positions[i3 + 2] = 0;

        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 0.05 + 0.02;
        particles.velocities[i3] = Math.cos(angle) * speed;
        particles.velocities[i3 + 1] = Math.random() * 0.1;
        particles.velocities[i3 + 2] = Math.sin(angle) * speed;
      }
    }

    particlesRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particlesCount}
            array={particles.positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={particlesCount}
            array={particles.colors}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial size={0.1} vertexColors transparent opacity={0.8} />
      </points>
    </>
  );
}
