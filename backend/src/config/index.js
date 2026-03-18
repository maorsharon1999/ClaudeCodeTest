'use strict';

function required(name) {
  const val = process.env[name];
  if (!val) throw new Error(`Missing required env var: ${name}`);
  return val;
}

// Firebase must be configured — no local fallback.
module.exports = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: required('DATABASE_URL'),
  jwtAccessSecret: required('JWT_ACCESS_SECRET'),
  jwtRefreshSecret: required('JWT_REFRESH_SECRET'),
  jwtAccessExpirySeconds: 15 * 60,        // 15 minutes
  jwtRefreshExpirySeconds: 7 * 24 * 3600, // 7 days
  adminSecret: required('ADMIN_SECRET'),
  publicUrl: process.env.PUBLIC_URL || 'http://localhost:3000',
  firebaseProjectId: required('FIREBASE_PROJECT_ID'),
  firebaseStorageBucket: required('FIREBASE_STORAGE_BUCKET'),
  firebaseServiceAccount: process.env.FIREBASE_SERVICE_ACCOUNT || null,
};
