#!/bin/bash
# Detect Nuxt SEO modules on session start
# Provides context about installed SEO modules
#
# Invoked via: bash ${CLAUDE_PLUGIN_ROOT}/hooks/scripts/detect-nuxt-seo.sh
# (the shebang above is informational; the exec bit is not required)
#
# Trust boundary (A-009):
#   This hook runs on every Claude Code session in any project whose
#   package.json mentions "nuxt". Values read from project files
#   (package.json, nuxt.config.ts) are treated as UNTRUSTED and are NEVER
#   interpolated into shell. They are only used as fixed-string grep
#   comparisons (e.g. `grep -q "@nuxtjs/seo"`) and as array assignments
#   populated from a HARDCODED allowlist below. The MODULES array is written
#   to $CLAUDE_ENV_FILE via `printf '%q'` shell-escaping so a malicious
#   package.json cannot break out of the exported scalar.

set -euo pipefail
IFS=$'\n\t'

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
PACKAGE_JSON="$PROJECT_DIR/package.json"
NUXT_CONFIG="$PROJECT_DIR/nuxt.config.ts"

# Check if this is a Nuxt project
if [ ! -f "$PACKAGE_JSON" ]; then
  exit 0
fi

# Check for Nuxt (fixed-string comparison only; value is never interpolated)
if ! grep -q "nuxt" "$PACKAGE_JSON" 2>/dev/null; then
  exit 0
fi

# Detect SEO modules. The strings pushed into MODULES come from this
# hardcoded allowlist — they are NOT read from package.json. We only use
# package.json as a yes/no grep target.
MODULES=()

if grep -q "@nuxtjs/seo" "$PACKAGE_JSON" 2>/dev/null; then
  MODULES+=("@nuxtjs/seo (all-in-one)")
fi

if grep -q "nuxt-og-image" "$PACKAGE_JSON" 2>/dev/null; then
  MODULES+=("nuxt-og-image")
fi

if grep -q "nuxt-sitemap\|@nuxtjs/sitemap" "$PACKAGE_JSON" 2>/dev/null; then
  MODULES+=("nuxt-sitemap")
fi

if grep -q "nuxt-schema-org" "$PACKAGE_JSON" 2>/dev/null; then
  MODULES+=("nuxt-schema-org")
fi

if grep -q "nuxt-link-checker" "$PACKAGE_JSON" 2>/dev/null; then
  MODULES+=("nuxt-link-checker")
fi

if grep -q "nuxt-seo-utils" "$PACKAGE_JSON" 2>/dev/null; then
  MODULES+=("nuxt-seo-utils")
fi

if grep -q "@nuxtjs/robots" "$PACKAGE_JSON" 2>/dev/null; then
  MODULES+=("@nuxtjs/robots")
fi

# Check for site.url configuration.
#
# Known limitation (A-013): the awk below only matches the conventional
# multi-line form:
#     site: {
#       url: 'https://example.com',
#       ...
#     }
# It does NOT reliably catch single-line `site: { url: '...' }` or arbitrarily
# nested forms. This is acceptable because the resulting env var
# (NUXT_SEO_SITE_URL_SET) is purely advisory context for sibling hooks — a
# false negative only produces a (non-blocking) warning. Refactoring the awk
# to be fully general is intentionally deferred to avoid introducing a new
# parser bug in a security pass.
SITE_URL_SET=false
if [ -f "$NUXT_CONFIG" ] && grep -q "site:" "$NUXT_CONFIG" 2>/dev/null; then
  # Use awk to parse the multi-line site block.
  SITE_URL_SET=$(awk '
    /^[^ \t].*:/ { in_site_block=0 }  # Exit block on any top-level key
    /site:/ { in_site_block=1 }       # Enter site block
    in_site_block && /^[ \t]+url:/ { print "true"; exit }  # Found url in site block
  ' "$NUXT_CONFIG" 2>/dev/null || true)

  # Default to false if awk didn't find it
  if [ "$SITE_URL_SET" != "true" ]; then
    SITE_URL_SET=false
  fi
fi

# Output context if SEO modules found
if [ "${#MODULES[@]}" -gt 0 ]; then
  echo "Nuxt SEO project detected with: ${MODULES[*]}"

  if [ "$SITE_URL_SET" = "false" ]; then
    echo "Warning: site.url not configured in nuxt.config.ts (required for sitemaps/OG images)"
  fi

  # Persist to environment for other hooks.
  #
  # We write to a temp file then append, and we mark the section with sentinel
  # comments so users (and future hooks) can identify/clean up duplicate
  # exports. `printf '%q'` shell-escapes every value so the exported scalar
  # cannot break out of its assignment even if a future contributor sources
  # MODULES from package.json.
  if [ -n "${CLAUDE_ENV_FILE:-}" ]; then
    TMP_EXPORTS=$(mktemp) || exit 0
    trap 'rm -f "$TMP_EXPORTS"' EXIT
    {
      echo "# >>> nuxt-seo SessionStart >>>"
      echo "export NUXT_SEO_MODULES=$(printf '%q' "${MODULES[*]}")"
      echo "export NUXT_SEO_SITE_URL_SET=$(printf '%q' "$SITE_URL_SET")"
      echo "# <<< nuxt-seo SessionStart <<<"
    } > "$TMP_EXPORTS"
    # Append (the env file is sourced, not parsed; duplicate exports are
    # tolerated but the markers above help users clean up).
    cat "$TMP_EXPORTS" >> "$CLAUDE_ENV_FILE"
  fi
fi

exit 0
