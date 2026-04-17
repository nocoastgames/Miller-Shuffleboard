import { useFrame } from '@react-three/fiber';
import { useRef, useMemo, useEffect } from 'react';
import { Vector3, Color, InstancedMesh, Matrix4, Euler } from 'three';
import { useStore, GameEffect } from '../../store';

const PARTICLE_COUNT = 30;
const DUMMY = new Matrix4();
const VEC = new Vector3();

function SparkEffect({ position, onComplete }: { position: [number, number, number], onComplete: () => void }) {
  const meshRef = useRef<InstancedMesh>(null);
  
  const particles = useMemo(() => {
    return Array.from({ length: PARTICLE_COUNT }).map(() => ({
      position: new Vector3(position[0], position[1] + 0.2, position[2]),
      velocity: new Vector3((Math.random() - 0.5) * 5, Math.random() * 5 + 2, (Math.random() - 0.5) * 5),
      color: new Color(Math.random() > 0.5 ? '#ffcc00' : '#ff5500'),
      scale: Math.random() * 0.1 + 0.05
    }));
  }, [position]);

  const age = useRef(0);

  useEffect(() => {
    if (meshRef.current) {
        particles.forEach((p, i) => {
           meshRef.current!.setColorAt(i, p.color);
        });
        meshRef.current.instanceColor!.needsUpdate = true;
    }
  }, [particles]);

  useFrame((_, delta) => {
    age.current += delta;
    if (age.current > 0.6) {
      onComplete();
      return;
    }

    if (meshRef.current) {
       for (let i = 0; i < PARTICLE_COUNT; i++) {
         const p = particles[i];
         // Gravity & Drag
         p.velocity.y -= 15 * delta;
         p.position.addScaledVector(p.velocity, delta);
         p.scale *= 0.9; // Shrink
         
         DUMMY.makeTranslation(p.position.x, p.position.y, p.position.z);
         DUMMY.scale(new Vector3(p.scale, p.scale, p.scale));
         meshRef.current.setMatrixAt(i, DUMMY);
       }
       meshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, PARTICLE_COUNT]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  );
}

function SplashEffect({ position, onComplete }: { position: [number, number, number], onComplete: () => void }) {
  const meshRef = useRef<InstancedMesh>(null);
  
  const particles = useMemo(() => {
    return Array.from({ length: 40 }).map(() => ({
      position: new Vector3(position[0], position[1] + 0.1, position[2]),
      velocity: new Vector3((Math.random() - 0.5) * 2, Math.random() * 8 + 4, (Math.random() - 0.5) * 2),
      scale: Math.random() * 0.15 + 0.05
    }));
  }, [position]);

  const age = useRef(0);
  const color = new Color('#ffffff');

  useEffect(() => {
    if (meshRef.current) {
        particles.forEach((_, i) => {
           meshRef.current!.setColorAt(i, color);
        });
        meshRef.current.instanceColor!.needsUpdate = true;
    }
  }, [particles]);

  useFrame((_, delta) => {
    age.current += delta;
    if (age.current > 1.0) {
      onComplete();
      return;
    }

    if (meshRef.current) {
       for (let i = 0; i < 40; i++) {
         const p = particles[i];
         p.velocity.y -= 15 * delta;
         p.position.addScaledVector(p.velocity, delta);
         
         DUMMY.makeTranslation(p.position.x, p.position.y, p.position.z);
         DUMMY.scale(new Vector3(p.scale, p.scale, p.scale));
         meshRef.current.setMatrixAt(i, DUMMY);
       }
       meshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, 40]}>
      <sphereGeometry args={[1, 4, 4]} />
      <meshPhysicalMaterial roughness={0} transmission={1} thickness={0.5} opacity={0.8} transparent />
    </instancedMesh>
  );
}

function ConfettiEffect({ position, onComplete }: { position: [number, number, number], onComplete: () => void }) {
  const meshRef = useRef<InstancedMesh>(null);
  
  // Confetti bursts high up and falls slowly
  const particles = useMemo(() => {
    return Array.from({ length: 100 }).map(() => ({
      position: new Vector3(position[0], position[1] + 5, position[2]),
      velocity: new Vector3((Math.random() - 0.5) * 10, Math.random() * 10, (Math.random() - 0.5) * 10),
      color: new Color(['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'][Math.floor(Math.random() * 5)]),
      scale: Math.random() * 0.2 + 0.1,
      rotation: new Vector3(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI),
      spin: new Vector3(Math.random() * 5, Math.random() * 5, Math.random() * 5)
    }));
  }, [position]);

  const age = useRef(0);

  useEffect(() => {
    if (meshRef.current) {
        particles.forEach((p, i) => {
           meshRef.current!.setColorAt(i, p.color);
        });
        meshRef.current.instanceColor!.needsUpdate = true;
    }
  }, [particles]);

  useFrame((_, delta) => {
    age.current += delta;
    if (age.current > 4.0) { // Confetti lasts longer
      onComplete();
      return;
    }

    if (meshRef.current) {
       for (let i = 0; i < 100; i++) {
         const p = particles[i];
         // Float down slowly
         p.velocity.y -= 2 * delta; 
         // Air resistance
         p.velocity.x *= 0.95;
         p.velocity.z *= 0.95;
         p.velocity.y = Math.max(p.velocity.y, -2); // Terminal velocity
         
         p.position.addScaledVector(p.velocity, delta);
         p.rotation.addScaledVector(p.spin, delta);
         
         DUMMY.makeRotationFromEuler(new Euler(p.rotation.x, p.rotation.y, p.rotation.z));
         DUMMY.setPosition(p.position.x, p.position.y, p.position.z);
         DUMMY.scale(new Vector3(p.scale, p.scale, p.scale));
         meshRef.current.setMatrixAt(i, DUMMY);
       }
       meshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, 100]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial side={2} /> {/* DoubleSide = 2 in THREE */}
    </instancedMesh>
  );
}

export function EffectsSystem() {
  const effects = useStore(s => s.effects);
  const removeEffect = useStore(s => s.removeEffect);

  return (
    <group>
      {effects.map(effect => {
        if (effect.type === 'spark') {
          return <SparkEffect key={effect.id} position={effect.position} onComplete={() => removeEffect(effect.id)} />;
        }
        if (effect.type === 'splash') {
          return <SplashEffect key={effect.id} position={effect.position} onComplete={() => removeEffect(effect.id)} />;
        }
        if (effect.type === 'confetti') {
          return <ConfettiEffect key={effect.id} position={effect.position} onComplete={() => removeEffect(effect.id)} />;
        }
        return null;
      })}
    </group>
  );
}
