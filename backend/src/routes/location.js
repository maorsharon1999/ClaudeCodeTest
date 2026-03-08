'use strict';
const express   = require('express');
const rateLimit = require('express-rate-limit');
const { authRequired } = require('../middleware/auth');
const { upsertLocation } = require('../services/locationService');

const router = express.Router();
router.use(authRequired);

// Per-user: max 20 location updates per 5 minutes (~1 per 15 s).
// Slows trilateration grid-scan from instant to >4 minutes for a 2×2 km area.
const locationUpdateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 20,
  keyGenerator: (req) => req.userId,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMIT', message: 'Too many location updates. Try again later.' } },
});
router.use(locationUpdateLimiter);

router.put('/me', async (req, res, next) => {
  try {
    const { lat, lng } = req.body;
    await upsertLocation(req.userId, lat, lng);
    res.json({ ok: true });
  } catch (err) {
    if (err.code === 'VALIDATION_ERROR') {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: err.message } });
    }
    next(err);
  }
});

module.exports = router;
