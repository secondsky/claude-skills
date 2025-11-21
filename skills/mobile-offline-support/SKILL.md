---
name: mobile-offline-support
description: Implements offline-first mobile applications with local storage, sync queues, and conflict resolution strategies. Use when building apps that must work without connectivity, implementing data sync, or handling offline scenarios.
---

# Mobile Offline Support

Build offline-first mobile applications with local storage and synchronization.

## React Native Implementation

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

class OfflineManager {
  constructor() {
    this.syncQueue = [];
    this.isOnline = true;

    NetInfo.addEventListener(state => {
      this.isOnline = state.isConnected;
      if (this.isOnline) this.processQueue();
    });
  }

  async getData(key) {
    const cached = await AsyncStorage.getItem(key);
    if (cached) return JSON.parse(cached);

    if (this.isOnline) {
      const data = await this.fetchFromServer(key);
      await AsyncStorage.setItem(key, JSON.stringify(data));
      return data;
    }

    return null;
  }

  async saveData(key, data) {
    await AsyncStorage.setItem(key, JSON.stringify(data));

    if (this.isOnline) {
      await this.syncToServer(key, data);
    } else {
      this.syncQueue.push({ key, data, timestamp: Date.now() });
      await AsyncStorage.setItem('syncQueue', JSON.stringify(this.syncQueue));
    }
  }

  async processQueue() {
    for (const item of this.syncQueue) {
      try {
        await this.syncToServer(item.key, item.data);
      } catch (err) {
        console.error('Sync failed:', err);
      }
    }
    this.syncQueue = [];
    await AsyncStorage.removeItem('syncQueue');
  }
}
```

## Conflict Resolution

```javascript
function resolveConflict(local, server) {
  // Last-write-wins
  if (local.updatedAt > server.updatedAt) return local;
  return server;

  // Or merge changes
  // return { ...server, ...local };
}
```

## UI Indicators

```jsx
function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    return NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected);
    });
  }, []);

  if (isOnline) return null;

  return (
    <View style={styles.banner}>
      <Text>You're offline. Changes will sync when connected.</Text>
    </View>
  );
}
```

## Best Practices

- Cache frequently accessed data locally
- Queue actions for later sync
- Show clear offline indicators
- Handle sync conflicts gracefully
- Compress stored data
- Test offline scenarios thoroughly

## Native Implementations

See [references/native-implementations.md](references/native-implementations.md) for:
- iOS Core Data with sync manager
- Android Room database with WorkManager sync

## Avoid

- Assuming connectivity
- Losing data on sync failures
- Unbounded queue growth
- Syncing sensitive data insecurely
