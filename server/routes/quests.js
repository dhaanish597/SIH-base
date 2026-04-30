const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');
const questService = require('../services/questService');

const router = express.Router();

// GET /api/quests/me
router.get('/me', authenticate, async (req, res) => {
  try {
    const list = await questService.getUserQuests(req.user.id);
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch quests' });
  }
});

// GET /api/quests  - all active quests (catalog)
router.get('/', authenticate, async (req, res) => {
  try {
    const now = new Date();
    const quests = await prisma.quest.findMany({
      where: {
        isActive: true,
        OR: [{ endsAt: null }, { endsAt: { gte: now } }],
      },
      orderBy: [{ type: 'asc' }, { title: 'asc' }],
    });
    res.json(quests);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch quests' });
  }
});

module.exports = router;
