# Phase 5: Package Manager Alternatives - Fix List

**Created**: 2025-11-19
**Status**: Ready for implementation
**Total Issues Found**: 50+ missing alternatives across 9 skills

---

## Summary by Severity

### Priority 1: Critical (Complete/Major Sections Missing) - 4 skills
- **shadcn-vue**: 11 instances missing alternatives
- **ultracite**: 10 instances missing alternatives
- **motion**: 8 instances missing alternatives
- **nuxt-content**: 4 instances missing alternatives

### Priority 2: High (Installation Sections Missing) - 3 skills
- **content-collections**: 2 instances in main installation
- **tailwind-v4-shadcn**: 4 instances in installation/config
- **nuxt-seo**: 2 instances in quick start

### Priority 3: Low (Minor/Single Issues) - 2 skills
- **aceternity-ui**: 1 duplicate alternative
- **mutation-testing**: 1 bunx without alternative

### Complete/No Issues - 3 skills
- **chrome-devtools**: ✅ All alternatives present
- **vitest-testing**: ✅ All alternatives present
- **zustand-state-management**: ✅ All alternatives present

---

## Detailed Fix Instructions

### 1. aceternity-ui (1 fix)

**File**: `skills/aceternity-ui/SKILL.md`

**Issue 1: Line 635 - Duplicate alternative**
```bash
# Current:
bun add motion
# or: bun add motion

# Fix to:
bun add motion
# or: npm install motion
```

---

### 2. content-collections (1 section - 2 instances)

**File**: `skills/content-collections/SKILL.md`

**Issue: Lines 56-58 - Missing npm/pnpm alternatives**

Current:
```bash
bun add -d @content-collections/core @content-collections/vite zod
```

Fix to:
```bash
# Bun (recommended)
bun add -d @content-collections/core @content-collections/vite zod

# npm
npm install -D @content-collections/core @content-collections/vite zod

# pnpm
pnpm add -D @content-collections/core @content-collections/vite zod
```

---

###3. motion (8 fixes)

**File**: `skills/motion/SKILL.md`

**Issue 1: Line 105 - framer-motion for Cloudflare Workers**
```bash
# Current:
bun add framer-motion

# Fix to:
bun add framer-motion
# or: npm install framer-motion
```

**Issue 2: Line 335 - React component installation**
```bash
# Current:
bun add motion

# Fix to:
bun add motion
# or: npm install motion
```

**Issue 3: Line 458 - Web Animations API fallback**
```bash
# Current:
bun add framer-motion

# Fix to:
bun add framer-motion
# or: npm install framer-motion
```

**Issue 4-6: Lines 529, 531, 533 - Virtualization libraries**
```bash
# Current:
bun add react-window
bun add react-virtuoso
bun add @tanstack/react-virtual

# Fix to (add after each):
# or: npm install [package-name]
```

**Issue 7: Line 804 - Performance optimization**
```bash
# Current:
bun add react-window

# Fix to:
bun add react-window
# or: npm install react-window
```

**Issue 8: Line 856 - Animation examples**
```bash
# Current:
bun add framer-motion

# Fix to:
bun add framer-motion
# or: npm install framer-motion
```

---

### 4. mutation-testing (1 fix)

**File**: `skills/mutation-testing/SKILL.md`

**Issue: Line 185 - Incremental testing**
```bash
# Current:
bunx stryker run --incremental

# Fix to:
bunx stryker run --incremental
# or: npx stryker run --incremental
```

---

### 5. nuxt-content (4 fixes)

**File**: `skills/nuxt-content/SKILL.md`

**Issue 1: Line 239 - Zod validation**
```bash
# Current:
bun add -D zod@^4.1.12

# Fix to:
bun add -D zod@^4.1.12
# or: npm install -D zod@^4.1.12
```

**Issue 2: Line 257 - Valibot validation**
```bash
# Current:
bun add -D valibot@^0.42.0

# Fix to:
bun add -D valibot@^0.42.0
# or: npm install -D valibot@^0.42.0
```

