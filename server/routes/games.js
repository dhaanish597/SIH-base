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
  'BATTLE_ZONE', 'PUZZLE_ARENA', 'CARD_FORGE',
]);
const VALID_MODES = new Set(['SOLO', 'MULTIPLAYER', 'COOP']);

const GAME_CATALOG = [
  {
    slug: 'quiz-battle',
    gameType: 'QUIZ_BATTLE',
    title: 'Quiz Battle',
    blurb: 'Real-time PvP quiz across a class lobby.',
    players: '2-30 players',
    duration: '5 min',
    subjects: ['All Subjects'],
    grade: 'Grade 6-12',
    modes: ['MULTIPLAYER'],
    unlockLevel: 1,
    accent: 'rose',
  },
  {
    slug: 'math-dungeon',
    gameType: 'MATH_DUNGEON',
    title: 'Math Dungeon',
    blurb: 'Defeat enemies by solving math problems.',
    players: 'Solo',
    duration: '10 min',
    subjects: ['Mathematics'],
    grade: 'Grade 6-12',
    modes: ['SOLO'],
    unlockLevel: 1,
    accent: 'amber',
  },
  {
    slug: 'word-forge',
    gameType: 'WORD_FORGE',
    title: 'Word Forge',
    blurb: 'Build vocabulary, grammar, and sentence skills.',
    players: 'Solo',
    duration: '8 min',
    subjects: ['English'],
    grade: 'Grade 6-12',
    modes: ['SOLO'],
    unlockLevel: 1,
    accent: 'violet',
  },
  {
    slug: 'science-lab',
    gameType: 'SCIENCE_LAB',
    title: 'Science Lab Escape',
    blurb: 'Solve science puzzles and escape the lab.',
    players: 'Solo',
    duration: '12 min',
    subjects: ['Science'],
    grade: 'Grade 8-12',
    modes: ['SOLO'],
    unlockLevel: 1,
    accent: 'emerald',
  },
  {
    slug: 'history-conquest',
    gameType: 'HISTORY_CONQUEST',
    title: 'History Conquest',
    blurb: 'Capture territories by answering history questions.',
    players: 'Solo',
    duration: '15 min',
    subjects: ['History'],
    grade: 'Grade 6-12',
    modes: ['SOLO'],
    unlockLevel: 1,
    accent: 'indigo',
  },
  {
    slug: 'battle-zone',
    gameType: 'BATTLE_ZONE',
    title: 'Battle Zone',
    blurb: 'Defeat 3 monster bosses by solving math problems under a 10s timer.',
    players: 'Solo',
    duration: '8 min',
    subjects: ['Mathematics'],
    grade: 'Grade 6-12',
    modes: ['SOLO'],
    unlockLevel: 1,
    accent: 'rose',
  },
  {
    slug: 'puzzle-arena',
    gameType: 'PUZZLE_ARENA',
    title: 'Puzzle Arena',
    blurb: 'Memory-match 8 formula cards with their names before the 3-minute timer runs out.',
    players: 'Solo',
    duration: '3 min',
    subjects: ['Mathematics', 'Science'],
    grade: 'Grade 7-12',
    modes: ['SOLO'],
    unlockLevel: 1,
    accent: 'cyan',
  },
  {
    slug: 'card-forge',
    gameType: 'CARD_FORGE',
    title: 'Card Forge',
    blurb: 'Build a hand of formula cards and defeat the Fog of Forgetting using concept mastery.',
    players: 'Solo',
    duration: '10 min',
    subjects: ['Mathematics', 'Science'],
    grade: 'Grade 8-12',
    modes: ['SOLO'],
    unlockLevel: 1,
    accent: 'violet',
  },
];

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

// GET /api/games/catalog
router.get('/catalog', authenticate, async (req, res) => {
  try {
    let assignmentRows = [];
    if (req.user.role === 'STUDENT') {
      const enrollments = await prisma.classEnrollment.findMany({
        where: { studentId: req.user.id },
        select: { classId: true },
      });
      const classIds = enrollments.map((e) => e.classId);
      if (classIds.length > 0) {
        assignmentRows = await prisma.gameAssignment.findMany({
          where: { classId: { in: classIds }, OR: [{ dueDate: null }, { dueDate: { gte: new Date() } }] },
          orderBy: { createdAt: 'desc' },
          include: { class: { select: { id: true, name: true } } },
        });
      }
    }

    const history = req.user.role === 'STUDENT'
      ? await prisma.gameSession.groupBy({
          by: ['gameType'],
          where: { studentId: req.user.id, endedAt: { not: null } },
          _count: { _all: true },
          _max: { score: true, startedAt: true },
        })
      : [];
    const historyByType = new Map(history.map((h) => [h.gameType, h]));
    const assignmentsByType = new Map();
    for (const assignment of assignmentRows) {
      if (!assignmentsByType.has(assignment.gameType)) assignmentsByType.set(assignment.gameType, []);
      assignmentsByType.get(assignment.gameType).push({
        id: assignment.id,
        classId: assignment.classId,
        className: assignment.class?.name ?? null,
        dueDate: assignment.dueDate,
        instructions: assignment.instructions,
      });
    }

    const level = Number(req.user.level || 1);
    const games = GAME_CATALOG.map((game) => {
      const h = historyByType.get(game.gameType);
      const assignments = assignmentsByType.get(game.gameType) || [];
      return {
        ...game,
        locked: level < game.unlockLevel,
        assigned: assignments.length > 0,
        assignments,
        stats: h ? { plays: h._count._all, bestScore: h._max.score || 0, lastPlayedAt: h._max.startedAt } : { plays: 0, bestScore: 0, lastPlayedAt: null },
      };
    }).sort((a, b) => Number(b.assigned) - Number(a.assigned) || Number(Boolean(b.stats.lastPlayedAt)) - Number(Boolean(a.stats.lastPlayedAt)));

    res.json({ games });
  } catch (e) {
    console.error('games/catalog error', e);
    res.status(500).json({ error: 'Failed to fetch game catalog' });
  }
});

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

// GET /api/games/history?limit=20
router.get('/history', authenticate, async (req, res) => {
  try {
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const sessions = await prisma.gameSession.findMany({
      where: { studentId: req.user.id, endedAt: { not: null } },
      orderBy: { startedAt: 'desc' },
      take: limit,
    });
    res.json({ sessions });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch game history' });
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
