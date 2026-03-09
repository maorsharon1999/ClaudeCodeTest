'use strict';
const express    = require('express');
const rateLimit  = require('express-rate-limit');
const { authRequired } = require('../middleware/auth');
const { reportUser } = require('../services/blockReportService');

const router = express.Router();
router.use(authRequired);

const reportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => req.userId,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMIT', message: 'Too many report actions. Try again later.' } },
});

// POST / — report a user
router.post('/', reportLimiter, async (req, res, next) => {
  try {
    const { reported_id, reason } = req.body;
    await reportUser(req.userId, reported_id, reason);
    return res.status(201).json({ reported: true });
  } catch (err) {
    if (err.code === 'VALIDATION_ERROR') return res.status(400).json({ error: { code: err.code, message: err.message } });
    if (err.code === 'FORBIDDEN') return res.status(403).json({ error: { code: err.code, message: err.message } });
    if (err.code === 'USER_NOT_FOUND') return res.status(404).json({ error: { code: err.code, message: err.message } });
    next(err);
  }
});

module.exports = router;
