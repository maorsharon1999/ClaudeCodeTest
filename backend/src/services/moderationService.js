'use strict';
const pool = require('../db/pool');
const { makeError, UUID_RE } = require('../utils/errors');

async function getReports() {
  const result = await pool.query(
    `SELECT
       r.id,
       r.reason,
       r.created_at,
       r.reported_bubble_id,
       rp1.display_name AS reporter_name,
       rp2.display_name AS reported_name,
       b.title AS bubble_title
     FROM reports r
     JOIN profiles rp1 ON rp1.user_id = r.reporter_id
     LEFT JOIN profiles rp2 ON rp2.user_id = r.reported_id
     LEFT JOIN bubbles b ON b.id = r.reported_bubble_id
     ORDER BY r.created_at DESC`
  );
  return result.rows;
}

async function getReportedBubbles() {
  const result = await pool.query(
    `SELECT
       r.id AS report_id,
       r.reason,
       r.created_at AS reported_at,
       rp.display_name AS reporter_name,
       b.id AS bubble_id,
       b.title,
       b.category,
       b.creator_id,
       cp.display_name AS creator_name,
       b.removed_at
     FROM reports r
     JOIN bubbles b ON b.id = r.reported_bubble_id
     JOIN profiles rp ON rp.user_id = r.reporter_id
     JOIN profiles cp ON cp.user_id = b.creator_id
     WHERE r.reported_bubble_id IS NOT NULL
     ORDER BY r.created_at DESC`
  );
  return result.rows;
}

async function removeBubble(bubbleId) {
  if (!UUID_RE.test(bubbleId)) {
    throw makeError(400, 'VALIDATION_ERROR', 'Invalid bubble ID format.');
  }
  const result = await pool.query(
    'UPDATE bubbles SET removed_at = NOW() WHERE id = $1 AND removed_at IS NULL RETURNING id',
    [bubbleId]
  );
  if (result.rowCount === 0) {
    throw makeError(404, 'NOT_FOUND', 'Bubble not found or already removed.');
  }
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

module.exports = { getReports, getReportedBubbles, removeBubble, banUser, unbanUser };