**Issue 3: Line 505 - Cloudflare deployment**
```bash
# Current:
bunx wrangler pages deploy dist

# Fix to:
bunx wrangler pages deploy dist
# or: npx wrangler pages deploy dist
```

**Issue 4: Line 553 - Nuxt Studio**
```bash
# Current:
bun add -D nuxt-studio@alpha

# Fix to:
bun add -D nuxt-studio@alpha
# or: npm install -D nuxt-studio@alpha
```

---

### 6. nuxt-seo (2 fixes)

**File**: `skills/nuxt-seo/SKILL.md`

**Issue 1: Line 199 - Quick start @nuxtjs/seo**
```bash
# Current:
bunx nuxi module add @nuxtjs/seo

# Fix to:
bunx nuxi module add @nuxtjs/seo
# or: npx nuxi module add @nuxtjs/seo
```

**Issue 2: Line 216 - Individual module installation**
```bash
# Current:
bunx nuxi module add nuxt-robots

# Fix to:
bunx nuxi module add nuxt-robots
# or: npx nuxi module add nuxt-robots
```

---

### 7. shadcn-vue (11 fixes)

**File**: `skills/shadcn-vue/SKILL.md`

**Issue 1: Line 79 - Quick start add button**
```bash
# Current:
bunx shadcn-vue@latest add button

# Fix to:
bunx shadcn-vue@latest add button
# or: npx shadcn-vue@latest add button
```

**Issue 2: Line 101 - Initialize shadcn-vue**
```bash
# Current:
bunx shadcn-vue@latest init

# Fix to:
bunx shadcn-vue@latest init
# or: npx shadcn-vue@latest init
# or: pnpm dlx shadcn-vue@latest init
```

**Issue 3: Line 129 - Auto-form component**
```bash
# Current:
bunx shadcn-vue@latest add auto-form

# Fix to:
bunx shadcn-vue@latest add auto-form
# or: npx shadcn-vue@latest add auto-form
```

**Issue 4: Line 130 - Zod dependency**
```bash
# Current:
bun add zod

# Fix to:
bun add zod
# or: npm install zod
```

**Issue 5: Line 171 - Data table component**
```bash
# Current:
bunx shadcn-vue@latest add data-table

# Fix to:
bunx shadcn-vue@latest add data-table
# or: npx shadcn-vue@latest add data-table
```

**Issue 6: Line 172 - TanStack table dependency**
```bash
# Current:
bun add @tanstack/vue-table

# Fix to:
bun add @tanstack/vue-table
# or: npm install @tanstack/vue-table
```

**Issue 7: Line 217 - VueUse dependency**
```bash
# Current:
bun add @vueuse/core

# Fix to:
bun add @vueuse/core
# or: npm install @vueuse/core
```

**Issue 8: Line 384 - Monorepo init**
```bash
# Current:
bunx shadcn-vue@latest init -c ./apps/web

# Fix to:
bunx shadcn-vue@latest init -c ./apps/web
# or: npx shadcn-vue@latest init -c ./apps/web
```

**Issue 9: Line 397 - Add all components**
```bash
# Current:
bunx shadcn-vue@latest add --all

# Fix to:
bunx shadcn-vue@latest add --all
# or: npx shadcn-vue@latest add --all
```

**Issue 10: Line 404 - Diff command**
```bash
# Current:
bunx shadcn-vue@latest diff button

# Fix to:
bunx shadcn-vue@latest diff button
# or: npx shadcn-vue@latest diff button
```

**Issue 11: Line 426 - Radix init**
```bash
# Current:
bunx shadcn-vue@radix init

# Fix to:
bunx shadcn-vue@radix init
# or: npx shadcn-vue@radix init
```

---

### 8. tailwind-v4-shadcn (4 fixes)

**File**: `skills/tailwind-v4-shadcn/SKILL.md`

**Issue 1: Line 76 - Tailwind v4 installation**
```bash
# Current:
bun add tailwindcss @tailwindcss/vite

# Fix to:
bun add tailwindcss @tailwindcss/vite
# or: npm install tailwindcss @tailwindcss/vite
```

