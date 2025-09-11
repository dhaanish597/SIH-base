const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const sqlite3 = require('sqlite3').verbose();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(cors());
app.use(express.json());

// Database connections
let sqliteDb;
let mysqlConnection;

// Initialize SQLite (for offline analytics)
function initSQLite() {
  sqliteDb = new sqlite3.Database('./data/local_analytics.db', (err) => {
    if (err) {
      console.error('Error opening SQLite database:', err.message);
    } else {
      console.log('Connected to SQLite database for local analytics');
      createSQLiteTables();
      runSQLiteMigrations();
    }
  });
}

// Initialize MySQL (for cloud sync)
async function initMySQL() {
  try {
    mysqlConnection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || 'dhaanish',
      database: process.env.MYSQL_DATABASE || 'stem_learn'
    });
    console.log('Connected to MySQL database for cloud sync');
    await createMySQLTables();
  } catch (error) {
    console.error('MySQL connection failed:', error.message);
    console.log('Running in local-only mode');
  }
}

// Create SQLite tables
function createSQLiteTables() {
  // Enforce foreign keys in SQLite
  sqliteDb.run('PRAGMA foreign_keys = ON');

  const tables = [
    // schools
    `CREATE TABLE IF NOT EXISTS schools (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      address TEXT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    // users
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT,
      role TEXT CHECK(role IN ('student','teacher','school','admin')) NOT NULL,
      class TEXT,
      school_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME,
      status TEXT CHECK(status IN ('active','inactive','suspended')) NOT NULL DEFAULT 'active',
      FOREIGN KEY (school_id) REFERENCES schools (id) ON DELETE SET NULL
    )`,

    // admins
    `CREATE TABLE IF NOT EXISTS admins (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT,
      role TEXT CHECK(role IN ('admin','superadmin')) NOT NULL DEFAULT 'admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    // lessons
    `CREATE TABLE IF NOT EXISTS lessons (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      subject TEXT NOT NULL,
      difficulty INTEGER NOT NULL,
      language TEXT,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL
    )`,

    // quizzes
    `CREATE TABLE IF NOT EXISTS quizzes (
      id TEXT PRIMARY KEY,
      lesson_id TEXT NOT NULL,
      questions TEXT NOT NULL,
      total_points INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lesson_id) REFERENCES lessons (id) ON DELETE CASCADE
    )`,

    // homeworks
    `CREATE TABLE IF NOT EXISTS homeworks (
      id TEXT PRIMARY KEY,
      teacher_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      due_date DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (teacher_id) REFERENCES users (id) ON DELETE CASCADE
    )`,

    // assignments
    `CREATE TABLE IF NOT EXISTS assignments (
      id TEXT PRIMARY KEY,
      teacher_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      due_date DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (teacher_id) REFERENCES users (id) ON DELETE CASCADE
    )`,

    // student_homework
    `CREATE TABLE IF NOT EXISTS student_homework (
      id TEXT PRIMARY KEY,
      homework_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      status TEXT CHECK(status IN ('pending','completed','late')) NOT NULL DEFAULT 'pending',
      submitted_at DATETIME,
      FOREIGN KEY (homework_id) REFERENCES homeworks (id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES users (id) ON DELETE CASCADE
    )`,

    // student_assignments
    `CREATE TABLE IF NOT EXISTS student_assignments (
      id TEXT PRIMARY KEY,
      assignment_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      status TEXT CHECK(status IN ('pending','completed','late')) NOT NULL DEFAULT 'pending',
      submitted_at DATETIME,
      FOREIGN KEY (assignment_id) REFERENCES assignments (id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES users (id) ON DELETE CASCADE
    )`,

    // student_progress
    `CREATE TABLE IF NOT EXISTS student_progress (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      lesson_id TEXT NOT NULL,
      score INTEGER NOT NULL,
      time_spent INTEGER NOT NULL,
      completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      attempts INTEGER DEFAULT 1,
      consistency_score REAL,
      engagement_level REAL,
      synced INTEGER DEFAULT 0,
      FOREIGN KEY (student_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (lesson_id) REFERENCES lessons (id) ON DELETE CASCADE
    )`,

    // badges
    `CREATE TABLE IF NOT EXISTS badges (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      badge_name TEXT NOT NULL,
      description TEXT,
      earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      synced INTEGER DEFAULT 0,
      FOREIGN KEY (student_id) REFERENCES users (id) ON DELETE CASCADE
    )`,

    // leaderboard
    `CREATE TABLE IF NOT EXISTS leaderboard (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id TEXT NOT NULL,
      total_points INTEGER NOT NULL,
      level INTEGER NOT NULL,
      rank_position INTEGER,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES users (id) ON DELETE CASCADE
    )`,

    // events
    `CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      event_date DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (school_id) REFERENCES schools (id) ON DELETE CASCADE
    )`,

    // analytics
    `CREATE TABLE IF NOT EXISTS analytics (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      average_score REAL,
      lessons_completed INTEGER,
      total_time_spent INTEGER,
      streak_days INTEGER,
      consistency_index REAL,
      engagement_index REAL,
      last_active DATETIME,
      FOREIGN KEY (student_id) REFERENCES users (id) ON DELETE CASCADE
    )`
  ];

  tables.forEach((table) => {
    sqliteDb.run(table, (err) => {
      if (err) {
        console.error('Error creating SQLite table:', err.message);
      }
    });
  });

  // Insert sample lessons and quizzes
  insertSampleData();
}

// Lightweight migrations for SQLite to ensure new columns exist on existing DBs
function runSQLiteMigrations() {
  // users
  ensureSQLiteColumn('users', 'class', 'TEXT');
  ensureSQLiteColumn('users', 'password_hash', 'TEXT');
  ensureSQLiteColumn('users', 'school_id', 'TEXT');
  ensureSQLiteColumn('users', 'last_login', 'DATETIME');
  ensureSQLiteColumn('users', 'status', "TEXT CHECK(status IN ('active','inactive','suspended')) NOT NULL DEFAULT 'active'");
  ensureSQLiteColumn('users', 'role', "TEXT CHECK(role IN ('student','teacher','school','admin')) NOT NULL");

  // lessons
  ensureSQLiteColumn('lessons', 'language', 'TEXT');
  ensureSQLiteColumn('lessons', 'created_by', 'TEXT');

  // quizzes
  ensureSQLiteColumn('quizzes', 'created_at', 'DATETIME DEFAULT CURRENT_TIMESTAMP');

  // student_progress
  ensureSQLiteColumn('student_progress', 'attempts', 'INTEGER DEFAULT 1');
  ensureSQLiteColumn('student_progress', 'consistency_score', 'REAL');
  ensureSQLiteColumn('student_progress', 'engagement_level', 'REAL');
  ensureSQLiteColumn('student_progress', 'synced', 'INTEGER DEFAULT 0');

  // badges
  ensureSQLiteColumn('badges', 'description', 'TEXT');
  ensureSQLiteColumn('badges', 'synced', 'INTEGER DEFAULT 0');

  // leaderboard
  ensureSQLiteColumn('leaderboard', 'rank_position', 'INTEGER');
}

function ensureSQLiteColumn(table, column, type) {
  sqliteDb.all(`PRAGMA table_info(${table})`, (err, rows) => {
    if (err) {
      console.error(`Failed to inspect ${table} schema:`, err.message);
      return;
    }
    const hasColumn = rows.some((r) => r.name === column);
    if (!hasColumn) {
      sqliteDb.run(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`, (alterErr) => {
        if (alterErr) {
          console.error(`Failed to add column ${column} to ${table}:`, alterErr.message);
        } else {
          console.log(`Added column ${column} to ${table}`);
        }
      });
    }
  });
}

