// Platform-admin (super-admin) routes.

const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const adminAnalytics = require('../services/adminAnalyticsService');
const bcrypt = require('bcryptjs');

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

// POST /api/admin/schools  — create school + school admin account
router.post('/schools', async (req, res) => {
  try {
    const { name, email, address, city, subscriptionTier = 'FREE' } = req.body || {};
    if (!name || !email) return res.status(400).json({ error: 'name and email required' });

    // Generate schoolCode: first 3 letters of name + 3 random digits
    const prefix = name.replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 3).padEnd(3, 'X');
    const suffix = String(Math.floor(100 + Math.random() * 900));
    const schoolCode = `${prefix}${suffix}`;

    // One-time temp password for the school admin login
    const tempPassword = Math.random().toString(36).slice(-8).toUpperCase();
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const result = await prisma.$transaction(async (tx) => {
      const school = await tx.school.create({
        data: { name, email, address: address || null, city: city || null, schoolCode, subscriptionTier, isActive: true },
      });
      const admin = await tx.user.create({
        data: { name: `${name} Admin`, email, passwordHash, role: 'SCHOOL', schoolId: school.id, status: 'ACTIVE' },
      });
      await tx.auditLog.create({
        data: { actorId: req.user.id, action: 'CREATE', entityType: 'school', entityId: school.id },
      });
      return { school, admin };
    });

    res.json({
      school: { id: result.school.id, name: result.school.name, schoolCode: result.school.schoolCode },
      admin: { id: result.admin.id, email: result.admin.email, tempPassword },
    });
  } catch (e) {
    if (String(e?.code) === 'P2002') return res.status(409).json({ error: 'Email already in use' });
    console.error('admin/schools POST', e);
    res.status(500).json({ error: 'Failed to create school' });
  }
});

module.exports = router;
