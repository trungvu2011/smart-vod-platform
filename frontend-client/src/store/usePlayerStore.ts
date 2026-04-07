import { create } from 'zustand';
import type { Video } from '../types';

interface PlayerState {
  currentVideo: Video | null;
  isPlaying: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  setCurrentVideo: (video: Video) => void;
  setIsPlaying: (playing: boolean) => void;
  setVolume: (volume: number) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  currentVideo: null,
  isPlaying: false,
  volume: 0.8,
  currentTime: 0,
  duration: 0,
  setCurrentVideo: (video) => set({ currentVideo: video, currentTime: 0 }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setVolume: (volume) => set({ volume }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration }),
}));
