# Kubeflow Pipelines and MLflow Integration

Production patterns for Kubeflow Pipelines (KFP) orchestration and MLflow experiment tracking in ML pipelines.

## Kubeflow Pipelines Components

### Component Creation Pattern

```python
from kfp import dsl
from kfp.dsl import component, Input, Output, Dataset, Model, Metrics
from typing import NamedTuple

@component(
    base_image='python:3.11',
    packages_to_install=['pandas==2.1.0', 'scikit-learn==1.3.0']
)
def load_data(
    data_path: str,
    output_dataset: Output[Dataset]
):
    """Load and validate dataset."""
    import pandas as pd
    import logging

    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)

    try:
        # Load data
        df = pd.read_csv(data_path)

        # Validation
        assert len(df) > 100, f"Insufficient data: {len(df)} rows"
        assert df.isnull().sum().sum() < len(df) * 0.1, "Too many nulls"

        # Save output
        df.to_csv(output_dataset.path, index=False)

        logger.info(f"Loaded {len(df)} rows, {len(df.columns)} columns")

    except Exception as e:
        logger.error(f"Data loading failed: {e}")
        raise


@component(
    base_image='python:3.11',
    packages_to_install=['pandas==2.1.0', 'scikit-learn==1.3.0', 'numpy==1.24.0']
)
def preprocess_data(
    input_dataset: Input[Dataset],
    output_dataset: Output[Dataset],
    train_split: float = 0.8
) -> NamedTuple('Outputs', [('num_train', int), ('num_test', int)]):
    """Preprocess and split data."""
    import pandas as pd
    import numpy as np
    from sklearn.model_selection import train_test_split
    from sklearn.preprocessing import StandardScaler
    import logging
    from collections import namedtuple

    logger = logging.getLogger(__name__)

    # Load data
    df = pd.read_csv(input_dataset.path)

    # Feature engineering
    df['feature_ratio'] = df['feature_a'] / (df['feature_b'] + 1e-6)
    df['feature_log'] = np.log1p(df['feature_c'])

    # Split
    X = df.drop('target', axis=1)
    y = df['target']

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, train_size=train_split, random_state=42
    )

    # Scale features
    scaler = StandardScaler()
    X_train = scaler.fit_transform(X_train)
    X_test = scaler.transform(X_test)

    # Save processed data
    train_df = pd.DataFrame(X_train)
    train_df['target'] = y_train.values

    test_df = pd.DataFrame(X_test)
    test_df['target'] = y_test.values

    combined = pd.concat([train_df, test_df])
    combined.to_csv(output_dataset.path, index=False)

    logger.info(f"Train: {len(train_df)}, Test: {len(test_df)}")

    outputs = namedtuple('Outputs', ['num_train', 'num_test'])
    return outputs(len(train_df), len(test_df))


@component(
    base_image='python:3.11',
    packages_to_install=[
        'pandas==2.1.0',
        'scikit-learn==1.3.0',
        'mlflow==2.8.0',
        'joblib==1.3.0'
    ]
)
def train_model(
    input_dataset: Input[Dataset],
    output_model: Output[Model],
    output_metrics: Output[Metrics],
    model_type: str = 'random_forest',
    n_estimators: int = 100,
    mlflow_tracking_uri: str = 'http://mlflow:5000'
) -> float:
    """Train model with MLflow tracking."""
    import pandas as pd
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.linear_model import LogisticRegression
    from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
    import mlflow
    import mlflow.sklearn
    import joblib
    import logging

    logger = logging.getLogger(__name__)

    # Setup MLflow
    mlflow.set_tracking_uri(mlflow_tracking_uri)
    mlflow.set_experiment('kfp-ml-pipeline')

    # Load data
    df = pd.read_csv(input_dataset.path)
    X = df.drop('target', axis=1)
    y = df['target']

    # Select model
    if model_type == 'random_forest':
        model = RandomForestClassifier(n_estimators=n_estimators, random_state=42)
    elif model_type == 'logistic_regression':
        model = LogisticRegression(max_iter=1000)
    else:
        raise ValueError(f"Unknown model type: {model_type}")

    # Train with MLflow
    with mlflow.start_run(run_name=f"{model_type}_kfp"):
        # Train
        model.fit(X, y)

        # Evaluate
        y_pred = model.predict(X)
        accuracy = accuracy_score(y, y_pred)
        precision = precision_score(y, y_pred, average='weighted')
        recall = recall_score(y, y_pred, average='weighted')
        f1 = f1_score(y, y_pred, average='weighted')

        # Log to MLflow
        mlflow.log_param('model_type', model_type)
        mlflow.log_param('n_estimators', n_estimators)
        mlflow.log_metric('accuracy', accuracy)
        mlflow.log_metric('precision', precision)
        mlflow.log_metric('recall', recall)
        mlflow.log_metric('f1', f1)

        # Log model
        mlflow.sklearn.log_model(model, 'model')

        # Save model artifact
        joblib.dump(model, output_model.path)

        # Save metrics
        output_metrics.log_metric('accuracy', accuracy)
        output_metrics.log_metric('precision', precision)
        output_metrics.log_metric('recall', recall)
        output_metrics.log_metric('f1', f1)

        logger.info(f"Model trained: {model_type}, Accuracy: {accuracy:.4f}")

        return accuracy
```

