const express = require('express');
const os = require('os');

const config = require('../config');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/diagnostics', requireAuth, requireRole('admin'), async (req, res) => {
  let dbStatus = { ok: false, message: 'unknown' };
  try {
    await db.query('SELECT 1');
    dbStatus = { ok: true, message: 'connected' };
  } catch (err) {
    dbStatus = { ok: false, message: err.message };
  }

  res.render('admin/diagnostics', {
    title: 'Admin Diagnostics',
    diagnostics: {
      hostname: os.hostname(),
      uptimeSeconds: Math.floor(process.uptime()),
      environment: config.nodeEnv,
      appVersion: config.appVersion,
      dbStatus
    }
  });
});

module.exports = router;

