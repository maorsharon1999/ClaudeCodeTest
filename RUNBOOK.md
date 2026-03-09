# Bubble MVP — Runbook

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 18+ |
| PostgreSQL | 14+ |
| Redis | 6+ |
| Expo CLI | `npx expo` |

---

## Environment Variables (backend)

Create `backend/.env`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/bubble
REDIS_URL=redis://localhost:6379
JWT_ACCESS_SECRET=<random 32+ char string>
JWT_REFRESH_SECRET=<different random 32+ char string>
PHONE_HMAC_SECRET=<another random 32+ char string>
ADMIN_SECRET=<random 32+ char string for internal API>
PORT=3000
```

---

## Running the Backend

```bash
cd backend
npm install

# Run all migrations (idempotent — safe to re-run)
node src/db/migrate.js

# Start the server
node src/index.js
# → "DB healthy. Server running on port 3000"
```

The server exits immediately (non-zero) if the DB health check fails at startup.

---

## Running the Frontend

```bash
cd frontend
npm install
npx expo start
```

Scan the QR code with Expo Go (iOS/Android) or press `w` for web.

---

## Running Backend Tests

```bash
cd backend
npm test
```

All tests use in-process mocks — no live DB or Redis required.

---

## Database Migrations

Migrations live in `backend/src/db/migrations/` and run in filename order (001, 002, …). Each is idempotent (`CREATE TABLE IF NOT EXISTS`, `ALTER TABLE … ADD COLUMN IF NOT EXISTS`, etc.).

```bash
node backend/src/db/migrate.js
# Expect one line per file: "Applied 001_init.sql", etc.
```

---

## Development Auth Bypass

JWT verification is **bypassed in development** — all authenticated requests are treated as user `00000000-0000-0000-0000-000000000001`. Remove this bypass before shipping to production (see `backend/src/middleware/auth.js`).

---

## Admin / Internal API

Protected by a static bearer token (`ADMIN_SECRET` env var). Use these endpoints for moderation:

```bash
# List all reports
curl -H "Authorization: Bearer $ADMIN_SECRET" \
  http://localhost:3000/internal/reports

# Ban a user
curl -X POST -H "Authorization: Bearer $ADMIN_SECRET" \
  http://localhost:3000/internal/users/<uuid>/ban

# Unban a user
curl -X DELETE -H "Authorization: Bearer $ADMIN_SECRET" \
  http://localhost:3000/internal/users/<uuid>/ban
```

Banned users receive `403 ACCOUNT_BANNED` on every authenticated request.

---

## Seeding Test Data

```sql
-- Second visible user near NYC
INSERT INTO users (id, phone_hash) VALUES ('00000000-0000-0000-0000-000000000002','h2') ON CONFLICT DO NOTHING;
INSERT INTO profiles (user_id, display_name, birth_date, gender, looking_for)
  VALUES ('00000000-0000-0000-0000-000000000002','Alex','1995-05-10','man','everyone') ON CONFLICT DO NOTHING;
INSERT INTO visibility_states (user_id, state)
  VALUES ('00000000-0000-0000-0000-000000000002','visible')
  ON CONFLICT (user_id) DO UPDATE SET state='visible';
INSERT INTO user_locations (user_id, lat, lng)
  VALUES ('00000000-0000-0000-0000-000000000002', 40.7130, -74.0062)
  ON CONFLICT (user_id) DO UPDATE SET lat=40.7130, lng=-74.0062, recorded_at=NOW();
```

---

## Key API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/auth/request-otp` | Request OTP |
| POST | `/api/v1/auth/verify-otp` | Verify OTP → tokens |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| POST | `/api/v1/auth/logout` | Revoke refresh token |
| GET | `/api/v1/profile/me` | Get own profile |
| PUT | `/api/v1/profile/me` | Create/update profile |
| POST | `/api/v1/profile/me/photos` | Add photo URL |
| GET | `/api/v1/visibility/me` | Get visibility state |
| PUT | `/api/v1/visibility/me` | Set visibility state |
| PUT | `/api/v1/location/me` | Update location |
| GET | `/api/v1/discovery/nearby` | Get nearby users |
| GET | `/api/v1/signals/incoming` | Incoming signals |
| GET | `/api/v1/signals/outgoing` | Outgoing signals |
| POST | `/api/v1/signals` | Send a signal |
| PUT | `/api/v1/signals/:id` | Approve/decline signal |
| GET | `/api/v1/threads` | List chat threads |
| GET | `/api/v1/threads/:id/messages` | Get messages (paginated) |
| POST | `/api/v1/threads/:id/messages` | Send message |
| POST | `/api/v1/blocks` | Block a user |
| POST | `/api/v1/reports` | Report a user |

---

## Rate Limits (per user)

| Endpoint | Limit |
|----------|-------|
| OTP requests | 5 / hour |
| OTP verify attempts | 5 / OTP (then locked) |
| Signal sends | 20 / hour |
| Message sends | 30 / minute |
| Thread/message reads | 60 / minute |
| Block actions | 10 / hour |
| Report actions | 10 / hour |

---

## Privacy Guarantees

- Exact GPS coordinates (`lat`, `lng`) are **never** returned to any client — only `proximity_bucket` (`"nearby"` < 500 m, `"same_area"` < 2 km)
- Location data expires after 30 minutes (enforced in SQL `WHERE` clause)
- Discovery only shows users with `visibility_state = 'visible'`
- Blocking a user cancels all pending signals between the pair and removes them from each other's discovery and threads
