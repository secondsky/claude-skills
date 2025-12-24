# Cold Start Strategies

Complete solutions for cold start problems in recommendation systems: new users, new items, and system bootstrapping.

## The Cold Start Problem

**Three types of cold start**:
1. **New User**: No interaction history to base recommendations on
2. **New Item**: No users have interacted with it yet
3. **New System**: Sparse data overall, can't train reliable models

## New User Cold Start

### 1. Popular Items Fallback

Simplest approach: Recommend most popular items.

```python
from typing import List, Tuple
import numpy as np
from collections import Counter
import logging

logger = logging.getLogger(__name__)


class PopularityRecommender:
    """
    Fallback recommender based on item popularity.

    Use for new users with no interaction history.
    """

    def __init__(self, decay_factor: float = 0.95):
        """
        Args:
            decay_factor: Time decay factor for recency weighting
        """
        self.decay_factor = decay_factor
        self.item_popularity: dict = {}
        self.item_recency_score: dict = {}

    def fit(self, interactions: np.ndarray, timestamp_col: int = 2):
        """
        Compute popularity scores from interaction history.

        Args:
            interactions: Array with columns [user_id, item_id, timestamp, ...]
            timestamp_col: Column index for timestamps
        """
        # Count interactions per item
        item_counts = Counter(interactions[:, 1].astype(int))

        # Compute recency-weighted popularity
        max_timestamp = interactions[:, timestamp_col].max()

        for user_id, item_id, timestamp in interactions[:, :3]:
            item_id = int(item_id)
            recency_weight = self.decay_factor ** ((max_timestamp - timestamp) / 86400)  # Days

            if item_id not in self.item_recency_score:
                self.item_recency_score[item_id] = 0.0

            self.item_recency_score[item_id] += recency_weight

        # Normalize popularity scores
        max_score = max(self.item_recency_score.values()) if self.item_recency_score else 1.0
        self.item_popularity = {
            item: score / max_score
            for item, score in self.item_recency_score.items()
        }

        logger.info(f"Computed popularity for {len(self.item_popularity)} items")

    def recommend(self, n: int = 10, exclude_items: set = None) -> List[Tuple[int, float]]:
        """
        Return top-N popular items.

        Args:
            n: Number of recommendations
            exclude_items: Items to exclude (already purchased, etc.)

        Returns:
            List of (item_id, popularity_score) tuples
        """
        exclude_items = exclude_items or set()

        # Sort by popularity, exclude specified items
        sorted_items = sorted(
            [(item, score) for item, score in self.item_popularity.items()
             if item not in exclude_items],
            key=lambda x: x[1],
            reverse=True
        )

        return sorted_items[:n]


### 2. Onboarding Preference Elicitation

Gather initial preferences during user onboarding.

```python
class OnboardingRecommender:
    """
    Collect initial preferences to bootstrap recommendations.

    Shows carefully selected items to maximize information gain.
    """

    def __init__(
        self,
        item_features: np.ndarray,
        n_explore: int = 10,
        popularity_recommender: 'PopularityRecommender' = None
    ):
        """
        Args:
            item_features: Feature matrix (n_items, n_features)
            n_explore: Number of items to show during onboarding
            popularity_recommender: Optional popularity recommender for fallback
        """
        self.item_features = item_features
        self.n_explore = n_explore
        self.popularity_recommender = popularity_recommender

    def select_onboarding_items(self) -> List[int]:
        """
        Select diverse, representative items for onboarding.

        Uses k-means clustering to find cluster centroids.
        """
        from sklearn.cluster import KMeans

        # Cluster items into k groups
        kmeans = KMeans(n_clusters=self.n_explore, random_state=42)
        kmeans.fit(self.item_features)

        # Find items closest to each cluster centroid
        from sklearn.metrics.pairwise import euclidean_distances

        onboarding_items = []
        for centroid in kmeans.cluster_centers_:
            distances = euclidean_distances([centroid], self.item_features)[0]
            closest_item = np.argmin(distances)
            onboarding_items.append(int(closest_item))

        logger.info(f"Selected {len(onboarding_items)} diverse items for onboarding")
        return onboarding_items

    def bootstrap_from_preferences(
        self,
        liked_items: List[int],
        disliked_items: List[int],
        n: int = 10
    ) -> List[int]:
        """
        Generate initial recommendations from onboarding preferences.

        Args:
            liked_items: Items user liked during onboarding
            disliked_items: Items user disliked
            n: Number of recommendations

        Returns:
            List of recommended item IDs
        """
        if not liked_items:
            logger.warning("No liked items provided")
            # Actually fall back to popularity recommendations
            if self.popularity_recommender:
                logger.info("Falling back to popularity-based recommendations")
                popular_items = self.popularity_recommender.recommend(n=n)
                # Extract just the item IDs from (item_id, score) tuples
                return [item_id for item_id, _ in popular_items]
            else:
                # No popularity recommender available - return random sample
                logger.warning("No popularity recommender available, using random sample")
                item_ids = np.arange(len(self.item_features))
                return np.random.choice(item_ids, size=min(n, len(item_ids)), replace=False).tolist()

        # Compute user preference vector (average of liked items)
        liked_features = self.item_features[liked_items]
        user_profile = liked_features.mean(axis=0)

        # Compute similarity to all items
        from sklearn.metrics.pairwise import cosine_similarity
        similarities = cosine_similarity([user_profile], self.item_features)[0]

        # Penalize disliked items
        for item_id in disliked_items:
            similarities[item_id] = -1.0

        # Exclude items already rated
        for item_id in liked_items + disliked_items:
            similarities[item_id] = -1.0

        # Get top-N
        top_items = np.argsort(similarities)[-n:][::-1]
        return top_items.tolist()
