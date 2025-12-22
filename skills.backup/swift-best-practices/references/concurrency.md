<!--
Source: https://github.com/sammcj/agentic-coding
Author: Sam McLeod (sammcj)
License: Apache 2.0
Adapted: 2025-11-10
Changes: Added attribution header
-->

# Swift Concurrency Best Practices Reference

Detailed patterns, pitfalls, and performance considerations for Swift concurrency.

## Core Async/Await Patterns

### Basic Async/Await Usage
- **Async functions** are marked with the `async` keyword and represent asynchronous operations
- **Await** suspends execution without blocking the thread until the async operation completes
- Async/await provides structured concurrency - code executes in a predictable, sequential order

```swift
func fetchImages() async throws -> [UIImage] {
    // Perform async work
}

// Usage
do {
    let images = try await fetchImages()
    print("Fetched \(images.count) images.")
} catch {
    print("Fetching failed with error \(error)")
}
```

### Performance Considerations
- **Don't mark functions as async unnecessarily** - async functions use a less efficient calling convention than synchronous functions due to potential suspension points
- **Avoid excessive context switching** - minimise the number of `await` calls by grouping operations within the same isolation domain

```swift
// Bad: Multiple await calls causing potential suspensions
await feeder.chickenStartsEating()
await feeder.notifyObservers()

// Good: Combine operations to reduce suspension points
func chickenStartsEating() {
    numberOfEatingChickens += 1
    notifyObservers() // No await needed - already isolated
}
```

### Async Let for Parallel Execution
Use `async let` to execute multiple async operations concurrently:

```swift
func fetchData() async -> (String, Int) {
    async let stringData = fetchString()
    async let intData = fetchInt()
    return await (stringData, intData)
}
```

### Converting Closure-Based APIs
Use `withCheckedThrowingContinuation` to convert completion handler APIs:

```swift
func fetchImages() async throws -> [UIImage] {
    return try await withCheckedThrowingContinuation { continuation in
        fetchImages { result in
            continuation.resume(with: result)
        }
    }
}
```

## MainActor Usage Guidelines

### When to Use @MainActor
- UI updates must always run on the main thread
- Use `@MainActor` to ensure functions/properties execute on the main actor
- Can be applied to types, methods, properties, or closures

```swift
@MainActor
class ContentViewModel: ObservableObject {
    @Published var images: [UIImage] = []

    func fetchData() {
        Task {
            do {
                self.images = try await fetchImages()
            } catch {
                // Handle error
            }
        }
    }
}
```

### MainActor Best Practices
- **Apply at protocol level** if most operations involve UI updates
- **Use selectively** on individual methods/properties if doing significant background work
- **Avoid `MainActor.run`** when a direct await call works:

```swift
// Unnecessary
await MainActor.run {
    doMainActorStuff()
}

// Better
await doMainActorStuff()
```

### Swift 6 Changes
- In Swift 6, `@MainActor` closures are automatically `Sendable`
- The combination `@MainActor @Sendable` is only needed for Swift 5/Xcode 15 compatibility
- A plain `@MainActor () -> Void` is now less restrictive and preferred

## Actor and Sendable Best Practices

### Actor Fundamentals
- Actors protect mutable state from data races through automatic synchronisation
- Actors are reference types but don't support inheritance
- Access to actor-isolated data requires `await` from outside the actor

```swift
actor ChickenFeeder {
    let food = "worms" // Immutable - no await needed
    var numberOfEatingChickens: Int = 0 // Mutable - requires await

    func chickenStartsEating() {
        numberOfEatingChickens += 1 // No await needed inside actor
    }
}

// Usage
let feeder = ChickenFeeder()
print(feeder.food) // No await - immutable
await feeder.chickenStartsEating() // Await required - mutable access
```

### Nonisolated Access
Mark methods/properties as `nonisolated` when they don't access isolated state:

```swift
extension ChickenFeeder {
    nonisolated func printWhatChickensAreEating() {
        print("Chickens are eating \(food)")
    }
}

// No await needed
feeder.printWhatChickensAreEating()
```

### Sendable Protocol
- Types conforming to `Sendable` are safe to share across concurrency domains
- Value types (structs, enums) with `Sendable` properties are automatically `Sendable`
- Classes must be immutable or use `@unchecked Sendable` with proper synchronisation

```swift
// Automatically Sendable
struct UserData: Sendable {
    let name: String
    let age: Int
}

// Requires @unchecked with manual thread safety
final class MyClass: @unchecked Sendable {
    private var value: Int = 0
    private let queue = DispatchQueue(label: "com.myapp.syncQueue")

    func updateValue(_ newValue: Int) {
        queue.sync {
            self.value = newValue
        }
    }
}
```

### Actor Isolation Patterns
- **Avoid "split isolation"** - don't mix isolation domains within a single type:

```swift
// Bad: Mixed isolation
class SomeClass {
    var name: String // non-isolated
    @MainActor var value: Int // MainActor-isolated
}

// Good: Consistent isolation
@MainActor
class SomeClass {
    var name: String
    var value: Int
}
```

### Stateless Actors Anti-Pattern
Don't create actors without mutable state - use non-isolated async functions instead:

```swift
// Bad: Stateless actor
actor Processor {
    func process(_ data: Data) async -> Result {
        // No state to protect
    }
}

// Good: Non-isolated async function
func process(_ data: Data) async -> Result {
    // No actor needed
}
```

## Task Management Patterns

