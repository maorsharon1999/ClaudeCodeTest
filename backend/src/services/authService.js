'use strict';
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt    = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const pool   = require('../db/pool');
const config = require('../config');

const BCRYPT_ROUNDS = 10;
const MAX_OTP_ATTEMPTS = 5;

// --- Helpers ---

function hashPhone(phone) {
  return crypto
    .createHmac('sha256', config.phoneHmacSecret)
    .update(phone)
    .digest('hex');
}

function generateOtp() {
  // Cryptographically random 6-digit code
  const buf = crypto.randomBytes(4);
  const num = buf.readUInt32BE(0) % 1000000;
  return String(num).padStart(6, '0');
}

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

// --- Rate limiter helpers (Postgres) ---
// Count OTP requests for this phone in the past 10 minutes directly from otp_attempts.

async function checkOtpRateLimit(phoneHash) {
  const { rows } = await pool.query(
    `SELECT COUNT(*) AS cnt FROM otp_attempts
     WHERE phone_hash = $1 AND created_at > NOW() - INTERVAL '10 minutes'`,
    [phoneHash]
  );
  return parseInt(rows[0].cnt, 10) + 1; // +1 because the new row hasn't been inserted yet
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

async function requestOtp(phone) {
  const phoneHash = hashPhone(phone);

  const rateCount = await checkOtpRateLimit(phoneHash);
  if (rateCount > 3) {
    const err = new Error('Too many OTP requests. Try again in 10 minutes.');
    err.status = 429;
    err.code   = 'OTP_RATE_LIMIT';
    throw err;
  }

  const code     = generateOtp();
  const codeHash = await bcrypt.hash(code, BCRYPT_ROUNDS);
  const expiresAt = new Date(Date.now() + config.otpExpirySeconds * 1000);

  await pool.query(
    `INSERT INTO otp_attempts (id, phone_hash, code_hash, expires_at)
     VALUES ($1, $2, $3, $4)`,
    [uuidv4(), phoneHash, codeHash, expiresAt]
  );

  // Stub SMS: log to console
  console.log(`[OTP STUB] Phone hash: ${phoneHash}  Code: ${code}`);

  return { phoneHash };
}

async function verifyOtp(phone, code) {
  const phoneHash = hashPhone(phone);

  // Find the most recent unexpired, unverified OTP for this phone
  const { rows } = await pool.query(
    `SELECT id, code_hash, attempt_count, verified
     FROM otp_attempts
     WHERE phone_hash = $1
       AND expires_at > NOW()
       AND verified = FALSE
     ORDER BY expires_at DESC
     LIMIT 1`,
    [phoneHash]
  );

  if (rows.length === 0) {
    const err = new Error('No active OTP found. Please request a new one.');
    err.status = 400;
    err.code   = 'OTP_NOT_FOUND';
    throw err;
  }

  const row = rows[0];

  // Lockout is derived purely from attempt_count in Postgres (no Redis needed)
  if (row.attempt_count >= MAX_OTP_ATTEMPTS) {
    const err = new Error('OTP locked after too many failed attempts. Request a new code.');
    err.status = 429;
    err.code   = 'OTP_LOCKED';
    throw err;
  }

  const match = await bcrypt.compare(code, row.code_hash);

  if (!match) {
    await pool.query(
      `UPDATE otp_attempts SET attempt_count = attempt_count + 1 WHERE id = $1`,
      [row.id]
    );
    const err = new Error('Invalid OTP code.');
    err.status = 400;
    err.code   = 'OTP_INVALID';
    throw err;
  }

  // Mark verified
  await pool.query(
    `UPDATE otp_attempts SET verified = TRUE WHERE id = $1`,
    [row.id]
  );

  // Upsert user
  const userResult = await pool.query(
    `INSERT INTO users (phone_hash)
     VALUES ($1)
     ON CONFLICT (phone_hash) DO UPDATE SET updated_at = NOW()
     RETURNING id`,
    [phoneHash]
  );
  const userId = userResult.rows[0].id;

  // Upsert visibility state (default invisible)
  await pool.query(
    `INSERT INTO visibility_states (user_id) VALUES ($1)
     ON CONFLICT (user_id) DO NOTHING`,
    [userId]
  );

  const accessToken  = issueAccessToken(userId);
  const { token: refreshToken, jti } = issueRefreshToken(userId);

  return { accessToken, refreshToken, userId };
}

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

    // Clean up otp_attempts (no FK to users) — only if user has a phone_hash
    const { rows } = await client.query('SELECT phone_hash FROM users WHERE id = $1', [userId]);
    if (rows.length > 0 && rows[0].phone_hash) {
      await client.query('DELETE FROM otp_attempts WHERE phone_hash = $1', [rows[0].phone_hash]);
    }

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

// --- Email + Password Auth ---

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function registerWithEmail(email, password) {
  if (!email || !EMAIL_REGEX.test(email)) {
    const err = new Error('A valid email address is required.');
    err.status = 400;
    err.code   = 'VALIDATION_ERROR';
    throw err;
  }
  if (!password || password.length < 8) {
    const err = new Error('Password must be at least 8 characters.');
    err.status = 400;
    err.code   = 'VALIDATION_ERROR';
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  let userId;
  try {
    const { rows } = await pool.query(
      `INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id`,
      [email.toLowerCase(), passwordHash]
    );
    userId = rows[0].id;
  } catch (err) {
    if (err.code === '23505') { // unique_violation
      const e = new Error('An account with this email already exists.');
      e.status = 409;
      e.code   = 'EMAIL_TAKEN';
      throw e;
    }
    throw err;
  }

  await pool.query(
    `INSERT INTO visibility_states (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING`,
    [userId]
  );

  const { accessToken, refreshToken } = await issueTokensForUser(userId);
  return { accessToken, refreshToken, userId };
}

async function loginWithEmail(email, password) {
  if (!email || !password) {
    const err = new Error('email and password are required.');
    err.status = 400;
    err.code   = 'VALIDATION_ERROR';
    throw err;
  }

  const { rows } = await pool.query(
    `SELECT id, password_hash, banned_at FROM users WHERE email = $1`,
    [email.toLowerCase()]
  );

  if (rows.length === 0) {
    const err = new Error('Invalid email or password.');
    err.status = 401;
    err.code   = 'INVALID_CREDENTIALS';
    throw err;
  }

  const user = rows[0];

  if (!user.password_hash) {
    const err = new Error('Invalid email or password.');
    err.status = 401;
    err.code   = 'INVALID_CREDENTIALS';
    throw err;
  }

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    const err = new Error('Invalid email or password.');
    err.status = 401;
    err.code   = 'INVALID_CREDENTIALS';
    throw err;
  }

  if (user.banned_at) {
    const err = new Error('This account has been suspended.');
    err.status = 403;
    err.code   = 'ACCOUNT_BANNED';
    throw err;
  }

  const { accessToken, refreshToken } = await issueTokensForUser(user.id);
  return { accessToken, refreshToken, userId: user.id };
}

// --- Firebase Auth integration (Phase 1) ---

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
async function findOrCreateByFirebaseUid(firebaseUid, phoneNumber, email) {
  // Try to find existing user
  const { rows: existing } = await pool.query(
    'SELECT id FROM users WHERE firebase_uid = $1',
    [firebaseUid]
  );
  if (existing.length > 0) {
    return { userId: existing[0].id, isNew: false };
  }

  // New user — insert with firebase_uid; phone_hash derived from phone if available
  const phoneHash = phoneNumber ? hashPhone(phoneNumber) : null;

  let userId;
  if (phoneHash) {
    // Phone-hash user may already exist from legacy OTP flow — link them
    const { rows: linked } = await pool.query(
      `UPDATE users SET firebase_uid = $1, updated_at = NOW()
       WHERE phone_hash = $2 AND firebase_uid IS NULL
       RETURNING id`,
      [firebaseUid, phoneHash]
    );
    if (linked.length > 0) {
      return { userId: linked[0].id, isNew: false };
    }
    // Insert brand-new user with both identifiers
    const { rows: created } = await pool.query(
      `INSERT INTO users (phone_hash, firebase_uid)
       VALUES ($1, $2)
       ON CONFLICT (phone_hash) DO UPDATE SET firebase_uid = EXCLUDED.firebase_uid, updated_at = NOW()
       RETURNING id`,
      [phoneHash, firebaseUid]
    );
    userId = created[0].id;
  } else if (email) {
    // Email-based Firebase auth (e.g. Firebase Email/Password or Google sign-in)
    // Try to link to existing email user first
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
    // No phone or email — create a firebase_uid-only user
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

module.exports = { requestOtp, verifyOtp, registerWithEmail, loginWithEmail, refreshAccessToken, deleteSession, deleteAccount, verifyFirebaseToken, findOrCreateByFirebaseUid, issueTokensForUser };
