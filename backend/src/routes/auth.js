'use strict';
const express    = require('express');
const authService    = require('../services/authService');
const profileService = require('../services/profileService');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

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

// POST /auth/firebase/verify
// Accepts a Firebase ID token, verifies it via Firebase Admin SDK,
// upserts the user, and returns a backend JWT pair.
// This is the sole auth entry point — OTP and email/password routes have been removed.
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
