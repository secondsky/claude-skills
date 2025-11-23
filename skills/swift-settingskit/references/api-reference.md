# SettingsKit API Reference

Complete documentation for all SettingsKit protocols, types, and modifiers.

---

## Core Protocols

### SettingsContainer

The root protocol for building settings hierarchies.

```swift
protocol SettingsContainer {
    associatedtype Body: SettingsContent
    @SettingsContentBuilder var settingsBody: Body { get }
}
```

**Requirements:**
- Implement `settingsBody` property returning SettingsContent
- Use in SwiftUI views by calling initializer: `MySettings()`

**Example:**
```swift
struct MySettings: SettingsContainer {
    @Environment(AppSettings.self) var appSettings

    var settingsBody: some SettingsContent {
        @Bindable var settings = appSettings

        SettingsGroup("General", systemImage: "gear") {
            // Settings items...
        }
    }
}
```

**Usage in App:**
```swift
MySettings()
    .environment(AppSettings())
    .settingsStyle(.sidebar)
```

---

### SettingsContent

Protocol for composable settings content (groups, items, custom groups).

```swift
protocol SettingsContent {
    associatedtype Body: SettingsContent
    @SettingsContentBuilder var body: Body { get }
}
```

**Conforming Types:**
- `SettingsGroup` - Navigation groups or section headers
- `SettingsItem` - Individual settings controls
- `CustomSettingsGroup` - Custom SwiftUI content
- Custom types you create for modular settings

**Example Custom SettingsContent:**
```swift
struct NotificationSettings: SettingsContent {
    @Bindable var settings: AppSettings

    var body: some SettingsContent {
        SettingsGroup("Notifications", systemImage: "bell") {
            SettingsItem("Enable") {
                Toggle("Enable", isOn: $settings.notificationsEnabled)
            }
        }
    }
}
```

---

### SettingsStyle

Protocol for customizing settings presentation.

```swift
protocol SettingsStyle {
    associatedtype ContainerView: View
    associatedtype GroupView: View
    associatedtype ItemView: View

    func makeContainer(configuration: ContainerConfiguration) -> ContainerView
    func makeGroup(configuration: GroupConfiguration) -> GroupView
    func makeItem(configuration: ItemConfiguration) -> ItemView
}
```

**Built-in Styles:**
- `.sidebar` - NavigationSplitView with selection-based navigation (default)
- `.single` - Single NavigationStack with push navigation

**Configuration Types:**
- `ContainerConfiguration` - Contains navigation path, title, content
- `GroupConfiguration` - Contains label, presentation mode, content
- `ItemConfiguration` - Contains label, content

**Example Custom Style:**
```swift
struct CompactStyle: SettingsStyle {
    func makeContainer(configuration: ContainerConfiguration) -> some View {
        NavigationStack(path: configuration.navigationPath) {
            ScrollView {
                VStack(spacing: 12) {
                    configuration.content
                }
                .padding(.horizontal, 8)
            }
            .navigationTitle(configuration.title)
        }
    }

    func makeGroup(configuration: GroupConfiguration) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            configuration.label.font(.subheadline).bold()
            configuration.content
        }
        .padding(.vertical, 8)
    }

    func makeItem(configuration: ItemConfiguration) -> some View {
        HStack(spacing: 12) {
            configuration.label.font(.callout)
            Spacer()
            configuration.content
        }
    }
}
```

---

### SettingsSearch

Protocol for custom search implementations.

```swift
protocol SettingsSearch {
    func search(nodes: [SettingsNode], query: String) -> [SettingsSearchResult]
}
```

**Parameters:**
- `nodes`: Array of SettingsNode metadata (title, icon, tags, children)
- `query`: User's search string

**Returns:** Array of SettingsSearchResult containing:
- `node`: Matching SettingsNode
- `score`: Relevance score (higher = better match)
- `path`: Navigation path to result

