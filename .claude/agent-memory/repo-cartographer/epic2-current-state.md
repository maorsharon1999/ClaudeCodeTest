---
name: Epic 2 Current State Map
description: Complete inventory of profile, discovery, chat infrastructure in Epic 2 — photos, intent field, discovery thumbnails, chat avatars
type: reference
---

# Epic 2 State Map (2026-03-13)

Epic 2 deliverable: Photos, intent field, discovery thumbnails, chat header avatars.

## Backend — Complete

### Config
**File:** `/c/Users/maor1/Desktop/ClaudeCodeTest/backend/src/config/index.js`
- 22 lines
- Loads from `.env`: `PORT`, `NODE_ENV`, `DATABASE_URL`, `REDIS_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `PHONE_HMAC_SECRET`, `OTP_EXPIRY_SECONDS`, `ADMIN_SECRET`, `PUBLIC_URL`
- JWT expiry: 15 min (access), 7 days (refresh)
- All required env vars enforced with `required()` helper

### Profile Service
**File:** `/c/Users/maor1/Desktop/ClaudeCodeTest/backend/src/services/profileService.js`
- 150 lines
- Schema: `user_id`, `display_name` (1–40 chars), `birth_date` (age ≥ 18), `bio` (0–140 chars), `gender`, `looking_for`, `intent`, `photos` (JSON array, max 3), `updated_at`
- `VALID_GENDERS = ['man', 'woman', 'nonbinary', 'other']`
- `VALID_LOOKING_FOR = ['men', 'women', 'everyone', 'nonbinary']`
- `VALID_INTENTS = ['casual', 'serious', 'open']`
- Functions:
  - `getProfile(userId)` → profile object or null
  - `upsertProfile(userId, body)` → validates and inserts/updates; returns profile with photos array
  - `addPhoto(userId, url)` → locks row, checks MAX_PHOTOS (3), appends URL to photos array
  - `removePhoto(userId, index)` → removes by index, validates index bounds
- All validation errors include `.status` and `.code` (e.g., `VALIDATION_ERROR`, `PHOTOS_LIMIT`, `PROFILE_NOT_FOUND`)

### Profile Routes
**File:** `/c/Users/maor1/Desktop/ClaudeCodeTest/backend/src/routes/profile.js`
- 74 lines
- All routes require `authRequired` middleware
- `GET /profile/me` → returns profile or 404
- `PUT /profile/me` → upsert profile
- `POST /profile/me/photos/upload` (multipart) → validates JPEG/PNG, constructs public URL, calls `addPhoto()`
- `POST /profile/me/photos` (JSON) → accepts URL directly, calls `addPhoto()`
- `DELETE /profile/me/photos/:index` → removes photo by index
- Multer config: 5 MB file limit, stores to `uploads/` directory

### Main Server
**File:** `/c/Users/maor1/Desktop/ClaudeCodeTest/backend/src/index.js`
- 70 lines
- Mounts routes at `/api/v1/*` (auth, profile, visibility, location, discovery, signals, threads, blocks, reports)
- Internal routes at `/internal`
- Serves static uploads at `/uploads`
- Health check at `/health`
- DB health check on startup (5s timeout, exits if fails)
- Global error handler via middleware

### Migrations
**Directory:** `/c/Users/maor1/Desktop/ClaudeCodeTest/backend/src/db/migrations/`
- `001_init.sql` — users, auth, profiles table with photos JSON array
- `002_locations.sql`
- `003_signals.sql`
- `004_chat.sql`
- `005_blocks_reports.sql`
- `006_ban.sql`
- `007_profile_upgrade.sql` — **Epic 2 specific**, adds intent column to profiles

### Tests
**File:** `/c/Users/maor1/Desktop/ClaudeCodeTest/backend/src/__tests__/profile.test.js`
- 234 lines
- Jest with mocked pool and Redis
- Test user ID: `aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee`
- Coverage:
  - `GET /profile/me`: auth required, 404 if no profile, returns profile if exists, no phone/phone_hash in response
  - `PUT /profile/me`: rejects under 18, bio > 140 chars, missing display_name or birth_date, accepts valid intent
  - `POST /profile/me/photos`: rejects when 3 photos exist (PHOTOS_LIMIT), rejects invalid URL
  - `POST /profile/me/photos/upload`: rejects missing file, rejects non-JPEG/PNG

---

## Frontend — Complete

### App Config
**File:** `/c/Users/maor1/Desktop/ClaudeCodeTest/frontend/app.json`
- 42 lines
- Expo config, version 1.0.0
- iOS bundle ID: `com.bubble.mvp`, Android package: `com.bubble.mvp`
- Plugins: `expo-secure-store`, `expo-location` (with permission text)
- Splash/icon colors: `#6C47FF` (purple)
- Photo library usage description configured

### API Layer
**File:** `/c/Users/maor1/Desktop/ClaudeCodeTest/frontend/src/api/profile.js`
- 36 lines
- Client is imported from `./client`
- Exports:
  - `getProfile()` → GET `/profile/me`
  - `updateProfile(data)` → PUT `/profile/me`
  - `getVisibility()` → GET `/visibility/me`
  - `setVisibility(state)` → PUT `/visibility/me`
  - `uploadPhoto(fileUri, mimeType)` → POST `/profile/me/photos/upload` (FormData)
  - `deletePhoto(index)` → DELETE `/profile/me/photos/{index}`

### Profile Setup Screen
**File:** `/c/Users/maor1/Desktop/ClaudeCodeTest/frontend/src/screens/ProfileSetupScreen.js`
- 489 lines
- Shared `ProfileForm` component and dedicated screen wrapper
- Form state:
  - `displayName` (string, 1–40 chars)
  - `birthDate` (date, validated ≥ 18)
  - `bio` (optional, 0–140 chars)
  - `gender` (optional, radio chips)
  - `lookingFor` (optional, radio chips)
  - `intent` (optional, radio chips: 'casual', 'serious', 'open')
  - `photos` (passed to `PhotoEditor` component)
  - `errors` (inline validation state)
- Web date picker (month/day/year selects) + native DateTimePicker fallback
- Entrance animation (fade + slide up)
- Error display + save error handling
- On success: calls `markProfileComplete()` from `AuthContext`
- Disabled submit if name/birth empty or under 18

### PhotoEditor Component
**File:** `/c/Users/maor1/Desktop/ClaudeCodeTest/frontend/src/components/PhotoEditor.js`
- Imported by ProfileSetupScreen
- Props: `photos` (array), `onPhotosChange` (callback)
- Functionality: add/remove photos (max 3)

### Discovery Screen
**File:** `/c/Users/maor1/Desktop/ClaudeCodeTest/frontend/src/screens/DiscoveryScreen.js`
- 287 lines
- Location permission check + request on mount
- Fetches nearby users via `getNearbyUsers()` API
- Updates location every 60s via timer
- Displays user cards with:
  - Thumbnail photo (or fallback initial letter)
  - Display name + age
  - Proximity badge ("Nearby" or "Same area")
  - Bio (max 2 lines)
  - Signal button (disabled after send)
- Outgoing signals tracked in state to prevent re-sends
- Pull-to-refresh support
- Empty state: "No one nearby right now"
- Error state with retry
- Entrance animation

### Chats Screen
**File:** `/c/Users/maor1/Desktop/ClaudeCodeTest/frontend/src/screens/ChatsScreen.js`
- 154 lines
- Loads threads via `getThreads()` on focus
- Thread list: avatar (or fallback), name + age, last message preview (60 chars), relative time
- Navigates to `Thread` screen with threadId, displayName, otherUserId, otherUserPhoto
- Empty state: "No conversations yet. Approve a signal to start chatting."
- Entrance animation
- Relative time helper: "just now", "Xm ago", "Xh ago"

### Thread Screen
**File:** `/c/Users/maor1/Desktop/ClaudeCodeTest/frontend/src/screens/ThreadScreen.js`
- 341 lines
- Receives route params: threadId, displayName, otherUserId, otherUserPhoto
- Loads messages on focus + polls for new ones every 5s
- Header: other user's avatar (or fallback) + display name
- Message list: bubbles with timestamps, optimistic send (temp ID replaced on success)
- Input bar with send button (disabled if empty)
- Pagination: loads older messages on scroll to top
- Keyboard height tracking (iOS/Android support)
- Actions menu (⋯): Block, Report
- Block action: confirms, calls `blockUser()`, navigates back
- Report action: submits reason, shows toast
- Toast notifications for errors
- Entrance animation
- Keyboard offset applied correctly

### Toast Component
**File:** `/c/Users/maor1/Desktop/ClaudeCodeTest/frontend/src/components/Toast.js`
- Imported by DiscoveryScreen, ThreadScreen
- Props: `message`, `visible`

### Discovery API
**File:** Not fully read, but called by DiscoveryScreen**
- `updateLocation(lat, lon)` → updates user location
- `getNearbyUsers()` → returns array with at least `user_id`, `display_name`, `age`, `photos`, `bio`, `proximity_bucket`
- `getOutgoingSignals()` → returns array of signals with `recipient.user_id`

### Chat API
**File:** Not fully read, but called by ChatsScreen/ThreadScreen**
- `getThreads()` → returns array with `thread_id`, `other_user`, `last_message`
- `getMessages(threadId, options)` → returns `{ messages, has_more }`, messages include `id`, `body`, `sent_at`, `is_mine`
- `sendMessage(threadId, text)` → sends message, returns sent message object
- `blockUser(userId)` → blocks user
- `reportUser(userId, reason)` → reports user

### Signals API
**File:** Not fully read, but called by DiscoveryScreen**
- `sendSignal(userId)` → sends signal to user

---

## Directory Structure Summary

```
backend/src/
├── config/index.js ✓
├── services/profileService.js ✓
├── routes/profile.js ✓
├── routes/discovery.js (referenced, not read)
├── routes/signals.js (referenced, not read)
├── routes/threads.js (referenced, not read)
├── routes/blocks.js (referenced, not read)
├── routes/reports.js (referenced, not read)
├── routes/auth.js (referenced, not read)
├── routes/visibility.js (referenced, not read)
├── routes/location.js (referenced, not read)
├── routes/internal.js (referenced, not read)
├── middleware/auth.js (referenced, not read)
├── middleware/errorHandler.js (referenced, not read)
├── db/pool.js (referenced, not read)
├── db/redis.js (referenced, not read)
├── db/migrations/
│   ├── 001_init.sql ✓
│   ├── 002_locations.sql ✓
│   ├── 003_signals.sql ✓
│   ├── 004_chat.sql ✓
│   ├── 005_blocks_reports.sql ✓
│   ├── 006_ban.sql ✓
│   └── 007_profile_upgrade.sql ✓ (Epic 2 specific)
└── __tests__/profile.test.js ✓

frontend/src/
├── api/profile.js ✓
├── api/discovery.js (referenced, not fully read)
├── api/signals.js (referenced, not fully read)
├── api/chat.js (referenced, not fully read)
├── api/client.js (referenced, not read)
├── screens/ProfileSetupScreen.js ✓
├── screens/DiscoveryScreen.js ✓
├── screens/ChatsScreen.js ✓
├── screens/ThreadScreen.js ✓
├── components/PhotoEditor.js ✓ (exists)
├── components/Toast.js ✓ (exists)
├── context/AuthContext.js (referenced, not read)
└── theme.js (referenced, not read)

frontend/app.json ✓
```

---

## Epic 2 Status

### Deliverables
1. **Photos support**: ✓ Backend (max 3, add/remove), Frontend (PhotoEditor component), API (upload/delete endpoints)
2. **Intent field**: ✓ Backend (validated against ['casual', 'serious', 'open']), Frontend (radio chip UI in ProfileSetupScreen), Schema (migration 007)
3. **Discovery thumbnails**: ✓ Frontend displays first photo in nearby user cards, fallback to initial letter
4. **Chat header avatars**: ✓ ThreadScreen displays other user's first photo in header, fallback to placeholder

### Implementation Checkmarks
- Profile schema extended with photos array and intent field
- Profile API endpoints for photo management
- Frontend form with photo editor and intent selection
- Discovery screen shows user photos and proximity
- Chat thread screen shows user avatar in header
- Tests cover photo limits, intent validation, privacy (no phone in response)
- Config supports file uploads via PUBLIC_URL
- Entrance animations on all Epic 2 screens

### Known Gaps (Not Blocking Epic 2)
- Exact implementation details of PhotoEditor component (exists but full read not captured)
- Discovery/Signals/Chat API implementation files (referenced but not read)
- AuthContext implementation
- Theme color/shadow definitions
