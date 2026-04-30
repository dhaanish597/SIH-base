/* eslint-disable no-console */
// One-shot migration: copies all rows from server/data/local_analytics.db
// (SQLite) into Postgres via Prisma, preserving IDs and foreign-key links.
//
// Usage:
//   1. Set DATABASE_URL / DIRECT_URL in .env (Supabase)
//   2. npx prisma migrate deploy   (creates the Postgres schema)
//   3. node scripts/migrate-sqlite-to-postgres.js
//
// Idempotent: uses upserts where possible, so safe to re-run.

require('dotenv').config();

const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const prisma = require('../server/lib/prisma');

const SQLITE_PATH = path.resolve(__dirname, '..', 'server', 'data', 'local_analytics.db');

function openSqlite() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(SQLITE_PATH, sqlite3.OPEN_READONLY, (err) => {
      if (err) return reject(err);
      resolve(db);
    });
  });
}

function all(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows || [])));
  });
}

function tableExists(db, name) {
  return all(db, `SELECT name FROM sqlite_master WHERE type='table' AND name=?`, [name]).then(
    (rows) => rows.length > 0,
  );
}

const ROLE_MAP = { student: 'STUDENT', teacher: 'TEACHER', school: 'SCHOOL', admin: 'ADMIN', superadmin: 'SUPERADMIN' };
const STATUS_MAP = { active: 'ACTIVE', inactive: 'INACTIVE', suspended: 'SUSPENDED' };
const STYLE_MAP = { visual: 'VISUAL', kinesthetic: 'KINESTHETIC', reading: 'READING', mixed: 'MIXED' };
const ASSIGN_STATUS_MAP = { pending: 'PENDING', completed: 'COMPLETED', late: 'LATE', graded: 'GRADED' };
const STRATEGY_MAP = {
  mastery_based: 'MASTERY_BASED',
  sequence_based: 'SEQUENCE_BASED',
  engagement_based: 'ENGAGEMENT_BASED',
};

