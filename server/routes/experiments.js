const express = require('express');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const experimentation = require('../services/experimentation');

const router = express.Router();

// GET /api/experiments/strategy
router.get('/strategy', authenticate, async (req, res) => {
  try {
    const strategy = await experimentation.getStudentStrategy(req.user.id);
    res.json({ strategy });
  } catch (e) {
    res.status(500).json({ error: 'Failed to get strategy' });
  }
});

// POST /api/experiments/track  { learningGains, engagement, completion }
router.post('/track', authenticate, async (req, res) => {
  try {
    const updated = await experimentation.trackOutcomes(req.user.id, req.body || {});
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: 'Failed to track outcomes' });
  }
});

// GET /api/experiments/stats  (admin-only)
router.get('/stats', authenticate, requireRole('ADMIN', 'SUPERADMIN'), async (req, res) => {
  try {
    const stats = await experimentation.getExperimentStats();
    res.json(stats);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch experiment stats' });
  }
});

module.exports = router;
