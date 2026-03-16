'use strict';

function required(name) {
  const val = process.env[name];
  if (!val) throw new Error(`Missing required env var: ${name}`);
  return val;
}

module.exports = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: required('DATABASE_URL'),
  // Redis is no longer required — token revocation and OTP rate limiting now use Postgres.
  // REDIS_URL is kept here for backwards compatibility but is unused by default.
  redisUrl: process.env.REDIS_URL || null,
  jwtAccessSecret: required('JWT_ACCESS_SECRET'),
  jwtRefreshSecret: required('JWT_REFRESH_SECRET'),
  phoneHmacSecret: required('PHONE_HMAC_SECRET'),
  otpExpirySeconds: parseInt(process.env.OTP_EXPIRY_SECONDS || '600', 10),
  jwtAccessExpirySeconds: 15 * 60,        // 15 minutes
  jwtRefreshExpirySeconds: 7 * 24 * 3600, // 7 days
  adminSecret: required('ADMIN_SECRET'),
  publicUrl: process.env.PUBLIC_URL || 'http://localhost:3000',
  storageBaseUrl: required('STORAGE_BASE_URL'),
  // Firebase — optional until Phase 1 is fully wired; no hard require so existing boot still works
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID || null,
  firebaseServiceAccount: process.env.FIREBASE_SERVICE_ACCOUNT || null,
};
