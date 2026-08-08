# AI Usage Log

## Candidate 01 — Milestone 2 validation boundary

### AI-generated proposal

During planning, Codex identified that `docs/09-implementation-plan.md` asked for every P0 test
in Milestone 2, while `docs/06-api-contracts.md` placed the Pydantic validation boundary in
Milestone 3. It proposed blocking rather than silently adding API-layer work early.

### Human-modified direction

I decided that Milestone 2 should contain the smallest Pydantic schema necessary to remove that
bottleneck: `OutcomeSubmission` validates `won` / `lost` / `fraud_confirmed` and the 1000
character note limit, but it adds no FastAPI route, CORS configuration, or error handler. The
service receives only this validated input. The P0 test proves an invalid `maybe` value fails
while constructing the schema, before a service input exists.

### Reason for change

This preserves the documented validation boundary and lets the milestone meet its stated P0
Definition of Done without opportunistically implementing the API layer. It also makes the
milestone split and my intervention concrete rather than claiming AI only generated boilerplate.

## Candidate 04 — Milestone 3 OpenAPI contract verification

### AI-assisted finding

The first API implementation returned the required shared error envelope at runtime, but OpenAPI
still advertised FastAPI's default `HTTPValidationError` for 422 responses. Codex found this by
reading the generated local `/openapi.json` during the milestone verification.

### Result retained for review

The implementation now declares `ErrorResponse` on documented 404/422 responses and has an
integration test asserting that Swagger references that schema. Runtime responses and the
machine-readable contract therefore agree. I should keep this only if I can explain the tradeoff
in the final submission: custom exception handlers alone do not update OpenAPI documentation.

## Candidate 05 — Milestone 4 shadcn scope decision

### AI-assisted option

Codex reviewed the shadcn installation guidance and identified two available approaches: use the
CLI to copy the small set of component sources needed by this Next.js app, or configure an MCP
server for registry discovery and generation.

### Human decision and result

I chose the CLI-only path to keep the assessment setup small. It initialized shadcn in the
existing Next.js/Tailwind project and added only Button, Input, Select, Sheet, Table, Badge,
Skeleton, and Separator. No shadcn MCP server or extra design tooling was added.

### Reason for change

The visual source of truth was already `DESIGN.md` plus the three reference images; an MCP server
would not unlock required product behavior for this milestone. Using copied local components kept
the UI implementation inspectable and avoided another moving part during the time-boxed task.

## Candidate 06 — Milestone 5 shared outcome editor

### AI-generated implementation option

Codex identified two reasonable frontend structures for capture and correction: separate forms
for open and resolved cases, or one form whose copy and initial values reflect the current case
status.

### Direction retained for review

I retained the documented shared-component direction. `OutcomeEditor` pre-fills a resolved
case, shows a correction notice, and sends both cases to the same documented POST endpoint. The
backend remains responsible for deciding whether the write is a capture, correction, or no-op.
The Manager view deliberately does not render that component and fetches history only after the
local UI role changes to Manager.

### Reason for change

The shared form keeps the two flows visibly consistent while avoiding duplicated client-side
write logic. More importantly, it preserves the API contract: the client does not invent a
capture/correction flag or enforce authorization that the assignment explicitly leaves UI-only.
Before final submission, I should verify that this entry accurately reflects my own review of
the generated implementation rather than presenting it as a human-authored change.

## Candidate 07 — Milestone 6 trend presentation

### AI-generated options

Codex identified that FR-7 and the milestone definition allow either a simple table or chart.
The visual reference includes a line chart and table, while the behavioral specification only
requires counts by month and/or region plus an empty state.

### Direction retained for review

I retained a compact outcome-breakdown table and added the API's existing Month/Region grouping
control. I did not add a chart library, date-range controls, or any new aggregation endpoint.

### Reason for change

The table exposes all required counts accurately in the smallest implementation and avoids
turning a one-hour milestone into chart-library setup. I spot-checked the frontend's expected
monthly API values against the seeded SQLite query before marking the milestone complete. Before
final submission, I should verify this describes my own review and decision accurately.

