# Matrix Factorization Methods

Complete implementations of SVD, ALS, and NMF for recommendation systems with hyperparameter tuning and implicit feedback handling.

## Overview

Matrix factorization decomposes the user-item interaction matrix into lower-dimensional user and item latent factor matrices:

```
R (n_users × n_items) ≈ U (n_users × k) × V^T (k × n_items)
```

**Advantages**:
- Handles sparsity better than CF
- Discovers latent features
- More scalable than memory-based CF
- Works well with implicit feedback

## Singular Value Decomposition (SVD)

### Basic SVD Implementation

```python
from typing import Optional, Tuple
import numpy as np
from scipy.sparse import csr_matrix
from scipy.sparse.linalg import svds
import logging

logger = logging.getLogger(__name__)


class SVDRecommender:
    """
    SVD-based recommender using truncated singular value decomposition.

    Decomposes user-item matrix into:
    R ≈ U × Σ × V^T

    Works best with explicit ratings data.
    """

    def __init__(
        self,
        n_factors: int = 50,
        normalize: bool = True,
        random_state: Optional[int] = 42
    ):
        """
        Initialize SVD recommender.

        Args:
            n_factors: Number of latent factors (rank of approximation)
            normalize: Whether to normalize by singular values
            random_state: Random seed for reproducibility
        """
        self.n_factors = n_factors
        self.normalize = normalize
        self.random_state = random_state

        self.user_factors: Optional[np.ndarray] = None
        self.item_factors: Optional[np.ndarray] = None
        self.singular_values: Optional[np.ndarray] = None
        self.global_mean: float = 0.0

    def fit(self, user_item_matrix: csr_matrix) -> 'SVDRecommender':
        """
        Fit SVD model to user-item matrix.

        Args:
            user_item_matrix: Sparse matrix (n_users, n_items)

        Returns:
            self for chaining
        """
        logger.info(f"Fitting SVD with {self.n_factors} factors")

        # Compute global mean (for mean-centering)
        self.global_mean = user_item_matrix.data.mean()

        # Mean-center the ratings
        centered_matrix = user_item_matrix.copy()
        centered_matrix.data -= self.global_mean

        # Compute truncated SVD
        # Note: svds returns in ascending order of singular values
        U, sigma, Vt = svds(
            centered_matrix,
            k=self.n_factors,
            random_state=self.random_state
        )

        # Reverse to get descending order
        U = U[:, ::-1]
        sigma = sigma[::-1]
        Vt = Vt[::-1, :]

        self.singular_values = sigma

        if self.normalize:
            # Distribute singular values into factors
            self.user_factors = U * np.sqrt(sigma)
            self.item_factors = (Vt.T * np.sqrt(sigma)).T
        else:
            # Keep singular values separate for numerical stability
            self.user_factors = U
            self.item_factors = Vt

        logger.info(f"SVD fit complete. Explained variance: "
                   f"{self._explained_variance():.2%}")

        return self

    def predict(self, user_id: int, item_id: int) -> float:
        """
        Predict rating for user-item pair.

        Args:
            user_id: User index
            item_id: Item index

        Returns:
            Predicted rating
        """
        if self.user_factors is None or self.item_factors is None:
            raise ValueError("Model not fitted")

        if self.normalize:
            prediction = np.dot(
                self.user_factors[user_id],
                self.item_factors[:, item_id]
            )
        else:
            prediction = np.dot(
                self.user_factors[user_id] * self.singular_values,
                self.item_factors[:, item_id]
            )

        # Add back global mean
        return prediction + self.global_mean

    def recommend(
        self,
        user_id: int,
        n: int = 10,
        exclude_interacted: Optional[np.ndarray] = None
    ) -> list:
        """
        Generate top-N recommendations for a user.

        Args:
            user_id: User index
            n: Number of recommendations
            exclude_interacted: Array of item indices to exclude

        Returns:
            List of (item_id, predicted_rating) tuples
        """
        if self.user_factors is None or self.item_factors is None:
            raise ValueError("Model not fitted")

        # Compute predictions for all items
        if self.normalize:
            scores = self.user_factors[user_id] @ self.item_factors
        else:
            scores = (self.user_factors[user_id] * self.singular_values) @ self.item_factors

        scores += self.global_mean

        # Exclude already interacted items
        if exclude_interacted is not None:
            scores[exclude_interacted] = -np.inf

        # Get top-N items
        top_items = np.argsort(scores)[-n:][::-1]
        return [(int(item), float(scores[item])) for item in top_items]

    def _explained_variance(self) -> float:
        """Calculate proportion of variance explained by the model."""
        if self.singular_values is None:
            return 0.0
        total_variance = np.sum(self.singular_values ** 2)
        explained = np.sum(self.singular_values[:self.n_factors] ** 2)
        return explained / total_variance if total_variance > 0 else 0.0
```

