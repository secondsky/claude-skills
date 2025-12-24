# Monitoring and Alerting for Recommendation Systems

Production monitoring, metrics dashboards, alert configuration, and performance tracking for recommendation systems.

## Key Metrics to Monitor

### Business Metrics
- **Click-Through Rate (CTR)**: % of recommendations clicked
- **Conversion Rate**: % of clicks that result in purchase/action
- **Revenue Per User (RPU)**: Average revenue from recommendations
- **Coverage**: % of catalog being recommended
- **Diversity**: Variety in recommendations (opposite of concentration)

### Technical Metrics
- **Latency**: P50, P95, P99 response times
- **Throughput**: Requests per second
- **Cache Hit Rate**: % of requests served from cache
- **Error Rate**: % of failed requests
- **Model Staleness**: Time since last model update

## Prometheus Metrics Integration

### Complete Metrics Setup

```python
from prometheus_client import Counter, Histogram, Gauge, Summary
from prometheus_client import generate_latest, REGISTRY
from flask import Flask, Response
import time
import logging
from typing import Dict, List
from functools import wraps
import requests
from requests.exceptions import RequestException

logger = logging.getLogger(__name__)

# Define metrics

# Request metrics
recommendation_requests = Counter(
    'recommendation_requests_total',
    'Total recommendation requests',
    ['model_version', 'status']
)

recommendation_latency = Histogram(
    'recommendation_latency_seconds',
    'Recommendation generation latency',
    ['model_version'],
    buckets=[0.01, 0.05, 0.1, 0.2, 0.5, 1.0, 2.0, 5.0]
)

# Business metrics
recommendations_clicked = Counter(
    'recommendations_clicked_total',
    'Total clicked recommendations',
    ['model_version', 'position']  # position: 1-10
)

recommendations_converted = Counter(
    'recommendations_converted_total',
    'Total recommendations that converted',
    ['model_version']
)

recommendation_revenue = Summary(
    'recommendation_revenue_dollars',
    'Revenue from recommendations',
    ['model_version']
)

# Cache metrics
cache_hits = Counter(
    'recommendation_cache_hits_total',
    'Total cache hits'
)

cache_misses = Counter(
    'recommendation_cache_misses_total',
    'Total cache misses'
)

# Quality metrics
recommendation_diversity = Gauge(
    'recommendation_diversity_score',
    'Diversity score (0-1)',
    ['model_version']
)

catalog_coverage = Gauge(
    'recommendation_catalog_coverage',
    'Percentage of catalog recommended',
    ['model_version']
)

model_staleness_hours = Gauge(
    'recommendation_model_staleness_hours',
    'Hours since model was last updated',
    ['model_version']
)


class MetricsCollector:
    """Collect and expose recommendation metrics."""

    def __init__(self, model_version: str = 'v1'):
        self.model_version = model_version

    def track_request(self, success: bool = True):
        """Track recommendation request."""
        status = 'success' if success else 'error'
        recommendation_requests.labels(
            model_version=self.model_version,
            status=status
        ).inc()

    def track_latency(self, latency_seconds: float):
        """Track request latency."""
        recommendation_latency.labels(
            model_version=self.model_version
        ).observe(latency_seconds)

    def track_click(self, position: int):
        """
        Track recommendation click.

        Args:
            position: Position in recommendation list (1-10)
        """
        recommendations_clicked.labels(
            model_version=self.model_version,
            position=str(position)
        ).inc()

    def track_conversion(self, revenue: float = 0.0):
        """
        Track recommendation conversion.

        Args:
            revenue: Revenue generated (optional)
        """
        recommendations_converted.labels(
            model_version=self.model_version
        ).inc()

        if revenue > 0:
            recommendation_revenue.labels(
                model_version=self.model_version
            ).observe(revenue)

    def track_cache_hit(self, hit: bool):
        """Track cache hit/miss."""
        if hit:
            cache_hits.inc()
        else:
            cache_misses.inc()

    def update_diversity(self, score: float):
        """
        Update diversity score.

        Args:
            score: Diversity score between 0 and 1
        """
        recommendation_diversity.labels(
            model_version=self.model_version
        ).set(score)

    def update_coverage(self, coverage_pct: float):
        """
        Update catalog coverage.

        Args:
            coverage_pct: Percentage of catalog recommended (0-100)
        """
        catalog_coverage.labels(
            model_version=self.model_version
        ).set(coverage_pct)

    def update_model_staleness(self, hours: float):
        """
        Update model staleness.

        Args:
            hours: Hours since model was last updated
        """
        model_staleness_hours.labels(
            model_version=self.model_version
        ).set(hours)


def monitor_latency(metrics_collector: MetricsCollector):
    """Decorator to track function latency."""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            start_time = time.time()
            try:
                result = func(*args, **kwargs)
                metrics_collector.track_request(success=True)
                return result
            except Exception as e:
                metrics_collector.track_request(success=False)
                raise
            finally:
                latency = time.time() - start_time
                metrics_collector.track_latency(latency)
        return wrapper
    return decorator


# Example usage in FastAPI
from fastapi import FastAPI

app = FastAPI()
metrics = MetricsCollector(model_version='v2')


@app.post("/recommendations")
@monitor_latency(metrics)
async def get_recommendations(user_id: str, n: int = 10):
    """Generate recommendations with metrics tracking."""
    # Your recommendation logic here
    recommendations = generate_recs(user_id, n)

    return {'recommendations': recommendations}


@app.post("/track/click")
async def track_click(user_id: str, item_id: str, position: int):
    """Track recommendation click."""
    metrics.track_click(position)
    return {'status': 'tracked'}


@app.post("/track/conversion")
async def track_conversion(user_id: str, item_id: str, revenue: float):
    """Track recommendation conversion."""
    metrics.track_conversion(revenue)
    return {'status': 'tracked'}


@app.get("/metrics")
async def get_metrics():
    """Expose Prometheus metrics."""
    return Response(generate_latest(REGISTRY), media_type="text/plain")
```

