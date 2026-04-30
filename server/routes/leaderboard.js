// School-scoped leaderboard. Spec mandates leaderboards never cross schools.
//
// GET /api/leaderboard?scope=school|class&classId=...&limit=10
//   - default scope = "school" (uses caller's schoolId)
//   - "class" requires classId; verified against user's school

const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
    const scope = (req.query.scope || 'school').toString();

    // Admins can pass an arbitrary schoolId; others are pinned to their own
    const isAdmin = req.user.role === 'ADMIN' || req.user.role === 'SUPERADMIN';
    const schoolId = isAdmin && req.query.schoolId ? String(req.query.schoolId) : req.user.schoolId;
    if (!schoolId) {
      return res.status(400).json({ error: 'No school scope available for this user' });
    }

    let whereUser = { schoolId, role: 'STUDENT', status: 'ACTIVE' };

    if (scope === 'class') {
      const classId = req.query.classId ? String(req.query.classId) : null;
      if (!classId) return res.status(400).json({ error: 'classId required for class scope' });
      const cls = await prisma.class.findUnique({ where: { id: classId } });
      if (!cls || cls.schoolId !== schoolId) {
        return res.status(403).json({ error: 'Class is not in your school' });
      }
      const enrollments = await prisma.classEnrollment.findMany({
        where: { classId },
        select: { studentId: true },
      });
      const ids = enrollments.map((e) => e.studentId);
      whereUser = { ...whereUser, id: { in: ids.length ? ids : ['__none__'] } };
    }

    const rows = await prisma.user.findMany({
      where: whereUser,
      orderBy: [{ totalPoints: 'desc' }, { xp: 'desc' }, { name: 'asc' }],
      take: limit,
      select: {
        id: true,
        name: true,
        class: true,
        totalPoints: true,
        level: true,
        profilePhoto: true,
      },
    });

    const result = rows.map((r, i) => ({
      id: r.id,
      name: r.name,
      class: r.class || '',
      points: r.totalPoints,
      level: r.level,
      profilePhoto: r.profilePhoto,
      rank: i + 1,
    }));

    res.json(result);
  } catch (e) {
    console.error('leaderboard error', e);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

module.exports = router;
