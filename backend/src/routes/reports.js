'use strict';
const express = require('express');
const { authRequired } = require('../middleware/auth');
const { reportUser } = require('../services/blockReportService');

const router = express.Router();
router.use(authRequired);

// POST / — report a user
router.post('/', async (req, res, next) => {
  try {
    const { reported_id, reason } = req.body;
    await reportUser(req.userId, reported_id, reason);
    return res.status(201).json({ reported: true });
  } catch (err) {
    if (err.code === 'VALIDATION_ERROR') return res.status(400).json({ error: { code: err.code, message: err.message } });
    next(err);
  }
});

module.exports = router;
