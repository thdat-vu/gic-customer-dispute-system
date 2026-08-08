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
