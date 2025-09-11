import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Target, 
  Flame, 
  Trophy, 
  BookOpen, 
  Brain,
  Star,
  TrendingUp,
  Calendar,
  Zap
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

export function StudentDashboard({ userId, userName }: DashboardProps) {
  const { t } = useTranslation();
  const { stats, loading: statsLoading } = useUserStats();
  const { progress, loading: progressLoading } = useUserProgress(userId);
  const typedProgress = (progress as unknown as ProgressItem[]) || [];
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 17) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

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