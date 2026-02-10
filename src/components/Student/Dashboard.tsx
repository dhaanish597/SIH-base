import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { 
  Target, 
  Flame, 
  Trophy, 
  BookOpen, 
  Brain,
  Star,
  TrendingUp,
  Calendar,
  Zap,
  Sparkles,
  RefreshCw,
  Clock
} from 'lucide-react';
import { useUserStats, useUserProgress } from '../../hooks/useIndexedDB';

interface DashboardProps {
  userId: string;
  userName: string;
}

// Local type to describe user progress items to avoid `never` inference
type ProgressItem = {
  id: string;
  userId: string;
  lessonId: string;
  completed: boolean;
  score: number;
  timeSpent: number;
  completedAt: string | Date;
  synced: boolean;
};

type UserProgressItem = {
  id: string;
  userId: string;
  lessonId: string;
  completed: boolean;
  score: number;
  timeSpent: number;
  completedAt: string | Date;
  synced: boolean;
};

type Recommendation = {
  type: 'lesson' | 'quiz';
  id: string;
  title: string;
  subject: string;
  chapter: string | null;
  reason: string;
  priority_score: number;
  estimatedTime: number;
  difficulty?: number;
  lesson_id?: string;
};

export function StudentDashboard({ userId, userName }: DashboardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { stats, loading: statsLoading } = useUserStats();
  const { progress, loading: progressLoading } = useUserProgress(userId);
  const typedProgress = (progress as unknown as ProgressItem[]) || [];
  const [greeting, setGreeting] = useState('');
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 17) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  const fetchRecommendations = async (showLoading = true) => {
    try {
      if (showLoading) {
        setRecommendationsLoading(true);
      }
      const token = localStorage.getItem('stem_token');
      if (!token) {
        setRecommendationsLoading(false);
        return;
      }

      const response = await fetch('/api/recommendations?limit=3', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setRecommendations(result.data);
          setLastUpdated(new Date());
        }
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setRecommendationsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchRecommendations();

    // Set up periodic refresh every 30 seconds
    refreshIntervalRef.current = setInterval(() => {
      fetchRecommendations(false); // Don't show loading spinner on auto-refresh
    }, 30000);

    // Cleanup interval on unmount
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  const handleManualRefresh = () => {
    setRefreshing(true);
    fetchRecommendations();
  };

  const handleRecommendationClick = (rec: Recommendation) => {
    if (rec.type === 'lesson') {
      // Navigate to lessons page, optionally filter by subject
      if (rec.subject) {
        const subjectLower = rec.subject.toLowerCase();
        navigate(`/lessons/${subjectLower}`);
      } else {
        navigate('/lessons');
      }
    } else if (rec.type === 'quiz') {
      // Navigate to quiz selection with pre-selected subject/chapter
      const currentUser = JSON.parse(localStorage.getItem('stem_user') || '{}');
      const userGrade = currentUser.class || '9';
      const subject = rec.subject || 'Mathematics';
      const chapter = rec.chapter || '';
      
      // Navigate to quiz selection page
      navigate(`/quizzes?subject=${encodeURIComponent(subject)}&chapter=${encodeURIComponent(chapter)}`);
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffMs / 60000);

    if (diffSecs < 10) return 'just now';
    if (diffSecs < 60) return `${diffSecs}s ago`;
    if (diffMins < 60) return `${diffMins}m ago`;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (statsLoading || progressLoading) {
    return (
      <div className="flex items-center justify-center h-64" role="status" aria-label="Loading dashboard">
        <div className="spinner h-12 w-12" aria-hidden="true"></div>
        <span className="sr-only">Loading your dashboard...</span>
      </div>
    );
  }

  const completedLessons = typedProgress.filter(p => p.completed).length;
  const totalScore = typedProgress.reduce((sum, p) => sum + p.score, 0);
  const avgScore = completedLessons > 0 ? Math.round(totalScore / completedLessons) : 0;

  return (
    <main className="container-responsive py-4 sm:py-6 space-responsive safe-bottom" role="main" aria-labelledby="dashboard-heading">
      {/* Welcome Header */}
      <section className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-4 sm:p-6 text-white" aria-labelledby="welcome-heading">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 id="dashboard-heading" className="text-responsive-xl font-bold">
              {greeting}, {userName}! 🌟
            </h1>
            <p className="text-indigo-100 mt-1 text-sm sm:text-base">
              Ready to continue your learning adventure?
            </p>
          </div>
          <div className="flex items-center justify-center sm:justify-end space-x-6 sm:space-x-4">
            <div className="text-center" role="img" aria-label={`Level ${stats.level}`}>
              <div className="text-2xl sm:text-3xl font-bold">{stats.level}</div>
              <div className="text-xs text-indigo-200">Level</div>
            </div>
            <div className="text-center" role="img" aria-label={`${stats.streak} day streak`}>
              <div className="text-2xl sm:text-3xl font-bold">{stats.streak}</div>
              <div className="text-xs text-indigo-200">Day Streak</div>
            </div>
          </div>
        </div>
      </section>

      {/* Recommended for You */}
      <section className="space-y-4" aria-labelledby="recommendations-heading">
        <div className="flex items-center justify-between">
          <h2 id="recommendations-heading" className="text-responsive-lg font-bold text-gray-900">
            Recommended for You
          </h2>
          <div className="flex items-center space-x-3">
            {lastUpdated && (
              <div className="flex items-center space-x-1 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                <span>Updated {formatTimeAgo(lastUpdated)}</span>
              </div>
            )}
            <button
              onClick={handleManualRefresh}
              disabled={refreshing || recommendationsLoading}
              className="flex items-center space-x-1 px-3 py-1.5 text-sm text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refresh recommendations"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
        
        {recommendationsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        ) : recommendations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recommendations.map((rec, index) => (
              <div 
                key={`${rec.type}-${rec.id}-${index}`}
                className="card hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleRecommendationClick(rec)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                      {rec.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {rec.subject}
                    </p>
                  </div>
                  {rec.type === 'lesson' ? (
                    <BookOpen className="w-5 h-5 text-indigo-600 flex-shrink-0 ml-2" />
                  ) : (
                    <Brain className="w-5 h-5 text-purple-600 flex-shrink-0 ml-2" />
                  )}
                </div>
                
                {rec.reason && (
                  <div className="mb-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                      {rec.reason}
                    </span>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    ~{rec.estimatedTime} min
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRecommendationClick(rec);
                    }}
                    className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  >
                    Start Learning
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card text-center py-8">
            <Sparkles className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">No recommendations available at the moment.</p>
            <p className="text-sm text-gray-400 mt-2">Complete some lessons to get personalized recommendations!</p>
          </div>
        )}
      </section>

      {/* Stats Cards */}
      <section className="grid-responsive" aria-labelledby="stats-heading">
        <h2 id="stats-heading" className="sr-only">Your Learning Statistics</h2>
        <div className="card" role="img" aria-label={`Total points: ${stats.totalPoints}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Points</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.totalPoints}</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-lg">
              <Star className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" aria-hidden="true" />
            </div>
          </div>
        </div>

        <div className="card" role="img" aria-label={`Lessons completed: ${completedLessons}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Lessons Completed</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{completedLessons}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" aria-hidden="true" />
            </div>
          </div>
        </div>

        <div className="card" role="img" aria-label={`Average score: ${avgScore} percent`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Average Score</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{avgScore}%</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" aria-hidden="true" />
            </div>
          </div>
        </div>

        <div className="card" role="img" aria-label={`Badges earned: ${stats.badges.length}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Badges Earned</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.badges.length}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" aria-hidden="true" />
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6" aria-labelledby="actions-heading">
        <h2 id="actions-heading" className="sr-only">Quick Actions</h2>
        {/* Daily Quiz Card */}
        <div className="bg-gradient-to-br from-orange-400 to-red-500 rounded-xl p-4 sm:p-6 text-white">
          <div className="flex items-center justify-between mb-4" aria-hidden="true">
            <Brain className="w-6 h-6 sm:w-8 sm:h-8" />
            <Zap className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold mb-2">Daily Quiz</h3>
          <p className="text-orange-100 mb-4 text-sm sm:text-base">Test your knowledge and earn points!</p>
          <button className="bg-white text-orange-600 px-4 py-2 rounded-lg font-semibold hover:bg-orange-50 transition-colors focus-visible text-sm sm:text-base">
            Start Quiz
          </button>
        </div>

        {/* Continue Learning Card */}
        <div className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl p-4 sm:p-6 text-white">
          <div className="flex items-center justify-between mb-4" aria-hidden="true">
            <BookOpen className="w-6 h-6 sm:w-8 sm:h-8" />
            <Target className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold mb-2">Continue Learning</h3>
          <p className="text-green-100 mb-4 text-sm sm:text-base">Pick up where you left off</p>
          <button className="bg-white text-green-600 px-4 py-2 rounded-lg font-semibold hover:bg-green-50 transition-colors focus-visible text-sm sm:text-base">
            Resume Lesson
          </button>
        </div>

        {/* Achievements Card */}
        <div className="bg-gradient-to-br from-purple-400 to-indigo-500 rounded-xl p-4 sm:p-6 text-white sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between mb-4" aria-hidden="true">
            <Trophy className="w-6 h-6 sm:w-8 sm:h-8" />
            <Flame className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold mb-2">Achievements</h3>
          <p className="text-purple-100 mb-4 text-sm sm:text-base">View your badges and milestones</p>
          <button className="bg-white text-purple-600 px-4 py-2 rounded-lg font-semibold hover:bg-purple-50 transition-colors focus-visible text-sm sm:text-base">
            View Badges
          </button>
        </div>
      </section>

      {/* Recent Progress */}
      <section className="card" aria-labelledby="progress-heading">
        <h2 id="progress-heading" className="text-responsive-lg font-bold text-gray-900 mb-4">Recent Progress</h2>
        <div className="space-y-3" role="list" aria-label="Recent learning activities">
          {typedProgress.slice(-5).reverse().map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg" role="listitem">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-4 h-4 text-indigo-600" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900">Lesson {item.lessonId}</p>
                  <p className="text-sm text-gray-500">
                    Completed {new Date(item.completedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 flex-shrink-0">
                <span className="text-sm font-medium text-gray-600">{item.score}%</span>
                <div className={`w-2 h-2 rounded-full ${
                  item.synced ? 'bg-green-500' : 'bg-yellow-500'
                }`} aria-label={item.synced ? 'Synced' : 'Pending sync'} />
              </div>
            </div>
          ))}
          {typedProgress.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" aria-hidden="true" />
              <p>No progress yet. Start your first lesson!</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}