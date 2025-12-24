# Evaluation Metrics Implementation

Complete implementations of Precision@K, Recall@K, NDCG, coverage metrics, and statistical significance testing for recommendation systems.

## Overview

Recommendation systems require specialized metrics beyond traditional ML metrics because:
- We care about top-K results, not all predictions
- Ranking quality matters (order of recommendations)
- Diversity and coverage are important
- Online A/B tests measure real business impact

## Precision@K and Recall@K

```python
from typing import List, Set, Dict
import numpy as np
from collections import defaultdict
import logging

logger = logging.getLogger(__name__)


def precision_at_k(recommended: List[int], relevant: Set[int], k: int) -> float:
    """
    Precision@K: Fraction of recommended items in top-K that are relevant.

    Args:
        recommended: List of recommended item IDs (ordered by score)
        relevant: Set of truly relevant item IDs
        k: Number of top recommendations to consider

    Returns:
        Precision@K score in [0, 1]

    Example:
        >>> recommended = [1, 3, 5, 7, 9]
        >>> relevant = {1, 5, 10}
        >>> precision_at_k(recommended, relevant, k=5)
        0.4  # 2 out of 5 recommendations are relevant
    """
    if k <= 0:
        return 0.0

    top_k = recommended[:k]
    relevant_in_top_k = len([item for item in top_k if item in relevant])

    return relevant_in_top_k / k


def recall_at_k(recommended: List[int], relevant: Set[int], k: int) -> float:
    """
    Recall@K: Fraction of relevant items that appear in top-K.

    Args:
        recommended: List of recommended item IDs
        relevant: Set of truly relevant item IDs
        k: Number of top recommendations

    Returns:
        Recall@K score in [0, 1]

    Example:
        >>> recommended = [1, 3, 5, 7, 9]
        >>> relevant = {1, 5, 10}
        >>> recall_at_k(recommended, relevant, k=5)
        0.667  # 2 out of 3 relevant items retrieved
    """
    if len(relevant) == 0:
        return 0.0

    top_k = recommended[:k]
    relevant_in_top_k = len([item for item in top_k if item in relevant])

    return relevant_in_top_k / len(relevant)


def f1_at_k(recommended: List[int], relevant: Set[int], k: int) -> float:
    """
    F1@K: Harmonic mean of Precision@K and Recall@K.

    Returns:
        F1 score in [0, 1]
    """
    prec = precision_at_k(recommended, relevant, k)
    rec = recall_at_k(recommended, relevant, k)

    if prec + rec == 0:
        return 0.0

    return 2 * (prec * rec) / (prec + rec)


def average_precision_at_k(recommended: List[int], relevant: Set[int], k: int) -> float:
    """
    Average Precision@K (AP@K): Rewards putting relevant items earlier.

    Computes precision at each relevant item position, then averages.

    Args:
        recommended: Ordered list of recommendations
        relevant: Set of relevant items
        k: Maximum number of recommendations to consider

    Returns:
        AP@K score in [0, 1]

    Example:
        >>> recommended = [1, 2, 3, 4, 5]
        >>> relevant = {1, 3, 5}
        >>> average_precision_at_k(recommended, relevant, k=5)
        0.756  # (1/1 + 2/3 + 3/5) / 3
    """
    if len(relevant) == 0:
        return 0.0

    top_k = recommended[:k]
    score = 0.0
    num_hits = 0.0

    for i, item in enumerate(top_k):
        if item in relevant:
            num_hits += 1.0
            score += num_hits / (i + 1.0)

    return score / min(len(relevant), k)


def mean_average_precision_at_k(
    recommendations: Dict[int, List[int]],
    ground_truth: Dict[int, Set[int]],
    k: int
) -> float:
    """
    Mean Average Precision@K (MAP@K): Average AP@K across all users.

    Args:
        recommendations: Dict mapping user_id -> list of recommended items
        ground_truth: Dict mapping user_id -> set of relevant items
        k: Number of recommendations

    Returns:
        MAP@K score in [0, 1]
    """
    ap_scores = []

    for user_id in recommendations:
        if user_id in ground_truth:
            ap = average_precision_at_k(
                recommendations[user_id],
                ground_truth[user_id],
                k
            )
            ap_scores.append(ap)

    return np.mean(ap_scores) if ap_scores else 0.0
```

## Normalized Discounted Cumulative Gain (NDCG)