## Dashboard Monitoring

### Metrics Dashboard Endpoint

```python
from datetime import datetime, timedelta
from typing import Dict, List


class MetricsDashboard:
    """Aggregated metrics for dashboards."""

    def __init__(self, db_client):
        self.db = db_client

    def get_summary(
        self,
        start_date: datetime,
        end_date: datetime,
        model_version: str = 'v2'
    ) -> Dict:
        """
        Get aggregated metrics for time period.

        Args:
            start_date: Start of period
            end_date: End of period
            model_version: Model version to query

        Returns:
            Dictionary with aggregated metrics
        """
        # Query database for metrics in time range
        query = """
        SELECT
            COUNT(*) as total_requests,
            SUM(CASE WHEN clicked = 1 THEN 1 ELSE 0 END) as total_clicks,
            SUM(CASE WHEN converted = 1 THEN 1 ELSE 0 END) as total_conversions,
            SUM(revenue) as total_revenue,
            AVG(latency_ms) as avg_latency,
            PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY latency_ms) as p95_latency,
            PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY latency_ms) as p99_latency
        FROM recommendation_events
        WHERE
            timestamp BETWEEN %s AND %s
            AND model_version = %s
        """

        result = self.db.execute(query, (start_date, end_date, model_version))
        row = result.fetchone()

        total_requests = row['total_requests']
        total_clicks = row['total_clicks']
        total_conversions = row['total_conversions']

        return {
            'period': {
                'start': start_date.isoformat(),
                'end': end_date.isoformat()
            },
            'requests': {
                'total': total_requests
            },
            'clicks': {
                'total': total_clicks,
                'ctr': total_clicks / total_requests if total_requests > 0 else 0
            },
            'conversions': {
                'total': total_conversions,
                'conversion_rate': total_conversions / total_clicks if total_clicks > 0 else 0
            },
            'revenue': {
                'total': float(row['total_revenue'] or 0),
                'per_user': float(row['total_revenue'] or 0) / total_requests if total_requests > 0 else 0
            },
            'latency': {
                'avg_ms': float(row['avg_latency'] or 0),
                'p95_ms': float(row['p95_latency'] or 0),
                'p99_ms': float(row['p99_latency'] or 0)
            }
        }

    def get_hourly_metrics(
        self,
        date: datetime,
        model_version: str = 'v2'
    ) -> List[Dict]:
        """
        Get metrics broken down by hour.

        Args:
            date: Date to query
            model_version: Model version

        Returns:
            List of hourly metric dictionaries
        """
        query = """
        SELECT
            DATE_TRUNC('hour', timestamp) as hour,
            COUNT(*) as requests,
            SUM(CASE WHEN clicked = 1 THEN 1 ELSE 0 END) as clicks,
            SUM(CASE WHEN converted = 1 THEN 1 ELSE 0 END) as conversions,
            AVG(latency_ms) as avg_latency
        FROM recommendation_events
        WHERE
            DATE(timestamp) = %s
            AND model_version = %s
        GROUP BY hour
        ORDER BY hour
        """

        results = self.db.execute(query, (date.date(), model_version))

        return [
            {
                'hour': row['hour'].isoformat(),
                'requests': row['requests'],
                'clicks': row['clicks'],
                'ctr': row['clicks'] / row['requests'] if row['requests'] > 0 else 0,
                'conversions': row['conversions'],
                'avg_latency_ms': float(row['avg_latency'] or 0)
            }
            for row in results
        ]


# FastAPI endpoints
@app.get("/dashboard/summary")
async def dashboard_summary(
    start_date: str,
    end_date: str,
    model_version: str = 'v2'
):
    """Get dashboard summary metrics."""
    dashboard = MetricsDashboard(db_client)

    summary = dashboard.get_summary(
        start_date=datetime.fromisoformat(start_date),
        end_date=datetime.fromisoformat(end_date),
        model_version=model_version
    )

    return summary


@app.get("/dashboard/hourly")
async def dashboard_hourly(date: str, model_version: str = 'v2'):
    """Get hourly metrics for date."""
    dashboard = MetricsDashboard(db_client)

    hourly = dashboard.get_hourly_metrics(
        date=datetime.fromisoformat(date),
        model_version=model_version
    )

    return {'metrics': hourly}
```

