import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      // Three.js / React Three Fiber Elements
      group: any;
      mesh: any;
      boxGeometry: any;
      cylinderGeometry: any;
      coneGeometry: any;
      sphereGeometry: any;
      dodecahedronGeometry: any;
      meshStandardMaterial: any;
      meshBasicMaterial: any;
      ambientLight: any;
      directionalLight: any;
      fog: any;
      color: any;

      // HTML Elements
      div: any;
      span: any;
      h1: any;
      h2: any;
      h3: any;
      p: any;
      button: any;
      img: any;
      br: any;
      label: any;
      input: any;
    }
  }
}

export const MarketStall = ({ position, rotation = [0,0,0], color = "#d97706" }: { position: [number, number, number], rotation?: [number, number, number], color?: string }) => {
  return (
    <group position={position} rotation={rotation}>
      {/* Counter */}
      <RoundedBox args={[1.2, 0.6, 0.6]} radius={0.05} position={[0, 0.3, 0]} castShadow>
        <meshStandardMaterial color="#78350f" />
      </RoundedBox>
      {/* Posts */}
      <mesh position={[-0.5, 1.0, 0.25]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 1.5]} />
        <meshStandardMaterial color="#5c3a21" />
      </mesh>
      <mesh position={[0.5, 1.0, 0.25]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 1.5]} />
        <meshStandardMaterial color="#5c3a21" />
      </mesh>
      {/* Roof */}
      <mesh position={[0, 1.8, 0.3]} rotation={[0.4, 0, 0]} castShadow>
         <boxGeometry args={[1.4, 0.1, 1.2]} />
         <meshStandardMaterial color={color} />
      </mesh>
      {/* Goods */}
      <group position={[0, 0.65, 0]}>
         <mesh position={[-0.3, 0, 0]}>
            <sphereGeometry args={[0.15]} />
            <meshStandardMaterial color="#ef4444" /> {/* Apple */}
         </mesh>
         <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[0.18]} />
            <meshStandardMaterial color="#22c55e" /> {/* Watermelon */}
         </mesh>
         <mesh position={[0.3, 0, 0]}>
            <sphereGeometry args={[0.15]} />
            <meshStandardMaterial color="#eab308" /> {/* Orange */}
         </mesh>
      </group>
    </group>
  );
};

