---
name: nuxt-ui-v4:migrate
description: Migrate project from Nuxt UI v2/v3 to v4 with automated fixes for breaking changes
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
argument-hint: "[--dry-run] [--from v3]"
---

# Nuxt UI Migration Command

Migrate from Nuxt UI v2/v3 to v4 with automated breaking change fixes.

## Arguments

- `--dry-run`: Show changes without applying them
- `--from v3`: Specify source version (default: auto-detect)

## Instructions

1. **Detect Current Version**
   Read package.json to find current @nuxt/ui version.

2. **Scan for Breaking Changes**
   Search codebase for patterns that need updating:

   | v3 Pattern | v4 Pattern | Files to Check |
   |------------|------------|----------------|
   | `<UButtonGroup>` | `<UFieldGroup>` | `*.vue` |
   | `<UPageMarquee>` | `<UMarquee>` | `*.vue` |
   | `<UPageAccordion>` | `<UAccordion>` | `*.vue` |
   | `v-model.nullify` | `v-model.nullable` | `*.vue` |
   | `.$el.focus()` | `.focus()` | `*.vue`, `*.ts` |
   | `useToast.js'` | `useToast'` | `*.ts`, `*.vue` |

3. **Check Configuration Files**
   - `nuxt.config.ts` - Module registration
   - `app.vue` - UApp wrapper, CSS imports
   - `app.config.ts` - Theme configuration
   - `tailwind.config.*` - Should be removed (v4 uses CSS)

4. **Report Findings**
   If `--dry-run`:
   - List all files with breaking changes
   - Show before/after for each change
   - Summarize total changes needed

5. **Apply Fixes**
   If not `--dry-run`:
   - Apply each fix with Edit tool
   - Track successful/failed changes
   - Report results

6. **Update Dependencies**
   ```bash
   bun update @nuxt/ui
   bun add tailwindcss@4
   ```

7. **Post-Migration Checks**
   ```bash
   bunx nuxt prepare
   bun run build
   ```

8. **Highlight New Features**
   After migration, inform about new v4 capabilities:
   - Dashboard components
   - Chat/AI components
   - Editor components
   - Page layout components
   - 125+ total components

## Breaking Changes Reference

### Component Renames
```diff
- <UButtonGroup>
+ <UFieldGroup>

- <UPageMarquee>
+ <UMarquee>
```

### Removed Components
```diff
- <UPageAccordion>
+ <UAccordion unmount-on-hide="false">
```

### Model Modifiers
```diff
- v-model.nullify="value"
+ v-model.nullable="value"
```

### Template Refs (v4.2+)
```diff
- inputRef.value.$el.focus()
+ inputRef.value?.focus()
```

### Composable Imports
```diff
- import { useToast } from '#ui/composables/useToast.js'
+ import { useToast } from '#ui/composables/useToast'
```

### CSS Import Order
```vue
<style>
@import "tailwindcss";  /* FIRST */
@import "@nuxt/ui";     /* SECOND */
</style>
```

### Form Changes
- Transformations now apply only to submit data
- Nested forms require explicit `nested` prop

## Output

Summary report including:
- Files modified
- Changes applied
- Errors encountered
- Manual changes required
- New features available
