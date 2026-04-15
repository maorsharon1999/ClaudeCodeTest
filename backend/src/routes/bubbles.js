'use strict';
const express   = require('express');
const rateLimit = require('express-rate-limit');
const { authRequired } = require('../middleware/auth');
const {
  createBubble,
  getBubble,
  getNearbyBubbles,
  joinBubble,
  leaveBubble,
  getMembers,
  sendMessage,
  getMessages,
  closeBubble,
  reportBubble,
} = require('../services/bubbleService');

const router = express.Router();
router.use(authRequired);

// Rate limiters -----------------------------------------------------------

// Max 5 bubble creations per hour per user
const createLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => req.userId,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMIT', message: 'Too many bubbles created. Try again later.' } },
});

// Max 30 messages per minute per user
const messageLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  keyGenerator: (req) => req.userId,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMIT', message: 'Too many messages sent. Try again later.' } },
});

// Max 30 discovery requests per 5 minutes per user (mirrors discovery.js)
const nearbyLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 30,
  keyGenerator: (req) => req.userId,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMIT', message: 'Too many discovery requests. Try again later.' } },
});

// Routes ------------------------------------------------------------------

// POST / — create a bubble
router.post('/', createLimiter, async (req, res, next) => {
  try {
    const bubble = await createBubble(req.userId, req.body);
    return res.status(201).json({ bubble });
  } catch (err) {
    next(err);
  }
});

// GET /nearby — discover bubbles near caller
router.get('/nearby', nearbyLimiter, async (req, res, next) => {
  try {
    const { lat, lng } = req.query;
    const bubbles = await getNearbyBubbles(req.userId, lat, lng);
    return res.json({ bubbles });
  } catch (err) {
    next(err);
  }
});

// GET /:id — get a single bubble
router.get('/:id', async (req, res, next) => {
  try {
    const bubble = await getBubble(req.params.id);
    if (!bubble) {
      return res.status(404).json({ error: { code: 'BUBBLE_NOT_FOUND', message: 'Bubble not found.' } });
    }
    return res.json({ bubble });
  } catch (err) {
    next(err);
  }
});

// POST /:id/join — join a bubble
router.post('/:id/join', async (req, res, next) => {
  try {
    const member = await joinBubble(req.userId, req.params.id);
    return res.status(200).json({ member });
  } catch (err) {
    next(err);
  }
});

// POST /:id/leave — leave a bubble
router.post('/:id/leave', async (req, res, next) => {
  try {
    const left = await leaveBubble(req.userId, req.params.id);
    return res.json({ left });
  } catch (err) {
    next(err);
  }
});

// GET /:id/members — list active members
router.get('/:id/members', async (req, res, next) => {
  try {
    const members = await getMembers(req.params.id);
    return res.json({ members });
  } catch (err) {
    next(err);
  }
});

// POST /:id/messages — send a message
router.post('/:id/messages', messageLimiter, async (req, res, next) => {
  try {
    const { body } = req.body;
    const message = await sendMessage(req.userId, req.params.id, body);
    return res.status(201).json({ message });
  } catch (err) {
    next(err);
  }
});

// GET /:id/messages — fetch messages (cursor-based pagination)
router.get('/:id/messages', async (req, res, next) => {
  try {
    const { before, limit } = req.query;
    const messages = await getMessages(req.params.id, { before, limit });
    return res.json({ messages });
  } catch (err) {
    next(err);
  }
});

// POST /:id/close — creator closes a bubble
router.post('/:id/close', async (req, res, next) => {
  try {
    await closeBubble(req.userId, req.params.id);
    return res.json({ closed: true });
  } catch (err) {
    next(err);
  }
});

// POST /:id/report — report a bubble
router.post('/:id/report', async (req, res, next) => {
  try {
    const { reason } = req.body;
    await reportBubble(req.userId, req.params.id, reason);
    return res.status(201).json({ reported: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
