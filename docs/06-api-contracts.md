# 06 — API Contracts

**Status:** DRAFT — pending your review.
**Note:** this is the human-readable contract. The authoritative, machine-readable version will
be FastAPI's auto-generated OpenAPI schema (`/openapi.json`) once implemented — the two must
match; if they ever drift, the OpenAPI output wins since it's generated from actual code.

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
endpoint) to keep the list payload light.

**Error `422`**: `search_field` provided without `q` (or vice versa) — structured validation
error, standard FastAPI/Pydantic shape.

---

## 2. `GET /cases/{case_id}`

Case detail. Traces to FR-3.

**Response `200`**
```json
{
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

**Error `404`**: `case_id` does not exist.

---

## 3. `POST /cases/{case_id}/outcome`

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

**Response `200`** — the updated case detail (same shape as `GET /cases/{case_id}`).

**Behavior detail (must match FR-5's no-op rule):** if the request's `outcome` and
`outcome_note` are identical to the case's current values, the case is left unchanged and
**no** audit entry is created — response is still `200` with the (unchanged) case detail, since
this isn't an error condition, just a no-op.

**Error `404`**: `case_id` does not exist.
**Error `422`**: `outcome` missing or not one of the three valid values.

---

## 4. `GET /cases/{case_id}/history`

Audit trail for a case. Traces to FR-6. **Not role-gated at the API level** — the frontend
simply never calls this endpoint when acting as Analyst (SRS §1); any direct caller can still
retrieve it.

**Response `200`**
```json
{
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

**Error `404`**: `case_id` does not exist.

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

All `4xx`/`5xx` responses share a consistent envelope so the frontend can handle errors
generically:
```json
{
  "error": {
    "code": "CASE_NOT_FOUND",
    "message": "No case found with id CASE-99999"
  }
}
```
(FastAPI's default validation error shape for `422`s differs slightly — standard
`{"detail": [...]}, ` — this will be normalized in the exception handler layer so the frontend
only has to handle one shape. Documented here as a decision, not left implicit.)

---

## 7. Explicitly not included

- No `DELETE` endpoint anywhere (Phase 1 decision — no delete capability at all).
- No `PATCH`/`PUT` on immutable case fields (`user_id`, `amount`, etc. — domain model §1.1).
- No authentication headers/tokens on any endpoint.