## Alert Configuration

### Alert Rules

```python
from typing import Callable, Dict
import logging

logger = logging.getLogger(__name__)


class AlertRule:
    """Define alert threshold and action."""

    def __init__(
        self,
        name: str,
        metric_fn: Callable[[], float],
        threshold: float,
        comparison: str = '>',  # '>', '<', '>=', '<=', '=='
        severity: str = 'warning'  # 'info', 'warning', 'critical'
    ):
        self.name = name
        self.metric_fn = metric_fn
        self.threshold = threshold
        self.comparison = comparison
        self.severity = severity

    def check(self) -> bool:
        """
        Check if alert should trigger.

        Returns:
            True if alert condition met
        """
        current_value = self.metric_fn()

        if self.comparison == '>':
            triggered = current_value > self.threshold
        elif self.comparison == '<':
            triggered = current_value < self.threshold
        elif self.comparison == '>=':
            triggered = current_value >= self.threshold
        elif self.comparison == '<=':
            triggered = current_value <= self.threshold
        elif self.comparison == '==':
            triggered = current_value == self.threshold
        else:
            raise ValueError(f"Unknown comparison: {self.comparison}")

        if triggered:
            logger.warning(
                f"Alert triggered: {self.name} "
                f"(value={current_value:.4f}, threshold={self.threshold})"
            )

        return triggered


class AlertManager:
    """Manage alerts and notifications."""

    def __init__(self, slack_webhook: str = None):
        self.slack_webhook = slack_webhook
        self.rules = []

    def add_rule(self, rule: AlertRule):
        """Add alert rule."""
        self.rules.append(rule)
        logger.info(f"Added alert rule: {rule.name}")

    def check_all(self):
        """Check all alert rules."""
        triggered = []

        for rule in self.rules:
            if rule.check():
                triggered.append(rule)

        if triggered:
            self._send_alerts(triggered)

        return triggered

    def _send_alerts(self, rules: List[AlertRule]):
        """Send alerts for triggered rules."""
        if not self.slack_webhook:
            return

        # Group by severity
        critical = [r for r in rules if r.severity == 'critical']
        warnings = [r for r in rules if r.severity == 'warning']

        message = "🚨 *Recommendation System Alerts*\n\n"

        if critical:
            message += "*Critical:*\n"
            for rule in critical:
                value = rule.metric_fn()
                message += f"• {rule.name}: {value:.4f} (threshold: {rule.threshold})\n"
            message += "\n"

        if warnings:
            message += "*Warnings:*\n"
            for rule in warnings:
                value = rule.metric_fn()
                message += f"• {rule.name}: {value:.4f} (threshold: {rule.threshold})\n"

        # Send to Slack with timeout and error handling
        try:
            response = requests.post(
                self.slack_webhook,
                json={'text': message},
                timeout=5  # Prevent hanging
            )
            response.raise_for_status()  # Raise exception for 4xx/5xx
            logger.info(f"Successfully sent {len(rules)} alerts to Slack")
        except RequestException as e:
            logger.error(f"Failed to send Slack alert: {e}")
            # Don't re-raise - alert system should continue monitoring


# Example alert configuration
alert_manager = AlertManager(slack_webhook=os.getenv('SLACK_WEBHOOK'))

# Alert: CTR drops below 5%
alert_manager.add_rule(AlertRule(
    name='Low CTR',
    metric_fn=lambda: get_current_ctr(),  # Function returning current CTR
    threshold=0.05,
    comparison='<',
    severity='warning'
))

# Alert: P95 latency exceeds 500ms
alert_manager.add_rule(AlertRule(
    name='High Latency',
    metric_fn=lambda: get_p95_latency_ms(),
    threshold=500,
    comparison='>',
    severity='critical'
))

# Alert: Error rate above 1%
alert_manager.add_rule(AlertRule(
    name='High Error Rate',
    metric_fn=lambda: get_error_rate(),
    threshold=0.01,
    comparison='>',
    severity='critical'
))

# Check alerts every 5 minutes
import schedule

schedule.every(5).minutes.do(alert_manager.check_all)

while True:
    schedule.run_pending()
    time.sleep(60)
```

