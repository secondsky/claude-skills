# Inspira UI Skill

**Version**: 2.0+
**Last Updated**: 2025-11-12
**Status**: ✅ Production-Ready
**License**: MIT

## Overview

This skill enables Claude Code to expertly implement Inspira UI components in Vue 3 and Nuxt 4 applications. Inspira UI is a collection of 120+ beautifully animated, copy-paste components powered by TailwindCSS v4, motion-v, GSAP, and Three.js.

## What is Inspira UI?

Inspira UI is **not a traditional npm component library**. It's a curated collection of production-ready, animated Vue/Nuxt components that you copy directly into your project and customize. Think of it as a copy-paste component gallery with beautiful animations and modern effects.

## Skill Structure

This skill uses **progressive disclosure** for optimal token efficiency:

```
inspira-ui/
├── SKILL.md                          # Main skill document (~300 lines)
├── README.md                         # This file - skill overview
├── scripts/
│   ├── setup-inspira.sh              # Interactive setup wizard
│   └── verify-setup.sh               # Setup verification with feedback
└── references/
    ├── SETUP.md                      # Complete setup guide with CSS
    ├── TROUBLESHOOTING.md            # 13+ common issues & solutions
    ├── CODE_PATTERNS.md              # TypeScript & Vue 3 conventions
    └── components-list.md            # 120+ components with dependencies
```

**Why this structure?** SKILL.md contains essentials only (~300 lines vs. original 797). Detailed content lives in reference files, loaded on-demand. This reduces initial context usage by **65%**.

## When This Skill Triggers

This skill automatically activates when you mention:

### Frameworks & Tools
- Vue 3, Nuxt 4, Vue.js animations
- TailwindCSS v4 animated components
- motion-v animations, Three.js Vue components
- WebGL Vue components, animated UI library

### Component Types
- Animated backgrounds (aurora, cosmic portal, particles, neural, vortex)
- Animated buttons (shimmer, ripple, rainbow, gradient)
- 3D cards (flip, spotlight, direction-aware, glare)
- Text animations (morphing, glitch, hyper text, blur reveal, sparkles)
- Special effects (confetti, meteors, glow border, neon border)
- Custom cursors (fluid, tailed, smooth, image trail)
- 3D visualizations (globe, carousel, icon cloud, world map)
- Animated forms (color picker, file upload, halo search)

### Use Cases
- Animated landing pages, hero sections with effects
- Interactive backgrounds, particle systems
- Modern web applications, 3D websites
- Marketing sites, portfolio sites
- Animated dashboards, data visualizations
- Forms with animated effects

## Quick Start

### 1. Install Dependencies

```bash
# Core dependencies (required)
bun add -d clsx tailwind-merge class-variance-authority tw-animate-css
bun add @vueuse/core motion-v

# For 3D components (optional)
bun add three @types/three

# For WebGL components (optional)
bun add ogl
```

### 2. Setup CN Utility

Create `lib/utils.ts`:

```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### 3. Configure CSS Variables

See [references/SETUP.md](references/SETUP.md) for complete CSS configuration with OkLch colors and the critical accessibility bug fix.

### 4. Verify Setup

```bash
./scripts/verify-setup.sh
```

### 5. Browse & Copy Components

Visit [inspira-ui.com/components](https://inspira-ui.com/components), copy what you need, paste into `components/ui/`.

## Key Features

- ✅ **120+ Components** - Comprehensive animated UI collection
- ✅ **Copy-Paste Model** - No npm dependency, copy what you need
- ✅ **TailwindCSS v4** - Modern utility-first CSS with OkLch colors
- ✅ **Motion-V** - Declarative animations for Vue
- ✅ **Three.js & OGL** - 3D and WebGL effects
- ✅ **Full TypeScript** - Complete type safety
- ✅ **Composition API** - Modern Vue 3 patterns
- ✅ **Dark Mode** - Built-in support with CSS variables
- ✅ **Production-Ready** - Battle-tested components

## Token Efficiency

**Average Token Savings**: ~65%
- Without skill: ~15k tokens (trial-and-error with setup)
- With skill: ~5k tokens (direct implementation)

**SKILL.md Optimization**: Reduced from 797 lines to ~300 lines (62% reduction) by using progressive disclosure with reference files.

## Errors Prevented

This skill prevents **13+ common mistakes**:

1. ❌ **CRITICAL**: `--destructive-foreground` same as `--destructive` (invisible text)
2. ❌ Missing `@import "tw-animate-css"` in CSS
3. ❌ Incorrect OkLch color syntax in CSS variables
4. ❌ Motion-V not configured for Vue/Nuxt
5. ❌ Missing `cn()` utility causing class conflicts
6. ❌ Props typed with object syntax instead of interfaces
7. ❌ Three.js components without `<ClientOnly>` in Nuxt
8. ❌ Missing explicit imports breaking Vue.js compatibility
9. ❌ WebGL components failing without proper dependencies
10. ❌ Dark mode CSS variables not defined
11. ❌ `@theme inline` block missing or misconfigured
12. ❌ Using TypeScript enums instead of `as const`
13. ❌ No cleanup for WebGL/Canvas resources (memory leaks)

## Detailed Documentation

| Document | Description |
|----------|-------------|
| [SKILL.md](SKILL.md) | Main skill - quick start, core patterns, critical pitfalls |
| [references/SETUP.md](references/SETUP.md) | Complete setup with all CSS variables |
| [references/TROUBLESHOOTING.md](references/TROUBLESHOOTING.md) | All 13+ issues with detailed solutions |
| [references/CODE_PATTERNS.md](references/CODE_PATTERNS.md) | TypeScript patterns, Vue 3 conventions |
| [references/components-list.md](references/components-list.md) | All 120+ components with dependency matrix |

## Technical Requirements

- **Vue**: 3.0+
- **Nuxt**: 4.0+ (optional)
- **TailwindCSS**: 4.0 (required - v3 uses Inspira UI v1)
- **Node.js**: 18+
- **TypeScript**: Recommended
- **Bun/npm/pnpm**: Any package manager (Bun preferred)

## Resources

- **Official Docs**: https://inspira-ui.com/docs
- **LLM-Optimized Docs**: https://inspira-ui.com/docs/llms-full.txt (complete props, code examples)
- **Component Gallery**: https://inspira-ui.com/components
- **Blocks Gallery**: https://inspira-ui.com/blocks
- **GitHub**: https://github.com/unovue/inspira-ui
- **Discord**: https://discord.gg/Xbh5DwJRc9

## Related Skills

This skill works well with:
- `tailwind-v4-shadcn` - For additional UI components
- `nuxt-v4` - For Nuxt 4 setup patterns
- `typescript-mcp` - For type safety
- `motion` - For advanced animation patterns

## Credits

- **Inspira UI**: Created by [Rahul Vashishtha](https://rahulv.dev) and the Vue community
- **Inspired by**: Aceternity UI and Magic UI
- **Skill Author**: Claude Skills Maintainers
- **Repository**: https://github.com/secondsky/claude-skills

## License

This skill: MIT License
Inspira UI: MIT License (free and open source)

---

**Version**: 2.0+ | **Last Verified**: 2025-11-12 | **Status**: ✅ Production-Ready
