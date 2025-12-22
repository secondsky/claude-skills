# Airflow DAG Patterns for ML Pipelines

Production-ready Airflow patterns for ML workflows with error handling, retries, sensors, and dynamic DAG generation.

## Complete ML Training DAG

```python
from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.operators.bash import BashOperator
from airflow.sensors.filesystem import FileSensor
from airflow.utils.task_group import TaskGroup
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

# Default arguments with retry logic
default_args = {
    'owner': 'ml-team',
    'depends_on_past': False,
    'email': ['alerts@example.com'],
    'email_on_failure': True,
    'email_on_retry': False,
    'retries': 2,
    'retry_delay': timedelta(minutes=5),
    'retry_exponential_backoff': True,
    'max_retry_delay': timedelta(minutes=30)
}

dag = DAG(
    'ml_training_pipeline',
    default_args=default_args,
    description='Complete ML training pipeline',
    schedule_interval='0 2 * * *',  # Daily at 2 AM
    start_date=datetime(2025, 1, 1),
    catchup=False,  # Don't backfill
    max_active_runs=1,  # One run at a time
    tags=['ml', 'training']
)

# Task 1: Data Validation
def validate_data(**context):
    """Validate input data quality."""
    from datetime import date
    import pandas as pd

    execution_date = context['ds']
    data_path = f"/data/raw/{execution_date}.csv"

    try:
        df = pd.read_csv(data_path)

        # Validation checks
        assert len(df) > 1000, f"Insufficient data: {len(df)} rows"
        assert df.isnull().sum().sum() < len(df) * 0.1, "Too many nulls"

        # Push metadata to XCom
        context['ti'].xcom_push(key='row_count', value=len(df))
        context['ti'].xcom_push(key='data_path', value=data_path)

        logger.info(f"Data validation passed: {len(df)} rows")

    except Exception as e:
        logger.error(f"Data validation failed: {e}")
        raise

validate = PythonOperator(
    task_id='validate_data',
    python_callable=validate_data,
    dag=dag
)

# Task 2: Feature Engineering
def engineer_features(**context):
    """Create features from raw data."""
    import pandas as pd
    import numpy as np
    from sklearn.preprocessing import StandardScaler

    data_path = context['ti'].xcom_pull(key='data_path', task_ids='validate_data')
    df = pd.read_csv(data_path)

    # Feature engineering
    df['feature_ratio'] = df['feature_a'] / (df['feature_b'] + 1e-6)
    df['feature_log'] = np.log1p(df['feature_c'])

    # Save processed data
    processed_path = data_path.replace('raw', 'processed')
    df.to_csv(processed_path, index=False)

    context['ti'].xcom_push(key='processed_path', value=processed_path)
    logger.info(f"Feature engineering complete: {processed_path}")

features = PythonOperator(
    task_id='engineer_features',
    python_callable=engineer_features,
    dag=dag
)

# Task Group: Model Training
with TaskGroup('train_models', dag=dag) as train_group:

    def train_model(model_type, **context):
        """Train a specific model type."""
        import mlflow
        import pandas as pd
        from sklearn.ensemble import RandomForestClassifier
        from sklearn.linear_model import LogisticRegression
        import joblib

        processed_path = context['ti'].xcom_pull(
            key='processed_path',
            task_ids='engineer_features'
        )

        df = pd.read_csv(processed_path)
        X = df.drop('target', axis=1)
        y = df['target']

        # Select model
        if model_type == 'rf':
            model = RandomForestClassifier(n_estimators=100)
        elif model_type == 'lr':
            model = LogisticRegression()

        # Train with MLflow tracking
        mlflow.set_experiment('ml_pipeline')

        with mlflow.start_run(run_name=f"{model_type}_{context['ds']}"):
            model.fit(X, y)

            # Log metrics
            accuracy = model.score(X, y)
            mlflow.log_metric('accuracy', accuracy)
            mlflow.log_param('model_type', model_type)

            # Save model
            model_path = f"/models/{model_type}_{context['ds']}.pkl"
            joblib.dump(model, model_path)
            mlflow.log_artifact(model_path)

            # Save run_id to XCom for deployment
            run_id = mlflow.active_run().info.run_id
            context['ti'].xcom_push(key=f'{model_type}_run_id', value=run_id)

            context['ti'].xcom_push(key=f'{model_type}_accuracy', value=accuracy)
            logger.info(f"{model_type} trained: accuracy={accuracy:.4f}")

    train_rf = PythonOperator(
        task_id='train_random_forest',
        python_callable=lambda **ctx: train_model('rf', **ctx),
        dag=dag
    )

    train_lr = PythonOperator(
        task_id='train_logistic_regression',
        python_callable=lambda **ctx: train_model('lr', **ctx),
        dag=dag
    )

# Task: Model Selection
def select_best_model(**context):
    """Select best performing model."""
    rf_acc = context['ti'].xcom_pull(
        key='rf_accuracy',
        task_ids='train_models.train_random_forest'
    )
    lr_acc = context['ti'].xcom_pull(
        key='lr_accuracy',
        task_ids='train_models.train_logistic_regression'
    )

    best_model = 'rf' if rf_acc > lr_acc else 'lr'
    best_acc = max(rf_acc, lr_acc)

    context['ti'].xcom_push(key='best_model', value=best_model)
    context['ti'].xcom_push(key='best_accuracy', value=best_acc)

    logger.info(f"Best model: {best_model} (accuracy={best_acc:.4f})")

    # Fail if accuracy too low
    if best_acc < 0.8:
        raise ValueError(f"Best accuracy {best_acc:.4f} below threshold 0.8")

select = PythonOperator(
    task_id='select_best_model',
    python_callable=select_best_model,
    dag=dag
)

# Task: Deploy Model
def deploy_model(**context):
    """Deploy best model to production."""
    best_model = context['ti'].xcom_pull(key='best_model', task_ids='select_best_model')
    model_path = f"/models/{best_model}_{context['ds']}.pkl"

    # Copy to production location
    import shutil
    shutil.copy(model_path, "/production/model.pkl")

    # Get run_id from best model's training task
    best_model_type = context['ti'].xcom_pull(key='best_model', task_ids='select_best_model')

    # Determine task_id based on model type
    if best_model_type == 'rf':
        train_task_id = 'train_models.train_random_forest'
    else:  # lr
        train_task_id = 'train_models.train_logistic_regression'

    run_id = context['ti'].xcom_pull(
        key=f'{best_model_type}_run_id',
        task_ids=train_task_id
    )

    # Update model registry with actual run_id
    import mlflow
    mlflow.register_model(f"runs:/{run_id}/model", "production-model")

    logger.info(f"Deployed {best_model} to production")

deploy = PythonOperator(
    task_id='deploy_model',
    python_callable=deploy_model,
    dag=dag
)

# Define dependencies
validate >> features >> train_group >> select >> deploy
```

