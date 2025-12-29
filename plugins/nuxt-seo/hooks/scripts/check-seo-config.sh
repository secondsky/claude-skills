#!/bin/bash
# Check SEO configuration after file writes
# Validates critical SEO settings in Nuxt projects

set -euo pipefail

# Read input from stdin
INPUT=$(cat)

# Extract file path from tool input
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

if [[ -z "$FILE_PATH" ]]; then
  exit 0
fi

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"

# Only check relevant files
case "$FILE_PATH" in
  *nuxt.config.ts|*nuxt.config.js)
    # Check site.url configuration
    if [[ -f "$FILE_PATH" ]]; then
      if ! grep -q "site:" "$FILE_PATH" 2>/dev/null || ! grep -A10 "site:" "$FILE_PATH" | grep -q "url:" 2>/dev/null; then
        echo "SEO Check: site.url not found in nuxt.config. Add site: { url: 'https://...' } for sitemaps and OG images to work correctly." >&2
      fi

      # Check for @nuxtjs/seo or individual modules
      if ! grep -qE "@nuxtjs/seo|nuxt-og-image|nuxt-sitemap|nuxt-schema-org" "$FILE_PATH" 2>/dev/null; then
        echo "SEO Check: No SEO modules found in config. Consider adding @nuxtjs/seo for comprehensive SEO support." >&2
      fi
    fi
    ;;

  *pages/*.vue|*app.vue)
    # Check for SEO meta in pages
    if [[ -f "$FILE_PATH" ]]; then
      if ! grep -qE "useSeoMeta|useHead|defineOgImage" "$FILE_PATH" 2>/dev/null; then
        echo "SEO Check: Page has no SEO meta defined. Consider adding useSeoMeta() for title, description, and OG tags." >&2
      fi
    fi
    ;;

  *components/OgImage/*.vue)
    # Check OG image component for Satori compatibility
    if [[ -f "$FILE_PATH" ]]; then
      if grep -qE "display:\s*(grid|block|inline)" "$FILE_PATH" 2>/dev/null; then
        echo "SEO Check: OG image component uses CSS not supported by Satori (grid, block, inline). Use flexbox only or set renderer: 'chromium'." >&2
      fi
    fi
    ;;

  *server/api/__sitemap__/*.ts)
    # Check sitemap endpoint
    if [[ -f "$FILE_PATH" ]]; then
      if ! grep -q "defineSitemapEventHandler" "$FILE_PATH" 2>/dev/null; then
        echo "SEO Check: Sitemap endpoint should use defineSitemapEventHandler for type-safe URL definitions." >&2
      fi
    fi
    ;;
esac

exit 0
