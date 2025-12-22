# SettingsKit Search Implementation Guide

Deep dive into SettingsKit's search architecture, custom search implementation, and search scoring.

---

## Overview

SettingsKit provides automatic search functionality across all settings:
- **Metadata indexing**: Title, icon, and tags extracted from SettingsContent
- **View registry**: Maps node IDs to interactive controls for rendering results
- **Hybrid architecture**: Search operates on lightweight metadata while rendering full interactive views

---

## Default Search Behavior

### What's Searchable

**Automatically indexed:**
- SettingsGroup titles
- SettingsGroup icons (system image names)
- SettingsGroup tags (via `.settingsTags([...])`)
- SettingsItem titles
- SettingsItem icons (rarely used)

**NOT indexed:**
- CustomSettingsGroup content (only title/icon/tags)
- Control values (e.g., current toggle state, slider value)
- Dynamic content generated inside controls

### Search Scoring Algorithm

**Default scoring (higher = better match):**
1. **Exact match (1000)**: Query exactly equals title (case-insensitive)
2. **Prefix match (500)**: Title starts with query
3. **Contains match (300)**: Title contains query anywhere
4. **Tag match (100)**: Any tag contains query

**Example:**
```swift
Query: "noti"

SettingsGroup("Notifications", systemImage: "bell")  // 500 (prefix)
    .settingsTags(["alerts", "sounds"])

SettingsGroup("Push Notifications")  // 300 (contains)
    .settingsTags(["push"])

SettingsGroup("Alerts")  // 100 (tag match: "noti" in related context)
    .settingsTags(["notifications", "sounds"])
```

---

## Search Architecture

### Three-Layer System

**1. Metadata Layer (Nodes)**
- Lightweight tree structure via `SettingsNode`
- Built by calling `makeNodes()` on SettingsContent
- Contains: title, icon, tags, presentation mode, children
- **Does NOT contain**: Actual views or controls

**2. View Registry**
- Global singleton `SettingsNodeViewRegistry`
- Maps node UUID → view builder closure
- Registered during `makeContent()` calls
- Enables rendering interactive controls from search results

**3. Rendering Layer**
- Standard SwiftUI view hierarchy
- Uses `@Observable` for reactive updates
- Search results call view builders from registry

### Why Hybrid Architecture?

**Problem:** SwiftUI views can't be inspected or serialized for search indexing.

**Solution:** Extract metadata (`SettingsNode`) separately from views, register view builders for rendering.

**Benefits:**
- Search operates on fast, lightweight metadata
- Results render full interactive controls (not static previews)
- State management remains reactive (via @Observable)

---

## Node Tree Structure

### SettingsNode Definition

```swift
struct SettingsNode {
    let id: UUID                 // Stable hash-based identifier
    let title: String            // Display name
    let icon: String?            // SF Symbol name
    let tags: [String]           // Search keywords
    let presentationMode: SettingsGroupPresentationMode
    let children: [SettingsNode] // Nested groups/items
}
```

### Stable ID Generation

SettingsKit uses **hash-based UUIDs** (not random):

```swift
func makeStableID(title: String, icon: String?) -> UUID {
    let combined = "\(title)-\(icon ?? "")"
    let hash = combined.hashValue
    // Convert hash to UUID bytes
    return UUID(/* from hash */)
}
```

**Why:** Ensures same group generates same UUID across multiple `makeNodes()` calls, critical for navigation state persistence.

### Example Node Tree

```swift
// This settings hierarchy:
SettingsGroup("General", systemImage: "gear") {
    SettingsItem("Notifications") { Toggle(...) }
    SettingsItem("Sound") { Toggle(...) }
}

// Generates this node tree:
SettingsNode(
    id: UUID("stable-hash-1"),
    title: "General",
    icon: "gear",
    tags: [],
    presentationMode: .navigation,
    children: [
        SettingsNode(
            id: UUID("stable-hash-2"),
            title: "Notifications",
            icon: nil,
            tags: [],
            presentationMode: .navigation,
            children: []
        ),
        SettingsNode(
            id: UUID("stable-hash-3"),
            title: "Sound",
            icon: nil,
            tags: [],
            presentationMode: .navigation,
            children: []
        )
    ]
)
```

---

## Default Search Implementation

### Built-in Search Logic

