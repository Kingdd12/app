import { GameState, Piece, PlayerColor } from './types';
import { START_INDICES, BOARD_MAP } from './constants';

export const INITIAL_STATE: GameState = {
  players: ['RED', 'BLUE', 'YELLOW', 'GREEN'], // Clockwise order
  currentPlayerIndex: 0,
  pieces: initializePieces(),
  diceValue: null,
  phase: 'ROLL',
  winner: null,
  lastActionDescription: 'Game Start!',
  hasPlayedFirstTurn: {
    RED: false,
    BLUE: false,
    YELLOW: false,
    GREEN: false
  },
  rollsLeftInTurn: 4 // First player starts with 4 attempts
};

function initializePieces(): Record<string, Piece> {
  const colors: PlayerColor[] = ['RED', 'BLUE', 'YELLOW', 'GREEN'];
  const pieces: Record<string, Piece> = {};
  colors.forEach(color => {
    for (let i = 0; i < 4; i++) {
      const id = `${color}_${i}`;
      pieces[id] = { id, color, position: -1, isSafe: true, traveled: 0 };
    }
  });
  return pieces;
}

export const rollDice = (): number => Math.floor(Math.random() * 6) + 1;

export const canMovePiece = (piece: Piece, diceValue: number, allPieces: Record<string, Piece>): boolean => {
  if (diceValue === 6 && piece.position === -1) return true; // Spawn
  if (piece.position === -1) return false;
  if (piece.position === 999) return false; // Already finished

  // Simple check for overshooting goal
  if (piece.traveled + diceValue > 57) return false; // 51 (board) + 5 (home path) + 1 (goal) = 57 steps approx

  return true; 
};

// Helper to check if a move results in a capture
export const checkCapture = (
  newPos: number, 
  moverColor: PlayerColor, 
  pieces: Record<string, Piece>
): string | null => {
  if (newPos === 999 || newPos > 99) return null; // Cannot capture in home path or goal

  // Check tile type
  const tile = BOARD_MAP[newPos];
  if (tile && tile.type === 'SAFE') {
      return null; // Cannot capture on safe spots (stars)
  }

  // Find piece at newPos
  const occupantId = Object.keys(pieces).find(id => {
    const p = pieces[id];
    return p.position === newPos && p.color !== moverColor && p.position < 100; // Not in home path
  });

  if (occupantId) return occupantId;
  return null;
};
