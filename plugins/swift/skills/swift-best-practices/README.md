# Swift Best Practices Skill

Modern Swift 6+ development best practices focusing on concurrency safety, API design principles, and code quality guidelines for iOS and macOS projects targeting macOS 15.7+.

## Quick Start

```bash
# Install skill
./scripts/install-skill.sh swift-best-practices

# Use with Claude Code
# Ask: "Review this Swift code for Swift 6 concurrency safety"
# Ask: "Help me migrate this class to use async/await"
# Ask: "Design an API following Swift naming conventions"
```

## Auto-Trigger Keywords

This skill automatically activates when you mention:

**Swift Language**: Swift, Swift 6, Swift 6.2, async, await, actor, MainActor, Sendable, throws, async let, Task

**Concurrency**: concurrency, isolation, data race, region-based isolation, actor isolation, @MainActor, nonisolated, Sendable conformance

**Frameworks**: SwiftUI, UIKit, Combine, Foundation

**API Design**: API design, naming conventions, documentation, @available, deprecated, obsoleted

**Code Quality**: Swift best practices, code review, refactoring, type safety, error handling

**Platforms**: iOS, macOS, iOS 18, macOS 15, Xcode

## SwiftLens MCP Companion

This skill complements **SwiftLens MCP server** for comprehensive Swift development:

**SwiftLens Provides** (semantic analysis):
- 15 tools for Swift code analysis using Apple's SourceKit-LSP
- Symbol lookup, cross-file references, type information
- Safe code modification and refactoring
- Compiler-grade understanding of Swift code structure

**This Skill Provides** (design expertise):
- Swift 6+ design patterns and best practices
- Concurrency strategies (async/await, actors, MainActor)
- API design guidelines and naming conventions
- Migration guidance (Swift 5 → Swift 6)

### Setup SwiftLens for Claude Code

Create `.claude/mcps/swiftlens.json` in your Swift project:

```json
{
  "mcpServers": {
    "swiftlens": {
      "description": "SwiftLens MCP provides semantic Swift analysis via SourceKit-LSP",
      "command": "uvx",
      "args": ["swiftlens"]
    }
  }
}
```

**Installation**: `uvx swiftlens`

**📖 Complete Setup Guide**: See [references/swiftlens-mcp-claude-code.md](references/swiftlens-mcp-claude-code.md) for:
- All 15 SwiftLens tools
- Index building instructions
- Usage examples
- Troubleshooting guide
- Claude Code vs Claude Desktop configuration differences

**Workflow**: SwiftLens provides **runtime analysis** (what the code is doing), this skill provides **design expertise** (what the code should be doing).

## What This Skill Covers

### Core Swift 6+ Features
- Complete concurrency model (SE-0414 region-based isolation)
- Typed throws (SE-0413)
- Actor isolation and MainActor patterns
- Sendable conformance strategies
- InlineArray for fixed-size data (Swift 6.2+)
- Noncopyable types (~Copyable)
- Enhanced async/await patterns

### API Design & Documentation
- Swift naming conventions (role-based, not type-based)
- Method naming by side effects
- Argument label best practices
- Documentation standards
- Deprecation strategies

