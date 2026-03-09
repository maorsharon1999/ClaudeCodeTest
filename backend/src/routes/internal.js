'use strict';
const express = require('express');
const { adminRequired } = require('../middleware/adminAuth');
const { getReports, banUser, unbanUser } = require('../services/moderationService');

const router = express.Router();
router.use(adminRequired);

// GET /internal/reports
router.get('/reports', async (req, res, next) => {
  try {
    const reports = await getReports();
    return res.status(200).json({ reports });
  } catch (err) {
    next(err);
  }
});

// POST /internal/users/:id/ban
router.post('/users/:id/ban', async (req, res, next) => {
  try {
    await banUser(req.params.id);
    return res.status(200).json({ banned: true });
  } catch (err) {
    if (err.code === 'VALIDATION_ERROR') return res.status(400).json({ error: { code: err.code, message: err.message } });
    if (err.code === 'NOT_FOUND') return res.status(404).json({ error: { code: err.code, message: err.message } });
    next(err);
  }
});

// DELETE /internal/users/:id/ban
router.delete('/users/:id/ban', async (req, res, next) => {
  try {
    await unbanUser(req.params.id);
    return res.status(200).json({ banned: false });
  } catch (err) {
    if (err.code === 'VALIDATION_ERROR') return res.status(400).json({ error: { code: err.code, message: err.message } });
    if (err.code === 'NOT_FOUND') return res.status(404).json({ error: { code: err.code, message: err.message } });
    next(err);
  }
});

module.exports = router;
