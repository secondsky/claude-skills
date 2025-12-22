// Swift API Design Best Practices Example
// Demonstrates well-designed APIs following Swift conventions

import Foundation

// ✅ PRINCIPLE 1: Name by role, not by type

// ❌ Wrong - naming by type
var string = "Hello"
var array = [1, 2, 3]
func process(dictionary: [String: Any]) { }

// ✅ Correct - naming by role
var greeting = "Hello"
var primeNumbers = [2, 3, 5, 7]
func process(userData: [String: Any]) { }

// ✅ PRINCIPLE 2: Clarity at point of use

// ❌ Wrong - unclear at usage
extension Array {
    func remove(_ element: Element) { }  // Removing the element? Or at index?
}
// Usage: employees.remove(x)  // What does 'x' mean?

// ✅ Correct - clear at usage
extension Array where Element: Equatable {
    mutating func remove(element: Element) { }
    mutating func remove(at index: Int) { }
}
// Usage: employees.remove(element: "John")  // Clear!
// Usage: employees.remove(at: 5)  // Clear!

// ✅ PRINCIPLE 3: Methods and side effects

/// Collection extension demonstrating proper naming by side effects
extension Array {
    // No side effects - noun phrase
    /// Returns a sorted copy of this array
    func sorted() -> [Element] where Element: Comparable {
        // Returns new array, original unchanged
        return self.sorted()
    }

    // With side effects - imperative verb
    /// Sorts this array in place
    mutating func sort() where Element: Comparable {
        // Modifies self
        self = self.sorted()
    }
}

// ✅ PRINCIPLE 4: Protocol naming

// Capability protocols - use suffixes: able, ible, ing
protocol Drawable {
    func draw()
}

protocol ProgressReporting {
    var progress: Double { get }
}

// Descriptive protocols - noun
protocol Collection {
    associatedtype Element
}

// ✅ PRINCIPLE 5: Well-documented API

/// A manager that handles user authentication and session management.
///
/// `AuthenticationManager` coordinates login, logout, and session refresh
/// operations. All methods are marked `@MainActor` for UI safety.
///
/// ## Usage
/// ```swift
/// let auth = AuthenticationManager()
/// let user = try await auth.login(email: "user@example.com", password: "secret")
/// ```
///
/// - Important: Always call `logout()` before deallocation to clean up resources.
@MainActor
class AuthenticationManager {

    // MARK: - Properties

    /// The currently authenticated user, if any.
    ///
    /// Setting this property to `nil` is equivalent to logging out,
    /// but prefer using `logout()` for proper cleanup.
    @Published private(set) var currentUser: User?

    /// Indicates whether a session refresh is in progress.
    @Published private(set) var isRefreshing = false

    // MARK: - Initialization

    /// Creates a new authentication manager.
    ///
    /// - Parameter tokenStorage: Storage for authentication tokens.
    ///   Defaults to secure keychain storage.
    init(tokenStorage: TokenStorage = .keychain) {
        self.tokenStorage = tokenStorage
    }

    // MARK: - Public Methods

    /// Authenticates a user with email and password.
    ///
    /// This method validates credentials with the backend API and
    /// stores the authentication token securely.
    ///
    /// - Parameters:
    ///   - email: The user's email address
    ///   - password: The user's password
    /// - Returns: The authenticated user
    /// - Throws: `AuthError.invalidCredentials` if credentials are incorrect,
    ///           or `AuthError.networkError` if the request fails
    ///
    /// ## Example
    /// ```swift
    /// do {
    ///     let user = try await auth.login(
    ///         email: "user@example.com",
    ///         password: "secret"
    ///     )
    ///     print("Logged in as \(user.name)")
    /// } catch AuthError.invalidCredentials {
    ///     print("Wrong email or password")
    /// }
    /// ```
    func login(email: String, password: String) async throws -> User {
        let credentials = Credentials(email: email, password: password)
        let response = try await api.authenticate(credentials)

        await tokenStorage.store(response.token)
        currentUser = response.user

        return response.user
    }

    /// Logs out the current user and clears stored credentials.
    ///
    /// This method is safe to call even if no user is logged in.
    func logout() async {
        currentUser = nil
        await tokenStorage.clear()
    }

    /// Refreshes the current authentication session.
    ///
    /// Call this method when you receive a 401 Unauthorized response
    /// from the API. It will attempt to refresh the session using the
    /// stored refresh token.
    ///
    /// - Throws: `AuthError.sessionExpired` if refresh fails
    /// - Important: This method is automatically called by the API layer
    ///              on 401 responses. Manual calls are rarely needed.
    func refreshSession() async throws {
        guard !isRefreshing else { return }

        isRefreshing = true
        defer { isRefreshing = false }

        guard let token = await tokenStorage.retrieveRefreshToken() else {
            throw AuthError.sessionExpired
        }

        let response = try await api.refresh(token)
        await tokenStorage.store(response.token)
        currentUser = response.user
    }

    // MARK: - Private

    private let tokenStorage: TokenStorage
    private let api = AuthAPI()
}

// ✅ PRINCIPLE 6: Argument labels for clarity

/// Image processing utilities
struct ImageProcessor {

    // Value-preserving conversion - omit first label
    /// Creates a thumbnail from the given image
    static func thumbnail(_ image: UIImage) -> UIImage {
        // Conversion-style API
        return image.resize(to: CGSize(width: 100, height: 100))
    }