## Complete KFP Pipeline

```python
from kfp import dsl

@dsl.pipeline(
    name='ML Training Pipeline',
    description='End-to-end ML pipeline with Kubeflow and MLflow'
)
def ml_training_pipeline(
    data_path: str = 's3://data/train.csv',
    model_type: str = 'random_forest',
    n_estimators: int = 100,
    train_split: float = 0.8,
    mlflow_uri: str = 'http://mlflow:5000'
):
    """Complete ML training pipeline."""

    # Step 1: Load data
    load_task = load_data(data_path=data_path)

    # Step 2: Preprocess
    preprocess_task = preprocess_data(
        input_dataset=load_task.outputs['output_dataset'],
        train_split=train_split
    )

    # Step 3: Train model
    train_task = train_model(
        input_dataset=preprocess_task.outputs['output_dataset'],
        model_type=model_type,
        n_estimators=n_estimators,
        mlflow_tracking_uri=mlflow_uri
    )

    # Step 4: Deploy if accuracy > threshold
    with dsl.Condition(train_task.output > 0.85, name='accuracy-check'):
        deploy_task = deploy_model(
            input_model=train_task.outputs['output_model']
        )


@component(base_image='python:3.11')
def deploy_model(
    input_model: Input[Model],
    deployment_endpoint: str = 'http://model-server:8000'
):
    """Deploy model to production."""
    import shutil
    import requests
    import logging

    logger = logging.getLogger(__name__)

    # Copy model to deployment location
    shutil.copy(input_model.path, '/production/model.pkl')

    # Notify deployment service
    response = requests.post(
        f"{deployment_endpoint}/reload",
        json={'model_path': '/production/model.pkl'}
    )

    if response.status_code == 200:
        logger.info("Model deployed successfully")
    else:
        raise Exception(f"Deployment failed: {response.text}")
```

## Running KFP Pipelines

```python
from kfp import compiler
from kfp.client import Client

# Compile pipeline
compiler.Compiler().compile(
    pipeline_func=ml_training_pipeline,
    package_path='ml_pipeline.yaml'
)

# Submit to Kubeflow
client = Client(host='http://kubeflow.example.com')

run = client.create_run_from_pipeline_func(
    ml_training_pipeline,
    arguments={
        'data_path': 's3://my-bucket/data/train.csv',
        'model_type': 'random_forest',
        'n_estimators': 200,
        'mlflow_uri': 'http://mlflow.example.com'
    },
    experiment_name='ml-training'
)

print(f"Pipeline run created: {run.run_id}")
```

## MLflow Tracking Integration

### Experiment Tracking Setup

```python
import mlflow
from mlflow.tracking import MlflowClient

# Configure MLflow
mlflow.set_tracking_uri('http://mlflow.example.com:5000')
mlflow.set_experiment('production-training')

def train_with_mlflow(X_train, y_train, X_test, y_test, config):
    """Train model with comprehensive MLflow tracking."""

    with mlflow.start_run(run_name=config['run_name']):
        # Log parameters
        mlflow.log_params({
            'model_type': config['model_type'],
            'n_estimators': config.get('n_estimators', 100),
            'learning_rate': config.get('learning_rate', 0.1),
            'max_depth': config.get('max_depth', 5),
            'random_state': 42
        })

        # Log dataset info
        mlflow.log_param('train_size', len(X_train))
        mlflow.log_param('test_size', len(X_test))
        mlflow.log_param('n_features', X_train.shape[1])

        # Train model
        model = create_model(config)
        model.fit(X_train, y_train)

        # Evaluate
        train_score = model.score(X_train, y_train)
        test_score = model.score(X_test, y_test)

        # Log metrics
        mlflow.log_metric('train_accuracy', train_score)
        mlflow.log_metric('test_accuracy', test_score)
        mlflow.log_metric('overfit_ratio', train_score / test_score)

        # Log feature importance
        if hasattr(model, 'feature_importances_'):
            feature_importance = dict(zip(
                [f'feature_{i}' for i in range(len(model.feature_importances_))],
                model.feature_importances_
            ))
            mlflow.log_params(feature_importance)

        # Log model
        mlflow.sklearn.log_model(
            model,
            'model',
            registered_model_name=config.get('model_name', 'production-model')
        )

        # Log artifacts
        import matplotlib.pyplot as plt
        from sklearn.metrics import confusion_matrix, ConfusionMatrixDisplay

        # Confusion matrix
        y_pred = model.predict(X_test)
        cm = confusion_matrix(y_test, y_pred)
        disp = ConfusionMatrixDisplay(cm)
        disp.plot()
        plt.savefig('confusion_matrix.png')
        mlflow.log_artifact('confusion_matrix.png')

        return model, mlflow.active_run().info.run_id
```

### Model Registry Integration