NDCG measures ranking quality with position-based discounting.

```python
def dcg_at_k(recommended: List[int], relevance_scores: Dict[int, float], k: int) -> float:
    """
    Discounted Cumulative Gain@K.

    DCG = sum(rel_i / log2(i + 1)) for i in [1, k]

    Args:
        recommended: Ordered list of recommended items
        relevance_scores: Dict mapping item_id -> relevance score
        k: Number of top items

    Returns:
        DCG score
    """
    dcg = 0.0
    for i, item_id in enumerate(recommended[:k]):
        rel = relevance_scores.get(item_id, 0.0)
        # Position discount: log2(i + 2) because i starts at 0
        dcg += rel / np.log2(i + 2)

    return dcg


def ndcg_at_k(
    recommended: List[int],
    relevance_scores: Dict[int, float],
    k: int
) -> float:
    """
    Normalized Discounted Cumulative Gain@K.

    NDCG = DCG / IDCG

    Where IDCG is DCG of the ideal ranking (sorted by relevance).

    Args:
        recommended: Ordered list of recommended items
        relevance_scores: Dict mapping item_id -> relevance (higher = more relevant)
        k: Number of top items

    Returns:
        NDCG score in [0, 1]

    Example:
        >>> recommended = [3, 1, 5, 2, 4]
        >>> relevance = {1: 3, 2: 2, 3: 3, 4: 1, 5: 2}
        >>> ndcg_at_k(recommended, relevance, k=5)
        0.952  # Close to ideal ranking
    """
    # Compute DCG for actual recommendations
    dcg = dcg_at_k(recommended, relevance_scores, k)

    # Compute IDCG (ideal DCG) by sorting items by relevance
    ideal_ranking = sorted(
        relevance_scores.items(),
        key=lambda x: x[1],
        reverse=True
    )
    ideal_items = [item_id for item_id, _ in ideal_ranking]
    idcg = dcg_at_k(ideal_items, relevance_scores, k)

    if idcg == 0:
        return 0.0

    return dcg / idcg


def mean_ndcg_at_k(
    recommendations: Dict[int, List[int]],
    relevance_scores: Dict[int, Dict[int, float]],
    k: int
) -> float:
    """
    Mean NDCG@K across all users.

    Args:
        recommendations: Dict[user_id -> list of recommended items]
        relevance_scores: Dict[user_id -> Dict[item_id -> relevance]]
        k: Number of recommendations

    Returns:
        Mean NDCG@K
    """
    ndcg_scores = []

    for user_id, recs in recommendations.items():
        if user_id in relevance_scores:
            ndcg = ndcg_at_k(recs, relevance_scores[user_id], k)
            ndcg_scores.append(ndcg)

    return np.mean(ndcg_scores) if ndcg_scores else 0.0
```

## Coverage and Diversity Metrics

```python
def catalog_coverage(
    recommendations: Dict[int, List[int]],
    catalog_size: int,
    k: int
) -> float:
    """
    Catalog Coverage: Fraction of catalog items that appear in recommendations.

    Measures diversity across all users.

    Args:
        recommendations: Dict[user_id -> list of recommendations]
        catalog_size: Total number of items in catalog
        k: Number of recommendations per user

    Returns:
        Coverage in [0, 1]

    Example:
        >>> recs = {
        ...     0: [1, 2, 3],
        ...     1: [2, 3, 4],
        ...     2: [3, 4, 5]
        ... }
        >>> catalog_coverage(recs, catalog_size=100, k=3)
        0.05  # 5 unique items out of 100
    """
    recommended_items = set()

    for user_recs in recommendations.values():
        recommended_items.update(user_recs[:k])

    return len(recommended_items) / catalog_size


def gini_coefficient(recommendations: Dict[int, List[int]], k: int) -> float:
    """
    Gini Coefficient: Measure of recommendation concentration.

    0 = perfectly equal distribution (all items recommended equally)
    1 = perfect inequality (only one item recommended to everyone)

    Lower is better (more diverse).

    Args:
        recommendations: Dict[user_id -> list of recommendations]
        k: Number of recommendations per user

    Returns:
        Gini coefficient in [0, 1]
    """
    # Count how many times each item was recommended
    item_counts = defaultdict(int)
    for user_recs in recommendations.values():
        for item in user_recs[:k]:
            item_counts[item] += 1

    # Sort counts
    counts = sorted(item_counts.values())
    n = len(counts)

    if n == 0:
        return 0.0

    # Compute Gini
    # G = (2 * sum(i * x_i)) / (n * sum(x_i)) - (n + 1) / n
    cumsum = np.cumsum(counts)
    gini = (2 * np.sum((np.arange(1, n + 1) * counts))) / (n * cumsum[-1]) - (n + 1) / n

    return gini


def intra_list_diversity(recommended: List[int], item_features: np.ndarray) -> float:
    """
    Intra-List Diversity: Average dissimilarity between recommended items.

    Measures how diverse a single recommendation list is.

    Args:
        recommended: List of recommended item IDs
        item_features: Array (n_items, n_features) of item feature vectors

    Returns:
        Average pairwise distance in [0, 1]
    """
    from sklearn.metrics.pairwise import cosine_distances

    if len(recommended) < 2:
        return 0.0

    # Get feature vectors for recommended items
    rec_features = item_features[recommended]

    # Compute pairwise distances
    distances = cosine_distances(rec_features)

    # Average distance (excluding diagonal)
    n = len(recommended)
    total_distance = np.sum(distances) - np.trace(distances)  # Exclude diagonal
    avg_distance = total_distance / (n * (n - 1))

    return avg_distance
```

