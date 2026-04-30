// Quiz Battle multiplayer server (Socket.io). Lobby system + 10-Q rounds.
// Scoring: correct + faster = more points. Power-ups (shield/freeze/double).

const prisma = require('../lib/prisma');

const rooms = new Map(); // lobbyId -> in-memory room state
const QUESTION_TIME_MS = 15000;
const POINTS_BASE = 100;
const QUESTIONS_PER_ROUND = 10;

function pickQuestions(pool, count) {
  const arr = [...pool];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, count);
}

async function loadQuestionsForLobby({ subjectId, chapterId, gradeLevel }) {
  const where = {
    status: 'APPROVED',
    type: 'MCQ',
    ...(subjectId ? { subjectId } : {}),
    ...(chapterId ? { chapterId } : {}),
    ...(gradeLevel ? { gradeLevel } : {}),
  };
  const pool = await prisma.question.findMany({ where, take: 50 });
  return pickQuestions(pool, QUESTIONS_PER_ROUND);
}

function newRoomState(lobby, questions) {
  return {
    lobbyId: lobby.id,
    schoolId: lobby.schoolId,
    questions,
    currentIndex: -1,
    questionStartedAt: 0,
    players: new Map(), // userId -> { socketId, name, score, streak, powerUps:{} , answeredCurrent:false }
    status: 'waiting',
    questionTimer: null,
  };
}

function publicRoom(room) {
  return {
    lobbyId: room.lobbyId,
    status: room.status,
    currentIndex: room.currentIndex,
    totalQuestions: room.questions.length,
    players: [...room.players.values()].map((p) => ({
      userId: p.userId,
      name: p.name,
      score: p.score,
      streak: p.streak,
      powerUps: p.powerUps,
    })),
  };
}

function leaderboard(room) {
  return [...room.players.values()]
    .map((p) => ({ userId: p.userId, name: p.name, score: p.score }))
    .sort((a, b) => b.score - a.score);
}

function broadcastQuestion(io, room) {
  const q = room.questions[room.currentIndex];
  if (!q) return;
  room.questionStartedAt = Date.now();
  // Strip the answer from the broadcast
  io.to(`lobby:${room.lobbyId}`).emit('quizbattle:question', {
    index: room.currentIndex,
    total: room.questions.length,
    questionId: q.id,
    text: q.text,
    choices: q.choices,
    durationMs: QUESTION_TIME_MS,
  });
  // Reset answered flag
  for (const p of room.players.values()) p.answeredCurrent = false;

  clearTimeout(room.questionTimer);
  room.questionTimer = setTimeout(() => advanceOrEnd(io, room), QUESTION_TIME_MS + 200);
}

function advanceOrEnd(io, room) {
  if (room.currentIndex + 1 >= room.questions.length) {
    return endMatch(io, room);
  }
  room.currentIndex += 1;
  broadcastQuestion(io, room);
}

async function endMatch(io, room) {
  room.status = 'ended';
  clearTimeout(room.questionTimer);

  const board = leaderboard(room);
  io.to(`lobby:${room.lobbyId}`).emit('quizbattle:ended', { leaderboard: board });

  // Persist GameMatch + MatchParticipants. The lobby/match plumbing is best-
  // effort here — the dedicated REST flow can also create these rows.
  try {
    const lobby = await prisma.gameLobby.findUnique({ where: { id: room.lobbyId } });
    if (lobby) {
      const match = await prisma.gameMatch.upsert({
        where: { lobbyId: lobby.id },
        update: { endedAt: new Date(), winnerId: board[0]?.userId || null, matchData: { leaderboard: board } },
        create: {
          lobbyId: lobby.id,
          gameType: 'QUIZ_BATTLE',
          mode: 'MULTIPLAYER',
          endedAt: new Date(),
          winnerId: board[0]?.userId || null,
          matchData: { leaderboard: board },
        },
      });
      for (let i = 0; i < board.length; i++) {
        const p = board[i];
        await prisma.matchParticipant.upsert({
          where: { matchId_studentId: { matchId: match.id, studentId: p.userId } },
          update: { finalScore: p.score, rank: i + 1 },
          create: { matchId: match.id, studentId: p.userId, finalScore: p.score, rank: i + 1 },
        });
      }
      await prisma.gameLobby.update({
        where: { id: lobby.id },
        data: { status: 'COMPLETED', endedAt: new Date() },
      });
    }
  } catch (e) {
    console.error('quizBattle persist error', e);
  }

  rooms.delete(room.lobbyId);
}

