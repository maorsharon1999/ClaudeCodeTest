---
name: Complete Repository Map
description: Full mapping of Bubble MVP codebase — backend, frontend, database schema, entry points, patterns
type: reference
---

# Bubble MVP — Complete Repository Map

**Last Updated:** 2026-03-20
**Current Branch:** feature/firebase-migration
**Status:** Firebase auth migration complete; ready for next vertical slice

---

## Repository Type and Stack

- **Type:** Full-stack Node.js + React Native mobile app (Expo)
- **Backend:** Express.js + PostgreSQL + Firebase Admin SDK
- **Frontend:** React Native (Expo) + React Navigation + Firebase SDK
- **Auth:** Firebase Authentication (email + password) + JWT (backend tokens)
- **Storage:** Firebase Storage (images), PostgreSQL (user data, messages, presence)
- **Package Manager:** npm (both backend and frontend)

---

## Key Folders Structure

```
C:\Users\maor1\Desktop\ClaudeCodeTest\
├── .claude/
│   ├── agents/              # 8 agent definitions (specialist workers)
│   ├── skills/mvp-kickoff/  # Orchestration workflow
│   └── agent-memory/        # Persistent memory system
├── backend/
│   ├── src/
│   │   ├── index.js                 # Express app entry point (port 3000)
│   │   ├── config/index.js          # Environment config loader
│   │   ├── routes/                  # 9 route modules (auth, profile, discovery, etc.)
│   │   ├── services/                # 8 service modules (business logic)
│   │   ├── middleware/              # Auth, admin auth, error handler
│   │   ├── db/                      # Pool, Firebase SDK, migration runner
│   │   ├── utils/errors.js          # Error definitions
│   │   └── __tests__/               # 6 test files (Jest)
│   ├── package.json                 # Backend deps (bcrypt, pg, firebase-admin)
│   ├── .env                         # Environment vars (gitignored)
│   ├── firebase-service-account.json # GCP service account (gitignored)
│   └── uploads/                     # Legacy upload storage (deprecated, use Firebase)
├── frontend/
│   ├── src/
│   │   ├── api/                     # 6 API client modules (auth, profile, chat, etc.)
│   │   ├── screens/                 # 11 screen components (auth, discovery, chat, etc.)
│   │   ├── components/              # 7 reusable components (map, voice, photo editor)
│   │   ├── navigation/RootNavigator.js # Stack navigation config
│   │   ├── context/AuthContext.js   # Global auth + token management
│   │   ├── lib/                     # Utilities (firebase.js, photoUrl.js)
│   │   └── theme.js                 # Design tokens (colors, spacing)
│   ├── app.json                     # Expo config (permissions, Firebase setup)
│   ├── package.json                 # Frontend deps (expo, react-native, firebase)
│   ├── android/                     # Native Android build artifacts
│   └── eas.json                     # Expo Application Services config
└── CLAUDE.md                        # Project operating instructions
```

---

## Backend Architecture

### Entry Point
- **File:** `/c/Users/maor1/Desktop/ClaudeCodeTest/backend/src/index.js`
- **Port:** 3000 (configurable via `PORT` env var)
- **Flow:** Loads config → sets up CORS + JSON parser → registers 9 route modules → error handler → starts with DB health check
- **Health Check:** `GET /health` (200 JSON response)

### Routes (9 modules, all under `/api/v1/{route}`)
| Route | File | Key Endpoints |
|-------|------|---------------|
| **auth** | `/routes/auth.js` | POST /register, /login, /refresh, /logout, /delete-account |
| **profile** | `/routes/profile.js` | GET /me, POST /me, GET /:userId |
| **visibility** | `/routes/visibility.js` | GET /state, PUT /state |
| **location** | `/routes/location.js` | POST /update, GET /nearby (discovery) |
| **discovery** | `/routes/discovery.js` | GET /candidates (with bubble filtering) |
| **signals** | `/routes/signals.js` | POST /send, GET /inbox, PUT /:signalId/approve\|decline |
| **threads** | `/routes/threads.js` | GET /, POST /create, GET /:threadId/messages, POST /:threadId/messages |
| **blocks** | `/routes/blocks.js` | POST /block/:userId, GET /, DELETE /:userId |
| **reports** | `/routes/reports.js` | POST / (report user or message) |
| **internal** | `/routes/internal.js` | Admin routes (ban user, moderate content, etc.) |

