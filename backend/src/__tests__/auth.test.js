'use strict';
/**
 * Auth route unit tests — mocks PG pool so no live DB needed.
 * Auth is exclusively Firebase-based; OTP and email/password routes are removed.
 */
process.env.DATABASE_URL           = 'postgresql://test:test@localhost:5432/test';
process.env.JWT_ACCESS_SECRET      = 'test-access-secret-long-enough-32chars!';
process.env.JWT_REFRESH_SECRET     = 'test-refresh-secret-long-enough-32!!';
process.env.ADMIN_SECRET           = 'test-admin-secret-long-enough-32chars!';
process.env.FIREBASE_PROJECT_ID    = 'test-project';
process.env.FIREBASE_STORAGE_BUCKET = 'test-project.appspot.com';

const request = require('supertest');
const jwt     = require('jsonwebtoken');

// --- Mock pg pool ---
jest.mock('../db/pool', () => {
  const store = { revokedJtis: new Set() };
  const query = jest.fn(async (sql, params) => {
    if (sql.includes('INSERT INTO revoked_tokens')) {
      store.revokedJtis.add(params[0]);
      return { rows: [] };
    }
    if (sql.includes('FROM revoked_tokens')) {
      return { rows: store.revokedJtis.has(params[0]) ? [{ 1: 1 }] : [] };
    }
    if (sql.includes('SELECT banned_at FROM users')) {
      return { rows: [{ banned_at: null }] };
    }
    return { rows: [] };
  });
  return { query };
});

// --- Mock Firebase Admin so verifyIdToken is controllable ---
jest.mock('../db/firebase', () => ({
  getFirebaseAdmin: () => ({
    auth: () => ({
      verifyIdToken: jest.fn(async (token) => {
        if (token === 'valid-firebase-token') {
          return { uid: 'firebase-uid-001', email: 'user@example.com' };
        }
        throw new Error('invalid token');
      }),
    }),
  }),
}));

// Mock pool for firebase route (findOrCreateByFirebaseUid)
const pool = require('../db/pool');
// Override query for firebase-specific selects
pool.query.mockImplementation(async (sql, params) => {
  if (sql.includes('SELECT id FROM users WHERE firebase_uid')) {
    return { rows: [] }; // new user
  }
  if (sql.includes('UPDATE users SET firebase_uid')) {
    return { rows: [] }; // no legacy user to link
  }
  if (sql.includes('INSERT INTO users') && sql.includes('firebase_uid')) {
    return { rows: [{ id: 'mock-user-uuid' }] };
  }
  if (sql.includes('INSERT INTO visibility_states')) {
    return { rows: [] };
  }
  if (sql.includes('INSERT INTO revoked_tokens')) {
    return { rows: [] };
  }
  if (sql.includes('FROM revoked_tokens')) {
    return { rows: [] };
  }
  if (sql.includes('SELECT banned_at FROM users')) {
    return { rows: [{ banned_at: null }] };
  }
  // profileService.getProfile
  if (sql.includes('SELECT') && sql.includes('FROM profiles')) {
    return { rows: [] };
  }
  return { rows: [] };
});

const app = require('../index');

describe('POST /api/v1/auth/firebase/verify', () => {
  it('returns 400 when id_token is missing', async () => {
    const res = await request(app).post('/api/v1/auth/firebase/verify').send({});
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when id_token is not a string', async () => {
    const res = await request(app).post('/api/v1/auth/firebase/verify').send({ id_token: 12345 });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 401 when Firebase rejects the token', async () => {
    const res = await request(app).post('/api/v1/auth/firebase/verify').send({ id_token: 'bad-token' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('FIREBASE_TOKEN_INVALID');
  });

  it('returns 200 with tokens on valid Firebase ID token', async () => {
    const res = await request(app).post('/api/v1/auth/firebase/verify').send({ id_token: 'valid-firebase-token' });
    expect(res.status).toBe(200);
    expect(res.body.access_token).toBeDefined();
    expect(res.body.refresh_token).toBeDefined();
    expect(res.body.user_id).toBe('mock-user-uuid');
    expect(res.body.is_new_user).toBe(true);
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

describe('Refresh token revoked after logout', () => {
  it('returns 401 REFRESH_TOKEN_REVOKED when refresh token used after DELETE /auth/session', async () => {
    const revokedStore = new Set();
    pool.query.mockImplementation(async (sql, params) => {
      if (sql.includes('INSERT INTO revoked_tokens')) {
        revokedStore.add(params[0]);
        return { rows: [] };
      }
      if (sql.includes('FROM revoked_tokens')) {
        return { rows: revokedStore.has(params[0]) ? [{ 1: 1 }] : [] };
      }
      return { rows: [] };
    });

    const jti = 'test-jti-logout-001';
    const refreshToken = jwt.sign(
      { sub: 'mock-user-uuid', jti },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: 604800 }
    );

    const logoutRes = await request(app)
      .delete('/api/v1/auth/session')
      .send({ refresh_token: refreshToken });
    expect(logoutRes.status).toBe(200);

    const refreshRes = await request(app)
      .post('/api/v1/auth/token/refresh')
      .send({ refresh_token: refreshToken });
    expect(refreshRes.status).toBe(401);
    expect(refreshRes.body.error.code).toBe('REFRESH_TOKEN_REVOKED');
  });
});

describe('Removed routes return 404', () => {
  it('POST /api/v1/auth/register returns 404', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({});
    expect(res.status).toBe(404);
  });

  it('POST /api/v1/auth/login returns 404', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({});
    expect(res.status).toBe(404);
  });

  it('POST /api/v1/auth/otp/request returns 404', async () => {
    const res = await request(app).post('/api/v1/auth/otp/request').send({});
    expect(res.status).toBe(404);
  });
});
