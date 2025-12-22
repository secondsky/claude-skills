// Modular SettingsKit Template
// Example of organizing large settings hierarchies across multiple files
// Platform: iOS 17+ / macOS 14+ / watchOS 10+ / tvOS 17+ / visionOS 1+
// Swift: 6.0+

import SwiftUI
import SettingsKit

// MARK: - Settings Model (Models/AppSettings.swift)

/// Centralized settings model with all application preferences
@Observable
class AppSettings {
    // General
    var language: Language = .english
    var region: Region = .us
    var dateFormat: DateFormat = .mdy

    // Appearance
    var theme: Theme = .system
    var accentColor: Color = .blue
    var fontSize: Double = 16.0

    // Notifications
    var notificationsEnabled: Bool = true
    var soundEnabled: Bool = true
    var badgeEnabled: Bool = true
    var emailNotifications: Bool = false

    // Privacy
    var analyticsEnabled: Bool = false
    var crashReportingEnabled: Bool = true
    var shareDataWithPartners: Bool = false

    // Advanced
    var developerMode: Bool = false
    var verboseLogging: Bool = false
    var betaFeaturesEnabled: Bool = false

    // MARK: - Persistence

    @ObservationIgnored
    private let defaults = UserDefaults.standard

    func save() {
        defaults.set(notificationsEnabled, forKey: "notificationsEnabled")
        defaults.set(theme.rawValue, forKey: "theme")
        // ... save other properties
    }

    func load() {
        notificationsEnabled = defaults.bool(forKey: "notificationsEnabled")
        if let themeRaw = defaults.string(forKey: "theme"),
           let savedTheme = Theme(rawValue: themeRaw) {
            theme = savedTheme
        }
        // ... load other properties
    }

    // MARK: - Computed Properties

    var isDarkMode: Bool {
        switch theme {
        case .light: return false
        case .dark: return true
        case .system: return false // Check system in real implementation
        }
    }
}

// MARK: - Supporting Types

enum Language: String, Codable, CaseIterable, Identifiable {
    case english, spanish, french, german, japanese
    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .english: return "English"
        case .spanish: return "Español"
        case .french: return "Français"
        case .german: return "Deutsch"
        case .japanese: return "日本語"
        }
    }
}

enum Region: String, Codable, CaseIterable, Identifiable {
    case us, uk, canada, australia, japan
    var id: String { rawValue }
}

enum DateFormat: String, Codable, CaseIterable {
    case mdy, dmy, ymd
}

enum Theme: String, Codable, CaseIterable, Identifiable {
    case light, dark, system
    var id: String { rawValue }
}

// MARK: - General Settings Module (Modules/GeneralSettings.swift)

/// General application preferences (language, region, accessibility)
struct GeneralSettings: SettingsContent {
    @Bindable var settings: AppSettings

    var body: some SettingsContent {
        SettingsGroup("General", systemImage: "gear") {
            languageSettings
            regionSettings
            accessibilitySettings
        }
        .settingsTags(["general", "preferences", "language", "region", "accessibility"])
    }

    private var languageSettings: some SettingsContent {
        SettingsGroup("Language", systemImage: "globe") {
            SettingsItem("Preferred Language") {
                Picker("", selection: $settings.language) {
                    ForEach(Language.allCases) { lang in
                        Text(lang.displayName).tag(lang)
                    }
                }
                .pickerStyle(.menu)
            }
        }
        .settingsTags(["language", "locale", "translation"])
    }

    private var regionSettings: some SettingsContent {
        SettingsGroup("Region", systemImage: "map") {
            SettingsItem("Region") {
                Picker("", selection: $settings.region) {
                    ForEach(Region.allCases) { region in
                        Text(region.rawValue.uppercased()).tag(region)
                    }
                }
            }

            SettingsItem("Date Format") {
                Picker("", selection: $settings.dateFormat) {
                    Text("MM/DD/YYYY").tag(DateFormat.mdy)
                    Text("DD/MM/YYYY").tag(DateFormat.dmy)
                    Text("YYYY/MM/DD").tag(DateFormat.ymd)
                }
                .pickerStyle(.segmented)
            }
        }
        .settingsTags(["region", "date", "format", "locale"])
    }

