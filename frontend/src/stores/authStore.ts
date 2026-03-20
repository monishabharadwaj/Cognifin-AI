import { create } from "zustand";
import type { User } from "@/types/finance";
import { apiClient } from "@/services/api";
import { jwtDecode } from "jwt-decode";

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  checkAuth: () => void;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  isAuthenticated: !!localStorage.getItem("auth_token"),
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { user } = await apiClient.login(email, password);
      set({ user, isAuthenticated: true, isLoading: false });
      // Fetch full profile after login (non-blocking)
      get()
        .fetchMe()
        .catch(() => {});
    } catch (e: any) {
      set({ error: e.message, isLoading: false, isAuthenticated: false });
      throw e;
    }
  },

  register: async (name, email, password) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.register(name, email, password);
      set({ isLoading: false });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
      throw e;
    }
  },

  logout: () => {
    apiClient.logout();
    set({ user: null, isAuthenticated: false });
  },

  clearError: () => set({ error: null }),

  checkAuth: () => {
    set({ isLoading: true });
    const token = localStorage.getItem("auth_token");
    if (token) {
      try {
        const decodedUser = jwtDecode<
          User & { id: string; name: string; email: string }
        >(token);
        set({
          user: decodedUser as User,
          isAuthenticated: true,
          isLoading: false,
        });
        // Try to fetch full profile in background
        get()
          .fetchMe()
          .catch(() => {});
      } catch {
        localStorage.removeItem("auth_token");
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    } else {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  /**
   * Fetch the logged-in user's profile from the backend.
   * Uses GET /api/auth/me if available, otherwise falls back to the
   * already-decoded JWT data already in state.
   * Never throws — failures are silently swallowed so the app keeps working.
   */
  fetchMe: async () => {
    try {
      const data = await apiClient.getMe();
      if (data) {
        set((s) => ({ user: { ...s.user, ...data } as User }));
      }
    } catch {
      // /api/auth/me may not exist — silently fall back to JWT-decoded data
    }
  },
}));
