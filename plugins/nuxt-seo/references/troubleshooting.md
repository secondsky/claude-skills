# Nuxt SEO Troubleshooting Guide

**Common problems and solutions for Nuxt SEO modules**

---

## Table of Contents

1. [Sitemap Not Generating](#problem-sitemap-not-generating)
2. [Robots.txt Not Working](#problem-robotstxt-not-working)
3. [OG Images Not Rendering](#problem-og-images-not-rendering)
4. [Schema.org Not Appearing](#problem-schemaorg-not-appearing)
5. [Build Errors](#problem-build-errors)

---

## Problem: Sitemap Not Generating

### Symptoms
- Visiting `/sitemap.xml` shows 404
- Sitemap file not created during build
- Search Console reports "Couldn't fetch sitemap"

### Solution

**Step 1: Verify Installation**
```bash
# Check if nuxt-sitemap is installed
bun pm ls | grep nuxt-sitemap

# If not installed:
bun add nuxt-sitemap
```

**Step 2: Set Site URL**
```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  site: {
    url: 'https://example.com' // REQUIRED!
  }
})
```

**Step 3: Restart Dev Server**
```bash
# Clear cache and restart
rm -rf .nuxt
bun run dev
```

**Step 4: Test**
```bash
# Visit in browser
http://localhost:3000/sitemap.xml
```

### Common Causes
- Missing `site.url` configuration (most common)
- Module not added to `modules` array
- `.nuxt` cache corruption
- Sitemap disabled in config

---

## Problem: Robots.txt Not Working

### Symptoms
- `/robots.txt` shows 404
- Staging site appearing in search results
- Robots.txt not blocking expected paths

### Solution

**Step 1: Verify Installation**
```bash
# Check if nuxt-robots is installed
bun pm ls | grep nuxt-robots

# If not installed:
bun add nuxt-robots
```

**Step 2: Set Site URL**
```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  site: {
    url: 'https://example.com' // REQUIRED!
  }
})
```

**Step 3: Clear Cache and Restart**
```bash
rm -rf .nuxt
bun run dev
```

**Step 4: Test**
```bash
# Visit in browser
http://localhost:3000/robots.txt
```

### Common Causes
- Missing `site.url` (robots.txt cannot generate without it)
- Module not properly registered
- Environment variable not set correctly
- Cached version being served

---

## Problem: OG Images Not Rendering

### Symptoms
- OG image URL returns 404
- Social platforms show default image
- Build warnings about fonts or CSS
- Image shows blank/white

### Solution

**Step 1: Verify Installation**
```bash
bun pm ls | grep nuxt-og-image
# If not installed:
bun add nuxt-og-image
```

**Step 2: Check Fonts**
```typescript
// nuxt.config.ts
ogImage: {
  fonts: [
    'Inter:400', // Make sure fonts are accessible
    'Inter:700'
  ]
}
```

**Step 3: CSS Compatibility (Satori)**
If using Satori renderer (default):
- Flexbox: ✅ Supported
- Grid: ❌ Not supported
- Absolute positioning: ⚠️ Limited

**Solution**: Switch to Chromium for complex layouts:
```typescript
ogImage: {
  renderer: 'chromium' // Full CSS support
}
```

**Step 4: Test Generation**
```bash
# Visit OG image URL
http://localhost:3000/__og-image__/og.png
```

### Common Causes
- Incompatible CSS (when using Satori)
- Missing or inaccessible fonts
- Complex layouts requiring Chromium
- Image path not properly configured

---

## Problem: Schema.org Not Appearing

### Symptoms
- Schema.org not in page source
- Google Rich Results Test shows no structured data
- `useSchemaOrg()` not generating JSON-LD

### Solution

**Step 1: Verify Installation**
```bash
bun pm ls | grep nuxt-schema-org
# If not installed:
bun add nuxt-schema-org
```

**Step 2: Check Script Setup**
```vue
<script setup>
// MUST be in <script setup>, not <script>
useSchemaOrg([
  {
    '@type': 'Article',
    headline: 'Your Article'
  }
])
</script>
```

**Step 3: Inspect Page Source**
```bash
# In browser: View > Developer > View Source
# Look for <script type="application/ld+json">
```

**Step 4: Validate**
Use [Google Rich Results Test](https://search.google.com/test/rich-results):
- Paste your page URL
- Check for errors

### Common Causes
- Called in `<script>` instead of `<script setup>`
- Schema.org composable not imported
- Invalid schema structure
- Build optimization removing script tags

---

## Problem: Build Errors

### Symptoms
- Build fails with module errors
- Type errors from SEO modules
- Dependency conflicts
- "Cannot find module" errors

### Solution

**Step 1: Update All Modules**
```bash
# Update to latest versions
bun update @nuxtjs/seo nuxt-robots nuxt-sitemap nuxt-og-image nuxt-schema-org nuxt-link-checker nuxt-seo-utils nuxt-site-config
```

**Step 2: Clear All Caches**
```bash
# Clear Nuxt cache
rm -rf .nuxt

# Clear node_modules cache
rm -rf node_modules/.cache

# Clear Bun/npm cache (if needed)
bun pm cache rm
```

**Step 3: Reinstall Dependencies**
```bash
# Full clean reinstall
rm -rf node_modules
rm bun.lockb  # or package-lock.json / pnpm-lock.yaml
bun install
```

**Step 4: Check Nuxt Version**
```bash
# Nuxt SEO requires Nuxt 3+
bun pm ls nuxt
```

### Common Causes
- Outdated module versions
- Corrupted cache
- Nuxt version incompatibility
- Conflicting dependencies

---

## Advanced Troubleshooting

### Enable Debug Mode

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  debug: true,

  sitemap: {
    debug: true
  },

  ogImage: {
    debug: true
  }
})
```

### Check Module Loading

```bash
# Run Nuxt with debug logs
DEBUG=nuxt:* bun run dev
```

### Verify Module Registration

Check that modules are in the correct order:

```typescript
modules: [
  '@nuxtjs/seo',  // Install all modules at once
  // OR install individually:
  // 'nuxt-site-config',  // Should be first
  // 'nuxt-robots',
  // 'nuxt-sitemap',
  // etc.
]
```

---

## Getting Help

If problems persist:

1. **Check GitHub Issues**: https://github.com/harlan-zw/nuxt-seo
2. **Nuxt SEO Discord**: Join via nuxtseo.com
3. **Official Docs**: https://nuxtseo.com
4. **Stack Overflow**: Tag `nuxt-seo`

---

**Last Updated**: 2025-11-27
