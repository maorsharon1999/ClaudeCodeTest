'use strict';
const express = require('express');
const { authRequired } = require('../middleware/auth');
const { getNearby } = require('../services/locationService');

const router = express.Router();
router.use(authRequired);

router.get('/nearby', async (req, res, next) => {
  try {
    const users = await getNearby(req.userId);
    res.json({ users });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
