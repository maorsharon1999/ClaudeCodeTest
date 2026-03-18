---
name: bubble-e2e
description: Detect the machine's LAN IP, update .env files, start backend and Expo web in background tasks, wait for both to be healthy, then run the chrome-e2e-tester agent for a full end-to-end validation of the Bubble app.
allowed-tools: Bash, Read, Edit, Agent, TaskCreate, TaskOutput, TaskList
---

You are orchestrating a full end-to-end validation of the Bubble app. Follow these steps in order:

## Step 1 — Detect LAN IP

Run the following Bash command to get the current LAN IPv4 address:

```bash
powershell -Command "(Get-NetIPAddress -AddressFamily IPv4 | Where-Object { \$_.IPAddress -notlike '127.*' -and \$_.IPAddress -notlike '169.*' } | Sort-Object PrefixLength -Descending | Select-Object -First 1).IPAddress"
```

If that fails or returns empty, use this fallback:

```bash
ipconfig | grep -E "IPv4" | grep -v "127.0.0.1" | head -1 | awk '{print $NF}' | tr -d '\r'
```

Store the detected IP (e.g., `192.168.1.100`). If no IP can be detected, report BLOCKED.

## Step 2 — Update .env files if IP changed

Read `backend/.env` and check the current `STORAGE_BASE_URL` value.
- If the IP in `STORAGE_BASE_URL` differs from the detected IP, update the line to: `STORAGE_BASE_URL=http://<DETECTED_IP>:3000`

Read `frontend/.env` and check the current `EXPO_PUBLIC_API_URL` value.
- If the IP in `EXPO_PUBLIC_API_URL` differs from the detected IP, update the line to: `EXPO_PUBLIC_API_URL=http://<DETECTED_IP>:3000/api/v1`

If neither changed, note "IP unchanged, skipping .env edits".

## Step 3 — Check if servers are already running

Run these checks:

```bash
# Check backend
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/v1/profile/me

# Check Expo web
curl -s -o /dev/null -w "%{http_code}" http://localhost:8081
```

- Backend is running if response is `200` or `401`
- Expo web is running if response is `200`

Note which servers need to be started.

## Step 4 — Start backend (if not running)

If the backend is not running, use TaskCreate to start it in the background:

```bash
cd /c/Users/maor1/Desktop/ClaudeCodeTest/backend && npm start
```

Use label: `bubble-backend`

## Step 5 — Start Expo web (if not running)

If Expo web is not running, use TaskCreate to start it in the background:

```bash
cd /c/Users/maor1/Desktop/ClaudeCodeTest/frontend && npx expo start --web --non-interactive
```

Use label: `bubble-expo-web`

## Step 6 — Wait for readiness (poll up to 60s each)

Poll every 3 seconds, up to 20 attempts for each server:

**Backend ready check:**
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/v1/profile/me
```
Ready when: returns `200` or `401`

**Expo web ready check:**
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:8081
```
Ready when: returns `200`

Between each poll attempt, use:
```bash
sleep 3
```

If either server does not become ready within 60 seconds (20 attempts × 3s), report BLOCKED and use TaskOutput to retrieve the last 50 lines of logs from the relevant task for diagnosis. Do not proceed to step 7.

## Step 7 — Launch chrome-e2e-tester

Once both servers are confirmed ready, invoke the chrome-e2e-tester agent. Include this context in your prompt:

- Detected LAN IP: `<DETECTED_IP>`
- Backend URL: `http://localhost:3000`
- Expo web URL: `http://localhost:8081`
- API base: `http://<DETECTED_IP>:3000/api/v1`
- Both servers are confirmed healthy

The agent should validate the full user journey through the Expo web build in Chrome.

## Final Report

After the chrome-e2e-tester agent completes, output a final verdict:

- **PASS** — both servers healthy, E2E agent completed without errors
- **FAIL** — E2E agent found issues (include summary)
- **BLOCKED** — a server failed to start or timed out (include task logs)
