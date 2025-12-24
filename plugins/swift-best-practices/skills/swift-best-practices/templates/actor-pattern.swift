// Actor Isolation Pattern Example
// Demonstrates proper use of actors for thread-safe mutable state in Swift 6

import Foundation

// ❌ WRONG: Class without protection - data races possible
class CacheWrong {
    private var storage: [String: Data] = [:]

    func store(_ data: Data, forKey key: String) {
        // ⚠️ DATA RACE: Multiple threads can modify storage simultaneously
        storage[key] = data
    }

    func retrieve(forKey key: String) -> Data? {
        // ⚠️ DATA RACE: Reading while another thread is writing
        return storage[key]
    }
}

// ✅ CORRECT: Actor provides automatic isolation and thread safety
actor DataCache {
    private var storage: [String: Data] = [:]
    private var accessLog: [String: Date] = [:]

    /// Stores data in the cache with automatic thread safety
    /// - Parameters:
    ///   - data: The data to cache
    ///   - key: The cache key
    func store(_ data: Data, forKey key: String) {
        // No 'await' needed - we're inside the actor
        storage[key] = data
        accessLog[key] = Date()
    }

    /// Retrieves cached data if available
    /// - Parameter key: The cache key
    /// - Returns: Cached data or nil if not found
    func retrieve(forKey key: String) -> Data? {
        // No 'await' needed - we're inside the actor
        accessLog[key] = Date()
        return storage[key]
    }

    /// Removes old cache entries
    /// - Parameter age: Maximum age in seconds
    func removeOldEntries(olderThan age: TimeInterval) {
        let cutoff = Date().addingTimeInterval(-age)
        let keysToRemove = accessLog.filter { $0.value < cutoff }.keys

        for key in keysToRemove {
            storage.removeValue(forKey: key)
            accessLog.removeValue(forKey: key)
        }
    }

    /// Returns cache statistics without exposing mutable state
    /// - Returns: Number of cached items
    nonisolated func cacheType() -> String {
        // 'nonisolated' - doesn't access isolated state, no 'await' needed
        return "DataCache"
    }

    /// Thread-safe cache size query
    func count() -> Int {
        // Accessing isolated state - must be called with 'await'
        return storage.count
    }
}

// Usage Example: Calling actor methods requires 'await'
func demonstrateActorUsage() async {
    let cache = DataCache()

    // Store data - requires 'await' because we're crossing actor boundary
    await cache.store(Data(), forKey: "user123")

    // Retrieve data - requires 'await'
    if let data = await cache.retrieve(forKey: "user123") {
        print("Found cached data: \(data.count) bytes")
    }

    // Cleanup old entries - requires 'await'
    await cache.removeOldEntries(olderThan: 3600)

    // Nonisolated method - no 'await' needed
    let type = cache.cacheType()
    print("Cache type: \(type)")

    // Get count - requires 'await'
    let itemCount = await cache.count()
    print("Cache contains \(itemCount) items")
}

// ✅ ADVANCED: Actor with async operations
actor ImageProcessor {
    private var processedImages: [String: ProcessedImage] = [:]

    /// Processes an image asynchronously within the actor
    /// - Parameter image: The raw image data
    /// - Returns: Processed image
    func process(_ image: RawImage) async -> ProcessedImage {
        // Check if already processed
        if let cached = processedImages[image.id] {
            return cached
        }

        // Perform expensive operation (can suspend)
        let processed = await performExpensiveProcessing(image)

        // Store result (still isolated - no data race)
        processedImages[image.id] = processed

        return processed
    }

    private func performExpensiveProcessing(_ image: RawImage) async -> ProcessedImage {
        // Simulate expensive work
        try? await Task.sleep(for: .milliseconds(100))
        return ProcessedImage(id: image.id, data: image.data)
    }

    /// Batch processing with cancellation support
    func processBatch(_ images: [RawImage]) async throws -> [ProcessedImage] {
        var results: [ProcessedImage] = []

        for image in images {
            // Check for cancellation
            try Task.checkCancellation()

            let processed = await process(image)
            results.append(processed)
        }

        return results
    }
}

// ✅ ACTOR KEY PRINCIPLES:

// 1. Actor methods are automatically isolated - no manual locking needed
// 2. Accessing actor properties/methods from outside requires 'await'
// 3. Inside actor methods, no 'await' needed for same-actor access
// 4. Use 'nonisolated' for methods that don't touch mutable state
// 5. Actors can have async methods and can call other async functions
// 6. Actor isolation is automatic - compiler enforces safety

// ❌ COMMON MISTAKES:

// Mistake 1: Using actors for stateless operations
actor StatelessProcessor {  // ❌ Don't do this
    func process(_ data: Data) -> String {
        // No mutable state - should be a struct with async function instead
        return String(data: data, encoding: .utf8) ?? ""
    }
}
// ✅ Better:
struct StatelessProcessorBetter {
    func process(_ data: Data) async -> String {
        return String(data: data, encoding: .utf8) ?? ""
    }
}

// Mistake 2: Exposing mutable state
actor BadCache {
    var storage: [String: Data] = [:]  // ❌ Public mutable property
}
// ✅ Better: Keep state private, expose only through methods

// Mistake 3: Unnecessary actors for UI code
actor UIHandler {  // ❌ Wrong - use @MainActor instead
    func updateLabel(_ text: String) {
        // UI updates should be on MainActor
    }
}
// ✅ Better: Use @MainActor for UI code (see mainactor-viewmodel.swift)

// Supporting Types
struct RawImage {
    let id: String
    let data: Data
}

struct ProcessedImage {
    let id: String
    let data: Data
}

// WHEN TO USE ACTORS:
// ✅ Managing mutable shared state accessed from multiple contexts
// ✅ Implementing caches, connection pools, or resource managers
// ✅ Background data processing with state tracking
// ✅ Thread-safe coordination between async operations

// WHEN NOT TO USE ACTORS:
// ❌ UI code (use @MainActor instead)
// ❌ Stateless operations (use regular async functions)
// ❌ Simple value types without shared mutable state
// ❌ Code that needs synchronous access patterns
