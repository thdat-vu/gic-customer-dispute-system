# 08 — Test Strategy

**Status:** DRAFT — final checkpoint before implementation planning.

Brief says: "a handful of meaningful tests — not exhaustive coverage, just tests that show what
you thought was worth verifying." This document picks that handful **deliberately** — priority
order below doubles as your time-budget guide: implement P0 tests first, stop there if time is
short, only reach P1/P2 if core scope is done and tested.

---

## 1. Priority P0 — domain/business-rule tests (backend, `services/` layer, no HTTP needed)

These test the rules that are easy to get subtly wrong and hardest to visually verify by
clicking around the UI — exactly what a reviewer is likely checking for.

| Test | What it verifies | Traces to |
|---|---|---|
| Capturing an outcome on an `open` case sets `status=resolved` and creates one `captured` audit entry | FR-4 | FR-4 |
| Correcting an outcome on a `resolved` case creates one `corrected` audit entry with correct previous/new values | FR-5 | FR-5 |
| Submitting identical outcome+note on an already-resolved case creates **zero** new audit entries | FR-5 no-op rule | FR-5, OQ-3 |
| Submitting an invalid outcome value (not in the 3-value enum) is rejected before reaching the service layer | FR-4/FR-5 validation | INV-2 |
| Seed import loads all 220 rows (including all six anomalies: `CASE-00213` x2, `CASE-00215`, `CASE-00216`, `CASE-00217`, `CASE-00218`, `CASE-00220`) without raising, and `CASE-00215`'s `outcome="maybe"` is stored as-is (not rejected, not coerced) | FR-9 | FR-9, INV-2 exception |
| Seed import correctly parses the 4 rows whose `outcome_note` contains an embedded comma (e.g. `CASE-00027`) — note text is preserved whole, not truncated at the comma | CSV parsing correctness | `05-data-model.md` §4 hazard note |
| Trend aggregation counts only `resolved` cases, grouped correctly by month | FR-7 | FR-7 |

## 2. Priority P1 — API-level integration tests (backend, real HTTP via FastAPI TestClient)

| Test | What it verifies |
|---|---|
| `GET /cases/{id}` on a non-existent case returns `404` with the standard error envelope | §06 API contract, §07 failure handling |
| `POST /cases/{id}/outcome` with an invalid enum value returns `422` | API validation boundary |
| `GET /cases?search_field=user_id&q=<partial>` returns only matching cases (partial, case-insensitive) | FR-2 |
| `GET /cases/{id}/history` returns entries most-recent-first, and an empty array (not an error) for a never-resolved case | FR-6 |
| `GET /cases` applies one-based pagination after search/month filtering, reports pre-page `total`, and rejects invalid page/limit/month ranges with the shared 422 envelope | Approved P2 pagination/date-range decision |
| List display masks email without changing the unmasked `email` search request or case-detail value | Approved P2 PII-display decision |
| Month-range form blocks `start_month > end_month` before requesting the API; backend retains matching 422 coverage | Approved P2 date-range validation decision |
| `GET /cases` combines exact case-insensitive region and enum status filters before pagination | Approved P2 list-filter decision |

## 3. Priority P2 — frontend tests (only if time remains)

Given the time budget, frontend testing is the first thing to cut if you're behind schedule —
backend business-logic tests carry more weight for "did you think this through." If time
allows, one or two component tests are enough:

| Test | What it verifies |
|---|---|
| Outcome capture form blocks submission when no outcome is selected | FR-4 client-side validation |
| Role switch hides the History section and edit controls when set to Analyst | FR-6, FR-8 |

## 4. Explicitly not tested (and why that's a reasonable call here)

- End-to-end (Playwright/Cypress) tests — valuable but disproportionate setup cost for an
  8–12h, non-production take-home.
- Load/performance tests — no performance requirement exists (NFR 4.4/4.1).
- Exhaustive edge-case coverage of every field combination — brief explicitly asks for a
  focused subset, not exhaustive coverage.

## 5. How this maps to your README's "how to run tests" requirement

- Backend: `pytest` from `backend/`, no external services required (SQLite test DB, likely
  in-memory or a temp file per test run — implementation detail for the coding agent to decide,
  not a product decision).
- Frontend (if any tests are added): whatever Next.js's default test runner setup provides
  (e.g. Jest + React Testing Library), documented in the README's test section.