**Example Fuzzy Search:**
```swift
struct FuzzySearch: SettingsSearch {
    func search(nodes: [SettingsNode], query: String) -> [SettingsSearchResult] {
        let normalizedQuery = query.lowercased().trimmingCharacters(in: .whitespaces)
        var results: [SettingsSearchResult] = []

        func searchRecursive(node: SettingsNode, path: [UUID]) {
            let title = node.title.lowercased()
            let tags = node.tags.map { $0.lowercased() }

            var score = 0
            if title == normalizedQuery {
                score = 1000
            } else if title.hasPrefix(normalizedQuery) {
                score = 500
            } else if title.contains(normalizedQuery) {
                score = 300
            } else if tags.contains(where: { $0.contains(normalizedQuery) }) {
                score = 100
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

        for node in nodes {
            searchRecursive(node: node, path: [])
        }

        return results.sorted { $0.score > $1.score }
    }
}
```

---

## Core Types

### SettingsGroup

Creates navigation groups (default) or inline section headers.

```swift
struct SettingsGroup<Content: SettingsContent>: SettingsContent {
    init(_ title: String,
         systemImage: String? = nil,
         _ presentationMode: SettingsGroupPresentationMode = .navigation,
         @SettingsContentBuilder content: () -> Content)
}
```

**Parameters:**
- `title`: Display name for the group
- `systemImage`: SF Symbol name (optional)
- `presentationMode`: `.navigation` (default, tappable row) or `.inline` (section header)
- `content`: Closure returning SettingsContent (items, nested groups, etc.)

**Examples:**
```swift
// Navigation group (default)
SettingsGroup("Display", systemImage: "sun.max") {
    SettingsItem("Brightness") { /* ... */ }
}

// Inline section header
SettingsGroup("Quick Settings", .inline) {
    SettingsItem("Dark Mode") { /* ... */ }
}

// Nested groups
SettingsGroup("Account", systemImage: "person") {
    SettingsGroup("Profile") {
        SettingsItem("Name") { /* ... */ }
    }
    SettingsGroup("Security") {
        SettingsItem("Password") { /* ... */ }
    }
}
```

**Modifiers:**
- `.settingsTags([String])` - Add search keywords
- `.searchable(Bool)` - Control search visibility (default: true)

---

### SettingsItem

Individual setting control wrapper.

```swift
struct SettingsItem<Content: View>: SettingsContent {
    init(_ title: String,
         icon: String? = nil,
         searchable: Bool = true,
         @ViewBuilder content: () -> Content)
}
```

**Parameters:**
- `title`: Display label for the setting
- `icon`: SF Symbol name (optional, rarely used compared to group icons)
- `searchable`: Whether item appears in search (default: true)
- `content`: SwiftUI view (Toggle, Slider, TextField, Picker, etc.)

**Examples:**
```swift
// Toggle
SettingsItem("Notifications") {
    Toggle("Enable", isOn: $settings.notificationsEnabled)
}

// Slider with value display
SettingsItem("Volume") {
    VStack {
        Slider(value: $settings.volume, in: 0...100)
        Text("\(Int(settings.volume))%")
            .font(.caption)
            .foregroundStyle(.secondary)
    }
}

// Picker
SettingsItem("Theme") {
    Picker("", selection: $settings.theme) {
        Text("Light").tag(Theme.light)
        Text("Dark").tag(Theme.dark)
        Text("Auto").tag(Theme.auto)
    }
    .pickerStyle(.segmented)
}

// TextField
SettingsItem("Username") {
    TextField("Enter username", text: $settings.username)
        .textFieldStyle(.roundedBorder)
}

// Custom complex control
SettingsItem("Color Picker") {
    HStack {
        ColorPicker("Accent Color", selection: $settings.accentColor)
        Button("Reset") {
            settings.accentColor = .blue
        }
        .buttonStyle(.bordered)
    }
}

// Non-searchable (status display)
SettingsItem("Connection Status", searchable: false) {
    Text(settings.isConnected ? "Connected" : "Disconnected")
        .foregroundStyle(settings.isConnected ? .green : .red)
}
```

---

### CustomSettingsGroup

Custom SwiftUI content with search metadata.

```swift
struct CustomSettingsGroup<Content: View>: SettingsContent {
    init(_ title: String,
         systemImage: String? = nil,
         @ViewBuilder content: () -> Content)
}
```

**Parameters:**
- `title`: Display name (searchable)
- `systemImage`: SF Symbol (searchable)
- `content`: Any SwiftUI view

