const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const sqlite3 = require('sqlite3').verbose();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
// Note: We'll read questions from disk on each request so updates to the file are picked up without restart

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(cors());
app.use(express.json());

// Database connections
let sqliteDb;
let mysqlConnection;

// Auth helpers
function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    const token = authHeader && authHeader.split(' ')[0] === 'Bearer' ? authHeader.split(' ')[1] : null;
    
    console.log('Auth header:', authHeader);
    console.log('Token:', token ? 'Present' : 'Missing');
    
    if (!token) return res.status(401).json({ error: 'Missing token' });

    // Handle demo token
    if (token === 'demo_token') {
      req.user = { id: 'demo-user', name: 'Demo User', role: 'student', class: '9' };
      return next();
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        console.log('JWT verification error:', err.message);
        return res.status(403).json({ error: 'Invalid or expired token' });
      }
      req.user = user;
      next();
    });
  } catch (e) {
    console.log('Auth error:', e.message);
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (req.user.role !== role) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}

// Login
app.post('/api/login', (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    sqliteDb.get('SELECT id, name, email, class, role, school_id, language, password_hash FROM users WHERE email = ? AND status = "active"', [email], async (err, userRow) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!userRow || !userRow.password_hash) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      try {
        const match = await bcrypt.compare(password, userRow.password_hash);
        if (!match) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Update last_login
        sqliteDb.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [userRow.id], () => {});

        const payload = { id: userRow.id, name: userRow.name, email: userRow.email, class: userRow.class || null, role: userRow.role, school_id: userRow.school_id || null, language: userRow.language || 'en' };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
        return res.json({ ...payload, token });
      } catch (cmpErr) {
        return res.status(500).json({ error: 'Login failed' });
      }
    });
  } catch (error) {
    return res.status(500).json({ error: 'Login failed' });
  }
});

// Current user by token
app.get('/api/users/me', authenticateToken, (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    sqliteDb.get(
      `SELECT id, name, email, role, class, school_id, language, phone, address, profile_photo, created_at, last_login, status, total_points
       FROM users WHERE id = ?`,
      [userId],
      (err, row) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!row) return res.status(404).json({ error: 'User not found' });
        return res.json(row);
      }
    );
  } catch (e) {
    return res.status(500).json({ error: 'Failed to fetch current user' });
  }
});

