// SettingsKit Demo App Template
// Complete working demo app matching the official SettingsKit demo
// Platform: iOS 17+ / macOS 14+ / watchOS 10+ / tvOS 17+ / visionOS 1+
// Swift: 6.0+
// Source: Based on official SettingsKit Demo app

import SwiftUI
import SettingsKit

// MARK: - Settings State (Complete Example)

/// Comprehensive settings state model with 25+ properties
/// Demonstrates production-ready state management for complex apps
@Observable
class SettingsState {
    // MARK: - System Settings (Connectivity & Features)

    var airplaneModeEnabled: Bool = false
    var bluetoothEnabled: Bool = true
    var personalHotspotEnabled: Bool = false
    var vpnQuickEnabled: Bool = false
    var appleIntelligenceEnabled: Bool = false
    var airDropEnabled: Bool = true
    var pipEnabled: Bool = true
    var autoJoinWiFi: Bool = true

    // MARK: - Display Settings

    var autoBrightness: Bool = true
    var darkMode: Bool = false

    // MARK: - Time & Date

    var use24Hour: Bool = false

    // MARK: - Developer Options

    var debugMode: Bool = false
    var verboseLogging: Bool = false
    var showHiddenFeatures: Bool = false
    var networkDebugging: Bool = false

    // MARK: - User Preferences

    var siriSuggestions: Bool = true
    var autoStandby: Bool = true
    var autoFillPasswords: Bool = true
    var autoCorrect: Bool = true
    var vpnManagementEnabled: Bool = false

    // MARK: - Test Controls

    var testToggle: Bool = false
    var testSlider: Double = 50.0
    var testText: String = ""
    var testPicker: Int = 0
    var testStepper: Int = 0
    var testCounter: Int = 0

    // MARK: - Persistence (Optional)

    /*
    @ObservationIgnored
    private let defaults = UserDefaults.standard

    func save() {
        defaults.set(airplaneModeEnabled, forKey: "airplaneModeEnabled")
        defaults.set(bluetoothEnabled, forKey: "bluetoothEnabled")
        // ... save other properties
    }

    func load() {
        airplaneModeEnabled = defaults.bool(forKey: "airplaneModeEnabled")
        bluetoothEnabled = defaults.bool(forKey: "bluetoothEnabled")
        // ... load other properties
    }
    */
}

// MARK: - Main Settings Container

struct DemoSettings: SettingsContainer {
    @Environment(SettingsState.self) var state

