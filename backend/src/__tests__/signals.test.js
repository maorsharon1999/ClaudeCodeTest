'use strict';
process.env.DATABASE_URL       = 'postgresql://test:test@localhost:5432/test';
process.env.REDIS_URL          = 'redis://localhost:6379';
process.env.JWT_ACCESS_SECRET  = 'test-access-secret-long-enough-32chars!';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-long-enough-32!!';
process.env.PHONE_HMAC_SECRET  = 'test-phone-hmac-secret-long-enough!!!';

const request = require('supertest');
const jwt     = require('jsonwebtoken');

const TEST_USER_ID      = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
const RECIPIENT_USER_ID = 'bbbbbbbb-cccc-dddd-eeee-ffffffffffff';
const SIGNAL_ID         = 'cccccccc-dddd-eeee-ffff-aaaaaaaaaaaa';
const RATE_USER_ID      = 'ffffffff-eeee-dddd-cccc-bbbbbbbbbbbb';

function makeAccessToken(userId) {
  return jwt.sign({ sub: userId || TEST_USER_ID }, process.env.JWT_ACCESS_SECRET, { expiresIn: 900 });
}

let mockMode = 'default';

jest.mock('../db/pool', () => ({
  query: jest.fn(async (sql, params) => {
    // visibility_states check — used by sendSignal for recipient then caller
    if (sql.includes('SELECT state FROM visibility_states WHERE user_id')) {
      if (mockMode === 'recipient_invisible') {
        if (params[0] === RECIPIENT_USER_ID) return { rows: [{ state: 'invisible' }] };
        return { rows: [{ state: 'visible' }] };
      }
      if (mockMode === 'caller_invisible') {
        if (params[0] === RECIPIENT_USER_ID) return { rows: [{ state: 'visible' }] };
        return { rows: [{ state: 'invisible' }] };
      }
      return { rows: [{ state: 'visible' }] };
    }

    // Distance/proximity query
    if (sql.includes('FROM user_locations a, user_locations b')) {
      if (mockMode === 'out_of_range') {
        return { rows: [{ dist_m: 5000, proximity_bucket: null }] };
      }
      if (mockMode === 'no_location') {
        return { rows: [] };
      }
      return { rows: [{ dist_m: 100, proximity_bucket: 'nearby' }] };
    }

    // Duplicate/cooldown check — SELECT existing signal by sender+recipient
    if (sql.includes('SELECT id, state, created_at, updated_at FROM signals')) {
      if (mockMode === 'signal_pending_exists') {
        return { rows: [{ id: SIGNAL_ID, state: 'pending', created_at: new Date(), updated_at: new Date() }] };
      }
      if (mockMode === 'signal_approved_exists') {
        return { rows: [{ id: SIGNAL_ID, state: 'approved', created_at: new Date(), updated_at: new Date() }] };
      }
      if (mockMode === 'signal_declined_recent') {
        // declined 1 hour ago — still within 7-day cooldown
        const recentDecline = new Date(Date.now() - 60 * 60 * 1000);
        return { rows: [{ id: SIGNAL_ID, state: 'declined', created_at: recentDecline, updated_at: recentDecline }] };
      }
      if (mockMode === 'signal_declined_old') {
        // declined 8 days ago — cooldown has expired
        const oldDecline = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
        return { rows: [{ id: SIGNAL_ID, state: 'declined', created_at: oldDecline, updated_at: oldDecline }] };
      }
      return { rows: [] };
    }

    // DELETE stale declined signal
    if (sql.includes('DELETE FROM signals WHERE sender_id')) {
      return { rows: [] };
    }

    // INSERT new signal
    if (sql.includes('INSERT INTO signals')) {
      return {
        rows: [{
          id: SIGNAL_ID,
          sender_id: TEST_USER_ID,
          recipient_id: RECIPIENT_USER_ID,
          state: 'pending',
          proximity_bucket: 'nearby',
          created_at: new Date().toISOString(),
        }],
      };
    }

    // respondSignal: SELECT signal by id
    if (sql.includes('SELECT id, sender_id, recipient_id, state FROM signals WHERE id')) {
      if (mockMode === 'signal_not_found') {
        return { rows: [] };
      }
      if (mockMode === 'signal_wrong_recipient') {
        return { rows: [{ id: SIGNAL_ID, sender_id: TEST_USER_ID, recipient_id: 'other-user-id', state: 'pending' }] };
      }
      if (mockMode === 'signal_not_pending_approved') {
        return { rows: [{ id: SIGNAL_ID, sender_id: 'some-sender', recipient_id: TEST_USER_ID, state: 'approved' }] };
      }
      if (mockMode === 'signal_not_pending_declined') {
        return { rows: [{ id: SIGNAL_ID, sender_id: 'some-sender', recipient_id: TEST_USER_ID, state: 'declined' }] };
      }
      return { rows: [{ id: SIGNAL_ID, sender_id: RECIPIENT_USER_ID, recipient_id: TEST_USER_ID, state: 'pending' }] };
    }

    // UPDATE signal state
    if (sql.includes('UPDATE signals SET state=')) {
      const newState = params[0];
      return {
        rows: [{
          id: SIGNAL_ID,
          state: newState,
          updated_at: new Date().toISOString(),
        }],
      };
    }

    // getIncoming: JOIN profiles on sender_id
    if (sql.includes('FROM signals s') && sql.includes('JOIN profiles p ON p.user_id = s.sender_id')) {
      if (mockMode === 'no_incoming') {
        return { rows: [] };
      }
      return {
        rows: [{
          id: SIGNAL_ID,
          proximity_bucket: 'nearby',
          created_at: new Date().toISOString(),
          sender_user_id: RECIPIENT_USER_ID,
          display_name: 'Jordan',
          age: 28,
          bio: 'Test bio',
          photos: null,
        }],
      };
    }

    // getOutgoing: JOIN profiles on recipient_id
    if (sql.includes('FROM signals s') && sql.includes('JOIN profiles p ON p.user_id = s.recipient_id')) {
      if (mockMode === 'no_outgoing') {
        return { rows: [] };
      }
      if (mockMode === 'outgoing_with_declined') {
        return {
          rows: [
            {
              id: SIGNAL_ID,
              state: 'pending',
              proximity_bucket: 'nearby',
              created_at: new Date().toISOString(),
              recipient_user_id: RECIPIENT_USER_ID,
              display_name: 'Jordan',
              age: 28,
            },
            {
              id: 'dddddddd-eeee-ffff-aaaa-bbbbbbbbbbbb',
              state: 'approved',
              proximity_bucket: 'same_area',
              created_at: new Date().toISOString(),
              recipient_user_id: 'eeeeeeee-ffff-aaaa-bbbb-cccccccccccc',
              display_name: 'Taylor',
              age: 25,
            },
          ],
        };
      }
      return {
        rows: [{
          id: SIGNAL_ID,
          state: 'pending',
          proximity_bucket: 'nearby',
          created_at: new Date().toISOString(),
          recipient_user_id: RECIPIENT_USER_ID,
          display_name: 'Jordan',
          age: 28,
        }],
      };
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

beforeEach(() => {
  mockMode = 'default';
});

// ---------------------------------------------------------------------------
// POST /api/v1/signals
// ---------------------------------------------------------------------------
describe('POST /api/v1/signals', () => {
  it('returns 401 without token', async () => {
    const res = await request(app)
      .post('/api/v1/signals')
      .send({ recipient_id: RECIPIENT_USER_ID });
    expect(res.status).toBe(401);
  });

  it('returns 400 VALIDATION_ERROR when recipient_id missing', async () => {
    const res = await request(app)
      .post('/api/v1/signals')
      .set('Authorization', `Bearer ${makeAccessToken()}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 VALIDATION_ERROR when signaling self', async () => {
    const res = await request(app)
      .post('/api/v1/signals')
      .set('Authorization', `Bearer ${makeAccessToken()}`)
      .send({ recipient_id: TEST_USER_ID });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 422 RECIPIENT_NOT_VISIBLE when recipient is invisible', async () => {
    mockMode = 'recipient_invisible';
    const res = await request(app)
      .post('/api/v1/signals')
      .set('Authorization', `Bearer ${makeAccessToken()}`)
      .send({ recipient_id: RECIPIENT_USER_ID });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('RECIPIENT_NOT_VISIBLE');
  });

  it('returns 422 CALLER_NOT_VISIBLE when caller is invisible', async () => {
    mockMode = 'caller_invisible';
    const res = await request(app)
      .post('/api/v1/signals')
      .set('Authorization', `Bearer ${makeAccessToken()}`)
      .send({ recipient_id: RECIPIENT_USER_ID });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('CALLER_NOT_VISIBLE');
  });

  it('returns 422 OUT_OF_RANGE when distance >= 2000m (proximity_bucket null)', async () => {
    mockMode = 'out_of_range';
    const res = await request(app)
      .post('/api/v1/signals')
      .set('Authorization', `Bearer ${makeAccessToken()}`)
      .send({ recipient_id: RECIPIENT_USER_ID });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('OUT_OF_RANGE');
  });

  it('returns 409 SIGNAL_DUPLICATE when existing pending signal', async () => {
    mockMode = 'signal_pending_exists';
    const res = await request(app)
      .post('/api/v1/signals')
      .set('Authorization', `Bearer ${makeAccessToken()}`)
      .send({ recipient_id: RECIPIENT_USER_ID });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('SIGNAL_DUPLICATE');
  });

  it('returns 429 SIGNAL_COOLDOWN on declined signal within 7 days', async () => {
    mockMode = 'signal_declined_recent';
    const res = await request(app)
      .post('/api/v1/signals')
      .set('Authorization', `Bearer ${makeAccessToken()}`)
      .send({ recipient_id: RECIPIENT_USER_ID });
    expect(res.status).toBe(429);
    expect(res.body.error.code).toBe('SIGNAL_COOLDOWN');
  });

  it('returns 201 on resend after declined signal older than 7 days', async () => {
    mockMode = 'signal_declined_old';
    const res = await request(app)
      .post('/api/v1/signals')
      .set('Authorization', `Bearer ${makeAccessToken()}`)
      .send({ recipient_id: RECIPIENT_USER_ID });
    expect(res.status).toBe(201);
    expect(res.body.signal.state).toBe('pending');
  });

  it('returns 201 with signal object on success (nearby)', async () => {
    const res = await request(app)
      .post('/api/v1/signals')
      .set('Authorization', `Bearer ${makeAccessToken()}`)
      .send({ recipient_id: RECIPIENT_USER_ID });
    expect(res.status).toBe(201);
    expect(res.body.signal).toBeDefined();
    expect(res.body.signal.id).toBe(SIGNAL_ID);
    expect(res.body.signal.state).toBe('pending');
    expect(res.body.signal.proximity_bucket).toBe('nearby');
  });

  it('returns 429 RATE_LIMIT after exceeding 20 signals per hour', async () => {
    // Use a dedicated user so other tests are not affected by rate limiter state.
    // The limiter fires after 20 requests; send 21 and assert the last is 429.
    const token = makeAccessToken(RATE_USER_ID);
    let lastRes;
    for (let i = 0; i < 21; i++) {
      lastRes = await request(app)
        .post('/api/v1/signals')
        .set('Authorization', `Bearer ${token}`)
        .send({ recipient_id: RECIPIENT_USER_ID });
    }
    expect(lastRes.status).toBe(429);
    expect(lastRes.body.error.code).toBe('RATE_LIMIT');
  });
});

// ---------------------------------------------------------------------------
// PUT /api/v1/signals/:id
// ---------------------------------------------------------------------------
describe('PUT /api/v1/signals/:id', () => {
  it('returns 401 without token', async () => {
    const res = await request(app)
      .put(`/api/v1/signals/${SIGNAL_ID}`)
      .send({ action: 'approve' });
    expect(res.status).toBe(401);
  });

  it('returns 404 NOT_FOUND for unknown id', async () => {
    mockMode = 'signal_not_found';
    const res = await request(app)
      .put(`/api/v1/signals/${SIGNAL_ID}`)
      .set('Authorization', `Bearer ${makeAccessToken()}`)
      .send({ action: 'approve' });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('returns 403 FORBIDDEN when caller is sender not recipient', async () => {
    mockMode = 'signal_wrong_recipient';
    const res = await request(app)
      .put(`/api/v1/signals/${SIGNAL_ID}`)
      .set('Authorization', `Bearer ${makeAccessToken()}`)
      .send({ action: 'approve' });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('returns 409 SIGNAL_NOT_PENDING for already-decided signal', async () => {
    mockMode = 'signal_not_pending_approved';
    const res = await request(app)
      .put(`/api/v1/signals/${SIGNAL_ID}`)
      .set('Authorization', `Bearer ${makeAccessToken()}`)
      .send({ action: 'approve' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('SIGNAL_NOT_PENDING');
  });

  it('returns 400 VALIDATION_ERROR for invalid action', async () => {
    const res = await request(app)
      .put(`/api/v1/signals/${SIGNAL_ID}`)
      .set('Authorization', `Bearer ${makeAccessToken()}`)
      .send({ action: 'invalid_action' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 200 state=approved on approve', async () => {
    const res = await request(app)
      .put(`/api/v1/signals/${SIGNAL_ID}`)
      .set('Authorization', `Bearer ${makeAccessToken()}`)
      .send({ action: 'approve' });
    expect(res.status).toBe(200);
    expect(res.body.signal.state).toBe('approved');
  });

  it('returns 200 state=declined on decline', async () => {
    const res = await request(app)
      .put(`/api/v1/signals/${SIGNAL_ID}`)
      .set('Authorization', `Bearer ${makeAccessToken()}`)
      .send({ action: 'decline' });
    expect(res.status).toBe(200);
    expect(res.body.signal.state).toBe('declined');
  });
});

// ---------------------------------------------------------------------------
// GET /api/v1/signals/incoming
// ---------------------------------------------------------------------------
describe('GET /api/v1/signals/incoming', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/v1/signals/incoming');
    expect(res.status).toBe(401);
  });

  it('returns 200 { signals: [] } when none', async () => {
    mockMode = 'no_incoming';
    const res = await request(app)
      .get('/api/v1/signals/incoming')
      .set('Authorization', `Bearer ${makeAccessToken()}`);
    expect(res.status).toBe(200);
    expect(res.body.signals).toEqual([]);
  });

  it('returns 200 with shaped sender objects, no lat/lng/dist_m in response', async () => {
    const res = await request(app)
      .get('/api/v1/signals/incoming')
      .set('Authorization', `Bearer ${makeAccessToken()}`);
    expect(res.status).toBe(200);
    expect(res.body.signals.length).toBe(1);
    const sig = res.body.signals[0];
    expect(sig.sender).toBeDefined();
    expect(sig.sender.display_name).toBe('Jordan');
    expect(sig.sender.age).toBe(28);
    expect(sig).not.toHaveProperty('lat');
    expect(sig).not.toHaveProperty('lng');
    expect(sig).not.toHaveProperty('dist_m');
    expect(sig.sender).not.toHaveProperty('lat');
    expect(sig.sender).not.toHaveProperty('lng');
    expect(sig.sender).not.toHaveProperty('dist_m');
    expect(sig.sender).not.toHaveProperty('score');
  });
});

// ---------------------------------------------------------------------------
// GET /api/v1/signals/outgoing
// ---------------------------------------------------------------------------
describe('GET /api/v1/signals/outgoing', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/v1/signals/outgoing');
    expect(res.status).toBe(401);
  });

  it('returns 200 { signals: [] } when none', async () => {
    mockMode = 'no_outgoing';
    const res = await request(app)
      .get('/api/v1/signals/outgoing')
      .set('Authorization', `Bearer ${makeAccessToken()}`);
    expect(res.status).toBe(200);
    expect(res.body.signals).toEqual([]);
  });

  it('returns 200 with pending and approved signals', async () => {
    mockMode = 'outgoing_with_declined';
    const res = await request(app)
      .get('/api/v1/signals/outgoing')
      .set('Authorization', `Bearer ${makeAccessToken()}`);
    expect(res.status).toBe(200);
    expect(res.body.signals.length).toBe(2);
    const states = res.body.signals.map(s => s.state);
    expect(states).toContain('pending');
    expect(states).toContain('approved');
  });

  it('contains NO declined signals even if mock returns them', async () => {
    mockMode = 'outgoing_with_declined';
    const res = await request(app)
      .get('/api/v1/signals/outgoing')
      .set('Authorization', `Bearer ${makeAccessToken()}`);
    expect(res.status).toBe(200);
    const declined = res.body.signals.filter(s => s.state === 'declined');
    expect(declined.length).toBe(0);
  });
});