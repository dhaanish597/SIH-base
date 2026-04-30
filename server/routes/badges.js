// Badges — Prisma-backed equivalents of legacy /api/get-badge/:userId

const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const TIERS = [
  { key: 'champion', threshold: 300 },
  { key: 'achiever', threshold: 150 },
  { key: 'learner', threshold: 50 },
  { key: 'beginner', threshold: 0 },
];

function computeLegacyBadge(points) {
  for (const t of TIERS) if (points >= t.threshold) return t.key;
  return 'beginner';
}

// GET /api/badges/me
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { totalPoints: true, lastLogin: true, totalCoins: true, level: true, xp: true },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const earned = await prisma.userBadge.findMany({
      where: { userId: req.user.id },
      include: { badge: true },
      orderBy: { earnedAt: 'desc' },
    });

    res.json({
      points: user.totalPoints,
      coins: user.totalCoins,
      level: user.level,
      xp: user.xp,
      badge: computeLegacyBadge(user.totalPoints), // legacy compat
      lastLogin: user.lastLogin,
      earnedBadges: earned.map((e) => ({
        key: e.badge.key,
        name: e.badge.name,
        description: e.badge.description,
        type: e.badge.type,
        iconUrl: e.badge.iconUrl,
        earnedAt: e.earnedAt,
      })),
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch badges' });
  }
});

// GET /api/badges/definitions  - all badge defs
router.get('/definitions', authenticate, async (req, res) => {
  try {
    const defs = await prisma.badgeDefinition.findMany({ orderBy: { name: 'asc' } });
    res.json(defs);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch badge definitions' });
  }
});

module.exports = router;
