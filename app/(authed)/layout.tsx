'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../providers';
import {
  LogOut, BookOpen, Trophy, Gamepad2, ScrollText,
  Users, BarChart3, Building2, Bell, Menu, X, Home, User,
  Settings2, Calendar, Send, UserPlus
} from 'lucide-react';
import AchievementToasts from '../components/ui/AchievementToasts';
import LevelUpModal from '../components/ui/LevelUpModal';

const SESSION_TIMEOUT_MS: Record<string, number> = {
  STUDENT: 30 * 60 * 1000,     // 30 min
  TEACHER: 2 * 60 * 60 * 1000, // 2 hr
  SCHOOL: 2 * 60 * 60 * 1000,
  ADMIN: 2 * 60 * 60 * 1000,
};

export default function AuthedLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ── Auth guard & Session ──────────────────────────────────
  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    const timeoutMs = SESSION_TIMEOUT_MS[user.role] || SESSION_TIMEOUT_MS.STUDENT;
    let activityTimer: NodeJS.Timeout;
    const handleActivity = () => {
      clearTimeout(activityTimer);
      activityTimer = setTimeout(async () => {
        await logout();
        router.replace('/login');
      }, timeoutMs);
    };
    handleActivity();
    window.addEventListener('click', handleActivity);
    window.addEventListener('keydown', handleActivity);
    return () => {
      clearTimeout(activityTimer);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('keydown', handleActivity);
    };
  }, [user, logout, router]);

  useEffect(() => setSidebarOpen(false), [pathname]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-base">
        <div className="animate-pulse-slow">
          <Gamepad2 className="w-12 h-12 text-brand-primary" />
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────
  // STUDENT LAYOUT: Top Nav (Desktop) + Bottom Nav (Mobile)
  // ──────────────────────────────────────────────────────────
  if (user.role === 'STUDENT') {
    const studentNav = [
      { href: '/student', label: 'Home', icon: '🏠' },
      { href: '/student/games', label: 'Games', icon: '🎮' },
      { href: '/student/quests', label: 'Quests', icon: '⚔️' },
      { href: '/student/roadmap', label: 'Roadmap', icon: '🗺️' },
      { href: '/student/leaderboard', label: 'Ranks', icon: '🏆' },
      { href: '/student/shop', label: 'Shop', icon: '🛒' },
      { href: '/student/profile', label: 'Profile', icon: '👤' },
    ];

    const xp = user.xp || 0;
    const level = user.level || 1;
    const xpMax = level * 500;
    const streak = user.streakDays || 0;
    const coins = user.totalCoins || 0;

    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-deep)', display: 'flex', flexDirection: 'column' }}>
        {/* ── DESKTOP TOP NAV ── */}
        <header className="qa-desktop-nav" style={{
          position: 'sticky', top: 0, zIndex: 50,
          background: 'rgba(7,7,15,0.92)',
          borderBottom: '2px solid var(--line)',
          backdropFilter: 'blur(12px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, padding: '12px 24px', maxWidth: 1320, margin: '0 auto' }}>
            {/* LOGO */}
            <Link href="/student" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
              <div className="icon-shield" style={{ width: 32, height: 36, flexShrink: 0 }} />
              <div>
                <div style={{ fontFamily: 'var(--f-display)', fontSize: 18, lineHeight: 1, color: 'var(--ink-1)', letterSpacing: '0.04em' }}>QUEST</div>
                <div style={{ fontFamily: 'var(--f-hud)', fontSize: 10, color: 'var(--gold)', letterSpacing: '0.2em', fontWeight: 700 }}>ACADEMY</div>
              </div>
            </Link>

            {/* NAV LINKS */}
            <nav style={{ display: 'flex', gap: 4, marginLeft: 12 }}>
              {studentNav.map(n => {
                const isA = pathname === n.href || pathname?.startsWith(n.href + '/');
                return (
                  <Link key={n.href} href={n.href} style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 14px',
                    borderRadius: 10,
                    color: isA ? 'var(--ink-1)' : 'var(--ink-3)',
                    background: isA ? 'rgba(107,75,255,0.18)' : 'transparent',
                    border: isA ? '1.5px solid var(--violet)' : '1.5px solid transparent',
                    fontFamily: 'var(--f-hud)', fontWeight: 700, fontSize: 12,
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                    textDecoration: 'none',
                    transition: 'color .15s, background .15s, border-color .15s',
                  }}>
                    <span style={{ fontSize: 14 }}>{n.icon}</span>{n.label}
                  </Link>
                );
              })}
            </nav>

            <div style={{ flex: 1 }} />

            {/* HUD STRIP */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="pill pill-orange" style={{ fontSize: 12 }}>🔥 {streak}</span>
              <span className="pill pill-gold" style={{ fontSize: 12 }}>🪙 {coins.toLocaleString()}</span>
              {/* Level + XP capsule */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '5px 10px 5px 5px',
                background: '#000',
                border: '2px solid var(--violet)',
                borderRadius: 999,
                boxShadow: '0 3px 0 var(--violet-deep)',
              }}>
                <div style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: 'var(--violet)', display: 'grid', placeItems: 'center',
                  fontFamily: 'var(--f-hud)', fontWeight: 700, color: '#fff', fontSize: 13,
                  border: '2px solid #000', boxShadow: 'inset 0 -3px 0 var(--violet-deep)',
                }}>{level}</div>
                <div style={{ width: 110 }}>
                  <div style={{ fontFamily: 'var(--f-hud)', fontSize: 9, color: 'var(--ink-3)', marginBottom: 2, letterSpacing: '0.06em' }}>
                    LVL {level} · {Math.round((xp / xpMax) * 100)}%
                  </div>
                  <div className="xp-bar violet" style={{ height: 6 }}>
                    <i style={{ width: `${Math.min(100, (xp / xpMax) * 100)}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* ── MOBILE HEADER ── */}
        <header className="qa-mobile-nav" style={{
          position: 'sticky', top: 0, zIndex: 50,
          background: 'rgba(7,7,15,0.95)', backdropFilter: 'blur(8px)',
          padding: '10px 14px', borderBottom: '2px solid var(--line)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="icon-shield" style={{ width: 26, height: 30, flexShrink: 0 }} />
            <div style={{ fontFamily: 'var(--f-display)', fontSize: 14, color: 'var(--ink-1)' }}>QUEST ACADEMY</div>
            <div style={{ flex: 1 }} />
            <span className="pill pill-orange" style={{ fontSize: 10, padding: '4px 8px' }}>🔥 {streak}</span>
            <span className="pill pill-gold" style={{ fontSize: 10, padding: '4px 8px' }}>🪙 {coins}</span>
          </div>
        </header>

        {/* ── MAIN CONTENT ── */}
        <main className="qa-main-content" style={{ flex: 1, overflowX: 'hidden' }}>
          {children}
        </main>

        {/* ── ACHIEVEMENT OVERLAYS (student only) ── */}
        <AchievementToasts />
        <LevelUpModal />

        {/* ── MOBILE BOTTOM NAV ── */}
        <nav className="qa-mobile-bottom-nav" style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: 'rgba(7,7,15,0.96)',
          borderTop: '2px solid var(--line)',
          gridTemplateColumns: `repeat(${studentNav.length}, 1fr)`,
          padding: '6px 4px', zIndex: 50,
          backdropFilter: 'blur(12px)',
        }}>
          {studentNav.map(n => {
            const isA = pathname === n.href || pathname?.startsWith(n.href + '/');
            return (
              <Link key={n.href} href={n.href} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                padding: '6px 2px',
                color: isA ? 'var(--violet-bright)' : 'var(--ink-3)',
                textDecoration: 'none',
              }}>
                <span style={{ fontSize: 18 }}>{n.icon}</span>
                <span style={{ fontFamily: 'var(--f-hud)', fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{n.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────
  // TEACHER / ADMIN LAYOUT: Sidebar + Top Bar
  // ──────────────────────────────────────────────────────────
  const nav = navFor(user.role);

  return (
    <div className="min-h-screen flex bg-bg-base text-text-primary">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden animate-fade-in" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed md:sticky top-0 left-0 z-50 md:z-auto h-screen w-64 bg-bg-overlay border-r border-white/5 flex flex-col transition-transform duration-300 ease-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/5">
          <div className="w-8 h-8 rounded bg-brand-primary flex items-center justify-center text-white shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <p className="font-display font-bold text-sm tracking-wider uppercase" style={{ textShadow: '0 0 8px rgba(124,58,237,0.3)' }}>QUEST ACADEMY</p>
            <p className="text-[10px] text-brand-secondary font-bold uppercase tracking-widest">{user.role}</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="ml-auto md:hidden text-text-muted hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {nav.map(n => {
            const Icon = n.icon;
            const active = pathname === n.href || pathname?.startsWith(n.href + '/');
            return (
              <Link key={n.href} href={n.href} className={`nav-item ${active ? 'nav-item-active' : 'nav-item-inactive'}`}>
                <Icon className="w-4 h-4 shrink-0" />
                <span className="font-bold tracking-wider uppercase text-xs">{n.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5">
          <button onClick={async () => { await logout(); router.replace('/login'); }} className="flex items-center gap-3 px-3 py-2.5 w-full text-text-muted hover:text-accent-red transition-colors text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-accent-red/10">
            <LogOut className="w-4 h-4" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-bg-base/80 backdrop-blur-md border-b border-white/5 px-4 md:px-6 py-4 flex items-center gap-4">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden text-text-secondary hover:text-white">
            <Menu className="w-5 h-5" />
          </button>
          <h2 className="font-display font-bold text-lg tracking-wider uppercase text-white truncate">
            {getPageTitle(pathname, user.role)}
          </h2>
          <div className="flex-1" />
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-widest hidden sm:block">
              {user.name}
            </span>
            <div className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center font-bold text-sm">
              {user.name?.charAt(0) || '?'}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

// ── Navigation Config ───────────────────────────────────────

type NavItem = { href: string; label: string; icon: any };

function navFor(role: string): NavItem[] {
  if (role === 'TEACHER') {
    return [
      { href: '/teacher', label: 'Dashboard', icon: BarChart3 },
      { href: '/teacher/students', label: 'My Classes', icon: Users },
      { href: '/teacher/questions', label: 'Question Bank', icon: ScrollText },
      { href: '/teacher/assign', label: 'Assign', icon: Send },
      { href: '/teacher/add-student', label: 'Add Student', icon: UserPlus },
    ];
  }
  if (role === 'SCHOOL') {
    return [
      { href: '/school', label: 'Overview', icon: Building2 },
      { href: '/school/students', label: 'Students', icon: Users },
      { href: '/school/teachers', label: 'Teachers', icon: Users },
      { href: '/school/reports', label: 'Reports', icon: BarChart3 },
      { href: '/school/settings', label: 'Settings', icon: Settings2 },
      { href: '/school/events', label: 'Events', icon: Calendar },
    ];
  }
  return [
    { href: '/admin', label: 'Platform', icon: BarChart3 },
    { href: '/admin/schools', label: 'Schools', icon: Building2 },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/moderation', label: 'Moderation', icon: ScrollText },
  ];
}

// ── Page Title Helper ───────────────────────────────────────

function getPageTitle(pathname: string | null, role: string): string {
  if (!pathname) return 'Dashboard';
  const segments = pathname.split('/').filter(Boolean);
  const last = segments[segments.length - 1];
  const titles: Record<string, string> = {
    teacher: 'Dashboard',
    school: 'School Overview',
    admin: 'Platform Admin',
    students: 'Students',
    teachers: 'Teachers',
    questions: 'Question Bank',
    schools: 'Schools',
    users: 'Users',
    moderation: 'Moderation',
  };
  return titles[last] || last?.charAt(0).toUpperCase() + last?.slice(1) || 'Dashboard';
}
