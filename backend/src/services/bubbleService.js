'use strict';
const pool = require('../db/pool');
const { makeError, UUID_RE } = require('../utils/errors');
const { djb2 } = require('./locationService');

const VALID_CATEGORIES = [
  'Social', 'Study', 'Food & Drinks', 'Sports', 'Music',
  'Nightlife', 'Outdoors', 'Gaming', 'Tech', 'Art', 'Other',
];

const MAX_MEMBERS = 30;
const MAX_MESSAGES = 50;
const DISCOVERY_RADIUS_M = 5000;

// Deterministic jitter for bubble coordinates.
// Uses bubble id + 10-min time bucket so the pin drifts slowly
// rather than jumping every render. Exact venue coordinates
// are never exposed to clients.
function jitterBubbleCoords(bubbleId, lat, lng) {
  const timeBucket = Math.floor(Date.now() / 600000); // 10-min buckets
  const seed = djb2(bubbleId + String(timeBucket));

  // One extra LCG step for the lng axis so the two offsets are independent
  const step1 = (Math.imul(1664525, seed) + 1013904223) | 0;
  const step2 = (Math.imul(1664525, step1) + 1013904223) | 0;

  const r1 = step1 / 2147483647; // [-1, 1]
  const r2 = step2 / 2147483647;

  // 50-100 m jitter
  const maxM = 100;
  const dLat = (r1 * maxM) / 111000;
  const dLng = (r2 * maxM) / (111000 * Math.cos((lat * Math.PI) / 180));

  return { lat: lat + dLat, lng: lng + dLng };
}

// ---------------------------------------------------------------------------
// createBubble
// ---------------------------------------------------------------------------
async function createBubble(userId, { title, description, category, lat, lng, duration_h }) {
  // --- validation ---
  if (!title || typeof title !== 'string' || !title.trim()) {
    throw makeError(400, 'VALIDATION_ERROR', 'title is required.');
  }
  if (title.trim().length > 60) {
    throw makeError(400, 'VALIDATION_ERROR', 'title must be 60 characters or fewer.');
  }
  if (!category || !VALID_CATEGORIES.includes(category)) {
    throw makeError(400, 'VALIDATION_ERROR',
      `category must be one of: ${VALID_CATEGORIES.join(', ')}.`);
  }
  if (lat == null || lng == null) {
    throw makeError(400, 'VALIDATION_ERROR', 'lat and lng are required.');
  }
  const latNum = Number(lat);
  const lngNum = Number(lng);
  if (isNaN(latNum) || latNum < -90 || latNum > 90) {
    throw makeError(400, 'VALIDATION_ERROR', 'lat must be in [-90, 90].');
  }
  if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
    throw makeError(400, 'VALIDATION_ERROR', 'lng must be in [-180, 180].');
  }
  const durationH = duration_h == null ? 4 : Number(duration_h);
  if (!Number.isInteger(durationH) || durationH < 1 || durationH > 8) {
    throw makeError(400, 'VALIDATION_ERROR', 'duration_h must be an integer between 1 and 8.');
  }
  if (description != null && typeof description === 'string' && description.length > 300) {
    throw makeError(400, 'VALIDATION_ERROR', 'description must be 300 characters or fewer.');
  }

  // --- per-user rate check: max 5 bubbles in last 24 h ---
  const countResult = await pool.query(
    `SELECT COUNT(*) AS cnt FROM bubbles
     WHERE creator_id = $1 AND created_at > NOW() - INTERVAL '24 hours'`,
    [userId]
  );
  if (parseInt(countResult.rows[0].cnt, 10) >= 5) {
    throw makeError(429, 'RATE_LIMIT', 'You may create at most 5 bubbles per 24 hours.');
  }

  // --- insert bubble ---
  const { rows } = await pool.query(
    `INSERT INTO bubbles
       (creator_id, title, description, category, lat, lng, duration_h, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW() + ($7 || ' hours')::interval)
     RETURNING *`,
    [userId, title.trim(), description?.trim() || null, category, latNum, lngNum, durationH]
  );
  const bubble = rows[0];

  // --- auto-join creator ---
  await pool.query(
    `INSERT INTO bubble_members (bubble_id, user_id) VALUES ($1, $2)
     ON CONFLICT (bubble_id, user_id) DO UPDATE SET left_at = NULL, joined_at = NOW()`,
    [bubble.id, userId]
  );

  return bubble;
}

