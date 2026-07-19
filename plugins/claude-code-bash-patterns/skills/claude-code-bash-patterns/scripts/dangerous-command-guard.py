#!/usr/bin/env python3
"""
Dangerous Command Guard - PreToolUse Hook for Claude Code

Blocks dangerous bash commands that could cause system damage or data loss.

Usage:
    Configure as PreToolUse hook in ~/.claude/settings.json:

    {
      "hooks": {
        "PreToolUse": [
          {
            "matcher": "Bash",
            "hooks": [
              {
                "type": "command",
                "command": "python3 ~/.claude/hooks/dangerous-command-guard.py"
              }
            ]
          }
        ]
      }
    }

Exit Codes:
    0 = Allow execution
    1 = Non-blocking error
    2 = Block with custom error message (from stderr)

Security posture:
    FAIL-SECURE. A security guard that silently disables itself on parse
    errors is worse than no guard — malformed/unexpected input is blocked
    (exit 2), not allowed. Only well-formed input with no dangerous pattern
    is allowed.

    NOTE: This is a DENYLIST and is therefore inherently incomplete — a
    determined attacker can craft bypasses (aliases, env-var expansion,
    quoted variants, base64-decoded payloads, etc.). The recommended
    primary control is an ALLOWLIST via `allowedTools` / `Permissions` in
    settings.json. This guard is defense-in-depth, not a boundary.
"""

import json
import sys
import re

# ---------------------------------------------------------------------------
# Parse and validate stdin input. Fail secure (block, exit 2) on ANY error.
# Claude Code sends a JSON object on stdin with shape:
#   {"tool_input": {"command": "...", ...}, ...}
# ---------------------------------------------------------------------------
try:
    data = json.load(sys.stdin)
except (json.JSONDecodeError, ValueError) as e:
    sys.stderr.write(
        f"PreToolUse guard: malformed JSON on stdin ({e}); failing closed.\n"
    )
    sys.exit(2)  # BLOCK with reason

if not isinstance(data, dict):
    sys.stderr.write(
        f"PreToolUse guard: expected JSON object, got "
        f"{type(data).__name__}; failing closed.\n"
    )
    sys.exit(2)

tool_input = data.get('tool_input', {})
if not isinstance(tool_input, dict):
    sys.stderr.write(
        f"PreToolUse guard: tool_input is not an object "
        f"(got {type(tool_input).__name__}); failing closed.\n"
    )
    sys.exit(2)

command = tool_input.get('command', '')
# No command, or command isn't a string -> not a bash-invocation we can check.
# Allow (exit 0): legitimate non-bash tool input or empty commands.
if not isinstance(command, str) or not command:
    sys.exit(0)

# Ensure command is a string for regex matching (defensive — already checked).
command = str(command)

# ---------------------------------------------------------------------------
# Dangerous command patterns to block.
#
# This is a DENYLIST: it can only catch known-bad shapes. It will miss
# novel/obfuscated invocations. Treat allowlist-based tool restrictions in
# settings.json as the primary control; this guard is defense-in-depth.
# ---------------------------------------------------------------------------
DANGEROUS_PATTERNS = [
    # --- Filesystem destruction (existing) ---
    (r'rm\s+-rf\s+/', 'Delete root directory (rm -rf /)'),
    (r'rm\s+-rf\s+~/', 'Delete home directory (rm -rf ~/)'),
    (r'rm\s+-rf\s+\*', 'Recursive delete with wildcard (rm -rf *)'),

    # --- Filesystem destruction (A-003: catch flag-order/variant bypasses) ---
    # rm with -fr / -rf / --recursive / --force in any order, targeting /
    #   e.g. `rm -fr /`, `rm -rf /usr`, `rm --recursive --force /`,
    #        `rm -r -f /etc`, `rm -fr /home`
    (r'rm\s+(-[a-zA-Z]*[frR][a-zA-Z]*\s+)+(/|/[^\s]*)(\s|$)',
     'Recursive forced delete targeting root filesystem'),
    (r'rm\s+--recursive\s+--force\s+(/|/[^\s]*)',
     'Recursive forced delete (--recursive --force) targeting root filesystem'),
    (r'rm\s+--force\s+--recursive\s+(/|/[^\s]*)',
     'Recursive forced delete (--force --recursive) targeting root filesystem'),

    # --- Disk operations (existing) ---
    (r'dd\s+if=', 'Direct disk write operation (dd)'),
    (r'mkfs\.', 'Format filesystem (mkfs)'),

    # --- find -delete on root (A-003) ---
    (r'\bfind\s+/[^\|]*\s+-delete\b',
     'Recursive delete via find starting at root'),

    # --- Fork bomb (A-003: flexible spacing) ---
    # Classic :(){ :|:& };: with flexible whitespace
    (r':\(\)\s*\{\s*:\s*\|\s*:\s*&\s*\}\s*;?\s*:',
     'Fork bomb'),

    # --- Dangerous sudo operations (existing) ---
    (r'sudo\s+rm\s+-rf', 'Sudo recursive delete'),
    (r'sudo\s+dd', 'Sudo disk operation'),

    # --- Git force operations (A-003: catch --force in any position) ---
    # Old patterns required branch name; --force often comes AFTER the branch.
    (r'\bgit\s+push\s+--force\b',
     'Force push (--force flag)'),
    (r'\bgit\s+push\s+\S+\s+\S+\s+--force\b',
     'Force push (--force after branch)'),
    (r'\bgit\s+push\s+.*--force.*\s+(main|master)\b',
     'Force push to main/master branch'),
    (r'\bgit\s+push\s+.*-f\s+.*(main|master)\b',
     'Force push (-f) to main/master branch'),

    # --- Overwrite important system files (existing + A-003 expansion) ---
    (r'>\s*/etc/passwd\b', 'Overwrite /etc/passwd'),
    (r'>\s*/etc/shadow\b', 'Overwrite /etc/shadow'),
    (r'>\s*/etc/sudoers\b', 'Overwrite /etc/sudoers'),
    (r'\b>\s*/etc/(passwd|sudoers|shadow)\b',
     'Direct overwrite of authentication file'),
    (r'>\s*/boot/', 'Overwrite boot files'),

    # --- Chmod dangerous patterns (A-003: any 3-4 digit octal, not just 777) ---
    (r'\bchmod\s+-R\s+[0-7]{3,4}\s+/',
     'Recursive chmod on root filesystem (e.g. chmod -R 777 /usr)'),
    (r'chmod\s+-R\s+777\s+/', 'Chmod 777 on root (legacy pattern)'),
    (r'chmod\s+777\s+/etc', 'Chmod 777 on /etc'),

    # --- Pipe-to-shell (A-003: curl/wget | sh|bash) ---
    (r'\bcurl\b[^\|]*\|\s*(sh|bash)\b',
     'Pipe remote content to shell (curl | sh)'),
    (r'\bwget\b[^\|]*\|\s*(sh|bash)\b',
     'Pipe remote content to shell (wget | sh)'),
]

# Check command against all patterns
for pattern, description in DANGEROUS_PATTERNS:
    if re.search(pattern, command, re.IGNORECASE):
        error_msg = (
            f"BLOCKED: {description}\n\n"
            f"Command: {command}\n\n"
            f"This command has been blocked for safety. If you need to "
            f"perform this operation, please do it manually."
        )
        print(error_msg, file=sys.stderr)
        sys.exit(2)  # Exit code 2 = block with custom error

# Command is safe, allow execution
sys.exit(0)
