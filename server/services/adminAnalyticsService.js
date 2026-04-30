// Platform admin analytics — Prisma version. Returns the same shape as before.

const prisma = require('../lib/prisma');

async function getPlatformAnalytics() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000);

  const [
    totalUsers,
    totalStudents,
    totalTeachers,
    totalSchools,
    activeUsers,
    activeLast30,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: 'STUDENT' } }),
    prisma.user.count({ where: { role: 'TEACHER' } }),
    prisma.user.count({ where: { role: 'SCHOOL' } }),
    prisma.user.count({ where: { status: 'ACTIVE' } }),
    prisma.user.count({ where: { lastLogin: { gte: thirtyDaysAgo } } }),
  ]);

  // Completion rates
  const studentsWithProgress = await prisma.studentProgress.findMany({
    distinct: ['studentId'],
    select: { studentId: true },
  });
  const lessonsCompleted = await prisma.studentProgress.findMany({
    distinct: ['lessonId'],
    select: { lessonId: true },
  });
  const allProgress = await prisma.studentProgress.aggregate({
    _avg: { score: true },
    _count: { _all: true },
  });

  const completionRate =
    totalStudents > 0 ? (studentsWithProgress.length / totalStudents) * 100 : 0;

  // Per-school performance
  const schools = await prisma.school.findMany({
    select: {
      id: true,
      name: true,
      users: {
        where: { role: 'STUDENT' },
        select: { id: true },
      },
    },
  });

  const schoolPerformanceComparison = [];
  for (const s of schools) {
    if (s.users.length === 0) continue;
    const studentIds = s.users.map((u) => u.id);
    const [agg, distinctStudents, distinctLessons] = await Promise.all([
      prisma.studentProgress.aggregate({
        where: { studentId: { in: studentIds } },
        _avg: { score: true },
      }),
      prisma.studentProgress.findMany({
        where: { studentId: { in: studentIds } },
        distinct: ['studentId'],
        select: { studentId: true },
      }),
      prisma.studentProgress.findMany({
        where: { studentId: { in: studentIds } },
        distinct: ['lessonId'],
        select: { lessonId: true },
      }),
    ]);
    schoolPerformanceComparison.push({
      schoolName: s.name,
      studentCount: s.users.length,
      avgScore: Math.round(agg._avg.score || 0),
      completionRate: Math.round((distinctStudents.length / s.users.length) * 100),
      lessonsCompleted: distinctLessons.length,
    });
  }
  schoolPerformanceComparison.sort((a, b) => b.avgScore - a.avgScore);

  // Subject difficulty analysis
  const lessonsWithSubject = await prisma.lesson.findMany({
    select: { id: true, subject: { select: { name: true } }, difficulty: true },
  });
  const lessonMeta = new Map(
    lessonsWithSubject.map((l) => [l.id, { subject: l.subject?.name || 'General', difficulty: l.difficulty || 5 }]),
  );
  const allRows = await prisma.studentProgress.findMany({
    select: { score: true, timeSpent: true, lessonId: true, studentId: true },
  });
  const subjBucket = {};
  for (const r of allRows) {
    const meta = lessonMeta.get(r.lessonId);
    if (!meta) continue;
    const k = meta.subject;
    if (!subjBucket[k]) {
      subjBucket[k] = { score: 0, time: 0, diff: 0, count: 0, students: new Set() };
    }
    subjBucket[k].score += r.score || 0;
    subjBucket[k].time += r.timeSpent || 0;
    subjBucket[k].diff += meta.difficulty;
    subjBucket[k].count++;
    subjBucket[k].students.add(r.studentId);
  }
  const subjectDifficultyAnalysis = Object.entries(subjBucket)
    .map(([subject, v]) => {
      const avgScore = v.count > 0 ? v.score / v.count : 0;
      const avgTime = v.count > 0 ? v.time / v.count : 0;
      const avgDiff = v.count > 0 ? v.diff / v.count : 5;
      return {
        subject,
        avgScore: Math.round(avgScore),
        avgTime: Math.round(avgTime),
        avgDifficulty: Math.round((avgDiff / 10) * 100) / 100,
        difficultyScore: Math.round((1 - avgScore / 100) * 100) / 100,
        studentCount: v.students.size,
        totalAttempts: v.count,
      };
    })
    .sort((a, b) => b.avgScore - a.avgScore);

  // Platform engagement: activeLast30 / totalStudents
  const platformEngagementScore = totalStudents > 0 ? activeLast30 / totalStudents : 0;

  // Health score
  const completionScore = Math.min(100, completionRate);
  const engagementScore = Math.min(100, platformEngagementScore * 100);
  const avgSchoolScore =
    schoolPerformanceComparison.length > 0
      ? schoolPerformanceComparison.reduce((s, x) => s + x.avgScore, 0) /
        schoolPerformanceComparison.length
      : 0;
  const healthScore = Math.round(
    completionScore * 0.3 + engagementScore * 0.4 + avgSchoolScore * 0.3,
  );
  let status = 'Excellent';
  const recommendations = [];
  if (healthScore < 50) {
    status = 'Critical';
    recommendations.push('Immediate action required: Low completion rates and engagement.');
  } else if (healthScore < 70) {
    status = 'Needs Improvement';
    recommendations.push('Focus on increasing student engagement and completion rates.');
  } else if (healthScore < 85) {
    status = 'Good';
    recommendations.push('Platform is performing well. Continue monitoring and optimizing.');
  } else {
    recommendations.push('Platform is performing excellently. Maintain current strategies.');
  }
  if (completionRate < 30) recommendations.push('Consider implementing gamification or rewards to boost completion rates.');
  if (platformEngagementScore < 0.3) recommendations.push('Engagement is low. Review content quality and student onboarding.');

  return {
    userStats: {
      total: totalUsers,
      students: totalStudents,
      teachers: totalTeachers,
      schools: totalSchools,
      active: activeUsers,
      activeLast30Days: activeLast30,
    },
    completion: {
      studentsWithProgress: studentsWithProgress.length,
      uniqueLessonsCompleted: lessonsCompleted.length,
      averageScore: Math.round(allProgress._avg.score || 0),
      totalCompletions: allProgress._count._all,
      completionRate: Math.round(completionRate * 10) / 10,
    },
    schoolPerformanceComparison,
    subjectDifficultyAnalysis,
    platformEngagementScore: Math.round(platformEngagementScore * 100) / 100,
    health: {
      score: healthScore,
      status,
      recommendations,
      breakdown: {
        completionScore: Math.round(completionScore),
        engagementScore: Math.round(engagementScore),
        schoolScore: Math.round(avgSchoolScore),
      },
    },
  };
}

module.exports = { getPlatformAnalytics };
