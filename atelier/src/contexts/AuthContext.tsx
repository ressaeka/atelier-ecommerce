import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, setTokens, clearTokens, getAccessToken, getRefreshToken } from '../lib/api';
import type { User, AuthTokens, LoginRequest, RegisterRequest } from '../types/api';
import { ApiRequestError } from '../lib/api';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  handleGoogleAuth: (accessToken: string, refreshToken: string) => Promise<User>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const USER_KEY = 'atelier_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  // Verify token on mount
  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setLoading(false);
      return;
    }

    api
      .get<User>('/users/me')
      .then((u) => {
        setUser(u);
        localStorage.setItem(USER_KEY, JSON.stringify(u));
      })
      .catch((err) => {
        // Distinguish 401 Unauthorized from network or server errors
        if (err instanceof ApiRequestError && err.statusCode === 401) {
          clearTokens();
          localStorage.removeItem(USER_KEY);
          setUser(null);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (data: LoginRequest) => {
    const result = await api.post<AuthTokens>('/auth/login', data);
    setTokens(result.access_token, result.refresh_token);
    setUser(result.user);
    localStorage.setItem(USER_KEY, JSON.stringify(result.user));
  }, []);

  const register = useCallback(async (data: RegisterRequest) => {
    await api.post('/auth/register', data);
  }, []);

  const handleGoogleAuth = useCallback(async (accessToken: string, refreshToken: string) => {
    setLoading(true);
    try {
      setTokens(accessToken, refreshToken);
      const userProfile = await api.get<User>('/users/me');
      setUser(userProfile);
      localStorage.setItem(USER_KEY, JSON.stringify(userProfile));
      return userProfile;
    } catch (err) {
      clearTokens();
      localStorage.removeItem(USER_KEY);
      setUser(null);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch (err) {
      // Ignore or log server logout errors (e.g. 401 if already expired), but ensure client session cleanup
      console.warn('Logout notification error:', err);
    } finally {
      clearTokens();
      localStorage.removeItem(USER_KEY);
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, handleGoogleAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export { ApiRequestError };
