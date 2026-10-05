// server/routes/auth.js
const express = require('express');
const router = express.Router();
const { pool, getPasswordField } = require('../db');

// ── Sign Up Endpoint ──
router.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedUsername = username.trim();

    // Check if user with this email already exists
    const [existingUsers] = await pool.query(
      'SELECT id FROM users WHERE email = ? LIMIT 1',
      [trimmedEmail]
    );

    if (existingUsers && existingUsers.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Insert user into MySQL users table
    const passCol = getPasswordField();
    const [insertResult] = await pool.query(
      `INSERT INTO users (username, email, ${passCol}) VALUES (?, ?, ?)`,
      [trimmedUsername, trimmedEmail, password]
    );

    const newUserId = insertResult.insertId;
    console.log(`✅ [AUTH] User registered in MySQL: ${trimmedUsername} (${trimmedEmail}) with ID: ${newUserId}`);

    return res.status(201).json({
      message: 'Account created successfully',
      user: {
        id: String(newUserId),
        username: trimmedUsername,
        email: trimmedEmail,
      },
    });
  } catch (error) {
    console.error('❌ [AUTH] Sign up error:', error);
    return res.status(500).json({
      error: error.message || 'An error occurred during registration',
    });
  }
});

// ── Sign In Endpoint ──
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const passCol = getPasswordField();

    // Check user in MySQL users table
    const [rows] = await pool.query(
      `SELECT id, username, email, ${passCol} as password FROM users WHERE email = ? LIMIT 1`,
      [trimmedEmail]
    );

    if (!rows || rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const userRecord = rows[0];

    // Verify password
    if (userRecord.password !== password) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    console.log(`✅ [AUTH] User logged in from MySQL: ${userRecord.username} (${userRecord.email})`);

    return res.json({
      message: 'Login successful',
      user: {
        id: String(userRecord.id),
        username: userRecord.username,
        email: userRecord.email,
      },
    });
  } catch (error) {
    console.error('❌ [AUTH] Sign in error:', error);
    return res.status(500).json({
      error: error.message || 'An error occurred during login',
    });
  }
});

// ── Get Users (for admin / debugging verification) ──
router.get('/users', async (req, res) => {
  try {
    const [users] = await pool.query('SELECT id, username, email, created_at FROM users ORDER BY id DESC');
    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
