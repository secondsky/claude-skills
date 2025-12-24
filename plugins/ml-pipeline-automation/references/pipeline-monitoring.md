# Pipeline Monitoring and Data Quality

Production monitoring for ML pipelines including data quality checks, drift detection, and alert configuration.

## Data Quality Validation

### Schema Validation

```python
from typing import Dict, List, Optional
import pandas as pd
from dataclasses import dataclass
import logging

logger = logging.getLogger(__name__)


@dataclass
class ColumnSchema:
    """Schema definition for a column."""
    name: str
    dtype: str
    nullable: bool = True
    min_value: Optional[float] = None
    max_value: Optional[float] = None
    allowed_values: Optional[List] = None


class DataValidator:
    """Validate data quality against schema."""

    def __init__(self, schema: List[ColumnSchema]):
        self.schema = {col.name: col for col in schema}

    def validate(self, df: pd.DataFrame) -> tuple[bool, List[str]]:
        """
        Validate DataFrame against schema.

        Returns:
            (is_valid: bool, errors: List[str])
        """
        errors = []

        # Check columns exist
        expected_cols = set(self.schema.keys())
        actual_cols = set(df.columns)

        missing = expected_cols - actual_cols
        extra = actual_cols - expected_cols

        if missing:
            errors.append(f"Missing columns: {missing}")
        if extra:
            errors.append(f"Extra columns: {extra}")

        # Validate each column
        for col_name, col_schema in self.schema.items():
            if col_name not in df.columns:
                continue

            col = df[col_name]

            # Check dtype
            if str(col.dtype) != col_schema.dtype:
                errors.append(
                    f"Column {col_name}: expected dtype {col_schema.dtype}, "
                    f"got {col.dtype}"
                )

            # Check nulls
            null_count = col.isnull().sum()
            if null_count > 0 and not col_schema.nullable:
                errors.append(
                    f"Column {col_name}: contains {null_count} nulls "
                    f"(not nullable)"
                )

            # Check numeric ranges
            if col_schema.min_value is not None:
                if col.min() < col_schema.min_value:
                    errors.append(
                        f"Column {col_name}: min value {col.min()} "
                        f"below {col_schema.min_value}"
                    )

            if col_schema.max_value is not None:
                if col.max() > col_schema.max_value:
                    errors.append(
                        f"Column {col_name}: max value {col.max()} "
                        f"above {col_schema.max_value}"
                    )

            # Check allowed values
            if col_schema.allowed_values is not None:
                invalid = set(col.unique()) - set(col_schema.allowed_values)
                if invalid:
                    errors.append(
                        f"Column {col_name}: invalid values {invalid}"
                    )

        is_valid = len(errors) == 0
        return is_valid, errors


# Example usage
schema = [
    ColumnSchema(name='user_id', dtype='int64', nullable=False),
    ColumnSchema(name='age', dtype='int64', min_value=0, max_value=120),
    ColumnSchema(
        name='status',
        dtype='object',
        allowed_values=['active', 'inactive', 'pending']
    ),
    ColumnSchema(name='score', dtype='float64', min_value=0.0, max_value=1.0),
]

validator = DataValidator(schema)
is_valid, errors = validator.validate(df)

if not is_valid:
    logger.error(f"Data validation failed: {errors}")
    raise ValueError("Data quality check failed")
```

### Statistical Quality Checks

