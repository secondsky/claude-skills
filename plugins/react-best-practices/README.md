# React Best Practices

**Status**: ✅ Production Ready
**Version**: 1.0.0 (Vercel source)
**Last Updated**: 2026-01-17

Comprehensive React and Next.js performance optimization guide from Vercel Engineering, containing 45+ rules across 8 categories.

## What This Skill Provides

✅ **Eliminating Waterfalls** (CRITICAL) - 5 rules for async optimization
✅ **Bundle Size Optimization** (CRITICAL) - 5 rules for reducing bundle size
✅ **Server-Side Performance** (HIGH) - 5 rules for SSR optimization
✅ **Client-Side Data Fetching** (MEDIUM-HIGH) - 4 rules for client optimization
✅ **Re-render Optimization** (MEDIUM) - 7 rules for preventing unnecessary renders
✅ **Rendering Performance** (MEDIUM) - 7 rules for efficient rendering
✅ **JavaScript Performance** (LOW-MEDIUM) - 12 rules for JS optimization
✅ **Advanced Patterns** (LOW) - 2 rules for advanced techniques

**Total**: 45+ production-tested rules with incorrect vs correct examples

## When to Use This Skill

Use this skill when:
- Writing new React components or Next.js pages
- Reviewing code for performance issues
- Refactoring existing React/Next.js applications
- Optimizing bundle size or load times
- Debugging hydration errors, re-render issues, or memory leaks
- Implementing async patterns, server components, or streaming

## Structure

- **SKILL.md** - Concise overview with rule categories (~1,500 words)
- **AGENTS.md** - Full compiled guide with all rules expanded (~40,000 words)
- **rules/** - 45+ individual rule files for granular reference
- **metadata.json** - Version and attribution metadata

## Attribution

This skill packages **Vercel's React Best Practices guide** for Claude Code.

**Original Author**: [@shuding](https://github.com/shuding) (Vercel Engineering)
**Source**: https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices
**Packaging**: Claude Skills Maintainers
**License**: MIT

We are grateful to Vercel for creating and open-sourcing this comprehensive guide.

## Installation

```bash
# Install this plugin
/plugin install react-best-practices@claude-skills

# Or install manually
./scripts/install-skill.sh react-best-practices
```

## Usage Examples

### Example 1: Optimize Re-renders

**Ask**: "How can I prevent unnecessary re-renders in my React component?"

**Claude will**:
- Reference SKILL.md re-render optimization section
- Suggest memo, useMemo, useCallback patterns
- Provide code examples from rules/

### Example 2: Reduce Bundle Size

**Ask**: "My React bundle is too large, help me reduce it"

**Claude will**:
- Reference bundle optimization rules
- Suggest dynamic imports, tree-shaking, direct imports
- Show examples from rules/bundle-*.md

### Example 3: Fix Hydration Errors

**Ask**: "I'm getting hydration mismatches in Next.js"

**Claude will**:
- Reference hydration and server component patterns
- Explain common causes and solutions
- Point to specific rules/rendering-hydration-no-flicker.md

## Progressive Disclosure

**SKILL.md** (auto-loaded): Quick reference, rule categories, top errors
**AGENTS.md** (on request): Full guide with all 45+ rules expanded
**rules/** (on request): Individual rule files for specific topics

Ask Claude to "Load AGENTS.md" for the comprehensive guide.

## Related Skills

- `nextjs` - Next.js framework patterns
- `tanstack-query` - Data fetching optimization
- `react-hook-form-zod` - Form validation patterns
- `zustand-state-management` - State management
- `tailwind-v4-shadcn` - UI component styling

## Support

- **Documentation**: See SKILL.md and AGENTS.md in skills/react-best-practices/
- **Issues**: https://github.com/secondsky/claude-skills/issues
- **Original Source**: https://github.com/vercel-labs/agent-skills
