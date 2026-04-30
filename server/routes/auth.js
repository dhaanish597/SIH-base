// Auth routes: login, refresh, logout, who-am-I
//   - Sets httpOnly cookies (sih_access, sih_refresh)
//   - Stores refresh-token hashes in `refresh_tokens` for revocation
//   - Supports four roles: STUDENT (email or studentId + pin),
//                         TEACHER/SCHOOL/ADMIN (email + password)

const express = require('express');
const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
  refreshExpiryDate,
} = require('../utils/jwt');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const isProd = process.env.NODE_ENV === 'production';

const ACCESS_COOKIE_OPTS = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? 'none' : 'lax',
  path: '/',
};
const REFRESH_COOKIE_OPTS = {
  ...ACCESS_COOKIE_OPTS,
  path: '/api/auth',
};

async function issueTokens(res, user, req) {
  const access = signAccessToken(user);
  const refresh = signRefreshToken(user.id);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refresh),
      expiresAt: refreshExpiryDate(),
      userAgent: req.headers['user-agent']?.slice(0, 250) || null,
      ipAddress: req.ip || null,
    },
  });

  res.cookie('sih_access', access, ACCESS_COOKIE_OPTS);
  res.cookie('sih_refresh', refresh, REFRESH_COOKIE_OPTS);
  return { access, refresh };
}

function publicUser(u) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    class: u.class,
    schoolId: u.schoolId,
    language: u.language,
    profilePhoto: u.profilePhoto,
    totalPoints: u.totalPoints,
    totalCoins: u.totalCoins,
    level: u.level,
    xp: u.xp,
    streakDays: u.streakDays,
  };
}

// POST /api/auth/login
// Body: { email?, studentId?, password?, pin?, schoolCode? }
router.post('/login', async (req, res) => {
  try {
    const { email, studentId, password, pin, schoolCode } = req.body || {};

    let user = null;
    if (studentId) {
      user = await prisma.user.findUnique({ where: { studentId } });
      if (!user || user.role !== 'STUDENT') {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      if (!user.pinHash || !pin) return res.status(401).json({ error: 'Invalid credentials' });
      const ok = await bcrypt.compare(pin, user.pinHash);
      if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    } else if (email) {
      user = await prisma.user.findUnique({ where: { email } });
      if (!user || !user.passwordHash || !password) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    } else {
      return res.status(400).json({ error: 'email or studentId required' });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({ error: 'Account is not active' });
    }

    // School-code gate (when provided): must match the user's school
    if (schoolCode && user.schoolId) {
      const school = await prisma.school.findUnique({ where: { id: user.schoolId } });
      if (!school || school.schoolCode !== schoolCode || !school.isActive) {
        return res.status(403).json({ error: 'School code mismatch or inactive' });
      }
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const { access } = await issueTokens(res, user, req);

    // Audit
    prisma.auditLog
      .create({
        data: {
          schoolId: user.schoolId || null,
          actorId: user.id,
          action: 'LOGIN',
          entityType: 'user',
          entityId: user.id,
          ipAddress: req.ip || null,
          userAgent: req.headers['user-agent']?.slice(0, 250) || null,
        },
      })
      .catch(() => {});

    return res.json({ user: publicUser(user), token: access });
  } catch (e) {
    console.error('login error', e);
    return res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/auth/refresh
// Reads refresh cookie, rotates tokens.
router.post('/refresh', async (req, res) => {
  try {
    const refresh = req.cookies && req.cookies.sih_refresh;
    if (!refresh) return res.status(401).json({ error: 'No refresh token' });

    let payload;
    try {
      payload = verifyRefreshToken(refresh);
    } catch {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const tokenHash = hashToken(refresh);
    const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      return res.status(401).json({ error: 'Refresh token revoked or expired' });
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.status !== 'ACTIVE') {
      return res.status(401).json({ error: 'User no longer active' });
    }

    // Rotate: revoke old, issue new pair
    await prisma.refreshToken.update({
      where: { tokenHash },
      data: { revokedAt: new Date() },
    });

    const { access } = await issueTokens(res, user, req);
    return res.json({ user: publicUser(user), token: access });
  } catch (e) {
    console.error('refresh error', e);
    return res.status(500).json({ error: 'Refresh failed' });
  }
});

// POST /api/auth/logout
router.post('/logout', authenticate, async (req, res) => {
  try {
    const refresh = req.cookies && req.cookies.sih_refresh;
    if (refresh) {
      const tokenHash = hashToken(refresh);
      await prisma.refreshToken
        .update({ where: { tokenHash }, data: { revokedAt: new Date() } })
        .catch(() => {});
    }
    res.clearCookie('sih_access', { ...ACCESS_COOKIE_OPTS, maxAge: 0 });
    res.clearCookie('sih_refresh', { ...REFRESH_COOKIE_OPTS, maxAge: 0 });

    prisma.auditLog
      .create({
        data: {
          schoolId: req.user.schoolId || null,
          actorId: req.user.id,
          action: 'LOGOUT',
          entityType: 'user',
          entityId: req.user.id,
        },
      })
      .catch(() => {});

    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: 'Logout failed' });
  }
});

// GET /api/auth/me  (kept here in addition to /api/users/me for convenience)
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json(publicUser(user));
  } catch (e) {
    return res.status(500).json({ error: 'Failed to fetch user' });
  }
});

module.exports = router;
