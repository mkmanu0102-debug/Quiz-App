const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const db = require('../db');

// OTP store (temporary)
const otpStore = {};

// Send OTP via Gmail
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
    console.log('📝 Register request:', req.body);
    const { name, phone, email, password } = req.body;

    if (!name || !phone || !email || !password) {
      console.log('❌ Missing fields');
      return res.status(400).json({ message: 'All fields required!' });
    }

    console.log('✅ Checking if phone exists...');
    const [existing] = await db.execute(
      'SELECT * FROM users WHERE phone = ?',
      [phone]
    );
    if (existing.length > 0) {
      console.log('❌ Phone already registered');
      return res.status(400).json({ message: 'Phone already registered!' });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    console.log('✅ Phone unique, storing OTP...');
    otpStore[phone] = {
      name,
      email,
      password,
      otp,
      expires: Date.now() + 5 * 60 * 1000,
    };

    console.log('📧 Sending OTP via Gmail to ' + email);
    await sendOTP(email, otp);
    console.log('✅ OTP sent successfully!');

    res.json({ message: 'OTP sent to your email!' });
  } catch (error) {
    console.error('🔴 Register Error:', error.message);
    console.error('Full error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// Register - Step 2: Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    console.log('🔐 Verify OTP request:', req.body);
    const { phone, otp } = req.body;

    const stored = otpStore[phone];
    if (!stored) {
      console.log('❌ No OTP stored for phone:', phone);
      return res.status(400).json({ message: 'OTP expired! Register again.' });
    }

    if (Date.now() > stored.expires) {
      delete otpStore[phone];
      console.log('❌ OTP expired for phone:', phone);
      return res.status(400).json({ message: 'OTP expired!' });
    }

    console.log('✅ Verifying OTP...');
    if (stored.otp !== otp) {
      console.log('❌ Invalid OTP');
      return res.status(400).json({ message: 'Invalid OTP!' });
    }

    console.log('✅ OTP verified, hashing password...');
    const hashedPassword = await bcrypt.hash(stored.password, 10);

    console.log('✅ Saving user to database...');
    await db.execute(
      'INSERT INTO users (name, phone, password) VALUES (?, ?, ?)',
      [stored.name, phone, hashedPassword]
    );

    delete otpStore[phone];
    console.log('✅ User registered successfully!');

    res.json({ message: 'Registration successful! Please login.' });
  } catch (error) {
    console.error('🔴 Verify OTP Error:', error.message);
    console.error('Full error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    console.log('🔑 Login request:', { phone: req.body.phone });
    const { phone, password } = req.body;

    // Admin check
    if (phone === process.env.ADMIN_PHONE && password === process.env.ADMIN_PASSWORD) {
      console.log('✅ Admin login');
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

    console.log('✅ Finding user by phone:', phone);
    const [users] = await db.execute(
      'SELECT * FROM users WHERE phone = ?',
      [phone]
    );
    
    if (users.length === 0) {
      console.log('❌ User not found');
      return res.status(400).json({ message: 'Invalid phone or password!' });
    }

    const user = users[0];
    console.log('✅ User found, comparing password...');
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      console.log('❌ Password mismatch');
      return res.status(400).json({ message: 'Invalid phone or password!' });
    }

    console.log('✅ Login successful, generating token...');
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
    console.error('🔴 Login Error:', error.message);
    console.error('Full error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

module.exports = router;