## Dynamic DAG Generation

```python
# dags/dynamic_training.py
from airflow import DAG
from airflow.operators.python import PythonOperator
from datetime import datetime

# Configuration for multiple models
MODELS_CONFIG = {
    'fraud_detection': {
        'data_source': 's3://data/fraud/',
        'features': ['amount', 'merchant', 'time'],
        'schedule': '0 3 * * *'
    },
    'churn_prediction': {
        'data_source': 's3://data/churn/',
        'features': ['usage', 'tenure', 'support_calls'],
        'schedule': '0 4 * * *'
    }
}

def create_training_dag(model_name, config):
    """Generate DAG for a specific model."""

    dag = DAG(
        f'train_{model_name}',
        schedule_interval=config['schedule'],
        start_date=datetime(2025, 1, 1),
        catchup=False,
        tags=['ml', model_name]
    )

    def train(**context):
        logger.info(f"Training {model_name} with {config['features']}")
        # Training logic here

    train_task = PythonOperator(
        task_id='train',
        python_callable=train,
        dag=dag
    )

    return dag

# Generate DAG for each model
for model_name, config in MODELS_CONFIG.items():
    globals()[f'train_{model_name}'] = create_training_dag(model_name, config)
```

## Error Handling and Retries

```python
from airflow.exceptions import AirflowException
from airflow.utils.email import send_email

def task_with_retry(**context):
    """Task with custom retry logic."""
    try:
        # Task logic
        result = risky_operation()

    except TemporaryError as e:
        # Retry for temporary errors
        logger.warning(f"Temporary error, will retry: {e}")
        raise AirflowException("Retrying due to temporary error")

    except PermanentError as e:
        # Don't retry permanent errors
        logger.error(f"Permanent error: {e}")
        send_alert_email(str(e))
        raise AirflowException("Permanent failure") from e

def on_failure_callback(context):
    """Custom failure handling."""
    ti = context['task_instance']

    send_email(
        to=['ml-team@example.com'],
        subject=f"Task Failed: {ti.task_id}",
        html_content=f"""
        <h3>Task Failure</h3>
        <p>Task: {ti.task_id}</p>
        <p>DAG: {ti.dag_id}</p>
        <p>Execution Date: {context['ds']}</p>
        <p>Error: {context.get('exception')}</p>
        """
    )

task = PythonOperator(
    task_id='risky_task',
    python_callable=task_with_retry,
    on_failure_callback=on_failure_callback,
    dag=dag
)
```

## Sensors for Data Availability

```python
from airflow.sensors.filesystem import FileSensor
from airflow.sensors.python import PythonSensor
from airflow.sensors.external_task import ExternalTaskSensor

# Wait for file to appear
wait_for_data = FileSensor(
    task_id='wait_for_data_file',
    filepath='/data/input/{{ ds }}.csv',
    poke_interval=60,  # Check every 60 seconds
    timeout=3600,  # Timeout after 1 hour
    mode='reschedule',  # Don't block worker slot
    dag=dag
)

# Wait for upstream DAG
wait_for_upstream = ExternalTaskSensor(
    task_id='wait_for_data_pipeline',
    external_dag_id='data_ingestion',
    external_task_id='export_data',
    execution_delta=timedelta(hours=1),
    dag=dag
)

# Custom condition sensor
def check_data_quality():
    """Check if data meets quality threshold."""
    import pandas as pd
    df = pd.read_csv('/data/latest.csv')
    return len(df) > 1000 and df.isnull().sum().sum() == 0

quality_sensor = PythonSensor(
    task_id='check_data_quality',
    python_callable=check_data_quality,
    poke_interval=300,
    timeout=7200,
    dag=dag
)
```

## Best Practices

1. **Idempotency**: Tasks should produce same result when re-run
2. **XCom for small data only**: Use external storage (S3, DB) for large data
3. **Task timeouts**: Set reasonable execution_timeout
4. **Connection pooling**: Reuse database connections
5. **Monitoring**: Use Airflow UI, logs, and custom metrics
