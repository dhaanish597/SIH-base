// Learning roadmap routes: topic progress, subject mastery, topic tree, spaced-review queue.
// EWMA mastery model: weighted combination of module scores decayed against prior mastery.

const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// ---------------------------------------------------------------------------
// EWMA mastery helpers (inlined — avoids TypeScript lib dependency)
// ---------------------------------------------------------------------------

const ALPHA = 0.3;
const WEIGHTS = { learn: 0.15, play: 0.25, practice: 0.30, quiz: 0.30 };

function computeMastery(oldMastery, scores) {
  // scores = { learnScore, playScore, practiceScore, quizScore } — any can be null
  const pairs = [];
  if (scores.learnScore !== null && scores.learnScore !== undefined) pairs.push([scores.learnScore / 100, WEIGHTS.learn]);
  if (scores.playScore !== null && scores.playScore !== undefined) pairs.push([scores.playScore / 100, WEIGHTS.play]);
  if (scores.practiceScore !== null && scores.practiceScore !== undefined) pairs.push([scores.practiceScore / 100, WEIGHTS.practice]);
  if (scores.quizScore !== null && scores.quizScore !== undefined) pairs.push([scores.quizScore / 100, WEIGHTS.quiz]);
  if (pairs.length === 0) return oldMastery;
  const totalWeight = pairs.reduce((s, [, w]) => s + w, 0);
  const combined = pairs.reduce((s, [score, w]) => s + score * (w / totalWeight), 0);
  return ALPHA * combined + (1 - ALPHA) * oldMastery;
}

