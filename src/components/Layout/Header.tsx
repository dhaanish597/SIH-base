import React from 'react';
import { useTranslation } from 'react-i18next';
import { Wifi, WifiOff, BookOpen, User, Settings, Menu } from 'lucide-react';
import { useOfflineSync } from '../../hooks/useIndexedDB';

interface HeaderProps {
  user?: {
    name: string;
    role: 'student' | 'teacher' | 'school' | 'admin';
  };
  onProfileClick?: () => void;
  onSettingsClick?: () => void;
  onMenuToggle?: () => void;
  isMenuOpen?: boolean;
}

export function Header({ user, onProfileClick, onSettingsClick, onMenuToggle, isMenuOpen }: HeaderProps) {
  const { t } = useTranslation();
  const { syncStatus } = useOfflineSync();
  const isOnline = navigator.onLine;

  return (
    <header className="bg-white shadow-lg border-b-4 border-indigo-500 sticky top-0 z-50 safe-top" role="banner">
      <div className="container-responsive">
        <div className="flex justify-between items-center py-3 sm:py-4 min-h-[64px]">
          {/* Mobile menu button */}
          {user && (
            <button
              onClick={onMenuToggle}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors focus-visible"
              aria-label="Toggle navigation menu"
              aria-expanded={isMenuOpen ? true : false}
            >
              <Menu className="w-6 h-6 text-gray-600" />
            </button>
          )}

          {/* Logo */}
          <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-xl">
              <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <div className="hidden xs:block sm:block">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Resonate</h1>
              <p className="text-xs sm:text-sm text-gray-600">A better way to learn</p>
            </div>
          </div>

          {/* Status Indicators */}
          <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-4 flex-shrink-0">
            {/* Connection Status */}
            <div className="hidden lg:flex items-center space-x-2">
              {isOnline ? (
                <Wifi className="w-4 h-4 lg:w-5 lg:h-5 text-green-500" aria-label="Online" />
              ) : (
                <WifiOff className="w-4 h-4 lg:w-5 lg:h-5 text-red-500" aria-label="Offline" />
              )}
              <span className={`text-sm font-medium ${
                isOnline ? 'text-green-600' : 'text-red-600'
              }`}>
                {isOnline ? t('common.online') : t('common.offline')}
              </span>
            </div>

            {/* Mobile connection indicator */}
            <div className="lg:hidden">
              {isOnline ? (
                <Wifi className="w-4 h-4 text-green-500" aria-label="Online" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-500" aria-label="Offline" />
              )}
            </div>

            {/* Sync Status */}
            {syncStatus !== 'idle' && (
              <div className="hidden md:flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  syncStatus === 'syncing' ? 'bg-yellow-500 animate-pulse' :
                  syncStatus === 'success' ? 'bg-green-500' :
                  'bg-red-500'
                }`} aria-hidden="true" />
                <span className="text-sm text-gray-600">
                  {syncStatus === 'syncing' ? t('common.syncing') :
                   syncStatus === 'success' ? t('common.synced') :
                   t('common.error')}
                </span>
              </div>
            )}

            {/* User Menu */}
            {user && (
              <div className="flex items-center space-x-1 sm:space-x-2">
                <button
                  onClick={onSettingsClick}
                  className="hidden lg:block p-2 rounded-lg hover:bg-gray-100 transition-colors focus-visible"
                  aria-label="Settings"
                >
                  <Settings className="w-5 h-5 text-gray-600" />
                </button>
                <button
                  onClick={onProfileClick}
                  className="flex items-center space-x-1 sm:space-x-2 bg-indigo-50 hover:bg-indigo-100 px-2 sm:px-3 py-2 rounded-lg transition-colors focus-visible"
                  aria-label={`User profile: ${user.name}`}
                >
                  <User className="w-5 h-5 text-indigo-600" />
                  <span className="hidden sm:inline text-sm font-medium text-indigo-700 truncate max-w-24 lg:max-w-none">
                    {user.name}
                  </span>
                  <span className={`hidden sm:inline px-2 py-1 text-xs rounded-full ${
                    user.role === 'teacher' 
                      ? 'bg-purple-100 text-purple-700'
                      : user.role === 'school'
                      ? 'bg-emerald-100 text-emerald-700'
                      : user.role === 'admin'
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {user.role}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}