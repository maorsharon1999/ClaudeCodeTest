'use strict';
const pool = require('../db/pool');

function makeError(status, code, message) {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  return err;
}

// Returns all threads for the caller where:
// - an approved signal exists between the pair (either direction)
// - no active block exists in either direction
// Side-effect: upserts a thread row for each qualifying pair
async function getThreadsForUser(userId) {
  // 1. Find all approved pairs (no blocks in either direction)
  const pairsResult = await pool.query(
    `SELECT
       CASE WHEN s.sender_id = $1 THEN s.recipient_id ELSE s.sender_id END AS other_id
     FROM signals s
     WHERE (s.sender_id = $1 OR s.recipient_id = $1)
       AND s.state = 'approved'
       AND NOT EXISTS (
         SELECT 1 FROM blocks b
         WHERE (b.blocker_id = $1 AND b.blocked_id = (CASE WHEN s.sender_id = $1 THEN s.recipient_id ELSE s.sender_id END))
            OR (b.blocker_id = (CASE WHEN s.sender_id = $1 THEN s.recipient_id ELSE s.sender_id END) AND b.blocked_id = $1)
       )`,
    [userId]
  );

  if (pairsResult.rows.length === 0) return [];

  // 2. Upsert threads for all qualifying pairs
  for (const { other_id } of pairsResult.rows) {
    const a = userId < other_id ? userId : other_id;
    const b = userId < other_id ? other_id : userId;
    await pool.query(
      `INSERT INTO chat_threads (user_a_id, user_b_id) VALUES ($1, $2) ON CONFLICT (user_a_id, user_b_id) DO NOTHING`,
      [a, b]
    );
  }

  // 3. Fetch threads with peer profile + last message
  const threadsResult = await pool.query(
    `SELECT
       t.id            AS thread_id,
       p.user_id       AS other_user_id,
       p.display_name,
       date_part('year', age(p.birth_date))::int AS age,
       p.photos,
       lm.id           AS last_msg_id,
       lm.body         AS last_msg_body,
       lm.sent_at      AS last_msg_sent_at,
       lm.sender_id    AS last_msg_sender_id
     FROM chat_threads t
     JOIN profiles p ON p.user_id = CASE WHEN t.user_a_id = $1 THEN t.user_b_id ELSE t.user_a_id END
     LEFT JOIN LATERAL (
       SELECT id, body, sent_at, sender_id
       FROM chat_messages
       WHERE thread_id = t.id
       ORDER BY sent_at DESC
       LIMIT 1
     ) lm ON true
     WHERE (t.user_a_id = $1 OR t.user_b_id = $1)
       AND NOT EXISTS (
         SELECT 1 FROM blocks b
         WHERE (b.blocker_id = $1 AND b.blocked_id = CASE WHEN t.user_a_id = $1 THEN t.user_b_id ELSE t.user_a_id END)
            OR (b.blocker_id = CASE WHEN t.user_a_id = $1 THEN t.user_b_id ELSE t.user_a_id END AND b.blocked_id = $1)
       )
     ORDER BY COALESCE(lm.sent_at, t.created_at) DESC`,
    [userId]
  );

  return threadsResult.rows.map(row => ({
    thread_id: row.thread_id,
    other_user: {
      user_id: row.other_user_id,  // needed for block/report, never displayed
      display_name: row.display_name,
      age: row.age,
      photos: row.photos,
    },
    last_message: row.last_msg_id ? {
      body: row.last_msg_body,
      sent_at: row.last_msg_sent_at,
      is_mine: row.last_msg_sender_id === userId,
    } : null,
  }));
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function getMessages(threadId, callerId, { before = null, limit = 50 } = {}) {
  if (!UUID_RE.test(threadId)) {
    throw makeError(404, 'NOT_FOUND', 'Thread not found.');
  }

  const threadResult = await pool.query(
    'SELECT user_a_id, user_b_id FROM chat_threads WHERE id = $1',
    [threadId]
  );
  if (threadResult.rows.length === 0) {
    throw makeError(404, 'NOT_FOUND', 'Thread not found.');
  }

  const { user_a_id, user_b_id } = threadResult.rows[0];
  if (callerId !== user_a_id && callerId !== user_b_id) {
    throw makeError(403, 'FORBIDDEN', 'You are not a member of this thread.');
  }

  // Check bilateral block
  const otherId = callerId === user_a_id ? user_b_id : user_a_id;
  const blockResult = await pool.query(
    `SELECT 1 FROM blocks WHERE (blocker_id = $1 AND blocked_id = $2) OR (blocker_id = $2 AND blocked_id = $1)`,
    [callerId, otherId]
  );
  if (blockResult.rows.length > 0) {
    throw makeError(403, 'FORBIDDEN', 'You are not a member of this thread.');
  }

  const clampedLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 100);

  const msgResult = await pool.query(
    `SELECT id, body, sent_at, sender_id
     FROM chat_messages
     WHERE thread_id = $1
       AND ($2::uuid IS NULL OR sent_at < (
         SELECT sent_at FROM chat_messages WHERE id = $2
       ))
     ORDER BY sent_at DESC
     LIMIT $3`,
    [threadId, before, clampedLimit]
  );

  // Reverse so client always receives messages in ascending sent_at order
  const rows = msgResult.rows.reverse();
  const hasMore = msgResult.rows.length === clampedLimit;

  return {
    messages: rows.map(row => ({
      id: row.id,
      body: row.body,
      sent_at: row.sent_at,
      is_mine: row.sender_id === callerId,
    })),
    has_more: hasMore,
  };
}

async function sendMessage(threadId, callerId, body) {
  if (!UUID_RE.test(threadId)) {
    throw makeError(404, 'NOT_FOUND', 'Thread not found.');
  }

  // Validate body
  if (!body || typeof body !== 'string' || body.trim().length === 0) {
    throw makeError(400, 'VALIDATION_ERROR', 'Message body is required.');
  }
  if (body.length > 1000) {
    throw makeError(400, 'VALIDATION_ERROR', 'Message body must be 1000 characters or fewer.');
  }

  const threadResult = await pool.query(
    'SELECT user_a_id, user_b_id FROM chat_threads WHERE id = $1',
    [threadId]
  );
  if (threadResult.rows.length === 0) {
    throw makeError(404, 'NOT_FOUND', 'Thread not found.');
  }

  const { user_a_id, user_b_id } = threadResult.rows[0];
  if (callerId !== user_a_id && callerId !== user_b_id) {
    throw makeError(403, 'FORBIDDEN', 'You are not a member of this thread.');
  }

  // Check bilateral block
  const otherId = callerId === user_a_id ? user_b_id : user_a_id;
  const blockResult = await pool.query(
    `SELECT 1 FROM blocks WHERE (blocker_id = $1 AND blocked_id = $2) OR (blocker_id = $2 AND blocked_id = $1)`,
    [callerId, otherId]
  );
  if (blockResult.rows.length > 0) {
    throw makeError(403, 'FORBIDDEN', 'You are not a member of this thread.');
  }

  const insertResult = await pool.query(
    `INSERT INTO chat_messages (thread_id, sender_id, body)
     VALUES ($1, $2, $3)
     RETURNING id, body, sent_at`,
    [threadId, callerId, body.trim()]
  );

  const row = insertResult.rows[0];
  return { id: row.id, body: row.body, sent_at: row.sent_at, is_mine: true };
}

module.exports = { getThreadsForUser, getMessages, sendMessage };
