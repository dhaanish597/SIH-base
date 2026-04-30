'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../providers';
import { useRouter } from 'next/navigation';
import {
  Trophy, Coins, Flame, Star, Gamepad2, Award, ShoppingBag,
  Clock, TrendingUp, LogOut, Edit, ChevronRight
} from 'lucide-react';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [gameHistory, setGameHistory] = useState<any[]>([]);
  const [badges, setBadges] = useState<any[]>([]);

  useEffect(() => {
    // Fetch recent game history
    fetch('/api/games/history?limit=5', { credentials: 'include' })
      .then((r) => r.ok ? r.json() : { sessions: [] })
      .then((data) => setGameHistory(data.sessions || data || []))
      .catch(() => {});

    // Fetch badges
    fetch('/api/badges/me', { credentials: 'include' })
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setBadges(Array.isArray(data) ? data : data.badges || []))
      .catch(() => {});
  }, []);

  // Example badges if none from API
  const displayBadges = badges.length > 0 ? badges : [
    { id: 1, name: 'First Login', icon: '🎮', earned: true },
    { id: 2, name: 'Algebra Slayer', icon: '🗡️', earned: true },
    { id: 3, name: '10 Day Streak', icon: '🔥', earned: true },
    { id: 4, name: 'Quiz Champion', icon: '🏆', earned: true },
    { id: 5, name: 'Science Expert', icon: '🧪', earned: true },
    { id: 6, name: 'Word Master', icon: '📖', earned: true },
    { id: 7, name: 'History Buff', icon: '🏛️', earned: false },
    { id: 8, name: 'Math Legend', icon: '🧮', earned: false },
    { id: 9, name: 'Perfect Score', icon: '💯', earned: false },
    { id: 10, name: 'Social Butterfly', icon: '🦋', earned: false },
    { id: 11, name: 'Code Warrior', icon: '💻', earned: false },
    { id: 12, name: 'All-Rounder', icon: '⭐', earned: false },
  ];

  // Example activity if none from API  
  const displayHistory = gameHistory.length > 0 ? gameHistory : [
    { id: '1', gameType: 'Math Dungeon', score: 3840, xpEarned: 480, description: 'Ch.2 cleared', time: '2 hours ago' },
    { id: '2', gameType: 'Quiz Battle', score: 780, xpEarned: 280, description: 'Won vs Priya', time: 'Yesterday' },
    { id: '3', gameType: 'Word Forge', score: 1200, xpEarned: 200, description: '10 streak', time: 'Yesterday' },
    { id: '4', gameType: 'Science Lab', score: 2100, xpEarned: 320, description: 'Chemistry Lab cleared', time: '2 days ago' },
  ];

  const level = user?.level || 14;
  const getLevelTitle = (l: number) => {
    if (l >= 40) return 'Legend';
    if (l >= 30) return 'Champion';
    if (l >= 20) return 'Expert';
    if (l >= 10) return 'Scholar';
    if (l >= 5) return 'Apprentice';
    return 'Rookie';
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-3xl mx-auto space-y-8 animate-fade-in">
      {/* Profile Hero */}
      <section className="card relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-brand-primary/10 via-transparent to-brand-secondary/10 pointer-events-none" />
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-brand-primary/15 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="relative z-10 p-6 md:p-8">
          {/* Edit button */}
          <button className="absolute top-4 right-4 btn-ghost p-2">
            <Edit className="w-4 h-4 text-text-secondary" />
          </button>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="w-28 h-28 rounded-full bg-bg-elevated border-3 border-brand-primary/50 shadow-glow-primary flex items-center justify-center text-4xl font-bold font-display animate-pulse-slow">
              {user?.name?.charAt(0)?.toUpperCase() || '?'}
            </div>

            <div className="text-center sm:text-left">
              <h1 className="font-display text-3xl font-bold text-text-primary tracking-widest uppercase">
                {user?.name || 'STUDENT'}
              </h1>
              <p className="text-brand-secondary font-bold tracking-wider uppercase text-sm mt-1">
                Level {level} {getLevelTitle(level)} · {user?.class || 'Grade 9'} · Section {user?.class?.slice(-1) || 'A'}
              </p>
              <p className="text-xs text-text-muted mt-1">Member since June 2024</p>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            <StatCard icon={Star} label="XP" value={user?.xp?.toLocaleString() || '3,240'} color="text-brand-primaryGlow" />
            <StatCard icon={Coins} label="Coins" value={user?.totalCoins?.toLocaleString() || '840'} color="text-accent-gold" />
            <StatCard icon={Gamepad2} label="Games" value="47" color="text-brand-secondary" />
            <StatCard icon={Award} label="Badges" value={`${displayBadges.filter((b: any) => b.earned !== false).length}`} color="text-accent-pink" />
          </div>

          {/* Streak */}
          <div className="flex flex-wrap gap-4 mt-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-gold/10 border border-accent-gold/20">
              <Flame className="w-4 h-4 text-accent-gold" />
              <span className="text-xs font-bold text-accent-gold">Longest streak: 18 days</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-gold/10 border border-accent-gold/20">
              <Flame className="w-4 h-4 text-accent-gold animate-bounce-subtle" />
              <span className="text-xs font-bold text-accent-gold">Current: {user?.streakDays || 12} days 🔥</span>
            </div>
          </div>
        </div>
      </section>

      {/* Badges Section */}
      <section className="card p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-lg font-bold tracking-widest uppercase text-text-primary">
            BADGES
          </h2>
          <Link href="/student/badges" className="text-xs font-bold text-brand-primary hover:text-brand-primaryGlow uppercase tracking-wider flex items-center gap-1">
            View All <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {displayBadges.map((badge: any, i: number) => (
            <div
              key={badge.id || i}
              className={`flex-shrink-0 w-16 h-16 rounded-xl border flex items-center justify-center text-2xl transition-all duration-200 ${
                badge.earned !== false
                  ? 'bg-accent-gold/10 border-accent-gold/30 shadow-glow-gold hover:scale-110 cursor-pointer'
                  : 'bg-bg-elevated border-white/5 opacity-40 grayscale'
              }`}
              title={badge.name}
            >
              {badge.earned !== false ? (badge.icon || '🏅') : '🔒'}
            </div>
          ))}
        </div>
      </section>

      {/* Recent Activity */}
      <section className="card p-6 md:p-8">
        <h2 className="font-display text-lg font-bold tracking-widest uppercase text-text-primary mb-6">
          RECENT ACTIVITY
        </h2>
        <div className="space-y-3">
          {displayHistory.map((activity: any, i: number) => (
            <div key={activity.id || i} className="flex items-center gap-4 p-3 bg-bg-elevated rounded-xl border border-white/5 hover:border-white/10 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center flex-shrink-0">
                <Gamepad2 className="w-5 h-5 text-brand-primaryGlow" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-text-primary truncate">
                  {activity.gameType} — {activity.description}
                </p>
                <p className="text-[10px] text-text-muted mt-0.5">
                  {activity.time || new Date(activity.startedAt).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs font-bold text-accent-gold font-mono">+{activity.xpEarned} XP</p>
                <p className="text-[10px] text-text-muted font-mono">{activity.score?.toLocaleString()} pts</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/student/shop" className="card p-4 flex items-center gap-3 group hover:border-accent-gold/30">
          <ShoppingBag className="w-5 h-5 text-accent-gold" />
          <div>
            <p className="text-sm font-bold text-text-primary group-hover:text-accent-gold transition-colors">Avatar Shop</p>
            <p className="text-[10px] text-text-muted">Spend your coins</p>
          </div>
          <ChevronRight className="w-4 h-4 text-text-muted ml-auto" />
        </Link>
        <button
          onClick={async () => { await logout(); router.replace('/login'); }}
          className="card p-4 flex items-center gap-3 group hover:border-accent-red/30"
        >
          <LogOut className="w-5 h-5 text-accent-red" />
          <div className="text-left">
            <p className="text-sm font-bold text-text-primary group-hover:text-accent-red transition-colors">Sign Out</p>
            <p className="text-[10px] text-text-muted">End session</p>
          </div>
        </button>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  return (
    <div className="bg-bg-elevated p-3 rounded-xl border border-white/5 text-center">
      <Icon className={`w-5 h-5 ${color} mx-auto mb-1`} />
      <p className={`font-mono font-bold text-lg ${color}`}>{value}</p>
      <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">{label}</p>
    </div>
  );
}