```python
import numpy as np
from scipy import stats


class StatisticalValidator:
    """Statistical data quality checks."""

    def __init__(self, reference_df: pd.DataFrame):
        """
        Args:
            reference_df: Historical data for comparison
        """
        self.reference_df = reference_df
        self.reference_stats = self._compute_stats(reference_df)

    def _compute_stats(self, df: pd.DataFrame) -> Dict:
        """Compute reference statistics."""
        stats_dict = {}

        for col in df.select_dtypes(include=[np.number]).columns:
            stats_dict[col] = {
                'mean': df[col].mean(),
                'std': df[col].std(),
                'min': df[col].min(),
                'max': df[col].max(),
                'median': df[col].median(),
                'q25': df[col].quantile(0.25),
                'q75': df[col].quantile(0.75)
            }

        return stats_dict

    def validate_distribution(
        self,
        df: pd.DataFrame,
        threshold: float = 0.05
    ) -> tuple[bool, Dict]:
        """
        Check if distributions match reference using KS test.

        Args:
            df: New data to validate
            threshold: p-value threshold (default 0.05)

        Returns:
            (is_valid: bool, results: Dict)
        """
        results = {}

        for col in df.select_dtypes(include=[np.number]).columns:
            if col not in self.reference_stats:
                continue

            # Kolmogorov-Smirnov test
            statistic, p_value = stats.ks_2samp(
                self.reference_df[col].dropna(),
                df[col].dropna()
            )

            is_valid = p_value > threshold

            results[col] = {
                'ks_statistic': statistic,
                'p_value': p_value,
                'is_valid': is_valid,
                'reference_mean': self.reference_stats[col]['mean'],
                'current_mean': df[col].mean(),
                'mean_shift': abs(df[col].mean() - self.reference_stats[col]['mean'])
            }

        overall_valid = all(r['is_valid'] for r in results.values())
        return overall_valid, results

    def check_outliers(
        self,
        df: pd.DataFrame,
        max_outlier_pct: float = 0.05
    ) -> tuple[bool, Dict]:
        """
        Check for excessive outliers using IQR method.

        Args:
            df: Data to check
            max_outlier_pct: Max percentage of outliers allowed

        Returns:
            (is_valid: bool, outlier_info: Dict)
        """
        outlier_info = {}

        for col in df.select_dtypes(include=[np.number]).columns:
            Q1 = df[col].quantile(0.25)
            Q3 = df[col].quantile(0.75)
            IQR = Q3 - Q1

            lower_bound = Q1 - 1.5 * IQR
            upper_bound = Q3 + 1.5 * IQR

            outliers = ((df[col] < lower_bound) | (df[col] > upper_bound)).sum()
            outlier_pct = outliers / len(df)

            outlier_info[col] = {
                'outlier_count': outliers,
                'outlier_pct': outlier_pct,
                'is_valid': outlier_pct <= max_outlier_pct,
                'bounds': (lower_bound, upper_bound)
            }

        overall_valid = all(info['is_valid'] for info in outlier_info.values())
        return overall_valid, outlier_info
```

## Data Drift Detection

### Distribution Drift Monitor

```python
from typing import Callable
import json
from datetime import datetime


class DriftMonitor:
    """Monitor data drift over time."""

    def __init__(
        self,
        reference_data: pd.DataFrame,
        alert_callback: Optional[Callable] = None,
        drift_threshold: float = 0.1
    ):
        self.reference_data = reference_data
        self.alert_callback = alert_callback
        self.drift_threshold = drift_threshold
        self.drift_history = []

    def detect_drift(self, current_data: pd.DataFrame) -> Dict:
        """
        Detect drift in current data.

        Returns:
            Dictionary with drift scores and alerts
        """
        drift_scores = {}
        alerts = []

        # Numerical features
        for col in current_data.select_dtypes(include=[np.number]).columns:
            if col not in self.reference_data.columns:
                continue

            # KS test
            statistic, p_value = stats.ks_2samp(
                self.reference_data[col].dropna(),
                current_data[col].dropna()
            )

            drift_scores[col] = {
                'ks_statistic': statistic,
                'p_value': p_value,
                'drifted': statistic > self.drift_threshold
            }

            if statistic > self.drift_threshold:
                alerts.append({
                    'column': col,
                    'type': 'distribution_drift',
                    'severity': 'high' if statistic > 0.2 else 'medium',
                    'score': statistic,
                    'timestamp': datetime.now().isoformat()
                })

        # Categorical features
        for col in current_data.select_dtypes(include=['object', 'category']).columns:
            if col not in self.reference_data.columns:
                continue

            ref_dist = self.reference_data[col].value_counts(normalize=True)
            curr_dist = current_data[col].value_counts(normalize=True)

            # Chi-squared test
            try:
                chi2, p_value = stats.chisquare(
                    curr_dist.reindex(ref_dist.index, fill_value=0),
                    ref_dist
                )

                drift_scores[col] = {
                    'chi2_statistic': chi2,
                    'p_value': p_value,
                    'drifted': p_value < 0.05
                }

                if p_value < 0.05:
                    alerts.append({
                        'column': col,
                        'type': 'categorical_drift',
                        'severity': 'high' if p_value < 0.01 else 'medium',
                        'chi2': chi2,
                        'timestamp': datetime.now().isoformat()
                    })
            except ValueError as e:
                logger.warning(f"Chi-squared test failed for {col}: {e}")

        # Store drift history
        self.drift_history.append({
            'timestamp': datetime.now().isoformat(),
            'drift_scores': drift_scores,
            'num_alerts': len(alerts)
        })

        # Trigger alerts
        if alerts and self.alert_callback:
            self.alert_callback(alerts)

        return {
            'drift_detected': len(alerts) > 0,
            'drift_scores': drift_scores,
            'alerts': alerts
        }
```