## Alternating Least Squares (ALS)

ALS is better for implicit feedback and very large datasets (scales to billions of interactions).

```python
from scipy.sparse import csr_matrix, diags
import numpy as np


class ALSRecommender:
    """
    Alternating Least Squares for implicit feedback.

    Optimizes: min ||C ⊙ (R - UV^T)||² + λ(||U||² + ||V||²)

    Where:
    - R: user-item confidence matrix
    - C: confidence weights
    - ⊙: element-wise product
    - λ: regularization parameter
    """

    def __init__(
        self,
        n_factors: int = 50,
        regularization: float = 0.01,
        iterations: int = 15,
        alpha: float = 40.0,
        random_state: Optional[int] = 42
    ):
        """
        Initialize ALS model.

        Args:
            n_factors: Number of latent factors
            regularization: L2 regularization strength
            iterations: Number of alternating iterations
            alpha: Confidence scaling factor for implicit feedback
            random_state: Random seed
        """
        self.n_factors = n_factors
        self.regularization = regularization
        self.iterations = iterations
        self.alpha = alpha
        self.random_state = random_state

        self.user_factors: Optional[np.ndarray] = None
        self.item_factors: Optional[np.ndarray] = None

    def fit(self, user_item_matrix: csr_matrix) -> 'ALSRecommender':
        """
        Fit ALS model using alternating least squares.

        Args:
            user_item_matrix: Sparse binary or count matrix (n_users, n_items)

        Returns:
            self for chaining
        """
        np.random.seed(self.random_state)

        n_users, n_items = user_item_matrix.shape
        logger.info(f"Fitting ALS: {n_users} users, {n_items} items, "
                   f"{self.iterations} iterations")

        # Initialize factors randomly
        self.user_factors = np.random.normal(
            scale=0.01, size=(n_users, self.n_factors)
        ).astype(np.float32)
        self.item_factors = np.random.normal(
            scale=0.01, size=(n_items, self.n_factors)
        ).astype(np.float32)

        # Confidence matrix: C = 1 + alpha * R
        confidence_matrix = user_item_matrix.copy()
        confidence_matrix.data = 1 + self.alpha * confidence_matrix.data

        # Preference matrix: P (binary)
        preference_matrix = user_item_matrix.copy()
        preference_matrix.data = np.ones_like(preference_matrix.data)

        # Alternating least squares
        for iteration in range(self.iterations):
            logger.info(f"ALS iteration {iteration + 1}/{self.iterations}")

            # Fix item factors, solve for user factors
            self.user_factors = self._solve_factors(
                self.item_factors,
                confidence_matrix.T,
                preference_matrix.T
            )

            # Fix user factors, solve for item factors
            self.item_factors = self._solve_factors(
                self.user_factors,
                confidence_matrix,
                preference_matrix
            )

            # Compute loss (optional, for monitoring)
            if (iteration + 1) % 5 == 0:
                loss = self._compute_loss(
                    user_item_matrix, confidence_matrix, preference_matrix
                )
                logger.info(f"  Loss: {loss:.4f}")

        return self

    def _solve_factors(
        self,
        fixed_factors: np.ndarray,
        confidence: csr_matrix,
        preference: csr_matrix
    ) -> np.ndarray:
        """
        Solve for one set of factors with the other held fixed.

        Args:
            fixed_factors: The fixed factor matrix
            confidence: Confidence matrix C
            preference: Preference matrix P

        Returns:
            Updated factor matrix
        """
        n_entities = confidence.shape[0]
        n_factors = fixed_factors.shape[1]
        new_factors = np.zeros((n_entities, n_factors), dtype=np.float32)

        # Precompute Y^T Y (fixed_factors^T @ fixed_factors)
        YtY = fixed_factors.T @ fixed_factors

        # Regularization term
        lambda_I = self.regularization * np.eye(n_factors, dtype=np.float32)

        # Solve for each entity (user or item)
        for entity_id in range(n_entities):
            # Get confidence and preference for this entity
            c_u = confidence[entity_id].toarray().flatten()  # Shape: (n_factors,)
            p_u = preference[entity_id].toarray().flatten()

            # Construct diagonal confidence matrix
            C_u = diags(c_u, format='csr')

            # Solve: (Y^T C_u Y + λI) x_u = Y^T C_u p_u
            # Where Y is fixed_factors, x_u is the factor we're solving for
            A = YtY + fixed_factors.T @ (C_u - diags(np.ones(len(c_u)))).toarray() @ fixed_factors + lambda_I
            b = fixed_factors.T @ (c_u * p_u)

            # Solve linear system
            new_factors[entity_id] = np.linalg.solve(A, b)

        return new_factors

    def _compute_loss(
        self,
        original_matrix: csr_matrix,
        confidence: csr_matrix,
        preference: csr_matrix
    ) -> float:
        """Compute weighted squared loss."""
        predictions = self.user_factors @ self.item_factors.T

        # Weighted loss: sum(C_ui * (P_ui - X_ui)²)
        loss = 0.0
        for u in range(original_matrix.shape[0]):
            items = original_matrix[u].indices
            c_u = confidence[u].data
            p_u = preference[u].data
            pred_u = predictions[u, items]

            loss += np.sum(c_u * (p_u - pred_u) ** 2)

        # Add regularization
        reg_loss = self.regularization * (
            np.sum(self.user_factors ** 2) + np.sum(self.item_factors ** 2)
        )

        return loss + reg_loss

    def recommend(self, user_id: int, n: int = 10, filter_interacted: bool = True) -> list:
        """Generate recommendations using dot product of factors."""
        if self.user_factors is None or self.item_factors is None:
            raise ValueError("Model not fitted")

        scores = self.user_factors[user_id] @ self.item_factors.T

        if filter_interacted:
            # Set interacted items to -inf
            # (assuming original matrix is available)
            pass

        top_items = np.argsort(scores)[-n:][::-1]
        return [(int(item), float(scores[item])) for item in top_items]
```

