import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { PlayerColor } from '../types';

interface CharacterProps {
  position: [number, number, number];
  color: string;
  variant?: PlayerColor;
  scale?: number;
  hoverEffect?: boolean;
  onClick?: () => void;
  activeTurn?: boolean;
}

const Accessories = ({ variant, color }: { variant: PlayerColor; color: string }) => {
  switch (variant) {
    case 'RED': // Sporty - Backwards Cap
      return (
        <group position={[0, 1.35, 0]}>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.42, 0.15, 0.42]} />
            <meshStandardMaterial color="#7f1d1d" /> 
          </mesh>
          <mesh position={[0, -0.05, 0.25]}>
            <boxGeometry args={[0.42, 0.05, 0.2]} />
            <meshStandardMaterial color="#7f1d1d" />
          </mesh>
        </group>
      );
    case 'BLUE': // Cool - Sunglasses & Hat
      return (
        <group>
            <mesh position={[0, 1.15, 0.22]}>
                <boxGeometry args={[0.3, 0.08, 0.05]} />
                <meshStandardMaterial color="black" roughness={0.1} />
            </mesh>
            <mesh position={[0, 1.35, 0]}>
                <boxGeometry args={[0.42, 0.12, 0.42]} />
                <meshStandardMaterial color="#1e3a8a" />
            </mesh>
             <mesh position={[0, 1.3, 0.25]}>
                <boxGeometry args={[0.42, 0.05, 0.15]} />
                <meshStandardMaterial color="#1e3a8a" />
            </mesh>
        </group>
      );
    case 'GREEN': // Gamer - Headphones
      return (
        <group position={[0, 1.1, 0]}>
          {/* Band */}
          <mesh position={[0, 0.25, 0]}>
            <boxGeometry args={[0.46, 0.05, 0.1]} />
            <meshStandardMaterial color="#111" />
          </mesh>
          {/* Cups */}
          <mesh position={[0.24, 0, 0]}>
            <boxGeometry args={[0.1, 0.25, 0.2]} />
            <meshStandardMaterial color="#111" />
          </mesh>
          <mesh position={[-0.24, 0, 0]}>
            <boxGeometry args={[0.1, 0.25, 0.2]} />
            <meshStandardMaterial color="#111" />
          </mesh>
           {/* Mic */}
           <mesh position={[-0.24, -0.1, 0.15]} rotation={[0, 0.5, 0]}>
            <boxGeometry args={[0.02, 0.02, 0.2]} />
            <meshStandardMaterial color="#333" />
          </mesh>
        </group>
      );
    case 'YELLOW': // Punk - Mohawk
      return (
        <group position={[0, 1.35, 0]}>
          <mesh>
            <boxGeometry args={[0.1, 0.3, 0.4]} />
            <meshStandardMaterial color="#a16207" />
          </mesh>
        </group>
      );
    default:
      return null;
  }
};

