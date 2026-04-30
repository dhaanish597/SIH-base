// Role guards. Usage:
//   router.get('/admin-only', requireRole('ADMIN'), handler)
//   router.get('/staff', requireRole('TEACHER', 'SCHOOL', 'ADMIN'), handler)

function normalizeRole(role) {
  return String(role || '').toUpperCase();
}

function requireRole(...allowed) {
  const allowedSet = new Set(allowed.map(normalizeRole));
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const role = normalizeRole(req.user.role);
    if (!allowedSet.has(role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

// Forces students to only access resources scoped to their own schoolId.
// For non-students this is a no-op.
function requireOwnSchool(getResourceSchoolId) {
  return async (req, res, next) => {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      if (normalizeRole(req.user.role) === 'ADMIN' || normalizeRole(req.user.role) === 'SUPERADMIN') {
        return next();
      }
      const resourceSchoolId = await getResourceSchoolId(req);
      if (resourceSchoolId && req.user.schoolId && resourceSchoolId !== req.user.schoolId) {
        return res.status(403).json({ error: 'Cross-school access denied' });
      }
      next();
    } catch (e) {
      next(e);
    }
  };
}

module.exports = { requireRole, requireOwnSchool, normalizeRole };
