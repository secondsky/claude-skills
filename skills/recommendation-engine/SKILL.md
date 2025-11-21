---
name: recommendation-engine
description: Builds recommendation systems using collaborative filtering, content-based, and hybrid approaches for personalized suggestions. Use when implementing product recommendations, content discovery, or personalization features.
---

# Recommendation Engine

Build recommendation systems for personalized content and product suggestions.

## Recommendation Approaches

| Approach | How It Works | Pros | Cons |
|----------|--------------|------|------|
| Collaborative | User-item interactions | Discovers hidden patterns | Cold start |
| Content-based | Item features | Works for new items | Limited discovery |
| Hybrid | Combines both | Best of both | Complex |

## Collaborative Filtering

```python
import numpy as np
from scipy.sparse import csr_matrix
from sklearn.metrics.pairwise import cosine_similarity

class CollaborativeFilter:
    def __init__(self):
        self.user_similarity = None
        self.item_similarity = None

    def fit(self, user_item_matrix):
        # User-based similarity
        self.user_similarity = cosine_similarity(user_item_matrix)
        # Item-based similarity
        self.item_similarity = cosine_similarity(user_item_matrix.T)

    def recommend_for_user(self, user_id, n=10):
        scores = self.user_similarity[user_id].dot(self.user_item_matrix)
        # Exclude already interacted items
        already_interacted = self.user_item_matrix[user_id].nonzero()[0]
        scores[already_interacted] = -np.inf
        return np.argsort(scores)[-n:][::-1]
```

## Matrix Factorization (SVD)

```python
from sklearn.decomposition import TruncatedSVD

class MatrixFactorization:
    def __init__(self, n_factors=50):
        self.svd = TruncatedSVD(n_components=n_factors)

    def fit(self, user_item_matrix):
        self.user_factors = self.svd.fit_transform(user_item_matrix)
        self.item_factors = self.svd.components_.T

    def predict(self, user_id, item_id):
        return np.dot(self.user_factors[user_id], self.item_factors[item_id])
```

## Hybrid Recommender

```python
class HybridRecommender:
    def __init__(self, collab_weight=0.7, content_weight=0.3):
        self.collab = CollaborativeFilter()
        self.content = ContentBasedFilter()
        self.weights = (collab_weight, content_weight)

    def recommend(self, user_id, n=10):
        collab_scores = self.collab.score(user_id)
        content_scores = self.content.score(user_id)
        combined = self.weights[0] * collab_scores + self.weights[1] * content_scores
        return np.argsort(combined)[-n:][::-1]
```

## Evaluation Metrics

- Precision@K, Recall@K
- NDCG (ranking quality)
- Coverage (catalog diversity)
- A/B test conversion rate

## Cold Start Solutions

- Popular items for new users
- Content-based for new items
- Onboarding preferences