    var settingsBody: some SettingsContent {
        @Bindable var settings = state

        // Quick Settings (inline section)
        SettingsGroup("Quick Settings", .inline) {
            SettingsItem("Airplane Mode") {
                Toggle("Enable", isOn: $settings.airplaneModeEnabled)
            }

            SettingsItem("Bluetooth") {
                Toggle("Enable", isOn: $settings.bluetoothEnabled)
            }

            SettingsItem("Personal Hotspot") {
                Toggle("Enable", isOn: $settings.personalHotspotEnabled)
            }
        }
        .settingsTags(["airplane", "bluetooth", "hotspot", "wifi"])

        // General Settings (navigation group)
        SettingsGroup("General", systemImage: "gear") {
            SettingsItem("Dark Mode") {
                Toggle("Enable", isOn: $settings.darkMode)
            }

            SettingsItem("Auto-Brightness") {
                Toggle("Enable", isOn: $settings.autoBrightness)
            }

            SettingsItem("Use 24-Hour Time") {
                Toggle("Enable", isOn: $settings.use24Hour)
            }
        }
        .settingsTags(["general", "display", "appearance"])

        // Privacy & Security (navigation group with nested groups)
        SettingsGroup("Privacy & Security", systemImage: "lock.shield") {
            SettingsGroup("Features", .inline) {
                SettingsItem("Apple Intelligence") {
                    Toggle("Enable", isOn: $settings.appleIntelligenceEnabled)
                }

                SettingsItem("Siri Suggestions") {
                    Toggle("Enable", isOn: $settings.siriSuggestions)
                }
            }

            SettingsGroup("Passwords", .inline) {
                SettingsItem("AutoFill Passwords") {
                    Toggle("Enable", isOn: $settings.autoFillPasswords)
                }
            }
        }
        .settingsTags(["privacy", "security", "passwords", "siri"])

        // Developer Settings (modular extraction)
        DeveloperSettingsGroup(settings: settings)

        // Test Controls Section
        SettingsGroup("Test Controls", systemImage: "flask") {
            // Toggle example
            SettingsItem("Test Toggle") {
                Toggle("Enable", isOn: $settings.testToggle)
            }

            // Slider example
            SettingsItem("Test Slider") {
                VStack(alignment: .leading, spacing: 8) {
                    Slider(value: $settings.testSlider, in: 0...100)
                    Text("\(Int(settings.testSlider))%")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }

            // TextField example
            SettingsItem("Test Text") {
                TextField("Enter text", text: $settings.testText)
                    .textFieldStyle(.roundedBorder)
            }

            // Picker example
            SettingsItem("Test Picker") {
                Picker("", selection: $settings.testPicker) {
                    Text("Option 1").tag(0)
                    Text("Option 2").tag(1)
                    Text("Option 3").tag(2)
                }
                .pickerStyle(.segmented)
            }

            // Stepper example
            SettingsItem("Test Stepper") {
                Stepper("\(settings.testStepper)", value: $settings.testStepper, in: 0...10)
            }

            // Button example
            SettingsItem("Test Counter") {
                HStack {
                    Text("\(settings.testCounter)")
                        .font(.headline)
                    Spacer()
                    Button("Increment") {
                        settings.testCounter += 1
                    }
                    .buttonStyle(.borderedProminent)
                }
            }
        }
        .settingsTags(["test", "controls", "demo"])

        // Custom UI Section
        CustomSettingsGroup("About", systemImage: "info.circle") {
            VStack(spacing: 16) {
                Image(systemName: "gearshape.2.fill")
                    .font(.system(size: 64))
                    .foregroundStyle(.blue)

                Text("SettingsKit Demo")
                    .font(.title2)
                    .fontWeight(.bold)

                Text("Version 1.0.0")
                    .font(.caption)
                    .foregroundStyle(.secondary)

                Divider()
                    .padding(.vertical, 8)

                Button("View on GitHub") {
                    // Open GitHub link
                }
                .buttonStyle(.borderedProminent)
            }
            .padding()
            .frame(maxWidth: .infinity)
        }
        .settingsTags(["about", "info", "version"])
    }
}

// MARK: - Developer Settings Group (Modular)

struct DeveloperSettingsGroup: SettingsContent {
    @Bindable var settings: SettingsState

    var body: some SettingsContent {
        SettingsGroup("Developer", systemImage: "hammer", .inline) {
            // Advanced section
            SettingsGroup("Advanced") {
                SettingsItem("Debug Mode") {
                    Toggle("Enable", isOn: $settings.debugMode)
                }

                // Conditionally show these options only when debug mode is enabled
                if settings.debugMode {
                    SettingsItem("Verbose Logging") {
                        Toggle("Enable", isOn: $settings.verboseLogging)
                    }

                    SettingsItem("Show Hidden Features") {
                        Toggle("Enable", isOn: $settings.showHiddenFeatures)
                    }
                }
            }

            // Developer Tools section
            SettingsGroup("Developer Tools") {
                SettingsItem("Network Debugging") {
                    Toggle("Enable", isOn: $settings.networkDebugging)
                }
            }

            // Appearance section
            SettingsGroup("Appearance", systemImage: "paintbrush") {
                SettingsItem("Dark Mode") {
                    Toggle("Enable", isOn: $settings.darkMode)
                }
            }
        }
        .settingsTags(["developer", "debug", "advanced", "tools"])
    }
}

// MARK: - Custom Settings Style (Demo)

struct CustomSettingsStyle: SettingsStyle {
    func makeContainer(configuration: ContainerConfiguration) -> some View {
        NavigationStack(path: configuration.navigationPath) {
            ScrollView {
                configuration.content
            }
            .navigationTitle(configuration.title)
            .background(Color.blue.opacity(0.05))
        }
    }

