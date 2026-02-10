import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { FeedbackDisplay } from './FeedbackDisplay';
import { X, Loader2 } from 'lucide-react';

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

interface QuizAnswer {
  questionId: string;
  isCorrect: boolean;
  conceptTags?: string[];
  timeSpent?: number;
  errorType?: string;
  studentAnswer?: any;
  correctAnswer?: any;
}

interface QuizResults {
  quizId: string;
  answers: QuizAnswer[];
  lessonId?: string;
  totalTimeSpent?: number;
}

interface FeedbackData {
  overallScore: number;
  conceptBreakdown: Array<{
    concept: string;
    mastery: number;
    questions: number;
    correct: number;
    feedback: string;
  }>;
  strengths: Array<{
    concept: string;
    mastery: number;
    questionsCount: number;
  }>;
  weaknesses: Array<{
    concept: string;
    mastery: number;
    questionsCount: number;
    errorTypes?: { [key: string]: number };
  }>;
  recommendations: Array<{
    type: 'lesson' | 'quiz';
    concept: string;
    content: {
      id: string;
      title: string;
      subject: string;
    };
  }>;
  personalizedMessage: string;
}

export function GamePlayer() {
  const { gameName } = useParams();
  const navigate = useNavigate();
  const query = useQuery();
  const subject = query.get('subject') || 'Mathematics';
  const chapter = query.get('chapter') || '';
  const grade = query.get('grade') || '6';
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [quizResults, setQuizResults] = useState<QuizResults | null>(null);

  // Support nested folder for FightingGame
  const src = gameName === 'fightinggame'
    ? `/games/FightingGame/index.html?grade=${encodeURIComponent(grade)}&subject=${encodeURIComponent(subject)}&chapter=${encodeURIComponent(chapter)}`
    : `/games/${gameName}.html?grade=${encodeURIComponent(grade)}&subject=${encodeURIComponent(subject)}&chapter=${encodeURIComponent(chapter)}`;

  // Listen for messages from iframe (quiz completion)
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      // Security: Only accept messages from same origin
      if (event.origin !== window.location.origin) return;

      // Handle quiz completion with detailed results
      if (event.data && event.data.type === 'quiz-complete') {
        const results: QuizResults = event.data.results;
        if (results && results.answers && Array.isArray(results.answers)) {
          setQuizResults(results);
          await fetchFeedback(results);
        }
      }
    };

    // Also listen for the custom event (for backward compatibility)
    const handleQuizCompleted = async (event: CustomEvent) => {
      // If we have quiz results from postMessage, use those
      // Otherwise, try to collect from the event detail
      if (quizResults) {
        await fetchFeedback(quizResults);
      }
    };

    window.addEventListener('message', handleMessage);
    window.addEventListener('quiz:completed', handleQuizCompleted as EventListener);

    return () => {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('quiz:completed', handleQuizCompleted as EventListener);
    };
  }, [quizResults]);

  const fetchFeedback = async (results: QuizResults) => {
    try {
      setLoadingFeedback(true);
      const token = localStorage.getItem('stem_token');
      if (!token) {
        console.error('No authentication token');
        return;
      }

      // Prepare answers with conceptTags and errorType
      const answersWithConcepts = results.answers.map(answer => {
        // If conceptTags not provided, try to extract from question
        // This is a fallback - ideally games should provide this
        const enrichedAnswer = { ...answer };
        
        if (!enrichedAnswer.conceptTags || enrichedAnswer.conceptTags.length === 0) {
          // Try to infer from questionId or use subject/chapter
          enrichedAnswer.conceptTags = [subject.toLowerCase(), chapter.toLowerCase()].filter(Boolean);
        }

        // If errorType not provided and answer is wrong, try to infer
        if (!enrichedAnswer.isCorrect && !enrichedAnswer.errorType) {
          // Basic inference - could be enhanced
          enrichedAnswer.errorType = 'concept'; // Default
        }

        return enrichedAnswer;
      });

      const response = await fetch('/api/feedback/quiz-complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          quizId: results.quizId || `${subject}-${chapter}-${Date.now()}`,
          answers: answersWithConcepts,
          lessonId: results.lessonId || chapter,
          totalTimeSpent: results.totalTimeSpent || 0
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setFeedback(result.data);
          setShowFeedback(true);
        }
      } else {
        console.error('Failed to fetch feedback:', await response.text());
      }
    } catch (error) {
      console.error('Error fetching feedback:', error);
    } finally {
      setLoadingFeedback(false);
    }
  };

  const handleContinueLearning = () => {
    setShowFeedback(false);
    // Navigate to dashboard which shows recommendations
    navigate('/');
  };

  const handleCloseFeedback = () => {
    setShowFeedback(false);
    setFeedback(null);
    setQuizResults(null);
  };

  // Ensure cleanup if parent unmounts; adding visibility handling for pausing if needed
  useEffect(() => {
    const onVisibility = () => {
      // Optionally postMessage to iframe to pause game if supported
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  // Ensure the iframe is scrolled into view at the very top when mounted/changed
  useEffect(() => {
    const el = iframeRef.current;
    if (!el) return;
    // Scroll the element into view at the top of the container and window as a fallback
    try {
      el.scrollIntoView({ behavior: 'instant' as ScrollBehavior, block: 'start' });
    } catch {}
    // Fallback for some browsers
    const rect = el.getBoundingClientRect();
    if (typeof window !== 'undefined' && rect.top > 0) {
      window.scrollTo({ top: window.scrollY + rect.top - 80, behavior: 'instant' as ScrollBehavior });
    }
  }, [src]);

  return (
    <>
      <div className="w-full h-[calc(100vh-120px)] p-4 relative">
        <iframe
          ref={iframeRef}
          title="Quiz Game"
          src={src}
          className="w-full h-full rounded-lg border"
        />
        
        {/* Loading overlay for feedback */}
        {loadingFeedback && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 rounded-lg">
            <div className="bg-white rounded-lg p-6 flex flex-col items-center space-y-4">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              <p className="text-gray-700 font-medium">Generating your feedback...</p>
            </div>
          </div>
        )}
      </div>

      {/* Feedback Modal/Overlay */}
      {showFeedback && feedback && (
        <div className="fixed inset-0 bg-black/60 z-50 overflow-y-auto">
          <div className="min-h-screen p-4 sm:p-6 flex items-center justify-center">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl relative my-8">
              {/* Close button */}
              <button
                onClick={handleCloseFeedback}
                className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors z-10"
                aria-label="Close feedback"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>

              {/* Feedback Content */}
              <div className="p-4 sm:p-6">
                <FeedbackDisplay feedback={feedback} />
                
                {/* Continue Learning Button */}
                <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={handleContinueLearning}
                    className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
                  >
                    <span>Continue Learning</span>
                    <span>→</span>
                  </button>
                  <button
                    onClick={() => navigate('/quizzes')}
                    className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                  >
                    Back to Quizzes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


