import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User } from '@/types/user';

interface AuthState {
  user: User | null;
  token: string | null;
  isHydrated: boolean; // To check if the store has been rehydrated from localStorage
  login: (user: User, token: string) => void;
  logout: () => void;
  setHydrated: () => void; // Action to set isHydrated to true
  // Debug için token durumunu kontrol et
  checkTokenStatus: () => { hasToken: boolean, tokenValue?: string };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isHydrated: false, // Initially, the store is not hydrated
      login: (user, token) => {
        console.log('Auth Store: Login çağrıldı, token:', token?.substring(0, 10) + '...');
        set({ user, token });
        
        // localStorage'a da manuel kaydetme (persist middleware'e güvenmek yerine)
        if (typeof window !== 'undefined') {
          try {
            const authData = JSON.stringify({ user, token });
            localStorage.setItem('auth-manual-backup', authData);
            console.log('Auth Store: Token localStorage\'a manuel kaydedildi');
          } catch (e) {
            console.error('Auth Store: Token localStorage\'a kaydedilemedi:', e);
          }
        }
      },
      logout: () => {
        set({ user: null, token: null });
        // Manuel kaydettiğimiz localStorage kaydını da temizle
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth-manual-backup');
        }
      },
      setHydrated: () => set({ isHydrated: true }),
      checkTokenStatus: () => {
        const state = get();
        return { 
          hasToken: !!state.token, 
          tokenValue: state.token ? state.token.substring(0, 10) + '...' : undefined 
        };
      },
    }),
    {
      name: 'auth-storage', // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
      // Only persist user and token
      partialize: (state) => ({ user: state.user, token: state.token }),
      // This function is called after the storage has been rehydrated
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHydrated();
        }
      },
    }
  )
);
