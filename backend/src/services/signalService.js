'use strict';
const pool = require('../db/pool');

function makeError(status, code, message) {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  return err;
}

async function sendSignal(senderId, recipientId) {
  // 1. Self-signal check
  if (recipientId === senderId) {
    throw makeError(400, 'VALIDATION_ERROR', 'Cannot signal yourself.');
  }

  // 2. Check recipient visibility
  const recipVisResult = await pool.query(
    'SELECT state FROM visibility_states WHERE user_id = $1',
    [recipientId]
  );
  if (recipVisResult.rows.length === 0 || recipVisResult.rows[0].state !== 'visible') {
    throw makeError(422, 'RECIPIENT_NOT_VISIBLE', 'Recipient is not currently visible.');
  }

  // 3. Check caller visibility
  const callerVisResult = await pool.query(
    'SELECT state FROM visibility_states WHERE user_id = $1',
    [senderId]
  );
  if (callerVisResult.rows.length === 0 || callerVisResult.rows[0].state !== 'visible') {
    throw makeError(422, 'CALLER_NOT_VISIBLE', 'You must be visible to send a signal.');
  }

  // 4. Compute distance and proximity bucket
  const distResult = await pool.query(
    `SELECT
       6371000 * acos(LEAST(1.0,
         cos(radians(a.lat)) * cos(radians(b.lat))
           * cos(radians(b.lng) - radians(a.lng))
         + sin(radians(a.lat)) * sin(radians(b.lat))
       )) AS dist_m,
       CASE
         WHEN 6371000 * acos(LEAST(1.0,
           cos(radians(a.lat)) * cos(radians(b.lat))
             * cos(radians(b.lng) - radians(a.lng))
           + sin(radians(a.lat)) * sin(radians(b.lat))
         )) < 500 THEN 'nearby'
         WHEN 6371000 * acos(LEAST(1.0,
           cos(radians(a.lat)) * cos(radians(b.lat))
             * cos(radians(b.lng) - radians(a.lng))
           + sin(radians(a.lat)) * sin(radians(b.lat))
         )) < 2000 THEN 'same_area'
         ELSE NULL
       END AS proximity_bucket
     FROM user_locations a, user_locations b
     WHERE a.user_id = $1 AND b.user_id = $2
       AND a.recorded_at > NOW() - INTERVAL '30 minutes'
       AND b.recorded_at > NOW() - INTERVAL '30 minutes'`,
    [senderId, recipientId]
  );

  if (distResult.rows.length === 0) {
    throw makeError(422, 'OUT_OF_RANGE', 'Location data is missing or stale for one or both users.');
  }

  const { proximity_bucket } = distResult.rows[0];
  if (proximity_bucket === null || proximity_bucket === undefined) {
    throw makeError(422, 'OUT_OF_RANGE', 'Users are too far apart to signal.');
  }

  // 5. Duplicate/cooldown check
  const existingResult = await pool.query(
    'SELECT id, state, created_at, updated_at FROM signals WHERE sender_id = $1 AND recipient_id = $2',
    [senderId, recipientId]
  );

  if (existingResult.rows.length > 0) {
    const existing = existingResult.rows[0];
    if (existing.state === 'pending' || existing.state === 'approved') {
      throw makeError(409, 'SIGNAL_DUPLICATE', 'A signal to this user already exists.');
    }
    if (existing.state === 'declined') {
      // Cooldown measured from when the signal was declined (updated_at), not created
      const declinedAt = new Date(existing.updated_at || existing.created_at);
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      if (declinedAt > sevenDaysAgo) {
        throw makeError(429, 'SIGNAL_COOLDOWN', 'Cannot signal this user again yet. Please wait.');
      }
      // Older than 7 days — delete stale declined row
      await pool.query(
        'DELETE FROM signals WHERE sender_id = $1 AND recipient_id = $2',
        [senderId, recipientId]
      );
    }
  }

  // 6. Insert new signal
  const insertResult = await pool.query(
    `INSERT INTO signals (sender_id, recipient_id, proximity_bucket)
     VALUES ($1, $2, $3)
     RETURNING id, sender_id, recipient_id, state, proximity_bucket, created_at`,
    [senderId, recipientId, proximity_bucket]
  );

  return insertResult.rows[0];
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function respondSignal(signalId, recipientId, action) {
  // 0. Validate signalId is a UUID before hitting the DB
  if (!UUID_RE.test(signalId)) {
    throw makeError(404, 'NOT_FOUND', 'Signal not found.');
  }

  // 1. Fetch signal
  const signalResult = await pool.query(
    'SELECT id, sender_id, recipient_id, state FROM signals WHERE id = $1',
    [signalId]
  );
  if (signalResult.rows.length === 0) {
    throw makeError(404, 'NOT_FOUND', 'Signal not found.');
  }

  const signal = signalResult.rows[0];

  // 2. Ownership check
  if (signal.recipient_id !== recipientId) {
    throw makeError(403, 'FORBIDDEN', 'You are not the recipient of this signal.');
  }

  // 3. State check
  if (signal.state !== 'pending') {
    throw makeError(409, 'SIGNAL_NOT_PENDING', 'Signal has already been decided.');
  }

  // 4. Validate action
  if (action !== 'approve' && action !== 'decline') {
    throw makeError(400, 'VALIDATION_ERROR', 'Action must be "approve" or "decline".');
  }

  // 5. Update state
  const newState = action === 'approve' ? 'approved' : 'declined';
  const updateResult = await pool.query(
    'UPDATE signals SET state=$1, updated_at=NOW() WHERE id=$2 RETURNING id, state, updated_at',
    [newState, signalId]
  );

  return updateResult.rows[0];
}

async function getIncoming(recipientId) {
  const result = await pool.query(
    `SELECT
       s.id,
       s.proximity_bucket,
       s.created_at,
       p.user_id    AS sender_user_id,
       p.display_name,
       date_part('year', age(p.birth_date))::int AS age,
       p.bio,
       p.photos
     FROM signals s
     JOIN profiles p ON p.user_id = s.sender_id
     WHERE s.recipient_id = $1
       AND s.state = 'pending'
     ORDER BY s.created_at DESC`,
    [recipientId]
  );

  return result.rows.map(row => ({
    id: row.id,
    created_at: row.created_at,
    proximity_bucket: row.proximity_bucket,
    sender: {
      user_id: row.sender_user_id,
      display_name: row.display_name,
      age: row.age,
      bio: row.bio,
      photos: row.photos,
    },
  }));
}

async function getOutgoing(senderId) {
  const result = await pool.query(
    `SELECT
       s.id,
       s.state,
       s.proximity_bucket,
       s.created_at,
       p.user_id    AS recipient_user_id,
       p.display_name,
       date_part('year', age(p.birth_date))::int AS age
     FROM signals s
     JOIN profiles p ON p.user_id = s.recipient_id
     WHERE s.sender_id = $1
       AND s.state IN ('pending', 'approved')
     ORDER BY s.created_at DESC`,
    [senderId]
  );

  return result.rows.map(row => ({
    id: row.id,
    state: row.state,
    created_at: row.created_at,
    proximity_bucket: row.proximity_bucket,
    recipient: {
      user_id: row.recipient_user_id,
      display_name: row.display_name,
      age: row.age,
    },
  }));
}

module.exports = { sendSignal, respondSignal, getIncoming, getOutgoing };
