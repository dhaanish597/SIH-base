// Learner model — Prisma version. Same exported API as before.
//   - updateConceptMastery: EMA over correctness; updates confidence & timing
//   - getStudentKnowledgeState: bucketed (mastered / learning / weak)
//   - updateLearningProfile: rolling velocity, optimal difficulty, engagement
//   - detectLearningStyle: from per-modality time accumulators
//   - getRecommendedDifficulty: profile + recent performance blend

const prisma = require('../lib/prisma');

const STYLE_TO_PRISMA = { visual: 'VISUAL', kinesthetic: 'KINESTHETIC', reading: 'READING', mixed: 'MIXED' };
const STYLE_TO_LOWER = { VISUAL: 'visual', KINESTHETIC: 'kinesthetic', READING: 'reading', MIXED: 'mixed' };

function normStyleIn(s) {
  if (!s) return 'MIXED';
  return STYLE_TO_PRISMA[String(s).toLowerCase()] || 'MIXED';
}
function normStyleOut(s) {
  if (!s) return 'mixed';
  return STYLE_TO_LOWER[String(s).toUpperCase()] || 'mixed';
}

async function updateConceptMastery(studentId, conceptName, isCorrect, timeSpent) {
  const existing = await prisma.conceptMastery.findUnique({
    where: { studentId_conceptName: { studentId, conceptName } },
  });

  if (existing) {
    const newMastery = existing.masteryLevel * 0.7 + (isCorrect ? 0.3 : 0);
    const newAttempts = existing.attemptsCount + 1;
    const newCorrect = existing.correctCount + (isCorrect ? 1 : 0);
    const totalTime = (existing.averageTimeSpent || 0) * (newAttempts - 1) + (timeSpent || 0);
    const newAvgTime = totalTime / newAttempts;
    const accuracy = newCorrect / newAttempts;
    const consistency = 1 - Math.abs(accuracy - newMastery);
    const newConfidence = Math.min(0.95, Math.max(0.1, consistency * 0.6 + Math.min(newAttempts / 20, 1) * 0.4));

    const updated = await prisma.conceptMastery.update({
      where: { id: existing.id },
      data: {
        masteryLevel: newMastery,
        confidenceScore: newConfidence,
        lastPracticed: new Date(),
        attemptsCount: newAttempts,
        correctCount: newCorrect,
        averageTimeSpent: newAvgTime,
      },
    });
    return {
      id: updated.id,
      mastery_level: updated.masteryLevel,
      confidence_score: updated.confidenceScore,
      attempts_count: updated.attemptsCount,
      correct_count: updated.correctCount,
    };
  }

  const initialMastery = isCorrect ? 0.3 : 0;
  const created = await prisma.conceptMastery.create({
    data: {
      studentId,
      conceptName,
      masteryLevel: initialMastery,
      confidenceScore: 0.1,
      lastPracticed: new Date(),
      attemptsCount: 1,
      correctCount: isCorrect ? 1 : 0,
      averageTimeSpent: timeSpent || 0,
    },
  });
  return {
    id: created.id,
    mastery_level: created.masteryLevel,
    confidence_score: created.confidenceScore,
    attempts_count: 1,
    correct_count: created.correctCount,
  };
}

async function getStudentKnowledgeState(studentId) {
  const concepts = await prisma.conceptMastery.findMany({
    where: { studentId },
    orderBy: { masteryLevel: 'desc' },
  });

  const mastered = [];
  const learning = [];
  const weak = [];
  let totalMastery = 0;

  for (const c of concepts) {
    totalMastery += c.masteryLevel;
    const item = {
      concept_name: c.conceptName,
      mastery_level: c.masteryLevel,
      confidence_score: c.confidenceScore,
      last_practiced: c.lastPracticed,
      attempts_count: c.attemptsCount,
      correct_count: c.correctCount,
    };
    if (c.masteryLevel > 0.8) mastered.push(item);
    else if (c.masteryLevel >= 0.3) learning.push(item);
    else weak.push(item);
  }

  return {
    mastered_concepts: mastered,
    learning_concepts: learning,
    weak_concepts: weak,
    overall_mastery_score: concepts.length > 0 ? totalMastery / concepts.length : 0,
    total_concepts: concepts.length,
  };
}