// Create MySQL tables
async function createMySQLTables() {
  const tables = [
    // schools
    `CREATE TABLE IF NOT EXISTS schools (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      address TEXT,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // users
    `CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255),
      role ENUM('student','teacher','school','admin') NOT NULL,
      class VARCHAR(50),
      school_id VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_login TIMESTAMP NULL,
      status ENUM('active','inactive','suspended') NOT NULL DEFAULT 'active',
      CONSTRAINT fk_users_school FOREIGN KEY (school_id) REFERENCES schools (id) ON DELETE SET NULL
    )`,

    // admins
    `CREATE TABLE IF NOT EXISTS admins (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255),
      role ENUM('admin','superadmin') NOT NULL DEFAULT 'admin',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // lessons
    `CREATE TABLE IF NOT EXISTS lessons (
      id VARCHAR(255) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      subject VARCHAR(255) NOT NULL,
      difficulty INT NOT NULL,
      language VARCHAR(50),
      created_by VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_lessons_user FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL
    )`,

    // quizzes
    `CREATE TABLE IF NOT EXISTS quizzes (
      id VARCHAR(255) PRIMARY KEY,
      lesson_id VARCHAR(255) NOT NULL,
      questions JSON NOT NULL,
      total_points INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_quizzes_lesson FOREIGN KEY (lesson_id) REFERENCES lessons (id) ON DELETE CASCADE
    )`,

    // homeworks
    `CREATE TABLE IF NOT EXISTS homeworks (
      id VARCHAR(255) PRIMARY KEY,
      teacher_id VARCHAR(255) NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      due_date TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_homeworks_teacher FOREIGN KEY (teacher_id) REFERENCES users (id) ON DELETE CASCADE
    )`,

    // assignments
    `CREATE TABLE IF NOT EXISTS assignments (
      id VARCHAR(255) PRIMARY KEY,
      teacher_id VARCHAR(255) NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      due_date TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_assignments_teacher FOREIGN KEY (teacher_id) REFERENCES users (id) ON DELETE CASCADE
    )`,

    // student_homework
    `CREATE TABLE IF NOT EXISTS student_homework (
      id VARCHAR(255) PRIMARY KEY,
      homework_id VARCHAR(255) NOT NULL,
      student_id VARCHAR(255) NOT NULL,
      status ENUM('pending','completed','late') NOT NULL DEFAULT 'pending',
      submitted_at TIMESTAMP NULL,
      CONSTRAINT fk_sh_homework FOREIGN KEY (homework_id) REFERENCES homeworks (id) ON DELETE CASCADE,
      CONSTRAINT fk_sh_student FOREIGN KEY (student_id) REFERENCES users (id) ON DELETE CASCADE
    )`,

    // student_assignments
    `CREATE TABLE IF NOT EXISTS student_assignments (
      id VARCHAR(255) PRIMARY KEY,
      assignment_id VARCHAR(255) NOT NULL,
      student_id VARCHAR(255) NOT NULL,
      status ENUM('pending','completed','late') NOT NULL DEFAULT 'pending',
      submitted_at TIMESTAMP NULL,
      CONSTRAINT fk_sa_assignment FOREIGN KEY (assignment_id) REFERENCES assignments (id) ON DELETE CASCADE,
      CONSTRAINT fk_sa_student FOREIGN KEY (student_id) REFERENCES users (id) ON DELETE CASCADE
    )`,

    // student_progress
    `CREATE TABLE IF NOT EXISTS student_progress (
      id VARCHAR(255) PRIMARY KEY,
      student_id VARCHAR(255) NOT NULL,
      lesson_id VARCHAR(255) NOT NULL,
      score INT NOT NULL,
      time_spent INT NOT NULL,
      completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      attempts INT DEFAULT 1,
      consistency_score FLOAT,
      engagement_level FLOAT,
      synced TINYINT DEFAULT 0,
      CONSTRAINT fk_sp_student FOREIGN KEY (student_id) REFERENCES users (id) ON DELETE CASCADE,
      CONSTRAINT fk_sp_lesson FOREIGN KEY (lesson_id) REFERENCES lessons (id) ON DELETE CASCADE
    )`,

    // badges
    `CREATE TABLE IF NOT EXISTS badges (
      id VARCHAR(255) PRIMARY KEY,
      student_id VARCHAR(255) NOT NULL,
      badge_name VARCHAR(255) NOT NULL,
      description TEXT,
      earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      synced TINYINT DEFAULT 0,
      CONSTRAINT fk_badges_student FOREIGN KEY (student_id) REFERENCES users (id) ON DELETE CASCADE
    )`,

    // leaderboard
    `CREATE TABLE IF NOT EXISTS leaderboard (
      id INT AUTO_INCREMENT PRIMARY KEY,
      student_id VARCHAR(255) NOT NULL,
      total_points INT NOT NULL,
      level INT NOT NULL,
      rank_position INT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_leaderboard_student FOREIGN KEY (student_id) REFERENCES users (id) ON DELETE CASCADE
    )`,

    // events
    `CREATE TABLE IF NOT EXISTS events (
      id VARCHAR(255) PRIMARY KEY,
      school_id VARCHAR(255) NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      event_date TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_events_school FOREIGN KEY (school_id) REFERENCES schools (id) ON DELETE CASCADE
    )`,

    // analytics
    `CREATE TABLE IF NOT EXISTS analytics (
      id VARCHAR(255) PRIMARY KEY,
      student_id VARCHAR(255) NOT NULL,
      average_score FLOAT,
      lessons_completed INT,
      total_time_spent INT,
      streak_days INT,
      consistency_index FLOAT,
      engagement_index FLOAT,
      last_active TIMESTAMP NULL,
      CONSTRAINT fk_analytics_student FOREIGN KEY (student_id) REFERENCES users (id) ON DELETE CASCADE
    )`
  ];

  for (const table of tables) {
    try {
      await mysqlConnection.execute(table);
    } catch (error) {
      console.error('Error creating MySQL table:', error.message);
    }
  }
}

