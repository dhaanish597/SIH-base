// Experimentation — Prisma version. Same external API:
//   getStudentStrategy(studentId) -> 'mastery_based' | 'sequence_based' | 'engagement_based'
//   trackOutcomes(studentId, { learningGains, engagement, completion })
//   getExperimentStats()

const prisma = require('../lib/prisma');

const STRATEGIES = ['MASTERY_BASED', 'SEQUENCE_BASED', 'ENGAGEMENT_BASED'];
const STRATEGY_OUT = {
  MASTERY_BASED: 'mastery_based',
  SEQUENCE_BASED: 'sequence_based',
  ENGAGEMENT_BASED: 'engagement_based',
};
const STRATEGY_IN = {
  mastery_based: 'MASTERY_BASED',
  sequence_based: 'SEQUENCE_BASED',
  engagement_based: 'ENGAGEMENT_BASED',
};

function simpleHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

async function getStudentStrategy(studentId) {
  const existing = await prisma.experiment.findUnique({ where: { studentId } });
  if (existing) return STRATEGY_OUT[existing.strategy];

  const idx = simpleHash(studentId) % STRATEGIES.length;
  const strategy = STRATEGIES[idx];

  try {
    await prisma.experiment.create({ data: { studentId, strategy } });
  } catch {
    // Race-condition fallback: update
    await prisma.experiment.update({ where: { studentId }, data: { strategy } });
  }
  return STRATEGY_OUT[strategy];
}

async function trackOutcomes(studentId, outcomes) {
  const { learningGains, engagement, completion } = outcomes || {};
  const existing = await prisma.experiment.findUnique({ where: { studentId } });

  if (!existing) {
    const idx = simpleHash(studentId) % STRATEGIES.length;
    const strategy = STRATEGIES[idx];
    return prisma.experiment.create({
      data: {
        studentId,
        strategy,
        learningGains: learningGains ?? null,
        engagementScore: engagement ?? null,
        completionRate: completion ?? null,
      },
    });
  }

  // Blend: 70% old, 30% new
  const blend = (oldVal, newVal) => {
    if (newVal == null) return oldVal;
    if (oldVal == null) return newVal;
    return oldVal * 0.7 + newVal * 0.3;
  };

  return prisma.experiment.update({
    where: { studentId },
    data: {
      learningGains: blend(existing.learningGains, learningGains),
      engagementScore: blend(existing.engagementScore, engagement),
      completionRate: blend(existing.completionRate, completion),
    },
  });
}

async function getExperimentStats() {
  const grouped = await prisma.experiment.groupBy({
    by: ['strategy'],
    _count: { _all: true },
    _avg: { learningGains: true, engagementScore: true, completionRate: true },
  });
  return STRATEGIES.map((s) => {
    const row = grouped.find((g) => g.strategy === s);
    return {
      strategy: STRATEGY_OUT[s],
      studentCount: row?._count._all || 0,
      avgLearningGains: row?._avg.learningGains ? Math.round(row._avg.learningGains * 100) / 100 : 0,
      avgEngagement: row?._avg.engagementScore ? Math.round(row._avg.engagementScore * 100) / 100 : 0,
      avgCompletion: row?._avg.completionRate ? Math.round(row._avg.completionRate * 100) / 100 : 0,
    };
  });
}

module.exports = { getStudentStrategy, trackOutcomes, getExperimentStats, STRATEGY_IN, STRATEGY_OUT };
