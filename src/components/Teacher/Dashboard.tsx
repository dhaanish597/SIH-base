import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  TrendingUp, 
  BookOpen, 
  Award, 
  Download, 
  FolderSync as Sync, 
  BarChart3, 
  Calendar,
  AlertTriangle,
  Eye,
  Loader2,
  Clock,
  RefreshCw
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface ClassAnalytics {
  totalStudents: number;
  activeToday: number;
  averageCompletion: number;
  averageScore: number;
  atRiskStudents: Array<{
    id: string;
    name: string;
    class: string;
    mastery: number;
    engagement: number;
  }>;
  topPerformers: Array<{
    id: string;
    name: string;
    class: string;
    mastery: number;
  }>;
  strugglingStudents: Array<{
    id: string;
    name: string;
    class: string;
    mastery: number;
  }>;
  subjectPerformance: Record<string, number>;
  weeklyEngagement: Array<{
    day: string;
    engagement: number;
    activeCount: number;
    totalActivities: number;
  }>;
}

interface PerformanceDistribution {
  range: string;
  count: number;
}

interface RecentActivity {
  id: string;
  studentId: string;
  studentName: string;
  class: string;
  lessonId: string;
  lessonTitle: string;
  subject: string;
  score: number | null;
  timeSpent: number;
  completedAt: string;
  activityType: 'quiz' | 'lesson';
}

