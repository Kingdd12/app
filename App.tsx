import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GameScene } from './components/GameScene';
import { GameState, Piece, PlayerColor } from './types';
import { INITIAL_STATE, checkCapture } from './gameLogic'; 
import { START_INDICES, BOARD_MAP, COLORS } from './constants';
import { getGeminiCommentary } from './services/geminiService';
import { playSound as playGameSound } from './utils/audio';
import { Info, Volume2, Mic, Dices, Trophy, Activity, Wifi, WifiOff } from 'lucide-react';
import { auth, db } from './services/firebase';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { doc, onSnapshot, setDoc, updateDoc, getDoc, collection, addDoc } from 'firebase/firestore';
import { LoginScreen, LobbyScreen, WaitingRoom } from './components/MultiplayerUI';

const PATH_START: Record<PlayerColor, number> = START_INDICES;

// Home Path Entry Indices
const HOME_PATH_START: Record<PlayerColor, number> = {
  RED: 100,
  GREEN: 200,
  YELLOW: 300,
  BLUE: 400
};

type AppMode = 'LOGIN' | 'LOBBY' | 'GAME_LOCAL' | 'GAME_ONLINE';

export interface VisualEffect {
    id: string;
    type: 'CAPTURE';
    position: [number, number, number];
    color: string;
}

