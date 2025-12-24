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
    1 = Block with generic error
    2 = Block with custom error message (from stderr)
"""

import json
import sys
import re

# Read hook input from stdin (JSON format)
try:
    data = json.load(sys.stdin)
    command = data.get('tool_input', {}).get('command', '')
except (json.JSONDecodeError, KeyError) as e:
    # If can't parse input, allow execution (fail open for safety)
    sys.exit(0)

# Dangerous command patterns to block
DANGEROUS_PATTERNS = [
    # Filesystem destruction
    (r'rm\s+-rf\s+/', 'Delete root directory (rm -rf /)'),
    (r'rm\s+-rf\s+~/', 'Delete home directory (rm -rf ~/)'),
    (r'rm\s+-rf\s+\*', 'Recursive delete with wildcard (rm -rf *)'),

    # Disk operations
    (r'dd\s+if=', 'Direct disk write operation (dd)'),
    (r'mkfs\.', 'Format filesystem (mkfs)'),

    # Fork bomb
    (r':\(\)\s*\{\s*:\|\:&\s*\}\s*;\s*:', 'Fork bomb'),

    # Dangerous sudo operations
    (r'sudo\s+rm\s+-rf', 'Sudo recursive delete'),
    (r'sudo\s+dd', 'Sudo disk operation'),

    # Git force operations on protected branches
    (r'git\s+push\s+.*--force.*\s+(main|master)', 'Force push to main/master branch'),
    (r'git\s+push\s+.*-f\s+.*(main|master)', 'Force push to main/master branch'),

    # Overwrite important system files
    (r'>\s*/etc/passwd', 'Overwrite /etc/passwd'),
    (r'>\s*/etc/shadow', 'Overwrite /etc/shadow'),
    (r'>\s*/boot/', 'Overwrite boot files'),

    # Chmod dangerous patterns
    (r'chmod\s+-R\s+777\s+/', 'Chmod 777 on root'),
    (r'chmod\s+777\s+/etc', 'Chmod 777 on /etc'),
]

# Check command against all patterns
for pattern, description in DANGEROUS_PATTERNS:
    if re.search(pattern, command, re.IGNORECASE):
        error_msg = f"🚨 BLOCKED: {description}\n\nCommand: {command}\n\nThis command has been blocked for safety. If you need to perform this operation, please do it manually."
        print(error_msg, file=sys.stderr)
        sys.exit(2)  # Exit code 2 = block with custom error

# Command is safe, allow execution
sys.exit(0)