async function updateLearningProfile(studentId, activityData) {
  const { timeSpent = 0, questionsAnswered = 0, correctAnswers = 0, modality } = activityData || {};

  const styleMap = {
    visual: 'visual',
    video: 'visual',
    interactive: 'practice',
    practice: 'practice',
    kinesthetic: 'practice',
    text: 'reading',
    reading: 'reading',
  };
  const modalityType = modality ? styleMap[String(modality).toLowerCase()] : null;

  const existing = await prisma.studentLearningProfile.findUnique({ where: { studentId } });

  const sessionVelocity =
    questionsAnswered > 0 && timeSpent > 0 ? questionsAnswered / (timeSpent / 60) : null;
  const accuracy = questionsAnswered > 0 ? correctAnswers / questionsAnswered : 0;

  if (existing) {
    const currentVelocity = existing.averageLearningVelocity || 0;
    const newVelocity = sessionVelocity != null ? currentVelocity * 0.7 + sessionVelocity * 0.3 : currentVelocity;

    let newOptimal = existing.optimalDifficultyLevel ?? 0.5;
    if (accuracy > 0.9) newOptimal = Math.min(1.0, newOptimal + 0.05);
    else if (accuracy < 0.6) newOptimal = Math.max(0.1, newOptimal - 0.05);

    const engagementBoost = questionsAnswered > 5 ? 0.1 : 0.05;
    const newEngagement = Math.min(1.0, (existing.engagementScore || 0.5) + engagementBoost);

    let timeVisual = existing.timeSpentVisual || 0;
    let timeReading = existing.timeSpentReading || 0;
    let timePractice = existing.timeSpentPractice || 0;
    if (modalityType === 'visual') timeVisual += timeSpent;
    else if (modalityType === 'reading') timeReading += timeSpent;
    else if (modalityType === 'practice') timePractice += timeSpent;

    let newStyle = existing.preferredLearningStyle || 'MIXED';
    if (modalityType === 'visual') newStyle = 'VISUAL';
    else if (modalityType === 'reading') newStyle = 'READING';
    else if (modalityType === 'practice') newStyle = 'KINESTHETIC';

    const updated = await prisma.studentLearningProfile.update({
      where: { studentId },
      data: {
        preferredLearningStyle: newStyle,
        averageLearningVelocity: newVelocity,
        optimalDifficultyLevel: newOptimal,
        engagementScore: newEngagement,
        timeSpentVisual: timeVisual,
        timeSpentReading: timeReading,
        timeSpentPractice: timePractice,
      },
    });
    return {
      id: updated.id,
      average_learning_velocity: updated.averageLearningVelocity,
      optimal_difficulty_level: updated.optimalDifficultyLevel,
      engagement_score: updated.engagementScore,
      preferred_learning_style: normStyleOut(updated.preferredLearningStyle),
    };
  }

  // Create new profile
  let timeVisual = 0,
    timeReading = 0,
    timePractice = 0;
  if (modalityType === 'visual') timeVisual = timeSpent;
  else if (modalityType === 'reading') timeReading = timeSpent;
  else if (modalityType === 'practice') timePractice = timeSpent;

  let style = 'MIXED';
  if (modalityType === 'visual') style = 'VISUAL';
  else if (modalityType === 'reading') style = 'READING';
  else if (modalityType === 'practice') style = 'KINESTHETIC';

  const created = await prisma.studentLearningProfile.create({
    data: {
      studentId,
      preferredLearningStyle: style,
      averageLearningVelocity: sessionVelocity || 0,
      optimalDifficultyLevel: 0.5,
      engagementScore: 0.5,
      timeSpentVisual: timeVisual,
      timeSpentReading: timeReading,
      timeSpentPractice: timePractice,
    },
  });
  return {
    id: created.id,
    average_learning_velocity: created.averageLearningVelocity,
    optimal_difficulty_level: created.optimalDifficultyLevel,
    engagement_score: created.engagementScore,
    preferred_learning_style: normStyleOut(created.preferredLearningStyle),
  };
}

