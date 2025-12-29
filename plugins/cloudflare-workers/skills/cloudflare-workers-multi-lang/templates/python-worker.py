"""
Python Worker Template for Cloudflare Workers

Production-ready patterns for:
- Request routing
- Cloudflare bindings (KV, D1, R2)
- Error handling
- JSON serialization
- Data processing with NumPy

Setup:
1. Create pyproject.toml (below)
2. Create wrangler.toml (below)
3. Copy this file to src/entry.py
4. Run: npx wrangler dev
"""

# ============================================
# PYPROJECT.TOML
# ============================================

"""
[project]
name = "my-python-worker"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = []

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"
"""

# ============================================
# WRANGLER.TOML
# ============================================

"""
name = "my-python-worker"
main = "src/entry.py"
compatibility_date = "2024-12-01"
compatibility_flags = ["python_workers"]

[vars]
ENVIRONMENT = "development"

[[kv_namespaces]]
binding = "CACHE"
id = "xxx"

[[d1_databases]]
binding = "DB"
database_name = "my-db"
database_id = "xxx"

[[r2_buckets]]
binding = "STORAGE"
bucket_name = "my-bucket"
"""

# ============================================
# MAIN WORKER CODE (src/entry.py)
# ============================================

from js import Response, Headers, URL, JSON
import json
from datetime import datetime
import uuid

# Optional: NumPy for data processing
try:
    import numpy as np
    HAS_NUMPY = True
except ImportError:
    HAS_NUMPY = False


# ============================================
# ROUTER
# ============================================

class Router:
    """Simple URL router for Python Workers"""

    def __init__(self):
        self.routes = {
            "GET": {},
            "POST": {},
            "PUT": {},
            "DELETE": {},
        }

    def get(self, path):
        def decorator(func):
            self.routes["GET"][path] = func
            return func
        return decorator

    def post(self, path):
        def decorator(func):
            self.routes["POST"][path] = func
            return func
        return decorator

    def put(self, path):
        def decorator(func):
            self.routes["PUT"][path] = func
            return func
        return decorator

    def delete(self, path):
        def decorator(func):
            self.routes["DELETE"][path] = func
            return func
        return decorator

    def match(self, method, path):
        """Match route and extract params"""
        routes = self.routes.get(method, {})

        for route_path, handler in routes.items():
            params = self._match_path(route_path, path)
            if params is not None:
                return handler, params

        return None, {}

    def _match_path(self, pattern, path):
        """Match path pattern with :param placeholders"""
        pattern_parts = pattern.split("/")
        path_parts = path.split("/")

        if len(pattern_parts) != len(path_parts):
            return None

        params = {}
        for pp, pathp in zip(pattern_parts, path_parts):
            if pp.startswith(":"):
                params[pp[1:]] = pathp
            elif pp != pathp:
                return None

        return params


router = Router()


# ============================================
# HELPER FUNCTIONS
# ============================================

def json_response(data, status=200):
    """Create JSON response"""
    headers = Headers.new({"Content-Type": "application/json"}.items())
    body = json.dumps(data)
    return Response.new(body, status=status, headers=headers)


def error_response(message, status=400):
    """Create error response"""
    return json_response({
        "success": False,
        "error": message
    }, status=status)


def success_response(data=None, status=200):
    """Create success response"""
    return json_response({
        "success": True,
        "data": data
    }, status=status)


async def get_json_body(request):
    """Parse JSON request body"""
    try:
        text = await request.text()
        return json.loads(text)
    except Exception:
        return None


def get_query_params(request):
    """Parse query parameters"""
    url = URL.new(request.url)
    params = {}
    for entry in url.searchParams.entries():
        params[entry[0]] = entry[1]
    return params


# ============================================
# ROUTE HANDLERS
# ============================================

@router.get("/")
async def handle_index(request, env, params):
    """Index route"""
    return Response.new("Python Worker API v1.0")


@router.get("/health")
async def handle_health(request, env, params):
    """Health check"""
    return json_response({
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "numpy_available": HAS_NUMPY
    })


# ============================================
# USER CRUD HANDLERS
# ============================================

@router.get("/api/users")
async def handle_list_users(request, env, params):
    """List users with pagination"""
    query = get_query_params(request)
    page = int(query.get("page", 1))
    limit = min(int(query.get("limit", 10)), 100)
    offset = (page - 1) * limit

    db = env.DB

    # Get users
    result = await db.prepare(
        "SELECT * FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?"
    ).bind(limit, offset).all()

    # Get total count
    count_result = await db.prepare(
        "SELECT COUNT(*) as count FROM users"
    ).first()

    total = count_result["count"] if count_result else 0

    return json_response({
        "data": result.results,
        "page": page,
        "limit": limit,
        "total": total
    })


