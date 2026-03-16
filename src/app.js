/**
 * Express application setup.
 * This file configures middleware, view engine, and routes.
 * It is separated from server.js so tests can import the app without starting the server.
 */

const express = require('express');
const path = require('path');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const config = require('./config');

// Import route modules
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const noteRoutes = require('./routes/notes');
const healthRoutes = require('./routes/health');
const adminRoutes = require('./routes/admin');

const app = express();

// ─── View Engine ──────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ─── Middleware ───────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false })); // Relaxed CSP for EJS pages
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// ─── Make user & config available in all EJS templates ───
app.use((req, res, next) => {
  const token = req.cookies.token;
  if (token) {
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, config.jwtSecret);
      req.user = decoded;
      res.locals.user = decoded;
    } catch {
      res.locals.user = null;
    }
  } else {
    res.locals.user = null;
  }
  res.locals.appVersion = config.appVersion;
  next();
});

// ─── Routes ──────────────────────────────────────────────
app.use('/auth', authRoutes);
app.use('/projects', projectRoutes);
app.use('/projects', taskRoutes); // nested: /projects/:projectId/tasks
app.use('/projects', noteRoutes); // nested: /projects/:projectId/notes
app.use('/', healthRoutes);
app.use('/admin', adminRoutes);

// Home page
app.get('/', (req, res) => {
  res.render('index', { title: 'DevOps Playground' });
});

// ─── 404 Handler ─────────────────────────────────────────
app.use((req, res) => {
  res.status(404).render('index', {
    title: '404 – Not Found',
    error: 'The page you are looking for does not exist.'
  });
});

// ─── Error Handler ───────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error('❌ Unhandled error:', err.message);
  res.status(500).render('index', {
    title: 'Server Error',
    error: config.nodeEnv === 'development' ? err.message : 'Internal server error'
  });
});

module.exports = app;

