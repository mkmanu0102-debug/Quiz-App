const express = require('express');
const router = express.Router();
const db = require('../db');
const jwt = require('jsonwebtoken');

const verifyAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token!' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') return res.status(403).json({ message: 'Admin only!' });
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token!' });
  }
};

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

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GEMINI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      })
    });

    const data = await response.json();
    console.log('Groq response:', JSON.stringify(data));

    if (!data.choices || data.choices.length === 0) {
      return res.status(500).json({ message: 'Groq API error: ' + JSON.stringify(data) });
    }

    const text = data.choices[0].message.content;
    const jsonMatch = text.match(/\[[\s\S]*\]/);

    if (!jsonMatch) {
      return res.status(500).json({ message: 'Could not generate questions!' });
    }

    const questions = JSON.parse(jsonMatch[0]);

    const [quiz] = await db.execute(
      'INSERT INTO quizzes (title, category, difficulty, total_questions) VALUES (?, ?, ?, ?)',
      [topic, category, difficulty, numQuestions]
    );

    const quizId = quiz.insertId;

    for (const q of questions) {
      await db.execute(
        'INSERT INTO questions (quiz_id, question, options, correct_answer) VALUES (?, ?, ?, ?)',
        [quizId, q.question, JSON.stringify(q.options), q.correct]
      );
    }

    res.json({ message: 'Quiz generated and saved!', quizId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error!' });
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
    await db.execute('DELETE FROM questions WHERE quiz_id = ?', [req.params.id]);
    await db.execute('DELETE FROM quizzes WHERE id = ?', [req.params.id]);
    res.json({ message: 'Quiz deleted!' });
  } catch (error) {
    res.status(500).json({ message: 'Server error!' });
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

module.exports = router;