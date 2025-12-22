# CI/CD for ML Models

Complete CI/CD pipeline for machine learning models including automated testing, validation, and deployment strategies.

## Overview

ML CI/CD differs from traditional software:
- **Model validation** beyond unit tests
- **Data validation** for training/inference
- **Performance benchmarks** (accuracy, latency)
- **Drift detection** in production
- **Model versioning** and artifact management

## Complete GitHub Actions Workflow

```yaml
# .github/workflows/ml-pipeline.yml
name: ML Model CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  workflow_dispatch:  # Manual trigger

env:
  PYTHON_VERSION: '3.11'
  MODEL_REGISTRY: 's3://my-model-bucket'

jobs:
  # Job 1: Code Quality & Unit Tests
  code-quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: ${{ env.PYTHON_VERSION }}
          cache: 'pip'

      - name: Install dependencies
        run: |
          pip install --upgrade pip
          pip install -r requirements.txt
          pip install -r requirements-dev.txt

      - name: Lint with flake8
        run: |
          flake8 src/ --count --select=E9,F63,F7,F82 --show-source --statistics
          flake8 src/ --count --max-complexity=10 --max-line-length=127 --statistics

      - name: Type check with mypy
        run: mypy src/

      - name: Run unit tests
        run: |
          pytest tests/unit/ \
            --cov=src \
            --cov-report=xml \
            --cov-report=html \
            --junit-xml=pytest.xml

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage.xml

  # Job 2: Data Validation
  data-validation:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: ${{ env.PYTHON_VERSION }}

      - name: Validate training data
        run: |
          python scripts/validate_data.py \
            --data-path data/train.csv \
            --schema schema.json

      - name: Check data quality
        run: |
          python scripts/data_quality_checks.py

  # Job 3: Model Training & Validation
  train-model:
    needs: [code-quality, data-validation]
    runs-on: ubuntu-latest
    outputs:
      model-version: ${{ steps.version.outputs.version }}
      metrics: ${{ steps.train.outputs.metrics }}

    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: ${{ env.PYTHON_VERSION }}

      - name: Install dependencies
        run: pip install -r requirements.txt

      - name: Generate model version
        id: version
        run: |
          VERSION=$(date +%Y%m%d)-${GITHUB_SHA::7}
          echo "version=$VERSION" >> $GITHUB_OUTPUT
          echo "Model version: $VERSION"

      - name: Train model
        id: train
        run: |
          python src/train.py \
            --output models/model_${{ steps.version.outputs.version }}.pkl \
            --config config/train_config.yaml

          # Extract metrics
          METRICS=$(cat metrics.json)
          echo "metrics=$METRICS" >> $GITHUB_OUTPUT

      - name: Validate model performance
        run: |
          python scripts/validate_model.py \
            --model models/model_${{ steps.version.outputs.version }}.pkl \
            --test-data data/test.csv \
            --min-accuracy 0.85

      - name: Upload model artifact
        uses: actions/upload-artifact@v3
        with:
          name: model-${{ steps.version.outputs.version }}
          path: models/model_${{ steps.version.outputs.version }}.pkl

  # Job 4: Integration Tests
  integration-tests:
    needs: train-model
    runs-on: ubuntu-latest
    services:
      redis:
        image: redis:alpine
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v3

      - name: Download model artifact
        uses: actions/download-artifact@v3
        with:
          name: model-${{ needs.train-model.outputs.model-version }}
          path: models/

      - name: Start API server
        run: |
          pip install -r requirements.txt
          uvicorn app:app --host 0.0.0.0 --port 8000 &
          sleep 10  # Wait for server to start

      - name: Run integration tests
        run: |
          pytest tests/integration/ \
            --base-url http://localhost:8000

      - name: Performance benchmarks
        run: |
          python scripts/benchmark_api.py \
            --url http://localhost:8000/predict \
            --requests 1000 \
            --max-latency 200  # ms

  # Job 5: Security Scanning
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'

      - name: Upload Trivy results to GitHub Security
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'

      - name: Check Python dependencies
        run: |
          pip install safety
          safety check --json

  # Job 6: Build Docker Image
  build-image:
    needs: [train-model, integration-tests, security]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    outputs:
      image-tag: ${{ steps.meta.outputs.tags }}

    steps:
      - uses: actions/checkout@v3

      - name: Download model artifact
        uses: actions/download-artifact@v3
        with:
          name: model-${{ needs.train-model.outputs.model-version }}
          path: models/

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2

      - name: Log in to Registry
        uses: docker/login-action@v2
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v4
        with:
          images: ghcr.io/${{ github.repository }}
          tags: |
            type=sha
            type=semver,pattern={{version}}
            latest

      - name: Build and push
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          build-args: |
            MODEL_VERSION=${{ needs.train-model.outputs.model-version }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  # Job 7: Deploy to Staging
  deploy-staging:
    needs: build-image
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment:
      name: staging
      url: https://staging.api.example.com

    steps:
      - uses: actions/checkout@v3

      - name: Configure kubectl
        uses: azure/k8s-set-context@v3
        with:
          kubeconfig: ${{ secrets.KUBECONFIG_STAGING }}

      - name: Deploy to staging
        run: |
          kubectl set image deployment/model-api \
            model-api=${{ needs.build-image.outputs.image-tag }} \
            --namespace=staging

          kubectl rollout status deployment/model-api --namespace=staging

      - name: Run smoke tests
        run: |
          python scripts/smoke_tests.py \
            --url https://staging.api.example.com

  # Job 8: Deploy to Production
  deploy-production:
    needs: deploy-staging
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment:
      name: production
      url: https://api.example.com

    steps:
      - uses: actions/checkout@v3

      - name: Configure kubectl
        uses: azure/k8s-set-context@v3
        with:
          kubeconfig: ${{ secrets.KUBECONFIG_PROD }}

      - name: Deploy to production (canary)
        run: |
          # Deploy to 10% of traffic first
          kubectl apply -f k8s/canary-deployment.yaml

          # Wait and monitor
          sleep 300

          # Check canary metrics
          python scripts/check_canary_metrics.py

      - name: Full rollout
        run: |
          kubectl set image deployment/model-api \
            model-api=${{ needs.build-image.outputs.image-tag }} \
            --namespace=production

          kubectl rollout status deployment/model-api --namespace=production
```

