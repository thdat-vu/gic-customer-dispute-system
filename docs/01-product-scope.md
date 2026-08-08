# 01 — Product Scope

**Status:** DRAFT — pending your approval before proceeding to Actors & User Flows (Phase 3)
and Functional Requirements (Phase 4)

---

## 1. In scope (v1 — must be built within the 8–12h budget)

### 1.1 Core capabilities
- **List & search cases** — list all cases; filter/search by exactly one of: `user_id`,
  `device_id`, `email` (per BR-5, minimum viable).
- **Capture outcome** — Analyst sets `outcome` (`won` | `lost` | `fraud_confirmed`) + optional
  note on a case; case `status` transitions to `resolved`.
- **Correct outcome** — Analyst can edit a previously captured outcome; every edit produces an
  audit record (previous value → new value, editor role, timestamp). See BR-2.
- **Trend view** — table or chart of outcome counts, grouped by month (based on `created_at`),
  and/or by region. See BR-6.
- **Role switcher (UI-level only)** — a non-secure UI control to toggle between "Analyst" and
  "Manager" acting-as mode, changing which capabilities are exposed. No real session, no
  backend enforcement of identity.
- **Manager read-only view** — Manager can list/search cases and view the trend view; cannot
  capture, edit, or delete outcomes (enforced at the UI level only, not a security boundary).

### 1.2 Technical requirements (from brief, non-negotiable)
- Real backend API (any language) backing the frontend — not mocked.
- React frontend (functional components + hooks).
- Seed data loaded from the provided 220-row CSV (or an adjusted shape, if changed — must be
  documented).
- A handful of meaningful tests (not full coverage).
- README covering install/run, architecture, implemented-vs-skipped rationale, test
  instructions.

## 2. Out of scope for v1 (explicit non-goals)

| Item | Why excluded |
|---|---|
| Case deletion (soft or hard) | Not requested by the original brief; dropped after review to protect the time budget |
| Real authentication / authorization | Explicitly excluded by the brief |
| Data validation/cleanup of the seed dataset's anomalous rows (`CASE-00220`, `CASE-00215`, `CASE-00216`, `CASE-00217`) | Explicitly deprioritized (BR-7); imported as-is |
| Fraud detection or decision-making logic | Out of the tool's purpose entirely — this tool *records* outcomes, it does not determine them |
| Bulk edit / bulk import UI beyond the initial seed load | Not requested; time-budget risk |
| Multiple filters combined (AND/OR search across fields) | Only single-field search required (BR-5) |
| Configurable trend granularity (day/week/month toggle) | Fixed to monthly per BR-6 |
| Deployment, Docker, CI/CD | Explicitly excluded by the brief |
| Pixel-perfect / branded UI design | Explicitly excluded by the brief |
| Real-time updates (websockets, polling) | Not requested; static/on-demand fetch is sufficient |
| Notifications/alerts on new cases or outcome changes | Not requested |

## 3. Stretch goals (only if time remains after core scope is done and tested)

Ordered by suggested priority if you do have spare time:
1. `resolved_at` timestamp captured at outcome-capture time, offered as an alternative/second
   trend axis alongside the `created_at`-based monthly view
2. Additional filters beyond the implemented exact `region` and `status` filters (e.g., outcome)

> ⚠️ Recommendation: do not start stretch goals until core scope (§1) is fully working, tested,
> and documented. The brief explicitly rewards a "focused, well-reasoned submission" over
> exhaustiveness — a polished core beats a partially-done stretch list.

## 4. Actors summary (detail in Phase 3)

| Actor | Primary goal | Boundary |
|---|---|---|
| Analyst | Get outcomes recorded accurately, correct mistakes when needed | Cannot bypass audit logging on edits/deletes |
| Manager | See what's happening across cases and trends | Cannot mutate case/outcome data through this tool |

## 5. Traceability note

Every functional requirement drafted in Phase 4 will reference back to a business rule (BR-1
through BR-7) or an in-scope item (§1) listed here, so that the coding agent implementing this
later has a documented "why" for every behavior — not just a "what."
