'use strict';
const express   = require('express');
const rateLimit = require('express-rate-limit');
const { authRequired } = require('../middleware/auth');
const {
  sendSignal,
  respondSignal,
  getIncoming,
  getOutgoing,
} = require('../services/signalService');
const { sendToUser } = require('../services/notify');
const pool = require('../db/pool');

const router = express.Router();
router.use(authRequired);

// Per-user: max 20 signals per 60 minutes
const signalSendLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  keyGenerator: (req) => req.userId,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMIT', message: 'Too many signals sent. Try again later.' } },
});

// Per-user: max 60 PUT actions per 5 minutes
const signalRespondLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 60,
  keyGenerator: (req) => req.userId,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMIT', message: 'Too many responses. Try again later.' } },
});

// POST / — send a signal
router.post('/', signalSendLimiter, async (req, res, next) => {
  try {
    const { recipient_id } = req.body;
    if (!recipient_id) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'recipient_id is required.' } });
    }
    const signal = await sendSignal(req.userId, recipient_id);
    res.status(201).json({ signal });

    try {
      const pr = await pool.query('SELECT display_name FROM profiles WHERE user_id = $1', [req.userId]);
      const name = pr.rows[0]?.display_name || 'Someone';
      await sendToUser(recipient_id, {
        title: 'New Signal',
        body: `${name} sent you a signal`,
        data: { type: 'signal_received', signal_id: signal.id },
      });
    } catch (notifyErr) {
      console.error('Signal notification failed:', notifyErr.message);
    }
    return;
  } catch (err) {
    if (err.code === 'VALIDATION_ERROR') {
      return res.status(400).json({ error: { code: err.code, message: err.message } });
    }
    if (err.code === 'RECIPIENT_NOT_VISIBLE' || err.code === 'CALLER_NOT_VISIBLE' || err.code === 'OUT_OF_RANGE') {
      return res.status(422).json({ error: { code: err.code, message: err.message } });
    }
    if (err.code === 'SIGNAL_DUPLICATE') {
      return res.status(409).json({ error: { code: err.code, message: err.message } });
    }
    if (err.code === 'SIGNAL_COOLDOWN') {
      return res.status(429).json({ error: { code: err.code, message: err.message } });
    }
    // Postgres unique constraint violation (race condition on concurrent inserts)
    if (err.code === '23505') {
      return res.status(409).json({ error: { code: 'SIGNAL_DUPLICATE', message: 'A signal to this user already exists.' } });
    }
    next(err);
  }
});

// PUT /:id — approve or decline a signal
router.put('/:id', signalRespondLimiter, async (req, res, next) => {
  try {
    const { action } = req.body;
    const updated = await respondSignal(req.params.id, req.userId, action);
    res.status(200).json({ signal: updated });

    if (action === 'approve') {
      try {
        const [approverPr, signalRow] = await Promise.all([
          pool.query('SELECT display_name FROM profiles WHERE user_id = $1', [req.userId]),
          pool.query('SELECT sender_id FROM signals WHERE id = $1', [req.params.id]),
        ]);
        const approverName = approverPr.rows[0]?.display_name || 'Someone';
        const senderId = signalRow.rows[0]?.sender_id;
        if (senderId) {
          await sendToUser(senderId, {
            title: 'Signal Approved!',
            body: `${approverName} approved your signal`,
            data: { type: 'signal_approved', signal_id: updated.id },
          });
        }
      } catch (notifyErr) {
        console.error('Signal approval notification failed:', notifyErr.message);
      }
    }
    return;
  } catch (err) {
    if (err.code === 'VALIDATION_ERROR') {
      return res.status(400).json({ error: { code: err.code, message: err.message } });
    }
    if (err.code === 'NOT_FOUND') {
      return res.status(404).json({ error: { code: err.code, message: err.message } });
    }
    if (err.code === 'FORBIDDEN') {
      return res.status(403).json({ error: { code: err.code, message: err.message } });
    }
    if (err.code === 'SIGNAL_NOT_PENDING') {
      return res.status(409).json({ error: { code: err.code, message: err.message } });
    }
    next(err);
  }
});

// GET /incoming — list pending signals sent to me
router.get('/incoming', async (req, res, next) => {
  try {
    const signals = await getIncoming(req.userId);
    return res.status(200).json({ signals });
  } catch (err) {
    next(err);
  }
});

// GET /outgoing — list my sent signals (pending/approved only)
router.get('/outgoing', async (req, res, next) => {
  try {
    const signals = await getOutgoing(req.userId);
    return res.status(200).json({ signals });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
