# Progress

## Current Focus

First Web MVP is implemented. Current focus is reviewing the scene-image infinite-canvas replacement workspace before real provider/storage integration.

## Latest Status

- 2026-06-06: Initial audit found an empty project root with no Git repository, README, configuration, source code, tests, deployment scripts, or runtime data directories.
- 2026-06-06: Created `AGENTS.md`, `README.md`, `docs/harness/` files, and `scripts/harness/` PowerShell scripts.
- 2026-06-06: Required baseline command was attempted and failed because `powershell` is not installed in the current macOS environment. `pwsh` is also not installed.
- 2026-06-06: Supplemental local checks passed: `feature_list.json` parses as JSON, required files are present, and all Harness PowerShell scripts include `$ErrorActionPreference = "Stop"`.
- 2026-06-06: Confirmed Node.js `v24.16.0` is installed.
- 2026-06-06: Added pure Node.js Harness baseline scripts under `scripts/harness/*.mjs`.
- 2026-06-06: `node scripts/harness/check.mjs` passed.
- 2026-06-06: Created Vite + React + TypeScript Web app in the repository root.
- 2026-06-06: Implemented furniture asset library with mock data, filters, grid, detail panel, and in-memory asset import.
- 2026-06-06: Implemented scene replacement workspace with scene upload, mock detection boxes, object selection, candidate replacement selection, layer switching, and generated preview overlay.
- 2026-06-06: Added HTTP smoke script `scripts/harness/http_smoke.mjs` and npm scripts for dev/build/smoke/harness.
- 2026-06-06: Dev server is running at `http://127.0.0.1:5173/`.
- 2026-06-06: Added local Node AI proxy for text-model and RunningHub provider calls.
- 2026-06-06: Added `.env.example` and ignored `.env.local` template. API key fields are blank in files and must be filled locally.
- 2026-06-06: Frontend now reads provider status from `/api/ai/config` and can call `/api/ai/recognize-scene`.
- 2026-06-06: `npm run dev` now starts both API proxy and Vite.
- 2026-06-06: Restarted `npm run dev` after `.env.local` was filled locally; `/api/ai/config` now reports text model and RunningHub configured without exposing secrets.
- 2026-06-06: Replaced sensitive-looking values in `.env.example` with placeholder values.
- 2026-06-06: Updated provider status logic so placeholder API key values are reported as unconfigured, matching request-time secret validation.
- 2026-06-06: Separated scene-image import from furniture-item import in the UI. Workspace now owns scene import and in-memory scene history; asset library now owns furniture item import.
- 2026-06-06: Furniture item uploads now enter the library as `待标注` draft assets.
- 2026-06-06: Added front-end manual editing for scene detection boxes, including add, delete, label/category edits, and box geometry edits.
- 2026-06-06: Drafted the scene-image single-item replacement interaction plan for user confirmation before implementation.
- 2026-06-06: Implemented all-status replacement candidates, including `待标注` and `需抠图` assets, plus an in-memory per-scene replacement chain for continuous multi-item replacement.
- 2026-06-06: Converted the scene replacement workspace to an infinite-canvas-style viewport with pan, wheel/button zoom, fit/reset/focus controls, and direct detection-box drag/resize.
- 2026-06-07: Confirmed `https://github.com/Jacobshujun/aidesign.git` has no remote refs, initialized local Git on `main`, and configured `origin` for the first GitHub sync.
- 2026-06-07: Created local commits for the initial project sync. `git push -u origin main` is blocked until GitHub credentials are configured locally; HTTPS has no username credential, and SSH has no accepted public key.

## Risks

- Recognition and replacement are front-end mocks; no real AI/model API exists yet.
- Real model calls require valid `.env.local` API keys and confirmed provider response formats.
- RunningHub image-to-image node mapping is not confirmed; provider proxy is generic and expects `nodeInfoList`.
- Uploaded files are held in browser memory and are not persisted.
- Scene history and manual detection edits are held in browser memory and are lost on refresh.
- Scene replacement chains are held in browser memory and are lost on refresh.
- Product testing currently covers TypeScript/build and HTTP entrypoint smoke, but not browser interaction automation.
- Deployment target is not confirmed.
- PowerShell wrappers remain unverified locally because `powershell` and `pwsh` are not installed.
- GitHub push currently requires local authentication setup before `origin/main` can be created.

