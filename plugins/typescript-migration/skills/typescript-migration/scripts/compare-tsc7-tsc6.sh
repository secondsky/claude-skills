#!/bin/bash

# compare-tsc7-tsc6.sh — Run TS 7 (tsc) and TS 6 (tsc6) side-by-side
#
# Purpose: Run both TypeScript 7 (`tsc`, the native Go port) and TypeScript 6
#          (`tsc6`, from @typescript/typescript6) with --noEmit, then diff their
#          diagnostic-code counts. Microsoft's recommended CI safety-net
#          pattern from the official TS 7.0 release blog.
#
# Read-only — both compilers run with --noEmit and write nothing.
#
# Usage: ./compare-tsc7-tsc6.sh [tsconfig-path]
#   tsconfig-path  Optional path to a tsconfig.json (defaults to auto-detect).
#
# Exit codes:
#   0  both ran and diagnostic codes are IDENTICAL
#   1  diagnostic codes DIVERGE (useful for CI gating) OR a required tool missing
#
# Source: https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/
set -uo pipefail

TSCONFIG="${1:-}"

# --- Resolve tsc (TS 7) ------------------------------------------------------
TSC_CMD=""
if command -v tsc >/dev/null 2>&1; then
  TSC_CMD="tsc"
elif command -v npx >/dev/null 2>&1 && npx --no-install tsc --version >/dev/null 2>&1; then
  TSC_CMD="npx --no-install tsc"
fi

if [ -z "$TSC_CMD" ]; then
  echo "Error: TypeScript 7 (tsc) is not installed." >&2
  echo "Install it:  npm install -D typescript" >&2
  exit 1
fi

# --- Resolve tsc6 (TS 6 via @typescript/typescript6) -------------------------
TSC6_CMD=""
if command -v tsc6 >/dev/null 2>&1; then
  TSC6_CMD="tsc6"
elif command -v npx >/dev/null 2>&1 && npx --no-install tsc6 --version >/dev/null 2>&1; then
  TSC6_CMD="npx --no-install tsc6"
fi

if [ -z "$TSC6_CMD" ]; then
  echo "Error: tsc6 (TypeScript 6 compat binary) is not installed." >&2
  echo "Install the official compat package:  npm install -D @typescript/typescript6" >&2
  echo "Then re-run this script." >&2
  exit 1
fi

# --- Versions ----------------------------------------------------------------
TSC_VER="$($TSC_CMD --version 2>/dev/null | head -n1 | tr -d '\r')" || TSC_VER="(unknown)"
TSC6_VER="$($TSC6_CMD --version 2>/dev/null | head -n1 | tr -d '\r')" || TSC6_VER="(unknown)"

echo "TS 7 vs TS 6 Diagnostic Comparison"
echo "==================================="
printf 'TS 7 (tsc):    %s\n' "$TSC_VER"
printf 'TS 6 (tsc6):   %s\n' "$TSC6_VER"
echo ""

# --- Run both compilers with --noEmit ----------------------------------------
# Use ; so the second invocation runs even if the first exits non-zero.
# Word-split the command string intentionally.
run_compiler() {
  local cmd="$1" tsconfig="$2"
  # shellcheck disable=SC2086
  if [ -n "$tsconfig" ]; then
    $cmd -p "$tsconfig" --noEmit
  else
    $cmd --noEmit
  fi
}

TS7_OUT="$(run_compiler "$TSC_CMD"  "$TSCONFIG" 2>&1)"; TS7_RC=$?
TS6_OUT="$(run_compiler "$TSC6_CMD" "$TSCONFIG" 2>&1)"; TS6_RC=$?

# --- Tally diagnostic codes --------------------------------------------------
tally_codes() {
  printf '%s' "$1" | grep -oE 'TS[0-9]+' | sort | uniq -c | sort -k2
}

TS7_TALLY="$(tally_codes "$TS7_OUT")"
TS6_TALLY="$(tally_codes "$TS6_OUT")"

echo "TS 7 diagnostic code counts:"
if [ -n "$TS7_TALLY" ]; then
  printf '%s\n' "$TS7_TALLY" | sed 's/^/  /'
else
  echo "  (no diagnostics)"
fi
echo ""

echo "TS 6 diagnostic code counts:"
if [ -n "$TS6_TALLY" ]; then
  printf '%s\n' "$TS6_TALLY" | sed 's/^/  /'
else
  echo "  (no diagnostics)"
fi
echo ""

# --- Diff the two tallies ----------------------------------------------------
echo "Diff (TS 7 vs TS 6):"
DIFF_OUTPUT="$(diff <(printf '%s\n' "$TS7_TALLY") <(printf '%s\n' "$TS6_TALLY") 2>&1)" || true

RESULT=""
EXIT=0
if [ -z "$DIFF_OUTPUT" ]; then
  echo "  (identical)"
  RESULT="IDENTICAL"
  EXIT=0
else
  printf '%s\n' "$DIFF_OUTPUT" | sed 's/^/  /'
  RESULT="DIVERGENT — investigate differences"
  EXIT=1
fi
echo ""

printf 'Result: %s\n' "$RESULT"
echo "Note: error message WORDING differs between compilers; only CODES are compared."
echo "      For wording-level differences see https://github.com/microsoft/typescript-go/blob/main/CHANGES.md"

exit "$EXIT"
