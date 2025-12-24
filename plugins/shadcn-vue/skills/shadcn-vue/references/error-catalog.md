# shadcn-vue - Complete Error Catalog

This document contains all 7 documented issues and their solutions for shadcn-vue with Reka UI v2.

**Last Updated**: 2025-11-10
**shadcn-vue Version**: latest (Reka UI v2)
**Source**: Production deployments, common setup mistakes

---

## Issue #1: Missing TypeScript Path Aliases

**Error**: `Cannot find module '@/components/ui/button'`

**Source**: Common setup mistake

**Why It Happens**: TypeScript doesn't know how to resolve `@/` imports

**Prevention**:
```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**Also Configure Vite**:
```typescript
// vite.config.ts
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
```

---

## Issue #2: Tailwind CSS Not Configured

**Error**: Components render without styles

**Source**: Missing Tailwind setup

**Why It Happens**: Tailwind not imported or configured

**Prevention**:
```css
/* src/assets/index.css */
@import "tailwindcss";
```

```typescript
// vite.config.ts (Tailwind v4)
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [vue(), tailwindcss()]
})
```

**For Tailwind v3**:
```css
/* src/assets/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

---

## Issue #3: CSS Variables Not Defined

**Error**: Theme colors not applying, gray/transparent components

**Source**: Incomplete initialization or deleted CSS

**Why It Happens**: CSS variables required for theming not defined

**Prevention**: Ensure all CSS variables are defined in main CSS file:
```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96.1%;
  --secondary-foreground: 222.2 47.4% 11.2%;
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --accent: 210 40% 96.1%;
  --accent-foreground: 222.2 47.4% 11.2%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 222.2 84% 4.9%;
  --radius: 0.5rem;
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --card: 222.2 84% 4.9%;
  --card-foreground: 210 40% 98%;
  --popover: 222.2 84% 4.9%;
  --popover-foreground: 210 40% 98%;
  --primary: 210 40% 98%;
  --primary-foreground: 222.2 47.4% 11.2%;
  --secondary: 217.2 32.6% 17.5%;
  --secondary-foreground: 210 40% 98%;
  --muted: 217.2 32.6% 17.5%;
  --muted-foreground: 215 20.2% 65.1%;
  --accent: 217.2 32.6% 17.5%;
  --accent-foreground: 210 40% 98%;
  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 210 40% 98%;
  --border: 217.2 32.6% 17.5%;
  --input: 217.2 32.6% 17.5%;
  --ring: 212.7 26.8% 83.9%;
}
```

**If using `cssVariables: false`**: Update `tailwind.config.js` with color values directly.

---

## Issue #4: Wrong Style Selected

**Error**: Components look different than expected

**Source**: Chose wrong style during init

**Why It Happens**: `style` cannot be changed after initialization

**Prevention**:
- Choose carefully during `init` (New York or Default)
- Preview both styles at https://shadcn-vue.com
- To change: reinitialize in new directory

**Styles**:
- **New York**: Sleek, modern design with sharper edges
- **Default**: Rounded, softer design

**CRITICAL**: Once chosen, style cannot be changed without complete reinstall.

---

## Issue #5: Mixing Radix Vue and Reka UI

**Error**: Type conflicts, duplicate components, bundle bloat

**Source**: Installing both `radix-vue` and Reka UI packages

**Why It Happens**: Old projects upgrading without clean migration

**Prevention**:
- Use `bunx shadcn-vue@latest` for Reka UI v2 (current)
- Use `bunx shadcn-vue@radix` for legacy Radix Vue
- Don't mix both in same project

**Migration Path**:
```bash
# Remove Radix Vue
bun remove radix-vue

# Reinstall components with Reka UI
bunx shadcn-vue@latest add button
```

---

## Issue #6: Monorepo Path Issues

**Error**: Components installed in wrong directory

**Source**: CLI doesn't know which workspace to use

**Why It Happens**: Not specifying `-c` flag in monorepo

**Prevention**:
```bash
# Initialize in specific workspace
bunx shadcn-vue@latest init -c ./apps/web

# Add components to specific workspace
bunx shadcn-vue@latest add button -c ./apps/web
```

**Monorepo Structure**:
```
monorepo/
├── apps/
│   ├── web/          # Specify with -c ./apps/web
│   │   ├── components.json
│   │   └── src/
│   └── mobile/
└── packages/
```

---

## Issue #7: Component Import Fails After Manual Edit

**Error**: Import paths broken after editing `components.json`

**Source**: Manual edits to alias paths

**Why It Happens**: Aliases don't match `tsconfig.json` or project structure

**Prevention**:
- Keep `components.json` and `tsconfig.json` in sync
- Use `init` command instead of manual edits
- Test component imports after any config changes

**Example Configuration Match**:
```json
// components.json
{
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**Validation**:
```typescript
// Test import after config changes
import { Button } from '@/components/ui/button'
```

---

## Summary

**Total Issues Documented**: 7
**Categories**:
- Configuration: 4 issues (#1, #2, #3, #7)
- Setup Decisions: 2 issues (#4, #5)
- Monorepo: 1 issue (#6)

**Prevention**: Always run `init` command and verify TypeScript + Tailwind configuration before adding components.
