'use strict';
const express = require('express');
const { authRequired } = require('../middleware/auth');
const { upsertLocation } = require('../services/locationService');

const router = express.Router();
router.use(authRequired);

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
