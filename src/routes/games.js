/**
 * DevOps Playground — learning games (LAN Legends, etc.)
 */

const express = require('express');

const router = express.Router();

router.get('/lan-legends', (req, res) => {
  res.render('games/lan-legends', { title: 'LAN Legends' });
});

module.exports = router;
