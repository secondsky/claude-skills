# Swift Best Practices Templates

Complete, production-ready Swift code examples demonstrating modern Swift 6+ patterns and best practices.

## Templates

### async-await-migration.swift
**Complete migration guide from completion handlers to async/await**

Shows:
- Before/After comparison (Swift 5 vs Swift 6)
- Proper error handling with async/await
- Parallel execution with `async let`
- Task cancellation support
- Migration checklist

**Use when**: Migrating legacy code to modern async/await patterns

### actor-pattern.swift
**Actor isolation for thread-safe mutable state**

Shows:
- Correct vs incorrect concurrency patterns
- Actor methods and properties
- `nonisolated` functions
- Async operations within actors
- Batch processing with cancellation
- Common mistakes to avoid

**Use when**: Implementing thread-safe caches, resource managers, or background processors

### mainactor-viewmodel.swift
**@MainActor ViewModels for SwiftUI**

Shows:
- SwiftUI ViewModel with `@MainActor`
- Correct vs incorrect UI patterns
- Background processing with `nonisolated`
- Progress tracking
- Task cancellation
- View integration examples
- Common mistakes to avoid

**Use when**: Building SwiftUI apps with ObservableObject ViewModels

### api-design-example.swift
**Well-designed Swift APIs following official conventions**

Shows:
- Naming by role, not type
- Method naming by side effects
- Proper documentation
- Argument label patterns
- Mutating/non-mutating pairs
- Factory methods
- Availability annotations
- Error types

**Use when**: Designing public APIs or reviewing API design

## How to Use These Templates

### 1. As Learning Resources
Read through the templates to understand Swift 6+ patterns and anti-patterns. Each template includes:
- ❌ Wrong patterns with explanations
- ✅ Correct patterns following Swift conventions
- Detailed comments explaining decisions
- Checklists and principles

### 2. As Code References
Copy relevant patterns into your projects:

```bash
# View a template
cat templates/actor-pattern.swift

# Copy pattern to your project
cp templates/actor-pattern.swift ~/MyProject/Examples/
```

### 3. With Claude Code
Ask Claude to use these templates:

```
"Show me the actor pattern from swift-best-practices templates"
"Use the async-await migration template to refactor this code"
"Design this API following the api-design-example template"
```

### 4. As Code Review Guides
Use templates as reference during code reviews:
- Compare submitted code against template patterns
- Identify anti-patterns marked with ❌
- Suggest corrections using ✅ patterns

## Template Structure

Each template follows this structure:

```swift
// Title and description

// ❌ WRONG: Anti-pattern with explanation
// Code showing what NOT to do

// ✅ CORRECT: Proper pattern with explanation
// Code showing the right way

// ✅ ADVANCED: More complex scenarios
// Real-world usage examples

// KEY PRINCIPLES: Summary of rules
// COMMON MISTAKES: What to avoid
// WHEN TO USE: Appropriate use cases
```

## Swift Version Requirements

All templates target:
- **Swift 6.0+** for core features
- **Swift 6.2+** for InlineArray examples
- **macOS 15.7+** / **iOS 18+** for latest platform features

Legacy Swift 5 patterns are shown only for "Before/After" comparisons.

## Related Resources

**Skill References**:
- [`references/concurrency.md`](../references/concurrency.md) - Detailed concurrency patterns
- [`references/swift6-features.md`](../references/swift6-features.md) - Swift 6 features and migration
- [`references/api-design.md`](../references/api-design.md) - Complete API design conventions
- [`references/availability-patterns.md`](../references/availability-patterns.md) - @available patterns

**SwiftLens MCP**:
- [`references/swiftlens-mcp-claude-code.md`](../references/swiftlens-mcp-claude-code.md) - Semantic analysis tools

## Contributing Improvements

Found a better pattern? Have a suggestion? These templates are meant to evolve:

1. Test your improvement in a real project
2. Ensure it follows Swift 6+ best practices
3. Add clear ❌/✅ comparisons
4. Include comments explaining the "why"
5. Submit a pull request

## License

MIT License - See [LICENSE](../../../LICENSE)

Templates demonstrate patterns from:
- Swift.org API Design Guidelines
- Swift Evolution proposals
- Apple WWDC sessions
- Production Swift 6+ codebases
