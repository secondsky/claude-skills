# FastMCP Integration Patterns Reference

Quick reference for API integration patterns with FastMCP.

## Pattern 1: Manual API Integration

Best for simple APIs or when you need fine control.

```python
import httpx
from fastmcp import FastMCP

mcp = FastMCP("API Integration")

# Reusable client
client = httpx.AsyncClient(
    base_url="https://api.example.com",
    headers={"Authorization": f"Bearer {API_KEY}"},
    timeout=30.0
)

@mcp.tool()
async def fetch_data(endpoint: str) -> dict:
    """Fetch from API."""
    response = await client.get(endpoint)
    response.raise_for_status()
    return response.json()
```

**Pros:**
- Full control over requests
- Easy to customize
- Simple to understand

**Cons:**
- Manual tool creation for each endpoint
- More boilerplate code

## Pattern 2: OpenAPI/Swagger Auto-Generation

Best for well-documented APIs with OpenAPI specs.

```python
from fastmcp import FastMCP
from fastmcp.server.openapi import RouteMap, MCPType
import httpx

# Load spec
spec = httpx.get("https://api.example.com/openapi.json").json()

# Create client
client = httpx.AsyncClient(
    base_url="https://api.example.com",
    headers={"Authorization": f"Bearer {API_KEY}"}
)

# Auto-generate server
mcp = FastMCP.from_openapi(
    openapi_spec=spec,
    client=client,
    name="API Server",
    route_maps=[
        # GET + params → Resource Templates
        RouteMap(
            methods=["GET"],
            pattern=r".*\{.*\}.*",
            mcp_type=MCPType.RESOURCE_TEMPLATE
        ),
        # GET no params → Resources
        RouteMap(
            methods=["GET"],
            mcp_type=MCPType.RESOURCE
        ),
        # POST/PUT/DELETE → Tools
        RouteMap(
            methods=["POST", "PUT", "PATCH", "DELETE"],
            mcp_type=MCPType.TOOL
        ),
    ]
)
```

**Pros:**
- Instant integration (minutes not hours)
- Auto-updates with spec changes
- No manual endpoint mapping

**Cons:**
- Requires OpenAPI/Swagger spec
- Less control over individual endpoints
- May include unwanted endpoints

## Pattern 3: FastAPI Conversion

Best for converting existing FastAPI applications.

```python
from fastapi import FastAPI
from fastmcp import FastMCP

# Existing FastAPI app
app = FastAPI()

@app.get("/users/{user_id}")
def get_user(user_id: int):
    return {"id": user_id, "name": "User"}

# Convert to MCP
mcp = FastMCP.from_fastapi(
    app=app,
    httpx_client_kwargs={
        "headers": {"Authorization": "Bearer token"}
    }
)
```

**Pros:**
- Reuse existing FastAPI code
- Minimal changes needed
- Familiar FastAPI patterns

**Cons:**
- FastAPI must be running separately
- Extra HTTP hop (slower)

## Route Mapping Strategies

### Strategy 1: By HTTP Method

```python
route_maps = [
    RouteMap(methods=["GET"], mcp_type=MCPType.RESOURCE),
    RouteMap(methods=["POST"], mcp_type=MCPType.TOOL),
    RouteMap(methods=["PUT", "PATCH"], mcp_type=MCPType.TOOL),
    RouteMap(methods=["DELETE"], mcp_type=MCPType.TOOL),
]
```

### Strategy 2: By Path Pattern

```python
route_maps = [
    # Admin endpoints → Exclude
    RouteMap(
        pattern=r"/admin/.*",
        mcp_type=MCPType.EXCLUDE
    ),
    # Internal → Exclude
    RouteMap(
        pattern=r"/internal/.*",
        mcp_type=MCPType.EXCLUDE
    ),
    # Health → Exclude
    RouteMap(
        pattern=r"/(health|healthz)",
        mcp_type=MCPType.EXCLUDE
    ),
    # Everything else
    RouteMap(mcp_type=MCPType.TOOL),
]
```

### Strategy 3: By Parameters

```python
route_maps = [
    # Has path parameters → Resource Template
    RouteMap(
        pattern=r".*\{[^}]+\}.*",
        mcp_type=MCPType.RESOURCE_TEMPLATE
    ),
    # No parameters → Static Resource or Tool
    RouteMap(
        methods=["GET"],
        mcp_type=MCPType.RESOURCE
    ),
    RouteMap(
        methods=["POST", "PUT", "DELETE"],
        mcp_type=MCPType.TOOL
    ),
]
```

## Authentication Patterns

### API Key Authentication

```python
client = httpx.AsyncClient(
    base_url="https://api.example.com",
    headers={"X-API-Key": os.getenv("API_KEY")}
)
```

### Bearer Token

```python
client = httpx.AsyncClient(
    base_url="https://api.example.com",
    headers={"Authorization": f"Bearer {os.getenv('API_TOKEN')}"}
)
```

### OAuth2 with Token Refresh

```python
class OAuth2Client:
    def __init__(self):
        self.access_token = None
        self.expires_at = None

    async def get_token(self) -> str:
        if not self.expires_at or datetime.now() > self.expires_at:
            await self.refresh_token()
        return self.access_token

    async def refresh_token(self):
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://auth.example.com/token",
                data={
                    "grant_type": "client_credentials",
                    "client_id": CLIENT_ID,
                    "client_secret": CLIENT_SECRET
                }
            )
            data = response.json()
            self.access_token = data["access_token"]
            self.expires_at = datetime.now() + timedelta(
                seconds=data["expires_in"] - 60
            )

oauth = OAuth2Client()

@mcp.tool()
async def authenticated_request(endpoint: str) -> dict:
    token = await oauth.get_token()
    async with httpx.AsyncClient() as client:
        response = await client.get(
            endpoint,
            headers={"Authorization": f"Bearer {token}"}
        )
        return response.json()
```