// Profile routes
app.get('/api/profile/:id', authenticateToken, (req, res) => {
  try {
    const userId = req.params.id;
    sqliteDb.get(
      `SELECT id, name, email, role, class, school_id, created_at, last_login, status,
              phone, address, language, profile_photo, roll_number, department,
              subjects_taught, classes_handled
       FROM users WHERE id = ?`,
      [userId],
      (err, row) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        if (!row) {
          return res.status(404).json({ error: 'User not found' });
        }

        // Attempt to normalize array-like fields if they are stored as CSV/JSON
        const normalizeArray = (val) => {
          if (!val) return undefined;
          try {
            const parsed = JSON.parse(val);
            return Array.isArray(parsed) ? parsed : undefined;
          } catch {
            if (typeof val === 'string') {
              const parts = val.split(',').map(s => s.trim()).filter(Boolean);
              return parts.length ? parts : undefined;
            }
            return undefined;
          }
        };

        const user = {
          id: row.id,
          name: row.name,
          email: row.email,
          role: row.role,
          class: row.class || null,
          school_id: row.school_id || null,
          created_at: row.created_at || null,
          last_login: row.last_login || null,
          status: row.status || null,
          phone: row.phone || null,
          address: row.address || null,
          language: row.language || null,
          profile_photo: row.profile_photo || null,
          roll_number: row.roll_number || null,
          department: row.department || null,
          subjects_taught: normalizeArray(row.subjects_taught),
          classes_handled: normalizeArray(row.classes_handled)
        };

        return res.json({ user });
      }
    );
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

app.put('/api/profile/:id', authenticateToken, (req, res) => {
  try {
    const userId = req.params.id;
    const {
      name,
      phone,
      address,
      language,
      profile_photo
    } = req.body || {};

    const fields = [];
    const values = [];

    const addField = (column, value) => {
      if (typeof value !== 'undefined') {
        fields.push(`${column} = ?`);
        values.push(value);
      }
    };

    addField('name', name);
    addField('phone', phone);
    addField('address', address);
    addField('language', language);
    addField('profile_photo', profile_photo);

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No updatable fields provided' });
    }

    values.push(userId);
    const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
    sqliteDb.run(sql, values, function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database update error' });
      }

      // Return the updated profile
      sqliteDb.get(
        `SELECT id, name, email, role, class, school_id, created_at, last_login, status,
                phone, address, language, profile_photo, roll_number, department,
                subjects_taught, classes_handled
         FROM users WHERE id = ?`,
        [userId],
        (selErr, row) => {
          if (selErr || !row) {
            return res.status(200).json({ success: true });
          }

          const normalizeArray = (val) => {
            if (!val) return undefined;
            try {
              const parsed = JSON.parse(val);
              return Array.isArray(parsed) ? parsed : undefined;
            } catch {
              if (typeof val === 'string') {
                const parts = val.split(',').map(s => s.trim()).filter(Boolean);
                return parts.length ? parts : undefined;
              }
              return undefined;
            }
          };

          const user = {
            id: row.id,
            name: row.name,
            email: row.email,
            role: row.role,
            class: row.class || null,
            school_id: row.school_id || null,
            created_at: row.created_at || null,
            last_login: row.last_login || null,
            status: row.status || null,
            phone: row.phone || null,
            address: row.address || null,
            language: row.language || null,
            profile_photo: row.profile_photo || null,
            roll_number: row.roll_number || null,
            department: row.department || null,
            subjects_taught: normalizeArray(row.subjects_taught),
            classes_handled: normalizeArray(row.classes_handled)
          };

          return res.json({ success: true, user });
        }
      );
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Update profile (alias route as requested)
app.post('/api/updateProfile', authenticateToken, (req, res) => {
  try {
    const userId = req.user?.id || req.body?.id;
    if (!userId) return res.status(400).json({ error: 'Missing user id' });

    const { name, phone, address, language, profile_photo } = req.body || {};

    const fields = [];
    const values = [];
    const add = (col, val) => { if (typeof val !== 'undefined') { fields.push(`${col} = ?`); values.push(val); } };
    add('name', name);
    add('phone', phone);
    add('address', address);
    add('language', language);
    add('profile_photo', profile_photo);
    if (!fields.length) return res.status(400).json({ error: 'No updatable fields provided' });

    values.push(userId);
    sqliteDb.run(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values, (err) => {
      if (err) return res.status(500).json({ error: 'Database update error' });
      sqliteDb.get(`SELECT id, name, email, role, class, school_id, created_at, last_login, status,
                           phone, address, language, profile_photo, roll_number, department,
                           subjects_taught, classes_handled FROM users WHERE id = ?`, [userId], (e, row) => {
        if (e || !row) return res.json({ success: true });
        return res.json({ success: true, user: row });
      });
    });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Initialize SQLite (for offline analytics)
function initSQLite() {
  sqliteDb = new sqlite3.Database('./data/local_analytics.db', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
      console.error('Error opening SQLite database:', err.message);
    } else {
      console.log('Connected to SQLite database for local analytics');
      
      // Configure SQLite to prevent locks
      sqliteDb.run('PRAGMA journal_mode = WAL', (err) => {
        if (err) console.log('WAL mode error:', err.message);
      });
      sqliteDb.run('PRAGMA synchronous = NORMAL', (err) => {
        if (err) console.log('Synchronous mode error:', err.message);
      });
      sqliteDb.run('PRAGMA cache_size = 1000', (err) => {
        if (err) console.log('Cache size error:', err.message);
      });
      sqliteDb.run('PRAGMA temp_store = MEMORY', (err) => {
        if (err) console.log('Temp store error:', err.message);
      });
      sqliteDb.run('PRAGMA busy_timeout = 30000', (err) => {
        if (err) console.log('Busy timeout error:', err.message);
      });
      sqliteDb.run('PRAGMA foreign_keys = ON', (err) => {
        if (err) console.log('Foreign keys error:', err.message);
      });
      
      createSQLiteTables(() => {
        console.log('Database initialization complete');
      });
    }
  });
  
  // Handle database errors
  sqliteDb.on('error', (err) => {
    console.error('SQLite database error:', err);
    if (err.code === 'SQLITE_BUSY') {
      console.log('Database is busy, this is normal in WAL mode');
      // Don't crash the server, just log the error
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
function createSQLiteTables(callback) {
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
      phone TEXT,
      address TEXT,
      language TEXT DEFAULT 'en',
      profile_photo TEXT,
      roll_number TEXT,
      department TEXT,
      subjects_taught TEXT,
      classes_handled TEXT,
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
      grade INTEGER NOT NULL DEFAULT 0,
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
      concept_tags TEXT,
      error_type TEXT,
      FOREIGN KEY (student_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (lesson_id) REFERENCES lessons (id) ON DELETE CASCADE
    )`,

    // concept_mastery
    `CREATE TABLE IF NOT EXISTS concept_mastery (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      concept_name TEXT NOT NULL,
      mastery_level REAL CHECK(mastery_level >= 0 AND mastery_level <= 1),
      confidence_score REAL CHECK(confidence_score >= 0 AND confidence_score <= 1),
      last_practiced DATETIME,
      attempts_count INTEGER DEFAULT 0,
      correct_count INTEGER DEFAULT 0,
      average_time_spent REAL,
      FOREIGN KEY (student_id) REFERENCES users (id) ON DELETE CASCADE
    )`,

    // student_learning_profile
    `CREATE TABLE IF NOT EXISTS student_learning_profile (
      id TEXT PRIMARY KEY,
      student_id TEXT UNIQUE NOT NULL,
      preferred_learning_style TEXT CHECK(preferred_learning_style IN ('visual','kinesthetic','reading','mixed')),
      average_learning_velocity REAL,
      optimal_difficulty_level REAL CHECK(optimal_difficulty_level >= 0 AND optimal_difficulty_level <= 1),
      engagement_score REAL CHECK(engagement_score >= 0 AND engagement_score <= 1),
      last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES users (id) ON DELETE CASCADE
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

  let completedTables = 0;
  const totalTables = tables.length;

  tables.forEach((table) => {
    sqliteDb.run(table, (err) => {
      if (err) {
        console.error('Error creating SQLite table:', err.message);
      }
      completedTables++;
      
      // When all tables are created, run migrations and insert sample data
      if (completedTables === totalTables) {
        runSQLiteMigrations();
        insertSampleData();
        if (callback) callback();
      }
    });
  });
}

// Lightweight migrations for SQLite to ensure new columns exist on existing DBs
function runSQLiteMigrations() {
  // Check if users table exists first
  sqliteDb.all("SELECT name FROM sqlite_master WHERE type='table' AND name='users'", (err, tables) => {
    if (err) {
      console.error('Failed to check for users table:', err.message);
      return;
    }
    
    if (tables.length === 0) {
      console.log('Users table does not exist, skipping migrations');
      return;
    }
    
    // Check if we need to recreate the users table due to role constraint
    sqliteDb.all("PRAGMA table_info(users)", (err, rows) => {
      if (err) {
        console.error('Failed to inspect users table:', err.message);
        return;
      }
      
      // Check if the role column has the old constraint
      const roleColumn = rows.find(r => r.name === 'role');
      if (roleColumn && roleColumn.type.includes('CHECK(role IN (\'student\',\'teacher\'))')) {
        console.log('Recreating users table to support all roles...');
        recreateUsersTable();
      } else {
        // Normal column migrations
        ensureSQLiteColumn('users', 'class', 'TEXT');
        ensureSQLiteColumn('users', 'password_hash', 'TEXT');
        ensureSQLiteColumn('users', 'school_id', 'TEXT');
        ensureSQLiteColumn('users', 'last_login', 'DATETIME');
        ensureSQLiteColumn('users', 'status', "TEXT CHECK(status IN ('active','inactive','suspended')) NOT NULL DEFAULT 'active'");
        ensureSQLiteColumn('users', 'role', "TEXT CHECK(role IN ('student','teacher','school','admin')) NOT NULL");
        // Profile fields
        ensureSQLiteColumn('users', 'phone', 'TEXT');
        ensureSQLiteColumn('users', 'address', 'TEXT');
        ensureSQLiteColumn('users', 'language', 'TEXT DEFAULT \"en\"');
        ensureSQLiteColumn('users', 'profile_photo', 'TEXT');
        ensureSQLiteColumn('users', 'roll_number', 'TEXT');
        ensureSQLiteColumn('users', 'department', 'TEXT');
        ensureSQLiteColumn('users', 'subjects_taught', 'TEXT');
        ensureSQLiteColumn('users', 'classes_handled', 'TEXT');
        // Points system
        ensureSQLiteColumn('users', 'total_points', 'INTEGER DEFAULT 0');
      }
    });
  });

  // lessons
  ensureSQLiteColumn('lessons', 'language', 'TEXT');
  ensureSQLiteColumn('lessons', 'created_by', 'TEXT');

  // quizzes
  // Some SQLite versions reject non-constant defaults during ALTER TABLE; add without default for existing DBs
  ensureSQLiteColumn('quizzes', 'created_at', 'DATETIME');
  ensureSQLiteColumn('quizzes', 'grade', 'INTEGER NOT NULL DEFAULT 0');

  // student_progress
  ensureSQLiteColumn('student_progress', 'attempts', 'INTEGER DEFAULT 1');
  ensureSQLiteColumn('student_progress', 'consistency_score', 'REAL');
  ensureSQLiteColumn('student_progress', 'engagement_level', 'REAL');
  ensureSQLiteColumn('student_progress', 'synced', 'INTEGER DEFAULT 0');
  ensureSQLiteColumn('student_progress', 'quiz_id', 'TEXT');
  ensureSQLiteColumn('student_progress', 'progress_percentage', 'INTEGER');
  ensureSQLiteColumn('student_progress', 'concept_tags', 'TEXT');
  ensureSQLiteColumn('student_progress', 'error_type', 'TEXT');

  // badges
  ensureSQLiteColumn('badges', 'description', 'TEXT');
  ensureSQLiteColumn('badges', 'synced', 'INTEGER DEFAULT 0');

  // leaderboard
  ensureSQLiteColumn('leaderboard', 'rank_position', 'INTEGER');
  // Ensure unique index for upserts on leaderboard by student
  sqliteDb.run(
    'CREATE UNIQUE INDEX IF NOT EXISTS leaderboard_student_id_unique ON leaderboard(student_id)',
    (err) => { if (err) console.error('Failed to create leaderboard unique index:', err.message); }
  );
}

function recreateUsersTable() {
  // Create a backup table
  sqliteDb.run(`CREATE TABLE users_backup AS SELECT * FROM users`, (err) => {
    if (err) {
      console.error('Failed to create backup table:', err.message);
      return;
    }
    
    // Drop the old table
    sqliteDb.run(`DROP TABLE users`, (err) => {
      if (err) {
        console.error('Failed to drop old users table:', err.message);
        return;
      }
      
      // Create the new table with all roles
      sqliteDb.run(`CREATE TABLE users (
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
        phone TEXT,
        address TEXT,
        language TEXT DEFAULT 'en',
        profile_photo TEXT,
        roll_number TEXT,
        department TEXT,
        subjects_taught TEXT,
        classes_handled TEXT,
        FOREIGN KEY (school_id) REFERENCES schools (id) ON DELETE SET NULL
      )`, (err) => {
        if (err) {
          console.error('Failed to create new users table:', err.message);
          return;
        }
        
        // Copy data back from backup
        sqliteDb.run(`INSERT INTO users SELECT * FROM users_backup`, (err) => {
          if (err) {
            console.error('Failed to restore data:', err.message);
          } else {
            console.log('Users table recreated successfully');
          }
          
          // Drop backup table
          sqliteDb.run(`DROP TABLE users_backup`);
        });
      });
    });
  });
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
      phone VARCHAR(20),
      address TEXT,
      language VARCHAR(10) DEFAULT 'en',
      profile_photo VARCHAR(500),
      roll_number VARCHAR(50),
      department VARCHAR(100),
      subjects_taught TEXT,
      classes_handled TEXT,
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
      grade INT NOT NULL DEFAULT 0,
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
      concept_tags TEXT,
      error_type VARCHAR(100),
      CONSTRAINT fk_sp_student FOREIGN KEY (student_id) REFERENCES users (id) ON DELETE CASCADE,
      CONSTRAINT fk_sp_lesson FOREIGN KEY (lesson_id) REFERENCES lessons (id) ON DELETE CASCADE
    )`,

    // concept_mastery
    `CREATE TABLE IF NOT EXISTS concept_mastery (
      id VARCHAR(255) PRIMARY KEY,
      student_id VARCHAR(255) NOT NULL,
      concept_name VARCHAR(255) NOT NULL,
      mastery_level FLOAT CHECK(mastery_level >= 0 AND mastery_level <= 1),
      confidence_score FLOAT CHECK(confidence_score >= 0 AND confidence_score <= 1),
      last_practiced TIMESTAMP NULL,
      attempts_count INT DEFAULT 0,
      correct_count INT DEFAULT 0,
      average_time_spent FLOAT,
      CONSTRAINT fk_cm_student FOREIGN KEY (student_id) REFERENCES users (id) ON DELETE CASCADE
    )`,

    // student_learning_profile
    `CREATE TABLE IF NOT EXISTS student_learning_profile (
      id VARCHAR(255) PRIMARY KEY,
      student_id VARCHAR(255) UNIQUE NOT NULL,
      preferred_learning_style ENUM('visual','kinesthetic','reading','mixed'),
      average_learning_velocity FLOAT,
      optimal_difficulty_level FLOAT CHECK(optimal_difficulty_level >= 0 AND optimal_difficulty_level <= 1),
      engagement_score FLOAT CHECK(engagement_score >= 0 AND engagement_score <= 1),
      last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_slp_student FOREIGN KEY (student_id) REFERENCES users (id) ON DELETE CASCADE
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
  // Create demo users
  const demoUsers = [
    {
      id: 'demo_teacher_001',
      name: 'Teacher Kumar',
      email: 'teacher@demo.com',
      password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
      role: 'teacher',
      department: 'Mathematics',
      subjects_taught: JSON.stringify(['Mathematics', 'Physics']),
      classes_handled: JSON.stringify(['Class 9', 'Class 10']),
      phone: '+91 9876543210',
      address: 'Demo School, Demo City',
      language: 'en'
    },
    {
      id: 'demo_student_001',
      name: 'Student Priya',
      email: 'student@demo.com',
      password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
      role: 'student',
      class: '9',
      roll_number: 'STU001',
      phone: '+91 9876543211',
      address: 'Student Address, Demo City',
      language: 'en'
    },
    {
      id: 'demo_student_002',
      name: 'Arjun Sharma',
      email: 'arjun@demo.com',
      password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
      role: 'student',
      class: '10',
      roll_number: 'STU002',
      phone: '+91 9876543214',
      address: '123 Gandhi Nagar, Mumbai',
      language: 'hi'
    },
    {
      id: 'demo_student_003',
      name: 'Meera Patel',
      email: 'meera@demo.com',
      password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
      role: 'student',
      class: '8',
      roll_number: 'STU003',
      phone: '+91 9876543215',
      address: '456 Nehru Street, Delhi',
      language: 'en'
    },
    {
      id: 'demo_student_004',
      name: 'Rahul Singh',
      email: 'rahul@demo.com',
      password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
      role: 'student',
      class: '9',
      roll_number: 'STU004',
      phone: '+91 9876543216',
      address: '789 Tagore Road, Bangalore',
      language: 'en'
    },
    {
      id: 'demo_student_005',
      name: 'Sneha Reddy',
      email: 'sneha@demo.com',
      password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
      role: 'student',
      class: '10',
      roll_number: 'STU005',
      phone: '+91 9876543217',
      address: '321 Rajiv Gandhi Avenue, Chennai',
      language: 'en'
    },
    {
      id: 'demo_student_006',
      name: 'Vikram Kumar',
      email: 'vikram@demo.com',
      password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
      role: 'student',
      class: '8',
      roll_number: 'STU006',
      phone: '+91 9876543218',
      address: '654 Indira Colony, Kolkata',
      language: 'hi'
    },
    // Grade 6 Students
    {
      id: 'demo_student_007',
      name: 'Aanya Gupta',
      email: 'aanya.gupta@demo.com',
      password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
      role: 'student',
      class: '6',
      roll_number: 'STU007',
      phone: '+91 9876543219',
      address: '101 Rajpath, New Delhi',
      language: 'en'
    },
    {
      id: 'demo_student_008',
      name: 'Karan Verma',
      email: 'karan.verma@demo.com',
      password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
      role: 'student',
      class: '6',
      roll_number: 'STU008',
      phone: '+91 9876543220',
      address: '202 MG Road, Mumbai',
      language: 'hi'
    },
    {
      id: 'demo_student_009',
      name: 'Priya Nair',
      email: 'priya.nair@demo.com',
      password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
      role: 'student',
      class: '6',
      roll_number: 'STU009',
      phone: '+91 9876543221',
      address: '303 Brigade Road, Bangalore',
      language: 'en'
    },
    {
      id: 'demo_student_010',
      name: 'Rohan Desai',
      email: 'rohan.desai@demo.com',
      password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
      role: 'student',
      class: '6',
      roll_number: 'STU010',
      phone: '+91 9876543222',
      address: '404 Park Street, Kolkata',
      language: 'en'
    },
    {
      id: 'demo_student_011',
      name: 'Sakshi Joshi',
      email: 'sakshi.joshi@demo.com',
      password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
      role: 'student',
      class: '6',
      roll_number: 'STU011',
      phone: '+91 9876543223',
      address: '505 Anna Salai, Chennai',
      language: 'hi'
    },
    // Grade 7 Students
    {
      id: 'demo_student_012',
      name: 'Aditya Iyer',
      email: 'aditya.iyer@demo.com',
      password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
      role: 'student',
      class: '7',
      roll_number: 'STU012',
      phone: '+91 9876543224',
      address: '606 Connaught Place, New Delhi',
      language: 'en'
    },
    {
      id: 'demo_student_013',
      name: 'Kavya Reddy',
      email: 'kavya.reddy@demo.com',
      password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
      role: 'student',
      class: '7',
      roll_number: 'STU013',
      phone: '+91 9876543225',
      address: '707 Linking Road, Mumbai',
      language: 'en'
    },
    {
      id: 'demo_student_014',
      name: 'Manish Agarwal',
      email: 'manish.agarwal@demo.com',
      password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
      role: 'student',
      class: '7',
      roll_number: 'STU014',
      phone: '+91 9876543226',
      address: '808 Commercial Street, Bangalore',
      language: 'hi'
    },
    {
      id: 'demo_student_015',
      name: 'Neha Kapoor',
      email: 'neha.kapoor@demo.com',
      password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
      role: 'student',
      class: '7',
      roll_number: 'STU015',
      phone: '+91 9876543227',
      address: '909 Salt Lake, Kolkata',
      language: 'en'
    },
    {
      id: 'demo_student_016',
      name: 'Omkar Tiwari',
      email: 'omkar.tiwari@demo.com',
      password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
      role: 'student',
      class: '7',
      roll_number: 'STU016',
      phone: '+91 9876543228',
      address: '1010 T Nagar, Chennai',
      language: 'hi'
    },
    // Grade 8 Students (additional to existing Vikram)
    {
      id: 'demo_student_027',
      name: 'Qureshi Ahmed',
      email: 'qureshi.ahmed@demo.com',
      password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
      role: 'student',
      class: '8',
      roll_number: 'STU027',
      phone: '+91 9876543239',
      address: '2121 Hauz Khas, New Delhi',
      language: 'hi'
    },
    {
      id: 'demo_student_028',
      name: 'Riya Malhotra',
      email: 'riya.malhotra@demo.com',
      password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
      role: 'student',
      class: '8',
      roll_number: 'STU028',
      phone: '+91 9876543240',
      address: '2222 Juhu, Mumbai',
      language: 'en'
    },
    {
      id: 'demo_student_029',
      name: 'Siddharth Bhatia',
      email: 'siddharth.bhatia@demo.com',
      password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
      role: 'student',
      class: '8',
      roll_number: 'STU029',
      phone: '+91 9876543241',
      address: '2323 Whitefield, Bangalore',
      language: 'en'
    },
    {
      id: 'demo_student_030',
      name: 'Tanya Verma',
      email: 'tanya.verma@demo.com',
      password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
      role: 'student',
      class: '8',
      roll_number: 'STU030',
      phone: '+91 9876543242',
      address: '2424 Sector V, Kolkata',
      language: 'hi'
    },
    // Grade 9 Students (additional to existing Rahul)
    {
      id: 'demo_student_031',
      name: 'Uday Chopra',
      email: 'uday.chopra@demo.com',
      password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
      role: 'student',
      class: '9',
      roll_number: 'STU031',
      phone: '+91 9876543243',
      address: '2525 Karol Bagh, New Delhi',
      language: 'en'
    },
    {
      id: 'demo_student_032',
      name: 'Varsha Iyer',
      email: 'varsha.iyer@demo.com',
      password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
      role: 'student',
      class: '9',
      roll_number: 'STU032',
      phone: '+91 9876543244',
      address: '2626 Andheri, Mumbai',
      language: 'en'
    },
    {
      id: 'demo_student_033',
      name: 'Waseem Khan',
      email: 'waseem.khan@demo.com',
      password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
      role: 'student',
      class: '9',
      roll_number: 'STU033',
      phone: '+91 9876543245',
      address: '2727 Electronic City, Bangalore',
      language: 'hi'
    },
    {
      id: 'demo_student_034',
      name: 'Xavier D\'Souza',
      email: 'xavier.dsouza@demo.com',
      password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
      role: 'student',
      class: '9',
      roll_number: 'STU034',
      phone: '+91 9876543246',
      address: '2828 Park Circus, Kolkata',
      language: 'en'
    },
    // Grade 10 Students (additional to existing Arjun and Sneha)
    {
      id: 'demo_student_035',
      name: 'Yashika Gupta',
      email: 'yashika.gupta@demo.com',
      password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
      role: 'student',
      class: '10',
      roll_number: 'STU035',
      phone: '+91 9876543247',
      address: '2929 Greater Kailash, New Delhi',
      language: 'en'
    },
    {
      id: 'demo_student_036',
      name: 'Zara Sheikh',
      email: 'zara.sheikh@demo.com',
      password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
      role: 'student',
      class: '10',
      roll_number: 'STU036',
      phone: '+91 9876543248',
      address: '3030 Worli, Mumbai',
      language: 'hi'
    },
    {
      id: 'demo_student_037',
      name: 'Aarav Joshi',
      email: 'aarav.joshi@demo.com',
      password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
      role: 'student',
      class: '10',
      roll_number: 'STU037',
      phone: '+91 9876543249',
      address: '3131 HSR Layout, Bangalore',
      language: 'en'
    },
    {
      id: 'demo_student_038',
      name: 'Bhavya Reddy',
      email: 'bhavya.reddy@demo.com',
      password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
      role: 'student',
      class: '10',
      roll_number: 'STU038',
      phone: '+91 9876543250',
      address: '3232 Salt Lake Sector 2, Kolkata',
      language: 'hi'
    },
    {
      id: 'demo_student_039',
      name: 'Chetan Agarwal',
      email: 'chetan.agarwal@demo.com',
      password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
      role: 'student',
      class: '10',
      roll_number: 'STU039',
      phone: '+91 9876543251',
      address: '3333 Mylapore, Chennai',
      language: 'en'
    },
    // Grade 11 Students
    {
      id: 'demo_student_017',
      name: 'Ananya Singh',
      email: 'ananya.singh@demo.com',
      password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
      role: 'student',
      class: '11',
      roll_number: 'STU017',
      phone: '+91 9876543229',
      address: '1111 CP, New Delhi',
      language: 'en'
    },
    {
      id: 'demo_student_018',
      name: 'Dhruv Mehta',
      email: 'dhruv.mehta@demo.com',
      password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
      role: 'student',
      class: '11',
      roll_number: 'STU018',
      phone: '+91 9876543230',
      address: '1212 Bandra, Mumbai',
      language: 'en'
    },
    {
      id: 'demo_student_019',
      name: 'Isha Choudhary',
      email: 'isha.choudhary@demo.com',
      password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
      role: 'student',
      class: '11',
      roll_number: 'STU019',
      phone: '+91 9876543231',
      address: '1313 Koramangala, Bangalore',
      language: 'hi'
    },
    {
      id: 'demo_student_020',
      name: 'Jatin Shah',
      email: 'jatin.shah@demo.com',
      password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
      role: 'student',
      class: '11',
      roll_number: 'STU020',
      phone: '+91 9876543232',
      address: '1414 Salt Lake, Kolkata',
      language: 'en'
    },
    {
      id: 'demo_student_021',
      name: 'Kritika Jain',
      email: 'kritika.jain@demo.com',
      password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
      role: 'student',
      class: '11',
      roll_number: 'STU021',
      phone: '+91 9876543233',
      address: '1515 Adyar, Chennai',
      language: 'en'
    },
    // Grade 12 Students
    {
      id: 'demo_student_022',
      name: 'Lakshya Agarwal',
      email: 'lakshya.agarwal@demo.com',
      password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
      role: 'student',
      class: '12',
      roll_number: 'STU022',
      phone: '+91 9876543234',
      address: '1616 Lajpat Nagar, New Delhi',
      language: 'en'
    },
    {
      id: 'demo_student_023',
      name: 'Maya Nair',
      email: 'maya.nair@demo.com',
      password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
      role: 'student',
      class: '12',
      roll_number: 'STU023',
      phone: '+91 9876543235',
      address: '1717 Powai, Mumbai',
      language: 'en'
    },
    {
      id: 'demo_student_024',
      name: 'Nikhil Rao',
      email: 'nikhil.rao@demo.com',
      password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
      role: 'student',
      class: '12',
      roll_number: 'STU024',
      phone: '+91 9876543236',
      address: '1818 Indiranagar, Bangalore',
      language: 'hi'
    },
    {
      id: 'demo_student_025',
      name: 'Ojasvi Patel',
      email: 'ojasvi.patel@demo.com',
      password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
      role: 'student',
      class: '12',
      roll_number: 'STU025',
      phone: '+91 9876543237',
      address: '1919 New Town, Kolkata',
      language: 'en'
    },
    {
      id: 'demo_student_026',
      name: 'Pranav Kumar',
      email: 'pranav.kumar@demo.com',
      password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
      role: 'student',
      class: '12',
      roll_number: 'STU026',
      phone: '+91 9876543238',
      address: '2020 Velachery, Chennai',
      language: 'hi'
    },
    {
      id: 'demo_school_001',
      name: 'School Admin',
      email: 'school@demo.com',
      password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
      role: 'school',
      phone: '+91 9876543212',
      address: 'Demo School Address',
      language: 'en'
    },
    {
      id: 'demo_admin_001',
      name: 'Platform Admin',
      email: 'admin@demo.com',
      password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
      role: 'admin',
      phone: '+91 9876543213',
      address: 'Admin Office',
      language: 'en'
    }
  ];

  // Insert demo users
  demoUsers.forEach(user => {
    sqliteDb.run(
      `INSERT OR REPLACE INTO users (id, name, email, password_hash, role, class, roll_number, department, subjects_taught, classes_handled, phone, address, language) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [user.id, user.name, user.email, user.password_hash, user.role, user.class || null, user.roll_number || null, 
       user.department || null, user.subjects_taught || null, user.classes_handled || null, user.phone || null, 
       user.address || null, user.language || 'en']
    );
  });

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
      total_points: 20,
      grade: 6
    }
  ];

  sampleLessons.forEach(lesson => {
    sqliteDb.run(
      'INSERT OR REPLACE INTO lessons (id, title, content, subject, difficulty) VALUES (?, ?, ?, ?, ?)',
      [lesson.id, lesson.title, lesson.content, lesson.subject, lesson.difficulty]
    );
  });

  sampleQuizzes.forEach(quiz => {
    // Detect if grade column exists first to avoid errors on older DBs
    sqliteDb.all('PRAGMA table_info(quizzes)', (err, rows) => {
      const hasGrade = !err && Array.isArray(rows) && rows.some(r => r.name === 'grade');
      if (hasGrade) {
        sqliteDb.run(
          'INSERT OR REPLACE INTO quizzes (id, lesson_id, questions, total_points, grade) VALUES (?, ?, ?, ?, ?)',
          [quiz.id, quiz.lesson_id, quiz.questions, quiz.total_points, quiz.grade]
        );
      } else {
        sqliteDb.run(
          'INSERT OR REPLACE INTO quizzes (id, lesson_id, questions, total_points) VALUES (?, ?, ?, ?)',
          [quiz.id, quiz.lesson_id, quiz.questions, quiz.total_points]
        );
      }
    });
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
app.get('/api/lessons', authenticateToken, (req, res) => {
  sqliteDb.all('SELECT * FROM lessons ORDER BY difficulty, title', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get quizzes
app.get('/api/quizzes/:lessonId', authenticateToken, (req, res) => {
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

// --- Badge & Points System ---
function getBadgeForPoints(points) {
  if (points >= 300) return 'Champion';
  if (points >= 150) return 'Achiever';
  if (points >= 50) return 'Learner';
  return 'Beginner';
}

// Add points and possibly award a badge
app.post('/api/quiz-complete', authenticateToken, (req, res) => {
  const studentId = req.user?.id;
  const score = typeof req.body?.score === 'number' ? req.body.score : NaN;
  const lessonId = req.body?.lessonId;
  const timeSpent = typeof req.body?.timeSpent === 'number' ? req.body.timeSpent : 0;
  if (!studentId) return res.status(401).json({ error: 'Unauthorized' });
  if (!Number.isFinite(score) || score < 0) return res.status(400).json({ error: 'Invalid score' });

  sqliteDb.serialize(() => {
    sqliteDb.get('SELECT total_points FROM users WHERE id = ?', [studentId], (err, userRow) => {
      if (err) return res.status(500).json({ error: err.message });
      const prevPoints = userRow?.total_points || 0;
      const newPoints = prevPoints + score;

      sqliteDb.run('UPDATE users SET total_points = ? WHERE id = ?', [newPoints, studentId], (err2) => {
        if (err2) return res.status(500).json({ error: err2.message });

        // Upsert leaderboard total_points
        sqliteDb.run(
          `INSERT INTO leaderboard (student_id, total_points, level, updated_at)
           VALUES (?, ?, 1, CURRENT_TIMESTAMP)
           ON CONFLICT(student_id) DO UPDATE SET total_points = excluded.total_points, updated_at = CURRENT_TIMESTAMP`,
          [studentId, newPoints],
          (err3) => {
            if (err3) return res.status(500).json({ error: err3.message });
            // Optionally record progress
            if (lessonId) {
              // Ensure lesson exists (light upsert)
              sqliteDb.run(
                `INSERT OR IGNORE INTO lessons (id, title, content, subject, difficulty) VALUES (?, ?, ?, ?, 1)`,
                [
                  lessonId,
                  String(lessonId),
                  'Auto-created from game session',
                  'General'
                ],
                () => {}
              );
              const progressId = `${studentId}-${lessonId}`;
              sqliteDb.run(
                `INSERT OR REPLACE INTO student_progress (id, student_id, lesson_id, score, time_spent, completed_at, attempts)
                 VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP,
                   COALESCE((SELECT attempts FROM student_progress WHERE id = ?), 0) + 1
                 )`,
                [progressId, studentId, lessonId, score, timeSpent, progressId],
                (e) => { if (e) console.error('progress upsert error:', e.message); }
              );
            }

            const prevBadge = getBadgeForPoints(prevPoints);
            const newBadge = getBadgeForPoints(newPoints);
            if (newBadge !== prevBadge && newBadge !== 'Beginner') {
              sqliteDb.run(
                'INSERT INTO badges (id, student_id, badge_name, description, earned_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)',
                [`${studentId}-${newBadge}-${Date.now()}`, studentId, newBadge, `Reached ${newBadge} level`],
                (err4) => {
                  if (err4) console.error('Badge insert failed:', err4.message);
                  return res.json({ success: true, points: newPoints, badge: newBadge });
                }
              );
            } else {
              return res.json({ success: true, points: newPoints, badge: newBadge });
            }
          }
        );
      });
    });
  });
});

// Get current badge for a user
app.get('/api/get-badge/:userId', authenticateToken, (req, res) => {
  const studentId = req.params.userId;
  sqliteDb.get('SELECT total_points FROM users WHERE id = ?', [studentId], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    const points = row?.total_points || 0;
    const badge = getBadgeForPoints(points);
    return res.json({ points, badge });
  });
});

// Get quizzes in normalized question format (v2)
// Shape per item: { id, grade, subject, text, choices, answerIndex, difficulty, ncert, explanation }
app.get('/api/quizzes-v2/:lessonId', authenticateToken, (req, res) => {
  const { lessonId } = req.params;

  const getLesson = () => new Promise((resolve, reject) => {
    sqliteDb.get('SELECT id, subject, difficulty FROM lessons WHERE id = ?', [lessonId], (e, lesson) => {
      if (e) return reject(e);
      resolve(lesson || null);
    });
  });

  const getQuiz = () => new Promise((resolve, reject) => {
    sqliteDb.get('SELECT id, lesson_id, questions, total_points, grade FROM quizzes WHERE lesson_id = ?', [lessonId], (e, quiz) => {
      if (e) return reject(e);
      resolve(quiz || null);
    });
  });

  const mapDifficulty = (num) => {
    if (num === 1) return 'easy';
    if (num === 2) return 'medium';
    return 'hard';
  };

  Promise.all([getLesson(), getQuiz()])
    .then(([lesson, quiz]) => {
      if (!lesson || !quiz) {
        return res.json([]);
      }
      let items = [];
      try {
        const parsed = typeof quiz.questions === 'string' ? JSON.parse(quiz.questions) : quiz.questions;
        if (Array.isArray(parsed)) {
          items = parsed.map((q) => ({
            id: q.id,
            grade: typeof quiz.grade === 'number' ? quiz.grade : 0,
            subject: lesson.subject,
            text: q.question,
            choices: q.options,
            answerIndex: typeof q.correctAnswer === 'number' ? q.correctAnswer : 0,
            difficulty: mapDifficulty(lesson.difficulty || 1),
            ncert: true,
            explanation: q.explanation || ''
          }));
        }
      } catch (e) {
        return res.status(500).json({ error: 'Failed to parse quiz questions' });
      }
      return res.json(items);
    })
    .catch((error) => {
      return res.status(500).json({ error: error.message || 'Failed to load quiz' });
    });
});

// Get leaderboard
app.get('/api/leaderboard', authenticateToken, async (req, res) => {
  try {
    const { class: className } = req.query;
    
    // SQLite version using users.total_points
    let query = `SELECT u.id as id, u.name as name, COALESCE(u.class,'-') as class, COALESCE(u.total_points,0) as total_points
                 FROM users u WHERE u.role = 'student'`;
    const params = [];
    if (className) {
      query += ` AND u.class = ?`;
      params.push(className);
    }
    query += ` ORDER BY u.class, total_points DESC, name ASC`;

    sqliteDb.all(query, params, (err, rows) => {
      if (err) {
        console.error('SQLite leaderboard query error:', err);
        return res.status(500).json({ error: err.message });
      }
      // Rank within class
      const classGroups = {};
      rows.forEach(row => {
        if (!classGroups[row.class]) classGroups[row.class] = [];
        classGroups[row.class].push(row);
      });
      const result = [];
      Object.keys(classGroups).forEach(cls => {
        const students = classGroups[cls];
        students.forEach((s, idx) => {
          result.push({ id: s.id, rank: idx + 1, name: s.name, class: s.class, points: s.total_points });
        });
      });
      res.json(result);
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Get user progress list
app.get('/api/user-progress', authenticateToken, (req, res) => {
  const studentId = req.user?.id;
  if (!studentId) return res.status(401).json({ error: 'Unauthorized' });
  sqliteDb.all(
    `SELECT lesson_id, score, time_spent, completed_at FROM student_progress WHERE student_id = ? ORDER BY datetime(completed_at) DESC`,
    [studentId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows || []);
    }
  );
});

// Cumulative per-quiz progress: save/update by (student_id + quiz_id)
app.post('/api/progress', authenticateToken, (req, res) => {
  const studentId = req.user?.id;
  const { lessonId, quizId, score, completed } = req.body || {};
  if (!studentId) return res.status(401).json({ error: 'Unauthorized' });
  if (!lessonId || !quizId) return res.status(400).json({ error: 'lessonId and quizId are required' });

  // progress_percentage: 100 if completed true else Math.max(score, 0) or 0
  const pct = completed === true ? 100 : (typeof score === 'number' && score >= 0 ? Math.min(100, Math.round(score)) : 0);
  const id = `${studentId}-${quizId}`;

  sqliteDb.run(
    `INSERT OR REPLACE INTO student_progress (id, student_id, lesson_id, score, time_spent, completed_at, attempts, quiz_id, progress_percentage)
     VALUES (?, ?, ?, COALESCE(?,0), COALESCE(?,0), CURRENT_TIMESTAMP,
       COALESCE((SELECT attempts FROM student_progress WHERE id = ?), 0) + 1,
       ?, ?)
    `,
    [id, studentId, lessonId, score || 0, 0, id, quizId, pct],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      return res.json({ success: true });
    }
  );
});

// Count per-lesson quiz completion summary
app.get('/api/progress/:studentId/:lessonId', authenticateToken, (req, res) => {
  const { studentId, lessonId } = req.params;
  if (!studentId || !lessonId) return res.status(400).json({ error: 'studentId and lessonId required' });
  sqliteDb.all(
    `SELECT COUNT(*) as total,
            SUM(CASE WHEN progress_percentage >= 100 THEN 1 ELSE 0 END) as completed
       FROM student_progress
      WHERE student_id = ? AND lesson_id = ?`,
    [studentId, lessonId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      const total = rows?.[0]?.total || 0;
      const completed = rows?.[0]?.completed || 0;
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
      res.json({ completed, total, percentage });
    }
  );
});

// Quizzes by grade, subject, and chapter from centralized Questions.json
app.get('/api/quizzes', (req, res) => {
  try {
    const gradeParam = req.query.grade;
    const subjectParam = req.query.subject;
    const chapterParam = req.query.chapter;
    const grade = Number(gradeParam);
    
    if (!gradeParam || Number.isNaN(grade) || !subjectParam) {
      return res.status(400).json({ error: 'grade (number) and subject are required' });
    }

    // Load questions fresh each request to reflect file changes
    // Serve from public/games/Questions.json so Vite and static build share source
    const filePath = path.join(__dirname, '..', 'public', 'games', 'Questions.json');
    console.log('Looking for Questions.json at:', filePath);
    console.log('File exists:', require('fs').existsSync(filePath));
    const raw = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(raw);
    console.log('Questions data loaded, structure:', Object.keys(data));

    // Navigate to the specific grade, subject, and chapter
    const gradeKey = String(grade);
    const subjectKey = String(subjectParam);
    const chapterKey = String(chapterParam || '');

    console.log('Quiz request:', { gradeKey, subjectKey, chapterKey });
    console.log('Available grades:', Object.keys(data.questions_by_grade || {}));
    if (data.questions_by_grade && data.questions_by_grade[gradeKey]) {
      console.log('Available subjects for grade', gradeKey, ':', Object.keys(data.questions_by_grade[gradeKey]));
    }

    let questions = [];

    if (data.questions_by_grade && 
        data.questions_by_grade[gradeKey] && 
        data.questions_by_grade[gradeKey][subjectKey]) {
      
      if (chapterKey && data.questions_by_grade[gradeKey][subjectKey][chapterKey]) {
        // Return questions for specific chapter
        questions = data.questions_by_grade[gradeKey][subjectKey][chapterKey];
      } else {
        // Return all questions for the subject (all chapters combined)
        const subjectData = data.questions_by_grade[gradeKey][subjectKey];
        questions = [];
        Object.keys(subjectData).forEach(chapter => {
          if (Array.isArray(subjectData[chapter])) {
            questions.push(...subjectData[chapter]);
          }
        });
      }
    }

    // Fallback to old format if new format doesn't exist
    if (questions.length === 0) {
      const subjectLower = String(subjectParam).toLowerCase();
      const unwrap = (payload) => {
        if (Array.isArray(payload)) return payload;
        if (Array.isArray(payload?.questions)) return payload.questions;
        if (payload?.questions_by_grade && typeof payload.questions_by_grade === 'object') {
          const arr = [];
          Object.keys(payload.questions_by_grade).forEach((k) => {
            const list = payload.questions_by_grade[k];
            if (Array.isArray(list)) arr.push(...list);
          });
          return arr;
        }
        return [];
      };

      const list = unwrap(data);
      questions = list.filter((q) => {
        const qGrade = typeof q.grade === 'number' ? q.grade : Number(q.grade);
        const qSubject = (q.subject || '').toString().toLowerCase();
        return qGrade === grade && qSubject === subjectLower;
      });
    }

    return res.json(questions);
  } catch (e) {
    console.error('Quizzes endpoint error:', e);
    return res.status(500).json({ error: 'Failed to load quizzes' });
  }
});

// Get teacher analytics
app.get('/api/analytics/:teacherId', authenticateToken, requireRole('teacher'), (req, res) => {
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

// Get current user profile (me)
app.get('/api/users/me', authenticateToken, (req, res) => {
  const userId = req.user.id;
  
  sqliteDb.get(
    `SELECT id, name, email, role, class, school_id, created_at, last_login, status,
            phone, address, language, profile_photo, roll_number, department, 
            subjects_taught, classes_handled, total_points
     FROM users WHERE id = ?`,
    [userId],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Parse JSON fields
      if (user.subjects_taught) {
        try {
          user.subjects_taught = JSON.parse(user.subjects_taught);
        } catch (e) {
          user.subjects_taught = [];
        }
      } else {
        user.subjects_taught = [];
      }

      if (user.classes_handled) {
        try {
          user.classes_handled = JSON.parse(user.classes_handled);
        } catch (e) {
          user.classes_handled = [];
        }
      } else {
        user.classes_handled = [];
      }

      // Get additional data based on role
      if (user.role === 'student') {
        // Get student progress and badges
        sqliteDb.all(
          `SELECT 
            COUNT(DISTINCT sp.lesson_id) as lessons_completed,
            AVG(sp.score) as average_score,
            SUM(sp.time_spent) as total_time_spent,
            COUNT(DISTINCT sp.id) as total_attempts
           FROM student_progress sp 
           WHERE sp.student_id = ?`,
          [userId],
          (err, progress) => {
            if (err) {
              console.error('Error fetching student progress:', err);
              user.progress = { lessons_completed: 0, average_score: 0, total_time_spent: 0, total_attempts: 0 };
            } else {
              user.progress = progress[0] || { lessons_completed: 0, average_score: 0, total_time_spent: 0, total_attempts: 0 };
            }

            // Get badges
            sqliteDb.all(
              `SELECT badge_name, description, earned_at FROM badges WHERE student_id = ? ORDER BY earned_at DESC`,
              [userId],
              (err, badges) => {
                if (err) {
                  console.error('Error fetching badges:', err);
                  user.badges = [];
                } else {
                  user.badges = badges;
                }
                res.json(user);
              }
            );
          }
        );
      } else if (user.role === 'teacher') {
        // Get teacher analytics
        sqliteDb.all(
          `SELECT 
            COUNT(DISTINCT u.id) as total_students,
            COUNT(DISTINCT sp.lesson_id) as lessons_taught,
            AVG(sp.score) as average_class_score
           FROM users u
           LEFT JOIN student_progress sp ON u.id = sp.student_id
           WHERE u.role = 'student' AND u.school_id = (
             SELECT school_id FROM users WHERE id = ?
           )`,
          [userId],
          (err, analytics) => {
            if (err) {
              console.error('Error fetching teacher analytics:', err);
              user.analytics = { total_students: 0, lessons_taught: 0, average_class_score: 0 };
            } else {
              user.analytics = analytics[0] || { total_students: 0, lessons_taught: 0, average_class_score: 0 };
            }
            res.json(user);
          }
        );
      } else {
        res.json(user);
      }
    }
  );
});

// Get current user profile (alias for /api/users/me)
app.get('/api/user/profile', authenticateToken, (req, res) => {
  const userId = req.user.id;
  
  sqliteDb.get(
    `SELECT id, name, email, role, class, school_id, created_at, last_login, status,
            phone, address, language, profile_photo, roll_number, department, 
            subjects_taught, classes_handled
     FROM users WHERE id = ?`,
    [userId],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Parse JSON fields
      if (user.subjects_taught) {
        try {
          user.subjects_taught = JSON.parse(user.subjects_taught);
        } catch (e) {
          user.subjects_taught = [];
        }
      } else {
        user.subjects_taught = [];
      }

      if (user.classes_handled) {
        try {
          user.classes_handled = JSON.parse(user.classes_handled);
        } catch (e) {
          user.classes_handled = [];
        }
      } else {
        user.classes_handled = [];
      }

      // Get additional data based on role
      if (user.role === 'student') {
        // Get student progress and badges
        sqliteDb.all(
          `SELECT 
            COUNT(DISTINCT sp.lesson_id) as lessons_completed,
            AVG(sp.score) as average_score,
            SUM(sp.time_spent) as total_time_spent,
            COUNT(DISTINCT sp.id) as total_attempts
           FROM student_progress sp 
           WHERE sp.student_id = ?`,
          [userId],
          (err, progressData) => {
            if (err) {
              console.error('Error fetching student progress:', err);
              return res.json(user);
            }

            if (progressData && progressData.length > 0) {
              const progress = progressData[0];
              user.lessons_completed = progress.lessons_completed || 0;
              user.average_score = Math.round(progress.average_score || 0);
              user.total_time_spent = progress.total_time_spent || 0;
              user.total_attempts = progress.total_attempts || 0;
            } else {
              user.lessons_completed = 0;
              user.average_score = 0;
              user.total_time_spent = 0;
              user.total_attempts = 0;
            }

            // Get badges
            sqliteDb.all(
              `SELECT badge_name, earned_at FROM student_badges WHERE student_id = ? ORDER BY earned_at DESC`,
              [userId],
              (err, badges) => {
                if (err) {
                  console.error('Error fetching badges:', err);
                  user.badges = [];
                } else {
                  user.badges = badges || [];
                }
                res.json(user);
              }
            );
          }
        );
      } else if (user.role === 'teacher') {
        // Get teacher-specific data
        sqliteDb.all(
          `SELECT COUNT(*) as students_count FROM users WHERE school_id = ? AND role = 'student'`,
          [user.school_id],
          (err, countData) => {
            if (err) {
              console.error('Error fetching student count:', err);
              user.students_count = 0;
            } else {
              user.students_count = countData[0]?.students_count || 0;
            }
            res.json(user);
          }
        );
      } else {
        res.json(user);
      }
    }
  );
});

// Get user profile
app.get('/api/users/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const requestingUserId = req.user.id;
  
  // Users can only access their own profile unless they're admin
  if (requestingUserId !== id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  sqliteDb.get(
    `SELECT id, name, email, role, class, school_id, created_at, last_login, status,
            phone, address, language, profile_photo, roll_number, department, 
            subjects_taught, classes_handled, total_points
     FROM users WHERE id = ?`,
    [id],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Parse JSON fields
      if (user.subjects_taught) {
        try {
          user.subjects_taught = JSON.parse(user.subjects_taught);
        } catch (e) {
          user.subjects_taught = [];
        }
      } else {
        user.subjects_taught = [];
      }

      if (user.classes_handled) {
        try {
          user.classes_handled = JSON.parse(user.classes_handled);
        } catch (e) {
          user.classes_handled = [];
        }
      } else {
        user.classes_handled = [];
      }

      // Get additional data based on role
      if (user.role === 'student') {
        // Get student progress and badges
        sqliteDb.all(
          `SELECT 
            COUNT(DISTINCT sp.lesson_id) as lessons_completed,
            AVG(sp.score) as average_score,
            SUM(sp.time_spent) as total_time_spent,
            COUNT(DISTINCT sp.id) as total_attempts
           FROM student_progress sp 
           WHERE sp.student_id = ?`,
          [id],
          (err, progress) => {
            if (err) {
              console.error('Error fetching student progress:', err);
              user.progress = { lessons_completed: 0, average_score: 0, total_time_spent: 0, total_attempts: 0 };
            } else {
              user.progress = progress[0] || { lessons_completed: 0, average_score: 0, total_time_spent: 0, total_attempts: 0 };
            }

            // Get badges
            sqliteDb.all(
              `SELECT badge_name, description, earned_at FROM badges WHERE student_id = ? ORDER BY earned_at DESC`,
              [id],
              (err, badges) => {
                if (err) {
                  console.error('Error fetching badges:', err);
                  user.badges = [];
                } else {
                  user.badges = badges;
                }
                res.json(user);
              }
            );
          }
        );
      } else if (user.role === 'teacher') {
        // Get teacher analytics
        sqliteDb.all(
          `SELECT 
            COUNT(DISTINCT u.id) as total_students,
            COUNT(DISTINCT sp.lesson_id) as lessons_taught,
            AVG(sp.score) as average_class_score
           FROM users u
           LEFT JOIN student_progress sp ON u.id = sp.student_id
           WHERE u.role = 'student' AND u.school_id = (
             SELECT school_id FROM users WHERE id = ?
           )`,
          [id],
          (err, analytics) => {
            if (err) {
              console.error('Error fetching teacher analytics:', err);
              user.analytics = { total_students: 0, lessons_taught: 0, average_class_score: 0 };
            } else {
              user.analytics = analytics[0] || { total_students: 0, lessons_taught: 0, average_class_score: 0 };
            }
            res.json(user);
          }
        );
      } else {
        res.json(user);
      }
    }
  );
});

// Update user profile
app.put('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const requestingUserId = req.user.id;
    
    // Users can only update their own profile unless they're admin
    if (requestingUserId !== id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { name, class: className, email, phone, address, language, profile_photo, password } = req.body;
    
    // Validate editable fields with proper validation
    const updates = {};
    
    // Name validation
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ error: 'Name must be a non-empty string' });
      }
      updates.name = name.trim();
    }
    
    // Class validation
    if (className !== undefined) {
      if (typeof className !== 'string') {
        return res.status(400).json({ error: 'Class must be a string' });
      }
      updates.class = className.trim();
    }
    
    // Email validation
    if (email !== undefined) {
      if (typeof email !== 'string' || !email.includes('@')) {
        return res.status(400).json({ error: 'Email must be a valid email address' });
      }
      updates.email = email.trim();
    }
    
    // Phone validation
    if (phone !== undefined) {
      if (typeof phone !== 'string') {
        return res.status(400).json({ error: 'Phone must be a string' });
      }
      updates.phone = phone.trim();
    }
    
    // Address validation
    if (address !== undefined) {
      if (typeof address !== 'string') {
        return res.status(400).json({ error: 'Address must be a string' });
      }
      updates.address = address.trim();
    }
    
    // Language validation
    if (language !== undefined) {
      if (typeof language !== 'string' || !['en', 'es', 'hi'].includes(language)) {
        return res.status(400).json({ error: 'Language must be one of: en, es, hi' });
      }
      updates.language = language;
    }
    
    // Profile photo validation
    if (profile_photo !== undefined) {
      if (typeof profile_photo !== 'string') {
        return res.status(400).json({ error: 'Profile photo must be a string' });
      }
      updates.profile_photo = profile_photo.trim();
    }

    // Handle password update with bcrypt hashing
    if (password !== undefined) {
      if (typeof password !== 'string') {
        return res.status(400).json({ error: 'Password must be a string' });
      }
      
      if (password.trim().length > 0) {
        if (password.length < 6) {
          return res.status(400).json({ error: 'Password must be at least 6 characters long' });
        }
        try {
          updates.password_hash = await bcrypt.hash(password, 10);
        } catch (error) {
          console.error('Password hashing error:', error);
          return res.status(500).json({ error: 'Failed to hash password' });
        }
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    // Build update query
    const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    values.push(id);

    // Update user in SQLite
    sqliteDb.run(
      `UPDATE users SET ${setClause} WHERE id = ?`,
      values,
      function(err) {
        if (err) {
          console.error('SQLite update error:', err);
          return res.status(500).json({ error: 'Database error occurred while updating user' });
        }
        
        if (this.changes === 0) {
          return res.status(404).json({ error: 'User not found' });
        }

        // Sync to MySQL if available (optional)
        if (mysqlConnection) {
          mysqlConnection.execute(
            `UPDATE users SET ${setClause} WHERE id = ?`,
            values
          ).catch(error => {
            console.error('MySQL sync failed for user update:', error);
            // Don't fail the request if MySQL sync fails
          });
        }

        // Fetch and return the updated user
        sqliteDb.get(
          `SELECT id, name, email, role, class, school_id, created_at, last_login, status,
                  phone, address, language, profile_photo, roll_number, department, 
                  subjects_taught, classes_handled
           FROM users WHERE id = ?`,
          [id],
          (err, updatedUser) => {
            if (err) {
              console.error('Error fetching updated user:', err);
              return res.status(500).json({ error: 'Profile updated but failed to fetch updated data' });
            }
            
            if (!updatedUser) {
              return res.status(404).json({ error: 'User not found after update' });
            }

            // Parse JSON fields
            if (updatedUser.subjects_taught) {
              try {
                updatedUser.subjects_taught = JSON.parse(updatedUser.subjects_taught);
              } catch (e) {
                updatedUser.subjects_taught = [];
              }
            } else {
              updatedUser.subjects_taught = [];
            }

            if (updatedUser.classes_handled) {
              try {
                updatedUser.classes_handled = JSON.parse(updatedUser.classes_handled);
              } catch (e) {
                updatedUser.classes_handled = [];
              }
            } else {
              updatedUser.classes_handled = [];
            }

            res.json({
              success: true,
              message: 'Profile updated successfully',
              user: updatedUser
            });
          }
        );
      }
    );
  } catch (error) {
    console.error('Unexpected error in user update:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create student
app.post('/api/students', authenticateToken, requireRole('school'), async (req, res) => {
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
    console.log(`JWT secret loaded: ${JWT_SECRET ? 'yes' : 'no'}`);
  });
}

startServer().catch(console.error);