// User profile / current-user endpoints (Prisma-backed).

const express = require('express');
const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');

const router = express.Router();

function publicUser(u) {
  if (!u) return null;
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    class: u.class,
    schoolId: u.schoolId,
    language: u.language,
    profilePhoto: u.profilePhoto,
    phone: u.phone,
    address: u.address,
    rollNumber: u.rollNumber,
    department: u.department,
    subjectsTaught: u.subjectsTaught,
    classesHandled: u.classesHandled,
    totalPoints: u.totalPoints,
    totalCoins: u.totalCoins,
    level: u.level,
    xp: u.xp,
    streakDays: u.streakDays,
    longestStreak: u.longestStreak,
    createdAt: u.createdAt,
    lastLogin: u.lastLogin,
    status: u.status,
  };
}

// GET /api/users/me
router.get('/me', authenticate, async (req, res) => {
  try {
    const u = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!u) return res.status(404).json({ error: 'User not found' });
    res.json(publicUser(u));
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// GET /api/users/:id  - same school only (unless admin)
router.get('/:id', authenticate, async (req, res) => {
  try {
    const target = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!target) return res.status(404).json({ error: 'User not found' });
    const isAdmin = req.user.role === 'ADMIN' || req.user.role === 'SUPERADMIN';
    if (!isAdmin && req.user.schoolId !== target.schoolId) {
      return res.status(403).json({ error: 'Cross-school access denied' });
    }
    res.json(publicUser(target));
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// PUT /api/users/me  - self update of safe fields
router.put('/me', authenticate, async (req, res) => {
  try {
    const allowed = ['name', 'phone', 'address', 'language', 'profilePhoto'];
    const data = {};
    for (const k of allowed) {
      if (req.body[k] !== undefined) data[k] = req.body[k];
    }
    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'No updatable fields provided' });
    }
    const u = await prisma.user.update({ where: { id: req.user.id }, data });
    res.json(publicUser(u));
  } catch (e) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// POST /api/users/create-student  — teacher/school creates a student account
router.post('/create-student', authenticate, requireRole('TEACHER', 'SCHOOL', 'ADMIN', 'SUPERADMIN'), async (req, res) => {
  try {
    const { name, email, studentId, classId, password } = req.body || {};
    if (!name || !password) return res.status(400).json({ error: 'name and password required' });

    const pinHash = await bcrypt.hash(String(password), 10);
    const student = await prisma.user.create({
      data: {
        name,
        email: email || null,
        studentId: studentId || null,
        pinHash,
        role: 'STUDENT',
        schoolId: req.user.schoolId || null,
        status: 'ACTIVE',
      },
    });

    if (classId) {
      await prisma.classEnrollment.create({
        data: { classId, studentId: student.id },
      }).catch(() => {});
    }

    res.json({ id: student.id, name: student.name });
  } catch (e) {
    if (String(e?.code) === 'P2002') return res.status(409).json({ message: 'Student ID or email already exists' });
    console.error('create-student', e);
    res.status(500).json({ message: 'Failed to create student' });
  }
});

module.exports = router;
