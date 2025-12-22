// @MainActor ViewModel Pattern Example
// Demonstrates proper use of @MainActor for SwiftUI ViewModels in Swift 6

import SwiftUI
import Combine

// ❌ WRONG: ViewModel without @MainActor (Swift 5 pattern)
// ⚠️ Issues: Data races, UI updates from background threads

class ViewModelWrong: ObservableObject {
    @Published var users: [User] = []
    @Published var isLoading = false
    @Published var errorMessage: String?

    func fetchUsers() async {
        isLoading = true  // ⚠️ DATA RACE: May update from background thread

        do {
            let users = try await UserService.fetchUsers()
            self.users = users  // ⚠️ DATA RACE: UI update not guaranteed on main thread
            isLoading = false
        } catch {
            errorMessage = error.localizedDescription  // ⚠️ DATA RACE
            isLoading = false
        }
    }
}

// ✅ CORRECT: ViewModel with @MainActor (Swift 6 pattern)
// Benefits: All properties/methods automatically run on main thread

@MainActor
class UsersViewModel: ObservableObject {
    // All @Published properties are automatically on MainActor
    @Published private(set) var users: [User] = []
    @Published private(set) var isLoading = false
    @Published private(set) var errorMessage: String?

    private let userService: UserService

    /// Initialize with dependency injection for testability
    init(userService: UserService = .shared) {
        self.userService = userService
    }

    /// Fetches users from the API
    /// Automatically runs on MainActor - safe for UI updates
    func fetchUsers() async {
        isLoading = true
        errorMessage = nil

        do {
            // Network call can suspend, but result updates run on main thread
            users = try await userService.fetchUsers()
        } catch {
            errorMessage = error.localizedDescription
        }

        isLoading = false
    }

    /// Refresh with pull-to-refresh pattern
    func refresh() async {
        await fetchUsers()
    }

    /// Delete a user with optimistic updates
    func deleteUser(_ user: User) async throws {
        // Optimistic update - remove from UI immediately
        users.removeAll { $0.id == user.id }

        do {
            try await userService.deleteUser(id: user.id)
        } catch {
            // Rollback on failure
            await fetchUsers()
            throw error
        }
    }
}

// ✅ ADVANCED: ViewModel with background processing

@MainActor
class ImageGalleryViewModel: ObservableObject {
    @Published private(set) var images: [ProcessedImage] = []
    @Published private(set) var processingProgress: Double = 0.0
    @Published private(set) var isProcessing = false

    private let imageService: ImageService
    private var processingTask: Task<Void, Never>?

    init(imageService: ImageService = .shared) {
        self.imageService = imageService
    }

    /// Loads and processes images
    /// Heavy processing happens off MainActor, UI updates on MainActor
    func loadImages() async {
        isProcessing = true
        processingProgress = 0.0

        // Cancel any existing processing
        processingTask?.cancel()

        processingTask = Task {
            do {
                let rawImages = try await imageService.fetchRawImages()

                // Process images in the background (off MainActor)
                var processed: [ProcessedImage] = []

                for (index, rawImage) in rawImages.enumerated() {
                    // Check for cancellation
                    if Task.isCancelled { break }

                    // Process image off MainActor
                    let processedImage = await processImage(rawImage)
                    processed.append(processedImage)

                    // Update progress on MainActor
                    await updateProgress(Double(index + 1) / Double(rawImages.count))
                }

                // Update final results on MainActor
                await MainActor.run {
                    self.images = processed
                    self.isProcessing = false
                    self.processingProgress = 1.0
                }

            } catch {
                await MainActor.run {
                    self.isProcessing = false
                    print("Error loading images: \(error)")
                }
            }
        }
    }

    /// Process image off MainActor for better performance
    nonisolated private func processImage(_ rawImage: RawImage) async -> ProcessedImage {
        // Heavy image processing happens here, off the main thread
        // Simulated work
        try? await Task.sleep(for: .milliseconds(100))
        return ProcessedImage(id: rawImage.id, thumbnail: Data())
    }

    /// Update progress on MainActor
    private func updateProgress(_ progress: Double) {
        self.processingProgress = progress
    }

