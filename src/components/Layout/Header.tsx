// React import removed as it's unused
import { useTranslation } from 'react-i18next';
import { Wifi, WifiOff, BookOpen, User, Settings } from 'lucide-react';
import { useOfflineSync } from '../../hooks/useIndexedDB';

interface HeaderProps {
  user?: {
    name: string;
    role: 'student' | 'teacher';
  };
  onMenuClick?: () => void;
  onProfileClick?: () => void;
  onSettingsClick?: () => void;
}

export function Header({ user, onMenuClick, onProfileClick, onSettingsClick }: HeaderProps) {
  const { t } = useTranslation();
  const { syncStatus } = useOfflineSync();
  const isOnline = navigator.onLine;

  return (
    <header className="bg-white shadow-lg border-b-4 border-indigo-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Left: mobile menu + logo */}
          <div className="flex items-center space-x-3">
            <button
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
              onClick={onMenuClick}
              aria-label="Open navigation"
            >
              <span className="block w-5 h-0.5 bg-gray-800 mb-1"></span>
              <span className="block w-5 h-0.5 bg-gray-800 mb-1"></span>
              <span className="block w-5 h-0.5 bg-gray-800"></span>
            </button>
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-xl">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-lg md:text-2xl font-bold text-gray-900 whitespace-nowrap ">STEM Learn</h1>
              <p className="text-sm text-gray-600">Gamified Learning Platform</p>
            </div>
          </div>

          {/* Status Indicators */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Connection Status - hide text on very small screens */}
            <div className="flex items-center space-x-1 sm:space-x-2">
              {isOnline ? (
                <Wifi className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
              ) : (
                <WifiOff className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
              )}
              <span className={`text-xs sm:text-sm font-medium hidden sm:inline ${
                isOnline ? 'text-green-600' : 'text-red-600'
              }`}>
                {isOnline ? t('common.online') : t('common.offline')}
              </span>
            </div>

            {/* Sync Status */}
            {syncStatus !== 'idle' && (
              <div className="flex items-center space-x-1 sm:space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  syncStatus === 'syncing' ? 'bg-yellow-500 animate-pulse' :
                  syncStatus === 'success' ? 'bg-green-500' :
                  'bg-red-500'
                }`} />
                <span className="text-xs sm:text-sm text-gray-600 hidden sm:inline">
                  {syncStatus === 'syncing' ? t('common.syncing') :
                   syncStatus === 'success' ? t('common.synced') :
                   t('common.error')}
                </span>
              </div>
            )}

            {/* User Menu */}
            {user && (
              <div className="flex items-center space-x-1 sm:space-x-3 min-w-0">
                <button
                  onClick={onSettingsClick}
                  className="p-1 sm:p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                </button>
                {/* Profile button - only show on desktop/tablet */}
                <button
                  onClick={onProfileClick}
                  className="hidden md:flex items-center space-x-2 bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded-lg transition-colors"
                >
                  <User className="w-5 h-5 text-indigo-600" />
                  <span className="text-sm font-medium text-indigo-700 truncate max-w-[120px]">
                    {user.name}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full shrink-0 ${
                    user.role === 'teacher' 
                      ? 'bg-purple-100 text-purple-700'
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