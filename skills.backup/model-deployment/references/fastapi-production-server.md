# FastAPI Production Server for ML Models

Complete production-ready FastAPI implementation with error handling, validation, logging, health checks, and performance optimizations.

## Complete Production FastAPI Server

```python
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator
from typing import List, Dict, Optional, Any
import joblib
import numpy as np
import logging
import time
from datetime import datetime
from pathlib import Path
import os

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="ML Model API",
    description="Production ML model serving with FastAPI",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for your domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model storage
class ModelStore:
    """Singleton for model management."""
    _instance = None
    _model = None
    _model_version = None
    _model_loaded_at = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ModelStore, cls).__new__(cls)
        return cls._instance

    def load_model(self, model_path: str):
        """Load model from disk with error handling."""
        try:
            logger.info(f"Loading model from {model_path}")
            self._model = joblib.load(model_path)
            self._model_version = self._extract_version(model_path)
            self._model_loaded_at = datetime.now()
            logger.info(f"Model loaded successfully. Version: {self._model_version}")
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            raise RuntimeError(f"Model loading failed: {e}")

    def _extract_version(self, path: str) -> str:
        """Extract version from model filename."""
        # Example: model_v1.2.3.pkl -> 1.2.3
        filename = Path(path).stem
        if '_v' in filename:
            return filename.split('_v')[1]
        return "unknown"

    @property
    def model(self):
        """Get loaded model."""
        if self._model is None:
            raise RuntimeError("Model not loaded")
        return self._model

    @property
    def version(self) -> str:
        """Get model version."""
        return self._model_version or "unknown"

    @property
    def loaded_at(self) -> Optional[datetime]:
        """Get model load timestamp."""
        return self._model_loaded_at


# Initialize model store
model_store = ModelStore()


# Request/Response models with validation
class Feature(BaseModel):
    """Single feature with validation."""
    name: str = Field(..., description="Feature name")
    value: float = Field(..., description="Feature value")

    @validator('value')
    def validate_value(cls, v):
        """Validate feature value is finite."""
        if not np.isfinite(v):
            raise ValueError(f"Feature value must be finite, got {v}")
        return v


class PredictionRequest(BaseModel):
    """Request model for predictions."""
    features: List[float] = Field(
        ...,
        description="Feature vector for prediction",
        min_items=1,
        max_items=100
    )
    model_version: Optional[str] = Field(
        None,
        description="Specific model version to use"
    )

    @validator('features')
    def validate_features(cls, v):
        """Validate all features are finite numbers."""
        if not all(np.isfinite(val) for val in v):
            raise ValueError("All features must be finite numbers")
        return v

    class Config:
        schema_extra = {
            "example": {
                "features": [1.2, 3.4, 5.6, 7.8],
                "model_version": "1.0.0"
            }
        }


class PredictionResponse(BaseModel):
    """Response model for predictions."""
    prediction: float = Field(..., description="Model prediction")
    probability: Optional[float] = Field(
        None,
        description="Prediction probability (if classification)"
    )
    model_version: str = Field(..., description="Model version used")
    latency_ms: float = Field(..., description="Prediction latency in milliseconds")
    timestamp: datetime = Field(default_factory=datetime.now)

    class Config:
        schema_extra = {
            "example": {
                "prediction": 1.0,
                "probability": 0.87,
                "model_version": "1.0.0",
                "latency_ms": 12.5,
                "timestamp": "2024-01-15T10:30:00"
            }
        }


class BatchPredictionRequest(BaseModel):
    """Batch prediction request."""
    instances: List[List[float]] = Field(
        ...,
        description="List of feature vectors",
        min_items=1,
        max_items=1000  # Limit batch size
    )

    @validator('instances')
    def validate_instances(cls, v):
        """Validate all instances have same length."""
        if not v:
            raise ValueError("instances cannot be empty")

        first_len = len(v[0])
        if not all(len(inst) == first_len for inst in v):
            raise ValueError("All instances must have same number of features")

        return v


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    model_loaded: bool
    model_version: Optional[str]
    uptime_seconds: float
    timestamp: datetime


# Startup event
@app.on_event("startup")
async def startup_event():
    """Load model on startup."""
    model_path = os.getenv("MODEL_PATH", "model.pkl")

    if not Path(model_path).exists():
        logger.error(f"Model file not found: {model_path}")
        raise FileNotFoundError(f"Model file not found: {model_path}")

    model_store.load_model(model_path)
    logger.info("API server started successfully")


# Middleware for request logging
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all requests with timing."""
    start_time = time.time()

    # Process request
    response = await call_next(request)

    # Log request details
    process_time = (time.time() - start_time) * 1000
    logger.info(
        f"{request.method} {request.url.path} "
        f"status={response.status_code} "
        f"duration={process_time:.2f}ms"
    )

    # Add custom headers
    response.headers["X-Process-Time"] = str(process_time)
    response.headers["X-Model-Version"] = model_store.version

    return response


# Exception handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle HTTP exceptions with consistent format."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail,
            "status_code": exc.status_code,
            "timestamp": datetime.now().isoformat()
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle unexpected exceptions."""
    logger.error(f"Unexpected error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal server error",
            "detail": str(exc) if os.getenv("DEBUG") else "An error occurred",
            "timestamp": datetime.now().isoformat()
        }
    )


# Health check endpoint
@app.get(
    "/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    tags=["Health"]
)
async def health_check():
    """
    Health check endpoint for load balancers and monitoring.

    Returns service status and model information.
    """
    try:
        model_loaded = model_store._model is not None
        uptime = (datetime.now() - model_store.loaded_at).total_seconds() \
            if model_store.loaded_at else 0

        return HealthResponse(
            status="healthy" if model_loaded else "degraded",
            model_loaded=model_loaded,
            model_version=model_store.version,
            uptime_seconds=uptime,
            timestamp=datetime.now()
        )
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "unhealthy",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
        )


# Readiness probe
@app.get("/ready", tags=["Health"])
async def readiness_check():
    """
    Readiness probe for Kubernetes.

    Returns 200 when model is loaded and ready to serve.
    """
    try:
        # Verify model is loaded and functional
        _ = model_store.model
        return {"status": "ready", "timestamp": datetime.now()}
    except Exception as e:
        logger.error(f"Readiness check failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service not ready"
        )


# Prediction endpoint
@app.post(
    "/predict",
    response_model=PredictionResponse,
    status_code=status.HTTP_200_OK,
    tags=["Predictions"]
)
async def predict(request: PredictionRequest):
    """
    Make a single prediction.

    Args:
        request: Prediction request with features

    Returns:
        Prediction with probability and metadata

    Raises:
        HTTPException: If prediction fails
    """
    start_time = time.time()

    try:
        # Validate model is loaded
        model = model_store.model

        # Prepare features
        features = np.array(request.features).reshape(1, -1)

        # Make prediction
        prediction = float(model.predict(features)[0])

        # Get probability if classification model
        probability = None
        if hasattr(model, 'predict_proba'):
            proba = model.predict_proba(features)[0]
            probability = float(proba.max())

        # Calculate latency
        latency_ms = (time.time() - start_time) * 1000

        logger.info(f"Prediction made: {prediction} (latency: {latency_ms:.2f}ms)")

        return PredictionResponse(
            prediction=prediction,
            probability=probability,
            model_version=model_store.version,
            latency_ms=latency_ms,
            timestamp=datetime.now()
        )

    except ValueError as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid input features: {e}"
        )
    except Exception as e:
        logger.error(f"Prediction failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Prediction failed"
        )


# Batch prediction endpoint
@app.post(
    "/predict/batch",
    status_code=status.HTTP_200_OK,
    tags=["Predictions"]
)
async def predict_batch(request: BatchPredictionRequest):
    """
    Make batch predictions.

    Args:
        request: Batch prediction request

    Returns:
        List of predictions with metadata
    """
    start_time = time.time()

    try:
        model = model_store.model

        # Prepare features
        features = np.array(request.instances)

        # Make predictions
        predictions = model.predict(features).tolist()

        # Get probabilities if available
        probabilities = None
        if hasattr(model, 'predict_proba'):
            probabilities = model.predict_proba(features).max(axis=1).tolist()

        latency_ms = (time.time() - start_time) * 1000

        logger.info(
            f"Batch prediction: {len(predictions)} instances "
            f"(latency: {latency_ms:.2f}ms)"
        )

        return {
            "predictions": predictions,
            "probabilities": probabilities,
            "model_version": model_store.version,
            "latency_ms": latency_ms,
            "count": len(predictions),
            "timestamp": datetime.now()
        }

    except Exception as e:
        logger.error(f"Batch prediction failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Batch prediction failed"
        )


# Model metadata endpoint
@app.get("/model/info", tags=["Model"])
async def model_info():
    """
    Get model metadata and information.

    Returns:
        Model version, loaded time, and other metadata
    """
    try:
        return {
            "version": model_store.version,
            "loaded_at": model_store.loaded_at,
            "model_type": type(model_store.model).__name__,
            "uptime_seconds": (datetime.now() - model_store.loaded_at).total_seconds()
                if model_store.loaded_at else 0
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get model info: {e}"
        )
```