### Platform Availability
- @available attribute patterns
- Deprecation vs obsoleted vs unavailable
- Swift version checking (#available, #unavailable)
- Migration strategies

### Common Pitfalls
- Async/await misconceptions
- Actor isolation mistakes
- Concurrency safety violations
- Over-engineering vs simplicity
- Performance considerations

## Directory Structure

```
swift-best-practices/
├── SKILL.md                              # Main skill documentation
├── README.md                             # This file
├── references/                           # Detailed reference material
│   ├── swiftlens-mcp-claude-code.md     # SwiftLens MCP setup (Claude Code)
│   ├── concurrency.md                    # Async/await, actors, patterns
│   ├── swift6-features.md                # Swift 6/6.2 features & migration
│   ├── api-design.md                     # API design conventions
│   └── availability-patterns.md          # @available patterns
└── scripts/                              # (Future) Setup/migration scripts
```

## Reference Files

### references/swiftlens-mcp-claude-code.md
**Complete SwiftLens MCP integration guide for Claude Code CLI**

Topics covered:
- Installation (`uvx swiftlens`)
- Claude Code configuration (`.claude/mcps/*.json`)
- All 15 SwiftLens tools categorized
- Index building instructions
- Usage examples (code-first approach)
- Known limitations (44% hover success rate)
- Troubleshooting guide
- Claude Code vs Claude Desktop differences

### references/concurrency.md
**Swift 6+ concurrency patterns and best practices**

Topics covered:
- Async/await fundamentals
- Actor isolation strategies
- MainActor for UI code
- Sendable conformance
- Task cancellation handling
- Common concurrency pitfalls
- Performance considerations
- Thread safety patterns

### references/swift6-features.md
**New features in Swift 6 and 6.2, breaking changes, migration strategies**

Topics covered:
- Complete concurrency enabled by default (SE-0414)
- Typed throws (SE-0413)
- InlineArray for fixed-size arrays (Swift 6.2)
- Noncopyable type improvements
- Actor inference removal (SE-0401)
- Global variable safety (SE-0412)
- Migration from Swift 5 to Swift 6
- Breaking changes and solutions

### references/availability-patterns.md
**@available attribute usage, deprecation strategies, platform version management**

Topics covered:
- @available attribute syntax
- Deprecation best practices
- Obsoleted vs unavailable
- Swift version checks (#available, #unavailable)
- Platform-specific availability
- API migration patterns
- Renamed attribute for refactoring

### references/api-design.md
**Complete Swift API design conventions and documentation standards**

Topics covered:
- Naming conventions (types, methods, protocols)
- Method naming by side effects
- Argument label guidelines
- Documentation requirements
- Parameter naming
- Code organization best practices
- Terminology and clarity principles

## Usage Examples

### Example 1: Review Swift Code for Swift 6 Concurrency
```
Ask Claude: "Review this Swift code for Swift 6 concurrency safety"

Claude will:
1. Use this skill's concurrency patterns
2. Check for proper actor isolation
3. Verify Sendable conformance where needed
4. Suggest MainActor placement for UI code
5. Identify data race risks
```

### Example 2: Migrate to Async/Await
```
Ask Claude: "Help me migrate this class to use async/await"

Claude will:
1. Apply async/await patterns from references/concurrency.md
2. Suggest actor vs @MainActor based on use case
3. Add proper cancellation handling
4. Update all call sites with await
5. Use SwiftLens to find all references (if MCP configured)
```

### Example 3: Design Swift API
```
Ask Claude: "Design an API for user authentication following Swift conventions"

Claude will:
1. Apply naming conventions from references/api-design.md
2. Use role-based naming (not type-based)
3. Follow method naming by side effects
4. Add proper argument labels
5. Write documentation summaries
6. Add @available annotations for platform support
```

### Example 4: Swift 6 Migration
```
Ask Claude: "What changes are needed to migrate this Swift 5 code to Swift 6?"

Claude will:
1. Check references/swift6-features.md for breaking changes
2. Identify required @MainActor annotations
3. Fix global variable safety issues
4. Update deprecated patterns
5. Suggest typed throws where appropriate
```

## When to Use This Skill

Use this skill when:
- Writing new Swift code for iOS or macOS applications
- Reviewing Swift code for correctness, safety, and style
- Implementing Swift concurrency features (async/await, actors, MainActor)
- Designing Swift APIs and public interfaces
- Migrating code from Swift 5 to Swift 6
- Addressing concurrency warnings, data race issues, or compiler errors related to Sendable/isolation
- Working with modern Swift language features introduced in Swift 6 and 6.2
- Setting up SwiftLens MCP for semantic code analysis

## Platform Requirements

- **Swift 6.0+** compiler for Swift 6 features
- **Swift 6.2+** for InlineArray and enhanced concurrency features
- **macOS 15.7+** with appropriate SDK
- **iOS 18+** for latest platform features
- **Xcode** installed (provides SourceKit-LSP for SwiftLens)

## Attribution

Reference files (`references/concurrency.md`, `references/swift6-features.md`, `references/availability-patterns.md`, `references/api-design.md`) adapted from:
- **Source**: https://github.com/sammcj/agentic-coding
- **Author**: Sam McLeod (sammcj)
- **License**: Apache 2.0
- **Adapted**: 2025-11-10
- **Changes**: Added attribution headers, organized for Claude Code skill format

SwiftLens MCP integration guide (`references/swiftlens-mcp-claude-code.md`) is original documentation created for this skill.

## Installation

```bash
# From claude-skills repository root
./scripts/install-skill.sh swift-best-practices

# Verify installation
ls -la ~/.claude/skills/swift-best-practices

# Optional: Install SwiftLens MCP
uvx swiftlens --version
```

## License

MIT License - See [LICENSE](../../LICENSE) for details

Reference files used under Apache 2.0 license (compatible with MIT).