### Services (8 modules — business logic)
| Service | File | Responsibility |
|---------|------|-----------------|
| **authService** | `/services/authService.js` | Firebase UID linking, JWT generation, token refresh, user creation |
| **profileService** | `/services/profileService.js` | Profile CRUD, photo sanitization (legacy URL stripping) |
| **visibilityService** | `/services/visibilityService.js` | Visibility state (invisible/browsing/available) management |
| **locationService** | `/services/locationService.js` | Location updates, nearby filtering, proximity queries |
| **signalService** | `/services/signalService.js` | Signal send/approve/decline, presence state transitions |
| **chatService** | `/services/chatService.js` | Chat thread creation, message persistence, read receipts |
| **blockReportService** | `/services/blockReportService.js` | Block list management, report submission |
| **moderationService** | `/services/moderationService.js` | User bans, content moderation, admin actions |

### Middleware (3 modules)
| Middleware | File | Purpose |
|-----------|------|---------|
| **auth** | `/middleware/auth.js` | JWT verification from Bearer token, attaches user_id to req.user |
| **adminAuth** | `/middleware/adminAuth.js` | Admin secret verification for internal routes |
| **errorHandler** | `/middleware/errorHandler.js` | Global error formatting (JSON, status codes, logging) |

### Database

#### Config
- **Connection:** PostgreSQL via `pg` library
- **Pool Config:** 10 max connections, 30s idle timeout, 2s connection timeout
- **File:** `/db/pool.js`
- **Migration Runner:** `/db/migrate.js` (reads `.sql` files from `migrations/` dir, tracks applied migrations)

#### Migrations (12 files, cumulative schema build)
| File | Added |
|------|-------|
| **001_init.sql** | `users`, `profiles`, `visibility_states`, `otp_attempts` tables |
| **002_locations.sql** | `locations`, `location_history` tables + geo indexes |
| **003_signals.sql** | `signals` table (signal requests & responses) |
| **004_chat.sql** | `chat_threads`, `chat_messages` tables |
| **005_blocks_reports.sql** | `blocks`, `reports` tables |
| **006_ban.sql** | `user_bans` table |
| **007_profile_upgrade.sql** | Added `intent` column to `profiles` (casual/serious/open) |
| **008_voice_notes.sql** | Voice note columns in `chat_messages` |
| **009_firebase_uid.sql** | Added `firebase_uid` column to `users` for Firebase linking |
| **010_revoked_tokens.sql** | `revoked_tokens` table (JWT revocation) |
| **011_email_auth.sql** | Email-based auth columns (replaces phone OTP) |
| **012_deprecate_password_auth.sql** | Removed legacy password auth, Firebase-only |

#### Core Tables (simplified schema snapshot)
```sql
users (id, firebase_uid, email, created_at, updated_at)
profiles (user_id, display_name, birth_date, bio, gender, looking_for, intent, photos[], updated_at)
visibility_states (user_id, state: 'invisible'|'browsing'|'available', updated_at)
locations (user_id, latitude, longitude, updated_at)
signals (id, from_user_id, to_user_id, status: 'pending'|'approved'|'declined', created_at)
chat_threads (id, user_1_id, user_2_id, created_at)
chat_messages (id, thread_id, sender_id, text, voice_url, created_at)
blocks (id, blocker_id, blocked_id, created_at)
reports (id, reporter_id, target_user_id|message_id, reason, created_at)
user_bans (id, user_id, reason, expires_at)
```

