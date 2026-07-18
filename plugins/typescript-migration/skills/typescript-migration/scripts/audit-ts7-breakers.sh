#!/bin/bash

# audit-ts7-breakers.sh — Audit project for TypeScript 7 breakers
#
# Purpose: Detect tooling and tsconfig patterns that will break or require
#          attention under TypeScript 7 (the native Go port).
#
# Read-only — greps package.json, tsconfig*.json, and .ts/.d.ts source files.
#             Never modifies anything. The only external mutation permitted by
#             the typescript-migration skill is the official ts5to6 codemod,
#             invoked separately with explicit user approval.
#
# Usage: ./audit-ts7-breakers.sh [project-root]
#   project-root  Optional path to scan (defaults to cwd).
#
# Exit codes:
#   0  report produced (findings are reported, not errors)
#   1  ROOT is not a directory
set -uo pipefail

ROOT="${1:-$PWD}"
ROOT="$(cd "$ROOT" 2>/dev/null && pwd)" || {
  echo "Error: path does not exist or is not a directory: $1" >&2
  exit 1
}
if [ ! -d "$ROOT" ]; then
  echo "Error: not a directory: $ROOT" >&2
  exit 1
fi

BREAKER_COUNT=0
inc_breakers() { BREAKER_COUNT=$((BREAKER_COUNT + 1)); }

# --- Helper: find a dependency version in package.json ----------------------
# find_dep <pkg-name>  -> prints version string or empty
find_dep() {
  local pkg="$1" pj="$ROOT/package.json"
  [ -f "$pj" ] || return 0
  if command -v jq >/dev/null 2>&1; then
    jq -r --arg k "$pkg" \
      '(.dependencies[$k] // .devDependencies[$k] // .peerDependencies[$k] // empty)' \
      "$pj" 2>/dev/null
    return 0
  fi
  grep -o "\"$pkg\"[[:space:]]*:[[:space:]]*\"[^\"]*\"" "$pj" 2>/dev/null \
    | head -n1 \
    | sed -n "s/.*:[[:space:]]*\"\([^\"]*\)\".*/\1/p"
  return 0
}

report_found() {
  # report_found <pkg> <version> <guidance>
  printf '  [FOUND] %-30s -> %s\n' "$1@${2:-?}" "$3"
  inc_breakers
}

report_none() {
  printf '  [none]\n'
}

# --- Category 1: Compiler-API-dependent tools --------------------------------
audit_compiler_api_tools() {
  echo "Compiler-API-dependent tools (will break under TS 7):"
  local found=0 pkg ver guidance
  local -a pkgs=(
    "ts-morph"
    "ts-node"
    "ts-jest"
    "ts-loader"
    "ts-patch"
    "ttypescript"
    "typia"
    "typescript-eslint"
  )
  local -a guides=(
    "replace with a Compiler-API-compatible TS 6 alias; see references/ecosystem-compatibility.md"
    "replace with tsx (esbuild-based); see references/ecosystem-compatibility.md"
    "pin to @typescript/typescript6 alias or migrate to vitest; see references/ecosystem-compatibility.md"
    "use fork-ts-checker-webpack-plugin with TS 6 alias; see references/ecosystem-compatibility.md"
    "replace with native tsc transform plugins; see references/ecosystem-compatibility.md"
    "unmaintained — replace with ts-patch or native plugins; see references/ecosystem-compatibility.md"
    "pin to @typescript/typescript6 alias; see references/ecosystem-compatibility.md"
    "use @typescript/typescript6 alias pattern; see references/ecosystem-compatibility.md"
  )
  local i
  for i in "${!pkgs[@]}"; do
    pkg="${pkgs[$i]}"
    guidance="${guides[$i]}"
    ver="$(find_dep "$pkg")"
    if [ -n "$ver" ]; then
      report_found "$pkg" "$ver" "$guidance"
      found=1
    fi
  done
  [ "$found" -eq 0 ] && report_none
  echo ""
}

