# SettingsKit Advanced Patterns

Production patterns for complex hierarchies, state management, persistence, and testing.

---

## Modular Settings Architecture

### Multi-File Organization

**Problem:** Large settings hierarchies become unwieldy in single file.

**Solution:** Extract settings modules into separate SettingsContent types.

**File Structure:**
```
Settings/
├── MySettings.swift                  # Root container
├── Modules/
│   ├── GeneralSettings.swift         # General preferences
│   ├── AppearanceSettings.swift      # Theme, colors
│   ├── NotificationSettings.swift    # Notifications
│   ├── PrivacySettings.swift         # Privacy controls
│   └── AdvancedSettings.swift        # Developer options
└── Models/
    └── AppSettings.swift              # Observable model
```

**MySettings.swift:**
```swift
import SwiftUI
import SettingsKit

struct MySettings: SettingsContainer {
    @Environment(AppSettings.self) var appSettings

    var settingsBody: some SettingsContent {
        @Bindable var settings = appSettings

        GeneralSettings(settings: settings)
        AppearanceSettings(settings: settings)
        NotificationSettings(settings: settings)
        PrivacySettings(settings: settings)

        if settings.developerMode {
            AdvancedSettings(settings: settings)
        }
    }
}
```

**Modules/GeneralSettings.swift:**
```swift
import SwiftUI
import SettingsKit

struct GeneralSettings: SettingsContent {
    @Bindable var settings: AppSettings

    var body: some SettingsContent {
        SettingsGroup("General", systemImage: "gear") {
            languageSettings
            regionSettings
            accessibilitySettings
        }
        .settingsTags(["general", "preferences", "language", "region"])
    }

    private var languageSettings: some SettingsContent {
        SettingsGroup("Language", systemImage: "globe") {
            SettingsItem("Preferred Language") {
                Picker("", selection: $settings.language) {
                    Text("English").tag(Language.english)
                    Text("Spanish").tag(Language.spanish)
                    Text("French").tag(Language.french)
                }
            }
        }
    }

    private var regionSettings: some SettingsContent {
        SettingsGroup("Region", systemImage: "map") {
            SettingsItem("Region") {
                Picker("", selection: $settings.region) {
                    Text("United States").tag(Region.us)
                    Text("United Kingdom").tag(Region.uk)
                    Text("Canada").tag(Region.canada)
                }
            }

            SettingsItem("Date Format") {
                Picker("", selection: $settings.dateFormat) {
                    Text("MM/DD/YYYY").tag(DateFormat.mdy)
                    Text("DD/MM/YYYY").tag(DateFormat.dmy)
                }
            }
        }
    }

    private var accessibilitySettings: some SettingsContent {
        SettingsGroup("Accessibility", systemImage: "accessibility") {
            SettingsItem("Reduce Motion") {
                Toggle("Enable", isOn: $settings.reduceMotion)
            }

            SettingsItem("Increase Contrast") {
                Toggle("Enable", isOn: $settings.increaseContrast)
            }
        }
    }
}
```

**Benefits:**
- Clear separation of concerns
- Team collaboration (different developers own different modules)
- Easier testing (test modules independently)
- Conditional loading (load advanced settings only if enabled)

---

## State Management Patterns

### Observable Settings Model

**Pattern: Centralized Observable Model**

```swift
import SwiftUI

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

    // Privacy
    var analyticsEnabled: Bool = false
    var crashReportingEnabled: Bool = true

    // Developer
    var developerMode: Bool = false
    var verboseLogging: Bool = false

    // Computed properties
    var isDarkMode: Bool {
        switch theme {
        case .light: return false
        case .dark: return true
        case .system: return false // Check system setting in real implementation
        }
    }
}

enum Language: String, Codable, CaseIterable, Identifiable {
    case english, spanish, french
    var id: String { rawValue }
}

enum Region: String, Codable, CaseIterable, Identifiable {
    case us, uk, canada
    var id: String { rawValue }
}

enum DateFormat: String, Codable, CaseIterable {
    case mdy, dmy
}

enum Theme: String, Codable, CaseIterable, Identifiable {
    case light, dark, system
    var id: String { rawValue }
}
```

