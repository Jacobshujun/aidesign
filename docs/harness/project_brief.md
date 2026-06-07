# Project Brief

## Project Name

aidesign

## Project Goal

Build a Web application for an AI furniture workflow with two core capabilities:

- 家具单品素材库
- 场景图中的家具单品识别与替换

The current implementation is a client-side MVP with mock data and in-memory uploads. It does not yet call a real AI/model API or persist user data.

AI provider foundation has been added through a local Node proxy. API keys must stay in local environment variables and must not be exposed to the browser.

## Project Path

`/Users/haipingwang/Desktop/aidesign`

## Target Users

- 家具/家居内容运营人员
- 室内设计或软装设计人员
- 电商视觉或商品素材管理人员

## Main Flow

1. 用户在工作台导入场景图，场景进入历史场景库。Current MVP keeps scene history in browser memory.
2. 系统展示场景中的家具识别框。Current MVP can use mock recognition data from `src/data.ts` or AI recognition through the local proxy.
3. 用户可以人工编辑识别框，包括新增、删除、修改名称/品类、调整位置和尺寸。
4. 用户选择需要替换的家具单品。
5. 用户从家具单品素材库选择替换素材。Furniture uploads may start as `待标注`, and `待标注` / `需抠图` assets may participate in generation.
6. 系统生成替换后的场景图预览。Current MVP renders a client-side mock preview overlay.
7. 用户可在同一张场景图中连续替换多个单品，Current MVP keeps the replacement chain in browser memory.

## Technology Stack And Runtime Entry Points

Confirmed product stack:

- Vite
- React
- TypeScript
- lucide-react icons
- Plain CSS in `src/styles.css`
- Node.js built-in HTTP server for local AI proxy

Confirmed npm scripts:

- `npm run dev`
- `npm run dev:web`
- `npm run dev:api`
- `npm run build`
- `npm run preview`
- `npm run smoke`
- `npm run harness`

Confirmed Harness entrypoints:

- `scripts/harness/init.mjs`
- `scripts/harness/handoff.mjs`
- `scripts/harness/check.mjs`
- `scripts/harness/init.ps1`
- `scripts/harness/handoff.ps1`
- `scripts/harness/check.ps1`

Confirmed local development tool:

- Node.js `v24.16.0`

## Page, API, And CLI Entry Points

Product page entrypoint:

- `index.html`
- `src/main.tsx`
- `src/App.tsx`
- `src/api.ts`

Product API proxy entrypoints:

- `server/index.mjs`
- `server/providers/textModel.mjs`
- `server/providers/runningHub.mjs`

Local API routes:

- `GET /api/health`
- `GET /api/ai/config`
- `POST /api/ai/chat`
- `POST /api/ai/recognize-scene`
- `GET /api/runninghub/node-info`
- `POST /api/runninghub/run`
- `POST /api/runninghub/outputs`
- `POST /api/runninghub/upload`

Confirmed CLI-like Harness entrypoint:

```bash
node scripts/harness/check.mjs
```

Confirmed local HTTP smoke entrypoint:

```bash
npm run smoke
```

## Runtime Data Directories

Current runtime data behavior:

- Mock furniture and scene data live in `src/data.ts`.
- Uploaded scene images, scene history, detection-box edits, replacement chains, and asset images are held in browser memory through object URLs and React state.
- No upload directory, database, cache, or generated-output directory is used by the MVP.
- `uploads/`, `generated/`, and `local-data/` are ignored in `.gitignore` for future local data.
- AI provider endpoints and non-secret defaults are documented in `.env.example`.
- Local API keys belong in `.env.local`, which is ignored by `.gitignore`.

## Sensitive Files And Data

No sensitive files were found during the initial audit because the repository had no files before Harness initialization.

Future sensitive data that must not be committed:

- API keys and model provider credentials
- Production configuration
- User uploads and generated images
- Local databases, caches, and logs
- Authentication or session logs

## Product And Data Rules

- Furniture assets currently use the `FurnitureAsset` type in `src/types.ts`.
- Scene history items currently use the `SceneSource` type in `src/types.ts`.
- Detected scene objects currently use the `DetectedObject` type in `src/types.ts`.
- Replacement jobs currently use the `ReplacementJob` type in `src/types.ts`.
- Per-scene replacement chains currently use the `SceneReplacement` type in `src/types.ts`.
- Current data is mock/demo data and must not be treated as production catalog data.
- User uploads are not persisted in the current MVP.
- Scene images and furniture item assets are separate upload flows.
- Furniture item uploads may enter the asset library as `待标注`.
- `待标注` and `需抠图` assets may participate in scene replacement generation.
- Detection boxes are user-editable in the current front-end MVP.
- A scene can have multiple replacement nodes in one in-memory chain.
- Frontend code must not read model API keys directly.
- The local proxy exposes provider status without returning secrets.

## Deployment Facts

No deployment target, CI configuration, or production hosting entrypoint is confirmed yet.

## Uncovered Or Pending Confirmations

- Confirm backend/API approach, if any.
- Confirm final text model request schema for `https://right.codes/codex/v1`.
- Confirm RunningHub nodeInfoList/input mapping for WebApp ID `2004543527918551041`.
- Confirm storage for source images, masks, generated images, and metadata.
- Confirm production testing strategy beyond build and HTTP smoke.
- Confirm deployment target.