## Error Handling Patterns

### Basic Error Handling

```python
@mcp.tool()
async def safe_api_call(endpoint: str) -> dict:
    try:
        response = await client.get(endpoint)
        response.raise_for_status()
        return {"success": True, "data": response.json()}
    except httpx.HTTPStatusError as e:
        return {
            "success": False,
            "error": f"HTTP {e.response.status_code}",
            "message": e.response.text
        }
    except httpx.TimeoutException:
        return {"success": False, "error": "Request timeout"}
    except Exception as e:
        return {"success": False, "error": str(e)}
```

### Retry with Exponential Backoff

```python
async def retry_with_backoff(func, max_retries=3):
    delay = 1.0
    for attempt in range(max_retries):
        try:
            return await func()
        except (httpx.TimeoutException, httpx.NetworkError) as e:
            if attempt < max_retries - 1:
                await asyncio.sleep(delay)
                delay *= 2
            else:
                raise
```

## Caching Patterns

### Simple Time-Based Cache

```python
import time

class SimpleCache:
    def __init__(self, ttl=300):
        self.cache = {}
        self.timestamps = {}
        self.ttl = ttl

    def get(self, key: str):
        if key in self.cache:
            if time.time() - self.timestamps[key] < self.ttl:
                return self.cache[key]
        return None

    def set(self, key: str, value):
        self.cache[key] = value
        self.timestamps[key] = time.time()

cache = SimpleCache()

@mcp.tool()
async def cached_fetch(endpoint: str) -> dict:
    # Check cache
    cached = cache.get(endpoint)
    if cached:
        return {"data": cached, "from_cache": True}

    # Fetch from API
    data = await fetch_from_api(endpoint)
    cache.set(endpoint, data)

    return {"data": data, "from_cache": False}
```

## Rate Limiting Patterns

### Simple Rate Limiter

```python
from collections import deque
from datetime import datetime, timedelta

class RateLimiter:
    def __init__(self, max_requests: int, time_window: int):
        self.max_requests = max_requests
        self.time_window = timedelta(seconds=time_window)
        self.requests = deque()

    async def acquire(self):
        now = datetime.now()

        # Remove old requests
        while self.requests and now - self.requests[0] > self.time_window:
            self.requests.popleft()

        # Check limit
        if len(self.requests) >= self.max_requests:
            sleep_time = (self.requests[0] + self.time_window - now).total_seconds()
            await asyncio.sleep(sleep_time)
            return await self.acquire()

        self.requests.append(now)

limiter = RateLimiter(100, 60)  # 100 requests per minute

@mcp.tool()
async def rate_limited_call(endpoint: str) -> dict:
    await limiter.acquire()
    return await api_call(endpoint)
```

## Connection Pooling

### Singleton Client Pattern

```python
class APIClient:
    _instance = None

    @classmethod
    async def get_client(cls):
        if cls._instance is None:
            cls._instance = httpx.AsyncClient(
                base_url=API_BASE_URL,
                timeout=30.0,
                limits=httpx.Limits(
                    max_keepalive_connections=5,
                    max_connections=10
                )
            )
        return cls._instance

    @classmethod
    async def cleanup(cls):
        if cls._instance:
            await cls._instance.aclose()
            cls._instance = None

# Use in tools
@mcp.tool()
async def api_request(endpoint: str) -> dict:
    client = await APIClient.get_client()
    response = await client.get(endpoint)
    return response.json()
```

## Batch Request Patterns

### Parallel Batch Requests

```python
@mcp.tool()
async def batch_fetch(endpoints: list[str]) -> dict:
    """Fetch multiple endpoints in parallel."""
    async def fetch_one(endpoint: str):
        try:
            response = await client.get(endpoint)
            return {"endpoint": endpoint, "success": True, "data": response.json()}
        except Exception as e:
            return {"endpoint": endpoint, "success": False, "error": str(e)}

    results = await asyncio.gather(*[fetch_one(ep) for ep in endpoints])

    return {
        "total": len(endpoints),
        "successful": len([r for r in results if r["success"]]),
        "results": results
    }
```

## Webhook Patterns

### Webhook Receiver

```python
from fastapi import FastAPI, Request

app = FastAPI()

@app.post("/webhook")
async def handle_webhook(request: Request):
    data = await request.json()
    # Process webhook
    return {"status": "received"}

# Add to MCP server
mcp = FastMCP.from_fastapi(app)
```

## When to Use Each Pattern

| Pattern | Use When | Avoid When |
|---------|----------|------------|
| Manual Integration | Simple API, custom logic needed | API has 50+ endpoints |
| OpenAPI Auto-gen | Well-documented API, many endpoints | No OpenAPI spec available |
| FastAPI Conversion | Existing FastAPI app | Starting from scratch |
| Custom Route Maps | Need precise control | Simple use case |
| Connection Pooling | High-frequency requests | Single request needed |
| Caching | Expensive API calls, data rarely changes | Real-time data required |
| Rate Limiting | API has rate limits | No limits or internal API |

## Resources

- **FastMCP OpenAPI**: FastMCP.from_openapi documentation
- **FastAPI Integration**: FastMCP.from_fastapi documentation
- **HTTPX Docs**: https://www.python-httpx.org
- **OpenAPI Spec**: https://spec.openapis.org
