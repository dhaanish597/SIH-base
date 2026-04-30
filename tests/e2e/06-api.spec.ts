/**
 * Direct API contract tests — no browser UI needed, uses fetch via page.request.
 * These run much faster than full UI tests and catch backend regressions early.
 */
import { test, expect } from '@playwright/test';

const API = 'http://localhost:3001/api';

async function studentToken(request: any): Promise<string> {
  const res = await request.post(`${API}/auth/login`, {
    data: { studentId: 'STU001', pin: '1234' },
  });
  const body = await res.json();
  return body.token as string;
}

async function adminToken(request: any): Promise<string> {
  const res = await request.post(`${API}/auth/login`, {
    data: { email: 'admin@demo.school', password: 'admin123' },
  });
  const body = await res.json();
  return body.token as string;
}

test.describe('Health', () => {
  test('GET /api/health returns ok:true and db:true', async ({ request }) => {
    const res = await request.get(`${API}/health`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.db).toBe(true);
  });
});

test.describe('Auth API', () => {
  test('POST /api/auth/login — student with correct PIN returns token', async ({ request }) => {
    const res = await request.post(`${API}/auth/login`, {
      data: { studentId: 'STU001', pin: '1234' },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.token).toBeTruthy();
    expect(body.user.role).toBe('STUDENT');
  });

  test('POST /api/auth/login — wrong PIN returns 401', async ({ request }) => {
    const res = await request.post(`${API}/auth/login`, {
      data: { studentId: 'STU001', pin: '9999' },
    });
    expect(res.status()).toBe(401);
  });

  test('POST /api/auth/login — admin with email+password returns token', async ({ request }) => {
    const res = await request.post(`${API}/auth/login`, {
      data: { email: 'admin@demo.school', password: 'admin123' },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.user.role).toBe('ADMIN');
  });

  test('GET /api/users/me — valid token returns user', async ({ request }) => {
    const token = await studentToken(request);
    const res = await request.get(`${API}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.role).toBe('STUDENT');
    expect(body.name).toBeTruthy();
  });

  test('GET /api/users/me — no token returns 401', async ({ request }) => {
    const res = await request.get(`${API}/users/me`);
    expect(res.status()).toBe(401);
  });
});

test.describe('Student APIs', () => {
  test('GET /api/leaderboard returns ranked array', async ({ request }) => {
    const token = await studentToken(request);
    const res = await request.get(`${API}/leaderboard?scope=school&limit=10`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body[0]).toHaveProperty('rank');
    expect(body[0]).toHaveProperty('points');
  });

  test('GET /api/badges/me returns badge tier', async ({ request }) => {
    const token = await studentToken(request);
    const res = await request.get(`${API}/badges/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('badge');
    expect(['champion', 'achiever', 'learner', 'beginner']).toContain(body.badge);
  });

  test('GET /api/quests/me returns array', async ({ request }) => {
    const token = await studentToken(request);
    const res = await request.get(`${API}/quests/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
    expect(Array.isArray(await res.json())).toBe(true);
  });

  test('GET /api/shop returns items array', async ({ request }) => {
    const token = await studentToken(request);
    const res = await request.get(`${API}/shop`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('GET /api/recommendations returns array', async ({ request }) => {
    const token = await studentToken(request);
    const res = await request.get(`${API}/recommendations?limit=3`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
    expect(Array.isArray(await res.json())).toBe(true);
  });
});

test.describe('Game session lifecycle', () => {
  test('POST /api/games/start → POST /api/games/complete awards XP', async ({ request }) => {
    const token = await studentToken(request);
    const headers = { Authorization: `Bearer ${token}` };

    // Start session
    const start = await request.post(`${API}/games/start`, {
      headers,
      data: { gameType: 'MATH_DUNGEON', mode: 'SOLO', gradeLevel: 9 },
    });
    expect(start.status()).toBe(200);
    const { sessionId } = await start.json();
    expect(sessionId).toBeTruthy();

    // Complete session
    const complete = await request.post(`${API}/games/complete`, {
      headers,
      data: {
        sessionId,
        score: 120,
        questionsAttempted: 10,
        questionsCorrect: 8,
        durationSec: 90,
        starsEarned: 3,
        outcome: 'won',
      },
    });
    expect(complete.status()).toBe(200);
    const body = await complete.json();
    expect(body.rewards.xp).toBeGreaterThan(0);
    expect(body.rewards.coins).toBeGreaterThan(0);
  });
});

test.describe('Admin APIs', () => {
  test('GET /api/admin/schools returns school list', async ({ request }) => {
    const token = await adminToken(request);
    const res = await request.get(`${API}/admin/schools`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.some((s: any) => s.schoolCode === 'DEMO')).toBe(true);
  });

  test('GET /api/admin/users returns user list', async ({ request }) => {
    const token = await adminToken(request);
    const res = await request.get(`${API}/admin/users?limit=50`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.length).toBeGreaterThan(0);
  });

  test('GET /api/admin/analytics returns platform stats', async ({ request }) => {
    const token = await adminToken(request);
    const res = await request.get(`${API}/admin/analytics`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('userStats');
    expect(body.userStats).toHaveProperty('schools');
    expect(body.userStats).toHaveProperty('students');
  });

  test('student token cannot access admin endpoints', async ({ request }) => {
    const token = await studentToken(request);
    const res = await request.get(`${API}/admin/schools`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(403);
  });
});
