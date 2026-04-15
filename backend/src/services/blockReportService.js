'use strict';
const pool = require('../db/pool');
const { makeError, UUID_RE } = require('../utils/errors');

async function blockUser(blockerId, blockedId) {
  if (!blockedId) {
    throw makeError(400, 'VALIDATION_ERROR', 'blocked_id is required.');
  }
  if (blockerId === blockedId) {
    throw makeError(400, 'VALIDATION_ERROR', 'Cannot block yourself.');
  }
  if (!UUID_RE.test(blockedId)) {
    throw makeError(400, 'VALIDATION_ERROR', 'Invalid user ID format.');
  }
  // Require shared bubble membership (current or past) between the pair
  const relResult = await pool.query(
    `SELECT 1 FROM bubble_members bm1
     JOIN bubble_members bm2 ON bm1.bubble_id = bm2.bubble_id
     WHERE bm1.user_id = $1 AND bm2.user_id = $2
     LIMIT 1`,
    [blockerId, blockedId]
  );
  if (relResult.rows.length === 0) {
    throw makeError(403, 'FORBIDDEN', 'You can only block users you have shared a bubble with.');
  }
  try {
    await pool.query(
      'INSERT INTO blocks (blocker_id, blocked_id) VALUES ($1, $2)',
      [blockerId, blockedId]
    );
  } catch (err) {
    if (err.code === '23505') {
      throw makeError(409, 'ALREADY_BLOCKED', 'You have already blocked this user.');
    }
    if (err.code === '23503') {
      throw makeError(404, 'USER_NOT_FOUND', 'User does not exist.');
    }
    throw err;
  }
}

async function unblockUser(blockerId, blockedId) {
  const result = await pool.query(
    'DELETE FROM blocks WHERE blocker_id = $1 AND blocked_id = $2',
    [blockerId, blockedId]
  );
  if (result.rowCount === 0) {
    throw makeError(404, 'NOT_FOUND', 'No active block found for this user.');
  }
}

async function reportUser(reporterId, reportedId, reason) {
  if (!reportedId) {
    throw makeError(400, 'VALIDATION_ERROR', 'reported_id is required.');
  }
  if (reporterId === reportedId) {
    throw makeError(400, 'VALIDATION_ERROR', 'Cannot report yourself.');
  }
  if (!UUID_RE.test(reportedId)) {
    throw makeError(400, 'VALIDATION_ERROR', 'Invalid user ID format.');
  }
  if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
    throw makeError(400, 'VALIDATION_ERROR', 'reason is required.');
  }
  if (reason.length > 500) {
    throw makeError(400, 'VALIDATION_ERROR', 'reason must be 500 characters or fewer.');
  }
  // Require shared bubble membership (current or past) between the pair
  const relResult = await pool.query(
    `SELECT 1 FROM bubble_members bm1
     JOIN bubble_members bm2 ON bm1.bubble_id = bm2.bubble_id
     WHERE bm1.user_id = $1 AND bm2.user_id = $2
     LIMIT 1`,
    [reporterId, reportedId]
  );
  if (relResult.rows.length === 0) {
    throw makeError(403, 'FORBIDDEN', 'You can only report users you have shared a bubble with.');
  }
  try {
    await pool.query(
      'INSERT INTO reports (reporter_id, reported_id, reason) VALUES ($1, $2, $3)',
      [reporterId, reportedId, reason.trim()]
    );
  } catch (err) {
    if (err.code === '23503') {
      throw makeError(404, 'USER_NOT_FOUND', 'User does not exist.');
    }
    throw err;
  }
}

module.exports = { blockUser, unblockUser, reportUser };
