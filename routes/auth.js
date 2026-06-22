const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const db = require('../db');

// OTP store (temporary)
const otpStore = {};

// Send OTP
const sendOTP = async (email, otp) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Quiz World - OTP Verification',
    html: `
      <h2>Quiz World OTP</h2>
      <p>Your OTP is: <b style="font-size:24px">${otp}</b></p>
      <p>Valid for 5 minutes only.</p>
    `,
  });
};

// Register - Step 1: Send OTP
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields required!' });
    }

    // Check existing user
    const [existing] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Email already registered!' });
    }

    // Generate OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    otpStore[email] = { otp, name, password, expires: Date.now() + 5 * 60 * 1000 };

    // Send OTP
    await sendOTP(email, otp);

    res.json({ message: 'OTP sent to your email!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error!' });
  }
});

// Register - Step 2: Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    const stored = otpStore[email];
    if (!stored) {
      return res.status(400).json({ message: 'OTP expired! Register again.' });
    }

    if (Date.now() > stored.expires) {
      delete otpStore[email];
      return res.status(400).json({ message: 'OTP expired!' });
    }

    if (stored.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP!' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(stored.password, 10);

    // Save user
    await db.execute(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [stored.name, email, hashedPassword]
    );

    delete otpStore[email];

    res.json({ message: 'Registration successful! Please login.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error!' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Admin check
    if (email === 'admin@quiz.com' && password === 'admin123') {
      const token = jwt.sign({ id: 0, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '7d' });
      return res.json({ token, user: { name: 'Admin', email, role: 'admin' } });
    }

    const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(400).json({ message: 'Invalid email or password!' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password!' });
    }

    const token = jwt.sign({ id: user.id, role: 'user' }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, user: { name: user.name, email: user.email, role: 'user' } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error!' });
  }
});

module.exports = router;