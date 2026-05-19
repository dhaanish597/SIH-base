// SIH platform — Express bootstrap.
// Replaces the 3,441-line legacy monolith (saved as index.legacy.js).
// All routes are split under server/routes/*.js and use Prisma against Postgres.

require('dotenv').config();

const path = require('path');
const fs = require('fs');
const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const http = require('http');
const { Server: SocketIoServer } = require('socket.io');
const rateLimit = require('express-rate-limit');

const prisma = require('./lib/prisma');
const { verifyAccessToken } = require('./utils/jwt');

const app = express();
const PORT = Number(process.env.PORT || 3001);
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

// -------------------------- Middleware --------------------------------------
app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(
  cors({
    origin: (origin, cb) => cb(null, true), // dev-friendly; tighten in prod
    credentials: true,
  }),
);
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    limit: 600, // generous global ceiling; per-route limits can be added
    standardHeaders: 'draft-7',
    legacyHeaders: false,
  }),
);

// -------------------------- Routers -----------------------------------------
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/leaderboard', require('./routes/leaderboard'));
app.use('/api/badges', require('./routes/badges'));
app.use('/api/quests', require('./routes/quests'));
app.use('/api/coins', require('./routes/coins'));
app.use('/api/shop', require('./routes/shop'));
app.use('/api/games', require('./routes/games'));
app.use('/api/chatbot', require('./routes/chatbot'));
app.use('/api/questions', require('./routes/questions'));
app.use('/api/learner', require('./routes/learner'));
app.use('/api/recommendations', require('./routes/recommendations'));
app.use('/api/feedback', require('./routes/feedback'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/pacing', require('./routes/pacing'));
app.use('/api/experiments', require('./routes/experiments'));
app.use('/api/progress', require('./routes/progress'));
app.use('/api/lessons', require('./routes/lessons'));
app.use('/api/schools', require('./routes/schools'));
app.use('/api/homework', require('./routes/homework'));
app.use('/api/assignments', require('./routes/assignments'));
app.use('/api/classes', require('./routes/classes'));
app.use('/api/learn', require('./routes/learn'));

// Legacy compat: mount /api/quizzes/:lessonId on lessons router as before
app.get('/api/user-progress', (req, res, next) => {
  // Redirect legacy clients to new endpoint shape
  req.url = '/me';
  return require('./routes/progress')(req, res, next);
});
app.get('/api/quizzes/:lessonId', async (req, res) => {
  try {
    const quizzes = await prisma.quiz.findMany({ where: { lessonId: req.params.lessonId } });
    res.json(quizzes);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch quizzes' });
  }
});
app.get('/api/get-badge/:userId', async (req, res) => {
  // Legacy endpoint kept for the old web UI
  try {
    const u = await prisma.user.findUnique({
      where: { id: req.params.userId },
      select: { totalPoints: true, lastLogin: true },
    });
    if (!u) return res.status(404).json({ error: 'Not found' });
    const points = u.totalPoints || 0;
    const badge =
      points >= 300 ? 'Champion' : points >= 150 ? 'Achiever' : points >= 50 ? 'Learner' : 'Beginner';
    res.json({ points, badge, lastLogin: u.lastLogin });
  } catch (e) {
    res.status(500).json({ error: 'Failed' });
  }
});

// -------------------------- Health ------------------------------------------
app.get('/api/health', async (req, res) => {
  let dbOk = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch {}
  res.json({ ok: true, db: dbOk, ts: new Date().toISOString() });
});

// -------------------------- 404 + error --------------------------------------
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// -------------------------- HTTP + Socket.io --------------------------------
const server = http.createServer(app);
const io = new SocketIoServer(server, {
  cors: { origin: CORS_ORIGIN, credentials: true },
});

// Socket.io auth: token via handshake.auth.token, query.token, or cookie
io.use((socket, next) => {
  try {
    let token = null;
    if (socket.handshake.auth?.token) token = socket.handshake.auth.token;
    if (!token && socket.handshake.query?.token) token = String(socket.handshake.query.token);
    if (!token && socket.handshake.headers.cookie) {
      const m = /sih_access=([^;]+)/.exec(socket.handshake.headers.cookie);
      if (m) token = decodeURIComponent(m[1]);
    }
    if (!token) return next(new Error('No auth token'));
    const user = verifyAccessToken(token);
    socket.data.user = user;
    next();
  } catch (e) {
    next(new Error('Invalid auth token'));
  }
});

// Multiplayer namespace(s)
const quizBattle = require('./sockets/quizBattle');
quizBattle.attach(io);

// -------------------------- Start --------------------------------------------
server.listen(PORT, () => {
  console.log(`SIH server listening on :${PORT}`);
  console.log(`  CORS origin (sockets): ${CORS_ORIGIN}`);
});

process.on('SIGINT', async () => {
  console.log('\nShutting down...');
  await prisma.$disconnect();
  process.exit(0);
});
