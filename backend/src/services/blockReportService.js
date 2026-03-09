'use strict';
const pool = require('../db/pool');

function makeError(status, code, message) {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  return err;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
  // Require an approved signal between the pair
  const relResult = await pool.query(
    `SELECT 1 FROM signals
     WHERE ((sender_id = $1 AND recipient_id = $2) OR (sender_id = $2 AND recipient_id = $1))
       AND state = 'approved'
     LIMIT 1`,
    [blockerId, blockedId]
  );
  if (relResult.rows.length === 0) {
    throw makeError(403, 'FORBIDDEN', 'You can only block users you have matched with.');
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
  // Cancel any pending signal between the pair
  await pool.query(
    `UPDATE signals SET state = 'declined', updated_at = NOW()
     WHERE state = 'pending'
       AND ((sender_id = $1 AND recipient_id = $2) OR (sender_id = $2 AND recipient_id = $1))`,
    [blockerId, blockedId]
  );
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
  // Require an approved signal between the pair
  const relResult = await pool.query(
    `SELECT 1 FROM signals
     WHERE ((sender_id = $1 AND recipient_id = $2) OR (sender_id = $2 AND recipient_id = $1))
       AND state = 'approved'
     LIMIT 1`,
    [reporterId, reportedId]
  );
  if (relResult.rows.length === 0) {
    throw makeError(403, 'FORBIDDEN', 'You can only report users you have matched with.');
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
