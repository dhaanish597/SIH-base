import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  LayoutDashboard, 
  BookOpen, 
  Brain, 
  Award, 
  User, 
  Settings,
  Users,
  BarChart3,
  FileText,
  LogOut,
  Trophy
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  userRole: 'student' | 'teacher';
  onLogout?: () => void;
}

export function Sidebar({ activeTab, onTabChange, userRole, onLogout }: SidebarProps) {
  const { t } = useTranslation();

  const studentTabs = [
    { id: 'dashboard', label: t('navigation.dashboard'), icon: LayoutDashboard },
    { id: 'lessons', label: t('navigation.lessons'), icon: BookOpen },
    { id: 'quizzes', label: t('navigation.quizzes'), icon: Brain },
    { id: 'badges', label: t('navigation.badges'), icon: Award },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    { id: 'profile', label: t('navigation.profile'), icon: User }
  ];

  const teacherTabs = [
    { id: 'dashboard', label: t('teacher.dashboard'), icon: LayoutDashboard },
    { id: 'students', label: t('teacher.students'), icon: Users },
    { id: 'add-student', label: 'Add Student', icon: Users },
    { id: 'analytics', label: t('teacher.analytics'), icon: BarChart3 },
    { id: 'reports', label: t('teacher.reports'), icon: FileText },
    { id: 'profile', label: t('navigation.profile'), icon: User }
  ];

  const tabs = userRole === 'teacher' ? teacherTabs : studentTabs;

  return (
    <div className="bg-white shadow-lg h-full flex flex-col">
      <nav className="flex-1 px-4 py-6 space-y-2">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
              activeTab === id
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <Icon className={`w-5 h-5 ${activeTab === id ? 'text-white' : 'text-gray-400'}`} />
            <span className="font-medium">{label}</span>
          </button>
        ))}
      </nav>

      {/* Settings & Logout */}
      <div className="border-t p-4 space-y-2">
        <button
          onClick={() => onTabChange('settings')}
          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
            activeTab === 'settings'
              ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          <Settings className={`w-5 h-5 ${activeTab === 'settings' ? 'text-white' : 'text-gray-400'}`} />
          <span className="font-medium">{t('navigation.settings')}</span>
        </button>

        {onLogout && (
          <button
            onClick={onLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left text-red-600 hover:bg-red-50 transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">{t('navigation.logout')}</span>
          </button>
        )}
      </div>
    </div>
  );
}