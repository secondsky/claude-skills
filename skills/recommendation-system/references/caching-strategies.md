# Caching Strategies for Recommendation Systems

Production caching patterns for low-latency recommendations with Redis, in-memory caching, and cache invalidation strategies.

## Overview

Effective caching is critical for recommendation systems:
- **Sub-millisecond latency**: Serve from memory
- **Cost reduction**: Fewer model inferences
- **Scalability**: Handle traffic spikes

## Redis Caching Patterns

### Basic Recommendation Caching

```python
import redis
import json
from typing import List, Dict, Optional
import logging
from datetime import timedelta

logger = logging.getLogger(__name__)


class RecommendationCache:
    """Redis-backed cache for recommendations."""

    def __init__(
        self,
        redis_client: redis.Redis,
        ttl_seconds: int = 300  # 5 minutes
    ):
        self.redis = redis_client
        self.ttl = ttl_seconds

    def get(self, user_id: str, n: int) -> Optional[List[Dict]]:
        """
        Get cached recommendations.

        Args:
            user_id: User ID
            n: Number of recommendations

        Returns:
            List of recommendations or None if not cached
        """
        cache_key = f"recs:{user_id}:{n}"

        try:
            cached = self.redis.get(cache_key)

            if cached:
                logger.debug(f"Cache hit: {cache_key}")
                return json.loads(cached)

            logger.debug(f"Cache miss: {cache_key}")
            return None

        except Exception as e:
            logger.error(f"Cache get failed: {e}")
            return None

    def set(
        self,
        user_id: str,
        n: int,
        recommendations: List[Dict],
        ttl: Optional[int] = None
    ):
        """
        Cache recommendations.

        Args:
            user_id: User ID
            n: Number of recommendations
            recommendations: List of recommendation dicts
            ttl: Optional custom TTL (seconds)
        """
        cache_key = f"recs:{user_id}:{n}"
        ttl = ttl or self.ttl

        try:
            self.redis.setex(
                cache_key,
                ttl,
                json.dumps(recommendations)
            )
            logger.debug(f"Cached: {cache_key} (TTL: {ttl}s)")

        except Exception as e:
            logger.error(f"Cache set failed: {e}")

    def invalidate(self, user_id: str):
        """
        Invalidate all cached recommendations for user.

        Args:
            user_id: User ID
        """
        pattern = f"recs:{user_id}:*"

        try:
            # Find keys matching pattern
            keys = self.redis.keys(pattern)

            if keys:
                self.redis.delete(*keys)
                logger.info(f"Invalidated {len(keys)} cache entries for {user_id}")

        except Exception as e:
            logger.error(f"Cache invalidation failed: {e}")

    def batch_get(
        self,
        user_ids: List[str],
        n: int
    ) -> Dict[str, Optional[List[Dict]]]:
        """
        Get recommendations for multiple users.

        Args:
            user_ids: List of user IDs
            n: Number of recommendations

        Returns:
            Dictionary mapping user_id to recommendations (or None)
        """
        cache_keys = [f"recs:{user_id}:{n}" for user_id in user_ids]

        try:
            # Batch fetch
            cached_values = self.redis.mget(cache_keys)

            results = {}
            for user_id, cached in zip(user_ids, cached_values):
                if cached:
                    results[user_id] = json.loads(cached)
                else:
                    results[user_id] = None

            hits = sum(1 for v in results.values() if v is not None)
            logger.info(f"Batch get: {hits}/{len(user_ids)} cache hits")

            return results

        except Exception as e:
            logger.error(f"Batch cache get failed: {e}")
            return {user_id: None for user_id in user_ids}


### Tiered Caching Strategy

```python
from functools import lru_cache
import time


