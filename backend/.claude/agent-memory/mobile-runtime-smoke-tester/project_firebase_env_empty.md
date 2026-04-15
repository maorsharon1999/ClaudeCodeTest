---
name: firebase_env_empty_launch_behavior
description: Frontend .env has empty EXPO_PUBLIC_FIREBASE_* vars; this does not crash on launch but kills login at submit time
type: project
---

Observed on 2026-03-18: `frontend/.env` has:
```
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
```

The `getFirebaseAuth()` function in `frontend/src/lib/firebase.js` checks these at call time and throws `Error: Firebase is not configured. Set EXPO_PUBLIC_FIREBASE_API_KEY...` only when first invoked. Module-level evaluation does not throw. Therefore: app launches and the login screen renders, but the first real login/register submit attempt throws uncaught and the error handler in `EmailLoginScreen.js` catches it as a generic "Something went wrong" error.

**Why:** Empty vars are a valid local dev state when Firebase credentials have not been provisioned yet.

**How to apply:** When testing the login flow end-to-end (not just launch), verify that real Firebase credentials are set in frontend/.env. If missing, flag as a login-flow blocker but not a launch blocker.