# --- Category 2: Embedded-language tools -------------------------------------
audit_embedded_language_tools() {
  echo "Embedded-language tools (Vue/Svelte/Astro/MDX — stay on TS 6):"
  local found=0 pkg ver guidance
  local -a pkgs=(
    "volar"
    "@vue/language"
    "svelte-check"
    "astro"
    "@mdx-js"
  )
  local -a guides=(
    "Vue language tooling — pin to @typescript/typescript6 alias"
    "Vue language tooling — pin to @typescript/typescript6 alias"
    "Svelte type-checker — pin to @typescript/typescript6 alias"
    "Astro compiler — pin to @typescript/typescript6 alias"
    "MDX compiler — pin to @typescript/typescript6 alias"
  )
  local i
  for i in "${!pkgs[@]}"; do
    pkg="${pkgs[$i]}"
    guidance="${guides[$i]}"
    ver="$(find_dep "$pkg")"
    if [ -n "$ver" ]; then
      report_found "$pkg" "$ver" "$guidance"
      found=1
    fi
  done
  [ "$found" -eq 0 ] && report_none
  echo ""
}

# --- Category 3: Angular template type-checking ------------------------------
audit_angular() {
  echo "Angular template type-checking (use CLI/editor split):"
  local ver found=0
  ver="$(find_dep "@angular/compiler-cli")"
  if [ -n "$ver" ]; then
    report_found "@angular/compiler-cli" "$ver" \
      "Angular template type-checking consumes the Compiler API — pin to @typescript/typescript6 alias"
    found=1
  fi
  [ "$found" -eq 0 ] && report_none
  echo ""
}

# --- Category 4: Browser-based TS (WASM) -------------------------------------
audit_browser_ts() {
  echo "Browser-based TS (WASM — likely breaks):"
  local found=0 pkg ver guidance
  local -a pkgs=(
    "monaco-editor"
    "playground-elements"
  )
  local -a guides=(
    "Monaco bundles a WASM/JS TS — pin editor TS to @typescript/typescript6 alias"
    "playground-elements bundles TS in-browser — pin to @typescript/typescript6 alias"
  )
  local i
  for i in "${!pkgs[@]}"; do
    pkg="${pkgs[$i]}"
    guidance="${guides[$i]}"
    ver="$(find_dep "$pkg")"
    if [ -n "$ver" ]; then
      report_found "$pkg" "$ver" "$guidance"
      found=1
    fi
  done
  [ "$found" -eq 0 ] && report_none
  echo ""
}

# --- Category 5: Deprecated tsconfig options ---------------------------------
audit_tsconfig_options() {
  echo "Deprecated tsconfig options (HARD ERRORS in TS 7):"

  local -a configs=()
  local f
  while IFS= read -r f; do
    [ -n "$f" ] && configs+=("$f")
  done < <(find "$ROOT" -maxdepth 5 -type f \
            \( -name 'tsconfig*.json' -o -name 'jsconfig*.json' \) \
            -not -path '*/node_modules/*' \
            -not -path '*/dist/*' \
            -not -path '*/.git/*' 2>/dev/null)

  if [ "${#configs[@]}" -eq 0 ]; then
    echo "  (no tsconfig*.json found)"
    echo ""
    return
  fi

  # Patterns and guidance kept in PARALLEL arrays (not delimited by a char
  # that could collide with regex alternation like '|').
  local -a pats=(
    '"baseUrl"'
    '"target"[[:space:]]*:[[:space:]]*"es[35]"'
    '"moduleResolution"[[:space:]]*:[[:space:]]*"(node|node10|classic)"'
    '"module"[[:space:]]*:[[:space:]]*"(amd|umd|system|none)"'
    '"esModuleInterop"[[:space:]]*:[[:space:]]*false'
    '"allowSyntheticDefaultImports"[[:space:]]*:[[:space:]]*false'
    '"alwaysStrict"[[:space:]]*:[[:space:]]*false'
    '"outFile"'
    '"downlevelIteration"'
    '"preserveConstEnums"'
    '"ignoreDeprecations"'
    '"noDefaultLib"'
  )
  local -a guides=(
    'inline into paths; see references/ts6-breaking-changes.md'
    'migrate to es2015+'
    'use "bundler" or "nodenext"'
    'use "esnext" or "nodenext"'
    'leave default true'
    'leave default true'
    'remove (strict is default)'
    'use a bundler instead'
    'use target es2015+'
    'REMOVED in TS 7 — const enums always emitted now'
    'escape hatch — will NOT work in TS 7'
    'remove — use lib reference comments instead'
  )

  local any_found=0 cfg rel cfg_found pat guidance line hitstr i
  for cfg in "${configs[@]}"; do
    rel="${cfg#$ROOT/}"
    rel="${rel:-$cfg}"
    printf '  %s:\n' "$rel"
    cfg_found=0
    for i in "${!pats[@]}"; do
      pat="${pats[$i]}"
      guidance="${guides[$i]}"
      while IFS= read -r line; do
        [ -z "$line" ] && continue
        hitstr="$(printf '%s' "$line" | sed 's/^[[:space:]]*//; s/[[:space:]]*$//')"
        printf '    [FOUND] %-32s -> %s\n' "$hitstr" "$guidance"
        inc_breakers
        cfg_found=1
        any_found=1
      done < <(grep -nE "$pat" "$cfg" 2>/dev/null | sed 's/^[0-9]*://')
    done
    [ "$cfg_found" -eq 0 ] && printf '    (clean)\n'
  done
  [ "$any_found" -eq 0 ] && echo "  (no deprecated options found)"
  echo ""
}

