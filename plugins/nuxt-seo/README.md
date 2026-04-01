# Nuxt SEO v5 - Complete SEO Toolkit for Nuxt 3/4

**Status**: Production Ready
**Last Updated**: 2026-03-30
**Production Tested**: All 8 core modules + 3 standalone modules verified with official documentation from https://nuxtseo.com

---

## Auto-Trigger Keywords

Claude Code automatically discovers this skill when you mention:

### Primary Keywords
- nuxt seo
- nuxt-seo
- @nuxtjs/seo
- nuxt robots
- nuxt sitemap
- nuxt og image
- nuxt schema.org
- nuxt-robots
- nuxt-sitemap
- nuxt-og-image
- nuxt-schema-org
- nuxt-link-checker
- nuxt-seo-utils
- nuxt-site-config

### Secondary Keywords
- robots.txt nuxt
- sitemap.xml nuxt
- open graph nuxt
- og image nuxt
- schema.org nuxt
- structured data nuxt
- meta tags nuxt
- seo configuration nuxt
- canonical urls nuxt
- breadcrumbs nuxt
- social sharing nuxt
- bot detection nuxt

### Error-Based Keywords
- "sitemap not generated"
- "robots.txt missing"
- "og image not rendering"
- "schema validation errors"
- "broken links"
- "duplicate meta tags"
- "canonical url issues"
- "sitemap index errors"
- "useSiteConfig is not a function" (v5)
- "asSitemapCollection is not defined" (v5)

### Advanced SEO Keywords
- twitter cards nuxt
- indexnow nuxt
- rendering modes nuxt
- ssr vs ssg
- isr nuxt
- rich results nuxt
- json-ld nuxt
- useSeoMeta
- useSchemaOrg
- defineOgImage
- url structure seo
- meta robots nuxt

### v5 Feature Keywords
- useShareLinks
- social share links
- favicon generation nuxt
- eslint link checker
- link-checker/valid-route
- definePageMeta sitemap
- devtools unity
- getSiteConfig
- v5 migration

### Standalone Module Keywords
- nuxt ai ready
- llms.txt
- nuxt skew protection
- ai optimization nuxt

---

## What This Skill Does

Comprehensive guide for implementing SEO in Nuxt 3/4 applications using all 8 official Nuxt SEO v5 modules. Covers installation, configuration, breaking changes, and best practices for robots.txt, sitemaps, Open Graph images, Schema.org structured data, link checking, and site-wide SEO management.

### Core Capabilities

- **Complete SEO Setup** - Install all 8 modules with single command
- **Robots.txt Management** - Control search engine crawling and bot detection
- **XML Sitemap Generation** - Auto-generate sitemaps with dynamic content support
- **OG Image Creation** - Generate social sharing images using Vue templates
- **Schema.org Integration** - Add structured data for rich search results
- **Link Health Monitoring** - Find and fix broken links with ESLint integration
- **Meta Tag Management** - Centralized SEO utilities and site configuration
- **Multi-Language Support** - Built-in i18n SEO capabilities
- **Social Share Links** - Generate sharing URLs with UTM tracking (v5)
- **Favicon Generation** - CLI to generate all icon variants from one source (v5)
- **Inline Minification** - Auto-minify inline scripts and styles (v5)

---

## v5 Breaking Changes

Nuxt SEO v5 includes major version bumps for all modules (except OG Image). Key breaking changes:

1. **Site name must be explicitly set** - no longer auto-inferred from `package.json`
2. **Server-side `useSiteConfig(event)` removed** - use `getSiteConfig(event)` instead
3. **Content v3 composables renamed** - `asSitemapCollection()` → `defineSitemapSchema()`, etc.
4. **Legacy runtime config keys removed** - `siteUrl`, `siteName`, `siteDescription`

See `references/v5-migration-guide.md` for complete upgrade instructions.

---

## Quick Usage Example

```bash
# Install all 8 SEO modules at once
npx nuxt module add seo

# Configure in nuxt.config.ts
cat >> nuxt.config.ts << 'EOF'
export default defineNuxtConfig({
  modules: ['@nuxtjs/seo'],

  site: {
    url: 'https://example.com',
    name: 'My Awesome Site',  // Required in v5!
    description: 'Building amazing web experiences',
    defaultLocale: 'en'
  }
})
EOF

# Restart dev server
npm run dev

# Verify
# Visit http://localhost:3000/robots.txt
# Visit http://localhost:3000/sitemap.xml
```

**Result**: Complete SEO setup with robots.txt, sitemap, OG images, Schema.org, and more - all configured and ready to use.

**Full instructions**: See [SKILL.md](skills/nuxt-seo/SKILL.md)

---

## Package Versions (Verified 2026-03-30)

### Core Modules

| Package | Version | Status |
|---------|---------|--------|
| @nuxtjs/seo | 5.1.0 | v5 latest |
| @nuxtjs/robots | 6.0.6 | v6 latest |
| @nuxtjs/sitemap | 8.0.11 | v8 latest |
| nuxt-og-image | 6.3.1 | v6 latest |
| nuxt-schema-org | 6.0.4 | v6 latest |
| nuxt-link-checker | 5.0.6 | v5 latest |
| nuxt-seo-utils | 8.1.4 | v8 latest |
| nuxt-site-config | 4.0.7 | v4 latest |

