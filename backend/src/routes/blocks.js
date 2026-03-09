'use strict';
const express = require('express');
const { authRequired } = require('../middleware/auth');
const { blockUser, unblockUser } = require('../services/blockReportService');

const router = express.Router();
router.use(authRequired);

// POST / — block a user
router.post('/', async (req, res, next) => {
  try {
    const { blocked_id } = req.body;
    await blockUser(req.userId, blocked_id);
    return res.status(201).json({ blocked: true });
  } catch (err) {
    if (err.code === 'VALIDATION_ERROR') return res.status(400).json({ error: { code: err.code, message: err.message } });
    if (err.code === 'FORBIDDEN') return res.status(403).json({ error: { code: err.code, message: err.message } });
    if (err.code === 'ALREADY_BLOCKED') return res.status(409).json({ error: { code: err.code, message: err.message } });
    next(err);
  }
});

// DELETE /:blocked_id — unblock
router.delete('/:blocked_id', async (req, res, next) => {
  try {
    await unblockUser(req.userId, req.params.blocked_id);
    return res.status(200).json({ unblocked: true });
  } catch (err) {
    if (err.code === 'NOT_FOUND') return res.status(404).json({ error: { code: err.code, message: err.message } });
    next(err);
  }
});

module.exports = router;
