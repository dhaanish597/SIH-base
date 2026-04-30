// Game session lifecycle: start, complete, list.
// Wires into XP/coins/quest engines so every play awards rewards consistently.

const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');
const { awardSession } = require('../services/xpService');
const { fireEvent } = require('../services/questService');

const router = express.Router();

const VALID_GAME_TYPES = new Set([
  'CAR', 'PLANTS', 'FIGHTING',
  'QUIZ_BATTLE', 'MATH_DUNGEON', 'WORD_FORGE', 'SCIENCE_LAB', 'HISTORY_CONQUEST',
]);
const VALID_MODES = new Set(['SOLO', 'MULTIPLAYER', 'COOP']);

// Reward formula tuned for hackathon-balanced play.
function computeRewards({ score, questionsCorrect, questionsAttempted, durationSec, starsEarned, outcome }) {
  const accuracy = questionsAttempted > 0 ? questionsCorrect / questionsAttempted : 0;
  const baseXp = Math.round(questionsCorrect * 10 + score * 0.5);
  const accuracyBonus = accuracy >= 0.9 ? 50 : accuracy >= 0.75 ? 25 : 0;
  const speedBonus = durationSec && durationSec < 120 && questionsCorrect >= 5 ? 20 : 0;
  const winBonus = outcome === 'won' ? 50 : 0;
  const starBonus = (starsEarned || 0) * 30;

  const xp = Math.max(0, baseXp + accuracyBonus + speedBonus + winBonus + starBonus);
  const coins = Math.round(xp * 0.25);
  const points = xp;
  return { xp, coins, points };
}

// POST /api/games/start
router.post('/start', authenticate, async (req, res) => {
  try {
    const { gameType, mode, subjectId, chapterId, topicId, gradeLevel, difficulty, matchId } = req.body || {};
    if (!VALID_GAME_TYPES.has(gameType)) return res.status(400).json({ error: 'Invalid gameType' });
    if (!VALID_MODES.has(mode || 'SOLO')) return res.status(400).json({ error: 'Invalid mode' });

    const session = await prisma.gameSession.create({
      data: {
        studentId: req.user.id,
        gameType,
        mode: mode || 'SOLO',
        subjectId: subjectId || null,
        chapterId: chapterId || null,
        topicId: topicId || null,
        gradeLevel: gradeLevel != null ? Number(gradeLevel) : null,
        difficulty: difficulty || null,
        matchId: matchId || null,
      },
    });
    res.json({ sessionId: session.id, startedAt: session.startedAt });
  } catch (e) {
    console.error('games/start error', e);
    res.status(500).json({ error: 'Failed to start game session' });
  }
});

// POST /api/games/complete
//   { sessionId, score, questionsAttempted, questionsCorrect, durationSec,
//     starsEarned?, outcome?, perQuestionData? }
router.post('/complete', authenticate, async (req, res) => {
  try {
    const {
      sessionId,
      score = 0,
      questionsAttempted = 0,
      questionsCorrect = 0,
      durationSec = 0,
      starsEarned = null,
      outcome = null,
      perQuestionData = null,
    } = req.body || {};

    if (!sessionId) return res.status(400).json({ error: 'sessionId required' });
    const session = await prisma.gameSession.findUnique({ where: { id: sessionId } });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (session.studentId !== req.user.id) {
      return res.status(403).json({ error: 'Not your session' });
    }
    if (session.endedAt) return res.status(409).json({ error: 'Session already completed' });

    const { xp, coins, points } = computeRewards({
      score, questionsCorrect, questionsAttempted, durationSec, starsEarned, outcome,
    });

    const ended = new Date();
    const updated = await prisma.gameSession.update({
      where: { id: sessionId },
      data: {
        endedAt: ended,
        durationSec: Number(durationSec) || null,
        score: Number(score) || 0,
        questionsAttempted: Number(questionsAttempted) || 0,
        questionsCorrect: Number(questionsCorrect) || 0,
        starsEarned: starsEarned == null ? null : Number(starsEarned),
        outcome: outcome || null,
        perQuestionData: perQuestionData || undefined,
        xpEarned: xp,
        coinsEarned: coins,
      },
    });

    const award = await awardSession({
      userId: req.user.id,
      xp,
      coins,
      points,
      reason: 'game_complete',
      refId: sessionId,
    });

    // Fire quest events
    const questEvents = [{ kind: 'play_game', game: session.gameType }];
    if (questionsCorrect > 0) {
      questEvents.push({ kind: 'correct_answers', count: Number(questionsCorrect) });
    }
    if (outcome === 'won' && session.mode !== 'SOLO') {
      questEvents.push({ kind: 'win_match', game: session.gameType });
    }
    if (session.gameType === 'SCIENCE_LAB' && starsEarned) {
      questEvents.push({ kind: 'escape_stars', game: 'SCIENCE_LAB', stars: Number(starsEarned) });
    }
    const completedQuests = [];
    for (const ev of questEvents) {
      const done = await fireEvent({ userId: req.user.id, event: ev });
      completedQuests.push(...done);
    }

    res.json({
      session: updated,
      rewards: { xp, coins, points },
      level: award.level,
      streakDays: award.streakDays,
      newTotals: {
        xp: award.user.xp,
        coins: award.user.totalCoins,
        points: award.user.totalPoints,
        level: award.user.level,
      },
      questsCompleted: completedQuests,
    });
  } catch (e) {
    console.error('games/complete error', e);
    res.status(500).json({ error: 'Failed to complete game session' });
  }
});

// GET /api/games/sessions?limit=20
router.get('/sessions', authenticate, async (req, res) => {
  try {
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const sessions = await prisma.gameSession.findMany({
      where: { studentId: req.user.id },
      orderBy: { startedAt: 'desc' },
      take: limit,
    });
    res.json(sessions);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// POST /api/games/assign  — teacher assigns a game to a class
router.post('/assign', authenticate, async (req, res) => {
  try {
    if (!['TEACHER', 'SCHOOL', 'ADMIN', 'SUPERADMIN'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const { classId, gameType, dueDate } = req.body || {};
    if (!classId || !gameType) return res.status(400).json({ error: 'classId and gameType required' });
    if (!VALID_GAME_TYPES.has(gameType)) return res.status(400).json({ error: 'Invalid gameType' });

    const assignment = await prisma.gameAssignment.create({
      data: {
        classId,
        teacherId: req.user.id,
        gameType,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    });
    res.json({ id: assignment.id, gameType: assignment.gameType });
  } catch (e) {
    console.error('games/assign', e);
    res.status(500).json({ error: 'Failed to assign game' });
  }
});

module.exports = router;
