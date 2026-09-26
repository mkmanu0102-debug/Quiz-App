const mysql = require('mysql2');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

let useMySQL = false;
let mysqlPool = null;
let sqliteDb = null;
let isInitialized = false;

// 1. Create MySQL pool
try {
  if (process.env.DB_HOST && process.env.DB_HOST !== 'localhost' && process.env.DB_HOST !== '127.0.0.1') {
    mysqlPool = mysql.createPool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      connectTimeout: 5000,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    });
  } else {
    // Localhost MySQL configuration
    mysqlPool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'quizworld',
      waitForConnections: true,
      connectionLimit: 10,
      connectTimeout: 3000,
    });
  }
} catch (err) {
  console.log('⚠️ Could not create MySQL pool:', err.message);
}

// 2. Initialize SQLite Fallback
const sqlitePath = path.join(__dirname, 'quizworld.sqlite');

function initSQLite() {
  return new Promise((resolve, reject) => {
    if (sqliteDb) return resolve();
    sqliteDb = new sqlite3.Database(sqlitePath, (err) => {
      if (err) {
        console.error('❌ Failed to open SQLite database:', err.message);
        return reject(err);
      }
      console.log('✅ Fallback SQLite Database connected at:', sqlitePath);

      sqliteDb.serialize(() => {
        sqliteDb.run(`
          CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE,
            phone TEXT UNIQUE,
            password TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        sqliteDb.run(`
          CREATE TABLE IF NOT EXISTS quizzes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            category TEXT NOT NULL,
            difficulty TEXT NOT NULL,
            total_questions INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        sqliteDb.run(`
          CREATE TABLE IF NOT EXISTS questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            quiz_id INTEGER NOT NULL,
            question TEXT NOT NULL,
            options TEXT NOT NULL,
            correct_answer INTEGER NOT NULL,
            FOREIGN KEY (quiz_id) REFERENCES quizzes (id)
          )
        `);

        sqliteDb.run(`
          CREATE TABLE IF NOT EXISTS results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            quiz_id INTEGER NOT NULL,
            score INTEGER NOT NULL,
            total INTEGER NOT NULL,
            percentage REAL NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (quiz_id) REFERENCES quizzes (id)
          )
        `, (err) => {
          if (err) {
            console.error('Error creating SQLite tables:', err.message);
            return reject(err);
          }
          seedSQLiteData().then(resolve).catch(() => resolve());
        });
      });
    });
  });
}

function seedSQLiteData() {
  return new Promise((resolve) => {
    sqliteDb.get("SELECT COUNT(*) as count FROM quizzes", [], async (err, row) => {
      if (err || (row && row.count > 0)) {
        return resolve();
      }

      console.log("🌱 Seeding initial quiz & user data into SQLite...");
      try {
        const bcrypt = require('bcryptjs');
        const hashedPass = await bcrypt.hash('123456', 10);

        sqliteDb.run(
          `INSERT OR IGNORE INTO users (id, name, email, password) VALUES (1, 'Abhimanyu Kumar', 'mrabhi962005@gmail.com', ?)`,
          [hashedPass]
        );
        sqliteDb.run(
          `INSERT OR IGNORE INTO users (id, name, email, password) VALUES (2, 'Demo User', 'mkmanu0102@gmail.com', ?)`,
          [hashedPass]
        );

        const sampleQuizzes = [
          {
            id: 1,
            title: "Human Body & Organs",
            category: "Science",
            difficulty: "Easy",
            total_questions: 5,
            questions: [
              { question: "What is the main function of the skin in the human body?", options: ["To digest food", "To breathe", "To protect the body", "To produce blood"], correct: 2 },
              { question: "Which part of the body helps us to see?", options: ["Ears", "Nose", "Eyes", "Mouth"], correct: 2 },
              { question: "What is the largest organ in the human body?", options: ["Brain", "Heart", "Liver", "Skin"], correct: 3 },
              { question: "Which part of the body helps us to hear?", options: ["Eyes", "Nose", "Mouth", "Ears"], correct: 3 },
              { question: "What is the function of the skeleton in the human body?", options: ["To produce blood", "To digest food", "To protect internal organs", "To breathe"], correct: 2 }
            ]
          },
          {
            id: 2,
            title: "Desktop Computer Basics",
            category: "Computer",
            difficulty: "Easy",
            total_questions: 5,
            questions: [
              { question: "What does CPU stand for?", options: ["Central Power Unit", "Central Processing Unit", "Central Performance Unit", "Central Processor Unit"], correct: 1 },
              { question: "Which of the following is an input device?", options: ["Monitor", "Printer", "Keyboard", "Speaker"], correct: 2 },
              { question: "What operating system is developed by Microsoft?", options: ["macOS", "Linux", "Windows", "Android"], correct: 2 },
              { question: "What is the temporary memory of a computer called?", options: ["Hard Drive", "ROM", "RAM", "Flash Drive"], correct: 2 },
              { question: "Which key is used to refresh a web page in Windows?", options: ["F1", "F5", "F11", "Esc"], correct: 1 }
            ]
          },
          {
            id: 3,
            title: "CPU & Hardware Fundamentals",
            category: "Computer",
            difficulty: "Medium",
            total_questions: 5,
            questions: [
              { question: "What is the primary function of a CPU?", options: ["To store data", "To provide power", "To process instructions and data", "To render graphics"], correct: 2 },
              { question: "What unit performs arithmetic calculations in a CPU?", options: ["Control Unit", "Registers", "ALU (Arithmetic Logic Unit)", "Cache"], correct: 2 },
              { question: "What is clock speed measured in?", options: ["Bytes", "Gigahertz (GHz)", "Pixels", "RPM"], correct: 1 },
              { question: "What is hyper-threading?", options: ["Connecting two CPUs together", "Running multiple threads on a single core", "Overclocking the GPU", "Increasing RAM speed"], correct: 1 },
              { question: "What happens if a CPU overheats?", options: ["It runs faster", "It thermal throttles or shuts down", "It downloads more RAM", "It clears disk space"], correct: 1 }
            ]
          },
          {
            id: 4,
            title: "Time & Space Complexity",
            category: "Computer",
            difficulty: "Hard",
            total_questions: 5,
            questions: [
              { question: "What is the time complexity of Binary Search?", options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"], correct: 1 },
              { question: "Which sorting algorithm has average O(n log n) time complexity?", options: ["Bubble Sort", "Insertion Sort", "Merge Sort", "Selection Sort"], correct: 2 },
              { question: "What is the time complexity of array lookup by index?", options: ["O(1)", "O(log n)", "O(n)", "O(n^2)"], correct: 0 },
              { question: "What is the worst-case time complexity of QuickSort?", options: ["O(log n)", "O(n)", "O(n log n)", "O(n^2)"], correct: 3 },
              { question: "What is the space complexity of an in-place algorithm?", options: ["O(1)", "O(n)", "O(n^2)", "O(2^n)"], correct: 0 }
            ]
          },
          {
            id: 5,
            title: "General Knowledge Overview",
            category: "General",
            difficulty: "Easy",
            total_questions: 5,
            questions: [
              { question: "Which planet is known as the Red Planet?", options: ["Venus", "Mars", "Jupiter", "Saturn"], correct: 1 },
              { question: "What is the capital of France?", options: ["London", "Berlin", "Paris", "Madrid"], correct: 2 },
              { question: "How many continents are there on Earth?", options: ["5", "6", "7", "8"], correct: 2 },
              { question: "What is the chemical symbol for water?", options: ["CO2", "H2O", "O2", "NaCl"], correct: 1 },
              { question: "Who wrote 'Romeo and Juliet'?", options: ["Charles Dickens", "William Shakespeare", "Mark Twain", "Jane Austen"], correct: 1 }
            ]
          }
        ];

        for (const qz of sampleQuizzes) {
          sqliteDb.run(
            `INSERT OR IGNORE INTO quizzes (id, title, category, difficulty, total_questions) VALUES (?, ?, ?, ?, ?)`,
            [qz.id, qz.title, qz.category, qz.difficulty, qz.total_questions],
            function () {
              for (const item of qz.questions) {
                sqliteDb.run(
                  `INSERT INTO questions (quiz_id, question, options, correct_answer) VALUES (?, ?, ?, ?)`,
                  [qz.id, item.question, JSON.stringify(item.options), item.correct]
                );
              }
            }
          );
        }
      } catch (e) {
        console.error('Error seeding SQLite data:', e);
      }
      resolve();
    });
  });
}

async function ensureDBReady() {
  if (isInitialized) return;

  if (mysqlPool) {
    try {
      const connection = await new Promise((resolve, reject) => {
        mysqlPool.getConnection((err, conn) => {
          if (err) reject(err);
          else resolve(conn);
        });
      });
      connection.release();
      useMySQL = true;
      isInitialized = true;
      console.log('✅ MySQL Database connected successfully!');
      return;
    } catch (err) {
      console.log(`⚠️ MySQL connection check failed (${err.message}). Using SQLite fallback.`);
    }
  }

  useMySQL = false;
  await initSQLite();
  isInitialized = true;
}

function runSQLiteQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    const trimmed = sql.trim().toUpperCase();
    if (trimmed.startsWith('SELECT') || trimmed.startsWith('PRAGMA') || trimmed.startsWith('EXPLAIN')) {
      sqliteDb.all(sql, params, (err, rows) => {
        if (err) return reject(err);
        resolve([rows || [], []]);
      });
    } else {
      sqliteDb.run(sql, params, function (err) {
        if (err) return reject(err);
        resolve([{ insertId: this.lastID, affectedRows: this.changes }, []]);
      });
    }
  });
}

const db = {
  execute: async (sql, params = []) => {
    await ensureDBReady();
    if (useMySQL) {
      try {
        return await mysqlPool.promise().execute(sql, params);
      } catch (err) {
        console.log(`⚠️ MySQL execute failed (${err.message}). Switching to SQLite...`);
        useMySQL = false;
        await initSQLite();
        return runSQLiteQuery(sql, params);
      }
    } else {
      return runSQLiteQuery(sql, params);
    }
  },

  query: async (sql, params = []) => {
    await ensureDBReady();
    if (useMySQL) {
      try {
        return await mysqlPool.promise().query(sql, params);
      } catch (err) {
        console.log(`⚠️ MySQL query failed (${err.message}). Switching to SQLite...`);
        useMySQL = false;
        await initSQLite();
        return runSQLiteQuery(sql, params);
      }
    } else {
      return runSQLiteQuery(sql, params);
    }
  }
};

module.exports = db;