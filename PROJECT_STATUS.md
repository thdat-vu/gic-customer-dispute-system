# Project Status

Last reviewed: 2026-08-08  
Plan tracked: [`docs/09-implementation-plan.md`](docs/09-implementation-plan.md)

This file is a factual delivery tracker. It records completed work only when there is code,
test, command-output, or Git-history evidence. It does not replace the specification or expand
scope.

## Current position

**Milestone 3 is complete.** The next approved implementation work is **Milestone 4 — Frontend
list/search + case detail**.

| Milestone | Status | Evidence | Definition of Done status |
|---|---|---|---|
| 0 — Repo scaffold | Complete | `0b74daf feat: init base project`; `backend/` FastAPI scaffold and `frontend/` Next.js App Router scaffold | Backend and frontend development servers were verified during setup. |
| 1 — Backend data layer | Complete | `e0fb8f3 feat: add backend data layer`; `backend/app/models/`, `backend/app/seed.py`, `backend/tests/test_seed.py` | Seed command created 220 SQLite records; query confirmed 220 total, two `CASE-00213` rows, and one NULL `user_id`; pytest passed 2/2. |
| 2 — Backend core business logic | Complete | `62adc70 feat: add outcome business logic` | Capture/correct/no-op, validation-boundary, seed, CSV parsing, and monthly resolved-trend P0 tests passed (7/7). |
| 3 — Backend API layer | Complete | Current working-tree evidence: `backend/app/api/`, API schemas, routes, handlers, and `backend/tests/test_api.py` | Five documented routes appear in OpenAPI; shared errors/CORS work; P1 integration tests pass. Commit pending. |
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

### Milestone 2 — Backend core business logic

- `record_outcome` uses the case's current `status` to capture an open case or correct a
  resolved one. The write and its append-only audit entry commit together.
- Corrections retain previous/new outcome and note values. Identical resolved-case submissions
  return unchanged without an audit entry.
- `OutcomeSubmission` is the minimal Pydantic validation boundary approved for this milestone:
  it accepts only `won`, `lost`, or `fraud_confirmed`, caps notes at 1000 characters, and leaves
  `editor_role` as an unvalidated required string. It adds no HTTP route.
- `monthly_resolved_outcome_counts` counts only resolved records in `created_at` month buckets.
- Validation recorded at implementation time:

  ```text
  cd backend && uv run pytest tests/test_outcome_service.py tests/test_trend_service.py  # 5 passed
  cd backend && uv run pytest                                                            # 7 passed
  git diff --check                                                                       # passed
  ```

### Milestone 3 — Backend API layer

- All five `/api` endpoints are mounted as thin handlers over services/repositories: list/search,
  detail, capture/correct, history, and month/region trends.
- Every implemented 4xx/5xx handler returns the documented `{ error: { code, message, fields } }`
  shape. `fields` is always present; validation errors contain field entries and non-validation
  errors return `null`.
- CORS permits only the documented local frontend origin, `http://localhost:3000`.
- OpenAPI response schemas explicitly document the shared error envelope rather than FastAPI's
  raw `HTTPValidationError` format.
- Validation recorded at implementation time:

  ```text
  cd backend && uv run pytest tests/test_api.py  # 9 passed
  cd backend && uv run pytest                    # 16 passed
  git diff --check                               # passed
  uv run fastapi dev main.py --host 127.0.0.1 --port 8001  # OpenAPI inspected; server stopped
  ```

## Supporting preparation (not an implementation milestone)

- Specification and architecture documents were added in `204c7ef docs: add documents [DatVT]`.
- The UI visual source and reference assets were added in `c0d90c0 feat: add design template`.
  They guide later frontend work only; product behavior remains governed by `GIC.md` and
  `docs/*.md`.
- AI-use evidence is maintained separately in `ai-usage-log.md`; it is not proof that a
  milestone is complete.

## Next work boundary

Start only Milestone 4. Implement the approved frontend list/search, case detail, and local role
switcher against the real API. Read `DESIGN.md` and `design-reference/` first; do not add outcome
editing, history, or trends UI yet.

## Update rules

- Update this file after a milestone is completed, blocked, or materially re-scoped.
- Cite a commit and/or repeatable validation command for each status change.
- Mark partially prepared work as **Not started** until its documented Definition of Done is met.
- Never use this tracker to override `GIC.md` or `docs/*.md`.
