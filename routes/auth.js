const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sgMail = require('@sendgrid/mail');
const db = require('../db');

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// OTP store (temporary)
const otpStore = {};

// Send OTP via SendGrid
const sendOTP = async (email, otp) => {
  const msg = {
    to: email,
    from: 'mrabhi1962005@gmail.com',
    subject: 'Quiz World - OTP Verification',
    html: `
      <h2>Quiz World OTP</h2>
      <p>Your OTP is: <b style="font-size:24px">${otp}</b></p>
      <p>Valid for 5 minutes only.</p>
    `,
  };

  await sgMail.send(msg);
};

// Register - Step 1: Send OTP
router.post('/register', async (req, res) => {
  try {
    console.log('📝 Register request:', req.body);
    const { name, phone, password } = req.body;

    if (!name || !phone || !password) {
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
    
    // Generate random email for internal use
    const randomEmail = `user_${phone}@quizworld.local`;
    
    console.log('✅ Phone unique, storing OTP...');
    otpStore[phone] = {
      name,
      password,
      otp,
      expires: Date.now() + 5 * 60 * 1000,
    };

    console.log('📧 Sending OTP via SendGrid');
    await sendOTP(randomEmail, otp);
    console.log('✅ OTP sent successfully!');

    res.json({ message: 'OTP sent to your phone!' });
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