@router.post("/api/users")
async def handle_create_user(request, env, params):
    """Create a new user"""
    body = await get_json_body(request)

    if not body:
        return error_response("Invalid JSON body", 400)

    # Validate
    name = body.get("name", "").strip()
    email = body.get("email", "").strip().lower()

    if not name:
        return error_response("Name is required", 400)

    if not email or "@" not in email:
        return error_response("Valid email is required", 400)

    db = env.DB

    # Check for existing email
    existing = await db.prepare(
        "SELECT id FROM users WHERE email = ?"
    ).bind(email).first()

    if existing:
        return error_response("Email already exists", 409)

    # Create user
    user_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()

    await db.prepare(
        "INSERT INTO users (id, name, email, created_at) VALUES (?, ?, ?, ?)"
    ).bind(user_id, name, email, now).run()

    user = {
        "id": user_id,
        "name": name,
        "email": email,
        "created_at": now
    }

    return success_response(user, 201)


@router.get("/api/users/:id")
async def handle_get_user(request, env, params):
    """Get user by ID"""
    user_id = params["id"]
    db = env.DB

    user = await db.prepare(
        "SELECT * FROM users WHERE id = ?"
    ).bind(user_id).first()

    if not user:
        return error_response("User not found", 404)

    return success_response(user)


@router.put("/api/users/:id")
async def handle_update_user(request, env, params):
    """Update user"""
    user_id = params["id"]
    db = env.DB

    # Check if user exists
    user = await db.prepare(
        "SELECT * FROM users WHERE id = ?"
    ).bind(user_id).first()

    if not user:
        return error_response("User not found", 404)

    body = await get_json_body(request)
    if not body:
        return error_response("Invalid JSON body", 400)

    # Build update
    updates = []
    values = []

    if "name" in body:
        name = body["name"].strip()
        if not name:
            return error_response("Name cannot be empty", 400)
        updates.append("name = ?")
        values.append(name)
        user["name"] = name

    if "email" in body:
        email = body["email"].strip().lower()
        if "@" not in email:
            return error_response("Invalid email", 400)
        updates.append("email = ?")
        values.append(email)
        user["email"] = email

    if not updates:
        return success_response(user)

    values.append(user_id)

    await db.prepare(
        f"UPDATE users SET {', '.join(updates)} WHERE id = ?"
    ).bind(*values).run()

    return success_response(user)


@router.delete("/api/users/:id")
async def handle_delete_user(request, env, params):
    """Delete user"""
    user_id = params["id"]
    db = env.DB

    result = await db.prepare(
        "DELETE FROM users WHERE id = ?"
    ).bind(user_id).run()

    if result.meta.changes == 0:
        return error_response("User not found", 404)

    return success_response()


# ============================================
# KV CACHE HANDLERS
# ============================================

@router.get("/api/cached/:key")
async def handle_cache_get(request, env, params):
    """Get cached value"""
    key = params["key"]
    kv = env.CACHE

    value = await kv.get(key)

    if value is None:
        return error_response("Not found", 404)

    return Response.new(value)


@router.put("/api/cached/:key")
async def handle_cache_set(request, env, params):
    """Set cached value with 1 hour TTL"""
    key = params["key"]
    kv = env.CACHE

    body = await request.text()

    await kv.put(key, body, expirationTtl=3600)

    return Response.new("Cached")


# ============================================
# R2 STORAGE HANDLERS
# ============================================

@router.get("/api/files/:key")
async def handle_file_get(request, env, params):
    """Get file from R2"""
    key = params["key"]
    bucket = env.STORAGE

    obj = await bucket.get(key)

    if not obj:
        return error_response("Not found", 404)

    body = await obj.arrayBuffer()
    content_type = obj.httpMetadata.contentType or "application/octet-stream"

    headers = Headers.new({"Content-Type": content_type}.items())
    return Response.new(body, headers=headers)


@router.put("/api/files/:key")
async def handle_file_upload(request, env, params):
    """Upload file to R2"""
    key = params["key"]
    bucket = env.STORAGE

    content_type = request.headers.get("Content-Type") or "application/octet-stream"
    body = await request.arrayBuffer()

    await bucket.put(key, body, httpMetadata={"contentType": content_type})

    return Response.new("Uploaded")


