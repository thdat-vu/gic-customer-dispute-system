# Project Status

Last reviewed: 2026-08-09
Plan tracked: [`docs/09-implementation-plan.md`](docs/09-implementation-plan.md)

This file is a factual delivery tracker. It records completed work only when there is code,
test, command-output, or Git-history evidence. It does not replace the specification or expand
scope.

## Current position

**All core implementation milestones (0–7) are complete.** Approved pagination, list-email
masking, and read-only historical data-quality visibility are complete; only
`resolved_at`/alternate trend axis remains deferred.

| Milestone | Status | Evidence | Definition of Done status |
|---|---|---|---|
| 0 — Repo scaffold | Complete | `0b74daf feat: init base project`; `backend/` FastAPI scaffold and `frontend/` Next.js App Router scaffold | Backend and frontend development servers were verified during setup. |
| 1 — Backend data layer | Complete | `e0fb8f3 feat: add backend data layer`; `backend/app/models/`, `backend/app/seed.py`, `backend/tests/test_seed.py` | Seed command created 220 SQLite records; query confirmed 220 total, two `CASE-00213` rows, and one NULL `user_id`; pytest passed 2/2. |
| 2 — Backend core business logic | Complete | `62adc70 feat: add outcome business logic` | Capture/correct/no-op, validation-boundary, seed, CSV parsing, and monthly resolved-trend P0 tests passed (7/7). |
| 3 — Backend API layer | Complete | `83c8551 feat: add dispute API endpoints` | Five documented routes appear in OpenAPI; shared errors/CORS work; P1 integration tests pass. |
| 4 — Frontend list/search + case detail | Complete | `c69b49d feat: add case management interface` | Browse/search, read-only detail, loading/empty/error states, and UI-only role switcher run against the real API; lint/build passed. |
| 5 — Frontend outcome + history | Complete | `fbefce6 feat: add outcome management interface` | Analyst capture/correction calls the real API with client validation; Manager-only history is fetched/rendered and role switch changes the affordance without reload. |
| 6 — Frontend trend view | Complete | `4ebc05e feat: add outcome trend view` | Both roles can open Month/Region grouping, see outcome counts or explicit loading/error/empty states; local SQLite/API spot-check matches the visible monthly values. |
| 7 — README + polish | Complete | `a74bdbe feat: add paginated case filters` | README contains verified local install/run/test commands, architecture, implemented/deferred scope, and API summary. Install, lint, backend tests, and webpack compile passed; default Turbopack build is blocked by this sandbox's IPC-port policy. |
| Stretch — list refinement | Complete | `a74bdbe feat: add paginated case filters` | One-based 20-row pagination with numeric controls; January-to-current-month default bounds; exact status/region filters; Reset; and masked list email. |
| Post-core — data-quality indicator | Complete | Current working-tree evidence: response schemas, list/detail UI, and `backend/tests/test_api.py` | List/detail return read-only diagnostic issue codes; the Data issues-only filter applies before pagination. No source record is cleaned and business `status` stays `open`/`resolved`. Commit pending. |

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

### Milestone 4 — Frontend list/search + case detail

- The desktop-first Cases workspace uses the approved application shell, dense table, and
  right-side 480px detail sheet from `DESIGN.md`.
- The table fetches the documented current page from the real API, preserves newest-first server
  order, and submits a selected-field (`user_id`, `device_id`, or `email`) search to the same
  endpoint.
- Case navigation uses the surrogate integer `id`; the detail sheet shows the documented full PII
  and reference fields. It intentionally contains no editor or history section yet.
- Loading skeleton, no-cases, no-search-results, API-error, and detail-loading/detail-error
  states are rendered. The Acting as Select is local state and resets on page reload.
- shadcn CLI added only Button, Input, Select, Sheet, Table, Badge, Skeleton, and Separator;
  no shadcn MCP server was configured.
- Validation recorded at implementation time:

  ```text
  cd frontend && npm run lint   # passed
  cd frontend && npm run build  # passed
  git diff --check              # passed
  ```

### Milestone 5 — Frontend capture/correct outcome + history

- The shared `OutcomeEditor` is rendered only for the local Analyst role. It uses the same
  `POST /api/cases/{id}/outcome` request for both open-case capture and resolved-case
  correction; the API continues to determine the action from the current case status.
- Client validation blocks a missing outcome and applies the documented 1000-character maximum
  to the optional note. A successful response replaces the detail state and synchronizes the
  selected row's status/outcome in the list.
- Manager renders a History section only. It fetches `GET /api/cases/{id}/history` only when
  that role is active, then displays most-recent-first event type, timestamp, prior/new outcome,
  prior/new note, and editor role. A case without entries has an explicit empty state.
- Changing the existing UI-only role selector immediately swaps the editor and history section;
  no server-side authorization was introduced.
- Validation recorded at implementation time:

  ```text
  cd frontend && npm run lint                 # passed
  cd frontend && npm run build                # passed
  cd backend && uv run pytest tests/test_api.py  # 9 passed (one upstream deprecation warning)
  git diff --check                            # passed
  ```

### Milestone 6 — Frontend trend view

- The existing in-app Cases/Trends navigation now opens a read-only trend workspace without
  changing the UI-only acting role; both Analyst and Manager may view it.
