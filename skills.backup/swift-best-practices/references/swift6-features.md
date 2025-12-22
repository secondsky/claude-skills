<!--
Source: https://github.com/sammcj/agentic-coding
Author: Sam McLeod (sammcj)
License: Apache 2.0
Adapted: 2025-11-10
Changes: Added attribution header
-->

# Swift 6 and 6.2 Features Reference

New language features, breaking changes, migration strategies, and modern patterns for Swift 6+.

## Major New Features in Swift 6

### Complete Concurrency Enabled by Default
- **SE-0414**: Region-based isolation allows the compiler to prove code can run concurrently
- Eliminates many false-positive data-race warnings from Swift 5.10
- The compiler now analyses program flow to detect safe usage patterns automatically
- Example: Non-sendable objects no longer require `Sendable` conformance if the compiler can prove they're used safely

```swift
class User {
    var name = "Anonymous"
}

struct ContentView: View {
    var body: some View {
        Text("Hello, world!")
            .task {
                let user = User()
                await loadData(for: user)  // No warning in Swift 6
            }
    }

    func loadData(for user: User) async {
        print("Loading data for \(user.name)…")
    }
}
```

### Typed Throws (SE-0413)
- Specify exact error types functions can throw
- Eliminates need for general catch clauses when all errors are handled
- `throws(ErrorType)` syntax

```swift
enum CopierError: Error {
    case outOfPaper
}

struct Photocopier {
    var pagesRemaining: Int

    mutating func copy(count: Int) throws(CopierError) {
        guard count <= pagesRemaining else {
            throw .outOfPaper  // Can use shorthand
        }
        pagesRemaining -= count
    }
}

// No "Pokémon catch" needed
do {
    var copier = Photocopier(pagesRemaining: 100)
    try copier.copy(count: 101)
} catch CopierError.outOfPaper {
    print("Please refill the paper")
}
```

### count(where:) Method (SE-0220)
- Performs filter and count in single pass
- Avoids creating intermediate arrays

```swift
let scores = [100, 80, 85]
let passCount = scores.count { $0 >= 85 }

let pythons = ["Eric Idle", "Graham Chapman", "John Cleese", "Michael Palin", "Terry Gilliam", "Terry Jones"]
let terryCount = pythons.count { $0.hasPrefix("Terry") }
```

### Pack Iteration (SE-0408)
- Allows looping over parameter packs introduced in Swift 5.9
- Enables tuple comparison for any arity

```swift
func == <each Element: Equatable>(lhs: (repeat each Element), rhs: (repeat each Element)) -> Bool {
    for (left, right) in repeat (each lhs, each rhs) {
        guard left == right else { return false }
    }
    return true
}
```

### RangeSet and Discontiguous Collection Operations (SE-0270)
- New `RangeSet` type similar to `IndexSet` but for any `Comparable` type
- Handle non-contiguous elements in collections

```swift
struct ExamResult {
    var student: String
    var score: Int
}

let results = [
    ExamResult(student: "Eric Effiong", score: 95),
    ExamResult(student: "Maeve Wiley", score: 70),
    ExamResult(student: "Otis Milburn", score: 100)
]

let topResults = results.indices { student in
    student.score >= 85
}

for result in results[topResults] {
    print("\(result.student) scored \(result.score)%")
}
```

### Access-Level Modifiers on Imports (SE-0409)
- Mark imports with access control: `private import`, `internal import`, `public import`
- Prevents accidentally leaking internal dependencies
- Default will be `internal` in Swift 6 mode, `public` in Swift 5 mode

```swift
// In Banking library
internal import Transactions  // Won't leak to clients

public func sendMoney(from: Int, to: Int) -> BankTransaction {
    // This will now cause a compile error if BankTransaction is exposed
    return BankTransaction()
}
```

