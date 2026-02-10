import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  X,
  User,
  Target,
  MessageSquare,
  BookOpen,
  Calendar,
  Loader2,
  AlertCircle,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

interface StudentDetailViewProps {
  studentId?: string;
  onClose?: () => void;
}

interface StudentAnalytics {
  student: {
    id: string;
    name: string;
    class: string;
  };
  masteryByConcept: Array<{
    concept: string;
    mastery: number;
    confidence: number;
    attempts: number;
    correct: number;
    lastPracticed: string | null;
  }>;
  learningVelocityTrends: Array<{
    date: string;
    questionsAnswered: number;
    correctCount: number;
    averageTimeSpent: number;
  }>;
  engagementTrends: Array<{
    date: string;
    activities: number;
    totalTimeSpent: number;
  }>;
  learningProfile: {
    preferred_learning_style: string;
    average_learning_velocity: number;
    optimal_difficulty_level: number;
    engagement_score: number;
    last_updated: string;
  } | null;
  recommendedInterventions: Array<{
    concept: string;
    type: string;
    priority: string;
    reason: string;
  }>;
  summary: {
    totalConcepts: number;
    masteredConcepts: number;
    learningConcepts: number;
    weakConcepts: number;
    averageMastery: number;
  };
}

export function StudentDetailView({ studentId: propStudentId, onClose }: StudentDetailViewProps) {
  const { studentId: paramStudentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const studentId = propStudentId || paramStudentId;

  const [analytics, setAnalytics] = useState<StudentAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!studentId) {
      setError('Student ID is required');
      setLoading(false);
      return;
    }

    const fetchStudentAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('stem_token');
        if (!token) {
          setError('Authentication required. Please log in again.');
          setLoading(false);
          return;
        }

        // Get teacher ID for verification
        const userStr = localStorage.getItem('stem_user');
        if (!userStr) {
          setError('User data not found');
          setLoading(false);
          return;
        }

        const user = JSON.parse(userStr);
        if (user.role !== 'teacher') {
          setError('Access denied. Teacher role required.');
          setLoading(false);
          return;
        }

        const response = await fetch(`/api/analytics/student/${studentId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to fetch student analytics: ${response.status} ${errorText}`);
        }

        const data: StudentAnalytics = await response.json();
        setAnalytics(data);
      } catch (err) {
        console.error('Error fetching student analytics:', err);
        setError(err instanceof Error ? err.message : 'Failed to load student analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchStudentAnalytics();
  }, [studentId]);

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      navigate(-1); // Go back to previous page
    }
  };

  const getMasteryColor = (mastery: number) => {
    if (mastery >= 0.8) return 'bg-green-500';
    if (mastery >= 0.3) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getMasteryLabel = (mastery: number) => {
    if (mastery >= 0.8) return 'Mastered';
    if (mastery >= 0.3) return 'Learning';
    return 'Weak';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleSendMessage = () => {
    // TODO: Implement messaging functionality
    alert('Messaging feature coming soon!');
  };

  const handleAssignRemedialWork = () => {
    // TODO: Navigate to assignment creation with pre-filled concepts
    alert('Remedial work assignment feature coming soon!');
  };

  const handleScheduleMeeting = () => {
    // TODO: Implement meeting scheduling
    alert('Meeting scheduling feature coming soon!');
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading student analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-800 font-medium">Error loading student data</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
            <button
              onClick={handleClose}
              className="text-red-600 hover:text-red-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">No analytics data available for this student.</p>
        </div>
      </div>
    );
  }

  const { student, masteryByConcept, learningVelocityTrends, engagementTrends, learningProfile, recommendedInterventions, summary } = analytics;

  // Prepare velocity chart data (questions per minute)
  const velocityChartData = learningVelocityTrends.map(item => ({
    date: formatDate(item.date),
    fullDate: item.date,
    questionsPerMin: item.averageTimeSpent > 0 
      ? Math.round((item.questionsAnswered / (item.averageTimeSpent / 60)) * 10) / 10 
      : 0,
    questionsAnswered: item.questionsAnswered,
    correctRate: item.questionsAnswered > 0 
      ? Math.round((item.correctCount / item.questionsAnswered) * 100) 
      : 0
  }));

  // Prepare engagement chart data
  const engagementChartData = engagementTrends.map(item => ({
    date: formatDate(item.date),
    fullDate: item.date,
    activities: item.activities,
    timeSpent: Math.round(item.totalTimeSpent / 60) // Convert to minutes
  }));

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Student Analytics</h1>
          <p className="text-gray-600 mt-1">Detailed performance insights for {student.name}</p>
        </div>
        <button
          onClick={handleClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Close"
        >
          <X className="w-6 h-6 text-gray-600" />
        </button>
      </div>

      {/* Student Profile Card */}
      <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
        <div className="flex items-start space-x-6">
          <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center">
            <User className="w-10 h-10 text-indigo-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">{student.name}</h2>
            <p className="text-gray-600 mt-1">Class {student.class}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div>
                <p className="text-sm text-gray-600">Total Concepts</p>
                <p className="text-xl font-bold text-gray-900">{summary.totalConcepts}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Mastered</p>
                <p className="text-xl font-bold text-green-600">{summary.masteredConcepts}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Learning</p>
                <p className="text-xl font-bold text-yellow-600">{summary.learningConcepts}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Average Mastery</p>
                <p className="text-xl font-bold text-indigo-600">
                  {Math.round(summary.averageMastery * 100)}%
                </p>
              </div>
            </div>
            {learningProfile && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Learning Style</p>
                    <p className="text-sm font-medium text-gray-900 capitalize">
                      {learningProfile.preferred_learning_style || 'Mixed'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Engagement Score</p>
                    <p className="text-sm font-medium text-gray-900">
                      {Math.round(learningProfile.engagement_score * 100)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Optimal Difficulty</p>
                    <p className="text-sm font-medium text-gray-900">
                      {Math.round(learningProfile.optimal_difficulty_level * 100)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Learning Velocity</p>
                    <p className="text-sm font-medium text-gray-900">
                      {learningProfile.average_learning_velocity?.toFixed(1) || '0'} q/min
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleSendMessage}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Send Message</span>
        </button>
        <button
          onClick={handleAssignRemedialWork}
          className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
        >
          <BookOpen className="w-4 h-4" />
          <span>Assign Remedial Work</span>
        </button>
        <button
          onClick={handleScheduleMeeting}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Calendar className="w-4 h-4" />
          <span>Schedule Meeting</span>
        </button>
      </div>

      {/* Mastery Heatmap */}
      <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Concept Mastery Heatmap</h3>
        {masteryByConcept.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {masteryByConcept.map((concept) => {
              const masteryPercent = Math.round(concept.mastery * 100);
              const colorClass = getMasteryColor(concept.mastery);
              const label = getMasteryLabel(concept.mastery);

              return (
                <div
                  key={concept.concept}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {concept.concept.replace(/_/g, ' ')}
                    </span>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded ${colorClass} text-white`}>
                      {label}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Mastery:</span>
                      <span className="font-medium">{masteryPercent}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${colorClass}`}
                        style={{ width: `${masteryPercent}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                      <span>{concept.correct}/{concept.attempts} correct</span>
                      <span>{Math.round(concept.confidence * 100)}% confidence</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-gray-500 text-sm text-center py-8">
            No mastery data available yet. Student needs to complete more activities.
          </div>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Learning Velocity Chart */}
        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Learning Velocity</h3>
          {velocityChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={velocityChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" label={{ value: 'Questions/min', angle: -90, position: 'insideLeft' }} />
                <YAxis yAxisId="right" orientation="right" label={{ value: 'Correct Rate %', angle: 90, position: 'insideRight' }} />
                <Tooltip 
                  formatter={(value: number, name: string) => {
                    if (name === 'questionsPerMin') return [`${value} q/min`, 'Velocity'];
                    if (name === 'correctRate') return [`${value}%`, 'Correct Rate'];
                    return [value, name];
                  }}
                />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="questionsPerMin"
                  stroke="#4f46e5"
                  strokeWidth={2}
                  name="Questions/min"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="correctRate"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Correct Rate %"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-gray-500 text-sm text-center py-8">
              No velocity data available yet.
            </div>
          )}
        </div>

        {/* Engagement Trends Chart */}
        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Engagement Trends</h3>
          {engagementChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={engagementChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" label={{ value: 'Activities', angle: -90, position: 'insideLeft' }} />
                <YAxis yAxisId="right" orientation="right" label={{ value: 'Time (min)', angle: 90, position: 'insideRight' }} />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="activities" fill="#4f46e5" name="Activities" />
                <Bar yAxisId="right" dataKey="timeSpent" fill="#10b981" name="Time Spent (min)" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-gray-500 text-sm text-center py-8">
              No engagement data available yet.
            </div>
          )}
        </div>
      </div>

      {/* Recommended Interventions */}
      {recommendedInterventions.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
          <div className="flex items-center space-x-2 mb-4">
            <Target className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-semibold text-gray-900">Recommended Interventions</h3>
          </div>
          <div className="space-y-3">
            {recommendedInterventions.map((intervention, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  intervention.priority === 'high'
                    ? 'bg-red-50 border-red-200'
                    : 'bg-yellow-50 border-yellow-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      {intervention.priority === 'high' ? (
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-yellow-600" />
                      )}
                      <span className="font-medium text-gray-900">
                        {intervention.concept.replace(/_/g, ' ')}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded ${
                          intervention.priority === 'high'
                            ? 'bg-red-600 text-white'
                            : 'bg-yellow-600 text-white'
                        }`}
                      >
                        {intervention.priority.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{intervention.reason}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Recommended action: {intervention.type === 'practice' ? 'Additional practice exercises' : 'Review lesson'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {recommendedInterventions.length === 0 && (
        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
          <div className="flex items-center space-x-2 text-green-600">
            <CheckCircle2 className="w-5 h-5" />
            <p className="text-lg font-semibold">No interventions needed</p>
          </div>
          <p className="text-gray-600 mt-2">
            This student is performing well across all concepts. Continue monitoring progress.
          </p>
        </div>
      )}
    </div>
  );
}
