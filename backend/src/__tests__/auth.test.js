'use strict';
/**
 * Auth route unit tests — mocks PG and Redis so no live DB needed.
 */
process.env.DATABASE_URL    = 'postgresql://test:test@localhost:5432/test';
process.env.REDIS_URL        = 'redis://localhost:6379';
process.env.JWT_ACCESS_SECRET  = 'test-access-secret-long-enough-32chars!';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-long-enough-32!';
process.env.PHONE_HMAC_SECRET  = 'test-phone-hmac-secret-long-enough!!';

const request = require('supertest');
const bcrypt  = require('bcrypt');

// --- Mock pg pool ---
jest.mock('../db/pool', () => {
  const rows = {};
  const query = jest.fn(async (sql, params) => {
    // requestOtp: INSERT into otp_attempts
    if (sql.includes('INSERT INTO otp_attempts')) {
      rows['otp'] = { id: params[0], phone_hash: params[1], code_hash: params[2], expires_at: params[3], attempt_count: 0, verified: false };
      return { rows: [rows['otp']] };
    }
    // verifyOtp: SELECT otp
    if (sql.includes('SELECT id, code_hash')) {
      if (!rows['otp'] || rows['otp'].verified) return { rows: [] };
      return { rows: [rows['otp']] };
    }
    // verifyOtp: UPDATE attempt_count
    if (sql.includes('attempt_count = attempt_count + 1')) {
      rows['otp'].attempt_count += 1;
      return { rows: [] };
    }
    // verifyOtp: UPDATE verified
    if (sql.includes('verified = TRUE')) {
      rows['otp'].verified = true;
      return { rows: [] };
    }
    // upsert user
    if (sql.includes('INSERT INTO users')) {
      return { rows: [{ id: 'mock-user-uuid' }] };
    }
    // upsert visibility
    if (sql.includes('INSERT INTO visibility_states')) {
      return { rows: [] };
    }
    return { rows: [] };
  });
  return { query };
});

// --- Mock redis ---
const redisStore = {};
jest.mock('../db/redis', () => ({
  getRedis: async () => ({
    incr: async (key) => { redisStore[key] = (redisStore[key] || 0) + 1; return redisStore[key]; },
    expire: async () => {},
    set: async (key, val) => { redisStore[key] = val; },
    get: async (key) => redisStore[key] || null,
  }),
}));

const app = require('../index');

describe('POST /api/v1/auth/otp/request', () => {
  it('returns 200 with valid phone', async () => {
    const res = await request(app).post('/api/v1/auth/otp/request').send({ phone: '+12125550001' });
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('OTP sent.');
  });

  it('returns 400 with missing phone', async () => {
    const res = await request(app).post('/api/v1/auth/otp/request').send({});
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('POST /api/v1/auth/otp/verify', () => {
  let storedCodeHash;

  beforeEach(async () => {
    // Reset store and inject a fresh OTP row into pool mock
    const pool = require('../db/pool');
    const code = '123456';
    storedCodeHash = await bcrypt.hash(code, 10);
    // Prime the otp row in mock via direct mutation
    pool.query.mockImplementationOnce(async (sql) => {
      if (sql.includes('SELECT id, code_hash')) {
        return { rows: [{ id: 'otp-id-1', code_hash: storedCodeHash, attempt_count: 0, verified: false }] };
      }
    });
  });

  it('returns 400 with missing fields', async () => {
    const res = await request(app).post('/api/v1/auth/otp/verify').send({ phone: '+1212' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('POST /api/v1/auth/token/refresh', () => {
  it('returns 400 with missing refresh_token', async () => {
    const res = await request(app).post('/api/v1/auth/token/refresh').send({});
    expect(res.status).toBe(400);
  });

  it('returns 401 with garbage token', async () => {
    const res = await request(app).post('/api/v1/auth/token/refresh').send({ refresh_token: 'garbage' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('REFRESH_TOKEN_INVALID');
  });
});

describe('DELETE /api/v1/auth/session', () => {
  it('returns 200 even with invalid token (idempotent)', async () => {
    const res = await request(app).delete('/api/v1/auth/session').send({ refresh_token: 'invalid-but-ok' });
    expect(res.status).toBe(200);
  });

  it('returns 400 with missing refresh_token', async () => {
    const res = await request(app).delete('/api/v1/auth/session').send({});
    expect(res.status).toBe(400);
  });
});