class TieredCache:
    """
    Multi-tier caching: L1 (in-memory) → L2 (Redis) → L3 (database).

    L1: Fast, small capacity, short TTL
    L2: Medium speed, larger capacity, medium TTL
    L3: Slow, unlimited capacity, source of truth
    """

    def __init__(
        self,
        redis_client: redis.Redis,
        l1_max_size: int = 1000,
        l1_ttl: int = 60,  # 1 minute
        l2_ttl: int = 300  # 5 minutes
    ):
        self.redis = redis_client
        self.l1_ttl = l1_ttl
        self.l2_ttl = l2_ttl

        # L1: In-memory cache with LRU eviction
        self.l1_cache = {}
        self.l1_max_size = l1_max_size
        self.l1_timestamps = {}

    def get(self, key: str) -> Optional[Dict]:
        """Get value from tiered cache."""

        # L1: In-memory (fastest)
        if key in self.l1_cache:
            # Check if expired
            if time.time() - self.l1_timestamps[key] < self.l1_ttl:
                logger.debug(f"L1 hit: {key}")
                return self.l1_cache[key]
            else:
                # Expired, remove
                del self.l1_cache[key]
                del self.l1_timestamps[key]

        # L2: Redis
        try:
            cached = self.redis.get(key)
            if cached:
                logger.debug(f"L2 hit: {key}")
                value = json.loads(cached)

                # Promote to L1
                self._set_l1(key, value)

                return value

        except Exception as e:
            logger.error(f"L2 cache error: {e}")

        # L3: Miss (caller will fetch from database)
        logger.debug(f"Cache miss: {key}")
        return None

    def set(self, key: str, value: Dict):
        """Set value in all cache tiers."""

        # L1: In-memory
        self._set_l1(key, value)

        # L2: Redis
        try:
            self.redis.setex(
                key,
                self.l2_ttl,
                json.dumps(value)
            )
        except Exception as e:
            logger.error(f"L2 cache set error: {e}")

    def _set_l1(self, key: str, value: Dict):
        """Set value in L1 cache with LRU eviction."""

        # Evict if at capacity
        if len(self.l1_cache) >= self.l1_max_size and key not in self.l1_cache:
            # Find oldest entry
            oldest_key = min(
                self.l1_timestamps.keys(),
                key=lambda k: self.l1_timestamps[k]
            )
            del self.l1_cache[oldest_key]
            del self.l1_timestamps[oldest_key]

        self.l1_cache[key] = value
        self.l1_timestamps[key] = time.time()

    def invalidate(self, key: str):
        """Invalidate key in all tiers."""

        # L1
        if key in self.l1_cache:
            del self.l1_cache[key]
            del self.l1_timestamps[key]

        # L2
        try:
            self.redis.delete(key)
        except Exception as e:
            logger.error(f"L2 invalidation error: {e}")
```

## Cache Warming Strategies

### Precompute Popular User Recommendations

```python
from concurrent.futures import ThreadPoolExecutor
import schedule


class CacheWarmer:
    """Precompute and cache recommendations for popular users."""

    def __init__(
        self,
        recommendation_service,
        cache: RecommendationCache,
        db_client
    ):
        self.rec_service = recommendation_service
        self.cache = cache
        self.db = db_client

    def warm_top_users(self, top_n: int = 10000, workers: int = 10):
        """
        Precompute recommendations for top N active users.

        Args:
            top_n: Number of users to warm
            workers: Thread pool size
        """
        # Get most active users
        user_ids = self._get_top_active_users(top_n)

        logger.info(f"Warming cache for {len(user_ids)} users")

        # Parallel warm
        with ThreadPoolExecutor(max_workers=workers) as executor:
            executor.map(self._warm_user, user_ids)

        logger.info(f"Cache warming complete for {len(user_ids)} users")

    def _warm_user(self, user_id: str):
        """Warm cache for single user."""
        try:
            # Generate recommendations
            recs = self.rec_service.get_recommendations(
                user_id=user_id,
                n=20  # Cache top 20
            )

            # Cache is updated inside get_recommendations
            logger.debug(f"Warmed cache for user {user_id}")

        except Exception as e:
            logger.error(f"Failed to warm user {user_id}: {e}")

    def _get_top_active_users(self, limit: int) -> List[str]:
        """Get most active users from database."""
        query = """
        SELECT user_id
        FROM user_activity
        ORDER BY last_active DESC
        LIMIT %s
        """

        results = self.db.execute(query, (limit,))
        return [row['user_id'] for row in results]

    def schedule_warming(self, hour: int = 2):
        """
        Schedule daily cache warming.

        Args:
            hour: Hour to run (0-23)
        """
        schedule.every().day.at(f"{hour:02d}:00").do(
            self.warm_top_users
        )

        logger.info(f"Scheduled cache warming daily at {hour}:00")

        # Run scheduler loop (in production, use Celery/Airflow)
        while True:
            schedule.run_pending()
            time.sleep(60)
```

## Cache Invalidation

### Event-Driven Invalidation

```python
from typing import Set


