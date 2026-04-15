'use strict';
const express          = require('express');
const multer           = require('multer');
const { v4: uuidv4 }   = require('uuid');
const { authRequired } = require('../middleware/auth');
const profileService   = require('../services/profileService');
const storageService   = require('../services/storageService');

const router = express.Router();
// Use memory storage — buffer is uploaded to Firebase or local disk by storageService
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

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
    const allowedTypes = ['image/jpeg', 'image/png'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({ error: { code: 'INVALID_TYPE', message: 'Only JPEG and PNG are allowed.' } });
    }
    // Magic-bytes validation — prevents MIME spoofing at the transport layer.
    // JPEG: 0xFF 0xD8 0xFF; PNG: 0x89 0x50 0x4E 0x47
    const buf = req.file.buffer;
    const isJpeg = buf.length >= 3 && buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF;
    const isPng  = buf.length >= 4 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47;
    if (!isJpeg && !isPng) {
      return res.status(400).json({ error: { code: 'INVALID_FILE_TYPE', message: 'File content does not match JPEG or PNG.' } });
    }
    const ext = req.file.mimetype === 'image/png' ? 'png' : 'jpg';
    const filename = `${uuidv4()}.${ext}`;
    const url = await storageService.uploadFile(req.file.buffer, filename, 'photos', req.file.mimetype);
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
