import { useEffect, useRef, useState } from 'react';
import { useStore, calculateTotalScore } from '../../store';
import { useSingleSwitch } from '../../hooks/useSingleSwitch';
import { motion } from 'motion/react';
import { audioEngine } from '../../lib/audio';
import { Volume2, VolumeX } from 'lucide-react';

export function GameplayOverlay() {
  const { playState, setPlayState, aimAngle, setAimAngle, powerLevel, setPowerLevel, sweepSpeed, gameMode, currentFrame, totalRounds, playerFrames, players, currentPlayerIndex, currentPuckIndex, teacherAdvancePending, nextTurnAfterTeacher, masterVolume, setMasterVolume, bumpersEnabled, computerDifficulty } = useStore();
  
  const [localAim, setLocalAim] = useState(0);
  const [localPower, setLocalPower] = useState(0);
  
  const localAimRef = useRef(0);
  const localPowerRef = useRef(0);
  
  const aimDir = useRef(1);
  const powerDir = useRef(1);

  const activePlayer = gameMode === 'single' ? players[currentPuckIndex % 2] : players[currentPlayerIndex % players.length];
  const isComputer = activePlayer?.id === 'computer';

  const pucksPerRound = gameMode === 'single' ? 8 : 4;

  useEffect(() => {
    if (playState === 'aiming') {
      localAimRef.current = 0;
      localPowerRef.current = 0;
      setLocalAim(0);
      setLocalPower(0);
      aimDir.current = 1;
      powerDir.current = 1;
    }
  }, [playState]);

  // Animation Loop
  useEffect(() => {
    let animationFrame: number;
    let lastTime = performance.now();
    
    const loop = (time: number) => {
      const delta = (time - lastTime) / 1000;
      lastTime = time;
      
      if (playState === 'aiming') {
        const maxAngle = bumpersEnabled ? 0.15 : 0.22; // Narrower sweep angle so visual anchor doesn't clip
        let next = localAimRef.current + (delta * 0.4 * sweepSpeed * aimDir.current);
        if (next > maxAngle) {
          next = maxAngle;
          aimDir.current = -1;
        } else if (next < -maxAngle) {
          next = -maxAngle;
          aimDir.current = 1;
        }
        localAimRef.current = next;
        setLocalAim(next);
        if (!isComputer) {
          useStore.setState({ aimAngle: next });
        }
      } else if (playState === 'power') {
        let next = localPowerRef.current + (delta * 100 * sweepSpeed * powerDir.current);
        if (next > 100) {
          next = 100;
          powerDir.current = -1;
        } else if (next < 0) {
          next = 0;
          powerDir.current = 1;
        }
        localPowerRef.current = next;
        setLocalPower(next);
      }
      animationFrame = requestAnimationFrame(loop);
    };
    
    // Only run normal UI animations for humans
    if (!isComputer) {
      animationFrame = requestAnimationFrame(loop);
    }
    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [playState, sweepSpeed, isComputer]);

  // Computer Opponent Logic
  useEffect(() => {
    if (!isComputer || teacherAdvancePending) return;

    let timer: number;
    if (playState === 'aiming') {
      timer = window.setTimeout(() => {
        let maxAimError = 0.2;
        if (computerDifficulty === 1) maxAimError = 0.4;
        else if (computerDifficulty === 2) maxAimError = 0.2;
        else if (computerDifficulty === 3) maxAimError = 0.05;
        
        const randomAim = (Math.random() - 0.5) * maxAimError; // Small random angle based on diff
        setAimAngle(randomAim);
        setPlayState('power');
      }, 1500 / sweepSpeed); 
    } else if (playState === 'power') {
      timer = window.setTimeout(() => {
        let randomPower = 0.8;
        if (computerDifficulty === 1) {
          randomPower = Math.random() * 0.6 + 0.4; // 40% to 100%
        } else if (computerDifficulty === 2) {
          randomPower = Math.random() * 0.4 + 0.6; // 60% to 100%
        } else if (computerDifficulty === 3) {
          randomPower = Math.random() * 0.15 + 0.80; // 80% to 95%
        }
        setPowerLevel(randomPower);
        setPlayState('rolling');
      }, 1000 / sweepSpeed);
    }

    return () => window.clearTimeout(timer);
  }, [isComputer, playState, teacherAdvancePending, sweepSpeed, computerDifficulty, setAimAngle, setPlayState, setPowerLevel]);


  const currentScore = activePlayer ? calculateTotalScore(playerFrames[activePlayer.id] || [], totalRounds) : 0;

  // Single Switch Handler
  useSingleSwitch(() => {
    // Initialize audio on first interaction
    try {
      audioEngine.playBGM();
    } catch(e) {}

    if (isComputer) return;

    if (playState === 'aiming' && !teacherAdvancePending) {
      setAimAngle(localAim);
      setPlayState('power');
    } else if (playState === 'power' && !teacherAdvancePending) {
      setPowerLevel(localPower / 100);
      setPlayState('rolling');
    }
  }, (playState === 'aiming' || playState === 'power') && !teacherAdvancePending && !isComputer);

  if (playState === 'idle' && !teacherAdvancePending) return null;

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between" onClick={() => { try { audioEngine.playBGM(); } catch(e){} }}>
      {/* Top Bar */}
      <header className="h-[80px] bg-gradient-to-b from-header-bg to-transparent flex justify-between items-center px-10 z-10 pointer-events-auto">
        <div className="flex gap-5">
          {/* Volume Control Removed as it's now in the Pause Menu */}
          <div className="bg-panel border-l-4 border-accent px-5 py-2.5 rounded">
            <div className="text-[12px] uppercase tracking-[1px] text-accent">Current Player</div>
            <div className="text-[24px] font-bold">{activePlayer?.name || 'Player'}</div>
          </div>
          <div className="bg-panel border-l-4 border-accent px-5 py-2.5 rounded flex items-center justify-center">
            <div className="flex flex-col">
              <div className="text-[12px] uppercase tracking-[1px] text-accent text-center">Round</div>
              <div className="text-[24px] font-bold text-center">{currentFrame + 1} / {totalRounds}</div>
            </div>
          </div>
          <div className="bg-panel border-l-4 border-[#00ff00] px-5 py-2.5 rounded flex justify-center items-center">
             <div className="flex flex-col">
                <div className="text-[12px] uppercase tracking-[1px] text-[#00ff00]">Pucks Played</div>
                <div className="text-[24px] font-bold">{currentPuckIndex + 1} / {pucksPerRound}</div>
             </div>
          </div>
        </div>
        <div className="flex gap-5">
          {players.map((p) => (
             <div key={p.id} className="bg-panel border-l-4 border-white px-5 py-2.5 rounded text-right">
                <div className="text-[12px] uppercase tracking-[1px] text-white/70">{p.name} Score</div>
                <div className="text-[20px] text-white">
                  {calculateTotalScore(playerFrames[p.id] || [], totalRounds)}
                </div>
             </div>
          ))}
        </div>
      </header>

      <div className="flex-1 relative pointer-events-auto">
        {/* Power UI */}
        {playState === 'power' && !teacherAdvancePending && !isComputer && (
          <div className="absolute left-10 pt-[30px] bottom-[140px] w-[80px] h-[400px] bg-[#c29f6d] border-4 border-white shadow-[0_10px_20px_rgba(0,0,0,0.5)] flex flex-col items-center overflow-hidden">
            <div className="w-full text-center text-[14px] font-bold text-black drop-shadow-md bg-white/70 px-2 py-1 z-20 shadow-md">POWER</div>
            
            {/* The Scoring Zones Painted on the Board Background */}
            <div className="absolute top-[30px] bottom-0 left-0 right-0 flex flex-col pointer-events-none">
              <div className="w-full h-[5%] bg-[#aa2222] opacity-80 border-b border-black/40 shadow-inner flex items-center justify-center text-white/50 text-[10px] font-bold">X</div>
              <div className="w-full h-[15%] bg-[#22aa22] opacity-80 border-b border-black/40 shadow-inner flex items-center justify-center text-white/50 text-[14px] font-bold">10</div>
              <div className="w-full h-[25%] bg-[#2222aa] opacity-80 border-b border-black/40 shadow-inner flex items-center justify-center text-white/50 text-[14px] font-bold">8</div>
              <div className="w-full h-[35%] bg-[#aa22aa] opacity-80 shadow-inner flex items-center justify-center text-white/50 text-[14px] font-bold">7</div>
              <div className="w-full h-[20%] flex items-center justify-center">
                 {/* Wood finish start area */}
              </div>
            </div>

            {/* The Puck container moving up and down */}
            <div 
              className="absolute left-0 w-full flex justify-center z-10 drop-shadow-xl"
              style={{ bottom: `calc(${localPower}% - 20px)` }}
            >
               {/* 3D-ish CSS puck */}
               <div 
                 className="w-[40px] h-[40px] rounded-full shadow-lg border-[3px] border-white/30" 
                 style={{ 
                    backgroundColor: gameMode === 'single' ? (currentPuckIndex % 2 === 0 ? '#ee2222' : '#2222ee') : '#ee2222', 
                    boxShadow: 'inset 0 5px 0 rgba(255,255,255,0.4), inset 0 -5px 0 rgba(0,0,0,0.3), 0 8px 10px rgba(0,0,0,0.6)' 
                 }} 
               />
            </div>
          </div>
        )}

        {/* Teacher Advance Modal */}
        {teacherAdvancePending && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-50">
            <div className="bg-[#114466] p-8 rounded-xl border border-white/40 text-center max-w-md shadow-2xl">
              <h2 className="text-3xl font-bold text-white mb-4">Round Complete!</h2>
              <div className="mb-8 flex flex-col gap-2">
                 {players.map(p => {
                    const f = playerFrames[p.id]?.[currentFrame];
                    const roundScore = f?.score || 0;
                    return (
                        <p key={p.id} className="text-xl text-yellow-300">{p.name} scored {roundScore} points this round!</p>
                    )
                 })}
              </div>
              <button 
                onClick={nextTurnAfterTeacher}
                className="bg-accent text-white px-8 py-4 rounded font-black text-2xl uppercase tracking-wider hover:bg-white hover:text-[#006994] transition-colors shadow-lg"
              >
                {currentFrame + 1 >= totalRounds && (gameMode === 'single' || currentPlayerIndex + 1 >= players.length) ? 'Finish Game' : 'Next'}
              </button>
              {gameMode === 'class' && <p className="text-white/70 mt-4 text-sm">(Teacher must click to advance)</p>}
            </div>
          </div>
        )}
      </div>

      {/* Accessibility Tray */}
      <footer className="h-[120px] bg-[#002244] border-t-4 border-accent flex justify-center items-center z-20 shadow-[0_-5px_15px_rgba(0,0,0,0.5)]">
        <div className="text-center">
          <div className="text-[42px] font-[800] text-accent uppercase tracking-[2px] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            {isComputer && !teacherAdvancePending ? "Computer's Turn..." : (
               <>
                 {teacherAdvancePending && "Round Finished"}
                 {!teacherAdvancePending && playState === 'aiming' && "Press Switch to Lock Aim"}
                 {!teacherAdvancePending && playState === 'power' && "Press Switch for Power"}
                 {!teacherAdvancePending && playState === 'rolling' && "Sliding..."}
                 {!teacherAdvancePending && playState === 'scoring' && "Scoring..."}
               </>
            )}
          </div>
          {!teacherAdvancePending && !isComputer && (
            <div className="text-[18px] text-white mt-[5px]">
              Spacebar, Enter, or Click anywhere
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}
