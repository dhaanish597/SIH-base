import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Trophy,
  Star,
  TrendingUp,
  AlertCircle,
  BookOpen,
  Brain,
  CheckCircle,
  XCircle,
  Target,
  Sparkles,
  ArrowRight,
  Award
} from 'lucide-react';

interface ConceptBreakdown {
  concept: string;
  mastery: number;
  questions: number;
  correct: number;
  feedback: string;
}

interface Strength {
  concept: string;
  mastery: number;
  questionsCount: number;
}

interface Weakness {
  concept: string;
  mastery: number;
  questionsCount: number;
  errorTypes?: { [key: string]: number };
}

interface Recommendation {
  type: 'lesson' | 'quiz';
  concept: string;
  content: {
    id: string;
    title: string;
    subject: string;
  };
}

interface FeedbackData {
  overallScore: number;
  conceptBreakdown: ConceptBreakdown[];
  strengths: Strength[];
  weaknesses: Weakness[];
  recommendations: Recommendation[];
  personalizedMessage: string;
}

interface FeedbackDisplayProps {
  feedback: FeedbackData;
}

export function FeedbackDisplay({ feedback }: FeedbackDisplayProps) {
  const navigate = useNavigate();
  const [showConfetti, setShowConfetti] = useState(false);
  const scorePercent = Math.round(feedback.overallScore * 100);

  useEffect(() => {
    if (scorePercent >= 80) {
      setShowConfetti(true);
      // Hide confetti after animation
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [scorePercent]);

  const handleRecommendationClick = (rec: Recommendation) => {
    if (rec.type === 'lesson') {
      const subjectLower = rec.content.subject.toLowerCase();
      navigate(`/lessons/${subjectLower}`);
    } else if (rec.type === 'quiz') {
      navigate(`/quizzes?subject=${encodeURIComponent(rec.content.subject)}`);
    }
  };

  const getScoreColor = () => {
    if (scorePercent >= 80) return 'from-green-500 to-emerald-600';
    if (scorePercent >= 60) return 'from-blue-500 to-indigo-600';
    if (scorePercent >= 40) return 'from-yellow-500 to-orange-600';
    return 'from-red-500 to-pink-600';
  };

  const getScoreEmoji = () => {
    if (scorePercent >= 90) return '🎉';
    if (scorePercent >= 80) return '🌟';
    if (scorePercent >= 70) return '👍';
    if (scorePercent >= 60) return '💪';
    if (scorePercent >= 50) return '📚';
    return '💡';
  };

  return (
    <div className="container-responsive py-4 sm:py-6 space-y-6">
      {/* Confetti Animation */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            >
              {['🎉', '🌟', '⭐', '✨', '🎊'][Math.floor(Math.random() * 5)]}
            </div>
          ))}
        </div>
      )}

      {/* Header: Score with Celebration */}
      <section className="relative overflow-hidden">
        <div className={`bg-gradient-to-r ${getScoreColor()} rounded-2xl p-6 sm:p-8 text-white shadow-lg`}>
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
            <div className="text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start space-x-2 mb-2">
                <span className="text-4xl sm:text-5xl animate-bounce">{getScoreEmoji()}</span>
                <h1 className="text-3xl sm:text-4xl font-bold">Quiz Complete!</h1>
              </div>
              <p className="text-white/90 text-lg sm:text-xl">Your Score</p>
            </div>
            <div className="text-center">
              <div className="text-6xl sm:text-7xl font-bold mb-2 animate-pulse">
                {scorePercent}%
              </div>
              {scorePercent >= 80 && (
                <div className="flex items-center justify-center space-x-1 text-yellow-200">
                  <Trophy className="w-5 h-5" />
                  <span className="text-sm font-semibold">Excellent Work!</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Personalized Message */}
      <section className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border-l-4 border-indigo-500">
        <div className="flex items-start space-x-3">
          <Sparkles className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-1" />
          <p className="text-lg sm:text-xl text-gray-800 font-medium leading-relaxed">
            {feedback.personalizedMessage}
          </p>
        </div>
      </section>

      {/* Concept Breakdown */}
      <section className="card">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
          <TrendingUp className="w-6 h-6 text-indigo-600" />
          <span>Concept Breakdown</span>
        </h2>
        <div className="space-y-4">
          {feedback.conceptBreakdown.map((concept, index) => {
            const masteryPercent = Math.round(concept.mastery * 100);
            const progressColor = concept.mastery >= 0.8 
              ? 'bg-green-500' 
              : concept.mastery >= 0.5 
              ? 'bg-blue-500' 
              : 'bg-orange-500';

            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 capitalize">
                      {concept.concept.replace(/_/g, ' ')}
                    </h3>
                    <p className="text-sm text-gray-600">{concept.feedback}</p>
                  </div>
                  <div className="ml-4 text-right">
                    <div className="text-lg font-bold text-gray-900">{masteryPercent}%</div>
                    <div className="text-xs text-gray-500">
                      {concept.correct}/{concept.questions} correct
                    </div>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full ${progressColor} transition-all duration-500 ease-out rounded-full`}
                    style={{ width: `${masteryPercent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Strengths Section */}
      {feedback.strengths.length > 0 && (
        <section className="card bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <span>Your Strengths</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {feedback.strengths.map((strength, index) => (
              <div
                key={index}
                className="bg-white rounded-lg p-4 border border-green-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-900 capitalize text-sm">
                    {strength.concept.replace(/_/g, ' ')}
                  </span>
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                </div>
                <div className="text-xs text-gray-600">
                  {Math.round(strength.mastery * 100)}% mastery • {strength.questionsCount} questions
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Weaknesses Section */}
      {feedback.weaknesses.length > 0 && (
        <section className="card bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
            <AlertCircle className="w-6 h-6 text-orange-600" />
            <span>Areas to Improve</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {feedback.weaknesses.map((weakness, index) => {
              const masteryPercent = Math.round(weakness.mastery * 100);
              const dominantError = weakness.errorTypes 
                ? Object.keys(weakness.errorTypes).reduce((a, b) => 
                    weakness.errorTypes![a] > weakness.errorTypes![b] ? a : b
                  )
                : null;

              return (
                <div
                  key={index}
                  className="bg-white rounded-lg p-5 border border-orange-200 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 capitalize mb-1">
                        {weakness.concept.replace(/_/g, ' ')}
                      </h3>
                      <div className="text-sm text-gray-600 mb-2">
                        {masteryPercent}% mastery • {weakness.questionsCount} questions
                      </div>
                      {dominantError && (
                        <span className="inline-block px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full capitalize">
                          Common error: {dominantError}
                        </span>
                      )}
                    </div>
                    <XCircle className="w-6 h-6 text-orange-500 flex-shrink-0 ml-2" />
                  </div>
                  <button
                    onClick={() => {
                      // Navigate to practice for this concept
                      navigate(`/quizzes?concept=${encodeURIComponent(weakness.concept)}`);
                    }}
                    className="w-full bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Target className="w-4 h-4" />
                    <span>Practice This Concept</span>
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Recommendations */}
      {feedback.recommendations.length > 0 && (
        <section className="card">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
            <Brain className="w-6 h-6 text-purple-600" />
            <span>Recommended Next Steps</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {feedback.recommendations.map((rec, index) => (
              <div
                key={index}
                onClick={() => handleRecommendationClick(rec)}
                className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-5 border border-purple-200 cursor-pointer hover:shadow-lg transition-all hover:scale-105"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      {rec.type === 'lesson' ? (
                        <BookOpen className="w-5 h-5 text-purple-600" />
                      ) : (
                        <Brain className="w-5 h-5 text-indigo-600" />
                      )}
                      <span className="text-xs font-semibold text-purple-700 uppercase">
                        {rec.type}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                      {rec.content.title}
                    </h3>
                    <p className="text-sm text-gray-600">{rec.content.subject}</p>
                    <p className="text-xs text-purple-600 mt-2 capitalize">
                      Targets: {rec.concept.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-purple-600 flex-shrink-0 ml-2" />
                </div>
                <button className="w-full mt-3 bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors text-sm">
                  {rec.type === 'lesson' ? 'Start Lesson' : 'Take Quiz'}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Empty States */}
      {feedback.strengths.length === 0 && feedback.weaknesses.length === 0 && (
        <section className="card text-center py-8">
          <Award className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">Complete more quizzes to see detailed feedback!</p>
        </section>
      )}
    </div>
  );
}
