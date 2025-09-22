import React, { useEffect, useMemo, useState } from 'react';

type Props = { userId: string };

type BadgeInfo = {
  points: number;
  badge: 'Beginner' | 'Learner' | 'Achiever' | 'Champion' | string;
  lastLogin?: string | null;
};

function getNextThreshold(points: number) {
  if (points >= 300) return { nextAt: 300, label: 'Champion' };
  if (points >= 150) return { nextAt: 300, label: 'Champion' };
  if (points >= 50) return { nextAt: 150, label: 'Achiever' };
  return { nextAt: 50, label: 'Learner' };
}

function getCurrentFloor(points: number) {
  if (points >= 300) return 300;
  if (points >= 150) return 150;
  if (points >= 50) return 50;
  return 0;
}

export function BadgeDisplay({ userId }: Props) {
  const [data, setData] = useState<BadgeInfo | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/get-badge/${encodeURIComponent(userId)}`, { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) refresh();
    const onSignal = () => refresh();
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'badge_update') refresh();
    };
    window.addEventListener('badge-updated', onSignal as EventListener);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('badge-updated', onSignal as EventListener);
      window.removeEventListener('storage', onStorage);
    };
  }, [userId]);

  const progress = useMemo(() => {
    const points = data?.points || 0;
    const floor = getCurrentFloor(points);
    const { nextAt } = getNextThreshold(points);
    const span = Math.max(nextAt - floor, 1);
    const current = Math.min(points - floor, span);
    const pct = Math.max(0, Math.min(100, Math.round((current / span) * 100)));
    return { pct, current, nextAt };
  }, [data]);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-responsive-lg font-bold text-gray-900">Your Badge</h2>
        <button
          onClick={refresh}
          className="px-3 py-1 text-sm rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
          aria-label="Refresh badge"
        >
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>
      <div className="flex items-center gap-4">
        <div className="shrink-0 w-14 h-14 rounded-full bg-yellow-100 border-2 border-yellow-300 flex items-center justify-center text-yellow-800 text-xl font-extrabold" aria-label={`Current badge ${data?.badge || 'Beginner'}`}>
          {data?.badge?.[0] || 'B'}
        </div>
        <div className="flex-1">
          <div className="text-gray-900 font-semibold">{data?.badge || 'Beginner'}</div>
          <div className="text-gray-600 text-sm">{(data?.points ?? 0)} points</div>
          <div className="mt-2">
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress.pct} aria-label="Progress to next badge">
              <div className="h-2 bg-yellow-400" style={{ width: `${progress.pct}%` }} />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{Math.max(getCurrentFloor(data?.points || 0), 0)} pts</span>
              <span>Next: {progress.nextAt} pts</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BadgeDisplay;


