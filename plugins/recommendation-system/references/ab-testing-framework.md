# A/B Testing Framework for Recommendations

Complete A/B testing implementation for recommendation systems including variant assignment, statistical significance testing, and experiment tracking.

## Overview

A/B testing is critical for recommendation systems:
- **Validate improvements**: Test before rolling out
- **Data-driven decisions**: Replace intuition with metrics
- **Continuous optimization**: Always be experimenting

## Variant Assignment

### Deterministic User Assignment

```python
import hashlib
from typing import List, Optional
from dataclasses import dataclass
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


@dataclass
class Experiment:
    """Experiment configuration."""
    id: str
    name: str
    variants: List[str]
    traffic_allocation: List[float]  # Must sum to 1.0
    start_date: datetime
    end_date: Optional[datetime] = None
    active: bool = True


class ABTestingFramework:
    """
    A/B testing framework with deterministic assignment.

    Users are consistently assigned to same variant.
    """

    def __init__(self):
        self.experiments = {}

    def create_experiment(
        self,
        experiment_id: str,
        name: str,
        variants: List[str],
        traffic_allocation: Optional[List[float]] = None
    ) -> Experiment:
        """
        Create new experiment.

        Args:
            experiment_id: Unique experiment ID
            name: Human-readable name
            variants: List of variant names (e.g., ['control', 'treatment'])
            traffic_allocation: Traffic split (e.g., [0.5, 0.5])

        Returns:
            Experiment object
        """
        if not traffic_allocation:
            # Equal split
            traffic_allocation = [1.0 / len(variants)] * len(variants)

        if abs(sum(traffic_allocation) - 1.0) > 0.001:
            raise ValueError("Traffic allocation must sum to 1.0")

        experiment = Experiment(
            id=experiment_id,
            name=name,
            variants=variants,
            traffic_allocation=traffic_allocation,
            start_date=datetime.now()
        )

        self.experiments[experiment_id] = experiment
        logger.info(f"Created experiment: {name} ({experiment_id})")

        return experiment

    def assign_variant(
        self,
        user_id: str,
        experiment_id: str
    ) -> str:
        """
        Assign user to experiment variant.

        Uses deterministic hashing - same user always gets same variant.

        Args:
            user_id: User ID
            experiment_id: Experiment ID

        Returns:
            Variant name
        """
        if experiment_id not in self.experiments:
            raise ValueError(f"Experiment {experiment_id} not found")

        experiment = self.experiments[experiment_id]

        if not experiment.active:
            # Return control for inactive experiments
            return experiment.variants[0]

        # Hash user_id + experiment_id for deterministic assignment
        hash_input = f"{user_id}:{experiment_id}"
        hash_digest = hashlib.md5(hash_input.encode()).hexdigest()
        hash_value = int(hash_digest, 16)

        # Map hash to variant based on traffic allocation
        random_value = (hash_value % 10000) / 10000.0

        cumulative = 0.0
        for variant, allocation in zip(
            experiment.variants,
            experiment.traffic_allocation
        ):
            cumulative += allocation
            if random_value < cumulative:
                return variant

        # Fallback (should never happen)
        return experiment.variants[0]

    def get_variant_with_logging(
        self,
        user_id: str,
        experiment_id: str,
        logger_fn=None
    ) -> str:
        """
        Assign variant and log assignment.

        Args:
            user_id: User ID
            experiment_id: Experiment ID
            logger_fn: Function to log assignment (e.g., to database)

        Returns:
            Variant name
        """
        variant = self.assign_variant(user_id, experiment_id)

        # Log assignment for analysis
        if logger_fn:
            logger_fn({
                'user_id': user_id,
                'experiment_id': experiment_id,
                'variant': variant,
                'timestamp': datetime.now().isoformat()
            })

        return variant


# Example usage
ab_test = ABTestingFramework()

# Create experiment: test new recommendation algorithm
ab_test.create_experiment(
    experiment_id='rec_algo_v2',
    name='New Recommendation Algorithm Test',
    variants=['control', 'treatment'],
    traffic_allocation=[0.5, 0.5]
)

# Assign user
variant = ab_test.assign_variant(
    user_id='user_123',
    experiment_id='rec_algo_v2'
)
# variant = 'control' or 'treatment' (consistent for user_123)
```

