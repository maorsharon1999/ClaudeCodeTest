# Bubble MVP Operating Instructions

## Product mission
Build the Bubble MVP as a real-time, hyper-local dating app for nightlife environments.
The product helps users who are physically near each other determine mutual relevance and interest before starting a conversation.

## Core product principles
1. Physical proximity is the core value.
2. No precise location is ever exposed to other users.
3. No direct message can be sent before mutual consent.
4. Safety and privacy outrank speed of growth.
5. The MVP must stay narrow and avoid scope creep.

## MVP scope
The MVP includes:
- phone-based signup and login
- profile setup
- selfie/liveness verification gate before full availability
- visibility modes: Invisible / Browsing / Available
- nearby candidate discovery
- signal request flow
- approve / decline flow
- text chat after approval
- block / report
- basic moderation and admin support
- analytics instrumentation
- crash and error visibility

The MVP excludes:
- group chat
- venue-defined chat zones
- swipe-based discovery
- AR
- audio/video calling
- media attachments in chat
- gamification
- premium monetization
- advanced recommendation engine beyond relevance ranking

## Delivery model
Work in vertical slices, not isolated layers.

Every slice should include, when relevant:
- backend changes
- frontend changes
- validation
- tests
- analytics updates
- safety/privacy review

## Required working style
- Start with reading before editing.
- Prefer minimal edits with clear file ownership.
- Avoid speculative rewrites.
- Reuse existing patterns in the repo.
- If requirements are ambiguous, propose the smallest safe interpretation.
- Summaries must be compact and decision-oriented.
- Keep scope tight and focused on the active task.
- Prefer the smallest safe change over broad rework.
- Do not introduce new product scope unless explicitly requested.

## Output contract for all subagents
Unless a subagent has its own stricter required output format, all subagents should return:
1. What they inspected
2. What they changed or propose changing
3. Risks or blockers
4. Exact files touched or relevant files
5. Recommended next step

Keep outputs concise.
Do not dump large code excerpts unless explicitly requested.

## Engineering discipline
- Run only targeted commands whenever possible.
- Prefer narrow tests over full-suite runs during iteration.
- Escalate to broader validation only at slice boundaries.
- Never claim a feature is done without stating what was validated.
- Never expose secrets, tokens, or sensitive user data in outputs.
- Keep contracts explicit and minimal.
- Prefer deterministic behavior over vague “magic.”
- Avoid unnecessary dependency additions.
- Avoid broad refactors unless they are required to complete the task safely.

## Bubble domain rules
- "Bubble" means a personal dynamic presence radius, not a venue chat room.
- Nearby relevance is based on physical proximity, availability, mutual preferences, and safety constraints.
- Discovery must not feel like a swipe app.
- The app exists to help real-world interactions happen, not replace them with long chats.
- Visibility does not equal permission to message.
- Signals and approvals are required before direct free-form messaging.
- All privacy-sensitive behavior must be enforced server-side, not only in the frontend.

## Default implementation slices
1. Auth + profile + visibility state
2. Nearby discovery + personal bubble relevance
3. Signal / approve / decline
4. Chat + report / block
5. Safety hardening + moderation basics + release readiness

---

## Agent operating model

This project uses specialized subagents.
The main Claude session acts as the coordinator and should route work to the correct specialist instead of trying to do everything itself.

### General rules
- Use the minimum correct set of agents for each task.
- Run agents in parallel only when their changes clearly do not conflict.
- Never mark a task complete without the required validation agents.
- Prefer one narrow specialist over one broad vague request.
- Keep the main session focused on coordination, decisions, and sequencing.

---

## Agent registry

### repo-cartographer
Use for:
- mapping the repo
- identifying architecture, entry points, scripts, patterns, and implementation gaps
- understanding current project structure before changes

### product-architect
Use for:
- translating product intent into the thinnest safe implementation plan
- defining slice boundaries
- defining acceptance criteria
- clarifying backend/frontend implications and safety implications before coding

### backend-builder
Use for:
- backend/server-side implementation
- routes, controllers, services, persistence, validation, API contracts, and backend error handling
- analytics event points where needed

### frontend-builder
Use for:
- frontend/mobile implementation
- screens, navigation, UI states, forms, client-side integration, and validation
- Expo / React Native implementation work

### matching-presence-engineer
Use for:
- nearby discovery logic
- presence rules
- personal bubble logic
- visibility gating
- anti-jitter / anti-flicker
- relevance / proximity ranking changes

### visual-experience-director
Use for:
- high-level visual direction
- premium feel
- bubble identity
- motion and microinteractions
- modernizing static or visually weak screens
- design review after meaningful frontend/UI changes

### qa-test-engineer
Use for:
- targeted regression testing
- acceptance criteria coverage
- focused automated tests
- post-implementation validation

### trust-safety-reviewer
Use for:
- privacy review
- consent enforcement review
- discovery/signals/chat/report/block safety review
- leakage, abuse, fake-account, and dangerous-default checks

### release-auditor
Use for:
- final cross-slice audit
- release readiness review
- integration consistency review
- blocker / no-go decision before closing major work