## Production Configuration

### Environment Variables

```bash
# .env file
MODEL_PATH=/models/model_v1.0.0.pkl
LOG_LEVEL=INFO
DEBUG=false
MAX_BATCH_SIZE=1000
WORKERS=4
HOST=0.0.0.0
PORT=8000
```

### Running with Uvicorn

```bash
# Development
uvicorn app:app --reload --host 0.0.0.0 --port 8000

# Production with multiple workers
uvicorn app:app \
  --host 0.0.0.0 \
  --port 8000 \
  --workers 4 \
  --log-level info \
  --access-log

# With Gunicorn (recommended for production)
gunicorn app:app \
  -w 4 \
  -k uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000 \
  --timeout 120 \
  --access-logfile - \
  --error-logfile -
```

## Testing the API

```python
import requests
import json

# Test health endpoint
response = requests.get("http://localhost:8000/health")
print(response.json())

# Test prediction
response = requests.post(
    "http://localhost:8000/predict",
    json={
        "features": [1.2, 3.4, 5.6, 7.8]
    }
)
print(response.json())

# Test batch prediction
response = requests.post(
    "http://localhost:8000/predict/batch",
    json={
        "instances": [
            [1.2, 3.4, 5.6, 7.8],
            [2.3, 4.5, 6.7, 8.9],
            [3.4, 5.6, 7.8, 9.0]
        ]
    }
)
print(response.json())
```

