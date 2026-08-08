# 02 — Software Requirements Specification (SRS)

**Status:** DRAFT — pending your review before proceeding to Architecture/Data Model/API
Contracts checkpoint.
**Supersedes:** the earlier standalone actors/flows draft — folded in here as §1–§2.

Every FR below carries an ID, an acceptance criterion in Given/When/Then form, and a
traceability tag back to a Business Rule (BR-x, from `00-problem-statement.md`) or an Open
Question resolved in this document (marked "resolved here").

---

## 1. Actors

| Actor | Access | Notes |
|---|---|---|
| **Analyst** | List/search, view case detail, capture outcome, correct outcome, view trend | Does not see per-case audit history |
| **Manager** | List/search (read-only), view case detail (read-only), view trend, view per-case audit history | Cannot capture/correct outcomes |

Role selection: UI-level "Acting as" switcher only. **Resolved (was OQ-1):** the API does
**not** validate or enforce role — any write request is accepted regardless of claimed role.
The audit log still records whatever role string the frontend sends at write time, so
traceability is preserved even without enforcement. This is a deliberate simplification
consistent with "no auth required," and must be called out in the submission doc as a known
limitation (a malicious/careless frontend could let "Manager" write data — acceptable for this
scope, unacceptable for production).

**Resolved (was implicit gap):** Trend view is accessible to **both** Analyst and Manager —
it's read-only aggregate data with no sensitivity concern beyond what's already visible in the
list view, so there's no reason to restrict it to Manager only. (Flagging this as an assumption
in case you intended trend to be Manager-exclusive — easy to override before Phase 4→5 checkpoint.)

---

## 2. User Flows (condensed)

1. **List/search** (both actors) — default sort newest-first by `created_at`; search by exactly
   one of `user_id` / `device_id` / `email`, partial/contains match, case-insensitive.
2. **Capture outcome** (Analyst, case status = open) — select outcome enum + optional note →
   submit → status becomes `resolved`, audit entry created with event type `captured`.
3. **Correct outcome** (Analyst, case status = resolved) — same form, pre-filled → submit only
   creates a new audit entry (`corrected`) if outcome or note actually changed (no-op submits
   are silently ignored, no audit noise).
4. **View audit history** (Manager only) — chronological list of `captured`/`corrected` events
   per case.
5. **View trend** (both actors) — monthly counts of resolved cases by outcome type, grouped by
   `created_at` month, and/or by `region`.
6. **Role switch** (both) — UI-only, no data impact, no persistence requirement beyond the
   current session (assumption: resets to a default role — Analyst — on page reload, since no
   backend session exists to persist it. Flag if you want it persisted, e.g. via browser storage).

---

## 3. Functional Requirements

### FR-1 — List cases
**Given** any actor is on the case list screen, **when** no search term is entered, **then**
cases are shown sorted newest-first by `created_at`.
*Traces to:* BR (Phase-1 desired workflow), resolved OQ-2 (sort order).

**Stretch decision (approved after core completion):** the list is paginated. `page` is
one-based; the default and maximum page size are 20. An optional inclusive `start_month` /
`end_month` range (`YYYY-MM`) filters on `created_at` before sorting and pagination. `total`
counts all records after search/month filtering, not only the current page.
The frontend initializes `start_month` to January of the current UTC year and `end_month` to the
current UTC month, then sends that range on initial load; users may replace or clear either
bound. Exact case-insensitive `region` and enum `status` filters are applied with search/month
bounds before pagination. A start month after the end month is
blocked client-side with a clear validation message; the API also returns its shared 422 envelope
for direct callers.

### FR-2 — Search cases by single field
**Given** an actor selects one search field (`user_id` / `device_id` / `email`) and types a
partial value, **when** they submit the search, **then** the list shows only cases whose
selected field contains the typed value (case-insensitive substring match).
**Given** no case matches, **then** an explicit "no results" empty state is shown (distinct
from the "zero cases exist at all" empty state).
**Given** a case has a `NULL` value in the selected search field (e.g. `CASE-00218`'s blank
`user_id`), **when** searching that field, **then** that case is simply never matched (NULL
never satisfies a partial-match search) — not treated as an error.
*Traces to:* BR-5, FR-9 (nullable `user_id`).

### FR-3 — View case detail
**Given** an actor selects a case from the list, **when** the detail view loads, **then** it
shows all read-only fields (`id` [surrogate], `case_id` [display label, may repeat across rows
— see FR-9], `user_id`, `user_email`, `device_id`, `amount`, `currency`, `created_at`, `region`)
plus current `status`/`outcome`/`outcome_note`. The frontend addresses/navigates to a case using
`id`, never `case_id`, since `case_id` is not guaranteed unique.
*Traces to:* base requirement from GIC brief; FR-9 (surrogate key resolution).

### FR-4 — Capture outcome
**Given** an Analyst opens a case with `status = open`, **when** they select an outcome
(`won` | `lost` | `fraud_confirmed`) and optionally enter a note (≤1000 characters — assumed
default, flag if you want a different limit) and submit, **then**:
- `status` changes to `resolved`
- `outcome` and `outcome_note` are persisted
- one audit entry is created with `event_type = captured`

**Given** no outcome is selected, **when** the Analyst attempts to submit, **then** submission
is blocked client-side with a validation message (outcome is mandatory; note is optional).
*Traces to:* BR-1, BR-2 (capture half), GIC brief FR #2.

### FR-5 — Correct outcome
**Given** an Analyst opens a case with `status = resolved`, **when** they change the outcome
and/or note and submit, **then**:
- the case's current `outcome`/`outcome_note` are updated
- one audit entry is created with `event_type = corrected`, storing previous and new values