### mobile-runtime-smoke-tester
Use for:
- on-device Android runtime validation
- launch verification on a connected phone
- Metro/native/backend/env issue detection
- diagnosing runtime failures after meaningful frontend/mobile updates

### chrome-e2e-tester
Use for:
- full browser-based end-to-end testing
- validating complete user journeys in Expo web
- checking navigation, auth, profile, discovery, signals, chat, and settings flows
- collecting screenshots, network evidence, and console evidence

---

## Routing rules

### Before implementation
- If the codebase area is unclear, run `repo-cartographer`.
- Before a new slice or any meaningful feature/change, run `product-architect`.

### During implementation
- Use `backend-builder` for backend/server changes.
- Use `frontend-builder` for frontend/mobile changes.
- Use `matching-presence-engineer` only when presence/discovery/relevance/visibility logic changes.

### Visual and design routing
- Use `visual-experience-director` as the default for all design/UX/motion work.

### Validation routing
- After meaningful implementation, run `qa-test-engineer`.
- If the work touches identity, visibility, discovery, signals, chat, block/report, moderation, or sensitive product behavior, run `trust-safety-reviewer`.
- Before closing a major slice or release-quality task, run `release-auditor`.

---

## Completion gates

A task is not complete unless the relevant gates have passed.

### Minimum gate for normal implementation work
- `product-architect`
- relevant implementation agent(s)
- `qa-test-engineer`

### Additional required gate for sensitive product flows
- `trust-safety-reviewer`

### Additional required gate for major slice closure or release-quality work
- `release-auditor`

### Additional required gate for frontend or visual work
- `visual-experience-director`
- `chrome-e2e-tester`

### Additional required gate for mobile runtime-sensitive work
- `mobile-runtime-smoke-tester`

If a validation agent returns FAIL, BLOCKED, or INCONCLUSIVE:
- do not proceed blindly
- do not mark the task complete
- identify the smallest safe fix
- route the issue to the most relevant specialist agent
- rerun the failed validator after the fix

---

## Mobile runtime validation

After any meaningful frontend/mobile update, run `mobile-runtime-smoke-tester` before calling the task complete.

If it reports FAIL or INCONCLUSIVE:
- do not proceed blindly
- use its delegation plan to route the issue to the relevant specialist agent
- rerun `mobile-runtime-smoke-tester` after the fix

Use it especially when:
- the app should open on a connected Android phone
- Expo/native dependencies changed
- runtime configuration changed
- mobile auth/network/device behavior may have changed
- there are signs of Metro/native/backend/env instability

---

## Chrome E2E testing

Use `chrome-e2e-tester` to validate the full user journey through the browser (Expo web build) at any of these trigger points:
- before marking a vertical slice as complete
- after any change that touches navigation, auth, profile, discovery, signals, chat, or settings
- when doing a release readiness check
- on demand when the user asks for end-to-end validation

The agent requires:
- backend running on port 3000 (`cd backend && node src/index.js`)
- Expo web running on port 8081 (`cd frontend && npx expo start --web`)
- Chrome connected via DevTools MCP

If it returns FAIL or BLOCKED:
- route the issue to the appropriate specialist agent
- fix it
- rerun `chrome-e2e-tester`

Do not close the task based only on screenshots or code review if browser flow validation is relevant.

---

## Visual experience review

After any meaningful frontend, layout, motion, interaction, or visual change, run `visual-experience-director`.

Its role is to review and improve:
- visual quality
- modernity
- bubble identity
- motion and microinteractions
- tactile delight
- intuitiveness
- overall premium feel

Do not approve a visual/frontend task based on appearance alone.

After any meaningful visual or UX update, `chrome-e2e-tester` must validate the affected flow before the task can be considered complete.

If the visual work is intended for real mobile use or may affect device behavior, also run `mobile-runtime-smoke-tester`.

If `chrome-e2e-tester` finds a regression, broken interaction, hidden control, keyboard issue, navigation issue, or suspicious behavior:
- the task is not complete
- fix the issue with the relevant agent
- rerun `chrome-e2e-tester`

A visual improvement is only considered complete if:
- the UI is improved
- the relevant flow still works
- `chrome-e2e-tester` confirms the critical interaction remains usable

---

## Efficiency rules

- Keep the main session focused on coordination and decisions.
- Use subagents for exploration, implementation, validation, and review.
- Prefer one narrow specialist over one broad vague request.
- Avoid calling multiple overlapping design agents unless clearly justified.
- Use `chrome-e2e-tester` for browser flow validation and `mobile-runtime-smoke-tester` for connected-device validation.
- Use broader review agents only when the task actually requires them.
- Do not overrun the repository with unnecessary “nice to have” upgrades during MVP work.

---

## Task closure standard

A task may only be called complete when:
- the requested behavior is implemented
- the relevant tests or validations were actually run
- the required validation agents passed
- no unresolved blocker remains
- the output clearly states what changed, what was validated, and what remains risky (if anything)

Do not call something complete just because the code was edited.
Do not call something complete just because the UI looks better.
Do not call something complete just because the app launches once.