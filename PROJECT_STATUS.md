# Bubble MVP — Project Status Document

> **Last updated:** 2026-04-17
> **Branch:** `feature/bubble-pivot`
> **Purpose:** Complete project state snapshot for anyone who cannot read the code directly. Update this file after every major change.

---

## What Is Bubble?

Bubble is a real-time, hyper-local mobile app built for nightlife environments. The core concept: people who are physically near each other can discover mutual interest and start a conversation — without swiping, without a feed, and without exposing precise location data. The app lives in the physical world.

**Core rules that never bend:**
- No precise GPS coordinates are ever shared between users
- No direct message can be sent without mutual consent (signal → approve → chat)
- Safety and privacy are enforced server-side, not just in the frontend
- The product is about sparking real-world interactions, not replacing them with long chats

---

## Repository Structure

```
ClaudeCodeTest/
├── backend/          — Node.js/Express API server
│   ├── src/
│   │   ├── index.js         — Entry point, route registration
│   │   ├── config.js        — Port, env validation
│   │   ├── routes/          — 12 route modules (see API section)
│   │   ├── middleware/      — Auth, error handler
│   │   ├── db/
│   │   │   ├── pool.js      — PostgreSQL connection pool (max 10)
│   │   │   ├── migrate.js   — Migration runner
│   │   │   ├── firebase.js  — Firebase Admin SDK init
│   │   │   └── migrations/  — 20 SQL migration files (001–021)
│   └── package.json
├── frontend/         — React Native / Expo mobile app
│   ├── src/
│   │   ├── navigation/      — 9 navigator files
│   │   ├── screens/         — 20 screen files
│   │   ├── components/      — 16 component files
│   │   ├── context/         — AuthContext
│   │   ├── api/             — client.js (axios)
│   │   └── theme.js         — design tokens (light/blue glassmorphism)
│   └── package.json
├── CLAUDE.md                — Agent operating instructions
└── PROJECT_STATUS.md        — This file
```

---

## Tech Stack

### Backend
| Layer | Technology |
|-------|-----------|
| Runtime | Node.js |
| Framework | Express 4.19 |
| Database | PostgreSQL (via `pg` 8.12) |
| Auth | Firebase Admin SDK 13.7 + JWT (jsonwebtoken 9.0) |
| File uploads | Multer 2.1 |
| Rate limiting | express-rate-limit 7.3 |
| IDs | UUID v4 (`uuid` 10.0) |
| Migration | Custom SQL runner (`node src/db/migrate.js`) |
| Dev server | nodemon |
| Tests | Jest + supertest |

### Frontend
| Layer | Technology |
|-------|-----------|
| Framework | Expo ~54.0.0 |
| React Native | 0.81.5 |
| Navigation | React Navigation v6 (bottom-tabs, native-stack, stack) |
| Maps | react-native-maps 1.20.1 |
| Auth | Firebase JS SDK 12.10 |
| HTTP | axios 1.6 |
| Storage | expo-secure-store (tokens), AsyncStorage |
| Location | expo-location 19.0 |
| Media | expo-av (audio), expo-image-picker (photos) |
| Animations | React Native Animated API (JS-driven) |
| Web support | react-native-web ~0.21 |

---

## Database Schema

20 applied SQL migrations create the following tables:

### Core User Tables
| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `users` | Auth identity | `id` (UUID PK), `phone_hash` (unique), `created_at` |
| `profiles` | User profile data | `user_id` (FK), `display_name`, `birth_date`, `bio` (≤140 chars), `gender`, `looking_for`, `photos` (TEXT[], max 3) |
| `visibility_states` | Current visibility mode | `user_id` (FK), `state` (invisible/visible) |
| `revoked_tokens` | JWT invalidation list | Added in migration 010 |
| `fcm_tokens` | Device push tokens | `user_id`, `token`, `platform` (android/ios/web), unique on (user_id, token) — migration 021 |

### Location & Discovery
| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `user_locations` | Latest known position | `user_id`, `lat`, `lng`, `updated_at` — Added in migration 002 |

### Signals & Chat (Direct 1:1)
| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `signals` | Connection requests | `sender_id`, `recipient_id`, `state` (pending/approved/declined), `proximity_bucket` (nearby/same_area) |
| `chat_threads` | 1:1 conversation containers | `user_a_id`, `user_b_id` — enforces `user_a_id < user_b_id` (canonical ordering), unique pair |
| `chat_messages` | Messages in a 1:1 thread | `thread_id`, `sender_id`, `body` (≤1000 chars), `sent_at` |
| `voice_note_uploads` | Audio messages in threads | Added in migration 008 |