    /// Cancel ongoing processing
    func cancelProcessing() {
        processingTask?.cancel()
        processingTask = nil
        isProcessing = false
    }

    deinit {
        processingTask?.cancel()
    }
}

// ✅ VIEW EXAMPLE: Using ViewModel in SwiftUI

@MainActor
struct UsersListView: View {
    @StateObject private var viewModel = UsersViewModel()

    var body: some View {
        NavigationStack {
            Group {
                if viewModel.isLoading {
                    ProgressView("Loading users...")
                } else if let error = viewModel.errorMessage {
                    VStack {
                        Text("Error: \(error)")
                            .foregroundColor(.red)
                        Button("Retry") {
                            Task {
                                await viewModel.fetchUsers()
                            }
                        }
                    }
                } else {
                    List {
                        ForEach(viewModel.users) { user in
                            UserRow(user: user)
                                .swipeActions {
                                    Button(role: .destructive) {
                                        Task {
                                            try? await viewModel.deleteUser(user)
                                        }
                                    } label: {
                                        Label("Delete", systemImage: "trash")
                                    }
                                }
                        }
                    }
                    .refreshable {
                        await viewModel.refresh()
                    }
                }
            }
            .navigationTitle("Users")
            .task {
                await viewModel.fetchUsers()
            }
        }
    }
}

struct UserRow: View {
    let user: User

    var body: some View {
        HStack {
            Text(user.name)
            Spacer()
            Text(user.email)
                .foregroundColor(.secondary)
        }
    }
}

// ✅ MAINACTOR KEY PRINCIPLES:

// 1. Mark ViewModels with @MainActor for automatic main thread execution
// 2. All @Published properties automatically run on main thread
// 3. Async methods can suspend but resume on MainActor
// 4. Use nonisolated for heavy background work
// 5. No need for DispatchQueue.main.async - it's automatic!

// ❌ COMMON MISTAKES:

// Mistake 1: Using MainActor.run unnecessarily
func updateUI_Wrong() async {
    await MainActor.run {  // ❌ Redundant - already on MainActor
        // Update UI
    }
}
// ✅ Better: Just update directly (you're already on MainActor)
func updateUI_Correct() {
    // Update UI directly
}

// Mistake 2: Forgetting @MainActor on View
class ViewWrong: ObservableObject {  // ❌ Missing @MainActor
    @Published var data: String = ""
}
// ✅ Better:
@MainActor
class ViewCorrect: ObservableObject {
    @Published var data: String = ""
}

// Mistake 3: Making entire ViewModel nonisolated
nonisolated class WrongViewModel: ObservableObject {  // ❌ Don't do this
    // Published properties need MainActor
}

// Supporting Types
struct User: Identifiable, Codable {
    let id: String
    let name: String
    let email: String
}

struct RawImage {
    let id: String
    let data: Data
}

struct ProcessedImage: Identifiable {
    let id: String
    let thumbnail: Data
}

@MainActor
class UserService {
    static let shared = UserService()

    func fetchUsers() async throws -> [User] {
        // Simulated API call
        try await Task.sleep(for: .seconds(1))
        return [
            User(id: "1", name: "Alice", email: "alice@example.com"),
            User(id: "2", name: "Bob", email: "bob@example.com")
        ]
    }

    func deleteUser(id: String) async throws {
        // Simulated delete
        try await Task.sleep(for: .milliseconds(500))
    }
}

@MainActor
class ImageService {
    static let shared = ImageService()

    func fetchRawImages() async throws -> [RawImage] {
        // Simulated fetch
        try await Task.sleep(for: .seconds(1))
        return [
            RawImage(id: "1", data: Data()),
            RawImage(id: "2", data: Data())
        ]
    }
}

// WHEN TO USE @MainActor:
// ✅ SwiftUI ViewModels (ObservableObject)
// ✅ UIKit ViewControllers and UI managers
// ✅ Any code that updates UI
// ✅ Classes with @Published properties
// ✅ Coordinators and navigation managers

// WHEN NOT TO USE @MainActor:
// ❌ Background services (use actors instead)
// ❌ Network or database layers
// ❌ Heavy computation or data processing
// ❌ Value types (structs/enums) - they don't need isolation
