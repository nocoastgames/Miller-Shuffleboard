import { Physics } from '@react-three/cannon';
import { PerspectiveCamera, Sky, Billboard } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import React, { useEffect, useRef, useMemo, useState } from 'react';
import { Vector3, Group, CanvasTexture, Color, Mesh } from 'three';
import { useStore } from '../../store';
import { Puck, PuckRef } from './Puck';
import { Board, BOARD_LENGTH, BOARD_WIDTH, getScorePoint } from './Board';
import { audioEngine } from '../../lib/audio';
import { EffectsSystem } from './Effects';

function SpriteIsland({ position, scale = 1 }: { position: [number, number, number], scale?: number }) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.font = '800px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🏝️', 512, 512);
    }
    const tex = new CanvasTexture(canvas);
    tex.anisotropy = 16;
    return tex;
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

function SeagullSprite({ startZ, speed }: { startZ: number, speed: number }) {
  const groupRef = useRef<Group>(null);
  const [initX] = useState(() => -100 + Math.random() * 200);
  const [initY] = useState(() => 8 + Math.random() * 5);

  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Draw a classic "V" shaped distant seagull
      ctx.strokeStyle = '#ffffff'; // White bird
      ctx.lineWidth = 24;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      // Drop shadow so it pops against the sky
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 5;

      ctx.beginPath();
      // Left Wing
      ctx.moveTo(256, 300); // Start at body center
      ctx.quadraticCurveTo(170, 180, 80, 240); // Arcing left wing
      
      // Right Wing
      ctx.moveTo(256, 300); // Start at body center again
      ctx.quadraticCurveTo(342, 180, 432, 240); // Arcing right wing
      
      ctx.stroke();
    }
    const tex = new CanvasTexture(canvas);
    tex.anisotropy = 16;
    return tex;
  }, []);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.position.x += speed * delta;
      // Loop around
      if (groupRef.current.position.x > 100) {
        groupRef.current.position.x = -100;
        groupRef.current.position.y = 8 + Math.random() * 5;
      }
    }
  });

  return (
    <group ref={groupRef} position={[initX, initY, startZ]}>
       <Billboard follow={true}>
         <mesh>
           <planeGeometry args={[4, 4]} />
           <meshBasicMaterial map={texture} transparent alphaTest={0.1} />
         </mesh>
       </Billboard>
    </group>
  );
}

function CloudSprite({ startX, startZ, scale }: { startX: number, startZ: number, scale: number }) {
  const groupRef = useRef<Group>(null);
  const [initY] = useState(() => 15 + Math.random() * 5);
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Draw super white fluffy clouds with circles at smaller scale
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(512, 512, 150, 0, Math.PI * 2);
      ctx.arc(380, 560, 100, 0, Math.PI * 2);
      ctx.arc(640, 560, 120, 0, Math.PI * 2);
      ctx.arc(430, 450, 110, 0, Math.PI * 2);
      ctx.arc(600, 460, 90, 0, Math.PI * 2);
      ctx.fill();
    }
    const tex = new CanvasTexture(canvas);
    tex.anisotropy = 16;
    return tex;
  }, []);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.position.x += 1.0 * delta; // Slow drifting
      // Loop around
      if (groupRef.current.position.x > 100) {
        groupRef.current.position.x = -100;
      }
    }
  });

  return (
    <group ref={groupRef} position={[startX, initY, startZ]}>
       <Billboard follow={true}>
         <mesh>
           <planeGeometry args={[scale * 10, scale * 10]} />
           <meshBasicMaterial map={texture} transparent alphaTest={0.1} />
         </mesh>
       </Billboard>
    </group>
  );
}

function SunSprite() {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const gradient = ctx.createRadialGradient(512, 512, 50, 512, 512, 512);
      gradient.addColorStop(0, '#ffffcc'); // bright hot center
      gradient.addColorStop(0.3, '#ffcc00'); // yellow sun
      gradient.addColorStop(1, 'rgba(255, 200, 0, 0)'); // glowing fade to transparent
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(512, 512, 512, 0, Math.PI * 2);
      ctx.fill();
    }
    const tex = new CanvasTexture(canvas);
    tex.anisotropy = 16;
    return tex;
  }, []);

  return (
    // Put it way up high, but in the background horizon Z so it stays visible behind clouds
    <group position={[-10, 20, -60]}>
       <Billboard follow={true}>
         <mesh>
           <planeGeometry args={[80, 80]} />
           <meshBasicMaterial map={texture} transparent depthWrite={false} color="#ffe" />
         </mesh>
       </Billboard>
    </group>
  );
}

function WaveSprite({ startX, startZ, scale, speed = 0.5 }: { startX: number, startZ: number, scale: number, speed?: number }) {
  const groupRef = useRef<Group>(null);
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Draw upside-down V shapes for waves (like ^)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'; // Semi-transparent white
      ctx.lineWidth = 16;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      ctx.beginPath();
      // First wave peak
      ctx.moveTo(100, 300);
      ctx.quadraticCurveTo(178, 200, 256, 300);
      
      // Second wave peak
      ctx.moveTo(256, 300);
      ctx.quadraticCurveTo(334, 200, 412, 300);
      
      ctx.stroke();
    }
    const tex = new CanvasTexture(canvas);
    tex.anisotropy = 16;
    return tex;
  }, []);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.position.x += speed * delta;
      // Loop around
      if (groupRef.current.position.x > 100) {
        groupRef.current.position.x = -100;
      }
    }
  });

  return (
    <group ref={groupRef} position={[startX, -1.9, startZ]} rotation={[-Math.PI / 2, 0, 0]}>
       <mesh>
         <planeGeometry args={[scale * 4, scale * 4]} />
         <meshBasicMaterial map={texture} transparent alphaTest={0.05} depthWrite={false} color="#ffffff" />
       </mesh>
    </group>
  );
}

