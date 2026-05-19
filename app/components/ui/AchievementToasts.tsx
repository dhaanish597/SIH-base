'use client';

import { useEffect, useState } from 'react';
import { useAchievements, type AchToast, type ToastKind } from '../../providers/achievements';

const STYLE: Record<ToastKind, { bg: string; border: string; icon: string; label: string }> = {
  xp:     { bg: 'rgba(107,75,255,0.95)', border: 'var(--violet-bright)', icon: '⚡', label: 'XP' },
  coins:  { bg: 'rgba(30,22,60,0.97)',   border: 'var(--gold)',           icon: '🪙', label: 'Coins' },
  quest:  { bg: 'rgba(12,48,28,0.97)',   border: 'var(--green)',          icon: '⚔️', label: 'Quest' },
  streak: { bg: 'rgba(180,80,0,0.96)',   border: 'var(--orange)',         icon: '🔥', label: 'Streak' },
  info:   { bg: 'rgba(20,26,60,0.96)',   border: 'var(--cyan)',           icon: 'ℹ️', label: '' },
};

function Toast({ toast, onDismiss }: { toast: AchToast; onDismiss: () => void }) {
  const [exiting, setExiting] = useState(false);
  const s = STYLE[toast.kind];

  const handleDismiss = () => {
    setExiting(true);
    setTimeout(onDismiss, 280);
  };

  return (
    <div
      className={exiting ? 'ach-toast-exit' : 'ach-toast-enter'}
      onClick={handleDismiss}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 14px 10px 12px',
        background: s.bg,
        border: `1.5px solid ${s.border}`,
        borderRadius: 14,
        boxShadow: `0 4px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)`,
        cursor: 'pointer',
        minWidth: 200,
        maxWidth: 280,
        backdropFilter: 'blur(8px)',
        userSelect: 'none',
      }}
    >
      <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0 }}>{s.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        {toast.value !== undefined && (
          <p style={{
            fontFamily: 'var(--f-hud)', fontWeight: 700, fontSize: 18,
            color: 'var(--ink-1)', lineHeight: 1, margin: 0,
          }}>
            +{toast.value}
            {toast.kind === 'xp' && <span style={{ fontSize: 12, marginLeft: 3, color: 'var(--violet-bright)' }}>XP</span>}
            {toast.kind === 'coins' && <span style={{ fontSize: 12, marginLeft: 3, color: 'var(--gold)' }}>coins</span>}
          </p>
        )}
        <p style={{
          fontFamily: 'var(--f-hud)', fontSize: 11, letterSpacing: '0.08em',
          color: 'rgba(255,255,255,0.65)', margin: 0, textTransform: 'uppercase',
        }}>{toast.label}</p>
      </div>
    </div>
  );
}

export default function AchievementToasts() {
  const { toasts, dismiss } = useAchievements();
  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed', top: 72, right: 16, zIndex: 9000,
      display: 'flex', flexDirection: 'column', gap: 10,
      pointerEvents: 'none',
    }}>
      {toasts.map(t => (
        <div key={t.id} style={{ pointerEvents: 'auto' }}>
          <Toast toast={t} onDismiss={() => dismiss(t.id)} />
        </div>
      ))}
    </div>
  );
}
