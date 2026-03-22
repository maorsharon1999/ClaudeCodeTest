---
name: Bubble runtime context
description: Key runtime facts about the Bubble MVP Android dev build — entry point, device, env, known issues
type: project
---

Device under test: Samsung Galaxy S25+ (SM-S936B), Android 16, serial R5CY73ZZ65J.
App package: com.bubble.mvp (expo dev-client build, not Expo Go).
Expo SDK: ~54.0.0, React Native 0.81.5, expo-dev-client ~6.0.20.
Metro runs on port 8081. Backend runs on port 3000.

Entry point: App.js, loaded via node_modules/expo/AppEntry.js (defined in package.json "main").
Metro must be started with `npx expo start --dev-client` or `npx expo start`, NOT with `--web`.
Without the correct mode, Metro returns a 404/UnableToResolveError for /index.bundle on the device.

API URL configuration:
- frontend/.env sets EXPO_PUBLIC_API_URL=http://192.168.1.252:3000/api/v1
- On a physical device, localhost resolves to the phone itself, not the dev machine.
- ADB reverse tcp:3000 tcp:3000 is required to make localhost:3000 work on the device.
- ADB reverse tcp:8081 tcp:8081 is ALSO required for the Metro WebSocket (hot reload/dev overlay).
- Both must be set before smoke testing. Run: `adb reverse tcp:3000 tcp:3000 && adb reverse tcp:8081 tcp:8081`

Firebase JS SDK Metro resolution — RESOLVED (2026-03-18):
- firebase v12.10.0 is installed in node_modules.
- The package uses a package.json exports map for firebase/app and firebase/auth.
- The ./app exports entry has no "react-native" condition — only node, browser, default.
- Metro 0.83 (Expo SDK 54) with Expo CLI enables unstable_enablePackageExports=true by default.
- FIX APPLIED: frontend/metro.config.js was created with resolver.resolveRequest that maps
  firebase/app -> node_modules/firebase/app/dist/index.cjs.js
  firebase/auth -> node_modules/firebase/auth/dist/index.cjs.js
- After this fix, the Android bundle compiles and returns `var __BUNDLE_START_TIME__` correctly.
- Smoke test on 2026-03-18 confirmed PASS: app launched, JS ran, home screen rendered.

Dev-client connect sequence (important for smoke tests):
- After killing/restarting Metro, the device keeps the old DevLauncher UI open (same PID).
- Use the following ADB intent to reconnect the dev-client to the new Metro:
  adb shell am start -a android.intent.action.VIEW -d "exp+bubble://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A8081" com.bubble.mvp
- Wait ~30s for the JS bundle to load. Confirm with logcat: `I ReactNativeJS: Running "main"`
- Screencap requires MSYS_NO_PATHCONV=1 to avoid Git Bash path conversion on /sdcard:
  MSYS_NO_PATHCONV=1 adb shell screencap /sdcard/screen.png
  MSYS_NO_PATHCONV=1 adb pull /sdcard/screen.png "C:/Users/.../screenshots/screen.png"

ADB reverse tunnel instability — CONFIRMED PATTERN (2026-03-19):
- ADB reverse rules (tcp:8081, tcp:3000) are silently dropped when the USB transport is reset
  (e.g., after a hot reload triggers a device-side reconnect, or after any USB hiccup).
- Symptom: app shows "There was a problem loading the project" with ECONNREFUSED to 127.0.0.1:8081.
- `adb reverse --list` returns empty when the tunnels are gone.
- Fix sequence:
  1. adb -s R5CY73ZZ65J reverse tcp:8081 tcp:8081
  2. adb -s R5CY73ZZ65J reverse tcp:3000 tcp:3000
  3. Confirm with: adb -s R5CY73ZZ65J reverse --list  (must show both UsbFfs entries)
  4. Send deep link: adb shell am start -a android.intent.action.VIEW -d "exp+bubble://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A8081" com.bubble.mvp
  5. Wait ~30s, confirm `I ReactNativeJS: Running "main"` in logcat