### Bubbles (Group Events)
| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `bubbles` | A bubble event | `id`, `creator_id`, `title` (1–60 chars), `description` (≤300 chars), `category`, `lat/lng`, `radius_m` (default 200m), `duration_h` (1–8h), `expires_at`, `removed_at` (soft delete), `shape_type` (circle/polygon/rectangle), `shape_coords` (JSONB) |
| `bubble_members` | Who joined a bubble | `bubble_id`, `user_id`, `joined_at`, `left_at` — unique per (bubble, user) |
| `bubble_messages` | Group messages in a bubble | `bubble_id`, `sender_id`, `body` (≤1000 chars), `sent_at` |

### Spatial Messages (Geo-anchored Posts)
| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `spatial_messages` | Location-pinned short posts | `user_id`, `content` (≤280 chars), `lat/lng`, `visibility_type` (public/specific) |
| `spatial_message_targets` | Specific target users | `message_id`, `target_user_id` — used when `visibility_type = 'specific'` |

### Safety
| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `blocks` | Blocked user pairs | Added in migration 005 |
| `reports` | User/content reports | Added in migration 005 |
| `banned_users` | Admin bans | Added in migration 006 |

### Auth Infrastructure
| Table | Purpose |
|-------|---------|
| `schema_migrations` | Migration tracking (filename + applied_at) |
| `user_interests` | Tags/interests on profiles — migration 014 |

---

## Backend API — All Endpoints

Base URL: `http://[host]:3000/api/v1`

### Auth — `/api/v1/auth`
- Auth flow: Firebase client signs in → sends Firebase ID token to backend → backend verifies via Firebase Admin SDK → issues JWT access + refresh token pair

### Profile — `/api/v1/profile`
- Create/update/get own profile
- Photo upload (multer, magic-byte validated)
- Legacy photo URL migration endpoint under `/internal`

### Visibility — `/api/v1/visibility`
- `GET /api/v1/visibility` — get own visibility state
- `PUT /api/v1/visibility` — set state (invisible / visible)

### Location — `/api/v1/location`
- `POST /api/v1/location` — update own location (rate limited: 20 per 5 min, anti-trilateration)

### Discovery — `/api/v1/discovery`
- Get nearby users within proximity bucket (no raw coordinates returned to clients)

### Signals — `/api/v1/signals`
- `POST /api/v1/signals` — send a signal to a nearby user
- `GET /api/v1/signals` — get pending received signals
- `POST /api/v1/signals/:id/approve` — approve a signal (opens chat thread)
- `POST /api/v1/signals/:id/decline` — decline a signal

### Threads (Direct Chat) — `/api/v1/threads`
- `GET /api/v1/threads` — list own threads
- `GET /api/v1/threads/:id/messages` — paginated messages (cursor-based)
- `POST /api/v1/threads/:id/messages` — send a message
- Voice note upload on threads

### Blocks — `/api/v1/blocks`
- `POST /api/v1/blocks` — block a user
- `DELETE /api/v1/blocks/:userId` — unblock
- `GET /api/v1/blocks` — list blocked users

### Reports — `/api/v1/reports`
- `POST /api/v1/reports` — report a user or content

### Bubbles — `/api/v1/bubbles`
- `POST /api/v1/bubbles` — create a bubble (rate limited: 5 per hour)
- `GET /api/v1/bubbles/nearby` — get bubbles near current location
- `GET /api/v1/bubbles/:id` — get bubble details
- `POST /api/v1/bubbles/:id/join` — join a bubble
- `POST /api/v1/bubbles/:id/leave` — leave a bubble
- `POST /api/v1/bubbles/:id/close` — close bubble (creator only)
- `GET /api/v1/bubbles/:id/messages` — get bubble group messages
- `POST /api/v1/bubbles/:id/messages` — send message to bubble
- `POST /api/v1/bubbles/:id/remove` — admin remove bubble

### Devices — `/api/v1/devices`
- `POST /api/v1/devices/token` — register or refresh a push token (android/ios/web)
- `DELETE /api/v1/devices/token` — unregister a push token on logout

### Spatial Messages — `/api/v1/spatial-messages`
- `POST /api/v1/spatial-messages` — drop a geo-anchored message
- `GET /api/v1/spatial-messages/nearby` — get spatial messages near location

### Internal — `/internal`
- `/internal/migrate/strip-legacy-photo-urls` — one-time data cleanup

### Health
- `GET /health` → `{ status: 'ok' }`

---

## Frontend — All Screens