// Insert sample data
function insertSampleData() {
  const sampleLessons = [
    {
      id: 'math_001',
      title: 'Basic Arithmetic',
      content: 'Learn addition, subtraction, multiplication, and division',
      subject: 'Mathematics',
      difficulty: 1
    },
    {
      id: 'sci_001',
      title: 'Water Cycle',
      content: 'Understanding evaporation, condensation, and precipitation',
      subject: 'Science',
      difficulty: 1
    },
    {
      id: 'tech_001',
      title: 'Introduction to Computers',
      content: 'Basic computer components and their functions',
      subject: 'Technology',
      difficulty: 1
    }
  ];

  const sampleQuizzes = [
    {
      id: 'quiz_math_001',
      lesson_id: 'math_001',
      questions: JSON.stringify([
        {
          id: 'q1',
          question: 'What is 5 + 3?',
          options: ['6', '7', '8', '9'],
          correctAnswer: 2,
          points: 10
        },
        {
          id: 'q2',
          question: 'What is 12 - 4?',
          options: ['6', '7', '8', '9'],
          correctAnswer: 2,
          points: 10
        }
      ]),
      total_points: 20
    }
  ];

  sampleLessons.forEach(lesson => {
    sqliteDb.run(
      'INSERT OR REPLACE INTO lessons (id, title, content, subject, difficulty) VALUES (?, ?, ?, ?, ?)',
      [lesson.id, lesson.title, lesson.content, lesson.subject, lesson.difficulty]
    );
  });

  sampleQuizzes.forEach(quiz => {
    sqliteDb.run(
      'INSERT OR REPLACE INTO quizzes (id, lesson_id, questions, total_points) VALUES (?, ?, ?, ?)',
      [quiz.id, quiz.lesson_id, quiz.questions, quiz.total_points]
    );
  });
}

