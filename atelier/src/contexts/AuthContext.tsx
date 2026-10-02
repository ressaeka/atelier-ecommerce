import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, setTokens, clearTokens, getAccessToken, getRefreshToken } from '../lib/api';
import type { User, AuthTokens, LoginRequest, RegisterRequest, UpdateUserRequest } from '../types/api';
import { ApiRequestError } from '../lib/api';
import { clearGuestAuthReturnIntent } from '../lib/guestIntent';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (data: LoginRequest) => Promise<User>;
  /** Admin Portal login — POST /auth/admin-login (backend enforces ADMIN) */
  adminLogin: (data: LoginRequest) => Promise<User>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  handleGoogleAuth: (accessToken: string, refreshToken: string) => Promise<User>;
  updateProfile: (data: UpdateUserRequest) => Promise<User>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const USER_KEY = 'atelier_user';

function readStoredUser(): User | null {
  try {
    const stored = localStorage.getItem(USER_KEY);
    if (!stored) return null;

    const parsed: unknown = JSON.parse(stored);
    if (!parsed || typeof parsed !== 'object') {
      localStorage.removeItem(USER_KEY);
      return null;
    }

    const user = parsed as Partial<User>;
    if (typeof user.id !== 'number' || typeof user.role !== 'string') {
      localStorage.removeItem(USER_KEY);
      return null;
    }

    return user as User;
  } catch {
    // Corrupt storage must not crash the React tree (white screen)
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

function persistUser(user: User | null): void {
  if (!user) {
    localStorage.removeItem(USER_KEY);
    return;
  }
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    localStorage.removeItem(USER_KEY);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => readStoredUser());
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
        persistUser(u);
      })
      .catch((err) => {
        // Distinguish 401 Unauthorized from network or server errors
        if (err instanceof ApiRequestError && err.statusCode === 401) {
          clearTokens();
          persistUser(null);
          setUser(null);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (data: LoginRequest): Promise<User> => {
    const result = await api.post<AuthTokens>('/auth/login', data);
    setTokens(result.access_token, result.refresh_token);
    setUser(result.user);
    persistUser(result.user);
    return result.user;
  }, []);

  /**
   * Admin Portal auth.
   * Calls dedicated backend endpoint; non-admin never receives a token.
   * Frontend does not use this as a security boundary.
   */
  const adminLogin = useCallback(async (data: LoginRequest): Promise<User> => {
    const result = await api.post<AuthTokens>('/auth/admin-login', data);
    setTokens(result.access_token, result.refresh_token);
    setUser(result.user);
    persistUser(result.user);
    return result.user;
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
      persistUser(userProfile);
      return userProfile;
    } catch (err) {
      clearTokens();
      persistUser(null);
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
      // Always clear client session immediately — React state updates sync UI
      clearTokens();
      persistUser(null);
      setUser(null);
      // Drop any pending guest return intent so next login is clean
      clearGuestAuthReturnIntent();
    }
  }, []);

  const updateProfile = useCallback(async (data: UpdateUserRequest): Promise<User> => {
    const updated = await api.patch<User>('/users/me', data);
    setUser(updated);
    persistUser(updated);
    return updated;
  }, []);

  const value = React.useMemo(
    () => ({
      user,
      loading,
      login,
      adminLogin,
      register,
      logout,
      handleGoogleAuth,
      updateProfile,
    }),
    [user, loading, login, adminLogin, register, logout, handleGoogleAuth, updateProfile],
  );

  return (
    <AuthContext.Provider value={value}>
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
