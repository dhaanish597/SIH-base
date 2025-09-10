import React, { useEffect, useState } from 'react';

interface LeaderboardItem {
  rank: number;
  name: string;
  class: string;
  points: number;
}

export function Leaderboard() {
  const [data, setData] = useState<LeaderboardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/leaderboard');
        if (!res.ok) throw new Error('Failed to fetch leaderboard');
        const json = await res.json();
        // Normalize potential sample format
        const normalized: LeaderboardItem[] = json.map((item: any, idx: number) => ({
          rank: item.rank ?? idx + 1,
          name: item.name,
          class: item.class ?? item.className ?? '-',
          points: item.points ?? item.total_points ?? item.score ?? 0
        }));
        setData(normalized);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Leaderboard</h2>
      <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {data.map((item) => (
              <tr key={`${item.rank}-${item.name}`} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-900 font-semibold">{item.rank}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{item.name}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{item.class}</td>
                <td className="px-4 py-3 text-sm text-gray-900 font-medium">{item.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


