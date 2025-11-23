// Custom SettingsKit Style Template
// Example of creating custom presentation styles for SettingsKit
// Platform: iOS 17+ / macOS 14+ / watchOS 10+ / tvOS 17+ / visionOS 1+
// Swift: 6.0+

import SwiftUI
import SettingsKit

// MARK: - Custom Style Example 1: Compact Card Style

/// Displays settings in compact cards with rounded corners and shadows
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

// MARK: - Custom Style Example 2: macOS Preferences Style

/// Classic macOS preferences pane appearance
struct MacOSPreferencesStyle: SettingsStyle {
    func makeContainer(configuration: ContainerConfiguration) -> some View {
        NavigationSplitView {
            // Sidebar with navigation placeholder
            // Note: This is a simplified structural example. In a full implementation,
            // populate the sidebar with your settings sections using .tag() values
            // and bind to configuration.navigationPath to enable section navigation.
            List {
                Text("Settings Navigation")
                    .foregroundStyle(.secondary)
                    .italic()
                // Example of how you'd add selectable sections:
                // Text("General").tag(generalSectionID)
                // Text("Privacy").tag(privacySectionID)
            }
            .listStyle(.sidebar)
            .frame(minWidth: 200)
        } detail: {
            // Detail pane with content and toolbar
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

// MARK: - Custom Style Example 3: Platform Adaptive Style

/// Adapts layout based on device size class
struct AdaptiveStyle: SettingsStyle {
    @Environment(\.horizontalSizeClass) var sizeClass

    var spacing: CGFloat {
        sizeClass == .compact ? 12 : 20
    }

    var padding: CGFloat {
        sizeClass == .compact ? 16 : 24
    }

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
                // Note: This is a structural example showing adaptive layout.
                // In a production app, you'd populate the detail pane based on
                // the selected item from configuration.navigationPath instead
                // of using a static placeholder.
                NavigationSplitView {
                    List {
                        configuration.content
                    }
                    .navigationTitle(configuration.title)
                } detail: {
                    // Placeholder detail view - in production, show selected content here
                    VStack(spacing: 16) {
                        Image(systemName: "gearshape.2")
                            .font(.system(size: 64))
                            .foregroundStyle(.secondary)
                        Text("Select a setting")
                            .font(.title2)
                            .foregroundStyle(.secondary)
                    }
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
                    .font(sizeClass == .compact ? .subheadline : .headline)
                Spacer()
            }
        }
        .padding(.vertical, spacing / 2)
    }

    func makeItem(configuration: ItemConfiguration) -> some View {
        if sizeClass == .compact {
            // Compact: Stack if needed
            HStack {
                configuration.label
                Spacer()
                configuration.content
            }
        } else {
            // Regular: More spacing
            HStack(spacing: spacing) {
                configuration.label
                    .frame(minWidth: 120, alignment: .leading)
                Spacer()
                configuration.content
                    .frame(maxWidth: 250, alignment: .leading)
            }
        }
    }
}

// MARK: - Custom Style Example 4: Dark Theme Style

/// Custom dark theme with accent colors
struct DarkThemeStyle: SettingsStyle {
    @Environment(\.colorScheme) var colorScheme

    var backgroundColor: Color {
        colorScheme == .dark ? Color(.systemGray6) : Color(.systemGray5)
    }

    var cardBackground: Color {
        colorScheme == .dark ? Color(.systemGray5) : Color(.systemBackground)
    }

    func makeContainer(configuration: ContainerConfiguration) -> some View {
        NavigationStack(path: configuration.navigationPath) {
            ScrollView {
                VStack(spacing: 20) {
                    configuration.content
                }
                .padding()
            }
            .navigationTitle(configuration.title)
            .background(backgroundColor)
        }
    }

    func makeGroup(configuration: GroupConfiguration) -> some View {
        VStack(alignment: .leading, spacing: 16) {
            // Custom gradient header
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

            VStack(spacing: 12) {
                configuration.content
            }
        }
        .padding()
        .background(cardBackground)
        .clipShape(RoundedRectangle(cornerRadius: 16))
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
        .padding(.vertical, 8)
    }
}

// MARK: - Custom Style Example 5: Minimal List Style

/// Bare-bones list without extra styling
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
        .padding(.vertical, 4)
    }
}

// MARK: - Usage Example

// NOTE: AppSettings, MySettings, and MyApp are example names used across
// multiple templates in this skill. If combining multiple templates into the
// same target:
// 1. Rename these types to avoid duplicate-type errors (e.g., StyleDemoSettings, StyleDemoApp)
// 2. Keep only ONE @main App active - comment out or remove extra @main attributes
//    from other templates to avoid multiple entry point errors

@Observable
class AppSettings {
    var notifications = true
    var darkMode = false
}

struct MySettings: SettingsContainer {
    @Environment(AppSettings.self) var appSettings

    var settingsBody: some SettingsContent {
        @Bindable var settings = appSettings

        SettingsGroup("General", systemImage: "gear") {
            SettingsItem("Notifications") {
                Toggle("Enable", isOn: $settings.notifications)
            }
        }

        SettingsGroup("Appearance", systemImage: "paintbrush") {
            SettingsItem("Dark Mode") {
                Toggle("Enable", isOn: $settings.darkMode)
            }
        }
    }
}

@main
struct MyApp: App {
    @State private var settings = AppSettings()

    var body: some Scene {
        WindowGroup {
            MySettings()
                .environment(settings)
                // Choose one of the custom styles:
                .settingsStyle(CompactCardStyle())
                // .settingsStyle(MacOSPreferencesStyle())
                // .settingsStyle(AdaptiveStyle())
                // .settingsStyle(DarkThemeStyle())
                // .settingsStyle(MinimalListStyle())
        }
    }
}

// MARK: - Preview

#Preview("Compact Card Style") {
    MySettings()
        .environment(AppSettings())
        .settingsStyle(CompactCardStyle())
}

#Preview("macOS Preferences Style") {
    MySettings()
        .environment(AppSettings())
        .settingsStyle(MacOSPreferencesStyle())
}

#Preview("Adaptive Style") {
    MySettings()
        .environment(AppSettings())
        .settingsStyle(AdaptiveStyle())
}

// MARK: - Style Customization Tips

/*
 1. Container Customization:
    - Control overall navigation (NavigationStack vs NavigationSplitView)
    - Set background colors, spacing
    - Add toolbars, search bars

 2. Group Customization:
    - Style section headers
    - Add dividers, backgrounds
    - Control spacing between items

 3. Item Customization:
    - Layout (HStack, VStack for large text)
    - Label styling (fonts, colors)
    - Control positioning

 4. Platform Adaptation:
    - Use @Environment(\.horizontalSizeClass) for layout
    - Use @Environment(\.colorScheme) for dark mode
    - Use @Environment(\.dynamicTypeSize) for accessibility

 5. Best Practices:
    - Match platform conventions
    - Respect color scheme (use semantic colors)
    - Support dynamic type
    - Keep navigation simple
    - Don't override navigationPath binding
 */
