---
name: model-deployment
description: Deploys ML models to production using REST APIs, containers, and model serving platforms with proper monitoring. Use when serving predictions via API, containerizing models, or implementing model versioning in production.
---

# ML Model Deployment

Deploy trained models to production with proper serving and monitoring.

## Deployment Options

| Method | Use Case | Latency |
|--------|----------|---------|
| REST API | Web services | Medium |
| Batch | Large-scale processing | N/A |
| Streaming | Real-time | Low |
| Edge | On-device | Very low |

## FastAPI Model Server

```python
from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import numpy as np

app = FastAPI()
model = joblib.load('model.pkl')

class PredictionRequest(BaseModel):
    features: list[float]

class PredictionResponse(BaseModel):
    prediction: float
    probability: float

@app.get('/health')
def health():
    return {'status': 'healthy'}

@app.post('/predict', response_model=PredictionResponse)
def predict(request: PredictionRequest):
    features = np.array(request.features).reshape(1, -1)
    prediction = model.predict(features)[0]
    probability = model.predict_proba(features)[0].max()
    return PredictionResponse(prediction=prediction, probability=probability)
```

## Docker Deployment

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY model.pkl .
COPY app.py .

EXPOSE 8000
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
```

## Model Monitoring

```python
class ModelMonitor:
    def __init__(self):
        self.predictions = []
        self.latencies = []

    def log_prediction(self, input_data, prediction, latency):
        self.predictions.append({
            'input': input_data,
            'prediction': prediction,
            'latency': latency,
            'timestamp': datetime.now()
        })

    def detect_drift(self, reference_distribution):
        # Compare current predictions to reference
        pass
```

## Deployment Checklist

- [ ] Model validated on test set
- [ ] API endpoints documented
- [ ] Health check endpoint
- [ ] Authentication configured
- [ ] Logging and monitoring setup
- [ ] Model versioning in place
- [ ] Rollback procedure documented

## Best Practices

- Version models with semantic versioning
- Implement A/B testing for new models
- Monitor prediction distribution for drift
- Log all predictions for debugging
- Set up alerts for latency and error rates
