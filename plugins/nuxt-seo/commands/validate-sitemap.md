---
name: nuxt-seo:validate-sitemap
description: Validate sitemap configuration and check for common issues
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
  - WebFetch
---

# Validate Sitemap Command

Validate sitemap configuration and identify common issues in Nuxt applications.

## What This Command Does

1. Checks sitemap configuration in nuxt.config.ts
2. Verifies site.url is set (required for sitemaps)
3. Analyzes dynamic URL sources
4. Checks i18n sitemap integration
5. Validates exclude/include patterns
6. Reviews caching configuration

## Quick Actions

### Check Sitemap Configuration

```bash
# Check site.url (required)
grep -E "site:|url:" nuxt.config.ts | head -10

# Check sitemap config
grep -A 30 "sitemap:" nuxt.config.ts

# Check for API sources
ls -la server/api/__sitemap__/
```

### Verify Module Installation

```bash
# Check if sitemap module is installed
grep -E "@nuxtjs/seo|@nuxtjs/sitemap|nuxt-sitemap" package.json
```

### Check Dynamic Sources

```bash
# Find sitemap API endpoints
find server -name "*.ts" | xargs grep -l "defineSitemapEventHandler"

# Check sources configuration
grep -A 5 "sources:" nuxt.config.ts
```

## Validation Checklist

### Required Configuration
- [ ] `site.url` is set in nuxt.config.ts
- [ ] Module is installed and added to modules array
- [ ] No conflicting sitemap configurations

### Dynamic URLs
- [ ] API endpoints return valid SitemapUrl objects
- [ ] `loc` paths are relative (not absolute URLs)
- [ ] `lastmod` dates are valid ISO strings

### Multi-Sitemap
- [ ] Sitemaps have unique names
- [ ] `_sitemap` key used correctly in sources
- [ ] No overlapping include/exclude patterns

### I18n
- [ ] i18n module loaded before sitemap
- [ ] `_i18nTransform` used for dynamic URLs
- [ ] Locale sitemaps generating correctly

### Performance
- [ ] Caching configured for large sites
- [ ] Chunking enabled for >1000 URLs
- [ ] Sources are optimized

## Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| Empty sitemap | Missing site.url | Add `site: { url: '...' }` |
| 404 on sitemap.xml | Module not installed | Install @nuxtjs/sitemap |
| Duplicate URLs | Multiple sources overlap | Use include/exclude filters |
| Missing dynamic URLs | Source not registered | Add to `sources: []` |
| i18n not working | Module order wrong | Load i18n before sitemap |

## Output Format

```markdown
# Sitemap Validation Report

## Configuration Status
- site.url: [set/missing]
- Module: [installed/missing]
- Mode: [single/multi/auto-chunked]

## Validation Results
- [ ] Required: site.url configured
- [x] Required: Module installed
- [ ] Optional: Dynamic sources configured
- [x] Optional: Caching enabled

## Issues Found
1. **[Critical]** site.url not configured
   - File: nuxt.config.ts
   - Fix: Add `site: { url: 'https://example.com' }`

## Sitemap Structure
| Sitemap | URLs | Source |
|---------|------|--------|
| /sitemap.xml | ~50 | nuxt:pages |
| /posts-sitemap.xml | ~200 | API endpoint |

## Recommendations
1. Set site.url for production
2. Add dynamic sources for database content
3. Enable caching for better performance
```

## Run Validation

Start by checking the nuxt.config.ts for site.url and sitemap configuration.
