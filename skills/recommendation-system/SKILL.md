---
name: recommendation-system
description: Designs and evaluates recommendation systems with metrics, A/B testing, and production deployment strategies. Use when building personalization features, analyzing recommendation quality, or implementing real-time suggestions.
---

# Recommendation System

Design and evaluate recommendation systems for production deployment.

## System Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ User Events │────▶│ Feature     │────▶│ Model       │
│ (clicks,    │     │ Store       │     │ Serving     │
│  purchases) │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
                           │                    │
                           ▼                    ▼
                    ┌─────────────┐     ┌─────────────┐
                    │ Training    │     │ API         │
                    │ Pipeline    │     │ Response    │
                    └─────────────┘     └─────────────┘
```

## Evaluation Metrics

```python
def precision_at_k(recommended, relevant, k):
    recommended_k = recommended[:k]
    relevant_set = set(relevant)
    hits = sum(1 for item in recommended_k if item in relevant_set)
    return hits / k

def recall_at_k(recommended, relevant, k):
    recommended_k = set(recommended[:k])
    relevant_set = set(relevant)
    hits = len(recommended_k & relevant_set)
    return hits / len(relevant_set) if relevant_set else 0

def ndcg_at_k(recommended, relevant, k):
    dcg = sum(
        (1 if item in relevant else 0) / np.log2(i + 2)
        for i, item in enumerate(recommended[:k])
    )
    idcg = sum(1 / np.log2(i + 2) for i in range(min(len(relevant), k)))
    return dcg / idcg if idcg > 0 else 0
```

## Real-Time Serving

```python
class RecommendationService:
    def __init__(self, model, feature_store):
        self.model = model
        self.feature_store = feature_store
        self.cache = {}

    def get_recommendations(self, user_id, n=10):
        # Check cache
        cache_key = f"{user_id}:{n}"
        if cache_key in self.cache:
            return self.cache[cache_key]

        # Get user features
        user_features = self.feature_store.get_user(user_id)

        # Generate recommendations
        candidates = self.get_candidates(user_id)
        scores = self.model.score(user_features, candidates)
        recommendations = self.rank_and_filter(candidates, scores, n)

        # Cache result
        self.cache[cache_key] = recommendations
        return recommendations
```

## A/B Testing

```python
def assign_variant(user_id, experiment_id, variants=['control', 'treatment']):
    hash_input = f"{user_id}:{experiment_id}"
    hash_value = int(hashlib.md5(hash_input.encode()).hexdigest(), 16)
    return variants[hash_value % len(variants)]
```

## Key Metrics to Track

| Metric | Description |
|--------|-------------|
| CTR | Click-through rate on recommendations |
| Conversion | Purchases from recommendations |
| Coverage | % of catalog recommended |
| Diversity | Variety in recommendations |
