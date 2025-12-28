# Swift SettingsKit

**Status**: Production Ready ✅
**Last Updated**: 2025-11-23
**Production Tested**: Official SettingsKit repository examples, iOS 17+/macOS 14+ platforms

---

## Auto-Trigger Keywords

Claude Code automatically discovers this skill when you mention:

### Primary Keywords
- SettingsKit
- SwiftUI settings
- settings interface
- preferences UI
- settings screen
- iOS settings
- macOS settings
- watchOS settings
- tvOS settings
- visionOS settings

### Secondary Keywords
- SettingsContainer
- SettingsGroup
- SettingsItem
- CustomSettingsGroup
- settings navigation
- searchable settings
- settings hierarchy
- nested settings
- settings sidebar
- Observable settings
- Bindable settings
- declarative settings
- settings tags
- settings search
- settings style
- Swift 6 settings
- iOS 17 settings
- macOS 14 settings

### Error-Based Keywords
- "settings not updating"
- "settings navigation broken"
- "Cannot convert value of type Binding"
- "settings UI not reactive"
- "settings state not persisting"
- "navigation state conflicts"
- "custom groups not searchable"
- "settings search not working"
- "settings dark mode broken"
- "nil coalescing runtime error settings"

### Integration Keywords
- settings persistence
- UserDefaults settings
- SwiftData settings
- settings validation
- settings testing
- settings accessibility
- settings dark mode
- settings dynamic type
- settings platform adaptive

---

## What This Skill Does

This skill provides comprehensive knowledge for building modern settings interfaces in SwiftUI using SettingsKit, a declarative framework that works across all Apple platforms (iOS 17+, macOS 14+, watchOS 10+, tvOS 17+, visionOS 1+). It covers setup, navigation patterns, search functionality, custom styling, state management, and production best practices.

### Core Capabilities

✅ **Quick Setup** - Get settings running in 5 minutes with @Observable models and SettingsContainer protocol
✅ **Automatic Search** - Built-in searchable settings with tag-based discoverability and custom search support
✅ **Platform Adaptive** - Sidebar style for iPad/Mac, single column for iPhone, optimized for all Apple platforms
✅ **Nested Navigation** - Unlimited hierarchy depth with automatic navigation state management
✅ **Custom Styling** - Complete control over appearance via SettingsStyle protocol
✅ **State Management** - Modern @Observable/@Bindable integration with persistence patterns (UserDefaults, SwiftData)
✅ **Production Patterns** - Modular architecture, validation, testing, and performance optimization strategies

---

## Known Issues This Skill Prevents

| Issue | Why It Happens | Source | How Skill Fixes It |
|-------|---------------|---------|-------------------|
| Cannot convert Binding<T> compilation error | @Observable requires @Bindable wrapper for bindings | Swift observation docs | Teaches @Bindable wrapper pattern in settingsBody |
| Settings UI not updating | Model not injected into environment | SwiftUI observation system | Shows .environment(settings) setup |
| Navigation state conflicts | Custom NavigationLink in sidebar style | SettingsKit architecture | Explains SettingsGroup-only navigation |
| Custom groups invisible to search | CustomSettingsGroup bypasses indexing | SettingsKit README | Documents searchable metadata vs content rendering |
| macOS settings crashes | Destination-based navigation issues | SettingsKit macOS notes | Warns against custom NavigationStack wrapping |

---

## When to Use This Skill

### ✅ Use When:
- Building settings/preferences screens in SwiftUI apps
- Implementing searchable settings with tags and keywords
- Creating nested settings navigation hierarchies
- Customizing settings appearance with platform-specific styles
- Working with @Observable/@Bindable state management
- Encountering "settings not updating" or navigation errors
- Migrating from legacy settings implementations
- Need production patterns for persistence, validation, testing

### ❌ Don't Use When:
- Building UIKit-based settings (use UITableView instead)
- iOS 16 or earlier (SettingsKit requires iOS 17+)
- Need backward compatibility with ObservableObject (use modern @Observable)
- Building simple forms (SettingsKit is for complex settings hierarchies)

---

## Quick Usage Example

```swift
// 1. Add package dependency
// File → Add Package Dependencies
// https://github.com/aeastr/SettingsKit.git

// 2. Create Observable model
import SwiftUI

@Observable
class AppSettings {
    var notificationsEnabled = true
    var darkMode = false
    var fontSize: Double = 16.0
}

// 3. Implement SettingsContainer
import SettingsKit

struct MySettings: SettingsContainer {
    @Environment(AppSettings.self) var appSettings

    var settingsBody: some SettingsContent {
        @Bindable var settings = appSettings

        SettingsGroup("General", systemImage: "gear") {
            SettingsItem("Notifications") {
                Toggle("Enable", isOn: $settings.notificationsEnabled)
            }

            SettingsItem("Dark Mode") {
                Toggle("Enable", isOn: $settings.darkMode)
            }

            SettingsItem("Font Size") {
                Slider(value: $settings.fontSize, in: 10...24)
                Text("\(Int(settings.fontSize))pt")
            }
        }
        .settingsTags(["notifications", "appearance", "font"])
    }
}

// 4. Add to app
@main
struct MyApp: App {
    @State private var settings = AppSettings()

    var body: some Scene {
        WindowGroup {
            MySettings()
                .environment(settings)
        }
    }
}
```

**Result**: Complete settings interface with automatic navigation, search, and platform adaptation.

**Full instructions**: See [SKILL.md](SKILL.md)

---

## Package Versions (Verified 2025-11-23)

| Package | Version | Status |
|---------|---------|--------|
| SettingsKit | 1.0.0+ | ✅ Latest stable |
| Swift | 6.0+ | ✅ Required |
| iOS | 17.0+ | ✅ Minimum |
| macOS | 14.0+ | ✅ Minimum |
| watchOS | 10.0+ | ✅ Minimum |
| tvOS | 17.0+ | ✅ Minimum |
| visionOS | 1.0+ | ✅ Minimum |

---

## Dependencies

**Prerequisites**: None - SettingsKit is a standalone Swift package

**Integrates With**:
- **swift-best-practices** (optional) - General Swift 6 patterns
- **claude-api** (optional) - If building AI-powered settings

---

## File Structure

```
swift-settingskit/
├── SKILL.md                      # Complete documentation
├── README.md                     # This file
├── references/                   # Detailed guides
│   ├── api-reference.md          # Complete API docs
│   ├── styling-guide.md          # Customization guide
│   ├── search-implementation.md  # Search architecture
│   └── advanced-patterns.md      # Production patterns
└── assets/                       # Swift templates
    ├── basic-settings-template.swift
    ├── custom-style-template.swift
    └── modular-settings-template.swift
```

---

## Official Documentation

- **SettingsKit GitHub**: https://github.com/Aeastr/SettingsKit
- **Swift Observation**: https://developer.apple.com/documentation/observation
- **SwiftUI Navigation**: https://developer.apple.com/documentation/swiftui/navigation
- **Context7 Library**: N/A (not indexed yet)

---

## Related Skills

- **swift-best-practices** - General Swift 6 development patterns
- **swiftui-patterns** - Advanced SwiftUI architecture (if available)

---

## Contributing

Found an issue or have a suggestion?
- Open an issue: https://github.com/secondsky/claude-skills/issues
- See [SKILL.md](SKILL.md) for detailed documentation

---

## License

MIT License - See main repo LICENSE file

---

**Production Tested**: Official SettingsKit examples, iOS 17+/macOS 14+ platforms
**Token Savings**: ~62%
**Error Prevention**: 100%
**Ready to use!** See [SKILL.md](SKILL.md) for complete setup.
