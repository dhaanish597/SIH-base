import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calculator, FlaskConical, Cpu, DraftingCompass, ArrowRight, Clock, Sparkles } from 'lucide-react';
import { indexedDBService } from '../../utils/indexedDB';

type SubjectKey = 'Mathematics' | 'Science' | 'Technology' | 'Engineering';

interface Lesson {
  id: string;
  title: string;
  subject: SubjectKey | string;
  difficulty?: number;
}

interface ProgressItem {
  userId: string;
  lessonId: string;
  completed: boolean;
  score: number;
  timeSpent: number;
  completedAt: string | Date;
}

const subjectIcon: Record<string, JSX.Element> = {
  Mathematics: <Calculator className="w-6 h-6 text-indigo-600" />,
  Science: <FlaskConical className="w-6 h-6 text-emerald-600" />,
  Technology: <Cpu className="w-6 h-6 text-purple-600" />,
  Engineering: <DraftingCompass className="w-6 h-6 text-orange-600" />,
};

function ProgressBar({ percent }: { percent: number }) {
  const p = Math.max(0, Math.min(100, Math.round(percent)));
  return (
    <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
      <div className="h-3 bg-indigo-600 transition-all" style={{ width: `${p}%` }} />
    </div>
  );
}

interface LearningStyle {
  learningStyle: string;
  percentages: {
    visual: number;
    reading: number;
    practice: number;
  };
  confidence: number;
}

