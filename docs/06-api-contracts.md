# 06 — API Contracts

**Status:** DRAFT — pending your review.
**Note:** this is the human-readable contract. The authoritative, machine-readable version will
be FastAPI's auto-generated OpenAPI schema (`/openapi.json`) once implemented — the two must
match; if they ever drift, the OpenAPI output wins since it's generated from actual code.

> **Revision (Codex-assisted review):** all case-addressing routes now use the surrogate `id`
> instead of `case_id`, because `case_id` is not unique (`CASE-00213` duplicate — see
> `00-problem-statement.md` §9.1 / `05-data-model.md` §1). §6's error envelope is now confirmed
> as the single shape for **all** error responses, including `422`, resolving the earlier
> inconsistency between §1 and §6.

Base URL (local dev): `http://localhost:8000/api`

---

## 1. `GET /cases`

List/search cases. Traces to FR-1, FR-2.

**Query parameters**

| Param | Required | Notes |
|---|---|---|
| `search_field` | no | one of `user_id`, `device_id`, `email`; required *together with* `q` — omit both for unfiltered list |
| `q` | no | partial/contains, case-insensitive match against `search_field` |
| `page` | no | stretch/P2 (§4.1 NFR); omit → full list |
| `limit` | no | stretch/P2; omit → full list |

**Response `200`**
```json
{
  "items": [
    {
      "id": 34,
      "case_id": "CASE-00034",
      "user_id": "usr-217308",
      "user_email": "dakota.nguyen10@inbox.test",
      "device_id": "dev-8babce3b",
      "amount": 41.94,
      "currency": "VND",
      "created_at": "2026-04-05T18:35:00Z",
      "region": "APAC-VN",
      "status": "open",
      "outcome": null
    }
  ],
  "total": 220
}
```
`outcome_note` and audit history are **not** included in the list response (kept for the detail
endpoint) to keep the list payload light. `id` (surrogate) is the field the frontend uses to
navigate to a case's detail view — `case_id` is display-only and may repeat across items (see
`CASE-00213`).

**Error `422`**: `search_field` provided without `q` (or vice versa) — uses the shared error
envelope (§6).

---

## 2. `GET /cases/{id}`

Case detail. Traces to FR-3. `{id}` is the surrogate integer key, **not** `case_id`.

**Response `200`**
```json
{
  "id": 73,
  "case_id": "CASE-00073",
  "user_id": "usr-831295",
  "user_email": "dakota.patel17@notreal.dev",
  "device_id": "dev-1a432f0a",
  "amount": 830.1,
  "currency": "VND",
  "created_at": "2026-05-27T09:30:00Z",
  "region": "APAC-VN",
  "status": "resolved",
  "outcome": "won",
  "outcome_note": "Customer provided proof of delivery."
}
```

**Error `404`**: no case exists with the given `id`.

---

## 3. `POST /cases/{id}/outcome`

Capture (first time) or correct (subsequent) an outcome. Backend determines which based on the
case's current `status` — the client does not need to know or declare which one it's doing.
Traces to FR-4, FR-5.

**Request body**
```json
{
  "outcome": "won",
  "outcome_note": "Customer provided proof of delivery.",
  "editor_role": "analyst"
}
```
- `outcome`: required, one of `won` | `lost` | `fraud_confirmed` — validated by Pydantic enum,
  invalid values rejected with `422` before reaching service logic.
- `outcome_note`: optional, ≤1000 characters (assumed default, §05 data model).
- `editor_role`: required string, **not validated against a fixed set** and **not used for
  authorization** — recorded as-is into the audit entry (SRS §1: API is role-agnostic).

**Response `200`** — the updated case detail (same shape as `GET /cases/{id}`).

