export type PlayerColor = 'RED' | 'GREEN' | 'YELLOW' | 'BLUE';

export interface Piece {
  id: string;
  color: PlayerColor;
  position: number; // -1 = home, 0-51 = main path, 52-57 = victory path, 99 = finished
  isSafe: boolean;
  traveled: number; // Total steps taken. Used for score and pathing logic.
}

export interface GameState {
  players: PlayerColor[];
  currentPlayerIndex: number;
  pieces: Record<string, Piece>;
  diceValue: number | null;
  phase: 'ROLL' | 'MOVE' | 'WIN';
  winner: PlayerColor | null;
  lastActionDescription: string;
  // Ugandan Ludo Rules State
  hasPlayedFirstTurn: Record<PlayerColor, boolean>;
  rollsLeftInTurn: number; // For the "4 rolls on first play" rule
}

export interface BoardCoordinate {
  x: number;
  z: number;
  type: 'COMMON' | 'SAFE' | 'HOME_PATH' | 'BASE' | 'GOAL';
  color?: PlayerColor;
}

// 0-51 are main path indices
// Home paths:
// RED: 100-105
// GREEN: 200-205
// YELLOW: 300-305
// BLUE: 400-405
// 999 = Goal Center

export type TileMap = Record<number, BoardCoordinate>;