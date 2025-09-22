import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calculator, FlaskConical, Cpu, DraftingCompass, ArrowRight, Clock } from 'lucide-react';
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

export function Lessons() {
  const navigate = useNavigate();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<ProgressItem[]>([]);
  const [loading, setLoading] = useState(true);

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
        setLessons((fetchedLessons || []).map(l => ({ id: l.id, title: (l as any).title, subject: (l as any).subject })));

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

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Lessons</h2>

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
          return (
            <div key={subject} className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {subjectIcon[subject]}
                  <h3 className="text-lg font-semibold text-gray-900">{subject}</h3>
                </div>
                <span className="text-sm text-gray-500">{Math.round(percent)}%</span>
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


