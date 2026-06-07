# Pitfalls

## Known Repository Pitfalls

- The repository was empty during Harness initialization. Do not assume any framework, runtime, test command, or deployment target exists.
- No Git repository was detected during the initial audit.
- No README, configuration file, source entrypoint, test script, deployment script, runtime data directory, or sensitive file was present before Harness initialization.
- `npm install` with the default user cache failed once because `~/.npm` contains root-owned files. Use `npm install --cache .npm-cache` for this project unless the user fixes the global npm cache.

## Integration Pitfalls

- Do not call external AI/model/production services from the default baseline unless a safe isolated test path is confirmed.
- Do not store user uploads, generated images, masks, caches, or credentials in Git.
- Current MVP uses remote Unsplash images for mock visuals; production asset storage is not designed yet.
- Current uploaded images are browser object URLs only and are lost on refresh.
- Do not put model API keys in `VITE_*` variables or frontend code; Vite exposes those to the browser.
- RunningHub image-to-image calls require confirmed `nodeInfoList` mapping for the selected WebApp before production use.

## Verification Pitfalls

- The current macOS environment does not have `powershell` or `pwsh`; use `node scripts/harness/check.mjs` as the local baseline unless PowerShell is installed later.
- Python Playwright is not installed in this environment; browser automation is not part of the current baseline.
- `.env.local` is intentionally ignored and may contain local secrets. Do not copy it into docs or examples.
- The local Node API proxy reads `.env` and `.env.local` at startup; restart `npm run dev` after changing local environment variables.
- Do not add placeholder `npm test`, `pytest`, or deployment checks before the corresponding files and commands exist.
- Do not mark a feature `done` without evidence in `docs/harness/feature_list.json`.
- Do not hide uncertainty with broad fallback code, silent `catch`, polling loops, or default values.
