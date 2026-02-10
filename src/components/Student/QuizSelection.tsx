import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Zap } from 'lucide-react';
import { 
  getSubjectsForGrade, 
  getChaptersForSubject, 
  getQuestionCountForChapter,
  getChapterCompletion,
  getAvailableGrades
} from '../../utils/questionsData';

type Recommendation = {
  type: 'lesson' | 'quiz';
  id: string;
  title: string;
  subject: string;
  chapter: string | null;
  reason: string;
  priority_score: number;
  estimatedTime: number;
  difficulty?: number;
  lesson_id?: string;
};

const games = [
  { id: 'cargame', name: 'Car Race Game', thumbnail: '/thumbnails/cargameLogo.jpeg' },
  { id: 'plantsgame', name: 'Plant Game', thumbnail: '/thumbnails/plantgamelogo.jpg' },
  { id: 'fightinggame', name: 'Fighting Game', thumbnail: '/thumbnails/fightgamelogo.jpg' }
];

const subjectThumbnails: { [key: string]: string } = {
  'Mathematics': '/thumbnails/mathLogo.jpg',
  'Chemistry': '/thumbnails/ChemistryLogo.png',
  'Physics': '/thumbnails/PhysicsLogo.png',
  'Biology': '/thumbnails/Biology logo.jpg'
};