export default function App() {
  const [mode, setMode] = useState<AppMode>('LOGIN');
  const [user, setUser] = useState<any>(null);
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
  const [commentary, setCommentary] = useState<string>("Welcome to Voxel Ludo! First turn gets 4 rolls!");
  const [isRolling, setIsRolling] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Visual Effects State
  const [effects, setEffects] = useState<VisualEffect[]>([]);
  
  // Multiplayer State
  const [matchId, setMatchId] = useState<string | null>(null);
  const [onlinePlayerColor, setOnlinePlayerColor] = useState<PlayerColor | null>(null);
  const [connectedPlayers, setConnectedPlayers] = useState<number>(0);

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const isMyTurn = mode === 'GAME_LOCAL' || (mode === 'GAME_ONLINE' && onlinePlayerColor === currentPlayer);

  // --- AUTHENTICATION ---
  useEffect(() => {
    if (!auth) return;
    return auth.onAuthStateChanged((u: any) => {
      setUser(u);
      if (u) {
          setMode('LOBBY');
      } else {
          setMode('LOGIN');
      }
    });
  }, []);

  const handleLogin = async () => {
    if (!auth) {
        alert("Firebase not configured. Check services/firebase.ts");
        return;
    }
    try {
        await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (e) {
        console.error(e);
    }
  };

  const handleLogout = () => {
      if (auth) signOut(auth);
      setMode('LOGIN');
      setMatchId(null);
  };

  // --- MATCHMAKING & SYNC ---
  const handleCreateMatch = async () => {
    if (!db || !user) return;
    const matchRef = await addDoc(collection(db, "matches"), {
        gameState: INITIAL_STATE,
        players: { [user.uid]: 'RED' }, // Creator is RED
        created: Date.now(),
        status: 'WAITING'
    });
    setMatchId(matchRef.id);
    setOnlinePlayerColor('RED');
    setMode('GAME_ONLINE');
  };

  const handleJoinMatch = async (id: string) => {
    if (!db || !user) return;
    const matchRef = doc(db, "matches", id);
    const snap = await getDoc(matchRef);
    if (snap.exists()) {
        const data = snap.data();
        const existingPlayers = data.players || {};
        
        // Determine next color
        const takenColors = Object.values(existingPlayers);
        const allColors: PlayerColor[] = ['RED', 'BLUE', 'YELLOW', 'GREEN'];
        const availableColor = allColors.find(c => !takenColors.includes(c));

        if (!availableColor && !existingPlayers[user.uid]) {
            alert("Match is full!");
            return;
        }

        const myColor = existingPlayers[user.uid] || availableColor;

        if (!existingPlayers[user.uid]) {
             await updateDoc(matchRef, {
                 [`players.${user.uid}`]: myColor
             });
        }
        
        setMatchId(id);
        setOnlinePlayerColor(myColor as PlayerColor);
        setMode('GAME_ONLINE');
    } else {
        alert("Match not found");
    }
  };

  // Sync Game State
  useEffect(() => {
    if (mode === 'GAME_ONLINE' && matchId && db) {
        const unsub = onSnapshot(doc(db, "matches", matchId), (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                if (data.gameState) {
                    setGameState(data.gameState);
                }
                if (data.players) {
                    setConnectedPlayers(Object.keys(data.players).length);
                }
            }
        });
        return () => unsub();
    }
  }, [mode, matchId]);

  // Helper to push state update
  const pushGameState = useCallback(async (newState: GameState) => {
      setGameState(newState); // Optimistic update
      if (mode === 'GAME_ONLINE' && matchId && db) {
          await updateDoc(doc(db, "matches", matchId), {
              gameState: newState
          });
      }
  }, [mode, matchId]);


  // --- GAME LOGIC ---

  // Calculate Scores Derived from State
  const scores = useMemo(() => {
    const s: Record<string, number> = { RED: 0, GREEN: 0, YELLOW: 0, BLUE: 0 };
    (Object.values(gameState.pieces) as Piece[]).forEach(p => {
        s[p.color] += p.traveled;
        if (p.position === 999) s[p.color] += 50; 
    });
    return s;
  }, [gameState.pieces]);

  const handleDiceClick = async () => {
    if (gameState.phase !== 'ROLL' || isRolling || isAnimating) return;
    if (!isMyTurn) return;

    setIsRolling(true);
    setCommentary("Rolling...");
    playGameSound('roll');

    setTimeout(() => {
        const val = Math.floor(Math.random() * 6) + 1;
        finishRoll(val);
    }, 1000);
  };

  const finishRoll = (val: number) => {
    setIsRolling(false);
    
    // Check if player has any pieces out on the board
    const piecesOut = (Object.values(gameState.pieces) as Piece[]).filter(
        p => p.color === currentPlayer && p.position !== -1 && p.position !== 999
    ).length;

    let nextPhase: 'MOVE' | 'ROLL' = 'MOVE';
    let autoTurnChange = false;
    let nextRollsLeft = gameState.rollsLeftInTurn - 1;
    let message = "";

    const isFirstTurn = !gameState.hasPlayedFirstTurn[currentPlayer];

    if (val === 6) {
        message = `Rolled a 6! Move or Spawn!`;
        nextPhase = 'MOVE'; 
        nextRollsLeft = isFirstTurn ? 4 : 1; 
    } 
    else {
        if (piecesOut > 0) {
            const canMove = (Object.values(gameState.pieces) as Piece[]).some(p => 
                p.color === currentPlayer && p.position !== -1 && p.position !== 999
            );

            if (canMove) {
                message = `Rolled a ${val}. Move your piece.`;
                nextPhase = 'MOVE';
            } else {
                message = `Rolled a ${val}. No moves possible.`;
                nextPhase = 'ROLL';
                autoTurnChange = true;
            }
        } else {
            if (isFirstTurn && nextRollsLeft > 0) {
                message = `Rolled ${val}. Try again! (${nextRollsLeft} attempts left)`;
                nextPhase = 'ROLL'; 
                autoTurnChange = false;
            } else {
                message = `Rolled a ${val}. Better luck next time!`;
                nextPhase = 'ROLL';
                autoTurnChange = true;
            }
        }
    }

    setCommentary(message);

    const newState = {
        ...gameState,
        diceValue: val,
        phase: nextPhase,
        rollsLeftInTurn: nextRollsLeft
    };
    pushGameState(newState);

    if (autoTurnChange) {
        setTimeout(() => nextTurn(newState), 1500);
    }
  };

  // Automatic Movement Effect
  useEffect(() => {
    // Only run this effect if it is MY turn (so only one client processes the auto-move logic)
    if (!isMyTurn) return;

    if (gameState.phase === 'MOVE' && gameState.diceValue !== null && !isRolling && !isAnimating) {
        const val = gameState.diceValue;
        
        const validPieces = (Object.values(gameState.pieces) as Piece[]).filter(p => {
            if (p.color !== currentPlayer) return false;
            if (p.position === 999) return false; 
            if (p.position === -1) return val === 6;
            if (p.traveled + val > 57) return false;
            return true; 
        });

        if (validPieces.length === 1) {
            const pieceToMove = validPieces[0];
            const timer = setTimeout(() => {
                handlePieceClick(pieceToMove.id);
            }, 600);
            return () => clearTimeout(timer);
        }
    }
  }, [gameState.phase, gameState.diceValue, isRolling, isAnimating, currentPlayer, isMyTurn]); 

  const nextTurn = (currentState: GameState) => {
    // We pass currentState to avoid stale closures in timeouts, but simple logic uses functional update or passed arg
    const prev = currentState;
    const nextIdx = (prev.currentPlayerIndex + 1) % 4;
    const nextPlayer = prev.players[nextIdx];
    
    const nextPlayerFirstTurn = !prev.hasPlayedFirstTurn[nextPlayer];
    const nextRolls = nextPlayerFirstTurn ? 4 : 1;

    const newState: GameState = {
        ...prev,
        currentPlayerIndex: nextIdx,
        diceValue: null,
        phase: 'ROLL',
        rollsLeftInTurn: nextRolls,
        hasPlayedFirstTurn: {
            ...prev.hasPlayedFirstTurn,
            [prev.players[prev.currentPlayerIndex]]: true
        }
    };
    pushGameState(newState);
    setCommentary("Next player's turn!");
  };

  const getNextStep = (color: PlayerColor, currentPos: number, currentTraveled: number): number => {
      if (currentTraveled >= 56) return 999;
      if (currentPos >= 100 && currentPos < 999) return currentPos + 1;
      if (currentTraveled === 50) return HOME_PATH_START[color];
      return (currentPos + 1) % 52;
  };

  const triggerCaptureEffect = (positionIndex: number, color: string) => {
      if (!BOARD_MAP[positionIndex]) return;
      
      const { x, z } = BOARD_MAP[positionIndex];
      const effectId = Date.now().toString();
      
      const newEffect: VisualEffect = {
          id: effectId,
          type: 'CAPTURE',
          position: [x, 0.5, z],
          color: color
      };

      setEffects(prev => [...prev, newEffect]);

      // Remove effect after 1.5 seconds
      setTimeout(() => {
          setEffects(prev => prev.filter(e => e.id !== effectId));
      }, 1500);
  };

  const handlePieceClick = async (pieceId: string) => {
    if (isAnimating || !isMyTurn) return;
    playGameSound('ui');
    
    const piece = gameState.pieces[pieceId];
    if (piece.color !== currentPlayer) return;
    if (gameState.diceValue === null) return;
    
    const val = gameState.diceValue;

    if (piece.position === -1 && val !== 6) {
        setCommentary("You need a 6 to spawn!");
        return;
    }
    
    if (piece.traveled + val > 57) {
        setCommentary("Move too far! Need exact roll.");
        setTimeout(() => nextTurn(gameState), 1000);
        return;
    }

    // 1. Spawn Logic
    if (piece.position === -1) {
      if (val === 6) {
        const spawnPos = PATH_START[currentPlayer];
        const newState = {
             ...gameState,
             pieces: {
                 ...gameState.pieces,
                 [pieceId]: { ...gameState.pieces[pieceId], position: spawnPos, traveled: 1 }
             }
        };
        // Optimistic update for spawn (instant)
        pushGameState(newState);
        playGameSound('move');
        finishMoveLogic(newState, pieceId, spawnPos, val);
      }
      return;
    }

    // 2. Move Logic
    setIsAnimating(true);
    let currentPos = piece.position;
    let currentTraveled = piece.traveled;
    const steps = val;

    // We only animate LOCALLY, but we need to ensure the final state is what gets pushed.
    
    for (let i = 0; i < steps; i++) {
        const nextPos = getNextStep(currentPlayer, currentPos, currentTraveled);
        const nextTraveled = currentTraveled + 1;
        
        // Local animation state update
        setGameState(prev => ({
            ...prev,
            pieces: {
                ...prev.pieces,
                [pieceId]: { ...prev.pieces[pieceId], position: nextPos, traveled: nextTraveled }
            }
        }));
        
        playGameSound('move');
        await new Promise(resolve => setTimeout(resolve, 300));
        
        currentPos = nextPos;
        currentTraveled = nextTraveled;
        if (nextPos === 999) break; 
    }
    
    setIsAnimating(false);
    
    if (currentPos === 999) {
        playGameSound('win');
        setCommentary(`${currentPlayer} reached the goal! +50 Points!`);
    }

    // Re-construct the final state object based on current 'gameState' which has been updated by the loop locally
    const finalState = {
        ...gameState,
        pieces: {
            ...gameState.pieces,
            [pieceId]: { ...gameState.pieces[pieceId], position: currentPos, traveled: currentTraveled }
        }
    };

    finishMoveLogic(finalState, pieceId, currentPos, val);
  };

  const finishMoveLogic = (currentState: GameState, pieceId: string, finalPos: number, diceVal: number) => {
    let captureHappened = false;
    let newState = { ...currentState };
    
    if (finalPos !== 999 && finalPos < 100) {
        const victimId = checkCapture(finalPos, currentPlayer, newState.pieces);
        if (victimId) {
            captureHappened = true;
            const victim = newState.pieces[victimId];
            
            // Trigger Visual Effect
            triggerCaptureEffect(finalPos, COLORS[victim.color]);

            newState = {
                ...newState,
                pieces: {
                    ...newState.pieces,
                    [victimId]: { ...newState.pieces[victimId], position: -1, traveled: 0 },
                    [pieceId]: { ...newState.pieces[pieceId], position: finalPos }
                }
            };
            playGameSound('capture');
            
            // Update Commentary with specific capture prompt
            getGeminiCommentary("CAPTURE", currentPlayer, `Violently captured ${victim.color} at tile ${finalPos}!`).then(setCommentary);
        }
    }

    if (diceVal === 6 || captureHappened || finalPos === 999) {
        // If capture just happened, Gemini is already called above. Don't overwrite immediately unless it wasn't a capture.
        if (!captureHappened) {
            const msg = finalPos === 999 ? "Goal reached! Bonus Roll!" : "Rolled a 6! Roll again!";
            setCommentary(msg);
        }
        
        newState = { 
            ...newState, 
            diceValue: null, 
            phase: 'ROLL',
            rollsLeftInTurn: 1 
        };
        pushGameState(newState);
    } else {
        pushGameState(newState); // Push the move
        setTimeout(() => nextTurn(newState), 500); // Trigger turn change
    }
  };

  // --- RENDER ---

  if (mode === 'LOGIN') {
      return <LoginScreen onLogin={handleLogin} onPlayLocal={() => setMode('GAME_LOCAL')} />;
  }

  if (mode === 'LOBBY') {
      return <LobbyScreen 
                user={user} 
                onLogout={handleLogout} 
                onCreateMatch={handleCreateMatch} 
                onJoinMatch={handleJoinMatch}
                onPlayLocal={() => setMode('GAME_LOCAL')} 
             />;
  }

  return (
    <div className="w-full h-screen relative bg-slate-900 select-none overflow-hidden">
      {/* 3D Game Layer */}
      <div className="absolute inset-0 z-0">
        <GameScene 
          gameState={gameState} 
          onPieceClick={handlePieceClick} 
          onDiceResult={() => {}} 
          isRolling={isRolling}
          visualEffects={effects}
        />
      </div>

      {/* Waiting Room Overlay if Online and players < 2 (just for example, usually 2 is min) */}
      {mode === 'GAME_ONLINE' && connectedPlayers < 1 && (
          <WaitingRoom matchId={matchId || ""} playerCount={connectedPlayers} onStart={() => {}} />
      )}

      {/* HUD Overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-4 md:p-8">
        
        {/* Header Section */}
        <div className="flex justify-between items-start w-full">
            <div className="flex flex-col md:flex-row gap-4 items-start">
                {/* Game Title & Player Card */}
                <div 
                  className="bg-slate-900/90 backdrop-blur-xl p-4 rounded-2xl border-2 text-white pointer-events-auto shadow-2xl min-w-[240px] transition-all duration-500 ease-in-out"
                  style={{ 
                    borderColor: COLORS[currentPlayer], 
                    boxShadow: `0 0 30px ${COLORS[currentPlayer]}30`
                  }}
                >
                    <div className="flex justify-between items-center mb-3">
                        <h1 className="text-xl font-black text-yellow-400 tracking-tight" style={{ fontFamily: '"Press Start 2P", cursive', textShadow: '2px 2px 0px #000' }}>
                            VOXEL LUDO
                        </h1>
                        {/* Mode Indicator */}
                        {mode === 'GAME_ONLINE' ? (
                            <div className="flex items-center gap-1 text-xs font-mono text-green-400 bg-green-900/30 px-2 py-1 rounded">
                                <Wifi size={12} /> ONLINE
                            </div>
                        ) : (
                            <div className="flex items-center gap-1 text-xs font-mono text-blue-400 bg-blue-900/30 px-2 py-1 rounded">
                                <WifiOff size={12} /> LOCAL
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-3 bg-white/5 p-2 rounded-lg border border-white/5">
                        <div 
                            className="w-8 h-8 rounded-lg shadow-lg flex items-center justify-center border border-white/20" 
                            style={{ backgroundColor: COLORS[currentPlayer] }}
                        >
                             <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Current Turn</span>
                            <span className="font-bold text-white text-lg leading-none">{currentPlayer}</span>
                        </div>
                    </div>
                     
                     <div className="mt-3 flex items-center gap-2 bg-black/20 p-2 rounded text-sm">
                        <Trophy size={14} className="text-yellow-400" />
                        <span className="text-gray-300 font-mono">Score:</span>
                        <span className="text-white font-bold">{scores[currentPlayer]}</span>
                     </div>
                     
                     {/* Online Info */}
                     {mode === 'GAME_ONLINE' && (
                         <div className="mt-2 text-[10px] text-slate-500 font-mono">
                             You are: <span style={{ color: COLORS[onlinePlayerColor || 'RED']}}>{onlinePlayerColor}</span>
                             <br/>
                             Match ID: {matchId}
                         </div>
                     )}
                </div>

                {/* Dice Result Banner */}
                {gameState.diceValue !== null && (
                    <div className="bg-slate-900/90 backdrop-blur-xl p-4 rounded-2xl border border-white/10 text-white flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-auto shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
                        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-xl shadow-lg">
                            <Dices className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider mb-0.5">Rolled</span>
                            <span className="text-3xl font-black leading-none text-white font-mono tracking-tighter filter drop-shadow-md">
                                {gameState.diceValue}
                            </span>
                        </div>
                    </div>
                )}
            </div>
          
            {/* Top Right Scoreboard */}
            <div className="pointer-events-auto bg-slate-900/90 backdrop-blur-xl p-3 rounded-2xl border border-white/10 shadow-lg flex flex-col gap-2 min-w-[160px]">
                <div className="flex items-center gap-2 mb-1 border-b border-white/10 pb-2">
                    <Activity size={14} className="text-blue-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Leaderboard</span>
                </div>
                {gameState.players.map(p => (
                    <div key={p} className={`flex justify-between items-center text-xs ${p === currentPlayer ? 'opacity-100' : 'opacity-60'}`}>
                        <div className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[p] }}></div>
                             <span className="font-bold text-white">{p}</span>
                        </div>
                        <span className="font-mono text-yellow-400">{scores[p]}</span>
                    </div>
                ))}
                 <button onClick={() => setMode(user ? 'LOBBY' : 'LOGIN')} className="mt-2 w-full text-xs bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white py-1 rounded transition">
                    Exit Game
                </button>
            </div>
        </div>

        {/* AI Commentary Box (Bottom Center) */}
        <div className="self-center mt-auto mb-24 md:mb-12 w-full max-w-xl pointer-events-auto z-20">
           <div className="bg-gradient-to-r from-slate-900/95 via-indigo-950/95 to-slate-900/95 backdrop-blur-xl p-0.5 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] transform transition-all hover:scale-[1.02]">
              <div className="bg-slate-950/50 rounded-[14px] p-4 flex items-start gap-4">
                 <div className="bg-blue-600 p-2.5 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.5)] animate-pulse shrink-0">
                    <Mic size={20} className="text-white" />
                 </div>
                 <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between mb-1">
                        <h3 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Live Commentary</h3>
                        <span className="text-[10px] text-gray-500 font-mono">UNCLE K (AI)</span>
                    </div>
                    <p className="text-white text-sm md:text-base font-medium leading-relaxed drop-shadow-sm">
                      "{commentary}"
                    </p>
                 </div>
              </div>
           </div>
        </div>

        {/* Roll Button (Bottom Floating) */}
        {gameState.phase === 'ROLL' && !isRolling && !isAnimating && isMyTurn && (
           <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 pointer-events-auto z-30 animate-bounce">
              <button 
                onClick={handleDiceClick}
                className="group relative px-10 py-4 bg-gradient-to-b from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 text-slate-900 font-black rounded-full shadow-[0_10px_20px_rgba(234,179,8,0.4)] text-xl transition-all transform hover:scale-105 active:scale-95 border-b-4 border-yellow-700 active:border-b-0 active:translate-y-1"
              >
                <div className="flex items-center gap-3">
                   <Dices className="w-6 h-6 group-hover:rotate-180 transition-transform duration-500" />
                   <span>ROLL DICE</span>
                </div>
              </button>
           </div>
        )}
        
        {/* Waiting for Turn Indicator */}
        {!isMyTurn && gameState.phase === 'ROLL' && (
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-30 bg-black/50 text-white px-4 py-2 rounded-full backdrop-blur-sm text-sm font-mono border border-white/10">
                Waiting for {currentPlayer}...
            </div>
        )}
      </div>
    </div>
  );
}
