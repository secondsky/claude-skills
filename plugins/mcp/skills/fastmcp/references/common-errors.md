# FastMCP Common Errors Reference

Quick reference for the 15 most common FastMCP errors and their solutions.

## Error 1: Missing Server Object
**Error:** `RuntimeError: No server object found at module level`
**Fix:** Export server at module level: `mcp = FastMCP("name")`
**Why:** FastMCP Cloud requires module-level server object
**Source:** FastMCP Cloud documentation

## Error 2: Async/Await Confusion
**Error:** `RuntimeError: no running event loop`
**Fix:** Use `async def` for async operations, don't mix sync/async
**Example:** Use `await client.get()` not `client.get()`
**Source:** GitHub issues #156, #203

## Error 3: Context Not Injected
**Error:** `TypeError: missing required argument 'context'`
**Fix:** Add type hint: `async def tool(context: Context):`
**Why:** Type hint is required for context injection
**Source:** FastMCP v2 migration guide

## Error 4: Resource URI Syntax
**Error:** `ValueError: Invalid resource URI`
**Fix:** Include scheme: `@mcp.resource("data://config")`
**Valid schemes:** `data://`, `file://`, `info://`, `api://`
**Source:** MCP Protocol specification

## Error 5: Resource Template Parameter Mismatch
**Error:** `TypeError: missing positional argument`
**Fix:** Match parameter names: `user://{user_id}` → `def get_user(user_id: str)`
**Why:** Parameter names must exactly match URI template
**Source:** FastMCP patterns documentation

## Error 6: Pydantic Validation Error
**Error:** `ValidationError: value is not valid`
**Fix:** Ensure type hints match data types
**Best practice:** Use Pydantic models for complex validation
**Source:** Pydantic documentation

## Error 7: Transport/Protocol Mismatch
**Error:** `ConnectionError: different transport`
**Fix:** Match client/server transport (stdio or http)
**Server:** `mcp.run(transport="http")`
**Client:** `{"transport": "http", "url": "..."}`
**Source:** MCP transport specification

## Error 8: Import Errors (Editable Package)
**Error:** `ModuleNotFoundError: No module named 'my_package'`
**Fix:** Install in editable mode: `pip install -e .`
**Alternative:** Use absolute imports or add to PYTHONPATH
**Source:** Python packaging documentation

## Error 9: Deprecation Warnings
**Error:** `DeprecationWarning: 'mcp.settings' deprecated`
**Fix:** Use `os.getenv()` instead of `mcp.settings.get()`
**Why:** FastMCP v2 removed settings API
**Source:** FastMCP v2 migration guide

## Error 10: Port Already in Use
**Error:** `OSError: [Errno 48] Address already in use`
**Fix:** Use different port: `--port 8001`
**Alternative:** Kill process: `lsof -ti:8000 | xargs kill -9`
**Source:** Common networking issue

## Error 11: Schema Generation Failures
**Error:** `TypeError: not JSON serializable`
**Fix:** Use JSON-compatible types (no NumPy arrays, custom classes)
**Example:** Convert: `data.tolist()` or `data.to_dict()`
**Source:** JSON serialization requirements

## Error 12: JSON Serialization
**Error:** `TypeError: Object of type 'datetime' not JSON serializable`
**Fix:** Convert to string: `datetime.now().isoformat()`
**Apply to:** datetime, bytes, custom objects
**Source:** JSON specification

## Error 13: Circular Import Errors
**Error:** `ImportError: cannot import name 'X' from partially initialized module`
**Fix:** Avoid factory functions in `__init__.py`, use direct imports
**Example:** Import `APIClient` directly, don't use `get_api_client()` factory
**Why:** Cloud deployment initializes modules differently
**Source:** Production cloud deployment errors

## Error 14: Python Version Compatibility
**Error:** `DeprecationWarning: datetime.utcnow() deprecated`
**Fix:** Use `datetime.now(timezone.utc)` (Python 3.12+)
**Why:** Python 3.12+ deprecated some datetime methods
**Source:** Python 3.12 release notes

## Error 15: Import-Time Execution
**Error:** `RuntimeError: Event loop is closed`
**Fix:** Don't create async resources at module level
**Example:** Use lazy initialization: create resources when needed, not at import
**Why:** Event loop not available during module import
**Source:** Async event loop management

---

## Quick Debugging Checklist

When encountering errors:

1. ✅ Check server is exported at module level
2. ✅ Verify async/await usage is correct
3. ✅ Ensure Context type hints are present
4. ✅ Validate resource URIs have scheme prefixes
5. ✅ Match resource template parameters exactly
6. ✅ Use JSON-serializable types only
7. ✅ Avoid circular imports (especially in `__init__.py`)
8. ✅ Don't execute async code at module level
9. ✅ Test locally with `fastmcp dev server.py` before deploying

## Getting Help

- **FastMCP GitHub**: https://github.com/jlowin/fastmcp/issues
- **Context7 Docs**: `/jlowin/fastmcp`
- **This Skill**: See SKILL.md for detailed solutions