// Routes

// Sync endpoint for offline data
app.post('/api/sync', async (req, res) => {
  try {
    const { type, data } = req.body;

    switch (type) {
      case 'progress':
        await syncProgress(data);
        break;
      case 'badge':
        await syncBadge(data);
        break;
      case 'stats':
        await syncStats(data);
        break;
      default:
        return res.status(400).json({ error: 'Unknown sync type' });
    }

    res.json({ success: true, message: 'Data synced successfully' });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ error: 'Sync failed' });
  }
});

// Get lessons
app.get('/api/lessons', (req, res) => {
  sqliteDb.all('SELECT * FROM lessons ORDER BY difficulty, title', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get quizzes
app.get('/api/quizzes/:lessonId', (req, res) => {
  const { lessonId } = req.params;
  sqliteDb.get('SELECT * FROM quizzes WHERE lesson_id = ?', [lessonId], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (row) {
      row.questions = JSON.parse(row.questions);
    }
    res.json(row);
  });
});

// Get leaderboard
app.get('/api/leaderboard', async (req, res) => {
  try {
    if (mysqlConnection) {
      // Get from MySQL if available
      const [rows] = await mysqlConnection.execute(
        `SELECT 
            COALESCE(l.rank_position, ROW_NUMBER() OVER (ORDER BY l.total_points DESC)) as rank,
            u.name as name,
            u.class as class,
            l.total_points as points
         FROM leaderboard l 
         JOIN users u ON l.user_id = u.id 
         ORDER BY l.total_points DESC 
         LIMIT 100`
      );
      res.json(rows.map(r => ({ rank: r.rank, name: r.name, class: r.class || '-', points: r.points })));
    } else {
      // Fallback to SQLite
      sqliteDb.all(
        `SELECT 
            u.name as name,
            COALESCE(u.class, '-') as class,
            COALESCE(SUM(sp.score), 0) as points
         FROM users u 
         LEFT JOIN student_progress sp ON u.id = sp.user_id 
         WHERE u.role = 'student'
         GROUP BY u.id, u.name, u.class 
         ORDER BY points DESC 
         LIMIT 100`,
        (err, rows) => {
          if (err) {
            res.status(500).json({ error: err.message });
            return;
          }
          const withRank = rows.map((r, idx) => ({ rank: idx + 1, name: r.name, class: r.class, points: r.points }));
          if (withRank.length === 0) {
            return res.json([
              { rank: 1, name: 'Priya', class: '10', points: 120 },
              { rank: 2, name: 'Arjun', class: '9', points: 110 },
              { rank: 3, name: 'Meera', class: '8', points: 95 }
            ]);
          }
          res.json(withRank);
        }
      );
    }
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Get teacher analytics
app.get('/api/analytics/:teacherId', (req, res) => {
  const { teacherId } = req.params;
  
  // Get student analytics for teacher
  sqliteDb.all(
    `SELECT 
      u.name as student_name,
      u.id as student_id,
      COUNT(sp.id) as lessons_completed,
      AVG(sp.score) as avg_score,
      SUM(sp.time_spent) as total_time_spent,
      MAX(sp.completed_at) as last_activity
     FROM users u 
     LEFT JOIN student_progress sp ON u.id = sp.user_id 
     WHERE u.role = 'student'
     GROUP BY u.id, u.name 
     ORDER BY avg_score DESC`,
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    }
  );
});

// Sync functions
async function syncProgress(data) {
  // Save to SQLite
  return new Promise((resolve, reject) => {
    sqliteDb.run(
      'INSERT OR REPLACE INTO student_progress (id, user_id, lesson_id, score, time_spent, completed_at, synced) VALUES (?, ?, ?, ?, ?, ?, 1)',
      [data.id, data.userId, data.lessonId, data.score, data.timeSpent, data.completedAt],
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      }
    );
  });

  // Sync to MySQL if available
  if (mysqlConnection) {
    try {
      await mysqlConnection.execute(
        'INSERT INTO student_progress (id, user_id, lesson_id, score, time_spent, completed_at) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE score = VALUES(score)',
        [data.id, data.userId, data.lessonId, data.score, data.timeSpent, data.completedAt]
      );
    } catch (error) {
      console.error('MySQL sync failed for progress:', error);
    }
  }
}

async function syncBadge(data) {
  return new Promise((resolve, reject) => {
    sqliteDb.run(
      'INSERT OR REPLACE INTO badges (id, user_id, badge_name, earned_at, synced) VALUES (?, ?, ?, ?, 1)',
      [data.id, data.userId, data.name, data.earnedAt],
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      }
    );
  });
}

async function syncStats(data) {
  // Update leaderboard in MySQL if available
  if (mysqlConnection) {
    try {
      await mysqlConnection.execute(
        'INSERT INTO leaderboard (user_id, total_points, level) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE total_points = VALUES(total_points), level = VALUES(level)',
        [data.userId, data.totalPoints, data.level]
      );
    } catch (error) {
      console.error('MySQL sync failed for stats:', error);
    }
  }
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    sqlite: sqliteDb ? 'connected' : 'disconnected',
    mysql: mysqlConnection ? 'connected' : 'disconnected'
  });
});