```

### 3. Demographic-Based Recommendations

Use user demographics when available.

```python
class DemographicRecommender:
    """
    Recommend based on user demographics (age, gender, location, etc.).

    Finds similar users demographically and recommends what they liked.
    """

    def __init__(self):
        self.user_demographics: dict = {}  # user_id -> feature vector
        self.user_interactions: dict = {}  # user_id -> set of items

    def fit(self, user_demo_matrix: np.ndarray, interactions: np.ndarray):
        """
        Args:
            user_demo_matrix: Array (n_users, n_demo_features)
            interactions: Array with [user_id, item_id] pairs
        """
        # Store demographics
        for user_id, features in enumerate(user_demo_matrix):
            self.user_demographics[user_id] = features

        # Store interactions
        from collections import defaultdict
        self.user_interactions = defaultdict(set)
        for user_id, item_id in interactions:
            self.user_interactions[int(user_id)].add(int(item_id))

    def recommend_for_new_user(
        self,
        user_features: np.ndarray,
        n: int = 10,
        k_neighbors: int = 50
    ) -> List[int]:
        """
        Recommend for new user based on similar users' preferences.

        Args:
            user_features: Demographic features for new user
            n: Number of recommendations
            k_neighbors: Number of similar users to consider

        Returns:
            List of recommended item IDs
        """
        from sklearn.metrics.pairwise import cosine_similarity

        # Find k most similar users demographically
        all_user_features = np.array([
            self.user_demographics[uid] for uid in self.user_demographics
        ])
        similarities = cosine_similarity([user_features], all_user_features)[0]

        # Get top-k similar users
        top_k_users = np.argsort(similarities)[-k_neighbors:]

        # Aggregate their interactions
        from collections import Counter
        item_votes = Counter()
        for user_idx in top_k_users:
            user_id = list(self.user_demographics.keys())[user_idx]
            for item_id in self.user_interactions.get(user_id, []):
                item_votes[item_id] += similarities[user_idx]

        # Return top-N items
        top_items = [item for item, score in item_votes.most_common(n)]
        return top_items