export function QuizSelection() {
  const navigate = useNavigate();
  const [selectedGame, setSelectedGame] = useState<'cargame' | 'plantsgame' | 'fightinggame'>('cargame');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedChapter, setSelectedChapter] = useState<string>('');
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [availableChapters, setAvailableChapters] = useState<string[]>([]);
  const [chapterQuestionCounts, setChapterQuestionCounts] = useState<{ [chapter: string]: number }>({});
  const [loading, setLoading] = useState(true);
  const [userGrade, setUserGrade] = useState<string>('6');
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Get user grade from localStorage
  useEffect(() => {
    const loadUserGrade = async () => {
      const userRaw = localStorage.getItem('stem_user');
        if (userRaw) {
          try {
            const user = JSON.parse(userRaw);
            
            if (user.class) {
              // Check what grades are available in the questions data
              const availableGrades = await getAvailableGrades();
              
              // Use the user's grade if available, otherwise use the first available grade
              const userGrade = availableGrades.includes(user.class) ? user.class : availableGrades[0] || '6';
              setUserGrade(userGrade);
            }
          } catch (error) {
            console.error('Error parsing user data:', error);
          }
        }
    };

    loadUserGrade();
  }, []);

  // Load completed lessons from server
  useEffect(() => {
    const loadProgress = async () => {
      try {
        const token = localStorage.getItem('stem_token');
        if (!token || token === 'demo_token') return;
        const res = await fetch('/api/user-progress', { headers: { 'Authorization': `Bearer ${token}` } });
        if (!res.ok) return;
        const list: Array<{ lesson_id: string }> = await res.json();
        setCompletedLessons(new Set(list.map(i => i.lesson_id)));
      } catch {}
    };
    loadProgress();
    const onCompleted = (e: any) => loadProgress();
    window.addEventListener('quiz:completed', onCompleted);
    return () => window.removeEventListener('quiz:completed', onCompleted);
  }, []);

  // Load available subjects for the user's grade
  useEffect(() => {
    const loadSubjects = async () => {
      try {
        setLoading(true);
        const subjects = await getSubjectsForGrade(userGrade);
        setAvailableSubjects(subjects);
      } catch (error) {
        console.error('Error loading subjects:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSubjects();
  }, [userGrade]);

  // Load chapters when subject is selected
  useEffect(() => {
    const loadChapters = async () => {
      if (!selectedSubject) {
        setAvailableChapters([]);
        setChapterQuestionCounts({});
        return;
      }

      try {
        setLoading(true);
        const chapters = await getChaptersForSubject(userGrade, selectedSubject);
        setAvailableChapters(chapters);

        // Load question counts for each chapter
        const counts: { [chapter: string]: number } = {};
        for (const chapter of chapters) {
          const count = await getQuestionCountForChapter(userGrade, selectedSubject, chapter);
          counts[chapter] = count;
        }
        setChapterQuestionCounts(counts);
      } catch (error) {
        console.error('Error loading chapters:', error);
      } finally {
        setLoading(false);
      }
    };

    loadChapters();
  }, [selectedSubject, userGrade]);

  // Reset chapter selection when subject changes
  useEffect(() => {
    setSelectedChapter('');
  }, [selectedSubject]);

  // Fetch recommendations on mount
  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setRecommendationsLoading(true);
        const token = localStorage.getItem('stem_token');
        if (!token) {
          setRecommendationsLoading(false);
          return;
        }

        const response = await fetch('/api/recommendations?limit=5', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            // Filter to only show quiz recommendations
            const quizRecommendations = result.data.filter((rec: Recommendation) => rec.type === 'quiz');
            setRecommendations(quizRecommendations);
          }
        }
      } catch (error) {
        console.error('Error fetching recommendations:', error);
      } finally {
        setRecommendationsLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  // Show toast message
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const startGame = () => {
    if (!selectedSubject || !selectedChapter) {
      alert('Please select both a subject and a chapter before starting the game.');
      return;
    }
    
    navigate(`/play-quiz/${selectedGame}?grade=${encodeURIComponent(userGrade)}&subject=${encodeURIComponent(selectedSubject)}&chapter=${encodeURIComponent(selectedChapter)}`);
  };

  const handleRecommendedQuizClick = (rec: Recommendation) => {
    // Auto-populate selections
    if (rec.subject) {
      setSelectedSubject(rec.subject);
    }
    if (rec.chapter) {
      setSelectedChapter(rec.chapter);
    }
    // Default to cargame if not specified
    setSelectedGame('cargame');
    
    // Show toast
    setToastMessage('Starting recommended quiz...');
    
    // Small delay to show toast, then start game
    setTimeout(() => {
      if (rec.subject && rec.chapter) {
        navigate(`/play-quiz/cargame?grade=${encodeURIComponent(userGrade)}&subject=${encodeURIComponent(rec.subject)}&chapter=${encodeURIComponent(rec.chapter)}`);
      } else {
        // If missing data, just set selections and let user click start
        startGame();
      }
    }, 500);
  };

  // Calculate quizzes remaining for selected chapter
  const getQuizzesRemaining = () => {
    if (!selectedChapter || !chapterQuestionCounts[selectedChapter]) {
      return { remaining: 0, total: 0 };
    }
    const total = chapterQuestionCounts[selectedChapter];
    const completed = getChapterCompletion(userGrade, selectedSubject, selectedChapter).completed;
    return { remaining: total - completed, total };
  };

  const quizzesRemaining = getQuizzesRemaining();

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-gray-600">Loading quiz data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 bg-indigo-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center space-x-2 animate-pulse transform transition-all duration-300">
          <Zap className="w-5 h-5" />
          <span>{toastMessage}</span>
        </div>
      )}

      <h1 className="text-2xl font-bold mb-4">Choose a Game</h1>
      
      {/* Recommended Quizzes Section */}
      {recommendations.length > 0 && (
        <div className="mb-8">
          <div className="bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 rounded-xl p-6 text-white mb-4">
            <div className="flex items-center space-x-2 mb-4">
              <Sparkles className="w-6 h-6" />
              <h2 className="text-2xl font-bold">Recommended Quizzes</h2>
            </div>
            <p className="text-purple-100 mb-4">Personalized quizzes based on your learning progress</p>
            
            {recommendationsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="bg-white/20 rounded-lg p-4 animate-pulse">
                    <div className="h-4 bg-white/30 rounded w-3/4 mb-3"></div>
                    <div className="h-3 bg-white/30 rounded w-1/2 mb-4"></div>
                    <div className="h-8 bg-white/30 rounded w-full"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {recommendations.slice(0, 5).map((rec, index) => (
                  <div
                    key={`${rec.type}-${rec.id}-${index}`}
                    className="bg-white/10 backdrop-blur-sm rounded-lg p-4 hover:bg-white/20 transition-all cursor-pointer border border-white/20 hover:border-white/40 hover:shadow-lg"
                    onClick={() => handleRecommendedQuizClick(rec)}
                  >
                    <div className="mb-3">
                      <h3 className="font-semibold text-white mb-1 line-clamp-2 text-sm">
                        {rec.title}
                      </h3>
                      <p className="text-purple-100 text-xs mb-2">
                        {rec.subject}
                        {rec.chapter && ` • ${rec.chapter}`}
                      </p>
                    </div>
                    
                    {rec.reason && (
                      <div className="mb-3">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white/20 text-white">
                          {rec.reason.length > 30 ? rec.reason.substring(0, 30) + '...' : rec.reason}
                        </span>
                      </div>
                    )}
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRecommendedQuizClick(rec);
                      }}
                      className="w-full bg-white text-indigo-600 px-4 py-2 rounded-lg font-semibold hover:bg-indigo-50 transition-colors text-sm mt-2"
                    >
                      Start Quiz
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Quizzes Remaining Counter */}
      {selectedChapter && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-blue-900">Quizzes Remaining</h3>
              <p className="text-blue-700">
                {quizzesRemaining.remaining} / {quizzesRemaining.total} questions
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                {quizzesRemaining.total > 0 ? Math.round(((quizzesRemaining.total - quizzesRemaining.remaining) / quizzesRemaining.total) * 100) : 0}%
              </div>
              <div className="text-sm text-blue-500">Complete</div>
            </div>
          </div>
        </div>
      )}

      {/* Game Selection */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Choose a Game</h2>
        <div className="flex gap-4 flex-wrap justify-center">
          {games.map((game) => (
            <button
              key={game.id}
              onClick={() => setSelectedGame(game.id as 'cargame' | 'plantsgame' | 'fightinggame')}
              className={`px-4 py-3 rounded-lg border flex flex-col items-center space-y-2 transition-all duration-200 ${
                selectedGame === game.id 
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                  : 'bg-white text-gray-800 border-gray-300 hover:border-indigo-500 hover:shadow-md'
              }`}
            >
              <img 
                src={game.thumbnail} 
                alt={`${game.name} logo`}
                className="w-12 h-12 object-contain"
              />
              <span className="text-sm font-medium">{game.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Subject Selection */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Select Subject</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {availableSubjects.map((subject) => (
            <button
              key={subject}
              onClick={() => setSelectedSubject(subject)}
              className={`border rounded-lg p-4 flex flex-col items-center space-y-2 transition-all duration-200 hover:shadow-md ${
                selectedSubject === subject
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                  : 'border-gray-300 hover:border-indigo-500 hover:text-indigo-700'
              }`}
            >
              <img 
                src={subjectThumbnails[subject] || '/thumbnails/mathLogo.jpg'} 
                alt={`${subject} logo`}
                className="w-16 h-16 object-contain"
              />
              <span className="text-sm font-medium">{subject}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Chapter Selection */}
      {selectedSubject && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Select Chapter/Topic</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableChapters.map((chapter) => {
              const totalQuestions = chapterQuestionCounts[chapter] || 0;
              const completion = getChapterCompletion(userGrade, selectedSubject, chapter);
              const completedServer = completedLessons.has(chapter);
              const isSelected = selectedChapter === chapter;
              
              return (
                <button
                  key={chapter}
                  onClick={() => setSelectedChapter(chapter)}
                  className={`border rounded-lg p-4 text-left transition-all duration-200 hover:shadow-md ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-300 hover:border-indigo-500 hover:text-indigo-700'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-sm leading-tight">{chapter}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      isSelected ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {completion.completed}/{totalQuestions}{completedServer ? ' • ✓' : ''}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {totalQuestions} questions
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Start Game Button */}
      {selectedSubject && selectedChapter && (
        <div className="flex justify-center">
          <button
            onClick={startGame}
            className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-md"
          >
            Start {selectedGame.charAt(0).toUpperCase() + selectedGame.slice(1)} Game
          </button>
        </div>
      )}
    </div>
  );
}


