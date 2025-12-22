# Content Collections - Advanced Troubleshooting

This reference covers advanced issues (#4-8) that are less common but important for production deployments. For the most common issues (#1-3), see the main SKILL.md.

---

## Issue #4: Collection Not Updating on File Change

**Error**: New content files not appearing in collection.

**Why it happens**: Glob pattern doesn't match, or dev server needs restart.

**Prevention**:

1. Verify glob pattern matches your files:
```typescript
include: "*.md"        // Only root files
include: "**/*.md"     // All nested files
include: "posts/*.md"  // Only posts/ folder
```

2. Restart dev server after adding new files outside watched patterns
3. Check file actually saved (watch for editor issues)

**Source**: Common user error

---

## Issue #5: MDX Type Errors with Shiki

**Error**: `esbuild errors with shiki langAlias` or compilation failures.

**Why it happens**: Version incompatibility between Shiki and Content Collections.

**Prevention**:

Use compatible versions:

```json
{
  "devDependencies": {
    "@content-collections/mdx": "^0.2.2",
    "shiki": "^1.0.0"
  }
}
```

Check official compatibility matrix in docs before upgrading Shiki.

**Source**: GitHub Issue #598 (Next.js 15)

---

## Issue #6: Custom Path Aliases in MDX Imports Fail

**Error**: MDX imports with `@` alias don't resolve.

**Why it happens**: MDX compiler doesn't respect tsconfig path aliases.

**Prevention**:

Use relative paths in MDX imports:

```mdx
<!-- Won't work -->
import Component from "@/components/Component"

<!-- Works -->
import Component from "../../components/Component"
```

Or configure files appender (advanced, see references/transform-cookbook.md).

**Source**: GitHub Issue #547

---

## Issue #7: Unclear Validation Error Messages

**Error**: Cryptic Zod validation errors like "Expected string, received undefined".

**Why it happens**: Zod errors aren't formatted for content context.

**Prevention**:

Add custom error messages to schema:

```typescript
schema: z.object({
  title: z.string({
    required_error: "Title is required in frontmatter",
    invalid_type_error: "Title must be a string",
  }),
  date: z.string().refine(
    (val) => !isNaN(Date.parse(val)),
    "Date must be valid ISO date (YYYY-MM-DD)"
  ),
})
```

**Source**: GitHub Issue #403

---

## Issue #8: Ctrl+C Doesn't Stop Process

**Error**: Dev process hangs on exit, requires `kill -9`.

**Why it happens**: File watcher not cleaning up properly.

**Prevention**:

This is a known issue with the watcher. Workarounds:

1. Use `kill -9 <pid>` when it hangs
2. Use `content-collections watch` separately (not plugin) for more control
3. Add cleanup handler in `vite.config.ts` (advanced)

**Source**: GitHub Issue #546

---

## When to Use This Reference

Load this reference when:
- Content files aren't appearing after adding new files
- MDX compilation fails with Shiki errors
- Import aliases aren't working in MDX files
- Zod validation errors are unclear
- Dev process doesn't exit cleanly

For common issues (Module not found, Vite restart loop, Transform types), see the main SKILL.md.
