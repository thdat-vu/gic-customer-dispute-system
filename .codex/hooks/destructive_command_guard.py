#!/usr/bin/env python3
"""Reject a short list of clearly destructive shell commands."""
import json
import re
import sys

def blocked(command: str) -> str | None:
    rules = (
        (r"\bgit\s+reset\s+--hard\b", "git reset --hard is blocked."),
        (r"\bgit\s+clean\b[^\n]*(?:-\S*[fdx]|--force|--fd|--fdx)", "Destructive git clean is blocked."),
        (r"\bgit\s+push\b[^\n]*(?:--force\b|\s-f\b)", "Force-pushing is blocked."),
        (r"\brm\s+(?:-[^\n]*[rf][^\n]*\s+)+(?:(?:\./)?\.git|/|~|\$\{?home\}?|\.)(?:\s|$)", "Recursive removal of a repository, home, or system path is blocked."),
        (r"\brm\s+(?:-[^\n]*[rf][^\n]*\s+)+[^\n]*\.git\b", "Removing .git is blocked."),
        (r"\b(?:drop\s+(?:database|table)|sqlite3\b[^\n]*\bdrop\b)", "Destructive database drop is blocked."),
        (r"\b(?:cat|less|more|head|tail|sed|awk)\b[^\n]*\.env(?:\s|$)", "Printing a local environment file is blocked."),
        (r"\b(?:curl|wget|scp|rsync|nc)\b[^\n]*\.env(?:\s|$)", "Uploading a local environment file is blocked."),
    )
    for pattern, reason in rules:
        if re.search(pattern, command, re.IGNORECASE):
            return reason
    return None

try:
    payload = json.load(sys.stdin)
    reason = blocked(str(payload.get("tool_input", {}).get("command", "")))
    if reason:
        print(json.dumps({"hookSpecificOutput": {"hookEventName": "PreToolUse", "permissionDecision": "deny", "permissionDecisionReason": reason}}))
except json.JSONDecodeError:
    pass
