#!/bin/bash
# Check SEO configuration after file writes
# Validates critical SEO settings in Nuxt projects
#
# Invoked via: bash ${CLAUDE_PLUGIN_ROOT}/hooks/scripts/check-seo-config.sh
# (the shebang above is informational; the exec bit is not required)
#
# This is an ADVISORY hook: it never blocks (always exits 0) and only emits
# SEO suggestions on stderr for Claude to surface.

set -euo pipefail
IFS=$'\n\t'

# Read input from stdin
INPUT=$(cat)

# Extract file path from tool input. `|| true` so malformed JSON does not
# abort under `set -e` (advisory hook).
FILE_PATH=$(printf '%s' "$INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null || true)

if [ -z "$FILE_PATH" ]; then
  exit 0
fi

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"

# Defense against symlinks/paths escaping the project (A-010).
# Only inspect files that live under $CLAUDE_PROJECT_DIR. This prevents a
# crafted tool_input.file_path (or a symlink inside the project that points
# outside) from tricking this hook into reading arbitrary files.
case "$FILE_PATH" in
  "$PROJECT_DIR"/*) ;;  # OK — inside the project
  *)
    echo "Skipping: file path outside project dir" >&2
    exit 0
    ;;
esac

# Helper: emit a message only when the file exists. Wrapped in an explicit
# `if` so `set -e` does not turn a missing file into a hook failure.
note_if_file_exists() {
  local path="$1"
  if [ -f "$path" ]; then
    return 0
  fi
  return 1
}

# Only check relevant files
case "$FILE_PATH" in
  *nuxt.config.ts|*nuxt.config.js)
    if note_if_file_exists "$FILE_PATH"; then
      # Check site.url configuration
      if ! grep -q "site:" "$FILE_PATH" 2>/dev/null || ! grep -A10 "site:" "$FILE_PATH" 2>/dev/null | grep -q "url:" 2>/dev/null; then
        echo "SEO Check: site.url not found in nuxt.config. Add site: { url: 'https://...' } for sitemaps and OG images to work correctly." >&2
      fi

      # Check for @nuxtjs/seo or individual modules
      if ! grep -qE "@nuxtjs/seo|nuxt-og-image|nuxt-sitemap|nuxt-schema-org" "$FILE_PATH" 2>/dev/null; then
        echo "SEO Check: No SEO modules found in config. Consider adding @nuxtjs/seo for comprehensive SEO support." >&2
      fi
    fi
    ;;

  *pages/*.vue|*app.vue)
    if note_if_file_exists "$FILE_PATH"; then
      if ! grep -qE "useSeoMeta|useHead|defineOgImage" "$FILE_PATH" 2>/dev/null; then
        echo "SEO Check: Page has no SEO meta defined. Consider adding useSeoMeta() for title, description, and OG tags." >&2
      fi
    fi
    ;;

  *components/OgImage/*.vue)
    if note_if_file_exists "$FILE_PATH"; then
      if grep -qE "display:\s*(grid|block|inline)" "$FILE_PATH" 2>/dev/null; then
        echo "SEO Check: OG image component uses CSS not supported by Satori (grid, block, inline). Use flexbox only or set renderer: 'chromium'." >&2
      fi
    fi
    ;;

  *server/api/__sitemap__/*.ts)
    if note_if_file_exists "$FILE_PATH"; then
      if ! grep -q "defineSitemapEventHandler" "$FILE_PATH" 2>/dev/null; then
        echo "SEO Check: Sitemap endpoint should use defineSitemapEventHandler for type-safe URL definitions." >&2
      fi
    fi
    ;;
esac

exit 0