function parseDate(v) {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}
function parseStringArray(val) {
  if (!val) return [];
  try {
    const parsed = JSON.parse(val);
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {}
  if (typeof val === 'string') return val.split(',').map((s) => s.trim()).filter(Boolean);
  return [];
}

async function migrateSchools(db) {
  if (!(await tableExists(db, 'schools'))) return 0;
  const rows = await all(db, 'SELECT * FROM schools');
  for (const r of rows) {
    await prisma.school.upsert({
      where: { id: r.id },
      update: {
        name: r.name,
        address: r.address,
        email: r.email,
        passwordHash: r.password_hash,
      },
      create: {
        id: r.id,
        name: r.name,
        schoolCode: r.id, // legacy: reuse id as code; admin can edit later
        address: r.address,
        email: r.email,
        passwordHash: r.password_hash,
        createdAt: parseDate(r.created_at) || undefined,
      },
    });
  }
  return rows.length;
}

async function migrateUsers(db) {
  if (!(await tableExists(db, 'users'))) return 0;
  const rows = await all(db, 'SELECT * FROM users');
  for (const r of rows) {
    await prisma.user.upsert({
      where: { id: r.id },
      update: {
        name: r.name,
        email: r.email || null,
        passwordHash: r.password_hash || null,
        role: ROLE_MAP[r.role] || 'STUDENT',
        class: r.class || null,
        schoolId: r.school_id || null,
        status: STATUS_MAP[r.status] || 'ACTIVE',
        phone: r.phone || null,
        address: r.address || null,
        language: r.language || 'en',
        profilePhoto: r.profile_photo || null,
        rollNumber: r.roll_number || null,
        department: r.department || null,
        subjectsTaught: parseStringArray(r.subjects_taught),
        classesHandled: parseStringArray(r.classes_handled),
        totalPoints: Number(r.total_points || 0),
        lastLogin: parseDate(r.last_login),
      },
      create: {
        id: r.id,
        name: r.name,
        email: r.email || null,
        passwordHash: r.password_hash || null,
        role: ROLE_MAP[r.role] || 'STUDENT',
        class: r.class || null,
        schoolId: r.school_id || null,
        status: STATUS_MAP[r.status] || 'ACTIVE',
        phone: r.phone || null,
        address: r.address || null,
        language: r.language || 'en',
        profilePhoto: r.profile_photo || null,
        rollNumber: r.roll_number || null,
        department: r.department || null,
        subjectsTaught: parseStringArray(r.subjects_taught),
        classesHandled: parseStringArray(r.classes_handled),
        totalPoints: Number(r.total_points || 0),
        createdAt: parseDate(r.created_at) || undefined,
        lastLogin: parseDate(r.last_login),
      },
    });
  }
  return rows.length;
}

async function migrateAdmins(db) {
  if (!(await tableExists(db, 'admins'))) return 0;
  const rows = await all(db, 'SELECT * FROM admins');
  for (const r of rows) {
    // Treat admins table rows as users with role ADMIN/SUPERADMIN
    await prisma.user.upsert({
      where: { id: r.id },
      update: {
        name: r.name,
        email: r.email || null,
        passwordHash: r.password_hash || null,
        role: r.role === 'superadmin' ? 'SUPERADMIN' : 'ADMIN',
      },
      create: {
        id: r.id,
        name: r.name,
        email: r.email || null,
        passwordHash: r.password_hash || null,
        role: r.role === 'superadmin' ? 'SUPERADMIN' : 'ADMIN',
        createdAt: parseDate(r.created_at) || undefined,
      },
    });
  }
  return rows.length;
}

async function migrateLessons(db) {
  if (!(await tableExists(db, 'lessons'))) return 0;
  const rows = await all(db, 'SELECT * FROM lessons');
  for (const r of rows) {
    await prisma.lesson.upsert({
      where: { id: r.id },
      update: {
        title: r.title,
        content: r.content,
        difficulty: Number(r.difficulty || 1),
        language: r.language || 'en',
        createdById: r.created_by || null,
      },
      create: {
        id: r.id,
        title: r.title,
        content: r.content,
        difficulty: Number(r.difficulty || 1),
        language: r.language || 'en',
        createdById: r.created_by || null,
        createdAt: parseDate(r.created_at) || undefined,
      },
    });
  }
  return rows.length;
}

async function migrateQuizzes(db) {
  if (!(await tableExists(db, 'quizzes'))) return 0;
  const rows = await all(db, 'SELECT * FROM quizzes');
  for (const r of rows) {
    let questions;
    try { questions = JSON.parse(r.questions || '[]'); } catch { questions = []; }
    await prisma.quiz.upsert({
      where: { id: r.id },
      update: {
        questions,
        totalPoints: Number(r.total_points || 0),
        gradeLevel: Number(r.grade || 0),
      },
      create: {
        id: r.id,
        lessonId: r.lesson_id,
        questions,
        totalPoints: Number(r.total_points || 0),
        gradeLevel: Number(r.grade || 0),
        createdAt: parseDate(r.created_at) || undefined,
      },
    });
  }
  return rows.length;
}

async function migrateHomeworks(db) {
  if (!(await tableExists(db, 'homeworks'))) return 0;
  const rows = await all(db, 'SELECT * FROM homeworks');
  for (const r of rows) {
    await prisma.homework.upsert({
      where: { id: r.id },
      update: { title: r.title, description: r.description, dueDate: parseDate(r.due_date) },
      create: {
        id: r.id,
        teacherId: r.teacher_id,
        title: r.title,
        description: r.description,
        dueDate: parseDate(r.due_date),
        createdAt: parseDate(r.created_at) || undefined,
      },
    });
  }
  return rows.length;
}

async function migrateAssignments(db) {
  if (!(await tableExists(db, 'assignments'))) return 0;
  const rows = await all(db, 'SELECT * FROM assignments');
  for (const r of rows) {
    await prisma.assignment.upsert({
      where: { id: r.id },
      update: { title: r.title, description: r.description, dueDate: parseDate(r.due_date) },
      create: {
        id: r.id,
        teacherId: r.teacher_id,
        title: r.title,
        description: r.description,
        dueDate: parseDate(r.due_date),
        createdAt: parseDate(r.created_at) || undefined,
      },
    });
  }
  return rows.length;
}

async function migrateStudentHomework(db) {
  if (!(await tableExists(db, 'student_homework'))) return 0;
  const rows = await all(db, 'SELECT * FROM student_homework');
  for (const r of rows) {
    await prisma.studentHomework.upsert({
      where: { id: r.id },
      update: {
        status: ASSIGN_STATUS_MAP[r.status] || 'PENDING',
        submittedAt: parseDate(r.submitted_at),
      },
      create: {
        id: r.id,
        homeworkId: r.homework_id,
        studentId: r.student_id,
        status: ASSIGN_STATUS_MAP[r.status] || 'PENDING',
        submittedAt: parseDate(r.submitted_at),
      },
    });
  }
  return rows.length;
}

async function migrateStudentAssignments(db) {
  if (!(await tableExists(db, 'student_assignments'))) return 0;
  const rows = await all(db, 'SELECT * FROM student_assignments');
  for (const r of rows) {
    await prisma.studentAssignment.upsert({
      where: { id: r.id },
      update: {
        status: ASSIGN_STATUS_MAP[r.status] || 'PENDING',
        submittedAt: parseDate(r.submitted_at),
      },
      create: {
        id: r.id,
        assignmentId: r.assignment_id,
        studentId: r.student_id,
        status: ASSIGN_STATUS_MAP[r.status] || 'PENDING',
        submittedAt: parseDate(r.submitted_at),
      },
    });
  }
  return rows.length;
}

async function migrateStudentProgress(db) {
  if (!(await tableExists(db, 'student_progress'))) return 0;
  const rows = await all(db, 'SELECT * FROM student_progress');
  for (const r of rows) {
    await prisma.studentProgress.upsert({
      where: { id: r.id },
      update: {
        score: Number(r.score || 0),
        timeSpent: Number(r.time_spent || 0),
        attempts: Number(r.attempts || 1),
        consistencyScore: r.consistency_score == null ? null : Number(r.consistency_score),
        engagementLevel: r.engagement_level == null ? null : Number(r.engagement_level),
        synced: !!r.synced,
        conceptTags: parseStringArray(r.concept_tags),
        errorType: r.error_type || null,
      },
      create: {
        id: r.id,
        studentId: r.student_id,
        lessonId: r.lesson_id,
        score: Number(r.score || 0),
        timeSpent: Number(r.time_spent || 0),
        attempts: Number(r.attempts || 1),
        consistencyScore: r.consistency_score == null ? null : Number(r.consistency_score),
        engagementLevel: r.engagement_level == null ? null : Number(r.engagement_level),
        synced: !!r.synced,
        conceptTags: parseStringArray(r.concept_tags),
        errorType: r.error_type || null,
        completedAt: parseDate(r.completed_at) || undefined,
      },
    });
  }
  return rows.length;
}

async function migrateConceptMastery(db) {
  if (!(await tableExists(db, 'concept_mastery'))) return 0;
  const rows = await all(db, 'SELECT * FROM concept_mastery');
  for (const r of rows) {
    await prisma.conceptMastery.upsert({
      where: { studentId_conceptName: { studentId: r.student_id, conceptName: r.concept_name } },
      update: {
        masteryLevel: Number(r.mastery_level || 0),
        confidenceScore: r.confidence_score == null ? null : Number(r.confidence_score),
        lastPracticed: parseDate(r.last_practiced),
        attemptsCount: Number(r.attempts_count || 0),
        correctCount: Number(r.correct_count || 0),
        averageTimeSpent: r.average_time_spent == null ? null : Number(r.average_time_spent),
      },
      create: {
        id: r.id,
        studentId: r.student_id,
        conceptName: r.concept_name,
        masteryLevel: Number(r.mastery_level || 0),
        confidenceScore: r.confidence_score == null ? null : Number(r.confidence_score),
        lastPracticed: parseDate(r.last_practiced),
        attemptsCount: Number(r.attempts_count || 0),
        correctCount: Number(r.correct_count || 0),
        averageTimeSpent: r.average_time_spent == null ? null : Number(r.average_time_spent),
      },
    });
  }
  return rows.length;
}

async function migrateLearningProfile(db) {
  if (!(await tableExists(db, 'student_learning_profile'))) return 0;
  const rows = await all(db, 'SELECT * FROM student_learning_profile');
  for (const r of rows) {
    await prisma.studentLearningProfile.upsert({
      where: { studentId: r.student_id },
      update: {
        preferredLearningStyle: r.preferred_learning_style ? STYLE_MAP[r.preferred_learning_style] : null,
        averageLearningVelocity: r.average_learning_velocity == null ? null : Number(r.average_learning_velocity),
        optimalDifficultyLevel: r.optimal_difficulty_level == null ? null : Number(r.optimal_difficulty_level),
        engagementScore: r.engagement_score == null ? null : Number(r.engagement_score),
        timeSpentVisual: Number(r.time_spent_visual || 0),
        timeSpentReading: Number(r.time_spent_reading || 0),
        timeSpentPractice: Number(r.time_spent_practice || 0),
      },
      create: {
        id: r.id,
        studentId: r.student_id,
        preferredLearningStyle: r.preferred_learning_style ? STYLE_MAP[r.preferred_learning_style] : null,
        averageLearningVelocity: r.average_learning_velocity == null ? null : Number(r.average_learning_velocity),
        optimalDifficultyLevel: r.optimal_difficulty_level == null ? null : Number(r.optimal_difficulty_level),
        engagementScore: r.engagement_score == null ? null : Number(r.engagement_score),
        timeSpentVisual: Number(r.time_spent_visual || 0),
        timeSpentReading: Number(r.time_spent_reading || 0),
        timeSpentPractice: Number(r.time_spent_practice || 0),
      },
    });
  }
  return rows.length;
}

async function migrateBadges(db) {
  if (!(await tableExists(db, 'badges'))) return 0;
  const rows = await all(db, 'SELECT * FROM badges');
  // Ensure a generic BadgeDefinition exists per unique badge_name
  const uniqueNames = [...new Set(rows.map((r) => r.badge_name))];
  for (const name of uniqueNames) {
    await prisma.badgeDefinition.upsert({
      where: { key: name.toLowerCase().replace(/\s+/g, '_') },
      update: {},
      create: {
        key: name.toLowerCase().replace(/\s+/g, '_'),
        name,
        description: name,
        type: 'MILESTONE',
      },
    });
  }
  for (const r of rows) {
    const def = await prisma.badgeDefinition.findUnique({
      where: { key: r.badge_name.toLowerCase().replace(/\s+/g, '_') },
    });
    if (!def) continue;
    await prisma.userBadge.upsert({
      where: { userId_badgeId: { userId: r.student_id, badgeId: def.id } },
      update: {},
      create: {
        userId: r.student_id,
        badgeId: def.id,
        earnedAt: parseDate(r.earned_at) || undefined,
      },
    }).catch(() => {}); // ignore FK errors for orphaned rows
  }
  return rows.length;
}

async function migrateErrorPatterns(db) {
  if (!(await tableExists(db, 'error_patterns'))) return 0;
  const rows = await all(db, 'SELECT * FROM error_patterns');
  for (const r of rows) {
    await prisma.errorPattern.upsert({
      where: {
        studentId_conceptName_errorType: {
          studentId: r.student_id,
          conceptName: r.concept_name,
          errorType: r.error_type,
        },
      },
      update: {
        occurrenceCount: Number(r.occurrence_count || 1),
        lastOccurred: parseDate(r.last_occurred) || undefined,
      },
      create: {
        id: r.id,
        studentId: r.student_id,
        conceptName: r.concept_name,
        errorType: r.error_type,
        occurrenceCount: Number(r.occurrence_count || 1),
        firstOccurred: parseDate(r.first_occurred) || undefined,
        lastOccurred: parseDate(r.last_occurred) || undefined,
      },
    }).catch(() => {});
  }
  return rows.length;
}

async function migrateEngagementPatterns(db) {
  if (!(await tableExists(db, 'engagement_patterns'))) return 0;
  const rows = await all(db, 'SELECT * FROM engagement_patterns');
  for (const r of rows) {
    const sessionDate = parseDate(r.session_date);
    if (!sessionDate) continue;
    await prisma.engagementPattern.upsert({
      where: {
        studentId_sessionDate: { studentId: r.student_id, sessionDate },
      },
      update: {
        sessionDuration: Number(r.session_duration || 0),
        questionsAnswered: Number(r.questions_answered || 0),
        correctAnswers: Number(r.correct_answers || 0),
        totalTimeSpent: Number(r.total_time_spent || 0),
        engagementScore: r.engagement_score == null ? null : Number(r.engagement_score),
      },
      create: {
        id: r.id,
        studentId: r.student_id,
        sessionDate,
        sessionDuration: Number(r.session_duration || 0),
        questionsAnswered: Number(r.questions_answered || 0),
        correctAnswers: Number(r.correct_answers || 0),
        totalTimeSpent: Number(r.total_time_spent || 0),
        engagementScore: r.engagement_score == null ? null : Number(r.engagement_score),
      },
    }).catch(() => {});
  }
  return rows.length;
}

async function migrateExperiments(db) {
  if (!(await tableExists(db, 'experiments'))) return 0;
  const rows = await all(db, 'SELECT * FROM experiments');
  for (const r of rows) {
    const strategy = STRATEGY_MAP[r.strategy] || 'MASTERY_BASED';
    await prisma.experiment.upsert({
      where: { studentId: r.student_id },
      update: {
        strategy,
        learningGains: r.learning_gains == null ? null : Number(r.learning_gains),
        engagementScore: r.engagement_score == null ? null : Number(r.engagement_score),
        completionRate: r.completion_rate == null ? null : Number(r.completion_rate),
      },
      create: {
        id: r.id,
        studentId: r.student_id,
        strategy,
        learningGains: r.learning_gains == null ? null : Number(r.learning_gains),
        engagementScore: r.engagement_score == null ? null : Number(r.engagement_score),
        completionRate: r.completion_rate == null ? null : Number(r.completion_rate),
        assignedAt: parseDate(r.assigned_at) || undefined,
      },
    }).catch(() => {});
  }
  return rows.length;
}

async function migrateEvents(db) {
  if (!(await tableExists(db, 'events'))) return 0;
  const rows = await all(db, 'SELECT * FROM events');
  for (const r of rows) {
    await prisma.event.upsert({
      where: { id: r.id },
      update: { title: r.title, description: r.description, eventDate: parseDate(r.event_date) || new Date() },
      create: {
        id: r.id,
        schoolId: r.school_id,
        title: r.title,
        description: r.description,
        eventDate: parseDate(r.event_date) || new Date(),
        createdAt: parseDate(r.created_at) || undefined,
      },
    }).catch(() => {});
  }
  return rows.length;
}

async function main() {
  console.log('▶ SQLite -> Postgres migration');
  console.log('  source:', SQLITE_PATH);
  const db = await openSqlite();
  const steps = [
    ['schools', migrateSchools],
    ['users', migrateUsers],
    ['admins', migrateAdmins],
    ['lessons', migrateLessons],
    ['quizzes', migrateQuizzes],
    ['homeworks', migrateHomeworks],
    ['assignments', migrateAssignments],
    ['student_homework', migrateStudentHomework],
    ['student_assignments', migrateStudentAssignments],
    ['student_progress', migrateStudentProgress],
    ['concept_mastery', migrateConceptMastery],
    ['student_learning_profile', migrateLearningProfile],
    ['badges', migrateBadges],
    ['error_patterns', migrateErrorPatterns],
    ['engagement_patterns', migrateEngagementPatterns],
    ['experiments', migrateExperiments],
    ['events', migrateEvents],
  ];
  for (const [name, fn] of steps) {
    try {
      const n = await fn(db);
      console.log(`  ✓ ${name}: ${n} rows`);
    } catch (e) {
      console.error(`  ✗ ${name}: ${e.message}`);
    }
  }
  await prisma.$disconnect();
  db.close();
  console.log('✔ Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