async function detectLearningStyle(studentId) {
  const profile = await prisma.studentLearningProfile.findUnique({ where: { studentId } });
  if (!profile) {
    return { learningStyle: 'mixed', percentages: { visual: 0, reading: 0, practice: 0 }, confidence: 0 };
  }
  const v = profile.timeSpentVisual || 0;
  const r = profile.timeSpentReading || 0;
  const p = profile.timeSpentPractice || 0;
  const total = v + r + p;
  const pct = {
    visual: total > 0 ? (v / total) * 100 : 0,
    reading: total > 0 ? (r / total) * 100 : 0,
    practice: total > 0 ? (p / total) * 100 : 0,
  };
  let detected = 'mixed';
  if (pct.visual >= 60) detected = 'visual';
  else if (pct.reading >= 60) detected = 'reading';
  else if (pct.practice >= 60) detected = 'kinesthetic';

  const maxPct = Math.max(pct.visual, pct.reading, pct.practice);
  const confidence = total > 0 ? Math.min(1.0, maxPct / 100) : 0;

  const previous = normStyleOut(profile.preferredLearningStyle);
  let updated = false;
  if (detected !== previous) {
    await prisma.studentLearningProfile.update({
      where: { studentId },
      data: { preferredLearningStyle: normStyleIn(detected) },
    });
    updated = true;
  }

  return { learningStyle: detected, percentages: pct, confidence, previousStyle: previous, updated };
}

async function getRecommendedDifficulty(studentId, subject) {
  const profile = await prisma.studentLearningProfile.findUnique({ where: { studentId } });

  if (!profile || profile.optimalDifficultyLevel == null) {
    return { difficulty: 0.5, source: 'default', confidence: 0.3 };
  }

  let recommended = profile.optimalDifficultyLevel;
  const since = new Date(Date.now() - 7 * 24 * 3600 * 1000);

  // Recent progress in this subject
  const subjectRow = subject ? await prisma.subject.findUnique({ where: { name: subject } }) : null;
  const recent = await prisma.studentProgress.findMany({
    where: {
      studentId,
      completedAt: { gte: since },
      ...(subjectRow ? { lesson: { subjectId: subjectRow.id } } : {}),
    },
    include: { lesson: { select: { difficulty: true } } },
    orderBy: { completedAt: 'desc' },
    take: 10,
  });

  if (recent.length > 0) {
    const avgScore = recent.reduce((s, p) => s + (p.score || 0), 0) / recent.length;
    const avgDiffRaw = recent.reduce((s, p) => s + (p.lesson?.difficulty || 5), 0) / recent.length;
    const avgDiff = avgDiffRaw / 10;
    const normScore = avgScore / 100;
    if (normScore > 0.8) recommended = Math.min(1.0, recommended + 0.1);
    else if (normScore < 0.6) recommended = Math.max(0.1, recommended - 0.1);
    recommended = recommended * 0.6 + avgDiff * 0.4;
    return {
      difficulty: Math.max(0.1, Math.min(1.0, recommended)),
      source: 'recent_performance',
      confidence: profile.engagementScore || 0.5,
    };
  }

  return {
    difficulty: Math.max(0.1, Math.min(1.0, recommended)),
    source: 'profile',
    confidence: profile.engagementScore || 0.5,
  };
}

module.exports = {
  updateConceptMastery,
  getStudentKnowledgeState,
  updateLearningProfile,
  getRecommendedDifficulty,
  detectLearningStyle,
};
