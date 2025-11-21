---
name: ml-pipeline-automation
description: Automates ML workflows from data ingestion to deployment using Airflow, Kubeflow, or similar orchestration tools. Use when building reproducible ML pipelines, scheduling retraining jobs, or implementing MLOps practices.
---

# ML Pipeline Automation

Orchestrate ML workflows from data ingestion to production deployment.

## Pipeline Stages

1. Data Collection → 2. Data Prep → 3. Feature Engineering → 4. Training → 5. Evaluation → 6. Deployment → 7. Monitoring

## Airflow Pipeline

```python
from airflow import DAG
from airflow.operators.python import PythonOperator
from datetime import datetime, timedelta

default_args = {
    'owner': 'ml-team',
    'retries': 1,
    'retry_delay': timedelta(minutes=5)
}

dag = DAG(
    'ml_training_pipeline',
    default_args=default_args,
    schedule_interval='@daily',
    start_date=datetime(2025, 1, 1)
)

def ingest_data(**context):
    # Fetch and store raw data
    data = fetch_from_source()
    context['ti'].xcom_push(key='raw_data_path', value=data_path)

def preprocess(**context):
    data_path = context['ti'].xcom_pull(key='raw_data_path')
    processed = clean_and_transform(data_path)
    return processed

def train_model(**context):
    import mlflow
    with mlflow.start_run():
        model = train(data)
        mlflow.sklearn.log_model(model, 'model')
        mlflow.log_metrics({'accuracy': accuracy})

ingest = PythonOperator(task_id='ingest_data', python_callable=ingest_data, dag=dag)
preprocess = PythonOperator(task_id='preprocess', python_callable=preprocess, dag=dag)
train = PythonOperator(task_id='train_model', python_callable=train_model, dag=dag)

ingest >> preprocess >> train
```

## MLflow Tracking

```python
import mlflow

mlflow.set_experiment('my-experiment')

with mlflow.start_run():
    mlflow.log_params({'learning_rate': 0.01, 'epochs': 100})
    mlflow.log_metrics({'accuracy': 0.95, 'f1': 0.93})
    mlflow.sklearn.log_model(model, 'model')
```

## Pipeline Best Practices

- Make tasks idempotent and independent
- Version data and models
- Implement comprehensive error handling
- Track all artifacts with MLflow
- Set up monitoring and alerting

## Orchestration Tools

| Tool | Best For |
|------|----------|
| Airflow | General workflow orchestration |
| Kubeflow | Kubernetes-native ML |
| Prefect | Modern Python workflows |
| Dagster | Asset-oriented pipelines |