```swift
func defaultSearch(nodes: [SettingsNode], query: String) -> [SettingsSearchResult] {
    let normalizedQuery = query
        .lowercased()
        .trimmingCharacters(in: .whitespacesAndNewlines)

    var results: [SettingsSearchResult] = []

    func searchRecursive(node: SettingsNode, path: [UUID]) {
        let title = node.title.lowercased()
        let tags = node.tags.map { $0.lowercased() }

        var score = 0

        // Exact match
        if title == normalizedQuery {
            score = 1000
        }
        // Prefix match
        else if title.hasPrefix(normalizedQuery) {
            score = 500
        }
        // Contains match
        else if title.contains(normalizedQuery) {
            score = 300
        }
        // Tag match
        else if tags.contains(where: { $0.contains(normalizedQuery) }) {
            score = 100
        }

        if score > 0 {
            results.append(SettingsSearchResult(
                node: node,
                score: score,
                path: path + [node.id]
            ))
        }

        // Recurse into children
        for child in node.children {
            searchRecursive(node: child, path: path + [node.id])
        }
    }

    for rootNode in nodes {
        searchRecursive(node: rootNode, path: [])
    }

    return results.sorted { $0.score > $1.score }
}
```

---

## Custom Search Implementation

### Creating Custom Search

Conform to `SettingsSearch` protocol:

```swift
protocol SettingsSearch {
    func search(nodes: [SettingsNode], query: String) -> [SettingsSearchResult]
}
```

### Example: Fuzzy Search with Levenshtein Distance

```swift
struct FuzzySearch: SettingsSearch {
    func search(nodes: [SettingsNode], query: String) -> [SettingsSearchResult] {
        let normalizedQuery = query.lowercased()
        var results: [SettingsSearchResult] = []

        func searchRecursive(node: SettingsNode, path: [UUID]) {
            let title = node.title.lowercased()

            // Calculate Levenshtein distance
            let distance = levenshteinDistance(title, normalizedQuery)
            let maxDistance = min(title.count, normalizedQuery.count) / 2

            var score = 0
            if distance <= maxDistance {
                // Lower distance = higher score
                score = 1000 - (distance * 100)
            }

            // Bonus for prefix matches
            if title.hasPrefix(normalizedQuery) {
                score += 500
            }

            // Tag bonuses
            for tag in node.tags {
                if tag.lowercased().contains(normalizedQuery) {
                    score += 100
                }
            }

            if score > 0 {
                results.append(SettingsSearchResult(
                    node: node,
                    score: score,
                    path: path + [node.id]
                ))
            }

            for child in node.children {
                searchRecursive(node: child, path: path + [node.id])
            }
        }

        for rootNode in nodes {
            searchRecursive(node: rootNode, path: [])
        }

        return results.sorted { $0.score > $1.score }
    }

    private func levenshteinDistance(_ s1: String, _ s2: String) -> Int {
        let s1 = Array(s1)
        let s2 = Array(s2)
        var dist = [[Int]](repeating: [Int](repeating: 0, count: s2.count + 1), count: s1.count + 1)

        for i in 0...s1.count {
            dist[i][0] = i
        }
        for j in 0...s2.count {
            dist[0][j] = j
        }

        for i in 1...s1.count {
            for j in 1...s2.count {
                if s1[i - 1] == s2[j - 1] {
                    dist[i][j] = dist[i - 1][j - 1]
                } else {
                    dist[i][j] = min(
                        dist[i - 1][j] + 1,
                        dist[i][j - 1] + 1,
                        dist[i - 1][j - 1] + 1
                    )
                }
            }
        }

        return dist[s1.count][s2.count]
    }
}

// Usage:
MySettings()
    .settingsSearch(FuzzySearch())
```

---

### Example: Weighted Multi-Field Search

```swift
struct WeightedSearch: SettingsSearch {
    func search(nodes: [SettingsNode], query: String) -> [SettingsSearchResult] {
        let normalizedQuery = query.lowercased()
        var results: [SettingsSearchResult] = []

        func searchRecursive(node: SettingsNode, path: [UUID]) {
            let title = node.title.lowercased()
            let icon = node.icon?.lowercased() ?? ""
            let tags = node.tags.map { $0.lowercased() }

            var score = 0

            // Title scoring (highest weight)
            if title == normalizedQuery {
                score += 1000
            } else if title.hasPrefix(normalizedQuery) {
                score += 600
            } else if title.contains(normalizedQuery) {
                score += 300
            }

            // Icon scoring (medium weight)
            if icon.contains(normalizedQuery) {
                score += 200
            }

            // Tag scoring (lower weight, but accumulates)
            for tag in tags {
                if tag == normalizedQuery {
                    score += 150
                } else if tag.contains(normalizedQuery) {
                    score += 75
                }
            }

            // Bonus for exact word matches in title
            let titleWords = title.split(separator: " ")
            if titleWords.contains(where: { $0 == normalizedQuery }) {
                score += 400
            }

            if score > 0 {
                results.append(SettingsSearchResult(
                    node: node,
                    score: score,
                    path: path + [node.id]
                ))
            }

            for child in node.children {
                searchRecursive(node: child, path: path + [node.id])
            }
        }

        for rootNode in nodes {
            searchRecursive(node: rootNode, path: [])
        }

        return results.sorted { $0.score > $1.score }
    }
}
```

