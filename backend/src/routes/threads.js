'use strict';
const express   = require('express');
const rateLimit = require('express-rate-limit');
const { authRequired } = require('../middleware/auth');
const { getThreadsForUser, getMessages, sendMessage } = require('../services/chatService');

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
    const messages = await getMessages(req.params.thread_id, req.userId);
    return res.status(200).json({ messages });
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

module.exports = router;
