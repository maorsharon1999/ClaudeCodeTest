# Bubble Backend — Slice 1

Node.js + Express + PostgreSQL + Redis + JWT.

## Prerequisites

- Node.js 18+
- PostgreSQL 14+ running locally
- Redis 6+ running locally

## Setup

```bash
# 1. Install dependencies
cd backend
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env — fill in DATABASE_URL, REDIS_URL, and generate secrets with:
#   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

# 3. Create the database (psql)
createdb bubble_db

# 4. Run migration
npm run migrate

# 5. Start dev server
npm run dev
# or production:
npm start
```

## API — Base path: /api/v1

### Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /auth/otp/request | No | Request OTP (phone in body). Rate-limited 3/10min per phone. |
| POST | /auth/otp/verify | No | Verify OTP, receive access + refresh tokens. |
| POST | /auth/token/refresh | No | Exchange refresh token for new access token. |
| DELETE | /auth/session | No | Revoke refresh token (logout). |

### Profile (require `Authorization: Bearer <access_token>`)

| Method | Path | Description |
|--------|------|-------------|
| GET | /profile/me | Fetch own profile. |
| PUT | /profile/me | Upsert profile (display_name, birth_date required; age >= 18 enforced). |
| POST | /profile/me/photos | Append photo URL (max 3). Body: `{ url }` |
| DELETE | /profile/me/photos/:index | Remove photo at 0-based index. |

### Visibility (require auth)

| Method | Path | Description |
|--------|------|-------------|
| GET | /visibility/me | Get current state (`invisible` or `visible`). |
| PUT | /visibility/me | Set state. Body: `{ state: "visible" | "invisible" }` |

## Request / Response shape

### OTP request
```json
POST /api/v1/auth/otp/request
{ "phone": "+12125550001" }
-> 200 { "message": "OTP sent." }
```

### OTP verify
```json
POST /api/v1/auth/otp/verify
{ "phone": "+12125550001", "code": "123456" }
-> 200 { "access_token": "...", "refresh_token": "...", "user_id": "uuid" }
```

### Token refresh
```json
POST /api/v1/auth/token/refresh
{ "refresh_token": "..." }
-> 200 { "access_token": "..." }
```

### Error envelope (all errors)
```json
{ "error": { "code": "VALIDATION_ERROR", "message": "human-readable string" } }
```

## Error codes

| Code | HTTP |
|------|------|
| VALIDATION_ERROR | 400 |
| AGE_REQUIREMENT | 400 |
| OTP_NOT_FOUND | 400 |
| OTP_INVALID | 400 |
| OTP_RATE_LIMIT | 429 |
| OTP_LOCKED | 429 |
| UNAUTHORIZED | 401 |
| TOKEN_INVALID | 401 |
| REFRESH_TOKEN_INVALID | 401 |
| REFRESH_TOKEN_REVOKED | 401 |
| PROFILE_NOT_FOUND | 404 |
| PHOTOS_LIMIT | 400 |
| INTERNAL_ERROR | 500 |

## Running tests

```bash
npm test
```

Tests use Jest + Supertest with mocked PG pool and Redis — no live DB needed.

## Security notes

- Phone numbers are never stored. Only an HMAC-SHA256 hash keyed on `PHONE_HMAC_SECRET`.
- OTP codes are hashed with bcrypt (10 rounds) before storage.
- Access tokens expire in 15 minutes; refresh tokens in 7 days.
- Revoked refresh tokens are tracked in Redis with TTL matching token expiry.
- 5 failed OTP attempts lock that OTP row permanently (user must request a fresh code).
