'use strict';
const express = require('express');
const { adminRequired } = require('../middleware/adminAuth');
const { getReports, getReportedBubbles, removeBubble, banUser, unbanUser } = require('../services/moderationService');
const { stripLegacyPhotoUrlsFromAllProfiles } = require('../services/profileService');

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

// GET /internal/reported-bubbles
router.get('/reported-bubbles', async (req, res, next) => {
  try {
    const reports = await getReportedBubbles();
    return res.status(200).json({ reports });
  } catch (err) {
    next(err);
  }
});

// POST /internal/bubbles/:id/remove
router.post('/bubbles/:id/remove', async (req, res, next) => {
  try {
    await removeBubble(req.params.id);
    return res.status(200).json({ removed: true });
  } catch (err) {
    if (err.code === 'VALIDATION_ERROR') return res.status(400).json({ error: { code: err.code, message: err.message } });
    if (err.code === 'NOT_FOUND') return res.status(404).json({ error: { code: err.code, message: err.message } });
    next(err);
  }
});

// POST /internal/migrate/strip-legacy-photo-urls
// One-time migration: nulls out any photo URL stored as http://localhost/uploads/*
// from before the Firebase Storage migration. Firebase URLs are preserved.
router.post('/migrate/strip-legacy-photo-urls', async (req, res, next) => {
  try {
    const updatedCount = await stripLegacyPhotoUrlsFromAllProfiles();
    return res.status(200).json({ updated: updatedCount });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
