# Production Recommendation System Architecture

Complete architecture patterns for scalable, production-ready recommendation systems with feature stores, model serving, and monitoring.

## Overview

A production recommendation system requires:
- **Feature Store**: Centralized feature management
- **Model Serving**: Low-latency predictions
- **Caching Layer**: Sub-millisecond responses
- **A/B Testing**: Continuous experimentation
- **Monitoring**: Track quality and performance

## Complete Recommendation Service

```python
from typing import List, Dict, Optional
import numpy as np
from dataclasses import dataclass
import logging
from datetime import datetime, timedelta
import hashlib
import json

logger = logging.getLogger(__name__)


@dataclass
class Recommendation:
    """Single recommendation result."""
    item_id: str
    score: float
    reason: str
    metadata: Dict


class FeatureStore:
    """
    Centralized feature storage for users and items.

    Provides low-latency access to precomputed features.
    """

    def __init__(self, redis_client=None, db_client=None):
        self.redis = redis_client  # Fast cache
        self.db = db_client  # Persistent storage
        self.cache_ttl = 3600  # 1 hour

    def get_user_features(self, user_id: str) -> Dict:
        """
        Get user features with caching.

        Returns:
            Dictionary of user features
        """
        # Try cache first
        cache_key = f"user_features:{user_id}"

        if self.redis:
            cached = self.redis.get(cache_key)
            if cached:
                logger.debug(f"Cache hit for user {user_id}")
                return json.loads(cached)

        # Fetch from database
        features = self._fetch_user_features_from_db(user_id)

        # Cache for next time
        if self.redis and features:
            self.redis.setex(
                cache_key,
                self.cache_ttl,
                json.dumps(features)
            )

        return features

    def get_item_features(self, item_id: str) -> Dict:
        """Get item features with caching."""
        cache_key = f"item_features:{item_id}"

        if self.redis:
            cached = self.redis.get(cache_key)
            if cached:
                return json.loads(cached)

        features = self._fetch_item_features_from_db(item_id)

        if self.redis and features:
            self.redis.setex(
                cache_key,
                self.cache_ttl,
                json.dumps(features)
            )

        return features

    def get_batch_item_features(self, item_ids: List[str]) -> Dict[str, Dict]:
        """
        Efficiently fetch features for multiple items.

        Uses Redis MGET for batching.
        """
        if not self.redis:
            return {
                item_id: self.get_item_features(item_id)
                for item_id in item_ids
            }

        # Batch fetch from cache
        cache_keys = [f"item_features:{item_id}" for item_id in item_ids]
        cached_values = self.redis.mget(cache_keys)

        results = {}
        missing_ids = []

        for item_id, cached in zip(item_ids, cached_values):
            if cached:
                results[item_id] = json.loads(cached)
            else:
                missing_ids.append(item_id)

        # Fetch missing from database
        if missing_ids:
            missing_features = self._fetch_batch_items_from_db(missing_ids)

            # Cache missing features
            pipe = self.redis.pipeline()
            for item_id, features in missing_features.items():
                cache_key = f"item_features:{item_id}"
                pipe.setex(
                    cache_key,
                    self.cache_ttl,
                    json.dumps(features)
                )
                results[item_id] = features
            pipe.execute()

        return results

    def _fetch_user_features_from_db(self, user_id: str) -> Dict:
        """Fetch user features from database."""
        if not self.db:
            # Fallback to defaults
            return {
                'user_id': user_id,
                'total_purchases': 0,
                'avg_rating': 0.0,
                'favorite_categories': []
            }

        # Actual database query
        query = """
        SELECT
            total_purchases,
            avg_rating,
            favorite_categories,
            recent_views,
            created_at
        FROM user_features
        WHERE user_id = %s
        """

        result = self.db.execute(query, (user_id,))
        if not result:
            return {}

        row = result.fetchone()
        if not row:
            return {}  # No matching user found

        return dict(row)

    def _fetch_item_features_from_db(self, item_id: str) -> Dict:
        """Fetch item features from database."""
        if not self.db:
            return {
                'item_id': item_id,
                'category': 'unknown',
                'price': 0.0,
                'popularity': 0.0
            }

        query = """
        SELECT
            category,
            price,
            popularity_score,
            avg_rating,
            num_ratings,
            tags
        FROM item_features
        WHERE item_id = %s
        """

        result = self.db.execute(query, (item_id,))
        if not result:
            return {}

        row = result.fetchone()
        if not row:
            return {}  # No matching item found

        return dict(row)

    def _fetch_batch_items_from_db(self, item_ids: List[str]) -> Dict[str, Dict]:
        """Fetch multiple items efficiently."""
        if not self.db:
            return {}

        placeholders = ','.join(['%s'] * len(item_ids))
        query = f"""
        SELECT
            item_id,
            category,
            price,
            popularity_score,
            avg_rating,
            tags
        FROM item_features
        WHERE item_id IN ({placeholders})
        """

        results = self.db.execute_many(query, item_ids)
        return {row['item_id']: dict(row) for row in results}


class ModelServing:
    """
    Model serving layer for recommendations.

    Supports multiple models and A/B testing.
    """

    def __init__(self):
        self.models = {}
        self.default_model = None

    def register_model(
        self,
        name: str,
        model,
        is_default: bool = False
    ):
        """Register a model for serving."""
        self.models[name] = model

        if is_default or not self.default_model:
            self.default_model = name

        logger.info(f"Registered model: {name}")

    def predict(
        self,
        user_features: Dict,
        item_features: List[Dict],
        model_name: Optional[str] = None
    ) -> np.ndarray:
        """
        Generate predictions using specified model.

        Args:
            user_features: User feature dictionary
            item_features: List of item feature dictionaries
            model_name: Model to use (defaults to primary)

        Returns:
            Array of scores for each item
        """
        model_name = model_name or self.default_model

        if model_name not in self.models:
            raise ValueError(f"Model {model_name} not found")

        model = self.models[model_name]

        # Transform features to model input format
        X = self._prepare_features(user_features, item_features)

        # Predict
        scores = model.predict(X)

        return scores

    def _prepare_features(
        self,
        user_features: Dict,
        item_features: List[Dict]
    ) -> np.ndarray:
        """
        Prepare features for model input.

        Combines user and item features into format expected by model.
        """
        # This depends on your model's feature format
        # Example: concatenate user features with each item
        n_items = len(item_features)

        # Extract user vector
        user_vec = np.array([
            user_features.get('total_purchases', 0),
            user_features.get('avg_rating', 0.0),
            len(user_features.get('favorite_categories', []))
        ])

        # Extract item vectors
        item_vecs = np.array([
            [
                item.get('popularity_score', 0.0),
                item.get('price', 0.0),
                item.get('avg_rating', 0.0)
            ]
            for item in item_features
        ])

        # Combine: repeat user vector for each item
        user_repeated = np.tile(user_vec, (n_items, 1))
        features = np.hstack([user_repeated, item_vecs])

        return features


class RecommendationService:
    """
    Complete recommendation service.

    Orchestrates feature fetching, scoring, ranking, and filtering.
    """

    def __init__(
        self,
        feature_store: FeatureStore,
        model_serving: ModelServing,
        cache=None
    ):
        self.feature_store = feature_store
        self.model_serving = model_serving
        self.cache = cache
        self.cache_ttl = 300  # 5 minutes

    def get_recommendations(
        self,
        user_id: str,
        n: int = 10,
        filters: Optional[Dict] = None,
        model_name: Optional[str] = None
    ) -> List[Recommendation]:
        """
        Generate personalized recommendations.

        Args:
            user_id: User to recommend for
            n: Number of recommendations
            filters: Optional filters (category, price range, etc.)
            model_name: Model variant to use

        Returns:
            List of Recommendation objects
        """
        # Check cache
        cache_key = f"recs:{user_id}:{n}:{model_name}"

        if self.cache:
            cached = self.cache.get(cache_key)
            if cached:
                logger.info(f"Cache hit for user {user_id}")
                return [
                    Recommendation(**rec)
                    for rec in json.loads(cached)
                ]

        # Get user features
        user_features = self.feature_store.get_user_features(user_id)

        # Get candidate items
        candidates = self._get_candidates(user_id, filters)

        if not candidates:
            logger.warning(f"No candidates for user {user_id}")
            return []

        # Get item features (batch)
        item_features = self.feature_store.get_batch_item_features(candidates)

        # Prepare features for scoring
        item_feature_list = [
            item_features.get(item_id, {})
            for item_id in candidates
        ]

        # Score candidates
        scores = self.model_serving.predict(
            user_features,
            item_feature_list,
            model_name
        )

        # Rank and select top N
        recommendations = self._rank_and_diversify(
            candidates,
            scores,
            item_features,
            n
        )

        # Cache result
        if self.cache:
            serialized = [
                {
                    'item_id': rec.item_id,
                    'score': rec.score,
                    'reason': rec.reason,
                    'metadata': rec.metadata
                }
                for rec in recommendations
            ]
            self.cache.setex(
                cache_key,
                self.cache_ttl,
                json.dumps(serialized)
            )

        return recommendations

    def _get_candidates(
        self,
        user_id: str,
        filters: Optional[Dict] = None
    ) -> List[str]:
        """
        Get candidate items to score.

        Uses multiple strategies:
        1. Collaborative filtering candidates
        2. Popular items in user's categories
        3. New items (serendipity)
        """
        candidates = set()

        # Strategy 1: Similar users' purchases
        # (Simplified - in production, use precomputed similar users)
        similar_user_items = self._get_similar_user_items(user_id, limit=50)
        candidates.update(similar_user_items)

        # Strategy 2: Popular in favorite categories
        user_features = self.feature_store.get_user_features(user_id)
        for category in user_features.get('favorite_categories', [])[:3]:
            popular = self._get_popular_in_category(category, limit=20)
            candidates.update(popular)

        # Strategy 3: Recently added (exploration)
        new_items = self._get_new_items(limit=10)
        candidates.update(new_items)

        # Apply filters
        if filters:
            candidates = self._apply_filters(candidates, filters)

        # Remove already purchased
        purchased = set(user_features.get('purchased_items', []))
        candidates = candidates - purchased

        return list(candidates)

    def _rank_and_diversify(
        self,
        candidates: List[str],
        scores: np.ndarray,
        item_features: Dict[str, Dict],
        n: int
    ) -> List[Recommendation]:
        """
        Rank candidates and ensure diversity.

        Uses MMR (Maximal Marginal Relevance) for diversity.
        """
        # Sort by score
        sorted_indices = np.argsort(scores)[::-1]

        # Select top N with diversity
        selected = []
        selected_categories = set()

        for idx in sorted_indices:
            if len(selected) >= n:
                break

            item_id = candidates[idx]
            score = float(scores[idx])
            features = item_features.get(item_id, {})
            category = features.get('category', 'unknown')

            # Diversity: limit items per category
            if selected_categories.count(category) >= 3:
                continue

            selected.append(
                Recommendation(
                    item_id=item_id,
                    score=score,
                    reason=self._generate_reason(features),
                    metadata=features
                )
            )
            selected_categories.add(category)

        return selected

    def _generate_reason(self, features: Dict) -> str:
        """Generate human-readable reason for recommendation."""
        category = features.get('category', 'item')
        avg_rating = features.get('avg_rating', 0.0)

        if avg_rating >= 4.5:
            return f"Highly rated {category}"
        elif features.get('popularity_score', 0) > 0.8:
            return f"Popular {category}"
        else:
            return f"Recommended {category}"

    def _get_similar_user_items(self, user_id: str, limit: int) -> List[str]:
        """Get items purchased by similar users."""
        # Simplified - in production, precompute similar users
        return []

    def _get_popular_in_category(self, category: str, limit: int) -> List[str]:
        """Get popular items in category."""
        # Query from database or cache
        return []

    def _get_new_items(self, limit: int) -> List[str]:
        """Get recently added items."""
        return []

    def _apply_filters(
        self,
        candidates: List[str],
        filters: Dict
    ) -> List[str]:
        """Apply user-specified filters."""
        # Filter by price, category, etc.
        return candidates


## Deployment Pattern

```python
from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Optional
import redis
import psycopg2

