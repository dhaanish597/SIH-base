// User profile / current-user endpoints (Prisma-backed).

const express = require('express');
const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const { randomBytes } = require('crypto');

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

// POST /api/users/create-student  — teacher/school creates a student
// Auto-generates studentId and 4-digit PIN; returns plain PIN shown once.
router.post('/create-student', authenticate, requireRole('TEACHER', 'SCHOOL', 'ADMIN', 'SUPERADMIN'), async (req, res) => {
  try {
    const { name, classId, rollNumber } = req.body || {};
    if (!name || !name.trim()) return res.status(400).json({ error: 'name required' });
    if (!req.user.schoolId) return res.status(400).json({ error: 'No school scope' });

    // Auto-generate studentId: school prefix + zero-padded count
    const school = await prisma.school.findUnique({
      where: { id: req.user.schoolId },
      select: { schoolCode: true, name: true },
    });
    const prefix = (school?.schoolCode || school?.name || 'STU')
      .replace(/[^A-Za-z0-9]/g, '')
      .toUpperCase()
      .slice(0, 3);
    const count = await prisma.user.count({
      where: { schoolId: req.user.schoolId, role: 'STUDENT' },
    });
    const studentId = `${prefix}${String(count + 1).padStart(3, '0')}`;

    // Auto-generate 4-digit PIN using crypto
    const pin = String(1000 + (randomBytes(4).readUInt32BE(0) % 9000));
    const pinHash = await bcrypt.hash(pin, 10);

    const student = await prisma.user.create({
      data: {
        name: name.trim(),
        studentId,
        pinHash,
        role: 'STUDENT',
        schoolId: req.user.schoolId,
        rollNumber: rollNumber || null,
        status: 'ACTIVE',
      },
    });

    if (classId) {
      await prisma.classEnrollment.create({
        data: { classId, studentId: student.id },
      }).catch(() => {});
    }

    res.json({ id: student.id, name: student.name, studentId: student.studentId, pin });
  } catch (e) {
    if (String(e?.code) === 'P2002') return res.status(409).json({ message: 'StudentId conflict — try again.' });
    console.error('create-student', e);
    res.status(500).json({ message: 'Failed to create student' });
  }
});

module.exports = router;
