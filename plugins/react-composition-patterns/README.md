# React Composition Patterns

**Status**: ✅ Production Ready
**Version**: 1.0.0 (Vercel source)
**Last Updated**: 2026-01-28

Comprehensive React composition patterns guide from Vercel Engineering, containing 7 rules across 3 categories focused on building scalable, maintainable components through composition.

## What This Skill Provides

✅ **Component Architecture** (CRITICAL) - 2 rules for structural design
✅ **State Management** (HIGH) - 3 rules for provider patterns and state lifting
✅ **Implementation Patterns** (MEDIUM) - 2 rules for composition strategies

**Total**: 7 production-tested rules with incorrect vs correct examples

## When to Use This Skill

Use this skill when:
- Building component libraries or design systems
- Refactoring components with excessive boolean props
- Implementing compound components with shared context
- Designing flexible, composable component APIs
- Managing component state with provider patterns
- Creating explicit component variants instead of prop-driven customization

## Core Principles

1. **Composition over configuration** — Let consumers compose instead of adding props
2. **Lift your state** — State in providers, not trapped in components
3. **Compose your internals** — Subcomponents access context, not props
4. **Explicit variants** — Create ThreadComposer, EditComposer, not Composer with isThread

## Structure

- **SKILL.md** - Concise overview with rule categories (~1,500 words)
- **AGENTS.md** - Full compiled guide with all rules expanded (~8,000 words)
- **rules/** - 7 individual rule files for granular reference
- **metadata.json** - Version and attribution metadata

## Attribution

This skill packages **Vercel's React Composition Patterns guide** for Claude Code.

**Original Author**: [@nandorojo](https://github.com/nandorojo) (Vercel Engineering)
**Source**: https://github.com/vercel-labs/agent-skills/tree/main/skills/composition-patterns
**Packaging**: Claude Skills Maintainers
**License**: MIT

We are grateful to Vercel for creating and open-sourcing this comprehensive guide.

## Installation

```bash
# Install this plugin
/plugin install react-composition-patterns@claude-skills

# Or install manually
./scripts/install-skill.sh react-composition-patterns
```

## Usage Examples

### Example 1: Avoid Boolean Props

**Ask**: "How can I refactor this component that has too many boolean props?"

**Claude will**:
- Reference SKILL.md architecture section
- Suggest compound component patterns
- Provide code examples from rules/architecture-avoid-boolean-props.md

### Example 2: Implement Provider Pattern

**Ask**: "How should I structure state management in my component library?"

**Claude will**:
- Reference state management rules
- Show provider pattern with context
- Point to rules/state-lift-state.md and rules/state-context-interface.md

### Example 3: Create Component Variants

**Ask**: "Should I add an isEditing prop or create separate components?"

**Claude will**:
- Reference explicit variants pattern
- Explain composition over configuration
- Show examples from rules/patterns-explicit-variants.md

## Progressive Disclosure

**SKILL.md** (auto-loaded): Quick reference, rule categories, core principles
**AGENTS.md** (on request): Full guide with all 7 rules expanded
**rules/** (on request): Individual rule files for specific topics

Ask Claude to "Load AGENTS.md" for the comprehensive guide.

## Related Skills

- `react-best-practices` - Performance optimization patterns
- `nextjs` - Next.js framework patterns
- `zustand-state-management` - State management
- `react-hook-form-zod` - Form composition patterns
- `tailwind-v4-shadcn` - UI component styling

## Support

- **Documentation**: See SKILL.md and AGENTS.md in skills/react-composition-patterns/
- **Issues**: https://github.com/secondsky/claude-skills/issues
- **Original Source**: https://github.com/vercel-labs/agent-skills