    // Prepositional phrase - label at preposition
    /// Applies a filter to an image
    static func apply(filter: ImageFilter, to image: UIImage) -> UIImage {
        // Prepositional phrase starts at 'to'
        return filter.process(image)
    }

    // Grammatical phrase - omit label if forms phrase
    /// Saves an image to disk
    static func save(_ image: UIImage, at url: URL) async throws {
        // "save image at URL" reads naturally
        try await image.write(to: url)
    }

    // All other arguments - use labels
    /// Resizes an image with specified options
    static func resize(
        _ image: UIImage,
        width: CGFloat,
        height: CGFloat,
        quality: CompressionQuality = .high
    ) -> UIImage {
        // All parameters labeled for clarity
        // Note: default parameter at end
        return image.resize(to: CGSize(width: width, height: height))
    }
}

// ✅ PRINCIPLE 7: Factory methods with 'make'

extension URLSession {
    /// Creates a configured session for API requests
    static func makeAPISession() -> URLSession {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30
        config.httpAdditionalHeaders = ["User-Agent": "MyApp/1.0"]
        return URLSession(configuration: config)
    }
}

// ✅ PRINCIPLE 8: Mutating/non-mutating pairs

extension Array {
    // Non-mutating - returns new value
    /// Returns a new array with element appended
    func appending(_ element: Element) -> [Element] {
        var copy = self
        copy.append(element)
        return copy
    }

    // Mutating - modifies in place
    // Note: Standard append() already exists, this is just an example
}

extension Set {
    // Non-mutating - noun
    /// Returns the union of this set with another
    func union(_ other: Set<Element>) -> Set<Element> {
        var result = self
        result.formUnion(other)
        return result
    }

    // Mutating - 'form' prefix
    /// Adds all elements from another set to this set
    mutating func formUnion(_ other: Set<Element>) {
        for element in other {
            insert(element)
        }
    }
}

// ✅ PRINCIPLE 9: Availability annotations

@available(iOS 18, macOS 15, *)
extension AuthenticationManager {
    /// Authenticates using passkey (biometric)
    ///
    /// This method is only available on iOS 18+ and macOS 15+
    func loginWithPasskey() async throws -> User {
        // Use new passkey API
        throw AuthError.notImplemented
    }
}

@available(*, deprecated, message: "Use login(email:password:) instead")
func authenticate(username: String, password: String) async throws -> User {
    // Old API - deprecated
    throw AuthError.notImplemented
}

@available(*, unavailable, renamed: "login(email:password:)")
func signIn(email: String, password: String) async throws -> User {
    // Completely unavailable - Xcode will auto-fix to new name
    fatalError("Use login(email:password:) instead")
}

// ✅ PRINCIPLE 10: Error types following conventions

/// Errors that can occur during authentication
enum AuthError: Error {
    /// The provided credentials were invalid
    case invalidCredentials

    /// The session has expired and cannot be refreshed
    case sessionExpired

    /// A network error occurred
    case networkError(underlyingError: Error)

    /// The feature is not implemented yet
    case notImplemented

    /// Localized description for user-facing messages
    var localizedDescription: String {
        switch self {
        case .invalidCredentials:
            return "Invalid email or password"
        case .sessionExpired:
            return "Your session has expired. Please log in again."
        case .networkError(let error):
            return "Network error: \(error.localizedDescription)"
        case .notImplemented:
            return "This feature is not yet available"
        }
    }
}

// Supporting types
struct User: Codable {
    let id: String
    let name: String
    let email: String
}

struct Credentials {
    let email: String
    let password: String
}

struct AuthResponse {
    let user: User
    let token: String
}

protocol TokenStorage {
    static var keychain: TokenStorage { get }
    func store(_ token: String) async
    func retrieveRefreshToken() async -> String?
    func clear() async
}

struct AuthAPI {
    func authenticate(_ credentials: Credentials) async throws -> AuthResponse {
        throw AuthError.notImplemented
    }

    func refresh(_ token: String) async throws -> AuthResponse {
        throw AuthError.notImplemented
    }
}

struct ImageFilter {
    func process(_ image: UIImage) -> UIImage {
        return image
    }
}

enum CompressionQuality {
    case low, medium, high
}

extension UIImage {
    func resize(to size: CGSize) -> UIImage { self }
    func write(to url: URL) async throws { }
}

// ✅ API DESIGN CHECKLIST:

// NAMING:
// ✅ Types and protocols: UpperCamelCase
// ✅ Everything else: lowerCamelCase
// ✅ Name by role, not type
// ✅ Protocols: -able, -ible, -ing for capabilities
// ✅ Factory methods: start with 'make'

// METHODS:
// ✅ No side effects: noun phrases
// ✅ With side effects: imperative verbs
// ✅ Mutating pairs: verb vs past participle (or form+noun vs noun)

// DOCUMENTATION:
// ✅ Summary for every public declaration
// ✅ Parameters section when needed
// ✅ Returns/Throws sections for clarity
// ✅ Usage examples in complex cases
// ✅ Important/Note/Warning callouts

// ARGUMENTS:
// ✅ Omit labels for type conversions
// ✅ Label at preposition for prepositional phrases
// ✅ Omit label if forms grammatical phrase
// ✅ Label all other arguments
// ✅ Default parameters at end

// CLARITY:
// ✅ Clarity at point of use (not just declaration)
// ✅ Include words to avoid ambiguity
// ✅ Compensate for weak type information
// ✅ Methods form grammatical phrases

// AVAILABILITY:
// ✅ @available for platform requirements
// ✅ Deprecation messages guide migration
// ✅ Use 'renamed' for automatic fixes
