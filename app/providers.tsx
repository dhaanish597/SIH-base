'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { AchievementProvider } from './providers/achievements';

// ---------------------------------------------------------------------------
// Auth context — talks to the Express backend's cookie-auth endpoints
// (/api/auth/login, /api/auth/refresh, /api/auth/logout, /api/users/me).
// Cookies are httpOnly so we never read tokens from JS — we just check
// /api/users/me to know who we are.
// ---------------------------------------------------------------------------

export type AuthUser = {
  id: string;
  name: string;
  email?: string | null;
  role: 'STUDENT' | 'TEACHER' | 'SCHOOL' | 'ADMIN' | 'SUPERADMIN';
  schoolId?: string | null;
  class?: string | null;
  language?: string;
  profilePhoto?: string | null;
  totalPoints?: number;
  totalCoins?: number;
  level?: number;
  xp?: number;
  streakDays?: number;
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  refresh: async () => {},
  logout: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/users/me', { credentials: 'include' });
      if (res.ok) {
        const u = (await res.json()) as AuthUser;
        setUser(u);
      } else if (res.status === 401) {
        // Try to refresh the access token
        const r = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' });
        if (r.ok) {
          const me = await fetch('/api/users/me', { credentials: 'include' });
          if (me.ok) setUser((await me.json()) as AuthUser);
          else setUser(null);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {}
    setUser(null);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // PWA service worker registration (preserved from Vite app)
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refresh, logout }}>{children}</AuthContext.Provider>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <AchievementProvider>
        {children}
      </AchievementProvider>
    </AuthProvider>
  );
}
