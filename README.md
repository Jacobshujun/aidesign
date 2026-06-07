# aidesign

aidesign is a Vite + React + TypeScript Web MVP for an AI furniture workflow: a furniture asset library and a scene-image furniture recognition/replacement workspace.

## Development

Install dependencies:

```bash
npm install --cache .npm-cache
```

Run the local app:

```bash
npm run dev
```

Build:

```bash
npm run build
```

Run HTTP smoke while the dev server is running:

```bash
npm run smoke
```

## Harness

New AI sessions should restore context from:

- `AGENTS.md`
- `docs/harness/handoff.md`
- `docs/harness/progress.md`
- `docs/harness/feature_list.json`
- `docs/harness/decisions.md`
- `docs/harness/project_brief.md` when product or technical scope matters

Baseline verification:

```bash
node scripts/harness/check.mjs
```

PowerShell wrappers are also kept for environments with PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/harness/check.ps1
```

`docs/harness/` is the only durable project context. Do not create parallel memory files, TODO files, planning logs, or alternate handoff systems.
