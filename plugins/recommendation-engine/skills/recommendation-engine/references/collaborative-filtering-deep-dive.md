# Collaborative Filtering Deep Dive

Complete implementations of user-based and item-based collaborative filtering with similarity metrics and scalability optimizations.

## Overview

Collaborative filtering recommends items based on patterns in user-item interactions. Two main approaches:
- **User-based**: Find similar users, recommend what they liked
- **Item-based**: Find similar items, recommend items similar to what user liked

## Complete User-Based Implementation

```python
from typing import List, Tuple, Dict, Optional
import numpy as np
from scipy.sparse import csr_matrix
from sklearn.metrics.pairwise import cosine_similarity, pairwise_distances
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class UserBasedCollaborativeFilter:
    """
    User-based collaborative filtering recommender.

    Finds similar users and recommends items they liked.
    Works well when #users << #items and user preferences are stable.
    """

    def __init__(
        self,
        similarity_metric: str = 'cosine',
        k_neighbors: int = 50,
        min_similarity: float = 0.0
    ):
        """
        Initialize user-based CF.

        Args:
            similarity_metric: 'cosine', 'pearson', or 'jaccard'
            k_neighbors: Number of similar users to consider
            min_similarity: Minimum similarity threshold
        """
        self.similarity_metric = similarity_metric
        self.k_neighbors = k_neighbors
        self.min_similarity = min_similarity
        self.user_similarity: Optional[np.ndarray] = None
        self.user_item_matrix: Optional[csr_matrix] = None

    def fit(self, user_item_matrix: csr_matrix) -> 'UserBasedCollaborativeFilter':
        """
        Compute user-user similarity matrix.

        Args:
            user_item_matrix: Sparse matrix (n_users, n_items) with ratings/interactions

        Returns:
            self for chaining
        """
        logger.info(f"Fitting user-based CF with {user_item_matrix.shape[0]} users, "
                   f"{user_item_matrix.shape[1]} items")

        self.user_item_matrix = user_item_matrix

        # Compute similarity based on metric
        if self.similarity_metric == 'cosine':
            self.user_similarity = cosine_similarity(user_item_matrix)
        elif self.similarity_metric == 'pearson':
            # Pearson = cosine on mean-centered data
            mean_centered = user_item_matrix.copy()
            row_means = np.array(mean_centered.mean(axis=1)).flatten()
            mean_centered.data -= np.repeat(row_means, np.diff(mean_centered.indptr))
            self.user_similarity = cosine_similarity(mean_centered)
        elif self.similarity_metric == 'jaccard':
            # Jaccard distance
            self.user_similarity = 1 - pairwise_distances(
                user_item_matrix.astype(bool), metric='jaccard'
            )
        else:
            raise ValueError(f"Unknown similarity metric: {self.similarity_metric}")

        # Zero out diagonal (user similarity with self)
        np.fill_diagonal(self.user_similarity, 0)

        logger.info(f"Computed similarity matrix shape: {self.user_similarity.shape}")
        return self

    def recommend(
        self,
        user_id: int,
        n: int = 10,
        exclude_interacted: bool = True
    ) -> List[Tuple[int, float]]:
        """
        Generate top-N recommendations for a user.

        Args:
            user_id: User ID to generate recommendations for
            n: Number of recommendations to return
            exclude_interacted: Whether to exclude items user already interacted with

        Returns:
            List of (item_id, score) tuples, sorted by score descending
        """
        if self.user_similarity is None or self.user_item_matrix is None:
            raise ValueError("Model not fitted. Call fit() first.")

        if user_id >= self.user_similarity.shape[0]:
            raise ValueError(f"User ID {user_id} out of range")

        # Find k most similar users
        user_sims = self.user_similarity[user_id]

        # Apply minimum similarity threshold
        user_sims[user_sims < self.min_similarity] = 0

        # Get top-k similar users
        top_k_users = np.argsort(user_sims)[-self.k_neighbors:]
        top_k_sims = user_sims[top_k_users]

        # Weighted sum of similar users' ratings
        similar_users_matrix = self.user_item_matrix[top_k_users]
        scores = np.array(top_k_sims.dot(similar_users_matrix.toarray())).flatten()

        # Exclude already interacted items
        if exclude_interacted:
            interacted_items = self.user_item_matrix[user_id].nonzero()[1]
            scores[interacted_items] = -np.inf

        # Get top-N items
        top_n_items = np.argsort(scores)[-n:][::-1]
        top_n_scores = scores[top_n_items]

        # Normalize scores to [0, 1]
        if top_n_scores.max() > 0:
            top_n_scores = top_n_scores / top_n_scores.max()

        return list(zip(top_n_items.tolist(), top_n_scores.tolist()))


class ItemBasedCollaborativeFilter:
    """
    Item-based collaborative filtering recommender.

    Finds similar items and recommends items similar to what user liked.
    Works well when #items << #users and item features are stable.
    More scalable than user-based for large user bases.
    """

    def __init__(
        self,
        similarity_metric: str = 'cosine',
        k_neighbors: int = 20,
        min_similarity: float = 0.1
    ):
        """
        Initialize item-based CF.

        Args:
            similarity_metric: 'cosine', 'pearson', or 'adjusted_cosine'
            k_neighbors: Number of similar items to consider
            min_similarity: Minimum similarity threshold
        """
        self.similarity_metric = similarity_metric
        self.k_neighbors = k_neighbors
        self.min_similarity = min_similarity
        self.item_similarity: Optional[np.ndarray] = None
        self.user_item_matrix: Optional[csr_matrix] = None

    def fit(self, user_item_matrix: csr_matrix) -> 'ItemBasedCollaborativeFilter':
        """
        Compute item-item similarity matrix.

        Args:
            user_item_matrix: Sparse matrix (n_users, n_items) with ratings/interactions

        Returns:
            self for chaining
        """
        logger.info(f"Fitting item-based CF with {user_item_matrix.shape[0]} users, "
                   f"{user_item_matrix.shape[1]} items")

        self.user_item_matrix = user_item_matrix

        # Transpose to get item-user matrix
        item_user_matrix = user_item_matrix.T

        if self.similarity_metric == 'cosine':
            self.item_similarity = cosine_similarity(item_user_matrix)
        elif self.similarity_metric == 'pearson':
            mean_centered = item_user_matrix.copy()
            row_means = np.array(mean_centered.mean(axis=1)).flatten()
            mean_centered.data -= np.repeat(row_means, np.diff(mean_centered.indptr))
            self.item_similarity = cosine_similarity(mean_centered)
        elif self.similarity_metric == 'adjusted_cosine':
            # Adjusted cosine: normalize by user mean (better for ratings)
            user_means = np.array(user_item_matrix.mean(axis=1)).flatten()
            adjusted = user_item_matrix.copy()
            for i in range(adjusted.shape[0]):
                adjusted.data[adjusted.indptr[i]:adjusted.indptr[i+1]] -= user_means[i]
            self.item_similarity = cosine_similarity(adjusted.T)
        else:
            raise ValueError(f"Unknown similarity metric: {self.similarity_metric}")

        # Zero out diagonal
        np.fill_diagonal(self.item_similarity, 0)

        logger.info(f"Computed item similarity matrix shape: {self.item_similarity.shape}")
        return self

    def recommend(
        self,
        user_id: int,
        n: int = 10,
        exclude_interacted: bool = True
    ) -> List[Tuple[int, float]]:
        """
        Generate top-N recommendations for a user based on item similarity.

        Args:
            user_id: User ID to generate recommendations for
            n: Number of recommendations to return
            exclude_interacted: Whether to exclude items user already interacted with

        Returns:
            List of (item_id, score) tuples, sorted by score descending
        """
        if self.item_similarity is None or self.user_item_matrix is None:
            raise ValueError("Model not fitted. Call fit() first.")

        if user_id >= self.user_item_matrix.shape[0]:
            raise ValueError(f"User ID {user_id} out of range")

        # Get user's interacted items and their ratings
        user_items = self.user_item_matrix[user_id].toarray().flatten()
        interacted_items = user_items.nonzero()[0]

        if len(interacted_items) == 0:
            logger.warning(f"User {user_id} has no interactions, returning empty recommendations")
            return []

        # For each candidate item, compute weighted similarity to user's items
        scores = np.zeros(self.item_similarity.shape[0])

        for item_id in interacted_items:
            # Get similarities of this item to all other items
            item_sims = self.item_similarity[item_id]

            # Apply threshold
            item_sims[item_sims < self.min_similarity] = 0

            # Weight by user's rating/interaction strength
            item_rating = user_items[item_id]
            scores += item_sims * item_rating

        # Exclude already interacted items
        if exclude_interacted:
            scores[interacted_items] = -np.inf

        # Get top-N items
        top_n_items = np.argsort(scores)[-n:][::-1]
        top_n_scores = scores[top_n_items]

        # Normalize scores
        if top_n_scores.max() > 0:
            top_n_scores = top_n_scores / top_n_scores.max()

        return list(zip(top_n_items.tolist(), top_n_scores.tolist()))
```

