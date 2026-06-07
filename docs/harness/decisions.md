# Decisions

## Stable Decisions

- 2026-06-06: `docs/harness/` is the only durable project context for AI collaboration.
- 2026-06-06: Baseline verification must use only commands and files that exist in the repository.
- 2026-06-06: Product technology stack and local runtime/build commands are confirmed; deployment target and deployment command are not confirmed yet.
- 2026-06-06: Local Harness baseline uses Node.js because this macOS environment has `node v24.16.0` and does not have `powershell` or `pwsh`.
- 2026-06-06: First product implementation uses Vite + React + TypeScript with plain CSS and lucide-react icons.
- 2026-06-06: First MVP is client-only with mock recognition/replacement data and browser-memory uploads.
- 2026-06-06: Default Harness baseline includes `npm run build`; HTTP smoke is available as a separate command because it requires a running dev server.
- 2026-06-06: Model provider calls must go through the local Node API proxy; API keys must not be exposed to frontend code.
- 2026-06-06: Provider endpoints and model identifiers are environment-driven through `.env.local` and `.env.example`.
- 2026-06-06: Scene images and furniture item assets are distinct import concepts. Scene images belong to the replacement workspace and need a history library; furniture item uploads belong to the item asset library and may start as `待标注`.
- 2026-06-06: Scene recognition boxes need manual editing after recognition, including adding boxes, deleting boxes, changing category/label, and adjusting box geometry.
- 2026-06-06: `待标注` and `需抠图` furniture assets are allowed to participate in scene replacement generation, with status cues instead of blocking behavior.
- 2026-06-06: A single scene can support a continuous multi-item replacement chain in the front-end MVP; the chain is currently browser-memory state.
- 2026-06-06: The scene replacement workspace should use an infinite-canvas-style interaction surface for the front-end MVP, including pan/zoom controls and direct manipulation of detection boxes.
- 2026-06-07: The Git collaboration remote is `origin = git@github.com:Jacobshujun/aidesign.git`, with local development starting from branch `main`.

## Pending Decisions

- Backend/API architecture, if needed.
- Exact AI model payload/response schemas.
- Image and metadata storage strategy.
- Deployment target and deployment command.
