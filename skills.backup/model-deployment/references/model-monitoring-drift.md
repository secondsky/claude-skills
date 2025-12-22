# Model Monitoring and Drift Detection

Complete implementation of model monitoring, drift detection, and alerting for production ML systems.

## Overview

Model performance degrades over time due to:
- **Data drift**: Input distribution changes
- **Concept drift**: Relationship between features and target changes
- **Model staleness**: Training data becomes outdated

Monitoring detects these issues before they impact users.

## Complete Monitoring System

```python
from typing import Dict, List, Optional, Tuple
import numpy as np
from scipy import stats
from scipy.spatial.distance import jensenshannon
from datetime import datetime, timedelta
from collections import deque
import logging
import json

logger = logging.getLogger(__name__)


class ModelMonitor:
    """
    Production model monitoring with drift detection.

    Tracks predictions, inputs, latency, and detects distribution shifts.
    """

    def __init__(
        self,
        reference_data: np.ndarray,
        reference_predictions: Optional[np.ndarray] = None,
        window_size: int = 1000,
        drift_threshold: float = 0.1
    ):
        """
        Args:
            reference_data: Training/baseline feature matrix (n_samples, n_features)
            reference_predictions: Optional array of predictions on reference_data.
                                  Required for prediction drift detection.
                                  Should be 1D array of scalar predictions.
            window_size: Number of recent predictions to track
            drift_threshold: Threshold for drift detection (0-1)
        """
        self.reference_data = reference_data
        self.reference_predictions = reference_predictions
        self.window_size = window_size
        self.drift_threshold = drift_threshold

        # Rolling windows for monitoring
        self.predictions = deque(maxlen=window_size)
        self.inputs = deque(maxlen=window_size)
        self.latencies = deque(maxlen=window_size)
        self.timestamps = deque(maxlen=window_size)
        self.errors = deque(maxlen=window_size)

        # Statistics
        self.total_predictions = 0
        self.drift_detections = 0

    def log_prediction(
        self,
        input_features: np.ndarray,
        prediction: float,
        latency_ms: float,
        actual: Optional[float] = None
    ):
        """
        Log a prediction with monitoring data.

        Args:
            input_features: Input feature vector
            prediction: Model prediction
            latency_ms: Prediction latency
            actual: Actual label (if available for validation)
        """
        self.inputs.append(input_features)
        self.predictions.append(prediction)
        self.latencies.append(latency_ms)
        self.timestamps.append(datetime.now())

        if actual is not None:
            error = abs(prediction - actual)
            self.errors.append(error)

        self.total_predictions += 1

        # Check for drift periodically
        if self.total_predictions % 100 == 0:
            drift_detected, drift_score = self.detect_drift()
            if drift_detected:
                self.drift_detections += 1
                logger.warning(
                    f"Drift detected! Score: {drift_score:.4f} "
                    f"(threshold: {self.drift_threshold})"
                )

    def detect_drift(self) -> Tuple[bool, float]:
        """
        Detect input distribution drift using KS test.

        Returns:
            (drift_detected: bool, drift_score: float)
        """
        if len(self.inputs) < 100:
            return False, 0.0

        current_data = np.array(list(self.inputs))

        # Kolmogorov-Smirnov test per feature
        drift_scores = []
        for i in range(current_data.shape[1]):
            ref_feature = self.reference_data[:, i]
            curr_feature = current_data[:, i]

            # KS test
            statistic, p_value = stats.ks_2samp(ref_feature, curr_feature)
            drift_scores.append(statistic)

        # Max drift across all features
        max_drift = max(drift_scores)
        drift_detected = max_drift > self.drift_threshold

        return drift_detected, max_drift

    def detect_prediction_drift(self) -> Tuple[bool, float]:
        """
        Detect drift in prediction distribution.

        Returns:
            (drift_detected: bool, divergence: float)
        """
        if len(self.predictions) < 100:
            return False, 0.0

        # Check if reference predictions are available
        if self.reference_predictions is None:
            logger.warning(
                "No reference predictions provided. Cannot detect prediction drift. "
                "Pass reference_predictions to __init__ to enable this feature."
            )
            return False, 0.0

        # Create histograms from prediction distributions
        ref_hist, bins = np.histogram(
            self.reference_predictions,  # Fixed: Use reference predictions, not row means
            bins=20,
            density=True
        )
        curr_hist, _ = np.histogram(
            list(self.predictions),
            bins=bins,
            density=True
        )

        # Jensen-Shannon divergence
        divergence = jensenshannon(ref_hist + 1e-10, curr_hist + 1e-10)

        drift_detected = divergence > self.drift_threshold
        return drift_detected, float(divergence)

    def get_metrics(self) -> Dict:
        """
        Get current monitoring metrics.

        Returns:
            Dictionary of metrics
        """
        metrics = {
            "total_predictions": self.total_predictions,
            "drift_detections": self.drift_detections,
            "window_size": len(self.predictions),
        }

        if self.latencies:
            metrics["latency_p50_ms"] = np.percentile(list(self.latencies), 50)
            metrics["latency_p95_ms"] = np.percentile(list(self.latencies), 95)
            metrics["latency_p99_ms"] = np.percentile(list(self.latencies), 99)

        if self.predictions:
            metrics["prediction_mean"] = np.mean(list(self.predictions))
            metrics["prediction_std"] = np.std(list(self.predictions))

        if self.errors:
            metrics["mae"] = np.mean(list(self.errors))
            metrics["rmse"] = np.sqrt(np.mean([e**2 for e in self.errors]))

        # Drift scores
        drift_detected, drift_score = self.detect_drift()
        metrics["input_drift_detected"] = drift_detected
        metrics["input_drift_score"] = drift_score

        pred_drift, pred_divergence = self.detect_prediction_drift()
        metrics["prediction_drift_detected"] = pred_drift
        metrics["prediction_divergence"] = pred_divergence

        return metrics

    def should_retrain(self) -> bool:
        """
        Decide if model should be retrained based on metrics.

        Returns:
            True if retraining recommended
        """
        metrics = self.get_metrics()

        # Retrain if:
        # 1. Input drift detected
        # 2. Prediction drift detected
        # 3. Error rate above threshold (if available)

        if metrics.get("input_drift_detected", False):
            logger.info("Retraining recommended: Input drift detected")
            return True

        if metrics.get("prediction_drift_detected", False):
            logger.info("Retraining recommended: Prediction drift detected")
            return True

        if "mae" in metrics and metrics["mae"] > 0.5:  # Threshold depends on use case
            logger.info(f"Retraining recommended: High MAE ({metrics['mae']:.3f})")
            return True

        return False


## Prometheus Metrics Integration

```python
from prometheus_client import Counter, Histogram, Gauge, generate_latest