## Verification Record

- 2026-06-06: `powershell -ExecutionPolicy Bypass -File scripts/harness/check.ps1` failed with `zsh:1: command not found: powershell`; final attempt after script path cleanup had the same environment failure.
- 2026-06-06: `command -v powershell` returned no executable.
- 2026-06-06: `command -v pwsh` returned no executable.
- 2026-06-06: `python3 -c "import json; json.load(open('docs/harness/feature_list.json', encoding='utf-8')); print('feature_list.json ok')"` passed.
- 2026-06-06: `rg '\$ErrorActionPreference = "Stop"' scripts/harness` confirmed all three Harness scripts include the required fail-fast setting.
- 2026-06-06: `node -v` returned `v24.16.0`.
- 2026-06-06: `node scripts/harness/check.mjs` passed with output: Harness init check passed; Harness handoff check passed; Harness baseline check passed.
- 2026-06-06: `npm install --cache .npm-cache` passed after default npm cache failed with EACCES.
- 2026-06-06: `npm run build` passed.
- 2026-06-06: `npm run smoke` passed against `http://127.0.0.1:5173/`.
- 2026-06-06: `node scripts/harness/check.mjs` passed after adding `npm run build` to the baseline.
- 2026-06-06: `/api/ai/config` returned provider status without exposing secrets.
- 2026-06-06: `/api/ai/recognize-scene` returned `503 AI_TEXT_API_KEY is not configured.` when no text model key is present.
- 2026-06-06: `npm run smoke` passed after adding `/api/ai/config` to the HTTP smoke.
- 2026-06-06: `node scripts/harness/check.mjs` passed after adding AI proxy files to required Harness checks.
- 2026-06-06: `curl http://127.0.0.1:8787/api/ai/config` and `curl http://127.0.0.1:5173/api/ai/config` both reported text model and RunningHub configured after dev-server restart.
- 2026-06-06: `npm run smoke` passed after dev-server restart with configured local provider status.
- 2026-06-06: Placeholder-key status check returned both providers unconfigured, while the restarted local dev server with `.env.local` returned both providers configured.
- 2026-06-06: `node scripts/harness/check.mjs` passed after the provider-status and `.env.example` updates.
- 2026-06-06: `npm run build` passed after adding in-memory scene history, separated import actions, draft furniture uploads, and manual detection-box editing.
- 2026-06-06: `node scripts/harness/check.mjs` passed after adding in-memory scene history, separated scene/furniture imports, draft furniture uploads, manual detection-box editing, and Harness documentation updates.
- 2026-06-06: `npm run smoke` passed against the already-running local dev server at `http://127.0.0.1:5173/` after scene/import separation.
- 2026-06-06: `node scripts/harness/check.mjs` passed while preparing the single-item replacement interaction plan.
- 2026-06-06: `npm run build` passed after implementing all-status replacement candidates and the in-memory per-scene replacement chain.
- 2026-06-06: `node scripts/harness/check.mjs` passed after implementing all-status replacement candidates and the in-memory per-scene replacement chain.
- 2026-06-06: `npm run smoke` passed against the already-running local dev server at `http://127.0.0.1:5173/` after replacement-chain implementation.
- 2026-06-06: `node scripts/harness/check.mjs` passed after converting the scene replacement workspace to an infinite canvas.
- 2026-06-06: `npm run smoke` passed against the already-running local dev server at `http://127.0.0.1:5173/` after the infinite-canvas workspace conversion.
- 2026-06-07: `node scripts/harness/check.mjs` passed while preparing the initial GitHub sync.

## Next Steps

1. Review the infinite-canvas replacement workspace in the browser at `http://127.0.0.1:5173/`, including pan, zoom, object drag, and corner resize.
2. Confirm text model response format for recognition JSON.
3. Confirm RunningHub nodeInfoList mapping for the image-to-image workflow.
4. Confirm persistence strategy for assets, uploaded scenes, scene history, detection-box edits, replacement chains, masks, generated images, and job history.
5. Add browser interaction tests for scene upload, pan/zoom, detection-box drag/resize, and replacement-chain flows after the first product review.