**Given** the Analyst submits without changing anything, **when** they submit, **then** no new
audit entry is created and no state changes.
*Traces to:* BR-2 (correction half), resolved OQ-3.

### FR-6 — View audit history (Manager only)
**Given** a Manager opens a case detail, **when** the case has ≥1 audit entry, **then** a
"History" section lists every entry (timestamp, previous → new outcome, previous → new note,
editor role, event type), most recent first.
**Given** an Analyst opens the same case, **then** no History section is rendered at all.
**Given** a case has zero audit entries (never resolved), **then** the History section shows an
explicit "no history yet" state (Manager view only).
*Traces to:* actor table §1.

### FR-7 — Trend view
**Given** either actor opens the Trends screen, **when** there is ≥1 resolved case, **then** the
view shows counts of `won` / `lost` / `fraud_confirmed` grouped by month (based on `created_at`)
and/or by `region`.
**Given** there are zero resolved cases, **then** an explicit empty state is shown instead of a
blank/broken chart.
*Traces to:* BR-6, GIC brief FR #3.

### FR-8 — Role switch
**Given** any actor changes the "Acting as" control, **when** the change is applied, **then**
the UI immediately shows/hides role-gated affordances (edit controls for Analyst, History
section for Manager) without a page reload or data loss.
*Traces to:* Phase-1 role decision.

### FR-9 — Seed data import
**Given** the provided 220-row CSV, **when** the system is initialized, **then** all 220 rows
are loaded as **220 distinct case records**, including all six anomalous rows (`CASE-00220`,
`CASE-00215`, `CASE-00216`, `CASE-00217`, both physical `CASE-00213` rows, `CASE-00218`) — no
rejection, no cleanup, no merging, no special-casing.

*Traces to:* BR-7. **Design consequences resolved here** (updated after Codex-assisted review
found two additional anomalies the original pass missed — see `00-problem-statement.md` §9):

1. The `outcome` column has **no** hard database-level enum/CHECK constraint (plain nullable
   string at the storage layer), because `CASE-00215`'s `outcome=maybe` would otherwise fail to
   import. Enum validity (`won`/`lost`/`fraud_confirmed`) is enforced only at the
   **API/application layer** for new writes coming through FR-4/FR-5 — never for historical
   seed data on read.
2. **`case_id` is not the primary key.** Because `CASE-00213` legitimately appears as two
   separate physical rows, the primary key must be a surrogate `id` (auto-increment integer),
   with `case_id` demoted to a regular (non-unique) indexed column. Every API route that
   previously addressed a case by `case_id` now addresses it by this surrogate `id`
   (`06-api-contracts.md` updated accordingly).
3. **`user_id` is nullable.** `CASE-00218` has a blank `user_id` in the source CSV; the column
   constraint must permit this rather than reject or fabricate a value for that row.

### FR-10 — Historical data-quality indicator

**Given** a case has one or more documented source-data anomalies, **when** it is returned by
the list or detail API, **then** it includes a read-only `has_data_quality_issue` flag and stable
`data_quality_issues` reason codes. The UI renders a visible “Data issue” indicator in the list
and lists the reasons in detail. This diagnostic is derived on read; it never changes the
`open`/`resolved` workflow status, rejects a historical row, or mutates source data.

The known checks are duplicate external `case_id`, missing `user_id`, negative amount, future
`created_at`, invalid historical outcome, and status/outcome mismatch.

**Given** an analyst selects the Data issues-only list filter, **when** cases are listed, **then**
only records with `has_data_quality_issue=true` are included before pagination.

*Traces to:* BR-8, §00.9.

---

## 4. Non-Functional Requirements

### 4.1 Performance
- Dataset is small (220 seed rows); no performance optimization is required for v1.
- **Pagination (list endpoint + UI):** implemented post-core. The list defaults to one-based
  page 1 with 20 records and caps `limit` at 20; see FR-1 and `06-api-contracts.md` §1.

### 4.2 Data sensitivity / PII
- **Stretch decision (approved after core completion):** the list displays `user_id` and
  `device_id` in full to support analyst scanning. It displays a masked email in the form
  `d*****@gmail.com`; the complete email remains searchable and is available in the case detail.
  Display masking must not change the unmasked API data or FR-2 search behavior.

### 4.3 Error handling
- Client-side validation prevents obviously invalid submissions (missing outcome) before hitting
  the API.
- API returns structured 4xx responses with a machine-readable error code + human-readable
  message for validation failures (e.g., invalid outcome enum on a *new* write, missing
  required field).
- Unexpected server errors return a generic 5xx; the frontend shows a non-technical "something
  went wrong, try again" message — no stack traces surfaced to the user.
- Historical/seed data that fails today's validation rules (the 4 anomalous rows) is still
  **readable and displayable** — validation is only enforced on new writes, never on reads
  (otherwise the seed rows would make the app unusable for those 4 cases).

### 4.4 Scalability
- Explicitly out of scope. This is a single-team internal tool over a small, bounded dataset.
  No horizontal scaling, caching, or load considerations are designed for.

### 4.5 Maintainability
- Business rules (outcome enum, capture-vs-correct distinction, audit-on-change-only) are
  concentrated in one place in the backend (service/domain layer, detailed in Phase 4→5
  Architecture) rather than duplicated across handlers, so they're independently testable.
- Test strategy will target these rules first (Phase 8), since they are the parts most likely to
  be graded on "did you think this through," not incidental plumbing code.

---

## 5. Items explicitly deferred to the next checkpoint (Architecture / Data Model / API)

- Concrete schema/types for `Case` and `OutcomeAuditEntry` (Domain Model, §03)
- Endpoint list, request/response shapes (API Contracts)
- Overall component/layer structure (Architecture)

None of the FRs above are blocked on these — they's decided independently of implementation
choices, per the instruction to keep requirements decoupled from architecture.