# Define metrics
prediction_counter = Counter(
    'model_predictions_total',
    'Total number of predictions',
    ['model_version', 'status']
)

prediction_latency = Histogram(
    'model_prediction_latency_seconds',
    'Prediction latency in seconds',
    ['model_version'],
    buckets=[0.01, 0.05, 0.1, 0.5, 1.0, 5.0]
)

drift_score = Gauge(
    'model_drift_score',
    'Current drift score',
    ['drift_type']  # 'input' or 'prediction'
)

error_rate = Gauge(
    'model_error_rate',
    'Model error rate'
)


def record_prediction(
    model_version: str,
    latency: float,
    success: bool
):
    """Record prediction in Prometheus."""
    status = 'success' if success else 'failure'
    prediction_counter.labels(
        model_version=model_version,
        status=status
    ).inc()

    prediction_latency.labels(
        model_version=model_version
    ).observe(latency)


@app.get("/metrics")
async def metrics():
    """Prometheus metrics endpoint."""
    return Response(generate_latest(), media_type="text/plain")
```

## Alert Configuration

```python
class AlertManager:
    """
    Manage alerts for model degradation.
    """

    def __init__(
        self,
        slack_webhook: Optional[str] = None,
        email_config: Optional[Dict] = None
    ):
        self.slack_webhook = slack_webhook
        self.email_config = email_config

    def send_drift_alert(
        self,
        drift_type: str,
        drift_score: float,
        metrics: Dict
    ):
        """Send alert when drift detected."""
        message = f"""
        🚨 Model Drift Alert

        Type: {drift_type}
        Score: {drift_score:.4f}

        Current Metrics:
        - Total Predictions: {metrics['total_predictions']}
        - Latency P95: {metrics.get('latency_p95_ms', 'N/A')} ms
        - MAE: {metrics.get('mae', 'N/A')}

        Action: Consider retraining model
        """

        if self.slack_webhook:
            self._send_slack(message)

        logger.critical(message)

    def _send_slack(self, message: str):
        """Send message to Slack."""
        import requests
        requests.post(
            self.slack_webhook,
            json={"text": message}
        )
