#!/usr/bin/env python3
"""Emit small, stable project context for Codex SessionStart."""
import json

CONTEXT = (
    "24-hour GCI technical assessment. Source of truth: docs/02-srs.md, "
    "04-architecture.md, 05-data-model.md, 06-api-contracts.md, and "
    "09-implementation-plan.md; use AGENTS.md and .agents/skills. "
    "Do not invent requirements. Current plan: docs/09-implementation-plan.md. "
    "No canonical validation commands exist until Milestone 0 creates manifests."
)

print(json.dumps({"hookSpecificOutput": {"hookEventName": "SessionStart", "additionalContext": CONTEXT}}))
