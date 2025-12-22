<!--
Source: https://github.com/sammcj/agentic-coding
Author: Sam McLeod (sammcj)
License: Apache 2.0
Adapted: 2025-11-10
Changes: Added attribution header
-->

# Swift Availability Patterns Reference

Comprehensive guide to @available attribute usage, deprecation strategies, and platform version management.

## @available Attribute Syntax

### Basic Shorthand Specification
```swift
@available(platform version, platform version..., *)
```

**Example:**
```swift
@available(macOS 10.15, iOS 13, *)
final class NewAppIntroduction {
    // Available on all listed platforms from specified versions onwards
}
```

### Extended Specification with Lifecycle States
```swift
// With introduced, deprecated, and/or obsoleted
@available(platform | *,
          introduced: version, deprecated: version, obsoleted: version,
          renamed: "...",
          message: "...")

// With unavailable
@available(platform | *, unavailable, renamed: "...", message: "...")
```

**Example with deprecation:**
```swift
@available(iOS, deprecated: 12, obsoleted: 13, message: "We no longer show an app introduction on iOS 14 and up")
func launchAppIntroduction() {
    // Old implementation
}
```

### Platform Options
- `iOS`, `iOSApplicationExtension`
- `macOS` / `OSX`, `macOSApplicationExtension`
- `macCatalyst`, `macCatalystApplicationExtension`
- `swift` (for Swift language version checks)

### Swift Language Version Availability
```swift
@available(swift 5.1)
struct PropertyWrapperExample {
    // Only available when compiled with Swift 5.1+
}
```

**Real-world example:**
```swift
@available(swift, deprecated: 5.0, renamed: "firstIndex(of:)")
public func index(of element: Element) -> Int?
```

## Deprecation Best Practices

### Basic Deprecation
```swift
@available(*, deprecated)
func oldMethod() {
    // This generates a warning for all platforms
}
```

**Warning appears in:**
- Code completion
- Inline warnings

### Deprecation with Version Number
```swift
@available(iOS, deprecated: 15.0)
func oldMethod() {
    // Deprecated from iOS 15.0 onwards
}
```

**Critical understanding:** Version numbering is read as:
- "This method is deprecated in versions **higher than** X"
- NOT "deprecated **on** version X"

### Deprecation with Message
```swift
@available(*, deprecated, message: "Due to a security reason, this method is no longer supported")
func addAdmin() {
    // Provides context to developers
}
```

**Apple's example:**
```swift
@available(iOS, introduced: 7.0, deprecated: 100000.0, message: "use NavigationStack or NavigationSplitView instead")
public struct NavigationView<Content>: View where Content : View {
}
```

### Multiple Platform Deprecation
When deprecating for multiple platforms, stack attributes:
```swift
@available(macOS, introduced: 10.15)
@available(iOS, introduced: 13)
```

## Platform-Specific Availability Patterns

### Applying to Different Declaration Types
Can be applied to:
- Top-level functions, constants, variables
- Types: structures, classes, enumerations, protocols
- Type members: initialisers, deinitialisers, methods, properties, subscripts

### Example with Class
```swift
@available(iOS 14, *)
final class NewAppIntroduction {
    // Available only on iOS 14+
}
```

### Example with Method
```swift
@available(iOS 14, *)
func launchNewAppIntroduction() {
    let appIntroduction = NewAppIntroduction()
}
```

### Multiple Platform Specification
```swift
@available(iOS 15, macOS 12.0, *)
func launchNewAppIntroduction() {
    // Available on iOS 15+ and macOS 12.0+
}
```

## Obsoleted API Handling

### Key Difference: Deprecated vs Obsoleted
- **Deprecated:** Generates a **warning**, users can still use the API
- **Obsoleted:** Generates an **error**, API cannot be used

### Obsoleted Syntax
```swift
@available(iOS, obsoleted: 15, message: "Due to a security reason, this method is no longer supported")
func addAdmin() {
    // This will cause a compiler error on iOS 15+
}
```

### Combined Deprecated and Obsoleted
```swift
@available(iOS, deprecated: 12, obsoleted: 13, message: "No longer functional")
func legacyMethod() {
    // Warning from iOS 12, error from iOS 13
}
```

### When to Use Each
- Use **deprecated** for:
  - Minor issues (performance)
  - Introducing better alternatives
  - Gradual migration paths
- Use **obsoleted** for:
  - Broken functionality
  - Security issues
  - APIs that will cause runtime failures

## Swift Version Checks with #available

### Basic Syntax
```swift
#available(platform version, platform version..., *)
```

### If Statement Usage
```swift
if #available(iOS 15, *) {
    print("This code only runs on iOS 15 and up")
} else {
    print("This code only runs on iOS 14 and lower")
}
```

