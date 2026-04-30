// Spec-required AI tutor features powered by Claude:
//  - hint generator (gives a hint without revealing answer)
//  - free-text grader (Story Spark / open-ended)
//  - concept explainer (post-wrong-answer)
//  - personalized study nudge (after a session)

const { callClaudeJson } = require('./aiClient');

// ----------------------------- Hint generator -----------------------------

const HINT_SYSTEM = [
  'You are a tutor giving a SINGLE hint. Never reveal the final answer.',
  'Goal: nudge the student toward the next reasoning step they must take.',
  '',
  'Output JSON only:',
  '{ "hint": "<one short hint>", "nextStep": "<a tiny next step they should try>" }',
].join('\n');

async function generateHint({ question, choices, conceptTags, grade }) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      hint: 'Re-read the question carefully and identify what is being asked.',
      nextStep: 'Try eliminating any answer that is clearly wrong.',
    };
  }
  const userPayload = {
    grade,
    conceptTags: conceptTags || [],
    question,
    choices: choices || [],
  };
  const { json } = await callClaudeJson({
    system: [{ type: 'text', text: HINT_SYSTEM, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: JSON.stringify(userPayload) }],
    maxTokens: 200,
    temperature: 0.3,
  });
  return { hint: String(json.hint || ''), nextStep: String(json.nextStep || '') };
}

// --------------------------- Free-text grader -----------------------------

const GRADER_SYSTEM = [
  'You are an English/Language tutor scoring a short student response.',
  'Score on:',
  '- vocabularyUse (0-10): did the student use the required words correctly and naturally?',
  '- grammar (0-10): subject-verb agreement, tense consistency, punctuation',
  '- creativity (0-10): originality and clarity',
  'Compute totalScore as the rounded average × 10 (so out of 100).',
  '',
  'Output JSON only:',
  '{',
  '  "totalScore": <0-100>,',
  '  "vocabularyUse": <0-10>,',
  '  "grammar": <0-10>,',
  '  "creativity": <0-10>,',
  '  "wordsUsedCorrectly": ["..."],',
  '  "wordsMissedOrMisused": ["..."],',
  '  "feedback": "<two short sentences of constructive feedback>",',
  '  "improvementTip": "<one practical tip>"',
  '}',
].join('\n');

async function gradeFreeTextResponse({ prompt, requiredWords, studentResponse, grade }) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      totalScore: 50,
      vocabularyUse: 5,
      grammar: 5,
      creativity: 5,
      wordsUsedCorrectly: [],
      wordsMissedOrMisused: requiredWords || [],
      feedback: 'Auto-grading is unavailable. Your teacher will review this manually.',
      improvementTip: 'Try to use every required word in a meaningful sentence.',
    };
  }
  const payload = {
    grade,
    prompt,
    requiredWords: requiredWords || [],
    studentResponse: String(studentResponse || '').slice(0, 4000),
  };
  const { json } = await callClaudeJson({
    system: [{ type: 'text', text: GRADER_SYSTEM, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: JSON.stringify(payload) }],
    maxTokens: 600,
    temperature: 0.3,
  });
  return {
    totalScore: Number(json.totalScore || 0),
    vocabularyUse: Number(json.vocabularyUse || 0),
    grammar: Number(json.grammar || 0),
    creativity: Number(json.creativity || 0),
    wordsUsedCorrectly: Array.isArray(json.wordsUsedCorrectly) ? json.wordsUsedCorrectly : [],
    wordsMissedOrMisused: Array.isArray(json.wordsMissedOrMisused) ? json.wordsMissedOrMisused : [],
    feedback: String(json.feedback || ''),
    improvementTip: String(json.improvementTip || ''),
  };
}

// -------------------------- Concept explainer -----------------------------

const EXPLAINER_SYSTEM = [
  'A student answered a question incorrectly. Explain WHY their answer was wrong',
  'and what concept they missed, in language appropriate for their grade.',
  '',
  'Output JSON only:',
  '{',
  '  "whyWrong": "<one short paragraph - why their answer is incorrect>",',
  '  "correctConcept": "<the underlying concept they need to grasp>",',
  '  "miniExample": "<one tiny worked example>",',
  '  "tryThis": "<a similar but simpler practice problem to attempt>"',
  '}',
].join('\n');

async function explainWrongAnswer({ question, choices, correctAnswer, studentAnswer, conceptTags, grade }) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      whyWrong: 'Your answer does not match the correct one.',
      correctConcept: (conceptTags || [])[0] || 'this topic',
      miniExample: '',
      tryThis: '',
    };
  }
  const payload = { grade, question, choices, correctAnswer, studentAnswer, conceptTags };
  const { json } = await callClaudeJson({
    system: [{ type: 'text', text: EXPLAINER_SYSTEM, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: JSON.stringify(payload) }],
    maxTokens: 500,
    temperature: 0.3,
  });
  return {
    whyWrong: String(json.whyWrong || ''),
    correctConcept: String(json.correctConcept || ''),
    miniExample: String(json.miniExample || ''),
    tryThis: String(json.tryThis || ''),
  };
}

// ------------------------- Personalized nudge -----------------------------

const NUDGE_SYSTEM = [
  'Given a student\'s recent quiz performance, write ONE warm, encouraging,',
  'specific suggestion of what to try next. 1-2 sentences max.',
  '',
  'Output JSON only:',
  '{',
  '  "message": "<the nudge>",',
  '  "suggestedAction": { "type": "play_game"|"review_lesson"|"try_topic", "target": "<short label>" }',
  '}',
].join('\n');

async function generateStudyNudge({ studentName, weakConcepts, strongConcepts, lastSessionScore, grade }) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      message: `Nice work, ${studentName || 'student'}! Try a Math Dungeon round to keep your streak.`,
      suggestedAction: { type: 'play_game', target: 'Math Dungeon' },
    };
  }
  const payload = { studentName, grade, weakConcepts, strongConcepts, lastSessionScore };
  const { json } = await callClaudeJson({
    system: [{ type: 'text', text: NUDGE_SYSTEM, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: JSON.stringify(payload) }],
    maxTokens: 200,
    temperature: 0.5,
  });
  return {
    message: String(json.message || ''),
    suggestedAction: json.suggestedAction || null,
  };
}

module.exports = {
  generateHint,
  gradeFreeTextResponse,
  explainWrongAnswer,
  generateStudyNudge,
};
