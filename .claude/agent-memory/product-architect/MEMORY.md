# Product Architect Memory

## Project: Bubble MVP

### Core product constraints (never violate)
- Exact location NEVER sent to any client; proximity buckets only (nearby / same area / far)
- Direct messaging requires explicit consent approval — no bypasses
- Visibility default is INVISIBLE; user must opt in to VISIBLE each session
- No personality engine, no venue chat, no deep matching in MVP

### Slice delivery order (from SKILL.md)
1. Auth + Profile + Visibility State  (current)
2. Nearby Discovery + Personal Bubble Relevance
3. Signal / Approve / Decline
4. Chat + Report / Block
5. Safety Hardening + Moderation Basics + Release Readiness

### Slice 1 key decisions
- Auth: phone number + SMS OTP only (no social login in MVP)
- Profile: display name, age, 1-3 photos, 1-sentence bio, gender, "looking for" (single-select)
- Visibility state: INVISIBLE | VISIBLE — stored per-user, defaulting INVISIBLE; toggled explicitly
- Visibility is session-scoped on the frontend (resets to INVISIBLE on app close) but persisted server-side so other slices can query it
- JWT access token (short-lived, 15 min) + refresh token (httpOnly cookie or secure storage)
- No email, no password, no OAuth in Slice 1

### Data shape decisions
- User table: id, phone_hash, created_at, updated_at
- Profile table: user_id (FK), display_name, birth_date, bio, gender, looking_for, photos[]
- VisibilityState table: user_id (FK), state ENUM(invisible|visible), updated_at
- Location stored separately in Slice 2; NOT in Slice 1 schema

### Slice 3 key decisions (Signal / Approve / Decline)
- signals table is the single source of truth; NO separate matches table — state='approved' IS the match
- Declined signals: NOT retryable within a 7-day TTL window (enforced server-side via unique partial index)
- Sender NEVER learns decline status — GET /signals/outgoing returns only 'pending' and 'approved' rows; declined rows are hidden
- Visibility + proximity re-validated server-side on POST /signals (not trusted from client context)
- proximity_bucket is snapshot-captured at signal creation time for use in SignalsScreen (avoids a live location join)
- No separate matches endpoint in Slice 3; Slice 4 (Chat) will read approved signals to determine chat eligibility
- Rate limit: 20 signals per user per hour (sliding window via Redis)
- Signal state machine: pending -> approved | declined (terminal states, no reversal)
- Approved signal: sender_id and recipient_id are both notified via next GET /signals poll (no WebSocket, no push)

### Slice 4 key decisions (Chat + Report / Block)
- chat_threads: one row per approved pair; unique enforced via CHECK (user_a_id < user_b_id) + UNIQUE(user_a_id, user_b_id) using canonical ordering
- chat_messages: thread_id FK, sender_id FK, body TEXT NOT NULL, sent_at TIMESTAMPTZ; no read receipts, no pagination in MVP
- blocks: blocker_id, blocked_id, UNIQUE(blocker_id, blocked_id); one-directional
- reports: reporter_id, reported_id, reason TEXT, created_at; stored for moderation only, no auto-action in MVP
- Thread existence is gated on an approved signal between the pair AND no active block in either direction
- Block enforcement: discovery, sendSignal, getThreads, sendMessage all filter out blocked pairs server-side
- Client never receives the other user's UUID in message payloads — display_name only from profiles JOIN
- Rate limit for POST /threads/:id/messages: 30 per user per minute (express-rate-limit, keyGenerator: req.userId)
- No WebSocket/push — poll on screen focus (same pattern as SignalsScreen)
- Blocking does NOT delete prior messages in MVP (Slice 5 handles cleanup)
- thread_id is safe to expose to client; it is not a user UUID

### Slice 5 key decisions (Safety Hardening + Moderation + Release)
- Migration 006: ALTER TABLE users ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ (no default, nullable)
- Ban check inserted in authRequired middleware AFTER JWT verify: single SELECT banned_at FROM users WHERE id=$1; if non-null, return 403 ACCOUNT_BANNED
- Admin auth: separate adminRequired middleware checking Authorization: Bearer <ADMIN_SECRET env var>; NOT the user JWT; admin token is a static secret, not JWT
- Internal routes prefix: /internal (not /api/v1/internal) to make proxy-level lockdown straightforward
- moderationService.js: new file for getReports(), banUser(id), unbanUser(id)
- blockReportService: add UUID_RE validation for blocked_id/reported_id (400 not 500); add FK 23503 catch -> 404 USER_NOT_FOUND
- blockUser: after INSERT into blocks, UPDATE signals SET state='declined' WHERE state='pending' AND ((sender_id=$1 AND recipient_id=$2) OR (sender_id=$2 AND recipient_id=$1))
- Message pagination: getMessages(threadId, callerId, { before, limit }) — before is a message UUID, limit default 50 max 100; SQL: WHERE thread_id=$1 AND (before is null OR sent_at < (SELECT sent_at FROM chat_messages WHERE id=before)) ORDER BY sent_at DESC LIMIT limit; returned in ASC order to client (reverse in JS)
- Frontend polling: setInterval 5s inside useFocusEffect; clear on blur; deduplicate by message id using Set or Map
- Frontend pagination: inverted FlatList; onEndReached triggers loadOlder(before=messages[0].id)
- Health check at startup: pool.query('SELECT 1') with 5s timeout; process.exit(1) on failure; put in index.js before app.listen
- Rate limits to add: POST /blocks 10/hr, POST /reports 10/hr (same rateLimit pattern as threads.js, keyGenerator: req.userId)
- config.js: add adminSecret: required('ADMIN_SECRET') — fails startup if not set
- RUNBOOK.md at repo root: env vars, migration order, test command, how to check reports, ban a user

### Delegation order pattern
backend-builder first (auth + profile + visibility endpoints) ->
frontend-builder second (screens wired to real API) ->
qa-test-engineer ->
trust-safety-reviewer (always required for identity/visibility slices)

### V2 Epic 3 — Voice Notes in Chat
- Planned 2026-03-13. See `project_v2_epic3_voice_notes.md` for full decisions.
- No new tables; chat_messages gains voice_note_url TEXT + voice_note_duration_s INTEGER (nullable)
- Two-step upload flow: POST /threads/:id/voice-notes (multipart) then POST /threads/:id/messages
- Max 60s duration enforced server-side; rate limit 10/hr per user
- New frontend: VoiceNoteButton, VoiceNoteRecorder, VoiceNoteBubble components
- No auto-play, no waveform, no transcription in this epic

### V2 Epic 1 — Visual & Motion Upgrade
- Planned 2026-03-13. See `project_v2_epic1_visual_upgrade.md` for full decisions.
- One new dep: expo-linear-gradient. No Reanimated, no Lottie.
- Delivery order: theme.js -> shared components (Button, Card, Toast) -> AnimatedSplash -> screen polishes (HomeScreen first, then auth, then list screens, then ThreadScreen last)

### File paths (once codebase exists)
- Agent definitions: C:\Users\maor1\Desktop\ClaudeCodeTest\.claude\agents\
- Skill definition: C:\Users\maor1\Desktop\ClaudeCodeTest\.claude\skills\mvp-kickoff\SKILL.md
