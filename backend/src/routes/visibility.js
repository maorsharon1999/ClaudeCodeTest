'use strict';
const express           = require('express');
const { authRequired }  = require('../middleware/auth');
const visibilityService = require('../services/visibilityService');

const router = express.Router();

router.use(authRequired);

// GET /visibility/me
router.get('/me', async (req, res, next) => {
  try {
    const result = await visibilityService.getVisibility(req.userId);
    return res.status(200).json({ visibility: result });
  } catch (err) {
    next(err);
  }
});

// PUT /visibility/me
router.put('/me', async (req, res, next) => {
  try {
    const { state } = req.body;
    if (!state) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'state is required.' } });
    }
    const result = await visibilityService.setVisibility(req.userId, state);
    return res.status(200).json({ visibility: result });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
