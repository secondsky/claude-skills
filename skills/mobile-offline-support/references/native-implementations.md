# iOS Core Data Offline Support

Complete iOS implementation with Core Data and network monitoring.

```swift
import Foundation
import CoreData
import Network

// MARK: - Persistence Controller

class PersistenceController {
    static let shared = PersistenceController()

    let container: NSPersistentContainer

    init() {
        container = NSPersistentContainer(name: "OfflineModel")
        container.loadPersistentStores { description, error in
            if let error = error {
                fatalError("Unable to load persistent stores: \(error)")
            }
        }
        container.viewContext.automaticallyMergesChangesFromParent = true
    }

    var viewContext: NSManagedObjectContext {
        container.viewContext
    }

    func saveContext() {
        let context = container.viewContext
        if context.hasChanges {
            do {
                try context.save()
            } catch {
                print("Error saving context: \(error)")
            }
        }
    }
}


// MARK: - Core Data Entities

@objc(CachedItem)
public class CachedItem: NSManagedObject {
    @NSManaged public var id: String
    @NSManaged public var data: Data
    @NSManaged public var updatedAt: Date
    @NSManaged public var syncStatus: String // "synced", "pending", "failed"
}

@objc(PendingAction)
public class PendingAction: NSManagedObject {
    @NSManaged public var id: String
    @NSManaged public var actionType: String
    @NSManaged public var payload: Data
    @NSManaged public var createdAt: Date
    @NSManaged public var retryCount: Int16
}


// MARK: - Network Monitor

class NetworkMonitor: ObservableObject {
    static let shared = NetworkMonitor()

    private let monitor = NWPathMonitor()
    private let queue = DispatchQueue(label: "NetworkMonitor")

    @Published var isConnected = true
    @Published var connectionType: ConnectionType = .unknown

    enum ConnectionType {
        case wifi, cellular, ethernet, unknown
    }

    private init() {
        monitor.pathUpdateHandler = { [weak self] path in
            DispatchQueue.main.async {
                self?.isConnected = path.status == .satisfied

                if path.usesInterfaceType(.wifi) {
                    self?.connectionType = .wifi
                } else if path.usesInterfaceType(.cellular) {
                    self?.connectionType = .cellular
                } else if path.usesInterfaceType(.wiredEthernet) {
                    self?.connectionType = .ethernet
                } else {
                    self?.connectionType = .unknown
                }

                if path.status == .satisfied {
                    self?.processPendingActions()
                }
            }
        }
        monitor.start(queue: queue)
    }

    private func processPendingActions() {
        OfflineSyncManager.shared.syncPendingActions()
    }
}


// MARK: - Offline Sync Manager

class OfflineSyncManager {
    static let shared = OfflineSyncManager()

    private let context = PersistenceController.shared.viewContext
    private let maxRetries = 3

    // Cache data locally
    func cacheItem<T: Codable>(id: String, item: T) {
        let fetchRequest: NSFetchRequest<CachedItem> = CachedItem.fetchRequest()
        fetchRequest.predicate = NSPredicate(format: "id == %@", id)

        do {
            let results = try context.fetch(fetchRequest)
            let cachedItem = results.first ?? CachedItem(context: context)

            cachedItem.id = id
            cachedItem.data = try JSONEncoder().encode(item)
            cachedItem.updatedAt = Date()
            cachedItem.syncStatus = "synced"

            PersistenceController.shared.saveContext()
        } catch {
            print("Cache error: \(error)")
        }
    }

    // Get cached data
    func getCachedItem<T: Codable>(id: String, type: T.Type) -> T? {
        let fetchRequest: NSFetchRequest<CachedItem> = CachedItem.fetchRequest()
        fetchRequest.predicate = NSPredicate(format: "id == %@", id)

        do {
            if let cached = try context.fetch(fetchRequest).first {
                return try JSONDecoder().decode(type, from: cached.data)
            }
        } catch {
            print("Fetch error: \(error)")
        }
        return nil
    }

    // Queue action for later sync
    func queueAction(type: String, payload: [String: Any]) {
        let action = PendingAction(context: context)
        action.id = UUID().uuidString
        action.actionType = type
        action.payload = try! JSONSerialization.data(withJSONObject: payload)
        action.createdAt = Date()
        action.retryCount = 0

        PersistenceController.shared.saveContext()
    }

    // Process pending actions when online
    func syncPendingActions() {
        let fetchRequest: NSFetchRequest<PendingAction> = PendingAction.fetchRequest()
        fetchRequest.sortDescriptors = [NSSortDescriptor(key: "createdAt", ascending: true)]

        do {
            let actions = try context.fetch(fetchRequest)

            for action in actions {
                guard action.retryCount < maxRetries else {
                    context.delete(action)
                    continue
                }

                syncAction(action) { success in
                    if success {
                        self.context.delete(action)
                    } else {
                        action.retryCount += 1
                    }
                    PersistenceController.shared.saveContext()
                }
            }
        } catch {
            print("Sync error: \(error)")
        }
    }

    private func syncAction(_ action: PendingAction, completion: @escaping (Bool) -> Void) {
        // Implement API call based on action.actionType
        // Call completion(true) on success, completion(false) on failure
    }
}
```

## Android Room Offline Support

```kotlin
// Entity
@Entity(tableName = "cached_items")
data class CachedItem(
    @PrimaryKey val id: String,
    val data: String,
    val updatedAt: Long = System.currentTimeMillis(),
    val syncStatus: String = "synced"
)

@Entity(tableName = "pending_actions")
data class PendingAction(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    val actionType: String,
    val payload: String,
    val createdAt: Long = System.currentTimeMillis(),
    val retryCount: Int = 0
)

// DAO
@Dao
interface OfflineDao {
    @Query("SELECT * FROM cached_items WHERE id = :id")
    suspend fun getCachedItem(id: String): CachedItem?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun cacheItem(item: CachedItem)

    @Query("SELECT * FROM pending_actions ORDER BY createdAt ASC")
    fun getPendingActions(): Flow<List<PendingAction>>

    @Insert
    suspend fun queueAction(action: PendingAction)

    @Delete
    suspend fun deleteAction(action: PendingAction)

    @Update
    suspend fun updateAction(action: PendingAction)
}

// Repository
class OfflineRepository @Inject constructor(
    private val dao: OfflineDao,
    private val api: ApiService
) {
    suspend fun <T> fetchWithCache(
        id: String,
        fetch: suspend () -> T,
        serialize: (T) -> String,
        deserialize: (String) -> T
    ): T {
        // Try network first
        return try {
            val data = fetch()
            dao.cacheItem(CachedItem(id, serialize(data)))
            data
        } catch (e: Exception) {
            // Fall back to cache
            dao.getCachedItem(id)?.let { deserialize(it.data) }
                ?: throw e
        }
    }

    fun syncPendingActions() = dao.getPendingActions()
        .onEach { actions ->
            actions.forEach { action ->
                if (action.retryCount < 3) {
                    try {
                        // Execute action via API
                        dao.deleteAction(action)
                    } catch (e: Exception) {
                        dao.updateAction(action.copy(retryCount = action.retryCount + 1))
                    }
                }
            }
        }
}
```
