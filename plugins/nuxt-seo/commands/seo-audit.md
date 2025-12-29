---
name: nuxt-seo:audit
description: Run comprehensive SEO audit on current Nuxt project
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
---

# SEO Audit Command

Run a comprehensive SEO audit on the current Nuxt project.

## What This Command Does

1. Analyzes `nuxt.config.ts` for SEO module configuration
2. Checks all Vue pages for meta tag usage
3. Validates structured data implementation
4. Reviews sitemap and robots.txt configuration
5. Audits OG image setup
6. Identifies critical SEO issues

## Audit Checklist

### Configuration
- [ ] `site.url` is set in nuxt.config.ts
- [ ] `@nuxtjs/seo` or individual modules installed
- [ ] Site name and description configured

### Meta Tags
- [ ] `useSeoMeta` used on pages
- [ ] Title tags present (not just defaults)
- [ ] Meta descriptions (150-160 chars)
- [ ] OG tags (ogTitle, ogDescription, ogImage)
- [ ] Twitter cards configured

### Structured Data
- [ ] Organization/Person identity defined
- [ ] Article schema on blog posts
- [ ] Product schema on product pages
- [ ] Breadcrumbs implemented

### Technical SEO
- [ ] Robots.txt configured correctly
- [ ] Sitemap generating properly
- [ ] No staging/admin routes indexed
- [ ] Proper rendering mode for SEO

## Run the Audit

Start by reading the nuxt.config.ts file to understand the project's SEO setup:

```bash
# Check for SEO modules
grep -l "nuxt-seo\|nuxt-robots\|nuxt-sitemap" nuxt.config.ts

# Find SEO meta usage
grep -r "useSeoMeta\|useHead" --include="*.vue" | head -20
```

Then systematically check each area and report findings.

## Expected Output

Generate a report with:
- Overall SEO score (0-100)
- Critical issues (blocking SEO)
- Warnings (should fix)
- Passed checks
- Specific recommendations with file locations
