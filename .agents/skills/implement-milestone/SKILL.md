---
name: implement-milestone
description: Implement one approved milestone from docs/09-implementation-plan.md for the GCI assessment. Use only when the user requests a specific implementation milestone or a bounded task within one milestone.
---

# Implement one milestone

1. Identify the single milestone and definition of done in `docs/09-implementation-plan.md`.
2. Use `spec-guard` for behavior, API, and persistence decisions.
3. Inspect the existing implementation, then state a short plan.
4. Make the smallest coherent change within that milestone. Do not refactor unrelated code or opportunistically start a later milestone.
5. Add or update tests for relevant acceptance criteria; prioritize `docs/08-test-strategy.md` P0/P1.
6. Run the cheapest relevant validation, then broader validation before completion. Use `quality-gate` when the change is complete.
7. Report files changed, requirements covered, tests, validation commands/results, material decisions, and unresolved issues.

Preserve public contracts unless the specification explicitly changes them. Avoid speculative abstractions.
