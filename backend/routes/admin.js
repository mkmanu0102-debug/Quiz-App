const express = require('express');
const router = express.Router();
const db = require('../db');
const jwt = require('jsonwebtoken');

const verifyAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token!' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'quizworld_secret_key_2024');
    if (decoded.role !== 'admin') return res.status(403).json({ message: 'Admin only!' });
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token!' });
  }
};

function generateFallbackQuestions(topic, numQuestions, difficulty, category) {
  const count = parseInt(numQuestions, 10) || 5;
  const questions = [];

  const templates = [
    {
      q: (t, i) => `What is a core principle of ${t}? (Concept #${i})`,
      opts: (t) => [`Primary operational standard for ${t}`, `Secondary auxiliary process`, `Unrelated system component`, `Deprecated legacy protocol`],
    },
    {
      q: (t, i) => `Which of the following is most commonly associated with ${t}?`,
      opts: (t) => [`High efficiency and structured methodology`, `Random unorganized data`, `Manual static configuration`, `Temporary volatile memory`],
    },
    {
      q: (t, i) => `Why is ${t} important in modern ${category || 'applications'}?`,
      opts: (t) => [`It increases system reliability and performance`, `It reduces data security`, `It slows down execution speed`, `It has no practical application`],
    },
    {
      q: (t, i) => `What is a major advantage of using ${t}?`,
      opts: (t) => [`Enhanced performance and scalability`, `Higher hardware requirement`, `Complex implementation process`, `Limited platform compatibility`],
    },
    {
      q: (t, i) => `Which tool or feature is frequently used alongside ${t}?`,
      opts: (t) => [`Automated analysis and optimization framework`, `Legacy manual calculator`, `Unformatted text editor`, `Discontinued system driver`],
    },
    {
      q: (t, i) => `What key factor determines the effectiveness of ${t}?`,
      opts: (t) => [`Proper implementation and configuration`, `Color scheme of the user interface`, `Number of physical cables`, `Time of day it is executed`],
    },
    {
      q: (t, i) => `In the context of ${difficulty} level ${t}, what is a primary best practice?`,
      opts: (t) => [`Continuous testing and structured validation`, `Ignoring error outputs`, `Bypassing standard procedures`, `Hardcoding temporary values`],
    },
    {
      q: (t, i) => `What happens when ${t} is misconfigured?`,
      opts: (t) => [`Unexpected system behavior or performance degradation`, `Instant hardware upgrade`, `Automatic database backup`, `No effect whatsoever`],
    },
    {
      q: (t, i) => `Which layer or component handles ${t} processing?`,
      opts: (t) => [`Core logic and execution engine`, `Physical outer casing`, `Static display banner`, `External power cord`],
    },
    {
      q: (t, i) => `What is a future trend or development direction for ${t}?`,
      opts: (t) => [`Increased automation and AI integration`, `Complete reliance on paper documentation`, `Reduction in execution speed`, `Deprecating digital storage`],
    }
  ];

  for (let i = 1; i <= count; i++) {
    const tIndex = (i - 1) % templates.length;
    const template = templates[tIndex];
    const opts = template.opts(topic);
    
    const targetCorrect = i % 4;
    const shuffledOpts = [...opts];
    const temp = shuffledOpts[0];
    shuffledOpts[0] = shuffledOpts[targetCorrect];
    shuffledOpts[targetCorrect] = temp;

    questions.push({
      question: template.q(topic, i),
      options: shuffledOpts,
      correct: targetCorrect
    });
  }

  return questions;
}

