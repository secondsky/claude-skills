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
# Output:
#   Appends to ~/.claude/bash-audit.log
#
# Exit Codes:
#   0 = Always (this hook never blocks)

# Configuration
LOG_FILE="${HOME}/.claude/bash-audit.log"
MAX_LOG_SIZE=10485760  # 10MB

# Create log directory if doesn't exist
mkdir -p "$(dirname "$LOG_FILE")"

# Parse command from CLAUDE_TOOL_INPUT
COMMAND=$(echo "$CLAUDE_TOOL_INPUT" | jq -r '.tool_input.command // "N/A"')
DESCRIPTION=$(echo "$CLAUDE_TOOL_INPUT" | jq -r '.tool_input.description // "No description"')

# Get timestamp
TIMESTAMP=$(date -Iseconds)

# Log entry format: [timestamp] user@host:pwd $ command
LOG_ENTRY="[${TIMESTAMP}] ${USER}@$(hostname):$(pwd) $ ${COMMAND}"

# Append to log file
echo "$LOG_ENTRY" >> "$LOG_FILE"

# Rotate log if too large
if [ -f "$LOG_FILE" ]; then
    LOG_SIZE=$(stat -f%z "$LOG_FILE" 2>/dev/null || stat -c%s "$LOG_FILE" 2>/dev/null || echo 0)
    if [ "$LOG_SIZE" -gt "$MAX_LOG_SIZE" ]; then
        mv "$LOG_FILE" "${LOG_FILE}.old"
        echo "[${TIMESTAMP}] Log rotated (size: ${LOG_SIZE} bytes)" > "$LOG_FILE"
    fi
fi

# Always allow execution
exit 0
