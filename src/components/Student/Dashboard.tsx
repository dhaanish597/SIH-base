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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const completedLessons = typedProgress.filter(p => p.completed).length;
  const totalScore = typedProgress.reduce((sum, p) => sum + p.score, 0);
  const avgScore = completedLessons > 0 ? Math.round(totalScore / completedLessons) : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              {greeting}, {userName}! 🌟
            </h1>
            <p className="text-indigo-100 mt-1">
              Ready to continue your learning adventure?
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="text-3xl font-bold">{stats.level}</div>
              <div className="text-xs text-indigo-200">Level</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{stats.streak}</div>
              <div className="text-xs text-indigo-200">Day Streak</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Points</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalPoints}</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-lg">
              <Star className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Lessons Completed</p>
              <p className="text-2xl font-bold text-gray-900">{completedLessons}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <BookOpen className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Average Score</p>
              <p className="text-2xl font-bold text-gray-900">{avgScore}%</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Badges Earned</p>
              <p className="text-2xl font-bold text-gray-900">{stats.badges.length}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <Trophy className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Daily Quiz Card */}
        <div className="bg-gradient-to-br from-orange-400 to-red-500 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Brain className="w-8 h-8" />
            <Zap className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold mb-2">Daily Quiz</h3>
          <p className="text-orange-100 mb-4">Test your knowledge and earn points!</p>
          <button className="bg-white text-orange-600 px-4 py-2 rounded-lg font-semibold hover:bg-orange-50 transition-colors">
            Start Quiz
          </button>
        </div>

        {/* Continue Learning Card */}
        <div className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <BookOpen className="w-8 h-8" />
            <Target className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold mb-2">Continue Learning</h3>
          <p className="text-green-100 mb-4">Pick up where you left off</p>
          <button className="bg-white text-green-600 px-4 py-2 rounded-lg font-semibold hover:bg-green-50 transition-colors">
            Resume Lesson
          </button>
        </div>

        {/* Achievements Card */}
        <div className="bg-gradient-to-br from-purple-400 to-indigo-500 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Trophy className="w-8 h-8" />
            <Flame className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold mb-2">Achievements</h3>
          <p className="text-purple-100 mb-4">View your badges and milestones</p>
          <button className="bg-white text-purple-600 px-4 py-2 rounded-lg font-semibold hover:bg-purple-50 transition-colors">
            View Badges
          </button>
        </div>
      </div>

      {/* Recent Progress */}
      <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Progress</h3>
        <div className="space-y-3">
          {typedProgress.slice(-5).reverse().map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Lesson {item.lessonId}</p>
                  <p className="text-sm text-gray-500">
                    Completed {new Date(item.completedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-600">{item.score}%</span>
                <div className={`w-2 h-2 rounded-full ${
                  item.synced ? 'bg-green-500' : 'bg-yellow-500'
                }`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}