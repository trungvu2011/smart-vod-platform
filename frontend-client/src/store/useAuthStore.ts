import { create } from 'zustand';
import type { User } from '../types';
import api from '../api/axios';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  initAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('wp_token'),
  isAuthenticated: !!localStorage.getItem('wp_token'),

  login: async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    const { user, accessToken } = res.data;
    set({ user, token: accessToken, isAuthenticated: true });
    localStorage.setItem('wp_token', accessToken);
  },

  logout: () => {
    set({ user: null, token: null, isAuthenticated: false });
    localStorage.removeItem('wp_token');
  },

  setUser: (user) => set({ user }),

  initAuth: async () => {
    const token = get().token;
    if (!token) return;
    try {
      // For now, if we don't have a profile endpoint, we can rely on what we have, 
      // but ideally we call GET /api/users/profile or similar.
      // Since API doesn't have /api/users/profile explicitly in DOCS, we will simulate it
      // or assume the front end will just require re-login if cache is lost.
      // Let's assume we don't have a profile endpoint immediately, just set isAuthenticated.
    } catch {
      get().logout();
    }
  }
}));
