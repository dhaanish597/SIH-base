const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');

const router = express.Router();

// GET /api/homework/me  — student: their homework entries
router.get('/me', authenticate, requireRole('STUDENT'), async (req, res) => {
  try {
    const rows = await prisma.studentHomework.findMany({
      where: { studentId: req.user.id },
      include: {
        homework: { select: { id: true, title: true, description: true, dueDate: true } },
      },
      orderBy: { homework: { dueDate: 'asc' } },
    });
    const result = rows.map((r) => ({
      id: r.id,
      homeworkId: r.homeworkId,
      title: r.homework.title,
      description: r.homework.description,
      dueDate: r.homework.dueDate,
      status: r.status,
      score: r.score,
    }));
    res.json(result);
  } catch (e) {
    console.error('homework/me', e);
    res.status(500).json({ error: 'Failed to fetch homework' });
  }
});

// POST /api/homework  — teacher: create homework and assign to a class
router.post('/', authenticate, requireRole('TEACHER', 'SCHOOL', 'ADMIN', 'SUPERADMIN'), async (req, res) => {
  try {
    const { classId, title, description, dueDate } = req.body || {};
    if (!classId || !title) return res.status(400).json({ error: 'classId and title required' });

    const hw = await prisma.homework.create({
      data: {
        teacherId: req.user.id,
        classId,
        title,
        description: description || null,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    });

    // Assign to all students enrolled in the class
    const enrollments = await prisma.classEnrollment.findMany({
      where: { classId },
      select: { studentId: true },
    });
    if (enrollments.length > 0) {
      await prisma.studentHomework.createMany({
        data: enrollments.map((e) => ({ homeworkId: hw.id, studentId: e.studentId })),
        skipDuplicates: true,
      });
    }

    res.json({ id: hw.id, title: hw.title, assignedTo: enrollments.length });
  } catch (e) {
    console.error('homework POST', e);
    res.status(500).json({ error: 'Failed to create homework' });
  }
});

module.exports = router;
