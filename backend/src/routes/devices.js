'use strict';
const express = require('express');
const { authRequired } = require('../middleware/auth');
const pool = require('../db/pool');

const router = express.Router();
router.use(authRequired);

// POST /token — register or refresh a push token
router.post('/token', async (req, res, next) => {
  try {
    const { token, platform } = req.body;
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'token is required.' } });
    }
    if (!['android', 'ios', 'web'].includes(platform)) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'platform must be android, ios, or web.' } });
    }

    await pool.query(
      `INSERT INTO fcm_tokens (user_id, token, platform)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, token)
       DO UPDATE SET updated_at = NOW(), platform = EXCLUDED.platform`,
      [req.userId, token, platform]
    );

    return res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
});

// DELETE /token — remove a push token (logout / device unregister)
router.delete('/token', async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'token is required.' } });
    }

    await pool.query(
      'DELETE FROM fcm_tokens WHERE user_id = $1 AND token = $2',
      [req.userId, token]
    );

    return res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
