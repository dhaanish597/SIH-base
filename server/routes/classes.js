const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');

const router = express.Router();

// GET /api/classes/mine  — teacher: classes they teach
router.get('/mine', authenticate, requireRole('TEACHER', 'SCHOOL', 'ADMIN', 'SUPERADMIN'), async (req, res) => {
  try {
    const where = req.user.role === 'TEACHER'
      ? { teacherId: req.user.id }
      : { schoolId: req.user.schoolId };

    const classes = await prisma.class.findMany({
      where,
      orderBy: [{ gradeLevel: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true, gradeLevel: true, section: true },
    });
    res.json(classes);
  } catch (e) {
    console.error('classes/mine', e);
    res.status(500).json({ error: 'Failed to fetch classes' });
  }
});

module.exports = router;
