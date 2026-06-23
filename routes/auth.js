const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const twilio = require('twilio');
const db = require('../db');

// Twilio client
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// OTP store (temporary)
const otpStore = {};

// Send OTP via SMS
const sendOTP = async (phone, otp) => {
  await client.verify.v2
    .services(process.env.TWILIO_SERVICE_SID)
    .verifications.create({
      to: `+91${phone}`,
      channel: 'sms',
    });
};

// Register - Step 1: Send OTP
router.post('/register', async (req, res) => {
  try {
    const { name, phone, password } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({ message: 'All fields required!' });
    }

    // Check existing user
    const [existing] = await db.execute(
      'SELECT * FROM users WHERE phone = ?',
      [phone]
    );
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Phone already registered!' });
    }

    // Store user data temporarily
    otpStore[phone] = {
      name,
      password,
      expires: Date.now() + 5 * 60 * 1000,
    };

    // Send OTP via Twilio
    await sendOTP(phone);

    res.json({ message: 'OTP sent to your phone!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error!' });
  }
});

// Register - Step 2: Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, otp } = req.body;

    const stored = otpStore[phone];
    if (!stored) {
      return res.status(400).json({ message: 'OTP expired! Register again.' });
    }

    if (Date.now() > stored.expires) {
      delete otpStore[phone];
      return res.status(400).json({ message: 'OTP expired!' });
    }

    // Twilio se OTP verify karo
    const verification = await client.verify.v2
      .services(process.env.TWILIO_SERVICE_SID)
      .verificationChecks.create({
        to: `+91${phone}`,
        code: otp,
      });

    if (verification.status !== 'approved') {
      return res.status(400).json({ message: 'Invalid OTP!' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(stored.password, 10);

    // Save user
    await db.execute(
      'INSERT INTO users (name, phone, password) VALUES (?, ?, ?)',
      [stored.name, phone, hashedPassword]
    );

    delete otpStore[phone];

    res.json({ message: 'Registration successful! Please login.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error!' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;

    // Admin check
    if (phone === 'admin' && password === 'admin123') {
      const token = jwt.sign(
        { id: 0, role: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      return res.json({
        token,
        user: { name: 'Admin', phone, role: 'admin' },
      });
    }

    const [users] = await db.execute(
      'SELECT * FROM users WHERE phone = ?',
      [phone]
    );
    if (users.length === 0) {
      return res.status(400).json({ message: 'Invalid phone or password!' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid phone or password!' });
    }

    const token = jwt.sign(
      { id: user.id, role: 'user' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: { name: user.name, phone: user.phone, role: 'user' },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error!' });
  }
});

module.exports = router;