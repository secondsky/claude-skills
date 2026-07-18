#!/bin/bash

# ts6-deprecation-scan.sh — Run tsc and tally TS5xxx deprecation/removal codes
#
# Purpose: Run `tsc --noEmit` and extract/categorize the TS5xxx diagnostic
#          codes relevant to the TS 5 -> 6 -> 7 migration (TS5011, TS5101,
#          TS5102, TS5103, TS5107, TS5108, TS5111, TS5112).
#
# Read-only — tsc with --noEmit does not write any files.
#
# Usage: ./ts6-deprecation-scan.sh [tsconfig-path]
#   tsconfig-path  Optional path to a tsconfig.json (defaults to auto-detect).
#
# Exit codes:
#   0  report produced (regardless of how many diagnostics tsc found — the
#      report IS the output; tsc's own non-zero exit is not treated as error)
#   1  tsc is not available in PATH or via npx
#
# The only external mutation permitted by the typescript-migration skill is the
# official ts5to6 codemod, invoked separately with explicit user approval.
set -uo pipefail

TSCONFIG="${1:-}"

# --- Resolve tsc -------------------------------------------------------------
TSC_CMD=""
if command -v tsc >/dev/null 2>&1; then
  TSC_CMD="tsc"
elif command -v npx >/dev/null 2>&1; then
  # Use npx only if tsc is resolvable locally (no network install).
  if npx --no-install tsc --version >/dev/null 2>&1; then
    TSC_CMD="npx --no-install tsc"
  fi
fi

if [ -z "$TSC_CMD" ]; then
  echo "Error: tsc is not available in PATH or via npx." >&2
  echo "Install TypeScript first:  npm install -D typescript" >&2
  exit 1
fi

# --- Build the invocation (word-split TSC_CMD intentionally) -----------------
run_tsc() {
  local tsconfig="$1"
  # shellcheck disable=SC2086
  if [ -n "$tsconfig" ]; then
    $TSC_CMD -p "$tsconfig" --noEmit
  else
    $TSC_CMD --noEmit
  fi
}

if [ -n "$TSCONFIG" ]; then
  TSC_LABEL="$TSC_CMD -p \"$TSCONFIG\" --noEmit"
else
  TSC_LABEL="$TSC_CMD --noEmit"
fi

echo "TS 6 Deprecation Scan"
echo "====================="
printf 'Ran: %s\n' "$TSC_LABEL"

# Run tsc, capturing combined output. Don't abort on non-zero exit (set -e off).
OUTPUT="$(run_tsc "$TSCONFIG" 2>&1)" || true
EXIT_CODE=$?
printf 'Exit code: %s\n' "$EXIT_CODE"
echo ""

# --- Count occurrences of a given TS code in the captured output -------------
count_code() {
  local code="$1"
  printf '%s' "$OUTPUT" | grep -oE "$code" | wc -l | tr -d ' '
}

# --- Description / guidance per code (bash 3.2-safe case functions) ----------
desc_for() {
  case "$1" in
    TS5011) printf 'rootDir mismatch' ;;
    TS5101) printf 'Option deprecated' ;;
    TS5102) printf 'Option removed' ;;
    TS5103) printf 'Invalid ignoreDeprecations' ;;
    TS5107) printf 'Option=value deprecated' ;;
    TS5108) printf 'Option=value removed' ;;
    TS5111) printf 'Migration info' ;;
    TS5112) printf 'tsc file-args + tsconfig' ;;
  esac
}

guidance_for() {
  case "$1" in
    TS5011) printf 'set "rootDir": "./src"' ;;
    TS5101) printf 'fix or set ignoreDeprecations:"6.0" (TS 6 only)' ;;
    TS5102) printf 'remove the option from tsconfig' ;;
    TS5103) printf 'use "5.0" or "6.0"' ;;
    TS5107) printf 'update the value' ;;
    TS5108) printf 'remove or update the value' ;;
    TS5111) printf 'see references/ts6-breaking-changes.md' ;;
    TS5112) printf 'use --ignoreConfig or pass -p <tsconfig>' ;;
  esac
}

print_line() {
  # print_line <code>
  local code="$1" n desc guidance
  n="$(count_code "$code")"
  desc="$(desc_for "$code")"
  guidance="$(guidance_for "$code")"
  printf '  %-8s %-28s x %-4s -> %s\n' "$code" "$desc" "$n" "$guidance"
}

# --- Deprecation codes -------------------------------------------------------
echo 'Deprecation codes (silenced by ignoreDeprecations: "6.0" — does NOT work in TS 7):'
print_line TS5101
print_line TS5107
print_line TS5111
echo ""

# --- Removal codes -----------------------------------------------------------
echo "Removal codes (must be removed):"
print_line TS5102
print_line TS5108
echo ""

# --- Behaviour codes ---------------------------------------------------------
echo "Behaviour codes:"
print_line TS5011
print_line TS5112
print_line TS5103
echo ""

# --- Total -------------------------------------------------------------------
TOTAL=0
for c in TS5011 TS5101 TS5102 TS5103 TS5107 TS5108 TS5111 TS5112; do
  TOTAL=$((TOTAL + $(count_code "$c")))
done

printf 'Total migration-relevant diagnostics: %s\n' "$TOTAL"
echo 'Next step: see references/ts6-breaking-changes.md, section "Migration Checklist" (priority order).'

exit 0
