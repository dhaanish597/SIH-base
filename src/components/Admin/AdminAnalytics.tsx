import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  UserCheck,
  GraduationCap,
  School,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Activity,
  Loader2,
  BarChart3,
  Target,
  BookOpen,
  RefreshCw,
  Clock
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';

interface PlatformAnalytics {
  totalUsers: number;
  activeUsers: number;
  totalStudents: number;
  totalTeachers: number;
  totalSchools: number;
  activeLast30Days: number;
  completionRates: {
    overall: number;
    studentsWithProgress: number;
    totalStudents: number;
    uniqueLessonsCompleted: number;
    totalCompletions: number;
  };
  schoolPerformanceComparison: Array<{
    schoolName: string;
    studentCount: number;
    avgScore: number;
    completionRate: number;
    lessonsCompleted: number;
  }>;
  subjectDifficultyAnalysis: Array<{
    subject: string;
    avgScore: number;
    avgTime: number;
    difficultyScore: number;
    studentCount: number;
    totalAttempts: number;
  }>;
  topStrugglingConcepts: Array<{
    concept: string;
    avgMastery: number;
    masteryPercent: number;
    studentCount: number;
    totalAttempts: number;
    avgConfidence: number;
  }>;
  engagementTrends: Array<{
    date: string;
    activeStudents: number;
    totalActivities: number;
    avgScore: number;
    totalTimeSpent: number;
  }>;
  platformEngagementScore: number;
  insights: {
    topStrugglingConcepts: Array<{
      concept: string;
      masteryPercent: number;
      recommendation: string;
    }>;
    recommendedContentUpdates: Array<{
      subject?: string;
      concept?: string;
      reason: string;
      suggestion: string;
    }>;
    engagementTrends: string;
    platformHealth: string;
  };
}