### Noncopyable Type Improvements
- **SE-0427**: All types automatically conform to new `Copyable` protocol unless opted out with `~Copyable`
- Noncopyable types can now be used with generics
- Can conform to protocols (if protocols are also `~Copyable`)
- **SE-0429**: Partial consumption of noncopyable values
- **SE-0432**: Pattern matching with `where` clauses on noncopyable types

```swift
struct Message: ~Copyable {
    var agent: String
    private var message: String

    consuming func read() {
        print("\(agent): \(message)")
    }
}

enum ImpossibleOrder: ~Copyable {
    case signed(Package)
    case anonymous(Message)
}

// Now allowed in Swift 6
switch consume order {
case .signed(let package):
    package.read()
case .anonymous(let message) where message.agent == "Ethan Hunt":
    print("Play dramatic music")
    message.read()
case .anonymous(let message):
    message.read()
}
```

### 128-bit Integer Types
```swift
let enoughForAnybody: Int128 = 170_141_183_460_469_231_731_687_303_715_884_105_727
```

### BitwiseCopyable Protocol (SE-0426)
- Compiler optimisation for efficient memory copying
- Automatically applied to most structs/enums with bitwise-copyable properties
- Must be explicit for `public`/`package` types unless marked `@frozen`
- Opt out with `~BitwiseCopyable`

## Major Features in Swift 6.2

### InlineArray<N, Element>
- Fixed-size arrays with compile-time sizes
- Data stored inline on the stack (no heap allocations)
- 20-30% faster in benchmarks for tight loops
- Cannot append or remove elements

```swift
var rgb: InlineArray<3, UInt8> = [255, 128, 64]
print(rgb[0]) // 255
```

**Use cases:**
- Image processing (fixed pixel data)
- DSP buffers
- Any scenario requiring predictable memory usage

### Enhanced Concurrency

**a) `nonisolated(nonsending)` by Default**
- Async methods on actors inherit the actor's context automatically
- Reduces surprises and race conditions

```swift
actor DataManager {
    nonisolated func info() -> String { "Actor-safe info" }
}
```

**b) `@concurrent` Attribute**
- Explicit marking for async functions that run in different contexts

```swift
@MainActor class API {
    @concurrent nonisolated func fetchData() async throws -> Data { ... }
}
```

**c) `defaultIsolation(MainActor.self)`**
- Package-level setting for entire module
- Perfect for UI apps

```swift
// Package.swift
.enableFeature("DefaultIsolation(MainActor.self)")
```

### Enhanced Interoperability
- **C/C++ Interop**: Simpler bindings, automatic header generation
- **Java Interop**: New Swift-Java project for cross-platform mobile libraries

## Breaking Changes from Swift 5

### Actor Inference for Property Wrappers Removed (SE-0401)
**Before Swift 6:** Property wrappers with `@MainActor` automatically made entire struct/class `@MainActor`

**Swift 6:** Must explicitly mark the type with `@MainActor`

```swift
@MainActor
class ViewModel: ObservableObject {
    func authenticate() {
        print("Authenticating…")
    }
}

// Now required in Swift 6
@MainActor
struct LogInView: View {
    @StateObject private var model = ViewModel()
    var body: some View {
        Button("Hello, world", action: startAuthentication)
    }
}
```

### Global Variables Must Be Concurrency-Safe (SE-0412)
**Breaking:** Global and static variables must be safe in concurrent environments

```swift
// These now require annotation:
// Option 1: Convert to constant
struct WarpDrive {
    static let maximumSpeed = 9.975
}

// Option 2: Restrict to global actor
@MainActor
var idNumber = 24601

// Option 3: Mark nonisolated (not recommended unless certain it's safe)
nonisolated(unsafe) var britishCandy = ["Kit Kat", "Mars Bar"]
```

### Function Default Values Share Function Isolation (SE-0411)
Default parameter values now have same isolation as their function

```swift
@MainActor
class Logger { }

@MainActor
class DataController {
    init(logger: Logger = Logger()) {  // Now allowed
    }
}
```

