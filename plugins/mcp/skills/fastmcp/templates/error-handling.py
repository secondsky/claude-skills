"""
FastMCP Error Handling Template
================================
Comprehensive error handling patterns with structured responses and retry logic.
"""

from fastmcp import FastMCP
import asyncio
import httpx
from enum import Enum
from typing import Dict, Any, Optional
from datetime import datetime

mcp = FastMCP("Error Handling Examples")

# ============================================================================
# Error Code Enum
# ============================================================================

class ErrorCode(Enum):
    """Standard error codes."""
    VALIDATION_ERROR = "VALIDATION_ERROR"
    NOT_FOUND = "NOT_FOUND"
    UNAUTHORIZED = "UNAUTHORIZED"
    RATE_LIMITED = "RATE_LIMITED"
    API_ERROR = "API_ERROR"
    TIMEOUT = "TIMEOUT"
    NETWORK_ERROR = "NETWORK_ERROR"
    UNKNOWN_ERROR = "UNKNOWN_ERROR"


# ============================================================================
# Response Formatters
# ============================================================================

def create_success(data: Any, message: str = "Success") -> Dict[str, Any]:
    """Create structured success response."""
    return {
        "success": True,
        "message": message,
        "data": data,
        "timestamp": datetime.now().isoformat()
    }


