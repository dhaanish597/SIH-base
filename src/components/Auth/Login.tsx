import React, { useState } from 'react';
import { BookOpen, Mail, Lock, User, GraduationCap, Building2, Shield, Sparkles, Loader2, Info } from 'lucide-react';

interface LoginProps {
  onLogin: (user: { id: string; name: string; role: 'student' | 'teacher' | 'school' | 'admin'; class?: string; email?: string }) => void;
}

const roleConfig = {
  student: {
    label: "I'm a Student",
    ariaLabel: 'Login as student',
    icon: User,
    selectedClass: 'border-amber-400 bg-amber-50 text-amber-800 shadow-md ring-2 ring-amber-300',
    unselectedClass: 'border-gray-200 text-gray-600 hover:border-amber-200 hover:bg-amber-50/50 hover:shadow-sm',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
  },
  teacher: {
    label: "I'm a Teacher",
    ariaLabel: 'Login as teacher',
    icon: GraduationCap,
    selectedClass: 'border-violet-400 bg-violet-50 text-violet-800 shadow-md ring-2 ring-violet-300',
    unselectedClass: 'border-gray-200 text-gray-600 hover:border-violet-200 hover:bg-violet-50/50 hover:shadow-sm',
    iconBg: 'bg-violet-100',
    iconColor: 'text-violet-600',
  },
  school: {
    label: "I'm a School",
    ariaLabel: 'Login as school administrator',
    icon: Building2,
    selectedClass: 'border-emerald-400 bg-emerald-50 text-emerald-800 shadow-md ring-2 ring-emerald-300',
    unselectedClass: 'border-gray-200 text-gray-600 hover:border-emerald-200 hover:bg-emerald-50/50 hover:shadow-sm',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
  },
  admin: {
    label: "I'm an Admin",
    ariaLabel: 'Login as platform administrator',
    icon: Shield,
    selectedClass: 'border-rose-400 bg-rose-50 text-rose-800 shadow-md ring-2 ring-rose-300',
    unselectedClass: 'border-gray-200 text-gray-600 hover:border-rose-200 hover:bg-rose-50/50 hover:shadow-sm',
    iconBg: 'bg-rose-100',
    iconColor: 'text-rose-600',
  },
} as const;

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

        localStorage.setItem('stem_token', token);
        localStorage.setItem('stem_user', JSON.stringify({
          id: userData.id,
          name: userData.name,
          role: userData.role,
          class: userData.class,
          email: userData.email
        }));

        onLogin({
          id: userData.id,
          name: userData.name,
          role: userData.role,
          class: userData.class,
          email: userData.email
        });
      } else if (!navigator.onLine) {
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

        localStorage.setItem('stem_user', JSON.stringify(demoUser));
        localStorage.setItem('stem_token', 'demo_token');

        onLogin(demoUser);
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (error) {
      console.error('Login failed:', error);
      alert('Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  const submitButtonLabel = formData.role === 'student'
    ? (isLoading ? 'Signing you in...' : "Let's go!")
    : (isLoading ? 'Signing in...' : 'Sign In');

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 sm:p-6 safe-top safe-bottom relative overflow-hidden"
      role="main"
    >
      {/* Playful background: soft gradient + subtle shapes */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-sky-300 via-amber-100 to-emerald-200"
        aria-hidden="true"
      />
      <div className="absolute top-10 left-10 w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-amber-200/40 blur-2xl" aria-hidden="true" />
      <div className="absolute bottom-20 right-10 w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-emerald-300/40 blur-2xl" aria-hidden="true" />
      <div className="absolute top-1/3 right-16 w-16 h-16 rounded-full bg-violet-200/30 blur-xl" aria-hidden="true" />
      <div className="absolute bottom-1/3 left-20 w-20 h-20 rounded-full bg-sky-200/40 blur-xl" aria-hidden="true" />

      <div className="max-w-md w-full mx-auto relative z-10">
        {/* Logo & Header with mascot-style area */}
        <div className="text-center mb-6 sm:mb-8" role="banner">
          <div className="inline-flex items-center justify-center gap-2 mb-4">
            <div
              className="flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-3xl shadow-lg border-4 border-amber-200 animate-[bounce_2s_ease-in-out_infinite]"
              style={{ animationDuration: '3s' }}
              aria-hidden="true"
            >
              <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 text-amber-500" aria-hidden="true" />
            </div>
            <div
              className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-amber-300/80 rounded-2xl shadow-md"
              aria-hidden="true"
            >
              <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-amber-700" aria-hidden="true" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-800 mb-2 drop-shadow-sm">
            STEM Learn
          </h1>
          <p className="text-base sm:text-lg text-gray-600 font-medium px-4">
            Your learning adventure begins here!
          </p>
        </div>

        {/* Login Form card */}
        <div
          className="bg-white/95 backdrop-blur rounded-3xl shadow-2xl border-2 border-white/80 p-6 sm:p-8"
          role="form"
          aria-labelledby="login-heading"
        >
          <h2 id="login-heading" className="sr-only">Login Form</h2>
          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
            {/* Role Selection – big tappable cards */}
            <div>
              <fieldset>
                <legend className="block text-base font-semibold text-gray-800 mb-3">
                  Who are you?
                </legend>
                <div className="grid grid-cols-2 gap-3 sm:gap-4" role="radiogroup" aria-labelledby="role-selection">
                  {(Object.keys(roleConfig) as Array<keyof typeof roleConfig>).map((role) => {
                    const config = roleConfig[role];
                    const Icon = config.icon;
                    const isSelected = formData.role === role;
                    const isStudent = role === 'student';
                    const isAdmin = role === 'admin';
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setFormData({ ...formData, role })}
                        className={`
                          flex flex-col items-center justify-center gap-2 p-4 sm:p-5 rounded-2xl border-2 transition-all duration-200
                          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-amber-400
                          active:scale-[0.98]
                          ${isSelected ? config.selectedClass : config.unselectedClass}
                          ${isStudent ? 'col-span-2' : ''}
                          ${isAdmin ? 'col-span-2 sm:col-span-1' : ''}
                        `}
                        role="radio"
                        aria-checked={isSelected}
                        aria-label={config.ariaLabel}
                      >
                        <span className={`inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${config.iconBg} ${config.iconColor}`}>
                          <Icon className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
                        </span>
                        <span className={`text-sm sm:text-base font-semibold ${isStudent ? 'text-base sm:text-lg' : ''}`}>
                          {config.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            </div>

            {/* Email Field – touch-friendly, friendly placeholder */}
            <div>
              <label htmlFor="email-input" className="block text-base font-semibold text-gray-800 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" aria-hidden="true" />
                <input
                  id="email-input"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full min-h-[44px] pl-11 pr-4 py-3 text-base rounded-2xl border-2 border-gray-200 bg-gray-50/80
                    placeholder:text-gray-400
                    focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-200 focus:outline-none
                    transition-colors"
                  placeholder="Your email"
                  aria-describedby="email-help"
                />
              </div>
              <div id="email-help" className="sr-only">Enter your email address to login</div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password-input" className="block text-base font-semibold text-gray-800 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" aria-hidden="true" />
                <input
                  id="password-input"
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full min-h-[44px] pl-11 pr-4 py-3 text-base rounded-2xl border-2 border-gray-200 bg-gray-50/80
                    placeholder:text-gray-400
                    focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-200 focus:outline-none
                    transition-colors"
                  placeholder="Type your password"
                  aria-describedby="password-help"
                />
              </div>
              <div id="password-help" className="sr-only">Enter your password to login</div>
            </div>

            {/* Sign-in button – pill, high-contrast, role-aware label */}
            <button
              type="submit"
              disabled={isLoading}
              className={`
                w-full min-h-[48px] rounded-2xl font-bold text-lg text-white
                flex items-center justify-center gap-2
                transition-all duration-200 active:scale-[0.98]
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-amber-400
                disabled:opacity-75 disabled:cursor-not-allowed disabled:active:scale-100
                ${formData.role === 'student'
                  ? 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 shadow-lg shadow-amber-200/50'
                  : 'bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-lg shadow-violet-200/50'
                }
              `}
              aria-describedby="login-status"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                  <span>{formData.role === 'student' ? 'Signing you in...' : 'Signing in...'}</span>
                </>
              ) : (
                submitButtonLabel
              )}
            </button>
            <div id="login-status" className="sr-only" aria-live="polite">
              {isLoading ? 'Signing you in, please wait' : 'Ready to sign in'}
            </div>
          </form>

          {/* Demo / helper – reassuring, small info box */}
          <div
            className="mt-5 sm:mt-6 p-4 rounded-2xl bg-sky-50 border border-sky-100 flex gap-3 items-start"
            role="note"
          >
            <Info className="w-5 h-5 text-sky-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-sm text-sky-800">
              <strong className="font-semibold">Try it:</strong> Use any email and password to explore.
              {!navigator.onLine && ' Works offline too!'}
            </p>
          </div>
        </div>

        {/* Offline indicator */}
        {!navigator.onLine && (
          <div
            className="mt-4 p-4 rounded-2xl bg-amber-100 border border-amber-200 text-center"
            role="status"
            aria-live="polite"
          >
            <p className="text-sm font-medium text-amber-900">
              Offline mode – your progress will sync when you're back online
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
