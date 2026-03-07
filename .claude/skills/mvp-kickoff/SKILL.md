---
name: mvp-kickoff
description: Run the Bubble MVP delivery workflow from repository mapping through slice planning, implementation, QA, safety review, and release audit.
disable-model-invocation: true
allowed-tools: Agent(repo-cartographer, product-architect, frontend-builder, backend-builder, matching-presence-engineer, qa-test-engineer, trust-safety-reviewer, release-auditor), Read, Grep, Glob, Bash, Edit
---

Use this workflow to execute Bubble MVP work in a token-efficient, slice-based way.

## Operating rules
- Start by reading CLAUDE.md.
- Do not try to solve the whole MVP in one pass.
- Work in one vertical slice at a time.
- Keep each agent invocation narrow.
- Request short summaries from subagents.
- Prefer reuse over rewrites.
- Validate before declaring completion.

## Execution sequence
1. Invoke `repo-cartographer` to map the repo and identify reusable patterns.
2. Invoke `product-architect` to define the current slice in implementation-ready terms.
3. Delegate implementation:
   - `frontend-builder` for app-side changes
   - `backend-builder` for server-side changes
   - `matching-presence-engineer` only if the slice touches nearby discovery or presence logic
4. Invoke `qa-test-engineer` for targeted validation.
5. Invoke `trust-safety-reviewer` if the slice touches identity, discovery, messaging, moderation, or visibility.
6. Invoke `release-auditor` before calling the slice complete.
7. Summarize:
   - what is done
   - what was validated
   - remaining blockers
   - next slice

## Standard slice order
1. Auth + profile + visibility state
2. Nearby discovery + personal bubble relevance
3. Signal / approve / decline
4. Chat + report / block
5. Safety hardening + moderation basics + release readiness

## Output format
At the end of the workflow, return:
- Current slice
- Work completed
- Validation completed
- Open blockers
- Recommended next prompt
