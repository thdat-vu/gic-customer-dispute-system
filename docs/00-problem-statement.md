# 00 — Problem Statement

**Project:** GCI Fullstack Intern Take-Home — Dispute Outcome Tracking Tool
**Phase:** Discovery (Phase 1 of SDLC per project guideline)
**Status:** DRAFT — pending your approval before proceeding to Functional Requirements (Phase 4)

---

## 1. Problem, in plain language

A support/fraud team resolves customer payment disputes (chargebacks). By the time a case
is resolved, the team already *knows* the outcome — won, lost, or fraud_confirmed — but this
knowledge is not being recorded in any trackable system. As a result, nobody can answer basic
questions like "how many fraud-confirmed cases did we have last month?" or "is a specific
region trending worse?"

This is **not** a fraud-detection problem (the tool does not decide who is at fault) and it is
**not** a cashback/rewards problem. It is a **data capture + visibility gap**: a decision that
already exists in someone's head or in scattered emails needs a single place to land, so it can
later be counted and trended.

## 2. Root cause (assumption, confirmed by you)

> ⚠️ ASSUMPTION — not verifiable from the brief, treated as given for this project.

Two compounding causes:
1. **No dedicated tool exists** for recording the outcome once a case is investigated.
2. **The current process is fragmented** — conclusions travel through email/ad-hoc channels
   with extra steps that don't map onto any tracked system, so even when an outcome is decided,
   it doesn't reliably make it into a system of record.

**Design implication:** the solution should minimize friction for the person recording the
outcome (few steps, no unnecessary fields) — friction is a *plausible* contributor to the
current data gap, not a proven one, but it is the actionable lever available to us.

## 3. Target users (actors)

| Actor | Description | Capabilities in this tool |
|---|---|---|
| **Analyst** | Investigates disputes and knows the ground-truth outcome | List/search cases, view detail, capture outcome, edit a previously captured outcome (with audit trail). No delete capability. |
| **Manager** | Oversees the team, reviews outcomes and trends | Read-only: list/search cases, view trend view. Cannot capture/edit outcomes. |

> RESOLVED: Case deletion (soft or hard) is **not** in scope. It was not requested by the
> original brief, and you confirmed it should be dropped to keep effort focused on the three
> core capabilities (list/search, capture outcome, trend view). No delete endpoint, no delete UI,
> no audit-log-for-deletion logic will be designed in later phases.

## 4. Business goal

Give the team a system of record for dispute outcomes so that trend/pattern visibility becomes
possible going forward. The tool's value is realized *cumulatively* — one case captured is not
useful by itself; the trend view is the payoff, and it depends on analysts consistently using
the capture flow.

## 5. Current workflow (as understood)

1. Analyst investigates a dispute (outside this tool — investigation itself is out of scope).
2. Analyst reaches a conclusion (won / lost / fraud_confirmed).
3. Conclusion is communicated informally (email or similar) and does **not** reliably land in
   any queryable system.
4. `status` and `outcome` fields exist in the underlying case data model already, but are
   overwhelmingly left blank (per the seed dataset: the large majority of the 220 seed rows are
   `status=open` with empty `outcome`).

## 6. Desired workflow

1. Analyst opens the tool, finds the relevant case (search by user ID, device ID, or email).
2. Analyst records the outcome (`won` / `lost` / `fraud_confirmed`) with an optional note.
3. The system marks the case `resolved` and stores the outcome; this becomes visible to
   Manager immediately.
4. If the Analyst made a mistake, they can correct the outcome later. Every correction is
   recorded as an audit entry (previous value, new value, who, when) — the case does not
   silently overwrite history.
5. Manager periodically (assumed: roughly monthly) opens the trend view to check how outcomes
   are distributed over time and/or region.

## 7. Constraints (given by GIC brief, not negotiable)

- 24-hour clock from receipt to submission; **effective work budget is 8–12 focused hours** —
  the brief explicitly warns against over-investing.
