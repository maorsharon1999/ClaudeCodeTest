'use strict';
const express    = require('express');
const rateLimit  = require('express-rate-limit');
const authService = require('../services/authService');

const router = express.Router();

// Per-IP rate limit for OTP requests (belt-and-suspenders; per-phone enforced in service)
const otpRequestLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMIT', message: 'Too many requests. Try again later.' } },
});

// POST /auth/otp/request
router.post('/otp/request', otpRequestLimiter, async (req, res, next) => {
  try {
    const { phone } = req.body;
    if (!phone || typeof phone !== 'string' || phone.trim() === '') {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'phone is required.' } });
    }
    await authService.requestOtp(phone.trim());
    return res.status(200).json({ message: 'OTP sent.' });
  } catch (err) {
    next(err);
  }
});

// POST /auth/otp/verify
router.post('/otp/verify', async (req, res, next) => {
  try {
    const { phone, code } = req.body;
    if (!phone || !code) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'phone and code are required.' } });
    }
    const tokens = await authService.verifyOtp(phone.trim(), String(code).trim());
    return res.status(200).json({
      access_token:  tokens.accessToken,
      refresh_token: tokens.refreshToken,
      user_id:       tokens.userId,
    });
  } catch (err) {
    next(err);
  }
});

// POST /auth/token/refresh
router.post('/token/refresh', async (req, res, next) => {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'refresh_token is required.' } });
    }
    const result = await authService.refreshAccessToken(refresh_token);
    return res.status(200).json({ access_token: result.accessToken });
  } catch (err) {
    next(err);
  }
});

// DELETE /auth/session
router.delete('/session', async (req, res, next) => {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'refresh_token is required.' } });
    }
    await authService.deleteSession(refresh_token);
    return res.status(200).json({ message: 'Session invalidated.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
