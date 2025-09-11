import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BookOpen, Mail, Lock, User, GraduationCap, Building2, Shield } from 'lucide-react';

interface LoginProps {
  onLogin: (user: { id: string; name: string; role: 'student' | 'teacher' | 'school' | 'admin' }) => void;
}

export function Login({ onLogin }: LoginProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'student' as 'student' | 'teacher' | 'school' | 'admin'
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API call with offline fallback
    try {
      // Mock authentication - in real app, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo purposes, create a mock user
      const user = {
        id: `user_${Date.now()}`,
        name:
          formData.role === 'teacher'
            ? 'Teacher Kumar'
            : formData.role === 'school'
            ? 'School Admin'
            : formData.role === 'admin'
            ? 'Platform Admin'
            : 'Student Priya',
        role: formData.role
      };

      // Store in localStorage for offline access
      localStorage.setItem('stem_user', JSON.stringify(user));
      
      onLogin(user);
    } catch (error) {
      // Check for cached user in offline mode
      const cachedUser = localStorage.getItem('stem_user');
      if (cachedUser && !navigator.onLine) {
        onLogin(JSON.parse(cachedUser));
      } else {
        console.error('Login failed:', error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-3 sm:p-4">
      <div className="max-w-md w-full mx-auto">
        {/* Logo & Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-4">
            <BookOpen className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">STEM Learn</h1>
          <p className="text-sm sm:text-base text-indigo-100 px-4">Gamified Learning Platform for Rural Schools</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Login as:
              </label>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'student' })}
                  className={`flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-2 p-2 sm:p-3 rounded-lg border-2 transition-all ${
                    formData.role === 'student'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <User className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-xs sm:text-sm font-medium">Student</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'teacher' })}
                  className={`flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-2 p-2 sm:p-3 rounded-lg border-2 transition-all ${
                    formData.role === 'teacher'
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-xs sm:text-sm font-medium">Teacher</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'school' })}
                  className={`flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-2 p-2 sm:p-3 rounded-lg border-2 transition-all ${
                    formData.role === 'school'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-xs sm:text-sm font-medium">School</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'admin' })}
                  className={`flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-2 p-2 sm:p-3 rounded-lg border-2 transition-all ${
                    formData.role === 'admin'
                      ? 'border-rose-500 bg-rose-50 text-rose-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-xs sm:text-sm font-medium">Admin</span>
                </button>
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-2 sm:py-3 px-4 rounded-lg font-semibold text-white transition-all text-sm sm:text-base ${
                formData.role === 'student'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700'
                  : 'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700'
              } ${isLoading ? 'opacity-75 cursor-not-allowed' : 'shadow-lg'}`}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Demo Instructions */}
          <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gray-50 rounded-lg">
            <p className="text-xs sm:text-sm text-gray-600 text-center">
              <strong>Demo Mode:</strong> Use any email/password to login.
              {!navigator.onLine && ' Works offline too!'}
            </p>
          </div>
        </div>

        {/* Offline Indicator */}
        {!navigator.onLine && (
          <div className="mt-3 sm:mt-4 p-3 bg-yellow-500 text-white rounded-lg text-center">
            <p className="text-xs sm:text-sm font-medium">
              📱 Offline Mode Active - Your progress will sync when back online
            </p>
          </div>
        )}
      </div>
    </div>
  );
}