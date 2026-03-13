'use strict';
const express   = require('express');
const fs        = require('fs');
const path      = require('path');
const multer    = require('multer');
const rateLimit = require('express-rate-limit');
const { authRequired } = require('../middleware/auth');
const { getThreadsForUser, getMessages, sendMessage, addVoiceNote } = require('../services/chatService');
const config    = require('../config');

const VOICE_UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads', 'voice');

const voiceUpload = multer({
  dest: VOICE_UPLOAD_DIR,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const ALLOWED_VOICE_MIMETYPES = ['audio/m4a', 'audio/mp4', 'audio/aac', 'audio/x-m4a'];

// Verify file is actually an audio container via magic bytes (prevents MIME spoofing).
// M4A/MP4: bytes 4-7 are ASCII 'ftyp'. AAC ADTS: bytes 0-1 are 0xFF 0xF1 or 0xFF 0xF9.
function isAudioContainer(filePath) {
  try {
    const buf = Buffer.alloc(12);
    const fd = fs.openSync(filePath, 'r');
    const bytesRead = fs.readSync(fd, buf, 0, 12, 0);
    fs.closeSync(fd);
    if (bytesRead < 8) return false;
    if (buf.slice(4, 8).toString('ascii') === 'ftyp') return true;
    if (buf[0] === 0xFF && (buf[1] === 0xF1 || buf[1] === 0xF9)) return true;
    return false;
  } catch {
    return false;
  }
}

const router = express.Router();
router.use(authRequired);

const messageSendLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  keyGenerator: (req) => req.userId,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMIT', message: 'Too many messages. Slow down.' } },
});

// Per-user: max 60 GET requests per minute (covers polling)
const threadReadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  keyGenerator: (req) => req.userId,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMIT', message: 'Too many requests. Slow down.' } },
});

// GET / — list threads
router.get('/', threadReadLimiter, async (req, res, next) => {
  try {
    const threads = await getThreadsForUser(req.userId);
    return res.status(200).json({ threads });
  } catch (err) {
    next(err);
  }
});

// GET /:thread_id/messages
router.get('/:thread_id/messages', threadReadLimiter, async (req, res, next) => {
  try {
    const { before, limit } = req.query;
    const result = await getMessages(req.params.thread_id, req.userId, { before, limit });
    return res.status(200).json({ messages: result.messages, has_more: result.has_more });
  } catch (err) {
    if (err.code === 'NOT_FOUND') return res.status(404).json({ error: { code: err.code, message: err.message } });
    if (err.code === 'FORBIDDEN') return res.status(403).json({ error: { code: err.code, message: err.message } });
    next(err);
  }
});

// POST /:thread_id/messages
router.post('/:thread_id/messages', messageSendLimiter, async (req, res, next) => {
  try {
    const { body } = req.body;
    const message = await sendMessage(req.params.thread_id, req.userId, body);
    return res.status(201).json({ message });
  } catch (err) {
    if (err.code === 'VALIDATION_ERROR') return res.status(400).json({ error: { code: err.code, message: err.message } });
    if (err.code === 'NOT_FOUND') return res.status(404).json({ error: { code: err.code, message: err.message } });
    if (err.code === 'FORBIDDEN') return res.status(403).json({ error: { code: err.code, message: err.message } });
    next(err);
  }
});

// POST /:thread_id/voice-notes
router.post('/:thread_id/voice-notes', messageSendLimiter, voiceUpload.single('audio'), async (req, res, next) => {
  const cleanup = () => { if (req.file) fs.unlink(req.file.path, () => {}); };
  try {
    if (!req.file) {
      return res.status(400).json({ error: { code: 'NO_FILE', message: 'Audio file is required.' } });
    }

    if (!ALLOWED_VOICE_MIMETYPES.includes(req.file.mimetype) || !isAudioContainer(req.file.path)) {
      cleanup();
      return res.status(400).json({ error: { code: 'INVALID_TYPE', message: 'Audio must be m4a, mp4, or aac.' } });
    }

    const duration_s = parseInt(req.body.duration_s, 10);
    if (isNaN(duration_s) || duration_s < 1 || duration_s > 60) {
      cleanup();
      return res.status(400).json({ error: { code: 'INVALID_DURATION', message: 'duration_s must be between 1 and 60.' } });
    }

    const url = `${config.storageBaseUrl}/uploads/voice/${req.file.filename}`;
    const message = await addVoiceNote(req.userId, req.params.thread_id, url, duration_s);
    return res.status(201).json({ message });
  } catch (err) {
    cleanup();
    if (err.code === 'NOT_FOUND') return res.status(404).json({ error: { code: err.code, message: err.message } });
    if (err.code === 'FORBIDDEN') return res.status(403).json({ error: { code: err.code, message: err.message } });
    next(err);
  }
});

module.exports = router;
