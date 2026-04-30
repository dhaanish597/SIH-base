const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');

const router = express.Router();

// GET /api/assignments/me  — student: their assignment entries
router.get('/me', authenticate, requireRole('STUDENT'), async (req, res) => {
  try {
    const rows = await prisma.studentAssignment.findMany({
      where: { studentId: req.user.id },
      include: {
        assignment: { select: { id: true, title: true, description: true, dueDate: true } },
      },
      orderBy: { assignment: { dueDate: 'asc' } },
    });
    const result = rows.map((r) => ({
      id: r.id,
      assignmentId: r.assignmentId,
      title: r.assignment.title,
      description: r.assignment.description,
      dueDate: r.assignment.dueDate,
      status: r.status,
      score: r.score,
    }));
    res.json(result);
  } catch (e) {
    console.error('assignments/me', e);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

// POST /api/assignments  — teacher: create assignment and assign to a class
router.post('/', authenticate, requireRole('TEACHER', 'SCHOOL', 'ADMIN', 'SUPERADMIN'), async (req, res) => {
  try {
    const { classId, title, description, dueDate } = req.body || {};
    if (!classId || !title) return res.status(400).json({ error: 'classId and title required' });

    const asgn = await prisma.assignment.create({
      data: {
        teacherId: req.user.id,
        classId,
        title,
        description: description || null,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    });

    const enrollments = await prisma.classEnrollment.findMany({
      where: { classId },
      select: { studentId: true },
    });
    if (enrollments.length > 0) {
      await prisma.studentAssignment.createMany({
        data: enrollments.map((e) => ({ assignmentId: asgn.id, studentId: e.studentId })),
        skipDuplicates: true,
      });
    }

    res.json({ id: asgn.id, title: asgn.title, assignedTo: enrollments.length });
  } catch (e) {
    console.error('assignments POST', e);
    res.status(500).json({ error: 'Failed to create assignment' });
  }
});

module.exports = router;
