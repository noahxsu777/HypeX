import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

const useAuthStore = create(persist(
  (set, get) => ({
    user: null,
    token: null,
    isLoading: false,
    error: null,

    login: async (username, password) => {
      set({ isLoading: true, error: null });
      try {
        const { data } = await axios.post('/api/auth/login', { username, password });
        axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
        set({ user: data.user, token: data.token, isLoading: false });
        return true;
      } catch (err) {
        set({ error: err.response?.data?.error || 'Login failed', isLoading: false });
        return false;
      }
    },

    register: async (username, password, phone) => {
      set({ isLoading: true, error: null });
      try {
        const { data } = await axios.post('/api/auth/register', { username, password, phone });
        axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
        set({ user: data.user, token: data.token, isLoading: false });
        return true;
      } catch (err) {
        set({ error: err.response?.data?.error || 'Register failed', isLoading: false });
        return false;
      }
    },

    logout: () => {
      delete axios.defaults.headers.common['Authorization'];
      set({ user: null, token: null });
    },

    updateCoins: (coins) => set(state => ({ user: state.user ? { ...state.user, coins } : null })),
    updateUser: (updates) => set(state => ({ user: state.user ? { ...state.user, ...updates } : null })),

    initAuth: () => {
      const { token } = get();
      if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    },
  }),
  { name: 'livewave-auth', partialize: (state) => ({ user: state.user, token: state.token }) }
));

export default useAuthStore;
