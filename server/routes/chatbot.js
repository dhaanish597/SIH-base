// Tutor chatbot routes — Claude-powered.

const express = require('express');
const { authenticate } = require('../middleware/auth');
const { askChatbot } = require('../services/chatbotService');
const aiTutor = require('../services/aiTutorService');

const router = express.Router();

// POST /api/chatbot/ask  { question, subject?, conversation?[] }
router.post('/ask', authenticate, async (req, res) => {
  try {
    const { question, subject, conversation } = req.body || {};
    const grade = Number(req.user?.class || 9);
    const out = await askChatbot({
      studentId: req.user.id,
      grade,
      subject,
      question,
      conversation,
    });
    res.json(out);
  } catch (e) {
    console.error('chatbot/ask error', e);
    res.status(500).json({ error: 'Chatbot unavailable' });
  }
});

// GET /api/chatbot/hint?question=...&choices=...
router.get('/hint', authenticate, async (req, res) => {
  try {
    const question = String(req.query.question || '');
    const choices = req.query.choices ? JSON.parse(req.query.choices) : null;
    const conceptTags = req.query.conceptTags ? JSON.parse(req.query.conceptTags) : [];
    const grade = Number(req.user?.class || 9);
    const out = await aiTutor.generateHint({ question, choices, conceptTags, grade });
    res.json(out);
  } catch (e) {
    console.error('chatbot/hint error', e);
    res.status(500).json({ error: 'Hint unavailable' });
  }
});

// POST /api/chatbot/grade-free-text
router.post('/grade-free-text', authenticate, async (req, res) => {
  try {
    const { prompt, requiredWords, studentResponse } = req.body || {};
    const grade = Number(req.user?.class || 9);
    const out = await aiTutor.gradeFreeTextResponse({ prompt, requiredWords, studentResponse, grade });
    res.json(out);
  } catch (e) {
    console.error('chatbot/grade-free-text error', e);
    res.status(500).json({ error: 'Grading unavailable' });
  }
});

// POST /api/chatbot/explain  { question, choices, correctAnswer, studentAnswer, conceptTags }
router.post('/explain', authenticate, async (req, res) => {
  try {
    const grade = Number(req.user?.class || 9);
    const out = await aiTutor.explainWrongAnswer({ ...req.body, grade });
    res.json(out);
  } catch (e) {
    console.error('chatbot/explain error', e);
    res.status(500).json({ error: 'Explanation unavailable' });
  }
});

// POST /api/chatbot/nudge  { weakConcepts, strongConcepts, lastSessionScore }
router.post('/nudge', authenticate, async (req, res) => {
  try {
    const grade = Number(req.user?.class || 9);
    const out = await aiTutor.generateStudyNudge({
      studentName: req.user.name,
      grade,
      ...req.body,
    });
    res.json(out);
  } catch (e) {
    console.error('chatbot/nudge error', e);
    res.status(500).json({ error: 'Nudge unavailable' });
  }
});

module.exports = router;
