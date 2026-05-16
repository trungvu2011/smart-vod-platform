import { create } from 'zustand';
import type { User } from '../types';
import api from '../api/axios';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
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
    return user;
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
      const res = await api.get('/users/me');
      set({ user: res.data.user, isAuthenticated: true });
    } catch {
      get().logout();
    }
  }
}));