## Cross-Validation for Recommenders

```python
from sklearn.model_selection import KFold


def time_based_split(
    interactions: np.ndarray,
    timestamp_col: int,
    test_ratio: float = 0.2
):
    """
    Split based on time (realistic for recommendations).

    Train on past interactions, test on future.

    Args:
        interactions: Array with columns [user_id, item_id, timestamp, ...]
        timestamp_col: Column index containing timestamps
        test_ratio: Fraction of data for test set

    Returns:
        train_interactions, test_interactions
    """
    # Sort by timestamp
    sorted_interactions = interactions[interactions[:, timestamp_col].argsort()]

    # Split at time threshold
    split_idx = int(len(sorted_interactions) * (1 - test_ratio))
    train = sorted_interactions[:split_idx]
    test = sorted_interactions[split_idx:]

    logger.info(f"Time-based split: {len(train)} train, {len(test)} test")
    return train, test


def leave_one_out_cv(user_item_matrix: np.ndarray):
    """
    Leave-one-out cross-validation for each user.

    For each user, hold out one interaction for testing.

    Args:
        user_item_matrix: Matrix (n_users, n_items)

    Yields:
        (train_matrix, test_matrix) pairs
    """
    n_users, n_items = user_item_matrix.shape

    for user_id in range(n_users):
        # Get user's interactions
        user_interactions = user_item_matrix[user_id].nonzero()[0]

        if len(user_interactions) < 2:
            continue  # Need at least 2 interactions

        # Randomly select one to hold out
        test_item = np.random.choice(user_interactions)

        # Create train and test matrices
        train_matrix = user_item_matrix.copy()
        train_matrix[user_id, test_item] = 0

        test_matrix = np.zeros_like(user_item_matrix)
        test_matrix[user_id, test_item] = user_item_matrix[user_id, test_item]

        yield train_matrix, test_matrix
```

## Statistical Significance Testing

