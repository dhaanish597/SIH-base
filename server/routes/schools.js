// School-admin routes: manage students/teachers in their school, CSV bulk
// import (placeholder), curriculum mapping.

const express = require('express');
const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');

const router = express.Router();

router.use(authenticate, requireRole('SCHOOL', 'ADMIN', 'SUPERADMIN'));

function callerSchoolId(req) {
  if (req.user.role === 'ADMIN' || req.user.role === 'SUPERADMIN') {
    return req.query.schoolId || req.body?.schoolId || req.user.schoolId;
  }
  return req.user.schoolId;
}

// GET /api/schools/me  - school details for the logged-in school admin
router.get('/me', async (req, res) => {
  try {
    const schoolId = callerSchoolId(req);
    if (!schoolId) return res.status(400).json({ error: 'No school scope' });
    const s = await prisma.school.findUnique({ where: { id: schoolId } });
    res.json(s);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch school' });
  }
});

// GET /api/schools/:id/students
router.get('/:id/students', async (req, res) => {
  try {
    const schoolId = req.params.id;
    if (req.user.role === 'SCHOOL' && schoolId !== req.user.schoolId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const students = await prisma.user.findMany({
      where: { schoolId, role: 'STUDENT' },
      orderBy: [{ class: 'asc' }, { name: 'asc' }],
      select: {
        id: true, name: true, email: true, studentId: true, class: true,
        rollNumber: true, status: true, totalPoints: true, level: true,
        lastLogin: true, createdAt: true,
      },
    });
    res.json(students);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// POST /api/schools/:id/students  - create one student
router.post('/:id/students', async (req, res) => {
  try {
    const schoolId = req.params.id;
    if (req.user.role === 'SCHOOL' && schoolId !== req.user.schoolId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const { name, email, studentId, pin, class: klass, rollNumber } = req.body || {};
    if (!name || !pin || !studentId) {
      return res.status(400).json({ error: 'name, studentId, pin required' });
    }
    const pinHash = await bcrypt.hash(String(pin), 10);
    const created = await prisma.user.create({
      data: {
        name,
        email: email || null,
        studentId,
        pinHash,
        role: 'STUDENT',
        schoolId,
        class: klass || null,
        rollNumber: rollNumber || null,
        status: 'ACTIVE',
      },
    });
    await prisma.auditLog.create({
      data: {
        schoolId,
        actorId: req.user.id,
        action: 'CREATE',
        entityType: 'user',
        entityId: created.id,
      },
    });
    res.json({ id: created.id, name: created.name, studentId: created.studentId });
  } catch (e) {
    if (String(e?.code) === 'P2002') return res.status(409).json({ error: 'studentId or email already exists' });
    console.error('create student', e);
    res.status(500).json({ error: 'Failed to create student' });
  }
});

// POST /api/schools/:id/students/bulk  - CSV-style array import
//   body: { rows: [{ name, studentId, pin, class?, rollNumber?, email? }, ...] }
router.post('/:id/students/bulk', async (req, res) => {
  try {
    const schoolId = req.params.id;
    if (req.user.role === 'SCHOOL' && schoolId !== req.user.schoolId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];
    if (rows.length === 0) return res.status(400).json({ error: 'rows required' });

    const results = { created: 0, skipped: 0, errors: [] };
    for (const r of rows) {
      try {
        if (!r.name || !r.studentId || !r.pin) {
          results.skipped++;
          results.errors.push({ studentId: r.studentId, error: 'missing required field' });
          continue;
        }
        const pinHash = await bcrypt.hash(String(r.pin), 10);
        await prisma.user.create({
          data: {
            name: r.name,
            email: r.email || null,
            studentId: r.studentId,
            pinHash,
            role: 'STUDENT',
            schoolId,
            class: r.class || null,
            rollNumber: r.rollNumber || null,
            status: 'ACTIVE',
          },
        });
        results.created++;
      } catch (e) {
        results.errors.push({ studentId: r.studentId, error: String(e.message || e) });
      }
    }
    await prisma.auditLog.create({
      data: {
        schoolId,
        actorId: req.user.id,
        action: 'IMPORT',
        entityType: 'user',
        metadata: results,
      },
    });
    res.json(results);
  } catch (e) {
    res.status(500).json({ error: 'Bulk import failed' });
  }
});

// GET /api/schools/:id/teachers
router.get('/:id/teachers', async (req, res) => {
  try {
    const schoolId = req.params.id;
    if (req.user.role === 'SCHOOL' && schoolId !== req.user.schoolId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const teachers = await prisma.user.findMany({
      where: { schoolId, role: 'TEACHER' },
      select: {
        id: true, name: true, email: true, status: true, department: true,
        subjectsTaught: true, classesHandled: true, lastLogin: true,
      },
    });
    res.json(teachers);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch teachers' });
  }
});

// POST /api/schools/:id/teachers  — create a teacher account
router.post('/:id/teachers', async (req, res) => {
  try {
    const schoolId = req.params.id;
    if (req.user.role === 'SCHOOL' && schoolId !== req.user.schoolId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const { name, email, department, subjectsTaught } = req.body || {};
    if (!name || !email) return res.status(400).json({ error: 'name and email required' });

    const { randomBytes } = require('crypto');
    const tempPassword = randomBytes(6).toString('base64url').toUpperCase();
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const teacher = await prisma.user.create({
      data: {
        name, email, passwordHash,
        role: 'TEACHER', schoolId, status: 'ACTIVE',
        department: department || null,
        subjectsTaught: Array.isArray(subjectsTaught) ? subjectsTaught : [],
      },
    });
    await prisma.auditLog.create({
      data: { schoolId, actorId: req.user.id, action: 'CREATE', entityType: 'user', entityId: teacher.id },
    });
    res.json({ id: teacher.id, name: teacher.name, email: teacher.email, tempPassword });
  } catch (e) {
    if (String(e?.code) === 'P2002') return res.status(409).json({ error: 'Email already in use' });
    console.error('schools/:id/teachers POST', e);
    res.status(500).json({ error: 'Failed to create teacher' });
  }
});

// GET /api/schools/:id/classes
router.get('/:id/classes', async (req, res) => {
  try {
    const schoolId = req.params.id;
    if (req.user.role === 'SCHOOL' && schoolId !== req.user.schoolId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const classes = await prisma.class.findMany({
      where: { schoolId },
      include: {
        teacher: { select: { id: true, name: true } },
        _count: { select: { enrollments: true } },
      },
      orderBy: [{ gradeLevel: 'asc' }, { name: 'asc' }],
    });
    res.json(classes);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch classes' });
  }
});

// POST /api/schools/:id/classes  — create a class
router.post('/:id/classes', async (req, res) => {
  try {
    const schoolId = req.params.id;
    if (req.user.role === 'SCHOOL' && schoolId !== req.user.schoolId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const { name, gradeLevel, section, teacherId } = req.body || {};
    if (!name || !gradeLevel) return res.status(400).json({ error: 'name and gradeLevel required' });

    const cls = await prisma.class.create({
      data: {
        name,
        gradeLevel: Number(gradeLevel),
        section: section || null,
        teacherId: teacherId || null,
        schoolId,
      },
      include: { teacher: { select: { id: true, name: true } } },
    });
    res.json({ id: cls.id, name: cls.name, gradeLevel: cls.gradeLevel, section: cls.section, teacher: cls.teacher });
  } catch (e) {
    console.error('schools/:id/classes POST', e);
    res.status(500).json({ error: 'Failed to create class' });
  }
});

// PATCH /api/schools/settings  - update school info
router.patch('/settings', async (req, res) => {
  try {
    const schoolId = callerSchoolId(req);
    if (!schoolId) return res.status(400).json({ error: 'No school scope' });
    const { name, email, phone, address } = req.body || {};
    const updated = await prisma.school.update({
      where: { id: schoolId },
      data: {
        ...(name    && { name }),
        ...(email   && { email }),
        ...(phone   && { phone }),
        ...(address && { address }),
      },
    });
    res.json({ id: updated.id, name: updated.name });
  } catch (e) {
    console.error('schools/settings PATCH', e);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// GET /api/schools/events  - list events for caller's school
router.get('/events', async (req, res) => {
  try {
    const schoolId = callerSchoolId(req);
    if (!schoolId) return res.status(400).json({ error: 'No school scope' });
    const events = await prisma.event.findMany({
      where: { schoolId },
      orderBy: { eventDate: 'asc' },
      select: { id: true, title: true, description: true, eventDate: true },
    });
    res.json(events);
  } catch (e) {
    console.error('schools/events GET', e);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// POST /api/schools/events  - create a school event
router.post('/events', async (req, res) => {
  try {
    const schoolId = callerSchoolId(req);
    if (!schoolId) return res.status(400).json({ error: 'No school scope' });
    const { title, description, eventDate } = req.body || {};
    if (!title || !eventDate) return res.status(400).json({ error: 'title and eventDate required' });
    const ev = await prisma.event.create({
      data: { schoolId, title, description: description || null, eventDate: new Date(eventDate) },
    });
    res.json(ev);
  } catch (e) {
    console.error('schools/events POST', e);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// DELETE /api/schools/events/:id
router.delete('/events/:id', async (req, res) => {
  try {
    const schoolId = callerSchoolId(req);
    const ev = await prisma.event.findUnique({ where: { id: req.params.id } });
    if (!ev || ev.schoolId !== schoolId) return res.status(403).json({ error: 'Forbidden' });
    await prisma.event.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) {
    console.error('schools/events DELETE', e);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

module.exports = router;
