'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../../providers';
import { Trophy, Medal, Award, Crown, Star, Flame, TrendingUp, Gamepad2 } from 'lucide-react';

type Row = { id: string; name: string; class: string; points: number; level: number; rank: number; xp?: number; streakDays?: number; gamesPlayed?: number };
type Tab = 'points' | 'xp' | 'streak';
type Scope = 'class' | 'grade' | 'school';

const exampleData: Row[] = [
  { id: 'ex1', name: 'Priya S.', class: '9A', points: 4820, level: 18, rank: 1, xp: 4820, streakDays: 14, gamesPlayed: 42 },
  { id: 'ex2', name: 'Rahul M.', class: '9B', points: 4210, level: 16, rank: 2, xp: 4210, streakDays: 9, gamesPlayed: 38 },
  { id: 'ex3', name: 'You', class: '9A', points: 3240, level: 14, rank: 3, xp: 3240, streakDays: 12, gamesPlayed: 28 },
  { id: 'ex4', name: 'Divya K.', class: '10A', points: 2980, level: 13, rank: 4, xp: 2980, streakDays: 7, gamesPlayed: 28 },
  { id: 'ex5', name: 'Arun P.', class: '9A', points: 2720, level: 12, rank: 5, xp: 2720, streakDays: 3, gamesPlayed: 22 },
  { id: 'ex6', name: 'Meera S.', class: '9B', points: 2410, level: 11, rank: 6, xp: 2410, streakDays: 14, gamesPlayed: 19 },
  { id: 'ex7', name: 'Kiran T.', class: '10B', points: 2180, level: 10, rank: 7, xp: 2180, streakDays: 5, gamesPlayed: 16 },
  { id: 'ex8', name: 'Sneha R.', class: '9A', points: 1950, level: 9, rank: 8, xp: 1950, streakDays: 2, gamesPlayed: 14 },
];

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>(exampleData);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<Tab>('points');
  const [scope, setScope] = useState<Scope>('school');
  const [myRank, setMyRank] = useState<Row | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`/api/leaderboard?scope=${scope}&limit=30&sort=${tab}`, { credentials: 'include' });
        if (r.ok && !cancelled) {
          const data = await r.json();
          const apiEntries = Array.isArray(data) ? data : data.entries || [];
          if (apiEntries.length >= 3) {
            // Enough real data — use it directly
            setRows(apiEntries);
            const me = apiEntries.find((e: Row) => e.id === user?.id);
            setMyRank(me || null);
          } else {
            // Not enough real data — merge with examples
            // Put real user at rank 3 for immersion, fill rest with examples
            const merged = [
              ...exampleData.slice(0, 2),                     // Top 2 from examples
              ...(apiEntries.length > 0 ? [{ ...apiEntries[0], rank: 3 }] : [exampleData[2]]),  // Real user at #3 or example
              ...exampleData.slice(3),                        // Rest of examples
            ];
            setRows(merged);
            const me = merged.find((e: Row) => e.id === user?.id || e.name === user?.name);
            setMyRank(me || null);
          }
        }
      } catch {
        // Keep example data on error
      }
    })();
    return () => { cancelled = true; };
  }, [tab, scope, user?.id]);

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: 'points', label: 'This Week', icon: Star },
    { key: 'xp', label: 'All Time', icon: TrendingUp },
    { key: 'streak', label: 'By Subject', icon: Flame },
  ];

  const scopes: { key: Scope; label: string }[] = [
    { key: 'class', label: 'Your Class' },
    { key: 'grade', label: 'Your Grade' },
    { key: 'school', label: 'Whole School' },
  ];

  const displayTop3 = rows.slice(0, 3);
  const displayRest = rows.slice(3);

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-3xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <header className="relative">
        <div className="absolute -top-10 -right-10 w-[300px] h-[300px] bg-accent-gold/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative z-10">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-text-primary tracking-widest uppercase flex items-center gap-3">
            🏆 LEADERBOARD
          </h1>
          <p className="text-sm text-text-secondary mt-2">🏫 Your School Only · Updated live</p>
        </div>
      </header>

      {/* Time Period Tabs */}
      <div className="flex gap-1 p-1 bg-bg-overlay rounded-xl border border-white/5">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200
                ${tab === t.key ? 'bg-brand-primary text-white shadow-glow-sm' : 'text-text-secondary hover:text-text-primary hover:bg-white/5'}`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Scope Tabs */}
      <div className="flex gap-2 justify-center">
        {scopes.map((s) => (
          <button
            key={s.key}
            onClick={() => setScope(s.key)}
            className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all duration-200 border
              ${scope === s.key
                ? 'bg-bg-elevated text-text-primary border-brand-primary/50'
                : 'text-text-muted border-white/5 hover:text-text-secondary hover:border-white/10'
              }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-16" />)}
        </div>
      ) : (
        <>
          {/* Top 3 Podium */}
          {displayTop3.length >= 3 && (
            <div className="grid grid-cols-3 gap-3 items-end pt-4">
              {/* 2nd Place */}
              <PodiumCard rank={2} row={displayTop3[1]} isMe={displayTop3[1].id === user?.id || displayTop3[1].name === user?.name} tab={tab} />
              {/* 1st Place */}
              <PodiumCard rank={1} row={displayTop3[0]} isMe={displayTop3[0].id === user?.id} tab={tab} />
              {/* 3rd Place */}
              <PodiumCard rank={3} row={displayTop3[2]} isMe={displayTop3[2].id === user?.id || displayTop3[2].name === user?.name} tab={tab} />
            </div>
          )}

          {/* Rest of the list */}
          <div className="card overflow-hidden divide-y divide-white/5">
            <div className="grid grid-cols-[40px_40px_1fr_80px_60px] gap-3 p-3 text-[10px] font-bold text-text-muted uppercase tracking-widest">
              <span>Rank</span>
              <span></span>
              <span>Player</span>
              <span className="text-right">XP</span>
              <span className="text-right">Streak</span>
            </div>
            {displayRest.map((r) => {
              const isMe = r.id === user?.id || r.name === user?.name;
              return (
                <div key={r.id} className={`grid grid-cols-[40px_40px_1fr_80px_60px] gap-3 items-center p-3.5 transition-colors ${isMe ? 'bg-brand-primary/10 border-l-2 border-l-brand-primary' : 'hover:bg-white/[0.02]'}`}>
                  <span className="font-mono font-bold text-text-muted text-sm text-center">
                    #{r.rank}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {r.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm font-bold truncate ${isMe ? 'text-brand-primaryGlow' : 'text-text-primary'}`}>
                      {r.name} {isMe && <span className="text-[10px] text-brand-primary">(YOU)</span>}
                    </p>
                    <p className="text-[10px] text-text-muted font-mono">Lv.{r.level}</p>
                  </div>
                  <p className="text-sm font-bold text-accent-gold tabular-nums text-right font-mono">
                    {getDisplayValue(r, tab)}
                  </p>
                  <p className="text-xs text-text-secondary text-right">
                    🔥 {r.streakDays ?? 0}
                  </p>
                </div>
              );
            })}
          </div>

          {/* My rank card (if not visible in list) */}
          {myRank && !displayRest.find((r) => r.id === user?.id) && !displayTop3.find((r) => r.id === user?.id) && (
            <div className="card p-4 bg-brand-primary/10 border-brand-primary/30 shadow-glow-sm">
              <p className="text-[10px] text-text-secondary mb-2 font-bold uppercase tracking-wider">Your rank</p>
              <div className="flex items-center gap-3">
                <span className="font-display text-2xl font-bold text-brand-primaryGlow tabular-nums">#{myRank.rank}</span>
                <div>
                  <p className="font-bold text-text-primary">{myRank.name}</p>
                  <p className="text-xs text-text-secondary font-mono">{getDisplayValue(myRank, tab)} · Lv.{myRank.level}</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Podium Card ──

function PodiumCard({ rank, row, isMe, tab }: { rank: number; row: Row; isMe: boolean; tab: Tab }) {
  const heights = { 1: 'h-28', 2: 'h-20', 3: 'h-16' } as Record<number, string>;
  const gradients = {
    1: 'from-amber-400 via-yellow-500 to-amber-600',
    2: 'from-gray-300 via-gray-400 to-gray-500',
    3: 'from-orange-400 via-orange-500 to-amber-600',
  } as Record<number, string>;
  const glows = {
    1: 'shadow-[0_0_30px_rgba(245,158,11,0.5)]',
    2: 'shadow-[0_0_20px_rgba(148,163,184,0.3)]',
    3: 'shadow-[0_0_20px_rgba(249,115,22,0.3)]',
  } as Record<number, string>;
  const icons = { 1: Crown, 2: Medal, 3: Award } as Record<number, any>;
  const Icon = icons[rank];
  const avatarSize = rank === 1 ? 'w-16 h-16' : 'w-12 h-12';

  return (
    <div className={`flex flex-col items-center ${rank === 1 ? 'order-1 col-start-2 -mt-4' : rank === 2 ? 'order-0' : 'order-2'}`}>
      <div className={`${avatarSize} rounded-full bg-gradient-to-br ${gradients[rank]} flex items-center justify-center ${glows[rank]} mb-2 ${isMe ? 'ring-2 ring-brand-primary ring-offset-2 ring-offset-bg-base' : ''}`}>
        <span className="text-white font-bold text-sm drop-shadow-md">{row.name?.charAt(0)?.toUpperCase()}</span>
      </div>
      <p className={`text-xs font-bold truncate max-w-full ${isMe ? 'text-brand-primaryGlow' : 'text-text-primary'}`}>
        {row.name?.split(' ')[0]}
      </p>
      <p className="text-[10px] text-accent-gold tabular-nums font-mono font-bold">{getDisplayValue(row, tab)}</p>
      <div className={`${heights[rank]} w-full mt-2 rounded-t-xl bg-gradient-to-t ${gradients[rank]} flex items-start justify-center pt-3 border border-white/20`}>
        <Icon className="w-5 h-5 text-white/90 drop-shadow-md" />
      </div>
    </div>
  );
}

function getDisplayValue(row: Row, tab: Tab): string {
  if (tab === 'xp') return `${row.xp ?? row.points} XP`;
  if (tab === 'streak') return `${row.streakDays ?? 0}d 🔥`;
  return `${row.points} pts`;
}
