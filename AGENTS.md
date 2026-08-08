# Repository Instructions

This is a time-boxed GCI dispute-outcome technical assessment. Read this file and the relevant project Skill before work.

## Sources of truth

- Original assignment and seed source: `GIC.md`; extracted data: `seed_dataset.csv`.
- Problem/scope: `docs/00-problem-statement.md`, `docs/01-product-scope.md`.
- Functional and non-functional requirements: `docs/02-srs.md`.
- Domain/data model: `docs/03-domain-model.md`, `docs/05-data-model.md`.
- Architecture/API/security: `docs/04-architecture.md`, `docs/06-api-contracts.md`, `docs/07-security.md`.
- Tests and delivery sequence: `docs/08-test-strategy.md`, `docs/09-implementation-plan.md`.
- Submission requirements: `GIC.md`; never silently modify `submission-draft.md` or `ai-usage-log.md`.

## Delivery rules

- Implement exactly one milestone at a time from `docs/09-implementation-plan.md`.
- Do not invent requirements. If product behavior is ambiguous or documents conflict, stop and report `BLOCKED` with source, section, impact, and the human decision needed.
- Keep routes/schemas aligned with `docs/06-api-contracts.md` and persistence aligned with `docs/05-data-model.md`. Add tests for important acceptance criteria in `docs/02-srs.md` and `docs/08-test-strategy.md`.
- Prefer the smallest design. Do not add infrastructure, caching, queues, microservices, or speculative abstractions without a documented requirement or explicit justification.
- Report material decisions/tradeoffs for candidate review. Do not fabricate AI-use evidence or revise submission claims to fit code.
- Never commit secrets, credentials, local `.env` files, databases, or generated build artifacts.

## Verified commands

| Area | Canonical command |
|---|---|
| Backend install/sync | `cd backend && uv sync` |
| Backend development | `cd backend && uv run fastapi dev main.py` |
| Backend tests | `cd backend && uv run pytest` (once tests exist) |
| Frontend install | `cd frontend && npm ci` |
| Frontend development | `cd frontend && npm run dev` |
| Frontend lint | `cd frontend && npm run lint` |
| Frontend build | `cd frontend && npm run build` |

No backend formatter, linter, typechecker, database migration command, integration-test command, or root README command is configured yet. Add a command here only when its supporting configuration is added in the relevant implementation milestone.

## Resolved contract decisions

- Preserve all 220 seed rows. `case.id` is the surrogate primary key; `case_id` is indexed but may repeat. `user_id` is nullable for the blank historical seed value. See `docs/00-problem-statement.md` §9.1, `docs/02-srs.md` FR-2/FR-3/FR-9, and `docs/05-data-model.md`.
- `docs/06-api-contracts.md` §6 is the sole source of truth for API errors. Every 4xx/5xx response uses its shared envelope; `error.fields` is always present, `null` for non-validation errors, and an array for 422 validation errors.
