'use client';

import { useState, Suspense } from 'react';
import { DEMO_USERS, writeActiveDemoId, type DemoUser } from '../../lib/demo-users';

type RoleTab = 'student' | 'teacher' | 'school' | 'admin';

const ROLE_TABS: { id: RoleTab; label: string; icon: string; color: string }[] = [
  { id: 'student', label: 'Students', icon: '⚔️', color: 'var(--violet)' },
  { id: 'teacher', label: 'Teachers', icon: '🧙', color: 'var(--cyan)' },
  { id: 'school',  label: 'School',   icon: '🏰', color: 'var(--gold)' },
  { id: 'admin',   label: 'Admin',    icon: '🛡️', color: 'var(--hot)' },
];

const ROLE_MAP: Record<RoleTab, string> = {
  student: 'STUDENT',
  teacher: 'TEACHER',
  school:  'SCHOOL',
  admin:   'ADMIN',
};

const DEST_MAP: Record<string, string> = {
  STUDENT: '/student',
  TEACHER: '/teacher',
  SCHOOL:  '/school',
  ADMIN:   '/admin',
};

function getInitialTab(): RoleTab {
  if (typeof window === 'undefined') return 'student';
  const r = new URLSearchParams(window.location.search).get('role') as RoleTab | null;
  return r && ROLE_TABS.some(t => t.id === r) ? r : 'student';
}

export default function LoginPage() {
  // Read from window.location.search once at mount — no useSearchParams needed,
  // which avoids the Suspense-remount loop that was resetting activeTab.
  const [activeTab, setActiveTab] = useState<RoleTab>(getInitialTab);

  const visibleUsers = DEMO_USERS.filter(u => u.role === ROLE_MAP[activeTab]);

  const enter = (demo: DemoUser) => {
    writeActiveDemoId(demo.demoId);
    window.location.replace(DEST_MAP[demo.role] ?? '/student');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      background: 'var(--bg-deep)',
    }}>
      {/* LOGO */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
          <div className="icon-shield" style={{ width: 44, height: 50 }} />
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontFamily: 'var(--f-display)', fontSize: 36, lineHeight: 1, color: 'var(--ink-1)' }}>QUEST</div>
            <div style={{ fontFamily: 'var(--f-hud)', fontSize: 14, color: 'var(--gold)', letterSpacing: '0.3em', fontWeight: 700 }}>ACADEMY</div>
          </div>
        </div>
        <div style={{ fontFamily: 'var(--f-hud)', fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.2em', marginTop: 4 }}>
          DEMO MODE · PICK YOUR PERSONA
        </div>
      </div>

      <div style={{ width: '100%', maxWidth: 560 }}>
        {/* ROLE TABS */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6,
          padding: 6, background: 'var(--bg-elev-2)', borderRadius: 14,
          border: '2px solid var(--line)', marginBottom: 20,
        }}>
          {ROLE_TABS.map(tab => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  padding: '10px 4px', borderRadius: 10,
                  background: active ? tab.color : 'transparent',
                  border: active ? `1.5px solid ${tab.color}` : '1.5px solid transparent',
                  color: active ? '#fff' : 'var(--ink-3)',
                  boxShadow: active ? '0 4px 0 rgba(0,0,0,0.4)' : 'none',
                  fontFamily: 'var(--f-hud)', fontSize: 10, fontWeight: 700,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  cursor: 'pointer', transition: 'all .15s',
                }}
              >
                <span style={{ fontSize: 20 }}>{tab.icon}</span>
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* DEMO USER CARDS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {visibleUsers.map(demo => (
            <DemoCard key={demo.demoId} demo={demo} onEnter={() => enter(demo)} />
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: 28, fontFamily: 'var(--f-hud)', fontSize: 10, color: 'var(--ink-dim)', letterSpacing: '0.15em' }}>
          TESTING MODE · NO REAL DATA · LEARN · BATTLE · CONQUER
        </div>
      </div>
    </div>
  );
}

function DemoCard({ demo, onEnter }: { demo: DemoUser; onEnter: () => void }) {
  const roleColors: Record<string, string> = {
    STUDENT: 'var(--violet)',
    TEACHER: 'var(--cyan)',
    SCHOOL:  'var(--gold)',
    ADMIN:   'var(--hot)',
  };
  const accent = roleColors[demo.role] ?? 'var(--violet)';
  const initials = demo.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px 16px',
        background: 'var(--bg-elev-1)',
        border: '2px solid var(--line)',
        borderRadius: 14,
        cursor: 'default',
        transition: 'border-color .15s, box-shadow .15s',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.borderColor = accent;
        (e.currentTarget as HTMLElement).style.boxShadow = `0 0 0 2px ${accent}33`;
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--line)';
        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
      }}
    >
      {/* Avatar */}
      <div style={{
        width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
        background: accent, display: 'grid', placeItems: 'center',
        fontFamily: 'var(--f-hud)', fontWeight: 700, fontSize: 16, color: '#fff',
        border: '3px solid rgba(255,255,255,0.1)',
      }}>
        {initials}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--f-hud)', fontSize: 14, fontWeight: 700, color: 'var(--ink-1)', marginBottom: 2 }}>
          {demo.name}
        </div>
        <div style={{ fontFamily: 'var(--f-body)', fontSize: 12, color: 'var(--ink-3)' }}>
          {demo.description}
        </div>
      </div>

      {/* Level + streak chips (students only) */}
      {demo.role === 'STUDENT' && (
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <span style={{
            fontFamily: 'var(--f-hud)', fontSize: 10, fontWeight: 700,
            padding: '3px 8px', borderRadius: 20,
            background: 'rgba(107,75,255,0.18)', color: 'var(--violet-bright)',
            border: '1px solid rgba(107,75,255,0.3)',
          }}>Lv.{demo.level}</span>
          <span style={{
            fontFamily: 'var(--f-hud)', fontSize: 10, fontWeight: 700,
            padding: '3px 8px', borderRadius: 20,
            background: 'rgba(255,201,60,0.12)', color: 'var(--gold)',
            border: '1px solid rgba(255,201,60,0.3)',
          }}>🔥 {demo.streakDays}d</span>
        </div>
      )}

      {/* Enter button */}
      <button
        onClick={onEnter}
        style={{
          flexShrink: 0,
          padding: '9px 18px',
          background: accent,
          border: 'none', borderRadius: 10,
          fontFamily: 'var(--f-hud)', fontSize: 11, fontWeight: 700,
          letterSpacing: '0.08em', textTransform: 'uppercase',
          color: '#fff',
          boxShadow: '0 4px 0 rgba(0,0,0,0.35)',
          cursor: 'pointer',
          transition: 'opacity .15s, transform .1s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.85'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
        onMouseDown={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(2px)'; }}
        onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; }}
      >
        ▶ ENTER
      </button>
    </div>
  );
}