app = FastAPI()

# Initialize components
import os

redis_client = redis.Redis(
    host=os.getenv('REDIS_HOST', 'localhost'),
    port=int(os.getenv('REDIS_PORT', 6379)),
    decode_responses=True
)

db_conn = psycopg2.connect(
    host=os.getenv('DB_HOST', 'localhost'),
    database=os.getenv('DB_NAME', 'recdb'),
    user=os.getenv('DB_USER', 'user'),
    password=os.getenv('DB_PASSWORD'),
    port=int(os.getenv('DB_PORT', 5432))
)

feature_store = FeatureStore(redis_client=redis_client, db_client=db_conn)
model_serving = ModelServing()

# Load models
import joblib
main_model = joblib.load('/models/main_recommender.pkl')
model_serving.register_model('main', main_model, is_default=True)

# Initialize service
rec_service = RecommendationService(
    feature_store=feature_store,
    model_serving=model_serving,
    cache=redis_client
)


class RecommendationRequest(BaseModel):
    user_id: str = Field(..., description="User ID")
    n: int = Field(10, ge=1, le=100, description="Number of recommendations")
    filters: Optional[Dict] = Field(None, description="Optional filters")
    model_name: Optional[str] = Field(None, description="Model variant")


class RecommendationResponse(BaseModel):
    user_id: str
    recommendations: List[Dict]
    model_used: str
    cached: bool