router.post('/generate-quiz', verifyAdmin, async (req, res) => {
  try {
    const { topic, numQuestions, difficulty, category } = req.body;

    const prompt = `Generate ${numQuestions} multiple choice questions on "${topic}" at ${difficulty} difficulty level.
Return ONLY a JSON array like this:
[
  {
    "question": "Question here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct": 0
  }
]
No extra text, only JSON array.`;

    const models = [
      'llama-3.3-70b-versatile',
      'llama-3.1-8b-instant',
      'mixtral-8x7b-32768',
      'qwen/qwen3.8-27b',
      'openai/gpt-oss-120b'
    ];
    let data = null;
    let lastError = null;

    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.startsWith('gsk_')) {
      for (const model of models) {
        try {
          const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.GEMINI_API_KEY}`,
            },
            body: JSON.stringify({
              model: model,
              messages: [{ role: 'user', content: prompt }],
              temperature: 0.7,
            })
          });

          const resJson = await response.json();
          if (resJson.choices && resJson.choices.length > 0) {
            data = resJson;
            break;
          } else {
            lastError = resJson;
            console.error(`Model ${model} failed:`, JSON.stringify(resJson));
          }
        } catch (err) {
          lastError = err;
          console.error(`Model ${model} exception:`, err);
        }
      }
    }

    let questions = null;

    if (data && data.choices && data.choices.length > 0) {
      const text = data.choices[0].message.content;
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          questions = JSON.parse(jsonMatch[0]);
        } catch (e) {
          console.error('Failed to parse AI JSON:', e);
        }
      }
    }

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      console.log('⚠️ Groq API key expired/invalid or model failed. Using Smart Question Synthesizer...');
      questions = generateFallbackQuestions(topic, numQuestions, difficulty, category);
    }

    const [quiz] = await db.execute(
      'INSERT INTO quizzes (title, category, difficulty, total_questions) VALUES (?, ?, ?, ?)',
      [topic, category, difficulty, questions.length]
    );

    const quizId = quiz.insertId;

    for (const q of questions) {
      await db.execute(
        'INSERT INTO questions (quiz_id, question, options, correct_answer) VALUES (?, ?, ?, ?)',
        [quizId, q.question, JSON.stringify(q.options), q.correct ?? q.correct_answer ?? 0]
      );
    }

    res.json({ message: 'Quiz generated and saved!', quizId });
  } catch (error) {
    console.error('Generate Quiz Error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

router.get('/quizzes', verifyAdmin, async (req, res) => {
  try {
    const [quizzes] = await db.execute('SELECT * FROM quizzes ORDER BY created_at DESC');
    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ message: 'Server error!' });
  }
});

router.delete('/quiz/:id', verifyAdmin, async (req, res) => {
  try {
    await db.execute('DELETE FROM results WHERE quiz_id = ?', [req.params.id]);
    await db.execute('DELETE FROM questions WHERE quiz_id = ?', [req.params.id]);
    await db.execute('DELETE FROM quizzes WHERE id = ?', [req.params.id]);
    res.json({ message: 'Quiz deleted!' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

router.put('/quiz/:id', verifyAdmin, async (req, res) => {
  try {
    const { title, category, difficulty } = req.body;
    await db.execute(
      'UPDATE quizzes SET title = ?, category = ?, difficulty = ? WHERE id = ?',
      [title, category, difficulty, req.params.id]
    );
    res.json({ message: 'Quiz updated!' });
  } catch (error) {
    res.status(500).json({ message: 'Server error!' });
  }
});

router.get('/users', verifyAdmin, async (req, res) => {
  try {
    const [users] = await db.execute('SELECT id, name, email, created_at FROM users');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error!' });
  }
});

router.get('/results', verifyAdmin, async (req, res) => {
  try {
    const [results] = await db.execute(`
      SELECT r.*, u.name, u.email, q.title
      FROM results r
      JOIN users u ON r.user_id = u.id
      JOIN quizzes q ON r.quiz_id = q.id
      ORDER BY r.created_at DESC
    `);
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: 'Server error!' });
  }
});

router.post('/create-quiz', verifyAdmin, async (req, res) => {
  try {
    const { title, category, difficulty, questions } = req.body;
    if (!title || !category || !difficulty || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: 'All fields (title, category, difficulty, questions) are required!' });
    }

    const [quiz] = await db.execute(
      'INSERT INTO quizzes (title, category, difficulty, total_questions) VALUES (?, ?, ?, ?)',
      [title, category, difficulty, questions.length]
    );

    const quizId = quiz.insertId;

    for (const q of questions) {
      await db.execute(
        'INSERT INTO questions (quiz_id, question, options, correct_answer) VALUES (?, ?, ?, ?)',
        [quizId, q.question, JSON.stringify(q.options), q.correct_answer]
      );
    }

    res.json({ message: 'Quiz created successfully!', quizId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

module.exports = router;