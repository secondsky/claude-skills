---
name: nuxt-seo:check-schema
description: Validate Schema.org structured data implementation in the Nuxt project
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
---

# Check Schema Command

Validate Schema.org structured data implementation using nuxt-schema-org.

## What This Command Does

1. Checks schema.org configuration in nuxt.config.ts
2. Finds all useSchemaOrg usage across pages
3. Validates schema type implementations
4. Identifies missing required properties
5. Suggests additional schema opportunities

## Quick Actions

### Check Configuration

```bash
# Check schema.org config
grep -A 20 "schemaOrg:" nuxt.config.ts

# Check identity configuration
grep -A 10 "identity:" nuxt.config.ts
```

### Find Schema Usage

```bash
# Find useSchemaOrg usage
grep -r "useSchemaOrg" --include="*.vue" -l

# Find define* helpers
grep -rE "define(Article|Product|Organization|Person|FAQPage|Event|Recipe)" \
  --include="*.vue" -l

# Find schema in Nuxt Content
grep -rE "schemaOrg:" --include="*.md" -l
```

### Common Schema Types

| Type | Use Case | Helper |
|------|----------|--------|
| Organization | Company site | defineOrganization |
| Person | Personal site | definePerson |
| Article | Blog posts | defineArticle |
| Product | E-commerce | defineProduct |
| FAQPage | FAQ sections | defineFAQPage |
| BreadcrumbList | Navigation | defineBreadcrumb |
| Event | Events | defineEvent |
| Recipe | Recipes | defineRecipe |

## Validation Checklist

### Global Identity
- [ ] Organization or Person defined in config
- [ ] Logo URL is absolute
- [ ] Name matches site branding

### Article Schema
- [ ] headline (title)
- [ ] datePublished
- [ ] dateModified
- [ ] author
- [ ] image

### Product Schema
- [ ] name
- [ ] image
- [ ] description
- [ ] offers (price, availability)
- [ ] brand

### FAQ Schema
- [ ] Question text
- [ ] Answer text
- [ ] Proper nesting

## Output Format

```markdown
# Schema.org Validation Report

## Global Configuration
- Identity Type: [Organization/Person/None]
- Identity Name: [name]
- Logo: [configured/missing]

## Schema Usage by Page

### Blog Posts
| Page | Schema Types | Status |
|------|--------------|--------|
| /blog/[slug].vue | Article | Complete |
| /blog/index.vue | None | Missing |

### Products
| Page | Schema Types | Status |
|------|--------------|--------|
| /products/[id].vue | Product | Missing price |

## Issues Found
1. **[Warning]** Article missing dateModified
   - File: pages/blog/[slug].vue
   - Fix: Add `dateModified` property

## Rich Results Eligibility
- Article: Eligible
- Product: Missing required fields
- FAQ: Not implemented

## Recommendations
1. Add FAQ schema to /faq page
2. Add BreadcrumbList to all nested pages
3. Include dateModified for Article schema
```

## Run Check

Start by checking the global schema.org configuration, then scan all pages for schema usage.