### Auth Screens
| Screen File | What It Does |
|------------|-------------|
| `EmailLoginScreen.js` | Email/password Firebase login entry point |

### Onboarding Stack (`OnboardingStack.js`)
Multi-step flow shown only when `profileComplete === false` after login.

| Screen File | What It Does |
|------------|-------------|
| `ProfileSetupScreen.js` | Name, birth date, bio, gender, looking-for, photo upload — first-run profile creation |

### Main Tab Navigator — 5 Tabs

#### Tab 1: Radar (`RadarStack.js`)
| Screen File | What It Does |
|------------|-------------|
| `RadarHomeScreen.js` | Live map showing nearby users as animated photo markers with bubble rings. Auto-centers on user. Animated concentric rings (JS-driven, filled circles). |

#### Tab 2: Explore (`ExploreStack.js`)
| Screen File | What It Does |
|------------|-------------|
| `ExploreScreen.js` | Browse/discover bubbles and spatial messages in the area |
| `BubbleDetailsScreen.js` | Full detail view of a single bubble — members, messages, join/leave |
| `BubbleChatScreen.js` | Group chat UI inside a bubble |
| `DropMessageScreen.js` | UI for dropping a spatial (geo-anchored) message |

#### Tab 3: Create (`CreateStack.js`)
| Screen File | What It Does |
|------------|-------------|
| `CreateTypeChooserScreen.js` | Choose what to create: Bubble or Spatial Message |
| `CreateAreaScreen.js` | Draw/define the bubble's geographic area on map (circle, polygon, rectangle) |
| `CreateVisibilityScreen.js` | Set bubble visibility settings |
| `CreateTimeAndPlaceScreen.js` | Set bubble duration and confirm location |
| `CreatePreviewScreen.js` | Preview bubble before publishing |

#### Tab 4: Inbox (`InboxStack.js`)
| Screen File | What It Does |
|------------|-------------|
| `InboxScreen.js` | List of direct chat threads (approved signals) + notification center |
| `DirectChatScreen.js` | 1:1 direct message chat UI (post signal approval) |
| `NotificationsCenterScreen.js` | Pending signals, activity notifications |

#### Tab 5: Profile (`ProfileStack.js`)
| Screen File | What It Does |
|------------|-------------|
| `ProfileHomeScreen.js` | Own profile view — display name, photos, bio, visibility toggle |
| `ProfileEditScreen.js` | Edit profile fields and photos |
| `SettingsScreen.js` | App settings, logout |
| `SafetyCenterScreen.js` | Block/report tools, safety information |
| `BlockedUsersScreen.js` | List of blocked users with unblock option |

---

## Frontend — Key Components

| Component | Purpose |
|-----------|---------|
| `BubbleMarker.js` | Map marker for a bubble location — animated rings around pin |
| `UserPhotoMarker.js` | Map marker showing a user's profile photo with animated bubble rings |
| `BubbleMapView.js` | Full map component wrapping react-native-maps (native) |
| `BubbleMapView.web.js` | Web fallback for map component |
| `BubbleAreaOverlay.js` | Renders the drawn shape (circle/polygon/rectangle) over the map |
| `BubbleAreaMarker.js` | Marker for a bubble area on map |
| `BubbleMapMarker.js` | Combined bubble map marker |
| `SpatialMessageMarker.js` | Map pin for a dropped spatial message |
| `BubblePeekCard.js` | Bottom-sheet preview card when tapping a bubble on map |
| `SignalModal.js` | Modal for sending/receiving a signal request |
| `MatchModal.js` | Modal shown on mutual approval of signals |
| `VoiceNoteRecorder.js` | Record audio in chat |
| `VoiceNotePlayer.js` | Play back audio messages |
| `VoiceNoteBubble.js` | Chat bubble UI for voice notes |
| `PhotoEditor.js` | Photo crop/edit before profile upload |
| `Toast.js` | In-app notification toasts |

---

## Navigation Architecture

```
RootNavigator
├── SplashAnimationScreen  (animated intro, auto-dismisses)
├── AuthNavigator          (shown when not logged in)
│   └── EmailLoginScreen
└── AppNavigator           (shown when logged in)
    ├── OnboardingStack    (shown when profileComplete === false)
    │   └── ProfileSetupScreen
    └── MainTabNavigator   (5 tabs, custom tab bar)
        ├── RadarStack     → RadarHomeScreen
        ├── ExploreStack   → ExploreScreen → BubbleDetailsScreen → BubbleChatScreen
        │                                 → DropMessageScreen
        ├── CreateStack    → CreateTypeChooserScreen → CreateAreaScreen
        │                    → CreateVisibilityScreen → CreateTimeAndPlaceScreen
        │                    → CreatePreviewScreen
        ├── InboxStack     → InboxScreen → DirectChatScreen
        │                             → NotificationsCenterScreen
        └── ProfileStack   → ProfileHomeScreen → ProfileEditScreen
                                              → SettingsScreen
                                              → SafetyCenterScreen → BlockedUsersScreen
```