export function TeacherDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [analytics, setAnalytics] = useState<ClassAnalytics | null>(null);
  const [performanceDistribution, setPerformanceDistribution] = useState<PerformanceDistribution[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get teacher ID from localStorage
  const getTeacherId = () => {
    try {
      const userStr = localStorage.getItem('stem_user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return user.id;
      }
    } catch (e) {
      console.error('Error parsing user data:', e);
    }
    return null;
  };

  const fetchAnalytics = async () => {
    const teacherId = getTeacherId();
    if (!teacherId) {
      setError('Teacher ID not found. Please log in again.');
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const token = localStorage.getItem('stem_token');
      if (!token) {
        setError('Authentication required. Please log in again.');
        setLoading(false);
        return;
      }

      // Fetch class analytics
      const analyticsRes = await fetch(`/api/analytics/${teacherId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!analyticsRes.ok) {
        throw new Error(`Failed to fetch analytics: ${analyticsRes.status}`);
      }

      const analyticsData: ClassAnalytics = await analyticsRes.json();
      setAnalytics(analyticsData);

      // Fetch performance distribution
      const distributionRes = await fetch('/api/analytics/performance-distribution', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (distributionRes.ok) {
        const distributionData: PerformanceDistribution[] = await distributionRes.json();
        setPerformanceDistribution(distributionData);
      }

      // Fetch recent activity
      const activityRes = await fetch('/api/analytics/recent-activity?limit=10', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (activityRes.ok) {
        const activityData: RecentActivity[] = await activityRes.json();
        setRecentActivity(activityData);
      }

      setLastUpdated(new Date());

    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchAnalytics();

    // Set up periodic refresh every 30 seconds
    refreshIntervalRef.current = setInterval(() => {
      fetchAnalytics();
    }, 30000);

    // Cleanup interval on unmount
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
  };

  const handleViewStudentDetails = (studentId: string) => {
    navigate(`/analytics/student/${studentId}`);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-medium">Error loading dashboard</p>
          <p className="text-red-600 text-sm mt-1">{error}</p>
          <button
            onClick={handleRefresh}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const classStats = analytics || {
    totalStudents: 0,
    activeToday: 0,
    averageCompletion: 0,
    averageScore: 0,
    atRiskStudents: [],
    topPerformers: [],
    strugglingStudents: [],
    subjectPerformance: {},
    weeklyEngagement: []
  };

  // Prepare chart data
  const engagementChartData = classStats.weeklyEngagement.map(item => ({
    day: item.day.substring(0, 3), // Mon, Tue, etc.
    engagement: Math.round(item.engagement * 100),
    fullDay: item.day
  }));

  const performanceChartData = performanceDistribution.map(item => ({
    range: item.range,
    count: item.count
  }));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Teacher Dashboard</h1>
          <div className="flex items-center space-x-3 mt-1">
            <p className="text-gray-600">Monitor your students' progress and engagement</p>
            {lastUpdated && (
              <div className="flex items-center space-x-1 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                <span>Updated {formatTimeAgo(lastUpdated)}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            title="Refresh dashboard data"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
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
              <p className="text-2xl font-bold text-gray-900">{Math.round(classStats.averageCompletion)}</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-lg">
              <BarChart3 className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Score</p>
              <p className="text-2xl font-bold text-gray-900">{Math.round(classStats.averageScore)}%</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <BookOpen className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">At-Risk Students</p>
              <p className="text-2xl font-bold text-red-600">{classStats.atRiskStudents.length}</p>
            </div>
            <div className="bg-red-100 p-3 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* At-Risk Students Section */}
      {classStats.atRiskStudents.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900">At-Risk Students</h3>
            </div>
            <span className="text-sm text-gray-600">{classStats.atRiskStudents.length} students need attention</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classStats.atRiskStudents.map((student) => {
              const riskReasons = [];
              if (student.engagement < 0.4) riskReasons.push('Low engagement');
              if (student.mastery < 0.3) riskReasons.push('Low mastery');
              const riskScore = Math.round((1 - (student.mastery + student.engagement) / 2) * 100);

              return (
                <div key={student.id} className="border border-red-200 rounded-lg p-4 bg-red-50">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-gray-900">{student.name}</p>
                      <p className="text-sm text-gray-600">Class {student.class}</p>
                    </div>
                    <span className="px-2 py-1 bg-red-600 text-white text-xs font-medium rounded">
                      {riskScore}% risk
                    </span>
                  </div>
                  <div className="space-y-1 mb-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Mastery:</span>
                      <span className="font-medium">{Math.round(student.mastery * 100)}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Engagement:</span>
                      <span className="font-medium">{Math.round(student.engagement * 100)}%</span>
                    </div>
                  </div>
                  <div className="mb-3">
                    <p className="text-xs font-medium text-gray-700 mb-1">Risk Factors:</p>
                    <div className="flex flex-wrap gap-1">
                      {riskReasons.map((reason, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-red-200 text-red-800 text-xs rounded">
                          {reason}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => handleViewStudentDetails(student.id)}
                    className="w-full mt-2 px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-1"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View Details</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Engagement Chart */}
        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Engagement</h3>
          {engagementChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={engagementChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis domain={[0, 100]} />
                <Tooltip 
                  formatter={(value: number) => [`${value}%`, 'Engagement']}
                  labelFormatter={(label) => engagementChartData.find(d => d.day === label)?.fullDay || label}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="engagement" 
                  stroke="#4f46e5" 
                  strokeWidth={2}
                  name="Engagement %"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-gray-500 text-sm text-center py-8">No engagement data available</div>
          )}
        </div>

        {/* Performance Distribution */}
        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Distribution</h3>
          {performanceChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={performanceChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#4f46e5" name="Students" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
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
                        style={{ width: '0%' }}
                      ></div>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-8">0</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Student Activity</h3>
          <button 
            onClick={handleRefresh}
            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
          >
            Refresh
          </button>
        </div>
        <div className="space-y-3">
          {recentActivity.length === 0 ? (
            <div className="text-gray-500 text-sm text-center py-4">No recent activity yet.</div>
          ) : (
            recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-indigo-600">
                      {activity.studentName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{activity.studentName}</p>
                    <p className="text-sm text-gray-600">
                      {activity.activityType === 'quiz' ? 'Completed quiz' : 'Completed lesson'}: {activity.lessonTitle}
                      {activity.subject && ` • ${activity.subject}`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {activity.score !== null && (
                    <p className={`text-sm font-medium ${activity.score >= 80 ? 'text-green-600' : activity.score >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {Math.round(activity.score)}%
                    </p>
                  )}
                  <p className="text-xs text-gray-500">{formatTimeAgo(activity.completedAt)}</p>
                  {activity.timeSpent > 0 && (
                    <p className="text-xs text-gray-500">{Math.round(activity.timeSpent / 60)} min</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
