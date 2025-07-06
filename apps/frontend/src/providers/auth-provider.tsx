'use client';

import React, { createContext, ReactNode, useContext } from 'react';
import { useAuth as useAuthHook } from '@/hooks/use-auth';
import { User } from '@/types/user';

// Auth context için tip tanımı
interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

// Auth Context oluşturma
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider Props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth Provider bileşeni
export function AuthProvider({ children }: AuthProviderProps) {
  const auth = useAuthHook();
  
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

// Context hook'u
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