---

### Persistence Integration

**Pattern: UserDefaults Persistence**

```swift
import SwiftUI

@Observable
class AppSettings {
    @ObservationIgnored
    private let defaults = UserDefaults.standard

    var notificationsEnabled: Bool {
        didSet { defaults.set(notificationsEnabled, forKey: "notificationsEnabled") }
    }

    var theme: Theme {
        didSet { defaults.set(theme.rawValue, forKey: "theme") }
    }

    var fontSize: Double {
        didSet { defaults.set(fontSize, forKey: "fontSize") }
    }

    init() {
        self.notificationsEnabled = defaults.bool(forKey: "notificationsEnabled")
        self.theme = Theme(rawValue: defaults.string(forKey: "theme") ?? "") ?? .system
        self.fontSize = defaults.double(forKey: "fontSize") != 0 ? defaults.double(forKey: "fontSize") : 16.0
    }
}
```

**Pattern: Codable Persistence**

```swift
import SwiftUI

@Observable
class AppSettings: Codable {
    var notificationsEnabled: Bool = true
    var theme: Theme = .system
    var fontSize: Double = 16.0

    enum CodingKeys: String, CodingKey {
        case notificationsEnabled, theme, fontSize
    }

    init() {}

    required init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        notificationsEnabled = try container.decode(Bool.self, forKey: .notificationsEnabled)
        theme = try container.decode(Theme.self, forKey: .theme)
        fontSize = try container.decode(Double.self, forKey: .fontSize)
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(notificationsEnabled, forKey: .notificationsEnabled)
        try container.encode(theme, forKey: .theme)
        try container.encode(fontSize, forKey: .fontSize)
    }

    func save() {
        if let encoded = try? JSONEncoder().encode(self) {
            UserDefaults.standard.set(encoded, forKey: "appSettings")
        }
    }

    static func load() -> AppSettings {
        guard let data = UserDefaults.standard.data(forKey: "appSettings"),
              let settings = try? JSONDecoder().decode(AppSettings.self, from: data) else {
            return AppSettings()
        }
        return settings
    }
}
```

**Pattern: SwiftData Persistence (iOS 17+)**

```swift
import SwiftUI
import SwiftData

@Model
class AppSettings {
    var notificationsEnabled: Bool = true
    var theme: String = "system"
    var fontSize: Double = 16.0

    init() {}
}

// In App:
@main
struct MyApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
        .modelContainer(for: AppSettings.self)
    }
}

// In Settings:
struct MySettings: SettingsContainer {
    @Query private var settingsArray: [AppSettings]
    @Environment(\.modelContext) private var modelContext

    private var settings: AppSettings {
        if let existing = settingsArray.first {
            return existing
        } else {
            let new = AppSettings()
            modelContext.insert(new)
            return new
        }
    }

    var settingsBody: some SettingsContent {
        @Bindable var currentSettings = settings
        // Use currentSettings...
    }
}
```

---

## Dynamic Settings

### Data-Driven Settings

**Pattern: ForEach for Dynamic Groups**

```swift
struct AccountSettings: SettingsContent {
    let accounts: [Account]
    @Bindable var settings: AppSettings

    var body: some SettingsContent {
        SettingsGroup("Accounts", systemImage: "person.3") {
            ForEach(accounts) { account in
                SettingsGroup(account.name, systemImage: "person.circle") {
                    SettingsItem("Email") {
                        Text(account.email)
                            .foregroundStyle(.secondary)
                    }

                    SettingsItem("Status") {
                        HStack {
                            Circle()
                                .fill(account.isActive ? .green : .red)
                                .frame(width: 8, height: 8)
                            Text(account.isActive ? "Active" : "Inactive")
                        }
                    }

                    SettingsItem("Notifications") {
                        Toggle("Enable", isOn: Binding(
                            get: { settings.accountNotifications[account.id] ?? true },
                            set: { settings.accountNotifications[account.id] = $0 }
                        ))
                    }
                }
            }

            CustomSettingsGroup("Add Account", systemImage: "plus") {
                Button("Add New Account") {
                    addAccount()
                }
                .buttonStyle(.borderedProminent)
                .padding()
            }
        }
        .settingsTags(["accounts", "users", "profiles"])
    }
}

struct Account: Identifiable {
    let id: UUID
    let name: String
    let email: String
    let isActive: Bool
}
```

