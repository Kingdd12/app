import React from 'react';
import * as THREE from 'three';
import { RoundedBox } from '@react-three/drei';

interface TinyHouseProps {
  position: [number, number, number];
  color: string;
}

export const TinyHouse: React.FC<TinyHouseProps> = ({ position, color }) => {
  return (
    <group position={[position[0], position[1], position[2]]}>
      {/* Mud Wall Base */}
      <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
         <cylinderGeometry args={[0.55, 0.6, 0.8, 8]} />
         <meshStandardMaterial color="#8B4513" roughness={1} /> {/* Mud brown */}
      </mesh>
      
      {/* Doorway */}
      <mesh position={[0, 0.3, 0.45]} rotation={[0, 0, 0]}>
         <boxGeometry args={[0.3, 0.5, 0.2]} />
         <meshStandardMaterial color="#3E2723" />
      </mesh>

      {/* Thatched Roof */}
      <mesh position={[0, 1.1, 0]} castShadow>
         <coneGeometry args={[0.75, 0.8, 8]} />
         <meshStandardMaterial color="#eab308" roughness={1} /> {/* Straw yellow */}
      </mesh>
      
      {/* Roof Top Detail */}
      <mesh position={[0, 1.5, 0]}>
         <cylinderGeometry args={[0.1, 0.05, 0.2, 8]} />
         <meshStandardMaterial color="#8B4513" />
      </mesh>

      {/* Player Color Flag/Accent */}
      <mesh position={[0, 1.6, 0]}>
          <sphereGeometry args={[0.15]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} />
      </mesh>
    </group>
  );
};
