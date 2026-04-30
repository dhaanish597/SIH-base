// Teacher analytics — Prisma version. Same exported API as before:
//   getClassAnalytics(teacherId)
//   getStudentDetailedAnalytics(teacherId, studentId)
//   getPerformanceDistribution(teacherId)
//   getRecentActivity(teacherId, limit?)

const prisma = require('../lib/prisma');

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function startOfWeekUtc(d = new Date()) {
  const x = startOfDay(d);
  x.setDate(x.getDate() - x.getDay());
  return x;
}

async function getStudentsInScope(teacher) {
  // Teacher scope: same school + (if `classesHandled` non-empty, restrict by class)
  const where = { role: 'STUDENT', status: 'ACTIVE' };
  if (teacher.schoolId) where.schoolId = teacher.schoolId;
  if (teacher.classesHandled && teacher.classesHandled.length > 0) {
    where.class = { in: teacher.classesHandled };
  }
  return prisma.user.findMany({
    where,
    select: { id: true, name: true, class: true, email: true },
  });
}

async function getClassAnalytics(teacherId) {
  const teacher = await prisma.user.findUnique({ where: { id: teacherId } });
  if (!teacher || teacher.role !== 'TEACHER') throw new Error('Teacher not found');

  const students = await getStudentsInScope(teacher);
  if (students.length === 0) {
    return {
      totalStudents: 0,
      activeToday: 0,
      averageCompletion: 0,
      averageScore: 0,
      atRiskStudents: [],
      topPerformers: [],
      strugglingStudents: [],
      subjectPerformance: {},
      weeklyEngagement: [],
    };
  }
  const studentIds = students.map((s) => s.id);

  // Active today: any session/progress today
  const today = startOfDay();
  const activeIds = await prisma.studentProgress.findMany({
    where: { studentId: { in: studentIds }, completedAt: { gte: today } },
    distinct: ['studentId'],
    select: { studentId: true },
  });
  const activeTodayCount = activeIds.length;

  // Per-student stats
  const grouped = await prisma.studentProgress.groupBy({
    by: ['studentId'],
    where: { studentId: { in: studentIds } },
    _avg: { score: true },
    _count: { _all: true, lessonId: true },
  });
  const statsByStudent = new Map(
    grouped.map((g) => [g.studentId, {
      avgScore: g._avg.score || 0,
      lessonsCompleted: g._count.lessonId || 0,
    }]),
  );

  const totalLessons = grouped.reduce((s, g) => s + (g._count.lessonId || 0), 0);
  const averageCompletion = grouped.length > 0 ? totalLessons / grouped.length : 0;
  const averageScore =
    grouped.length > 0
      ? grouped.reduce((s, g) => s + (g._avg.score || 0), 0) / grouped.length
      : 0;

  // Mastery snapshot per student
  const masteryRows = await prisma.conceptMastery.groupBy({
    by: ['studentId'],
    where: { studentId: { in: studentIds } },
    _avg: { masteryLevel: true },
  });
  const masteryByStudent = new Map(
    masteryRows.map((m) => [m.studentId, m._avg.masteryLevel || 0]),
  );

  // Engagement snapshot
  const profiles = await prisma.studentLearningProfile.findMany({
    where: { studentId: { in: studentIds } },
    select: { studentId: true, engagementScore: true },
  });
  const engagementByStudent = new Map(profiles.map((p) => [p.studentId, p.engagementScore || 0]));

  // Build top / struggling / at-risk lists
  const enriched = students.map((s) => ({
    id: s.id,
    name: s.name,
    class: s.class || '',
    mastery: masteryByStudent.get(s.id) || 0,
    engagement: engagementByStudent.get(s.id) || 0,
    avgScore: statsByStudent.get(s.id)?.avgScore || 0,
  }));
  const topPerformers = [...enriched]
    .sort((a, b) => b.mastery - a.mastery)
    .slice(0, 5)
    .map(({ id, name, class: c, mastery }) => ({ id, name, class: c, mastery }));
  const strugglingStudents = [...enriched]
    .filter((e) => e.mastery < 0.4)
    .sort((a, b) => a.mastery - b.mastery)
    .slice(0, 5)
    .map(({ id, name, class: c, mastery }) => ({ id, name, class: c, mastery }));
  const atRiskStudents = [...enriched]
    .filter((e) => e.engagement < 0.4 || e.mastery < 0.5)
    .slice(0, 10);

  // Subject performance — average score per subject
  const subjectAgg = await prisma.studentProgress.findMany({
    where: { studentId: { in: studentIds } },
    select: { score: true, lesson: { select: { subject: { select: { name: true } } } } },
  });
  const subjectMap = {};
  for (const r of subjectAgg) {
    const subj = r.lesson?.subject?.name || 'General';
    if (!subjectMap[subj]) subjectMap[subj] = { total: 0, count: 0 };
    subjectMap[subj].total += r.score || 0;
    subjectMap[subj].count++;
  }
  const subjectPerformance = {};
  for (const [k, v] of Object.entries(subjectMap)) {
    subjectPerformance[k] = v.count > 0 ? Math.round(v.total / v.count) : 0;
  }

  // Weekly engagement (last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  const weekly = await prisma.studentProgress.findMany({
    where: { studentId: { in: studentIds }, completedAt: { gte: sevenDaysAgo } },
    select: { studentId: true, completedAt: true },
  });
  const dayBuckets = {};
  for (const r of weekly) {
    const dayKey = new Date(r.completedAt).toISOString().slice(0, 10);
    if (!dayBuckets[dayKey]) dayBuckets[dayKey] = { day: dayKey, students: new Set(), total: 0 };
    dayBuckets[dayKey].students.add(r.studentId);
    dayBuckets[dayKey].total++;
  }
  const weeklyEngagement = Object.values(dayBuckets)
    .sort((a, b) => a.day.localeCompare(b.day))
    .map((d) => ({
      day: d.day,
      activeCount: d.students.size,
      totalActivities: d.total,
      engagement: students.length > 0 ? d.students.size / students.length : 0,
    }));

  return {
    totalStudents: students.length,
    activeToday: activeTodayCount,
    averageCompletion: Math.round(averageCompletion * 10) / 10,
    averageScore: Math.round(averageScore * 10) / 10,
    atRiskStudents,
    topPerformers,
    strugglingStudents,
    subjectPerformance,
    weeklyEngagement,
  };
}

