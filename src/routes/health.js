const express = require('express');
const config = require('../config');
const db = require('../db');

const router = express.Router();

router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

router.get('/ready', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.status(200).json({ status: 'ready', db: 'ok' });
  } catch (err) {
    res.status(503).json({ status: 'not-ready', db: 'error', error: err.message });
  }
});

router.get('/version', (req, res) => {
  res.status(200).json({ version: config.appVersion });
});

module.exports = router;