## Multi-Armed Bandit Alternative

### Thompson Sampling

```python
import numpy as np
from scipy import stats


class ThompsonSampling:
    """
    Thompson Sampling for dynamic traffic allocation.

    Automatically shifts traffic to better-performing variants.
    """

    def __init__(self, variant_names: List[str]):
        self.variants = variant_names

        # Beta distribution parameters (alpha, beta) for each variant
        # Start with uninformative prior: Beta(1, 1)
        self.successes = {v: 1 for v in variant_names}  # alpha
        self.failures = {v: 1 for v in variant_names}   # beta

    def select_variant(self) -> str:
        """
        Select variant using Thompson Sampling.

        Returns:
            Selected variant name
        """
        # Sample from each variant's Beta distribution
        samples = {
            variant: np.random.beta(
                self.successes[variant],
                self.failures[variant]
            )
            for variant in self.variants
        }

        # Return variant with highest sample
        return max(samples, key=samples.get)

    def update(self, variant: str, reward: float):
        """
        Update variant statistics.

        Args:
            variant: Variant name
            reward: 1.0 for success, 0.0 for failure
        """
        if reward > 0:
            self.successes[variant] += 1
        else:
            self.failures[variant] += 1

    def get_statistics(self) -> dict:
        """Get current statistics for all variants."""
        return {
            variant: {
                'successes': self.successes[variant],
                'failures': self.failures[variant],
                'estimated_ctr': self.successes[variant] / (
                    self.successes[variant] + self.failures[variant]
                )
            }
            for variant in self.variants
        }


# Example usage
bandit = ThompsonSampling(variants=['control', 'treatment_a', 'treatment_b'])

# For each user
for user_id in users:
    variant = bandit.select_variant()

    # Show recommendations from variant
    recommendations = get_recommendations(user_id, variant)

    # Track if user clicked/converted
    clicked = user_clicked(recommendations)
    reward = 1.0 if clicked else 0.0

    # Update bandit
    bandit.update(variant, reward)

# Check performance
print(bandit.get_statistics())
```

## Statistical Significance Testing

### Bayesian A/B Test Analysis

```python
from typing import Tuple


class BayesianABTest:
    """Bayesian analysis of A/B test results."""

    def __init__(self):
        pass

    def analyze(
        self,
        control_successes: int,
        control_trials: int,
        treatment_successes: int,
        treatment_trials: int,
        prior_alpha: float = 1.0,
        prior_beta: float = 1.0
    ) -> dict:
        """
        Analyze A/B test using Bayesian inference.

        Args:
            control_successes: Number of conversions in control
            control_trials: Number of users in control
            treatment_successes: Number of conversions in treatment
            treatment_trials: Number of users in treatment
            prior_alpha: Prior alpha for Beta distribution
            prior_beta: Prior beta for Beta distribution

        Returns:
            Dictionary with analysis results
        """
        # Posterior distributions
        control_alpha = prior_alpha + control_successes
        control_beta = prior_beta + (control_trials - control_successes)

        treatment_alpha = prior_alpha + treatment_successes
        treatment_beta = prior_beta + (treatment_trials - treatment_successes)

        # Expected values (means)
        control_mean = control_alpha / (control_alpha + control_beta)
        treatment_mean = treatment_alpha / (treatment_alpha + treatment_beta)

        # Probability that treatment > control
        # Monte Carlo estimation
        n_samples = 100000
        control_samples = np.random.beta(control_alpha, control_beta, n_samples)
        treatment_samples = np.random.beta(treatment_alpha, treatment_beta, n_samples)

        prob_treatment_better = np.mean(treatment_samples > control_samples)

        # Relative lift
        relative_lift = (treatment_mean - control_mean) / control_mean

        # Credible intervals (95%)
        control_ci = stats.beta.interval(
            0.95,
            control_alpha,
            control_beta
        )
        treatment_ci = stats.beta.interval(
            0.95,
            treatment_alpha,
            treatment_beta
        )

        return {
            'control': {
                'mean': control_mean,
                'credible_interval': control_ci,
                'trials': control_trials,
                'successes': control_successes
            },
            'treatment': {
                'mean': treatment_mean,
                'credible_interval': treatment_ci,
                'trials': treatment_trials,
                'successes': treatment_successes
            },
            'probability_treatment_better': prob_treatment_better,
            'relative_lift': relative_lift,
            'significant': prob_treatment_better > 0.95  # 95% threshold
        }


# Example usage
analyzer = BayesianABTest()

results = analyzer.analyze(
    control_successes=850,
    control_trials=10000,
    treatment_successes=920,
    treatment_trials=10000
)

print(f"Control CTR: {results['control']['mean']:.2%}")
print(f"Treatment CTR: {results['treatment']['mean']:.2%}")
print(f"Probability treatment is better: {results['probability_treatment_better']:.2%}")
print(f"Relative lift: {results['relative_lift']:+.2%}")
print(f"Significant: {results['significant']}")
```