export function Lessons() {
  const navigate = useNavigate();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<ProgressItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [learningStyle, setLearningStyle] = useState<LearningStyle | null>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);

  const currentUser = useMemo(() => {
    try {
      const stored = localStorage.getItem('stem_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('stem_token');

        // Get learning style
        if (token && token !== 'demo_token') {
          try {
            const styleResp = await fetch('/api/learner/learning-style', {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (styleResp.ok) {
              const styleData = await styleResp.json();
              setLearningStyle(styleData);
            }
          } catch (e) {
            console.error('Error fetching learning style:', e);
          }

          // Get recommendations
          try {
            const recResp = await fetch('/api/recommendations?limit=6', {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (recResp.ok) {
              const recData = await recResp.json();
              setRecommendations(recData.data || recData || []);
            }
          } catch (e) {
            console.error('Error fetching recommendations:', e);
          }
        }

        // Get lessons: prefer server, fallback to IndexedDB
        let fetchedLessons: Lesson[] | null = null;
        if (token && token !== 'demo_token') {
          try {
            const resp = await fetch('/api/lessons', {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (resp.ok) {
              fetchedLessons = await resp.json();
            }
          } catch {}
        }
        if (!fetchedLessons) {
          fetchedLessons = await indexedDBService.getAllLessons();
        }
        
        // Sort lessons: prioritize by learning style match
        const lessonsList = (fetchedLessons || []).map(l => ({ 
          id: l.id, 
          title: (l as any).title, 
          subject: (l as any).subject,
          matchesLearningStyle: (l as any).matchesLearningStyle || false
        }));
        
        // Sort: learning style matches first
        lessonsList.sort((a, b) => {
          if (a.matchesLearningStyle && !b.matchesLearningStyle) return -1;
          if (!a.matchesLearningStyle && b.matchesLearningStyle) return 1;
          return 0;
        });
        
        setLessons(lessonsList);

        // Load user progress from IndexedDB (works offline); server sync can be added later
        if (currentUser?.id) {
          const userProg = await indexedDBService.getUserProgress(currentUser.id);
          setProgress(userProg as unknown as ProgressItem[]);
        } else {
          setProgress([]);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentUser?.id]);

  const subjects: SubjectKey[] = useMemo(
    () => ['Mathematics', 'Science', 'Technology', 'Engineering'],
    []
  );

  const subjectToLessons = useMemo(() => {
    const map: Record<string, Lesson[]> = {};
    for (const s of subjects) map[s] = [];
    for (const l of lessons) {
      const key = subjects.includes(l.subject as SubjectKey) ? (l.subject as SubjectKey) : undefined;
      if (key) map[key].push(l);
    }
    return map;
  }, [lessons, subjects]);

  const completedLessonIds = new Set(
    progress.filter(p => p.completed).map(p => p.lessonId)
  );

  const subjectProgress = useMemo(() => {
    const out: Record<string, { total: number; completed: number; percent: number }> = {};
    for (const s of subjects) {
      const total = subjectToLessons[s]?.length || 0;
      const completed = subjectToLessons[s]?.filter(l => completedLessonIds.has(l.id)).length || 0;
      const percent = total > 0 ? (completed / total) * 100 : 0;
      out[s] = { total, completed, percent };
    }
    return out;
  }, [subjects, subjectToLessons, completedLessonIds]);

  const lastViewed = useMemo(() => {
    if (!progress.length) return null;
    const sorted = [...progress].sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
    const latest = sorted[0];
    const lesson = lessons.find(l => l.id === latest.lessonId) || null;
    return lesson;
  }, [progress, lessons]);

  const handleOpenSubject = (subject: SubjectKey) => {
    if (subject === 'Science') {
      navigate('/lessons/science');
    }
  };

  const handleContinueLesson = () => {
    if (!lastViewed) return;
    if (lastViewed.subject === 'Science') {
      navigate('/lessons/science');
    }
  };

  const getLearningStyleLabel = (style: string) => {
    const labels: Record<string, string> = {
      visual: 'Visual Learner',
      reading: 'Reading Learner',
      kinesthetic: 'Kinesthetic Learner',
      mixed: 'Mixed Learning Style'
    };
    return labels[style] || style;
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-900">Lessons</h2>
        {learningStyle && (
          <div className="flex items-center gap-2 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            {getLearningStyleLabel(learningStyle.learningStyle)}
          </div>
        )}
      </div>

      {/* Recommended Content */}
      {recommendations.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            Recommended for Your Learning Style
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations
              .filter(rec => rec.matchesLearningStyle)
              .slice(0, 3)
              .map((rec) => (
                <div
                  key={`${rec.type}-${rec.id}`}
                  className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-4 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{rec.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{rec.subject}</p>
                    </div>
                    <span className="px-2 py-1 bg-indigo-600 text-white text-xs font-medium rounded-full flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Match
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">{rec.reason}</p>
                  <button
                    onClick={() => {
                      if (rec.type === 'quiz') {
                        navigate(`/quizzes?subject=${rec.subject}&chapter=${rec.chapter || ''}`);
                      } else {
                        navigate(`/lessons/${rec.subject.toLowerCase()}`);
                      }
                    }}
                    className="w-full mt-2 px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Start {rec.type === 'quiz' ? 'Quiz' : 'Lesson'}
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Continue Learning */}
      <div className="mb-6">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl shadow-lg p-6 flex items-center justify-between">
          <div>
            <p className="text-sm opacity-90 mb-1 flex items-center gap-2"><Clock className="w-4 h-4" /> Continue Learning</p>
            {lastViewed ? (
              <div>
                <h3 className="text-xl font-semibold">{lastViewed.subject} • {lastViewed.title}</h3>
                <p className="text-indigo-100 text-sm mt-1">Pick up where you left off</p>
              </div>
            ) : (
              <div>
                <h3 className="text-xl font-semibold">No recent lessons</h3>
                <p className="text-indigo-100 text-sm mt-1">Start a subject to begin learning</p>
              </div>
            )}
          </div>
          <button
            onClick={handleContinueLesson}
            disabled={!lastViewed}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors ${!lastViewed ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            Continue Learning
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Subjects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subjects.map((subject) => {
          const stats = subjectProgress[subject] || { total: 0, completed: 0, percent: 0 };
          const percent = stats.percent || 0;
          const btnText = percent === 0 ? 'Start Learning' : percent >= 100 ? 'Review' : 'Continue';
          
          // Check if this subject has recommended content matching learning style
          const hasRecommendedContent = recommendations.some(
            rec => rec.subject === subject && rec.matchesLearningStyle
          );
          
          return (
            <div 
              key={subject} 
              className={`bg-white rounded-2xl p-6 shadow-md border hover:shadow-lg transition-shadow ${
                hasRecommendedContent ? 'border-indigo-300 border-2' : 'border-gray-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {subjectIcon[subject]}
                  <h3 className="text-lg font-semibold text-gray-900">{subject}</h3>
                </div>
                <div className="flex items-center gap-2">
                  {hasRecommendedContent && (
                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Recommended
                    </span>
                  )}
                  <span className="text-sm text-gray-500">{Math.round(percent)}%</span>
                </div>
              </div>
              <div className="mt-3">
                <ProgressBar percent={percent} />
                <p className="text-sm text-gray-500 mt-2">{stats.completed}/{stats.total} Lessons Completed</p>
              </div>
              <button
                onClick={() => handleOpenSubject(subject)}
                className="mt-4 w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                {btnText}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Lessons;