```python
from mlflow.tracking import MlflowClient

client = MlflowClient(tracking_uri='http://mlflow.example.com:5000')

def register_model(run_id: str, model_name: str, stage: str = 'Staging'):
    """Register model in MLflow Model Registry."""

    # Get model URI
    model_uri = f"runs:/{run_id}/model"

    # Register model
    model_version = mlflow.register_model(model_uri, model_name)

    # Transition to stage
    client.transition_model_version_stage(
        name=model_name,
        version=model_version.version,
        stage=stage,
        archive_existing_versions=True
    )

    print(f"Model {model_name} version {model_version.version} -> {stage}")

    return model_version


def promote_to_production(model_name: str, version: str):
    """Promote model version to production."""

    # Get current production model
    prod_versions = client.get_latest_versions(model_name, stages=['Production'])

    # Transition new version to production
    client.transition_model_version_stage(
        name=model_name,
        version=version,
        stage='Production',
        archive_existing_versions=True  # Archive old production
    )

    print(f"Promoted {model_name} v{version} to Production")

    # Archive old versions
    for old_version in prod_versions:
        if old_version.version != version:
            client.transition_model_version_stage(
                name=model_name,
                version=old_version.version,
                stage='Archived'
            )


def load_production_model(model_name: str):
    """Load latest production model."""
    import mlflow.pyfunc

    model_uri = f"models:/{model_name}/Production"
    model = mlflow.pyfunc.load_model(model_uri)

    return model
```

### Hyperparameter Tuning with MLflow

```python
from sklearn.model_selection import GridSearchCV
import mlflow

def hyperparameter_tuning_with_mlflow(X_train, y_train, param_grid):
    """Hyperparameter tuning with MLflow tracking."""

    mlflow.set_experiment('hyperparameter-tuning')

    parent_run = mlflow.start_run(run_name='grid_search')

    # Grid search
    from sklearn.ensemble import RandomForestClassifier
    model = RandomForestClassifier(random_state=42)

    grid_search = GridSearchCV(
        model,
        param_grid,
        cv=5,
        scoring='accuracy',
        n_jobs=-1
    )

    grid_search.fit(X_train, y_train)

    # Log best parameters to parent run
    mlflow.log_params(grid_search.best_params_)
    mlflow.log_metric('best_cv_score', grid_search.best_score_)

    # Log each CV result as child run
    for i, params in enumerate(grid_search.cv_results_['params']):
        with mlflow.start_run(run_name=f'fold_{i}', nested=True):
            mlflow.log_params(params)
            mlflow.log_metric('mean_test_score', grid_search.cv_results_['mean_test_score'][i])
            mlflow.log_metric('std_test_score', grid_search.cv_results_['std_test_score'][i])

    mlflow.end_run()

    return grid_search.best_estimator_, grid_search.best_params_
```

## Artifact Management

### Versioned Artifact Storage

```python
import mlflow
from pathlib import Path

def log_artifacts_versioned(run_id: str, artifacts_dir: Path):
    """Log versioned artifacts to MLflow."""

    with mlflow.start_run(run_id=run_id):
        # Log data artifacts
        mlflow.log_artifact(artifacts_dir / 'train.csv', 'data')
        mlflow.log_artifact(artifacts_dir / 'test.csv', 'data')

        # Log preprocessing artifacts
        mlflow.log_artifact(artifacts_dir / 'scaler.pkl', 'preprocessing')
        mlflow.log_artifact(artifacts_dir / 'encoder.pkl', 'preprocessing')

        # Log evaluation artifacts
        mlflow.log_artifact(artifacts_dir / 'metrics.json', 'evaluation')
        mlflow.log_artifact(artifacts_dir / 'confusion_matrix.png', 'evaluation')

        # Log model artifacts
        mlflow.log_artifact(artifacts_dir / 'model.pkl', 'model')
        mlflow.log_artifact(artifacts_dir / 'model_metadata.json', 'model')


def download_artifacts(run_id: str, artifact_path: str, dst_path: Path):
    """Download artifacts from MLflow."""

    client = MlflowClient()

    # Download artifacts
    client.download_artifacts(
        run_id=run_id,
        path=artifact_path,
        dst_path=str(dst_path)
    )

    print(f"Downloaded artifacts to {dst_path}")
```

## Best Practices

### Component Design
1. **Single Responsibility**: Each component does one thing
2. **Type Hints**: Use Input/Output types for data passing
3. **Error Handling**: Comprehensive try/except in components
4. **Logging**: Log all important events
5. **Versioning**: Pin package versions in base_image

### MLflow Tracking
1. **Experiment Organization**: One experiment per project/model type
2. **Run Naming**: Descriptive run names with timestamp
3. **Parameter Logging**: Log all hyperparameters
4. **Metric Logging**: Log train AND test metrics
5. **Artifact Logging**: Save models, plots, data samples

### Pipeline Orchestration
1. **Conditional Execution**: Use dsl.Condition for branching
2. **Parallel Execution**: Use dsl.ParallelFor for batch jobs
3. **Resource Limits**: Set CPU/memory limits on components
4. **Retry Logic**: Configure retries for flaky components
5. **Monitoring**: Use KFP UI to monitor pipeline health
