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
  redisUrl: required('REDIS_URL'),
  jwtAccessSecret: required('JWT_ACCESS_SECRET'),
  jwtRefreshSecret: required('JWT_REFRESH_SECRET'),
  phoneHmacSecret: required('PHONE_HMAC_SECRET'),
  otpExpirySeconds: parseInt(process.env.OTP_EXPIRY_SECONDS || '600', 10),
  jwtAccessExpirySeconds: 15 * 60,        // 15 minutes
  jwtRefreshExpirySeconds: 7 * 24 * 3600, // 7 days
  adminSecret: process.env.ADMIN_SECRET || '',
};
