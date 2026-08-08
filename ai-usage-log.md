# AI Usage Log

## Candidate 01 — Error handling

### AI-generated version

```ts
try {
  ...
} catch (error) {
  return res.status(500).json({
    error: error.message
  });
}
```

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