## Model Validation Script

```python
# scripts/validate_model.py
import joblib
import pandas as pd
import numpy as np
from sklearn.metrics import accuracy_score, precision_score, recall_score
import argparse
import sys

def validate_model(model_path, test_data_path, min_accuracy=0.85):
    """Validate model meets performance thresholds."""

    # Load model
    model = joblib.load(model_path)

    # Load test data
    test_df = pd.read_csv(test_data_path)
    X_test = test_df.drop('target', axis=1)
    y_test = test_df['target']

    # Make predictions
    y_pred = model.predict(X_test)

    # Compute metrics
    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred, average='weighted')
    recall = recall_score(y_test, y_pred, average='weighted')

    print(f"Model Performance:")
    print(f"  Accuracy:  {accuracy:.4f}")
    print(f"  Precision: {precision:.4f}")
    print(f"  Recall:    {recall:.4f}")

    # Validate thresholds
    if accuracy < min_accuracy:
        print(f"❌ Model accuracy {accuracy:.4f} below threshold {min_accuracy}")
        sys.exit(1)

    print("✅ Model validation passed")
    return True

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--model', required=True)
    parser.add_argument('--test-data', required=True)
    parser.add_argument('--min-accuracy', type=float, default=0.85)
    args = parser.parse_args()

    validate_model(args.model, args.test_data, args.min_accuracy)
```

## Data Validation Script

