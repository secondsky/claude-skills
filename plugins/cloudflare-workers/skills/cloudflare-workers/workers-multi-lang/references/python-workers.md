# Python Workers Development

Build Cloudflare Workers using Python with Pyodide runtime.

## Overview

Python Workers run on Pyodide (Python compiled to WebAssembly), enabling data science, ML inference, and Python library usage at the edge.

## Capabilities

- **Python 3.12**: Full Python standard library
- **NumPy/Pandas**: Data processing (pre-bundled)
- **ML Inference**: TensorFlow.js, scikit-learn models
- **Cloudflare Bindings**: Full access to KV, D1, R2, etc.

## Limitations

- **Cold Start**: ~500ms-1s for first request
- **Bundle Size**: Larger than JS/Rust
- **CPU Limits**: Same 50ms/10ms limits apply
- **No Threading**: Single-threaded execution

## Project Setup

```bash
# Create project
mkdir my-python-worker
cd my-python-worker

# Initialize
cat > pyproject.toml << 'EOF'
[project]
name = "my-python-worker"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = []

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"
EOF

# Create source
mkdir src
touch src/entry.py

# Wrangler config
cat > wrangler.toml << 'EOF'
name = "my-python-worker"
main = "src/entry.py"
compatibility_date = "2024-12-01"
compatibility_flags = ["python_workers"]
EOF
```

## Project Structure

```
my-python-worker/
├── src/
│   ├── entry.py          # Main worker
│   ├── handlers.py       # Route handlers
│   ├── utils.py          # Utilities
│   └── models/           # ML models
├── pyproject.toml
├── wrangler.toml
└── requirements.txt
```

## Basic Worker

```python
# src/entry.py
from js import Response, Headers, JSON

async def on_fetch(request, env):
    """Main fetch handler"""
    url = request.url
    method = request.method

    # Routing
    if "/api/data" in url:
        return await handle_api(request, env)
    elif "/api/process" in url and method == "POST":
        return await handle_process(request, env)
    elif "/health" in url:
        return Response.new("OK", status=200)

    return Response.new("Hello from Python Worker!", status=200)


async def handle_api(request, env):
    """Handle API requests"""
    data = {"message": "Hello from Python", "status": "ok"}
    headers = Headers.new({"Content-Type": "application/json"}.items())
    return Response.new(JSON.stringify(data), headers=headers)


async def handle_process(request, env):
    """Handle POST with JSON body"""
    try:
        body = await request.json()
        result = process_data(body)
        return Response.json(result)
    except Exception as e:
        return Response.json({"error": str(e)}, status=400)


def process_data(data):
    """Process incoming data"""
    return {
        "processed": True,
        "input": data,
        "result": compute_result(data)
    }


def compute_result(data):
    """CPU-intensive computation"""
    if isinstance(data, dict) and "value" in data:
        return data["value"] * 2
    return 0
```

## Request Handling

```python
# src/handlers.py
from js import Response, Headers, URL
import json


async def get_query_params(request):
    """Parse query parameters"""
    url = URL.new(request.url)
    params = {}
    for entry in url.searchParams.entries():
        params[entry[0]] = entry[1]
    return params


async def get_json_body(request):
    """Parse JSON body"""
    text = await request.text()
    return json.loads(text)


async def handle_users_list(request, env):
    """GET /api/users"""
    params = await get_query_params(request)
    page = int(params.get("page", 1))
    limit = int(params.get("limit", 10))

    # Access D1 database
    db = env.DB
    result = await db.prepare(
        "SELECT * FROM users LIMIT ? OFFSET ?"
    ).bind(limit, (page - 1) * limit).all()

    return Response.json({
        "data": result.results,
        "page": page,
        "limit": limit
    })


async def handle_user_create(request, env):
    """POST /api/users"""
    try:
        body = await get_json_body(request)

        # Validation
        if not body.get("name"):
            return Response.json(
                {"error": "Name is required"},
                status=400
            )

        if not body.get("email") or "@" not in body["email"]:
            return Response.json(
                {"error": "Valid email is required"},
                status=400
            )

        # Insert into D1
        db = env.DB
        result = await db.prepare(
            "INSERT INTO users (name, email) VALUES (?, ?) RETURNING *"
        ).bind(body["name"], body["email"]).first()

        return Response.json(result, status=201)

    except Exception as e:
        return Response.json({"error": str(e)}, status=500)


async def handle_user_by_id(request, env, user_id):
    """GET /api/users/:id"""
    db = env.DB
    user = await db.prepare(
        "SELECT * FROM users WHERE id = ?"
    ).bind(user_id).first()

    if not user:
        return Response.json(
            {"error": "User not found"},
            status=404
        )

    return Response.json(user)
```