class CacheInvalidator:
    """Invalidate cache based on user actions."""

    def __init__(self, cache: RecommendationCache):
        self.cache = cache

        # Actions that should invalidate cache
        self.invalidating_actions = {
            'purchase',
            'rating',
            'add_to_cart',
            'wishlist_add',
            'profile_update'
        }

    def on_user_action(self, user_id: str, action: str):
        """
        Handle user action and invalidate if needed.

        Args:
            user_id: User who performed action
            action: Action type
        """
        if action in self.invalidating_actions:
            logger.info(f"Invalidating cache for {user_id} due to {action}")
            self.cache.invalidate(user_id)

    def on_item_update(self, item_id: str):
        """
        Invalidate caches that included this item.

        Note: This is expensive! Only use for critical updates.
        """
        # In production, maintain an index: item_id -> [user_ids]
        # For now, invalidate all (not recommended for production)
        logger.warning(f"Item {item_id} updated - full cache flush needed")
        # self.cache.redis.flushdb()  # Use with caution!
```

## Probabilistic Cache Warming

### Thunder Herd Prevention

```python
import random


class ProbabilisticCache:
    """
    Cache with probabilistic early expiration to prevent thundering herd.

    When many requests hit expired cache simultaneously, they all
    trigger expensive recomputation. This spreads out expirations.
    """

    def __init__(self, redis_client: redis.Redis, base_ttl: int = 300):
        self.redis = redis_client
        self.base_ttl = base_ttl

    def set(self, key: str, value: Dict):
        """Set with randomized TTL."""

        # Add jitter: ±10% of base TTL
        jitter = random.uniform(-0.1, 0.1) * self.base_ttl
        ttl = int(self.base_ttl + jitter)

        self.redis.setex(key, ttl, json.dumps(value))

    def get_with_refresh(
        self,
        key: str,
        refresh_fn,
        refresh_probability: float = 0.1
    ) -> Optional[Dict]:
        """
        Get value, with probabilistic early refresh.

        Args:
            key: Cache key
            refresh_fn: Function to recompute value
            refresh_probability: Chance to refresh before expiry

        Returns:
            Cached or fresh value
        """
        cached = self.redis.get(key)

        if cached:
            # Probabilistically refresh even though cached
            if random.random() < refresh_probability:
                logger.debug(f"Probabilistic refresh: {key}")
                value = refresh_fn()
                self.set(key, value)
                return value

            return json.loads(cached)

        # Cache miss - recompute
        logger.debug(f"Cache miss, recomputing: {key}")
        value = refresh_fn()
        self.set(key, value)
        return value
```

## Performance Monitoring

### Cache Metrics Tracker

```python
from prometheus_client import Counter, Histogram, Gauge


cache_hits = Counter(
    'recommendation_cache_hits_total',
    'Total cache hits',
    ['cache_tier']
)

cache_misses = Counter(
    'recommendation_cache_misses_total',
    'Total cache misses',
    ['cache_tier']
)

cache_latency = Histogram(
    'recommendation_cache_latency_seconds',
    'Cache operation latency',
    ['operation'],
    buckets=[0.001, 0.005, 0.01, 0.05, 0.1]
)

cache_size = Gauge(
    'recommendation_cache_size_bytes',
    'Current cache size',
    ['cache_tier']
)


class MonitoredCache(RecommendationCache):
    """Cache with Prometheus metrics."""

    def get(self, user_id: str, n: int) -> Optional[List[Dict]]:
        import time
        start = time.time()

        result = super().get(user_id, n)

        latency = time.time() - start
        cache_latency.labels(operation='get').observe(latency)

        if result:
            cache_hits.labels(cache_tier='redis').inc()
        else:
            cache_misses.labels(cache_tier='redis').inc()

        return result

    def set(self, user_id: str, n: int, recommendations: List[Dict], ttl=None):
        import time
        start = time.time()

        super().set(user_id, n, recommendations, ttl)

        latency = time.time() - start
        cache_latency.labels(operation='set').observe(latency)
```

## Best Practices

1. **Layer Your Caching**: Use L1 (memory) → L2 (Redis) → L3 (database)
2. **Set Appropriate TTLs**: Short TTL (1-5 min) for personalized, longer for popular
3. **Invalidate Strategically**: Only invalidate when user behavior changes
4. **Warm Popular Caches**: Precompute for active users during low-traffic hours
5. **Monitor Hit Rates**: Track cache effectiveness, optimize if <80% hit rate
6. **Handle Failures Gracefully**: Cache failures shouldn't break recommendations
7. **Add Jitter to TTLs**: Prevent thundering herd with randomized expiration
8. **Batch Operations**: Use MGET/MSET for multiple users
