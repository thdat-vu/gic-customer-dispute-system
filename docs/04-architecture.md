# 04 — Architecture

**Status:** DRAFT — pending your review.
**Tech stack (your decision):** Backend = Python/FastAPI. Frontend = Next.js/TypeScript.
Monorepo containing `docs/`, `backend/`, `frontend/`.

Guiding principle applied throughout: no auth, no scale requirement, no deployment requirement
→ **no justification for a BFF, API gateway, message queue, or microservices split.** One
backend service, one frontend app, talking directly over HTTP/JSON.

---

## 1. Repository layout (monorepo, no cross-language build tool)

```
repo/
├── docs/                     # all phase documents (this checkpoint's output + earlier ones)
├── backend/                  # FastAPI service, own Python environment (venv/poetry, your choice at build time)
│   ├── app/
│   │   ├── main.py           # FastAPI app instance, CORS config, router mounting
│   │   ├── api/               # route handlers (thin — validate input, call services, shape response)
│   │   ├── schemas/           # Pydantic request/response models (this doubles as the OpenAPI/Swagger source)
│   │   ├── services/          # business/domain logic: capture/correct outcome rules, audit-on-change-only logic
│   │   ├── data_quality.py    # pure read-time diagnostic rules shared by list filtering and response shaping
│   │   ├── repositories/      # data access layer (SQL queries), isolated so services stay storage-agnostic
│   │   ├── models/            # SQLAlchemy table definitions
│   │   └── seed.py            # one-off script to load seed_dataset.csv into SQLite
│   ├── tests/
│   └── requirements.txt / pyproject.toml
├── frontend/                 # Next.js app, own package.json
│   ├── app/                   # Next.js App Router (resolved below — not Pages Router)
│   ├── components/
│   ├── lib/api.ts             # thin fetch wrapper around backend endpoints
│   └── package.json
└── README.md                 # top-level: how to run backend + frontend together
```

**No unified monorepo tool** (no Turborepo/Nx/Lerna) — Python and Node ecosystems don't share
one naturally, and pulling one in isn't justified for a 2-service local project. `backend/` and
`frontend/` are just two independently-runnable folders under one Git repo. README documents
running them in two terminals.

> ⚠️ ASSUMPTION: Next.js App Router (not Pages Router), since it's the current default for new
> Next.js projects and this app has no legacy constraint pulling it toward Pages Router. Flag if
> you have a preference.

---

## 2. Backend architecture (FastAPI)

Layered, single-process, single-file-database:

```
HTTP request
   │
   ▼
api/ (route handlers)        — parse/validate request via Pydantic schemas, call services, map errors to HTTP status
   │
   ▼
services/ (domain logic)     — enforces INV-1..INV-5, FR-4/FR-5 capture-vs-correct + no-op audit rule, FR-7 aggregation,
                               and optional FR-10 diagnostic filtering before pagination
   │
   ▼
repositories/ (data access)  — SQL via SQLAlchemy, no business logic here
   │
   ▼
SQLite file (backend/data/app.db)
```

### 2.1 Historical data-quality read flow

`app/data_quality.py` is a pure read-time rule module shared by response shaping and the
optional list filter. It evaluates the documented canaries from existing record values plus the
repository's grouped duplicate-`case_id` lookup. It returns reason codes; it does not write to
SQLite or alter a case's business `status`.

```
GET /api/cases?has_data_quality_issue=true
   │
   ▼
route validates query → service fetches already-search/month/status/region-filtered records
   │                                              │
   │                                              └→ repository supplies duplicate case_id set
   ▼
data_quality.py derives issue codes → service retains matching records → pagination → response schema
```

When the diagnostic filter is omitted, the normal repository `limit`/`offset` path is used.
When it is present, the bounded 220-row candidate set is evaluated first so `total` and pages
describe the filtered result set. This small in-memory step is intentional for the assessment;
no generalized query framework or persisted quality state is needed.