export const VoxelAnimal = ({ position, type = 'ZEBRA', scale=0.5, rotation=[0,0,0] }: { position: [number, number, number], type?: 'ZEBRA' | 'LION' | 'ELEPHANT', scale?: number, rotation?: [number, number, number] }) => {
    const group = useRef<THREE.Group>(null);
    const headRef = useRef<THREE.Mesh>(null);
    const randomOffset = useMemo(() => Math.random() * 100, []);
    
    // Idle animation
    useFrame(({clock}) => {
        if(group.current) {
            // Breathing/Idle bob
            group.current.position.y = position[1] + Math.sin(clock.elapsedTime * 2 + randomOffset) * 0.02;
        }
        if(headRef.current) {
            // Grazing/Looking around
            headRef.current.rotation.x = Math.sin(clock.elapsedTime * 0.5 + randomOffset) * 0.1;
            headRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.2 + randomOffset) * 0.2;
        }
    });

    let bodyColor = "#f3f4f6";
    let detailColor = "#1f2937";
    let bodyScale: [number, number, number] = [1, 0.8, 1.5];
    
    if (type === 'LION') {
        bodyColor = "#d97706";
        detailColor = "#92400e";
        bodyScale = [0.9, 0.8, 1.4];
    } else if (type === 'ELEPHANT') {
        bodyColor = "#9ca3af";
        detailColor = "#4b5563";
        bodyScale = [1.5, 1.2, 2.0];
    }
    
    return (
        <group ref={group} position={position} scale={scale} rotation={rotation}>
            {/* Body */}
            <RoundedBox args={bodyScale} position={[0, 0.8, 0]} radius={0.1} castShadow>
                <meshStandardMaterial color={bodyColor} />
            </RoundedBox>

            {/* Head */}
            <group position={[0, 1.2, 0.9]} ref={headRef as any}>
                 <RoundedBox args={type === 'ELEPHANT' ? [1, 1, 0.8] : [0.6, 0.6, 0.7]} radius={0.05} castShadow>
                    <meshStandardMaterial color={bodyColor} />
                </RoundedBox>
                {/* Elephant Trunk */}
                {type === 'ELEPHANT' && (
                     <mesh position={[0, -0.4, 0.5]} rotation={[0.2, 0, 0]} castShadow>
                        <cylinderGeometry args={[0.15, 0.1, 1, 8]} />
                        <meshStandardMaterial color={bodyColor} />
                     </mesh>
                )}
                {/* Ears */}
                {type === 'ELEPHANT' && (
                     <React.Fragment>
                        <mesh position={[0.6, 0, -0.1]} rotation={[0, -0.3, 0]}>
                            <boxGeometry args={[0.1, 0.8, 0.5]} />
                            <meshStandardMaterial color={bodyColor} />
                        </mesh>
                        <mesh position={[-0.6, 0, -0.1]} rotation={[0, 0.3, 0]}>
                            <boxGeometry args={[0.1, 0.8, 0.5]} />
                            <meshStandardMaterial color={bodyColor} />
                        </mesh>
                     </React.Fragment>
                )}
                {/* Lion Mane */}
                {type === 'LION' && (
                    <mesh position={[0, 0, -0.2]}>
                        <boxGeometry args={[0.7, 0.7, 0.4]} />
                        <meshStandardMaterial color={detailColor} />
                    </mesh>
                )}
            </group>

            {/* Legs */}
            <mesh position={[-0.3, 0.4, 0.5]} castShadow>
                 <boxGeometry args={[0.25, 0.8, 0.25]} />
                 <meshStandardMaterial color={type === 'ZEBRA' ? '#333' : bodyColor} />
            </mesh>
             <mesh position={[0.3, 0.4, 0.5]} castShadow>
                 <boxGeometry args={[0.25, 0.8, 0.25]} />
                 <meshStandardMaterial color={type === 'ZEBRA' ? '#333' : bodyColor} />
            </mesh>
             <mesh position={[-0.3, 0.4, -0.5]} castShadow>
                 <boxGeometry args={[0.25, 0.8, 0.25]} />
                 <meshStandardMaterial color={type === 'ZEBRA' ? '#333' : bodyColor} />
            </mesh>
             <mesh position={[0.3, 0.4, -0.5]} castShadow>
                 <boxGeometry args={[0.25, 0.8, 0.25]} />
                 <meshStandardMaterial color={type === 'ZEBRA' ? '#333' : bodyColor} />
            </mesh>
            
            {/* Stripes for Zebra */}
            {type === 'ZEBRA' && (
                <mesh position={[0, 0.8, 0]} scale={[1.02, 1.02, 0.8]}>
                    <boxGeometry args={[1, 0.8, 1.5]} />
                     <meshStandardMaterial color="black" wireframe />
                </mesh>
            )}
        </group>
    );
}

export const VoxelBird = ({ center = [0,10,0], radius = 8, speed = 1, color="#fca5a5", heightOffset=0 }: { center?: [number,number,number], radius?: number, speed?: number, color?: string, heightOffset?: number }) => {
    const ref = useRef<THREE.Group>(null);
    const randomPhase = useMemo(() => Math.random() * Math.PI * 2, []);

    useFrame(({ clock }) => {
        const t = clock.elapsedTime * speed + randomPhase;
        if(ref.current) {
            ref.current.position.x = center[0] + Math.cos(t) * radius;
            ref.current.position.z = center[2] + Math.sin(t) * radius;
            ref.current.rotation.y = -t; // Face direction of movement (tangent)
            
            // Banking logic
            ref.current.rotation.z = -0.5; // Bank inward

            // Bobbing
            ref.current.position.y = center[1] + Math.sin(t * 3) * 0.5 + heightOffset;
        }
    });

    return (
        <group ref={ref} position={center}>
             {/* Body */}
             <mesh rotation={[Math.PI/2, 0, 0]}>
                 <coneGeometry args={[0.15, 0.6, 4]} />
                 <meshStandardMaterial color={color} />
             </mesh>
             {/* Wings */}
             <group>
                <mesh position={[0.3, 0, 0]} rotation={[0,0,-0.2]}>
                    <boxGeometry args={[0.6, 0.05, 0.2]} />
                    <meshStandardMaterial color={color} />
                </mesh>
                <mesh position={[-0.3, 0, 0]} rotation={[0,0,0.2]}>
                    <boxGeometry args={[0.6, 0.05, 0.2]} />
                    <meshStandardMaterial color={color} />
                </mesh>
             </group>
        </group>
    );
}