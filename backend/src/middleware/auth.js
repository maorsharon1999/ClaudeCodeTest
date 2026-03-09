'use strict';
const jwt    = require('jsonwebtoken');
const config = require('../config');
const pool   = require('../db/pool');

async function authRequired(req, res, next) {
  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Missing or invalid Authorization header.' } });
  }
  const token = header.slice(7);
  let payload;
  try {
    payload = jwt.verify(token, config.jwtAccessSecret);
  } catch (err) {
    return res.status(401).json({ error: { code: 'TOKEN_INVALID', message: 'Access token is invalid or expired.' } });
  }
  req.userId = payload.sub;

  // Ban check — runs on every authenticated request
  try {
    const result = await pool.query('SELECT banned_at FROM users WHERE id = $1', [req.userId]);
    if (result.rows.length > 0 && result.rows[0].banned_at != null) {
      return res.status(403).json({ error: { code: 'ACCOUNT_BANNED', message: 'Your account has been banned.' } });
    }
  } catch (err) {
    return next(err);
  }

  next();
}

module.exports = { authRequired };