**Issue 2: Line 476 - Deprecated tailwindcss-animate**
```bash
# Current:
bun add tailwindcss-animate  # ❌ Deprecated

# Fix to:
bun add tailwindcss-animate  # ❌ Deprecated
# or: npm install tailwindcss-animate  # ❌ Deprecated
```

**Issue 3: Line 496 - Typography plugin**
```bash
# Current:
bun add -d @tailwindcss/typography

# Fix to:
bun add -d @tailwindcss/typography
# or: npm install -D @tailwindcss/typography
```

**Issue 4: Line 526 - Forms plugin**
```bash
# Current:
bun add -d @tailwindcss/forms

# Fix to:
bun add -d @tailwindcss/forms
# or: npm install -D @tailwindcss/forms
```

---

### 9. ultracite (10 fixes)

**File**: `skills/ultracite/SKILL.md`

**Issue 1: Line 226 - Initialize ultracite**
```bash
# Current:
bunx ultracite init \

# Fix to:
bunx ultracite init \
# or: npx ultracite init \
```

**Issue 2: Line 583 - Check with error level**
```bash
# Current:
bunx ultracite check --diagnostic-level error  # Only errors

# Fix to:
bunx ultracite check --diagnostic-level error  # Only errors
# or: npx ultracite check --diagnostic-level error
```

**Issue 3: Line 597 - Fix unsafe**
```bash
# Current:
bunx ultracite fix --unsafe

# Fix to:
bunx ultracite fix --unsafe
# or: npx ultracite fix --unsafe
```

**Issue 4: Line 665 - Install husky**
```bash
# Current:
bun add -D husky

# Fix to:
bun add -D husky
# or: npm install -D husky
```

**Issue 5: Line 666 - Init husky**
```bash
# Current:
bunx husky install

# Fix to:
bunx husky install
# or: npx husky install
```

**Issue 6: Line 707 - Install lefthook**
```bash
# Current:
bun add -D lefthook

# Fix to:
bun add -D lefthook
# or: npm install -D lefthook
```

**Issue 7: Line 708 - Init lefthook**
```bash
# Current:
bunx lefthook install

# Fix to:
bunx lefthook install
# or: npx lefthook install
```

**Issue 8: Line 760 - Install lint-staged**
```bash
# Current:
bun add -D lint-staged

# Fix to:
bun add -D lint-staged
# or: npm install -D lint-staged
```

**Issue 9: Line 802 - Run lint-staged**
```bash
# Current:
bunx lint-staged

# Fix to:
bunx lint-staged
# or: npx lint-staged
```

**Issue 10: Line 879 - Init with agents**
```bash
# Current:
bunx ultracite init --agents cursor,claude,cline,windsurf

# Fix to:
bunx ultracite init --agents cursor,claude,cline,windsurf
# or: npx ultracite init --agents cursor,claude,cline,windsurf
```

---

## Implementation Summary

**Total Fixes Required**: 50+ instances across 9 skills

**By Priority**:
- Priority 1 (Critical): 33 fixes across 4 skills
- Priority 2 (High): 10 fixes across 3 skills
- Priority 3 (Low): 2 fixes across 2 skills

**Skills Verified Complete** (No fixes needed):
- chrome-devtools ✅
- vitest-testing ✅
- zustand-state-management ✅

---

## Implementation Plan

1. **Batch 1 - Priority 1 (Critical)**:
   - shadcn-vue (11 fixes)
   - ultracite (10 fixes)
   - motion (8 fixes)
   - nuxt-content (4 fixes)

2. **Batch 2 - Priority 2 (High)**:
   - tailwind-v4-shadcn (4 fixes)
   - content-collections (2 fixes via section restructure)
   - nuxt-seo (2 fixes)

3. **Batch 3 - Priority 3 (Low)**:
   - aceternity-ui (1 fix)
   - mutation-testing (1 fix)

---

**Total Skills Audited (Priority 1)**: 12
**Skills with Issues**: 9
**Skills Complete**: 3
**Next**: Implement fixes in batches

**Created By**: Claude Code Agent
**Last Updated**: 2025-11-19
