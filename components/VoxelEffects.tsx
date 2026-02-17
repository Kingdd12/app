import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ParticleProps {
  velocity: [number, number, number];
  initialRotation: [number, number, number];
  scale: number;
  color: string;
}

const Particle: React.FC<ParticleProps> = ({ velocity, initialRotation, scale, color }) => {
    const ref = useRef<THREE.Mesh>(null);
    const [active, setActive] = useState(true);
    
    // Store mutable physics state in ref
    const physics = useRef<{
        pos: THREE.Vector3;
        vel: THREE.Vector3;
        rot: THREE.Euler;
    } | null>(null);

    // Initialize physics state once
    if (!physics.current) {
        physics.current = {
            pos: new THREE.Vector3(0, 0, 0),
            vel: new THREE.Vector3(...velocity),
            rot: new THREE.Euler(...initialRotation)
        };
    }

    useFrame((state, delta) => {
        if (!active || !ref.current || !physics.current) return;

        const { pos, vel, rot } = physics.current;

        // Gravity
        vel.y -= 25 * delta;

        // Move
        pos.addScaledVector(vel, delta);
        
        // Rotate
        ref.current.rotation.x += vel.z * delta;
        ref.current.rotation.y += vel.x * delta;

        // Update position
        ref.current.position.copy(pos);

        // Shrink over time
        const currentScale = ref.current.scale.x;
        if (currentScale > 0.01) {
            const shrinkSpeed = 1.0 * delta;
            ref.current.scale.setScalar(Math.max(0, currentScale - shrinkSpeed));
        } else {
            setActive(false);
        }

        // Floor collision (simple)
        if (pos.y < -0.5) {
            vel.y *= -0.5; // Bounce
            vel.x *= 0.8;  // Friction
            vel.z *= 0.8;
            pos.y = -0.5;
        }
    });

    if (!active) return null;

    return (
        <mesh ref={ref} scale={scale} castShadow>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
        </mesh>
    );
};

const Flash: React.FC<{ color: string }> = ({ color }) => {
    const ref = useRef<THREE.Mesh>(null);
    useFrame((state, delta) => {
        if (ref.current) {
            ref.current.scale.addScalar(15 * delta);
            const mat = ref.current.material as THREE.MeshBasicMaterial;
            if (mat && mat.opacity !== undefined) {
                mat.opacity -= 4 * delta;
                if (mat.opacity <= 0) {
                     ref.current.visible = false;
                }
            }
        }
    });

    return (
        <mesh ref={ref}>
            <sphereGeometry args={[0.5, 16, 16]} />
            <meshBasicMaterial color={color} transparent opacity={0.8} />
        </mesh>
    );
};

interface CaptureEffectProps {
  position: [number, number, number];
  color: string;
}

export const CaptureEffect: React.FC<CaptureEffectProps> = ({ position, color }) => {
  // Create a burst of particles
  const particleCount = 12;
  const particles = useMemo(() => {
    return new Array(particleCount).fill(0).map(() => ({
      velocity: [
        (Math.random() - 0.5) * 10, // X spread
        Math.random() * 8 + 2,      // Upward burst
        (Math.random() - 0.5) * 10  // Z spread
      ],
      rotation: [
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      ],
      scale: Math.random() * 0.3 + 0.1
    }));
  }, []);

  return (
    <group position={position}>
      {particles.map((p, i) => (
        <Particle 
            key={i} 
            velocity={p.velocity as [number, number, number]} 
            initialRotation={p.rotation as [number, number, number]} 
            scale={p.scale}
            color={color} 
        />
      ))}
      <Flash color={color} />
    </group>
  );
};