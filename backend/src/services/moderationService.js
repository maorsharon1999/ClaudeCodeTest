'use strict';
const pool = require('../db/pool');
const { makeError, UUID_RE } = require('../utils/errors');

async function getReports() {
  const result = await pool.query(
    `SELECT
       r.id,
       r.reason,
       r.created_at,
       rp1.display_name AS reporter_name,
       rp2.display_name AS reported_name
     FROM reports r
     JOIN profiles rp1 ON rp1.user_id = r.reporter_id
     JOIN profiles rp2 ON rp2.user_id = r.reported_id
     ORDER BY r.created_at DESC`
  );
  return result.rows;
}

async function banUser(userId) {
  if (!UUID_RE.test(userId)) {
    throw makeError(400, 'VALIDATION_ERROR', 'Invalid user ID format.');
  }
  const result = await pool.query(
    'UPDATE users SET banned_at = NOW() WHERE id = $1 RETURNING id',
    [userId]
  );
  if (result.rowCount === 0) {
    throw makeError(404, 'NOT_FOUND', 'User not found.');
  }
}

async function unbanUser(userId) {
  if (!UUID_RE.test(userId)) {
    throw makeError(400, 'VALIDATION_ERROR', 'Invalid user ID format.');
  }
  const result = await pool.query(
    'UPDATE users SET banned_at = NULL WHERE id = $1 RETURNING id',
    [userId]
  );
  if (result.rowCount === 0) {
    throw makeError(404, 'NOT_FOUND', 'User not found.');
  }
}

module.exports = { getReports, banUser, unbanUser };
