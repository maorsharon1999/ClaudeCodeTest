'use strict';
const express    = require('express');
const rateLimit  = require('express-rate-limit');
const authService    = require('../services/authService');
const profileService = require('../services/profileService');

const router = express.Router();

// Per-IP rate limit for OTP requests (belt-and-suspenders; per-phone enforced in service)
const otpRequestLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMIT', message: 'Too many requests. Try again later.' } },
});

const E164_REGEX = /^\+[1-9]\d{6,14}$/;

// POST /auth/otp/request
router.post('/otp/request', otpRequestLimiter, async (req, res, next) => {
  try {
    const { phone } = req.body;
    if (!phone || typeof phone !== 'string' || !E164_REGEX.test(phone.trim())) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'phone must be a valid E.164 number (e.g. +12125551234).' } });
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
    if (!phone || !code || !E164_REGEX.test(String(phone).trim())) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'phone (E.164) and code are required.' } });
    }
    const tokens = await authService.verifyOtp(phone.trim(), String(code).trim());
    const profile = await profileService.getProfile(tokens.userId);
    return res.status(200).json({
      access_token:     tokens.accessToken,
      refresh_token:    tokens.refreshToken,
      user_id:          tokens.userId,
      profile_complete: !!profile,
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
