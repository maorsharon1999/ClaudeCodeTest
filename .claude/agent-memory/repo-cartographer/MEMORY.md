# Repo Cartographer Memory

## Repository Structure
This is a **Bubble MVP orchestration framework** — not the application itself.
- The repo is a Git-based project for managing Claude agent workflows
- Contains agent definitions, skill definitions, and configuration
- No mobile app code, backend code, or application assets exist yet
- Ready for actual MVP implementation work to begin

## Key Paths
- `.claude/agents/` — 8 agent definition files (product-architect, frontend-builder, backend-builder, matching-presence-engineer, qa-test-engineer, trust-safety-reviewer, release-auditor, repo-cartographer)
- `.claude/skills/mvp-kickoff/` — orchestration skill that coordinates agents
- `.claude/settings.local.json` — permissions for gh and mkdir
- `CLAUDE.md` — project operating instructions (git workflow)
- `.git/` — version control, 15 commits of agent/skill setup

## MVP Operating Rules
From `.claude/skills/mvp-kickoff/SKILL.md`:
- Work in vertical slices, not monolithic builds
- Follow execution sequence: map repo → define slice → delegate (frontend/backend/presence) → QA → safety review → audit → complete
- Standard slice order:
  1. Auth + profile + visibility state
  2. Nearby discovery + personal bubble relevance
  3. Signal / approve / decline
  4. Chat + report / block
  5. Safety hardening + moderation basics + release readiness

## Agent Specialization Matrix
| Agent | Role | Tools |
|-------|------|-------|
| repo-cartographer | Maps repo structure, patterns, entry points | Read, Grep, Glob, Bash |
| product-architect | Narrows scope, defines acceptance criteria | Read, Grep, Glob, Bash |
| frontend-builder | Mobile UI, flows, validation | Read, Edit, Grep, Glob, Bash |
| backend-builder | Routes, services, persistence, API contracts | Read, Edit, Grep, Glob, Bash |
| matching-presence-engineer | Discovery, proximity, ranking, anti-jitter | Read, Edit, Grep, Glob, Bash |
| qa-test-engineer | Tests, acceptance criteria validation | Read, Edit, Grep, Glob, Bash |
| trust-safety-reviewer | Privacy, consent, abuse prevention, moderation | Read, Grep, Glob, Bash (no edit) |
| release-auditor | Cross-slice consistency, release blockers | Read, Grep, Glob, Bash (no edit) |

## No Application Code Exists Yet
- No src/, app/, frontend/, backend/ directories
- No source files (*.ts, *.tsx, *.js, *.py, *.go)
- No package.json, requirements.txt, go.mod, or language-specific config
- No tests, no schemas, no environments

## Next Steps
- Follow mvp-kickoff workflow to start implementation
- First call product-architect to define Slice 1 (auth + profile + visibility)
- Then call frontend-builder and backend-builder in sequence
- Repo is ready to receive code; no blocker exists