- No authentication/authorization required — but this project still wants a role distinction
  (Analyst vs Manager). Resolution: a **UI-level role switcher** (e.g., a dropdown "Acting as:
  Analyst / Manager"), with no real session security behind it. This is a UX simulation of
  roles, not an access-control system — must be documented as such so nobody mistakes it for
  real authorization.
- No real database required (SQLite/embedded/in-memory acceptable).
- No deployment/Docker/CI required.
- No pixel-perfect design required.
- Backend language is free choice (Go/PHP is a "nice to have," not required).
- Frontend must be React (functional components + hooks).
- Frontend must call a real backend API (not mocked in-frontend).

## 8. Business rules confirmed for this project

| # | Rule | Decision | Rationale |
|---|---|---|---|
| BR-1 | Valid outcome values | Exactly `won`, `lost`, `fraud_confirmed` — no other values accepted through the capture flow | Matches brief's enum; seed data contains an invalid `maybe` value used as a deliberate test row (see §9) |
| BR-2 | Outcome correction | Allowed. Every edit creates an audit record: previous value, new value, editor identity (role, since no auth), timestamp | You chose this explicitly — supports the "final record but can be corrected" tension in the brief, and gives Manager something concrete to oversee |
| BR-3 | Case deletion | **Not in scope.** No delete capability of any kind (soft or hard) | Not requested by the original brief; dropped to protect the 8–12h time budget |
| BR-4 | Sensitive fields (email, device_id) | Full display in v1; masking is a **P2 stretch goal**, not required for submission | You explicitly deprioritized this given the time budget |
| BR-5 | Search/filter scope | Minimum viable: search by **one** of user_id / device_id / email, satisfying the brief's "at least one" requirement, no more | Chosen to protect time budget |
| BR-6 | Trend view time basis | Grouped by `created_at` (case-opened date), monthly buckets | Simplicity + uses existing seed field; **known limitation**: a case opened in January but resolved in May will show in January's bucket, which may misrepresent "when the outcome actually happened." Documented as an accepted limitation, not silently ignored. |
| BR-7 | Malformed/edge-case seed rows (see §9) | Out of scope to clean or specially handle; imported as-is | You explicitly prioritized speed and stayed within "engineer analyzes and flags fraud, not general data hygiene" framing |

## 9. Known data quality anomalies in the seed dataset

Four rows in the provided 220-row seed dataset appear to be **deliberately planted test
cases**, not organic noise:

- `CASE-00220`: `status=open` but `outcome=lost` is already set — note field literally says
  "Status/outcome mismatch canary"
- `CASE-00215`: `outcome=maybe` — not a valid enum value — note says "Invalid outcome value
  canary"
- `CASE-00216`: `amount=-42.5` — negative amount
- `CASE-00217`: `created_at=2027-03-15` — a future date relative to the rest of the dataset (all
  other rows are 2026)

**Decision (per BR-7):** these rows will be imported as-is, without special-case cleaning or
rejection logic, consistent with your instruction to prioritize speed and stay within scope.
This is recorded here explicitly so it reads as a *conscious* decision in your submission doc,
not an oversight — reviewers planting canary rows are very likely checking whether you noticed
and made a call, not necessarily requiring you to "fix" them.

> ⚠️ ONE OPEN THREAD not yet resolved: "imported as-is" still requires an implementation-level
> decision — does your backend's data layer *enforce* an outcome enum constraint at the
> database/schema level? If yes, `CASE-00215`'s `outcome=maybe` would fail to import under a
> strict schema, contradicting "as-is." This needs a explicit answer in Phase 6/8 (Domain Model
> / Data Model) — flagging now so it isn't silently decided later.

## 10. Success criteria

No rubric was provided beyond the brief itself. Success is defined as satisfying the brief's
**Deliverables** section in full:
- (A) Repo runs locally per README with no undocumented steps; README covers install/run for
  backend+frontend, architecture explanation, implemented-vs-skipped rationale, and test
  instructions.
- (B) Design & thinking doc covering all 5 required sections (Understanding & Assumptions,
  Requirements Analysis, Design, Concerns & Tradeoffs, AI Usage Disclosure with one concrete
  before/after example).
- (C) 2–3 minute unscripted video walkthrough.

> ⚠️ ASSUMPTION, confirmed by you: no additional/hidden rubric exists beyond the brief text.

## 11. Explicit non-goals (see also `01-product-scope.md`)

- Fraud detection/decisioning logic (the tool records outcomes; it does not decide them)
- Case deletion (soft or hard) — dropped after review; not requested by the original brief
- Authentication/authorization (real security)
- Deployment, containerization, CI/CD
- Data cleaning/validation of the seed dataset's anomalous rows
- PII masking (deferred to stretch/P2)
- Bulk actions on cases