### Creating Tasks
Use `Task` to bridge synchronous and asynchronous contexts:

```swift
func fetchData() {
    Task {
        do {
            let data = try await fetchImages()
            // Process data
        } catch {
            // Handle error
        }
    }
}
```

### Task.detached Caution
**Avoid `Task.detached` unless necessary** - it breaks priority and task-local value inheritance:

```swift
// Bad: Unnecessary detachment
@MainActor
func doSomeStuff() {
    Task.detached {
        await expensiveWork()
    }
}

// Good: Maintains context
@MainActor
func doSomeStuff() {
    Task {
        await expensiveWork()
    }
}

nonisolated func expensiveWork() async { }
```

### Explicit Priorities
Only set explicit task priorities with clear justification:

```swift
// Must include comment explaining why
// Processing low-priority background sync that shouldn't impact UI
Task(priority: .background) {
    await someNonCriticalWork()
}
```

### Structured vs Unstructured Concurrency
Prefer structured concurrency (async/await) over unstructured (Task creation):
- Provides automatic cancellation support
- Enforces static isolation requirements
- Simpler error handling

## Common Mistakes and Pitfalls

### Mistake 1: Treating Async For Loops as Normal For Loops
Async for loops suspend on each iteration - early returns can cause incomplete processing:

```swift
// Problematic: Early return skips remaining items
for await notification in notificationsStream {
    guard let bundleIdentifier = app.bundleIdentifier else {
        return // Stops entire loop!
    }
    await process(bundleIdentifier)
}

// Better: Continue to next iteration
for await notification in notificationsStream {
    guard let bundleIdentifier = app.bundleIdentifier else {
        continue // Skips this iteration only
    }
    await process(bundleIdentifier)
}
```

### Mistake 2: Assuming Async Methods Run in Background
**Async doesn't mean background** - it means the function can suspend, but may run on any thread:

```swift
// This might still run on main thread and block UI!
func loadHeavyData() async -> Data {
    // Heavy computation without actual await
    return processLargeFile()
}

// Explicitly move to background
func loadHeavyData() async -> Data {
    await Task.detached {
        processLargeFile()
    }.value
}
```

### Mistake 3: Ignoring Task Cancellation
Always check for cancellation in long-running operations:

```swift
func processLargeDataSet(_ items: [Item]) async throws -> [Result] {
    var results: [Result] = []
    for item in items {
        try Task.checkCancellation() // Check cancellation
        let result = await process(item)
        results.append(result)
    }
    return results
}
```

### Mistake 4: Blocking for Async Work
Never use `DispatchSemaphore` or `DispatchGroup` to wait on async work - risk of deadlock:

```swift
// Bad: Deadlock risk
let semaphore = DispatchSemaphore(value: 0)
Task {
    await doAsyncWork()
    semaphore.signal()
}
semaphore.wait()

// Good: Use async/await properly
await doAsyncWork()
```

### Mistake 5: Redundant Sendable Conformances
Global actor-isolated types are automatically `Sendable`:

```swift
// Redundant
@MainActor
class SomeClass: Sendable { }

// Sufficient
@MainActor
class SomeClass { }
```

## Performance Considerations

### Minimise Suspension Points
- Group related operations within the same isolation domain
- Avoid unnecessary `await` calls within actors
- Use `nonisolated` for methods that don't access isolated state

### Avoid Excessive Thread Hopping
- Don't alternate between isolation domains unnecessarily
- Batch UI updates rather than updating incrementally

### Task Overhead
- Creating tasks has overhead - don't create tasks in tight loops
- Use `TaskGroup` for managing multiple concurrent operations

## Thread Safety Patterns

### Actor-Based State Protection
Use actors to protect mutable shared state:

```swift
actor DataCache {
    private var cache: [String: Data] = [:]

    func store(_ data: Data, forKey key: String) {
        cache[key] = data
    }

    func retrieve(forKey key: String) -> Data? {
        return cache[key]
    }
}
```

### @preconcurrency for Legacy Code
Use `@preconcurrency` when interfacing with pre-concurrency APIs:

```swift
@preconcurrency
class LegacyClass {
    var data: SomeType
}
```

**Important**: `@preconcurrency` doesn't make code thread-safe - it only relaxes compiler checks for backward compatibility.

### Non-Sendable Types with Isolated Parameters
When working with non-`Sendable` types in async contexts, use isolated parameters:

```swift
class NonSendableViewModel {
    func updateUI(_ data: Data) {
        // Update UI
    }
}

@MainActor
func processData(_ viewModel: NonSendableViewModel) async {
    let data = await fetchData()
    viewModel.updateUI(data) // Safe - isolated to MainActor
}
```

## Key Takeaways

1. **Async ≠ Background**: Async functions can suspend but don't automatically run on background threads
2. **Actors protect state**: Use actors for mutable shared state, not for stateless operations
3. **MainActor for UI**: Always use `@MainActor` for UI-related code
4. **Sendable ensures safety**: Conform to `Sendable` for types crossing concurrency boundaries
5. **Check cancellation**: Long-running operations should check `Task.checkCancellation()`
6. **Prefer structured concurrency**: Use async/await over creating unstructured tasks
7. **Avoid Task.detached**: Only use when you explicitly need to break context inheritance
8. **Nonisolated for immutable access**: Mark methods accessing only immutable data as `nonisolated`
9. **Minimise suspension points**: Group related operations to reduce context switching
10. **Swift 6 compiler helps**: Enable strict concurrency checking to catch issues at compile time
