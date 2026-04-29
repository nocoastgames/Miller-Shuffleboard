import React, { useState } from 'react';
import { useStore } from '../../store';

export function TournamentSetup() {
  const gameMode = useStore(s => s.gameMode);
  const players = useStore(s => s.players);
  const addPlayer = useStore(s => s.addPlayer);
  const removePlayer = useStore(s => s.removePlayer);
  const startGame = useStore(s => s.startGame);
  const setGameState = useStore(s => s.setGameState);
  
  const totalRounds = useStore(s => s.totalRounds);
  const setTotalRounds = useStore(s => s.setTotalRounds);
  
  const computerDifficulty = useStore(s => s.computerDifficulty);
  const setComputerDifficulty = useStore(s => s.setComputerDifficulty);
  
  const bumpersEnabled = useStore(s => s.bumpersEnabled);
  const setBumpersEnabled = useStore(s => s.setBumpersEnabled);
  
  const [name, setName] = useState('');

  const handleAdd = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const playerName = name.trim() || `Player ${players.length + 1}`;
    
    if (gameMode === 'single') {
      startGame(playerName);
    } else if (players.length < 32) {
      addPlayer(playerName);
      setName('');
    }
  };

  return (
    <div className="absolute inset-0 flex flex-col items-center bg-[#002244] text-white p-8 overflow-y-auto">
      <div className="w-full max-w-4xl">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-4xl font-black tracking-tight text-accent drop-shadow-[0_0_10px_rgba(0,242,255,0.4)]">
            {gameMode === 'single' ? 'Single Player Setup' : 'Class Mode Setup'}
          </h2>
          <button 
            onClick={() => setGameState('menu')}
            className="px-6 py-3 bg-[#114466] border border-white/10 hover:bg-[#115588] rounded font-bold text-xl transition-colors"
          >
            Back
          </button>
        </div>

        <div className={`grid grid-cols-1 ${gameMode === 'class' ? 'md:grid-cols-2' : ''} gap-8`}>
          <div className="bg-[#114466] p-6 rounded border-l-4 border-accent shadow-xl">
            <h3 className="text-2xl font-bold mb-4">
              {gameMode === 'single' ? 'Enter Player Name' : `Add Player (${players.length}/32)`}
            </h3>
            <form onSubmit={handleAdd} className="flex gap-4">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={`Player ${players.length + 1}`}
                className="flex-1 bg-[#002244] border border-white/20 rounded px-4 py-3 text-xl focus:border-accent focus:outline-none"
                maxLength={20}
              />
              <button 
                type="submit"
                disabled={gameMode === 'class' && players.length >= 32}
                className="px-6 py-3 bg-accent text-[#002244] hover:bg-white disabled:opacity-50 rounded font-bold text-xl transition-colors shadow"
              >
                {gameMode === 'single' ? 'Start Game' : 'Add'}
              </button>
            </form>

            <div className="mt-8 flex flex-col gap-3">
              <label className="text-xl font-medium">Number of Frames (Rounds)</label>
              <div className="flex gap-2">
                {[1, 4, 8, 10, 20].map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setTotalRounds(r)}
                    className={`flex-1 py-3 rounded font-bold text-xl transition-colors shadow ${totalRounds === r ? 'bg-accent text-[#002244]' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {gameMode === 'single' && (
              <div className="mt-8 flex flex-col gap-3">
                <label className="text-xl font-medium">Computer Difficulty</label>
                <div className="flex gap-2">
                  {[1, 2, 3].map(level => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setComputerDifficulty(level as 1 | 2 | 3)}
                      className={`flex-1 py-3 rounded font-bold text-xl transition-colors shadow ${computerDifficulty === level ? 'bg-accent text-[#002244]' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                    >
                       Level {level}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 p-4 rounded border border-white/20 shadow-inner bg-[#002244] flex items-center justify-between">
              <label className="text-xl font-medium">Gutter Bumpers (Easier)</label>
              <button 
                 type="button"
                 onClick={() => setBumpersEnabled(!bumpersEnabled)}
                 className={`w-16 h-8 rounded-full transition-colors relative shadow ${bumpersEnabled ? 'bg-accent' : 'bg-slate-600'}`}
              >
                 <div className={`absolute top-1 bottom-1 w-6 bg-white rounded-full transition-all shadow-md ${bumpersEnabled ? 'left-9' : 'left-1'}`} />
              </button>
            </div>

            {gameMode === 'class' && (
              <button
                onClick={() => startGame()}
                disabled={players.length < 1}
                className="w-full mt-8 px-6 py-4 bg-[#00ff00] text-[#002244] hover:bg-[#00cc00] disabled:opacity-50 rounded font-black text-2xl transition-colors shadow"
              >
                Start Class Game
              </button>
            )}
          </div>

          {gameMode === 'class' && (
            <div className="bg-[#114466] p-6 rounded border border-white/10 max-h-[60vh] overflow-y-auto shadow-xl">
              <h3 className="text-2xl font-bold mb-4">Players</h3>
              {players.length === 0 ? (
                <p className="text-white/60 text-lg">No players added yet.</p>
              ) : (
                <ul className="space-y-2">
                  {players.map((p, i) => (
                    <li key={p.id} className="flex justify-between items-center bg-[#002244] p-4 rounded border border-white/10">
                      <span className="text-xl font-medium">{i + 1}. {p.name}</span>
                      <button 
                        onClick={() => removePlayer(p.id)}
                        className="text-[#ff5555] hover:text-[#ff2222] font-bold p-2 transition-colors"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