async function getStudentDetailedAnalytics(teacherId, studentId) {
  const teacher = await prisma.user.findUnique({ where: { id: teacherId } });
  if (!teacher) throw new Error('Teacher not found');
  const student = await prisma.user.findUnique({ where: { id: studentId } });
  if (!student) throw new Error('Student not found');
  if (teacher.schoolId && student.schoolId !== teacher.schoolId) {
    throw new Error('Student not in your school');
  }

  const [progress, mastery, profile, badges, recentSessions] = await Promise.all([
    prisma.studentProgress.findMany({
      where: { studentId },
      include: { lesson: { include: { subject: true } } },
      orderBy: { completedAt: 'desc' },
      take: 50,
    }),
    prisma.conceptMastery.findMany({
      where: { studentId },
      orderBy: { masteryLevel: 'desc' },
    }),
    prisma.studentLearningProfile.findUnique({ where: { studentId } }),
    prisma.userBadge.findMany({
      where: { userId: studentId },
      include: { badge: true },
      orderBy: { earnedAt: 'desc' },
    }),
    prisma.gameSession.findMany({
      where: { studentId },
      orderBy: { startedAt: 'desc' },
      take: 20,
    }),
  ]);

  const totalAttempts = progress.length;
  const avgScore =
    totalAttempts > 0 ? progress.reduce((s, p) => s + (p.score || 0), 0) / totalAttempts : 0;
  const totalTime = progress.reduce((s, p) => s + (p.timeSpent || 0), 0);

  return {
    student: {
      id: student.id,
      name: student.name,
      email: student.email,
      class: student.class,
      schoolId: student.schoolId,
      totalPoints: student.totalPoints,
      level: student.level,
      streakDays: student.streakDays,
    },
    summary: {
      totalAttempts,
      averageScore: Math.round(avgScore * 10) / 10,
      totalTimeSec: totalTime,
      lessonsCompleted: progress.length,
    },
    progress: progress.map((p) => ({
      lessonId: p.lessonId,
      lessonTitle: p.lesson?.title || '',
      subject: p.lesson?.subject?.name || 'General',
      score: p.score,
      timeSpent: p.timeSpent,
      attempts: p.attempts,
      completedAt: p.completedAt,
    })),
    mastery: mastery.map((m) => ({
      concept: m.conceptName,
      mastery: m.masteryLevel,
      confidence: m.confidenceScore,
      lastPracticed: m.lastPracticed,
    })),
    profile,
    badges: badges.map((b) => ({
      key: b.badge.key,
      name: b.badge.name,
      earnedAt: b.earnedAt,
    })),
    recentGameSessions: recentSessions,
  };
}

async function getPerformanceDistribution(teacherId) {
  const teacher = await prisma.user.findUnique({ where: { id: teacherId } });
  if (!teacher) throw new Error('Teacher not found');
  const students = await getStudentsInScope(teacher);
  if (students.length === 0) return [];
  const ids = students.map((s) => s.id);

  const grouped = await prisma.studentProgress.groupBy({
    by: ['studentId'],
    where: { studentId: { in: ids } },
    _avg: { score: true },
  });
  const buckets = [
    { range: '0-39', count: 0 },
    { range: '40-59', count: 0 },
    { range: '60-79', count: 0 },
    { range: '80-100', count: 0 },
  ];
  for (const g of grouped) {
    const s = g._avg.score || 0;
    if (s < 40) buckets[0].count++;
    else if (s < 60) buckets[1].count++;
    else if (s < 80) buckets[2].count++;
    else buckets[3].count++;
  }
  return buckets;
}

async function getRecentActivity(teacherId, limit = 10) {
  const teacher = await prisma.user.findUnique({ where: { id: teacherId } });
  if (!teacher) throw new Error('Teacher not found');
  const students = await getStudentsInScope(teacher);
  if (students.length === 0) return [];
  const ids = students.map((s) => s.id);
  const idToName = new Map(students.map((s) => [s.id, { name: s.name, class: s.class || '' }]));

  const rows = await prisma.studentProgress.findMany({
    where: { studentId: { in: ids } },
    orderBy: { completedAt: 'desc' },
    take: limit,
    include: { lesson: { include: { subject: true } } },
  });
  return rows.map((r) => {
    const meta = idToName.get(r.studentId) || { name: 'Unknown', class: '' };
    return {
      id: r.id,
      studentId: r.studentId,
      studentName: meta.name,
      class: meta.class,
      lessonId: r.lessonId,
      lessonTitle: r.lesson?.title || '',
      subject: r.lesson?.subject?.name || 'General',
      score: r.score,
      timeSpent: r.timeSpent,
      completedAt: r.completedAt,
      activityType: 'lesson',
    };
  });
}

module.exports = {
  getClassAnalytics,
  getStudentDetailedAnalytics,
  getPerformanceDistribution,
  getRecentActivity,
};
