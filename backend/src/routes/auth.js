'use strict';
const express    = require('express');
const rateLimit  = require('express-rate-limit');
const authService    = require('../services/authService');
const profileService = require('../services/profileService');
const { authRequired } = require('../middleware/auth');

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

// POST /auth/register — email + password registration
router.post('/register', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const tokens = await authService.registerWithEmail(email, password);
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

// POST /auth/login — email + password login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const tokens = await authService.loginWithEmail(email, password);
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

// POST /auth/firebase/verify
// Accepts a Firebase ID token, verifies it via Firebase Admin SDK,
// upserts the user, and returns a backend JWT pair.
// This is the Phase 1 entry point — existing OTP routes remain untouched.
router.post('/firebase/verify', async (req, res, next) => {
  try {
    const { id_token } = req.body;
    if (!id_token || typeof id_token !== 'string') {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'id_token is required.' } });
    }

    const decoded = await authService.verifyFirebaseToken(id_token);
    const { userId, isNew } = await authService.findOrCreateByFirebaseUid(
      decoded.uid,
      decoded.phone_number || null,
      decoded.email || null
    );

    const profile = await profileService.getProfile(userId);
    const { accessToken, refreshToken } = await authService.issueTokensForUser(userId);

    return res.status(200).json({
      access_token:     accessToken,
      refresh_token:    refreshToken,
      user_id:          userId,
      profile_complete: !!profile,
      is_new_user:      isNew,
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /auth/account — permanently delete account and all data
router.delete('/account', authRequired, async (req, res, next) => {
  try {
    await authService.deleteAccount(req.userId);
    return res.status(200).json({ message: 'Account deleted.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
