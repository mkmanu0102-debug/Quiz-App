const express = require('express');
const router = express.Router();
const db = require('../db');
const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token!' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token!' });
  }
};

router.get('/leaderboard', verifyToken, async (req, res) => {
  try {
    const [results] = await db.execute(`
      SELECT u.name, MAX(r.percentage) as best_score, COUNT(r.id) as attempts
      FROM results r
      JOIN users u ON r.user_id = u.id
      GROUP BY u.id, u.name
      ORDER BY best_score DESC
      LIMIT 10
    `);
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: 'Server error!' });
  }
});

router.get('/history', verifyToken, async (req, res) => {
  try {
    const [results] = await db.execute(`
      SELECT r.*, q.title, q.category
      FROM results r
      JOIN quizzes q ON r.quiz_id = q.id
      WHERE r.user_id = ?
      ORDER BY r.created_at DESC
    `, [req.user.id]);
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: 'Server error!' });
  }
});

router.post('/result', verifyToken, async (req, res) => {
  try {
    const { quiz_id, score, total, percentage } = req.body;
    await db.execute(
      'INSERT INTO results (user_id, quiz_id, score, total, percentage) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, quiz_id, score, total, percentage]
    );
    res.json({ message: 'Result saved!' });
  } catch (error) {
    res.status(500).json({ message: 'Server error!' });
  }
});

router.get('/', verifyToken, async (req, res) => {
  try {
    const [quizzes] = await db.execute('SELECT * FROM quizzes ORDER BY created_at DESC');
    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ message: 'Server error!' });
  }
});

router.get('/:id/questions', verifyToken, async (req, res) => {
  try {
    const [questions] = await db.execute(
      'SELECT * FROM questions WHERE quiz_id = ?',
      [req.params.id]
    );
    const parsed = questions.map(q => {
      let options = q.options;
      if (typeof options === 'string') {
        try {
          options = JSON.parse(options);
        } catch(e) {
          options = q.options;
        }
      }
      return { ...q, options };
    });
    res.json(parsed);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Server error!' });
  }
});

module.exports = router;