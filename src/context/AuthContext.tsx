import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { User } from '@/types/api';
import { isResponderRole } from '@/types/api';
import { login as apiLogin } from '@/api/responder';
import { getStoredToken, getStoredUser, saveAuth, clearAuth } from '@/stores/authStorage';
import { connectSocket, disconnectSocket } from '@/lib/socket';

interface AuthContextValue {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [storedToken, storedUser] = await Promise.all([getStoredToken(), getStoredUser()]);
        if (storedToken && storedUser && isResponderRole(storedUser.role)) {
          setToken(storedToken);
          setUser(storedUser);
          connectSocket(storedUser.id, storedUser.role).catch(() => {});
        } else if (storedToken) {
          await clearAuth();
        }
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await apiLogin(email, password);

    if (!isResponderRole(result.user.role)) {
      throw new Error('This app is for field responders only (Driver, EMT, Nurse).');
    }

    await saveAuth(result.token, result.user);
    setToken(result.token);
    setUser(result.user);
    await connectSocket(result.user.id, result.user.role);
  }, []);

  const logout = useCallback(async () => {
    disconnectSocket();
    await clearAuth();
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
