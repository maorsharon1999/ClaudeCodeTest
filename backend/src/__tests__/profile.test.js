'use strict';
process.env.DATABASE_URL           = 'postgresql://test:test@localhost:5432/test';
process.env.JWT_ACCESS_SECRET      = 'test-access-secret-long-enough-32chars!';
process.env.JWT_REFRESH_SECRET     = 'test-refresh-secret-long-enough-32!!';
process.env.ADMIN_SECRET           = 'test-admin-secret-long-enough-32chars!';
process.env.FIREBASE_PROJECT_ID    = 'test-project';
process.env.FIREBASE_STORAGE_BUCKET = 'test-project.appspot.com';

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
        intent: null,
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
      intent: null,
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

// --- AC: No plaintext phone in profile API response ---
describe('GET /api/v1/profile/me — privacy', () => {
  it('does not include phone or phone_hash in profile response', async () => {
    mockProfile = {
      user_id: TEST_USER_ID,
      display_name: 'Privacy Check',
      birth_date: '1990-01-01',
      bio: null,
      gender: null,
      looking_for: null,
      intent: null,
      photos: [],
      updated_at: new Date(),
    };
    const res = await request(app)
      .get('/api/v1/profile/me')
      .set('Authorization', `Bearer ${makeAccessToken()}`);
    expect(res.status).toBe(200);
    const profileKeys = Object.keys(res.body.profile);
    expect(profileKeys).not.toContain('phone');
    expect(profileKeys).not.toContain('phone_hash');
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

  it('returns 400 when display_name is missing', async () => {
    const res = await request(app)
      .put('/api/v1/profile/me')
      .set('Authorization', `Bearer ${makeAccessToken()}`)
      .send({ birth_date: '1990-06-15' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when birth_date is missing', async () => {
    const res = await request(app)
      .put('/api/v1/profile/me')
      .set('Authorization', `Bearer ${makeAccessToken()}`)
      .send({ display_name: 'No Date' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

// --- AC: Max 3 photos enforced; 4th upload rejected ---
describe('POST /api/v1/profile/me/photos', () => {
  it('returns 400 PHOTOS_LIMIT when profile already has 3 photos', async () => {
    const pool = require('../db/pool');
    // First call is the ban check in authRequired — return not-banned
    pool.query.mockImplementationOnce(async () => ({ rows: [] }));
    // Second call: FOR UPDATE query to return profile with 3 photos
    pool.query.mockImplementationOnce(async (sql) => {
      if (sql.includes('FOR UPDATE')) {
        return { rows: [{ photos: ['http://a.com/1.jpg', 'http://a.com/2.jpg', 'http://a.com/3.jpg'] }] };
      }
      return { rows: [] };
    });
    const res = await request(app)
      .post('/api/v1/profile/me/photos')
      .set('Authorization', `Bearer ${makeAccessToken()}`)
      .send({ url: 'http://a.com/4.jpg' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('PHOTOS_LIMIT');
  });

  it('returns 400 for invalid photo URL', async () => {
    const pool = require('../db/pool');
    // First call is the ban check in authRequired — return not-banned
    pool.query.mockImplementationOnce(async () => ({ rows: [] }));
    // Second call: FOR UPDATE query
    pool.query.mockImplementationOnce(async (sql) => {
      if (sql.includes('FOR UPDATE')) return { rows: [{ photos: [] }] };
      return { rows: [] };
    });
    const res = await request(app)
      .post('/api/v1/profile/me/photos')
      .set('Authorization', `Bearer ${makeAccessToken()}`)
      .send({ url: 'not-a-url' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

// --- AC: intent field accepted and validated ---
describe('PUT /api/v1/profile/me — intent field', () => {
  it('accepts valid intent without error', async () => {
    const res = await request(app)
      .put('/api/v1/profile/me')
      .set('Authorization', `Bearer ${makeAccessToken()}`)
      .send({ display_name: 'Test User', birth_date: '1990-06-15', intent: 'casual' });
    expect(res.status).toBe(200);
    expect(res.body.profile).toBeDefined();
  });

  it('returns 400 VALIDATION_ERROR for invalid intent', async () => {
    const res = await request(app)
      .put('/api/v1/profile/me')
      .set('Authorization', `Bearer ${makeAccessToken()}`)
      .send({ display_name: 'Test User', birth_date: '1990-06-15', intent: 'invalid' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

// --- AC: upload endpoint rejects missing file ---
describe('POST /api/v1/profile/me/photos/upload', () => {
  it('returns 400 NO_FILE when no file is attached', async () => {
    const res = await request(app)
      .post('/api/v1/profile/me/photos/upload')
      .set('Authorization', `Bearer ${makeAccessToken()}`);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('NO_FILE');
  });
});
