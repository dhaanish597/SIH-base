'use client';

import { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';

export type ToastKind = 'xp' | 'coins' | 'quest' | 'streak' | 'info';

export type AchToast = {
  id: string;
  kind: ToastKind;
  label: string;
  value?: string | number;
};

type AchCtx = {
  toasts: AchToast[];
  fire: (kind: ToastKind, label: string, value?: string | number) => void;
  dismiss: (id: string) => void;
  levelUpLevel: number | null;
  triggerLevelUp: (level: number) => void;
  dismissLevelUp: () => void;
};

const AchievementContext = createContext<AchCtx | null>(null);

const DURATIONS: Record<ToastKind, number> = {
  xp:     2800,
  coins:  2800,
  quest:  5000,
  streak: 4000,
  info:   3500,
};

export function AchievementProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<AchToast[]>([]);
  const [levelUpLevel, setLevelUpLevel] = useState<number | null>(null);
  const counter = useRef(0);

  const fire = useCallback((kind: ToastKind, label: string, value?: string | number) => {
    const id = `ach-${++counter.current}`;
    setToasts(ts => [...ts, { id, kind, label, value }]);
    setTimeout(() => setToasts(ts => ts.filter(t => t.id !== id)), DURATIONS[kind]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts(ts => ts.filter(t => t.id !== id));
  }, []);

  const triggerLevelUp = useCallback((level: number) => setLevelUpLevel(level), []);
  const dismissLevelUp = useCallback(() => setLevelUpLevel(null), []);

  return (
    <AchievementContext.Provider value={{ toasts, fire, dismiss, levelUpLevel, triggerLevelUp, dismissLevelUp }}>
      {children}
    </AchievementContext.Provider>
  );
}

export function useAchievements() {
  const ctx = useContext(AchievementContext);
  if (!ctx) throw new Error('useAchievements must be inside AchievementProvider');
  return ctx;
}
