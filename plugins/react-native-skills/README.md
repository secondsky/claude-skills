# React Native Skills Plugin

**Version:** 1.0.0
**Status:** Production Ready
**Source:** Based on Vercel Engineering's agent-skills repository
**License:** MIT

## Overview

Production-tested React Native and Expo best practices for building performant mobile applications. This plugin provides comprehensive guidelines for optimizing list performance, implementing animations, structuring state management, and working with native platform APIs.

## What's Inside

**35+ Performance Rules** across 14 categories:

| Category | Rules | Impact | Focus Area |
|----------|-------|--------|------------|
| **List Performance** | 8 rules | CRITICAL | FlashList, virtualization, memoization |
| **Animation** | 3 rules | HIGH | Reanimated, GPU properties, gestures |
| **Navigation** | 1 rule | HIGH | Native navigators vs JS navigators |
| **UI Patterns** | 9 rules | HIGH | expo-image, Pressable, safe areas, styling |
| **State Management** | 3 rules | MEDIUM | Minimize state, dispatcher pattern, fallbacks |
| **React Compiler** | 2 rules | MEDIUM | Shared values, function destructuring |
| **Rendering** | 2 rules | MEDIUM | Text components, conditional rendering |
| **State Architecture** | 1 rule | MEDIUM | Ground truth patterns |
| **Design System** | 1 rule | MEDIUM | Compound components |
| **Monorepo** | 2 rules | LOW | Native deps, dependency versions |
| **Third-Party Deps** | 1 rule | LOW | Design system imports |
| **JavaScript** | 1 rule | LOW | Intl optimization |
| **Fonts** | 1 rule | LOW | Config plugins |

**Total:** 35 rules organized by impact priority (CRITICAL → LOW)

## When to Use This Skill

Claude automatically loads this skill when you're:

- Building React Native or Expo applications
- Optimizing list or scroll performance
- Implementing animations with Reanimated
- Working with images and media components
- Configuring native modules or custom fonts
- Structuring monorepo projects with native dependencies
- Debugging performance issues in mobile apps
- Reviewing React Native code for best practices

## Installation

### Via Claude Code Marketplace

```bash
/plugin install react-native-skills@claude-skills
```

### Manual Installation

```bash
git clone https://github.com/secondsky/claude-skills.git
cd claude-skills
./scripts/install-skill.sh react-native-skills
```

## Usage Examples

### Optimizing List Performance

**User:** "How do I optimize this FlatList with 10,000 items?"

Claude automatically applies `list-performance-virtualize` rule and suggests switching to FlashList with proper memoization strategies.

### Implementing Smooth Animations

**User:** "Add a scale animation when user taps this button"

Claude applies `animation-gpu-properties` and `animation-gesture-detector-press` rules to use Reanimated with GPU-accelerated transforms.

### State Management Review

**User:** "Review this component's state management"

Claude applies `react-state-minimize` and `react-state-dispatcher` rules to identify unnecessary re-renders and optimize state updates.

## Structure

```
react-native-skills/
├── SKILL.md              # Quick reference (~136 lines)
├── AGENTS.md             # Full compiled guide (~2000 lines)
├── README.md             # Internal documentation
├── metadata.json         # Version, organization, abstract
└── rules/                # 38 individual rule files
    ├── _sections.md      # Section metadata
    ├── _template.md      # Template for new rules
    └── *.md              # Individual rules organized by prefix
```

### Progressive Disclosure

1. **SKILL.md**: Quick reference with rule summaries
2. **AGENTS.md**: Full guide with detailed examples
3. **rules/**: Individual files for targeted learning

## Rule Categories

### Critical Priority

**List Performance** (8 rules):
- Virtualization with FlashList
- Item memoization strategies
- Callback stabilization
- Inline object avoidance
- Image optimization in lists
- Expensive computation handling
- Heterogeneous list types

### High Priority

**Animation** (3 rules):
- GPU-accelerated properties (transform, opacity)
- useDerivedValue patterns
- GestureDetector for press animations

**Navigation** (1 rule):
- Native stack and tabs over JS navigators

**UI Patterns** (9 rules):
- expo-image for all images
- Galeria for lightboxes
- Pressable over TouchableOpacity
- Safe area handling
- Native modals and menus
- View measurement patterns
- Modern styling (gap, boxShadow, gradients)

### Medium Priority

**State Management** (3 rules):
- Minimize state subscriptions
- Dispatcher pattern for callbacks
- Fallback rendering strategies

**React Compiler** (2 rules):
- Function destructuring
- Shared value handling

**Rendering** (2 rules):
- Text component wrapping
- Conditional rendering patterns

### Low Priority

**Monorepo** (2 rules):
- Native dependency location
- Dependency version management

**Configuration** (3 rules):
- Custom fonts via config plugins
- Design system imports
- Intl optimization

## Key Technologies

- **React Native** - Core mobile framework
- **Expo** - Development platform
- **FlashList** - High-performance lists
- **Reanimated** - GPU-accelerated animations
- **React Navigation** - Native navigators
- **expo-image** - Optimized image component
- **Galeria** - Image lightbox
- **Zeego** - Native menus

## Attribution

This skill is based on the excellent work by Vercel Engineering in their [agent-skills repository](https://github.com/vercel-labs/agent-skills/tree/main/skills/react-native-skills). Content has been adapted for the Claude Code skills format while preserving the high-quality guidelines and examples.

**Original Author:** Vercel Engineering
**Adapted By:** Claude Skills Maintainers
**License:** MIT (matching original)

## Related Skills

- **react-best-practices** - Web-focused React patterns
- **tailwind-v4-shadcn** - UI component styling
- **tanstack-query** - Data fetching patterns
- **zustand-state-management** - State management library

## References

- [React Documentation](https://react.dev)
- [React Native Documentation](https://reactnative.dev)
- [Reanimated Docs](https://docs.swmansion.com/react-native-reanimated)
- [Gesture Handler Docs](https://docs.swmansion.com/react-native-gesture-handler)
- [Expo Documentation](https://docs.expo.dev)
- [Legend List](https://legendapp.com/open-source/legend-list)
- [Galeria](https://github.com/nandorojo/galeria)
- [Zeego](https://zeego.dev)

## Version History

### 1.0.0 (January 2026)
- Initial release
- 35+ rules across 14 categories
- Progressive disclosure structure
- Based on Vercel agent-skills v1.0.0

## Support

**Issues:** https://github.com/secondsky/claude-skills/issues
**Discussions:** https://github.com/secondsky/claude-skills/discussions
**Email:** maintainers@example.com

## Contributing

Contributions welcome! Please:
1. Follow the rule template in `rules/_template.md`
2. Use appropriate prefix for rule category
3. Include incorrect/correct examples
4. Add impact level and description
5. Submit PR with clear description

See [CONTRIBUTING.md](../../docs/guides/CONTRIBUTING.md) for full guidelines.
