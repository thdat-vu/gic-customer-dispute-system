# 07 — Security & Failure Handling

**Status:** DRAFT — final checkpoint before implementation planning.

This document exists mainly to make **accepted risks explicit** — per the brief, no
auth/deployment hardening is required, but a reviewer will likely check whether you *understood*
what you were skipping versus skipping it unknowingly. Everything below is written to be copied
almost directly into your submission doc's "Concerns & Tradeoffs" section.

---

## 1. Accepted risks (by design, given project scope)

| Risk | Why accepted | Mitigation if this became a real product |
|---|---|---|
| No authentication — anyone who can reach the API can read/write any case | Brief explicitly excludes auth | Add real session/token auth; move role enforcement server-side |
| `editor_role` in audit log is self-reported by the client, not verified | API is intentionally role-agnostic (SRS §1) | Derive role from a verified session instead of a request body field |
| `user_email`/`device_id` (PII) shown in full in v1 | You deprioritized masking to P2 given time budget | Implement masking (already designed as a stretch item in `01-product-scope.md`) and restrict full-value visibility to a permissioned role |
| SQLite file stored unencrypted on disk | No deployment/production requirement in scope | Use an encrypted-at-rest managed database in production |
| No rate limiting / no protection against abusive request volume | Single local user, not internet-facing | Add rate limiting at a gateway layer if ever exposed |
| CORS allows the local frontend origin broadly | Local dev only, not deployed | Restrict CORS to known production origins |

## 2. Input validation

- Every write endpoint (`POST /cases/{id}/outcome`) validates `outcome` against the
  3-value enum via Pydantic — invalid values never reach the service/domain layer, rejected at
  the API boundary with `422` (per `06-api-contracts.md` §3).
- `outcome_note` length is capped (assumed 1000 chars, per `05-data-model.md`) at the schema
  layer, not the database layer — prevents unbounded payloads without needing a DB constraint.
- Path parameters (`id`) are validated implicitly by the `404` lookup — no separate format
  validation needed since a non-existent ID just fails the lookup.

## 3. Failure handling

- **Case not found** (`GET`/`POST` on a nonexistent `id`): `404` using the shared error envelope
  defined in `06-api-contracts.md` §6 — never a raw 500 or unhandled exception.
- **Malformed request body**: `422` using the **same** shared error envelope (`06-api-contracts.md`
  §6), with Pydantic's field-level detail transformed into the envelope's `fields` array — **not**
  FastAPI/Pydantic's raw default `{"detail": [...]}` shape. (This corrects an earlier draft of
  this section that described the untransformed Pydantic default; `06-api-contracts.md` §6 is
  the authoritative contract and this section must stay consistent with it, not restate it.)
- **Unexpected server error** (e.g., DB file locked, disk full): generic `500` using the shared
  envelope, non-leaky message (`"internal error, please try again"`) — no stack trace, no SQL,
  no file paths returned to the client. Full details go to server-side logs only (stdout is
  sufficient for this scope — no external logging/monitoring service required).
- **Frontend network failure** (backend unreachable, timeout): shown as a generic "couldn't
  reach the server" banner rather than a blank/frozen UI — this is a testable UI requirement,
  not just a nice-to-have.

## 4. Data integrity vs. permissiveness (recap, made explicit here for the security lens)

The deliberate choice to **not** enforce a DB-level `outcome` enum constraint (FR-9,
`05-data-model.md`) is a data-integrity trade-off, not a security one — it only affects
tolerance of pre-existing seed anomalies, never new writes (those are always validated). Worth
stating plainly in the submission doc so it doesn't read as an oversight: *"we chose
permissive-at-rest, strict-at-write on purpose, to preserve historical seed data as evidence of
a real-world data quality problem rather than silently erasing it."*

## 5. What is explicitly NOT addressed (and why that's fine here)

- Audit log tampering (anyone with DB file access could alter history) — no threat model exists
  for this local, single-user, non-deployed tool.
- Secrets management — there are no secrets/API keys in this project.
- Dependency vulnerability scanning — out of scope for an 8–12h take-home; would matter for a
  real production rollout.
