---
name: nuxt-seo:check-links
description: Run link checker analysis on the Nuxt project to find broken links
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
---

# Check Links Command

Analyze internal and external links in the Nuxt project using nuxt-link-checker.

## What This Command Does

1. Checks if nuxt-link-checker is configured
2. Analyzes all NuxtLink and anchor tags
3. Identifies potentially broken internal links
4. Flags link text issues (accessibility/SEO)
5. Lists external links for manual review

## Quick Actions

### Check Link Checker Config

```bash
# Check if link-checker is enabled
grep -A 10 "linkChecker" nuxt.config.ts

# Check module installation
grep -E "@nuxtjs/seo|nuxt-link-checker" package.json
```

### Find All Internal Links

```bash
# Find NuxtLink usage
grep -r "NuxtLink\|to=\"/" --include="*.vue" | head -30

# Find hash/anchor links
grep -rE "to=\"[^\"]*#" --include="*.vue"
```

### Find External Links

```bash
# Find external URLs
grep -rE "https?://" --include="*.vue" --include="*.md" -h | \
  grep -oE "https?://[a-zA-Z0-9./_-]+" | sort -u
```

### Check for Link Text Issues

```bash
# Find generic link text
grep -riE "<(NuxtLink|a)[^>]*>.*?(click here|read more|here).*?<" \
  --include="*.vue"
```

## Inspection Rules

| Rule | Description | Severity |
|------|-------------|----------|
| `no-error-response` | Links return 2xx/3xx | Error |
| `missing-hash` | Hash targets exist | Error |
| `link-text` | Descriptive link text | Warning |
| `absolute-site-urls` | Use relative URLs | Warning |
| `trailing-slash` | Consistent trailing slashes | Info |

## Output Format

```markdown
# Link Check Report

## Summary
- Internal Links: X
- External Links: X
- Potential Issues: X

## Internal Link Issues
| File | Link | Issue |
|------|------|-------|
| pages/index.vue:25 | /old-page | Route not found |

## Link Text Issues
| File | Current Text | Suggestion |
|------|--------------|------------|
| components/Footer.vue:15 | "Click here" | Use descriptive text |

## External Links (Manual Review)
- https://external-site.com/api
- https://docs.example.com

## Recommendations
1. Update broken internal links
2. Improve link text for accessibility
3. Verify external links are still valid
```

## Run the Check

Start by verifying link-checker configuration, then analyze the project's links systematically.
