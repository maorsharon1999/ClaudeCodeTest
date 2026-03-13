'use strict';
const express        = require('express');
const multer         = require('multer');
const { authRequired } = require('../middleware/auth');
const profileService   = require('../services/profileService');
const config           = require('../config');

const router = express.Router();
const upload = multer({ dest: 'uploads/', limits: { fileSize: 5 * 1024 * 1024 } });

// All profile routes require authentication
router.use(authRequired);

// GET /profile/me
router.get('/me', async (req, res, next) => {
  try {
    const profile = await profileService.getProfile(req.userId);
    if (!profile) {
      return res.status(404).json({ error: { code: 'PROFILE_NOT_FOUND', message: 'Profile not found.' } });
    }
    return res.status(200).json({ profile });
  } catch (err) {
    next(err);
  }
});

// PUT /profile/me
router.put('/me', async (req, res, next) => {
  try {
    const profile = await profileService.upsertProfile(req.userId, req.body);
    return res.status(200).json({ profile });
  } catch (err) {
    next(err);
  }
});

// POST /profile/me/photos/upload  (multipart file upload)
router.post('/me/photos/upload', upload.single('photo'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: { code: 'NO_FILE', message: 'No file provided.' } });
    if (!['image/jpeg', 'image/png'].includes(req.file.mimetype)) {
      return res.status(400).json({ error: { code: 'INVALID_TYPE', message: 'Only JPEG and PNG are allowed.' } });
    }
    const url = `${config.publicUrl}/uploads/${req.file.filename}`;
    const photos = await profileService.addPhoto(req.userId, url);
    return res.status(200).json({ photos });
  } catch (err) {
    next(err);
  }
});

// POST /profile/me/photos
router.post('/me/photos', async (req, res, next) => {
  try {
    const { url } = req.body;
    const photos = await profileService.addPhoto(req.userId, url);
    return res.status(200).json({ photos });
  } catch (err) {
    next(err);
  }
});

// DELETE /profile/me/photos/:index
router.delete('/me/photos/:index', async (req, res, next) => {
  try {
    const photos = await profileService.removePhoto(req.userId, req.params.index);
    return res.status(200).json({ photos });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
