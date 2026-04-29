import { create } from 'zustand';

export type GameState = 'menu' | 'setup' | 'playing' | 'results';
export type PlayState = 'idle' | 'positioning' | 'aiming' | 'power' | 'rolling' | 'scoring';
export type GameMode = 'single' | 'class';

export interface Player {
  id: string;
  name: string;
}

export interface Frame {
  score: number | null;
}

const createEmptyFrames = (length: number): Frame[] => 
  Array.from({ length }, () => ({ score: null }));

export function calculateTotalScore(frames: Frame[], totalFrames: number = 10) {
  let score = 0;
  for (let i = 0; i < totalFrames; i++) {
    const f = frames[i];
    if (f && f.score !== null) {
      score += f.score;
    }
  }
  return score;
}

export interface GameEffect {
  id: string;
  type: 'spark' | 'splash' | 'confetti';
  position: [number, number, number];
}

interface ShuffleboardStore {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  gameMode: GameMode;
  setGameMode: (mode: GameMode) => void;

  totalRounds: number;
  setTotalRounds: (rounds: number) => void;

  players: Player[];
  addPlayer: (name: string) => void;
  removePlayer: (id: string) => void;
  
  currentPlayerIndex: number;
  currentPuckIndex: number;
  playerFrames: Record<string, Frame[]>;
  currentFrame: number;
  
  teacherAdvancePending: boolean;
  setTeacherAdvancePending: (pending: boolean) => void;
  nextPuck: () => void;
  endRound: (scores: Record<string, number>) => void;
  nextTurnAfterTeacher: () => void;

  sweepSpeed: number;
  setSweepSpeed: (speed: number) => void;
  
  masterVolume: number;
  setMasterVolume: (volume: number) => void;
  bgMusicVolume: number;
  setBgMusicVolume: (volume: number) => void;
  radioStationIdx: number | null;
  setRadioStationIdx: (idx: number | null) => void;

  bumpersEnabled: boolean;
  setBumpersEnabled: (enabled: boolean) => void;

  playState: PlayState;
  setPlayState: (state: PlayState) => void;
  
  aimAngle: number;
  setAimAngle: (angle: number) => void;
  powerLevel: number;
  setPowerLevel: (power: number) => void;
  scoreThisThrow: number;
  setScoreThisThrow: (score: number) => void;

  computerDifficulty: 1 | 2 | 3;
  setComputerDifficulty: (level: 1 | 2 | 3) => void;

  effects: GameEffect[];
  addEffect: (type: 'spark' | 'splash' | 'confetti', position: [number, number, number]) => void;
  removeEffect: (id: string) => void;

  startGame: (singlePlayerName?: string) => void;
  advanceThrow: (scoreThisThrow: number) => void;
  undoLastPuck: () => void;
  resetGame: () => void;
}

