import React, { useState } from 'react';
import { BookOpen, Mail, Lock, User, GraduationCap, Building2, Shield } from 'lucide-react';

interface LoginProps {
  onLogin: (user: { id: string; name: string; role: 'student' | 'teacher' | 'school' | 'admin' }) => void;
}

export function Login({ onLogin }: LoginProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'student' as 'student' | 'teacher' | 'school' | 'admin'
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Try to authenticate with the backend first
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      if (response.ok) {
        const userData = await response.json();
        const token = userData.token;
        
        // Store token and user data
        localStorage.setItem('stem_token', token);
        localStorage.setItem('stem_user', JSON.stringify({
          id: userData.id,
          name: userData.name,
          role: userData.role,
          class: userData.class
        }));
        
        onLogin({
          id: userData.id,
          name: userData.name,
          role: userData.role,
          class: userData.class,
          email: userData.email
        });
      } else {
        // If backend login fails, create a demo user for offline mode
        const demoUser = {
          id: `demo_${formData.role}_${Date.now()}`,
          name:
            formData.role === 'teacher'
              ? 'Teacher Kumar'
              : formData.role === 'school'
              ? 'School Admin'
              : formData.role === 'admin'
              ? 'Platform Admin'
              : 'Student Priya',
          role: formData.role,
          class: formData.role === 'student' ? '9' : undefined,
          email: formData.email
        };

        // Store in localStorage for offline access
        localStorage.setItem('stem_user', JSON.stringify(demoUser));
        localStorage.setItem('stem_token', 'demo_token');
        
        onLogin(demoUser);
      }
    } catch (error) {
      // Check for cached user in offline mode
      const cachedUser = localStorage.getItem('stem_user');
      if (cachedUser) {
        onLogin(JSON.parse(cachedUser));
      } else {
        console.error('Login failed:', error);
        // Create a fallback demo user
        const fallbackUser = {
          id: `demo_${formData.role}_${Date.now()}`,
          name:
            formData.role === 'teacher'
              ? 'Teacher Kumar'
              : formData.role === 'school'
              ? 'School Admin'
              : formData.role === 'admin'
              ? 'Platform Admin'
              : 'Student Priya',
          role: formData.role,
          class: formData.role === 'student' ? '9' : undefined,
          email: formData.email
        };

        localStorage.setItem('stem_user', JSON.stringify(fallbackUser));
        localStorage.setItem('stem_token', 'demo_token');
        onLogin(fallbackUser);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4 sm:p-6 safe-top safe-bottom" role="main">
      <div className="max-w-md w-full mx-auto">
        {/* Logo & Header */}
        <div className="text-center mb-6 sm:mb-8" role="banner">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-4">
            <BookOpen className="w-8 h-8 text-indigo-600" aria-hidden="true" />
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">STEM Learn</h1>
          <p className="text-sm sm:text-base text-indigo-100 px-4">Gamified Learning Platform for Rural Schools</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8" role="form" aria-labelledby="login-heading">
          <h2 id="login-heading" className="sr-only">Login Form</h2>
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Role Selection */}
            <div>
              <fieldset>
                <legend className="block text-sm font-medium text-gray-700 mb-3">
                Login as:
                </legend>
              <div className="grid grid-cols-2 gap-2 sm:gap-3" role="radiogroup" aria-labelledby="role-selection">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'student' })}
                  className={`flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-2 p-3 sm:p-4 rounded-lg border-2 transition-all focus-visible ${
                    formData.role === 'student'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                  role="radio"
                  aria-checked={formData.role === 'student'}
                  aria-label="Login as student"
                >
                  <User className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
                  <span className="text-xs sm:text-sm font-medium">Student</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'teacher' })}
                  className={`flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-2 p-3 sm:p-4 rounded-lg border-2 transition-all focus-visible ${
                    formData.role === 'teacher'
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                  role="radio"
                  aria-checked={formData.role === 'teacher'}
                  aria-label="Login as teacher"
                >
                  <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
                  <span className="text-xs sm:text-sm font-medium">Teacher</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'school' })}
                  className={`flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-2 p-3 sm:p-4 rounded-lg border-2 transition-all focus-visible ${
                    formData.role === 'school'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                  role="radio"
                  aria-checked={formData.role === 'school'}
                  aria-label="Login as school administrator"
                >
                  <Building2 className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
                  <span className="text-xs sm:text-sm font-medium">School</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'admin' })}
                  className={`flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-2 p-3 sm:p-4 rounded-lg border-2 transition-all focus-visible ${
                    formData.role === 'admin'
                      ? 'border-rose-500 bg-rose-50 text-rose-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                  role="radio"
                  aria-checked={formData.role === 'admin'}
                  aria-label="Login as platform administrator"
                >
                  <Shield className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
                  <span className="text-xs sm:text-sm font-medium">Admin</span>
                </button>
              </div>
              </fieldset>
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email-input" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
                <input
                  id="email-input"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input-field w-full pl-10 pr-4 py-3 sm:py-4 text-sm sm:text-base"
                  placeholder="Enter your email"
                  aria-describedby="email-help"
                />
              </div>
              <div id="email-help" className="sr-only">Enter your email address to login</div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password-input" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
                <input
                  id="password-input"
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input-field w-full pl-10 pr-4 py-3 sm:py-4 text-sm sm:text-base"
                  placeholder="Enter your password"
                  aria-describedby="password-help"
                />
              </div>
              <div id="password-help" className="sr-only">Enter your password to login</div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`btn-primary w-full py-3 sm:py-4 px-4 text-sm sm:text-base ${
                formData.role === 'student'
                  ? ''
                  : 'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700'
              } ${isLoading ? 'opacity-75 cursor-not-allowed' : 'shadow-lg'}`}
              aria-describedby="login-status"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
            <div id="login-status" className="sr-only" aria-live="polite">
              {isLoading ? 'Signing you in, please wait' : 'Ready to sign in'}
            </div>
          </form>

          {/* Demo Instructions */}
          <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gray-50 rounded-lg" role="note">
            <p className="text-xs sm:text-sm text-gray-600 text-center">
              <strong>Demo Mode:</strong> Use any email/password to login.
              {!navigator.onLine && ' Works offline too!'}
            </p>
          </div>
        </div>

        {/* Offline Indicator */}
        {!navigator.onLine && (
          <div className="mt-3 sm:mt-4 p-3 bg-yellow-500 text-white rounded-lg text-center" role="status" aria-live="polite">
            <p className="text-xs sm:text-sm font-medium">
              📱 Offline Mode Active - Your progress will sync when back online
            </p>
          </div>
        )}
      </div>
    </div>
  );
}