def create_error(
    code: ErrorCode,
    message: str,
    details: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """Create structured error response."""
    return {
        "success": False,
        "error": {
            "code": code.value,
            "message": message,
            "details": details or {},
            "timestamp": datetime.now().isoformat()
        }
    }


# ============================================================================
# Retry Logic
# ============================================================================

async def retry_with_backoff(
    func,
    max_retries: int = 3,
    initial_delay: float = 1.0,
    exponential_base: float = 2.0,
    catch_exceptions: tuple = (Exception,)
):
    """
    Retry function with exponential backoff.

    Args:
        func: Async function to retry
        max_retries: Maximum number of retry attempts
        initial_delay: Initial delay in seconds
        exponential_base: Base for exponential backoff
        catch_exceptions: Tuple of exceptions to catch and retry

    Returns:
        Function result if successful

    Raises:
        Last exception if all retries fail
    """
    delay = initial_delay
    last_exception = None

    for attempt in range(max_retries):
        try:
            return await func()
        except catch_exceptions as e:
            last_exception = e
            if attempt < max_retries - 1:
                await asyncio.sleep(delay)
                delay *= exponential_base

    raise last_exception


# ============================================================================
# Tools with Error Handling
# ============================================================================

@mcp.tool()
def divide_numbers(a: float, b: float) -> dict:
    """
    Divide two numbers with error handling.

    Args:
        a: Numerator
        b: Denominator

    Returns:
        Result or error
    """
    try:
        if b == 0:
            return create_error(
                ErrorCode.VALIDATION_ERROR,
                "Division by zero is not allowed",
                {"a": a, "b": b}
            )

        result = a / b
        return create_success(
            {"result": result, "a": a, "b": b},
            "Division successful"
        )

    except Exception as e:
        return create_error(
            ErrorCode.UNKNOWN_ERROR,
            f"Unexpected error: {str(e)}"
        )


@mcp.tool()
async def validated_operation(data: str, min_length: int = 1) -> dict:
    """
    Operation with input validation.

    Args:
        data: Input data to validate
        min_length: Minimum required length

    Returns:
        Processed result or validation error
    """
    # Validate input
    if not data:
        return create_error(
            ErrorCode.VALIDATION_ERROR,
            "Data is required",
            {"field": "data", "constraint": "not_empty"}
        )

    if len(data) < min_length:
        return create_error(
            ErrorCode.VALIDATION_ERROR,
            f"Data must be at least {min_length} characters",
            {"field": "data", "min_length": min_length, "actual_length": len(data)}
        )

    # Process data
    try:
        processed = data.upper()
        return create_success(
            {"original": data, "processed": processed},
            "Data processed successfully"
        )
    except Exception as e:
        return create_error(
            ErrorCode.UNKNOWN_ERROR,
            str(e)
        )


@mcp.tool()
async def resilient_api_call(url: str) -> dict:
    """
    API call with retry logic and comprehensive error handling.

    Args:
        url: URL to fetch

    Returns:
        API response or detailed error
    """
    async def make_request():
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(url)
            response.raise_for_status()
            return response.json()

    try:
        data = await retry_with_backoff(
            make_request,
            max_retries=3,
            catch_exceptions=(httpx.TimeoutException, httpx.NetworkError)
        )

        return create_success(
            data,
            "API call successful"
        )

    except httpx.TimeoutException:
        return create_error(
            ErrorCode.TIMEOUT,
            "Request timed out",
            {"url": url, "timeout_seconds": 10}
        )

    except httpx.NetworkError as e:
        return create_error(
            ErrorCode.NETWORK_ERROR,
            "Network error occurred",
            {"url": url, "error": str(e)}
        )

    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            return create_error(
                ErrorCode.NOT_FOUND,
                "Resource not found",
                {"url": url, "status_code": 404}
            )
        elif e.response.status_code == 401:
            return create_error(
                ErrorCode.UNAUTHORIZED,
                "Unauthorized access",
                {"url": url, "status_code": 401}
            )
        elif e.response.status_code == 429:
            return create_error(
                ErrorCode.RATE_LIMITED,
                "Rate limit exceeded",
                {"url": url, "status_code": 429}
            )
        else:
            return create_error(
                ErrorCode.API_ERROR,
                f"HTTP {e.response.status_code}",
                {"url": url, "status_code": e.response.status_code}
            )

    except Exception as e:
        return create_error(
            ErrorCode.UNKNOWN_ERROR,
            f"Unexpected error: {str(e)}",
            {"url": url}
        )


@mcp.tool()
async def batch_with_error_recovery(items: list[str]) -> dict:
    """
    Batch process items with individual error recovery.

    Args:
        items: List of items to process

    Returns:
        Results with successes and failures tracked separately
    """
    results = []
    errors = []

    for i, item in enumerate(items):
        try:
            # Simulate processing
            if not item:
                raise ValueError("Empty item")

            await asyncio.sleep(0.1)

            results.append({
                "index": i,
                "item": item,
                "processed": item.upper(),
                "success": True
            })

        except ValueError as e:
            errors.append({
                "index": i,
                "item": item,
                "error": str(e),
                "code": ErrorCode.VALIDATION_ERROR.value
            })

        except Exception as e:
            errors.append({
                "index": i,
                "item": item,
                "error": str(e),
                "code": ErrorCode.UNKNOWN_ERROR.value
            })

    return {
        "success": len(errors) == 0,
        "total": len(items),
        "successful": len(results),
        "failed": len(errors),
        "results": results,
        "errors": errors,
        "timestamp": datetime.now().isoformat()
    }


@mcp.tool()
async def safe_database_operation(query: str) -> dict:
    """
    Simulated database operation with error handling.

    Args:
        query: SQL query (simulated)

    Returns:
        Query result or error
    """
    try:
        # Validate query
        if "DROP" in query.upper():
            return create_error(
                ErrorCode.UNAUTHORIZED,
                "DROP operations not allowed",
                {"query": query}
            )

        if not query.strip():
            return create_error(
                ErrorCode.VALIDATION_ERROR,
                "Query cannot be empty"
            )

        # Simulate query execution
        await asyncio.sleep(0.1)

        # Simulate success
        mock_data = [
            {"id": 1, "name": "Alice"},
            {"id": 2, "name": "Bob"}
        ]

        return create_success(
            {"rows": mock_data, "count": len(mock_data)},
            "Query executed successfully"
        )

    except Exception as e:
        return create_error(
            ErrorCode.API_ERROR,
            f"Database error: {str(e)}",
            {"query": query}
        )


# ============================================================================
# Resources with Error Handling
# ============================================================================

@mcp.resource("health://detailed")
async def detailed_health_check() -> dict:
    """Comprehensive health check with error tracking."""
    checks = {}
    errors = []

    # Check API connectivity
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            response = await client.get("https://api.example.com/health")
            checks["api"] = {
                "status": "healthy",
                "status_code": response.status_code
            }
    except Exception as e:
        checks["api"] = {
            "status": "unhealthy",
            "error": str(e)
        }
        errors.append(f"API check failed: {e}")

    # Check system resources
    try:
        import psutil
        checks["system"] = {
            "status": "healthy",
            "cpu_percent": psutil.cpu_percent(),
            "memory_percent": psutil.virtual_memory().percent
        }
    except Exception as e:
        checks["system"] = {
            "status": "error",
            "error": str(e)
        }

    # Overall status
    all_healthy = all(
        check.get("status") == "healthy"
        for check in checks.values()
    )

    return {
        "status": "healthy" if all_healthy else "degraded",
        "checks": checks,
        "errors": errors if errors else None,
        "timestamp": datetime.now().isoformat()
    }


# ============================================================================
# Main
# ============================================================================

if __name__ == "__main__":
    mcp.run()
