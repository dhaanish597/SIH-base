// Pacing engine — Prisma version. Same external API:
//   calculateOptimalPacing(studentId, subject?)
//   shouldTakeBreak(studentId, currentSessionMinutes)
//   adjustContentPace(studentId, recentPerformance?)

const prisma = require('../lib/prisma');

async function calculateOptimalPacing(studentId, subject = null) {
  const profile = await prisma.studentLearningProfile.findUnique({ where: { studentId } });
  const velocity = profile?.averageLearningVelocity || 1.0;
  const engagement = profile?.engagementScore || 0.5;

  const baseSessionMinutes = 15;
  const sessionMinutes = baseSessionMinutes * (0.5 + engagement);
  const questionsPerSession = Math.max(5, Math.min(50, Math.round(velocity * sessionMinutes)));
  const breakFrequency = Math.round(20 + engagement * 10);

  // Optional: refine with recent session activity in this subject
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  const subjectRow = subject ? await prisma.subject.findUnique({ where: { name: subject } }) : null;
  const recent = await prisma.studentProgress.findMany({
    where: {
      studentId,
      completedAt: { gte: sevenDaysAgo },
      ...(subjectRow ? { lesson: { subjectId: subjectRow.id } } : {}),
    },
    take: 50,
  });

  const totalQuestions = recent.length;
  const totalTimeSec = recent.reduce((s, r) => s + (r.timeSpent || 0), 0);
  const avgQuestionsPerDay = totalQuestions > 0 ? totalQuestions / Math.max(1, daysSpan(recent)) : 0;

  return {
    questionsPerSession,
    breakFrequency,
    sessionDuration: Math.round(sessionMinutes),
    dailyGoal: questionsPerSession * 2,
    recommendations: {
      optimalSessionLength: `${Math.round(sessionMinutes)} minutes`,
      breakAfter: `${breakFrequency} minutes`,
      questionsPerDay: questionsPerSession * 2,
    },
    stats7d: {
      totalQuestions,
      totalTimeSec,
      avgQuestionsPerDay: Math.round(avgQuestionsPerDay * 10) / 10,
    },
  };
}

function daysSpan(rows) {
  if (!rows || rows.length === 0) return 1;
  const dates = rows
    .map((r) => new Date(r.completedAt).toISOString().slice(0, 10))
    .filter((s, i, a) => a.indexOf(s) === i);
  return dates.length || 1;
}

async function shouldTakeBreak(studentId, currentSessionMinutes) {
  const profile = await prisma.studentLearningProfile.findUnique({ where: { studentId } });
  const engagement = profile?.engagementScore || 0.5;
  const optimalDuration = 20 + engagement * 10; // 20-30 min

  const oneHourAgo = new Date(Date.now() - 3600 * 1000);
  const recent = await prisma.studentProgress.findMany({
    where: { studentId, completedAt: { gte: oneHourAgo } },
    orderBy: { completedAt: 'desc' },
    take: 5,
  });

  let performanceDeclining = false;
  if (recent.length >= 3) {
    const scores = recent.map((r) => r.score || 0);
    const firstHalf = scores.slice(0, Math.ceil(scores.length / 2));
    const secondHalf = scores.slice(Math.ceil(scores.length / 2));
    const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    if (avgSecond < avgFirst - 10) performanceDeclining = true;
  }

  const shouldBreak = currentSessionMinutes >= optimalDuration;
  let reason;
  if (shouldBreak && performanceDeclining) {
    reason = `Session duration (${Math.round(currentSessionMinutes)} min) exceeds optimal (${Math.round(optimalDuration)} min) and performance is declining.`;
  } else if (shouldBreak) {
    reason = `Session duration (${Math.round(currentSessionMinutes)} min) exceeds optimal (${Math.round(optimalDuration)} min).`;
  } else if (performanceDeclining) {
    reason = 'Performance is declining. Consider taking a short break.';
  } else {
    reason = `Current session (${Math.round(currentSessionMinutes)} min) is within optimal range.`;
  }

  return {
    shouldBreak: shouldBreak || performanceDeclining,
    currentSessionTime: Math.round(currentSessionMinutes),
    optimalDuration: Math.round(optimalDuration),
    reason,
    performanceDeclining,
  };
}

async function adjustContentPace(studentId, recentPerformance = null) {
  let recent = recentPerformance;
  if (!Array.isArray(recent)) {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);
    recent = await prisma.studentProgress.findMany({
      where: { studentId, completedAt: { gte: sevenDaysAgo } },
      orderBy: { completedAt: 'desc' },
      take: 10,
    });
  }

  if (recent.length < 3) {
    const pacing = await calculateOptimalPacing(studentId);
    return {
      ...pacing,
      adjustment: 'insufficient_data',
      message: 'Not enough recent performance data to adjust pacing.',
    };
  }

  const scores = recent.map((r) => r.score || 0);
  const firstHalf = scores.slice(0, Math.ceil(scores.length / 2));
  const secondHalf = scores.slice(Math.ceil(scores.length / 2));
  const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  const change = avgSecond - avgFirst;

  const profile = await prisma.studentLearningProfile.findUnique({ where: { studentId } });
  if (!profile) throw new Error('Student learning profile not found');

  const currentVelocity = profile.averageLearningVelocity || 1.0;
  const currentEngagement = profile.engagementScore || 0.5;

  let newVelocity = currentVelocity;
  let newEngagement = currentEngagement;
  let adjustment = 'maintained';
  let message = 'Performance is stable. Maintaining current pacing recommendations.';
  const suggestions = ['Continue with current study pace'];

  if (change > 5) {
    newVelocity = Math.min(5.0, currentVelocity * 1.1);
    adjustment = 'increased';
    message = 'Performance is improving! Increasing recommended questions per session.';
    suggestions.length = 0;
    suggestions.push('You can handle more questions per session');
    suggestions.push('Consider slightly longer study sessions');
  } else if (change < -5) {
    newVelocity = Math.max(0.5, currentVelocity * 0.9);
    newEngagement = Math.max(0.3, currentEngagement * 0.95);
    adjustment = 'decreased';
    message = 'Performance is declining. Reducing recommended questions per session and suggesting more breaks.';
    suggestions.length = 0;
    suggestions.push('Take more frequent breaks (every 15-20 minutes)');
    suggestions.push('Reduce questions per session');
    suggestions.push('Consider shorter study sessions');
  }

  await prisma.studentLearningProfile.update({
    where: { studentId },
    data: { averageLearningVelocity: newVelocity, engagementScore: newEngagement },
  });

  const pacing = await calculateOptimalPacing(studentId);
  return {
    ...pacing,
    adjustment,
    message,
    suggestions,
    previousVelocity: Math.round(currentVelocity * 10) / 10,
    newVelocity: Math.round(newVelocity * 10) / 10,
    performanceChange: Math.round(change * 10) / 10,
    averageScore: Math.round((avgFirst + avgSecond) / 2),
  };
}

module.exports = { calculateOptimalPacing, shouldTakeBreak, adjustContentPace };