### Firebase Admin SDK
- **File:** `/db/firebase.js`
- **Lazy Initialization:** Loads on first use
- **Env Vars:**
  - `FIREBASE_PROJECT_ID` (required)
  - `FIREBASE_SERVICE_ACCOUNT` (optional; file path or JSON string, falls back to Application Default Credentials)
- **Used For:** Token verification, user lifecycle management (soft delete, ban enforcement)

### Environment Variables (Backend)
```bash
DATABASE_URL=postgresql://user:pass@host/db
JWT_ACCESS_SECRET=secret
JWT_REFRESH_SECRET=secret
ADMIN_SECRET=secret
PORT=3000
NODE_ENV=development
FIREBASE_PROJECT_ID=bubble-mvp-prod
FIREBASE_SERVICE_ACCOUNT=/path/to/service-account.json
FIREBASE_STORAGE_BUCKET=bubble-mvp-prod.appspot.com
PUBLIC_URL=http://localhost:3000
```

### Key Backend Patterns
- **Error Handling:** Custom error class hierarchy in `/utils/errors.js`; global handler wraps as `{ error: { code, message } }`
- **Auth:** JWT (access + refresh tokens), refresh token stored in DB for revocation
- **Validation:** Input validation in route handlers before passing to services
- **Tests:** Jest tests in `__tests__/` (auth, profile, visibility, signals, chat, location)
- **Rate Limiting:** `express-rate-limit` imported but not yet wired to all routes

---

## Frontend Architecture

### Entry Point & Navigation
- **File:** `/src/navigation/RootNavigator.js`
- **Flow:**
  1. App starts → `AuthContext` checks for stored refresh token (silent login)
  2. If authenticated: `AppNavigator` (stacked screens: Home, ProfileEdit, Discovery, Signals, Chats, Thread, Settings, BlockedUsers)
  3. If not authenticated: `AuthNavigator` (single screen: EmailLogin)
  4. Splash animation plays during token verification (0–1600 ms)

### Screens (11 components)
| Screen | File | Purpose |
|--------|------|---------|
| **EmailLoginScreen** | `/screens/EmailLoginScreen.js` | Email + password entry, Firebase sign-in |
| **ProfileSetupScreen** | `/screens/ProfileSetupScreen.js` | On-boarding: name, DOB, gender, looking_for, photos, bio, intent |
| **HomeScreen** | `/screens/HomeScreen.js` | Main tab hub: visibility toggle, discovery entry, signals inbox, chats |
| **ProfileEditScreen** | `/screens/ProfileEditScreen.js` | Update profile fields + photos |
| **DiscoveryScreen** | `/screens/DiscoveryScreen.js` | Map-based or list-based nearby candidates, signal send |
| **SignalsScreen** | `/screens/SignalsScreen.js` | Incoming signals inbox, approve/decline UI |
| **ChatsScreen** | `/screens/ChatsScreen.js` | List of active chat threads |
| **ThreadScreen** | `/screens/ThreadScreen.js` | 1:1 chat, message send/receive, voice notes |
| **SettingsScreen** | `/screens/SettingsScreen.js` | Account, privacy, blocked users, delete account, logout |
| **BlockedUsersScreen** | `/screens/BlockedUsersScreen.js` | Blocked list, unblock action |
| _(Splash Animation)_ | `/navigation/RootNavigator.js` | Branded intro animation (wordmark + floating circles) |

