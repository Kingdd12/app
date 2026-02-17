import React from 'react';
import { useBox } from '@react-three/cannon';
import { RoundedBox } from '@react-three/drei';

export const BoardBase = () => {
  const [ref] = useBox(() => ({ 
    type: 'Static', 
    position: [0, -0.5, 0], 
    args: [18, 1, 18],
    material: { friction: 0.6, restitution: 0.2 }
  }));

  return (
    <group>
      {/* Main Sandy Ground */}
      <group ref={ref as any}>
        <RoundedBox args={[18, 1, 18]} radius={0.4} smoothness={4} receiveShadow>
           <meshStandardMaterial color="#d4a373" roughness={1} /> {/* Sand Color */}
        </RoundedBox>
      </group>
      
      {/* Grassy Patches or Lower Layer */}
      <RoundedBox args={[20, 0.5, 20]} position={[0, -1.2, 0]} radius={1} smoothness={4} receiveShadow>
         <meshStandardMaterial color="#65a30d" roughness={0.9} /> {/* Grass Green */}
      </RoundedBox>
    </group>
  );
};
