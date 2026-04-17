import { useStore } from '../../store';

export function MainMenu() {
  const { setGameState, sweepSpeed, setSweepSpeed, setGameMode } = useStore();

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#002244] text-white p-8">
      <h1 className="text-6xl font-black tracking-tight mb-4 text-center text-accent drop-shadow-[0_0_20px_rgba(0,242,255,0.8)]">
        SHUFFLEBOARD<br/><span className="text-[#ffbb00]">AHOY!</span>
      </h1>
      <p className="text-2xl text-white/70 mb-12 text-center max-w-2xl font-light">
        A single-switch accessible 3D cruise deck game.
      </p>

      <div className="flex gap-6 mb-12">
        <button 
          className="bg-[#114466] shadow-[0_10px_20px_rgba(0,0,0,0.5)] p-8 rounded border-t-4 border-accent hover:bg-[#115588] transition-all transform hover:-translate-y-1"
          onClick={(e) => { e.stopPropagation(); setGameMode('single'); setGameState('setup'); }}
        >
          <p className="text-3xl font-bold text-accent drop-shadow-sm">Solo Cruise</p>
        </button>
        <button 
          className="bg-[#114466] shadow-[0_10px_20px_rgba(0,0,0,0.5)] p-8 rounded border-t-4 border-[#ffbb00] hover:bg-[#115588] transition-all transform hover:-translate-y-1"
          onClick={(e) => { e.stopPropagation(); setGameMode('class'); setGameState('setup'); }}
        >
          <p className="text-3xl font-bold text-[#ffbb00] drop-shadow-sm">Class Tournament</p>
        </button>
      </div>

      <div className="flex items-center gap-4 bg-[#114466] p-4 rounded border border-white/20 shadow-lg">
        <span className="font-medium text-white/70 uppercase tracking-[1px] text-[12px]">Game Speed:</span>
        <button 
          className={`px-4 py-2 rounded font-bold transition-colors ${sweepSpeed === 0.5 ? 'bg-accent text-[#002244]' : 'bg-white/10 hover:bg-white/20'}`}
          onClick={(e) => { e.stopPropagation(); setSweepSpeed(0.5); }}
        >
          Slow
        </button>
        <button 
          className={`px-4 py-2 rounded font-bold transition-colors ${sweepSpeed === 1.0 ? 'bg-accent text-[#002244]' : 'bg-white/10 hover:bg-white/20'}`}
          onClick={(e) => { e.stopPropagation(); setSweepSpeed(1.0); }}
        >
          Normal
        </button>
        <button 
          className={`px-4 py-2 rounded font-bold transition-colors ${sweepSpeed === 2.0 ? 'bg-accent text-[#002244]' : 'bg-white/10 hover:bg-white/20'}`}
          onClick={(e) => { e.stopPropagation(); setSweepSpeed(2.0); }}
        >
          Fast
        </button>
      </div>
    </div>
  );
}