## Performance Optimizations

### 1. Response Caching

```python
from functools import lru_cache
import hashlib

@lru_cache(maxsize=1000)
def cached_predict(features_hash: str):
    """Cache predictions for identical inputs."""
    # Decode features from hash
    # Make prediction
    pass

def hash_features(features: List[float]) -> str:
    """Create hash of features for caching."""
    return hashlib.md5(str(features).encode()).hexdigest()
```

### 2. Async Model Loading

```python
from fastapi import BackgroundTasks

async def load_new_model(model_path: str):
    """Load model in background."""
    model_store.load_model(model_path)

@app.post("/model/reload")
async def reload_model(background_tasks: BackgroundTasks):
    """Reload model without downtime."""
    background_tasks.add_task(load_new_model, "new_model.pkl")
    return {"status": "Model reload initiated"}
```

### 3. Connection Pooling

```python
# For models that need database/cache connections
from redis import ConnectionPool
import redis

redis_pool = ConnectionPool(host='localhost', port=6379, db=0)
redis_client = redis.Redis(connection_pool=redis_pool)
```

## Security Best Practices

### API Key Authentication

```python
from fastapi.security import APIKeyHeader
from fastapi import Security

API_KEY = os.getenv("API_KEY")
api_key_header = APIKeyHeader(name="X-API-Key")

def verify_api_key(api_key: str = Security(api_key_header)):
    """Verify API key."""
    if api_key != API_KEY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid API key"
        )
    return api_key

@app.post("/predict", dependencies=[Depends(verify_api_key)])
async def predict(...):
    # Protected endpoint
    pass
```

### Rate Limiting

```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.post("/predict")
@limiter.limit("100/minute")
async def predict(request: Request, ...):
    # Rate-limited endpoint
    pass
```