### Standalone Modules

| Module | Version | License |
|--------|---------|---------|
| nuxt-ai-ready | 1.1.0 | MIT (free) |
| nuxt-skew-protection | 1.1.0 | MIT (free) |
| Nuxt SEO Pro | - | Paid ($119) |

---

## Dependencies

**Prerequisites**: Nuxt >=3.0.0 or Nuxt 4.x

**Integrates With**:
- @nuxtjs/i18n (optional - for multi-language SEO)
- @nuxt/content (optional - automatic SEO for content pages)

---

## File Structure

```
nuxt-seo/
├── .claude-plugin/
│   └── plugin.json           # Plugin manifest with agents/commands
├── skills/nuxt-seo/
│   ├── SKILL.md              # Complete documentation (all 8+ modules)
│   ├── references/           # Detailed reference docs
│   │   ├── v5-migration-guide.md  # NEW: v4 to v5 migration guide
│   │   ├── seo-guides.md          # Rendering, JSON-LD, Canonical, IndexNow, etc.
│   │   ├── pro-modules.md         # AI Ready, Skew Protection, SEO Pro
│   │   ├── advanced-seo-guides.md # I18n, Route Rules, Hydration, 404s
│   │   ├── modules-overview.md
│   │   ├── installation-guide.md
│   │   ├── api-reference.md
│   │   ├── common-patterns.md
│   │   ├── module-details.md
│   │   ├── best-practices.md
│   │   ├── troubleshooting.md
│   │   ├── advanced-configuration.md
│   │   ├── nuxt-content-integration.md
│   │   ├── og-image-guide.md
│   │   ├── sitemap-advanced.md
│   │   ├── nitro-api-reference.md
│   │   └── ai-seo-tools.md
│   ├── scripts/              # Setup automation
│   │   └── init-nuxt-seo.sh  # Quick project initialization
│   └── assets/               # Version tracking
│       └── package-versions.json
├── agents/                   # Autonomous SEO agents
│   ├── seo-auditor.md
│   ├── schema-generator.md
│   ├── og-image-generator.md
│   ├── link-checker.md
│   └── sitemap-builder.md
├── commands/                 # Slash commands
│   ├── seo-audit.md
│   ├── seo-setup.md
│   ├── og-preview.md
│   ├── check-links.md
│   ├── validate-sitemap.md
│   └── check-schema.md
└── README.md                 # This file
```

## Available Agents

| Agent | Purpose |
|-------|---------|
| **seo-auditor** | Autonomous SEO audit of Nuxt projects |
| **schema-generator** | Generates type-safe useSchemaOrg() code |
| **og-image-generator** | Creates custom OG image Vue templates |
| **link-checker** | Analyzes internal/external links |
| **sitemap-builder** | Designs optimal sitemap strategies |

## Available Commands

| Command | Purpose |
|---------|---------|
| **/seo-audit** | Run comprehensive SEO audit on current project |
| **/seo-setup** | Quick setup for Nuxt SEO with best practices |
| **/og-preview** | Preview OG image generation |
| **/check-links** | Run link checker analysis |
| **/validate-sitemap** | Validate sitemap configuration |
| **/check-schema** | Validate Schema.org implementation |

---

## Official Documentation

- **Nuxt SEO**: https://nuxtseo.com
- **v5 Migration Guide**: https://nuxtseo.com/docs/nuxt-seo/migration-guide/v4-to-v5
- **@nuxtjs/seo**: https://nuxtseo.com/docs/nuxt-seo/getting-started/introduction
- **nuxt-robots**: https://nuxtseo.com/docs/robots/getting-started/introduction
- **nuxt-sitemap**: https://nuxtseo.com/docs/sitemap/getting-started/introduction
- **nuxt-og-image**: https://nuxtseo.com/docs/og-image/getting-started/introduction
- **nuxt-schema-org**: https://nuxtseo.com/docs/schema-org/getting-started/introduction
- **nuxt-link-checker**: https://nuxtseo.com/docs/link-checker/getting-started/introduction
- **nuxt-ai-ready**: https://nuxtseo.com/docs/ai-ready/getting-started/introduction
- **nuxt-skew-protection**: https://nuxtseo.com/docs/skew-protection/getting-started/introduction
- **GitHub**: https://github.com/harlan-zw

---

## Contributing

Found an issue or have a suggestion?
- Open an issue: https://github.com/secondsky/claude-skills/issues
- See [SKILL.md](skills/nuxt-seo/SKILL.md) for detailed documentation

---

## License

MIT License - See main repo LICENSE file

---

**Production Tested**: All 8 core modules + 3 standalone modules verified against official documentation (https://nuxtseo.com/llms-full.txt)
**Error Prevention**: Prevents 14 common SEO configuration errors including 4 v5 breaking change issues
**Ready to use!** See [SKILL.md](skills/nuxt-seo/SKILL.md) for complete setup.
