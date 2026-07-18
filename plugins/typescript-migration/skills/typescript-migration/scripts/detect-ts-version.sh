#!/bin/bash

# detect-ts-version.sh — Detect the installed TypeScript version
#
# Purpose: Read package.json + node_modules/typescript/package.json +
#          `tsc --version` to report the installed TypeScript version, any
#          @typescript/* aliases, and classify the project as TS 5.x / 6.x / 7.x.
#
# Read-only: this script never modifies files or installs anything. It reads
#            package.json and node_modules, and invokes `tsc --version`
#            (which writes nothing).
#
# Usage: ./detect-ts-version.sh [path]
#   path  Optional starting directory to search from (defaults to cwd).
#
# Exit codes:
#   0  report produced (even if TS is not declared / not installed)
#   1  no package.json found at or above the starting directory
#
# The only external mutation permitted by the typescript-migration skill is the
# official ts5to6 codemod, invoked separately with explicit user approval.
set -e

START_DIR="${1:-$PWD}"

# --- Find nearest package.json (walk up from START_DIR) -----------------------
find_package_json() {
  local dir
  dir="$(cd "$1" 2>/dev/null && pwd)" || dir="$1"
  while [ "$dir" != "/" ] && [ -n "$dir" ]; do
    if [ -f "$dir/package.json" ]; then
      printf '%s\n' "$dir/package.json"
      return 0
    fi
    dir="$(dirname "$dir")"
  done
  return 1
}

if ! PKG_JSON="$(find_package_json "$START_DIR")"; then
  echo "Error: no package.json found at or above: $START_DIR" >&2
  echo "Usage: $0 [path]" >&2
  exit 1
fi

PROJECT_ROOT="$(dirname "$PKG_JSON")"

# --- JSON helper: prefer jq, fall back to grep+sed ---------------------------
# get_dep <file> <section> <key>
#   e.g. get_dep pkg.json dependencies typescript
#   e.g. get_dep pkg.json devDependencies @typescript/native
get_dep() {
  local file="$1" section="$2" key="$3" result
  if command -v jq >/dev/null 2>&1; then
    result="$(jq -r --arg k "$key" ".${section}[\$k] // empty" "$file" 2>/dev/null)" || result=""
    printf '%s' "$result"
    return 0
  fi
  # Fallback: whole-file grep for the key (may match outside the section).
  grep -o "\"$key\"[[:space:]]*:[[:space:]]*\"[^\"]*\"" "$file" 2>/dev/null \
    | head -n1 \
    | sed -n "s/.*:[[:space:]]*\"\([^\"]*\)\".*/\1/p"
  return 0
}

# Read the top-level "version" field from a package.json.
get_version_field() {
  local file="$1" result
  if command -v jq >/dev/null 2>&1; then
    result="$(jq -r '.version // empty' "$file" 2>/dev/null)" || result=""
    printf '%s' "$result"
    return 0
  fi
  grep -o '"version"[[:space:]]*:[[:space:]]*"[^"]*"' "$file" 2>/dev/null \
    | head -n1 \
    | sed -n 's/.*:[[:space:]]*"\([^"]*\)".*/\1/p'
  return 0
}

# --- Collect inputs -----------------------------------------------------------
DEP_TS="$(get_dep "$PKG_JSON" dependencies typescript)"
DEV_TS="$(get_dep "$PKG_JSON" devDependencies typescript)"

ALIAS_NATIVE="$(get_dep "$PKG_JSON" dependencies @typescript/native)"
DEV_ALIAS_NATIVE="$(get_dep "$PKG_JSON" devDependencies @typescript/native)"
ALIAS_TS6="$(get_dep "$PKG_JSON" dependencies @typescript/typescript6)"
DEV_ALIAS_TS6="$(get_dep "$PKG_JSON" devDependencies @typescript/typescript6)"
ALIAS_PREVIEW="$(get_dep "$PKG_JSON" dependencies @typescript/native-preview)"
DEV_ALIAS_PREVIEW="$(get_dep "$PKG_JSON" devDependencies @typescript/native-preview)"

INSTALLED="(not installed)"
if [ -f "$PROJECT_ROOT/node_modules/typescript/package.json" ]; then
  V="$(get_version_field "$PROJECT_ROOT/node_modules/typescript/package.json")"
  [ -n "$V" ] && INSTALLED="$V"
fi

TSC_BIN="(not available)"
if command -v tsc >/dev/null 2>&1; then
  TSC_BIN="$(tsc --version 2>/dev/null | head -n1 | tr -d '\r')" || TSC_BIN="(tsc --version failed)"
elif command -v npx >/dev/null 2>&1; then
  TSC_BIN="$(npx --no-install tsc --version 2>/dev/null | head -n1 | tr -d '\r')" || TSC_BIN="(npx tsc unavailable)"
fi

# --- Display helper ----------------------------------------------------------
# display_alias <dep-value> <dev-value>
display_alias() {
  local dep="$1" dev="$2"
  if [ -n "$dep" ] && [ -n "$dev" ]; then
    printf '%s (also devDep: %s)' "$dep" "$dev"
  elif [ -n "$dep" ]; then
    printf '%s' "$dep"
  elif [ -n "$dev" ]; then
    printf '%s (devDep)' "$dev"
  else
    printf '(none)'
  fi
}

# --- Classification -----------------------------------------------------------
# Resolve a usable version string, preferring installed > declared > binary.
# Then parse the major version number and classify.
classify() {
  local raw="$INSTALLED"
  if [ "$raw" = "(not installed)" ] || [ -z "$raw" ]; then
    raw="$DEP_TS"
    [ -z "$raw" ] && raw="$DEV_TS"
  fi
  if [ -z "$raw" ]; then
    raw="$(printf '%s' "$TSC_BIN" | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -n1)"
  fi
  if [ -z "$raw" ]; then
    printf 'unknown'
    return
  fi
  # npm: alias values look like "npm:typescript@^7.0.2" — take after last '@'.
  case "$raw" in
    *@*) raw="${raw##*@}" ;;
  esac
  # Strip leading non-digits (^, ~, =, spaces) and take the major number.
  local major
  major="$(printf '%s' "$raw" | sed -n 's/^[^0-9]*\([0-9][0-9]*\)\..*/\1/p')"
  case "$major" in
    5) printf 'TS 5.x (migrate to 6 first)' ;;
    6) printf 'TS 6.x (eligible for TS 7)' ;;
    7) printf 'TS 7.x (native Go port)' ;;
    *) printf 'unknown' ;;
  esac
}

CLASS="$(classify)"

# --- Output -------------------------------------------------------------------
echo "TypeScript Version Detection Report"
echo "===================================="
echo "Project root: $PROJECT_ROOT"
echo ""
echo "Declared in package.json:"
  printf '  dependencies.typescript:    %s\n' "${DEP_TS:-(not declared)}"
  printf '  devDependencies.typescript: %s\n' "${DEV_TS:-(not declared)}"
echo ""
echo "Aliases detected:"
  printf '  @typescript/native:          %s\n' "$(display_alias "$ALIAS_NATIVE" "$DEV_ALIAS_NATIVE")"
  printf '  @typescript/typescript6:     %s\n' "$(display_alias "$ALIAS_TS6" "$DEV_ALIAS_TS6")"
  printf '  @typescript/native-preview:  %s\n' "$(display_alias "$ALIAS_PREVIEW" "$DEV_ALIAS_PREVIEW")"
echo ""
printf 'Installed (node_modules): %s\n' "$INSTALLED"
printf 'tsc binary:               %s\n' "$TSC_BIN"
printf 'Classification:           %s\n' "$CLASS"

exit 0
