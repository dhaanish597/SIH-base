const express = require('express');
const { authenticate } = require('../middleware/auth');
const feedbackEngine = require('../services/feedbackEngine');

const router = express.Router();

// POST /api/feedback/quiz-complete  { quizId, answers: [...] }
router.post('/quiz-complete', authenticate, async (req, res) => {
  try {
    const out = await feedbackEngine.generatePostQuizFeedback(req.user.id, req.body || {});
    res.json(out);
  } catch (e) {
    console.error('feedback/quiz-complete', e);
    res.status(500).json({ error: e.message || 'Failed to generate feedback' });
  }
});

// GET /api/feedback/hint?questionId=...&attempt=N
router.get('/hint', authenticate, async (req, res) => {
  try {
    const questionId = String(req.query.questionId || '');
    const attempt = Number(req.query.attempt || 1);
    if (!questionId) return res.status(400).json({ error: 'questionId required' });
    const hint = feedbackEngine.generateRealTimeHint(questionId, null, attempt);
    res.json(hint);
  } catch (e) {
    res.status(500).json({ error: 'Failed to generate hint' });
  }
});

// GET /api/feedback/explain?concept=fractions&level=beginner
router.get('/explain', authenticate, async (req, res) => {
  try {
    const concept = String(req.query.concept || '');
    const level = String(req.query.level || 'beginner');
    if (!concept) return res.status(400).json({ error: 'concept required' });
    const out = await feedbackEngine.explainConcept(concept, level);
    res.json(out);
  } catch (e) {
    res.status(500).json({ error: 'Failed to explain concept' });
  }
});

module.exports = router;
