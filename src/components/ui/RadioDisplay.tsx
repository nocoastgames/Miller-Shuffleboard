import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'motion/react';
import { STATIONS, radioEngine } from '../../lib/radio';
import { useStore } from '../../store';

// Custom hook to poll SomaFM for current song
export function useCurrentSong(stationId: string | null) {
  const [song, setSong] = useState<{ artist: string; title: string } | null>(null);

  useEffect(() => {
    if (!stationId) {
      setSong(null);
      return;
    }

    const fetchSong = async () => {
      try {
        // Only attempt to fetch metadata for somafm stations
        const station = STATIONS.find(s => s.id === stationId);
        if (!station || !station.streamUrl.includes('somafm.com')) {
          setSong(null);
          return;
        }

        const response = await fetch(`https://somafm.com/songs/${stationId}.json`);
        // If cors fails, it fails silently
        if (response.ok) {
          const data = await response.json();
          if (data && data.songs && data.songs.length > 0) {
            const current = data.songs[0];
            setSong({
              artist: current.artist,
              title: current.title
            });
          }
        }
      } catch (err) {
        // Silently ignore fetch errors (like CORS or network errors)
        setSong(null);
      }
    };

    fetchSong();
    const interval = setInterval(fetchSong, 20000); // 20s
    return () => clearInterval(interval);
  }, [stationId]);

  return song;
}

function DotMatrixEQ({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Resize canvas to match display size exactly
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    let animationFrameId: number;
    const cw = canvas.width;
    const ch = canvas.height;
    
    // Dynamically adjust bars based on width to fill the screen
    const bars = Math.floor(cw / 8); 
    const dotsPerBar = 12;
    const barWidth = cw / bars;

    const draw = () => {
      ctx.clearRect(0, 0, cw, ch);
      const freqData = radioEngine.getFrequencyData();

      for (let i = 0; i < bars; i++) {
        // Map available 32 bins across our visual bars
        const dataIdx = Math.floor((i / bars) * 32);
        const value = active && freqData.length > 0 ? freqData[dataIdx] : Math.random() * 20; 
        
        // Normalize value (0 to 255) to number of dots
        const activeDots = active ? Math.floor((value / 255) * dotsPerBar) : 1;

        // Draw dots from bottom up
        for (let j = 0; j < dotsPerBar; j++) {
          const dotY = ch - (j + 1) * (ch / dotsPerBar);
          const dotX = i * barWidth + barWidth * 0.1;
          const dotW = barWidth * 0.8;
          const dotH = (ch / dotsPerBar) * 0.8;

          ctx.beginPath();
          ctx.rect(dotX, dotY, dotW, dotH);

          // Color scale: mostly cyan/teal, top few white/gold
          let color = 'rgba(45, 212, 191, 0.15)'; // Faded Teal
          let glow = 'none';

          if (j < activeDots) {
            if (j >= dotsPerBar - 3) {
              color = 'rgba(253, 224, 71, 0.6)'; // Gold
              glow = '#fde047';
            } else if (j >= dotsPerBar - 6) {
              color = 'rgba(204, 251, 241, 0.4)'; // Light Cyan
              glow = '#ccfbf1';
            } else {
              color = 'rgba(45, 212, 191, 0.4)'; // Teal
              glow = '#2dd4bf';
            }
          }

          if (glow !== 'none') {
            ctx.shadowBlur = 6;
            ctx.shadowColor = glow;
          } else {
            ctx.shadowBlur = 0;
          }

          ctx.fillStyle = color;
          ctx.fill();
        }
      }
      
      animationFrameId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animationFrameId);
  }, [active]);

  return <canvas ref={canvasRef} className="w-full h-full absolute inset-0 z-0 opacity-40 mix-blend-screen pointer-events-none" />;
}

