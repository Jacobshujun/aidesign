# Verification

## Baseline Command

```bash
node scripts/harness/check.mjs
```

## Current Automated Checks

`scripts/harness/check.mjs` runs:

1. `scripts/harness/init.mjs`
   - Confirms required Harness files exist.
   - Confirms `docs/harness/feature_list.json` parses as JSON.
   - Confirms `feature_list.json` has at least one feature.
   - Confirms feature statuses are valid.
2. `scripts/harness/handoff.mjs`
   - Confirms handoff/progress/feature files exist.
   - Confirms any `done` feature has at least one evidence entry.
3. `npm run build`
   - Runs `tsc --noEmit`.
   - Runs `vite build`.

PowerShell equivalents are retained:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/harness/check.ps1
```

## Project Checks

- `npm run build`: TypeScript and production bundle check.
- `npm run smoke`: HTTP smoke for a running local dev server.

## HTTP Smoke

Configured as a separate command:

```bash
npm run smoke
```

Default target:

```text
http://127.0.0.1:5173/
```

The smoke command expects `npm run dev` to already be running.

It checks:

- The Vite HTML root.
- `/api/ai/config` through the Vite proxy.

## Recent Verification

- 2026-06-06: `powershell -ExecutionPolicy Bypass -File scripts/harness/check.ps1` was attempted after script finalization and failed with `zsh:1: command not found: powershell`.
- 2026-06-06: `command -v powershell` and `command -v pwsh` found no executable.
- 2026-06-06: Supplemental check passed: `docs/harness/feature_list.json` parses as JSON with `python3`.
- 2026-06-06: Supplemental check passed: all Harness PowerShell scripts contain `$ErrorActionPreference = "Stop"`.
- 2026-06-06: `node -v` returned `v24.16.0`.
- 2026-06-06: `node scripts/harness/check.mjs` passed with Harness init, handoff, and baseline checks.
- 2026-06-06: `npm run build` passed.
- 2026-06-06: `npm run smoke` passed against `http://127.0.0.1:5173/`.
- 2026-06-06: `node scripts/harness/check.mjs` passed after adding `npm run build` to the baseline.
- 2026-06-06: `/api/ai/config` returned provider status without API keys.
- 2026-06-06: `/api/ai/recognize-scene` returned `503 AI_TEXT_API_KEY is not configured.` while the key is blank.
- 2026-06-06: `npm run smoke` passed after adding `/api/ai/config`.
- 2026-06-06: `node scripts/harness/check.mjs` passed after adding AI proxy files to required-file checks.
- 2026-06-06: `curl http://127.0.0.1:5173/api/ai/config` reported both providers configured after restarting `npm run dev` with local `.env.local`.
- 2026-06-06: Placeholder-key status check reported both providers unconfigured.
- 2026-06-06: `npm run smoke` passed after the configured-provider dev-server restart.
- 2026-06-06: `node scripts/harness/check.mjs` passed after provider-status and `.env.example` updates.
- 2026-06-06: `npm run build` passed after adding in-memory scene history, separated scene/furniture import actions, draft furniture uploads, and manual detection-box editing.
- 2026-06-06: `node scripts/harness/check.mjs` passed after scene/import separation and Harness documentation updates.
- 2026-06-06: `npm run smoke` passed against the already-running local dev server at `http://127.0.0.1:5173/` after scene/import separation.
- 2026-06-06: `npm run build` passed after implementing all-status replacement candidates and the in-memory per-scene replacement chain.
- 2026-06-06: `node scripts/harness/check.mjs` passed after implementing all-status replacement candidates and the in-memory per-scene replacement chain.
- 2026-06-06: `npm run smoke` passed against the already-running local dev server at `http://127.0.0.1:5173/` after replacement-chain implementation.
- 2026-06-07: `node scripts/harness/check.mjs` passed while preparing the initial GitHub sync.

## Missing Coverage

- Local execution of PowerShell wrappers, because `powershell` and `pwsh` are not installed.
- Unit/integration tests.
- Browser walkthrough for the core UI.
- Provider contract tests with real configured API keys.
- Image upload/generation workflow checks.
- Deployment health checks.

## Manual Verification Goals

Once application code exists, manually verify:

- A new user can open the primary app entrypoint.
- The core upload/recognition/replacement flow is understandable.
- Asset library items expose enough metadata to support replacement.
- Generated or mocked outputs are clearly distinguishable from source images.
- Errors are visible and actionable without silent swallowing.
