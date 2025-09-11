import React, { useState, useEffect, Suspense, useRef } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Trophy } from 'lucide-react';
import { Header } from './components/Layout/Header';
import { Sidebar } from './components/Layout/Sidebar';
import { Login } from './components/Auth/Login';
import { StudentHomework } from './components/Student/StudentHomework';
import { StudentAssignments } from './components/Student/StudentAssignments';
const StudentDashboard = React.lazy(() => import('./components/Student/Dashboard').then(m => ({ default: m.StudentDashboard })));
const AddStudent = React.lazy(() => import('./components/Teacher/AddStudent').then(m => ({ default: m.AddStudent })));
const TeacherAssignHomework = React.lazy(() => import('./components/Teacher/TeacherAssignHomework').then(m => ({ default: m.TeacherAssignHomework })));
const TeacherAssignAssignments = React.lazy(() => import('./components/Teacher/TeacherAssignAssignments').then(m => ({ default: m.TeacherAssignAssignments })));
const TeacherDashboard = React.lazy(() => import('./components/Teacher/Dashboard').then(m => ({ default: m.TeacherDashboard })));
const SchoolDashboard = React.lazy(() => import('./components/School/SchoolDashboard').then(m => ({ default: m.SchoolDashboard })));
const AdminDashboard = React.lazy(() => import('./components/Admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const SchoolStudents = React.lazy(() => import('./components/School/SchoolStudents').then(m => ({ default: m.SchoolStudents })));
const SchoolReports = React.lazy(() => import('./components/School/SchoolReports').then(m => ({ default: m.SchoolReports })));
const SchoolSettings = React.lazy(() => import('./components/School/SchoolSettings').then(m => ({ default: m.SchoolSettings })));
const SchoolAddEvents = React.lazy(() => import('./components/School/SchoolAddEvents').then(m => ({ default: m.SchoolAddEvents })));
const AdminSchools = React.lazy(() => import('./components/Admin/AdminSchools').then(m => ({ default: m.AdminSchools })));
const AdminAnalytics = React.lazy(() => import('./components/Admin/AdminAnalytics').then(m => ({ default: m.AdminAnalytics })));
const AdminUsers = React.lazy(() => import('./components/Admin/AdminUsers').then(m => ({ default: m.AdminUsers })));
const QuizSelection = React.lazy(() => import('./components/Student/QuizSelection').then(m => ({ default: m.QuizSelection })));
const GamePlayer = React.lazy(() => import('./components/Student/GamePlayer').then(m => ({ default: m.GamePlayer })));
const ScienceChapters = React.lazy(() => import('./components/Lessons/ScienceChapters').then(m => ({ default: m.ScienceChapters })));
const LessonViewer = React.lazy(() => import('./components/Lessons/LessonViewer').then(m => ({ default: m.LessonViewer })));
import './i18n';

interface User {
  id: string;
  name: string;
  role: 'student' | 'teacher' | 'school' | 'admin';
}

function App() {
  const { i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const mainRef = useRef<HTMLDivElement | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    // Register service worker for PWA
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('SW registered: ', registration);
          })
          .catch((registrationError) => {
            console.log('SW registration failed: ', registrationError);
          });
      });
    }

    // Check for cached user
    const cachedUser = localStorage.getItem('stem_user');
    if (cachedUser) {
      try {
        const userData = JSON.parse(cachedUser);
        setUser(userData);
      } catch (error) {
        console.error('Error parsing cached user data:', error);
        localStorage.removeItem('stem_user');
      }
    }
    setIsLoading(false);
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('stem_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('stem_user');
    setActiveTab('dashboard');
    // Force re-render to ensure login page is shown
    window.location.reload();
  };

  const changeLanguage = (language: string) => {
    i18n.changeLanguage(language);
    localStorage.setItem('preferred_language', language);
  };

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const closeSidebar = () => setIsSidebarOpen(false);

  // If user navigates away from Quizzes tab, ensure any game route is closed
  useEffect(() => {
    const isGameRoute = location.pathname.startsWith('/play-quiz/');
    if (activeTab !== 'quizzes' && isGameRoute) {
      navigate('/');
    }
  }, [activeTab, location.pathname, navigate]);

  // Ensure we scroll to top of the scrollable main area on route change,
  // so games are immediately visible without manual scrolling
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
    // Also scroll window for browsers not using the inner scrolling container
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [location.pathname, location.search]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Show login page if no user is authenticated
  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        if (user.role === 'student') return <StudentDashboard userId={user.id} userName={user.name} />;
        if (user.role === 'teacher') return <TeacherDashboard />;
        if (user.role === 'school') return <SchoolDashboard />;
        if (user.role === 'admin') return <AdminDashboard />;
        return null;
      case 'leaderboard':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Leaderboard</h2>
            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
              <div className="text-center py-12">
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Trophy className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Leaderboard Coming Soon</h3>
                <p className="text-gray-600">This feature will be implemented soon. Stay tuned for updates!</p>
              </div>
            </div>
          </div>
        );
      case 'quizzes':
        return <QuizSelection />;
      case 'assign-homework':
        return <TeacherAssignHomework />;
      case 'assign-assignments':
        return <TeacherAssignAssignments />;
      case 'student-homework':
        return <StudentHomework />;
      case 'student-assignments':
        return <StudentAssignments />;
      case 'lessons':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Lessons</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {['Mathematics', 'Science', 'Technology', 'Engineering'].map((subject) => (
                <div key={subject} className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{subject}</h3>
                  <p className="text-gray-600 mb-4">Explore {subject.toLowerCase()} concepts</p>
                  <button
                    onClick={() => {
                      if (subject === 'Science') {
                        navigate('/lessons/science');
                      }
                    }}
                    className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Start Learning
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Settings</h2>
            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Language
                  </label>
                  <select
                    value={i18n.language}
                    onChange={(e) => changeLanguage(e.target.value)}
                    className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="hi">हिंदी</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Offline Mode
                  </label>
                  <p className="text-sm text-gray-600">
                    Download lessons for offline access. Your progress will sync when you're back online.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'add-student':
        return (
          <AddStudent />
        );
      // School routes
      case 'school-students':
        return <SchoolStudents />;
      case 'school-events':
        return <SchoolAddEvents />;
      case 'school-reports':
        return <SchoolReports />;
      case 'school-settings':
        return <SchoolSettings />;
      // Admin routes
      case 'admin-schools':
        return <AdminSchools />;
      case 'admin-analytics':
        return <AdminAnalytics />;
      case 'admin-users':
        return <AdminUsers />;
      default:
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </h2>
            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
              <p className="text-gray-600">This feature is coming soon!</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onMenuToggle={toggleSidebar} isMenuOpen={isSidebarOpen} />
      
      <div className="flex flex-col md:flex-row h-[calc(100vh-80px)] md:h-[calc(100vh-80px)]">
        <div className="w-0 md:w-64 flex-shrink-0">
          <Sidebar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            userRole={user.role}
            onLogout={handleLogout}
            isOpen={isSidebarOpen}
            onClose={closeSidebar}
          />
        </div>
        
        <main ref={mainRef} className="flex-1 overflow-auto focus:outline-none" role="main" tabIndex={-1}>
          <Suspense fallback={<div className="p-6">Loading…</div>}>
            <Routes>
              <Route path="/" element={renderContent()} />
              <Route path="/quizzes" element={<QuizSelection />} />
              <Route path="/play-quiz/:gameName" element={<GamePlayer />} />
              <Route path="/lessons/science" element={<ScienceChapters />} />
              <Route path="/lessons/science/:chapterFile" element={<LessonViewer />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </div>
  );
}

export default App;