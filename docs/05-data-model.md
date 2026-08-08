# 05 — Data Model

**Status:** DRAFT — pending your review.
Concrete SQLite schema realizing the conceptual domain model (`03-domain-model.md`), for
SQLAlchemy models in `backend/app/models/`.

---

## 1. Table: `case`

> **Schema revision:** `case_id` is demoted from primary key to a plain indexed column, and
> `user_id` is now nullable. Both changes are forced by two seed-data canaries found during a
> Codex-assisted review (`CASE-00213` duplicated, `CASE-00218` has blank `user_id`) — see
> `00-problem-statement.md` §9.1 for the reasoning. This is the authoritative schema; any
> earlier version of this table is superseded.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | surrogate key, system-generated; **this is the identity used everywhere** (API paths, FK targets) — not `case_id` |
| `case_id` | TEXT | NOT NULL, INDEX (not unique) | e.g. `CASE-00034`, from seed data; **can repeat** — `CASE-00213` appears on 2 separate rows |
| `user_id` | TEXT | NULLABLE, INDEX | search target (FR-2); blank for `CASE-00218` — stored as SQL `NULL`, not empty string |
| `user_email` | TEXT | NOT NULL, INDEX | search target (FR-2); API/detail retain full value, list masks it per BR-4 |
| `device_id` | TEXT | NOT NULL, INDEX | search target (FR-2); displayed in full for analyst scanning per BR-4 |
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
| `case_ref_id` | INTEGER | NOT NULL, FOREIGN KEY → `case.id`, INDEX | references the surrogate key, **not** `case.case_id` (not unique — see §1 revision note) |
| `event_type` | TEXT | NOT NULL, CHECK (`event_type` IN ('captured','corrected')) | system-generated, always valid — safe to constrain at DB level |
| `previous_outcome` | TEXT | NULLABLE | null for `captured` events |
| `new_outcome` | TEXT | NOT NULL | |
| `previous_note` | TEXT | NULLABLE | null for `captured` events |
| `new_note` | TEXT | NULLABLE | |
| `editor_role` | TEXT | NOT NULL | whatever the frontend sends (`analyst`/`manager`), not validated (SRS §1) |
| `changed_at` | TEXT (ISO 8601) | NOT NULL, DEFAULT now, INDEX (with `case_ref_id`) | index supports "most recent first" ordering in FR-6 |

## 3. Relationships

- `outcome_audit_entry.case_ref_id` → `case.id` (many-to-one, required, no cascade delete
  needed since cases are never deleted per Phase-1 decision to drop soft-delete).

## 4. Seed import mapping

**Verified against Codex-generated `seed_dataset.csv`** (220 data rows) — file confirmed
faithful to the original brief, all 6 known anomalies present and correctly formed, RFC4180
quoting used correctly.

> ⚠️ **Implementation hazard found during verification:** 4 rows have an `outcome_note`
> containing an embedded comma (e.g. `"Duplicate charge, refunded prior to dispute."`),
> correctly wrapped in double quotes per CSV spec. **The seed loader must use a proper
> RFC4180-aware CSV parser** (Python's `csv` module or `pandas.read_csv`) — a naive
> `line.split(',')` implementation will misparse these 4 rows (wrong field count, truncated
> note, shifted columns). This is a real, easy-to-hit bug risk, not a hypothetical one — worth a
> defensive test case (see `08-test-strategy.md`).
> Also ensure the file is opened with **UTF-8 encoding** explicitly — a few rows contain
> non-ASCII characters (e.g. `müller` in email addresses), which is expected realistic data, not
> an anomaly, but will break on a non-UTF-8 default read.

CSV column → table column is a direct 1:1 mapping (no renaming needed), except:
- `id` (surrogate) is **not** in the CSV — assigned by the database on insert, one per physical
  row (so the two `CASE-00213` rows get two different `id` values, as required).
- CSV `user_id` blank (`CASE-00218`) → stored as SQL `NULL`, not empty string.
- CSV `status`/`outcome`/`outcome_note` blanks → stored as SQL `NULL` (not empty string), so
  `outcome IS NULL` reliably means "not yet resolved" for every row except the one documented
  exception (`CASE-00220`).
- No row is skipped, transformed, merged, or rejected during import (FR-9) — this includes
  preserving `CASE-00216`'s negative amount, `CASE-00217`'s future `created_at`, and both
  `CASE-00213` rows as two independent records, unchanged.

## 5. Indexes summary (for query performance, even though dataset is small — cheap to add and documents intent)

- `case(user_id)`, `case(user_email)`, `case(device_id)` — support FR-2 search
- `case(case_id)` — supports display/reference lookup (not unique — may return multiple rows)
- `case(created_at)` — supports FR-1 default sort and FR-7 monthly trend grouping
- `case(region)` — supports FR-7 region-based trend grouping
- `outcome_audit_entry(case_ref_id, changed_at)` — supports FR-6 history ordering

## 6. Explicitly not modeled

- No `user` or `device` table — `user_id`/`device_id`/`user_email` remain plain columns on
  `case`, not foreign keys into a separate identity table (consistent with domain model §5:
  no customer/device entity is in scope).