**Behavior detail (must match FR-5's no-op rule):** if the request's `outcome` and
`outcome_note` are identical to the case's current values, the case is left unchanged and
**no** audit entry is created — response is still `200` with the (unchanged) case detail, since
this isn't an error condition, just a no-op.

**Error `404`**: no case exists with the given `id`.
**Error `422`**: `outcome` missing or not one of the three valid values — uses the shared error
envelope (§6).

---

## 4. `GET /cases/{id}/history`

Audit trail for a case. Traces to FR-6. **Not role-gated at the API level** — the frontend
simply never calls this endpoint when acting as Analyst (SRS §1); any direct caller can still
retrieve it.

**Response `200`**
```json
{
  "id": 73,
  "case_id": "CASE-00073",
  "entries": [
    {
      "id": 12,
      "event_type": "captured",
      "previous_outcome": null,
      "new_outcome": "won",
      "previous_note": null,
      "new_note": "Customer provided proof of delivery.",
      "editor_role": "analyst",
      "changed_at": "2026-06-01T10:15:00Z"
    }
  ]
}
```
Ordered most-recent-first. Empty `entries` array (not an error) if the case has never been
resolved.

**Error `404`**: no case exists with the given `id`.

---

## 5. `GET /trends`

Aggregated outcome counts. Traces to FR-7.

**Query parameters**

| Param | Required | Notes |
|---|---|---|
| `group_by` | no, default `month` | `month` or `region` |

**Response `200`** (example for `group_by=month`)
```json
{
  "group_by": "month",
  "buckets": [
    {
      "key": "2026-01",
      "won": 3,
      "lost": 5,
      "fraud_confirmed": 1
    },
    {
      "key": "2026-02",
      "won": 2,
      "lost": 1,
      "fraud_confirmed": 0
    }
  ]
}
```
Only `resolved` cases are counted (open cases contribute nothing, per FR-7). Buckets with zero
resolved cases are simply omitted rather than returned with all-zero counts, unless you'd
prefer explicit zero-filled buckets for a continuous chart axis — flag if so, otherwise this is
the assumed default.

**Response `200`, zero resolved cases overall**
```json
{ "group_by": "month", "buckets": [] }
```
Frontend renders the FR-7 empty state for this case.

---

## 6. Cross-cutting error shape

**This section is the single, authoritative source of truth for error response shape across
the entire API — including `07-security.md` §3, which must not restate or contradict this.**
(A Codex-assisted review caught `07-security.md` §3 describing a stale, pre-decision version of
this contract — fixed there to reference this section instead of re-describing it.)

**Every** `4xx`/`5xx` response — including `422` validation errors — uses one consistent
envelope, so the frontend only ever needs one error-parsing code path. The `fields` key is
**always present** in the envelope, with no exceptions:
- Non-validation errors (e.g. `404 CASE_NOT_FOUND`, `500` internal errors): `fields` is present
  with value `null`.
- `422` validation errors: `fields` is present with an array of `{field, issue}` objects.

There is no third option and no "omit the key" case — this was previously left ambiguous
("null, not present, or empty array — pick one") and is now fixed to exactly one shape so the
frontend can rely on a single fixed TypeScript type (`fields: FieldError[] | null`) without a
`"fields" in error` existence check.

```json
{
  "error": {
    "code": "CASE_NOT_FOUND",
    "message": "No case found with id 99999",
    "fields": null
  }
}
```

For `422` validation errors specifically, `fields` is populated with per-field detail (derived
from Pydantic's default `{"detail": [...]}` output, **transformed** into this shape — the raw
Pydantic output is never returned to the client as-is):
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request failed validation.",
    "fields": [
      { "field": "outcome", "issue": "must be one of: won, lost, fraud_confirmed" }
    ]
  }
}
```

**Implementation note:** this requires a custom FastAPI exception handler for
`RequestValidationError` that reshapes Pydantic's default output into the envelope above,
registered once in `main.py` — FastAPI's built-in default (`{"detail": [...]}`) must never reach
the client unmodified, for any endpoint, in any error case.

---

## 7. Explicitly not included

- No `DELETE` endpoint anywhere (Phase 1 decision — no delete capability at all).
- No `PATCH`/`PUT` on immutable case fields (`user_id`, `amount`, etc. — domain model §1.1).
- No authentication headers/tokens on any endpoint.
