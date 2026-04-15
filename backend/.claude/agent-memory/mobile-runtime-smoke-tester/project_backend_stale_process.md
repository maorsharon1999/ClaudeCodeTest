---
name: backend_stale_process_pattern
description: The backend process on 192.168.1.252:3000 is frequently stale and does not pick up new routes without a manual restart
type: project
---

Observed on 2026-03-18: The backend process was running and responding to known-good routes (e.g. `/auth/token/refresh` returned the expected `REFRESH_TOKEN_INVALID` JSON). However, `POST /api/v1/auth/firebase/verify` returned `NOT_FOUND` even though the route is clearly registered in `backend/src/routes/auth.js`. This indicates the process was started before the firebase route was added and was never restarted.

**Why:** The backend is a Node.js process started manually. It does not hot-reload route changes.

**How to apply:** Before any smoke test that depends on a recently added backend route, confirm the process is running the current code by checking if the specific route responds correctly. If 404, instruct the user or backend-builder to restart the server: `cd backend && node src/index.js`.
