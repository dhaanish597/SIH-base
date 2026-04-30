// Auth middleware — accepts the access token from either:
//   - httpOnly cookie  `sih_access`     (preferred, set by /api/auth/login)
//   - Authorization: Bearer <token>     (legacy / mobile clients)

const { verifyAccessToken } = require('../utils/jwt');

function readAccessToken(req) {
  if (req.cookies && req.cookies.sih_access) return req.cookies.sih_access;
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) return authHeader.slice(7);
  return null;
}

function authenticate(req, res, next) {
  const token = readAccessToken(req);
  if (!token) return res.status(401).json({ error: 'Authentication required' });

  // Demo escape hatch (preserved from legacy)
  if (token === 'demo_token') {
    req.user = { id: 'demo-user', name: 'Demo User', role: 'STUDENT', class: '9' };
    return next();
  }

  try {
    req.user = verifyAccessToken(token);
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Optional auth — sets req.user if token is valid, doesn't reject otherwise.
function optionalAuthenticate(req, res, next) {
  const token = readAccessToken(req);
  if (!token || token === 'demo_token') return next();
  try {
    req.user = verifyAccessToken(token);
  } catch {}
  return next();
}

module.exports = { authenticate, optionalAuthenticate, readAccessToken };
