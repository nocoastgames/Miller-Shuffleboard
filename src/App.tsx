import { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Scene } from './components/game/Scene';
import { MainMenu } from './components/ui/MainMenu';
import { TournamentSetup } from './components/ui/TournamentSetup';
import { GameplayOverlay } from './components/ui/GameplayOverlay';
import { Results } from './components/ui/Results';
import { PauseMenu } from './components/ui/PauseMenu';
import { RadioDisplay } from './components/ui/RadioDisplay';
import { useStore } from './store';

export default function App() {
  const gameState = useStore((state) => state.gameState);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only allow pausing if we are actually in the playing state
      if (e.key === 'Escape' && gameState === 'playing') {
        setIsPaused(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  // If game state changes away from playing, ensure we're unpaused
  useEffect(() => {
    if (gameState !== 'playing') {
      setIsPaused(false);
    }
  }, [gameState]);

  return (
    <div className="w-full h-screen bg-slate-950 overflow-hidden relative font-sans select-none">
      {/* 3D Scene - Always rendered, but camera/logic changes based on state */}
      <Canvas shadows>
        <Scene />
      </Canvas>

      <RadioDisplay />

      {/* UI Overlays */}
      {gameState === 'menu' && <MainMenu />}
      {gameState === 'setup' && <TournamentSetup />}
      {gameState === 'playing' && <GameplayOverlay />}
      {gameState === 'results' && <Results />}
      
      {isPaused && <PauseMenu onClose={() => setIsPaused(false)} />}
    </div>
  );
}