- `TrendView` calls the existing `GET /api/trends` contract and renders the three documented
  outcome counts in a compact table. The grouping control exposes the already-supported `month`
  and `region` options; list-only Month start/end filtering is separate from trend aggregation.
- Loading, API error with retry, and the explicit zero-resolved-cases empty state are rendered.
  A table was chosen instead of a chart to keep the bounded assessment UI dependency-free while
  still providing the complete required outcome breakdown.
- Definition-of-Done spot check: with the immutable seed loaded locally, both SQLite and the
  actual FastAPI response returned `2026-01 = won 4 / lost 4 / fraud_confirmed 2`, through
  `2026-07 = won 4 / lost 0 / fraud_confirmed 2`.
- Validation recorded at implementation time:

  ```text
  cd frontend && npm run lint                 # passed
  cd frontend && npm run build                # passed
  cd backend && uv run python -m app.seed     # seeded 220 local records
  sqlite3 data/app.db <resolved-case trend query>  # matched monthly buckets
  cd backend && uv run python -c '<FastAPI TestClient trends request>'  # matched SQL values
  cd backend && uv run pytest                 # 16 passed (one upstream deprecation warning)
  git diff --check                            # passed
  ```

### Milestone 7 — README + polish

- The top-level README is now a standalone handoff: prerequisites, two-terminal local setup,
  explicit one-time seed warning, frontend/backend addresses, architecture, implemented scope,
  intentional deferrals, API summary, and validation commands.
- It explicitly states that the seed loader is not idempotent, preventing accidental duplicate
  local imports after outcomes have been recorded.
- Validation commands are documented only when present in the repository manifests: backend
  pytest and frontend lint/build. No test framework was added solely for documentation polish.
- Handoff validation recorded at implementation time:

  ```text
  cd backend && uv sync                     # passed
  cd backend && uv run pytest                # 16 passed (one upstream deprecation warning)
  cd frontend && npm ci                      # passed
  cd frontend && npm run lint                # passed
  cd frontend && npm run build -- --webpack  # passed
  cd frontend && npm run build               # blocked by sandbox IPC-port policy, not source error
  git diff --check                           # passed
  ```

### Approved stretch — pagination, month range, and list email masking

- `GET /api/cases` defaults to page 1 / 20 rows and validates `page >= 1`, `1 <= limit <= 20`,
  inclusive `created_at` month bounds, exact status, and case-insensitive exact region. Filters
  and search occur before newest-first paging; `total` remains the pre-page count.
- The Case table now exposes user ID and device ID for scanning, while masking email as first
  character + five asterisks + domain. The API, search request, and case detail retain full
  source values.
- The local SQLite database was explicitly reset after detecting accidental double-seeding:
  `backend/data/app.db` was removed with user approval, then seeded once. Verification returned
  exactly `220` records and two physical `CASE-00213` rows.
- The month controls reject an end month before the start month client-side; the backend retains
  the contract-level 422 validation for direct callers.
- The UI defaults its month range to January of the current year through the current month and
  provides direct numeric page buttons, Reset, Status, and Region controls. Browser URL query
  synchronization remains deliberately unimplemented because it is not a documented requirement.
- Validation recorded at implementation time:

  ```text
  cd backend && uv run pytest                 # 22 passed (one upstream deprecation warning)
  cd frontend && npm run lint                 # passed
  cd frontend && npm run build -- --webpack   # passed
  sqlite3 backend/data/app.db <count query>   # 220 records; CASE-00213 count = 2
  git diff --check                            # passed
  ```

### Post-core — historical data-quality indicator

- `GET /api/cases` and `GET /api/cases/{id}` now expose `has_data_quality_issue` and stable
  `data_quality_issues` codes. The diagnostic is computed at read time, including a grouped
  duplicate-`case_id` lookup, and is not persisted as a new column or workflow state.
- The Cases table adds an amber `Data issue` badge; the case sheet lists human-readable reasons
  while explicitly saying the outcome workflow remains unchanged. An All data / Data issues only
  selector sends the optional diagnostic query parameter and resets with the other list filters.
- The API integration test covers duplicate IDs, missing user ID, negative amount, future date,
  invalid outcome, and status/outcome mismatch while asserting that the case status is unchanged.
- Validation recorded for this refinement:

  ```text
  cd backend && uv run pytest                 # 24 passed (one upstream deprecation warning)
  cd frontend && npm run lint                 # passed
  cd frontend && npm run build -- --webpack   # passed
  git diff --check                            # passed
  ```

## Supporting preparation (not an implementation milestone)

- Specification and architecture documents were added in `204c7ef docs: add documents [DatVT]`.
- The UI visual source and reference assets were added in `c0d90c0 feat: add design template`.
  They guide later frontend work only; product behavior remains governed by `GIC.md` and
  `docs/*.md`.
- AI-use evidence is maintained separately in `ai-usage-log.md`; it is not proof that a
  milestone is complete.

## Next work boundary

Core implementation and the approved post-core refinements are complete. Do not start the
remaining `resolved_at` stretch automatically; next use `submission-audit` and complete the
external submission document/video links.

## Update rules

- Update this file after a milestone is completed, blocked, or materially re-scoped.
- Cite a commit and/or repeatable validation command for each status change.
- Mark partially prepared work as **Not started** until its documented Definition of Done is met.
- Never use this tracker to override `GIC.md` or `docs/*.md`.