# --- Category 6: `module` keyword for namespaces -----------------------------
audit_module_keyword() {
  echo "Source-level concerns:"
  echo "  'module' keyword for namespaces (hard error in TS 7):"
  local f lnum content found=0
  while IFS= read -r f; do
    while IFS=: read -r lnum content; do
      [ -z "$content" ] && continue
      # Skip quoted ambient modules: declare module "..." / declare module '...'
      case "$content" in
        *'declare module "'*|*'declare module '"'"*) continue ;;
      esac
      printf '    [FOUND] %s:%s %s   -> use the `namespace` keyword\n' \
        "${f#$ROOT/}" "$lnum" "$(printf '%s' "$content" | sed 's/^[[:space:]]*//; s/[[:space:]]*$//')"
      inc_breakers
      found=1
    done < <(grep -nE '(^|[^a-zA-Z._])module[[:space:]]+[A-Z][A-Za-z0-9_]*[[:space:]]*\{' "$f" 2>/dev/null)
  done < <(find "$ROOT" -type f \( -name '*.ts' -o -name '*.tsx' -o -name '*.d.ts' \) \
            -not -path '*/node_modules/*' \
            -not -path '*/dist/*' \
            -not -path '*/.git/*' 2>/dev/null)
  [ "$found" -eq 0 ] && echo "    [none]"
}

# --- Category 7: `assert` keyword on imports --------------------------------
audit_assert_imports() {
  echo "  'assert' keyword on imports (deprecated -> removed):"
  local f lnum content found=0
  while IFS= read -r f; do
    while IFS=: read -r lnum content; do
      [ -z "$content" ] && continue
      printf '    [FOUND] %s:%s %s   -> use the `with` keyword (import attributes)\n' \
        "${f#$ROOT/}" "$lnum" "$(printf '%s' "$content" | sed 's/^[[:space:]]*//; s/[[:space:]]*$//')"
      inc_breakers
      found=1
    done < <(grep -nE 'import.*assert[[:space:]]*\{' "$f" 2>/dev/null)
  done < <(find "$ROOT" -type f \( -name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.jsx' \) \
            -not -path '*/node_modules/*' \
            -not -path '*/dist/*' \
            -not -path '*/.git/*' 2>/dev/null)
  [ "$found" -eq 0 ] && echo "    [none]"
  echo ""
}

# --- Main --------------------------------------------------------------------
echo "TS 7 Breaker Audit Report"
echo "========================="
echo "Project root: $ROOT"
echo ""
audit_compiler_api_tools
audit_embedded_language_tools
audit_angular
audit_browser_ts
audit_tsconfig_options
audit_module_keyword
audit_assert_imports

echo "Summary: $BREAKER_COUNT breaker(s) detected."
echo "See references/ecosystem-compatibility.md and references/ts6-breaking-changes.md for fixes."

exit 0