**Key Behavior:**
- Title, icon, and tags are searchable
- Content is rendered as-is (NOT indexed for search)
- Useful for complex custom UI, data visualization, action buttons

**Examples:**
```swift
// Developer tools panel
CustomSettingsGroup("Developer Tools", systemImage: "hammer")
    .settingsTags(["debug", "logs", "testing"])
{
    VStack(spacing: 16) {
        GroupBox("Build Information") {
            VStack(alignment: .leading, spacing: 8) {
                Text("Version: \(appVersion)")
                Text("Build: \(buildNumber)")
                Text("Environment: \(environment)")
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }

        Button("Export Logs") {
            exportLogs()
        }
        .buttonStyle(.borderedProminent)

        Button("Clear Cache") {
            clearCache()
        }
        .buttonStyle(.bordered)
    }
    .padding()
}

// Custom data visualization
CustomSettingsGroup("Usage Statistics", systemImage: "chart.bar")
    .settingsTags(["analytics", "stats", "usage"])
{
    ScrollView {
        VStack(spacing: 20) {
            UsageChart(data: settings.usageData)
            StorageBreakdown(data: settings.storageData)
            ActivityHeatmap(data: settings.activityData)
        }
        .padding()
    }
}
```

---

## Modifiers

### .settingsTags([String])

Add search keywords to groups for better discoverability.

```swift
SettingsGroup("Notifications", systemImage: "bell")
    .settingsTags(["alerts", "sounds", "badges", "push"])
{
    // Settings items...
}
```

**Behavior:**
- Tags supplement title/icon for search matching
- Score: 100 per matching tag (lower than title matches)
- Useful for synonyms, common terminology, error keywords

---

### .settingsStyle(SettingsStyle)

Apply presentation style to SettingsContainer.

```swift
MySettings()
    .settingsStyle(.sidebar)  // Default
    .settingsStyle(.single)   // Single column
    .settingsStyle(MyCustomStyle())  // Custom
```

**Built-in Styles:**
- **Sidebar**: NavigationSplitView, selection-based navigation, split view on iPad/Mac
- **Single**: NavigationStack, push navigation, single column on all platforms

---

### .settingsSearch(SettingsSearch)

Replace default search with custom implementation.

```swift
MySettings()
    .settingsSearch(FuzzySearch())
```

**Use Cases:**
- Fuzzy matching
- Weighted scoring
- Custom language support
- Integration with external search services

---

## Data Types

### SettingsNode

Metadata for search and navigation (not user-created).

```swift
struct SettingsNode {
    let id: UUID
    let title: String
    let icon: String?
    let tags: [String]
    let presentationMode: SettingsGroupPresentationMode
    let children: [SettingsNode]
}
```

**Note:** SettingsKit generates nodes automatically via `makeNodes()` method on SettingsContent. Users don't create these directly.

---

### SettingsSearchResult

Search result with metadata (not user-created).

```swift
struct SettingsSearchResult {
    let node: SettingsNode
    let score: Int
    let path: [UUID]
}
```

**Fields:**
- `node`: Matching SettingsNode
- `score`: Relevance (exact=1000, prefix=500, contains=300, tag=100)
- `path`: Navigation path to reach result

---

### SettingsGroupPresentationMode

Controls how groups appear.

```swift
enum SettingsGroupPresentationMode {
    case navigation  // Tappable row (default)
    case inline      // Section header
}
```

**Usage:**
```swift
SettingsGroup("General", .navigation) { /* ... */ }  // Default
SettingsGroup("Quick Settings", .inline) { /* ... */ }  // Section header
```

---

## Result Builders

### @SettingsContentBuilder

Result builder for composing multiple SettingsContent items.

```swift
@resultBuilder
struct SettingsContentBuilder {
    static func buildBlock<Content: SettingsContent>(_ content: Content) -> Content
    // ... additional overloads for multiple items, if/else, etc.
}
```

**Usage:**
```swift
var settingsBody: some SettingsContent {
    SettingsGroup("Group 1") { /* ... */ }
    SettingsGroup("Group 2") { /* ... */ }

    if showAdvanced {
        SettingsGroup("Advanced") { /* ... */ }
    }
}
```

