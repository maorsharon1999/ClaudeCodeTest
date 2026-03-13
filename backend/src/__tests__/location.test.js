'use strict';
process.env.DATABASE_URL       = 'postgresql://test:test@localhost:5432/test';
process.env.REDIS_URL          = 'redis://localhost:6379';
process.env.JWT_ACCESS_SECRET  = 'test-access-secret-long-enough-32chars!';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-long-enough-32!!';
process.env.PHONE_HMAC_SECRET  = 'test-phone-hmac-secret-long-enough!!!';

const request = require('supertest');
const jwt     = require('jsonwebtoken');
const { jitterCoords, djb2 } = require('../services/locationService');

const TEST_USER_ID      = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
const NEARBY_USER_ID    = 'bbbbbbbb-cccc-dddd-eeee-ffffffffffff';

// Helper: haversine distance in metres between two lat/lng pairs
function haversineM(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

// ----- Pure function unit tests (no DB required) -----
describe('jitterCoords pure function', () => {
  const userId = 'user-test-123';
  const lat = 40.7128;
  const lng = -74.006;
  const recordedAt = new Date('2026-01-01T12:00:00Z');

  it('is deterministic: same inputs produce same output', () => {
    const r1 = jitterCoords(userId, lat, lng, 'nearby', recordedAt);
    const r2 = jitterCoords(userId, lat, lng, 'nearby', recordedAt);
    expect(r1.jittered_lat).toBe(r2.jittered_lat);
    expect(r1.jittered_lng).toBe(r2.jittered_lng);
  });

  it('nearby bucket: jitter offset is less than 200 m', () => {
    const { jittered_lat, jittered_lng } = jitterCoords(userId, lat, lng, 'nearby', recordedAt);
    const dist = haversineM(lat, lng, jittered_lat, jittered_lng);
    expect(dist).toBeLessThan(200);
  });

  it('same_area bucket: jitter offset is less than 600 m', () => {
    const { jittered_lat, jittered_lng } = jitterCoords(userId, lat, lng, 'same_area', recordedAt);
    const dist = haversineM(lat, lng, jittered_lat, jittered_lng);
    expect(dist).toBeLessThan(600);
  });

  it('returns jittered_lat and jittered_lng keys', () => {
    const result = jitterCoords(userId, lat, lng, 'nearby', recordedAt);
    expect(result).toHaveProperty('jittered_lat');
    expect(result).toHaveProperty('jittered_lng');
    expect(result).not.toHaveProperty('lat');
    expect(result).not.toHaveProperty('lng');
  });
});

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
        lat: 40.7128,
        lng: -74.006,
        recorded_at: new Date('2026-01-01T12:00:00Z'),
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

  it('does not expose lat, lng, dist_m, or score in response; exposes jittered coords', async () => {
    mockHasLocation = true;
    mockNearbyUsers = [
      {
        user_id: NEARBY_USER_ID,
        display_name: 'Alex',
        age: 30,
        bio: null,
        photos: null,
        proximity_bucket: 'nearby',
        lat: 40.7128,
        lng: -74.006,
        recorded_at: new Date('2026-01-01T12:00:00Z'),
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
    // Jittered coordinates must be present
    expect(user).toHaveProperty('jittered_lat');
    expect(user).toHaveProperty('jittered_lng');
    expect(typeof user.jittered_lat).toBe('number');
    expect(typeof user.jittered_lng).toBe('number');
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
      lat: 40.7128,
      lng: -74.006,
      recorded_at: new Date('2026-01-01T12:00:00Z'),
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