// ---------------------------------------------------------------------------
// getBubble
// ---------------------------------------------------------------------------
async function getBubble(bubbleId) {
  if (!UUID_RE.test(bubbleId)) {
    throw makeError(400, 'VALIDATION_ERROR', 'Invalid bubble ID format.');
  }
  const { rows } = await pool.query(
    `SELECT
       b.*,
       p.display_name AS creator_display_name,
       (
         SELECT COUNT(*) FROM bubble_members bm
         WHERE bm.bubble_id = b.id AND bm.left_at IS NULL
       )::int AS member_count
     FROM bubbles b
     JOIN profiles p ON p.user_id = b.creator_id
     WHERE b.id = $1
       AND b.expires_at  > NOW()
       AND b.removed_at IS NULL`,
    [bubbleId]
  );
  return rows[0] || null;
}

// ---------------------------------------------------------------------------
// getNearbyBubbles
// ---------------------------------------------------------------------------
async function getNearbyBubbles(userId, lat, lng) {
  // Resolve caller coordinates: prefer explicit lat/lng, fall back to stored location
  let callerLat = lat != null ? Number(lat) : null;
  let callerLng = lng != null ? Number(lng) : null;

  if (callerLat == null || callerLng == null || isNaN(callerLat) || isNaN(callerLng)) {
    const locResult = await pool.query(
      `SELECT lat, lng FROM user_locations
       WHERE user_id = $1 AND recorded_at > NOW() - INTERVAL '30 minutes'`,
      [userId]
    );
    if (locResult.rows.length === 0) return [];
    callerLat = locResult.rows[0].lat;
    callerLng = locResult.rows[0].lng;
  }

  const { rows } = await pool.query(
    `SELECT
       b.id,
       b.title,
       b.description,
       b.category,
       b.lat,
       b.lng,
       b.created_at,
       b.expires_at,
       p.display_name AS creator_display_name,
       (
         SELECT COUNT(*) FROM bubble_members bm
         WHERE bm.bubble_id = b.id AND bm.left_at IS NULL
       )::int AS member_count,
       6371000 * acos(LEAST(1.0,
         cos(radians($2)) * cos(radians(b.lat))
           * cos(radians(b.lng) - radians($3))
         + sin(radians($2)) * sin(radians(b.lat))
       )) AS distance_m
     FROM bubbles b
     JOIN profiles p ON p.user_id = b.creator_id
     WHERE b.expires_at  > NOW()
       AND b.removed_at IS NULL
       AND b.creator_id NOT IN (
         SELECT blocked_id FROM blocks WHERE blocker_id = $1
         UNION
         SELECT blocker_id FROM blocks WHERE blocked_id = $1
       )
       AND 6371000 * acos(LEAST(1.0,
             cos(radians($2)) * cos(radians(b.lat))
               * cos(radians(b.lng) - radians($3))
             + sin(radians($2)) * sin(radians(b.lat))
           )) <= $4
     ORDER BY
       (
         6371000 * acos(LEAST(1.0,
           cos(radians($2)) * cos(radians(b.lat))
             * cos(radians(b.lng) - radians($3))
           + sin(radians($2)) * sin(radians(b.lat))
         )) / $4
         - (
             SELECT COUNT(*) FROM bubble_members bm
             WHERE bm.bubble_id = b.id AND bm.left_at IS NULL
           ) * 0.02
       ) ASC
     LIMIT 30`,
    [userId, callerLat, callerLng, DISCOVERY_RADIUS_M]
  );

  return rows.map(row => {
    const { lat: rawLat, lng: rawLng, ...rest } = row;
    const jittered = jitterBubbleCoords(row.id, rawLat, rawLng);
    return {
      ...rest,
      lat: jittered.lat,
      lng: jittered.lng,
      distance_m: Math.round(row.distance_m),
    };
  });
}

