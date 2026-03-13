'use strict';
const express = require('express');
const fs      = require('fs');
const path    = require('path');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

// GET /voice-notes/:filename — authenticated stream
// Only authenticated users may fetch voice note files.
// Filename is validated against a safe character set to prevent path traversal.
router.get('/:filename', authRequired, (req, res) => {
  const { filename } = req.params;
  if (!/^[\w\-\.]+$/.test(filename)) {
    return res.status(400).json({ error: { code: 'INVALID_FILENAME', message: 'Invalid filename.' } });
  }
  const filePath = path.join(__dirname, '..', '..', 'uploads', 'voice', filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Voice note not found.' } });
  }
  res.sendFile(filePath);
});

module.exports = router;
