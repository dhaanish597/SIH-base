// Question bank API — replaces the static Questions.json fetch with
// server-driven queries so teachers can add/edit and admin can moderate.

const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');

const router = express.Router();

// GET /api/questions/subjects
router.get('/subjects', async (req, res) => {
  const subjects = await prisma.subject.findMany({ orderBy: { name: 'asc' } });
  res.json(subjects);
});

// GET /api/questions/grades  - distinct grade levels available
router.get('/grades', async (req, res) => {
  const rows = await prisma.question.findMany({
    distinct: ['gradeLevel'],
    select: { gradeLevel: true },
    orderBy: { gradeLevel: 'asc' },
  });
  res.json(rows.map((r) => r.gradeLevel));
});

const { getRecommendedDifficulty } = require('../services/learnerModel');

// GET /api/questions/chapters?subject=...&grade=...
router.get('/chapters', async (req, res) => {
  const subject = String(req.query.subject || '');
  const grade = Number(req.query.grade);
  if (!subject || !grade) return res.status(400).json({ error: 'subject and grade required' });
  const subj = await prisma.subject.findUnique({ where: { name: subject } });
  if (!subj) return res.json([]);
  const chapters = await prisma.chapter.findMany({
    where: { subjectId: subj.id, gradeLevel: grade },
    orderBy: { orderIndex: 'asc' },
    include: { _count: { select: { questions: true } } },
  });
  res.json(chapters.map((c) => ({
    id: c.id,
    name: c.name,
    questionCount: c._count.questions,
    orderIndex: c.orderIndex,
  })));
});

// GET /api/questions?subject=...&grade=...&chapter=...&limit=10
// Adaptive Integration: Uses learnerModel to pick questions matching optimal difficulty
router.get('/', authenticate, async (req, res) => {
  try {
    const subject = String(req.query.subject || '');
    const grade = Number(req.query.grade);
    const chapter = req.query.chapter ? String(req.query.chapter) : null;
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
    const difficulty = req.query.difficulty ? String(req.query.difficulty).toUpperCase() : null;

    const subj = subject ? await prisma.subject.findUnique({ where: { name: subject } }) : null;
    let chapterId = null;
    if (chapter && subj) {
      const ch = await prisma.chapter.findFirst({
        where: { subjectId: subj.id, gradeLevel: grade, name: chapter },
      });
      chapterId = ch?.id || null;
    }

    const where = {
      ...(subj ? { subjectId: subj.id } : {}),
      ...(grade ? { gradeLevel: grade } : {}),
      ...(chapterId ? { chapterId } : {}),
      ...(difficulty ? { difficulty } : {}),
      status: 'APPROVED',
      // School-scoped or global. Students see their school's custom + global questions.
      OR: [
        { schoolId: null },
        ...(req.user.schoolId ? [{ schoolId: req.user.schoolId }] : []),
      ],
    };

    // Adaptive Integration: If it's a student, fetch optimal difficulty
    let optimalDifficulty = null;
    if (req.user.role === 'STUDENT') {
      const rec = await getRecommendedDifficulty(req.user.id, subject || null);
      optimalDifficulty = rec.difficulty;
    }

    // Fetch a larger pool to select the best difficulty match
    const fetchLimit = optimalDifficulty !== null ? limit * 5 : limit;

    let questions = await prisma.question.findMany({
      where,
      take: fetchLimit,
      orderBy: { id: 'asc' }, // fallback order
    });

    if (optimalDifficulty !== null && questions.length > 0) {
      // Sort by absolute distance to optimal difficulty, pick top `limit`
      questions.sort((a, b) => {
        const diffA = Math.abs((a.difficultyLevel ?? 0.5) - optimalDifficulty);
        const diffB = Math.abs((b.difficultyLevel ?? 0.5) - optimalDifficulty);
        return diffA - diffB;
      });
      questions = questions.slice(0, limit);
    }

    res.json(questions);
  } catch (e) {
    console.error('questions list error', e);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

// POST /api/questions  (teacher creates custom for their school - status PENDING_APPROVAL)
router.post('/', authenticate, requireRole('TEACHER', 'SCHOOL', 'ADMIN', 'SUPERADMIN'), async (req, res) => {
  try {
    const {
      subject, gradeLevel, chapter, type, text, choices, answerIndex,
      correctAnswer, conceptTags, difficulty, difficultyLevel, explanation, hintText,
    } = req.body || {};
    if (!subject || !text || !type || !gradeLevel) {
      return res.status(400).json({ error: 'subject, gradeLevel, type, text required' });
    }

    const subj = await prisma.subject.upsert({
      where: { name: subject },
      update: {},
      create: { name: subject },
    });
    let chapterRow = null;
    if (chapter) {
      chapterRow = await prisma.chapter.upsert({
        where: { subjectId_gradeLevel_name: { subjectId: subj.id, gradeLevel: Number(gradeLevel), name: chapter } },
        update: {},
        create: { subjectId: subj.id, gradeLevel: Number(gradeLevel), name: chapter },
      });
    }

    const isAdmin = req.user.role === 'ADMIN' || req.user.role === 'SUPERADMIN';
    const isSchoolAdmin = req.user.role === 'SCHOOL';
    const status = isAdmin || isSchoolAdmin ? 'APPROVED' : 'PENDING_APPROVAL';

    const created = await prisma.question.create({
      data: {
        subjectId: subj.id,
        chapterId: chapterRow?.id || null,
        schoolId: req.user.schoolId || null,
        gradeLevel: Number(gradeLevel),
        type: String(type).toUpperCase(),
        text,
        choices: choices ?? null,
        answerIndex: answerIndex ?? null,
        correctAnswer: correctAnswer ?? null,
        conceptTags: Array.isArray(conceptTags) ? conceptTags : [],
        difficulty: (difficulty || 'MEDIUM').toUpperCase(),
        difficultyLevel: typeof difficultyLevel === 'number' ? difficultyLevel : 0.5,
        explanation: explanation ?? null,
        hintText: hintText ?? null,
        status,
        createdById: req.user.id,
      },
    });
    res.json(created);
  } catch (e) {
    console.error('questions create error', e);
    res.status(500).json({ error: 'Failed to create question' });
  }
});

// PATCH /api/questions/:id/moderate  { action: 'APPROVE'|'REJECT' }  (admin)
router.patch('/:id/moderate', authenticate, requireRole('ADMIN', 'SUPERADMIN', 'SCHOOL'), async (req, res) => {
  try {
    const action = String(req.body?.action || '').toUpperCase();
    if (!['APPROVE', 'REJECT'].includes(action)) {
      return res.status(400).json({ error: 'action must be APPROVE or REJECT' });
    }
    const q = await prisma.question.update({
      where: { id: req.params.id },
      data: { status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED' },
    });
    await prisma.auditLog.create({
      data: {
        schoolId: req.user.schoolId || null,
        actorId: req.user.id,
        action: action === 'APPROVE' ? 'APPROVE' : 'REJECT',
        entityType: 'question',
        entityId: q.id,
      },
    });
    res.json(q);
  } catch (e) {
    res.status(500).json({ error: 'Failed to moderate' });
  }
});

module.exports = router;
