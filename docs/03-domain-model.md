# 03 — Domain Model

**Status:** DRAFT — pending your review before proceeding to Architecture / Data Model / API
Contracts checkpoint.

This is a **conceptual** domain model (entities, relationships, invariants, state machine) —
not yet a database schema (that's Phase 5, `05-data-model.md`) and not yet tied to any specific
storage technology.

---

## 1. Entities

### 1.1 `Case`
The unit of work: one customer dispute.

> **Revised after Codex-assisted spec review:** `case_id` is **not unique** in the source data
> (`CASE-00213` appears as two distinct physical rows — a deliberately planted canary; see
> `00-problem-statement.md` §9). A case is therefore identified by a surrogate `id`, not by
> `case_id`. `case_id` remains a display/reference label only.

| Attribute | Type (conceptual) | Mutability | Notes |
|---|---|---|---|
| `id` | identifier (surrogate, system-generated) | immutable | **actual identity of a `Case`**; used for all addressing (API paths, FK targets) |
| `case_id` | string | immutable | from seed data, e.g. `CASE-00034`; **not unique** — do not use as a lookup key or FK target |
| `user_id` | nullable string | immutable | reference to the customer; not editable via this tool; can be blank in source data (`CASE-00218`) — treated as legitimately missing, not an error |
| `user_email` | string | immutable | PII — displayed in full per BR-4 (v1) |
| `device_id` | string | immutable | PII-adjacent — displayed in full per BR-4 (v1) |
| `amount` | decimal | immutable | can be negative in seed data (`CASE-00216`) — accepted as-is, no business meaning assigned to sign (out of scope to interpret) |
| `currency` | string | immutable | ISO-like code from seed data (e.g. `VND`, `USD`) |
| `created_at` | timestamp | immutable | can be a future date in seed data (`CASE-00217`) — accepted as-is |
| `region` | string | immutable | e.g. `APAC-VN` |
| `status` | enum: `open`, `resolved` | derived | becomes `resolved` the moment an outcome is first captured (FR-4); never reverts to `open` (no "reopen" flow requested — explicit non-goal) |
| `outcome` | nullable string | mutable via FR-4/FR-5 | **application-layer** enum (`won`/`lost`/`fraud_confirmed`) enforced only on new writes; stored as plain string to tolerate historical seed anomalies (SRS FR-9) |
| `outcome_note` | nullable string | mutable via FR-4/FR-5 | free text, assumed max ~1000 chars (flagged default) |

> All fields except `status`, `outcome`, `outcome_note` are **read-only reference data** as far
> as this tool is concerned — nothing in the brief or your decisions asks for editing customer
> identity/amount/region data, so no update path exists for them. Stated explicitly here so it
> isn't accidentally designed into the API later.

### 1.2 `OutcomeAuditEntry`
One row per capture or correction event. Append-only — never updated or deleted.

| Attribute | Type (conceptual) | Notes |
|---|---|---|
| `id` | identifier | system-generated |
| `case_ref_id` | reference to `Case.id` (surrogate) | required — **not** `Case.case_id`, since that's not unique |
| `event_type` | enum: `captured`, `corrected` | `captured` = first-ever outcome on this case; `corrected` = any subsequent change |
| `previous_outcome` | nullable string | null for `captured` events |
| `new_outcome` | string | the value after this event |
| `previous_note` | nullable string | null for `captured` events |
| `new_note` | nullable string | the value after this event |
| `editor_role` | string | whatever the frontend claims (`analyst`/`manager`) — **not verified** (SRS §1) |
| `changed_at` | timestamp | system-generated at write time |

---

## 2. Relationships

```
Case (1) ──────< (0..N) OutcomeAuditEntry
```

- One `Case` has zero audit entries while `status = open`.
- One `Case` has exactly one `captured` entry plus zero or more `corrected` entries once
  resolved (FR-5's no-op rule means not every correction *attempt* produces an entry — only
  ones with an actual change).
- `OutcomeAuditEntry` never exists without a parent `Case`.

---

## 3. State machine — `Case.status`

```
        capture outcome (FR-4)
  open ─────────────────────────> resolved ──┐
                                    ▲          │ correct outcome (FR-5)
                                    └──────────┘  (self-loop, status unchanged,
                                                    only outcome/note/audit change)
```

- **`open`** is the initial state for every case at seed time, unless the seed data itself says
  otherwise (per BR-7, seed rows are trusted as-is — including the one anomalous row,
  `CASE-00220`, that arrives as `status=open` but already carries an `outcome` value; this
  contradiction is preserved on import, not auto-corrected, per your explicit decision).
- **`resolved`** is reached only via FR-4 and is terminal in the sense that there is no "revert
  to open" action anywhere in scope.
- No other states exist. A "disputed further" or "escalated" status was not requested and is
  explicitly out of scope.

---

## 4. Invariants

| # | Invariant | Enforcement point | Known exception |
|---|---|---|---|
| INV-1 | A case with `status = open` has `outcome = null` | Enforced by FR-4/FR-5 write logic going forward | `CASE-00220` violates this at import time (accepted per BR-7) |
| INV-2 | `outcome`, when set via the API (FR-4/FR-5), is one of `won`/`lost`/`fraud_confirmed` | API/application layer only, not DB constraint | `CASE-00215` (`outcome=maybe`) violates this at import time (accepted per BR-7/FR-9) |
| INV-6 | `id` (surrogate) uniquely identifies exactly one `Case` | DB primary key | none — this is why `id` exists instead of relying on `case_id` |
| INV-7 | `case_id` may repeat across multiple `Case` rows and must never be used as a lookup key or FK target | Convention enforced by code review / no unique constraint on `case_id` | `CASE-00213` is the known instance (accepted per BR-7/FR-9) |
| INV-3 | Every `captured`/`corrected` event that changes outcome or note produces exactly one `OutcomeAuditEntry` | Application layer | No-op submits produce zero entries (FR-5) |
| INV-4 | `OutcomeAuditEntry` rows are never updated or deleted | Application layer (no update/delete code path exists for this entity) | none |
| INV-5 | `case_id`, `user_id`, `user_email`, `device_id`, `amount`, `currency`, `created_at`, `region` are never modified by this tool | No update path exposed for these fields | none |

---

## 5. Explicitly out of scope for the domain model

- No `User`/`Account` entity — `user_id`/`user_email` are opaque reference strings, not a
  modeled entity with its own lifecycle (no need to look up or manage customers here).
- No `Device` entity — same reasoning as above.
- No modeling of investigation steps that lead up to an outcome — the tool only records the
  conclusion, not the process (consistent with Phase 1 problem statement).