function attach(io) {
  io.on('connection', (socket) => {
    // Authenticated user attached on the engine side via middleware
    const user = socket.data.user;
    if (!user) return socket.disconnect(true);

    socket.on('quizbattle:create', async (payload, ack) => {
      try {
        const { gameType = 'QUIZ_BATTLE', subjectId, chapterId, gradeLevel, maxPlayers = 8 } = payload || {};
        const code = Math.random().toString(36).slice(2, 7).toUpperCase();
        const lobby = await prisma.gameLobby.create({
          data: {
            schoolId: user.schoolId,
            hostId: user.id,
            classCode: code,
            gameType,
            mode: 'MULTIPLAYER',
            subjectId: subjectId || null,
            chapterId: chapterId || null,
            maxPlayers,
            status: 'WAITING',
          },
        });
        const questions = await loadQuestionsForLobby({ subjectId, chapterId, gradeLevel });
        const room = newRoomState(lobby, questions);
        rooms.set(lobby.id, room);
        socket.join(`lobby:${lobby.id}`);
        ack?.({ ok: true, lobbyId: lobby.id, classCode: code });
      } catch (e) {
        ack?.({ ok: false, error: e.message });
      }
    });

    socket.on('quizbattle:join', async ({ classCode }, ack) => {
      try {
        const lobby = await prisma.gameLobby.findUnique({ where: { classCode } });
        if (!lobby) return ack?.({ ok: false, error: 'Lobby not found' });
        if (lobby.schoolId !== user.schoolId) {
          return ack?.({ ok: false, error: 'Cross-school join not allowed' });
        }
        let room = rooms.get(lobby.id);
        if (!room) {
          // Lobby exists but no in-memory room yet (host re-loaded the page) — recreate
          const questions = await loadQuestionsForLobby({
            subjectId: lobby.subjectId,
            chapterId: lobby.chapterId,
          });
          room = newRoomState(lobby, questions);
          rooms.set(lobby.id, room);
        }
        if (room.players.size >= lobby.maxPlayers) {
          return ack?.({ ok: false, error: 'Lobby full' });
        }
        room.players.set(user.id, {
          userId: user.id,
          name: user.name,
          socketId: socket.id,
          score: 0,
          streak: 0,
          powerUps: {},
          answeredCurrent: false,
        });
        socket.join(`lobby:${lobby.id}`);
        io.to(`lobby:${lobby.id}`).emit('quizbattle:state', publicRoom(room));
        ack?.({ ok: true, lobbyId: lobby.id });
      } catch (e) {
        ack?.({ ok: false, error: e.message });
      }
    });

    socket.on('quizbattle:start', async ({ lobbyId }, ack) => {
      try {
        const room = rooms.get(lobbyId);
        if (!room) return ack?.({ ok: false, error: 'Lobby not found' });
        const lobby = await prisma.gameLobby.findUnique({ where: { id: lobbyId } });
        if (!lobby || lobby.hostId !== user.id) {
          return ack?.({ ok: false, error: 'Only the host can start' });
        }
        await prisma.gameLobby.update({
          where: { id: lobbyId },
          data: { status: 'IN_PROGRESS', startedAt: new Date() },
        });
        room.status = 'in_progress';
        room.currentIndex = 0;
        io.to(`lobby:${lobbyId}`).emit('quizbattle:state', publicRoom(room));
        broadcastQuestion(io, room);
        ack?.({ ok: true });
      } catch (e) {
        ack?.({ ok: false, error: e.message });
      }
    });

    socket.on('quizbattle:answer', ({ lobbyId, choiceIndex, powerUp }, ack) => {
      const room = rooms.get(lobbyId);
      if (!room || room.status !== 'in_progress') return ack?.({ ok: false });
      const p = room.players.get(user.id);
      if (!p || p.answeredCurrent) return ack?.({ ok: false });

      const q = room.questions[room.currentIndex];
      if (!q) return ack?.({ ok: false });

      const correct = choiceIndex === q.answerIndex;
      const elapsedMs = Date.now() - room.questionStartedAt;
      const speedFactor = Math.max(0, 1 - elapsedMs / QUESTION_TIME_MS);
      let earned = 0;
      if (correct) {
        p.streak += 1;
        earned = Math.round(POINTS_BASE * (0.5 + 0.5 * speedFactor));
        if (powerUp === 'double' && p.powerUps.double) {
          earned *= 2;
          p.powerUps.double = false;
        }
        // Award power-ups based on streak
        if (p.streak === 3) p.powerUps.shield = true;
        if (p.streak === 5) p.powerUps.freeze = true;
        if (p.streak === 7) p.powerUps.double = true;
      } else if (powerUp === 'shield' && p.powerUps.shield) {
        // Shield negates the wrong-answer penalty (and doesn't break streak)
        p.powerUps.shield = false;
      } else {
        p.streak = 0;
      }
      p.score += earned;
      p.answeredCurrent = true;

      io.to(`lobby:${lobbyId}`).emit('quizbattle:answer', {
        userId: user.id,
        correct,
        earned,
        score: p.score,
        streak: p.streak,
        index: room.currentIndex,
      });

      // If everyone answered, advance immediately
      const allAnswered = [...room.players.values()].every((pl) => pl.answeredCurrent);
      if (allAnswered) {
        clearTimeout(room.questionTimer);
        setTimeout(() => advanceOrEnd(io, room), 600);
      }
      ack?.({ ok: true, correct, earned });
    });

    socket.on('disconnect', () => {
      // Remove this user from any rooms they were in
      for (const room of rooms.values()) {
        const p = room.players.get(user.id);
        if (p && p.socketId === socket.id) {
          room.players.delete(user.id);
          io.to(`lobby:${room.lobbyId}`).emit('quizbattle:state', publicRoom(room));
        }
      }
    });
  });
}

module.exports = { attach };
