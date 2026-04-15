'use strict';
const jwt    = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const pool   = require('../db/pool');
const config = require('../config');

// --- Helpers ---

function issueAccessToken(userId) {
  return jwt.sign({ sub: userId }, config.jwtAccessSecret, {
    expiresIn: config.jwtAccessExpirySeconds,
  });
}

function issueRefreshToken(userId) {
  const jti = uuidv4();
  const token = jwt.sign({ sub: userId, jti }, config.jwtRefreshSecret, {
    expiresIn: config.jwtRefreshExpirySeconds,
  });
  return { token, jti };
}

// --- Revoked token set (Postgres) ---
// Stores revoked refresh token JTIs in the revoked_tokens table.
// Expired rows are inert (WHERE expires_at > NOW()); a cleanup job can prune them periodically.

async function revokeRefreshToken(jti, userId, expiresAt) {
  await pool.query(
    `INSERT INTO revoked_tokens (jti, user_id, expires_at)
     VALUES ($1, $2, $3)
     ON CONFLICT (jti) DO NOTHING`,
    [jti, userId || null, expiresAt]
  );
}

async function isRefreshTokenRevoked(jti) {
  const { rows } = await pool.query(
    `SELECT 1 FROM revoked_tokens WHERE jti = $1 AND expires_at > NOW()`,
    [jti]
  );
  return rows.length > 0;
}

// --- Public service functions ---

async function refreshAccessToken(incomingRefreshToken) {
  let payload;
  try {
    payload = jwt.verify(incomingRefreshToken, config.jwtRefreshSecret);
  } catch (err) {
    const e = new Error('Refresh token is invalid or expired.');
    e.status = 401;
    e.code   = 'REFRESH_TOKEN_INVALID';
    throw e;
  }

  const revoked = await isRefreshTokenRevoked(payload.jti);
  if (revoked) {
    const e = new Error('Refresh token has been revoked.');
    e.status = 401;
    e.code   = 'REFRESH_TOKEN_REVOKED';
    throw e;
  }

  const { rows: userRows } = await pool.query(
    'SELECT id, banned_at FROM users WHERE id = $1',
    [payload.sub]
  );
  if (userRows.length === 0) {
    const e = new Error('User not found.');
    e.status = 401;
    e.code   = 'USER_NOT_FOUND';
    throw e;
  }
  if (userRows[0].banned_at != null) {
    const e = new Error('User account is banned.');
    e.status = 403;
    e.code   = 'USER_BANNED';
    throw e;
  }

  const accessToken = issueAccessToken(payload.sub);
  return { accessToken };
}

async function deleteSession(incomingRefreshToken) {
  let payload;
  try {
    payload = jwt.verify(incomingRefreshToken, config.jwtRefreshSecret);
  } catch {
    // Token already invalid — treat as success (idempotent logout)
    return;
  }
  const expiresAt = new Date(payload.exp * 1000);
  await revokeRefreshToken(payload.jti, payload.sub, expiresAt);
}

async function deleteAccount(userId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Deleting from users cascades to: profiles, visibility_states, blocks, reports,
    // signals (sender/recipient), chat_threads (user_a/user_b), chat_messages (sender)
    await client.query('DELETE FROM users WHERE id = $1', [userId]);

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// --- Firebase Auth integration ---

/**
 * Verify a Firebase ID token and return the decoded payload.
 * Throws with status 401 if the token is invalid or expired.
 */
async function verifyFirebaseToken(idToken) {
  const { getFirebaseAdmin } = require('../db/firebase');
  const admin = getFirebaseAdmin();
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    return decoded; // { uid, phone_number, ... }
  } catch (err) {
    const e = new Error('Firebase ID token is invalid or expired.');
    e.status = 401;
    e.code   = 'FIREBASE_TOKEN_INVALID';
    throw e;
  }
}

/**
 * Find an existing user by firebase_uid, or create a new one.
 * Also upserts visibility_states for new users.
 * Returns { userId, isNew }.
 */
async function findOrCreateByFirebaseUid(firebaseUid, _phoneNumber, email) {
  // Try to find existing user by firebase_uid
  const { rows: existing } = await pool.query(
    'SELECT id FROM users WHERE firebase_uid = $1',
    [firebaseUid]
  );
  if (existing.length > 0) {
    return { userId: existing[0].id, isNew: false };
  }

  let userId;
  if (email) {
    // Email-based Firebase auth — try to link to an existing email user first
    const { rows: linked } = await pool.query(
      `UPDATE users SET firebase_uid = $1, updated_at = NOW()
       WHERE email = $2 AND firebase_uid IS NULL
       RETURNING id`,
      [firebaseUid, email.toLowerCase()]
    );
    if (linked.length > 0) {
      return { userId: linked[0].id, isNew: false };
    }
    const { rows: created } = await pool.query(
      `INSERT INTO users (email, firebase_uid)
       VALUES ($1, $2)
       ON CONFLICT (email) DO UPDATE SET firebase_uid = EXCLUDED.firebase_uid, updated_at = NOW()
       RETURNING id`,
      [email.toLowerCase(), firebaseUid]
    );
    userId = created[0].id;
  } else {
    // No email — create a firebase_uid-only user
    const { rows: created } = await pool.query(
      `INSERT INTO users (firebase_uid)
       VALUES ($1)
       RETURNING id`,
      [firebaseUid]
    );
    userId = created[0].id;
  }

  // Ensure visibility state exists
  await pool.query(
    `INSERT INTO visibility_states (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING`,
    [userId]
  );

  // Ensure a blank profile row exists so photo uploads work before profile setup completes
  await pool.query(
    `INSERT INTO profiles (user_id, display_name) VALUES ($1, $2) ON CONFLICT (user_id) DO NOTHING`,
    [userId, 'New User']
  );

  return { userId, isNew: true };
}

/**
 * Issue an access + refresh token pair for an existing user ID.
 * Used by the Firebase verify route so it can reuse the same JWT issuance
 * without duplicating token-signing logic.
 */
async function issueTokensForUser(userId) {
  const accessToken = issueAccessToken(userId);
  const { token: refreshToken } = issueRefreshToken(userId);
  return { accessToken, refreshToken };
}

module.exports = { refreshAccessToken, deleteSession, deleteAccount, verifyFirebaseToken, findOrCreateByFirebaseUid, issueTokensForUser };
