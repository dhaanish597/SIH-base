const express = require('express');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const analyticsService = require('../services/analyticsService');
const prisma = require('../lib/prisma');

const router = express.Router();

// GET /api/analytics/:teacherId
router.get('/:teacherId', authenticate, requireRole('TEACHER', 'SCHOOL', 'ADMIN', 'SUPERADMIN'), async (req, res) => {
  try {
    const teacherId = req.params.teacherId;
    // Non-admins can only access their own analytics
    if (
      req.user.role === 'TEACHER' &&
      req.user.id !== teacherId
    ) return res.status(403).json({ error: 'Forbidden' });
    const data = await analyticsService.getClassAnalytics(teacherId);
    res.json(data);
  } catch (e) {
    console.error('analytics error', e);
    res.status(500).json({ error: e.message || 'Failed to fetch analytics' });
  }
});

// GET /api/analytics/student/:studentId
router.get('/student/:studentId', authenticate, requireRole('TEACHER', 'SCHOOL', 'ADMIN', 'SUPERADMIN'), async (req, res) => {
  try {
    const data = await analyticsService.getStudentDetailedAnalytics(req.user.id, req.params.studentId);
    res.json(data);
  } catch (e) {
    console.error('analytics/student error', e);
    res.status(500).json({ error: e.message || 'Failed to fetch student analytics' });
  }
});

// GET /api/analytics/performance-distribution
router.get('/performance-distribution', authenticate, requireRole('TEACHER', 'SCHOOL', 'ADMIN', 'SUPERADMIN'), async (req, res) => {
  try {
    const data = await analyticsService.getPerformanceDistribution(req.user.id);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch distribution' });
  }
});

// GET /api/analytics/recent-activity
router.get('/recent-activity', authenticate, requireRole('TEACHER', 'SCHOOL', 'ADMIN', 'SUPERADMIN'), async (req, res) => {
  try {
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
    const data = await analyticsService.getRecentActivity(req.user.id, limit);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch recent activity' });
  }
});

// GET /api/analytics/school  — school admin: overview stats
router.get('/school', authenticate, requireRole('SCHOOL', 'ADMIN', 'SUPERADMIN'), async (req, res) => {
  try {
    const schoolId = req.user.schoolId;
    if (!schoolId) return res.status(400).json({ error: 'No school scope' });

    const [totalStudents, recentSessions, subjectProgress] = await Promise.all([
      prisma.user.count({ where: { schoolId, role: 'STUDENT', status: 'ACTIVE' } }),
      prisma.studentProgress.findMany({
        where: {
          student: { schoolId },
          completedAt: { gte: new Date(Date.now() - 86400000) },
        },
        select: { studentId: true, score: true, subjectName: true },
      }),
      prisma.studentProgress.groupBy({
        by: ['subjectName'],
        where: { student: { schoolId }, subjectName: { not: null } },
        _avg: { score: true },
        _count: { id: true },
      }),
    ]);

    const activeToday = new Set(recentSessions.map((s) => s.studentId)).size;

    const topSubjects = subjectProgress
      .filter((s) => s.subjectName && s._avg.score !== null)
      .map((s) => ({
        subject: s.subjectName,
        avgScore: Math.round(s._avg.score * 100) / 100,
      }))
      .sort((a, b) => b.avgScore - a.avgScore)
      .slice(0, 6);

    const allScores = recentSessions.map((s) => s.score).filter((s) => s !== null);
    const averageScore = allScores.length > 0
      ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
      : 0;

    res.json({
      totalStudents,
      activeToday,
      averageCompletion: Math.round((activeToday / Math.max(totalStudents, 1)) * 100),
      averageScore,
      topSubjects,
      atRiskStudents: [],
    });
  } catch (e) {
    console.error('analytics/school', e);
    res.status(500).json({ error: 'Failed to fetch school analytics' });
  }
});

module.exports = router;
