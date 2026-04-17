'use strict';
const express = require('express');
const { authRequired } = require('../middleware/auth');
const { createSpatialMessage, getNearbyMessages } = require('../services/spatialMessagesService');

const router = express.Router();
router.use(authRequired);

// POST / — drop a spatial message at current location
router.post('/', async (req, res, next) => {
  try {
    const { content, lat, lng, visibility_type, target_user_ids } = req.body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'content is required.' } });
    }
    if (content.length > 280) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'content must be 280 characters or fewer.' } });
    }
    if (lat == null || lng == null || isNaN(parseFloat(lat)) || isNaN(parseFloat(lng))) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'lat and lng are required.' } });
    }
    const allowed = ['public', 'specific'];
    if (visibility_type && !allowed.includes(visibility_type)) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: `visibility_type must be one of: ${allowed.join(', ')}.` } });
    }

    const msg = await createSpatialMessage(req.userId, {
      content: content.trim(),
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      visibility_type: visibility_type || 'public',
      target_user_ids: target_user_ids || [],
    });

    return res.status(201).json({ message: msg });
  } catch (err) {
    next(err);
  }
});

// GET /nearby?lat=&lng= — fetch messages within 500m, applying visibility rules
router.get('/nearby', async (req, res, next) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'lat and lng query params are required.' } });
    }

    const messages = await getNearbyMessages(req.userId, lat, lng);
    return res.status(200).json({ messages });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
