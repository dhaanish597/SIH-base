// Recommendation engine — Prisma version. Same external API:
//   getRecommendedContent(studentId, options)
//   getPersonalizedLearningPath(studentId, subject)
//   getReviewRecommendations(studentId)

const prisma = require('../lib/prisma');
const learnerModel = require('./learnerModel');

const STYLE_TO_LOWER = { VISUAL: 'visual', KINESTHETIC: 'kinesthetic', READING: 'reading', MIXED: 'mixed' };
function styleOut(s) {
  return s ? STYLE_TO_LOWER[s] || 'mixed' : 'mixed';
}

function inferModality(content, type) {
  if (type === 'quiz') return 'practice';
  const c = (content || '').toLowerCase();
  if (/\b(video|image|diagram|figure)\b/.test(c)) return 'visual';
  if (/\b(activity|interactive|practice|try|exercise)\b/.test(c)) return 'practice';
  return 'reading';
}

function styleBoost(itemModality, preferredStyle) {
  if (preferredStyle === 'mixed') return 1.0;
  if (preferredStyle === 'visual' && itemModality === 'visual') return 1.4;
  if (preferredStyle === 'reading' && itemModality === 'reading') return 1.4;
  if (preferredStyle === 'kinesthetic' && itemModality === 'practice') return 1.4;
  return 0.8;
}

async function getRecommendedContent(studentId, options = {}) {
  const { limit = 5, subject = null } = options;

  const knowledge = await learnerModel.getStudentKnowledgeState(studentId);
  const weakConcepts = knowledge.weak_concepts.map((c) => c.concept_name);
  const learningConcepts = knowledge.learning_concepts.map((c) => c.concept_name);
  const targetConcepts = new Set([...weakConcepts, ...learningConcepts]);

  const profile = await prisma.studentLearningProfile.findUnique({ where: { studentId } });
  const preferredStyle = styleOut(profile?.preferredLearningStyle);
  const optimalDifficulty = profile?.optimalDifficultyLevel ?? 0.5;
  const dMinInt = Math.max(1, Math.round((optimalDifficulty - 0.2) * 10));
  const dMaxInt = Math.min(10, Math.round((optimalDifficulty + 0.2) * 10));

  const subjectRow = subject ? await prisma.subject.findUnique({ where: { name: subject } }) : null;

  // Pull a candidate set of lessons in difficulty band, optionally filtered by subject
  const lessons = await prisma.lesson.findMany({
    where: {
      ...(subjectRow ? { subjectId: subjectRow.id } : {}),
      difficulty: { gte: dMinInt, lte: dMaxInt },
    },
    take: 50,
    orderBy: { createdAt: 'desc' },
    include: { subject: true },
  });

  // Score each lesson
  const scored = lessons.map((l) => {
    const modality = inferModality(l.content, 'lesson');
    let score = 1;
    // Concept overlap (cheap heuristic on title)
    const titleLow = (l.title || '').toLowerCase();
    let conceptHits = 0;
    for (const c of targetConcepts) {
      if (titleLow.includes(String(c).toLowerCase())) conceptHits++;
    }
    score += conceptHits * 1.2;
    score *= styleBoost(modality, preferredStyle);
    return {
      type: 'lesson',
      id: l.id,
      title: l.title,
      subject: l.subject?.name || 'General',
      chapter: null,
      reason:
        conceptHits > 0
          ? `Targets ${conceptHits} concept${conceptHits === 1 ? '' : 's'} you are still learning`
          : 'Matches your current difficulty band',
      priority_score: Number(score.toFixed(2)),
      estimatedTime: 8,
      difficulty: l.difficulty,
      lesson_id: l.id,
    };
  });

  // Also surface a few practice-style "quiz" items: pick chapters with weak coverage
  const weakChapterRecs = [];
  if (targetConcepts.size > 0) {
    const chapters = await prisma.chapter.findMany({
      where: subjectRow ? { subjectId: subjectRow.id } : {},
      take: 10,
      include: { subject: true, _count: { select: { questions: true } } },
    });
    for (const ch of chapters) {
      if (ch._count.questions <= 0) continue;
      weakChapterRecs.push({
        type: 'quiz',
        id: `chapter-${ch.id}`,
        title: `${ch.name} — practice round`,
        subject: ch.subject.name,
        chapter: ch.name,
        reason: 'Practice fresh questions in a chapter you have struggled with',
        priority_score: 1.5 * styleBoost('practice', preferredStyle),
        estimatedTime: 5,
        difficulty: Math.round(optimalDifficulty * 10),
      });
    }
  }

  return [...scored, ...weakChapterRecs]
    .sort((a, b) => b.priority_score - a.priority_score)
    .slice(0, limit);
}

async function getPersonalizedLearningPath(studentId, subject) {
  const knowledge = await learnerModel.getStudentKnowledgeState(studentId);
  const subjectRow = subject ? await prisma.subject.findUnique({ where: { name: subject } }) : null;

  // Order: weakest concept first, then learning, then progress to mastered
  const path = [];

  for (const c of knowledge.weak_concepts.slice(0, 5)) {
    path.push({
      concept: c.concept_name,
      stage: 'foundation',
      mastery: c.mastery_level,
      action: `Review the basics of ${c.concept_name}`,
    });
  }
  for (const c of knowledge.learning_concepts.slice(0, 5)) {
    path.push({
      concept: c.concept_name,
      stage: 'practice',
      mastery: c.mastery_level,
      action: `Practice ${c.concept_name} questions`,
    });
  }

  // Add a "next step" — pick chapters in subject the student hasn't progressed in
  if (subjectRow) {
    const chapters = await prisma.chapter.findMany({
      where: { subjectId: subjectRow.id },
      orderBy: { orderIndex: 'asc' },
      take: 3,
    });
    for (const ch of chapters) {
      path.push({
        concept: ch.name,
        stage: 'next',
        mastery: 0,
        action: `Try a fresh chapter: ${ch.name}`,
      });
    }
  }

  return { studentId, subject: subject || 'all', steps: path };
}

async function getReviewRecommendations(studentId) {
  // Concepts not practiced in last 7 days but mastered are good "recall" drills
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  const stale = await prisma.conceptMastery.findMany({
    where: {
      studentId,
      OR: [{ lastPracticed: null }, { lastPracticed: { lt: sevenDaysAgo } }],
    },
    orderBy: { masteryLevel: 'desc' },
    take: 10,
  });
  return stale.map((c) => ({
    concept: c.conceptName,
    masteryLevel: c.masteryLevel,
    lastPracticed: c.lastPracticed,
    reason: c.lastPracticed ? 'Not practiced in 7+ days — quick refresh recommended' : 'Never reviewed — start with a quick check',
  }));
}

module.exports = {
  getRecommendedContent,
  getPersonalizedLearningPath,
  getReviewRecommendations,
};
