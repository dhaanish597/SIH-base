import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useTranslation } from 'react-i18next';
import { Header } from './components/Layout/Header';
import { Sidebar } from './components/Layout/Sidebar';
import { Login } from './components/Auth/Login';
import { PageLoader } from './components/Loading/LoadingSpinner';
import { DashboardSkeleton } from './components/Loading/SkeletonLoader';
import './i18n';

// Lazy load components for better performance
const StudentDashboard = lazy(() => import('./components/Student/Dashboard').then(module => ({ default: module.StudentDashboard })));
const Leaderboard = lazy(() => import('./components/Student/Leaderboard').then(module => ({ default: module.Leaderboard })));
const AddStudent = lazy(() => import('./components/Teacher/AddStudent').then(module => ({ default: module.AddStudent })));
const TeacherDashboard = lazy(() => import('./components/Teacher/Dashboard').then(module => ({ default: module.TeacherDashboard })));

interface User {
  id: string;
  name: string;
  role: 'student' | 'teacher';
}

function App() {
  const { i18n } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    // // Register service worker for PWA (DISABLED FOR DEV)
    // if ('serviceWorker' in navigator) {
    //   window.addEventListener('load', () => {
    //     navigator.serviceWorker.register('/sw.js')
    //       .then((registration) => {
    //         console.log('SW registered: ', registration);
    //       })
    //       .catch((registrationError) => {
    //         console.log('SW registration failed: ', registrationError);
    //       });
    //   });
    // }

    // Check for cached user
    const cachedUser = localStorage.getItem('stem_user');
    if (cachedUser) {
      setUser(JSON.parse(cachedUser));
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
  };

  const changeLanguage = (language: string) => {
    i18n.changeLanguage(language);
    localStorage.setItem('preferred_language', language);
  };

  if (isLoading) {
    return <PageLoader />;
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return user.role === 'student' ? (
          <Suspense fallback={<DashboardSkeleton />}>
            <StudentDashboard userId={user.id} userName={user.name} />
          </Suspense>
        ) : (
          <Suspense fallback={<DashboardSkeleton />}>
            <TeacherDashboard />
          </Suspense>
        );
      case 'leaderboard':
        return (
          <Suspense fallback={<DashboardSkeleton />}>
            <Leaderboard />
          </Suspense>
        );
      case 'lessons':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Lessons</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {['Mathematics', 'Science', 'Technology', 'Engineering'].map((subject) => (
                <div key={subject} className="bg-white rounded-xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{subject}</h3>
                  <p className="text-gray-600 mb-4">Explore {subject.toLowerCase()} concepts</p>
                  <button className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors">
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
          <Suspense fallback={<DashboardSkeleton />}>
            <AddStudent />
          </Suspense>
        );
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
      <Header user={user} onMenuClick={() => setIsSidebarOpen(true)} />
      
      <div className="flex h-[calc(100vh-80px)]">
        {/* Desktop sidebar */}
        <div className="hidden md:block w-64 flex-shrink-0">
          <Sidebar
            activeTab={activeTab}
            onTabChange={(tab) => { setActiveTab(tab); }}
            userRole={user.role}
            onLogout={handleLogout}
          />
        </div>

        {/* Mobile drawer */}
        {isSidebarOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setIsSidebarOpen(false)} />
            <div className="absolute inset-y-0 left-0 w-72 max-w-[80%] bg-white shadow-xl">
              <Sidebar
                activeTab={activeTab}
                onTabChange={(tab) => { setActiveTab(tab); setIsSidebarOpen(false); }}
                userRole={user.role}
                onLogout={() => { handleLogout(); setIsSidebarOpen(false); }}
              />
            </div>
          </div>
        )}
        
        <main className="flex-1 overflow-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default App;