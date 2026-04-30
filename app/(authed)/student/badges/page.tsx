'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../../providers';
import { Award, Star, Coins, Trophy, Crown, Shield, Target, Lock, Calendar } from 'lucide-react';

type EarnedBadge = {
  key: string;
  name: string;
  description: string;
  type: string;
  iconUrl: string | null;
  earnedAt: string;
};

type BadgesData = {
  points: number;
  coins: number;
  level: number;
  xp: number;
  badge: string;
  earnedBadges: EarnedBadge[];
};

const TIER_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any; gradient: string }> = {
  champion: { label: 'Champion', color: 'text-amber-700', bg: 'bg-amber-50', icon: Crown, gradient: 'from-amber-400 to-yellow-500' },
  achiever: { label: 'Achiever', color: 'text-indigo-700', bg: 'bg-indigo-50', icon: Star, gradient: 'from-indigo-400 to-purple-500' },
  learner: { label: 'Learner', color: 'text-emerald-700', bg: 'bg-emerald-50', icon: Target, gradient: 'from-emerald-400 to-teal-500' },
  beginner: { label: 'Beginner', color: 'text-gray-700', bg: 'bg-gray-50', icon: Shield, gradient: 'from-gray-400 to-gray-500' },
};

export default function BadgesPage() {
  const { user } = useAuth();
  const [data, setData] = useState<BadgesData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const r = await fetch('/api/badges/me', { credentials: 'include' });
      if (r.ok) setData(await r.json());
      setLoading(false);
    })();
  }, []);

  const tier = data ? (TIER_CONFIG[data.badge] ?? TIER_CONFIG.beginner) : TIER_CONFIG.beginner;
  const TierIcon = tier.icon;

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto space-y-6 animate-fade-in">
      <header>
        <h1 className="font-display text-2xl font-bold text-gray-900 flex items-center gap-2.5">
          <Award className="w-6 h-6 text-indigo-600" />
          Badges & Achievements
        </h1>
        <p className="text-sm text-gray-400 mt-1">Collect badges by completing challenges and reaching milestones</p>
      </header>

      {loading ? (
        <div className="space-y-4">
          <div className="skeleton h-36" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-24" />)}
          </div>
        </div>
      ) : data ? (
        <>
          {/* Rank Tier Card */}
          <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${tier.gradient} p-6 text-white`}>
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
            <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-white/5 rounded-full blur-xl" />
            <div className="relative z-10 flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                <TierIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="text-white/70 text-sm">Current Rank</p>
                <h2 className="font-display text-2xl font-bold">{tier.label}</h2>
                <p className="text-white/60 text-xs mt-0.5">Level {data.level} · {data.xp} XP</p>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 stagger-children">
            <StatCard icon={Star} label="Level" value={String(data.level)} color="indigo" />
            <StatCard icon={Trophy} label="Total XP" value={formatNum(data.xp)} color="amber" />
            <StatCard icon={Coins} label="Coins" value={formatNum(data.coins)} color="emerald" />
            <StatCard icon={Award} label="Badges" value={String(data.earnedBadges.length)} color="rose" />
          </div>

          {/* Earned Badges */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="font-display text-lg font-bold text-gray-900">Earned Badges</h2>
              <span className="badge badge-primary">{data.earnedBadges.length}</span>
            </div>
            {data.earnedBadges.length === 0 ? (
              <div className="card p-10 text-center">
                <Award className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-400">No badges yet. Complete quests and games to earn them!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 stagger-children">
                {data.earnedBadges.map((b) => (
                  <div key={b.key} className="card p-4 flex items-center gap-4 group hover:-translate-y-0.5">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                      {b.iconUrl ? (
                        <img src={b.iconUrl} alt={b.name} className="w-8 h-8 object-contain" />
                      ) : (
                        <Award className="w-7 h-7 text-indigo-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{b.name}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-2">{b.description}</p>
                      <div className="flex items-center gap-1 mt-1.5 text-[10px] text-gray-300">
                        <Calendar className="w-3 h-3" />
                        {new Date(b.earnedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      ) : (
        <div className="card p-10 text-center">
          <Award className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-400">Could not load badges. Please try again later.</p>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  const colorMap: Record<string, { iconBg: string; iconText: string }> = {
    indigo: { iconBg: 'bg-indigo-100', iconText: 'text-indigo-600' },
    amber: { iconBg: 'bg-amber-100', iconText: 'text-amber-600' },
    emerald: { iconBg: 'bg-emerald-100', iconText: 'text-emerald-600' },
    rose: { iconBg: 'bg-rose-100', iconText: 'text-rose-600' },
  };
  const c = colorMap[color] || colorMap.indigo;
  return (
    <div className="stat-card">
      <div className={`w-10 h-10 rounded-xl ${c.iconBg} flex items-center justify-center mb-2`}>
        <Icon className={`w-5 h-5 ${c.iconText}`} />
      </div>
      <p className="text-2xl font-bold text-gray-900 tabular-nums">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}