## Non-Negative Matrix Factorization (NMF)

NMF enforces non-negativity constraints, leading to more interpretable factors.

```python
from sklearn.decomposition import NMF


class NMFRecommender:
    """
    NMF for recommendation with non-negative constraints.

    Useful when factors should represent additive components
    (e.g., genre preferences, topic interests).
    """

    def __init__(
        self,
        n_factors: int = 50,
        init: str = 'nndsvd',
        max_iter: int = 200,
        random_state: Optional[int] = 42
    ):
        """
        Args:
            n_factors: Number of components
            init: Initialization method ('random', 'nndsvd', 'nndsvda')
            max_iter: Maximum iterations
            random_state: Random seed
        """
        self.nmf = NMF(
            n_components=n_factors,
            init=init,
            max_iter=max_iter,
            random_state=random_state
        )
        self.user_factors = None
        self.item_factors = None

    def fit(self, user_item_matrix):
        """Fit NMF model."""
        # Convert sparse to dense (NMF doesn't handle sparse well)
        dense_matrix = user_item_matrix.toarray() if hasattr(user_item_matrix, 'toarray') else user_item_matrix

        self.user_factors = self.nmf.fit_transform(dense_matrix)
        self.item_factors = self.nmf.components_

        logger.info(f"NMF reconstruction error: {self.nmf.reconstruction_err_:.4f}")
        return self

    def recommend(self, user_id: int, n: int = 10) -> list:
        """Generate recommendations."""
        scores = self.user_factors[user_id] @ self.item_factors
        top_items = np.argsort(scores)[-n:][::-1]
        return [(int(item), float(scores[item])) for item in top_items]
```

