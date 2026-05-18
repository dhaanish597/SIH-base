export type AuthUser = {
  id: string;
  name: string;
  email?: string | null;
  role: 'STUDENT' | 'TEACHER' | 'SCHOOL' | 'ADMIN' | 'SUPERADMIN';
  schoolId?: string | null;
  class?: string | null;
  language?: string;
  profilePhoto?: string | null;
  totalPoints?: number;
  totalCoins?: number;
  level?: number;
  xp?: number;
  streakDays?: number;
};