---

## Conditional Settings

### Feature Flag Pattern

```swift
struct AdvancedSettings: SettingsContent {
    @Bindable var settings: AppSettings

    var body: some SettingsContent {
        SettingsGroup("Advanced", systemImage: "gearshape.2") {
            SettingsItem("Enable Advanced Features") {
                Toggle("Enable", isOn: $settings.advancedFeaturesEnabled)
            }

            if settings.advancedFeaturesEnabled {
                betaFeatures
            }

            if settings.advancedFeaturesEnabled && settings.betaFeaturesEnabled {
                developerOptions
            }
        }
    }

    private var betaFeatures: some SettingsContent {
        SettingsGroup("Beta Features", systemImage: "star") {
            SettingsItem("New UI") {
                Toggle("Enable", isOn: $settings.newUIEnabled)
            }

            SettingsItem("Experimental Search") {
                Toggle("Enable", isOn: $settings.experimentalSearchEnabled)
            }
        }
        .settingsTags(["beta", "experimental"])
    }

    private var developerOptions: some SettingsContent {
        SettingsGroup("Developer", systemImage: "hammer") {
            SettingsItem("Debug Mode") {
                Toggle("Enable", isOn: $settings.debugMode)
            }

            SettingsItem("Verbose Logging") {
                Toggle("Enable", isOn: $settings.verboseLogging)
            }
        }
        .settingsTags(["developer", "debug", "logs"])
    }
}
```

---

## Complex UI Patterns

### Settings with Actions

```swift
struct DataManagementSettings: SettingsContent {
    @Bindable var settings: AppSettings
    @State private var showingClearCacheAlert = false
    @State private var showingExportData = false

    var body: some SettingsContent {
        SettingsGroup("Data Management", systemImage: "externaldrive") {
            storageInfo
            cacheControls
            exportControls
        }
        .settingsTags(["data", "storage", "cache", "export"])
    }

    private var storageInfo: some SettingsContent {
        CustomSettingsGroup("Storage Usage", systemImage: "chart.bar") {
            VStack(alignment: .leading, spacing: 16) {
                GroupBox("Storage Breakdown") {
                    VStack(spacing: 12) {
                        storageRow(label: "Documents", size: "2.3 GB", color: .blue)
                        storageRow(label: "Cache", size: "450 MB", color: .orange)
                        storageRow(label: "Settings", size: "12 MB", color: .green)
                    }
                }

                Text("Total: 2.76 GB")
                    .font(.headline)
            }
            .padding()
        }
    }

    private func storageRow(label: String, size: String, color: Color) -> some View {
        HStack {
            Circle()
                .fill(color)
                .frame(width: 12, height: 12)
            Text(label)
            Spacer()
            Text(size)
                .foregroundStyle(.secondary)
        }
    }

    private var cacheControls: some SettingsContent {
        CustomSettingsGroup("Cache Management", systemImage: "trash") {
            VStack(spacing: 16) {
                Button("Clear Cache") {
                    showingClearCacheAlert = true
                }
                .buttonStyle(.borderedProminent)
                .tint(.red)

                Text("Clearing cache will remove temporary files but won't affect your documents.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            .padding()
            .alert("Clear Cache?", isPresented: $showingClearCacheAlert) {
                Button("Cancel", role: .cancel) {}
                Button("Clear", role: .destructive) {
                    clearCache()
                }
            } message: {
                Text("This will remove 450 MB of temporary files.")
            }
        }
    }

    private var exportControls: some SettingsContent {
        CustomSettingsGroup("Export Data", systemImage: "square.and.arrow.up") {
            VStack(spacing: 16) {
                Button("Export All Data") {
                    showingExportData = true
                }
                .buttonStyle(.bordered)

                Text("Export your documents and settings as a ZIP file.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            .padding()
            .sheet(isPresented: $showingExportData) {
                ExportDataView()
            }
        }
    }

    private func clearCache() {
        // Implementation
    }
}
```

