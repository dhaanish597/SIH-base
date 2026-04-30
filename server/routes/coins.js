// Coins balance + transaction history.

const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/coins/balance
router.get('/balance', authenticate, async (req, res) => {
  try {
    const u = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { totalCoins: true, totalPoints: true, xp: true, level: true },
    });
    res.json(u);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch balance' });
  }
});

// GET /api/coins/history?limit=50
router.get('/history', authenticate, async (req, res) => {
  try {
    const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50));
    const txs = await prisma.coinTransaction.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    res.json(txs);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

module.exports = router;
