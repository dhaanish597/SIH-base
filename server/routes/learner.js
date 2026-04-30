// Learner-model API routes (knowledge state, learning style, optimal difficulty,
// profile updates). Wraps server/services/learnerModel (Prisma-backed).

const express = require('express');
const { authenticate } = require('../middleware/auth');
const learnerModel = require('../services/learnerModel');

const router = express.Router();

// POST /api/learner/update-mastery  { conceptName, isCorrect, timeSpent }
router.post('/update-mastery', authenticate, async (req, res) => {
  try {
    const { conceptName, isCorrect, timeSpent } = req.body || {};
    if (!conceptName) return res.status(400).json({ error: 'conceptName required' });
    const result = await learnerModel.updateConceptMastery(
      req.user.id,
      String(conceptName),
      !!isCorrect,
      Number(timeSpent || 0),
    );
    res.json(result);
  } catch (e) {
    console.error('learner/update-mastery', e);
    res.status(500).json({ error: 'Failed to update mastery' });
  }
});

// GET /api/learner/knowledge-state
router.get('/knowledge-state', authenticate, async (req, res) => {
  try {
    const data = await learnerModel.getStudentKnowledgeState(req.user.id);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch knowledge state' });
  }
});

// GET /api/learner/learning-style
router.get('/learning-style', authenticate, async (req, res) => {
  try {
    const data = await learnerModel.detectLearningStyle(req.user.id);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Failed to detect learning style' });
  }
});

// GET /api/learner/recommended-difficulty?subject=Mathematics
router.get('/recommended-difficulty', authenticate, async (req, res) => {
  try {
    const subject = req.query.subject ? String(req.query.subject) : null;
    const data = await learnerModel.getRecommendedDifficulty(req.user.id, subject);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch recommended difficulty' });
  }
});

// POST /api/learner/update-profile  { timeSpent, questionsAnswered, correctAnswers, modality }
router.post('/update-profile', authenticate, async (req, res) => {
  try {
    const data = await learnerModel.updateLearningProfile(req.user.id, req.body || {});
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router;
