# Architecture Rules

## Module Boundaries

- `src/types.ts`: shared front-end domain types, including scene layers and in-memory scene replacement-chain records.
- `src/data.ts`: mock/demo furniture assets, detected objects, scene image URL, and initial jobs.
- `src/App.tsx`: current product UI and client-side interaction state.
- `src/api.ts`: browser-safe API client. It must not contain secrets.
- `src/styles.css`: global visual system and responsive layout.
- `server/`: local API proxy and provider adapters.
- `scripts/harness/*.mjs`: Harness validation and smoke scripts.

## Frontend Rules

- The current frontend stack is Vite + React + TypeScript.
- Keep mock data in `src/data.ts` until a real API boundary exists.
- Keep shared UI/domain types in `src/types.ts`.
- Use lucide-react icons for tool buttons when an icon exists.
- Do not introduce a second styling system without updating this file and `docs/harness/decisions.md`.

## Backend And API Rules

- `server/index.mjs` is the local API entrypoint.
- Provider adapters live under `server/providers/`.
- API keys must be read only from environment variables loaded by `server/config.mjs`.
- Browser code must call relative `/api/...` routes and must not call provider endpoints directly with secrets.
- Do not introduce external service calls into baseline verification unless there is a safe isolated test path.

## Data Rules

- No database, upload directory, image storage path, or metadata persistence exists yet.
- Browser uploads currently use object URLs and are not persisted.
- Scene replacement chains currently live in React/browser memory and are not persisted.
- Future user uploads, generated files, model outputs, caches, and local databases must be excluded from Git unless intentionally checked in as tiny fixtures.

## Deployment Rules

- No deployment entrypoint is confirmed.
- Use only the confirmed deployment command once documented. Do not add alternate deployment paths without updating this file and `docs/harness/decisions.md`.

## Harness Rules

- `docs/harness/` is the only durable project context.
- `feature_list.json` is the feature state machine.
- `progress.md` and `handoff.md` must be updated after development, debugging, deployment, or important analysis.
- `verification.md` must describe only checks that can actually run in this repository.
