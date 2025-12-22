// Basic SettingsKit Template
// Complete minimal implementation for getting started with SettingsKit
// Platform: iOS 17+ / macOS 14+ / watchOS 10+ / tvOS 17+ / visionOS 1+
// Swift: 6.0+

import SwiftUI
import SettingsKit

// MARK: - Settings Model

@Observable
class AppSettings {
    // General settings
    var notificationsEnabled: Bool = true
    var soundEnabled: Bool = true
    var hapticFeedback: Bool = true

    // Appearance settings
    var darkMode: Bool = false
    var accentColor: Color = .blue
    var fontSize: Double = 16.0

    // User profile
    var username: String = ""
    var email: String = ""

    // MARK: - Persistence (Optional)

    // To enable UserDefaults persistence:
    // 1. Replace the simple stored properties above with computed properties below
    // 2. Add didSet observers to save changes
    // 3. Implement init() to load values on startup
    //
    // Example for notificationsEnabled (apply same pattern to other properties):
    /*
    @ObservationIgnored
    private let defaults = UserDefaults.standard

    var notificationsEnabled: Bool = true {
        didSet { defaults.set(notificationsEnabled, forKey: "notificationsEnabled") }
    }

    init() {
        self.notificationsEnabled = defaults.bool(forKey: "notificationsEnabled")
        // Repeat for other properties: soundEnabled, darkMode, etc.
    }
    */
}

// MARK: - Settings Container

struct MySettings: SettingsContainer {
    @Environment(AppSettings.self) var appSettings

    var settingsBody: some SettingsContent {
        @Bindable var settings = appSettings

        // General settings group (navigation)
        SettingsGroup("General", systemImage: "gear") {
            SettingsItem("Notifications") {
                Toggle("Enable", isOn: $settings.notificationsEnabled)
            }

            SettingsItem("Sound Effects") {
                Toggle("Enable", isOn: $settings.soundEnabled)
            }

            SettingsItem("Haptic Feedback") {
                Toggle("Enable", isOn: $settings.hapticFeedback)
            }
        }
        .settingsTags(["notifications", "sounds", "haptics", "alerts"])

        // Appearance settings group (navigation)
        SettingsGroup("Appearance", systemImage: "paintbrush") {
            SettingsItem("Dark Mode") {
                Toggle("Enable", isOn: $settings.darkMode)
            }

            SettingsItem("Accent Color") {
                ColorPicker("Choose color", selection: $settings.accentColor)
            }

            SettingsItem("Font Size") {
                VStack(alignment: .leading, spacing: 8) {
                    Slider(value: $settings.fontSize, in: 10...24, step: 1)
                    Text("\(Int(settings.fontSize)) pt")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
        }
        .settingsTags(["appearance", "theme", "colors", "font"])

        // Profile settings group (navigation)
        SettingsGroup("Profile", systemImage: "person") {
            SettingsItem("Username") {
                TextField("Enter username", text: $settings.username)
                    .textFieldStyle(.roundedBorder)
            }

            SettingsItem("Email") {
                TextField("Enter email", text: $settings.email)
                    .textFieldStyle(.roundedBorder)
                    .keyboardType(.emailAddress)
                    .textContentType(.emailAddress)
            }
        }
        .settingsTags(["profile", "account", "user"])

        // Quick Settings (inline section header, not navigation)
        // NOTE: These toggles use .constant(true) as placeholder values.
        // For production, bind to real properties in AppSettings (e.g., $settings.wifiEnabled)
        SettingsGroup("Quick Access", .inline) {
            SettingsItem("Wi-Fi") {
                Toggle("Enable", isOn: .constant(true))
            }

            SettingsItem("Bluetooth") {
                Toggle("Enable", isOn: .constant(true))
            }
        }
        .settingsTags(["wifi", "bluetooth", "quick"])
    }
}

// MARK: - App Integration

@main
struct MyApp: App {
    @State private var settings = AppSettings()

    var body: some Scene {
        WindowGroup {
            MySettings()
                .environment(settings)
                // Optional: Choose presentation style
                // .settingsStyle(.sidebar)  // Default: split view on iPad/Mac
                // .settingsStyle(.single)   // Single column on all platforms
        }
    }
}

// MARK: - Preview

#Preview {
    MySettings()
        .environment(AppSettings())
}

// MARK: - Usage Notes

/*
 1. Installation:
    - File → Add Package Dependencies
    - https://github.com/aeastr/SettingsKit.git
    - Version: 1.0.0 or later

 2. Key Concepts:
    - @Observable: Modern Swift observation for settings model
    - @Bindable: Required wrapper to create bindings from @Observable
    - SettingsGroup: Creates navigation links (default) or inline sections
    - SettingsItem: Wraps individual controls (Toggle, Slider, TextField, etc.)
    - .settingsTags([...]): Add search keywords for discoverability

 3. Common Patterns:
    - Navigation group: SettingsGroup("Title", systemImage: "icon") { ... }
    - Inline section: SettingsGroup("Title", .inline) { ... }
    - Searchable: Add .settingsTags(["keyword1", "keyword2"])

 4. Customization:
    - Change presentation: .settingsStyle(.sidebar) or .settingsStyle(.single)
    - Custom search: .settingsSearch(MyCustomSearch())
    - Custom style: .settingsStyle(MyCustomStyle())

 5. Platform Requirements:
    - iOS 17.0+ / macOS 14.0+ / watchOS 10.0+ / tvOS 17.0+ / visionOS 1.0+
    - Swift 6.0+
    - Xcode 16.0+
 */
