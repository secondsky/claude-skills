#!/bin/bash
# Detect Nuxt SEO modules on session start
# Provides context about installed SEO modules

set -euo pipefail

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
PACKAGE_JSON="$PROJECT_DIR/package.json"
NUXT_CONFIG="$PROJECT_DIR/nuxt.config.ts"

# Check if this is a Nuxt project
if [[ ! -f "$PACKAGE_JSON" ]]; then
  exit 0
fi

# Check for Nuxt
if ! grep -q "nuxt" "$PACKAGE_JSON" 2>/dev/null; then
  exit 0
fi

# Detect SEO modules
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

# Check for site.url configuration with robust multi-line parsing
SITE_URL_SET=false
if [[ -f "$NUXT_CONFIG" ]] && grep -q "site:" "$NUXT_CONFIG" 2>/dev/null; then
  # Use awk to properly parse the site block
  SITE_URL_SET=$(awk '
    /^[^ \t].*:/ { in_site_block=0 }  # Exit block on any top-level key
    /site:/ { in_site_block=1 }       # Enter site block
    in_site_block && /^[ \t]+url:/ { print "true"; exit }  # Found url in site block
  ' "$NUXT_CONFIG")

  # Default to false if awk didn't find it
  [[ "$SITE_URL_SET" != "true" ]] && SITE_URL_SET=false
fi

# Output context if SEO modules found
if [[ ${#MODULES[@]} -gt 0 ]]; then
  echo "Nuxt SEO project detected with: ${MODULES[*]}"

  if [[ "$SITE_URL_SET" == "false" ]]; then
    echo "Warning: site.url not configured in nuxt.config.ts (required for sitemaps/OG images)"
  fi

  # Persist to environment for other hooks
  if [[ -n "${CLAUDE_ENV_FILE:-}" ]]; then
    echo "export NUXT_SEO_MODULES='${MODULES[*]}'" >> "$CLAUDE_ENV_FILE"
    echo "export NUXT_SEO_SITE_URL_SET='$SITE_URL_SET'" >> "$CLAUDE_ENV_FILE"
  fi
fi

exit 0