// ---------------------------------------------------------------------------
// joinBubble
// ---------------------------------------------------------------------------
async function joinBubble(userId, bubbleId) {
  if (!UUID_RE.test(bubbleId)) {
    throw makeError(400, 'VALIDATION_ERROR', 'Invalid bubble ID format.');
  }

  // Verify bubble is active
  const bubbleResult = await pool.query(
    `SELECT id FROM bubbles WHERE id = $1 AND expires_at > NOW() AND removed_at IS NULL`,
    [bubbleId]
  );
  if (bubbleResult.rows.length === 0) {
    throw makeError(404, 'BUBBLE_NOT_FOUND', 'Bubble not found or no longer active.');
  }

  // Check member cap
  const countResult = await pool.query(
    `SELECT COUNT(*) AS cnt FROM bubble_members
     WHERE bubble_id = $1 AND left_at IS NULL`,
    [bubbleId]
  );
  if (parseInt(countResult.rows[0].cnt, 10) >= MAX_MEMBERS) {
    throw makeError(409, 'BUBBLE_FULL', 'This bubble has reached its maximum capacity.');
  }

  const { rows } = await pool.query(
    `INSERT INTO bubble_members (bubble_id, user_id)
     VALUES ($1, $2)
     ON CONFLICT (bubble_id, user_id)
     DO UPDATE SET left_at = NULL, joined_at = NOW()
     RETURNING *`,
    [bubbleId, userId]
  );
  return rows[0];
}

// ---------------------------------------------------------------------------
// leaveBubble
// ---------------------------------------------------------------------------
async function leaveBubble(userId, bubbleId) {
  if (!UUID_RE.test(bubbleId)) {
    throw makeError(400, 'VALIDATION_ERROR', 'Invalid bubble ID format.');
  }
  const result = await pool.query(
    `UPDATE bubble_members
     SET left_at = NOW()
     WHERE bubble_id = $1 AND user_id = $2 AND left_at IS NULL`,
    [bubbleId, userId]
  );
  return result.rowCount > 0;
}

// ---------------------------------------------------------------------------
// getMembers
// ---------------------------------------------------------------------------
async function getMembers(bubbleId) {
  if (!UUID_RE.test(bubbleId)) {
    throw makeError(400, 'VALIDATION_ERROR', 'Invalid bubble ID format.');
  }
  const { rows } = await pool.query(
    `SELECT bm.id, bm.user_id, bm.joined_at,
            p.display_name,
            p.photos
     FROM bubble_members bm
     JOIN profiles p ON p.user_id = bm.user_id
     WHERE bm.bubble_id = $1 AND bm.left_at IS NULL
     ORDER BY bm.joined_at ASC`,
    [bubbleId]
  );
  return rows;
}

