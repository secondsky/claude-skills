#!/bin/bash
#
# Bash Audit Logger - PreToolUse Hook for Claude Code
#
# Logs all bash commands with timestamps for compliance and debugging.
#
# Usage:
#   Configure as PreToolUse hook in ~/.claude/settings.json:
#
#   {
#     "hooks": {
#       "PreToolUse": [
#         {
#           "matcher": "Bash",
#           "hooks": [
#             {
#               "type": "command",
#               "command": "~/.claude/hooks/bash-audit-logger.sh"
#             }
#           ]
#         }
#       ]
#     }
#   }
#
# Input:
#   Reads JSON from stdin (Claude Code PreToolUse payload shape):
#     {"tool_input": {"command": "...", "description": "..."}, ...}
#   Previously this hook read $CLAUDE_TOOL_INPUT (env var) — that was wrong;
#   Claude Code sends the payload on stdin, not via env. Fixed.
#
# Secret handling:
#   Known secret shapes (Bearer tokens, Authorization headers, password=,
#   --token, OpenAI/Slack/AWS/GitHub token prefixes) are REDACTED before
#   the command is written to the log. This is best-effort; users with
#   custom secret formats should extend the redact_secrets() function below.
#
# Output:
#   Appends to ~/.claude/bash-audit.log with 0600 permissions.
#
# Exit Codes:
#   0 = Always (this hook never blocks)

# Restrictive umask for any file we create (log, lock).
umask 077

# Configuration
LOG_FILE="${HOME}/.claude/bash-audit.log"
MAX_LOG_SIZE=10485760  # 10MB

# ---------------------------------------------------------------------------
# redact_secrets: scrub common secret shapes from a string before logging.
# Best-effort; extend this function for project-specific secret formats.
# Uses `sed -E` (extended regex) — supported by both GNU and BSD sed.
# ---------------------------------------------------------------------------
redact_secrets() {
    local s="$1"
    s=$(printf '%s' "$s" | sed -E \
        -e 's/(Bearer[[:space:]]+)[A-Za-z0-9._-]+/\1***REDACTED***/gI' \
        -e 's/(Authorization:[[:space:]]*Bearer[[:space:]]+)[A-Za-z0-9._-]+/\1***REDACTED***/gI' \
        -e 's/(password=)[^[:space:]]+/\1***REDACTED***/gI' \
        -e 's/(PGPASSWORD=)[^[:space:]]+/\1***REDACTED***/gI' \
        -e 's/(--token[[:space:]]+)[^[:space:]]+/\1***REDACTED***/gI' \
        -e 's/(sk-[a-zA-Z0-9]{20,})/***REDACTED-sk_***/g' \
        -e 's/(ghp_[A-Za-z0-9]{36})/***REDACTED-ghp_***/g' \
        -e 's/(AKIA[0-9A-Z]{16})/***REDACTED-AKIA_***/g' \
        -e 's/(xox[baprs]-[A-Za-z0-9-]+)/***REDACTED-xox_***/g')
    printf '%s' "$s"
}

# Create log directory if doesn't exist
mkdir -p "$(dirname "$LOG_FILE")"

# ---------------------------------------------------------------------------
# Parse command from stdin (Claude Code PreToolUse JSON payload).
# ---------------------------------------------------------------------------
INPUT=$(cat)
COMMAND=$(printf '%s' "$INPUT" | jq -r '.tool_input.command // "N/A"')
DESCRIPTION=$(printf '%s' "$INPUT" | jq -r '.tool_input.description // "No description"')

# Redact secrets before any write
COMMAND=$(redact_secrets "$COMMAND")
DESCRIPTION=$(redact_secrets "$DESCRIPTION")

# Get timestamp
TIMESTAMP=$(date -Iseconds 2>/dev/null || date '+%Y-%m-%dT%H:%M:%S%z')

# Log entry format: [timestamp] user@host:pwd $ command
LOG_ENTRY="[${TIMESTAMP}] ${USER}@$(hostname):$(pwd) $ ${COMMAND}"

# ---------------------------------------------------------------------------
# Append to log file with rotation. Rotation (mv + recreate) has an inherent
# race between concurrent writers; wrap the size-check + rotate + append in a
# flock if available. flock is Linux-only by default; on macOS it must be
# installed (e.g. `brew install util-linux`). If unavailable we fall back to
# the non-atomic append and surface a TODO.
# ---------------------------------------------------------------------------
append_with_rotation() {
    # On first creation, ensure 0600 perms.
    if [ ! -f "$LOG_FILE" ]; then
        : > "$LOG_FILE"
        chmod 600 "$LOG_FILE" 2>/dev/null || true
    fi

    if [ -n "${HAS_FLOCK:-}" ]; then
        (
            flock -x 200 || exit 1
            _rotate_and_append
        ) 200>"${LOG_FILE}.lock"
    else
        # TODO: install flock (brew install util-linux) for atomic rotation.
        _rotate_and_append
    fi
}

_rotate_and_append() {
    local log_size
    log_size=$(stat -f%z "$LOG_FILE" 2>/dev/null || stat -c%s "$LOG_FILE" 2>/dev/null || echo 0)
    if [ "$log_size" -gt "$MAX_LOG_SIZE" ]; then
        mv "$LOG_FILE" "${LOG_FILE}.old"
        echo "[${TIMESTAMP}] Log rotated (size: ${log_size} bytes)" > "$LOG_FILE"
        chmod 600 "$LOG_FILE" 2>/dev/null || true
    fi
    echo "$LOG_ENTRY" >> "$LOG_FILE"
}

# Detect flock once
if command -v flock >/dev/null 2>&1; then
    HAS_FLOCK=1
fi

append_with_rotation

# Always allow execution
exit 0
