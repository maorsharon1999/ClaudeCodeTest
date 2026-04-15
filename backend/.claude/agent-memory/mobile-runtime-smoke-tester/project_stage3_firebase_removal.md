---
name: stage3_firebase_removal_smoke_test
description: Results of mobile runtime smoke test after Stage 3 frontend changes removing isFirebaseEnabled, registerEmail, loginEmail
type: project
---

Stage 3 frontend changes validated on 2026-03-18. Three symbols removed:
- `isFirebaseEnabled()` from `frontend/src/lib/firebase.js`
- `registerEmail()` from `frontend/src/api/auth.js`
- `loginEmail()` from `frontend/src/api/auth.js`

Static analysis confirmed zero remaining references to any removed symbol across the entire frontend/src tree.

`EmailLoginScreen.js` imports only `verifyFirebaseIdToken` from `../api/auth` and `signInOrRegisterWithEmail` from `../lib/firebase` — both present and correctly exported.

**Why:** These symbols were removed as part of collapsing the Firebase feature flag conditional into an always-on path.

**How to apply:** If re-running this smoke test, skip the symbol-reference grep step — it was clean. Focus on device connection, backend process freshness, and Firebase env vars.

Two blockers found at time of test:
1. No Android device connected via ADB — on-device launch could not be confirmed.
2. Backend process on 192.168.1.252:3000 is stale — `/auth/firebase/verify` returns 404 even though the route exists in source code. Process must be restarted.

One warning:
- Frontend `.env` has empty `EXPO_PUBLIC_FIREBASE_API_KEY`, `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`, `EXPO_PUBLIC_FIREBASE_PROJECT_ID`. The `getFirebaseAuth()` function throws at call time (login submit), not at module load. App will launch but login will fail immediately with an uncaught Firebase config error.