## Candidate 08 — Milestone 7 README handoff

### AI-generated drafting support

Codex assembled a README outline from the verified package manifests and the approved scope:
local setup, one-time seed behavior, run commands, architecture, implemented/deferred scope,
and validation commands.

### Review point retained for final disclosure

The README explicitly warns that the seed loader is not idempotent. I retained that warning
instead of suggesting an undocumented destructive reset command, because rerunning the importer
after recording outcomes would append duplicate source records.

### Reason for change

This makes a fresh-clone path reproducible while protecting the local assessment data from an
easy setup mistake. Before submission, I should confirm this entry accurately reflects my own
review of the generated README and retain only a genuine before/after example in the final
disclosure.

## Candidate 09 — Post-core list stretch decisions

### AI-assisted ambiguity review

Codex identified that the original pagination stretch did not define page indexing, page size,
month-range semantics, or the list PII display contract. It also detected that the local database
had 440 rows because the non-idempotent seed command had run twice.

### Candidate decisions and result

I approved one-based pagination, default/maximum 20 rows, optional inclusive `start_month` /
`end_month` bounds on `created_at`, and list email masking while keeping user ID/device ID
visible. I also explicitly authorized resetting only the local ignored SQLite database and
reseeding it once to recover the required 220 records.

### Reason for change

These constraints keep the stretch small, make page controls predictable, and reduce routine
email exposure without breaking the documented unmasked search/detail behavior. The reset was
necessary to restore FR-9's 220-record acceptance condition; it was not an application feature.

## Candidate 10 — List refinement after visual review

### AI-assisted options

Codex identified two possible pagination implementations: add `fastapi-pagination`, or retain
the already-tested query/offset implementation and add direct numeric page controls. It also
identified browser URL synchronization as optional deep-link behavior rather than a requirement.

### Candidate direction

I retained the existing small pagination implementation, added direct page buttons, Reset, exact
status/region filtering, and changed the default month range to January of the current year
through the current month. I did not add URL query synchronization or a new dependency.

### Reason for change

The feature set improves analyst scanning while preserving a small, documented API surface. The
existing `total` response was enough to render numeric pages for this bounded dataset, so an
additional pagination library would not have solved a concrete problem.

## Candidate 02 — Documentation consistency review

### AI-assisted finding

Codex identified that decisions updated in one specification document had not always been
cascaded to the documents that referenced them. The first review found the `case_id`/`user_id`
seed-data inconsistencies. A later review found the stale error-envelope wording; during the
follow-up scan, I also found and corrected the stale `app/ (or pages/)` repository-layout wording.

### Candidate reflection

This is the second time I changed a decision in one document but initially missed a dependent
reference elsewhere. The lesson is to run a targeted repository-wide `rg` search for relevant
terms after changing any decision that has already been settled, before claiming the work is
complete. I will make that consistency scan a default documentation step rather than editing
only the file that was raised in review.

This log is supporting evidence only. I will finalize the required human before/after disclosure
for the submission with a concrete implementation example after one exists.

## Candidate 11 — Historical data-quality visibility

### AI-assisted finding

During final UI review, I asked whether the known malformed seed records were visibly indicated.
Codex confirmed that the existing `open` and `resolved` values are business workflow states and
that adding a third status would conflict with the approved data model.

### Candidate direction

I approved a separate, read-only `has_data_quality_issue` flag plus stable issue codes on case
list/detail responses. The UI renders an amber `Data issue` badge and explanatory reasons, plus
an optional Data issues-only filter that is applied before pagination. It detects the six
documented anomaly classes, but does not clean source data or change a case's outcome workflow.

### Reason for change

This makes planted seed-data canaries visible during assessment review while preserving FR-9's
as-is import rule. The chosen alternative was a third case status such as `needs_review`; I
rejected it because it would conflate data diagnostics with the only two defined business states.

