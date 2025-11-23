# SettingsKit Performance & Edge Cases

Guide to performance optimization, stress testing, and handling edge cases in large settings hierarchies.

---

## Performance Considerations

### Hierarchy Complexity

SettingsKit can handle complex hierarchies efficiently, but performance depends on:

**Width** (number of top-level groups):
- **Optimal**: < 20 top-level groups
- **Good**: 20-50 groups
- **Caution**: 50-100 groups (may impact initial load)
- **Limit**: 100+ groups (consider lazy loading)

**Depth** (nesting levels):
- **Optimal**: 1-3 levels deep
- **Good**: 4-6 levels
- **Caution**: 7-10 levels (navigation stack depth)
- **Limit**: 10+ levels (UX becomes complex)

**Total Items**:
- **Optimal**: < 100 total items
- **Good**: 100-500 items
- **Caution**: 500-1000 items
- **Limit**: 1000+ items (consider pagination or lazy loading)

---

## Stress Test Scenarios

Based on official SettingsKit demo stress tests:

### Test 1: Wide Hierarchy

**Scenario**: 100 groups with 10 items each (1000 total items)

```swift
struct WideHierarchyTest: SettingsContainer {
    @Environment(SettingsState.self) var state

    var settingsBody: some SettingsContent {
        @Bindable var settings = state

        ForEach(0..<100, id: \.self) { groupIndex in
            SettingsGroup("Group \(groupIndex)", systemImage: "folder") {
                ForEach(0..<10, id: \.self) { itemIndex in
                    SettingsItem("Item \(groupIndex)-\(itemIndex)") {
                        Toggle("Enable", isOn: $settings.testToggle)
                    }
                }
            }
        }
    }
}
```

**Performance Characteristics:**
- Initial load: Instantiates 100 group nodes
- Memory: Low (nodes are lightweight metadata)
- Rendering: Lazy (SwiftUI virtualizes List/ScrollView)
- Search: Fast (100 nodes × 10 children = 1000 nodes to traverse)

**Best For**: Settings with many separate sections (plugin configurations, user accounts, etc.)

---

### Test 2: Deep Single Group

**Scenario**: Single group with 1000 items inline

```swift
SettingsGroup("Deep Test", .inline) {
    ForEach(0..<1000, id: \.self) { index in
        SettingsItem("Item \(index)") {
            if index % 2 == 0 {
                Toggle("Toggle \(index)", isOn: $settings.testToggle)
            } else {
                Slider(value: $settings.testSlider, in: 0...100)
            }
        }
    }
}
```

**Performance Characteristics:**
- Initial load: Instantiates 1000 item nodes
- Memory: Moderate (1000 bindings to same properties)
- Rendering: Lazy (List virtualization)
- Scrolling: Smooth (SwiftUI manages viewport)
- Search: Slower (linear scan of 1000 items)

**Best For**: Long lists of similar settings (notification preferences per app, etc.)

---

### Test 3: Deep Nesting

**Scenario**: 10 levels deep with recursive groups

```swift
struct DeepNestedGroup: SettingsContent {
    let level: Int
    let maxLevel: Int
    @Bindable var settings: SettingsState

    var body: some SettingsContent {
        SettingsGroup("Level \(level)", systemImage: "folder") {
            ForEach(0..<10, id: \.self) { itemIndex in
                SettingsItem("Item \(level)-\(itemIndex)") {
                    Toggle("Enable", isOn: $settings.testToggle)
                }
            }

            if level < maxLevel {
                DeepNestedGroup(level: level + 1, maxLevel: maxLevel, settings: settings)
            }
        }
    }
}

// Usage:
DeepNestedGroup(level: 0, maxLevel: 10, settings: settings)
```

**Performance Characteristics:**
- Initial load: Recursive instantiation (can be slow)
- Memory: High (deep view hierarchy)
- Navigation: Complex (deep NavigationStack)
- Search: Deep tree traversal
- UX: Poor (users get lost in deep hierarchies)

**Best For**: Edge case testing only—**avoid in production**

**Recommendation**: Limit to 3-4 levels max for good UX

---

### Test 4: Mixed Navigation Patterns

**Scenario**: Alternating inline and navigation groups

