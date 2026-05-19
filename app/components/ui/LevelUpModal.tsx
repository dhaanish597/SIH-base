'use client';

import { useEffect } from 'react';
import { useAchievements } from '../../providers/achievements';

export default function LevelUpModal() {
  const { levelUpLevel, dismissLevelUp } = useAchievements();

  useEffect(() => {
    if (!levelUpLevel) return;
    const t = setTimeout(dismissLevelUp, 6000);
    return () => clearTimeout(t);
  }, [levelUpLevel, dismissLevelUp]);

  if (!levelUpLevel) return null;

  return (
    <div
      onClick={dismissLevelUp}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(4px)',
        cursor: 'pointer',
      }}
    >
      {/* Rotating rays */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
        <svg className="lvlup-rays" width="600" height="600" viewBox="0 0 600 600" style={{ opacity: 0.18 }}>
          {Array.from({ length: 12 }, (_, i) => (
            <line
              key={i}
              x1="300" y1="300"
              x2={300 + 300 * Math.cos((i * 30 * Math.PI) / 180)}
              y2={300 + 300 * Math.sin((i * 30 * Math.PI) / 180)}
              stroke="var(--gold)"
              strokeWidth="28"
            />
          ))}
        </svg>
      </div>

      {/* Card */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          background: 'var(--bg-arena)',
          border: '3px solid var(--gold)',
          borderRadius: 24,
          padding: '48px 40px 36px',
          textAlign: 'center',
          minWidth: 300,
          boxShadow: '0 0 80px rgba(255,201,60,0.4), var(--hd-gold)',
        }}
      >
        {/* Level badge */}
        <div className="lvlup-badge" style={{
          width: 100, height: 100, borderRadius: '50%',
          background: 'var(--gold)',
          border: '4px solid var(--gold-glow)',
          boxShadow: '0 0 40px rgba(255,201,60,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
        }}>
          <span style={{
            fontFamily: 'var(--f-display)', fontWeight: 700,
            fontSize: 40, color: '#000', lineHeight: 1,
          }}>{levelUpLevel}</span>
        </div>

        {/* Text */}
        <div className="lvlup-text">
          <p style={{
            fontFamily: 'var(--f-hud)', fontSize: 13, letterSpacing: '0.25em',
            color: 'var(--gold)', marginBottom: 8, textTransform: 'uppercase',
          }}>Level Up!</p>
          <p style={{
            fontFamily: 'var(--f-display)', fontSize: 32, fontWeight: 700,
            color: 'var(--ink-1)', lineHeight: 1.1,
          }}>You reached<br />Level {levelUpLevel}</p>
          <p style={{ color: 'var(--ink-3)', fontSize: 14, marginTop: 12 }}>
            New challenges await. Keep going!
          </p>
        </div>

        {/* Footer */}
        <div className="lvlup-footer" style={{ marginTop: 28 }}>
          <button
            onClick={dismissLevelUp}
            style={{
              background: 'var(--gold)', color: '#000',
              border: 'none', borderRadius: 12,
              padding: '12px 32px',
              fontFamily: 'var(--f-hud)', fontWeight: 700, fontSize: 14,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              cursor: 'pointer',
              boxShadow: 'var(--hd-gold)',
            }}
          >
            Continue
          </button>
          <p style={{ fontSize: 11, color: 'var(--ink-dim)', marginTop: 12 }}>or tap anywhere to close</p>
        </div>
      </div>
    </div>
  );
}
