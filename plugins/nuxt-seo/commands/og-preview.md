---
name: nuxt-seo:og-preview
description: Preview and debug OG image generation for a specific route or all routes
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
  - WebFetch
---

# OG Preview Command

Preview and debug Open Graph image generation for Nuxt applications using nuxt-og-image.

## What This Command Does

1. Checks OG image configuration in nuxt.config.ts
2. Identifies all routes with defineOgImage usage
3. Lists available OG image templates
4. Provides preview URLs for testing
5. Validates Satori CSS compatibility

## Quick Actions

### Check OG Image Configuration

```bash
# Find OG image config
grep -A 20 "ogImage" nuxt.config.ts

# Find defineOgImage usage
grep -r "defineOgImage" --include="*.vue" -l

# List OG image templates
ls -la components/OgImage/
```

### Preview URLs

When dev server is running:

| URL | Purpose |
|-----|---------|
| `/_nuxt-og-image/playground` | Interactive OG image playground |
| `/__og-image__/image/[route]/og.png` | Preview specific route's OG image |
| `/__og-image__/image/[route]/og.png?debug` | Debug mode with overlay |

### Common Issues to Check

1. **Template Not Found**
   - Verify component exists in `components/OgImage/`
   - Check component name matches usage

2. **Rendering Issues (Satori)**
   - No CSS Grid (use flexbox)
   - No `display: block/inline`
   - Images need explicit dimensions
   - Fonts must be configured

3. **Chromium Fallback**
   - For complex layouts, use `renderer: 'chromium'`
   - Requires Chromium binary in production

## Output Format

```markdown
# OG Image Preview Report

## Configuration
- Renderer: [satori/chromium]
- Default template: [template name]
- Custom fonts: [yes/no]

## Routes with OG Images
| Route | Template | Props |
|-------|----------|-------|
| `/` | NuxtSeo | title, description |
| `/blog/[slug]` | BlogPost | title, author, date |

## Available Templates
- NuxtSeo (default)
- BlogPost
- Product

## Preview URLs
- Playground: http://localhost:3000/_nuxt-og-image/playground
- Home: http://localhost:3000/__og-image__/image/og.png

## Issues Found
- [Issue description]
```

## Run the Preview

Start by checking the project's OG image configuration and list all routes using defineOgImage.