```swift
ForEach(0..<20, id: \.self) { index in
    if index % 2 == 0 {
        SettingsGroup("Nav Group \(index)", systemImage: "arrow.right") {
            SettingsItem("Item") {
                Toggle("Enable", isOn: $settings.testToggle)
            }
        }
    } else {
        SettingsGroup("Inline Group \(index)", .inline) {
            SettingsItem("Item") {
                Toggle("Enable", isOn: $settings.testToggle)
            }
        }
    }
}
```

**Performance Characteristics:**
- Rendering: Efficient (SwiftUI handles switching)
- Navigation: Smooth (only nav groups create links)
- Search: Moderate (mixed node types)

**Best For**: Real-world settings with quick access + deep navigation

---

## Edge Cases

### Edge Case 1: Binding Contention

**Problem**: 1000+ controls bound to same property

```swift
// Anti-pattern:
var testToggle: Bool = false

ForEach(0..<1000) { _ in
    Toggle("Enable", isOn: $settings.testToggle)
}
```

**Impact**:
- All 1000 toggles update when property changes
- SwiftUI re-renders entire list
- Performance degrades with each update

**Solution**: Use unique properties or computed bindings

```swift
var toggles: [Bool] = Array(repeating: false, count: 1000)

ForEach(0..<1000, id: \.self) { index in
    Toggle("Enable", isOn: Binding(
        get: { settings.toggles[index] },
        set: { settings.toggles[index] = $0 }
    ))
}
```

---

### Edge Case 2: Memory Accumulation

**Problem**: Creating many UUID instances upfront

```swift
// Anti-pattern:
let items = (0..<10000).map { _ in UUID() }

ForEach(items, id: \.self) { id in
    SettingsItem("Item \(id)") { /* ... */ }
}
```

**Impact**:
- 10,000 UUIDs allocated immediately
- High memory footprint
- Slow initial load

**Solution**: Use integer IDs or lazy generation

```swift
ForEach(0..<10000, id: \.self) { index in
    SettingsItem("Item \(index)") { /* ... */ }
}
```

---

### Edge Case 3: Recursive Structure Overflow

**Problem**: Unbounded recursion depth

```swift
// Anti-pattern:
struct InfiniteGroup: SettingsContent {
    var body: some SettingsContent {
        SettingsGroup("Group") {
            InfiniteGroup()  // ❌ Stack overflow!
        }
    }
}
```

**Impact**:
- Stack overflow
- App crash

**Solution**: Always add termination condition

```swift
struct DeepGroup: SettingsContent {
    let level: Int
    let maxLevel: Int

    var body: some SettingsContent {
        SettingsGroup("Level \(level)") {
            if level < maxLevel {
                DeepGroup(level: level + 1, maxLevel: maxLevel)
            }
        }
    }
}
```

---

### Edge Case 4: Search Performance with Large Hierarchies

**Problem**: Searching 10,000+ nodes linearly

**Impact**:
- Slow search (10,000+ string comparisons)
- UI lag during typing

**Solution**: Implement indexed search or limit depth

```swift
struct IndexedSearch: SettingsSearch {
    private let index: [String: SettingsNode] = [:]  // Pre-built index

    func search(nodes: [SettingsNode], query: String) -> [SettingsSearchResult] {
        // Use index for O(1) lookup instead of O(n) traversal
        // ...
    }
}
```

---

## Performance Optimization Strategies

### Strategy 1: Lazy Loading

For very large settings (100+ groups), load on demand:

```swift
struct LazySettings: SettingsContent {
    @Bindable var settings: SettingsState
    @State private var loadedSections: Set<String> = ["general"]  // Load general by default

    var body: some SettingsContent {
        SettingsGroup("General") {
            basicSettings
        }

        if loadedSections.contains("advanced") {
            SettingsGroup("Advanced") {
                advancedSettings
            }
        } else {
            CustomSettingsGroup("Advanced") {
                Button("Load Advanced Settings") {
                    loadedSections.insert("advanced")
                }
                .padding()
            }
        }
    }
}
```

---

### Strategy 2: Pagination

For lists with 100+ items, paginate results:

```swift
struct PaginatedList: SettingsContent {
    let items: [Item]
    @State private var displayCount = 50

    var body: some SettingsContent {
        SettingsGroup("Items", .inline) {
            ForEach(items.prefix(displayCount), id: \.id) { item in
                SettingsItem(item.name) { /* ... */ }
            }

            if displayCount < items.count {
                CustomSettingsGroup("Load More") {
                    Button("Load More (\(items.count - displayCount) remaining)") {
                        displayCount += 50
                    }
                    .padding()
                }
            }
        }
    }
}
```

---

### Strategy 3: Virtualized Scrolling

SwiftUI automatically virtualizes List/ScrollView, but you can optimize further:

```swift
// Use LazyVStack instead of VStack for large inline groups
CustomSettingsGroup("Large List") {
    ScrollView {
        LazyVStack(spacing: 8) {
            ForEach(0..<1000, id: \.self) { index in
                Text("Item \(index)")
            }
        }
    }
}
```

---

### Strategy 4: Debounced Search

For large hierarchies, debounce search input:

```swift
struct DebouncedSearch: SettingsSearch {
    @State private var searchTask: Task<Void, Never>?

    func search(nodes: [SettingsNode], query: String) -> [SettingsSearchResult] {
        searchTask?.cancel()

        return Task {
            try? await Task.sleep(for: .milliseconds(300))  // Debounce 300ms
            return performSearch(nodes: nodes, query: query)
        }.value ?? []
    }

    private func performSearch(nodes: [SettingsNode], query: String) -> [SettingsSearchResult] {
        // Actual search implementation
        []
    }
}
```

---

## Benchmarking

### Measuring Performance

```swift
import os.signpost

let log = OSLog(subsystem: "com.yourapp.settings", category: "performance")

// Measure settings load time
let signpostID = OSSignpostID(log: log)
os_signpost(.begin, log: log, name: "SettingsLoad", signpostID: signpostID)

let settings = DemoSettings()

os_signpost(.end, log: log, name: "SettingsLoad", signpostID: signpostID)
```

**Instruments**: Use Xcode Instruments → Time Profiler to identify bottlenecks

---

## Best Practices

### Do's ✅

- **Keep hierarchies shallow** (< 4 levels)
- **Limit top-level groups** (< 50)
- **Use unique bindings** for similar controls
- **Implement lazy loading** for 100+ groups
- **Add search tags** for discoverability
- **Test with stress scenarios** before shipping
- **Monitor memory** with large state models

### Don'ts ❌

- **Don't create unbounded recursion**
- **Don't bind 100+ controls to same property**
- **Don't load 1000+ items upfront without pagination**
- **Don't skip termination conditions in recursive groups**
- **Don't ignore search performance** with large hierarchies
- **Don't nest groups more than 5-6 levels deep**

---

## Recommended Limits

For production apps, target these limits:

| Metric | Recommended | Maximum |
|--------|-------------|---------|
| Top-level groups | < 20 | 50 |
| Nesting depth | 2-3 | 5 |
| Items per group | < 50 | 100 |
| Total items | < 500 | 1000 |
| Search tags per group | 5-10 | 20 |
| State properties | < 50 | 100 |

Exceeding these limits may require:
- Lazy loading
- Pagination
- Custom search implementation
- Performance optimization

---

## Troubleshooting Performance Issues

### Issue: Slow initial load
**Diagnosis**: Too many groups/items instantiating upfront
**Solution**: Implement lazy loading or reduce initial hierarchy

### Issue: Slow search
**Diagnosis**: Large node tree (1000+ nodes)
**Solution**: Implement indexed search or limit depth

### Issue: High memory usage
**Diagnosis**: Too many bindings or large state model
**Solution**: Use unique properties, lazy loading, or split state

### Issue: Laggy scrolling
**Diagnosis**: Non-virtualized scrolling or complex item views
**Solution**: Use List instead of ScrollView+VStack, simplify items

### Issue: App crashes on deep navigation
**Diagnosis**: Unbounded recursion or stack overflow
**Solution**: Add termination conditions, limit depth to 5-6 levels

---

For API reference, see `references/api-reference.md`.
For production patterns, see `references/advanced-patterns.md`.
For styling optimization, see `references/styling-guide.md`.