## Alert Configuration

### Alert Manager

```python
import requests
from typing import List, Dict
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart


class AlertManager:
    """Send alerts for pipeline failures and drift."""

    def __init__(
        self,
        slack_webhook: Optional[str] = None,
        email_config: Optional[Dict] = None
    ):
        self.slack_webhook = slack_webhook
        self.email_config = email_config

    def send_alert(
        self,
        title: str,
        message: str,
        severity: str = 'info',
        details: Optional[Dict] = None
    ):
        """Send alert through configured channels."""

        # Format alert
        alert = {
            'title': title,
            'message': message,
            'severity': severity,
            'timestamp': datetime.now().isoformat(),
            'details': details or {}
        }

        # Send to Slack
        if self.slack_webhook:
            self._send_slack_alert(alert)

        # Send email
        if self.email_config:
            self._send_email_alert(alert)

        # Log
        logger.warning(f"Alert: {title} - {message}")

    def _send_slack_alert(self, alert: Dict):
        """Send alert to Slack."""
        emoji = {
            'critical': ':rotating_light:',
            'high': ':warning:',
            'medium': ':exclamation:',
            'low': ':information_source:',
            'info': ':mega:'
        }.get(alert['severity'], ':mega:')

        message = {
            'text': f"{emoji} *{alert['title']}*",
            'blocks': [
                {
                    'type': 'section',
                    'text': {
                        'type': 'mrkdwn',
                        'text': f"{emoji} *{alert['title']}*\n{alert['message']}"
                    }
                },
                {
                    'type': 'context',
                    'elements': [
                        {
                            'type': 'mrkdwn',
                            'text': f"Severity: `{alert['severity']}` | Time: {alert['timestamp']}"
                        }
                    ]
                }
            ]
        }

        if alert['details']:
            message['blocks'].append({
                'type': 'section',
                'text': {
                    'type': 'mrkdwn',
                    'text': f"```{json.dumps(alert['details'], indent=2)}```"
                }
            })

        try:
            response = requests.post(
                self.slack_webhook,
                json=message,
                timeout=10
            )
            response.raise_for_status()
        except Exception as e:
            logger.error(f"Failed to send Slack alert: {e}")

    def _send_email_alert(self, alert: Dict):
        """Send alert via email."""
        msg = MIMEMultipart()
        msg['From'] = self.email_config['from']
        msg['To'] = ', '.join(self.email_config['to'])
        msg['Subject'] = f"[{alert['severity'].upper()}] {alert['title']}"

        body = f"""
        Alert: {alert['title']}
        Severity: {alert['severity']}
        Time: {alert['timestamp']}

        {alert['message']}

        Details:
        {json.dumps(alert['details'], indent=2)}
        """

        msg.attach(MIMEText(body, 'plain'))

        try:
            with smtplib.SMTP(
                self.email_config['smtp_host'],
                self.email_config['smtp_port']
            ) as server:
                server.starttls()
                server.login(
                    self.email_config['username'],
                    self.email_config['password']
                )
                server.send_message(msg)
        except Exception as e:
            logger.error(f"Failed to send email alert: {e}")

    def send_drift_alert(self, drift_results: Dict):
        """Send drift detection alert."""
        alerts = drift_results.get('alerts', [])

        if not alerts:
            return

        # Group by severity
        critical = [a for a in alerts if a['severity'] == 'critical']
        high = [a for a in alerts if a['severity'] == 'high']
        medium = [a for a in alerts if a['severity'] == 'medium']

        message = f"Data drift detected in {len(alerts)} features\n"
        if critical:
            message += f"- Critical: {len(critical)}\n"
        if high:
            message += f"- High: {len(high)}\n"
        if medium:
            message += f"- Medium: {len(medium)}\n"

        self.send_alert(
            title='Data Drift Detected',
            message=message,
            severity='high' if (critical or high) else 'medium',
            details=drift_results
        )
```

