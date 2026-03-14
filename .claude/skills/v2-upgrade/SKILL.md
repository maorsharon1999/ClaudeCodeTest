---
name: v2-upgrade
description: Run Bubble V2 feature upgrades in organized epics: visual polish, profile media, voice chat, bubble map, and smart matching alerts.
disable-model-invocation: true
allowed-tools: Agent(repo-cartographer, product-architect, frontend-builder, backend-builder, matching-presence-engineer, qa-test-engineer, trust-safety-reviewer, release-auditor, design-motion-director, profile-media-builder, voice-chat-builder, map-recommendation-builder), Read, Grep, Glob, Bash, Edit
---

Use this workflow for Bubble's post-MVP upgrade work.

## Rules
- Read CLAUDE.md first.
- Work in one epic at a time.
- Do not mix multiple major upgrades in one pass.
- Reuse current implementation patterns.
- Keep outputs short and action-oriented.
- Validate each epic before moving to the next.

## Epic order
1. Visual & Motion Upgrade
2. Profile Upgrade
3. Chat Upgrade
4. Bubble Map
5. Smart Matching & Alerts

## Delegation guidance
- `repo-cartographer` for repo discovery if needed
- `product-architect` to define the thinnest plan for the epic
- `design-motion-director` for UI/motion upgrade decisions
- `profile-media-builder` for richer profile features
- `voice-chat-builder` for voice notes
- `map-recommendation-builder` for map + suggestion work
- `frontend-builder` and `backend-builder` for app/server implementation
- `matching-presence-engineer` if ranking, proximity, or visibility logic changes
- `qa-test-engineer` for focused validation
- `trust-safety-reviewer` when privacy, messaging, identity, or map visibility changes
- `release-auditor` before calling the epic complete

## Output format
Return:
- Current epic
- What changed
- What was validated
- Risks/blockers
- Recommended next prompt
