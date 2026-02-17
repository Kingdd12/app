import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Environment, ContactShadows, Cloud } from '@react-three/drei';
import { Physics } from '@react-three/cannon';
import { BOARD_MAP, COLORS, BASE_POSITIONS } from '../constants';
import { Voxel } from './VoxelObject';
import { VoxelCharacter } from './VoxelCharacter';
import { TowerRNG } from './TowerRNG';
import { BoardBase } from './BoardBase';
import { TinyHouse } from './TinyHouse';
import { MarketStall, VoxelAnimal, VoxelBird } from './EnvironmentAssets';
import { CaptureEffect } from './VoxelEffects';
import { Piece, GameState, PlayerColor } from '../types';
import { VisualEffect } from '../App';
import * as THREE from 'three';

interface GameSceneProps {
  gameState: GameState;
  onPieceClick: (pieceId: string) => void;
  onDiceResult: (val: number) => void;
  isRolling: boolean;
  visualEffects?: VisualEffect[];
}

// Visual mapping helper
const getVisualPosition = (piece: Piece): [number, number, number] => {
  if (piece.position === -1) {
    const pieceIndex = parseInt(piece.id.split('_')[1]);
    const pos = BASE_POSITIONS[piece.color][pieceIndex];
    // Position character inside/front of the hut (Ground Level y=0)
    return [pos[0], 0, pos[2]];
  }
  
  if (piece.position === 999) {
      return [0, 0.17, 2]; // Stand in front of the tree (Tile Level approx)
  }

  const coord = BOARD_MAP[piece.position];
  if (!coord) return [0, 0.17, 0];
  // Board tiles are at y=0.1, top surface y=0.2. 
  // Character feet offset is approx 0.05. 
  // 0.17 + 0.05 = 0.22 (Just sitting on surface)
  return [coord.x, 0.17, coord.z];
};

const AcaciaTree = ({ position, scale = 1 }: { position: [number, number, number], scale?: number }) => (
  <group position={position} scale={scale}>
    {/* Trunk */}
    <mesh position={[0, 1, 0]} castShadow>
      <cylinderGeometry args={[0.2, 0.3, 2, 5]} />
      <meshStandardMaterial color="#4a3728" />
    </mesh>
    {/* Flat Top Foliage */}
    <mesh position={[0, 2, 0]} castShadow>
      <cylinderGeometry args={[1.5, 0.2, 0.5, 7]} />
      <meshStandardMaterial color="#4d7c0f" roughness={1} />
    </mesh>
    <mesh position={[0.5, 2.2, 0.2]} castShadow>
      <dodecahedronGeometry args={[0.5, 0]} />
      <meshStandardMaterial color="#65a30d" roughness={1} />
    </mesh>
  </group>
);

const Rock = ({ position, scale = 1 }: { position: [number, number, number], scale?: number }) => (
    <mesh position={position} scale={scale} castShadow receiveShadow>
        <dodecahedronGeometry args={[0.5, 0]} />
        <meshStandardMaterial color="#78716c" />
    </mesh>
);