**Why this split matters for grading/maintainability (NFR 4.5):** the "audit entry only on
actual change" rule (FR-5) and "no DB-level outcome enum, API-level only" rule (FR-9) are
*business* decisions, not framework mechanics — keeping them in `services/` (plain Python,
testable without spinning up FastAPI or a real HTTP call) is what makes them cheaply testable
per Phase 8.

### 2.2 API documentation for the coding agent
FastAPI auto-generates an OpenAPI schema (`/openapi.json`) and Swagger UI (`/docs`) directly
from the Pydantic schemas and route definitions — **this becomes the machine-readable source of
truth** for the API contract. `06-api-contracts.md` will contain the human-readable version
matching it, but the two must stay in sync; the OpenAPI JSON is what an autonomous agent should
actually parse, not the markdown.

### 2.3 Storage
- SQLite file, per brief's "no real database required."
- SQLAlchemy ORM for table definitions and queries (readable, testable, avoids raw string SQL
  scattered across the codebase).
- No migration tool (Alembic, etc.) — tables are created directly from SQLAlchemy models on
  startup (`Base.metadata.create_all()`), since there's no production deployment or evolving
  schema history to manage in this scope.

### 2.4 Seed loading
**Resolved (assumption):** seed loading is an **explicit, separate step** (`python -m
app.seed` or equivalent CLI command), run once during setup per the README — **not** automatic
on every backend startup. Rationale: automatic reseeding on every restart risks either
duplicate rows (if not idempotent) or silent data loss (if it wipes and reloads every time),
neither of which is desirable once an Analyst has captured real outcomes during local testing.
Flag if you'd rather it auto-seed only when the database file doesn't yet exist (a middle
ground) — reasonable alternative, just needs to be a conscious choice either way.

---

## 3. Frontend architecture (Next.js/TypeScript)

- Client-side data fetching: the browser calls the FastAPI backend **directly** (e.g.
  `http://localhost:8000/api/...`), no Next.js API routes acting as a proxy — there's no reason
  to add that hop given no auth/session to broker.
- Server-side rendering (SSR) or static generation are **not needed** for an internal tool with
  no SEO/first-paint requirements — plan for straightforward client components (`'use client'`)
  fetching on mount/interaction. This keeps the mental model close to "plain React," satisfying
  the brief's "React functional components + hooks" requirement even though the framework is
  Next.js.
- Role switcher state: local React state (or a small context), reset on reload per SRS §2 (no
  persistence).

**CORS:** since frontend (`localhost:3000`) and backend (`localhost:8000`) are different
origins in local dev, FastAPI's `CORSMiddleware` must allow the frontend's origin. Documented
here so it's not forgotten when the API contract is implemented — a "why can't my frontend
reach the API" failure mode is easy to lose time to otherwise.

---

## 4. What this architecture deliberately does NOT include, and why

| Excluded | Why |
|---|---|
| Authentication/session layer | Explicitly excluded by brief; role is UI-only (SRS §1) |
| API gateway / BFF | Only one frontend, one backend — no aggregation need |
| Message queue / async workers | No background processing exists in any FR |
| Caching layer | Dataset is 220 rows; not a performance problem |
| Migration tooling | No evolving production schema to manage |
| Separate microservices | Single bounded context (Case + its audit trail) — splitting would add operational overhead with zero benefit here |

---

## 5. Implemented post-core decisions

- **Pagination (implemented post-core):** repositories apply `limit`/`offset` after the shared
  search/month/status/region-filter statement; the API validates one-based `page`, capped
  `limit`, and month bounds; the frontend renders Previous/Next and direct page controls.
  Contract details are in
  `06-api-contracts.md` §1.
- **Historical data-quality indicator (implemented post-core):** `app/data_quality.py` evaluates
  documented anomaly rules and duplicate external IDs. It decorates API responses and supports
  the optional list diagnostic filter before pagination; no database column, migration,
  case-status value, or data-cleaning write path is introduced.