## Similarity Metrics Comparison

### Cosine Similarity
**Best for**: Binary interactions (clicks, views), sparse data

```python
# Formula: cos(A, B) = (A · B) / (||A|| * ||B||)
# Range: [-1, 1], typically [0, 1] for non-negative data
similarity = cosine_similarity(user_item_matrix)
```

**Pros**: Fast, works well with sparse data, scale-invariant
**Cons**: Ignores rating magnitude differences

### Pearson Correlation
**Best for**: Rating data where user bias matters

```python
# Centers data by subtracting means before computing cosine
# Accounts for users who rate everything high/low
mean_centered = user_item_matrix - user_means[:, np.newaxis]
similarity = cosine_similarity(mean_centered)
```

**Pros**: Accounts for user bias, better for ratings
**Cons**: Computationally expensive, requires dense data

### Jaccard Similarity
**Best for**: Binary data, set overlap

```python
# Formula: J(A, B) = |A ∩ B| / |A ∪ B|
# Treats interactions as sets
from sklearn.metrics import jaccard_score
```

**Pros**: Simple, interpretable, good for binary
**Cons**: Ignores rating values, sensitive to popularity

## Scalability Optimizations

### 1. Sparse Matrix Operations

```python
from scipy.sparse import csr_matrix

# Always use sparse matrices for large datasets
user_item_matrix = csr_matrix(ratings_array)

# Sparse matrix multiplication is O(nnz) not O(n²)
scores = user_similarity_sparse.dot(user_item_matrix)
```

