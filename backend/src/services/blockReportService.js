'use strict';
const pool = require('../db/pool');

function makeError(status, code, message) {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  return err;
}

async function blockUser(blockerId, blockedId) {
  if (!blockedId) {
    throw makeError(400, 'VALIDATION_ERROR', 'blocked_id is required.');
  }
  if (blockerId === blockedId) {
    throw makeError(400, 'VALIDATION_ERROR', 'Cannot block yourself.');
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
  if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
    throw makeError(400, 'VALIDATION_ERROR', 'reason is required.');
  }
  if (reason.length > 500) {
    throw makeError(400, 'VALIDATION_ERROR', 'reason must be 500 characters or fewer.');
  }
  await pool.query(
    'INSERT INTO reports (reporter_id, reported_id, reason) VALUES ($1, $2, $3)',
    [reporterId, reportedId, reason.trim()]
  );
}

module.exports = { blockUser, unblockUser, reportUser };
