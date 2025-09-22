import React, { useState, useEffect, Suspense, useRef } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
const StudentProfile = React.lazy(() => import('./components/Student/StudentProfile').then(m => ({ default: m.StudentProfile })));
const TeacherProfile = React.lazy(() => import('./components/Teacher/TeacherProfile').then(m => ({ default: m.TeacherProfile })));
const ProfileRouter = React.lazy(() => import('./components/Profile/Profile').then(m => ({ default: m.default })));
const Lessons = React.lazy(() => import('./components/Student/Lessons').then(m => ({ default: m.Lessons })));
const Leaderboard = React.lazy(() => import('./components/Student/Leaderboard').then(m => ({ default: m.Leaderboard })));
import './i18n';

interface User {
  id: string;
  name: string;
  role: 'student' | 'teacher' | 'school' | 'admin';
  class?: string;
  email?: string;
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

    // Load user data
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      
      // Only trust server-verified token; do not auto-login from cached user
      const token = localStorage.getItem('stem_token');
      if (token && token !== 'demo_token') {
        try {
          // Try to fetch current user data from API
          const response = await fetch('/api/users/me', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
            localStorage.setItem('stem_user', JSON.stringify(userData));
          } else {
            // If API call fails, clear invalid token
            localStorage.removeItem('stem_token');
            localStorage.removeItem('stem_user');
            setUser(null);
            if (location.pathname !== '/login') {
              navigate('/login', { replace: true });
            }
          }
        } catch (error) {
          console.error('Error fetching user data from API:', error);
          // Clear invalid data
          localStorage.removeItem('stem_token');
          localStorage.removeItem('stem_user');
          setUser(null);
          if (location.pathname !== '/login') {
            navigate('/login', { replace: true });
          }
        }
      } else {
        // No token, ensure logged-out state
        setUser(null);
        if (location.pathname !== '/login') {
          navigate('/login', { replace: true });
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('stem_user', JSON.stringify(userData));
    setActiveTab('dashboard');
    if (location.pathname === '/login') {
      navigate('/', { replace: true });
    }
  };

  const handleLogout = () => {
    try {
      // Clear auth-related storage
      localStorage.removeItem('stem_user');
      localStorage.removeItem('stem_token');
      localStorage.removeItem('auth_role');
      sessionStorage.clear();
    } catch {}

    // Reset app state
    setUser(null);
    setActiveTab('dashboard');
    setIsSidebarOpen(false);

    // Redirect to login without auto-login
    if (location.pathname !== '/login') {
      navigate('/login', { replace: true });
    }
  };

  const handleUserUpdate = (updatedUser: { id: string; name: string; role: string; class?: string; email?: string }) => {
    const user: User = {
      id: updatedUser.id,
      name: updatedUser.name,
      role: updatedUser.role as 'student' | 'teacher' | 'school' | 'admin',
      class: updatedUser.class,
      email: updatedUser.email
    };
    setUser(user);
    localStorage.setItem('stem_user', JSON.stringify(user));
  };

  const changeLanguage = (language: string) => {
    i18n.changeLanguage(language);
    localStorage.setItem('preferred_language', language);
  };

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const closeSidebar = () => setIsSidebarOpen(false);

  // Keep route on /login when not authenticated (must be before any early returns)
  useEffect(() => {
    if (!user && location.pathname !== '/login') {
      navigate('/login', { replace: true });
    }
  }, [user, location.pathname, navigate]);

  // If authenticated but still on /login, redirect to dashboard
  useEffect(() => {
    if (user && location.pathname === '/login') {
      navigate('/', { replace: true });
    }
  }, [user, location.pathname, navigate]);

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

  // Show login page route when no user
  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="*" element={<Login onLogin={handleLogin} />} />
      </Routes>
    );
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
        return <Leaderboard userClass={user?.class} isUserDataLoading={isLoading} />;
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
        return <Lessons />;
      case 'profile':
        return <ProfileRouter />;
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

  // Map tab IDs to routes for navigation
  const tabToRoute: Record<string, string> = {
    dashboard: '/',
    lessons: '/lessons',
    quizzes: '/quizzes',
    'student-homework': '/',
    'student-assignments': '/',
    leaderboard: '/',
    profile: '/profile',
    'assign-homework': '/',
    'assign-assignments': '/',
    analytics: '/',
    reports: '/',
    'add-student': '/',
    'school-students': '/',
    'school-events': '/',
    'school-reports': '/',
    'school-settings': '/',
    'admin-schools': '/',
    'admin-analytics': '/',
    'admin-users': '/',
    settings: '/',
  };

  // Custom tab change handler: set activeTab and navigate
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    const route = tabToRoute[tab] || '/';
    if (location.pathname !== route) {
      navigate(route);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onMenuToggle={toggleSidebar} isMenuOpen={isSidebarOpen} />
      <div className="flex flex-col md:flex-row h-[calc(100vh-80px)] md:h-[calc(100vh-80px)]">
        <div className="w-0 md:w-64 flex-shrink-0">
          <Sidebar
            activeTab={activeTab}
            onTabChange={handleTabChange}
            userRole={user.role}
            onLogout={handleLogout}
            isOpen={isSidebarOpen}
            onClose={closeSidebar}
          />
        </div>
        <main ref={mainRef} className="flex-1 overflow-auto focus:outline-none" role="main" tabIndex={-1}>
          <Suspense fallback={<div className="p-6">Loading…</div>}>
            <Routes>
              <Route path="/login" element={<Login onLogin={handleLogin} />} />
              <Route path="/" element={renderContent()} />
              <Route path="/lessons" element={renderContent()} />
              <Route path="/quizzes" element={<QuizSelection />} />
              <Route path="/play-quiz/:gameName" element={<GamePlayer />} />
              <Route path="/lessons/science" element={<ScienceChapters />} />
              <Route path="/lessons/science/:chapterFile" element={<LessonViewer />} />
              <Route path="/profile" element={<ProfileRouter />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </div>
  );
}

export default App;