# GCI Dispute Outcome Tracking Tool

> Draft status: update the implementation evidence, commands, repository URL, video URL, and
> final AI before/after example before submitting. Do not claim a feature is complete until it
> has been implemented and validated.

## 1. Understanding & Assumptions

The problem is a data-capture and visibility gap, not a fraud-decisioning problem. Analysts
already determine whether a dispute was won, lost, or fraud-confirmed, but those decisions are
not consistently recorded in a queryable system. This tool provides a small workflow to find a
case, record or correct its outcome, and view aggregate trends.

Key assumptions and decisions:

- The UI has an “Acting as” Analyst/Manager switcher only; it is not authentication or a
  security boundary. The API records the supplied editor role but does not authorize it.
- Outcome corrections are allowed and append an audit entry only when outcome or note changes.
- Trends are grouped by the case `created_at` month. This is simple and matches the supplied
  data, but it is not a measure of when the outcome was recorded.
- The seed data is preserved as historical evidence, including malformed values. The schema is
  permissive at rest and validates new outcome writes at the application boundary.
- The 220 source rows are retained as 220 distinct records. A surrogate `id` identifies records;
  `case_id` remains a non-unique display field because one source ID is duplicated.

## 2. Requirements Analysis

### 2.1 Functional requirements

- List all cases newest-first and search one selected field (`user_id`, `device_id`, or email)
  using case-insensitive partial matching.
- Show read-only case detail using the surrogate record ID for navigation.
- Let an Analyst capture `won`, `lost`, or `fraud_confirmed` with an optional note; resolving a
  case creates a `captured` audit event.
- Let an Analyst correct a resolved case. A no-op submission must not alter the case or add audit
  noise.
- Let a Manager view per-case history in the UI; the history API remains role-agnostic because
  roles are a UI-only simulation.
- Show outcome counts by month, with a clear empty state when no resolved cases exist.

Current implementation evidence: the data layer, backend capture/correct service rules, and all
five documented HTTP endpoints are implemented and covered by focused P0/P1 tests. The Cases
list/search, detail, Analyst capture/correction, Manager-only audit-history UI, and read-only
trend table call the real API. The trend view supports the documented month and region groupings
and explicitly handles the zero-resolved-case state.

### 2.2 Non-functional requirements considered

- **Performance:** the bounded 220-row dataset does not justify caching, queues, or scaling work.
- **Data sensitivity:** email and device ID are visible in full in v1; this is an explicit
  time-boxed tradeoff, not a production privacy design.
- **Error handling:** every API error uses one envelope. Validation errors include structured
  field details; unexpected errors remain generic and non-leaky.
- **Maintainability:** business rules live in a service layer and are covered first by focused
  domain tests.
- **Data quality:** the CSV is parsed with an RFC4180-aware parser and UTF-8; duplicate external
  case IDs and a blank historical user ID are retained rather than silently “fixed.”

## 3. Design

### 3.1 Data model

`Case` uses an auto-increment integer `id` as its primary key. `case_id` is indexed but not
unique; `user_id` is nullable to preserve the provided blank historical value. Other case fields
are immutable reference data in this tool. `status`, `outcome`, and `outcome_note` are the only
mutable case fields.

`OutcomeAuditEntry` is append-only and references `Case.id` through `case_ref_id`. It records the
event type, prior/new outcome and note, supplied editor role, and timestamp. `outcome` has no
database CHECK constraint so the historical `maybe` seed value imports unchanged; new API writes
accept only the three supported outcome values.

The completed service layer captures an open case by resolving it and adding one `captured`
entry. It corrects a resolved case only when outcome or note differs, adding one `corrected`
entry with prior/new values; an identical submission adds no audit entry.

### 3.2 API contract

- `GET /api/cases` lists or single-field-searches cases.
- `GET /api/cases/{id}` returns a record detail.
- `POST /api/cases/{id}/outcome` captures or corrects an outcome based on current status.
- `GET /api/cases/{id}/history` returns most-recent-first audit entries.
- `GET /api/trends?group_by=month|region` returns outcome-count buckets.

