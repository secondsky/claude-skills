# Containerization and Deployment

Production Docker configuration, multi-stage builds, model versioning, A/B testing, and deployment strategies for ML models.

## Multi-Stage Dockerfile for ML Models

```dockerfile
# Stage 1: Builder - Install dependencies
FROM python:3.11-slim as builder

WORKDIR /build

# Install build dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python dependencies to /install
RUN pip install --no-cache-dir --prefix=/install \
    -r requirements.txt

# Stage 2: Runtime - Minimal image
FROM python:3.11-slim

# Create non-root user
RUN useradd -m -u 1000 mluser && \
    mkdir -p /app /models && \
    chown -R mluser:mluser /app /models

WORKDIR /app

# Copy installed dependencies from builder
COPY --from=builder /install /usr/local

# Copy application code
COPY --chown=mluser:mluser app.py .
COPY --chown=mluser:mluser model.pkl /models/

# Switch to non-root user
USER mluser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/health')" || exit 1

# Run application
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

## Model Versioning Strategy

```dockerfile
# Dockerfile with versioned model
ARG MODEL_VERSION=1.0.0
FROM python:3.11-slim

WORKDIR /app

# Copy model with version
COPY models/model_v${MODEL_VERSION}.pkl /models/model.pkl

ENV MODEL_VERSION=${MODEL_VERSION}

# Rest of Dockerfile...
```

Build with specific version:
```bash
docker build --build-arg MODEL_VERSION=1.2.3 -t model-api:v1.2.3 .
```

## Docker Compose for Local Development

```yaml
# docker-compose.yml
version: '3.8'

services:
  model-api:
    build:
      context: .
      args:
        MODEL_VERSION: "1.0.0"
    ports:
      - "8000:8000"
    environment:
      - MODEL_PATH=/models/model.pkl
      - LOG_LEVEL=INFO
      - WORKERS=2
    volumes:
      - ./models:/models:ro  # Read-only models
      - ./logs:/app/logs     # Persistent logs
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped

  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana-data:/var/lib/grafana
    depends_on:
      - prometheus

volumes:
  prometheus-data:
  grafana-data:
```

## A/B Testing Deployment

### Nginx Configuration for A/B Testing

```nginx
# nginx.conf
upstream model_a {
    server model-api-a:8000;
}

upstream model_b {
    server model-api-b:8000;
}

split_clients "${remote_addr}${http_user_agent}" $model_upstream {
    70%    model_a;  # 70% traffic to model A
    30%    model_b;  # 30% traffic to model B
}