- This is NOT a code bug — it is a USB/ADB transport issue. Must be re-applied before each smoke test.

Auth state (updated 2026-03-20):
- The email+password auth migration is in place. PhoneEntryScreen has been removed.
- EmailLoginScreen.js is the current auth entry point.
- When no session is active, the app lands on EmailLoginScreen (Email input, Password input, Sign In button, Sign up link).
- When a session is already active, the app lands on HomeScreen directly (not EmailLoginScreen).
- The home screen shows: Bubble title, "You are INVISIBLE", GO VISIBLE button, Nearby/Chats/Signals nav.
- API URL is now CLOUD RUN: https://bubble-backend-782707450109.us-central1.run.app/api/v1 (not localhost).
- Cloud Run backend /health returns {"status":"ok"}. /api/v1/auth/firebase/verify is live (returns VALIDATION_ERROR for bad token).
- ADB reverse tcp:3000 is still set (for any direct local-backend testing) but the .env no longer needs it.
- ADB reverse tcp:8081 is required only for Metro WebSocket hot reload on the dev-client.

HomeScreen orb photo bug — FIXED (2026-03-18):
- After the Firebase Storage migration, photo URLs stored in the DB are Firebase signed URLs
  (https://storage.googleapis.com/...) or old local-disk localhost URLs.
- Old local-disk URLs (http://localhost:3000/uploads/<uuid>) are now 404 — the backend no longer
  serves express.static('uploads') after the Firebase Storage migration.
- HomeScreen.js loaded the broken URL into profilePhoto state, then rendered <Image> without onError.
  When the image silently failed, profilePhoto stayed non-null, orbInner used rgba(0,0,0,0.15) instead
  of the animated gradient, and the "GO VISIBLE" text was hidden — the orb looked like an empty shape.
- FIX: Added onError={() => setProfilePhoto(null)} to the <Image> in HomeScreen.js.
  After this fix, a broken photo URL clears profilePhoto, restores the animated gradient, and
  shows the "GO VISIBLE" text. Confirmed working on device after bundle reload.
- REMAINING WORK: The old localhost photo URLs in the DB need a backend migration or the ProfileSetup
  flow needs to re-prompt users to upload a photo via Firebase Storage. Route to backend-builder.

BubbleMapView zoom test — PASS (2026-03-19):
- Tested map bubble lock during zoom on Samsung Galaxy S25+ (SM-S936B), Android 16.
- Method: ADB double-tap-drag gestures (Google Maps native zoom gesture), 3–5 zoom steps in/out.
- Evidence: road quadrant distribution relative to bubble centroid is stable across zoom levels:
  baseline (pre-zoom):  UL=41% UR=35% LL=11% LR=9%,  road centroid offset (+0, -9)
  zoom-out (post-zoom): UL=42% UR=36% LL=10% LR=7%,  road centroid offset (+0, -12)
  zoom-in:              UL=37% UR=32% LL=12% LR=14%,  road centroid offset (+0, -7)
- Visual: map tile road topology around bubble is pixel-identical across zoom levels.
- The synchronous Mercator overlay (onRegionChange + coordToScreen) correctly tracks GPS coordinate.
- GPS dot (12px teal dot) and teal bubble ring maintain fixed spatial relationship across all zoom levels.
- ADB reverse tunnels were dropped during the session and restored (known pattern).
- Note: pinch gesture via raw sendevent triggered dev-client overlay (3-finger-swipe system gesture).
  Use double-tap-drag (input tap + input swipe) for Google Maps zoom testing instead.

Known non-fatal warnings (do not escalate):
- W DevLauncher: NoSuchFieldException: No field colorScheme in AppearanceModule — benign reflection warning from expo-dev-launcher, does not affect rendering.
- E ReactHost: ReactNoCrashBridgeNotAllowedSoftException (UIManagerModule/FpsView) — benign in Bridgeless/New Architecture mode.
- W ReactNativeJS: ExpoLinearGradient not exported — dev-client build issue, not a runtime blocker.
  LinearGradient on EmailLoginScreen renders as empty view (no gradient), but the screen is still functional.
  Fix requires a dev-client rebuild with expo-linear-gradient properly linked.
- W ReactNativeJS: expo-av deprecated — pre-existing, non-blocking.
- W ViewManagerPropertyUpdater: No generated setter for rnscreens managers — pre-existing, non-blocking.
- W ViewManagerPropertyUpdater: Could not find generated setter for class com.rnmaps.maps.MapCircleManager — confirmed non-blocking (2026-03-19). Circle renders correctly on device despite this warning. It is a generated-setter registration gap in the react-native-maps 1.20.1 dev build, not a runtime failure. Do not escalate.

Backend Firebase Admin SDK note:
- backend/.env has FIREBASE_PROJECT_ID=bubble-dev-local and FIREBASE_SERVICE_ACCOUNT set.
- If FIREBASE_SERVICE_ACCOUNT is not a valid JSON string or valid file path, verifyFirebaseToken() will
  fall back to Application Default Credentials (ADC), which will fail in local dev without gcloud auth.
- Backend auth route /auth/firebase/verify is correctly implemented.
- Backend health check at /health returns {"status":"ok"} when running.
- backend/.env FIREBASE_STORAGE_BUCKET=bubble-dev-local.appspot.com is a placeholder — photo uploads
  to Firebase Storage will fail in local dev unless a real Firebase project and service account are set.

Emulator-specific notes (Samsung_S25_Plus_My_Device AVD, added 2026-03-20):
- AVD name: Samsung_S25_Plus_My_Device (also Medium_Phone_API_36.1 available)
- Emulator serial: emulator-5554
- On fresh emulator boot, System UI may throw a persistent "System UI isn't responding" ANR dialog.
  This is a cosmetic freeze on the fresh boot — the Bubble app renders correctly behind it.
  It resolves after ~5 minutes of emulator warming or by tapping "Wait" repeatedly after the emulator settles.
  It is NOT a Bubble app crash. No am_anr event appears in logcat. Bubble process stays alive.
- The dev-client WebSocket uses ws://10.0.2.2:8081 (emulator host address), not 127.0.0.1.
  ADB reverse tcp:8081 maps 127.0.0.1 — so ws://10.0.2.2:8081 bypasses the tunnel and uses direct routing.
  On the emulator this works anyway because 10.0.2.2 is routed to the host. Hot reload works.
- Smoke test 2026-03-20: PASS. App launched on Samsung_S25_Plus_My_Device AVD (emulator-5554).
  JS ran (Running "main" confirmed), EmailLoginScreen rendered cleanly. No JS errors or crashes.
  Backend: Cloud Run is live. Firebase auth verify endpoint is live.

Build notes (2026-03-20):
- expo run:android fails with "Could not find device with name: emulator-5554" when 8081 is occupied.
  Use `gradlew assembleDebug` directly from frontend/android/ and `adb install` instead.
  JAVA_HOME must be set to /c/Program Files/Android/Android Studio/jbr for the build to work.
  Build time: ~6 minutes (first incremental). 600 actionable tasks.
- After install: use the dev-client deep link intent to connect to Metro:
  adb shell am start -a android.intent.action.VIEW -d "exp+bubble://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A8081" com.bubble.mvp

**Why:** Physical devices cannot reach the host machine via localhost without ADB reverse port forwarding. Firebase SDK v12 uses ESM package exports that Metro cannot resolve for native platforms without a metro.config.js resolver fix. The fix is now in place and confirmed working.
**How to apply:** Always set up both ADB reverse rules before smoke testing. Use the dev-client deep link ADB intent to reconnect after Metro restart. The Firebase metro.config.js fix is resolved — do not re-escalate unless a new firebase/* module fails to resolve.