Every 4xx/5xx response uses `{ "error": { "code", "message", "fields" } }`. The `fields`
key is always present: `null` for non-validation errors and an array for validation errors.

The API is mounted under `/api` and exposes list/search, detail, outcome capture/correction,
history, and month/region trend endpoints. CORS permits the local Next.js origin only. The
runtime error handlers and OpenAPI response schemas both use the same error envelope, avoiding a
common drift where FastAPI's raw validation schema appears in Swagger while runtime sends a
custom response.

### 3.3 Architecture notes

The repository is a small monorepo: a Python/FastAPI service backed by SQLite and a Next.js
TypeScript App Router frontend. The browser calls the FastAPI API directly over local HTTP; CORS
permits the local frontend origin. The backend is intentionally layered as route handler →
service → repository → SQLite so the capture/correction and audit rules can be tested without
HTTP plumbing.

At the current milestone, repositories, outcome services, a minimal Pydantic
`OutcomeSubmission` validator, and monthly aggregation are implemented. The validation model is
deliberately present before the HTTP routes solely to prove invalid outcome values are rejected
before reaching the service. Milestone 3 adds the thin FastAPI routes, shared exception handlers,
CORS middleware, and contract-aligned OpenAPI response schemas.

The frontend currently implements a desktop-first Cases workspace: a dense list, selected-field
search, loading/empty/error states, a right-side detail sheet, and a local Analyst/Manager role
switcher. It uses the case surrogate ID for detail lookup and deliberately shows full supplied
PII in the detail sheet. The shared Analyst outcome editor performs client-side required-outcome
validation and sends both captures and corrections to the same API endpoint. When the role is
Manager, that editor is replaced by a history view sourced from the API; no server-side
authorization is implied. The read-only Trends workspace is available to both roles, calls the
existing aggregation endpoint, and renders loading, API-error, zero-data, and outcome-breakdown
states. It uses a compact table rather than a chart to keep the take-home implementation small
while showing the complete required counts.

## 4. Concerns, Tradeoffs, and What I'd Do With More Time

- UI-only roles are intentionally not secure. A production version would authenticate users and
  derive the audit identity and authorization from the session.
- Full email/device-ID display and unencrypted local SQLite are accepted only for this local
  assessment scope.
- `created_at` trends can differ from outcome-recording time. I would add `resolved_at` and offer
  it as an alternative trend axis.
- I would add pagination, PII masking, stronger frontend tests, and end-to-end tests only after
  the core workflow is complete and validated.
- The source data contains deliberate anomalies. Retaining them demonstrates tolerant historical
  ingestion, but a production system would require a defined remediation process.

## 5. AI Usage Disclosure

### Tools used

Codex and Claude.

### What I used them for

- Extracting the raw CSV appendix into a valid seed file.
- Reviewing the specification for cross-document contradictions and tracking their resolution.
- Drafting repository instructions, lightweight safety hooks, scaffolding commands, boilerplate,
  and focused test ideas.
- Summarizing tradeoffs and helping prepare this document.

I used AI to accelerate the work under the 24-hour time limit. I remained responsible for
checking generated output against the assignment and the project documents, deciding what to
keep, and not claiming unverified work as complete.

### Specific before/after example

**AI-generated draft:** the initial Milestone 2 plan proposed deferring outcome validation until
Milestone 3 because the documented HTTP API uses Pydantic at its boundary.

**Revised version:** I explicitly approved a minimal `OutcomeSubmission` Pydantic model in
Milestone 2. It validates the three permitted outcome values and note length without adding an
endpoint or other API-layer behavior.

**Why I changed it:** Milestone 2's Definition of Done required the P0 proof that an invalid
outcome is rejected before service logic, while the original milestone split placed Pydantic in
Milestone 3. The small schema resolved that sequencing bottleneck without prematurely building
routes, CORS, or HTTP error handling.

Supporting notes and the exact review trail are kept in `ai-usage-log.md`. Before submission, I
will verify this example accurately describes my own decision process and replace any placeholder
links below.

---

Video walkthrough (2–3 min, Loom or phone recording, English): `[TODO]`

GitHub repository: `[TODO]`