    private var accessibilitySettings: some SettingsContent {
        SettingsGroup("Accessibility", systemImage: "accessibility") {
            SettingsItem("Font Size") {
                VStack(alignment: .leading, spacing: 8) {
                    Slider(value: $settings.fontSize, in: 10...24, step: 1)
                    HStack {
                        Text("Aa")
                            .font(.system(size: 10))
                        Spacer()
                        Text("\(Int(settings.fontSize)) pt")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        Spacer()
                        Text("Aa")
                            .font(.system(size: 24))
                    }
                }
            }
        }
        .settingsTags(["accessibility", "font", "size", "vision"])
    }
}

// MARK: - Appearance Settings Module (Modules/AppearanceSettings.swift)

/// Appearance and theming preferences
struct AppearanceSettings: SettingsContent {
    @Bindable var settings: AppSettings

    var body: some SettingsContent {
        SettingsGroup("Appearance", systemImage: "paintbrush") {
            themeSettings
            colorSettings
        }
        .settingsTags(["appearance", "theme", "colors", "dark mode"])
    }

    private var themeSettings: some SettingsContent {
        SettingsItem("Theme") {
            Picker("", selection: $settings.theme) {
                Label("Light", systemImage: "sun.max").tag(Theme.light)
                Label("Dark", systemImage: "moon").tag(Theme.dark)
                Label("Automatic", systemImage: "circle.lefthalf.filled").tag(Theme.system)
            }
            .pickerStyle(.segmented)
        }
    }

    private var colorSettings: some SettingsContent {
        SettingsItem("Accent Color") {
            HStack(spacing: 16) {
                ColorPicker("", selection: $settings.accentColor)
                    .labelsHidden()

                Button("Reset") {
                    settings.accentColor = .blue
                }
                .buttonStyle(.bordered)
            }
        }
    }
}

// MARK: - Notification Settings Module (Modules/NotificationSettings.swift)

/// Notification preferences and controls
struct NotificationSettings: SettingsContent {
    @Bindable var settings: AppSettings

    var body: some SettingsContent {
        SettingsGroup("Notifications", systemImage: "bell") {
            SettingsItem("Enable Notifications") {
                Toggle("Enable", isOn: $settings.notificationsEnabled)
            }

            if settings.notificationsEnabled {
                notificationChannels
            }
        }
        .settingsTags(["notifications", "alerts", "sounds", "badges", "email"])
    }

    private var notificationChannels: some SettingsContent {
        SettingsGroup("Notification Channels", .inline) {
            SettingsItem("Sound") {
                Toggle("Enable", isOn: $settings.soundEnabled)
            }

            SettingsItem("Badge") {
                Toggle("Show badge", isOn: $settings.badgeEnabled)
            }

            SettingsItem("Email") {
                Toggle("Email notifications", isOn: $settings.emailNotifications)
            }
        }
    }
}

// MARK: - Privacy Settings Module (Modules/PrivacySettings.swift)

/// Privacy and data sharing preferences
struct PrivacySettings: SettingsContent {
    @Bindable var settings: AppSettings
    @State private var showPrivacyPolicy = false

    var body: some SettingsContent {
        SettingsGroup("Privacy", systemImage: "lock.shield") {
            dataCollection
            privacyInfo
        }
        .settingsTags(["privacy", "security", "analytics", "tracking", "data"])
    }

    private var dataCollection: some SettingsContent {
        SettingsGroup("Data Collection", .inline) {
            SettingsItem("Analytics") {
                Toggle("Send analytics", isOn: $settings.analyticsEnabled)
            }

            SettingsItem("Crash Reports") {
                Toggle("Send crash reports", isOn: $settings.crashReportingEnabled)
            }

            SettingsItem("Third-Party Sharing") {
                Toggle("Share with partners", isOn: $settings.shareDataWithPartners)
            }
        }
    }