export function AdminAnalytics() {
  const [analytics, setAnalytics] = useState<PlatformAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchAnalytics = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);

      const token = localStorage.getItem('stem_token');
      if (!token) {
        setError('Authentication required. Please log in again.');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/admin/analytics', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 403) {
          setError('Access denied. Admin role required.');
        } else {
          const errorText = await response.text();
          throw new Error(`Failed to fetch analytics: ${response.status} ${errorText}`);
        }
        setLoading(false);
        return;
      }

      const data: PlatformAnalytics = await response.json();
      setAnalytics(data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching admin analytics:', err);
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
      fetchAnalytics(false); // Don't show loading spinner on auto-refresh
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
    fetchAnalytics();
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

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading platform analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <div>
              <p className="text-red-800 font-medium">Error loading analytics</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">No analytics data available.</p>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const schoolChartData = analytics.schoolPerformanceComparison.map(school => ({
    name: school.schoolName.length > 15 ? school.schoolName.substring(0, 15) + '...' : school.schoolName,
    fullName: school.schoolName,
    avgScore: school.avgScore,
    completionRate: school.completionRate,
    students: school.studentCount
  }));

  const subjectChartData = analytics.subjectDifficultyAnalysis.map(subject => ({
    subject: subject.subject,
    avgScore: subject.avgScore,
    difficultyScore: Math.round(subject.difficultyScore * 100),
    avgTime: Math.round(subject.avgTime / 60) // Convert to minutes
  }));

  const engagementChartData = analytics.engagementTrends.map(trend => ({
    date: new Date(trend.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    fullDate: trend.date,
    activeStudents: trend.activeStudents,
    totalActivities: trend.totalActivities,
    avgScore: trend.avgScore
  }));

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Platform Analytics</h2>
          <div className="flex items-center space-x-3 mt-1">
            <p className="text-gray-600">Comprehensive insights into platform performance</p>
            {lastUpdated && (
              <div className="flex items-center space-x-1 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                <span>Updated {formatTimeAgo(lastUpdated)}</span>
              </div>
            )}
          </div>
        </div>
        <button
          onClick={handleManualRefresh}
          disabled={refreshing || loading}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Refresh analytics data"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Platform Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalUsers}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-600">Active: </span>
            <span className="font-medium text-gray-900 ml-1">{analytics.activeUsers}</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalStudents}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <GraduationCap className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-600">Active (30d): </span>
            <span className="font-medium text-gray-900 ml-1">{analytics.activeLast30Days}</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completion Rate</p>
              <p className={`text-2xl font-bold ${getScoreColor(analytics.completionRates.overall)}`}>
                {Math.round(analytics.completionRates.overall)}%
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <Target className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-600">With Progress: </span>
            <span className="font-medium text-gray-900 ml-1">
              {analytics.completionRates.studentsWithProgress}/{analytics.completionRates.totalStudents}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Platform Engagement</p>
              <p className={`text-2xl font-bold ${getScoreColor(analytics.platformEngagementScore * 100)}`}>
                {Math.round(analytics.platformEngagementScore * 100)}%
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <Activity className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-600">Schools: </span>
            <span className="font-medium text-gray-900 ml-1">{analytics.totalSchools}</span>
          </div>
        </div>
      </div>

      {/* School Performance Comparison */}
      <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <School className="w-5 h-5 text-indigo-600" />
          School Performance Comparison
        </h3>
        {schoolChartData.length > 0 ? (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={schoolChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" label={{ value: 'Score', angle: -90, position: 'insideLeft' }} />
                <YAxis yAxisId="right" orientation="right" label={{ value: 'Completion %', angle: 90, position: 'insideRight' }} />
                <Tooltip 
                  formatter={(value: number, name: string) => {
                    if (name === 'avgScore') return [`${value}%`, 'Average Score'];
                    if (name === 'completionRate') return [`${value}%`, 'Completion Rate'];
                    return [value, name];
                  }}
                  labelFormatter={(label) => {
                    const school = schoolChartData.find(s => s.name === label);
                    return school?.fullName || label;
                  }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="avgScore" fill="#4f46e5" name="Average Score" />
                <Bar yAxisId="right" dataKey="completionRate" fill="#10b981" name="Completion Rate %" />
              </BarChart>
            </ResponsiveContainer>
            
            {/* Table View */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 font-semibold text-gray-700">School</th>
                    <th className="text-right py-2 px-3 font-semibold text-gray-700">Students</th>
                    <th className="text-right py-2 px-3 font-semibold text-gray-700">Avg Score</th>
                    <th className="text-right py-2 px-3 font-semibold text-gray-700">Completion</th>
                    <th className="text-right py-2 px-3 font-semibold text-gray-700">Lessons</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.schoolPerformanceComparison.map((school, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 px-3 font-medium text-gray-900">{school.schoolName}</td>
                      <td className="py-2 px-3 text-right text-gray-600">{school.studentCount}</td>
                      <td className={`py-2 px-3 text-right font-medium ${getScoreColor(school.avgScore)}`}>
                        {school.avgScore}%
                      </td>
                      <td className={`py-2 px-3 text-right font-medium ${getScoreColor(school.completionRate)}`}>
                        {school.completionRate}%
                      </td>
                      <td className="py-2 px-3 text-right text-gray-600">{school.lessonsCompleted}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-gray-500 text-sm text-center py-8">No school performance data available</div>
        )}
      </div>

      {/* Subject Difficulty Analysis */}
      <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-600" />
          Subject Difficulty Analysis
        </h3>
        {subjectChartData.length > 0 ? (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={subjectChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="subject" />
                <YAxis yAxisId="left" label={{ value: 'Score', angle: -90, position: 'insideLeft' }} />
                <YAxis yAxisId="right" orientation="right" label={{ value: 'Difficulty', angle: 90, position: 'insideRight' }} />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="avgScore" fill="#4f46e5" name="Average Score %" />
                <Bar yAxisId="right" dataKey="difficultyScore" fill="#ef4444" name="Difficulty Score" />
              </BarChart>
            </ResponsiveContainer>
            
            {/* Heatmap-style grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {analytics.subjectDifficultyAnalysis.map((subject, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <h4 className="font-semibold text-gray-900 mb-2">{subject.subject}</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Score:</span>
                      <span className={`font-medium ${getScoreColor(subject.avgScore)}`}>
                        {subject.avgScore}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Difficulty:</span>
                      <span className="font-medium text-gray-900">
                        {Math.round(subject.difficultyScore * 100)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Avg Time:</span>
                      <span className="font-medium text-gray-900">
                        {Math.round(subject.avgTime / 60)} min
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className={`h-2 rounded-full ${getScoreBgColor(subject.avgScore)}`}
                        style={{ width: `${subject.avgScore}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-gray-500 text-sm text-center py-8">No subject difficulty data available</div>
        )}
      </div>

      {/* AI Insights Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Struggling Concepts */}
        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            Top Struggling Concepts
          </h3>
          {analytics.insights.topStrugglingConcepts.length > 0 ? (
            <div className="space-y-3">
              {analytics.insights.topStrugglingConcepts.map((concept, index) => (
                <div
                  key={index}
                  className="border border-red-200 rounded-lg p-4 bg-red-50"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">{concept.concept}</h4>
                    <span className="px-2 py-1 bg-red-600 text-white text-xs font-medium rounded">
                      {concept.masteryPercent}% mastery
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{concept.recommendation}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 text-sm text-center py-4">No struggling concepts identified</div>
          )}
        </div>

        {/* Recommended Content Updates */}
        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-600" />
            Recommended Content Updates
          </h3>
          {analytics.insights.recommendedContentUpdates.length > 0 ? (
            <div className="space-y-3">
              {analytics.insights.recommendedContentUpdates.map((rec, index) => (
                <div
                  key={index}
                  className="border border-yellow-200 rounded-lg p-4 bg-yellow-50"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">
                      {rec.subject || rec.concept || 'Content Update'}
                    </h4>
                    <span className="px-2 py-1 bg-yellow-600 text-white text-xs font-medium rounded">
                      {rec.subject ? 'Subject' : 'Concept'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-1">{rec.reason}</p>
                  <p className="text-sm text-gray-700">{rec.suggestion}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 text-sm text-center py-4">No content updates recommended</div>
          )}
        </div>
      </div>

      {/* Engagement Trends */}
      <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-indigo-600" />
          Engagement Trends (Last 30 Days)
        </h3>
        {engagementChartData.length > 0 ? (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={engagementChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" label={{ value: 'Active Students', angle: -90, position: 'insideLeft' }} />
                <YAxis yAxisId="right" orientation="right" label={{ value: 'Activities', angle: 90, position: 'insideRight' }} />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="activeStudents"
                  stroke="#4f46e5"
                  strokeWidth={2}
                  name="Active Students"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="totalActivities"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Total Activities"
                />
              </LineChart>
            </ResponsiveContainer>
            
            {/* Engagement Insights */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <p className="text-sm text-gray-700 whitespace-pre-line">
                {analytics.insights.engagementTrends}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-gray-500 text-sm text-center py-8">No engagement trend data available</div>
        )}
      </div>

      {/* Platform Health */}
      <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-600" />
          Platform Health
        </h3>
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-4">
          <p className="text-sm text-gray-700 whitespace-pre-line">
            {analytics.insights.platformHealth}
          </p>
        </div>
      </div>
    </div>
  );
}
