import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User } from '@/types/user';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isHydrated: boolean; // To check if the store has been rehydrated from localStorage
  login: (user: User, accessToken: string) => void;
  logout: () => void;
  setHydrated: () => void; // Action to set isHydrated to true
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isHydrated: false, // Initially, the store is not hydrated
      login: (user, accessToken) => set({ user, accessToken }),
      logout: () => set({ user: null, accessToken: null }),
      setHydrated: () => set({ isHydrated: true }),
    }),
    {
      name: 'auth-storage', // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
      // Only persist user and accessToken
      partialize: (state) => ({ user: state.user, accessToken: state.accessToken }),
      // This function is called after the storage has been rehydrated
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHydrated();
        }
      },
    }
  )
);
