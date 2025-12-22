# FastMCP Cloud Deployment Guide

Complete guide for deploying FastMCP servers to FastMCP Cloud.

## Critical Requirements

**❗️ MUST HAVE** for FastMCP Cloud:

1. **Module-level server object** named `mcp`, `server`, or `app`
2. **PyPI dependencies only** in `requirements.txt`
3. **Public GitHub repository** (or accessible to FastMCP Cloud)
4. **Environment variables** for configuration (no hardcoded secrets)

## Cloud-Ready Server Pattern

```python
# server.py
from fastmcp import FastMCP
import os

# ✅ CORRECT: Module-level export
mcp = FastMCP("production-server")

# ✅ Use environment variables
API_KEY = os.getenv("API_KEY")
DATABASE_URL = os.getenv("DATABASE_URL")

@mcp.tool()
async def production_tool(data: str) -> dict:
    if not API_KEY:
        return {"error": "API_KEY not configured"}
    return {"status": "success", "data": data}

if __name__ == "__main__":
    mcp.run()
```

## Common Anti-Patterns

### ❌ WRONG: Function-Wrapped Server

```python
def create_server():
    mcp = FastMCP("server")
    return mcp

if __name__ == "__main__":
    server = create_server()  # Too late for cloud!
    server.run()
```

### ✅ CORRECT: Factory with Module Export

```python
def create_server() -> FastMCP:
    mcp = FastMCP("server")
    # Complex setup logic here
    return mcp

# Export at module level
mcp = create_server()

if __name__ == "__main__":
    mcp.run()
```

## Deployment Steps

### 1. Prepare Repository

```bash
# Initialize git
git init

# Add files
git add .

# Commit
git commit -m "Initial MCP server"

# Create GitHub repo
gh repo create my-mcp-server --public

# Push
git push -u origin main
```

### 2. Deploy to FastMCP Cloud

1. Visit https://fastmcp.cloud
2. Sign in with GitHub
3. Click "Create Project"
4. Select your repository
5. Configure:
   - **Server Name**: Your project name
   - **Entrypoint**: `server.py`
   - **Environment Variables**: Add all needed variables

### 3. Configure Environment Variables

In FastMCP Cloud dashboard, add:
- `API_KEY`
- `DATABASE_URL`
- `CACHE_TTL`
- Any custom variables

### 4. Access Your Server

- **URL**: `https://your-project.fastmcp.app/mcp`
- **Auto-deploy**: Pushes to main branch auto-deploy
- **PR Previews**: Pull requests get preview deployments

## Project Structure Requirements

### Minimal Structure

```
my-mcp-server/
├── server.py          # Main entry point (required)
├── requirements.txt   # PyPI dependencies (required)
├── .env              # Local dev only (git-ignored)
├── .gitignore        # Must ignore .env
└── README.md         # Documentation (recommended)
```

### Production Structure

```
my-mcp-server/
├── src/
│   ├── server.py         # Main entry point
│   ├── utils.py          # Self-contained utilities
│   └── tools/           # Tool modules
│       ├── __init__.py
│       └── api_tools.py
├── requirements.txt
├── .env.example         # Template for .env
├── .gitignore
└── README.md
```

## Requirements.txt Rules

### ✅ ALLOWED: PyPI Packages

```txt
fastmcp>=2.12.0
httpx>=0.27.0
python-dotenv>=1.0.0
pydantic>=2.0.0
```

### ❌ NOT ALLOWED: Non-PyPI Dependencies

```txt
# Don't use these in cloud:
git+https://github.com/user/repo.git
-e ./local-package
./wheels/package.whl
```

## Environment Variables Best Practices

### ✅ GOOD: Environment-based Configuration

```python
import os

class Config:
    API_KEY = os.getenv("API_KEY", "")
    BASE_URL = os.getenv("BASE_URL", "https://api.example.com")
    DEBUG = os.getenv("DEBUG", "false").lower() == "true"

    @classmethod
    def validate(cls):
        if not cls.API_KEY:
            raise ValueError("API_KEY is required")
```

### ❌ BAD: Hardcoded Values

```python
# Never do this in cloud:
API_KEY = "sk-1234567890"  # Exposed in repository!
DATABASE_URL = "postgresql://user:pass@host/db"  # Insecure!
```

## Avoiding Circular Imports

**Critical for cloud deployment!**

### ❌ WRONG: Factory Function in `__init__.py`

```python
# shared/__init__.py
def get_api_client():
    from .api_client import APIClient  # Circular import risk
    return APIClient()

# shared/monitoring.py
from . import get_api_client  # Creates circle!
```

### ✅ CORRECT: Direct Imports

```python
# shared/__init__.py
from .api_client import APIClient
from .cache import CacheManager

# shared/monitoring.py
from .api_client import APIClient
client = APIClient()  # Create directly
```

## Testing Before Deployment

### Local Testing

```bash
# Test with stdio (default)
fastmcp dev server.py

# Test with HTTP
python server.py --transport http --port 8000
```

### Pre-Deployment Checklist

- [ ] Server object exported at module level
- [ ] Only PyPI dependencies in requirements.txt
- [ ] No hardcoded secrets (all in environment variables)
- [ ] `.env` file in `.gitignore`
- [ ] No circular imports
- [ ] No import-time async execution
- [ ] Works with `fastmcp dev server.py`
- [ ] Git repository committed and pushed
- [ ] All required environment variables documented

## Monitoring Deployment

### Check Deployment Logs

FastMCP Cloud provides:
- Build logs
- Runtime logs
- Error logs

### Health Check Endpoint

Add a health check resource:

```python
@mcp.resource("health://status")
async def health_check() -> dict:
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0"
    }
```

### Common Deployment Errors

1. **"No server object found"**
   - Fix: Export server at module level

2. **"Module not found"**
   - Fix: Use only PyPI packages

3. **"Import error: circular dependency"**
   - Fix: Avoid factory functions in `__init__.py`

4. **"Environment variable not set"**
   - Fix: Add variables in FastMCP Cloud dashboard

## Continuous Deployment

FastMCP Cloud automatically deploys when you push to main:

```bash
# Make changes
git add .
git commit -m "Add new feature"
git push

# Deployment happens automatically!
# Check status at fastmcp.cloud
```

## Rollback Strategy

If deployment fails:

```bash
# Revert to previous commit
git revert HEAD
git push

# Or reset to specific commit
git reset --hard <commit-hash>
git push --force  # Use with caution!
```

## Resources

- **FastMCP Cloud**: https://fastmcp.cloud
- **FastMCP GitHub**: https://github.com/jlowin/fastmcp
- **Deployment Docs**: Check FastMCP Cloud documentation
