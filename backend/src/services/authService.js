'use strict';
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt    = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const pool   = require('../db/pool');
const { getRedis } = require('../db/redis');
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

// --- Rate limiter helpers (Redis) ---
// Key: otp_rate:{phoneHash}  Value: count  TTL: 600s (10 min)

async function checkOtpRateLimit(phoneHash) {
  const redis = await getRedis();
  const key   = `otp_rate:${phoneHash}`;
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, 10 * 60);
  }
  return count; // caller rejects if > 3
}

// --- Revoked token set (Redis) ---
// Key: revoked_refresh:{jti}  TTL: matches token expiry

async function revokeRefreshToken(jti) {
  const redis = await getRedis();
  const key   = `revoked_refresh:${jti}`;
  await redis.set(key, '1', { EX: config.jwtRefreshExpirySeconds });
}

async function isRefreshTokenRevoked(jti) {
  const redis = await getRedis();
  const val   = await redis.get(`revoked_refresh:${jti}`);
  return val !== null;
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

  // Check per-phone Redis lockout (set after MAX_OTP_ATTEMPTS failures)
  const redis = await getRedis();
  const lockKey = `otp_phone_lock:${phoneHash}`;
  const locked = await redis.get(lockKey);
  if (locked || row.attempt_count >= MAX_OTP_ATTEMPTS) {
    const err = new Error('OTP locked after too many failed attempts. Request a new code.');
    err.status = 429;
    err.code   = 'OTP_LOCKED';
    throw err;
  }

  const match = await bcrypt.compare(code, row.code_hash);

  if (!match) {
    const { rows: updated } = await pool.query(
      `UPDATE otp_attempts SET attempt_count = attempt_count + 1 WHERE id = $1 RETURNING attempt_count`,
      [row.id]
    );
    // Set Redis lockout if this was the 5th failure
    if (updated[0].attempt_count >= MAX_OTP_ATTEMPTS) {
      await redis.set(lockKey, '1', { EX: 10 * 60 });
    }
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
  await revokeRefreshToken(payload.jti);
}

module.exports = { requestOtp, verifyOtp, refreshAccessToken, deleteSession };
