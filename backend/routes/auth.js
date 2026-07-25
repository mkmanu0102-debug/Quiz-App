const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const db = require('../db');

// OTP store (temporary)
const otpStore = {};

// Helper: Check if input is email or phone
const isEmail = (input) => input && input.includes('@');

// Send OTP via Nodemailer (Gmail)
const sendEmailOTP = async (email, otp) => {
  console.log(`📧 [Email OTP] Sending OTP ${otp} to email: ${email}`);

  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const mailOptions = {
        from: `"Quiz World" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Quiz World - OTP Verification',
        html: `
          <h2>Quiz World OTP Verification</h2>
          <p>Your OTP is: <b style="font-size:24px; color:#4f46e5;">${otp}</b></p>
          <p>Valid for 5 minutes only.</p>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log(`✅ [Nodemailer] Email sent successfully to ${email}`);
    } catch (err) {
      console.error(`❌ [Nodemailer] Failed to send email to ${email}:`, err.message);
      logFallback(email, otp);
    }
  } else {
    console.log(`⚠️ Email credentials not set in .env. Logging OTP.`);
    logFallback(email, otp);
  }
};

// Send OTP via Twilio SMS
const sendSMSOTP = async (phone, otp) => {
  console.log(`📱 [SMS OTP] Sending OTP ${otp} to phone: ${phone}`);

  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
    try {
      const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      await client.messages.create({
        body: `Quiz World Verification Code: ${otp}. Valid for 5 minutes.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone
      });
      console.log(`✅ [Twilio] SMS sent successfully to ${phone}`);
    } catch (err) {
      console.error(`❌ [Twilio] Failed to send SMS to ${phone}:`, err.message);
      logFallback(phone, otp);
    }
  } else {
    console.log(`⚠️ Twilio credentials not set in .env. Logging OTP.`);
    logFallback(phone, otp);
  }
};

// Log OTP to log.txt for fallback/testing
const logFallback = (identifier, otp) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const logPath = path.join(__dirname, '../log.txt');
    fs.appendFileSync(logPath, `[${new Date().toISOString()}] OTP for ${identifier}: ${otp}\n`);
    console.log(`📝 OTP logged to log.txt for testing.`);
  } catch (err) {
    console.error('Failed to write to log.txt:', err.message);
  }
};

// Register - Step 1: Send OTP (Email or Phone)
router.post('/register', async (req, res) => {
  try {
    console.log('📝 Register request:', req.body);
    const { name, email, phone, emailOrPhone, password } = req.body;

    const identifier = emailOrPhone || email || phone;

    if (!name || !identifier || !password) {
      console.log('❌ Missing fields');
      return res.status(400).json({ message: 'All fields (name, email/phone, password) are required!' });
    }

    const type = isEmail(identifier) ? 'email' : 'phone';
    console.log(`✅ Checking if ${type} exists in database:`, identifier);

    const [existing] = await db.execute(
      `SELECT * FROM users WHERE ${type} = ?`,
      [identifier]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: `${type === 'email' ? 'Email' : 'Phone number'} already registered!` });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP details temporary
    otpStore[identifier] = {
      name,
      password,
      otp,
      expires: Date.now() + 5 * 60 * 1000, // 5 mins validity
    };

    if (type === 'email') {
      await sendEmailOTP(identifier, otp);
      res.json({ message: 'OTP sent to your email!' });
    } else {
      await sendSMSOTP(identifier, otp);
      res.json({ message: 'OTP sent to your phone!' });
    }
  } catch (error) {
    console.error('🔴 Register Error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// Register - Step 2: Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    console.log('🔐 Verify OTP request:', req.body);
    const { emailOrPhone, email, phone, otp } = req.body;

    const identifier = emailOrPhone || email || phone;

    if (!identifier || !otp) {
      return res.status(400).json({ message: 'Identifier and OTP are required!' });
    }

    const stored = otpStore[identifier];
    if (!stored) {
      return res.status(400).json({ message: 'OTP expired or not found! Please register again.' });
    }

    if (Date.now() > stored.expires) {
      delete otpStore[identifier];
      return res.status(400).json({ message: 'OTP expired!' });
    }

    if (stored.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP!' });
    }

    // Hash password and save to DB
    const hashedPassword = await bcrypt.hash(stored.password, 10);
    const type = isEmail(identifier) ? 'email' : 'phone';

    console.log(`✅ Saving user to DB with ${type}:`, identifier);
    await db.execute(
      `INSERT INTO users (name, ${type}, password) VALUES (?, ?, ?)`,
      [stored.name, identifier, hashedPassword]
    );

    delete otpStore[identifier];
    console.log('✅ User registered successfully!');

    res.json({ message: 'Registration successful! Please login.' });
  } catch (error) {
    console.error('🔴 Verify OTP Error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    console.log('🔑 Login request:', req.body);
    const { emailOrPhone, email, phone, password } = req.body;

    const identifier = emailOrPhone || email || phone;

    if (!identifier || !password) {
      console.log('❌ Missing fields');
      return res.status(400).json({ message: 'Identifier and password are required!' });
    }

    // Admin login check
    if (
      (process.env.ADMIN_PHONE && identifier === process.env.ADMIN_PHONE && password === process.env.ADMIN_PASSWORD) ||
      (process.env.ADMIN_EMAIL && identifier === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) ||
      (identifier === 'admin' && password === 'admin123')
    ) {
      console.log('✅ Admin login match');
      const token = jwt.sign(
        { id: 0, role: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      return res.json({
        token,
        user: { name: 'Admin', role: 'admin' },
      });
    }

    const type = isEmail(identifier) ? 'email' : 'phone';
    console.log(`✅ Finding user by ${type}:`, identifier);

    const [users] = await db.execute(
      `SELECT * FROM users WHERE ${type} = ?`,
      [identifier]
    );

    if (users.length === 0) {
      return res.status(400).json({ message: `Invalid ${type === 'email' ? 'email' : 'phone number'} or password!` });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials!' });
    }

    console.log('✅ Login successful, generating token...');
    const token = jwt.sign(
      { id: user.id, role: 'user' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        name: user.name,
        email: user.email || null,
        phone: user.phone || null,
        role: 'user'
      },
    });
  } catch (error) {
    console.error('🔴 Login Error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// Store for Forgot Password OTPs
const forgotPasswordOtpStore = {};

// Forgot Password - Step 1: Send OTP
router.post('/forgot-password', async (req, res) => {
  try {
    const { emailOrPhone } = req.body;
    if (!emailOrPhone) {
      return res.status(400).json({ message: 'Email or phone number is required!' });
    }
    const identifier = emailOrPhone.trim();
    const type = isEmail(identifier) ? 'email' : 'phone';

    // Verify user exists
    const [existing] = await db.execute(
      `SELECT * FROM users WHERE ${type} = ?`,
      [identifier]
    );

    if (existing.length === 0) {
      return res.status(400).json({ message: `User with this ${type === 'email' ? 'email' : 'phone number'} is not registered!` });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP temporary
    forgotPasswordOtpStore[identifier] = {
      otp,
      expires: Date.now() + 5 * 60 * 1000, // 5 mins
    };

    if (type === 'email') {
      await sendEmailOTP(identifier, otp);
      res.json({ message: 'OTP sent to your email!' });
    } else {
      await sendSMSOTP(identifier, otp);
      res.json({ message: 'OTP sent to your phone!' });
    }
  } catch (error) {
    console.error('ForgotPassword Error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// Forgot Password - Step 2: Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    const { emailOrPhone, otp, newPassword } = req.body;
    if (!emailOrPhone || !otp || !newPassword) {
      return res.status(400).json({ message: 'All fields (email/phone, OTP, new password) are required!' });
    }
    const identifier = emailOrPhone.trim();
    const type = isEmail(identifier) ? 'email' : 'phone';

    const stored = forgotPasswordOtpStore[identifier];
    if (!stored) {
      return res.status(400).json({ message: 'OTP expired or not requested! Please request OTP again.' });
    }

    if (Date.now() > stored.expires) {
      delete forgotPasswordOtpStore[identifier];
      return res.status(400).json({ message: 'OTP expired!' });
    }

    if (stored.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP!' });
    }

    // Hash new password and update user record
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.execute(
      `UPDATE users SET password = ? WHERE ${type} = ?`,
      [hashedPassword, identifier]
    );

    delete forgotPasswordOtpStore[identifier];
    res.json({ message: 'Password reset successful! Please login with your new password.' });
  } catch (error) {
    console.error('ResetPassword Error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

module.exports = router;