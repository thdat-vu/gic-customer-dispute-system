# GCI Dispute Outcome Tracking Tool

A small internal tool for support/fraud analysts to find dispute cases, record or correct their
final outcome, inspect Manager-only audit history, and review aggregate outcome trends.

## Stack and architecture

- **Frontend:** Next.js 16, TypeScript, React functional components/hooks, and local shadcn UI
  component sources.
- **Backend:** FastAPI, SQLAlchemy, and SQLite.
- **Data:** `seed_dataset.csv` is the immutable 220-row assessment dataset.

The browser calls FastAPI directly at `http://localhost:8000/api`; CORS permits the local
Next.js origin. The backend is deliberately small and layered:

```text
React UI → FastAPI routes → services → repositories → SQLite
```

The service layer owns capture/correction and audit rules. SQLite is appropriate for this
local, bounded assessment; no BFF, authentication service, queue, cache, migration tool, or
deployment infrastructure is required.

## Prerequisites

- Python 3.14+ and [uv](https://docs.astral.sh/uv/)
- Node.js 22+ and npm

## Run locally

From a fresh clone, use two terminals.

### 1. Backend

```bash
cd backend
uv sync
uv run python -m app.seed
uv run fastapi dev main.py
```

The backend runs at `http://localhost:8000`; Swagger UI is at
`http://localhost:8000/docs`.

`uv run python -m app.seed` is an explicit, one-time setup step for a new local database. It
creates `backend/data/app.db` and imports all 220 source rows. Do **not** run it again after
recording local outcomes: the seed importer intentionally preserves every source row and is not
an idempotent reset command.

### 2. Frontend

```bash
cd frontend
npm ci
npm run dev
```

Open `http://localhost:3000`.

No `.env` file is required for the assessment's local configuration. The frontend's API base URL
is the documented local FastAPI URL.

## What is implemented

- Browse the 220 seeded cases newest-first with one-based pagination (20 rows per page); search
  one selected field at a time and optionally filter exact status/region plus an inclusive
  `created_at` month range. The UI initializes the range from January of the current UTC year
  through the current UTC month; use Reset to return to those defaults or clear month bounds to
  browse all seeded rows.
- List rows display user ID and device ID, with email masked; search and case detail retain full
  supplied values.
- View full case detail using the surrogate record `id`; duplicate display `case_id` values are
  preserved from the supplied data.
- Flag known historical source anomalies with a separate read-only Data issue badge and detail
  explanation. The `Data issues only` filter applies before pagination. It does not clean data or
  add a third case workflow status.
- Analyst outcome capture and correction using `won`, `lost`, or `fraud_confirmed`, with an
  optional note (up to 1000 characters). A no-op correction creates no audit noise.
- UI-only Acting-as switcher: Analyst sees outcome editing; Manager sees read-only history.
  This is not authentication or authorization.
- Manager audit history shows captured/corrected events most-recent-first.
- Both roles can view read-only outcome trends by month or region, including loading, error, and
  zero-resolved-case states.
- FastAPI routes for list/search, detail, outcome capture/correction, history, and trends, with
  the documented shared error envelope.
- Seed import preserves all 220 supplied rows and known anomalies rather than cleaning them.

## Intentionally skipped / deferred

- Real authentication or authorization: explicitly out of scope; role is a local UI simulation.
- Alternate `resolved_at` trend axis and additional filters: deferred P2/stretch work for the
  time-boxed assessment.
- Case deletion, bulk editing/import, notifications, real-time updates, fraud decisioning,
  Docker/CI/CD/deployment, caching, and microservices: not required by the assignment.
- Charting: the trend view uses a compact table, which meets the required count visibility
  without adding a charting dependency.

## API summary

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/cases` | List cases or search one selected field |
| `GET` | `/api/cases/{id}` | Read one case detail |
| `POST` | `/api/cases/{id}/outcome` | Capture or correct an outcome |
| `GET` | `/api/cases/{id}/history` | Read audit history |
| `GET` | `/api/trends?group_by=month\|region` | Read outcome counts |

See `docs/06-api-contracts.md` or local Swagger UI for request/response detail.

## Validation and tests

```bash
# Backend: focused business-rule and API integration tests
cd backend
uv run pytest

# Frontend: lint and production compilation
cd ../frontend
npm run lint
npm run build
```

The backend test suite covers the highest-value rules: capture, correction, no-op audit behavior,
outcome validation, seed anomalies/CSV parsing, trend aggregation, error envelopes, search, and
history ordering. No frontend test runner was added because frontend tests are P2 in the
time-boxed test strategy; lint and production compilation are run instead.

## Further documentation

- Product and acceptance criteria: `docs/02-srs.md`
- Architecture: `docs/04-architecture.md`
- Data model: `docs/05-data-model.md`
- API contract: `docs/06-api-contracts.md`
- Test strategy: `docs/08-test-strategy.md`
- Implementation tracker: `PROJECT_STATUS.md`
