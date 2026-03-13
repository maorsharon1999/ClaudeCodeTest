'use strict';
const express = require('express');
const fs      = require('fs');
const path    = require('path');
const jwt     = require('jsonwebtoken');
const config  = require('../config');
const pool    = require('../db/pool');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

// GET /voice-notes/:filename — authenticated stream
// Accepts auth via Authorization: Bearer header OR ?token= query param.
// The query-param path exists solely for expo-av which cannot set custom headers.
// Filename is validated against a safe character set to prevent path traversal.
router.get('/:filename', async (req, res, next) => {
  // If a bearer header is already present, delegate to the standard middleware.
  const header = req.headers['authorization'];
  if (header && header.startsWith('Bearer ')) {
    return authRequired(req, res, next);
  }

  // Fallback: query-param token (used by expo-av audio playback).
  const token = req.query.token;
  if (!token) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Missing or invalid Authorization header.' } });
  }
  let payload;
  try {
    payload = jwt.verify(token, config.jwtAccessSecret);
  } catch {
    return res.status(401).json({ error: { code: 'TOKEN_INVALID', message: 'Access token is invalid or expired.' } });
  }
  req.userId = payload.sub;

  try {
    const result = await pool.query('SELECT banned_at FROM users WHERE id = $1', [req.userId]);
    if (result.rows.length > 0 && result.rows[0].banned_at != null) {
      return res.status(403).json({ error: { code: 'ACCOUNT_BANNED', message: 'Your account has been banned.' } });
    }
  } catch (err) {
    return next(err);
  }

  next();
}, (req, res) => {
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
