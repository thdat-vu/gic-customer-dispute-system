# 09 — Implementation Plan

**Status:** DRAFT — final checkpoint. This is a time-boxed execution plan, not architecture —
architecture/data model/API contract are already decided (checkpoints 2–3); this just sequences
the work.

**Deadline context:** submission due 09:00, 09/09/2026. As of this doc, you have roughly ~22h
of wall-clock time remaining, but the brief's *actual* target is 8–12 focused hours — the rest
is buffer, not a budget to fill. The plan below targets ~10h of focused work, leaving buffer for
the doc, video, and unexpected friction.

Each milestone lists a rough time-box and an explicit "definition of done" so you know when to
stop polishing and move on.

---

## Milestone 0 — Repo scaffold (≈30 min)
- Create `docs/` (already populated), `backend/`, `frontend/` folders.
- Backend: FastAPI project skeleton, SQLAlchemy, pytest installed.
- Frontend: Next.js (TypeScript, App Router) project skeleton.
- **Done when:** `uvicorn` serves an empty FastAPI app, `next dev` serves an empty page, both
  run side-by-side without errors.

## Milestone 1 — Backend data layer (≈1.5h)
- Implement `Case` and `OutcomeAuditEntry` SQLAlchemy models per `05-data-model.md`.
- Implement `seed.py` importing `seed_dataset.csv` as-is (FR-9), including the 4 anomalous rows.
- **Done when:** running the seed script produces 220 rows in SQLite, verifiable via a quick
  manual query, including the anomalous rows intact.

## Milestone 2 — Backend core business logic (≈2h) — **this is the highest-value milestone**
- Implement `services/` logic for capture/correct outcome (FR-4, FR-5, including the no-op
  audit rule).
- Write the P0 test suite from `08-test-strategy.md` §1 **alongside** this code, not after —
  these tests are checking exactly the rules most likely to be judged.
- **Done when:** all P0 tests pass.

## Milestone 3 — Backend API layer (≈1.5h)
- Implement all 5 endpoints from `06-api-contracts.md` (list/search, detail, capture/correct,
  history, trends) as thin wrappers over Milestone 2's services.
- Add the shared error envelope + CORS config (`07-security.md` §3).
- Write P1 integration tests.
- **Done when:** Swagger UI (`/docs`) shows all 5 endpoints correctly, P1 tests pass, and you can
  manually exercise every endpoint via Swagger UI.

## Milestone 4 — Frontend: list/search + case detail (≈2h)
- Case list screen (FR-1), search control (FR-2), case detail screen (FR-3).
- Role switcher (FR-8) — build this now since detail/history rendering depends on it.
- **Done when:** you can browse all 220 seeded cases, search by each of the 3 fields, and see
  correct detail for both anomalous and normal cases.

## Milestone 5 — Frontend: capture/correct outcome + history (≈1.5h)
- Outcome form (FR-4/FR-5, shared component per your earlier decision), client-side validation.
- History section, Manager-only rendering (FR-6).
- **Done when:** capturing and correcting an outcome both work end-to-end against the real
  backend, and the History section appears/disappears correctly on role switch.

## Milestone 6 — Frontend: trend view (≈1h)
- Simple table or chart per FR-7, monthly buckets, region grouping if time allows both.
- Empty state for zero resolved cases.
- **Done when:** trend numbers visibly match what you'd get by manually counting a few known
  seed rows (a quick sanity spot-check, not a full test).

## Milestone 7 — README + polish (≈1h)
- Write the README per the brief's requirements: install/run steps (backend + frontend), short
  architecture explanation (can lift directly from `04-architecture.md` §1–2), what's
  implemented vs. skipped and why (lift from `01-product-scope.md` §2), how to run tests.
- **Done when:** you could hand the repo to someone else and they could run it with zero
  undocumented steps — a good self-check is to actually re-run your own README from a clean
  checkout if time allows.

## Stretch work (only if all of the above is done and tested — strict cutoff)
In priority order, per earlier decisions:
1. Pagination (backend + frontend) — additive, low risk to bolt on last (§4.1 NFR).
2. Partial PII masking in list view.
3. `resolved_at` field + alternate trend axis.

**Do not start stretch work with less than ~2h remaining before your own personal deadline for
writing the doc + recording the video** — an unfinished stretch feature reads worse than a
clean core submission with an honest "didn't get to X" note in Concerns & Tradeoffs.

---

## Remaining deliverables outside this repo (not covered by these docs, but time-box them too)
- **Design & thinking doc** (Google Doc, 5 sections) — you can draft most of it *during*
  implementation by copying directly from these `docs/*.md` files rather than writing it fresh
  at the end. Budget ≈45 min at the end for the AI Usage Disclosure section specifically, since
  it needs a genuine before/after example you can only write once you've actually used AI during
  coding.
- **Video walkthrough** (2–3 min, unscripted, no retakes) — budget ≈15 min, record near the end
  when the app is in its final state.

## Summary time budget

| Phase | Time |
|---|---|
| Scaffold | 0.5h |
| Backend (data + logic + API + tests) | 5h |
| Frontend (list/detail + capture/correct + trend) | 4.5h |
| README + polish | 1h |
| **Core total** | **~11h** |
| Doc + video (outside repo) | ~1h |
| Buffer (given ~22h available) | ~9–10h |

This leaves real buffer for sleep, interruptions, or a stretch item — not a plan that assumes
everything goes perfectly on the first try.