### Frequentist Significance Test

```python
from scipy import stats as scipy_stats


def ab_test_significance(
    control_conversions: int,
    control_total: int,
    treatment_conversions: int,
    treatment_total: int,
    alpha: float = 0.05
) -> dict:
    """
    Frequentist A/B test significance using two-proportion z-test.

    Args:
        control_conversions: Conversions in control
        control_total: Total users in control
        treatment_conversions: Conversions in treatment
        treatment_total: Total users in treatment
        alpha: Significance level (default 0.05)

    Returns:
        Dictionary with test results
    """
    # Conversion rates
    p_control = control_conversions / control_total
    p_treatment = treatment_conversions / treatment_total

    # Pooled proportion
    p_pooled = (control_conversions + treatment_conversions) / (
        control_total + treatment_total
    )

    # Standard error
    se = np.sqrt(
        p_pooled * (1 - p_pooled) * (
            1/control_total + 1/treatment_total
        )
    )

    # Z-score
    z_score = (p_treatment - p_control) / se

    # P-value (two-tailed)
    p_value = 2 * (1 - scipy_stats.norm.cdf(abs(z_score)))

    # Confidence interval for difference
    se_diff = np.sqrt(
        (p_control * (1 - p_control) / control_total) +
        (p_treatment * (1 - p_treatment) / treatment_total)
    )

    ci_lower = (p_treatment - p_control) - 1.96 * se_diff
    ci_upper = (p_treatment - p_control) + 1.96 * se_diff

    return {
        'control_rate': p_control,
        'treatment_rate': p_treatment,
        'difference': p_treatment - p_control,
        'relative_lift': (p_treatment - p_control) / p_control,
        'z_score': z_score,
        'p_value': p_value,
        'significant': p_value < alpha,
        'confidence_interval': (ci_lower, ci_upper),
        'sample_size': {
            'control': control_total,
            'treatment': treatment_total
        }
    }


# Example
result = ab_test_significance(
    control_conversions=450,
    control_total=5000,
    treatment_conversions=520,
    treatment_total=5000
)

print(f"Control Rate: {result['control_rate']:.2%}")
print(f"Treatment Rate: {result['treatment_rate']:.2%}")
print(f"Lift: {result['relative_lift']:+.2%}")
print(f"P-value: {result['p_value']:.4f}")
print(f"Significant (p<0.05): {result['significant']}")
```

## Experiment Tracking

### Complete Experiment Tracker