### Guard Statement Usage
```swift
guard #available(iOS 15, *) else {
    print("Returning if iOS 14 or lower")
    return
}
print("This code only runs on iOS 15 and up")
```

### While Statement Usage
```swift
while #available(iOS 15, *) {
    // Conditional looping based on availability
}
```

### Real-World Pattern
```swift
@available(iOS 13.0, *)
final class CustomCompositionalLayout: UICollectionViewCompositionalLayout { … }

func createLayout() -> UICollectionViewLayout {
    if #available(iOS 13, *) {
        return CustomCompositionalLayout()
    } else {
        return UICollectionViewFlowLayout()
    }
}
```

### #unavailable (Swift 5.6+)
Inverted availability check for cleaner code:

```swift
// Modern approach (Swift 5.6+)
if #unavailable(iOS 15, *) {
    // Run iOS 14 and lower code
}

// Old approach (pre-Swift 5.6)
if #available(iOS 15, *) { } else {
    // Run iOS 14 and lower code
}
```

### Multiple Platforms with #unavailable
```swift
if #unavailable(iOS 15) {
    // Run on iOS 14 and lower
}
```

## API Migration Patterns

### Renamed Attribute
```swift
@available(*, unavailable, renamed: "launchOnboarding")
func launchAppIntroduction() {
    // Old implementation
}

func launchOnboarding() {
    // New implementation
}
```

**Xcode provides automatic "Fix-it" button** to rename calls.

**Apple's renaming example:**
```swift
@available(swift, deprecated: 5.0, renamed: "firstIndex(of:)")
public func index(of element: Element) -> Int?
```

### Best Practice for Renaming
1. Mark as `unavailable` (not just deprecated)
2. Provide `renamed` parameter with new API name
3. Xcode will offer automated migration

### Gradual Migration Strategy
```swift
// Step 1: Deprecate old API
@available(*, deprecated, renamed: "newMethod", message: "Use newMethod() instead")
func oldMethod() { }

// Step 2: Later, make unavailable
@available(*, unavailable, renamed: "newMethod")
func oldMethod() { }
```

## Common Patterns for Marking Unavailable APIs

### Complete Unavailability
```swift
@available(*, unavailable)
func thisWillNeverWork() {
    // Compiler error on all platforms
}
```

### Platform-Specific Unavailability
```swift
@available(iOS, unavailable)
func macOSOnlyFeature() {
    // Available everywhere except iOS
}
```

### Unavailable with Replacement
```swift
@available(*, unavailable, renamed: "betterMethod", message: "This API had security vulnerabilities")
func oldMethod() { }
```

### Working Around Deprecation Warnings
When you need to temporarily suppress deprecation warnings:

```swift
class CustomView {
    @available(iOS, introduced: 10, deprecated: 13, message: "Old method")
    func method() {}
}

// Normal call generates warning
CustomView().method() // Warning: 'method()' was deprecated in iOS 13

// Workaround using protocol conformance
protocol IgnoringMethodDeprecation {
    func method()
}

extension CustomView: IgnoringMethodDeprecation {}

(CustomView() as IgnoringMethodDeprecation).method() // No warning!
```

## Annotation Best Practices

1. **Always include asterisk** in platform specifications
2. **Provide meaningful messages** explaining why deprecated
3. **Use `renamed` for refactoring** to enable automatic migration
4. **Stack attributes** for multi-platform deprecation
5. **Favour `obsoleted` over `unavailable`** for version-specific removal
6. **Document migration paths** in deprecation messages

## Version Number Format
Version numbers consist of 1-3 positive integers:
- `major.minor.patch` (e.g., `15.0.1`)
- Separated by period (`.`)
- Follow semantic versioning principles

## Modern Swift 6+ and macOS 15+ Patterns
```swift
@available(macOS 15, iOS 18, *)
func modernAPI() {
    // Latest platform versions
}

@available(swift 6.0)
func swiftSixFeature() {
    // Swift 6.0 language features
}
```

## Key Differences Summary

### @available vs #available

| Aspect | @available | #available |
|--------|-----------|-----------|
| Usage | Annotate declarations | Runtime condition checks |
| Location | On types, methods, properties | In if/guard/while statements |
| Purpose | Mark API availability | Conditionally execute code |
| Swift version | Can check | Cannot check |

### Lifecycle States

| State | Effect | Use Case |
|-------|--------|----------|
| `deprecated` | Warning | Discourage use, allow time for migration |
| `obsoleted` | Error | Prevent use after specific version |
| `unavailable` | Error | Completely prevent use |
| `renamed` | Auto-fix | Provide migration path |
