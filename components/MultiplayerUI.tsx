import React, { useState } from 'react';
import { LogIn, Users, Plus, Play, LogOut } from 'lucide-react';

interface LoginScreenProps {
  onLogin: () => void;
  onPlayLocal: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onPlayLocal }) => {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/95 backdrop-blur-sm">
      <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl border border-white/10 max-w-md w-full text-center">
        <h1 className="text-3xl font-black text-yellow-400 mb-6" style={{ fontFamily: '"Press Start 2P", cursive' }}>
          VOXEL LUDO
        </h1>
        <p className="text-slate-300 mb-8">Sign in to play online with friends or play locally on this device.</p>
        
        <button 
          onClick={onLogin}
          className="w-full bg-white hover:bg-gray-100 text-slate-900 font-bold py-3 px-6 rounded-xl mb-4 flex items-center justify-center gap-2 transition-all transform hover:scale-105"
        >
          <img src="https://www.google.com/favicon.ico" alt="G" className="w-5 h-5" />
          Sign in with Google
        </button>

        <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-600"></div></div>
            <div className="relative flex justify-center text-sm"><span className="px-2 bg-slate-800 text-slate-500">OR</span></div>
        </div>

        <button 
          onClick={onPlayLocal}
          className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all"
        >
          <Users size={20} />
          Play Local Multiplayer
        </button>
      </div>
    </div>
  );
};

interface LobbyScreenProps {
  user: any;
  onLogout: () => void;
  onCreateMatch: () => void;
  onJoinMatch: (id: string) => void;
  onPlayLocal: () => void;
}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({ user, onLogout, onCreateMatch, onJoinMatch, onPlayLocal }) => {
  const [joinId, setJoinId] = useState("");

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/95 backdrop-blur-sm">
      <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl border border-white/10 max-w-md w-full">
        <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
           <div className="flex items-center gap-3">
             {user.photoURL && <img src={user.photoURL} className="w-10 h-10 rounded-full border-2 border-green-400" />}
             <div>
                <p className="text-white font-bold text-sm">{user.displayName}</p>
                <p className="text-green-400 text-xs font-mono">ONLINE</p>
             </div>
           </div>
           <button onClick={onLogout} className="text-slate-400 hover:text-white transition"><LogOut size={18}/></button>
        </div>

        <div className="space-y-4">
            <button 
              onClick={onCreateMatch}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all transform hover:scale-105 shadow-lg shadow-indigo-500/20"
            >
              <Plus size={24} />
              Create New Match
            </button>

            <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
                <label className="text-xs text-slate-400 uppercase font-bold mb-2 block">Join Existing Match</label>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={joinId}
                        onChange={(e) => setJoinId(e.target.value)}
                        placeholder="Enter Match ID"
                        className="flex-1 bg-slate-800 text-white px-4 py-2 rounded-lg border border-slate-700 focus:border-indigo-500 outline-none font-mono"
                    />
                    <button 
                        onClick={() => onJoinMatch(joinId)}
                        disabled={!joinId}
                        className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white px-4 rounded-lg font-bold"
                    >
                        Join
                    </button>
                </div>
            </div>

            <div className="relative my-4">
               <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-700"></div></div>
            </div>

            <button 
              onClick={onPlayLocal}
              className="w-full bg-transparent hover:bg-slate-700 text-slate-400 hover:text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all border border-slate-700"
            >
              <Users size={18} />
              Switch to Local Play
            </button>
        </div>
      </div>
    </div>
  );
};

export const WaitingRoom: React.FC<{ matchId: string; playerCount: number; onStart: () => void }> = ({ matchId, playerCount, onStart }) => {
    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-md">
            <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl border border-white/10 text-center animate-in fade-in zoom-in duration-300">
                <h2 className="text-2xl font-bold text-white mb-2">Waiting for Players</h2>
                <div className="bg-slate-900 p-3 rounded-lg mb-6 flex items-center justify-center gap-2 border border-dashed border-slate-600">
                    <span className="text-slate-400 text-sm font-mono">Match ID:</span>
                    <span className="text-yellow-400 font-mono font-bold select-all cursor-pointer">{matchId}</span>
                </div>
                
                <div className="flex justify-center gap-2 mb-8">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className={`w-3 h-3 rounded-full ${i < playerCount ? 'bg-green-500 animate-pulse' : 'bg-slate-700'}`} />
                    ))}
                    <span className="ml-2 text-slate-400 text-sm">{playerCount}/4 Players</span>
                </div>

                <button 
                    onClick={onStart}
                    className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2"
                >
                    <Play size={20} />
                    Start Game Now
                </button>
            </div>
        </div>
    );
}