```

## Continuous Monitoring Pipeline

```python
import asyncio

class ContinuousMonitor:
    """
    Background monitoring service.
    """

    def __init__(
        self,
        monitor: ModelMonitor,
        alert_manager: AlertManager,
        check_interval_seconds: int = 300  # 5 minutes
    ):
        self.monitor = monitor
        self.alert_manager = alert_manager
        self.check_interval = check_interval_seconds
        self.running = False

    async def start(self):
        """Start continuous monitoring."""
        self.running = True
        logger.info("Starting continuous monitoring")

        while self.running:
            try:
                # Get current metrics
                metrics = self.monitor.get_metrics()

                # Check for drift
                if metrics.get("input_drift_detected"):
                    self.alert_manager.send_drift_alert(
                        "Input Distribution Drift",
                        metrics["input_drift_score"],
                        metrics
                    )

                if metrics.get("prediction_drift_detected"):
                    self.alert_manager.send_drift_alert(
                        "Prediction Distribution Drift",
                        metrics["prediction_divergence"],
                        metrics
                    )

                # Update Prometheus gauges
                drift_score.labels(drift_type='input').set(
                    metrics["input_drift_score"]
                )
                drift_score.labels(drift_type='prediction').set(
                    metrics["prediction_divergence"]
                )

                if "mae" in metrics:
                    error_rate.set(metrics["mae"])

                # Log metrics
                logger.info(f"Monitoring check: {json.dumps(metrics, indent=2)}")

            except Exception as e:
                logger.error(f"Monitoring error: {e}", exc_info=True)

            # Wait before next check
            await asyncio.sleep(self.check_interval)

    def stop(self):
        """Stop monitoring."""
        self.running = False
        logger.info("Stopping continuous monitoring")


# Start monitoring on FastAPI startup
monitor = ModelMonitor(reference_data=training_data)
alert_manager = AlertManager(slack_webhook=os.getenv("SLACK_WEBHOOK"))
continuous_monitor = ContinuousMonitor(monitor, alert_manager)

@app.on_event("startup")
async def start_monitoring():
    asyncio.create_task(continuous_monitor.start())

@app.on_event("shutdown")
async def stop_monitoring():
    continuous_monitor.stop()
```

## Dashboard Integration

```python
# Endpoint for monitoring dashboard
@app.get("/monitoring/metrics")
async def get_monitoring_metrics():
    """Get current monitoring metrics for dashboard."""
    metrics = monitor.get_metrics()

    return {
        "metrics": metrics,
        "should_retrain": monitor.should_retrain(),
        "last_updated": datetime.now(),
        "window_info": {
            "size": len(monitor.predictions),
            "max_size": monitor.window_size,
            "oldest_timestamp": monitor.timestamps[0] if monitor.timestamps else None,
            "newest_timestamp": monitor.timestamps[-1] if monitor.timestamps else None
        }
    }


@app.get("/monitoring/drift-history")
async def get_drift_history():
    """Get historical drift scores."""
    # This would query from time-series database in production
    return {
        "input_drift": list(monitor.inputs),
        "prediction_drift": list(monitor.predictions),
        "timestamps": [ts.isoformat() for ts in monitor.timestamps]
    }
```

## Best Practices

1. **Set appropriate thresholds** based on your use case (0.05-0.2 typically)
2. **Monitor multiple metrics** (inputs, predictions, errors, latency)
3. **Use time-series database** (Prometheus, InfluxDB) for long-term storage
4. **Implement gradual rollback** when drift detected
5. **Log all predictions** for future analysis
6. **Test drift detection** on historical data before deploying