---

## Visual Design System

**Theme:** Light white/blue glassmorphism (`frontend/src/theme.js`)
- `bgDeep` — deep background
- `bgSurface` — card/surface background
- `brand` — Bubble primary brand color (blue)
- `accent` — Accent color
- `textPrimary` / `borderDefault`

**Animations (all JS-driven, no native driver issues):**
- Splash: floating circles, wordmark fade-in with spring dot
- Map markers: concentric ring pulses around profile photos using `Animated.loop` + `Animated.sequence`
- Custom tab bar with haptic feedback

---

## Environment Variables

### Backend (`.env` file in `backend/`)
| Variable | Required | Purpose |
|----------|---------|---------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NODE_ENV` | Yes | `development` or `production` |
| `PORT` | No | Server port (default likely 3000) |
| `JWT_SECRET` | Yes | JWT signing secret |
| `FIREBASE_SERVICE_ACCOUNT` | Yes | Firebase Admin SDK credentials (JSON) |

### Frontend (`.env` file in `frontend/`)
| Variable | Purpose |
|----------|---------|
| `EXPO_PUBLIC_API_URL` | Backend base URL (e.g. `http://10.0.2.2:3000/api/v1` for Android emulator) |
| Firebase config vars | Firebase JS SDK connection (client-side) |

---

## How to Run Locally

### Backend
```bash
cd backend
npm install
# Create .env from .env.example, fill in DATABASE_URL + Firebase creds
npm run migrate       # run all pending SQL migrations
npm run dev           # nodemon hot-reload server on :3000
```

### Frontend
```bash
cd frontend
npm install
# Create .env from .env.example, set EXPO_PUBLIC_API_URL
npx expo start        # starts Metro bundler
# For Android emulator:
npm run run:android:emulator
# For physical Android device:
npm run android
```

### Health check
```
GET http://localhost:3000/health
→ { "status": "ok" }
```

---

## MVP Feature Checklist

| Feature | Status | Notes |
|---------|--------|-------|
| Email auth (Firebase) | ✅ Done | `EmailLoginScreen` + Firebase ID token → JWT |
| Phone/OTP auth | ⏸ Deferred | `otp_attempts` table exists, no active routes |
| Profile setup | ✅ Done | `ProfileSetupScreen`, `profiles` table, photo upload |
| Profile edit | ✅ Done | `ProfileEditScreen` |
| Visibility modes (Invisible/Visible) | ✅ Done | `visibility_states` table + route |
| Location update | ✅ Done | Rate-limited, no raw coords exposed |
| Nearby user discovery | ✅ Done | `discovery` route, proximity buckets |
| Signal send/receive | ✅ Done | `signals` table, pending/approved/declined |
| Signal approve/decline | ✅ Done | |
| 1:1 direct chat | ✅ Done | `chat_threads` + `chat_messages`, cursor-paginated |
| Voice notes in direct chat | ✅ Done | `voice_note_uploads` table, expo-av |
| Block user | ✅ Done | `blocks` table + route |
| Report user/content | ✅ Done | `reports` table + route |
| Admin ban | ✅ Done | `banned_users` table + admin route |
| Report bubble | ✅ Done | |
| Bubbles — create | ✅ Done | Shape support: circle/polygon/rectangle |
| Bubbles — nearby discovery | ✅ Done | |
| Bubbles — join/leave/close | ✅ Done | |
| Bubble group chat | ✅ Done | `bubble_messages` table |
| Bubble area drawing on map | ✅ Done | `BubbleAreaOverlay`, `CreateAreaScreen` |
| Spatial messages (geo-anchored posts) | ✅ Done | `spatial_messages` table, drop + nearby query |
| Map with animated user markers | ✅ Done | `RadarHomeScreen`, `UserPhotoMarker`, animated rings |
| Animated splash screen | ✅ Done | `RootNavigator` inline |
| Selfie/liveness verification gate | ❌ Not built | In MVP scope but no implementation |
| Push notifications | ✅ Done | FCM via expo-notifications; fcm_tokens table; notify on signal/DM/bubble; tap routing |
| "Circles" social graph | 🗑 Removed | Dead path acknowledged and removed — migration 019 drops CHECK constraint; frontend option removed |
| Read receipts / typing indicators | ❌ Not built | Not started |
| Liveness/selfie verification | ❌ Not built | Not started |

