'use strict';
process.env.DATABASE_URL       = 'postgresql://test:test@localhost:5432/test';
process.env.REDIS_URL          = 'redis://localhost:6379';
process.env.JWT_ACCESS_SECRET  = 'test-access-secret-long-enough-32chars!';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-long-enough-32!!';
process.env.PHONE_HMAC_SECRET  = 'test-phone-hmac-secret-long-enough!!!';

const request = require('supertest');
const jwt     = require('jsonwebtoken');

const CALLER_ID  = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
const OTHER_ID   = 'bbbbbbbb-cccc-dddd-eeee-ffffffffffff';
const THREAD_ID  = 'cccccccc-dddd-eeee-ffff-aaaaaaaaaaaa';
const MSG_ID     = 'dddddddd-eeee-ffff-aaaa-bbbbbbbbbbbb';
const RATE_USER  = 'ffffffff-eeee-dddd-cccc-bbbbbbbbbbbb';

function makeAccessToken(userId) {
  return jwt.sign({ sub: userId || CALLER_ID }, process.env.JWT_ACCESS_SECRET, { expiresIn: 900 });
}

let mockMode = 'default';

jest.mock('../db/pool', () => ({
  query: jest.fn(async (sql, params) => {
    // Approved pairs query (getThreadsForUser step 1)
    if (sql.includes('FROM signals s') && sql.includes("state = 'approved'") && sql.includes('NOT EXISTS')) {
      if (mockMode === 'no_approved_pairs') return { rows: [] };
      return { rows: [{ other_id: OTHER_ID }] };
    }

    // Thread upsert
    if (sql.includes('INSERT INTO chat_threads')) {
      return { rows: [] };
    }

    // Threads list with profiles + last message
    if (sql.includes('FROM chat_threads t') && sql.includes('JOIN profiles p')) {
      if (mockMode === 'no_threads') return { rows: [] };
      return {
        rows: [{
          thread_id: THREAD_ID,
          other_user_id: OTHER_ID,
          display_name: 'Alex',
          age: 28,
          photos: null,
          last_msg_id: MSG_ID,
          last_msg_body: 'Hey!',
          last_msg_sent_at: new Date().toISOString(),
          last_msg_sender_id: OTHER_ID,
        }],
      };
    }

    // Thread membership check (getMessages / sendMessage)
    if (sql.includes('SELECT user_a_id, user_b_id FROM chat_threads WHERE id')) {
      if (mockMode === 'thread_not_found') return { rows: [] };
      const a = CALLER_ID < OTHER_ID ? CALLER_ID : OTHER_ID;
      const b = CALLER_ID < OTHER_ID ? OTHER_ID : CALLER_ID;
      return { rows: [{ user_a_id: a, user_b_id: b }] };
    }

    // Block check (bilateral SELECT — must not match DELETE)
    if (!sql.trimStart().startsWith('DELETE') && sql.includes('FROM blocks') && sql.includes('blocker_id')) {
      if (mockMode === 'blocked') return { rows: [{ '1': 1 }] };
      return { rows: [] };
    }

    // Messages list
    if (sql.includes('FROM chat_messages WHERE thread_id')) {
      if (mockMode === 'no_messages') return { rows: [] };
      return {
        rows: [{
          id: MSG_ID,
          body: 'Hello!',
          sent_at: new Date().toISOString(),
          sender_id: OTHER_ID,
        }],
      };
    }

    // Insert message
    if (sql.includes('INSERT INTO chat_messages')) {
      return {
        rows: [{
          id: MSG_ID,
          body: params[2],
          sent_at: new Date().toISOString(),
        }],
      };
    }

    // Relationship check for block/report (approved signal between the pair)
    if (sql.includes('FROM signals') && sql.includes("state = 'approved'") && sql.includes('LIMIT 1')) {
      if (mockMode === 'no_relationship') return { rows: [] };
      return { rows: [{ '1': 1 }] };
    }

    // Block insert
    if (sql.includes('INSERT INTO blocks')) {
      if (mockMode === 'already_blocked') {
        const err = new Error('duplicate'); err.code = '23505'; throw err;
      }
      return { rows: [] };
    }

    // Block delete
    if (sql.includes('DELETE FROM blocks')) {
      if (mockMode === 'block_not_found') return { rowCount: 0 };
      return { rowCount: 1 };
    }

    // Report insert
    if (sql.includes('INSERT INTO reports')) {
      return { rows: [] };
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
// GET /api/v1/threads
// ---------------------------------------------------------------------------
describe('GET /api/v1/threads', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/v1/threads');
    expect(res.status).toBe(401);
  });

  it('returns 200 { threads: [] } when no approved pairs', async () => {
    mockMode = 'no_approved_pairs';
    const res = await request(app)
      .get('/api/v1/threads')
      .set('Authorization', `Bearer ${makeAccessToken()}`);
    expect(res.status).toBe(200);
    expect(res.body.threads).toEqual([]);
  });

  it('returns 200 with thread array when approved pair exists', async () => {
    const res = await request(app)
      .get('/api/v1/threads')
      .set('Authorization', `Bearer ${makeAccessToken()}`);
    expect(res.status).toBe(200);
    expect(res.body.threads.length).toBe(1);
    const thread = res.body.threads[0];
    expect(thread.thread_id).toBe(THREAD_ID);
    expect(thread.other_user.display_name).toBe('Alex');
    expect(thread.other_user.age).toBe(28);
    expect(thread.last_message.is_mine).toBe(false);
  });

  it('response does not expose sender_id or raw internal UUIDs in messages', async () => {
    const res = await request(app)
      .get('/api/v1/threads')
      .set('Authorization', `Bearer ${makeAccessToken()}`);
    expect(res.status).toBe(200);
    const thread = res.body.threads[0];
    // last_message must not expose sender_id
    expect(thread.last_message).not.toHaveProperty('sender_id');
    // other_user may expose user_id (for block/report actions), nothing more raw
    expect(thread.other_user.user_id).toBe(OTHER_ID);
  });
});

// ---------------------------------------------------------------------------
// GET /api/v1/threads/:id/messages
// ---------------------------------------------------------------------------
describe('GET /api/v1/threads/:id/messages', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).get(`/api/v1/threads/${THREAD_ID}/messages`);
    expect(res.status).toBe(401);
  });

  it('returns 404 NOT_FOUND for unknown thread', async () => {
    mockMode = 'thread_not_found';
    const res = await request(app)
      .get(`/api/v1/threads/${THREAD_ID}/messages`)
      .set('Authorization', `Bearer ${makeAccessToken()}`);
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('returns 403 FORBIDDEN when caller is not a thread member', async () => {
    // Token for a user who is not CALLER_ID or OTHER_ID
    const outsiderToken = makeAccessToken('eeeeeeee-ffff-aaaa-bbbb-cccccccccccc');
    const res = await request(app)
      .get(`/api/v1/threads/${THREAD_ID}/messages`)
      .set('Authorization', `Bearer ${outsiderToken}`);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('returns 403 FORBIDDEN when a block exists', async () => {
    mockMode = 'blocked';
    const res = await request(app)
      .get(`/api/v1/threads/${THREAD_ID}/messages`)
      .set('Authorization', `Bearer ${makeAccessToken()}`);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('returns 200 with messages array — each message has id, body, sent_at, is_mine but NOT sender_id', async () => {
    const res = await request(app)
      .get(`/api/v1/threads/${THREAD_ID}/messages`)
      .set('Authorization', `Bearer ${makeAccessToken()}`);
    expect(res.status).toBe(200);
    expect(res.body.messages.length).toBe(1);
    const msg = res.body.messages[0];
    expect(msg).toHaveProperty('id');
    expect(msg).toHaveProperty('body');
    expect(msg).toHaveProperty('sent_at');
    expect(msg).toHaveProperty('is_mine');
    expect(msg).not.toHaveProperty('sender_id');
  });

  it('returns 200 { messages: [] } when no messages', async () => {
    mockMode = 'no_messages';
    const res = await request(app)
      .get(`/api/v1/threads/${THREAD_ID}/messages`)
      .set('Authorization', `Bearer ${makeAccessToken()}`);
    expect(res.status).toBe(200);
    expect(res.body.messages).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// POST /api/v1/threads/:id/messages
// ---------------------------------------------------------------------------
describe('POST /api/v1/threads/:id/messages', () => {
  it('returns 401 without token', async () => {
    const res = await request(app)
      .post(`/api/v1/threads/${THREAD_ID}/messages`)
      .send({ body: 'Hello!' });
    expect(res.status).toBe(401);
  });

  it('returns 400 VALIDATION_ERROR when body is missing', async () => {
    const res = await request(app)
      .post(`/api/v1/threads/${THREAD_ID}/messages`)
      .set('Authorization', `Bearer ${makeAccessToken()}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 VALIDATION_ERROR when body is empty string', async () => {
    const res = await request(app)
      .post(`/api/v1/threads/${THREAD_ID}/messages`)
      .set('Authorization', `Bearer ${makeAccessToken()}`)
      .send({ body: '' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 VALIDATION_ERROR when body is > 1000 chars', async () => {
    const res = await request(app)
      .post(`/api/v1/threads/${THREAD_ID}/messages`)
      .set('Authorization', `Bearer ${makeAccessToken()}`)
      .send({ body: 'x'.repeat(1001) });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 404 NOT_FOUND for unknown thread', async () => {
    mockMode = 'thread_not_found';
    const res = await request(app)
      .post(`/api/v1/threads/${THREAD_ID}/messages`)
      .set('Authorization', `Bearer ${makeAccessToken()}`)
      .send({ body: 'Hello!' });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('returns 403 FORBIDDEN when block exists', async () => {
    mockMode = 'blocked';
    const res = await request(app)
      .post(`/api/v1/threads/${THREAD_ID}/messages`)
      .set('Authorization', `Bearer ${makeAccessToken()}`)
      .send({ body: 'Hello!' });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('returns 201 with message object { id, body, sent_at, is_mine: true } on success', async () => {
    const res = await request(app)
      .post(`/api/v1/threads/${THREAD_ID}/messages`)
      .set('Authorization', `Bearer ${makeAccessToken()}`)
      .send({ body: 'Hello!' });
    expect(res.status).toBe(201);
    expect(res.body.message).toHaveProperty('id');
    expect(res.body.message).toHaveProperty('body');
    expect(res.body.message).toHaveProperty('sent_at');
    expect(res.body.message.is_mine).toBe(true);
  });

  it('201 message response must not contain sender_id', async () => {
    const res = await request(app)
      .post(`/api/v1/threads/${THREAD_ID}/messages`)
      .set('Authorization', `Bearer ${makeAccessToken()}`)
      .send({ body: 'Hello!' });
    expect(res.status).toBe(201);
    expect(res.body.message).not.toHaveProperty('sender_id');
  });

  it('returns 429 RATE_LIMIT after 31 requests', async () => {
    const token = makeAccessToken(RATE_USER);
    let lastRes;
    for (let i = 0; i < 31; i++) {
      lastRes = await request(app)
        .post(`/api/v1/threads/${THREAD_ID}/messages`)
        .set('Authorization', `Bearer ${token}`)
        .send({ body: 'Hello!' });
    }
    expect(lastRes.status).toBe(429);
    expect(lastRes.body.error.code).toBe('RATE_LIMIT');
  });
});

// ---------------------------------------------------------------------------
// POST /api/v1/blocks
// ---------------------------------------------------------------------------
describe('POST /api/v1/blocks', () => {
  it('returns 401 without token', async () => {
    const res = await request(app)
      .post('/api/v1/blocks')
      .send({ blocked_id: OTHER_ID });
    expect(res.status).toBe(401);
  });

  it('returns 400 VALIDATION_ERROR when blocked_id missing', async () => {
    const res = await request(app)
      .post('/api/v1/blocks')
      .set('Authorization', `Bearer ${makeAccessToken()}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 VALIDATION_ERROR when blocking self', async () => {
    const res = await request(app)
      .post('/api/v1/blocks')
      .set('Authorization', `Bearer ${makeAccessToken()}`)
      .send({ blocked_id: CALLER_ID });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 403 FORBIDDEN when no approved signal exists between the pair', async () => {
    mockMode = 'no_relationship';
    const res = await request(app)
      .post('/api/v1/blocks')
      .set('Authorization', `Bearer ${makeAccessToken()}`)
      .send({ blocked_id: OTHER_ID });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('returns 409 ALREADY_BLOCKED when already blocked', async () => {
    mockMode = 'already_blocked';
    const res = await request(app)
      .post('/api/v1/blocks')
      .set('Authorization', `Bearer ${makeAccessToken()}`)
      .send({ blocked_id: OTHER_ID });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('ALREADY_BLOCKED');
  });

  it('returns 201 { blocked: true } on success', async () => {
    const res = await request(app)
      .post('/api/v1/blocks')
      .set('Authorization', `Bearer ${makeAccessToken()}`)
      .send({ blocked_id: OTHER_ID });
    expect(res.status).toBe(201);
    expect(res.body.blocked).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/v1/blocks/:blocked_id
// ---------------------------------------------------------------------------
describe('DELETE /api/v1/blocks/:blocked_id', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).delete(`/api/v1/blocks/${OTHER_ID}`);
    expect(res.status).toBe(401);
  });

  it('returns 404 NOT_FOUND when no existing block', async () => {
    mockMode = 'block_not_found';
    const res = await request(app)
      .delete(`/api/v1/blocks/${OTHER_ID}`)
      .set('Authorization', `Bearer ${makeAccessToken()}`);
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('returns 200 { unblocked: true } on success', async () => {
    const res = await request(app)
      .delete(`/api/v1/blocks/${OTHER_ID}`)
      .set('Authorization', `Bearer ${makeAccessToken()}`);
    expect(res.status).toBe(200);
    expect(res.body.unblocked).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// POST /api/v1/reports
// ---------------------------------------------------------------------------
describe('POST /api/v1/reports', () => {
  it('returns 401 without token', async () => {
    const res = await request(app)
      .post('/api/v1/reports')
      .send({ reported_id: OTHER_ID, reason: 'spam' });
    expect(res.status).toBe(401);
  });

  it('returns 400 VALIDATION_ERROR when reported_id missing', async () => {
    const res = await request(app)
      .post('/api/v1/reports')
      .set('Authorization', `Bearer ${makeAccessToken()}`)
      .send({ reason: 'spam' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 VALIDATION_ERROR when reporting self', async () => {
    const res = await request(app)
      .post('/api/v1/reports')
      .set('Authorization', `Bearer ${makeAccessToken()}`)
      .send({ reported_id: CALLER_ID, reason: 'spam' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 VALIDATION_ERROR when reason missing', async () => {
    const res = await request(app)
      .post('/api/v1/reports')
      .set('Authorization', `Bearer ${makeAccessToken()}`)
      .send({ reported_id: OTHER_ID });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 VALIDATION_ERROR when reason > 500 chars', async () => {
    const res = await request(app)
      .post('/api/v1/reports')
      .set('Authorization', `Bearer ${makeAccessToken()}`)
      .send({ reported_id: OTHER_ID, reason: 'x'.repeat(501) });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 403 FORBIDDEN when no approved signal exists between the pair', async () => {
    mockMode = 'no_relationship';
    const res = await request(app)
      .post('/api/v1/reports')
      .set('Authorization', `Bearer ${makeAccessToken()}`)
      .send({ reported_id: OTHER_ID, reason: 'spam' });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('returns 201 { reported: true } on success', async () => {
    const res = await request(app)
      .post('/api/v1/reports')
      .set('Authorization', `Bearer ${makeAccessToken()}`)
      .send({ reported_id: OTHER_ID, reason: 'inappropriate content' });
    expect(res.status).toBe(201);
    expect(res.body.reported).toBe(true);
  });
});