export const VoxelCharacter: React.FC<CharacterProps> = ({ position, color, variant, scale = 1, hoverEffect, onClick, activeTurn }) => {
  const groupRef = useRef<THREE.Group>(null);
  const leftLegGroup = useRef<THREE.Group>(null);
  const rightLegGroup = useRef<THREE.Group>(null);
  const leftArmGroup = useRef<THREE.Group>(null);
  const rightArmGroup = useRef<THREE.Group>(null);
  const markerRef = useRef<THREE.Mesh>(null);
  
  const [hovered, setHover] = useState(false);
  const [randomPhase] = useState(() => Math.random() * 100);

  // Use state for initial position only once to prevent snapping during re-renders if the component remounts
  // However, we must rely on props 'position' for the target.
  
  // We initialize the ref position in a layout effect if needed, but Three.js handles it.
  // Instead of state, we use the prop directly for the target, and allow useFrame to interpolate.

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const currentPos = groupRef.current.position;
    // We target the prop position directly
    const targetX = position[0];
    const targetY = position[1];
    const targetZ = position[2];

    const dx = targetX - currentPos.x;
    const dz = targetZ - currentPos.z;
    const distXZ = Math.sqrt(dx * dx + dz * dz);
    const isMoving = distXZ > 0.05;
    
    // Smooth Interpolation
    const lerpSpeed = 8 * delta; 

    // Move X/Z
    currentPos.x = THREE.MathUtils.lerp(currentPos.x, targetX, lerpSpeed);
    currentPos.z = THREE.MathUtils.lerp(currentPos.z, targetZ, lerpSpeed);
    
    // Y Movement (Bobbing + Jumping)
    const time = state.clock.elapsedTime + randomPhase;
    let yOffset = Math.sin(time * 3) * 0.02; // Subtle idle bob

    if (hoverEffect && hovered) {
      yOffset += 0.5; // Jump up on hover
    }
    
    if (isMoving) {
       // Peak height scaling with distance
       const jumpHeight = Math.min(distXZ * 0.8, 1.5); 
       // Arc calculation based on distance remaining
       const progress = Math.min(distXZ, 1.0); 
       yOffset += Math.sin(progress * Math.PI) * jumpHeight;
    }
    
    // Interpolate Y
    currentPos.y = THREE.MathUtils.lerp(currentPos.y, targetY + yOffset, lerpSpeed);

    // Rotation & Tilt Logic
    if (isMoving && !(hoverEffect && hovered)) {
       const targetRotation = Math.atan2(dx, dz);
       
       // Smooth rotation
       let diff = targetRotation - groupRef.current.rotation.y;
       while (diff > Math.PI) diff -= Math.PI * 2;
       while (diff < -Math.PI) diff += Math.PI * 2;
       groupRef.current.rotation.y += diff * 12 * delta;

       const tilt = Math.min(distXZ * 0.5, 0.25);
       groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, tilt, lerpSpeed);

    } else if (hoverEffect && hovered) {
       groupRef.current.rotation.y += 5 * delta;
       groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, 0, lerpSpeed);
    } else {
       groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, 0, lerpSpeed);
    }

    // Limb Animation
    const w = time * 20;
    if (isMoving) {
        const legAmp = 1.2;
        const armAmp = 1.2;
        if (leftLegGroup.current) leftLegGroup.current.rotation.x = Math.sin(w) * legAmp;
        if (rightLegGroup.current) rightLegGroup.current.rotation.x = Math.sin(w + Math.PI) * legAmp;
        if (leftArmGroup.current) leftArmGroup.current.rotation.x = Math.sin(w + Math.PI) * armAmp;
        if (rightArmGroup.current) rightArmGroup.current.rotation.x = Math.sin(w) * armAmp;
    } else {
        const resetSpeed = 10 * delta;
        if (leftLegGroup.current) leftLegGroup.current.rotation.x = THREE.MathUtils.lerp(leftLegGroup.current.rotation.x, 0, resetSpeed);
        if (rightLegGroup.current) rightLegGroup.current.rotation.x = THREE.MathUtils.lerp(rightLegGroup.current.rotation.x, 0, resetSpeed);
        if (leftArmGroup.current) leftArmGroup.current.rotation.x = THREE.MathUtils.lerp(leftArmGroup.current.rotation.x, 0, resetSpeed);
        if (rightArmGroup.current) rightArmGroup.current.rotation.x = THREE.MathUtils.lerp(rightArmGroup.current.rotation.x, 0, resetSpeed);
    }

    // Marker Animation
    if (markerRef.current) {
        markerRef.current.position.y = 2.0 + Math.sin(state.clock.elapsedTime * 6) * 0.2;
        markerRef.current.rotation.y += 2 * delta;
    }
  });

  const skinColor = "#8d5524"; 
  const pantsColor = "#1f2937"; 
  const shoeColor = "#000000";
  const armYOffset = -0.225;

  return (
    <group 
      ref={groupRef} 
      scale={scale} 
      position={position} // Start at the passed position props immediately
      onClick={(e) => {
        if (onClick) {
          e.stopPropagation();
          onClick();
        }
      }}
      onPointerOver={() => setHover(true)}
      onPointerOut={() => setHover(false)}
    >
      {/* Active Turn Marker */}
      {activeTurn && (
        <mesh ref={markerRef} position={[0, 2.0, 0]}>
          <coneGeometry args={[0.2, 0.4, 4]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} />
        </mesh>
      )}

      {/* Highlight Ring */}
      {hovered && hoverEffect && (
          <mesh position={[0, 0.7, 0]}>
              <sphereGeometry args={[1.3, 16, 16]} />
              <meshBasicMaterial color="white" opacity={0.3} transparent wireframe />
          </mesh>
      )}

      {/* Legs */}
      <group ref={leftLegGroup} position={[-0.15, 0.4, 0]}>
        <RoundedBox args={[0.25, 0.35, 0.25]} position={[0, -0.1, 0]} radius={0.05} castShadow receiveShadow>
          <meshStandardMaterial color={pantsColor} />
        </RoundedBox>
        <mesh position={[0, -0.3, 0.05]} castShadow>
             <boxGeometry args={[0.26, 0.1, 0.35]} />
             <meshStandardMaterial color={shoeColor} />
        </mesh>
      </group>

      <group ref={rightLegGroup} position={[0.15, 0.4, 0]}>
         <RoundedBox args={[0.25, 0.35, 0.25]} position={[0, -0.1, 0]} radius={0.05} castShadow receiveShadow>
          <meshStandardMaterial color={pantsColor} />
        </RoundedBox>
         <mesh position={[0, -0.3, 0.05]} castShadow>
             <boxGeometry args={[0.26, 0.1, 0.35]} />
             <meshStandardMaterial color={shoeColor} />
        </mesh>
      </group>

      {/* Body */}
      <RoundedBox args={[0.6, 0.5, 0.35]} position={[0, 0.65, 0]} radius={0.05} castShadow receiveShadow>
        <meshStandardMaterial color={color} roughness={0.6} />
      </RoundedBox>

      {/* Head */}
      <RoundedBox args={[0.4, 0.4, 0.4]} position={[0, 1.1, 0]} radius={0.08} castShadow receiveShadow>
        <meshStandardMaterial color={skinColor} />
      </RoundedBox>
      
      <mesh position={[0.1, 1.15, 0.18]} castShadow>
        <boxGeometry args={[0.05, 0.05, 0.05]} />
        <meshStandardMaterial color="black" />
      </mesh>
      <mesh position={[-0.1, 1.15, 0.18]} castShadow>
        <boxGeometry args={[0.05, 0.05, 0.05]} />
        <meshStandardMaterial color="black" />
      </mesh>

      {variant && <Accessories variant={variant} color={color} />}

      {/* Arms */}
      <group ref={leftArmGroup} position={[-0.38, 0.875, 0]}>
        <RoundedBox args={[0.15, 0.45, 0.15]} position={[0, armYOffset, 0]} radius={0.05} castShadow receiveShadow>
            <meshStandardMaterial color={color} />
        </RoundedBox>
        <RoundedBox args={[0.15, 0.15, 0.15]} position={[0, armYOffset - 0.25, 0]} radius={0.05} castShadow>
             <meshStandardMaterial color={skinColor} />
        </RoundedBox>
      </group>

      <group ref={rightArmGroup} position={[0.38, 0.875, 0]}>
        <RoundedBox args={[0.15, 0.45, 0.15]} position={[0, armYOffset, 0]} radius={0.05} castShadow receiveShadow>
            <meshStandardMaterial color={color} />
        </RoundedBox>
        <RoundedBox args={[0.15, 0.15, 0.15]} position={[0, armYOffset - 0.25, 0]} radius={0.05} castShadow>
             <meshStandardMaterial color={skinColor} />
        </RoundedBox>
      </group>

    </group>
  );
};