## Cloudflare Bindings

```python
# src/bindings.py
from js import Response


async def use_kv(env):
    """KV Namespace operations"""
    kv = env.MY_KV

    # Write
    await kv.put("key", "value")

    # Read
    value = await kv.get("key")

    # Read with metadata
    result = await kv.getWithMetadata("key", type="text")
    value = result.value
    metadata = result.metadata

    # List keys
    keys = await kv.list(prefix="user:", limit=100)

    # Delete
    await kv.delete("key")

    return value


async def use_d1(env):
    """D1 Database operations"""
    db = env.DB

    # Single query
    result = await db.prepare("SELECT * FROM users").all()
    users = result.results

    # Parameterized query
    user = await db.prepare(
        "SELECT * FROM users WHERE id = ?"
    ).bind(123).first()

    # Insert
    await db.prepare(
        "INSERT INTO users (name, email) VALUES (?, ?)"
    ).bind("John", "john@example.com").run()

    # Batch operations
    statements = [
        db.prepare("INSERT INTO logs (msg) VALUES (?)").bind("Log 1"),
        db.prepare("INSERT INTO logs (msg) VALUES (?)").bind("Log 2"),
    ]
    results = await db.batch(statements)

    return users


async def use_r2(env):
    """R2 Bucket operations"""
    bucket = env.MY_BUCKET

    # Upload
    await bucket.put("file.txt", "Hello World")

    # Upload with metadata
    await bucket.put("image.png", image_bytes, {
        "httpMetadata": {"contentType": "image/png"},
        "customMetadata": {"author": "me"}
    })

    # Download
    obj = await bucket.get("file.txt")
    if obj:
        content = await obj.text()

    # List objects
    objects = await bucket.list(prefix="files/", limit=100)

    # Delete
    await bucket.delete("file.txt")

    return content


async def use_environment(env):
    """Environment variables and secrets"""
    # Regular variable
    api_url = env.API_URL

    # Secret (same access pattern)
    api_key = env.API_KEY

    return api_url
```

## Data Processing with NumPy

```python
# src/data_processing.py
import numpy as np
from js import Response
import json


async def handle_statistics(request, env):
    """Compute statistics on numeric data"""
    body = await request.json()
    data = body.get("data", [])

    if not data:
        return Response.json({"error": "No data provided"}, status=400)

    # Convert to numpy array
    arr = np.array(data, dtype=np.float64)

    # Compute statistics
    stats = {
        "count": len(arr),
        "mean": float(np.mean(arr)),
        "std": float(np.std(arr)),
        "min": float(np.min(arr)),
        "max": float(np.max(arr)),
        "median": float(np.median(arr)),
        "percentiles": {
            "25": float(np.percentile(arr, 25)),
            "50": float(np.percentile(arr, 50)),
            "75": float(np.percentile(arr, 75)),
            "90": float(np.percentile(arr, 90)),
            "99": float(np.percentile(arr, 99)),
        }
    }

    return Response.json(stats)


async def handle_matrix_operations(request, env):
    """Matrix operations"""
    body = await request.json()
    matrix_a = np.array(body.get("a", []))
    matrix_b = np.array(body.get("b", []))

    result = {}

    if body.get("operation") == "multiply":
        result["product"] = np.dot(matrix_a, matrix_b).tolist()
    elif body.get("operation") == "add":
        result["sum"] = (matrix_a + matrix_b).tolist()
    elif body.get("operation") == "inverse":
        result["inverse"] = np.linalg.inv(matrix_a).tolist()

    return Response.json(result)


def normalize_data(data):
    """Normalize data to 0-1 range"""
    arr = np.array(data)
    min_val = np.min(arr)
    max_val = np.max(arr)
    return ((arr - min_val) / (max_val - min_val)).tolist()
```

