'use strict';
const express    = require('express');
const rateLimit  = require('express-rate-limit');
const pool       = require('../db/pool');
const { authRequired } = require('../middleware/auth');
const { blockUser, unblockUser } = require('../services/blockReportService');

const router = express.Router();
router.use(authRequired);

const blockLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => req.userId,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMIT', message: 'Too many block actions. Try again later.' } },
});

// GET / — list blocked users with their profile info
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT b.blocked_id, p.display_name, p.photos
       FROM blocks b
       LEFT JOIN profiles p ON p.user_id = b.blocked_id
       WHERE b.blocker_id = $1
       ORDER BY b.created_at DESC`,
      [req.userId]
    );
    return res.status(200).json({ blocks: rows });
  } catch (err) {
    next(err);
  }
});

// POST / — block a user
router.post('/', blockLimiter, async (req, res, next) => {
  try {
    const { blocked_id } = req.body;
    await blockUser(req.userId, blocked_id);
    return res.status(201).json({ blocked: true });
  } catch (err) {
    if (err.code === 'VALIDATION_ERROR') return res.status(400).json({ error: { code: err.code, message: err.message } });
    if (err.code === 'FORBIDDEN') return res.status(403).json({ error: { code: err.code, message: err.message } });
    if (err.code === 'USER_NOT_FOUND') return res.status(404).json({ error: { code: err.code, message: err.message } });
    if (err.code === 'ALREADY_BLOCKED') return res.status(409).json({ error: { code: err.code, message: err.message } });
    next(err);
  }
});

// DELETE /:blocked_id — unblock
router.delete('/:blocked_id', async (req, res, next) => {
  try {
    await unblockUser(req.userId, req.params.blocked_id);
    return res.status(200).json({ unblocked: true });
  } catch (err) {
    if (err.code === 'NOT_FOUND') return res.status(404).json({ error: { code: err.code, message: err.message } });
    next(err);
  }
});

module.exports = router;
