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

// Mock pool
let mockProfile = null;
jest.mock('../db/pool', () => ({
  query: jest.fn(async (sql) => {
    if (sql.includes('SELECT user_id, display_name') && !sql.includes('FOR UPDATE')) {
      return { rows: mockProfile ? [mockProfile] : [] };
    }
    if (sql.includes('INSERT INTO profiles') || sql.includes('ON CONFLICT (user_id) DO UPDATE')) {
      mockProfile = {
        user_id: TEST_USER_ID,
        display_name: 'Test User',
        birth_date: '1990-01-01',
        bio: null,
        gender: null,
        looking_for: null,
        photos: [],
        updated_at: new Date(),
      };
      return { rows: [mockProfile] };
    }
    if (sql.includes('FOR UPDATE')) {
      return { rows: mockProfile ? [{ photos: mockProfile.photos || [] }] : [] };
    }
    if (sql.includes('UPDATE profiles SET photos')) {
      return { rows: [{ photos: mockProfile ? mockProfile.photos : [] }] };
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

describe('GET /api/v1/profile/me', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/v1/profile/me');
    expect(res.status).toBe(401);
  });

  it('returns 404 when profile does not exist', async () => {
    mockProfile = null;
    const res = await request(app)
      .get('/api/v1/profile/me')
      .set('Authorization', `Bearer ${makeAccessToken()}`);
    expect(res.status).toBe(404);
  });

  it('returns profile when it exists', async () => {
    mockProfile = {
      user_id: TEST_USER_ID,
      display_name: 'Test User',
      birth_date: '1990-01-01',
      bio: null,
      gender: null,
      looking_for: null,
      photos: [],
      updated_at: new Date(),
    };
    const res = await request(app)
      .get('/api/v1/profile/me')
      .set('Authorization', `Bearer ${makeAccessToken()}`);
    expect(res.status).toBe(200);
    expect(res.body.profile.display_name).toBe('Test User');
  });
});

describe('PUT /api/v1/profile/me', () => {
  it('returns 400 when under 18', async () => {
    const res = await request(app)
      .put('/api/v1/profile/me')
      .set('Authorization', `Bearer ${makeAccessToken()}`)
      .send({ display_name: 'Kid', birth_date: '2015-01-01' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('AGE_REQUIREMENT');
  });

  it('returns 400 when bio > 140 chars', async () => {
    const res = await request(app)
      .put('/api/v1/profile/me')
      .set('Authorization', `Bearer ${makeAccessToken()}`)
      .send({ display_name: 'User', birth_date: '1990-01-01', bio: 'x'.repeat(141) });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 200 with valid profile data', async () => {
    const res = await request(app)
      .put('/api/v1/profile/me')
      .set('Authorization', `Bearer ${makeAccessToken()}`)
      .send({ display_name: 'Test User', birth_date: '1990-06-15' });
    expect(res.status).toBe(200);
    expect(res.body.profile).toBeDefined();
  });
});