## ML Inference

```python
# src/ml_inference.py
import json
from js import Response


# Simple model inference (no external deps)
class SimpleClassifier:
    def __init__(self, weights):
        self.weights = weights

    def predict(self, features):
        score = sum(w * f for w, f in zip(self.weights, features))
        return 1 if score > 0 else 0


# Pre-trained model weights (stored in KV or as constant)
MODEL_WEIGHTS = [0.5, -0.3, 0.2, 0.1]


async def handle_predict(request, env):
    """Run ML prediction"""
    body = await request.json()
    features = body.get("features", [])

    if len(features) != len(MODEL_WEIGHTS):
        return Response.json(
            {"error": f"Expected {len(MODEL_WEIGHTS)} features"},
            status=400
        )

    model = SimpleClassifier(MODEL_WEIGHTS)
    prediction = model.predict(features)

    return Response.json({
        "prediction": prediction,
        "class": "positive" if prediction == 1 else "negative"
    })


# Load model from KV
async def load_model(env):
    """Load model weights from KV"""
    kv = env.MODELS_KV
    weights_json = await kv.get("classifier-weights")
    if weights_json:
        return json.loads(weights_json)
    return MODEL_WEIGHTS
```

## Error Handling

```python
# src/errors.py
from js import Response
import traceback


class AppError(Exception):
    def __init__(self, message, status_code=500):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class ValidationError(AppError):
    def __init__(self, message):
        super().__init__(message, 400)


class NotFoundError(AppError):
    def __init__(self, message="Not found"):
        super().__init__(message, 404)


async def error_handler(handler):
    """Wrap handler with error handling"""
    async def wrapper(request, env):
        try:
            return await handler(request, env)
        except ValidationError as e:
            return Response.json({"error": e.message}, status=400)
        except NotFoundError as e:
            return Response.json({"error": e.message}, status=404)
        except AppError as e:
            return Response.json({"error": e.message}, status=e.status_code)
        except Exception as e:
            # Log full traceback
            print(traceback.format_exc())
            return Response.json(
                {"error": "Internal server error"},
                status=500
            )
    return wrapper
```

## Wrangler Configuration

```toml
# wrangler.toml
name = "my-python-worker"
main = "src/entry.py"
compatibility_date = "2024-12-01"
compatibility_flags = ["python_workers"]

[vars]
ENVIRONMENT = "development"

[[kv_namespaces]]
binding = "MY_KV"
id = "xxx"

[[d1_databases]]
binding = "DB"
database_name = "my-db"
database_id = "xxx"

[[r2_buckets]]
binding = "MY_BUCKET"
bucket_name = "my-bucket"

[env.production]
vars = { ENVIRONMENT = "production" }
```

## Development and Deployment

```bash
# Local development
npx wrangler dev

# Deploy
npx wrangler deploy

# View logs
npx wrangler tail
```

## Performance Tips

1. **Minimize imports**: Only import what you need
2. **Lazy loading**: Import heavy modules in handlers
3. **Cache computations**: Store results in KV
4. **Use NumPy**: Vectorized operations are faster
5. **Batch operations**: Combine D1 queries
6. **Avoid large responses**: Stream if possible
