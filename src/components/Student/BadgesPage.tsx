import React, { useEffect, useState } from 'react';

type BadgeInfo = {
  points: number;
  badge: 'Beginner' | 'Learner' | 'Achiever' | 'Champion' | string;
  lastLogin?: string | null;
};

type BadgeDef = {
  key: 'Beginner' | 'Learner' | 'Achiever' | 'Champion';
  threshold: number;
  image: string;
  description: string;
};

const BADGES: BadgeDef[] = [
  { key: 'Beginner',  threshold: 0,   image: '/badges/beginner.svg',  description: 'Welcome to your learning journey!' },
  { key: 'Learner',   threshold: 50,  image: '/badges/learner.svg',   description: 'Consistent effort pays off.' },
  { key: 'Achiever',  threshold: 150, image: '/badges/achiever.svg',  description: 'Great work achieving high scores!' },
  { key: 'Champion',  threshold: 300, image: '/badges/champion.svg',  description: 'Top of the leaderboard material!' },
];

export function BadgesPage() {
  const [data, setData] = useState<BadgeInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userId = (() => {
    try {
      const raw = localStorage.getItem('stem_user');
      if (!raw) return '';
      const u = JSON.parse(raw);
      return u?.id || '';
    } catch { return ''; }
  })();

  const refresh = async () => {
    if (!userId) {
      setError('No user found. Please log in again.');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('stem_token');
      const res = await fetch(`/api/get-badge/${encodeURIComponent(userId)}`, {
        cache: 'no-store',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`${res.status} ${txt}`);
      }
      const json = await res.json();
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load badges');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  useEffect(() => {
    const onCompleted = () => refresh();
    window.addEventListener('quiz:completed', onCompleted);
    return () => window.removeEventListener('quiz:completed', onCompleted);
  }, []);

  const points = data?.points || 0;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Badges</h2>
          <p className="text-gray-600">Earn badges by learning daily, answering quizzes correctly, and completing assessments.</p>
        </div>
        <button
          onClick={refresh}
          className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
        >{loading ? 'Refreshing…' : 'Refresh'}</button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 border border-red-200">{error}</div>
      )}

      <div className="mb-6">
        <div className="text-gray-800 font-medium">Total Points: <span className="font-bold">{points}</span></div>
        <div className="text-gray-600">Current Badge: <span className="font-semibold">{data?.badge || 'Beginner'}</span></div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {BADGES.map((b) => {
          const earned = points >= b.threshold;
          return (
            <div key={b.key} className={`bg-white rounded-xl p-4 shadow-md border ${earned ? 'border-green-200' : 'border-gray-100'}`}>
              <div className="aspect-square w-full mb-3 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                <img
                  src={b.image}
                  alt={`${b.key} badge`}
                  width="128"
                  height="128"
                  loading="lazy"
                  decoding="async"
                  className={`w-32 h-32 ${earned ? '' : 'grayscale opacity-60'}`}
                />
              </div>
              <div className="text-lg font-semibold text-gray-900">{b.key}</div>
              <div className="text-sm text-gray-600">{b.description}</div>
              <div className="text-xs text-gray-500 mt-1">Unlocks at {b.threshold} pts</div>
              {earned && (
                <div className="mt-2 inline-block text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 border border-green-200">Earned</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default BadgesPage;


