const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/lessons?subject=&grade=
router.get('/', authenticate, async (req, res) => {
  try {
    const subject = req.query.subject ? String(req.query.subject) : null;
    const grade = req.query.grade ? Number(req.query.grade) : null;
    const subj = subject ? await prisma.subject.findUnique({ where: { name: subject } }) : null;

    const lessons = await prisma.lesson.findMany({
      where: {
        ...(subj ? { subjectId: subj.id } : {}),
        ...(grade ? { difficulty: { lte: 10 } } : {}),
      },
      include: { subject: true, chapter: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    res.json(lessons);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch lessons' });
  }
});

// GET /api/lessons/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const l = await prisma.lesson.findUnique({
      where: { id: req.params.id },
      include: { subject: true, chapter: true, quizzes: true },
    });
    if (!l) return res.status(404).json({ error: 'Lesson not found' });
    res.json(l);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch lesson' });
  }
});

// GET /api/quizzes/:lessonId  - legacy compat
router.get('/quizzes/:lessonId', authenticate, async (req, res) => {
  try {
    const quizzes = await prisma.quiz.findMany({ where: { lessonId: req.params.lessonId } });
    res.json(quizzes);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch quizzes' });
  }
});

module.exports = router;