## Hyperparameter Tuning

```python
from sklearn.model_selection import GridSearchCV
from sklearn.metrics import mean_squared_error


def tune_svd_hyperparameters(train_matrix, val_matrix):
    """
    Tune number of factors and normalization.

    Returns:
        Best hyperparameters
    """
    param_grid = {
        'n_factors': [20, 50, 100, 200],
        'normalize': [True, False]
    }

    best_rmse = float('inf')
    best_params = None

    for n_factors in param_grid['n_factors']:
        for normalize in param_grid['normalize']:
            model = SVDRecommender(n_factors=n_factors, normalize=normalize)
            model.fit(train_matrix)

            # Evaluate on validation set
            predictions = []
            actuals = []
            for u, i in zip(*val_matrix.nonzero()):
                predictions.append(model.predict(u, i))
                actuals.append(val_matrix[u, i])

            rmse = np.sqrt(mean_squared_error(actuals, predictions))

            if rmse < best_rmse:
                best_rmse = rmse
                best_params = {'n_factors': n_factors, 'normalize': normalize}

    logger.info(f"Best params: {best_params}, RMSE: {best_rmse:.4f}")
    return best_params


def tune_als_hyperparameters(train_matrix):
    """Tune ALS regularization and number of factors."""
    param_grid = {
        'n_factors': [20, 50, 100],
        'regularization': [0.001, 0.01, 0.1],
        'alpha': [1, 10, 40]
    }

    # Grid search (simplified)
    best_model = None
    best_loss = float('inf')

    for n_factors in param_grid['n_factors']:
        for reg in param_grid['regularization']:
            for alpha in param_grid['alpha']:
                model = ALSRecommender(
                    n_factors=n_factors,
                    regularization=reg,
                    alpha=alpha,
                    iterations=10  # Fewer iterations for tuning
                )
                model.fit(train_matrix)

                # Compute confidence matrix: C = 1 + alpha * R
                confidence_matrix = train_matrix.copy()
                confidence_matrix.data = 1 + model.alpha * confidence_matrix.data

                # Compute preference matrix: P (binary indicator)
                preference_matrix = train_matrix.copy()
                preference_matrix.data = np.ones_like(preference_matrix.data)

                # Now call with proper matrices
                loss = model._compute_loss(train_matrix, confidence_matrix, preference_matrix)
                if loss < best_loss:
                    best_loss = loss
                    best_model = model

    return best_model
```

## Handling Implicit Feedback

Implicit feedback (clicks, views) requires different treatment than explicit ratings:

```python
def convert_implicit_to_confidence(interaction_matrix, alpha=40):
    """
    Convert implicit feedback to confidence matrix.

    C_ui = 1 + alpha * r_ui

    Where r_ui is the interaction count (views, clicks, etc.)
    """
    confidence = interaction_matrix.copy()
    confidence.data = 1 + alpha * np.log(1 + confidence.data)
    return confidence
```

## Advanced Techniques

### BPR (Bayesian Personalized Ranking)

For implicit feedback, optimizes pairwise ranking:

```python
# User u should prefer item i over item j
# max P(i >_u j) = sigmoid(x_ui - x_uj)
```

### WARP (Weighted Approximate-Rank Pairwise)

Optimizes top-k ranking directly (available in LightFM library).

## When to Use Each Method

**SVD**:
- ✅ Explicit ratings (1-5 stars)
- ✅ Need fast inference
- ✅ Moderate sparsity (<99%)
- ❌ Implicit feedback (use ALS)

**ALS**:
- ✅ Implicit feedback (clicks, views)
- ✅ Very large scale (billions of interactions)
- ✅ High sparsity (>99%)
- ✅ Need interpretable latent factors
- ❌ Explicit ratings with wide range

**NMF**:
- ✅ Need interpretable non-negative factors
- ✅ Topic modeling style decomposition
- ✅ Smaller datasets (dense computation)
- ❌ Very large or very sparse data