---

### Example: Synonym-Aware Search

```swift
struct SynonymSearch: SettingsSearch {
    let synonyms: [String: [String]] = [
        "notification": ["alert", "push", "banner", "badge"],
        "appearance": ["theme", "color", "dark mode", "light mode"],
        "privacy": ["security", "permissions", "tracking"],
        "network": ["wifi", "cellular", "data", "connection"]
    ]

    func search(nodes: [SettingsNode], query: String) -> [SettingsSearchResult] {
        let normalizedQuery = query.lowercased()
        var results: [SettingsSearchResult] = []

        // Expand query with synonyms
        var searchTerms = [normalizedQuery]
        for (key, values) in synonyms {
            if normalizedQuery.contains(key) {
                searchTerms.append(contentsOf: values)
            }
            for value in values where normalizedQuery.contains(value) {
                searchTerms.append(key)
                searchTerms.append(contentsOf: values)
            }
        }
        searchTerms = Array(Set(searchTerms)) // Remove duplicates

        func searchRecursive(node: SettingsNode, path: [UUID]) {
            let title = node.title.lowercased()
            let tags = node.tags.map { $0.lowercased() }

            var score = 0

            for term in searchTerms {
                // Primary term (query itself) gets higher weight
                let weight = term == normalizedQuery ? 1.0 : 0.7

                if title == term {
                    score += Int(1000 * weight)
                } else if title.hasPrefix(term) {
                    score += Int(500 * weight)
                } else if title.contains(term) {
                    score += Int(300 * weight)
                }

                for tag in tags where tag.contains(term) {
                    score += Int(100 * weight)
                }
            }

            if score > 0 {
                results.append(SettingsSearchResult(
                    node: node,
                    score: score,
                    path: path + [node.id]
                ))
            }

            for child in node.children {
                searchRecursive(node: child, path: path + [node.id])
            }
        }

        for rootNode in nodes {
            searchRecursive(node: rootNode, path: [])
        }

        return results.sorted { $0.score > $1.score }
    }
}
```

---

## Search Result Handling

### SettingsSearchResult Structure

```swift
struct SettingsSearchResult {
    let node: SettingsNode   // Matching node
    let score: Int           // Relevance score
    let path: [UUID]         // Navigation path to result
}
```

**Navigation Path:**
- Array of node UUIDs from root to result
- Used by SettingsKit to navigate to result when tapped
- Example: `[rootGroupID, parentGroupID, itemID]`

### Result Grouping

SettingsKit groups results by parent:

```swift
// Search: "notification"
// Results grouped by parent group:

General
  ├─ Notifications (score: 1000)
  └─ Push Notifications (score: 500)

Privacy
  └─ Notification Permissions (score: 300)
```

---

## Search Tags Best Practices

### Effective Tagging Strategy

**Include:**
- Synonyms: "noti" for "Notifications", "wifi" for "Wi-Fi"
- Common misspellings: "notfications", "notifcations"
- Related concepts: "alerts", "sounds", "badges" for notifications
- Error keywords: "not working", "broken", "failed"
- Technical terms: "push", "APNS", "badge count"

**Example:**
```swift
SettingsGroup("Notifications", systemImage: "bell")
    .settingsTags([
        "alerts",
        "push",
        "sounds",
        "badges",
        "banner",
        "noti",  // Common abbreviation
        "APNS",  // Technical term
        "notifications not working",  // Error keyword
        "silent mode"
    ])
{
    // Settings items...
}
```

### Tag Organization Patterns

**By Feature:**
```swift
SettingsGroup("Dark Mode")
    .settingsTags(["appearance", "theme", "colors", "night mode", "light mode"])
```

**By User Intent:**
```swift
SettingsGroup("Privacy")
    .settingsTags(["security", "tracking", "data protection", "permissions"])
```

**By Error/Issue:**
```swift
SettingsGroup("Network")
    .settingsTags(["wifi", "connection", "offline", "no internet", "slow"])
```

---

## Search Performance Optimization

### Limiting Search Depth

For very large settings hierarchies, limit recursion depth:

```swift
struct DepthLimitedSearch: SettingsSearch {
    let maxDepth = 5

    func search(nodes: [SettingsNode], query: String) -> [SettingsSearchResult] {
        let normalizedQuery = query.lowercased()
        var results: [SettingsSearchResult] = []

        func searchRecursive(node: SettingsNode, path: [UUID], depth: Int) {
            guard depth < maxDepth else { return }

            let title = node.title.lowercased()
            var score = 0

            if title.contains(normalizedQuery) {
                score = 1000 - (depth * 100) // Penalize deeper items
            }

            if score > 0 {
                results.append(SettingsSearchResult(
                    node: node,
                    score: score,
                    path: path + [node.id]
                ))
            }

            for child in node.children {
                searchRecursive(node: child, path: path + [node.id], depth: depth + 1)
            }
        }

        for rootNode in nodes {
            searchRecursive(node: rootNode, path: [], depth: 0)
        }

        return results.sorted { $0.score > $1.score }
    }
}
```

### Caching Search Results

For expensive search algorithms:

```swift
actor SearchCache {
    private var cache: [String: [SettingsSearchResult]] = [:]

    func get(query: String) -> [SettingsSearchResult]? {
        cache[query]
    }

    func set(query: String, results: [SettingsSearchResult]) {
        cache[query] = results
    }

    func clear() {
        cache.removeAll()
    }
}

struct CachedSearch: SettingsSearch {
    let cache = SearchCache()
    let baseSearch = FuzzySearch()

    func search(nodes: [SettingsNode], query: String) -> [SettingsSearchResult] {
        // Note: Actor access requires async, simplification for example
        // In practice, implement with Task or @MainActor
        if let cached = Task { await cache.get(query: query) }.value {
            return cached
        }

        let results = baseSearch.search(nodes: nodes, query: query)
        Task { await cache.set(query: query, results: results) }
        return results
    }
}
```

---

## Platform-Specific Search

### iOS Search Bar Integration

```swift
MySettings()
    .searchable(text: $searchQuery)
```

SettingsKit automatically integrates with SwiftUI's `.searchable()` modifier.

### macOS Search Field

On macOS, sidebar style includes search field automatically:

```swift
MySettings()
    .settingsStyle(.sidebar)  // Search included in sidebar
```

---

## Debugging Search

### Logging Search Behavior

```swift
struct DebugSearch: SettingsSearch {
    func search(nodes: [SettingsNode], query: String) -> [SettingsSearchResult] {
        print("🔍 Search query: \(query)")
        print("📊 Total nodes: \(countNodes(nodes))")

        let results = defaultSearch(nodes: nodes, query: query)

        print("✅ Found \(results.count) results:")
        for result in results {
            print("  - \(result.node.title) (score: \(result.score))")
        }

        return results
    }

    private func countNodes(_ nodes: [SettingsNode]) -> Int {
        nodes.reduce(0) { count, node in
            count + 1 + countNodes(node.children)
        }
    }

    private func defaultSearch(nodes: [SettingsNode], query: String) -> [SettingsSearchResult] {
        // Default search implementation...
        []
    }
}
```

### Visualizing Search Scores

```swift
struct ScoreVisualizingSearch: SettingsSearch {
    func search(nodes: [SettingsNode], query: String) -> [SettingsSearchResult] {
        var results = defaultSearch(nodes: nodes, query: query)

        // Log score distribution
        let scoreRanges = [
            (900...1000, "Exact"),
            (500...899, "Prefix"),
            (300...499, "Contains"),
            (100...299, "Tag"),
            (0...99, "Other")
        ]

        for (range, label) in scoreRanges {
            let count = results.filter { range.contains($0.score) }.count
            print("\(label): \(count) results")
        }

        return results
    }

    private func defaultSearch(nodes: [SettingsNode], query: String) -> [SettingsSearchResult] {
        // Default search implementation...
        []
    }
}
```

---

## Common Search Issues

### Issue: Search not finding expected items
**Solution:** Add relevant `.settingsTags([...])` to groups. Verify spelling matches user queries.

### Issue: Wrong items appearing first
**Solution:** Adjust scoring algorithm to prioritize relevant matches. Use tag bonuses for important keywords.

### Issue: Search too slow with large hierarchies
**Solution:** Implement depth limiting, caching, or parallel search with DispatchQueue.

### Issue: CustomSettingsGroup content invisible to search
**Solution:** By design—only title/icon/tags indexed. Use SettingsItem for searchable content.

---

For API details, see `references/api-reference.md`.
For styling search results, see `references/styling-guide.md`.
For production patterns, see `references/advanced-patterns.md`.