### Components (7 reusable modules)
| Component | File | Purpose |
|-----------|------|---------|
| **BubbleMapView** | `/components/BubbleMapView.js` | Native map (iOS/Android with react-native-maps) |
| **BubbleMapView.web** | `/components/BubbleMapView.web.js` | Web fallback map (Expo web) |
| **BubbleMarker** | `/components/BubbleMarker.js` | Custom marker icon on map |
| **MapBubble** | `/components/MapBubble.js` | Candidate card overlay on map |
| **PhotoEditor** | `/components/PhotoEditor.js` | Camera/gallery picker, photo crop/resize |
| **VoiceNoteRecorder** | `/components/VoiceNoteRecorder.js` | Audio record UI (expo-av) |
| **VoiceNoteBubble** | `/components/VoiceNoteBubble.js` | Voice message playback bubble |
| **Toast** | `/components/Toast.js` | Toast notifications (errors, success) |

### API Client (6 modules)
| Module | File | Key Functions |
|--------|------|----------------|
| **client** | `/api/client.js` | Axios instance + interceptors (Bearer token, 401 refresh retry logic) |
| **auth** | `/api/auth.js` | POST /register, /login; GET /refresh; DELETE /logout |
| **profile** | `/api/profile.js` | GET /me, PUT /me, GET /:userId |
| **discovery** | `/api/discovery.js` | GET /candidates (bubble filtering) |
| **signals** | `/api/signals.js` | POST /send, GET /inbox, PUT /:id/approve\|decline |
| **chat** | `/api/chat.js` | GET /threads, POST /threads, GET /:id/messages, POST /:id/messages |

### Authentication & State Management
- **AuthContext File:** `/context/AuthContext.js`
- **State:** `authState` (null=loading, false=logged out, true=logged in), `profileComplete`, `accessToken`, `refreshToken`
- **Persistence:** Secure storage (iOS Keychain, Android Keystore via `expo-secure-store`; fallback to localStorage on web)
- **Flow:**
  1. Mount → try silent refresh from stored token
  2. If refresh succeeds → restore `profileComplete` from local storage, set `authState=true`
  3. If refresh fails (401 or network) → set `authState=false`, clear tokens
  4. Axios interceptors auto-attach Bearer token and retry 401 with new token

### Theme & Styling
- **File:** `/theme.js`
- **Exports:** Color palette, spacing, typography scales
- **Primary Color:** `#6C47FF` (brand purple)

### Environment Variables (Frontend)
```bash
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000/api/v1  # For Android device
# Falls back to http://localhost:3000/api/v1 for Metro web dev
```

### App Config (Expo)
- **File:** `app.json`
- **Permissions:**
  - iOS: Photo library, microphone
  - Android: Audio recording, fine + coarse location
- **Plugins:** expo-splash-screen, expo-secure-store, expo-location
- **Firebase:** Configured in Firebase Console; linked via `firebase` npm package

### Key Frontend Patterns
- **Navigation:** React Navigation stack + modal support
- **Auth Flow:** Global context + interceptor re-auth on 401
- **Location:** `expo-location` for permission + GPS access
- **Maps:** `react-native-maps` (native) + Expo web fallback
- **Image Handling:** `expo-image-picker` for camera/gallery
- **Audio:** `expo-av` for voice note recording + playback
- **Storage:** `expo-secure-store` for tokens; localStorage fallback on web
- **Testing:** Not yet implemented for frontend; chrome-e2e-tester can validate flows in Expo web

---

## Database Schema Details

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firebase_uid TEXT UNIQUE,           -- Linked to Firebase Auth
  email TEXT UNIQUE,                  -- Email (after migration)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Profiles Table
