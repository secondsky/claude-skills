# FastMCP - Complete Error Catalog
## All 25 Common Errors with Solutions

This document contains comprehensive error prevention knowledge for FastMCP development. Use this as a reference when troubleshooting issues.

**Quick Jump to Top 5 Most Common:**
1. [Missing Server Object](#error-1-missing-server-object)
2. [Async/Await Confusion](#error-2-asyncawait-confusion)
3. [Context Not Injected](#error-3-context-not-injected)
4. [Storage Backend Not Configured](#error-16-storage-backend-not-configured)
5. [Circular Import Errors](#error-13-circular-import-errors)

---

## Error 1: Missing Server Object

**Error:**
```
RuntimeError: No server object found at module level
```

**Cause:** Server object not exported at module level (FastMCP Cloud requirement)

**Solution:**
```python
# ❌ WRONG
def create_server():
    return FastMCP("server")

# ✅ CORRECT
mcp = FastMCP("server")  # At module level
```

**Source:** FastMCP Cloud documentation, deployment failures

---

## Error 2: Async/Await Confusion

**Error:**
```
RuntimeError: no running event loop
TypeError: object coroutine can't be used in 'await' expression
```

**Cause:** Mixing sync/async incorrectly

**Solution:**
```python
# ❌ WRONG: Sync function calling async
@mcp.tool()
def bad_tool():
    result = await async_function()  # Error!

# ✅ CORRECT: Async tool
@mcp.tool()
async def good_tool():
    result = await async_function()
    return result

# ✅ CORRECT: Sync tool with sync code
@mcp.tool()
def sync_tool():
    return "Hello"
```

**Source:** GitHub issues #156, #203

---

## Error 3: Context Not Injected

**Error:**
```
TypeError: missing 1 required positional argument: 'context'
```

**Cause:** Missing `Context` type annotation for context parameter

**Solution:**
```python
from fastmcp import Context

# ❌ WRONG: No type hint
@mcp.tool()
async def bad_tool(context):  # Missing type!
    await context.report_progress(...)

# ✅ CORRECT: Proper type hint
@mcp.tool()
async def good_tool(context: Context):
    await context.report_progress(0, 100, "Starting")
```

**Source:** FastMCP v2 migration guide

---

## Error 4: Resource URI Syntax

**Error:**
```
ValueError: Invalid resource URI: missing scheme
```

**Cause:** Resource URI missing scheme prefix

**Solution:**
```python
# ❌ WRONG: Missing scheme
@mcp.resource("config")
def get_config(): pass

# ✅ CORRECT: Include scheme
@mcp.resource("data://config")
def get_config(): pass

# ✅ Valid schemes
@mcp.resource("file://config.json")
@mcp.resource("api://status")
@mcp.resource("info://health")
```

**Source:** MCP Protocol specification

---

## Error 5: Resource Template Parameter Mismatch

**Error:**
```
TypeError: get_user() missing 1 required positional argument: 'user_id'
```

**Cause:** Function parameter names don't match URI template

**Solution:**
```python
# ❌ WRONG: Parameter name mismatch
@mcp.resource("user://{user_id}/profile")
def get_user(id: str):  # Wrong name!
    pass

# ✅ CORRECT: Matching names
@mcp.resource("user://{user_id}/profile")
def get_user(user_id: str):  # Matches {user_id}
    return {"id": user_id}
```

**Source:** FastMCP patterns documentation

---

## Error 6: Pydantic Validation Error

**Error:**
```
ValidationError: value is not a valid integer
```

**Cause:** Type hints don't match provided data

**Solution:**
```python
from pydantic import BaseModel, Field

# ✅ Use Pydantic models for complex validation
class SearchParams(BaseModel):
    query: str = Field(min_length=1, max_length=100)
    limit: int = Field(default=10, ge=1, le=100)

@mcp.tool()
async def search(params: SearchParams) -> dict:
    # Validation automatic
    return await perform_search(params.query, params.limit)
```

**Source:** Pydantic documentation, FastMCP examples

---

## Error 7: Transport/Protocol Mismatch

**Error:**
```
ConnectionError: Server using different transport
```

**Cause:** Client and server using incompatible transports

**Solution:**
```python
# Server using stdio (default)
mcp.run()  # or mcp.run(transport="stdio")

# Client configuration must match
{
  "command": "python",
  "args": ["server.py"]
}

# OR for HTTP:
mcp.run(transport="http", port=8000)

# Client:
{
  "url": "http://localhost:8000/mcp",
  "transport": "http"
}
```

**Source:** MCP transport specification

---

## Error 8: Import Errors (Editable Package)

**Error:**
```
ModuleNotFoundError: No module named 'my_package'
```

**Cause:** Package not properly installed in editable mode

**Solution:**
```bash
# ✅ Install in editable mode
pip install -e .

# ✅ Or use absolute imports
from src.tools import my_tool

# ✅ Or add to PYTHONPATH
export PYTHONPATH="${PYTHONPATH}:/path/to/project"
```

**Source:** Python packaging documentation

---

## Error 9: Deprecation Warnings

**Error:**
```
DeprecationWarning: 'mcp.settings' is deprecated, use global Settings instead
```

**Cause:** Using old FastMCP v1 API

**Solution:**
```python
# ❌ OLD: FastMCP v1
from fastmcp import FastMCP
mcp = FastMCP()
api_key = mcp.settings.get("API_KEY")

# ✅ NEW: FastMCP v2
import os
api_key = os.getenv("API_KEY")
```

**Source:** FastMCP v2 migration guide

---

## Error 10: Port Already in Use

**Error:**
```
OSError: [Errno 48] Address already in use
```

**Cause:** Port 8000 already occupied

**Solution:**
```bash
# ✅ Use different port
python server.py --transport http --port 8001

# ✅ Or kill process on port
lsof -ti:8000 | xargs kill -9
```

**Source:** Common networking issue

---

## Error 11: Schema Generation Failures

**Error:**
```
TypeError: Object of type 'ndarray' is not JSON serializable
```

**Cause:** Unsupported type hints (NumPy arrays, custom classes)

**Solution:**
```python
# ❌ WRONG: NumPy array
import numpy as np

@mcp.tool()
def bad_tool() -> np.ndarray:  # Not JSON serializable
    return np.array([1, 2, 3])

# ✅ CORRECT: Use JSON-compatible types
@mcp.tool()
def good_tool() -> list[float]:
    return [1.0, 2.0, 3.0]

# ✅ Or convert to dict
@mcp.tool()
def array_tool() -> dict:
    data = np.array([1, 2, 3])
    return {"values": data.tolist()}
```

**Source:** JSON serialization requirements

---

## Error 12: JSON Serialization

**Error:**
```
TypeError: Object of type 'datetime' is not JSON serializable
```

**Cause:** Returning non-JSON-serializable objects

**Solution:**
```python
from datetime import datetime

# ❌ WRONG: Return datetime object
@mcp.tool()
def bad_tool() -> dict:
    return {"timestamp": datetime.now()}  # Not serializable

# ✅ CORRECT: Convert to string
@mcp.tool()
def good_tool() -> dict:
    return {"timestamp": datetime.now().isoformat()}

# ✅ Use helper function
def make_serializable(obj):
    """Convert object to JSON-serializable format."""
    if isinstance(obj, datetime):
        return obj.isoformat()
    elif isinstance(obj, bytes):
        return obj.decode('utf-8')
    # Add more conversions as needed
    return obj
```

**Source:** JSON specification

---

## Error 13: Circular Import Errors

**Error:**
```
ImportError: cannot import name 'X' from partially initialized module
```

**Cause:** Modules import from each other creating circular dependency (common in cloud deployment)

**Solution:**
```python
# ❌ WRONG: Factory function in __init__.py
# shared/__init__.py
_client = None
def get_api_client():
    from .api_client import APIClient  # Circular!
    return APIClient()

# shared/monitoring.py
from . import get_api_client  # Creates circle

# ✅ CORRECT: Direct imports
# shared/__init__.py
from .api_client import APIClient
from .cache import CacheManager

# shared/monitoring.py
from .api_client import APIClient
client = APIClient()  # Create directly

# ✅ ALTERNATIVE: Lazy import
# shared/monitoring.py
def get_client():
    from .api_client import APIClient
    return APIClient()
```

**Source:** Production cloud deployment errors, Python import system

---

## Error 14: Python Version Compatibility

**Error:**
```
DeprecationWarning: datetime.utcnow() is deprecated
```

**Cause:** Using deprecated Python 3.12+ methods

**Solution:**
```python
# ❌ DEPRECATED (Python 3.12+)
from datetime import datetime
timestamp = datetime.utcnow()

# ✅ CORRECT: Future-proof
from datetime import datetime, timezone
timestamp = datetime.now(timezone.utc)
```

**Source:** Python 3.12 release notes

---

## Error 15: Import-Time Execution

**Error:**
```
RuntimeError: Event loop is closed
```

**Cause:** Creating async resources at module import time

**Solution:**
```python
# ❌ WRONG: Module-level async execution
import asyncpg
connection = asyncpg.connect('postgresql://...')  # Runs at import!

# ✅ CORRECT: Lazy initialization
import asyncpg

class Database:
    connection = None

    @classmethod
    async def connect(cls):
        if cls.connection is None:
            cls.connection = await asyncpg.connect('postgresql://...')
        return cls.connection

# Usage: connection happens when needed, not at import
@mcp.tool()
async def get_users():
    conn = await Database.connect()
    return await conn.fetch("SELECT * FROM users")
```

**Source:** Async event loop management, cloud deployment requirements

---

## Error 16: Storage Backend Not Configured

**Error:**
```
RuntimeError: OAuth tokens lost on restart
ValueError: Cache not persisting across server instances
```

**Cause:** Using default memory storage in production without persistence

**Solution:**
```python
# ❌ WRONG: Memory storage in production
mcp = FastMCP("Production Server")  # Tokens lost on restart!

# ✅ CORRECT: Use disk or Redis storage
from key_value.stores import DiskStore, RedisStore
from key_value.encryption import FernetEncryptionWrapper
from cryptography.fernet import Fernet

# Disk storage (single instance)
mcp = FastMCP(
    "Production Server",
    storage=FernetEncryptionWrapper(
        key_value=DiskStore(path="/var/lib/mcp/storage"),
        fernet=Fernet(os.getenv("STORAGE_ENCRYPTION_KEY"))
    )
)

# Redis storage (multi-instance)
mcp = FastMCP(
    "Production Server",
    storage=FernetEncryptionWrapper(
        key_value=RedisStore(
            host=os.getenv("REDIS_HOST"),
            password=os.getenv("REDIS_PASSWORD")
        ),
        fernet=Fernet(os.getenv("STORAGE_ENCRYPTION_KEY"))
    )
)
```

**Source:** FastMCP v2.13.0 storage backends documentation

---

## Error 17: Lifespan Not Passed to ASGI App

**Error:**
```
RuntimeError: Database connection never initialized
Warning: MCP lifespan hooks not running
```

**Cause:** Using FastMCP with FastAPI/Starlette without passing lifespan

**Solution:**
```python
from fastapi import FastAPI
from fastmcp import FastMCP

# ❌ WRONG: Lifespan not passed
mcp = FastMCP("My Server", lifespan=my_lifespan)
app = FastAPI()  # MCP lifespan won't run!

# ✅ CORRECT: Pass MCP lifespan to parent app
mcp = FastMCP("My Server", lifespan=my_lifespan)
app = FastAPI(lifespan=mcp.lifespan)
```

**Source:** FastMCP v2.13.0 breaking changes, ASGI integration guide

---

## Error 18: Middleware Execution Order Error

**Error:**
```
RuntimeError: Rate limit not checked before caching
AttributeError: Context state not available in middleware
```

**Cause:** Incorrect middleware ordering (order matters!)

**Solution:**
```python
# ❌ WRONG: Cache before rate limiting
mcp.add_middleware(ResponseCachingMiddleware())
mcp.add_middleware(RateLimitingMiddleware())  # Too late!

# ✅ CORRECT: Rate limit before cache
mcp.add_middleware(ErrorHandlingMiddleware())  # First: catch errors
mcp.add_middleware(TimingMiddleware())         # Second: time requests
mcp.add_middleware(LoggingMiddleware())        # Third: log
mcp.add_middleware(RateLimitingMiddleware())   # Fourth: check limits
mcp.add_middleware(ResponseCachingMiddleware()) # Last: cache
```

**Source:** FastMCP middleware documentation, best practices

---

## Error 19: Circular Middleware Dependencies

**Error:**
```
RecursionError: maximum recursion depth exceeded
RuntimeError: Middleware loop detected
```

**Cause:** Middleware calling `self.next()` incorrectly or circular dependencies

**Solution:**
```python
# ❌ WRONG: Not calling next() or calling incorrectly
class BadMiddleware(BaseMiddleware):
    async def on_call_tool(self, tool_name, arguments, context):
        # Forgot to call next()!
        return {"error": "blocked"}

# ✅ CORRECT: Always call next() to continue chain
class GoodMiddleware(BaseMiddleware):
    async def on_call_tool(self, tool_name, arguments, context):
        # Do preprocessing
        print(f"Before: {tool_name}")

        # MUST call next() to continue
        result = await self.next(tool_name, arguments, context)

        # Do postprocessing
        print(f"After: {tool_name}")
        return result
```

**Source:** FastMCP middleware system documentation

---

## Error 20: Import vs Mount Confusion

**Error:**
```
RuntimeError: Subserver changes not reflected
ValueError: Unexpected tool namespacing
```

**Cause:** Using `import_server()` when `mount()` was needed (or vice versa)

**Solution:**
```python
# ❌ WRONG: Using import when you want dynamic updates
main_server.import_server(subserver)
# Later: changes to subserver won't appear in main_server

# ✅ CORRECT: Use mount() for dynamic composition
main_server.mount(subserver, prefix="sub")
# Changes to subserver are immediately visible

# ❌ WRONG: Using mount when you want static bundle
main_server.mount(third_party_server, prefix="vendor")
# Runtime overhead for static components

# ✅ CORRECT: Use import_server() for static bundles
main_server.import_server(third_party_server)
# One-time copy, no runtime delegation
```

**Source:** FastMCP server composition patterns

---

## Error 21: Resource Prefix Format Mismatch

**Error:**
```
ValueError: Resource not found: resource://api/users
ValueError: Unexpected resource URI format
```

**Cause:** Using wrong resource prefix format (path vs protocol)

**Solution:**
```python
# Path format (default since v2.4.0)
main_server.mount(api_server, prefix="api")
# Resources: resource://api/users

# ❌ WRONG: Expecting protocol format
# resource://api+users (doesn't exist)

# ✅ CORRECT: Use path format
uri = "resource://api/users"

# OR explicitly set protocol format (legacy)
main_server.mount(
    api_server,
    prefix="api",
    resource_prefix_format="protocol"
)
# Resources: api+resource://users
```

**Source:** FastMCP v2.4.0+ resource prefix changes

---

## Error 22: OAuth Proxy Without Consent Screen

**Error:**
```
SecurityWarning: Authorization bypass possible
RuntimeError: Confused deputy attack vector
```

**Cause:** OAuth Proxy configured without consent screen (security vulnerability)

**Solution:**
```python
# ❌ WRONG: No consent screen (security risk!)
auth = OAuthProxy(
    jwt_signing_key=os.getenv("JWT_KEY"),
    upstream_authorization_endpoint="...",
    upstream_token_endpoint="...",
    # Missing: enable_consent_screen
)

# ✅ CORRECT: Enable consent screen
auth = OAuthProxy(
    jwt_signing_key=os.getenv("JWT_KEY"),
    upstream_authorization_endpoint="...",
    upstream_token_endpoint="...",
    enable_consent_screen=True  # Prevents bypass attacks
)
```

**Source:** FastMCP v2.13.0 OAuth security enhancements, RFC 7662

---

## Error 23: Missing JWT Signing Key in Production

**Error:**
```
ValueError: JWT signing key required for OAuth Proxy
RuntimeError: Cannot issue tokens without signing key
```

**Cause:** OAuth Proxy missing `jwt_signing_key` in production

**Solution:**
```python
# ❌ WRONG: No JWT signing key
auth = OAuthProxy(
    upstream_authorization_endpoint="...",
    upstream_token_endpoint="...",
    # Missing: jwt_signing_key
)

# ✅ CORRECT: Provide signing key from environment
import secrets

# Generate once (in setup):
# signing_key = secrets.token_urlsafe(32)
# Store in: FASTMCP_JWT_SIGNING_KEY environment variable

auth = OAuthProxy(
    jwt_signing_key=os.environ["FASTMCP_JWT_SIGNING_KEY"],
    client_storage=encrypted_storage,
    upstream_authorization_endpoint="...",
    upstream_token_endpoint="...",
    upstream_client_id=os.getenv("OAUTH_CLIENT_ID"),
    upstream_client_secret=os.getenv("OAUTH_CLIENT_SECRET")
)
```

**Source:** OAuth Proxy production requirements

---

## Error 24: Icon Data URI Format Error

**Error:**
```
ValueError: Invalid data URI format
TypeError: Icon URL must be string or data URI
```

**Cause:** Incorrectly formatted data URI for icons

**Solution:**
```python
from fastmcp import Icon, Image

# ❌ WRONG: Invalid data URI
icon = Icon(url="base64,iVBORw0KG...")  # Missing data:image/png;

# ✅ CORRECT: Use Image utility
icon = Icon.from_file("/path/to/icon.png", size="medium")

# ✅ CORRECT: Manual data URI
import base64

with open("/path/to/icon.png", "rb") as f:
    image_data = base64.b64encode(f.read()).decode()
    data_uri = f"data:image/png;base64,{image_data}"
    icon = Icon(url=data_uri, size="medium")
```

**Source:** FastMCP icons documentation, Data URI specification

---

## Error 25: Lifespan Behavior Change (v2.13.0)

**Error:**
```
Warning: Lifespan runs per-server, not per-session
RuntimeError: Resources initialized multiple times
```

**Cause:** Expecting v2.12 lifespan behavior (per-session) in v2.13.0+ (per-server)

**Solution:**
```python
# v2.12.0 and earlier: Lifespan ran per client session
# v2.13.0+: Lifespan runs once per server instance

# ✅ CORRECT: v2.13.0+ pattern (per-server)
@asynccontextmanager
async def app_lifespan(server: FastMCP):
    """Runs ONCE when server starts, not per client session."""
    db = await Database.connect()
    print("Server starting - runs once")

    try:
        yield {"db": db}
    finally:
        await db.disconnect()
        print("Server stopping - runs once")

mcp = FastMCP("My Server", lifespan=app_lifespan)

# For per-session logic, use middleware instead:
class SessionMiddleware(BaseMiddleware):
    async def on_message(self, message, context):
        # Runs per client message
        session_id = context.fastmcp_context.get_state("session_id")
        if not session_id:
            session_id = str(uuid.uuid4())
            context.fastmcp_context.set_state("session_id", session_id)

        return await self.next(message, context)
```

**Source:** FastMCP v2.13.0 release notes, breaking changes documentation

---

## Additional Resources

- [FastMCP Documentation](https://github.com/jlowin/fastmcp)
- [MCP Protocol Specification](https://modelcontextprotocol.io)
- [FastMCP GitHub Issues](https://github.com/jlowin/fastmcp/issues)
- [Production Patterns](./production-patterns.md)
- [Storage Guide](./storage-guide.md)

**Last Updated**: 2025-11-04
