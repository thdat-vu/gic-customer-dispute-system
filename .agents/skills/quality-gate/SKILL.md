---
name: quality-gate
description: Validate a completed implementation change in the GCI assessment. Use after code, configuration, schema, API, or test changes and before declaring a milestone complete.
---

# Quality gate

Use only commands verified by repository manifests, configuration, or README; do not guess a toolchain.

1. Inspect changed files and select the cheapest applicable checks.
2. Run, in order where supported: formatter/check, lint, typecheck or compile, targeted tests, broader suite, build.
3. Do not rerun expensive checks without a reason.
4. If a check fails, report its exact command and distinguish current-change failure, pre-existing state, setup/environment failure, and specification mismatch.
5. Do not hide/disable tests or change behavior solely to make a check pass unless the behavior follows the specification.

Return commands, results, skipped checks with reason, and remaining risk.
