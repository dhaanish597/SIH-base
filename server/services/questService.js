// Quest progression engine. Listens for "events" emitted from gameplay
// (correct answer, win match, escape stars) and increments matching
// active quests; pays out rewards when goals are met.

const prisma = require('../lib/prisma');
const { awardSession } = require('./xpService');

// Matches a fired event against a quest's goal payload.
function matchesGoal(goal, event) {
  if (!goal || !event || goal.kind !== event.kind) return false;
  if (goal.game && goal.game !== event.game) return false;
  if (goal.subject && goal.subject !== event.subject) return false;
  if (goal.stars && (event.stars || 0) < goal.stars) return false;
  return true;
}

// Ensure a daily/weekly quest has an ACTIVE UserQuestProgress row for the user.
async function ensureUserQuestProgress(userId, questId, goalCount) {
  return prisma.userQuestProgress.upsert({
    where: { userId_questId: { userId, questId } },
    update: {},
    create: {
      userId,
      questId,
      goalCount,
      progress: 0,
      status: 'ACTIVE',
    },
  });
}

// Public: emit a gameplay event. Increments matching quests for this user.
//   event = { kind: 'win_match' | 'correct_answers' | 'play_game' | 'escape_stars',
//             game?: GameType, subject?: string, stars?: number, count?: number }
async function fireEvent({ userId, event }) {
  if (!userId || !event || !event.kind) return [];

  const inc = Math.max(1, Number(event.count || 1));
  const now = new Date();

  // Active quests that match the event kind (cheap pre-filter, then exact match)
  const candidates = await prisma.quest.findMany({
    where: {
      isActive: true,
      OR: [{ endsAt: null }, { endsAt: { gte: now } }],
    },
  });

  const completedRewards = [];
  for (const q of candidates) {
    if (!matchesGoal(q.goal, event)) continue;
    const goalCount = Number(q.goal?.count || 1);

    const progressRow = await ensureUserQuestProgress(userId, q.id, goalCount);
    if (progressRow.status !== 'ACTIVE') continue;

    const newProgress = progressRow.progress + inc;
    const reachedGoal = newProgress >= goalCount;

    await prisma.userQuestProgress.update({
      where: { userId_questId: { userId, questId: q.id } },
      data: {
        progress: Math.min(goalCount, newProgress),
        status: reachedGoal ? 'COMPLETED' : 'ACTIVE',
        completedAt: reachedGoal ? now : null,
      },
    });

    if (reachedGoal) {
      // Pay out
      if ((q.rewardXp || 0) > 0 || (q.rewardCoins || 0) > 0) {
        await awardSession({
          userId,
          xp: q.rewardXp || 0,
          coins: q.rewardCoins || 0,
          points: q.rewardXp || 0,
          reason: `quest:${q.key}`,
          refId: q.id,
        });
      }
      completedRewards.push({
        questKey: q.key,
        title: q.title,
        rewardXp: q.rewardXp,
        rewardCoins: q.rewardCoins,
      });
    }
  }
  return completedRewards;
}

// Returns all of a user's active + recently-completed quests for dashboard.
async function getUserQuests(userId) {
  const active = await prisma.userQuestProgress.findMany({
    where: { userId, status: { in: ['ACTIVE', 'COMPLETED'] } },
    orderBy: { startedAt: 'desc' },
    include: { quest: true },
    take: 50,
  });
  return active.map((p) => ({
    id: p.id,
    questKey: p.quest.key,
    title: p.quest.title,
    description: p.quest.description,
    type: p.quest.type,
    progress: p.progress,
    goalCount: p.goalCount,
    status: p.status,
    rewardXp: p.quest.rewardXp,
    rewardCoins: p.quest.rewardCoins,
    completedAt: p.completedAt,
  }));
}

module.exports = { fireEvent, getUserQuests, matchesGoal };
