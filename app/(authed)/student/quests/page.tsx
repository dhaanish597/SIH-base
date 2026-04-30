'use client';

import { useEffect, useState } from 'react';
import { ScrollText, Check, Clock, Star, Coins, Target, Flame, ChevronRight } from 'lucide-react';

type Quest = {
  id: string;
  questKey: string;
  title: string;
  description: string;
  type: string;
  progress: number;
  goalCount: number;
  status: string;
  rewardXp: number;
  rewardCoins: number;
  completedAt: string | null;
};

type Tab = 'active' | 'completed';

export default function QuestsPage() {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('active');

  useEffect(() => {
    (async () => {
      const r = await fetch('/api/quests/me', { credentials: 'include' });
      if (r.ok) setQuests(await r.json());
      setLoading(false);
    })();
  }, []);

  const active = quests.filter((q) => q.status === 'ACTIVE');
  const completed = quests.filter((q) => q.status === 'COMPLETED');
  const daily = (tab === 'active' ? active : completed).filter((q) => q.type === 'DAILY');
  const weekly = (tab === 'active' ? active : completed).filter((q) => q.type === 'WEEKLY');
  const special = (tab === 'active' ? active : completed).filter((q) => q.type !== 'DAILY' && q.type !== 'WEEKLY');

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto space-y-6 animate-fade-in">
      <header>
        <h1 className="font-display text-2xl font-bold text-gray-900 flex items-center gap-2.5">
          <ScrollText className="w-6 h-6 text-indigo-600" />
          Quests
        </h1>
        <p className="text-sm text-gray-400 mt-1">Complete quests to earn XP and coins</p>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="stat-card text-center">
          <Target className="w-5 h-5 text-indigo-500 mx-auto mb-1" />
          <p className="text-xl font-bold text-gray-900 tabular-nums">{active.length}</p>
          <p className="text-[10px] text-gray-400">Active</p>
        </div>
        <div className="stat-card text-center">
          <Check className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
          <p className="text-xl font-bold text-gray-900 tabular-nums">{completed.length}</p>
          <p className="text-[10px] text-gray-400">Completed</p>
        </div>
        <div className="stat-card text-center">
          <Star className="w-5 h-5 text-amber-500 mx-auto mb-1" />
          <p className="text-xl font-bold text-gray-900 tabular-nums">{completed.reduce((s, q) => s + q.rewardXp, 0)}</p>
          <p className="text-[10px] text-gray-400">XP Earned</p>
        </div>
      </div>

      {/* Tab selector */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
        <button
          onClick={() => setTab('active')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${tab === 'active' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Active ({active.length})
        </button>
        <button
          onClick={() => setTab('completed')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${tab === 'completed' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Completed ({completed.length})
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-20" />)}
        </div>
      ) : (
        <>
          <QuestSection title="Daily" icon={Flame} items={daily} />
          <QuestSection title="Weekly" icon={Clock} items={weekly} />
          {special.length > 0 && <QuestSection title="Special" icon={Star} items={special} />}
          {daily.length === 0 && weekly.length === 0 && special.length === 0 && (
            <div className="card p-10 text-center">
              <Target className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-400">
                {tab === 'active' ? 'No active quests. Play a game to start new quests!' : 'No completed quests yet.'}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function QuestSection({ title, icon: Icon, items }: { title: string; icon: any; items: Quest[] }) {
  if (items.length === 0) return null;
  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-gray-400" />
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{title}</h2>
      </div>
      <div className="space-y-2">
        {items.map((q) => {
          const pct = Math.min(100, (q.progress / q.goalCount) * 100);
          const isDone = q.status === 'COMPLETED';
          return (
            <div
              key={q.id || q.questKey}
              className={`card p-4 flex items-center gap-4 ${isDone ? 'bg-emerald-50/50 border-emerald-100' : ''}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isDone ? 'bg-emerald-100' : 'bg-indigo-100'}`}>
                {isDone ? <Check className="w-5 h-5 text-emerald-600" /> : <Target className="w-5 h-5 text-indigo-600" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-900 truncate">{q.title}</p>
                  {isDone && <span className="badge badge-success text-[10px]">Done!</span>}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{q.description}</p>
                <div className="mt-2">
                  <div className="progress-track">
                    <div className={`progress-fill ${isDone ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-gray-500 tabular-nums">{q.progress}/{q.goalCount}</span>
                  </div>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs font-bold text-amber-600 tabular-nums">+{q.rewardXp} XP</p>
                <p className="text-xs font-bold text-emerald-600 tabular-nums">+{q.rewardCoins} <Coins className="w-3 h-3 inline" /></p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
