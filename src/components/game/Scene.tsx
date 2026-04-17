import { Physics } from '@react-three/cannon';
import { PerspectiveCamera, Sky, Billboard } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useRef, useMemo } from 'react';
import { Vector3, Group, CanvasTexture } from 'three';
import { useStore } from '../../store';
import { Puck, PuckRef } from './Puck';
import { Board, BOARD_LENGTH, BOARD_WIDTH, getScorePoint } from './Board';
import { audioEngine } from '../../lib/audio';

function SpriteIsland({ position, scale = 1 }: { position: [number, number, number], scale?: number }) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.font = '200px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      // Draw a subtle shadow
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillText('🏝️', 128 + 5, 128 + 15);
      ctx.fillText('🏝️', 128, 128);
    }
    return new CanvasTexture(canvas);
  }, []);

  return (
    <Billboard follow={true} position={position}>
      <mesh>
        <planeGeometry args={[scale * 6, scale * 6]} />
        <meshBasicMaterial map={texture} transparent alphaTest={0.1} />
      </mesh>
    </Billboard>
  );
}

function AimGuide() {
  const groupRef = useRef<Group>(null);
  const pivotRef = useRef<Group>(null);

  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.font = '150px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillText('⚓', 128, 128 + 10);
      // Actual emoji
      ctx.fillText('⚓', 128, 128);
    }
    return new CanvasTexture(canvas);
  }, []);

  useFrame(() => {
    const state = useStore.getState();
    if (groupRef.current) {
      groupRef.current.position.x = 0; // puck start x
      groupRef.current.visible = state.playState === 'aiming' || state.playState === 'power';
    }
    if (pivotRef.current) {
      pivotRef.current.rotation.y = state.aimAngle;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0.05, 12]}>
      <group ref={pivotRef}>
         <mesh position={[0, 0, -3.5]} rotation={[-Math.PI / 2, 0, Math.PI]}>
           <planeGeometry args={[4, 4]} />
           <meshBasicMaterial map={texture} transparent alphaTest={0.1} />
         </mesh>
      </group>
    </group>
  );
}