// ---------------------------------------------------------------------------
// sendMessage
// ---------------------------------------------------------------------------
async function sendMessage(userId, bubbleId, body) {
  if (!UUID_RE.test(bubbleId)) {
    throw makeError(400, 'VALIDATION_ERROR', 'Invalid bubble ID format.');
  }
  if (!body || typeof body !== 'string' || !body.trim()) {
    throw makeError(400, 'VALIDATION_ERROR', 'body is required.');
  }
  if (body.trim().length > 1000) {
    throw makeError(400, 'VALIDATION_ERROR', 'body must be 1000 characters or fewer.');
  }

  // Validate bubble is active
  const bubbleResult = await pool.query(
    `SELECT id FROM bubbles WHERE id = $1 AND expires_at > NOW() AND removed_at IS NULL`,
    [bubbleId]
  );
  if (bubbleResult.rows.length === 0) {
    throw makeError(404, 'BUBBLE_NOT_FOUND', 'Bubble not found or no longer active.');
  }

  // Validate user is an active member
  const memberResult = await pool.query(
    `SELECT id FROM bubble_members
     WHERE bubble_id = $1 AND user_id = $2 AND left_at IS NULL`,
    [bubbleId, userId]
  );
  if (memberResult.rows.length === 0) {
    throw makeError(403, 'NOT_A_MEMBER', 'You must be an active member to send messages.');
  }

  const { rows } = await pool.query(
    `INSERT INTO bubble_messages (bubble_id, sender_id, body)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [bubbleId, userId, body.trim()]
  );
  return rows[0];
}

// ---------------------------------------------------------------------------
// getMessages
// ---------------------------------------------------------------------------
async function getMessages(bubbleId, { before, limit = 50 } = {}) {
  if (!UUID_RE.test(bubbleId)) {
    throw makeError(400, 'VALIDATION_ERROR', 'Invalid bubble ID format.');
  }
  const safeLimit = Math.min(Math.max(1, parseInt(limit, 10) || 50), MAX_MESSAGES);

  let query;
  let params;

  if (before) {
    query = `
      SELECT bm.id, bm.bubble_id, bm.sender_id, bm.body, bm.sent_at,
             p.display_name AS sender_display_name
      FROM bubble_messages bm
      JOIN profiles p ON p.user_id = bm.sender_id
      WHERE bm.bubble_id = $1 AND bm.sent_at < $2
      ORDER BY bm.sent_at DESC
      LIMIT $3`;
    params = [bubbleId, before, safeLimit];
  } else {
    query = `
      SELECT bm.id, bm.bubble_id, bm.sender_id, bm.body, bm.sent_at,
             p.display_name AS sender_display_name
      FROM bubble_messages bm
      JOIN profiles p ON p.user_id = bm.sender_id
      WHERE bm.bubble_id = $1
      ORDER BY bm.sent_at DESC
      LIMIT $2`;
    params = [bubbleId, safeLimit];
  }

  const { rows } = await pool.query(query, params);
  return rows;
}

// ---------------------------------------------------------------------------
// closeBubble
// ---------------------------------------------------------------------------
async function closeBubble(userId, bubbleId) {
  if (!UUID_RE.test(bubbleId)) {
    throw makeError(400, 'VALIDATION_ERROR', 'Invalid bubble ID format.');
  }

  // Verify bubble exists first (to distinguish 404 from 403)
  const existResult = await pool.query(
    `SELECT id, creator_id FROM bubbles WHERE id = $1 AND removed_at IS NULL`,
    [bubbleId]
  );
  if (existResult.rows.length === 0) {
    throw makeError(404, 'BUBBLE_NOT_FOUND', 'Bubble not found.');
  }
  if (existResult.rows[0].creator_id !== userId) {
    throw makeError(403, 'FORBIDDEN', 'Only the creator can close this bubble.');
  }

  await pool.query(
    `UPDATE bubbles SET removed_at = NOW()
     WHERE id = $1 AND creator_id = $2 AND removed_at IS NULL`,
    [bubbleId, userId]
  );
}

// ---------------------------------------------------------------------------
// reportBubble
// ---------------------------------------------------------------------------
async function reportBubble(reporterId, bubbleId, reason) {
  if (!UUID_RE.test(bubbleId)) {
    throw makeError(400, 'VALIDATION_ERROR', 'Invalid bubble ID format.');
  }
  if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
    throw makeError(400, 'VALIDATION_ERROR', 'reason is required.');
  }
  if (reason.length > 500) {
    throw makeError(400, 'VALIDATION_ERROR', 'reason must be 500 characters or fewer.');
  }

  // Verify bubble exists (active or not — reporting expired/removed bubbles is still valid)
  const bubbleResult = await pool.query(
    `SELECT id, creator_id FROM bubbles WHERE id = $1`,
    [bubbleId]
  );
  if (bubbleResult.rows.length === 0) {
    throw makeError(404, 'BUBBLE_NOT_FOUND', 'Bubble not found.');
  }
  if (bubbleResult.rows[0].creator_id === reporterId) {
    throw makeError(400, 'VALIDATION_ERROR', 'Cannot report your own bubble.');
  }

  await pool.query(
    `INSERT INTO reports (reporter_id, reported_bubble_id, reason) VALUES ($1, $2, $3)`,
    [reporterId, bubbleId, reason.trim()]
  );
}

module.exports = {
  createBubble,
  getBubble,
  getNearbyBubbles,
  joinBubble,
  leaveBubble,
  getMembers,
  sendMessage,
  getMessages,
  closeBubble,
  reportBubble,
};
