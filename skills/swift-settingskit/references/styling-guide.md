# SettingsKit Styling Guide

Comprehensive guide to customizing settings appearance and platform-specific behaviors.

---

## Built-in Styles

### Sidebar Style (Default)

Uses `NavigationSplitView` with selection-based navigation.

```swift
MySettings()
    .settingsStyle(.sidebar)
```

**Behavior:**
- **iPad/Mac**: Split view with sidebar and detail pane
- **iPhone**: Compact layout with slide-over navigation
- **Selection-based**: Tap group in sidebar → detail pane updates
- **Deep hierarchies**: Detail pane has nested NavigationStack

**Visual Structure:**
```
┌──────────────┬─────────────────────────┐
│  Sidebar     │  Detail Pane            │
│              │                         │
│  General  →  │  ┌─ Notifications       │
│  Privacy     │  │  Toggle: Enable      │
│  Advanced    │  │  Toggle: Sound       │
│              │  └─ Badges              │
└──────────────┴─────────────────────────┘
```

**When to use:**
- Multi-platform apps (iPad, Mac, iPhone adaptive)
- Complex settings with many top-level groups
- Professional/productivity apps

---

### Single Style

Uses single `NavigationStack` with push navigation.

```swift
MySettings()
    .settingsStyle(.single)
```

**Behavior:**
- **All platforms**: Single column list
- **Push navigation**: Tap group → push to new screen
- **Simpler state**: Linear navigation stack

**Visual Structure:**
```
┌─────────────────────┐
│  Settings           │
│                     │
│  General         →  │
│  Privacy         →  │
│  Advanced        →  │
│                     │
└─────────────────────┘

Tap General →

┌─────────────────────┐
│  ← General          │
│                     │
│  Notifications   →  │
│  Display         →  │
│  Sounds          →  │
│                     │
└─────────────────────┘
```

**When to use:**
- iPhone-first apps
- Simple settings (< 5 top-level groups)
- Minimal, focused UIs

---

## Custom Styles

### Creating a Custom Style

Conform to `SettingsStyle` protocol:

```swift
struct MyCustomStyle: SettingsStyle {
    func makeContainer(configuration: ContainerConfiguration) -> some View {
        // Build root container (navigation, layout, etc.)
    }

    func makeGroup(configuration: GroupConfiguration) -> some View {
        // Build group appearance
    }

    func makeItem(configuration: ItemConfiguration) -> some View {
        // Build item appearance
    }
}
```

**Configuration Types:**

**ContainerConfiguration:**
```swift
struct ContainerConfiguration {
    let navigationPath: Binding<[UUID]>  // Current navigation state
    let title: String                    // Root title
    let content: Content                 // SettingsContent body
}
```

**GroupConfiguration:**
```swift
struct GroupConfiguration {
    let label: Label                              // Group title + icon view
    let presentationMode: SettingsGroupPresentationMode  // .navigation or .inline
    let content: Content                          // Group's settings items
}
```

**ItemConfiguration:**
```swift
struct ItemConfiguration {
    let label: Label    // Item title + icon view
    let content: Content  // Item's control (Toggle, Slider, etc.)
}
```

---

### Example: Compact Card Style

Settings displayed as cards with compact spacing:

```swift
struct CompactCardStyle: SettingsStyle {
    func makeContainer(configuration: ContainerConfiguration) -> some View {
        NavigationStack(path: configuration.navigationPath) {
            ScrollView {
                VStack(spacing: 16) {
                    configuration.content
                }
                .padding()
            }
            .navigationTitle(configuration.title)
            .background(Color(.systemGroupedBackground))
        }
    }

    func makeGroup(configuration: GroupConfiguration) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            // Group header
            HStack {
                configuration.label
                    .font(.headline)
                    .foregroundStyle(.primary)
                Spacer()
            }
            .padding(.horizontal, 16)
            .padding(.top, 12)

            // Group content
            VStack(spacing: 8) {
                configuration.content
            }
            .padding(.horizontal, 16)
            .padding(.bottom, 12)
        }
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .shadow(color: .black.opacity(0.05), radius: 4, y: 2)
    }

    func makeItem(configuration: ItemConfiguration) -> some View {
        HStack(spacing: 12) {
            configuration.label
                .font(.callout)
                .foregroundStyle(.secondary)

            Spacer()

            configuration.content
                .font(.body)
        }
        .padding(.vertical, 6)
    }
}

// Usage:
MySettings()
    .settingsStyle(CompactCardStyle())
```