function getNextReviewDate(mastery) {
  const days = mastery < 0.4 ? 1 : mastery < 0.6 ? 3 : mastery < 0.8 ? 7 : 14;
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

const XP_BY_MODULE = { learn: 10, play: 25, practice: 30, quiz: 35 };

// ---------------------------------------------------------------------------
// POST /api/learn/progress
//   body: { topicId, module ('learn'|'play'|'practice'|'quiz'), score (0-100) }
// ---------------------------------------------------------------------------
router.post('/progress', authenticate, async (req, res) => {
  try {
    const { topicId, module: mod, score } = req.body || {};
    if (!topicId || !mod) return res.status(400).json({ error: 'topicId and module are required' });
    if (!XP_BY_MODULE[mod]) return res.status(400).json({ error: 'module must be one of: learn, play, practice, quiz' });
    if (score == null || score < 0 || score > 100) return res.status(400).json({ error: 'score must be 0–100' });

    const studentId = req.user.id;
    const now = new Date();

    // Map module name to the corresponding Prisma score field
    const scoreField = `${mod}Score`;

    // Fetch existing progress (if any) — needed for EWMA and streak calculation
    const existing = await prisma.topicProgress.findUnique({
      where: { studentId_topicId: { studentId, topicId } },
    });

    const prevScores = {
      learnScore: existing?.learnScore ?? null,
      playScore: existing?.playScore ?? null,
      practiceScore: existing?.practiceScore ?? null,
      quizScore: existing?.quizScore ?? null,
    };

    // Apply the new score to the in-memory copy so computeMastery sees it
    const updatedScores = { ...prevScores, [scoreField]: score };

    const oldMastery = existing?.masteryScore ?? 0;
    const newMastery = computeMastery(oldMastery, updatedScores);
    const nextReviewAt = getNextReviewDate(newMastery);

    const progress = await prisma.topicProgress.upsert({
      where: { studentId_topicId: { studentId, topicId } },
      create: {
        studentId,
        topicId,
        [scoreField]: score,
        masteryScore: newMastery,
        attemptCount: 1,
        lastAttemptAt: now,
        nextReviewAt,
      },
      update: {
        [scoreField]: score,
        masteryScore: newMastery,
        attemptCount: { increment: 1 },
        lastAttemptAt: now,
        nextReviewAt,
      },
    });

    // Fetch current user to compute streak correctly
    const user = await prisma.user.findUnique({
      where: { id: studentId },
      select: { lastActiveDate: true, streakDays: true },
    });

    const prevLastActive = user?.lastActiveDate ? new Date(user.lastActiveDate) : null;
    let newStreakDays = user?.streakDays ?? 0;

    if (prevLastActive) {
      // Compare calendar dates (ignoring time)
      const prevDay = new Date(prevLastActive.getFullYear(), prevLastActive.getMonth(), prevLastActive.getDate());
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);

      const diffMs = today - prevDay;
      if (diffMs === 0) {
        // Same day — no change to streak
      } else if (prevDay.getTime() === yesterday.getTime()) {
        // Previous active day was yesterday — extend streak
        newStreakDays += 1;
      } else {
        // Gap > 1 day — reset streak
        newStreakDays = 1;
      }
    } else {
      // First ever activity
      newStreakDays = 1;
    }

    await prisma.user.update({
      where: { id: studentId },
      data: {
        totalPoints: { increment: XP_BY_MODULE[mod] },
        lastActiveDate: now,
        streakDays: newStreakDays,
      },
    });

    res.json(progress);
  } catch (e) {
    console.error('learn/progress error', e);
    res.status(500).json({ error: 'Failed to record topic progress' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/learn/subjects
// ---------------------------------------------------------------------------
router.get('/subjects', authenticate, async (req, res) => {
  try {
    const studentId = req.user.id;

    // Fetch all subjects
    const subjects = await prisma.subject.findMany();

    // For each subject get all topic ids (subjects → chapters → topics)
    const result = await Promise.all(
      subjects.map(async (subject) => {
        const chapters = await prisma.chapter.findMany({
          where: { subjectId: subject.id },
          select: { id: true },
        });
        const chapterIds = chapters.map((c) => c.id);

        const topics = await prisma.topic.findMany({
          where: { chapterId: { in: chapterIds } },
          select: { id: true },
        });
        const topicIds = topics.map((t) => t.id);

        let avgMastery = 0;
        if (topicIds.length > 0) {
          const progressRows = await prisma.topicProgress.findMany({
            where: { studentId, topicId: { in: topicIds } },
            select: { masteryScore: true },
          });
          if (progressRows.length > 0) {
            avgMastery =
              progressRows.reduce((s, r) => s + r.masteryScore, 0) / progressRows.length;
          }
        }

        return {
          id: subject.id,
          name: subject.name,
          iconKey: subject.iconKey ?? null,
          avgMastery,
        };
      })
    );

    res.json(result);
  } catch (e) {
    console.error('learn/subjects error', e);
    res.status(500).json({ error: 'Failed to fetch subjects' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/learn/topics/:subjectId
// ---------------------------------------------------------------------------
router.get('/topics/:subjectId', authenticate, async (req, res) => {
  try {
    const studentId = req.user.id;
    const { subjectId } = req.params;

    // 1. Fetch all chapters for the subject, ordered by orderIndex
    const chapters = await prisma.chapter.findMany({
      where: { subjectId },
      orderBy: { orderIndex: 'asc' },
    });

    const chapterIds = chapters.map((c) => c.id);

    // 2. Fetch all topics for those chapters, ordered by orderIndex
    const allTopics = await prisma.topic.findMany({
      where: { chapterId: { in: chapterIds } },
      orderBy: { orderIndex: 'asc' },
    });

    const allTopicIds = allTopics.map((t) => t.id);

    // 3. Fetch student's progress rows for all topics in this subject
    const progressRows = await prisma.topicProgress.findMany({
      where: { studentId, topicId: { in: allTopicIds } },
    });

    // 4. Fetch prerequisite definitions for topics in this subject
    const prereqRows = await prisma.topicPrerequisite.findMany({
      where: { topicId: { in: allTopicIds } },
    });

    // Build progress map: topicId → masteryScore
    const progressMap = new Map();
    for (const row of progressRows) {
      progressMap.set(row.topicId, row.masteryScore);
    }

    // Build prerequisite map: topicId → [prerequisiteId, ...]
    const prereqMap = new Map();
    for (const row of prereqRows) {
      if (!prereqMap.has(row.topicId)) prereqMap.set(row.topicId, []);
      prereqMap.get(row.topicId).push(row.prerequisiteId);
    }

    // 5. Compute locked topics using prerequisite propagation
    const lockedSet = new Set();

    // Initial pass: lock any topic whose direct prereq isn't met
    for (const topic of allTopics) {
      const prereqs = prereqMap.get(topic.id) || [];
      for (const prereqId of prereqs) {
        const mastery = progressMap.get(prereqId);
        if (mastery == null || mastery < 0.4) {
          lockedSet.add(topic.id);
          break;
        }
      }
    }

    // Propagation: if a prerequisite is itself locked, the dependent is also locked
    let changed = true;
    while (changed) {
      changed = false;
      for (const topic of allTopics) {
        if (lockedSet.has(topic.id)) continue;
        const prereqs = prereqMap.get(topic.id) || [];
        for (const prereqId of prereqs) {
          if (lockedSet.has(prereqId)) {
            lockedSet.add(topic.id);
            changed = true;
            break;
          }
        }
      }
    }

    // Build full progress lookup by topicId
    const progressByTopicId = new Map();
    for (const row of progressRows) {
      progressByTopicId.set(row.topicId, row);
    }

    // 6. Shape the response: chapters with their topics
    const topicsByChapter = new Map();
    for (const topic of allTopics) {
      if (!topicsByChapter.has(topic.chapterId)) topicsByChapter.set(topic.chapterId, []);
      topicsByChapter.get(topic.chapterId).push({
        id: topic.id,
        name: topic.name,
        orderIndex: topic.orderIndex,
        chapterId: topic.chapterId,
        progress: progressByTopicId.get(topic.id) ?? null,
        locked: lockedSet.has(topic.id),
      });
    }

    const response = chapters.map((chapter) => ({
      ...chapter,
      topics: topicsByChapter.get(chapter.id) ?? [],
    }));

    res.json(response);
  } catch (e) {
    console.error('learn/topics error', e);
    res.status(500).json({ error: 'Failed to fetch topics' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/learn/review-due
// ---------------------------------------------------------------------------
router.get('/review-due', authenticate, async (req, res) => {
  try {
    const studentId = req.user.id;
    const now = new Date();

    const dueRows = await prisma.topicProgress.findMany({
      where: {
        studentId,
        nextReviewAt: { lte: now },
        masteryScore: { lt: 0.8 },
      },
      include: {
        topic: {
          select: {
            name: true,
            chapter: {
              select: {
                name: true,
                subject: {
                  select: { name: true },
                },
              },
            },
          },
        },
      },
    });

    const result = dueRows.map((row) => ({
      topicProgressId: row.id,
      topicId: row.topicId,
      topicName: row.topic.name,
      chapterName: row.topic.chapter.name,
      subjectName: row.topic.chapter.subject.name,
      masteryScore: row.masteryScore,
      nextReviewAt: row.nextReviewAt,
      lastAttemptAt: row.lastAttemptAt,
    }));

    res.json(result);
  } catch (e) {
    console.error('learn/review-due error', e);
    res.status(500).json({ error: 'Failed to fetch review queue' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/learn/content/:topicId/:type  — serve content payload for a topic+type
// ---------------------------------------------------------------------------
router.get('/content/:topicId/:type', authenticate, async (req, res) => {
  try {
    const { topicId, type } = req.params;
    const validTypes = ['LEARN', 'PLAY', 'PRACTICE'];
    if (!validTypes.includes(type)) return res.status(400).json({ error: 'Invalid type' });
    const content = await prisma.content.findUnique({
      where: { topicId_type: { topicId, type } },
    });
    if (!content) return res.status(404).json({ error: 'Content not found' });
    res.json({ payload: content.payload });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch content' });
  }
});

module.exports = router;