server {
    listen 80;

    location /predict {
        proxy_pass http://$model_upstream;
        proxy_set_header X-Model-Version $upstream_addr;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /health {
        proxy_pass http://model_a;  # Use primary for health
    }
}
```

### Docker Compose for A/B Testing

```yaml
# docker-compose-ab.yml
version: '3.8'

services:
  model-api-a:
    build:
      context: .
      args:
        MODEL_VERSION: "1.0.0"
    environment:
      - MODEL_VERSION=1.0.0
    deploy:
      replicas: 3

  model-api-b:
    build:
      context: .
      args:
        MODEL_VERSION: "1.1.0"
    environment:
      - MODEL_VERSION=1.1.0
    deploy:
      replicas: 1  # Less replicas for testing

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - model-api-a
      - model-api-b
```

## Kubernetes Deployment

### Deployment YAML

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: model-api
  labels:
    app: model-api
    version: v1.0.0
spec:
  replicas: 3
  selector:
    matchLabels:
      app: model-api
  template:
    metadata:
      labels:
        app: model-api
        version: v1.0.0
    spec:
      containers:
      - name: model-api
        image: your-registry/model-api:v1.0.0
        ports:
        - containerPort: 8000
        env:
        - name: MODEL_PATH
          value: "/models/model.pkl"
        - name: WORKERS
          value: "2"
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 5
        volumeMounts:
        - name: model-storage
          mountPath: /models
          readOnly: true
      volumes:
      - name: model-storage
        persistentVolumeClaim:
          claimName: model-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: model-api-service
spec:
  selector:
    app: model-api
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8000
  type: LoadBalancer
```

### Rolling Update Strategy

```yaml
# deployment-rolling.yaml
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1        # Max 1 pod above desired count
      maxUnavailable: 0  # No downtime
  template:
    # ... container spec
```

### Blue-Green Deployment

```yaml
# Service for active (blue) deployment
apiVersion: v1
kind: Service
metadata:
  name: model-api
spec:
  selector:
    app: model-api
    version: blue  # Switch to 'green' to cut over
  ports:
  - port: 80
    targetPort: 8000
```

## CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Build and Deploy Model API

on:
  push:
    branches: [main]
    tags: ['v*']

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}/model-api

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          pip install pytest pytest-cov

      - name: Run tests
        run: pytest tests/ --cov=app --cov-report=xml

      - name: Upload coverage
        uses: codecov/codecov-action@v3

  build-and-push:
    needs: test
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - uses: actions/checkout@v3

      - name: Log in to Container Registry
        uses: docker/login-action@v2
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v4
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=sha

      - name: Build and push Docker image
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v3

      - name: Configure kubectl
        uses: azure/k8s-set-context@v3
        with:
          kubeconfig: ${{ secrets.KUBECONFIG }}

      - name: Deploy to Kubernetes
        run: |
          kubectl set image deployment/model-api \
            model-api=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:sha-${{ github.sha }}
          kubectl rollout status deployment/model-api
```

## Model Registry Integration

```python
# model_registry.py
import mlflow
from typing import Optional

class ModelRegistry:
    """
    Manage model versions with MLflow.
    """

    def __init__(self, tracking_uri: str):
        mlflow.set_tracking_uri(tracking_uri)

    def register_model(
        self,
        model_path: str,
        model_name: str,
        version: str,
        metrics: dict
    ) -> str:
        """Register model in MLflow."""
        with mlflow.start_run():
            # Log metrics
            mlflow.log_metrics(metrics)

            # Log model
            mlflow.sklearn.log_model(
                model_path,
                "model",
                registered_model_name=model_name
            )

            # Tag with version
            mlflow.set_tag("version", version)

        return f"{model_name}:{version}"

    def promote_to_production(
        self,
        model_name: str,
        version: str
    ):
        """Promote model version to production."""
        client = mlflow.tracking.MlflowClient()

        # Transition to production
        client.transition_model_version_stage(
            name=model_name,
            version=version,
            stage="Production"
        )
```

## Deployment Checklist

### Pre-Deployment
- [ ] Model validated on test set (metrics documented)
- [ ] Docker image built and scanned for vulnerabilities
- [ ] Resource limits configured (CPU, memory)
- [ ] Environment variables configured
- [ ] Secrets managed securely (K8s secrets, Vault)
- [ ] Health check endpoints tested
- [ ] Model file size optimized (<500MB)

### Deployment
- [ ] Rolling update configured (no downtime)
- [ ] Monitoring configured (Prometheus, Grafana)
- [ ] Logging aggregation setup (ELK, Loki)
- [ ] Alerts configured (PagerDuty, Slack)
- [ ] Load balancer configured
- [ ] Auto-scaling rules set

### Post-Deployment
- [ ] Smoke tests passed
- [ ] Performance benchmarks met (latency <200ms)
- [ ] Drift monitoring enabled
- [ ] A/B test configured (if applicable)
- [ ] Rollback procedure documented
- [ ] On-call rotation updated

## Best Practices

1. **Use multi-stage builds** to minimize image size
2. **Run as non-root user** for security
3. **Pin dependency versions** in requirements.txt
4. **Implement health checks** for orchestration
5. **Use secrets management** (never commit credentials)
6. **Enable horizontal pod autoscaling** in Kubernetes
7. **Monitor resource usage** and adjust limits
8. **Test rollback procedure** before deploying