export const GameScene: React.FC<GameSceneProps> = ({ gameState, onPieceClick, onDiceResult, isRolling, visualEffects = [] }) => {
  // Generate the main path tiles
  const boardVoxels = useMemo(() => {
    return Object.entries(BOARD_MAP).map(([key, val]) => {
      if (parseInt(key) === 999) return null;

      let color = '#d6d3d1'; // Default stone/grey
      if (val.type === 'SAFE') color = '#a8a29e'; // Darker stone
      if (val.color) color = COLORS[val.color];
      if (val.type === 'COMMON') color = '#e7e5e4'; // Light stone path

      // Path tiles should be slightly raised stones
      return (
        <Voxel
          key={`tile-${key}`}
          position={[val.x, 0.1, val.z]}
          color={color}
          opacity={1}
        />
      );
    });
  }, []);

  // Generate Base Houses
  const baseHouses = ['RED', 'GREEN', 'YELLOW', 'BLUE'].flatMap((c) => {
       const colorKey = c as PlayerColor;
       return BASE_POSITIONS[colorKey].map((pos, idx) => (
           <TinyHouse 
              key={`house-${c}-${idx}`}
              position={[pos[0], 0, pos[2]]}
              color={COLORS[colorKey]} 
           />
       ));
  });

  const currentPlayerColor = gameState.players[gameState.currentPlayerIndex];
  
  return (
    <Canvas shadows camera={{ position: [0, 28, 22], fov: 35 }}>
      {/* Warm Sky Background */}
      <color attach="background" args={['#fcd34d']} /> 
      <fog attach="fog" args={['#fcd34d', 20, 60]} />

      <ambientLight intensity={0.7} color="#fff7ed" />
      <directionalLight 
        position={[20, 40, 10]} 
        intensity={1.5} 
        castShadow 
        color="#fffbeb"
        shadow-mapSize={[2048, 2048]} 
        shadow-bias={-0.0001}
      />
      
      {/* Environmental Clouds */}
      <Cloud position={[-10, 10, -10]} opacity={0.5} speed={0.1} color="white" />
      <Cloud position={[10, 12, -5]} opacity={0.4} speed={0.1} color="white" />

      {/* Physics World for Dice and Board */}
      <Physics gravity={[0, -30, 0]}> 
        <BoardBase />
        <group>
          {boardVoxels}
        </group>
        <TowerRNG rolling={isRolling} value={gameState.diceValue} />
      </Physics>

      {/* Visual Elements (Non-Physics) */}
      <group>
            {/* Vegetation */}
            <AcaciaTree position={[-12, 0, -12]} scale={1.5} />
            <AcaciaTree position={[12, 0, 12]} scale={1.2} />
            <AcaciaTree position={[-14, 0, 5]} scale={1} />
            <AcaciaTree position={[10, 0, -10]} scale={1.3} />
            
            <Rock position={[12, 0.5, -8]} scale={1.2} />
            <Rock position={[-10, 0.5, 10]} scale={1.5} />
            <Rock position={[-8, 0.5, -12]} scale={1} />

            {/* Shops */}
            <MarketStall position={[10, 0, 0]} rotation={[0, -1.5, 0]} color="#ea580c" />
            <MarketStall position={[-10, 0, 0]} rotation={[0, 1.5, 0]} color="#0891b2" />
            <MarketStall position={[0, 0, 10]} rotation={[0, 0, 0]} color="#65a30d" />
            <MarketStall position={[0, 0, -10]} rotation={[0, 3.14, 0]} color="#db2777" />

            {/* Animals */}
            <VoxelAnimal position={[-5, 0, -5]} type="ZEBRA" scale={0.4} rotation={[0, 0.5, 0]} />
            <VoxelAnimal position={[5, 0, 5]} type="ELEPHANT" scale={0.5} rotation={[0, -0.5, 0]} />
            <VoxelAnimal position={[-6, 0, 6]} type="LION" scale={0.4} rotation={[0, 1.2, 0]} />
            <VoxelAnimal position={[6, 0, -6]} type="ZEBRA" scale={0.4} rotation={[0, -2, 0]} />

            {/* Birds */}
            <VoxelBird center={[0, 12, 0]} radius={8} speed={0.5} color="#38bdf8" />
            <VoxelBird center={[0, 14, 0]} radius={10} speed={0.4} color="#f472b6" heightOffset={1} />
            <VoxelBird center={[5, 10, 5]} radius={6} speed={0.6} color="#fbbf24" heightOffset={-1} />
      </group>

      <group>
          {baseHouses}

          {(Object.values(gameState.pieces) as Piece[]).map((piece) => {
              const [x, y, z] = getVisualPosition(piece);
              const isTurn = gameState.phase === 'MOVE' && piece.color === currentPlayerColor;
              const isCurrentPlayer = piece.color === currentPlayerColor;
              
              return (
                  <VoxelCharacter
                      key={piece.id}
                      position={[x, y, z]} 
                      color={COLORS[piece.color]}
                      variant={piece.color} 
                      scale={0.6} 
                      hoverEffect={isTurn}
                      activeTurn={isCurrentPlayer}
                      onClick={() => onPieceClick(piece.id)}
                  />
              );
          })}

          {/* Render Active Effects */}
          {visualEffects.map(effect => (
             effect.type === 'CAPTURE' && (
                 <CaptureEffect 
                    key={effect.id} 
                    position={effect.position} 
                    color={effect.color} 
                 />
             )
          ))}
      </group>
      
      <ContactShadows position={[0, -0.5, 0]} opacity={0.4} scale={40} blur={2.5} far={4} color="#3f2c22" />
      <OrbitControls minPolarAngle={0} maxPolarAngle={Math.PI / 2.5} enablePan={false} maxDistance={40} minDistance={10} />
    </Canvas>
  );
};