```sql
CREATE TABLE profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  birth_date DATE NOT NULL,
  bio TEXT CHECK (char_length(bio) <= 140),
  gender TEXT CHECK (gender IN ('man','woman','nonbinary','other')),
  looking_for TEXT CHECK (looking_for IN ('men','women','everyone','nonbinary')),
  intent TEXT CHECK (intent IN ('casual', 'serious', 'open')),
  photos TEXT[] CHECK (array_length(photos, 1) <= 3),  -- Firebase Storage URLs
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Visibility States Table
```sql
CREATE TABLE visibility_states (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  state TEXT NOT NULL DEFAULT 'invisible' CHECK (state IN ('invisible','browsing','available')),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Locations Table
```sql
CREATE TABLE locations (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  latitude NUMERIC(10, 8) NOT NULL,
  longitude NUMERIC(11, 8) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_locations_geo ON locations USING gist(ll_to_earth(latitude, longitude));
```

### Signals Table
```sql
CREATE TABLE signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined', 'withdrawn')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ
);
```

### Chat Threads & Messages
```sql
CREATE TABLE chat_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_1_id UUID NOT NULL REFERENCES users(id),
  user_2_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES chat_threads(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text TEXT,
  voice_url TEXT,  -- Firebase Storage URL for voice notes
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Blocks & Reports
```sql
CREATE TABLE blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reported_message_id UUID REFERENCES chat_messages(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## NPM Scripts & Commands

### Backend
```bash
npm install                # Install dependencies
npm run dev               # Start with nodemon (hot reload)
npm start                # Start production
npm run migrate          # Run pending migrations
npm test                 # Run Jest tests (--forceExit, --detectOpenHandles)
```

### Frontend
```bash
npm install              # Install dependencies
npm start               # Start Expo Metro (defaults to web)
npm run android         # Build + run on Android device/emulator
npm run android:device  # Run on connected device with EXPO_PUBLIC_API_URL set
npm run android:emulator # Run on emulator (auto API URL = http://10.0.2.2:3000)
npm run ios            # Build + run on iOS simulator
npm run web            # Explicit web start
```

---

## Current Implementation Status

### Slice 1: Auth + Profile + Visibility (Complete)
- Firebase email + password auth
- Profile setup (on-boarding)
- Visibility states (invisible/browsing/available)
- JWT token refresh flow
- Profile edit
- Account deletion

### Slice 2: Nearby Discovery (Partial)
- Location update endpoint
- Nearby candidates query (without full bubble ranking)
- Discovery screen UI shell
- Map integration (native + web)

### Slice 3: Signals (Partial)
- Signal send/approve/decline endpoints
- Signals inbox screen
- Backend signal service
- No presence anti-jitter yet

### Slice 4: Chat (Partial)
- Thread creation (after signal approval)
- Message CRUD endpoints
- Voice note support (backend columns, UI not complete)
- Chat screen shell

### Slice 5: Block / Report (Partial)
- Block user endpoints
- Report user/message endpoints
- Blocked users screen
- No moderation dashboard

### Slice 6: Admin & Safety (Stubbed)
- Internal routes for admin actions
- Moderation service (ban user, etc.)
- No admin dashboard UI
- No automated content moderation

### Not Yet Implemented
- Liveness verification gate (selfie liveness check before availability)
- Presence anti-jitter (prevent flicker in discovery)
- Bubble relevance ranking beyond proximity
- Analytics instrumentation
- Moderation dashboard
- Advanced safety features (abuse detection, fake accounts)

---

## Testing Coverage

### Backend Tests (6 files in `__tests__/`)
- `auth.test.js` — Auth endpoints (register, login, refresh, logout)
- `profile.test.js` — Profile CRUD, photo sanitization
- `visibility.test.js` — Visibility state transitions
- `location.test.js` — Location updates, nearby filtering
- `signals.test.js` — Signal send/approve/decline
- `chat.test.js` — Thread creation, messaging

### Frontend Tests
- None implemented yet
- Chrome E2E tester can validate flows in Expo web
- Mobile smoke tester required for device validation

---

## Existing Patterns to Reuse

### Backend
- **Error Handling:** Custom error classes → global handler → JSON response
- **Service + Route Separation:** Routes validate input; services handle business logic
- **Middleware Chain:** Auth → handler → error catcher
- **JWT + Refresh:** Access token (15 min) + refresh token (7 days) + revocation table
- **Firebase Integration:** Lazy-loaded Admin SDK, environment-agnostic

### Frontend
- **Context + Hooks:** AuthContext for global state, useAuth() hook for access
- **Axios Interceptors:** Auto-attach Bearer token, 401 retry with new token
- **React Navigation:** Stack + modal for screen flow
- **Secure Storage:** Platform-agnostic wrapper (Keychain/Keystore/localStorage)
- **Responsive Components:** Separate web/native implementations (BubbleMapView.js vs .web.js)

---

## Risks & Blockers

### Known Issues (Firebase Migration)
- Android users on old app version (SDK 50) upgrading to new version (SDK 54) will lose stored refresh token due to `expo-secure-store` key format change → forced re-login
- Legacy localhost photo URLs are stripped (set to null) to avoid serving from old backend
- Voice note feature partially implemented (backend columns exist, UI incomplete)

### Not Yet Addressed
- No automated tests for frontend (no Jest setup, no snapshot tests)
- No E2E test harness (chrome-e2e-tester agent available but not yet run)
- No mobile runtime validation (mobile-runtime-smoke-tester available but not yet run)
- No liveness check (selfie verification gate missing)
- Geo-proximity queries may not scale well at high user density (no clustering, no tile-based fetching)
- No message encryption (sensitive data in plain text)
- No two-factor auth
- No analytics instrumentation yet

---

## Files Touched by Current Feature Branch

**Current Branch:** `feature/firebase-migration`

### Modified Files
- `.claude/CLAUDE.md` — Updated operating instructions
- `backend/.dockerignore`, `.gitignore` — Docker + build config
- `backend/src/db/firebase.js` — Firebase Admin SDK initialization
- `backend/src/routes/internal.js` — Updated for Firebase
- `backend/src/services/profileService.js` — Photo URL sanitization
- `backend/src/db/migrations/012_deprecate_password_auth.sql` — Email-only auth
- `frontend/app.json` — Expo config updates
- `frontend/package-lock.json` — Dependency updates
- `frontend/src/components/BubbleMapView.js` — Map fixes
- `frontend/src/lib/firebase.js` — Firebase SDK config
- `frontend/src/screens/ProfileSetupScreen.js` — Email-based auth UI

### New Files
- `backend/deploy.sh` — Deployment script
- `backend/uploads/...` — Temporary upload artifacts

### Deleted Files
- `backend/src/db/redis.js` — Redis session store (replaced with PostgreSQL tokens table)
- `backend/src/db/seed_dev.sql` — Development seed data (now using migrations)

---

## Next Steps for Implementation

1. **Run repo-cartographer** (done) → understand structure ✓
2. **Call product-architect** → define next vertical slice scope (e.g., liveness check, bubble ranking)
3. **Call frontend-builder** → implement screen updates
4. **Call backend-builder** → implement backend endpoints + services
5. **Call matching-presence-engineer** (if needed) → optimize discovery + presence logic
6. **Call qa-test-engineer** → write + run tests for the slice
7. **Call trust-safety-reviewer** → privacy + safety sign-off
8. **Call release-auditor** → cross-slice consistency + blockers
9. **Call chrome-e2e-tester** → validate full user flow in Expo web
10. **Call mobile-runtime-smoke-tester** → validate on device

---

## Key Contacts & Resources

- **Repo Root:** `/c/Users/maor1/Desktop/ClaudeCodeTest`
- **Backend Root:** `/c/Users/maor1/Desktop/ClaudeCodeTest/backend`
- **Frontend Root:** `/c/Users/maor1/Desktop/ClaudeCodeTest/frontend`
- **Migrations:** `/c/Users/maor1/Desktop/ClaudeCodeTest/backend/src/db/migrations/`
- **Env Files:** `.env` (local backend), `.env.local` (frontend — via app.json extra.env)
- **Firebase Console:** https://console.firebase.google.com/ (project: bubble-mvp-prod)
- **GCP Console:** https://console.cloud.google.com/ (project: bubble-mvp-prod)
