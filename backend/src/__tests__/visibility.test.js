'use strict';
process.env.DATABASE_URL    = 'postgresql://test:test@localhost:5432/test';
process.env.REDIS_URL        = 'redis://localhost:6379';
process.env.JWT_ACCESS_SECRET  = 'test-access-secret-long-enough-32chars!';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-long-enough-32!!';
process.env.PHONE_HMAC_SECRET  = 'test-phone-hmac-secret-long-enough!!!';

const request = require('supertest');
const jwt     = require('jsonwebtoken');

const TEST_USER_ID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

function makeAccessToken() {
  return jwt.sign({ sub: TEST_USER_ID }, process.env.JWT_ACCESS_SECRET, { expiresIn: 900 });
}

let mockState = 'invisible';

jest.mock('../db/pool', () => ({
  query: jest.fn(async (sql) => {
    if (sql.includes('SELECT state')) {
      return { rows: [{ state: mockState, updated_at: new Date() }] };
    }
    if (sql.includes('INSERT INTO visibility_states')) {
      return { rows: [{ state: mockState, updated_at: new Date() }] };
    }
    return { rows: [] };
  }),
}));

jest.mock('../db/redis', () => ({
  getRedis: async () => ({
    incr: async () => 1,
    expire: async () => {},
    set: async () => {},
    get: async () => null,
  }),
}));

const app = require('../index');

describe('GET /api/v1/visibility/me', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/v1/visibility/me');
    expect(res.status).toBe(401);
  });

  it('returns current visibility state', async () => {
    mockState = 'invisible';
    const res = await request(app)
      .get('/api/v1/visibility/me')
      .set('Authorization', `Bearer ${makeAccessToken()}`);
    expect(res.status).toBe(200);
    expect(res.body.visibility.state).toBe('invisible');
  });
});

describe('PUT /api/v1/visibility/me', () => {
  it('returns 400 for invalid state', async () => {
    const res = await request(app)
      .put('/api/v1/visibility/me')
      .set('Authorization', `Bearer ${makeAccessToken()}`)
      .send({ state: 'ghost' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('sets state to visible', async () => {
    const pool = require('../db/pool');
    pool.query.mockImplementationOnce(async () => ({
      rows: [{ state: 'visible', updated_at: new Date() }],
    }));
    const res = await request(app)
      .put('/api/v1/visibility/me')
      .set('Authorization', `Bearer ${makeAccessToken()}`)
      .send({ state: 'visible' });
    expect(res.status).toBe(200);
    expect(res.body.visibility.state).toBe('visible');
  });
});