## Pipeline Health Monitoring

### Pipeline Metrics Tracker

```python
from prometheus_client import Counter, Histogram, Gauge, generate_latest
from flask import Flask, Response

app = Flask(__name__)

# Metrics
pipeline_runs = Counter(
    'pipeline_runs_total',
    'Total pipeline runs',
    ['pipeline_name', 'status']
)

pipeline_duration = Histogram(
    'pipeline_duration_seconds',
    'Pipeline execution time',
    ['pipeline_name'],
    buckets=[60, 300, 600, 1800, 3600, 7200]  # 1min to 2 hours
)

data_quality_score = Gauge(
    'data_quality_score',
    'Data quality score (0-1)',
    ['pipeline_name']
)

drift_score = Gauge(
    'drift_score',
    'Data drift score',
    ['pipeline_name', 'feature']
)


class PipelineMetrics:
    """Track pipeline metrics."""

    @staticmethod
    def record_run(pipeline_name: str, status: str, duration: float):
        """Record pipeline run."""
        pipeline_runs.labels(
            pipeline_name=pipeline_name,
            status=status
        ).inc()

        pipeline_duration.labels(
            pipeline_name=pipeline_name
        ).observe(duration)

    @staticmethod
    def record_quality(pipeline_name: str, score: float):
        """Record data quality score."""
        data_quality_score.labels(
            pipeline_name=pipeline_name
        ).set(score)

    @staticmethod
    def record_drift(pipeline_name: str, feature: str, score: float):
        """Record drift score."""
        drift_score.labels(
            pipeline_name=pipeline_name,
            feature=feature
        ).set(score)


@app.route('/metrics')
def metrics():
    """Expose Prometheus metrics."""
    return Response(generate_latest(), mimetype='text/plain')


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=9090)
```

## Airflow Integration

### Data Quality Airflow Operator

```python
from airflow.models import BaseOperator
from airflow.utils.decorators import apply_defaults


class DataQualityOperator(BaseOperator):
    """Airflow operator for data quality checks."""

    @apply_defaults
    def __init__(
        self,
        data_path: str,
        schema: List[ColumnSchema],
        drift_threshold: float = 0.1,
        reference_data_path: Optional[str] = None,
        *args,
        **kwargs
    ):
        super().__init__(*args, **kwargs)
        self.data_path = data_path
        self.schema = schema
        self.drift_threshold = drift_threshold
        self.reference_data_path = reference_data_path

    def execute(self, context):
        """Execute data quality checks."""
        import pandas as pd

        # Load data
        df = pd.read_csv(self.data_path)

        # Schema validation
        validator = DataValidator(self.schema)
        is_valid, errors = validator.validate(df)

        if not is_valid:
            raise ValueError(f"Schema validation failed: {errors}")

        # Statistical validation
        if self.reference_data_path:
            reference_df = pd.read_csv(self.reference_data_path)
            stat_validator = StatisticalValidator(reference_df)

            dist_valid, dist_results = stat_validator.validate_distribution(df)
            if not dist_valid:
                self.log.warning(f"Distribution drift detected: {dist_results}")

            outlier_valid, outlier_info = stat_validator.check_outliers(df)
            if not outlier_valid:
                self.log.warning(f"Excessive outliers: {outlier_info}")

        self.log.info("Data quality checks passed")
        return True
```

## Best Practices

1. **Comprehensive Validation**: Check schema, statistics, and distributions
2. **Automated Alerts**: Configure alerts for critical issues
3. **Track History**: Store validation results for trend analysis
4. **Gradual Rollout**: Don't fail pipelines on first drift detection
5. **Actionable Metrics**: Track metrics that drive decisions
6. **Alert Fatigue**: Set appropriate thresholds to avoid noise
7. **Documentation**: Document all quality checks and thresholds
