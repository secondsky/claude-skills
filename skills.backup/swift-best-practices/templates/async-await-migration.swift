// Async/Await Migration Example
// Demonstrates how to migrate from completion handlers to async/await in Swift 6

import Foundation

// BEFORE: Completion Handler Pattern (Swift 5)
// ❌ Issues: Callback hell, error handling complexity, retain cycles

class UserManagerOld {
    func fetchUser(id: String, completion: @escaping (Result<User, Error>) -> Void) {
        URLSession.shared.dataTask(with: URL(string: "https://api.example.com/users/\(id)")!) { data, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }

            guard let data = data else {
                completion(.failure(NetworkError.noData))
                return
            }

            do {
                let user = try JSONDecoder().decode(User.self, from: data)
                completion(.success(user))
            } catch {
                completion(.failure(error))
            }
        }.resume()
    }

    func loadUserProfile(id: String, completion: @escaping (Result<Profile, Error>) -> Void) {
        // Nested callbacks - "callback hell"
        fetchUser(id: id) { result in
            switch result {
            case .success(let user):
                self.fetchProfile(for: user) { profileResult in
                    completion(profileResult)
                }
            case .failure(let error):
                completion(.failure(error))
            }
        }
    }

    private func fetchProfile(for user: User, completion: @escaping (Result<Profile, Error>) -> Void) {
        // Implementation...
    }
}

// AFTER: Async/Await Pattern (Swift 6)
// ✅ Benefits: Linear code flow, automatic error propagation, no retain cycles

@MainActor
class UserManager {

    /// Fetches a user by ID from the API
    /// - Parameter id: The user's unique identifier
    /// - Returns: The user object
    /// - Throws: Network or decoding errors
    func fetchUser(id: String) async throws -> User {
        let url = URL(string: "https://api.example.com/users/\(id)")!
        let (data, _) = try await URLSession.shared.data(from: url)
        return try JSONDecoder().decode(User.self, from: data)
    }

    /// Loads complete user profile by fetching user and their profile data
    /// - Parameter id: The user's unique identifier
    /// - Returns: The user's profile
    /// - Throws: Network or decoding errors
    func loadUserProfile(id: String) async throws -> Profile {
        // Linear, easy-to-read code flow
        let user = try await fetchUser(id: id)
        return try await fetchProfile(for: user)
    }

    /// Loads user profile with automatic cancellation support
    /// - Parameter id: The user's unique identifier
    /// - Returns: The user's profile
    /// - Throws: Network, decoding, or cancellation errors
    func loadUserProfileWithCancellation(id: String) async throws -> Profile {
        // Check for cancellation before expensive operations
        try Task.checkCancellation()

        let user = try await fetchUser(id: id)

        try Task.checkCancellation()

        return try await fetchProfile(for: user)
    }

    /// Parallel execution with async let
    /// Fetches user and settings concurrently for better performance
    func loadUserWithSettings(id: String) async throws -> (User, Settings) {
        async let user = fetchUser(id: id)
        async let settings = fetchSettings(id: id)

        // Both requests run in parallel
        return try await (user, settings)
    }

    private func fetchProfile(for user: User) async throws -> Profile {
        let url = URL(string: "https://api.example.com/profiles/\(user.id)")!
        let (data, _) = try await URLSession.shared.data(from: url)
        return try JSONDecoder().decode(Profile.self, from: data)
    }

    private func fetchSettings(id: String) async throws -> Settings {
        let url = URL(string: "https://api.example.com/settings/\(id)")!
        let (data, _) = try await URLSession.shared.data(from: url)
        return try JSONDecoder().decode(Settings.self, from: data)
    }
}

// MIGRATION CHECKLIST:
// ✅ 1. Mark async functions with 'async' keyword
// ✅ 2. Mark throwing functions with 'throws'
// ✅ 3. Replace completion handlers with direct return values
// ✅ 4. Use 'await' for async calls
// ✅ 5. Use 'try' for throwing calls
// ✅ 6. Add @MainActor for UI-related code
// ✅ 7. Add Task.checkCancellation() for long operations
// ✅ 8. Use 'async let' for parallel execution

// Supporting Types
struct User: Codable {
    let id: String
    let name: String
    let email: String
}

struct Profile: Codable {
    let userId: String
    let bio: String
    let avatarURL: String
}

struct Settings: Codable {
    let theme: String
    let notifications: Bool
}

enum NetworkError: Error {
    case noData
    case invalidResponse
}