```python
# scripts/validate_data.py
import pandas as pd
import json
import argparse
import sys

def validate_data(data_path, schema_path):
    """Validate data against schema."""

    # Load data and schema
    df = pd.read_csv(data_path)
    with open(schema_path) as f:
        schema = json.load(f)

    errors = []

    # Check columns
    expected_cols = set(schema['columns'])
    actual_cols = set(df.columns)

    if expected_cols != actual_cols:
        missing = expected_cols - actual_cols
        extra = actual_cols - expected_cols
        if missing:
            errors.append(f"Missing columns: {missing}")
        if extra:
            errors.append(f"Extra columns: {extra}")

    # Check data types
    for col, dtype in schema.get('dtypes', {}).items():
        if col in df.columns and df[col].dtype != dtype:
            errors.append(f"Column {col} has dtype {df[col].dtype}, expected {dtype}")

    # Check null values
    max_nulls = schema.get('max_null_percentage', 0.05)
    for col in df.columns:
        null_pct = df[col].isnull().sum() / len(df)
        if null_pct > max_nulls:
            errors.append(f"Column {col} has {null_pct:.1%} nulls (max: {max_nulls:.1%})")

    # Report results
    if errors:
        print("❌ Data validation failed:")
        for error in errors:
            print(f"  - {error}")
        sys.exit(1)

    print("✅ Data validation passed")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--data-path', required=True)
    parser.add_argument('--schema', required=True)
    args = parser.parse_args()

    validate_data(args.data_path, args.schema)
```

## Performance Benchmark Script

```python
# scripts/benchmark_api.py
import requests
import time
import numpy as np
import argparse

def benchmark_api(url, n_requests=1000, max_latency_ms=200):
    """Benchmark API performance."""

    latencies = []

    for i in range(n_requests):
        start = time.time()

        response = requests.post(
            url,
            json={"features": [1.2, 3.4, 5.6, 7.8]}
        )

        latency = (time.time() - start) * 1000
        latencies.append(latency)

        if response.status_code != 200:
            print(f"❌ Request {i} failed: {response.status_code}")
            return False

    # Compute statistics
    p50 = np.percentile(latencies, 50)
    p95 = np.percentile(latencies, 95)
    p99 = np.percentile(latencies, 99)

    print(f"Benchmark Results ({n_requests} requests):")
    print(f"  P50: {p50:.2f}ms")
    print(f"  P95: {p95:.2f}ms")
    print(f"  P99: {p99:.2f}ms")

    if p95 > max_latency_ms:
        print(f"❌ P95 latency {p95:.2f}ms exceeds {max_latency_ms}ms")
        return False

    print("✅ Performance benchmarks passed")
    return True

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--url', required=True)
    parser.add_argument('--requests', type=int, default=1000)
    parser.add_argument('--max-latency', type=float, default=200)
    args = parser.parse_args()

    benchmark_api(args.url, args.requests, args.max_latency)
```

## Automated Rollback on Failure

```yaml
# In CI/CD pipeline
- name: Deploy with auto-rollback
  run: |
    # Record previous deployment
    PREVIOUS_IMAGE=$(kubectl get deployment model-api -o jsonpath='{.spec.template.spec.containers[0].image}')

    # Deploy new version
    kubectl set image deployment/model-api model-api=${{ needs.build-image.outputs.image-tag }}

    # Wait for rollout
    if ! kubectl rollout status deployment/model-api --timeout=5m; then
      echo "Deployment failed, rolling back"
      kubectl set image deployment/model-api model-api=$PREVIOUS_IMAGE
      exit 1
    fi

    # Run health checks
    sleep 30
    if ! python scripts/health_check.py; then
      echo "Health checks failed, rolling back"
      kubectl set image deployment/model-api model-api=$PREVIOUS_IMAGE
      exit 1
    fi

    echo "Deployment successful"
```

## Best Practices

1. **Pin all dependency versions** (requirements.txt with ==)
2. **Cache build artifacts** (Docker layers, pip packages)
3. **Run tests in parallel** when possible
4. **Use separate staging environment**
5. **Implement gradual rollout** (canary, blue-green)
6. **Monitor deployment health** automatically
7. **Keep rollback procedure simple** (one command)
8. **Log all deployment events** for audit trail
