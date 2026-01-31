const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
require("dotenv").config();

const dbPath =
  process.env.SQLITE_PATH ||
  path.join(__dirname, "..", "data", "quizsmash.sqlite");

const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("❌ SQLite connection error:", err.message);
  } else {
    console.log("✅ Connected to SQLite database");
  }
});

db.serialize(() => {
  db.run("PRAGMA foreign_keys = ON");
});

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

async function initializeDatabase() {
  try {
    await run("PRAGMA foreign_keys = ON");
    await run(`
      CREATE TABLE IF NOT EXISTS rooms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        host_socket_id TEXT,
        topic TEXT,
        difficulty TEXT DEFAULT 'medium',
        status TEXT DEFAULT 'waiting',
        current_question INTEGER DEFAULT 0,
        total_questions INTEGER DEFAULT 3,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME DEFAULT (datetime('now', '+1 hour'))
      );
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS players (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
        username TEXT NOT NULL,
        socket_id TEXT NOT NULL,
        score INTEGER DEFAULT 0,
        is_ready INTEGER DEFAULT 0,
        joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(room_id, username)
      );
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
        question_text TEXT NOT NULL,
        options TEXT NOT NULL,
        correct_index INTEGER NOT NULL,
        explanation TEXT,
        round_number INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS answers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
        question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
        selected_index INTEGER,
        is_correct INTEGER,
        answered_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("✅ Database schema initialized");
  } catch (error) {
    console.error("❌ Database initialization error:", error);
  }
}

initializeDatabase();

module.exports = { db, run, get, all };