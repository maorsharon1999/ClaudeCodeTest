'use strict';
const config = require('../config');

function adminRequired(req, res, next) {
  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Admin credentials required.' } });
  }
  const token = header.slice(7);
  if (!config.adminSecret || token !== config.adminSecret) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Admin credentials required.' } });
  }
  next();
}

module.exports = { adminRequired };
