// Per-student lesson/quiz progress tracking. Funnels rewards through xpService.

const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');
const { awardSession } = require('../services/xpService');
const learnerModel = require('../services/learnerModel');

const router = express.Router();

// GET /api/progress/me  - all completed lessons for the current student
router.get('/me', authenticate, async (req, res) => {
  try {
    const list = await prisma.studentProgress.findMany({
      where: { studentId: req.user.id },
      orderBy: { completedAt: 'desc' },
      take: 200,
      include: { lesson: { select: { title: true, subject: { select: { name: true } } } } },
    });
    res.json(
      list.map((p) => ({
        id: p.id,
        lesson_id: p.lessonId,
        lessonTitle: p.lesson?.title || '',
        subject: p.lesson?.subject?.name || 'General',
        score: p.score,
        time_spent: p.timeSpent,
        attempts: p.attempts,
        completed_at: p.completedAt,
      })),
    );
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

// POST /api/progress  { lessonId, score, timeSpent, attempts?, conceptTags?, errorType? }
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      lessonId,
      score = 0,
      timeSpent = 0,
      attempts = 1,
      conceptTags = [],
      errorType = null,
    } = req.body || {};
    if (!lessonId) return res.status(400).json({ error: 'lessonId required' });

    const created = await prisma.studentProgress.create({
      data: {
        studentId: req.user.id,
        lessonId,
        score: Number(score) || 0,
        timeSpent: Number(timeSpent) || 0,
        attempts: Number(attempts) || 1,
        conceptTags: Array.isArray(conceptTags) ? conceptTags : [],
        errorType: errorType || null,
      },
    });

    // Award XP/coins/points proportional to score
    const xp = Math.round((Number(score) || 0) * 0.5);
    const coins = Math.round(xp * 0.25);
    const award = await awardSession({
      userId: req.user.id,
      xp,
      coins,
      points: xp,
      reason: 'lesson_complete',
      refId: created.id,
    });

    // Update concept mastery for any tags
    for (const c of created.conceptTags) {
      try {
        await learnerModel.updateConceptMastery(req.user.id, c, true, Number(timeSpent) || 0);
      } catch {}
    }

    res.json({ progress: created, rewards: { xp, coins, points: xp }, level: award.level });
  } catch (e) {
    console.error('progress POST error', e);
    res.status(500).json({ error: 'Failed to record progress' });
  }
});

// GET /api/progress/:studentId/:lessonId  - look up a single record
router.get('/:studentId/:lessonId', authenticate, async (req, res) => {
  try {
    const p = await prisma.studentProgress.findFirst({
      where: { studentId: req.params.studentId, lessonId: req.params.lessonId },
      orderBy: { completedAt: 'desc' },
    });
    res.json(p || null);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

module.exports = router;
