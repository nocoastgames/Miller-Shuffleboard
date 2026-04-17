import { useSphere } from '@react-three/cannon';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { Vector3, Mesh } from 'three';
import { useStore } from '../../store';
import { audioEngine } from '../../lib/audio';
import { useFrame } from '@react-three/fiber';

export interface PuckRef {
  slide: (angle: number, power: number) => void;
  resetToStart: () => void;
  hide: () => void;
  getPosition: () => [number, number, number];
  getVelocity: () => [number, number, number];
}

const START_Z = 12;

export const Puck = forwardRef<PuckRef, { index: number, color: string }>(({ index, color }, fwdRef) => {
  // We use a Sphere for collision body because Cannon.js has known flaws with flat cylinders tunneling
  // A sphere bouncing flat on the floor ensures perfect edge-to-edge impacts!
  const [ref, api] = useSphere(() => ({
    mass: 1.5,
    position: [20 + index * 2, 0.3, 0], 
    args: [0.28], // Size reduced by 20%
    material: { friction: 0.04, restitution: 0.8 }, // Adding a little more friction for better sliding feel
    linearDamping: 0.1, // Increased damping so it eventually grinds to a halt naturally
    angularDamping: 0.3,
    angularFactor: [0, 1, 0], // Enforce strictly flat sliding, no pitching or rolling over edges
    allowSleep: false, // Prevent pucks from falling asleep and becoming uncollidable
    onCollide: (e) => {
      if (Math.abs(e.contact.impactVelocity) > 1.0) {
         try { audioEngine.playBump(Math.abs(e.contact.impactVelocity)); } catch(e) {}
      }
    }
  }));

  const posRef = useRef([20 + index * 2, 0.4, 0]);
  const velRef = useRef([0, 0, 0]);

  useEffect(() => {
    const unsubPos = api.position.subscribe(v => (posRef.current = v));
    const unsubVel = api.velocity.subscribe(v => (velRef.current = v));
    return () => {
      unsubPos();
      unsubVel();
    };
  }, [api]);

  useFrame(() => {
    const state = useStore.getState();
    const isActive = index === state.currentPuckIndex;
    
    // Lock the active puck at the start line while aiming or choosing power
    if (isActive && (state.playState === 'aiming' || state.playState === 'power')) {
      api.position.set(0, 0.3, START_Z);
      api.velocity.set(0, 0, 0);
      api.angularVelocity.set(0, 0, 0);
    }
  });

  useImperativeHandle(fwdRef, () => ({
    slide: (angle: number, power: number) => {
      const forceMulti = 21.5; // Increased just slightly from 20 to adjust for new smaller size feeling
      const force = power * forceMulti;
      
      const dir = new Vector3(Math.sin(-angle), 0, -Math.cos(angle)).normalize();
      
      api.velocity.set(dir.x * force, 0, dir.z * force);
      
      try {
        audioEngine.startRoll();
      } catch (e) {}
    },
    resetToStart: () => {
      api.position.set(0, 0.3, START_Z);
      api.velocity.set(0, 0, 0);
      api.angularVelocity.set(0, 0, 0);
    },
    hide: () => {
      api.position.set(20 + index * 2, 0.3, 0);
      api.velocity.set(0, 0, 0);
      api.angularVelocity.set(0, 0, 0);
    },
    getPosition: () => posRef.current as [number, number, number],
    getVelocity: () => velRef.current as [number, number, number],
  }));

  return (
    <group ref={ref as any} castShadow receiveShadow>
      {/* Offset the visual cylinder so its bottom rests exactly on the floor (Sphere center 0.28, Visual center 0.05 => Offset -0.23) */}
      <mesh position={[0, -0.23, 0]}>
        <cylinderGeometry args={[0.28, 0.28, 0.1, 32]} />
        <meshStandardMaterial color={color} roughness={0.2} metalness={0.1} />
      </mesh>
    </group>
  );
});
