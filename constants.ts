import { PlayerColor, TileMap } from './types';

export const COLORS = {
  RED: '#dc2626',      // Deep Ochre/Red
  GREEN: '#15803d',    // Jungle Green
  YELLOW: '#eab308',   // Gold/Sun
  BLUE: '#0284c7',     // River Blue
  NEUTRAL: '#d6d3d1',  // Stone/Grey
  BOARD_BG: '#78350f', // Dark Earth/Wood
  GROUND: '#d4a373',   // Sand
  GRASS: '#4ade80',    // Savannah Grass
};

// Start positions on the main path (0-51)
export const START_INDICES: Record<PlayerColor, number> = {
  RED: 0,
  GREEN: 13,
  YELLOW: 26,
  BLUE: 39,
};

export const generateBoardMapping = (): TileMap => {
  const map: TileMap = {};
  
  const add = (id: number, x: number, z: number, type: any = 'COMMON', color?: PlayerColor) => {
    map[id] = { x: x - 7, z: z - 7, type, color };
  };

  const track = [
    [1,6], [2,6], [3,6], [4,6], [5,6], // 0-4
    [6,5], [6,4], [6,3], [6,2], [6,1], [6,0], // 5-10
    [7,0], // 11 (Mid Bottom)
    [8,0], [8,1], [8,2], [8,3], [8,4], [8,5], // 12-17
    [9,6], [10,6], [11,6], [12,6], [13,6], [14,6], // 18-23
    [14,7], // 24 (Mid Right)
    [14,8], [13,8], [12,8], [11,8], [10,8], [9,8], // 25-30
    [8,9], [8,10], [8,11], [8,12], [8,13], [8,14], // 31-36
    [7,14], // 37 (Mid Top)
    [6,14], [6,13], [6,12], [6,11], [6,10], [6,9], // 38-43
    [5,8], [4,8], [3,8], [2,8], [1,8], [0,8], // 44-49
    [0,7], // 50
    [0,6]  // 51
  ];
  
  track.forEach((pos, idx) => add(idx, pos[0], pos[1], idx % 13 === 0 ? 'SAFE' : 'COMMON'));

  // Home Paths
  for(let x=1; x<=5; x++) add(100 + x - 1, x, 7, 'HOME_PATH', 'RED');
  for(let z=1; z<=5; z++) add(200 + z - 1, 7, z, 'HOME_PATH', 'GREEN');
  for(let x=13; x>=9; x--) add(300 + (13-x), x, 7, 'HOME_PATH', 'YELLOW');
  for(let z=13; z>=9; z--) add(400 + (13-z), 7, z, 'HOME_PATH', 'BLUE');

  // Center Goal
  map[999] = { x: 0, z: 0, type: 'GOAL' };

  return map;
};

export const BOARD_MAP = generateBoardMapping();

// Base Offsets for the 4 pieces when in "Home/Prison"
export const BASE_POSITIONS: Record<PlayerColor, [number, number, number][]> = {
  RED:    [[2, 1, 2], [5, 1, 2], [2, 1, 5], [5, 1, 5]].map(p => [p[0]-7, p[1], p[2]-7]),
  GREEN:  [[10,1, 2], [13,1, 2], [10,1, 5], [13,1, 5]].map(p => [p[0]-7, p[1], p[2]-7]), // Bottom Right
  YELLOW: [[10,1, 10], [13,1, 10], [10,1, 13], [13,1, 13]].map(p => [p[0]-7, p[1], p[2]-7]), // Top Right
  BLUE:   [[2, 1, 10], [5, 1, 10], [2, 1, 13], [5, 1, 13]].map(p => [p[0]-7, p[1], p[2]-7]), // Top Left
};