    func makeGroup(configuration: GroupConfiguration) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            configuration.label
                .font(.headline)
                .foregroundStyle(.purple)

            configuration.content
                .padding(.leading, 16)
        }
        .padding()
        .background(Color.purple.opacity(0.05))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    func makeItem(configuration: ItemConfiguration) -> some View {
        HStack {
            configuration.label
                .foregroundStyle(.green)

            Spacer()

            configuration.content
        }
        .padding(12)
        .background(Color.green.opacity(0.1))
    }
}

// MARK: - App Entry Point

@main
struct SettingsKitDemoApp: App {
    @State private var settings = SettingsState()

    var body: some Scene {
        WindowGroup {
            DemoSettings()
                .environment(settings)
                // Choose presentation style:
                .settingsStyle(.sidebar)  // Default: split view
                // .settingsStyle(.single)  // Single column
                // .settingsStyle(CustomSettingsStyle())  // Custom
                .onAppear {
                    // settings.load()  // Uncomment if using persistence
                }
                .onDisappear {
                    // settings.save()  // Uncomment if using persistence
                }
        }
    }
}

// MARK: - Stress Test (Performance Testing)

struct StressTestSettings: SettingsContainer {
    @Environment(SettingsState.self) var state

    var settingsBody: some SettingsContent {
        @Bindable var settings = state

        // Test 1: Wide Hierarchy (100 groups with 10 items each)
        ForEach(0..<100, id: \.self) { groupIndex in
            SettingsGroup("Group \(groupIndex)", systemImage: "folder") {
                ForEach(0..<10, id: \.self) { itemIndex in
                    SettingsItem("Item \(groupIndex)-\(itemIndex)") {
                        Toggle("Enable", isOn: $settings.testToggle)
                    }
                }
            }
        }

        // Test 2: Deep Single Group (1000 items inline)
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

        // Test 3: Deep Nesting (10 levels deep)
        DeepNestedGroup(level: 0, maxLevel: 10, settings: settings)

        // Test 4: Mixed Inline and Navigation Groups
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
    }
}

// Recursive deep nesting test
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

// MARK: - Preview

#Preview("Standard Demo") {
    DemoSettings()
        .environment(SettingsState())
}

#Preview("Custom Style") {
    DemoSettings()
        .environment(SettingsState())
        .settingsStyle(CustomSettingsStyle())
}

#Preview("Stress Test") {
    StressTestSettings()
        .environment(SettingsState())
}

// MARK: - Usage Notes

/*
 This demo app showcases:

 1. **Comprehensive State Model**:
    - 25+ properties covering real-world settings
    - System settings (connectivity, display)
    - Developer options with conditional visibility
    - Test controls demonstrating all control types

 2. **All Control Types**:
    - Toggle (boolean switches)
    - Slider (continuous values)
    - TextField (text input)
    - Picker (selection from options)
    - Stepper (increment/decrement)
    - Button (actions)

 3. **Organizational Patterns**:
    - Inline sections for quick access
    - Navigation groups for hierarchies
    - Nested groups for complex structures
    - Modular extraction (DeveloperSettingsGroup)
    - Conditional rendering (if debugMode)

 4. **Custom UI**:
    - CustomSettingsGroup for about section
    - Custom style implementation
    - Platform-adaptive layouts

 5. **Performance Testing**:
    - Wide hierarchy (100x10 items)
    - Deep single group (1000 items)
    - Deep nesting (10 levels)
    - Mixed navigation patterns

 6. **Production Patterns**:
    - State observation with @Observable
    - Binding creation with @Bindable
    - Environment injection
    - Optional persistence hooks
    - Search tags for discoverability

 Run this demo to explore all SettingsKit capabilities!
 */
