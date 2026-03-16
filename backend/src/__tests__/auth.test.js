'use strict';
/**
 * Auth route unit tests — mocks PG and Redis so no live DB needed.
 */
process.env.DATABASE_URL    = 'postgresql://test:test@localhost:5432/test';
process.env.REDIS_URL        = 'redis://localhost:6379';
process.env.JWT_ACCESS_SECRET  = 'test-access-secret-long-enough-32chars!';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-long-enough-32!!';
process.env.PHONE_HMAC_SECRET  = 'test-phone-hmac-secret-long-enough!!!';
process.env.ADMIN_SECRET       = 'test-admin-secret-long-enough-32chars!';
process.env.STORAGE_BASE_URL   = 'http://localhost:3000';

const request = require('supertest');
const bcrypt  = require('bcrypt');

// --- Mock pg pool ---
jest.mock('../db/pool', () => {
  const store = {
    users: {},      // email -> { id, password_hash, banned_at }
    revokedJtis: new Set(),
    otp: null,
  };
  const query = jest.fn(async (sql, params) => {
    // revoke refresh token
    if (sql.includes('INSERT INTO revoked_tokens')) {
      store.revokedJtis.add(params[0]);
      return { rows: [] };
    }
    // check revoked token
    if (sql.includes('FROM revoked_tokens')) {
      return { rows: store.revokedJtis.has(params[0]) ? [{ 1: 1 }] : [] };
    }
    // email register: INSERT INTO users (email, password_hash)
    if (sql.includes('INSERT INTO users') && sql.includes('email') && sql.includes('password_hash')) {
      const email = params[0];
      const passwordHash = params[1];
      if (store.users[email]) {
        const err = new Error('duplicate key');
        err.code = '23505';
        throw err;
      }
      store.users[email] = { id: 'mock-user-uuid', password_hash: passwordHash, banned_at: null };
      return { rows: [{ id: 'mock-user-uuid' }] };
    }
    // email login: SELECT id, password_hash, banned_at FROM users WHERE email
    if (sql.includes('SELECT id, password_hash, banned_at') && sql.includes('WHERE email')) {
      const email = params[0];
      const user = store.users[email];
      if (!user) return { rows: [] };
      return { rows: [{ id: user.id, password_hash: user.password_hash, banned_at: user.banned_at }] };
    }
    // upsert visibility
    if (sql.includes('INSERT INTO visibility_states')) {
      return { rows: [] };
    }
    // OTP rate-limit count (legacy)
    if (sql.includes('SELECT COUNT(*)') && sql.includes('otp_attempts')) {
      return { rows: [{ cnt: '0' }] };
    }
    // requestOtp: INSERT into otp_attempts
    if (sql.includes('INSERT INTO otp_attempts')) {
      store.otp = { id: params[0], phone_hash: params[1], code_hash: params[2], expires_at: params[3], attempt_count: 0, verified: false };
      return { rows: [store.otp] };
    }
    // verifyOtp: SELECT otp
    if (sql.includes('SELECT id, code_hash')) {
      if (!store.otp || store.otp.verified) return { rows: [] };
      return { rows: [store.otp] };
    }
    // verifyOtp: UPDATE attempt_count
    if (sql.includes('attempt_count = attempt_count + 1')) {
      if (store.otp) store.otp.attempt_count += 1;
      return { rows: [] };
    }
    // verifyOtp: UPDATE verified
    if (sql.includes('verified = TRUE')) {
      if (store.otp) store.otp.verified = true;
      return { rows: [] };
    }
    // phone upsert user
    if (sql.includes('INSERT INTO users')) {
      return { rows: [{ id: 'mock-user-uuid' }] };
    }
    // ban check
    if (sql.includes('SELECT banned_at FROM users')) {
      return { rows: [{ banned_at: null }] };
    }
    return { rows: [] };
  });
  return { query };
});

const app = require('../index');

describe('POST /api/v1/auth/register', () => {
  it('returns 200 with tokens on valid email + password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'alice@example.com', password: 'password123' });
    expect(res.status).toBe(200);
    expect(res.body.access_token).toBeDefined();
    expect(res.body.refresh_token).toBeDefined();
    expect(res.body.user_id).toBe('mock-user-uuid');
  });

  it('returns 400 with invalid email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'not-an-email', password: 'password123' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 with short password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'bob@example.com', password: 'short' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 409 on duplicate email', async () => {
    // First registration succeeds (email was registered in previous test in this suite)
    // Use a fresh email to register, then try again
    await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'duplicate@example.com', password: 'password123' });
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'duplicate@example.com', password: 'password123' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_TAKEN');
  });
});

describe('POST /api/v1/auth/login', () => {
  it('returns 200 with tokens on correct credentials', async () => {
    // Register first
    await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'login-test@example.com', password: 'mypassword1' });
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'login-test@example.com', password: 'mypassword1' });
    expect(res.status).toBe(200);
    expect(res.body.access_token).toBeDefined();
  });

  it('returns 401 on wrong password', async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'wrongpw@example.com', password: 'correctpassword' });
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'wrongpw@example.com', password: 'wrongpassword' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('returns 401 when email not found', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nonexistent@example.com', password: 'somepassword' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
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

// --- AC: Logout invalidates refresh token; subsequent refresh returns 401 ---
describe('Refresh token revoked after logout', () => {
  const jwt = require('jsonwebtoken');

  it('returns 401 REFRESH_TOKEN_REVOKED when refresh token used after DELETE /auth/session', async () => {
    // Issue a real (test-signed) refresh token
    const jti = 'test-jti-logout-001';
    const refreshToken = jwt.sign(
      { sub: 'mock-user-uuid', jti },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: 604800 }
    );

    // Step 1: logout — stores jti in Postgres revoked_tokens (mocked)
    const logoutRes = await request(app)
      .delete('/api/v1/auth/session')
      .send({ refresh_token: refreshToken });
    expect(logoutRes.status).toBe(200);

    // Step 2: attempt refresh — must be rejected
    const refreshRes = await request(app)
      .post('/api/v1/auth/token/refresh')
      .send({ refresh_token: refreshToken });
    expect(refreshRes.status).toBe(401);
    expect(refreshRes.body.error.code).toBe('REFRESH_TOKEN_REVOKED');
  });
});
