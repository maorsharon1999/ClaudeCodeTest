---
name: bubble-workflow
description: Orchestrates Bubble development work using the correct specialist agents, validation gates, and completion rules for implementation, visual polish, browser E2E testing, and mobile runtime testing.
disable-model-invocation: true
allowed-tools: Agent(repo-cartographer, product-architect, backend-builder, frontend-builder, matching-presence-engineer, map-recommendation-builder, profile-media-builder, voice-chat-builder, design-motion-director, visual-experience-director, qa-test-engineer, trust-safety-reviewer, release-auditor, mobile-runtime-smoke-tester, chrome-e2e-tester), Read, Grep, Glob, Bash, Edit
---

Use this workflow to execute Bubble work in the correct order with the minimum correct set of agents.

## Core rules
- Read `CLAUDE.md` first.
- Work in small vertical slices or tightly scoped tasks.
- Do not solve everything in one pass.
- Use the minimum correct set of agents for the task.
- Keep agent outputs short and decision-oriented.
- Do not mark a task complete without the required validators.
- If a validation agent returns FAIL, BLOCKED, or INCONCLUSIVE, stop, route the issue to the correct specialist, fix it, and rerun the failed validator.

## Default execution order

### 1. Understand the task
If the codebase area is unclear:
- run `repo-cartographer`

Before any meaningful implementation or feature work:
- run `product-architect`

The goal is to define:
- the thinnest safe implementation
- acceptance criteria
- required backend/frontend implications
- safety/privacy implications
- correct delegation order

### 2. Route implementation
Choose only the relevant implementation agents:

- `backend-builder` for backend/server/API/persistence/migrations/validation
- `frontend-builder` for frontend/mobile/screens/navigation/UI states
- `matching-presence-engineer` for discovery, visibility, presence, proximity, relevance, signal eligibility
- `map-recommendation-builder` for map discovery, nearby suggestion behavior, map-based bubble visibility
- `profile-media-builder` for richer profiles, images, gallery, media upload, profile detail improvements
- `voice-chat-builder` for voice-note chat capabilities
- `design-motion-director` for splash/onboarding/motion-specific polish
- `visual-experience-director` for premium visual direction, bubble identity, modern UI/UX polish

Only invoke what the task actually needs.

### 3. Validation rules
After meaningful implementation:
- run `qa-test-engineer`

If the task touches:
- identity
- auth
- visibility
- discovery
- signals
- chat
- block/report
- moderation
- privacy-sensitive behavior

then also run:
- `trust-safety-reviewer`

Before closing a major slice, release-quality task, or broad integration task:
- run `release-auditor`

### 4. Browser E2E validation
Run `chrome-e2e-tester` when:
- a slice is about to be marked complete
- navigation/auth/profile/discovery/signals/chat/settings were changed
- visual/frontend work may have affected usability
- release readiness needs to be checked
- the user explicitly asks for end-to-end validation

Requirements for `chrome-e2e-tester`:
- backend running on port 3000
- Expo web running on port 8081
- Chrome DevTools MCP connected

If `chrome-e2e-tester` returns FAIL or BLOCKED:
- do not close the task
- route the issue to the correct specialist agent
- rerun `chrome-e2e-tester` after the fix

### 5. Mobile runtime validation
Run `mobile-runtime-smoke-tester` when:
- frontend/mobile dependencies changed
- runtime configuration changed
- Expo/native/mobile launch behavior changed
- the user wants validation on a connected Android phone
- visual or UX changes may affect real device behavior
- the app should be tested after a meaningful mobile update

If `mobile-runtime-smoke-tester` returns FAIL or INCONCLUSIVE:
- do not close the task
- route the issue to the correct specialist
- rerun `mobile-runtime-smoke-tester` after the fix

### 6. Visual quality gate
If the task involves meaningful UI, layout, motion, interaction, or premium feel work:
- run `visual-experience-director`

If the task is specifically about:
- motion behavior
- splash feel
- onboarding animation
- subtle animated polish

then optionally run:
- `design-motion-director`

Do not invoke both by default unless the task genuinely needs both.

After visual work:
- run `chrome-e2e-tester`
- if relevant for actual phone behavior, also run `mobile-runtime-smoke-tester`

A visual task is only complete if:
- the UI is improved
- the flow still works
- the validators confirm no regression

## Task-type routing guide

### A. New feature slice
Run:
1. `product-architect`
2. relevant implementation agents
3. `qa-test-engineer`
4. `trust-safety-reviewer` if sensitive
5. `chrome-e2e-tester` if frontend/user flow affected
6. `mobile-runtime-smoke-tester` if mobile runtime affected
7. `release-auditor` for major slice closure

### B. Backend-only change
Run:
1. `product-architect`
2. `backend-builder`
3. `qa-test-engineer`
4. `trust-safety-reviewer` if auth/privacy/consent affected
5. `release-auditor` if broad or release-critical

### C. Frontend/mobile change
Run:
1. `product-architect`
2. `frontend-builder`
3. `qa-test-engineer`
4. `visual-experience-director` if UI/UX changed meaningfully
5. `chrome-e2e-tester`
6. `mobile-runtime-smoke-tester` if real device/runtime affected
7. `trust-safety-reviewer` if sensitive flow affected

### D. Discovery/presence/relevance change
Run:
1. `product-architect`
2. `matching-presence-engineer`
3. relevant `frontend-builder`/`backend-builder` if integration needed
4. `qa-test-engineer`
5. `trust-safety-reviewer`
6. `chrome-e2e-tester` if user flow affected
7. `mobile-runtime-smoke-tester` if mobile runtime affected

### E. Visual polish task
Run:
1. `visual-experience-director`
2. `frontend-builder` for implementation
3. `chrome-e2e-tester`
4. `mobile-runtime-smoke-tester` if relevant
5. `release-auditor` if this is a major polish/release pass

### F. Release readiness task
Run:
1. `repo-cartographer` if needed
2. `release-auditor`
3. `trust-safety-reviewer`
4. `qa-test-engineer`
5. `chrome-e2e-tester`
6. `mobile-runtime-smoke-tester`

## Output format
At the end of the workflow, return exactly:
- Active task
- Agents used
- What was changed
- What was validated
- Blocking issues
- Remaining risks
- Recommended next step

## Completion standard
Do not call a task complete unless:
- the requested behavior is implemented
- the relevant validation agents were run
- no unresolved blocker remains
- the result is consistent with Bubble product rules