## Quality Monitoring

### Diversity and Coverage Tracking

```python
import numpy as np
from collections import Counter


class QualityMonitor:
    """Monitor recommendation quality metrics."""

    def __init__(self):
        self.recommendations_history = []

    def track_recommendations(
        self,
        user_id: str,
        item_ids: List[str],
        categories: List[str]
    ):
        """Track recommendations for quality analysis."""
        self.recommendations_history.append({
            'user_id': user_id,
            'item_ids': item_ids,
            'categories': categories
        })

    def calculate_diversity(self) -> float:
        """
        Calculate diversity score (0-1).

        Higher = more diverse recommendations.
        Uses entropy of category distribution.
        """
        all_categories = []

        for rec in self.recommendations_history[-1000:]:  # Last 1000
            all_categories.extend(rec['categories'])

        if not all_categories:
            return 0.0

        # Calculate category distribution
        category_counts = Counter(all_categories)
        total = len(all_categories)

        # Entropy
        entropy = 0
        for count in category_counts.values():
            p = count / total
            entropy -= p * np.log2(p)

        # Normalize (max entropy = log2(n_categories))
        max_entropy = np.log2(len(category_counts))
        diversity = entropy / max_entropy if max_entropy > 0 else 0

        return diversity

    def calculate_coverage(self, catalog_size: int) -> float:
        """
        Calculate catalog coverage (0-100).

        % of catalog items recommended.
        """
        recommended_items = set()

        for rec in self.recommendations_history[-10000:]:  # Last 10k
            recommended_items.update(rec['item_ids'])

        coverage = len(recommended_items) / catalog_size * 100

        return coverage


# Track quality metrics in Prometheus
quality_monitor = QualityMonitor()

def update_quality_metrics():
    """Update quality metrics periodically."""
    diversity = quality_monitor.calculate_diversity()
    coverage = quality_monitor.calculate_coverage(catalog_size=100000)

    # Update Prometheus gauges
    recommendation_diversity.labels(model_version='v2').set(diversity)
    catalog_coverage.labels(model_version='v2').set(coverage)

    logger.info(f"Quality metrics: diversity={diversity:.3f}, coverage={coverage:.1f}%")


# Run every hour
schedule.every().hour.do(update_quality_metrics)
```

## Best Practices

1. **Monitor Business Metrics**: CTR, conversion rate, revenue (not just technical)
2. **Set Baseline Alerts**: Alert when metrics deviate significantly from baseline
3. **Track Latency Percentiles**: P95/P99 more important than average
4. **Log Everything**: Comprehensive logging enables debugging
5. **Dashboard for Stakeholders**: Non-technical metrics (CTR, revenue)
6. **A/B Test Monitoring**: Compare variants in real-time
7. **Quality Metrics**: Track diversity and coverage, not just accuracy
8. **Model Staleness**: Alert if model hasn't been updated recently
