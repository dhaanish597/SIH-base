'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './providers';

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) return; // wait for localStorage to load after mount
    const role = user.role;
    if (role === 'TEACHER') router.replace('/teacher');
    else if (role === 'SCHOOL') router.replace('/school');
    else if (role === 'ADMIN') router.replace('/admin');
    else router.replace('/student');
  }, [user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-deep)' }}>
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500" />
    </div>
  );
}