// Create student
app.post('/api/students', async (req, res) => {
  try {
    const { name, class: className, email, password } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }
    const studentId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const plainPassword = password && password.trim().length > 0 ? password : Math.random().toString(36).slice(-8);
    const passwordHash = await bcrypt.hash(plainPassword, 10);

    // Always insert into SQLite users for local reference
    await new Promise((resolve, reject) => {
      sqliteDb.run(
        `INSERT OR REPLACE INTO users (id, name, email, class, password_hash, role) VALUES (?, ?, ?, ?, ?, 'student')`,
        [studentId, name, email, className || null, passwordHash],
        (err) => (err ? reject(err) : resolve())
      );
    });

    // If MySQL available, mirror there as well
    if (mysqlConnection) {
      try {
        await mysqlConnection.execute(
          `INSERT INTO users (id, name, email, class, password_hash, role) VALUES (?, ?, ?, ?, ?, 'student') 
           ON DUPLICATE KEY UPDATE name = VALUES(name), email = VALUES(email), class = VALUES(class), password_hash = VALUES(password_hash)`,
          [studentId, name, email, className || null, passwordHash]
        );
      } catch (error) {
        console.error('MySQL insert failed for student:', error.message);
      }
    }

    res.status(201).json({ id: studentId, name, email, class: className || null });
  } catch (error) {
    console.error('Create student error:', error);
    res.status(500).json({ error: 'Failed to create student' });
  }
});

// Initialize databases and start server
async function startServer() {
  initSQLite();
  await initMySQL();
  
  app.listen(PORT, () => {
    console.log(`STEM Learn API server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
  });
}

startServer().catch(console.error);