## Candidate 03 — Stitch UI exploration and Codex handoff

### Evidence

I used Stitch to explore a visual direction for “Dispute Ops Analyst Portal”. The generated
workspace included a design-system board plus Cases, Case Detail, and Trends screens. I retained
the output as visual guidance only, then reviewed it against the behavioral specification before
adding `DESIGN.md` and `design-reference/` to the repository.

### Prompt used with Stitch

```text
Design a desktop-first internal operations web application called "Dispute Ops".

This is a small take-home assessment for support/fraud analysts to review dispute cases, record
final outcomes, and inspect simple outcome trends. It is not a consumer product, fintech
marketing site, complex enterprise dashboard, or pixel-perfect design exercise.

The UI should be professional, operational, calm, trustworthy, and information-dense without
clutter. Use a restrained neutral system with one primary accent. Avoid gradients,
glassmorphism, oversized cards, excessive shadows, decorative illustrations, and unnecessary
dashboard widgets.

Core flows:
1. Browse/search dispute cases.
2. Inspect one case.
3. Record or correct its final outcome.
4. View outcome trends.

Product boundaries:
- Include an “Acting as” Analyst/Manager dropdown as local UI state only. Do not add
  authentication, authorization, approval workflows, or backend requirements.
- Show supplied user ID, email, and device ID in full in v1. Do not invent masking, copy, or
  visibility-toggle controls; PII masking is deferred stretch work.
- Do not add manual-case creation, export, priority queues, notifications, settings, or other
  unspecified operations features.

Create a desktop Cases screen with product name “Dispute Ops”, Cases/Trends navigation, an
Acting-as dropdown, a selected-field search control (user ID, device ID, or email), and a dense
table with Case ID, Created, Region, Amount, Status, Outcome, and optional chevron. Optimize for
scanning, compact rows, readable monetary amounts, status/outcome distinction, and an explicit
unrecorded outcome state. Use a result count; do not add core pagination.

Selecting a case should preferably open a right-side detail drawer. Show case ID, created date,
region, amount, status, current outcome, user ID, email, and device ID. Include Won, Lost,
Fraud confirmed, optional note, and Save outcome. Visually communicate correction of an existing
outcome.

Create a simple Trends screen with monthly counts of won, lost, and fraud_confirmed; region
grouping may be offered. Use one useful chart and a compact tabular breakdown. Do not add
date-range behavior beyond documented monthly/region grouping or turn it into a BI dashboard.

Consider loading, no cases, no search results, API error, unrecorded case, resolved case,
successful save, and correction states. Desktop is primary; tablet remains usable; mobile only
needs graceful degradation. Use WCAG-conscious contrast, focus states, labels, readable tables,
and non-color status indicators.

Produce one coherent visual direction, Cases, Case Detail/Outcome, Trends, and a small,
implementable DESIGN.md covering tokens, layout, table and form styling, badges, drawer behavior,
charts, responsive behavior, accessibility, and explicit do's/don'ts. Do not change product
behavior or add features outside this scope.
```

### Codex handoff prompt

```text
Read DESIGN.md and the UI reference images under design-reference/.

Treat GIC.md and docs/*.md as the source of truth for product behavior, DESIGN.md as the source
of truth for visual design, and reference images as visual guidance rather than requirements.
Do not invent functionality from mockups.

Before implementing frontend code, map the design into application shell, routes, page layouts,
reusable components, design tokens, responsive rules, and loading/empty/error/success states.
Then implement according to the approved milestone. If DESIGN.md conflicts with functional
requirements, functional requirements win and report the conflict.
```

### Candidate decision

I used the generated screens to accelerate visual exploration, but rejected or deferred visual
elements that exceeded documented scope (default PII masking, manual-case creation, export,
priority queues, date-range controls, and core pagination). I used `DESIGN.md` as a persistent
UI source of truth only; I did not add extra Stitch/Google design-tooling infrastructure for this
24-hour assessment.
