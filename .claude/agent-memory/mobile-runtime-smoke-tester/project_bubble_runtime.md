---
name: Bubble runtime context
description: Key runtime facts about the Bubble MVP Android dev build — entry point, device, env, known issues
type: project
---

Device under test: Samsung Galaxy S25+ (SM-S936B), Android 16, serial R5CY73ZZ65J.
App package: com.bubble.mvp (expo dev-client build, not Expo Go).
Expo SDK: ~54.0.0, React Native 0.81.5, expo-dev-client ~6.0.20.
Metro runs on port 8081. Backend runs on port 3000.

Entry point mismatch (known issue, 2026-03-16):
- The project has no index.js/index.ts at frontend root.
- Entry point is App.js, loaded via node_modules/expo/AppEntry.js (defined in package.json "main").
- Metro 404s on /index.bundle because the Expo CLI metro server started in --web mode (expo start --web), not in --dev-client / android mode.
- Fix: start Metro correctly with `npx expo start --dev-client` or `npx expo start` (default), NOT with `--web`.

API URL env risk (known issue, 2026-03-16):
- frontend/.env sets EXPO_PUBLIC_API_URL=http://localhost:3000/api/v1
- On a physical device, localhost resolves to the phone itself, not the dev machine.
- ADB reverse tcp:3000 tcp:3000 is a workaround that makes this work when USB is connected.
- With ADB reverse in place the device can reach the backend at localhost:3000.
- Without ADB reverse, the correct value is the LAN IP of the dev machine (e.g. http://192.168.1.x:3000/api/v1).

**Why:** Physical devices cannot reach the host machine via localhost without ADB reverse port forwarding.
**How to apply:** Always set up ADB reverse before smoke testing on a physical device, and verify EXPO_PUBLIC_API_URL is appropriate for the test mode.
