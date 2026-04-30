const express = require('express');
const { authenticate } = require('../middleware/auth');
const pacingEngine = require('../services/pacingEngine');

const router = express.Router();

// GET /api/pacing/optimal?subject=Mathematics
router.get('/optimal', authenticate, async (req, res) => {
  try {
    const subject = req.query.subject ? String(req.query.subject) : null;
    const data = await pacingEngine.calculateOptimalPacing(req.user.id, subject);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Failed to compute pacing' });
  }
});

// GET /api/pacing/should-break?currentSessionMinutes=25
router.get('/should-break', authenticate, async (req, res) => {
  try {
    const minutes = Number(req.query.currentSessionMinutes || req.query.minutes || 0);
    const data = await pacingEngine.shouldTakeBreak(req.user.id, minutes);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Failed to evaluate break' });
  }
});

// POST /api/pacing/adjust  { recentPerformance? }
router.post('/adjust', authenticate, async (req, res) => {
  try {
    const data = await pacingEngine.adjustContentPace(req.user.id, req.body?.recentPerformance);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message || 'Failed to adjust pacing' });
  }
});

module.exports = router;