export const useStore = create<ShuffleboardStore>((set, get) => ({
  gameState: 'menu',
  setGameState: (state) => set({ gameState: state }),
  gameMode: 'class',
  setGameMode: (mode) => set({ gameMode: mode }),

  totalRounds: 4, // 4 throws per player is common
  setTotalRounds: (rounds) => set({ totalRounds: rounds }),

  players: [],
  addPlayer: (name) => set((state) => ({
    players: [...state.players, { id: Math.random().toString(36).substring(7), name }]
  })),
  removePlayer: (id) => set((state) => ({
    players: state.players.filter(p => p.id !== id)
  })),

  currentPlayerIndex: 0,
  currentPuckIndex: 0,
  playerFrames: {},
  currentFrame: 0,
  
  teacherAdvancePending: false,
  setTeacherAdvancePending: (pending) => set({ teacherAdvancePending: pending }),

  sweepSpeed: 1.0,
  setSweepSpeed: (speed) => set({ sweepSpeed: speed }),
  
  advanceThrow: (scoreThisThrow: number) => set({ scoreThisThrow }),
  
  masterVolume: 0.5,
  setMasterVolume: (volume) => set({ masterVolume: volume }),
  bgMusicVolume: 0.5,
  setBgMusicVolume: (volume) => set({ bgMusicVolume: volume }),
  radioStationIdx: Math.floor(Math.random() * 10), // Random station 0-9
  setRadioStationIdx: (idx) => set({ radioStationIdx: idx }),

  bumpersEnabled: false,
  setBumpersEnabled: (enabled) => set({ bumpersEnabled: enabled }),

  playState: 'idle',
  setPlayState: (state) => set({ playState: state }),
  aimAngle: 0,
  setAimAngle: (angle) => set({ aimAngle: angle }),
  powerLevel: 0,
  setPowerLevel: (power) => set({ powerLevel: power }),
  scoreThisThrow: 0,
  setScoreThisThrow: (score) => set({ scoreThisThrow: score }),
  
  computerDifficulty: 2,
  setComputerDifficulty: (level) => set({ computerDifficulty: level }),

  effects: [],
  addEffect: (type, position) => set((state) => ({ 
    effects: [...state.effects, { id: Math.random().toString(36).substring(2), type, position }] 
  })),
  removeEffect: (id) => set((state) => ({
    effects: state.effects.filter(e => e.id !== id)
  })),

  startGame: (singlePlayerName) => {
    const state = get();
    let players = state.players;
    
    if (state.gameMode === 'single') {
      const name = singlePlayerName || 'Player 1';
      players = [
        { id: 'p1', name },
        { id: 'computer', name: 'Computer' }
      ];
    }
    
    const playerFrames: Record<string, Frame[]> = {};
    players.forEach(p => {
      playerFrames[p.id] = createEmptyFrames(state.totalRounds);
    });

    set({
      players,
      playerFrames,
      currentPlayerIndex: 0,
      currentPuckIndex: 0,
      currentFrame: 0,
      gameState: 'playing',
      playState: 'aiming',
      teacherAdvancePending: false,
      scoreThisThrow: 0
    });
  },

  nextPuck: () => set((state) => ({ 
    currentPuckIndex: state.currentPuckIndex + 1, 
    playState: 'aiming', 
    aimAngle: 0, 
    powerLevel: 0 
  })),

  endRound: (roundScores) => {
    const state = get();
    const newFrames = { ...state.playerFrames };

    Object.keys(roundScores).forEach(playerId => {
      if (newFrames[playerId]) {
        const frames = [...newFrames[playerId]];
        frames[state.currentFrame] = { score: roundScores[playerId] };
        newFrames[playerId] = frames;
      }
    });

    if (state.gameMode === 'class' && !roundScores[state.players[state.currentPlayerIndex].id]) {
       const frames = [...newFrames[state.players[state.currentPlayerIndex].id]];
       frames[state.currentFrame] = { score: 0 };
       newFrames[state.players[state.currentPlayerIndex].id] = frames;
    } else if (state.gameMode === 'single') {
       state.players.forEach(p => {
         if (roundScores[p.id] === undefined) {
           const frames = [...newFrames[p.id]];
           frames[state.currentFrame] = { score: 0 };
           newFrames[p.id] = frames;
         }
       });
    }

    set({ playerFrames: newFrames, playState: 'idle', teacherAdvancePending: true });
  },

  nextTurnAfterTeacher: () => {
     const state = get();
     const nextFrameContext = state.currentFrame + 1;

     if (state.gameMode === 'class') {
         if (nextFrameContext >= state.totalRounds) {
             const nextIdx = state.currentPlayerIndex + 1;
             if (nextIdx < state.players.length) {
                set({ currentPlayerIndex: nextIdx, currentFrame: 0, currentPuckIndex: 0, teacherAdvancePending: false, playState: 'aiming', aimAngle: 0, powerLevel: 0 });
             } else {
                set({ gameState: 'results', teacherAdvancePending: false });
             }
         } else {
             set({ currentFrame: nextFrameContext, currentPuckIndex: 0, teacherAdvancePending: false, playState: 'aiming', aimAngle: 0, powerLevel: 0 });
         }
     } else {
         if (nextFrameContext >= state.totalRounds) {
             set({ gameState: 'results', teacherAdvancePending: false });
         } else {
             set({ currentFrame: nextFrameContext, currentPuckIndex: 0, teacherAdvancePending: false, playState: 'aiming', aimAngle: 0, powerLevel: 0 });
         }
     }
  },

  undoLastPuck: () => {
    const state = get();
    // Only allow undo if we've thrown at least one puck in the current frame and we're not currently rolling
    if (state.currentPuckIndex > 0 && (state.playState === 'idle' || state.playState === 'aiming' || state.playState === 'scoring' || state.playState === 'power')) {
      const prevIndex = state.currentPuckIndex - 1;
      set({ 
        currentPuckIndex: prevIndex,
        playState: 'aiming',
        aimAngle: 0,
        powerLevel: 0,
        scoreThisThrow: 0,
        teacherAdvancePending: false // Cancel any end round sequences 
      });
    }
  },

  resetGame: () => set({
    gameState: 'menu',
    players: [],
    playerFrames: {},
    currentPlayerIndex: 0,
    currentFrame: 0,
    teacherAdvancePending: false
  })
}));

