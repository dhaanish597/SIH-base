'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { AchievementProvider } from './providers/achievements';
import { readActiveDemoUser, writeActiveDemoId, type DemoUser } from '../lib/demo-users';

// Re-export AuthUser so existing imports from this file keep working
export type { AuthUser } from '../lib/auth-types';
import type { AuthUser } from '../lib/auth-types';

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  isDemoMode: boolean;
  logout: () => void;
  switchDemoUser: (demoId: string) => void;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: false,
  isDemoMode: true,
  logout: () => {},
  switchDemoUser: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

function demoToAuthUser(demo: DemoUser): AuthUser {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { demoId: _a, description: _b, ...rest } = demo;
  return rest as AuthUser;
}

function AuthProvider({ children }: { children: ReactNode }) {
  // null on server (SSR); set from localStorage after mount to avoid hydration mismatch
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(true);

  const switchDemoUser = useCallback((demoId: string) => {
    writeActiveDemoId(demoId);
    // Full reload so every component picks up the new persona cleanly
    window.location.replace(window.location.href);
  }, []);

  const logout = useCallback(() => {
    writeActiveDemoId('student-10a');
    window.location.replace('/student');
  }, []);

  // After mount: apply the stored demo persona (synchronous localStorage read)
  useEffect(() => {
    setUser(demoToAuthUser(readActiveDemoUser()));
  }, []);

  // Try real backend auth in the background (non-blocking, 3s timeout)
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);

    fetch('/api/users/me', { credentials: 'include', signal: controller.signal })
      .then(res => (res.ok ? res.json() : Promise.reject()))
      .then((realUser: AuthUser) => {
        setUser(realUser);
        setIsDemoMode(false);
      })
      .catch(() => { /* backend unavailable or auth failed — stay with demo user */ })
      .finally(() => clearTimeout(timer));

    return () => { controller.abort(); clearTimeout(timer); };
  }, []);

  // PWA service worker
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading: false, isDemoMode, logout, switchDemoUser }}>
      {children}
    </AuthContext.Provider>
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
