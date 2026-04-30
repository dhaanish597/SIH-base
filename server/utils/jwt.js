// JWT helpers — short-lived access tokens (role-based TTL) + long-lived
// refresh tokens stored hashed in the DB.

const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'dev-access-secret-change-me';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-me';
const ACCESS_TTL_STUDENT = process.env.JWT_ACCESS_TTL_STUDENT || '30m';
const ACCESS_TTL_STAFF = process.env.JWT_ACCESS_TTL_STAFF || '2h';
const REFRESH_TTL = process.env.JWT_REFRESH_TTL || '30d';

function accessTtlFor(role) {
  return role === 'STUDENT' || role === 'student' ? ACCESS_TTL_STUDENT : ACCESS_TTL_STAFF;
}

function signAccessToken(user) {
  const payload = {
    id: user.id,
    name: user.name,
    email: user.email || null,
    role: user.role,
    schoolId: user.schoolId || null,
    class: user.class || null,
    language: user.language || 'en',
  };
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: accessTtlFor(user.role) });
}

function verifyAccessToken(token) {
  return jwt.verify(token, ACCESS_SECRET);
}

function signRefreshToken(userId) {
  // We sign the refresh token but ALSO store its hash in the DB so we can revoke.
  return jwt.sign({ sub: userId, jti: crypto.randomBytes(8).toString('hex') }, REFRESH_SECRET, {
    expiresIn: REFRESH_TTL,
  });
}

function verifyRefreshToken(token) {
  return jwt.verify(token, REFRESH_SECRET);
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function refreshExpiryDate() {
  // Convert "30d" / "12h" / "60m" / "3600s" into a Date in the future.
  const m = String(REFRESH_TTL).match(/^(\d+)([smhd])$/);
  if (!m) return new Date(Date.now() + 30 * 24 * 3600 * 1000);
  const n = Number(m[1]);
  const unit = m[2];
  const ms =
    unit === 's' ? n * 1000 :
    unit === 'm' ? n * 60 * 1000 :
    unit === 'h' ? n * 3600 * 1000 :
    n * 24 * 3600 * 1000;
  return new Date(Date.now() + ms);
}

module.exports = {
  signAccessToken,
  verifyAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
  refreshExpiryDate,
  accessTtlFor,
};