---

## Validation Patterns

### Input Validation

```swift
struct ProfileSettings: SettingsContent {
    @Bindable var settings: AppSettings
    @State private var usernameError: String?
    @State private var emailError: String?

    var body: some SettingsContent {
        SettingsGroup("Profile", systemImage: "person") {
            SettingsItem("Username") {
                VStack(alignment: .leading, spacing: 4) {
                    TextField("Username", text: $settings.username)
                        .textFieldStyle(.roundedBorder)
                        .onChange(of: settings.username) { _, newValue in
                            validateUsername(newValue)
                        }

                    if let error = usernameError {
                        Text(error)
                            .font(.caption)
                            .foregroundStyle(.red)
                    }
                }
            }

            SettingsItem("Email") {
                VStack(alignment: .leading, spacing: 4) {
                    TextField("Email", text: $settings.email)
                        .textFieldStyle(.roundedBorder)
                        .keyboardType(.emailAddress)
                        .textContentType(.emailAddress)
                        .onChange(of: settings.email) { _, newValue in
                            validateEmail(newValue)
                        }

                    if let error = emailError {
                        Text(error)
                            .font(.caption)
                            .foregroundStyle(.red)
                    }
                }
            }
        }
    }

    private func validateUsername(_ username: String) {
        if username.isEmpty {
            usernameError = "Username cannot be empty"
        } else if username.count < 3 {
            usernameError = "Username must be at least 3 characters"
        } else if !username.allSatisfy({ $0.isLetter || $0.isNumber || $0 == "_" }) {
            usernameError = "Username can only contain letters, numbers, and underscores"
        } else {
            usernameError = nil
        }
    }

    private func validateEmail(_ email: String) {
        let emailRegex = #"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$"#
        if email.isEmpty {
            emailError = "Email cannot be empty"
        } else if !email.range(of: emailRegex, options: .regularExpression).map({ _ in true }) ?? false {
            emailError = "Invalid email format"
        } else {
            emailError = nil
        }
    }
}
```

---

## Testing Patterns

### Unit Testing Settings Logic

```swift
import XCTest
@testable import MyApp

final class AppSettingsTests: XCTestCase {
    func testDefaultValues() {
        let settings = AppSettings()
        XCTAssertTrue(settings.notificationsEnabled)
        XCTAssertEqual(settings.theme, .system)
        XCTAssertEqual(settings.fontSize, 16.0)
    }

    func testThemeChanges() {
        let settings = AppSettings()
        settings.theme = .dark
        XCTAssertEqual(settings.theme, .dark)
        XCTAssertTrue(settings.isDarkMode)
    }

    func testPersistence() {
        let settings = AppSettings()
        settings.notificationsEnabled = false
        settings.theme = .light
        settings.save()

        let loaded = AppSettings.load()
        XCTAssertFalse(loaded.notificationsEnabled)
        XCTAssertEqual(loaded.theme, .light)
    }
}
```

### UI Testing Settings