function GameController({ pucksRefs }: { pucksRefs: React.MutableRefObject<(PuckRef | null)[]> }) {
  const { playState, setPlayState, aimAngle, powerLevel, currentPuckIndex, gameMode, players, currentPlayerIndex } = useStore();
  const cameraRef = useRef<any>(null);
  const rollTimer = useRef<number>(0);

  const pucksPerRound = gameMode === 'single' ? 8 : 4;
  const activePuck = pucksRefs.current[currentPuckIndex];

  useFrame((state, delta) => {
    if (!cameraRef.current) return;

    // Camera follow logic
    if (playState === 'rolling' || playState === 'scoring') {
      if (activePuck) {
        const puckPos = activePuck.getPosition();
        // Don't follow past the penalty zone to keep the whole scoring area in view
        const targetZ = Math.max(puckPos[2] + 3, -15 + 5);
        const targetY = 2;
        
        // Smoothly lerp the camera position
        cameraRef.current.position.lerp(new Vector3(0, targetY, targetZ), 0.08);
        
        // Always look rigidly ahead of the camera's CURRENT position to prevent view judder/jiggle
        cameraRef.current.lookAt(0, 0, cameraRef.current.position.z - 5);
      }

      // Check if rolling is done (all pucks stopped)
      if (playState === 'rolling') {
        rollTimer.current += delta;
        let allStopped = true;
        for (let i = 0; i <= currentPuckIndex; i++) {
            const p = pucksRefs.current[i];
            const vel = p?.getVelocity();
            const pos = p?.getPosition();
            
            // If a puck falls off the board, hide it instantly and consider it stopped
            if (pos && pos[1] < -0.5) {
                p?.hide();
                continue;
            }

            const speed = Math.sqrt((vel?.[0] || 0) ** 2 + (vel?.[2] || 0) ** 2);
            // Must be entirely flat or slow to be considered stopped
            if (speed > 0.05) {
                allStopped = false;
            }
        }
        
        // Wait at least 1 second before checking for stop
        if (rollTimer.current > 1 && allStopped) {
           if (currentPuckIndex < pucksPerRound - 1) {
              useStore.getState().nextPuck();
           } else {
              setPlayState('scoring');
           }
           rollTimer.current = 0;
           try { audioEngine.stopRoll(); } catch (e) {}
        }
      }
    } else {
      // Reset camera
      cameraRef.current.position.lerp(new Vector3(0, 3, 16), 0.1);
      cameraRef.current.lookAt(0, 0, 0);
    }

    // Scoring logic
    if (playState === 'scoring') {
      rollTimer.current += delta;
      
      // Wait 1.5 seconds for visual feedback
      if (rollTimer.current > 1.5) {
         const scores: Record<string, number> = {};
         for (let i = 0; i < pucksPerRound; i++) {
           const p = pucksRefs.current[i];
           if (p) {
              const pos = p.getPosition();
              if (pos) {
                 const s = getScorePoint(pos);
                 if (s !== 0) {
                    let ownerId;
                    if (gameMode === 'single') ownerId = players[i % 2].id;
                    else ownerId = players[currentPlayerIndex % players.length].id;
                    scores[ownerId] = (scores[ownerId] || 0) + s;
                 }
              }
           }
         }
         useStore.getState().endRound(scores);
         rollTimer.current = 0;
      }
    }
  });

  // Handle Roll Trigger
  useEffect(() => {
    if (playState === 'rolling' && activePuck) {
      activePuck.slide(aimAngle, powerLevel);
      rollTimer.current = 0;
    }
  }, [playState, aimAngle, powerLevel, activePuck]);

  const { currentFrame } = useStore();
  
  // Reset pucks on new round
  useEffect(() => {
     pucksRefs.current.forEach(p => {
        if (p) {
           p.hide();
        }
     });
  }, [currentFrame, pucksRefs]);

  return <PerspectiveCamera ref={cameraRef} makeDefault position={[0, 3, 16]} fov={45} />;
}

export function Scene() {
  const pucksRefs = useRef<(PuckRef | null)[]>([]);
  const { gameMode } = useStore();

  const pucksPerRound = gameMode === 'single' ? 8 : 4;

  return (
    <>
      <color attach="background" args={['#87CEEB']} />
      <Sky sunPosition={[100, 20, 100]} />
      <fog attach="fog" args={['#87CEEB', 20, 100]} />
      
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 20, 5]} intensity={1.5} castShadow />
      
      {/* Decorative Ocean Plane */}
      <mesh position={[0, -2, 0]} rotation={[-Math.PI/2, 0, 0]}>
         <planeGeometry args={[500, 500]} />
         <meshStandardMaterial color="#00bfff" roughness={0.1} metalness={0.6} />
      </mesh>

      {/* Tropical Sprite Islands scattered around the ocean */}
      <SpriteIsland position={[-15, 0, -10]} scale={1.5} />
      <SpriteIsland position={[20, 0, -15]} scale={2.2} />
      <SpriteIsland position={[-25, -0.5, 8]} scale={3} />
      <SpriteIsland position={[18, 0, 12]} scale={1.8} />
      <SpriteIsland position={[-10, 0, -30]} scale={1.2} />
      <SpriteIsland position={[12, -1, -40]} scale={4} />

      <AimGuide />

      <Physics gravity={[0, -20, 0]} defaultContactMaterial={{ friction: 0.1, restitution: 0.2 }} step={1/120}>
        <GameController pucksRefs={pucksRefs} />
        <Board />
        {Array.from({ length: pucksPerRound }).map((_, i) => (
          <Puck 
            key={i} 
            index={i} 
            color={gameMode === 'single' ? (i % 2 === 0 ? '#ee2222' : '#2222ee') : '#ee2222'}
            ref={el => pucksRefs.current[i] = el}
          />
        ))}
      </Physics>
    </>
  );
}

