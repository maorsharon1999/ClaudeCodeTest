'use strict';
const jwt = require('jsonwebtoken');
const config = require('../config');

function authRequired(req, res, next) {
  // AUTH FROZEN: bypass JWT check for development. Restore block below when re-enabling auth.
  req.userId = '00000000-0000-0000-0000-000000000001';
  return next();

  /* eslint-disable no-unreachable */
  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Missing or invalid Authorization header.' } });
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, config.jwtAccessSecret);
    req.userId = payload.sub;
    next();
  } catch (err) {
    return res.status(401).json({ error: { code: 'TOKEN_INVALID', message: 'Access token is invalid or expired.' } });
  }
  /* eslint-enable no-unreachable */
}

module.exports = { authRequired };
