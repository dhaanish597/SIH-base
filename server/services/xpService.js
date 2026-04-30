// XP, level, coins. Single source of truth for awarding rewards.
// All point-changing routes funnel through `awardSession()` so we don't
// drift between leaderboard, badges, and streak math.

const prisma = require('../lib/prisma');

async function getLevelForXp(xp) {
  const levels = await prisma.levelDefinition.findMany({ orderBy: { xpRequired: 'desc' } });
  for (const l of levels) {
    if (xp >= l.xpRequired) return l;
  }
  return { level: 1, title: 'Rookie', xpRequired: 0 };
}

function isSameDay(a, b) {
  if (!a || !b) return false;
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getUTCFullYear() === db.getUTCFullYear() &&
    da.getUTCMonth() === db.getUTCMonth() &&
    da.getUTCDate() === db.getUTCDate()
  );
}

function isYesterday(d, now) {
  if (!d) return false;
  const y = new Date(now);
  y.setUTCDate(y.getUTCDate() - 1);
  return isSameDay(d, y);
}

// Updates streakDays based on the current and previous active dates.
function nextStreak(currentStreak, lastActiveDate, now = new Date()) {
  if (!lastActiveDate) return 1;
  if (isSameDay(lastActiveDate, now)) return Math.max(1, currentStreak);
  if (isYesterday(lastActiveDate, now)) return currentStreak + 1;
  return 1; // streak broken
}

// Award XP / coins / points to a user and apply derived state in one txn.
//   amounts = { xp, coins, points }
//   reason = string (e.g. "quiz_complete", "match_win")
//   refId = optional ref string (gameSessionId, matchId, ...)
async function awardSession({ userId, xp = 0, coins = 0, points = 0, reason, refId = null }) {
  const now = new Date();
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    const newXp = (user.xp || 0) + Math.max(0, xp);
    const newCoins = (user.totalCoins || 0) + Math.max(0, coins);
    const newPoints = (user.totalPoints || 0) + Math.max(0, points);
    const streak = nextStreak(user.streakDays || 0, user.lastActiveDate, now);
    const longest = Math.max(user.longestStreak || 0, streak);

    const lvl = await tx.levelDefinition.findMany({
      where: { xpRequired: { lte: newXp } },
      orderBy: { xpRequired: 'desc' },
      take: 1,
    });
    const newLevel = lvl[0]?.level || 1;

    const updated = await tx.user.update({
      where: { id: userId },
      data: {
        xp: newXp,
        totalCoins: newCoins,
        totalPoints: newPoints,
        streakDays: streak,
        longestStreak: longest,
        level: newLevel,
        lastActiveDate: now,
      },
    });

    if (coins) {
      await tx.coinTransaction.create({
        data: {
          userId,
          amount: coins,
          type: coins >= 0 ? 'EARN' : 'SPEND',
          source: reason || 'unknown',
          refId,
        },
      });
    }

    return {
      user: updated,
      delta: { xp, coins, points },
      level: newLevel,
      streakDays: streak,
    };
  });
}

// Spend coins (e.g., shop purchases, hints).
async function spendCoins({ userId, amount, source, refId }) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');
    if ((user.totalCoins || 0) < amount) throw new Error('INSUFFICIENT_COINS');
    const updated = await tx.user.update({
      where: { id: userId },
      data: { totalCoins: { decrement: amount } },
    });
    await tx.coinTransaction.create({
      data: {
        userId,
        amount: -amount,
        type: 'SPEND',
        source: source || 'unknown',
        refId: refId || null,
      },
    });
    return updated;
  });
}

module.exports = {
  awardSession,
  spendCoins,
  getLevelForXp,
  nextStreak,
};