function AimGuide() {
  const groupRef = useRef<Group>(null);
  const pivotRef = useRef<Group>(null);

  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.font = '600px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⚓', 512, 512);
    }
    const tex = new CanvasTexture(canvas);
    tex.anisotropy = 16;
    return tex;
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
                    if (s === 10) {
                      useStore.getState().addEffect('confetti', pos);
                    }
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

  const { currentFrame, gameState } = useStore();
  
  // Reset pucks on new round or game restart
  useEffect(() => {
     pucksRefs.current.forEach(p => {
        if (p) {
           p.hide();
        }
     });
  }, [currentFrame, gameState, currentPlayerIndex, pucksRefs]);

  return <PerspectiveCamera ref={cameraRef} makeDefault position={[0, 3, 16]} fov={45} />;
}

export function Scene() {
  const pucksRefs = useRef<(PuckRef | null)[]>([]);
  const gameMode = useStore(state => state.gameMode);

  const pucksPerRound = gameMode === 'single' ? 8 : 4;

  const randomWaves = useMemo(() => {
    return Array.from({ length: 40 }).map((_, i) => ({
      key: `waveA-${i}`,
      startX: -80 + Math.random() * 160,
      startZ: -60 + Math.random() * 90,
      scale: 1.5 + Math.random() * 1.5,
      speed: 0.5 + Math.random() * 1.5
    }));
  }, []);

  return (
    <>
      <color attach="background" args={['#2563EB']} />
      <Sky sunPosition={[100, 20, 100]} />
      <fog attach="fog" args={['#2563EB', 20, 100]} />
      
      <SunSprite />

      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 20, 5]} intensity={1.5} castShadow />
      
      {/* Decorative Ocean Plane */}
      <mesh position={[0, -2, 0]} rotation={[-Math.PI/2, 0, 0]}>
         <planeGeometry args={[500, 500]} />
         <meshStandardMaterial color="#2563EB" roughness={0.1} metalness={0.6} />
      </mesh>

      {/* Tropical Sprite Islands scattered around the ocean */}
      <SpriteIsland position={[-15, 0, -10]} scale={1.5} />
      <SpriteIsland position={[20, 0, -15]} scale={2.2} />
      <SpriteIsland position={[-25, -0.5, 8]} scale={2.5} />
      <SpriteIsland position={[18, 0, 12]} scale={1.8} />
      <SpriteIsland position={[-10, 0, -30]} scale={1.2} />
      {/* Background island scale fixed down to 1.5 since emojis scale up huge */}
      <SpriteIsland position={[12, -1, -40]} scale={1.5} />

      {/* Flocks of Seagulls everywhere */}
      <SeagullSprite startZ={0} speed={4} />
      <SeagullSprite startZ={-10} speed={4.5} />
      <SeagullSprite startZ={-20} speed={6} />
      <SeagullSprite startZ={-30} speed={5.5} />
      <SeagullSprite startZ={-40} speed={5} />
      <SeagullSprite startZ={-50} speed={7} />
      <SeagullSprite startZ={-60} speed={4.8} />

      {/* Moving Fluffy Clouds */}
      <CloudSprite startX={-30} startZ={-10} scale={1.5} />
      <CloudSprite startX={10} startZ={-30} scale={2} />
      <CloudSprite startX={-60} startZ={-50} scale={3} />
      <CloudSprite startX={80} startZ={10} scale={1.2} />
      <CloudSprite startX={40} startZ={-20} scale={1.8} />
      <CloudSprite startX={-90} startZ={-40} scale={2.5} />
      <CloudSprite startX={120} startZ={-60} scale={4} />

      {/* Surface Waves - MASSIVE amounts */}
      {randomWaves.map((w) => (
         <WaveSprite 
           key={w.key} 
           startX={w.startX} 
           startZ={w.startZ} 
           scale={w.scale} 
           speed={w.speed} 
         />
      ))}
      <WaveSprite startX={-10} startZ={0} scale={1.5} speed={0.8} />
      <WaveSprite startX={20} startZ={-15} scale={2} speed={1.2} />
      <WaveSprite startX={-30} startZ={20} scale={1.2} speed={0.9} />
      <WaveSprite startX={40} startZ={10} scale={2.5} speed={1.5} />
      <WaveSprite startX={-40} startZ={-30} scale={1.8} speed={1.1} />
      <WaveSprite startX={15} startZ={30} scale={1.4} speed={0.7} />
      <WaveSprite startX={-50} startZ={5} scale={2} speed={1.0} />
      <WaveSprite startX={60} startZ={-25} scale={1.6} speed={1.3} />
      <WaveSprite startX={-70} startZ={-15} scale={2.2} speed={0.9} />
      <WaveSprite startX={5} startZ={-40} scale={1.7} speed={1.4} />

      <AimGuide />
      <EffectsSystem />

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

