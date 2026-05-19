import type { AuthUser } from './auth-types';

export type DemoUser = AuthUser & {
  demoId: string;
  description: string;
};

const SCHOOL_ID = 'demo-school-001';

export const DEMO_USERS: DemoUser[] = [
  // ── STUDENTS (one per class 6–12) ─────────────────────────
  {
    demoId: 'student-6a',
    id: 'demo-student-6a',
    name: 'Arjun Sharma',
    email: 'arjun@demo.school',
    role: 'STUDENT',
    schoolId: SCHOOL_ID,
    class: '6A',
    level: 3,
    xp: 240,
    totalPoints: 850,
    totalCoins: 170,
    streakDays: 4,
    language: 'en',
    description: 'Class 6A · Loves Math',
  },
  {
    demoId: 'student-7b',
    id: 'demo-student-7b',
    name: 'Priya Patel',
    email: 'priya@demo.school',
    role: 'STUDENT',
    schoolId: SCHOOL_ID,
    class: '7B',
    level: 5,
    xp: 180,
    totalPoints: 1450,
    totalCoins: 290,
    streakDays: 12,
    language: 'en',
    description: 'Class 7B · Science enthusiast',
  },
  {
    demoId: 'student-8a',
    id: 'demo-student-8a',
    name: 'Rahul Kumar',
    email: 'rahul@demo.school',
    role: 'STUDENT',
    schoolId: SCHOOL_ID,
    class: '8A',
    level: 7,
    xp: 340,
    totalPoints: 2200,
    totalCoins: 440,
    streakDays: 6,
    language: 'en',
    description: 'Class 8A · History buff',
  },
  {
    demoId: 'student-9c',
    id: 'demo-student-9c',
    name: 'Ananya Singh',
    email: 'ananya@demo.school',
    role: 'STUDENT',
    schoolId: SCHOOL_ID,
    class: '9C',
    level: 9,
    xp: 420,
    totalPoints: 3100,
    totalCoins: 620,
    streakDays: 21,
    language: 'en',
    description: 'Class 9C · Top ranker',
  },
  {
    demoId: 'student-10a',
    id: 'demo-student-10a',
    name: 'Rohan Verma',
    email: 'rohan@demo.school',
    role: 'STUDENT',
    schoolId: SCHOOL_ID,
    class: '10A',
    level: 12,
    xp: 600,
    totalPoints: 4800,
    totalCoins: 960,
    streakDays: 30,
    language: 'en',
    description: 'Class 10A · Board exam warrior',
  },
  {
    demoId: 'student-11b',
    id: 'demo-student-11b',
    name: 'Kavya Nair',
    email: 'kavya@demo.school',
    role: 'STUDENT',
    schoolId: SCHOOL_ID,
    class: '11B',
    level: 15,
    xp: 200,
    totalPoints: 6200,
    totalCoins: 1240,
    streakDays: 45,
    language: 'en',
    description: 'Class 11B (Science) · JEE aspirant',
  },
  {
    demoId: 'student-12a',
    id: 'demo-student-12a',
    name: 'Aditya Rajan',
    email: 'aditya@demo.school',
    role: 'STUDENT',
    schoolId: SCHOOL_ID,
    class: '12A',
    level: 18,
    xp: 450,
    totalPoints: 8500,
    totalCoins: 1700,
    streakDays: 60,
    language: 'en',
    description: 'Class 12A (Commerce) · Future CA',
  },
  // ── TEACHERS ──────────────────────────────────────────────
  {
    demoId: 'teacher-math',
    id: 'demo-teacher-math',
    name: 'Ms. Sunita Rao',
    email: 'sunita.rao@demo.school',
    role: 'TEACHER',
    schoolId: SCHOOL_ID,
    level: 1,
    xp: 0,
    totalPoints: 0,
    totalCoins: 0,
    streakDays: 0,
    language: 'en',
    description: 'Mathematics · Classes 8–12',
  },
  {
    demoId: 'teacher-science',
    id: 'demo-teacher-science',
    name: 'Mr. Deepak Menon',
    email: 'deepak.menon@demo.school',
    role: 'TEACHER',
    schoolId: SCHOOL_ID,
    level: 1,
    xp: 0,
    totalPoints: 0,
    totalCoins: 0,
    streakDays: 0,
    language: 'en',
    description: 'Science · Classes 6–10',
  },
  {
    demoId: 'teacher-english',
    id: 'demo-teacher-english',
    name: 'Ms. Meera Joshi',
    email: 'meera.joshi@demo.school',
    role: 'TEACHER',
    schoolId: SCHOOL_ID,
    level: 1,
    xp: 0,
    totalPoints: 0,
    totalCoins: 0,
    streakDays: 0,
    language: 'en',
    description: 'English · All Classes',
  },
  // ── SCHOOL ADMIN ──────────────────────────────────────────
  {
    demoId: 'school-admin',
    id: 'demo-school-admin',
    name: 'Dr. Rajesh Sharma',
    email: 'principal@demo.school',
    role: 'SCHOOL',
    schoolId: SCHOOL_ID,
    level: 1,
    xp: 0,
    totalPoints: 0,
    totalCoins: 0,
    streakDays: 0,
    language: 'en',
    description: 'Principal · Delhi Public School',
  },
  // ── PLATFORM ADMIN ────────────────────────────────────────
  {
    demoId: 'platform-admin',
    id: 'demo-platform-admin',
    name: 'Admin User',
    email: 'admin@questacademy.in',
    role: 'ADMIN',
    schoolId: null,
    level: 1,
    xp: 0,
    totalPoints: 0,
    totalCoins: 0,
    streakDays: 0,
    language: 'en',
    description: 'Platform Administrator',
  },
];

export const DEFAULT_DEMO_ID = 'student-10a';

const STORAGE_KEY = 'qa_demo_user_id';

export function getDemoUser(demoId: string): DemoUser | undefined {
  return DEMO_USERS.find(u => u.demoId === demoId);
}

export function getDefaultForRole(role: string): DemoUser {
  return DEMO_USERS.find(u => u.role === role.toUpperCase()) ?? DEMO_USERS.find(u => u.demoId === DEFAULT_DEMO_ID)!;
}

export function readActiveDemoId(): string {
  if (typeof window === 'undefined') return DEFAULT_DEMO_ID;
  return localStorage.getItem(STORAGE_KEY) ?? DEFAULT_DEMO_ID;
}

export function readActiveDemoUser(): DemoUser {
  return getDemoUser(readActiveDemoId()) ?? getDemoUser(DEFAULT_DEMO_ID)!;
}

export function writeActiveDemoId(demoId: string): void {
  if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, demoId);
}
