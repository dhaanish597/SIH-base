import { useState, useEffect } from 'react';
import { Trophy, Medal, Award, Users, AlertCircle } from 'lucide-react';

interface LeaderboardEntry {
  id: string;
  name: string;
  class: string;
  points: number;
  rank: number;
}

interface LeaderboardProps {
  isUserDataLoading: boolean;
  userClass?: string;
}

export function Leaderboard({ isUserDataLoading, userClass }: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If user data is still loading, show loading state
    if (isUserDataLoading) {
      setIsLoading(true);
      setError(null);
      return;
    }

    // If user data has loaded but no class is available, show error
    if (!userClass || userClass.trim() === '') {
      setError('Unable to identify student grade. Please contact support.');
      setIsLoading(false);
      return;
    }

    // If we have the user class, fetch the leaderboard
    fetchLeaderboard();
  }, [isUserDataLoading, userClass]);

  useEffect(() => {
    const onCompleted = () => fetchLeaderboard();
    window.addEventListener('quiz:completed', onCompleted);
    return () => window.removeEventListener('quiz:completed', onCompleted);
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Ensure we have the user's class before making the request
      if (!userClass) {
        throw new Error('Student grade not identified');
      }
      
      const token = localStorage.getItem('stem_token');
      if (token && token !== 'demo_token') {
        const url = `/api/leaderboard?class=${userClass}`;
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to fetch leaderboard: ${response.status} ${errorText}`);
        }
        const data = await response.json();
        setLeaderboard(data);
      } else {
        // Offline fallback: build minimal leaderboard from local progress
        const localPoints = Number(localStorage.getItem('offline_points') || '0');
        const userRaw = localStorage.getItem('stem_user');
        const u = userRaw ? JSON.parse(userRaw) : { id: 'demo', name: 'You', class: userClass };
        setLeaderboard([{ id: u.id, name: u.name || 'You', class: u.class || userClass || '-', points: localPoints, rank: 1 }]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load leaderboard';
      setError(errorMessage);
      console.error('Error fetching leaderboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Award className="w-6 h-6 text-amber-600" />;
    return <span className="w-6 h-6 flex items-center justify-center text-sm font-bold text-gray-500">#{rank}</span>;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200';
    if (rank === 2) return 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200';
    if (rank === 3) return 'bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200';
    return 'bg-white border-gray-200';
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl p-8 shadow-md border border-gray-100">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {isUserDataLoading ? 'Loading user data...' : 'Loading leaderboard...'}
          </h3>
          <p className="text-gray-600 text-center">
            {isUserDataLoading 
              ? 'Please wait while we load your profile information.'
              : 'Fetching rankings for your grade...'
            }
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white rounded-xl p-8 shadow-md border border-gray-100">
        <div className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Leaderboard</h3>
          <p className="text-red-600 text-center">{error}</p>
          <button 
            onClick={fetchLeaderboard}
            className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Main leaderboard content
  return (
    <div className="bg-white rounded-xl p-8 shadow-md border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Trophy className="w-8 h-8 text-yellow-500" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Leaderboard</h2>
            {userClass && (
              <p className="text-sm text-gray-600 mt-1">
                Showing rankings for Grade {userClass} students only
              </p>
            )}
          </div>
        </div>
        {userClass && (
          <div className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium">
            Grade {userClass}
          </div>
        )}
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-500" />
          Grade {userClass} Student Rankings
        </h3>
      </div>

      {leaderboard.length === 0 ? (
        <div className="text-center py-12">
          <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Rankings Yet</h3>
          <p className="text-gray-600">
            {userClass 
              ? `No students from Grade ${userClass} have completed lessons yet. Complete some lessons to appear on the leaderboard!`
              : 'Complete some lessons to appear on the leaderboard!'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {leaderboard.map((entry) => (
            <div
              key={entry.id}
              className={`flex items-center justify-between p-4 rounded-lg border ${getRankColor(entry.rank)} ${entry.id === (JSON.parse(localStorage.getItem('stem_user')||'{}').id) ? 'ring-2 ring-indigo-400' : ''}`}
            >
              <div className="flex items-center gap-4">
                {getRankIcon(entry.rank)}
                <div>
                  <p className="font-semibold text-gray-900">{entry.name}</p>
                  <p className="text-sm text-gray-500">Class {entry.class}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-indigo-600">{entry.points}</p>
                <p className="text-sm text-gray-500">points</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}