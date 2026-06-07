# Handoff

## New Session Startup

Read these files first:

1. `AGENTS.md`
2. `docs/harness/handoff.md`
3. `docs/harness/progress.md`
4. `docs/harness/feature_list.json`
5. `docs/harness/decisions.md`
6. `docs/harness/project_brief.md` when scope or technology matters
7. `docs/harness/verification.md` before finishing
8. `docs/harness/pitfalls.md` and `docs/harness/architecture_rules.md` before code or deployment changes

## Current Task

First Web MVP and AI provider foundation are implemented. Scene-image import and furniture-item import have been separated in the UI. The workspace now has an in-memory scene history library, manual detection-box editing, all-status replacement candidates, an in-memory per-scene replacement chain for continuous multi-item replacement, and an infinite-canvas-style scene viewport with pan/zoom plus direct detection-box drag/resize. The asset library imports furniture items as `待标注` draft assets, and `待标注` / `需抠图` assets are allowed to participate in generation. Local `.env.local` has been filled by the user, and the restarted dev server reports both providers configured. Provider status now treats placeholder API key values as unconfigured.

The GitHub collaboration remote is `origin = https://github.com/Jacobshujun/aidesign.git`. It was confirmed empty before the initial local `main` branch sync.

## Resume Entry Point

Run:

```bash
node scripts/harness/check.mjs
```

Then review `docs/harness/progress.md` for the next product decision.

If `.env.local` changes, restart `npm run dev`; the local Node API proxy reads environment files at startup.

Local dev server:

```bash
npm run dev
```

Current URLs:

```text
http://127.0.0.1:5173/
http://127.0.0.1:8787/api/health
```

## Boundaries

- Do not create parallel memory, TODO, planning, or handoff files outside `docs/harness/`.
- Do not add application dependencies until the product stack is confirmed.
- Use the confirmed npm scripts in `package.json`; do not invent alternate runtime, test, build, or deployment commands.
- HTTP smoke exists at `scripts/harness/http_smoke.mjs` and expects a running local dev server.
- Do not commit secrets, local uploads, generated images, production configuration, or authentication logs.
- Do not put model API keys in frontend code. Use `.env.local` only.
- Current uploads, scene history, and manual detection-box edits are browser-memory only; do not add filesystem persistence without updating Harness docs.

## Recent Verification

- 2026-06-06: `powershell -ExecutionPolicy Bypass -File scripts/harness/check.ps1` was attempted after script finalization and failed with `zsh:1: command not found: powershell`.
- 2026-06-06: `pwsh` is also unavailable.
- 2026-06-06: Supplemental checks passed for `feature_list.json` JSON parsing and `$ErrorActionPreference = "Stop"` in Harness scripts.
- 2026-06-06: `node -v` returned `v24.16.0`.
- 2026-06-06: `node scripts/harness/check.mjs` passed.
- 2026-06-06: `npm run build` passed.
- 2026-06-06: `npm run smoke` passed against `http://127.0.0.1:5173/`.
- 2026-06-06: `node scripts/harness/check.mjs` passed after adding `npm run build` to the baseline.
- 2026-06-06: `npm run smoke` passed after adding `/api/ai/config` to HTTP smoke.
- 2026-06-06: `/api/ai/recognize-scene` returns 503 while `AI_TEXT_API_KEY` is blank.
- 2026-06-06: `node scripts/harness/check.mjs` passed after adding AI proxy files to Harness required-file checks.
- 2026-06-06: Restarted `npm run dev` after local `.env.local` update; `/api/ai/config` now reports both providers configured without exposing secrets.
- 2026-06-06: `npm run smoke` passed after the configured-provider dev-server restart.
- 2026-06-06: `.env.example` uses placeholder API key values, and provider status shares the same placeholder-aware secret validation as request-time provider calls.
- 2026-06-06: Placeholder-key status check returned both providers unconfigured; `node scripts/harness/check.mjs` and `npm run smoke` passed.
- 2026-06-06: `npm run build` passed after adding in-memory scene history, separated scene/furniture import actions, draft furniture uploads, and manual detection-box editing.
- 2026-06-06: `node scripts/harness/check.mjs` passed after adding in-memory scene history, separated scene/furniture imports, draft furniture uploads, manual detection-box editing, and Harness documentation updates.
- 2026-06-06: `npm run smoke` passed against the already-running local dev server at `http://127.0.0.1:5173/` after scene/import separation.
- 2026-06-06: `node scripts/harness/check.mjs` passed while preparing the single-item replacement interaction plan.
- 2026-06-06: `npm run build`, `node scripts/harness/check.mjs`, and `npm run smoke` passed after implementing all-status replacement candidates and the in-memory per-scene replacement chain.
- 2026-06-06: `node scripts/harness/check.mjs` passed after converting the scene replacement workspace to an infinite canvas.
- 2026-06-06: `npm run smoke` passed against `http://127.0.0.1:5173/` after the infinite-canvas workspace conversion.
- 2026-06-07: `node scripts/harness/check.mjs` passed while preparing the initial GitHub sync.
