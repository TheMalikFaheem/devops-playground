const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const config = require('../config');
const db = require('../db');

const router = express.Router();

router.get('/login', (req, res) => {
  res.render('auth/login', { title: 'Login' });
});

router.get('/register', (req, res) => {
  res.render('auth/register', { title: 'Register' });
});

router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).render('auth/register', {
      title: 'Register',
      error: 'Username, email, and password are required.'
    });
  }

  try {
    const existing = await db.query('SELECT 1 FROM users WHERE email = $1', [email]);
    if (existing.rowCount > 0) {
      return res.status(409).render('auth/register', {
        title: 'Register',
        error: 'An account with that email already exists.'
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const created = await db.query(
      `
      INSERT INTO users (username, email, password_hash, role)
      VALUES ($1, $2, $3, 'user')
      RETURNING id, username, role;
      `,
      [username, email, passwordHash]
    );

    const user = created.rows[0];
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: config.nodeEnv === 'production'
    });
    return res.redirect('/projects');
  } catch (err) {
    console.error('❌ Register failed:', err.message);
    return res.status(500).render('auth/register', {
      title: 'Register',
      error: config.nodeEnv === 'development' ? err.message : 'Registration failed.'
    });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).render('auth/login', {
      title: 'Login',
      error: 'Email and password are required.'
    });
  }

  try {
    const result = await db.query(
      'SELECT id, username, email, password_hash, role FROM users WHERE email = $1',
      [email]
    );
    if (result.rowCount === 0) {
      return res.status(401).render('auth/login', {
        title: 'Login',
        error: 'Invalid email or password.'
      });
    }

    const user = result.rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).render('auth/login', {
        title: 'Login',
        error: 'Invalid email or password.'
      });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: config.nodeEnv === 'production'
    });
    return res.redirect('/projects');
  } catch (err) {
    console.error('❌ Login failed:', err.message);
    return res.status(500).render('auth/login', {
      title: 'Login',
      error: config.nodeEnv === 'development' ? err.message : 'Login failed.'
    });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/');
});

module.exports = router;