```

## New Item Cold Start

### 1. Content-Based Bootstrapping

Use item metadata to find similar items.

```python
class ContentBasedBootstrap:
    """
    Recommend new items based on content similarity to items user liked.
    """

    def __init__(self, item_features: np.ndarray):
        """
        Args:
            item_features: Matrix (n_items, n_features) with item metadata
        """
        self.item_features = item_features

    def add_new_item(self, item_id: int, features: np.ndarray):
        """
        Add a new item with its features.

        Args:
            item_id: New item ID
            features: Feature vector for new item
        """
        # Expand feature matrix
        if item_id >= len(self.item_features):
            # Pad with zeros
            padding_size = item_id - len(self.item_features) + 1
            padding = np.zeros((padding_size, self.item_features.shape[1]))
            self.item_features = np.vstack([self.item_features, padding])

        self.item_features[item_id] = features

    def recommend_new_item_to_users(
        self,
        new_item_id: int,
        user_profiles: dict,
        n_users: int = 100
    ) -> List[int]:
        """
        Find users most likely to like the new item.

        Args:
            new_item_id: ID of new item
            user_profiles: Dict[user_id -> preference vector]
            n_users: Number of users to target

        Returns:
            List of user IDs to show new item to
        """
        from sklearn.metrics.pairwise import cosine_similarity

        new_item_features = self.item_features[new_item_id].reshape(1, -1)

        # Compute similarity between new item and each user's profile
        user_scores = {}
        for user_id, profile in user_profiles.items():
            similarity = cosine_similarity(new_item_features, [profile])[0][0]
            user_scores[user_id] = similarity

        # Return top-N users
        top_users = sorted(user_scores.items(), key=lambda x: x[1], reverse=True)
        return [user_id for user_id, score in top_users[:n_users]]