```python
from typing import Dict, List
import sqlite3
import json


class ExperimentTracker:
    """
    Track experiment assignments and outcomes.

    Note: This implementation uses context managers for safe connection handling.
    For production use with high traffic, consider:
    1. Using a connection pool (e.g., sqlitepool for SQLite)
    2. Migrating to PostgreSQL with pgbouncer for connection pooling
    3. Implementing connection reuse for long-lived processes
    """

    def __init__(self, db_path: str = 'experiments.db'):
        self.db_path = db_path
        self._init_db()

    def _init_db(self):
        """Initialize database schema."""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()

                # Assignments table
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS assignments (
                        user_id TEXT,
                        experiment_id TEXT,
                        variant TEXT,
                        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                        PRIMARY KEY (user_id, experiment_id)
                    )
                """)

                # Events table
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS events (
                        user_id TEXT,
                        experiment_id TEXT,
                        event_type TEXT,
                        event_value REAL,
                        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                """)

                conn.commit()
        except sqlite3.Error as e:
            logger.error(f"Database initialization failed: {e}")
            raise

    def log_assignment(
        self,
        user_id: str,
        experiment_id: str,
        variant: str
    ):
        """Log variant assignment."""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()

                cursor.execute("""
                    INSERT OR REPLACE INTO assignments
                    (user_id, experiment_id, variant)
                    VALUES (?, ?, ?)
                """, (user_id, experiment_id, variant))

                conn.commit()
        except sqlite3.Error as e:
            logger.error(f"Failed to log assignment for user {user_id}: {e}")
            raise

    def log_event(
        self,
        user_id: str,
        experiment_id: str,
        event_type: str,
        event_value: float = 1.0
    ):
        """
        Log user event (click, conversion, etc.).

        Args:
            user_id: User ID
            experiment_id: Experiment ID
            event_type: Type of event ('click', 'conversion', etc.)
            event_value: Numeric value (e.g., revenue, 1.0 for binary)
        """
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()

                cursor.execute("""
                    INSERT INTO events
                    (user_id, experiment_id, event_type, event_value)
                    VALUES (?, ?, ?, ?)
                """, (user_id, experiment_id, event_type, event_value))

                conn.commit()
        except sqlite3.Error as e:
            logger.error(f"Failed to log event {event_type} for user {user_id}: {e}")
            raise

    def get_experiment_results(
        self,
        experiment_id: str,
        event_type: str = 'conversion'
    ) -> Dict:
        """
        Get experiment results by variant.

        Args:
            experiment_id: Experiment ID
            event_type: Event type to analyze

        Returns:
            Dictionary with results per variant
        """
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()

                # Get assignments and events by variant
                cursor.execute("""
                    SELECT
                        a.variant,
                        COUNT(DISTINCT a.user_id) as total_users,
                        COUNT(DISTINCT e.user_id) as converted_users,
                        SUM(COALESCE(e.event_value, 0)) as total_value
                    FROM assignments a
                    LEFT JOIN events e ON
                        a.user_id = e.user_id AND
                        a.experiment_id = e.experiment_id AND
                        e.event_type = ?
                    WHERE a.experiment_id = ?
                    GROUP BY a.variant
                """, (event_type, experiment_id))

                results = {}
                for row in cursor.fetchall():
                    variant = row['variant']
                    total = row['total_users']
                    conversions = row['converted_users'] or 0

                    results[variant] = {
                        'total_users': total,
                        'conversions': conversions,
                        'conversion_rate': conversions / total if total > 0 else 0,
                        'total_value': row['total_value'] or 0
                    }

                return results
        except sqlite3.Error as e:
            logger.error(f"Failed to get results for experiment {experiment_id}: {e}")
            raise


# Example usage
tracker = ExperimentTracker()

# Log assignment
tracker.log_assignment(
    user_id='user_123',
    experiment_id='rec_algo_v2',
    variant='treatment'
)

# Log conversion
tracker.log_event(
    user_id='user_123',
    experiment_id='rec_algo_v2',
    event_type='conversion',
    event_value=1.0
)

# Get results
results = tracker.get_experiment_results('rec_algo_v2')
print(results)
# {'control': {'total_users': 5000, 'conversions': 450, ...},
#  'treatment': {'total_users': 5000, 'conversions': 520, ...}}
```

## Best Practices

1. **Deterministic Assignment**: Use hashing for consistent user experience
2. **Sufficient Sample Size**: Calculate required size before starting
3. **Monitor Both Metrics**: Track primary (conversion) and secondary (engagement) metrics
4. **Avoid Peeking**: Don't stop early just because one variant is winning
5. **Consider Novelty Effect**: Run experiments for 1-2 weeks minimum
6. **Segment Analysis**: Analyze by user segments (new vs returning, etc.)
7. **Log Everything**: Track assignments and outcomes for post-hoc analysis
8. **Bayesian Approach**: More intuitive interpretation than p-values
