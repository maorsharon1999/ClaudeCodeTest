'use strict';
process.env.DATABASE_URL       = 'postgresql://test:test@localhost:5432/test';
process.env.REDIS_URL          = 'redis://localhost:6379';
process.env.JWT_ACCESS_SECRET  = 'test-access-secret-long-enough-32chars!';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-long-enough-32!!';
process.env.PHONE_HMAC_SECRET  = 'test-phone-hmac-secret-long-enough!!!';

const request = require('supertest');
const jwt     = require('jsonwebtoken');

const TEST_USER_ID      = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
const NEARBY_USER_ID    = 'bbbbbbbb-cccc-dddd-eeee-ffffffffffff';

function makeAccessToken() {
  return jwt.sign({ sub: TEST_USER_ID }, process.env.JWT_ACCESS_SECRET, { expiresIn: 900 });
}

// Shared mock state
let mockHasLocation = true;
let mockNearbyUsers = [];

jest.mock('../db/pool', () => ({
  query: jest.fn(async (sql, params) => {
    // upsertLocation INSERT
    if (sql.includes('INSERT INTO user_locations')) {
      return { rows: [] };
    }
    // getNearby: caller location query
    if (sql.includes('SELECT lat, lng FROM user_locations')) {
      if (!mockHasLocation) return { rows: [] };
      return { rows: [{ lat: 40.7128, lng: -74.0060 }] };
    }
    // getNearby: caller profile query
    if (sql.includes('SELECT gender, looking_for FROM profiles')) {
      return { rows: [{ gender: 'man', looking_for: 'everyone' }] };
    }
    // getNearby: main CTE query
    if (sql.includes('WITH candidates AS')) {
      return { rows: mockNearbyUsers };
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

describe('PUT /api/v1/location/me', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).put('/api/v1/location/me').send({ lat: 40.7, lng: -74.0 });
    expect(res.status).toBe(401);
  });

  it('returns 400 when lat is missing', async () => {
    const res = await request(app)
      .put('/api/v1/location/me')
      .set('Authorization', `Bearer ${makeAccessToken()}`)
      .send({ lng: -74.0 });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when lng is missing', async () => {
    const res = await request(app)
      .put('/api/v1/location/me')
      .set('Authorization', `Bearer ${makeAccessToken()}`)
      .send({ lat: 40.7 });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when lat is out of range', async () => {
    const res = await request(app)
      .put('/api/v1/location/me')
      .set('Authorization', `Bearer ${makeAccessToken()}`)
      .send({ lat: 91, lng: -74.0 });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when lng is out of range', async () => {
    const res = await request(app)
      .put('/api/v1/location/me')
      .set('Authorization', `Bearer ${makeAccessToken()}`)
      .send({ lat: 40.7, lng: 181 });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 200 for valid location', async () => {
    const res = await request(app)
      .put('/api/v1/location/me')
      .set('Authorization', `Bearer ${makeAccessToken()}`)
      .send({ lat: 40.7, lng: -74.0 });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});

describe('GET /api/v1/discovery/nearby', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/v1/discovery/nearby');
    expect(res.status).toBe(401);
  });

  it('returns empty array when caller has no location', async () => {
    mockHasLocation = false;
    const res = await request(app)
      .get('/api/v1/discovery/nearby')
      .set('Authorization', `Bearer ${makeAccessToken()}`);
    expect(res.status).toBe(200);
    expect(res.body.users).toEqual([]);
    mockHasLocation = true;
  });

  it('returns user array when location exists', async () => {
    mockHasLocation = true;
    mockNearbyUsers = [
      {
        user_id: NEARBY_USER_ID,
        display_name: 'Alex',
        age: 30,
        bio: 'Loves hiking',
        photos: null,
        proximity_bucket: 'nearby',
        score: 7,
      },
    ];
    const res = await request(app)
      .get('/api/v1/discovery/nearby')
      .set('Authorization', `Bearer ${makeAccessToken()}`);
    expect(res.status).toBe(200);
    expect(res.body.users.length).toBe(1);
    expect(res.body.users[0].display_name).toBe('Alex');
    expect(res.body.users[0].proximity_bucket).toBe('nearby');
  });

  it('does not expose lat, lng, dist_m, or score in response', async () => {
    mockHasLocation = true;
    mockNearbyUsers = [
      {
        user_id: NEARBY_USER_ID,
        display_name: 'Alex',
        age: 30,
        bio: null,
        photos: null,
        proximity_bucket: 'nearby',
        score: 7,
      },
    ];
    const res = await request(app)
      .get('/api/v1/discovery/nearby')
      .set('Authorization', `Bearer ${makeAccessToken()}`);
    expect(res.status).toBe(200);
    const user = res.body.users[0];
    expect(user).not.toHaveProperty('lat');
    expect(user).not.toHaveProperty('lng');
    expect(user).not.toHaveProperty('dist_m');
    expect(user).not.toHaveProperty('score');
  });

  it('caps results at 20 even when DB returns more', async () => {
    mockHasLocation = true;
    mockNearbyUsers = Array.from({ length: 25 }, (_, i) => ({
      user_id: `user-${i}`,
      display_name: `User ${i}`,
      age: 25,
      bio: null,
      photos: null,
      proximity_bucket: 'same_area',
      score: 2,
    }));
    const res = await request(app)
      .get('/api/v1/discovery/nearby')
      .set('Authorization', `Bearer ${makeAccessToken()}`);
    expect(res.status).toBe(200);
    expect(res.body.users.length).toBeLessThanOrEqual(20);
    expect(res.body.users.every(u => !('score' in u))).toBe(true);
  });
});