# ============================================
# DATA PROCESSING (NumPy)
# ============================================

@router.post("/api/compute/statistics")
async def handle_statistics(request, env, params):
    """Compute statistics on numeric data"""
    if not HAS_NUMPY:
        return error_response("NumPy not available", 500)

    body = await get_json_body(request)

    if not body:
        return error_response("Invalid JSON body", 400)

    data = body.get("data", [])

    if not data or not isinstance(data, list):
        return error_response("Data array is required", 400)

    try:
        arr = np.array(data, dtype=np.float64)

        stats = {
            "count": len(arr),
            "sum": float(np.sum(arr)),
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

        return success_response(stats)

    except Exception as e:
        return error_response(f"Computation error: {str(e)}", 400)


@router.post("/api/compute/matrix")
async def handle_matrix(request, env, params):
    """Matrix operations"""
    if not HAS_NUMPY:
        return error_response("NumPy not available", 500)

    body = await get_json_body(request)

    if not body:
        return error_response("Invalid JSON body", 400)

    operation = body.get("operation")

    try:
        if operation == "multiply":
            a = np.array(body["a"])
            b = np.array(body["b"])
            result = np.dot(a, b).tolist()
        elif operation == "add":
            a = np.array(body["a"])
            b = np.array(body["b"])
            result = (a + b).tolist()
        elif operation == "inverse":
            a = np.array(body["a"])
            result = np.linalg.inv(a).tolist()
        elif operation == "determinant":
            a = np.array(body["a"])
            result = float(np.linalg.det(a))
        elif operation == "eigenvalues":
            a = np.array(body["a"])
            eigenvalues, _ = np.linalg.eig(a)
            result = eigenvalues.tolist()
        else:
            return error_response(f"Unknown operation: {operation}", 400)

        return success_response({"result": result, "operation": operation})

    except Exception as e:
        return error_response(f"Matrix error: {str(e)}", 400)


@router.post("/api/compute/normalize")
async def handle_normalize(request, env, params):
    """Normalize data to 0-1 range"""
    if not HAS_NUMPY:
        return error_response("NumPy not available", 500)

    body = await get_json_body(request)

    if not body:
        return error_response("Invalid JSON body", 400)

    data = body.get("data", [])

    if not data:
        return error_response("Data array is required", 400)

    try:
        arr = np.array(data, dtype=np.float64)
        min_val = np.min(arr)
        max_val = np.max(arr)

        if max_val == min_val:
            normalized = np.zeros_like(arr).tolist()
        else:
            normalized = ((arr - min_val) / (max_val - min_val)).tolist()

        return success_response({
            "normalized": normalized,
            "original_min": float(min_val),
            "original_max": float(max_val)
        })

    except Exception as e:
        return error_response(f"Normalization error: {str(e)}", 400)


# ============================================
# ML INFERENCE (Simple Example)
# ============================================

class SimpleLinearModel:
    """Simple linear regression model"""

    def __init__(self, weights, bias):
        self.weights = weights
        self.bias = bias

    def predict(self, features):
        """Make prediction"""
        if HAS_NUMPY:
            return float(np.dot(self.weights, features) + self.bias)
        else:
            return sum(w * f for w, f in zip(self.weights, features)) + self.bias


# Pre-trained model (would typically load from KV)
MODEL = SimpleLinearModel([0.5, 0.3, 0.2], 0.1)


@router.post("/api/predict")
async def handle_predict(request, env, params):
    """Run ML prediction"""
    body = await get_json_body(request)

    if not body:
        return error_response("Invalid JSON body", 400)

    features = body.get("features", [])

    if len(features) != 3:
        return error_response("Expected 3 features", 400)

    try:
        prediction = MODEL.predict(features)

        return success_response({
            "prediction": prediction,
            "features": features
        })

    except Exception as e:
        return error_response(f"Prediction error: {str(e)}", 400)


# ============================================
# MAIN ENTRY POINT
# ============================================

async def on_fetch(request, env):
    """Main fetch handler"""
    try:
        url = URL.new(request.url)
        path = url.pathname
        method = request.method

        # Match route
        handler, params = router.match(method, path)

        if handler:
            return await handler(request, env, params)

        # 404 Not Found
        return error_response(f"Route not found: {method} {path}", 404)

    except Exception as e:
        # 500 Internal Server Error
        print(f"Error: {e}")
        return error_response("Internal server error", 500)