    private var privacyInfo: some SettingsContent {
        CustomSettingsGroup("Privacy Information", systemImage: "info.circle") {
            VStack(spacing: 16) {
                Text("We value your privacy. Review our privacy policy to understand how we collect and use your data.")
                    .font(.callout)
                    .foregroundStyle(.secondary)

                Button("View Privacy Policy") {
                    showPrivacyPolicy = true
                }
                .buttonStyle(.borderedProminent)
            }
            .padding()
            .sheet(isPresented: $showPrivacyPolicy) {
                // Privacy policy view
                NavigationStack {
                    Text("Privacy Policy")
                        .navigationTitle("Privacy")
                        .toolbar {
                            ToolbarItem(placement: .cancellationAction) {
                                Button("Done") {
                                    showPrivacyPolicy = false
                                }
                            }
                        }
                }
            }
        }
    }
}

// MARK: - Advanced Settings Module (Modules/AdvancedSettings.swift)

/// Developer and advanced options (conditionally shown)
struct AdvancedSettings: SettingsContent {
    @Bindable var settings: AppSettings

    var body: some SettingsContent {
        SettingsGroup("Advanced", systemImage: "gearshape.2") {
            SettingsItem("Developer Mode") {
                Toggle("Enable", isOn: $settings.developerMode)
            }

            if settings.developerMode {
                developerOptions
            }

            SettingsItem("Beta Features") {
                Toggle("Enable", isOn: $settings.betaFeaturesEnabled)
            }
        }
        .settingsTags(["advanced", "developer", "debug", "beta"])
    }

    private var developerOptions: some SettingsContent {
        SettingsGroup("Developer Options", systemImage: "hammer") {
            SettingsItem("Verbose Logging") {
                Toggle("Enable", isOn: $settings.verboseLogging)
            }

            CustomSettingsGroup("Developer Tools", systemImage: "wrench") {
                VStack(spacing: 16) {
                    Button("Clear Cache") {
                        clearCache()
                    }
                    .buttonStyle(.bordered)

                    Button("Export Logs") {
                        exportLogs()
                    }
                    .buttonStyle(.bordered)
                }
                .padding()
            }
        }
        .settingsTags(["developer", "debug", "logs", "cache"])
    }

    private func clearCache() {
        // Implementation
    }

    private func exportLogs() {
        // Implementation
    }
}

// MARK: - Root Settings Container (MySettings.swift)

/// Root settings container that composes all modules
struct MySettings: SettingsContainer {
    @Environment(AppSettings.self) var appSettings

    var settingsBody: some SettingsContent {
        @Bindable var settings = appSettings

        // Compose modular settings
        GeneralSettings(settings: settings)
        AppearanceSettings(settings: settings)
        NotificationSettings(settings: settings)
        PrivacySettings(settings: settings)

        // Conditionally show advanced settings
        if settings.developerMode || settings.betaFeaturesEnabled {
            AdvancedSettings(settings: settings)
        }
    }
}

// MARK: - App Integration (MyApp.swift)

@main
struct MyApp: App {
    @State private var settings = AppSettings()

    var body: some Scene {
        WindowGroup {
            MySettings()
                .environment(settings)
                .settingsStyle(.sidebar)
                .onAppear {
                    settings.load()
                }
                .onDisappear {
                    settings.save()
                }
        }
    }
}

// MARK: - Preview

#Preview {
    MySettings()
        .environment(AppSettings())
}

// MARK: - File Organization Structure

/*
 Recommended file structure for modular settings:

 MyApp/
 ├── App/
 │   └── MyApp.swift                  # @main app with settings environment
 ├── Settings/
 │   ├── MySettings.swift             # Root SettingsContainer
 │   ├── Models/
 │   │   └── AppSettings.swift        # Observable settings model
 │   └── Modules/
 │       ├── GeneralSettings.swift
 │       ├── AppearanceSettings.swift
 │       ├── NotificationSettings.swift
 │       ├── PrivacySettings.swift
 │       └── AdvancedSettings.swift
 └── Supporting Files/
     └── ...

 Benefits:
 - Clear separation of concerns
 - Easy team collaboration (different developers own different modules)
 - Easier testing (test modules independently)
 - Conditional loading (load advanced settings only if enabled)
 - Better code organization for large apps

 Usage:
 1. Copy AppSettings.swift to Models/
 2. Copy each settings module to Modules/
 3. Copy MySettings.swift as root container
 4. Update MyApp.swift with environment setup
 5. Add .settingsStyle() for presentation preference
 */
