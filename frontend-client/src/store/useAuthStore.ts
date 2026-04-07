import { create } from 'zustand';
import type { User } from '../types';
import { currentUser } from '../data/mockData';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  // Default to logged-in with mock user for development
  user: currentUser,
  token: 'mock-jwt-token',
  isAuthenticated: true,

  login: async (_email: string, _password: string) => {
    // TODO: Replace with real API call via axios
    // const res = await api.post('/auth/login', { email, password });
    // set({ user: res.data.user, token: res.data.token, isAuthenticated: true });
    set({ user: currentUser, token: 'mock-jwt-token', isAuthenticated: true });
    localStorage.setItem('wp_token', 'mock-jwt-token');
  },

  logout: () => {
    set({ user: null, token: null, isAuthenticated: false });
    localStorage.removeItem('wp_token');
  },

  setUser: (user) => set({ user }),
}));
