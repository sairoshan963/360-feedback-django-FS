import { create } from 'zustand';

const stored = () => {
  try {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  } catch { return null; }
};

const useAuthStore = create((set) => ({
  token: localStorage.getItem('access_token') || null,
  user:  stored(),

  // Django simplejwt returns { access, refresh, user }
  setAuth: (access, user, refresh = null) => {
    localStorage.setItem('access_token', access);
    if (refresh) localStorage.setItem('refresh_token', refresh);
    localStorage.setItem('user', JSON.stringify(user));
    set({ token: access, user });
  },

  clearAuth: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    set({ token: null, user: null });
  },

  updateUser: (fields) => {
    set((state) => {
      const updated = { ...state.user, ...fields };
      localStorage.setItem('user', JSON.stringify(updated));
      return { user: updated };
    });
  },
}));

export default useAuthStore;
