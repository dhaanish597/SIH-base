import React, { useEffect, useState } from 'react';
import { StudentProfile } from '../Student/StudentProfile';
import { TeacherProfile } from '../Teacher/TeacherProfile';

type UserRole = 'student' | 'teacher' | 'school' | 'admin';

interface CurrentUser {
  id: string;
  role: UserRole;
  name?: string;
}

export default function ProfileRouter() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem('stem_token');
        if (!token || token === 'demo_token') {
          // Fallback to local user (demo/offline)
          const stored = localStorage.getItem('stem_user');
          if (stored) {
            setUser(JSON.parse(stored));
          } else {
            setUser(null);
          }
          return;
        }
        const resp = await fetch('/api/users/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (resp.ok) {
          const data = await resp.json();
          setUser(data);
        } else {
          const stored = localStorage.getItem('stem_user');
          setUser(stored ? JSON.parse(stored) : null);
        }
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  if (isLoading) {
    return (
      <div className="p-6">Loading…</div>
    );
  }

  if (!user) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">Authentication required</div>
      </div>
    );
  }

  if (user.role === 'student') {
    return <StudentProfile userId={user.id} />;
  }
  if (user.role === 'teacher') {
    return <TeacherProfile userId={user.id} />;
  }

  return (
    <div className="p-6">
      <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
        <p className="text-gray-600">Profile management for {user.role} is coming soon.</p>
      </div>
    </div>
  );
}