---

### Example: macOS Preferences Style

Classic macOS preferences pane appearance:

```swift
struct MacOSPreferencesStyle: SettingsStyle {
    func makeContainer(configuration: ContainerConfiguration) -> some View {
        NavigationSplitView {
            // Sidebar with icons
            List(selection: Binding(
                get: { configuration.navigationPath.wrappedValue.last },
                set: { newValue in
                    if let id = newValue {
                        configuration.navigationPath.wrappedValue = [id]
                    }
                }
            )) {
                configuration.content
            }
            .listStyle(.sidebar)
            .frame(minWidth: 200)
        } detail: {
            // Detail pane with toolbar
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    configuration.content
                }
                .padding(20)
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            .toolbar {
                ToolbarItem {
                    Button("Reset to Defaults") {
                        // Implement reset behavior here
                    }
                }
            }
        }
        .navigationTitle(configuration.title)
    }

    func makeGroup(configuration: GroupConfiguration) -> some View {
        VStack(alignment: .leading, spacing: 16) {
            // Section divider
            Divider()

            // Section header
            configuration.label
                .font(.title3)
                .fontWeight(.semibold)

            // Section content
            VStack(alignment: .leading, spacing: 12) {
                configuration.content
            }
        }
    }

    func makeItem(configuration: ItemConfiguration) -> some View {
        HStack(alignment: .top, spacing: 16) {
            configuration.label
                .font(.body)
                .frame(width: 150, alignment: .trailing)
                .foregroundStyle(.secondary)

            configuration.content
                .frame(maxWidth: 300, alignment: .leading)

            Spacer()
        }
    }
}
```

---

### Example: Minimal List Style

Bare-bones list without cards or sections:

```swift
struct MinimalListStyle: SettingsStyle {
    func makeContainer(configuration: ContainerConfiguration) -> some View {
        NavigationStack(path: configuration.navigationPath) {
            List {
                configuration.content
            }
            .listStyle(.plain)
            .navigationTitle(configuration.title)
        }
    }

    func makeGroup(configuration: GroupConfiguration) -> some View {
        Section {
            configuration.content
        } header: {
            configuration.label
                .font(.caption)
                .textCase(.uppercase)
                .foregroundStyle(.secondary)
        }
    }

    func makeItem(configuration: ItemConfiguration) -> some View {
        HStack {
            configuration.label
            Spacer()
            configuration.content
        }
    }
}
```

---

## Platform-Specific Styling

### iOS-Specific Adaptations

```swift
struct iOSAdaptiveStyle: SettingsStyle {
    @Environment(\.horizontalSizeClass) var sizeClass

    func makeContainer(configuration: ContainerConfiguration) -> some View {
        Group {
            if sizeClass == .compact {
                // iPhone: Single column
                NavigationStack(path: configuration.navigationPath) {
                    List {
                        configuration.content
                    }
                    .listStyle(.insetGrouped)
                    .navigationTitle(configuration.title)
                }
            } else {
                // iPad: Split view
                NavigationSplitView {
                    List(selection: Binding(
                        get: { configuration.navigationPath.wrappedValue.last },
                        set: { newValue in
                            if let id = newValue {
                                configuration.navigationPath.wrappedValue = [id]
                            }
                        }
                    )) {
                        configuration.content
                    }
                    .navigationTitle(configuration.title)
                } detail: {
                    Text("Select a setting")
                        .foregroundStyle(.secondary)
                }
            }
        }
    }

    func makeGroup(configuration: GroupConfiguration) -> some View {
        Section {
            configuration.content
        } header: {
            HStack {
                configuration.label
                Spacer()
            }
        }
    }

    func makeItem(configuration: ItemConfiguration) -> some View {
        HStack {
            configuration.label
            Spacer()
            configuration.content
        }
    }
}
```

---

### macOS-Specific Styling

