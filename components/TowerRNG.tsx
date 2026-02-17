import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Sphere } from '@react-three/drei';
import * as THREE from 'three';

interface TowerRNGProps {
  rolling: boolean;
  value: number | null;
}

export const TowerRNG: React.FC<TowerRNGProps> = ({ rolling, value }) => {
  const dieRef = useRef<THREE.Group>(null);
  
  const getRotationForValue = (val: number): [number, number, number] => {
    switch(val) {
      case 1: return [0, 0, 0];
      case 2: return [0, 0, -Math.PI/2];
      case 3: return [Math.PI/2, 0, 0];
      case 4: return [-Math.PI/2, 0, 0];
      case 5: return [0, 0, Math.PI/2];
      case 6: return [Math.PI, 0, 0];
      default: return [0, 0, 0];
    }
  };

  useFrame((state, delta) => {
    if (dieRef.current) {
      if (rolling) {
        dieRef.current.rotation.x += 15 * delta;
        dieRef.current.rotation.y += 12 * delta;
        dieRef.current.rotation.z += 8 * delta;
      } else if (value) {
        const target = getRotationForValue(value);
        dieRef.current.rotation.x = THREE.MathUtils.lerp(dieRef.current.rotation.x, target[0], 10 * delta);
        dieRef.current.rotation.y = THREE.MathUtils.lerp(dieRef.current.rotation.y, target[1], 10 * delta);
        dieRef.current.rotation.z = THREE.MathUtils.lerp(dieRef.current.rotation.z, target[2], 10 * delta);
      }
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Baobab Trunk */}
      <mesh position={[0, 1, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.2, 1.8, 2.5, 7]} />
        <meshStandardMaterial color="#5d4037" roughness={0.9} />
      </mesh>
      
      {/* Hollow/Opening for Die */}
      <mesh position={[0, 1.2, 0.8]} rotation={[0.5, 0, 0]}>
         <cylinderGeometry args={[0.8, 0.8, 1, 6]} />
         <meshStandardMaterial color="#3e2723" />
      </mesh>

      {/* Canopy */}
      <group position={[0, 2.5, 0]}>
        <mesh position={[0, 0, 0]} castShadow>
           <dodecahedronGeometry args={[2.5, 0]} />
           <meshStandardMaterial color="#4ade80" roughness={1} />
        </mesh>
        <mesh position={[1, 0.5, 0.5]} castShadow>
           <dodecahedronGeometry args={[1.5, 0]} />
           <meshStandardMaterial color="#22c55e" roughness={1} />
        </mesh>
        <mesh position={[-1, 0.2, -0.5]} castShadow>
           <dodecahedronGeometry args={[1.8, 0]} />
           <meshStandardMaterial color="#16a34a" roughness={1} />
        </mesh>
      </group>

      {/* Floating Die in front of tree */}
      <group position={[0, 1.5, 1.2]}>
        <group ref={dieRef} scale={0.6}>
            <DieMesh color="#ffffff" />
        </group>
      </group>
    </group>
  );
};

// Simplified Die Mesh
const DieMesh = ({ color }: { color: string }) => {
  return (
    <group>
        <RoundedBox args={[1.2, 1.2, 1.2]} radius={0.1} smoothness={2}>
            <meshStandardMaterial color={color} />
        </RoundedBox>
        {/* Dots */}
        {/* 1 */}
        <Dot pos={[0, 0.61, 0]} />
        {/* 6 */}
        <group rotation={[Math.PI, 0, 0]}>
             <Dot pos={[-0.3, 0.61, -0.3]} /> <Dot pos={[-0.3, 0.61, 0]} /> <Dot pos={[-0.3, 0.61, 0.3]} />
             <Dot pos={[0.3, 0.61, -0.3]} /> <Dot pos={[0.3, 0.61, 0]} /> <Dot pos={[0.3, 0.61, 0.3]} />
        </group>
        {/* 2 */}
        <group rotation={[0, 0, -Math.PI/2]}>
             <Dot pos={[-0.3, 0.61, -0.3]} /> <Dot pos={[0.3, 0.61, 0.3]} />
        </group>
        {/* 5 */}
        <group rotation={[0, 0, Math.PI/2]}>
             <Dot pos={[-0.3, 0.61, -0.3]} /> <Dot pos={[0.3, 0.61, 0.3]} /> <Dot pos={[0, 0.61, 0]} />
             <Dot pos={[-0.3, 0.61, 0.3]} /> <Dot pos={[0.3, 0.61, -0.3]} />
        </group>
        {/* 3 */}
        <group rotation={[Math.PI/2, 0, 0]}>
             <Dot pos={[-0.3, 0.61, -0.3]} /> <Dot pos={[0, 0.61, 0]} /> <Dot pos={[0.3, 0.61, 0.3]} />
        </group>
        {/* 4 */}
        <group rotation={[-Math.PI/2, 0, 0]}>
             <Dot pos={[-0.3, 0.61, -0.3]} /> <Dot pos={[0.3, 0.61, 0.3]} />
             <Dot pos={[-0.3, 0.61, 0.3]} /> <Dot pos={[0.3, 0.61, -0.3]} />
        </group>
    </group>
  );
};

const Dot = ({ pos }: { pos: [number, number, number] }) => (
    <mesh position={pos}>
        <cylinderGeometry args={[0.12, 0.12, 0.05, 12]} />
        <meshStandardMaterial color="black" />
    </mesh>
);