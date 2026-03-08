'use strict';
const express   = require('express');
const rateLimit = require('express-rate-limit');
const { authRequired } = require('../middleware/auth');
const { getNearby } = require('../services/locationService');

const router = express.Router();
router.use(authRequired);

// Per-user: max 30 discovery polls per 5 minutes.
// Normal frontend usage is ~5 per 5 min (60 s interval); this allows 6× headroom.
const discoveryPollLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 30,
  keyGenerator: (req) => req.userId,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMIT', message: 'Too many discovery requests. Try again later.' } },
});
router.use(discoveryPollLimiter);

router.get('/nearby', async (req, res, next) => {
  try {
    const users = await getNearby(req.userId);
    res.json({ users });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
