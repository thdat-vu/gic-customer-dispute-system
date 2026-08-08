# 05 — Data Model

**Status:** DRAFT — pending your review.
Concrete SQLite schema realizing the conceptual domain model (`03-domain-model.md`), for
SQLAlchemy models in `backend/app/models/`.

---

## 1. Table: `case`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `case_id` | TEXT | PRIMARY KEY | e.g. `CASE-00034`, from seed data |
| `user_id` | TEXT | NOT NULL, INDEX | search target (FR-2) |
| `user_email` | TEXT | NOT NULL, INDEX | search target (FR-2); PII, shown in full (BR-4 v1) |
| `device_id` | TEXT | NOT NULL, INDEX | search target (FR-2); PII-adjacent, shown in full (BR-4 v1) |
| `amount` | REAL | NOT NULL | SQLite has no true DECIMAL type; float precision is an accepted limitation since amount is display-only in this tool, never computed/summed anywhere in scope |
| `currency` | TEXT | NOT NULL | e.g. `USD`, not validated against an ISO list (out of scope) |
| `created_at` | TEXT (ISO 8601) | NOT NULL, INDEX | index supports default sort (FR-1) and month-grouping for trend (FR-7); stored as ISO string, matches seed CSV format directly |
| `region` | TEXT | NOT NULL, INDEX | index supports trend-by-region (FR-7) |
| `status` | TEXT | NOT NULL, CHECK (`status` IN ('open','resolved')) | **DB-level CHECK is safe here** — unlike `outcome`, every seed row's `status` value is already valid (no anomalous status values exist in the provided dataset) |
| `outcome` | TEXT | NULLABLE, **no CHECK constraint** | Deliberately unconstrained at DB level per FR-9/INV-2, to tolerate seed row `CASE-00215` (`outcome=maybe`). Enum validity (`won`/`lost`/`fraud_confirmed`) enforced only in `services/` for new writes via FR-4/FR-5. |
| `outcome_note` | TEXT | NULLABLE | assumed soft cap of 1000 characters enforced at the Pydantic schema layer (not DB-level) — flag if you want a different limit |

## 2. Table: `outcome_audit_entry`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | |
| `case_id` | TEXT | NOT NULL, FOREIGN KEY → `case.case_id`, INDEX | |
| `event_type` | TEXT | NOT NULL, CHECK (`event_type` IN ('captured','corrected')) | system-generated, always valid — safe to constrain at DB level |
| `previous_outcome` | TEXT | NULLABLE | null for `captured` events |
| `new_outcome` | TEXT | NOT NULL | |
| `previous_note` | TEXT | NULLABLE | null for `captured` events |
| `new_note` | TEXT | NULLABLE | |
| `editor_role` | TEXT | NOT NULL | whatever the frontend sends (`analyst`/`manager`), not validated (SRS §1) |
| `changed_at` | TEXT (ISO 8601) | NOT NULL, DEFAULT now, INDEX (with `case_id`) | index supports "most recent first" ordering in FR-6 |

## 3. Relationships

- `outcome_audit_entry.case_id` → `case.case_id` (many-to-one, required, no cascade delete
  needed since cases are never deleted per Phase-1 decision to drop soft-delete).

## 4. Seed import mapping

CSV column → table column is a direct 1:1 mapping (no renaming needed), except:
- CSV `status`/`outcome`/`outcome_note` blanks → stored as SQL `NULL` (not empty string), so
  `outcome IS NULL` reliably means "not yet resolved" for every row except the one documented
  exception (`CASE-00220`).
- No row is skipped, transformed, or rejected during import (FR-9) — this includes preserving
  `CASE-00216`'s negative amount and `CASE-00217`'s future `created_at` unchanged.

## 5. Indexes summary (for query performance, even though dataset is small — cheap to add and documents intent)

- `case(user_id)`, `case(user_email)`, `case(device_id)` — support FR-2 search
- `case(created_at)` — supports FR-1 default sort and FR-7 monthly trend grouping
- `case(region)` — supports FR-7 region-based trend grouping
- `outcome_audit_entry(case_id, changed_at)` — supports FR-6 history ordering

## 6. Explicitly not modeled

- No `user` or `device` table — `user_id`/`device_id`/`user_email` remain plain columns on
  `case`, not foreign keys into a separate identity table (consistent with domain model §5:
  no customer/device entity is in scope).
