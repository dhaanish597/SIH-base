// Platform-admin (super-admin) routes.

const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const adminAnalytics = require('../services/adminAnalyticsService');

const router = express.Router();

router.use(authenticate, requireRole('ADMIN', 'SUPERADMIN'));

// GET /api/admin/analytics
router.get('/analytics', async (req, res) => {
  try {
    const data = await adminAnalytics.getPlatformAnalytics();
    res.json(data);
  } catch (e) {
    console.error('admin analytics error', e);
    res.status(500).json({ error: e.message || 'Failed to fetch admin analytics' });
  }
});

// GET /api/admin/schools
router.get('/schools', async (req, res) => {
  const schools = await prisma.school.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { users: true } } },
  });
  res.json(schools);
});

// GET /api/admin/users?role=&schoolId=&limit=
router.get('/users', async (req, res) => {
  const role = req.query.role ? String(req.query.role).toUpperCase() : null;
  const schoolId = req.query.schoolId ? String(req.query.schoolId) : null;
  const limit = Math.min(500, Math.max(1, Number(req.query.limit) || 100));
  const users = await prisma.user.findMany({
    where: {
      ...(role ? { role } : {}),
      ...(schoolId ? { schoolId } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true, name: true, email: true, role: true, status: true,
      schoolId: true, class: true, lastLogin: true, createdAt: true,
      totalPoints: true, level: true,
    },
  });
  res.json(users);
});

// GET /api/admin/audit-logs
router.get('/audit-logs', async (req, res) => {
  const limit = Math.min(500, Math.max(1, Number(req.query.limit) || 100));
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: { actor: { select: { id: true, name: true, role: true } } },
  });
  res.json(logs);
});

// GET /api/admin/moderation-queue
router.get('/moderation-queue', async (req, res) => {
  const pending = await prisma.question.findMany({
    where: { status: 'PENDING_APPROVAL' },
    orderBy: { createdAt: 'desc' },
    include: {
      subject: true,
      chapter: true,
      createdBy: { select: { id: true, name: true, role: true, schoolId: true } },
    },
    take: 200,
  });
  res.json(pending);
});

// PATCH /api/admin/schools/:id/features
router.patch('/schools/:id/features', async (req, res) => {
  try {
    const { featureFlags } = req.body;
    const updated = await prisma.school.update({
      where: { id: req.params.id },
      data: { featureFlags }
    });
    
    await prisma.auditLog.create({
      data: {
        actorId: req.user.id,
        action: 'UPDATE',
        entityType: 'school_features',
        entityId: req.params.id,
      }
    });
    
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: 'Failed to update feature flags' });
  }
});

module.exports = router;
