import { useEffect } from 'react';
import { useStore } from '../../store';

export function PauseMenu({ onClose }: { onClose: () => void }) {
  const { masterVolume, setMasterVolume, bgMusicVolume, setBgMusicVolume, undoLastPuck, resetGame } = useStore();

  // Close menu on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center pointer-events-auto">
      <div className="bg-slate-800 border-2 border-slate-600 rounded-xl p-8 max-w-sm w-full text-center shadow-2xl flex flex-col gap-6">
        <h2 className="text-3xl font-bold text-white mb-2">Paused</h2>
        
        <div className="flex flex-col gap-5 text-left">
           <div>
             <label className="text-slate-300 font-semibold text-sm mb-1 block">Game SFX Volume</label>
             <input 
               type="range" 
               min="0" 
               max="1" 
               step="0.05"
               value={masterVolume}
               onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
               className="w-full accent-blue-500"
             />
           </div>
           
           <div>
             <label className="text-slate-300 font-semibold text-sm mb-1 block">Radio Music Volume</label>
             <input 
               type="range" 
               min="0" 
               max="1" 
               step="0.05"
               value={bgMusicVolume}
               onChange={(e) => setBgMusicVolume(parseFloat(e.target.value))}
               className="w-full accent-teal-400"
             />
           </div>
        </div>

        <button 
          onClick={() => {
            undoLastPuck();
            onClose();
          }}
          className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-4 rounded-lg transition-colors border border-slate-500 mt-2"
        >
          Undo Last Shot
        </button>

        <button 
          onClick={resetGame}
          className="bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-4 rounded-lg transition-colors border border-red-400"
        >
          Return to Main Menu
        </button>

        <button 
          onClick={onClose}
          className="mt-2 text-slate-400 hover:text-white font-bold underline underline-offset-4"
        >
          Resume Game
        </button>
      </div>
    </div>
  );
}
