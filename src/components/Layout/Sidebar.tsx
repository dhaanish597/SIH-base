import React, { useState } from 'react';
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
  Trophy,
  Menu,
  X
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  userRole: 'student' | 'teacher';
  onLogout?: () => void;
}

export function Sidebar({ activeTab, onTabChange, userRole, onLogout }: SidebarProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

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
    <nav aria-label="Primary" className="h-full">
      {/* Mobile top bar */}
      <div className="md:hidden bg-white shadow flex items-center justify-between px-4 py-3">
        <button
          aria-label={open ? 'Close menu' : 'Open menu'}
          className="p-2 rounded-lg border border-gray-200"
          onClick={() => setOpen(!open)}
        >
          {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
        <span className="text-sm text-gray-700">{userRole === 'teacher' ? 'Teacher' : 'Student'}</span>
        <button
          onClick={() => onTabChange('settings')}
          className="p-2 rounded-lg border border-gray-200"
          aria-label="Open settings"
        >
          <Settings aria-hidden="true" />
        </button>
      </div>

      {/* Sidebar panel */}
      <div
        className={`
          bg-white shadow-lg h-full flex flex-col md:translate-x-0 transition-transform duration-200
          ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          fixed md:static top-0 left-0 w-64 z-40
        `}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto" aria-label="Sections">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => { onTabChange(id); setOpen(false); }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                activeTab === id
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
              aria-current={activeTab === id ? 'page' : undefined}
            >
              <Icon className={`w-5 h-5 ${activeTab === id ? 'text-white' : 'text-gray-400'}`} aria-hidden="true" />
              <span className="font-medium">{label}</span>
            </button>
          ))}
        </nav>

        <div className="border-t p-4 space-y-2">
          <button
            onClick={() => { onTabChange('settings'); setOpen(false); }}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
              activeTab === 'settings'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
            aria-label="Settings"
          >
            <Settings className={`w-5 h-5 ${activeTab === 'settings' ? 'text-white' : 'text-gray-400'}`} aria-hidden="true" />
            <span className="font-medium">{t('navigation.settings')}</span>
          </button>

          {onLogout && (
            <button
              onClick={() => { onLogout(); setOpen(false); }}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left text-red-600 hover:bg-red-50 transition-all duration-200"
              aria-label="Log out"
            >
              <LogOut className="w-5 h-5" aria-hidden="true" />
              <span className="font-medium">{t('navigation.logout')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Backdrop for mobile */}
      {open && <button aria-hidden="true" className="fixed inset-0 bg-black/20 md:hidden" onClick={() => setOpen(false)} />}
    </nav>
  );
}