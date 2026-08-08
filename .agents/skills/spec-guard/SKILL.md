---
name: spec-guard
description: Guard the GCI dispute-outcome assessment against requirement drift. Use when interpreting requirements, implementing business behavior, or changing API, persistence, or domain behavior, especially when ambiguity or document conflicts are possible.
---

# Spec guard

1. Locate the relevant FR/acceptance criterion in `docs/02-srs.md` and its business-rule trace.
2. Check related decisions in `docs/04-architecture.md`, `docs/05-data-model.md`, and `docs/06-api-contracts.md`; consult `docs/03-domain-model.md` and `docs/07-security.md` when relevant.
3. State the requirement IDs and sections being implemented.
4. If behavior is unspecified or sources disagree, stop and report:

   ```text
   BLOCKED
   - Source: <file and section>
   - Ambiguity/conflict: <what disagrees or is missing>
   - Implementation impact: <what cannot safely be chosen>
   - Decision needed: <one human question>
   ```

5. Never add product behavior merely to unblock work. Keep the response concise.
