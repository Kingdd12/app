import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import { useBox } from '@react-three/cannon';
import * as THREE from 'three';

interface DieProps {
  rolling: boolean; // Signal to start rolling
  onRollComplete: (value: number) => void; // Callback with result
  position: [number, number, number]; // Reset position
  color: string;
}

export const Die: React.FC<DieProps> = ({ rolling, onRollComplete, position, color }) => {
  const [isPhysicallyRolling, setIsPhysicallyRolling] = useState(false);
  const stopCounter = useRef(0);
  const rollStartTime = useRef(0);
  const rollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Physics Body
  const [ref, api] = useBox(() => ({
    mass: 2, // Increased mass for better feel
    position: [0, 8, 0],
    args: [1.5, 1.5, 1.5],
    material: { friction: 0.3, restitution: 0.5 },
    angularDamping: 0.3,
    linearDamping: 0.1,
    allowSleep: false, 
  }));

  // Track velocity
  const velocity = useRef([0, 0, 0]);
  useEffect(() => api.velocity.subscribe((v) => (velocity.current = v)), [api.velocity]);
  
  // Track position for out-of-bounds check
  const pos = useRef([0, 0, 0]);
  useEffect(() => api.position.subscribe((p) => (pos.current = p)), [api.position]);

  const determineResult = () => {
      if (!ref.current) return;

      const quaternion = new THREE.Quaternion(
          ref.current.quaternion.x,
          ref.current.quaternion.y,
          ref.current.quaternion.z,
          ref.current.quaternion.w
      );

      const directions = [
          { vec: new THREE.Vector3(0, 1, 0), val: 1 },  // Top
          { vec: new THREE.Vector3(0, -1, 0), val: 6 }, // Bottom
          { vec: new THREE.Vector3(1, 0, 0), val: 2 },  // Right
          { vec: new THREE.Vector3(-1, 0, 0), val: 5 }, // Left
          { vec: new THREE.Vector3(0, 0, 1), val: 3 },  // Front
          { vec: new THREE.Vector3(0, 0, -1), val: 4 }, // Back
      ];

      let maxDot = -Infinity;
      let result = 1;

      directions.forEach(dir => {
          const worldDir = dir.vec.clone().applyQuaternion(quaternion);
          const dot = worldDir.dot(new THREE.Vector3(0, 1, 0));
          if (dot > maxDot) {
              maxDot = dot;
              result = dir.val;
          }
      });
      
      return result;
  };

  const finishRoll = () => {
      setIsPhysicallyRolling(false);
      const result = determineResult() || 1;
      onRollComplete(result);
      if (rollTimeout.current) clearTimeout(rollTimeout.current);
  };

  // Handle Roll Trigger
  useEffect(() => {
    if (rolling && !isPhysicallyRolling) {
      setIsPhysicallyRolling(true);
      stopCounter.current = 0;
      rollStartTime.current = Date.now();
      
      // Randomize start pos slightly
      const offset = (Math.random() - 0.5) * 2;
      api.position.set(offset, 10, offset); // Drop from higher
      api.velocity.set(0, -5, 0); // Give it some downward initial velocity
      
      // Randomize initial rotation so it doesn't always land on 1 if it drops straight
      api.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      api.angularVelocity.set(0, 0, 0);

      // Apply random impulse
      const force = 15;
      api.applyImpulse(
        [(Math.random() - 0.5) * force, force, (Math.random() - 0.5) * force],
        [0, 0, 0]
      );

      // Apply random torque
      const torque = 25;
      api.applyTorque([
        (Math.random() - 0.5) * torque,
        (Math.random() - 0.5) * torque,
        (Math.random() - 0.5) * torque,
      ]);
      
      // Safety timeout: force finish after 4 seconds
      if (rollTimeout.current) clearTimeout(rollTimeout.current);
      rollTimeout.current = setTimeout(() => {
          if (isPhysicallyRolling) finishRoll();
      }, 4000);
    }
    return () => {
        if (rollTimeout.current) clearTimeout(rollTimeout.current);
    }
  }, [rolling, api]);

  useFrame(() => {
    const p = pos.current;

    // Continuous safety check: if dice falls into void, reset it
    if (p[1] < -10) {
        api.position.set(0, 8, 0);
        api.velocity.set(0, 0, 0);
        api.angularVelocity.set(0,0,0);
        return;
    }

    if (isPhysicallyRolling) {
      const v = velocity.current;
      const speed = Math.sqrt(v[0]**2 + v[1]**2 + v[2]**2);
      const timeElapsed = Date.now() - rollStartTime.current;

      // Grace period: Don't check for stop in the first 500ms
      // This allows the impulse to take effect and the dice to bounce
      if (timeElapsed < 500) {
          return;
      }

      // Check for stop
      if (speed < 0.15) {
        stopCounter.current += 1;
        // Must be stopped for ~20 frames (approx 0.3s) to count
        if (stopCounter.current > 20) {
           finishRoll();
        }
      } else {
        stopCounter.current = 0;
      }
    }
  });

  return (
    <group ref={ref as any}>
        <RoundedBox args={[1.5, 1.5, 1.5]} radius={0.1} smoothness={2} castShadow>
            <meshStandardMaterial color={color} roughness={0.2} metalness={0.1} />
        </RoundedBox>
        
        {/* Dice Dots - Voxel Style (Square) */}
        {/* Face 1 (Top) */}
        <Dot position={[0, 0.76, 0]} />
        
        {/* Face 6 (Bottom) */}
        <group rotation={[Math.PI, 0, 0]}>
             <Dot position={[-0.4, 0.76, -0.4]} />
             <Dot position={[-0.4, 0.76, 0]} />
             <Dot position={[-0.4, 0.76, 0.4]} />
             <Dot position={[0.4, 0.76, -0.4]} />
             <Dot position={[0.4, 0.76, 0]} />
             <Dot position={[0.4, 0.76, 0.4]} />
        </group>

        {/* Face 2 (Right) */}
        <group rotation={[0, 0, -Math.PI/2]}>
             <Dot position={[-0.4, 0.76, -0.4]} />
             <Dot position={[0.4, 0.76, 0.4]} />
        </group>

         {/* Face 5 (Left) */}
         <group rotation={[0, 0, Math.PI/2]}>
             <Dot position={[-0.4, 0.76, -0.4]} />
             <Dot position={[0.4, 0.76, 0.4]} />
             <Dot position={[0, 0.76, 0]} />
             <Dot position={[-0.4, 0.76, 0.4]} />
             <Dot position={[0.4, 0.76, -0.4]} />
        </group>

        {/* Face 3 (Front) */}
        <group rotation={[Math.PI/2, 0, 0]}>
             <Dot position={[-0.4, 0.76, -0.4]} />
             <Dot position={[0, 0.76, 0]} />
             <Dot position={[0.4, 0.76, 0.4]} />
        </group>

        {/* Face 4 (Back) */}
        <group rotation={[-Math.PI/2, 0, 0]}>
             <Dot position={[-0.4, 0.76, -0.4]} />
             <Dot position={[0.4, 0.76, 0.4]} />
             <Dot position={[-0.4, 0.76, 0.4]} />
             <Dot position={[0.4, 0.76, -0.4]} />
        </group>
    </group>
  );
};

const Dot = ({ position }: { position: [number, number, number] }) => (
    <mesh position={position} castShadow receiveShadow>
        <boxGeometry args={[0.2, 0.05, 0.2]} />
        <meshStandardMaterial color="white" />
    </mesh>
);