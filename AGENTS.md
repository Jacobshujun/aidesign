# aidesign Agent Protocol

## Project Name

aidesign

## Harness Fact Sources

`docs/harness/` is the only durable project context for AI collaboration.

- `docs/harness/project_brief.md`: confirmed project facts, scope, runtime facts, and pending confirmations.
- `docs/harness/feature_list.json`: feature state machine and evidence.
- `docs/harness/progress.md`: current focus, latest status, risks, verification history, and next steps.
- `docs/harness/handoff.md`: startup handoff for the next session.
- `docs/harness/decisions.md`: stable product, architecture, and deployment decisions.
- `docs/harness/verification.md`: baseline checks, automation coverage, and manual verification goals.
- `docs/harness/pitfalls.md`: known traps and validation risks.
- `docs/harness/architecture_rules.md`: module, data, deployment, and Harness boundaries.

Do not create or maintain a second project memory, TODO list, planning log, or parallel context system.

## Startup Protocol

Every new session must:

1. Read `AGENTS.md`.
2. Read `docs/harness/handoff.md`.
3. Read `docs/harness/progress.md`.
4. Read `docs/harness/feature_list.json`.
5. Read `docs/harness/decisions.md`.
6. When product scope, users, technology, runtime, data, or deployment facts matter, read `docs/harness/project_brief.md`.
7. Before finishing, read `docs/harness/verification.md`.
8. Before code or deployment changes, read `docs/harness/pitfalls.md` and `docs/harness/architecture_rules.md`.

## Work Protocol

- Work on one clear task at a time.
- Before editing files, state the affected files, expected behavior impact, and verification method.
- Do not perform unrelated refactors or formatting churn.
- Do not invent commands. Only run checks that exist in this repository or are documented in `docs/harness/verification.md`.
- Do not add dependencies unless the reason is explicit and alternatives have been considered.
- Do not add broad fallback code, wide `try/catch`, compatibility branches, silent error swallowing, polling, or default values merely to make behavior appear stable.

## Completion Protocol

After development, debugging, deployment, or important analysis:

1. Run the baseline verification from `docs/harness/verification.md`.
2. Update `docs/harness/progress.md`.
3. Update `docs/harness/handoff.md`.
4. Update `docs/harness/feature_list.json` when feature state or evidence changes.
5. Update `docs/harness/decisions.md`, `docs/harness/pitfalls.md`, `docs/harness/architecture_rules.md`, or `docs/harness/verification.md` only when a stable new fact appears.

## Boundary Rules

- Do not commit secrets, production configuration, local data, uploads, generated outputs, authentication logs, or private credentials.
- Do not treat local artifacts as durable product facts unless they are documented under `docs/harness/`.
- Deployment must use the single confirmed project deployment entrypoint once one exists. No deployment entrypoint is confirmed yet.
- Preserve user changes. Do not revert unrelated work.

## Quality Rules

- Fix the real cause of failures instead of hiding uncertainty with meaningless fallback logic.
- Prefer small, verifiable changes.
- Keep behavior, data ownership, and validation evidence explicit.
- A feature may be marked `done` only when `feature_list.json` contains concrete evidence.