---

## Known Issues & Technical Debt

| Issue | Severity | Details |
|-------|---------|---------|
| No pagination on signals endpoints | ✅ Fixed | Both `/incoming` and `/outgoing` now cursor-paginated (`before` + `limit` query params, returns `next_cursor`). |
| No DELETE on bubbles | Low | Only `POST :id/close` (creator) and `POST :id/remove` (admin). Hard delete not needed for MVP. |
| No read receipts | Low | Out of MVP scope. |
| Legacy photo URL migration endpoint | Info | `/internal/migrate/strip-legacy-photo-urls` — one-time fix, can be removed after confirming all data cleaned. |

---

## Recent Git History (last 20 commits)

| Hash | Change |
|------|--------|
| `92fbc3e` | feat(frontend): push notification registration and tap handling |
| `4a3ea13` | feat(backend): wire push notifications into signals, threads, bubbles |
| `ed257b3` | feat(backend): add push notification infrastructure (migration 021, devices route, notify.js) |
| `5a5625c` | chore(db): drop unused otp_attempts table (migration 020) |
| `2e2bad2` | feat(frontend): remove 'My Circles' visibility option from DropMessageScreen |
| `e2e7143` | feat(backend): drop 'circles' visibility_type — migration 019 + route + service |
| `426d16f` | chore(backend): remove unused bcrypt dependency |
| `6aa304f` | Add production env vars to EAS build profile |
| `b588dd2` | Remove orphaned screens, dead UI components, malformed artifacts |
| `2ce9942` | Fix map markers: use filled circles + JS-driven animations |
| `ca09b75` | Fix bubble rings centering around profile photo |
| `e1c1756` | Fix full bubble ring visibility (wrapper size + solid borders) |
| `840c1c2` | Animated bubble rings around user markers + auto-center map |
| `13e8cb2` | Fix: replace BlurView with plain View to unblock launch on current APK |
| `0b9e5b7` | Full app redesign — light white/blue glassmorphism theme |
| `1e8c13d` | Fix polygon/rectangle shapes render correctly |
| `2c534d4` | Fix polygon visibility, tappable bubbles, profile photo marker, 1km boundary |
| `b48c454` | Bubble area drawing, animated map overlays, user photo markers |
| `fd43913` | Add index.js entry point, downgrade bottom-tabs to v6 |
| `694b243` | Fix location sequence 8s timeout to prevent hang |
| `d81fba4` | Complete all missing screens — 15 new files, 14 modified |
| `b1e5b96` | Fix location timeout + dark background on all navigators |
| `17bf5ed` | Complete UX restructuring — dark-first design, 5-tab nav |
| `46adf01` | Fix inline require → proper import in BubbleMapView |
| `d2e3056` | Report bubble + block/report in chat + admin moderation + block filter |
| `94fbfb3` | Navigation overhaul — remove dating screens, repurpose as Nearby Bubbles |
| `20e63dd` | Bubble pivot — map shows bubbles, create/chat screens, profile simplification |

---

## What's Next (Prioritized)

1. **Selfie/liveness verification gate** — in MVP scope, not built. Users currently have no verification step before becoming discoverable.
2. **Signals pagination** — ✅ Done. Both `/incoming` and `/outgoing` cursor-paginated.
3. **Release readiness** — EAS build profile has production vars (`6aa304f`). Need: App Store / Play Store assets, privacy policy, liveness review.
4. **Prod migration run** — migrations 019–021 are committed but not yet applied to Neon. Pre-flight: `SELECT COUNT(*) FROM spatial_messages WHERE visibility_type = 'circles';` must return 0 before running `npm run migrate` against production.

---

## Agent Routing Quick Reference

When continuing work on this project, route tasks as follows:

| Task Type | Agent |
|-----------|-------|
| Understanding codebase area before changes | `Architect` |
| Backend routes/DB/API changes | `Architect` |
| Frontend screens/navigation/UI | `Visual_Lead` |
| Map markers, animations, visual polish | `Visual_Lead` |
| Nearby discovery / presence / bubble radius logic | `Architect` |
| Safety review (privacy, consent, block/report) | run trust-safety checks |
| Mobile runtime validation after frontend changes | run mobile-runtime-smoke-tester |
| Full end-to-end browser flow validation | run chrome-e2e-tester |

---

*This file is the source of truth for project state. Update it after every major feature, fix, or architectural change.*