**Supports:**
- Multiple items (up to 10 per block)
- Conditionals (`if`, `if-else`)
- Optional values (`if let`)
- Loops (via `ForEach` in SettingsContent)

---

## Environment Values

### AppSettings in Environment

SettingsKit doesn't provide environment keys—you define your own settings model.

```swift
@Observable
class AppSettings {
    var value: Bool = true
}

// In App:
.environment(AppSettings())

// In SettingsContainer:
@Environment(AppSettings.self) var appSettings
```

---

## Platform-Specific Behaviors

### iOS
- `.sidebar` style uses NavigationSplitView with compact/regular size class adaptation
- `.single` style uses NavigationStack
- Search via `.searchable()` modifier

### macOS
- `.sidebar` style uses NavigationSplitView with sidebar always visible
- Destination-based NavigationLink (not selection-based) to prevent control update issues
- Detail pane has nested NavigationStack for deep hierarchies

### watchOS / tvOS / visionOS
- Platform adapts navigation automatically
- Search behavior consistent across platforms
- Rendering optimized for input methods (Digital Crown, remote, hand tracking)

---

## Advanced API Usage

### Dynamic Settings Generation

Use `ForEach` for data-driven settings:

```swift
struct DynamicSettings: SettingsContent {
    let accounts: [Account]

    var body: some SettingsContent {
        SettingsGroup("Accounts", systemImage: "person.3") {
            ForEach(accounts) { account in
                SettingsGroup(account.name, systemImage: "person.circle") {
                    SettingsItem("Email") {
                        Text(account.email)
                    }
                    SettingsItem("Status") {
                        Text(account.isActive ? "Active" : "Inactive")
                    }
                }
            }
        }
    }
}
```

### Conditional Content with Complex Logic

```swift
var settingsBody: some SettingsContent {
    SettingsGroup("General") { /* ... */ }

    if userHasPremium {
        SettingsGroup("Premium Features") { /* ... */ }
    }

    if !userHasPremium {
        CustomSettingsGroup("Upgrade") {
            UpgradePromptView()
        }
    }

    if developerMode {
        SettingsGroup("Developer") { /* ... */ }
    }
}
```

### Computed SettingsContent Properties

```swift
var notificationSettings: some SettingsContent {
    SettingsGroup("Notifications") {
        SettingsItem("Enable") {
            Toggle("Enable", isOn: $settings.notificationsEnabled)
        }
    }
}

var settingsBody: some SettingsContent {
    notificationSettings
    appearanceSettings
    privacySettings
}
```

---

## Type Reference Summary

| Type | Protocol/Struct | Purpose |
|------|----------------|---------|
| `SettingsContainer` | Protocol | Root settings hierarchy |
| `SettingsContent` | Protocol | Composable settings content |
| `SettingsStyle` | Protocol | Custom presentation styles |
| `SettingsSearch` | Protocol | Custom search implementations |
| `SettingsGroup` | Struct | Navigation groups/sections |
| `SettingsItem` | Struct | Individual controls |
| `CustomSettingsGroup` | Struct | Custom SwiftUI content |
| `SettingsNode` | Struct | Search/nav metadata |
| `SettingsSearchResult` | Struct | Search results |
| `SettingsGroupPresentationMode` | Enum | Group display mode |

---

## Common API Patterns

### Pattern: Modular Settings Architecture

```swift
// Models
@Observable class AppSettings { /* ... */ }

// Settings modules
struct GeneralSettings: SettingsContent { /* ... */ }
struct PrivacySettings: SettingsContent { /* ... */ }
struct AdvancedSettings: SettingsContent { /* ... */ }

// Root container
struct MySettings: SettingsContainer {
    @Environment(AppSettings.self) var appSettings

    var settingsBody: some SettingsContent {
        @Bindable var settings = appSettings

        GeneralSettings(settings: settings)
        PrivacySettings(settings: settings)
        AdvancedSettings(settings: settings)
    }
}

// App integration
MySettings()
    .environment(AppSettings())
    .settingsStyle(.sidebar)
```

---

See `references/advanced-patterns.md` for implementation examples.
Styling customization details are in `references/styling-guide.md`.
Search architecture and implementation: `references/search-implementation.md`.
