import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface GameStore {
  currentGameCode: string | null;
  isLeader: boolean;
  playerName: string | null;
  setCurrentGame: (code: string, isLeader: boolean) => void;
  setPlayerName: (name: string) => void;
  clearGame: () => void;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
      currentGameCode: null,
      isLeader: false,
      playerName: null,
      setCurrentGame: (code, isLeader) => set({ currentGameCode: code, isLeader }),
      setPlayerName: (name) => set({ playerName: name }),
      clearGame: () => set({ currentGameCode: null, isLeader: false, playerName: null }),
    }),
    {
      name: 'game-storage',
    }
  )
);