```

### 2. Active Learning for New Items

Strategically show new item to diverse users to gather feedback quickly.

```python
class ActiveLearningBootstrap:
    """
    Intelligently select which users to show new item to maximize learning.
    """

    def __init__(self):
        self.user_diversity_scores: dict = {}

    def select_exploration_users(
        self,
        user_features: np.ndarray,
        n_users: int = 50
    ) -> List[int]:
        """
        Select diverse set of users for initial exposure.

        Uses diversity sampling to cover different user segments.

        Args:
            user_features: Matrix (n_users, n_features)
            n_users: Number of users to select

        Returns:
            List of user IDs
        """
        from sklearn.cluster import KMeans

        # Cluster users
        n_clusters = min(n_users, len(user_features) // 10)
        kmeans = KMeans(n_clusters=n_clusters, random_state=42)
        kmeans.fit(user_features)

        # Select users from each cluster
        selected_users = []
        for cluster_id in range(n_clusters):
            cluster_users = np.where(kmeans.labels_ == cluster_id)[0]
            # Sample proportionally from each cluster
            n_from_cluster = max(1, n_users // n_clusters)
            sampled = np.random.choice(
                cluster_users,
                size=min(n_from_cluster, len(cluster_users)),
                replace=False
            )
            selected_users.extend(sampled.tolist())

        return selected_users[:n_users]
```

## Hybrid Cold Start Approach

Combine multiple strategies for robust cold start handling.

```python
class HybridColdStartRecommender:
    """
    Combines popularity, content, and demographic approaches.

    Automatically selects best strategy based on available data.
    """

    def __init__(
        self,
        popularity_recommender: PopularityRecommender,
        content_recommender: ContentBasedBootstrap,
        demographic_recommender: DemographicRecommender
    ):
        self.popularity = popularity_recommender
        self.content = content_recommender
        self.demographic = demographic_recommender

    def recommend_for_cold_user(
        self,
        user_id: int,
        user_features: np.ndarray = None,
        onboarding_likes: List[int] = None,
        n: int = 10
    ) -> List[Tuple[int, float]]:
        """
        Recommend for cold user using best available strategy.

        Strategy selection priority:
        1. If onboarding preferences available -> use content-based
        2. If demographics available -> use demographic-based
        3. Else -> use popularity-based

        Args:
            user_id: User ID
            user_features: Demographic features (optional)
            onboarding_likes: Items liked during onboarding (optional)
            n: Number of recommendations

        Returns:
            List of (item_id, score) tuples
        """
        # Strategy 1: Onboarding preferences (best signal)
        if onboarding_likes:
            logger.info(f"Using content-based recommendations for user {user_id}")
            items = self.content.bootstrap_from_preferences(
                liked_items=onboarding_likes,
                disliked_items=[],
                n=n
            )
            return [(item, 1.0) for item in items]

        # Strategy 2: Demographics (good signal)
        if user_features is not None:
            logger.info(f"Using demographic-based recommendations for user {user_id}")
            items = self.demographic.recommend_for_new_user(
                user_features=user_features,
                n=n
            )
            return [(item, 0.8) for item in items]

        # Strategy 3: Popularity (weak signal)
        logger.info(f"Using popularity-based recommendations for user {user_id}")
        return self.popularity.recommend(n=n)


    def recommend_new_item(
        self,
        item_id: int,
        item_features: np.ndarray,
        n_target_users: int = 100
    ) -> List[int]:
        """
        Bootstrap recommendations for new item.

        Returns:
            List of user IDs to show item to
        """
        # Add item to content recommender
        self.content.add_new_item(item_id, item_features)

        # Find target users (content-based similarity)
        # This requires building user profiles first
        logger.info(f"Targeting {n_target_users} users for new item {item_id}")
        return []  # Would implement user profile building
```

## Explore-Exploit Strategies

Balance showing proven recommendations with exploring new items.

```python
class EpsilonGreedyRecommender:
    """
    ε-greedy strategy: exploit with probability (1-ε), explore with ε.
    """

    def __init__(
        self,
        base_recommender,
        epsilon: float = 0.1,
        catalog_items: List[int] = None
    ):
        """
        Args:
            base_recommender: Main recommendation model
            epsilon: Exploration probability (0 to 1)
            catalog_items: Full list of item IDs
        """
        self.base_recommender = base_recommender
        self.epsilon = epsilon
        self.catalog_items = catalog_items or []

    def recommend(self, user_id: int, n: int = 10) -> List[Tuple[int, float]]:
        """
        Generate recommendations with exploration.

        Args:
            user_id: User ID
            n: Number of recommendations

        Returns:
            List of (item_id, score) tuples
        """
        # Decide: explore or exploit
        if np.random.random() < self.epsilon:
            # Explore: random items
            logger.debug(f"Exploring for user {user_id}")
            random_items = np.random.choice(self.catalog_items, size=n, replace=False)
            return [(int(item), 0.5) for item in random_items]
        else:
            # Exploit: use base recommender
            logger.debug(f"Exploiting for user {user_id}")
            return self.base_recommender.recommend(user_id, n=n)
```

## Multi-Armed Bandit for Cold Start

Use bandit algorithms to learn quickly which items work best.

```python
class ThompsonSamplingRecommender:
    """
    Thompson Sampling for item recommendation.

    Models each item as a Bernoulli bandit, learns click-through rates.
    """

    def __init__(self, n_items: int):
        """
        Args:
            n_items: Number of items in catalog
        """
        # Beta distribution parameters for each item
        self.alpha = np.ones(n_items)  # Successes + 1
        self.beta = np.ones(n_items)   # Failures + 1

    def recommend(self, n: int = 10) -> List[int]:
        """
        Sample from each item's posterior and return top-N.

        Returns:
            List of item IDs
        """
        # Sample from Beta distribution for each item
        sampled_ctrs = np.random.beta(self.alpha, self.beta)

        # Return top-N by sampled CTR
        top_items = np.argsort(sampled_ctrs)[-n:][::-1]
        return top_items.tolist()

    def update(self, item_id: int, clicked: bool):
        """
        Update beliefs after user interaction.

        Args:
            item_id: Item that was shown
            clicked: Whether user clicked/liked it
        """
        if clicked:
            self.alpha[item_id] += 1
        else:
            self.beta[item_id] += 1
```

## When to Use Each Strategy

**Popularity-Based**:
- ✅ Absolute cold start (new system, very sparse data)
- ✅ Quick baseline
- ❌ Low personalization

**Onboarding Elicitation**:
- ✅ Can ask users questions
- ✅ Need fast personalization
- ❌ User friction (some drop-off)

**Demographic-Based**:
- ✅ Demographics available
- ✅ Regulated industries (explainability)
- ❌ Privacy concerns

**Content-Based**:
- ✅ Rich item metadata
- ✅ New items frequently added
- ❌ Limited by feature quality

**Active Learning**:
- ✅ Can afford exploration cost
- ✅ Need quick learning
- ❌ Complex to implement

**Bandit Algorithms**:
- ✅ Online learning scenario
- ✅ Fast feedback loop
- ❌ Requires real-time updates