### 2. Approximate Nearest Neighbors

For very large datasets (millions of users/items):

```python
from sklearn.neighbors import NearestNeighbors

class ApproximateCF:
    def __init__(self, k_neighbors=50):
        self.nn_model = NearestNeighbors(
            n_neighbors=k_neighbors,
            algorithm='auto',  # Uses ball_tree or kd_tree
            metric='cosine'
        )

    def fit(self, user_item_matrix):
        self.nn_model.fit(user_item_matrix)
        self.user_item_matrix = user_item_matrix

    def recommend(self, user_id, n=10):
        # Find k-nearest neighbors efficiently
        distances, indices = self.nn_model.kneighbors(
            self.user_item_matrix[user_id],
            return_distance=True
        )

        # Convert distances to similarities
        similarities = 1 - distances.flatten()
        neighbor_ids = indices.flatten()

        # Weighted recommendation
        scores = similarities.dot(
            self.user_item_matrix[neighbor_ids].toarray()
        )
        return np.argsort(scores)[-n:][::-1]
```

### 3. Pre-compute Item Similarities

```python
# For item-based CF, pre-compute and store only top-k similar items
def compute_sparse_similarity(item_matrix, k=20):
    """
    Compute top-k similar items for each item, store as sparse matrix.
    Reduces memory from O(n²) to O(nk).
    """
    n_items = item_matrix.shape[0]
    similarities = []

    for i in range(n_items):
        sims = cosine_similarity(item_matrix[i:i+1], item_matrix).flatten()
        top_k = np.argpartition(sims, -k)[-k:]
        similarities.append((i, top_k, sims[top_k]))

    return similarities  # Store as {item_id: [(similar_id, score), ...]}
```

## Handling Edge Cases

### Cold Start Users (No Interactions)

```python
def recommend_for_cold_user(self, n=10):
    """Recommend popular items for users with no interaction history."""
    item_popularity = np.array(self.user_item_matrix.sum(axis=0)).flatten()
    top_items = np.argsort(item_popularity)[-n:][::-1]
    return [(item_id, float(item_popularity[item_id])) for item_id in top_items]
```

### Cold Start Items (No Interactions)

```python
# Fall back to content-based filtering (covered in hybrid section)
# Or use item metadata to find similar items
```

### Data Sparsity

```python
# Use matrix factorization (SVD, ALS) for extremely sparse data
# See matrix-factorization-methods.md
```

## Production Considerations

### Memory Usage

```python
# User-based similarity matrix: O(n_users²)
# For 1M users: ~4TB for float32!

# Solutions:
# 1. Use item-based (usually fewer items)
# 2. Use approximate methods (LSH, ANNOY)
# 3. Store only top-k similarities per user
# 4. Use model-based methods (matrix factorization)
```

### Computation Time

```python
import time

def timed_fit(model, data):
    start = time.time()
    model.fit(data)
    elapsed = time.time() - start
    logger.info(f"Fit completed in {elapsed:.2f}s")
    return model

# Typical times:
# - 10K users, 1K items: ~5 seconds
# - 100K users, 10K items: ~5 minutes
# - 1M users, 100K items: Use approximate methods
```

### Incremental Updates

```python
class IncrementalCF:
    """Update recommendations without full recomputation."""

    def update_user(self, user_id, new_interactions):
        """Update single user's recommendations."""
        # Recompute only affected similarity scores
        user_vector = self.user_item_matrix[user_id]
        user_vector[new_interactions] = 1

        # Update similarity with all other users
        self.user_similarity[user_id] = cosine_similarity(
            user_vector.reshape(1, -1),
            self.user_item_matrix
        ).flatten()

        self.user_similarity[:, user_id] = self.user_similarity[user_id]
        np.fill_diagonal(self.user_similarity, 0)
```

## When to Use User-Based vs Item-Based

**User-Based**:
- ✅ Small number of users (<100K)
- ✅ Many items per user
- ✅ User preferences change slowly
- ✅ Need serendipity (discover new genres)

**Item-Based**:
- ✅ Small number of items (<100K)
- ✅ Many users per item
- ✅ Item features stable
- ✅ Need stability (consistent recommendations)
- ✅ Real-time recommendations (pre-computed similarities)

**Neither** (use matrix factorization):
- ❌ Millions of users AND items
- ❌ Extremely sparse data (<0.1% density)
- ❌ Need latent features