```python
from scipy import stats


def paired_t_test(
    metrics_a: List[float],
    metrics_b: List[float],
    alpha: float = 0.05
) -> Dict:
    """
    Paired t-test to compare two recommendation models.

    Tests if difference in metrics is statistically significant.

    Args:
        metrics_a: Metric values (e.g., NDCG@10) for model A, one per user
        metrics_b: Metric values for model B, same users
        alpha: Significance level

    Returns:
        Dict with test results

    Example:
        >>> ndcg_baseline = [0.7, 0.8, 0.75, 0.82, 0.79]
        >>> ndcg_new_model = [0.72, 0.83, 0.76, 0.85, 0.81]
        >>> result = paired_t_test(ndcg_baseline, ndcg_new_model)
        >>> print(result['significant'])  # True if new model is better
    """
    if len(metrics_a) != len(metrics_b):
        raise ValueError("Metric lists must have same length")

    # Compute differences
    differences = np.array(metrics_b) - np.array(metrics_a)

    # Perform paired t-test
    t_statistic, p_value = stats.ttest_rel(metrics_a, metrics_b)

    # Effect size (Cohen's d)
    mean_diff = np.mean(differences)
    std_diff = np.std(differences, ddof=1)
    cohens_d = mean_diff / std_diff if std_diff > 0 else 0.0

    return {
        'mean_improvement': mean_diff,
        'p_value': p_value,
        'significant': p_value < alpha,
        't_statistic': t_statistic,
        'cohens_d': cohens_d,
        'interpretation': 'significant' if p_value < alpha else 'not significant'
    }


def bootstrap_confidence_interval(
    metric_values: List[float],
    n_bootstrap: int = 1000,
    confidence: float = 0.95
) -> tuple:
    """
    Compute confidence interval for a metric using bootstrap.

    Args:
        metric_values: List of metric values
        n_bootstrap: Number of bootstrap samples
        confidence: Confidence level (e.g., 0.95 for 95% CI)

    Returns:
        (lower_bound, upper_bound)
    """
    bootstrap_means = []

    for _ in range(n_bootstrap):
        # Resample with replacement
        sample = np.random.choice(metric_values, size=len(metric_values), replace=True)
        bootstrap_means.append(np.mean(sample))

    # Compute percentiles
    alpha = 1 - confidence
    lower = np.percentile(bootstrap_means, alpha / 2 * 100)
    upper = np.percentile(bootstrap_means, (1 - alpha / 2) * 100)

    return lower, upper
```

## Complete Evaluation Pipeline

```python
class RecommenderEvaluator:
    """
    Comprehensive evaluation of recommendation models.
    """

    def __init__(self, k_values: List[int] = [5, 10, 20]):
        """
        Args:
            k_values: List of K values to evaluate at
        """
        self.k_values = k_values

    def evaluate(
        self,
        model,
        test_data: Dict[int, Set[int]],
        catalog_size: int
    ) -> Dict:
        """
        Evaluate model on test data.

        Args:
            model: Trained recommender model with recommend() method
            test_data: Dict[user_id -> set of relevant items]
            catalog_size: Total number of items

        Returns:
            Dict of metrics
        """
        results = defaultdict(dict)

        # Generate recommendations for all users
        recommendations = {}
        for user_id in test_data:
            try:
                recs = model.recommend(user_id, n=max(self.k_values))
                recommendations[user_id] = [item for item, score in recs]
            except Exception as e:
                logger.warning(f"Failed to generate recs for user {user_id}: {e}")
                continue

        # Compute metrics at each K
        for k in self.k_values:
            # Precision, Recall, F1
            precisions = []
            recalls = []

            for user_id, relevant_items in test_data.items():
                if user_id in recommendations:
                    prec = precision_at_k(recommendations[user_id], relevant_items, k)
                    rec = recall_at_k(recommendations[user_id], relevant_items, k)
                    precisions.append(prec)
                    recalls.append(rec)

            results[f'precision@{k}'] = np.mean(precisions) if precisions else 0.0
            results[f'recall@{k}'] = np.mean(recalls) if recalls else 0.0
            results[f'f1@{k}'] = (
                2 * results[f'precision@{k}'] * results[f'recall@{k}']
                / (results[f'precision@{k}'] + results[f'recall@{k}'])
                if (results[f'precision@{k}'] + results[f'recall@{k}']) > 0 else 0.0
            )

            # Coverage
            results[f'coverage@{k}'] = catalog_coverage(recommendations, catalog_size, k)

            # Diversity (Gini)
            results[f'gini@{k}'] = gini_coefficient(recommendations, k)

        logger.info("Evaluation complete:")
        for metric, value in results.items():
            logger.info(f"  {metric}: {value:.4f}")

        return dict(results)
```

## Example Usage

```python
# Evaluate model
evaluator = RecommenderEvaluator(k_values=[5, 10, 20])

# Test data: dict of user_id -> set of relevant items
test_data = {
    0: {10, 25, 42},
    1: {5, 17, 33},
    # ... more users
}

# Run evaluation
metrics = evaluator.evaluate(
    model=my_recommender,
    test_data=test_data,
    catalog_size=1000
)

# Compare two models statistically
baseline_ndcg = [...]  # NDCG@10 for each test user with baseline
new_model_ndcg = [...]  # NDCG@10 for each test user with new model

test_result = paired_t_test(baseline_ndcg, new_model_ndcg)
if test_result['significant']:
    print(f"New model is significantly better (p={test_result['p_value']:.4f})")
```