```swift
import XCTest

final class SettingsUITests: XCTestCase {
    func testNavigationToNotifications() {
        let app = XCUIApplication()
        app.launch()

        app.buttons["General"].tap()
        app.buttons["Notifications"].tap()

        XCTAssertTrue(app.switches["Enable Notifications"].exists)
    }

    func testSearchFunctionality() {
        let app = XCUIApplication()
        app.launch()

        let searchField = app.searchFields.firstMatch
        searchField.tap()
        searchField.typeText("notif")

        XCTAssertTrue(app.staticTexts["Notifications"].exists)
    }

    func testToggleSwitch() {
        let app = XCUIApplication()
        app.launch()

        let notificationsSwitch = app.switches["Enable Notifications"]
        XCTAssertTrue(notificationsSwitch.isEnabled)

        notificationsSwitch.tap()
        // Verify state change...
    }
}
```

---

## Performance Patterns

### Lazy Loading

```swift
struct LargeSettings: SettingsContent {
    @Bindable var settings: AppSettings
    @State private var loadedSections: Set<String> = []

    var body: some SettingsContent {
        SettingsGroup("General") {
            // Always loaded
            basicSettings
        }

        if loadedSections.contains("advanced") {
            SettingsGroup("Advanced") {
                advancedSettings
            }
        } else {
            CustomSettingsGroup("Advanced", systemImage: "gearshape.2") {
                Button("Load Advanced Settings") {
                    loadedSections.insert("advanced")
                }
                .padding()
            }
        }
    }

    private var basicSettings: some SettingsContent {
        SettingsItem("Notifications") {
            Toggle("Enable", isOn: $settings.notificationsEnabled)
        }
    }

    private var advancedSettings: some SettingsContent {
        SettingsItem("Debug Mode") {
            Toggle("Enable", isOn: $settings.debugMode)
        }
    }
}
```

---

## Migration Patterns

### Migrating from Legacy Settings

**Before (UserDefaults-based):**
```swift
// Old approach
struct OldSettingsView: View {
    @AppStorage("notifications") var notifications = true
    @AppStorage("theme") var theme = "system"

    var body: some View {
        Form {
            Section("General") {
                Toggle("Notifications", isOn: $notifications)
                Picker("Theme", selection: $theme) {
                    Text("System").tag("system")
                    Text("Light").tag("light")
                    Text("Dark").tag("dark")
                }
            }
        }
    }
}
```

**After (SettingsKit):**
```swift
@Observable
class AppSettings {
    @ObservationIgnored
    private let defaults = UserDefaults.standard

    var notificationsEnabled: Bool {
        didSet { defaults.set(notificationsEnabled, forKey: "notifications") }
    }

    var theme: Theme {
        didSet { defaults.set(theme.rawValue, forKey: "theme") }
    }

    init() {
        self.notificationsEnabled = defaults.bool(forKey: "notifications")
        self.theme = Theme(rawValue: defaults.string(forKey: "theme") ?? "system") ?? .system
    }
}

struct NewSettingsView: SettingsContainer {
    @Environment(AppSettings.self) var appSettings

    var settingsBody: some SettingsContent {
        @Bindable var settings = appSettings

        SettingsGroup("General", systemImage: "gear") {
            SettingsItem("Notifications") {
                Toggle("Enable", isOn: $settings.notificationsEnabled)
            }

            SettingsItem("Theme") {
                Picker("", selection: $settings.theme) {
                    Text("System").tag(Theme.system)
                    Text("Light").tag(Theme.light)
                    Text("Dark").tag(Theme.dark)
                }
            }
        }
    }
}
```

---

## Production Checklist

### Pre-Launch Verification

- [ ] All settings persisted correctly
- [ ] Settings survive app restart
- [ ] Search finds all major settings
- [ ] Navigation state preserved across sessions
- [ ] No crashes with edge case inputs (empty strings, extreme values)
- [ ] Accessibility labels present
- [ ] Dynamic type supported (large text sizes)
- [ ] Dark mode tested
- [ ] Platform-specific behaviors verified (iPad, Mac)
- [ ] Performance acceptable with large settings hierarchies

---

For API reference, see `references/api-reference.md`.
For styling customization, see `references/styling-guide.md`.
For search implementation, see `references/search-implementation.md`.