@app.post("/recommendations", response_model=RecommendationResponse)
async def get_recommendations(request: RecommendationRequest):
    """Generate personalized recommendations."""
    try:
        recommendations = rec_service.get_recommendations(
            user_id=request.user_id,
            n=request.n,
            filters=request.filters,
            model_name=request.model_name
        )

        return RecommendationResponse(
            user_id=request.user_id,
            recommendations=[
                {
                    'item_id': rec.item_id,
                    'score': rec.score,
                    'reason': rec.reason
                }
                for rec in recommendations
            ],
            model_used=request.model_name or 'main',
            cached=False  # Would check if from cache
        )

    except Exception as e:
        logger.error(f"Recommendation failed for {request.user_id}: {e}")
        raise HTTPException(500, f"Recommendation failed: {str(e)}")


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy", "models": list(model_serving.models.keys())}
```

## Best Practices

1. **Feature Precomputation**: Compute features offline, serve online
2. **Batch Fetching**: Use Redis MGET for multiple items
3. **Cache Aggressively**: Cache user recommendations (5-15 min TTL)
4. **Fail Gracefully**: Return popular items if personalization fails
5. **Monitor Latency**: Track P95/P99 latency, optimize slow paths
6. **Version Models**: Support multiple model versions for A/B testing
7. **Diversity**: Ensure recommendations aren't too similar
8. **Explanation**: Provide reasons for recommendations
