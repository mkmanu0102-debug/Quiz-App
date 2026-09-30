const mysql = require('mysql2');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();

let useMySQL = false;
let mysqlPool = null;
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

// 2. Pure JavaScript Persistent JSON Fallback Store (Zero C++ / Native Binary Dependencies)
const storePath = path.join(__dirname, 'quizworld_store.json');

function seedDefaultStore() {
  const bcrypt = require('bcryptjs');
  const hashedPass = bcrypt.hashSync('123456', 10);
  const defaultData = {
    users: [
      { id: 1, name: 'Abhimanyu Kumar', email: 'mrabhi962005@gmail.com', password: hashedPass, created_at: new Date().toISOString() },
      { id: 2, name: 'Demo User', email: 'mkmanu0102@gmail.com', password: hashedPass, created_at: new Date().toISOString() }
    ],
    quizzes: [
      {
        id: 1,
        title: "Human Body & Organs",
        category: "Science",
        difficulty: "Easy",
        total_questions: 5,
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        title: "Desktop Computer Basics",
        category: "Computer",
        difficulty: "Easy",
        total_questions: 5,
        created_at: new Date().toISOString()
      },
      {
        id: 3,
        title: "CPU & Hardware Fundamentals",
        category: "Computer",
        difficulty: "Medium",
        total_questions: 5,
        created_at: new Date().toISOString()
      },
      {
        id: 4,
        title: "Time & Space Complexity",
        category: "Computer",
        difficulty: "Hard",
        total_questions: 5,
        created_at: new Date().toISOString()
      },
      {
        id: 5,
        title: "General Knowledge Overview",
        category: "General",
        difficulty: "Easy",
        total_questions: 5,
        created_at: new Date().toISOString()
      }
    ],
    questions: [
      { id: 1, quiz_id: 1, question: "What is the main function of the skin in the human body?", options: JSON.stringify(["To digest food", "To breathe", "To protect the body", "To produce blood"]), correct_answer: 2 },
      { id: 2, quiz_id: 1, question: "Which part of the body helps us to see?", options: JSON.stringify(["Ears", "Nose", "Eyes", "Mouth"]), correct_answer: 2 },
      { id: 3, quiz_id: 1, question: "What is the largest organ in the human body?", options: JSON.stringify(["Brain", "Heart", "Liver", "Skin"]), correct_answer: 3 },
      { id: 4, quiz_id: 1, question: "Which part of the body helps us to hear?", options: JSON.stringify(["Eyes", "Nose", "Mouth", "Ears"]), correct_answer: 3 },
      { id: 5, quiz_id: 1, question: "What is the function of the skeleton in the human body?", options: JSON.stringify(["To produce blood", "To digest food", "To protect internal organs", "To breathe"]), correct_answer: 2 },
      { id: 6, quiz_id: 2, question: "What does CPU stand for?", options: JSON.stringify(["Central Power Unit", "Central Processing Unit", "Central Performance Unit", "Central Processor Unit"]), correct_answer: 1 },
      { id: 7, quiz_id: 2, question: "Which of the following is an input device?", options: JSON.stringify(["Monitor", "Printer", "Keyboard", "Speaker"]), correct_answer: 2 },
      { id: 8, quiz_id: 2, question: "What operating system is developed by Microsoft?", options: JSON.stringify(["macOS", "Linux", "Windows", "Android"]), correct_answer: 2 },
      { id: 9, quiz_id: 2, question: "What is the temporary memory of a computer called?", options: JSON.stringify(["Hard Drive", "ROM", "RAM", "Flash Drive"]), correct_answer: 2 },
      { id: 10, quiz_id: 2, question: "Which key is used to refresh a web page in Windows?", options: JSON.stringify(["F1", "F5", "F11", "Esc"]), correct_answer: 1 },
      { id: 11, quiz_id: 3, question: "What is the primary function of a CPU?", options: JSON.stringify(["To store data", "To provide power", "To process instructions and data", "To render graphics"]), correct_answer: 2 },
      { id: 12, quiz_id: 3, question: "What unit performs arithmetic calculations in a CPU?", options: JSON.stringify(["Control Unit", "Registers", "ALU (Arithmetic Logic Unit)", "Cache"]), correct_answer: 2 },
      { id: 13, quiz_id: 3, question: "What is clock speed measured in?", options: JSON.stringify(["Bytes", "Gigahertz (GHz)", "Pixels", "RPM"]), correct_answer: 1 },
      { id: 14, quiz_id: 3, question: "What is hyper-threading?", options: JSON.stringify(["Connecting two CPUs together", "Running multiple threads on a single core", "Overclocking the GPU", "Increasing RAM speed"]), correct_answer: 1 },
      { id: 15, quiz_id: 3, question: "What happens if a CPU overheats?", options: JSON.stringify(["It runs faster", "It thermal throttles or shuts down", "It downloads more RAM", "It clears disk space"]), correct_answer: 1 },
      { id: 16, quiz_id: 4, question: "What is the time complexity of Binary Search?", options: JSON.stringify(["O(1)", "O(log n)", "O(n)", "O(n log n)"]), correct_answer: 1 },
      { id: 17, quiz_id: 4, question: "Which sorting algorithm has average O(n log n) time complexity?", options: JSON.stringify(["Bubble Sort", "Insertion Sort", "Merge Sort", "Selection Sort"]), correct_answer: 2 },
      { id: 18, quiz_id: 4, question: "What is the time complexity of array lookup by index?", options: JSON.stringify(["O(1)", "O(log n)", "O(n)", "O(n^2)"]), correct_answer: 0 },
      { id: 19, quiz_id: 4, question: "What is the worst-case time complexity of QuickSort?", options: JSON.stringify(["O(log n)", "O(n)", "O(n log n)", "O(n^2)"]), correct_answer: 3 },
      { id: 20, quiz_id: 4, question: "What is the space complexity of an in-place algorithm?", options: JSON.stringify(["O(1)", "O(n)", "O(n^2)", "O(2^n)"]), correct_answer: 0 },
      { id: 21, quiz_id: 5, question: "Which planet is known as the Red Planet?", options: JSON.stringify(["Venus", "Mars", "Jupiter", "Saturn"]), correct_answer: 1 },
      { id: 22, quiz_id: 5, question: "What is the capital of France?", options: JSON.stringify(["London", "Berlin", "Paris", "Madrid"]), correct_answer: 2 },
      { id: 23, quiz_id: 5, question: "How many continents are there on Earth?", options: JSON.stringify(["5", "6", "7", "8"]), correct_answer: 2 },
      { id: 24, quiz_id: 5, question: "What is the chemical symbol for water?", options: JSON.stringify(["CO2", "H2O", "O2", "NaCl"]), correct_answer: 1 },
      { id: 25, quiz_id: 5, question: "Who wrote 'Romeo and Juliet'?", options: JSON.stringify(["Charles Dickens", "William Shakespeare", "Mark Twain", "Jane Austen"]), correct_answer: 1 }
    ],
    results: []
  };

  try {
    fs.writeFileSync(storePath, JSON.stringify(defaultData, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to write default JSON store:', e);
  }
  return defaultData;
}

function loadStore() {
  if (fs.existsSync(storePath)) {
    try {
      const content = fs.readFileSync(storePath, 'utf8');
      return JSON.parse(content);
    } catch (e) {
      console.error('Error parsing JSON store, re-seeding...');
    }
  }
  return seedDefaultStore();
}

function saveStore(data) {
  try {
    fs.writeFileSync(storePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('Error writing JSON store:', e.message);
  }
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
      console.log(`⚠️ MySQL connection check failed (${err.message}). Using Pure JS Fallback Database.`);
    }
  }

  useMySQL = false;
  loadStore();
  isInitialized = true;
}

function executeJSQuery(sql, params = []) {
  const data = loadStore();
  const lowerSQL = sql.trim().toLowerCase();

  // 1. Health check SELECT 1 + 1 AS result
  if (lowerSQL.includes('select 1 + 1')) {
    return [[{ result: 2 }], []];
  }

  // 2. Users Table Queries
  if (lowerSQL.includes('from users') && lowerSQL.includes('select')) {
    if (lowerSQL.includes('where')) {
      const isWhereEmail = lowerSQL.includes('where email');
      const isWherePhone = lowerSQL.includes('where phone');
      const val = params[0];
      const filtered = data.users.filter(u => {
        if (isWhereEmail) return u.email === val;
        if (isWherePhone) return u.phone === val;
        return u.email === val || u.phone === val;
      });
      return [filtered, []];
    } else {
      return [data.users.map(u => ({ id: u.id, name: u.name, email: u.email || u.phone, created_at: u.created_at })), []];
    }
  }

  if (lowerSQL.includes('insert into users')) {
    const isEmail = lowerSQL.includes('(name, email') || lowerSQL.includes('email,');
    const newUser = {
      id: (data.users.reduce((max, u) => Math.max(max, u.id || 0), 0) || 0) + 1,
      name: params[0],
      email: isEmail ? params[1] : null,
      phone: !isEmail ? params[1] : null,
      password: params[2],
      created_at: new Date().toISOString()
    };
    data.users.push(newUser);
    saveStore(data);
    return [{ insertId: newUser.id, affectedRows: 1 }, []];
  }

  if (lowerSQL.includes('update users set password')) {
    const isEmail = lowerSQL.includes('email');
    const val = params[1];
    let count = 0;
    data.users.forEach(u => {
      if ((isEmail && u.email === val) || (!isEmail && u.phone === val)) {
        u.password = params[0];
        count++;
      }
    });
    saveStore(data);
    return [{ insertId: 0, affectedRows: count }, []];
  }

  // 3. Quizzes Table Queries
  if (lowerSQL.includes('from quizzes') && lowerSQL.includes('select')) {
    const sorted = [...data.quizzes].sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
    return [sorted, []];
  }

  if (lowerSQL.includes('insert into quizzes')) {
    const newQuiz = {
      id: (data.quizzes.reduce((max, q) => Math.max(max, q.id || 0), 0) || 0) + 1,
      title: params[0],
      category: params[1],
      difficulty: params[2],
      total_questions: Number(params[3]),
      created_at: new Date().toISOString()
    };
    data.quizzes.push(newQuiz);
    saveStore(data);
    return [{ insertId: newQuiz.id, affectedRows: 1 }, []];
  }

  if (lowerSQL.includes('update quizzes set')) {
    const qId = Number(params[3]);
    let count = 0;
    data.quizzes.forEach(q => {
      if (q.id === qId) {
        q.title = params[0];
        q.category = params[1];
        q.difficulty = params[2];
        count++;
      }
    });
    saveStore(data);
    return [{ insertId: 0, affectedRows: count }, []];
  }

  if (lowerSQL.includes('delete from quizzes')) {
    const qId = Number(params[0]);
    const initCount = data.quizzes.length;
    data.quizzes = data.quizzes.filter(q => Number(q.id) !== qId);
    saveStore(data);
    return [{ insertId: 0, affectedRows: initCount - data.quizzes.length }, []];
  }

  // 4. Questions Table Queries
  if (lowerSQL.includes('from questions') && lowerSQL.includes('select')) {
    const qId = Number(params[0]);
    const questions = data.questions.filter(q => Number(q.quiz_id) === qId);
    return [questions, []];
  }

  if (lowerSQL.includes('insert into questions')) {
    const newQ = {
      id: (data.questions.reduce((max, q) => Math.max(max, q.id || 0), 0) || 0) + 1,
      quiz_id: Number(params[0]),
      question: params[1],
      options: typeof params[2] === 'string' ? params[2] : JSON.stringify(params[2]),
      correct_answer: Number(params[3])
    };
    data.questions.push(newQ);
    saveStore(data);
    return [{ insertId: newQ.id, affectedRows: 1 }, []];
  }

  if (lowerSQL.includes('delete from questions')) {
    const qId = Number(params[0]);
    data.questions = data.questions.filter(q => Number(q.quiz_id) !== qId);
    saveStore(data);
    return [{ insertId: 0, affectedRows: 1 }, []];
  }

  // 5. Results & Leaderboard Queries
  if (lowerSQL.includes('from results') && lowerSQL.includes('join users')) {
    if (lowerSQL.includes('max(r.percentage)') || lowerSQL.includes('group by')) {
      const userStats = {};
      data.results.forEach(r => {
        const uId = Number(r.user_id);
        const user = data.users.find(u => Number(u.id) === uId);
        const uName = user ? user.name : `User ${uId}`;
        if (!userStats[uId]) {
          userStats[uId] = { name: uName, best_score: 0, attempts: 0 };
        }
        userStats[uId].attempts += 1;
        if (Number(r.percentage) > userStats[uId].best_score) {
          userStats[uId].best_score = Number(r.percentage);
        }
      });
      const leaderboard = Object.values(userStats)
        .sort((a, b) => b.best_score - a.best_score)
        .slice(0, 10);
      return [leaderboard, []];
    } else {
      const adminResults = data.results
        .map(r => {
          const u = data.users.find(user => Number(user.id) === Number(r.user_id)) || {};
          const q = data.quizzes.find(quiz => Number(quiz.id) === Number(r.quiz_id)) || {};
          return {
            ...r,
            name: u.name || 'User',
            email: u.email || u.phone || 'user@example.com',
            title: q.title || 'Quiz'
          };
        })
        .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
      return [adminResults, []];
    }
  }

  if (lowerSQL.includes('from results') && lowerSQL.includes('join quizzes')) {
    const uId = Number(params[0]);
    const history = data.results
      .filter(r => Number(r.user_id) === uId)
      .map(r => {
        const q = data.quizzes.find(quiz => Number(quiz.id) === Number(r.quiz_id)) || {};
        return { ...r, title: q.title || 'Quiz', category: q.category || 'General' };
      })
      .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
    return [history, []];
  }

  if (lowerSQL.includes('insert into results')) {
    const newRes = {
      id: (data.results.reduce((max, r) => Math.max(max, r.id || 0), 0) || 0) + 1,
      user_id: Number(params[0]),
      quiz_id: Number(params[1]),
      score: Number(params[2]),
      total: Number(params[3]),
      percentage: Number(params[4]),
      created_at: new Date().toISOString()
    };
    data.results.push(newRes);
    saveStore(data);
    return [{ insertId: newRes.id, affectedRows: 1 }, []];
  }

  if (lowerSQL.includes('delete from results')) {
    const qId = Number(params[0]);
    data.results = data.results.filter(r => Number(r.quiz_id) !== qId);
    saveStore(data);
    return [{ insertId: 0, affectedRows: 1 }, []];
  }

  return [[], []];
}

const db = {
  execute: async (sql, params = []) => {
    await ensureDBReady();
    if (useMySQL) {
      try {
        return await mysqlPool.promise().execute(sql, params);
      } catch (err) {
        console.log(`⚠️ MySQL execute failed (${err.message}). Switching to Pure JS Database...`);
        useMySQL = false;
        return executeJSQuery(sql, params);
      }
    } else {
      return executeJSQuery(sql, params);
    }
  },

  query: async (sql, params = []) => {
    await ensureDBReady();
    if (useMySQL) {
      try {
        return await mysqlPool.promise().query(sql, params);
      } catch (err) {
        console.log(`⚠️ MySQL query failed (${err.message}). Switching to Pure JS Database...`);
        useMySQL = false;
        return executeJSQuery(sql, params);
      }
    } else {
      return executeJSQuery(sql, params);
    }
  }
};

module.exports = db;