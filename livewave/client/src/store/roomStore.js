import { create } from 'zustand';

const useRoomStore = create((set, get) => ({
  currentRoom: null,
  viewers: [],
  pkSession: null,
  isStreaming: false,

  setCurrentRoom: (room) => set({ currentRoom: room }),
  setPkSession: (pk) => set({ pkSession: pk }),
  setStreaming: (val) => set({ isStreaming: val }),
  updatePkScore: (scoreA, scoreB) => set(state => ({
    pkSession: state.pkSession ? { ...state.pkSession, score_a: scoreA, score_b: scoreB } : null
  })),
  endPk: (winner) => set(state => ({
    pkSession: state.pkSession ? { ...state.pkSession, status: 'ended', winner_room_id: winner } : null
  })),
  reset: () => set({ currentRoom: null, viewers: [], pkSession: null, isStreaming: false }),
}));

export default useRoomStore;