```swift
struct macOSNativeStyle: SettingsStyle {
    func makeContainer(configuration: ContainerConfiguration) -> some View {
        NavigationSplitView {
            List(selection: Binding(
                get: { configuration.navigationPath.wrappedValue.last },
                set: { newValue in
                    if let id = newValue {
                        configuration.navigationPath.wrappedValue = [id]
                    }
                }
            )) {
                configuration.content
            }
            .listStyle(.sidebar)
            .frame(minWidth: 180, idealWidth: 200)
        } detail: {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    configuration.content
                }
                .padding()
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            .frame(minWidth: 400, idealWidth: 500)
        }
        .navigationSplitViewStyle(.balanced)
    }

    func makeGroup(configuration: GroupConfiguration) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            configuration.label
                .font(.headline)
            Divider()
            configuration.content
        }
    }

    func makeItem(configuration: ItemConfiguration) -> some View {
        HStack {
            configuration.label
                .frame(minWidth: 120, alignment: .trailing)
            configuration.content
                .frame(maxWidth: 250, alignment: .leading)
            Spacer()
        }
        .padding(.vertical, 4)
    }
}
```

---

## Styling Labels

### Customizing Group Labels

Groups provide labels via configuration—style them in `makeGroup`:

```swift
func makeGroup(configuration: GroupConfiguration) -> some View {
    VStack(alignment: .leading) {
        // Custom label styling
        configuration.label
            .font(.title2)
            .fontWeight(.bold)
            .foregroundStyle(
                LinearGradient(
                    colors: [.blue, .purple],
                    startPoint: .leading,
                    endPoint: .trailing
                )
            )
            .padding(.bottom, 8)

        configuration.content
    }
}
```

### Customizing Item Labels

Similarly, style item labels in `makeItem`:

```swift
func makeItem(configuration: ItemConfiguration) -> some View {
    HStack {
        // Custom label with icon emphasis
        configuration.label
            .font(.callout)
            .foregroundStyle(.primary)
            .padding(.vertical, 8)
            .padding(.horizontal, 12)
            .background(Color.accentColor.opacity(0.1))
            .clipShape(RoundedRectangle(cornerRadius: 8))

        Spacer()

        configuration.content
    }
}
```

---

## Color Schemes and Themes

### Dark Mode Support

SwiftUI automatically handles dark mode—customize if needed:

```swift
struct ThemedStyle: SettingsStyle {
    @Environment(\.colorScheme) var colorScheme

    func makeGroup(configuration: GroupConfiguration) -> some View {
        VStack(alignment: .leading) {
            configuration.label
            configuration.content
        }
        .padding()
        .background(
            colorScheme == .dark
                ? Color(.systemGray6)
                : Color(.systemGray5)
        )
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    // ... other methods
}
```

### Custom Accent Colors

```swift
MySettings()
    .settingsStyle(MyStyle())
    .tint(.purple)  // Accent color for toggles, pickers, etc.
```

---

## Animations and Transitions

### Animated Group Expansion

```swift
struct AnimatedStyle: SettingsStyle {
    func makeGroup(configuration: GroupConfiguration) -> some View {
        VStack(alignment: .leading) {
            configuration.label
                .font(.headline)

            configuration.content
                .transition(.slide.combined(with: .opacity))
        }
        // Note: For explicit animation control, add @State variables
        // and use .animation(.easeInOut, value: yourStateVariable)
    }

    // ... other methods
}
```

---

## Responsive Layouts

### Dynamic Spacing Based on Device

```swift
struct ResponsiveStyle: SettingsStyle {
    @Environment(\.horizontalSizeClass) var sizeClass

    var spacing: CGFloat {
        sizeClass == .compact ? 12 : 20
    }

    var padding: CGFloat {
        sizeClass == .compact ? 16 : 24
    }

    func makeContainer(configuration: ContainerConfiguration) -> some View {
        NavigationStack(path: configuration.navigationPath) {
            ScrollView {
                VStack(spacing: spacing) {
                    configuration.content
                }
                .padding(padding)
            }
            .navigationTitle(configuration.title)
        }
    }

    // ... other methods
}
```

---

## Accessibility Enhancements

### Dynamic Type Support

