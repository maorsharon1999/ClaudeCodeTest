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
Every slice must include:
- backend changes
- frontend changes
- validation
- tests
- analytics updates if relevant
- safety/privacy review if relevant

## Required working style
- Start with reading before editing.
- Prefer minimal edits with clear file ownership.
- Avoid speculative rewrites.
- Reuse existing patterns in the repo.
- If requirements are ambiguous, propose the smallest safe interpretation.
- Summaries must be compact and decision-oriented.

## Output contract for all subagents
All subagents must return:
1. What they inspected
2. What they changed or propose changing
3. Risks or blockers
4. Exact files touched or relevant files
5. Recommended next step

Keep outputs concise. Do not dump large code excerpts unless explicitly requested.

## Engineering discipline
- Run only targeted commands whenever possible.
- Prefer narrow tests over full-suite runs during iteration.
- Escalate to broader validation only at slice boundaries.
- Never claim a feature is done without stating what was validated.
- Never expose secrets, tokens, or sensitive user data in outputs.

## Bubble domain rules
- "Bubble" means a personal dynamic presence radius, not a venue chat room.
- Nearby relevance is based on physical proximity, availability, mutual preferences, and safety constraints.
- Discovery must not feel like a swipe app.
- The app exists to help real-world interactions happen, not replace them with long chats.

## Default implementation slices
1. Auth + profile + visibility state
2. Nearby discovery + personal bubble relevance
3. Signal / approve / decline
4. Chat + report / block
5. Safety hardening + moderation basics + release readiness
