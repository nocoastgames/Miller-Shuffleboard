import { useBox } from '@react-three/cannon';
import { Text } from '@react-three/drei';
import { useStore } from '../../store';

export const BOARD_LENGTH = 30;
export const BOARD_WIDTH = 3;
export const GUTTER_WIDTH = 1.0; 

function GutterBumpers({ outerLength }: { outerLength: number }) {
  const leftX = -(BOARD_WIDTH / 2) - (GUTTER_WIDTH / 2);
  const rightX = (BOARD_WIDTH / 2) + (GUTTER_WIDTH / 2);
  const yOffset = 0.1;
  const width = GUTTER_WIDTH - 0.1;

  useBox(() => ({
    type: 'Static',
    args: [width, 0.4, outerLength],
    position: [leftX, yOffset, 0],
    material: { friction: 0.1, restitution: 0.6 } // Bouncy
  }));

  useBox(() => ({
    type: 'Static',
    args: [width, 0.4, outerLength],
    position: [rightX, yOffset, 0],
    material: { friction: 0.1, restitution: 0.6 }
  }));

  return (
    <group>
      <mesh position={[leftX, yOffset, 0]} receiveShadow castShadow={false}>
        <boxGeometry args={[width, 0.4, outerLength]} />
        <meshStandardMaterial color="#cc2222" roughness={0.6} />
      </mesh>
      <mesh position={[rightX, yOffset, 0]} receiveShadow castShadow={false}>
        <boxGeometry args={[width, 0.4, outerLength]} />
        <meshStandardMaterial color="#cc2222" roughness={0.6} />
      </mesh>
    </group>
  );
}

export function getScorePoint(pos: [number, number, number]): number {
  const [x, y, z] = pos;
  
  // If the puck fell into the gutter (lower elevation)
  if (y < 0.2) {
     return 0; // The gutter no longer penalizes points!
  }

  // Otherwise, it's on the main board top
  if (Math.abs(x) > BOARD_WIDTH / 2) return 0;
  if (z > 2 || z < -15) return 0;
  if (z <= -9 && z > -13) return 10;
  if (z <= -4 && z > -9) return 8;
  if (z <= 2 && z > -4) return 7;
  
  return 0; // Safe zone or start zone
}

export function Board() {
  const bumpersEnabled = useStore(state => state.bumpersEnabled);

  // Main Board Deck
  const [ref] = useBox(() => ({
    type: 'Static',
    args: [BOARD_WIDTH, 0.1, BOARD_LENGTH],
    position: [0, -0.05, 0],
    material: { friction: 0.1, restitution: 0.1 }
  }));

  const gutterFloorY = -0.3;
  const outerWidth = BOARD_WIDTH + 2 * GUTTER_WIDTH;
  const outerLength = BOARD_LENGTH + 2 * GUTTER_WIDTH;

  // Gutter Floor (The Red Zone)
  useBox(() => ({
    type: 'Static',
    args: [outerWidth, 0.1, outerLength],
    position: [0, gutterFloorY - 0.05, 0],
    material: { friction: 0.5, restitution: 0.1 } // High friction so it stops in the gutter
  }));

  // Outer Walls (White rails)
  useBox(() => ({ type: 'Static', args: [0.2, 0.6, outerLength], position: [-outerWidth/2 - 0.1, 0.1, 0], material: { friction: 0.1, restitution: 0.5 } })); // Left
  useBox(() => ({ type: 'Static', args: [0.2, 0.6, outerLength], position: [outerWidth/2 + 0.1, 0.1, 0], material: { friction: 0.1, restitution: 0.5 } })); // Right
  useBox(() => ({ type: 'Static', args: [outerWidth, 0.6, 0.2], position: [0, 0.1, -outerLength/2 - 0.1], material: { friction: 0.1, restitution: 0.5 } })); // Back
  useBox(() => ({ type: 'Static', args: [outerWidth, 0.6, 0.2], position: [0, 0.1, outerLength/2 + 0.1], material: { friction: 0.1, restitution: 0.5 } })); // Front

  // Puck waiting shelf physics
  useBox(() => ({ type: 'Static', args: [20, 0.1, 10], position: [25, -0.1, 0], material: { friction: 1, restitution: 0 } }));

  // Script text styling props
  const textProps = {
    fontStyle: "italic",
    fontSize: 2,
    color: "white",
    anchorX: "center" as const,
    anchorY: "middle" as const,
    opacity: 0.8,
  };

  return (
    <group>
      {/* Wood deck style floor */}
      <mesh ref={ref as any} receiveShadow>
        <boxGeometry args={[BOARD_WIDTH, 0.1, BOARD_LENGTH]} />
        {/* Teak wood color */}
        <meshStandardMaterial color="#c29f6d" roughness={0.6} />
      </mesh>

      {/* Gutter Floor */}
      <mesh position={[0, gutterFloorY, 0]} receiveShadow>
        <boxGeometry args={[outerWidth, 0.1, outerLength]} />
        <meshStandardMaterial color="#cc2222" roughness={0.8} metalness={0.1} />
      </mesh>

      {/* Puck Waiting Shelf (hidden far away) */}
      <mesh position={[25, -0.1, 0]}>
        <boxGeometry args={[20, 0.1, 10]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Scoring zones visual (Top Deck Only) */}
      <group position={[0, +0.001, 0]}>
        {/* 7 Zone */}
        <mesh position={[0, 0, -1]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[BOARD_WIDTH, 6]} />
          <meshStandardMaterial color="#aa22aa" opacity={0.6} transparent />
        </mesh>
        <Text position={[0, 0.01, -1]} rotation={[-Math.PI / 2, 0, 0]} {...textProps}>
          7
        </Text>

        {/* 8 Zone */}
        <mesh position={[0, 0, -6.5]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[BOARD_WIDTH, 5]} />
          <meshStandardMaterial color="#2222aa" opacity={0.6} transparent />
        </mesh>
        <Text position={[0, 0.01, -6.5]} rotation={[-Math.PI / 2, 0, 0]} {...textProps}>
          8
        </Text>

        {/* 10 Zone */}
        <mesh position={[0, 0, -11]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[BOARD_WIDTH, 4]} />
          <meshStandardMaterial color="#22aa22" opacity={0.6} transparent />
        </mesh>
        <Text position={[0, 0.01, -11]} rotation={[-Math.PI / 2, 0, 0]} {...textProps}>
          10
        </Text>
      </group>

      {/* Side Rails Visual */}
      {bumpersEnabled && <GutterBumpers outerLength={outerLength} />}

      <mesh position={[-outerWidth/2 - 0.1, 0.1, 0]} receiveShadow castShadow={false}>
        <boxGeometry args={[0.2, 0.6, outerLength]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[outerWidth/2 + 0.1, 0.1, 0]} receiveShadow castShadow={false}>
        <boxGeometry args={[0.2, 0.6, outerLength]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0, 0.1, -outerLength/2 - 0.1]} receiveShadow castShadow={false}>
        <boxGeometry args={[outerWidth + 0.4, 0.6, 0.2]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0, 0.1, outerLength/2 + 0.1]} receiveShadow castShadow={false}>
        <boxGeometry args={[outerWidth + 0.4, 0.6, 0.2]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}
