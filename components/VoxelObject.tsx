import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import { useBox } from '@react-three/cannon';
import * as THREE from 'three';

interface VoxelProps {
  position: [number, number, number];
  color: string;
  scale?: number;
  hoverEffect?: boolean;
  onClick?: () => void;
  opacity?: number;
}

export const Voxel: React.FC<VoxelProps> = ({ position, color, scale = 1, hoverEffect, onClick, opacity = 1 }) => {
  const [hovered, setHover] = useState(false);

  // Static box for path tiles
  const [ref] = useBox(() => ({
    type: 'Static',
    position: position,
    args: [0.95, 0.2, 0.95], // Flatter stones
  }));

  return (
    <RoundedBox
      ref={ref as any}
      args={[0.95, 0.2, 0.95]} 
      radius={0.05}
      smoothness={2}
      onClick={(e) => {
        if (onClick) {
          e.stopPropagation();
          onClick();
        }
      }}
      onPointerOver={() => hoverEffect && setHover(true)}
      onPointerOut={() => hoverEffect && setHover(false)}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial 
        color={hovered && hoverEffect ? '#ffffff' : color} 
        transparent={opacity < 1} 
        opacity={opacity} 
        roughness={0.9} // Matte stone look
      />
    </RoundedBox>
  );
};