export function RadioDisplay() {
  const { gameState, radioStationIdx, setRadioStationIdx, bgMusicVolume } = useStore();
  const [lastActivity, setLastActivity] = useState(Date.now());
  const stationId = (radioStationIdx !== null && STATIONS[radioStationIdx]) ? STATIONS[radioStationIdx].id : null;
  const song = useCurrentSong(stationId);

  // Sync volume
  useEffect(() => {
    radioEngine.setVolume(bgMusicVolume);
  }, [bgMusicVolume]);

  // Handle play/stop based on gameState and selected station
  useEffect(() => {
    if (gameState === 'playing' && radioStationIdx !== null && STATIONS[radioStationIdx]) {
      radioEngine.playStation(radioStationIdx);
    } else {
      radioEngine.stop();
    }
    
    return () => {
      radioEngine.stop();
    };
  }, [gameState, radioStationIdx]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (useStore.getState().gameState !== 'playing') return;
      
      // Numbers 0-9
      const num = parseInt(e.key);
      if (!isNaN(num) && num >= 0 && num <= 9) {
        setLastActivity(Date.now());
        if (num === 0) {
          // Turn off radio
          setRadioStationIdx(null);
        } else {
          // 1-9 to station indices 0-8
          const targetIdx = num - 1;
          if (targetIdx < STATIONS.length) {
            setRadioStationIdx(targetIdx);
          }
        }
      } else if (e.key.toLowerCase() === 'm') {
        // Toggle mute
        setLastActivity(Date.now());
        setRadioStationIdx(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setRadioStationIdx]);

  useEffect(() => {
    setLastActivity(Date.now());
  }, [song, radioStationIdx]);

  const [opacity, setOpacity] = useState(1);
  useEffect(() => {
    const checkActivity = () => {
      if (Date.now() - lastActivity > 4000) {
        setOpacity(0.4);
      } else {
        setOpacity(1);
      }
    };
    const interval = setInterval(checkActivity, 500);
    return () => clearInterval(interval);
  }, [lastActivity]);

  if (gameState !== 'playing') return null;

  return (
    <div 
      className="fixed top-0 left-1/2 -translate-x-1/2 z-[100] transition-opacity duration-1000 ease-in-out pointer-events-none"
      style={{ opacity }}
    >
      <div className="bg-[#002244] border-x-[4px] border-b-[4px] border-[#c29f6d]/80 px-6 py-3 rounded-b-xl shadow-2xl relative overflow-hidden flex gap-4 items-center before:content-[''] before:absolute before:inset-0 before:bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] before:opacity-10 before:mix-blend-overlay">
        
        {/* Main Display Screen (EQ + Marquee together) */}
        <div className="w-[340px] h-16 bg-[#020617] rounded-md border-2 border-[#1e293b] shadow-[inset_0_2px_10px_rgba(0,0,0,0.8)] relative overflow-hidden flex flex-col justify-center px-4">
           {/* EQ is behind the text */}
           <DotMatrixEQ active={radioStationIdx !== null} />
           
           <div className="relative z-10">
             {radioStationIdx !== null ? (
               <>
                  <div className="text-[#c29f6d] text-[10px] font-sans font-bold tracking-[0.2em] uppercase opacity-90 mb-1 drop-shadow-sm flex justify-between">
                     <span>{STATIONS[radioStationIdx].name}</span>
                     <span className="text-[#2dd4bf] opacity-70">VOL: {Math.round(bgMusicVolume * 100)}%</span>
                  </div>
                  <div className="relative w-full overflow-hidden text-[#2dd4bf]" style={{ fontFamily: '"VT323", monospace', fontSize: '20px', textShadow: '0 0 8px rgba(45, 212, 191, 0.8)' }}>
                     <motion.div
                        className="whitespace-nowrap inline-block"
                        animate={{ x: [0, -400] }}
                        transition={{ ease: "linear", duration: Math.max(10, ((song?.artist.length || 0) + (song?.title.length || 0)) * 0.3), repeat: Infinity }}
                     >
                       {song ? `${song.artist} - ${song.title}` : 'CRUISING...'} 
                       <span className="opacity-0 px-8">---</span>
                       {song ? `${song.artist} - ${song.title}` : 'CRUISING...'}
                     </motion.div>
                  </div>
               </>
             ) : (
               <div className="text-white/60 font-sans tracking-widest text-[12px] whitespace-nowrap uppercase font-medium text-center w-full mt-2">
                  Ship Radio Offline [1-0 to Tune]
               </div>
             )}
           </div>
        </div>
      </div>
    </div>
  );
}