```swift
struct AccessibleStyle: SettingsStyle {
    @Environment(\.dynamicTypeSize) var dynamicTypeSize

    func makeItem(configuration: ItemConfiguration) -> some View {
        if dynamicTypeSize >= .xxxLarge {
            // Stack vertically for large text
            VStack(alignment: .leading, spacing: 8) {
                configuration.label
                configuration.content
            }
        } else {
            // Horizontal layout for normal text
            HStack {
                configuration.label
                Spacer()
                configuration.content
            }
        }
    }

    // ... other methods
}
```

### VoiceOver Labels

Add accessibility labels to groups/items:

```swift
SettingsItem("Notifications") {
    Toggle("Enable", isOn: $settings.notificationsEnabled)
}
.accessibilityLabel("Notifications toggle")
.accessibilityHint("Enable or disable notifications")
```

---

## Common Styling Patterns

### Pattern: Card-Based Layout

```swift
struct CardStyle: SettingsStyle {
    func makeGroup(configuration: GroupConfiguration) -> some View {
        VStack(alignment: .leading, spacing: 16) {
            configuration.label
                .font(.title3)
                .fontWeight(.semibold)
                .padding(.horizontal)
                .padding(.top)

            VStack(spacing: 0) {
                configuration.content
            }
            .background(Color(.secondarySystemGroupedBackground))
            .clipShape(RoundedRectangle(cornerRadius: 12))
            .padding(.horizontal)
            .padding(.bottom)
        }
    }

    func makeItem(configuration: ItemConfiguration) -> some View {
        HStack {
            configuration.label
            Spacer()
            configuration.content
        }
        .padding()
        .background(Color(.systemBackground))
    }
}
```

### Pattern: Form-Like Appearance

```swift
struct FormStyle: SettingsStyle {
    func makeItem(configuration: ItemConfiguration) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            configuration.label
                .font(.caption)
                .foregroundStyle(.secondary)

            configuration.content
                .padding(12)
                .background(Color(.systemGray6))
                .clipShape(RoundedRectangle(cornerRadius: 8))
        }
        .padding(.vertical, 4)
    }

    // ... other methods
}
```

### Pattern: Compact Mobile Style

```swift
struct CompactMobileStyle: SettingsStyle {
    func makeGroup(configuration: GroupConfiguration) -> some View {
        VStack(spacing: 0) {
            configuration.content
        }
    }

    func makeItem(configuration: ItemConfiguration) -> some View {
        HStack {
            configuration.label
                .font(.body)
            Spacer()
            configuration.content
                .font(.body)
                .foregroundStyle(.secondary)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(Color(.systemBackground))
    }
}
```

---

## Best Practices

### Do's ✅

- **Match platform conventions** - iOS users expect inset grouped lists, macOS users expect split views
- **Respect color scheme** - Use semantic colors (`.primary`, `.secondary`) for automatic dark mode
- **Support dynamic type** - Test with accessibility text sizes
- **Keep navigation simple** - Don't add custom navigation on top of SettingsKit's
- **Use semantic colors** - Avoid hardcoded colors that break in dark mode

### Don'ts ❌

- **Don't wrap container in extra navigation** - SettingsKit manages NavigationStack/NavigationSplitView
- **Don't ignore size classes** - iPad/iPhone need different layouts
- **Don't use fixed widths** - Breaks dynamic type and accessibility
- **Don't override navigationPath binding** - Corrupts SettingsKit's state management
- **Don't add custom search UI** - SettingsKit provides `.searchable()` support

---

## Troubleshooting Style Issues

### Issue: Custom style not applying
**Solution:** Verify `.settingsStyle()` is called on SettingsContainer instance, not inside settingsBody

### Issue: Navigation broken in custom style
**Solution:** Don't create NavigationStack if SettingsKit already provides one (check sidebar/single styles)

### Issue: Colors don't adapt to dark mode
**Solution:** Use semantic colors (`.primary`, `.secondary`) instead of fixed colors (`.black`, `.white`)

### Issue: Layout breaks with large text
**Solution:** Use dynamic spacing/padding based on `@Environment(\.dynamicTypeSize)`

---

For API details, see `references/api-reference.md`.
For advanced patterns, see `references/advanced-patterns.md`.
For search customization, see `references/search-implementation.md`.