### Other Breaking Changes Enabled by Default in Swift 6
- Bare slash regexes
- Concise magic file names
- Forward scan matching for trailing closures
- `any` required for existential types
- Importing forward-declared Objective-C interfaces
- `@UIApplicationMain` and `@NSApplicationMain` deprecated

## New Recommended Patterns

### Concurrency Best Practices

1. **Trust the compiler's flow analysis**: Don't add unnecessary `Sendable` conformances if the compiler can prove safety

2. **Use typed throws for embedded/performance-critical code**: For most other scenarios, untyped throws remain better

3. **Explicit actor isolation**: Be explicit about isolation in Swift 6
   ```swift
   @MainActor
   class ViewModel: ObservableObject {
       // All methods run on main actor
   }
   ```

4. **Use `sending` keyword** (SE-0430) for transferring values between isolation regions

5. **Leverage `@concurrent` attribute** for clarity about where async functions execute

### Memory and Performance

1. **Use `InlineArray` for fixed-size data**: Significant performance gains for tight loops

2. **Consider `BitwiseCopyable`**: Mark `@frozen public` types explicitly for optimisation

3. **Noncopyable types for unique ownership**: Use `~Copyable` for resources that shouldn't be duplicated

### Code Organisation

1. **Access control on imports**: Prevent dependency leakage
   ```swift
   internal import InternalFramework
   public import PublicAPI
   ```

2. **RangeSet for non-contiguous operations**: Replace custom index tracking logic

## Deprecated Features and Replacements

| Deprecated | Replacement |
|------------|-------------|
| `@UIApplicationMain` / `@NSApplicationMain` | Use `@main` attribute |
| Implicit `@MainActor` from property wrappers | Explicit `@MainActor` on type |
| Unprotected global variables | `@MainActor`, constants, or `nonisolated(unsafe)` |
| `rethrows` in some contexts | `throws(E)` with generic error types |

## Performance Considerations

1. **InlineArray performance**: 20-30% faster than standard arrays for fixed-size data due to stack allocation

2. **BitwiseCopyable optimisations**: Automatic for most types, significant memory copy improvements

3. **Concurrency overhead reduction**: Swift 6 reduces unnecessary context switches in async/await

4. **count(where:)**: Single-pass operation vs filter + count (no intermediate array)

5. **Region-based isolation**: Compiler can optimise based on proven isolation boundaries

## Migration from Swift 5 to Swift 6

### Incremental Migration Strategy

1. **Use per-target Swift language version** (SE-0435): Migrate targets individually rather than all at once

2. **Enable strict concurrency checking first**: Test with Swift 5.10 strict concurrency before moving to Swift 6

3. **Fix global variable issues**: Audit all global and static variables, add appropriate annotations

4. **Add explicit actor isolation**: Review property wrappers and add `@MainActor` where needed

5. **Update import visibility**: Audit public APIs to ensure internal dependencies aren't leaked

### Common Migration Issues

**Issue 1: Main actor isolation warnings**
```swift
// Solution: Add explicit @MainActor
@MainActor
struct MyView: View {
    @StateObject private var viewModel = ViewModel()
}
```

**Issue 2: Global variable warnings**
```swift
// Solution: Make constant or add actor isolation
static let configuration = Configuration()  // Constant
// OR
@MainActor static var sharedState = State()  // Actor-isolated
```

**Issue 3: Sendable warnings**
- First check if the compiler's flow analysis eliminates the warning
- If not, consider whether `Sendable` conformance is appropriate
- Use `@unchecked Sendable` only when absolutely necessary

### Compiler Flags to Test

Before full migration:
- Enable strict concurrency checking
- Test with Swift 6 mode enabled on individual targets
- Use upcoming feature flags to test individual changes

## Platform Requirements

- Swift 6.2 features available on latest platforms
- InlineArray and enhanced concurrency features require updated SDKs
- No specific macOS 15.7+ requirements mentioned for core language features
