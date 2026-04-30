const express = require('express');
const { authenticate } = require('../middleware/auth');
const recommendationEngine = require('../services/recommendationEngine');

const router = express.Router();

// GET /api/recommendations?limit=5&subject=Mathematics
router.get('/', authenticate, async (req, res) => {
  try {
    const limit = Math.min(20, Math.max(1, Number(req.query.limit) || 5));
    const subject = req.query.subject ? String(req.query.subject) : null;
    const recs = await recommendationEngine.getRecommendedContent(req.user.id, { limit, subject });
    res.json(recs);
  } catch (e) {
    console.error('recommendations error', e);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

// GET /api/recommendations/learning-path?subject=Mathematics
router.get('/learning-path', authenticate, async (req, res) => {
  try {
    const subject = req.query.subject ? String(req.query.subject) : null;
    const path = await recommendationEngine.getPersonalizedLearningPath(req.user.id, subject);
    res.json(path);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch learning path' });
  }
});

// GET /api/recommendations/review
router.get('/review', authenticate, async (req, res) => {
  try {
    const list = await recommendationEngine.getReviewRecommendations(req.user.id);
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch review recommendations' });
  }
});

module.exports = router;
