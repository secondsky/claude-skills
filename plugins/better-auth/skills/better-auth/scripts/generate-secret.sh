#!/bin/bash
# Generate a secure BETTER_AUTH_SECRET.
#
# Security note: by default this script does NOT print the secret value to
# stdout. In agent-wrapped flows (Claude Code, etc.) stdout is captured into
# transcripts, logs and commits, so printing a secret there is equivalent to
# committing it. Instead, the default behavior is:
#
#   - If `wrangler` is on PATH: pipe the secret directly into
#     `wrangler secret put BETTER_AUTH_SECRET` so it is stored as a Worker
#     secret and never appears in the shell environment or logs.
#   - Otherwise: print a NON-secret confirmation to stdout telling the user
#     the value was generated (value suppressed).
#
# Escape hatch: pass `--print` to view the value. When `--print` is set the
# value is written to STDERR (not stdout), prefixed by a warning banner, so
# it is not captured by `$(...)`, `tee`, or agent tool-call output by default.
#
# Usage:
#   ./generate-secret.sh           # store via wrangler, or print suppression msg
#   ./generate-secret.sh --print   # print value to stderr with warning banner

set -e

PRINT_MODE=false
if [ "${1:-}" = "--print" ]; then
  PRINT_MODE=true
fi

# Generate 32-byte random secret
SECRET=$(openssl rand -base64 32)

if [ "$PRINT_MODE" = "true" ]; then
  # Print to STDERR only, with a warning banner. Never stdout.
  {
    echo "WARNING: secret value below - do not record, treat like a password."
    echo "BETTER_AUTH_SECRET=$SECRET"
  } >&2
else
  if command -v wrangler &> /dev/null; then
    # Mirror the safe pattern from setup-d1-drizzle.sh: pipe straight into
    # wrangler without ever materializing the secret in an arg list or stdout.
    printf '%s' "$SECRET" | wrangler secret put BETTER_AUTH_SECRET
    echo "BETTER_AUTH_SECRET set (value suppressed - stored via wrangler secret)."
  else
    echo "Generated BETTER_AUTH_SECRET (value suppressed; use --print to view on stderr)"
    echo "To store it for Cloudflare Workers, install wrangler and re-run, or run:"
    echo "  wrangler secret put BETTER_AUTH_SECRET"
  fi
fi

unset SECRET
