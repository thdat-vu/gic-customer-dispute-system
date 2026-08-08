# Project Status

Last reviewed: 2026-08-08  
Plan tracked: [`docs/09-implementation-plan.md`](docs/09-implementation-plan.md)

This file is a factual delivery tracker. It records completed work only when there is code,
test, command-output, or Git-history evidence. It does not replace the specification or expand
scope.

## Current position

**Milestone 1 is complete.** The next approved implementation work is **Milestone 2 — Backend
core business logic**.

| Milestone | Status | Evidence | Definition of Done status |
|---|---|---|---|
| 0 — Repo scaffold | Complete | `0b74daf feat: init base project`; `backend/` FastAPI scaffold and `frontend/` Next.js App Router scaffold | Backend and frontend development servers were verified during setup. |
| 1 — Backend data layer | Complete | `e0fb8f3 feat: add backend data layer`; `backend/app/models/`, `backend/app/seed.py`, `backend/tests/test_seed.py` | Seed command created 220 SQLite records; query confirmed 220 total, two `CASE-00213` rows, and one NULL `user_id`; pytest passed 2/2. |
| 2 — Backend core business logic | Not started | No `services/` implementation or capture/correct tests yet | Pending FR-4/FR-5 logic and P0 business-rule tests. |
| 3 — Backend API layer | Not started | No API routers, schemas, error envelope, CORS, or integration tests yet | Pending all five documented endpoints and P1 API tests. |
| 4 — Frontend list/search + case detail | Not started | No product UI implementation yet | Pending FR-1/FR-2/FR-3/FR-8 end-to-end against the backend. |
| 5 — Frontend outcome + history | Not started | No outcome form or history UI yet | Pending capture/correct and Manager-only history flow. |
| 6 — Frontend trend view | Not started | No trend UI or aggregation display yet | Pending monthly trend view and empty state. |
| 7 — README + polish | Not started | README has current local run, seed, and test instructions, but the final handoff audit has not occurred | Pending complete implemented/skipped scope, architecture explanation, and clean-checkout verification. |

## Completed implementation evidence

### Milestone 0 — Repo scaffold

- FastAPI, SQLAlchemy, and pytest are declared in `backend/pyproject.toml`.
- Next.js TypeScript App Router is present under `frontend/`.
- The initial project scaffold was committed as `0b74daf feat: init base project`.

### Milestone 1 — Backend data layer

- `Case` uses the documented surrogate integer `id`; `case_id` remains indexed and non-unique.
- `OutcomeAuditEntry` references `case.id` and constrains its documented event types.
- The explicit command `cd backend && uv run python -m app.seed` creates
  `backend/data/app.db` and imports the source CSV with UTF-8/RFC4180 parsing.
- Seed tests preserve the known historical data anomalies, including duplicate `CASE-00213`,
  NULL `CASE-00218.user_id`, `CASE-00215.outcome = "maybe"`, and an embedded-comma note.
- Validation recorded at implementation time:

  ```text
  cd backend && uv run python -m app.seed  # Seeded 220 case records into SQLite.
  cd backend && uv run pytest              # 2 passed
  sqlite3 data/app.db ...                  # 220|2|1
  git diff --check                         # passed
  ```

## Supporting preparation (not an implementation milestone)

- Specification and architecture documents were added in `204c7ef docs: add documents [DatVT]`.
- The UI visual source and reference assets were added in `c0d90c0 feat: add design template`.
  They guide later frontend work only; product behavior remains governed by `GIC.md` and
  `docs/*.md`.
- AI-use evidence is maintained separately in `ai-usage-log.md`; it is not proof that a
  milestone is complete.

## Next work boundary

Start only Milestone 2. Implement the capture/correct service rules and their P0 tests without
adding API routes or frontend features. Re-run this tracker after the milestone's Definition of
Done is demonstrably met.

## Update rules

- Update this file after a milestone is completed, blocked, or materially re-scoped.
- Cite a commit and/or repeatable validation command for each status change.
- Mark partially prepared work as **Not started** until its documented Definition of Done is met.
- Never use this tracker to override `GIC.md` or `docs/*.md`.
