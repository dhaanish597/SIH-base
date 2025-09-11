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
  X,
  Calendar
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  userRole: 'student' | 'teacher' | 'school' | 'admin';
  onLogout?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ activeTab, onTabChange, userRole, onLogout, isOpen = false, onClose }: SidebarProps) {
  const { t } = useTranslation();

  const studentTabs = [
    { id: 'dashboard', label: t('navigation.dashboard'), icon: LayoutDashboard },
    { id: 'lessons', label: t('navigation.lessons'), icon: BookOpen },
    { id: 'quizzes', label: t('navigation.quizzes'), icon: Brain },
    { id: 'badges', label: t('navigation.badges'), icon: Award },
    { id: 'student-homework', label: 'Homework', icon: FileText },
    { id: 'student-assignments', label: 'Assignments', icon: FileText },
    { id: 'leaderboard', label: 'Leaderboard (Coming Soon)', icon: Trophy },
    { id: 'profile', label: t('navigation.profile'), icon: User }
  ];

  const teacherTabs = [
    { id: 'dashboard', label: t('teacher.dashboard'), icon: LayoutDashboard },
    { id: 'assign-homework', label: 'Assign Homework', icon: FileText },
    { id: 'assign-assignments', label: 'Assign Assignments', icon: FileText },
    { id: 'analytics', label: t('teacher.analytics'), icon: BarChart3 },
    { id: 'reports', label: t('teacher.reports'), icon: FileText },
    { id: 'profile', label: t('navigation.profile'), icon: User }
  ];

  const schoolTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'school-students', label: 'Students', icon: Users },
    { id: 'add-student', label: 'Add Student', icon: Users },
    { id: 'school-events', label: 'Add Events', icon: Calendar },
    { id: 'school-reports', label: 'Reports', icon: FileText },
    { id: 'school-settings', label: 'Settings', icon: Settings },
  ];

  const adminTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'admin-schools', label: 'Schools', icon: Users },
    { id: 'admin-analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'admin-users', label: 'User Management', icon: User },
  ];

  const tabs = userRole === 'teacher' ? teacherTabs : userRole === 'school' ? schoolTabs : userRole === 'admin' ? adminTabs : studentTabs;

  const handleTabClick = (id: string) => {
    onTabChange(id);
    onClose?.();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <nav 
        className={`
          bg-white shadow-lg h-full flex flex-col transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          fixed md:static top-0 left-0 w-64 z-50 md:z-auto
        `}
        aria-label="Primary navigation"
      >
        {/* Mobile close button */}
        <div className="md:hidden flex justify-between items-center p-4 border-b">
          <span className="text-lg font-semibold text-gray-900">Menu</span>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close navigation menu"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="flex-1 px-3 sm:px-4 py-4 sm:py-6 space-y-1 sm:space-y-2 overflow-y-auto">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => handleTabClick(id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                activeTab === id
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
              aria-current={activeTab === id ? 'page' : undefined}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${activeTab === id ? 'text-white' : 'text-gray-400'}`} aria-hidden="true" />
              <span className="font-medium text-sm sm:text-base truncate">{label}</span>
            </button>
          ))}
        </div>

        <div className="border-t p-3 sm:p-4 space-y-1 sm:space-y-2">
          {!(userRole === 'school' || userRole === 'admin') && (
            <button
              onClick={() => handleTabClick('settings')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                activeTab === 'settings'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
              aria-label="Settings"
            >
              <Settings className={`w-5 h-5 flex-shrink-0 ${activeTab === 'settings' ? 'text-white' : 'text-gray-400'}`} aria-hidden="true" />
              <span className="font-medium text-sm sm:text-base">{t('navigation.settings')}</span>
            </button>
          )}

          {onLogout && (
            <button
              onClick={() => { onLogout(); onClose?.(); }}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left text-red-600 hover:bg-red-50 transition-all duration-200"
              aria-label="Log out"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
              <span className="font-medium text-sm sm:text-base">{t('navigation.logout')}</span>
            </button>
          )}
        </div>
      </nav>
    </>
  );
}