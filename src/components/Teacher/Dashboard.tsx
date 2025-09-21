import React from 'react';
import { useTranslation } from 'react-i18next';
import { Users, TrendingUp, BookOpen, Award, Download, FolderSync as Sync, BarChart3, Calendar } from 'lucide-react';

export function TeacherDashboard() {
  const { t } = useTranslation();

  // Initial/empty values
  const classStats = {
    totalStudents: 0,
    activeToday: 0,
    avgCompletion: 0,
    totalLessons: 0,
    badgesEarned: 0
  };

  const recentActivity: Array<{ student: string; activity: string; score: number | null; time: string }> = [];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Teacher Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor your students' progress and engagement</p>
        </div>
        <div className="flex space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
            <Sync className="w-4 h-4" />
            <span>Sync Data</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">{classStats.totalStudents}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Today</p>
              <p className="text-2xl font-bold text-gray-900">{classStats.activeToday}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Completion</p>
              <p className="text-2xl font-bold text-gray-900">{classStats.avgCompletion}%</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-lg">
              <BarChart3 className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Lessons</p>
              <p className="text-2xl font-bold text-gray-900">{classStats.totalLessons}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <BookOpen className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Badges Earned</p>
              <p className="text-2xl font-bold text-gray-900">{classStats.badgesEarned}</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <Award className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Engagement Chart */}
        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Engagement</h3>
          <div className="space-y-3">
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
              const engagement = 0;
              return (
                <div key={day} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 w-20">{day}</span>
                  <div className="flex-1 mx-4">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-indigo-600 h-2 rounded-full" 
                        style={{ width: `${engagement}%` }}
                      ></div>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-12">{engagement}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Performance Distribution */}
        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Distribution</h3>
          <div className="space-y-3">
            {[
              { range: '90-100%', count: 0, color: 'bg-green-500' },
              { range: '80-89%', count: 0, color: 'bg-blue-500' },
              { range: '70-79%', count: 0, color: 'bg-yellow-500' },
              { range: '60-69%', count: 0, color: 'bg-orange-500' },
              { range: '< 60%', count: 0, color: 'bg-red-500' }
            ].map((item) => (
              <div key={item.range} className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded ${item.color}`}></div>
                <span className="text-sm text-gray-600 w-20">{item.range}</span>
                <div className="flex-1">
                  <div className="bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${item.color}`}
                      style={{ width: `${classStats.totalStudents === 0 ? 0 : (item.count / classStats.totalStudents) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-900 w-8">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Student Activity</h3>
          <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
            View All
          </button>
        </div>
        <div className="space-y-3">
          {recentActivity.length === 0 ? (
            <div className="text-gray-500 text-sm text-center py-4">No recent activity yet.</div>
          ) : (
            recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-indigo-600">
                      {activity.student.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{activity.student}</p>
                    <p className="text-sm text-gray-600">{activity.activity}</p>
                  </div>
                </div>
                <div className="text-right">
                  {activity.score && (
                    <p className="text-sm font-medium text-gray-900">{activity.score}%</p>
                  )}
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}