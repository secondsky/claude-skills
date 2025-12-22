"""
FastMCP Tools Examples
======================
Comprehensive examples of tool patterns: sync, async, validation, error handling.
"""

from fastmcp import FastMCP, Context
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
import asyncio

mcp = FastMCP("Tools Examples")

# ============================================================================
# Basic Tools
# ============================================================================

@mcp.tool()
def simple_sync_tool(text: str) -> str:
    """Simple synchronous tool."""
    return text.upper()


@mcp.tool()
async def simple_async_tool(text: str) -> str:
    """Simple asynchronous tool."""
    await asyncio.sleep(0.1)  # Simulate async operation
    return text.lower()


# ============================================================================
# Tools with Validation
# ============================================================================

class SearchParams(BaseModel):
    """Validated search parameters."""
    query: str = Field(min_length=1, max_length=100, description="Search query")
    limit: int = Field(default=10, ge=1, le=100, description="Maximum results")
    offset: int = Field(default=0, ge=0, description="Offset for pagination")

    @validator("query")
    def clean_query(cls, v):
        return v.strip()


@mcp.tool()
async def validated_search(params: SearchParams) -> dict:
    """
    Search with validated parameters.

    Pydantic automatically validates all parameters.
    """
    return {
        "query": params.query,
        "limit": params.limit,
        "offset": params.offset,
        "results": [
            {"id": 1, "title": f"Result for: {params.query}"},
            {"id": 2, "title": f"Another result for: {params.query}"}
        ]
    }


# ============================================================================
# Tools with Optional Parameters
# ============================================================================

@mcp.tool()
def process_text(
    text: str,
    uppercase: bool = False,
    prefix: Optional[str] = None,
    suffix: Optional[str] = None
) -> str:
    """Process text with optional transformations."""
    result = text

    if uppercase:
        result = result.upper()

    if prefix:
        result = f"{prefix}{result}"

    if suffix:
        result = f"{result}{suffix}"

    return result


# ============================================================================
# Tools with Complex Return Types
# ============================================================================

@mcp.tool()
async def batch_process(items: List[str]) -> Dict[str, Any]:
    """Process multiple items and return detailed results."""
    results = []
    errors = []

    for i, item in enumerate(items):
        try:
            # Simulate processing
            await asyncio.sleep(0.1)
            results.append({
                "index": i,
                "item": item,
                "processed": item.upper(),
                "success": True
            })
        except Exception as e:
            errors.append({
                "index": i,
                "item": item,
                "error": str(e),
                "success": False
            })

    return {
        "total": len(items),
        "successful": len(results),
        "failed": len(errors),
        "results": results,
        "errors": errors,
        "timestamp": datetime.now().isoformat()
    }


# ============================================================================
# Tools with Error Handling
# ============================================================================

@mcp.tool()
async def safe_operation(data: dict) -> dict:
    """Operation with comprehensive error handling."""
    try:
        # Validate input
        if not data:
            return {
                "success": False,
                "error": "Data is required",
                "code": "VALIDATION_ERROR"
            }

        # Simulate operation
        await asyncio.sleep(0.1)
        processed_data = {k: v.upper() if isinstance(v, str) else v for k, v in data.items()}

        return {
            "success": True,
            "data": processed_data,
            "timestamp": datetime.now().isoformat()
        }

    except KeyError as e:
        return {
            "success": False,
            "error": f"Missing key: {e}",
            "code": "KEY_ERROR"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "code": "UNKNOWN_ERROR"
        }


# ============================================================================
# Tools with Context (for Elicitation, Progress, Sampling)
# ============================================================================

@mcp.tool()
async def tool_with_progress(count: int, context: Context) -> dict:
    """Tool that reports progress."""
    results = []

    for i in range(count):
        # Report progress if available
        if context and hasattr(context, 'report_progress'):
            await context.report_progress(
                progress=i + 1,
                total=count,
                message=f"Processing item {i + 1}/{count}"
            )

        # Simulate work
        await asyncio.sleep(0.1)
        results.append(f"Item {i + 1}")

    return {
        "count": count,
        "results": results,
        "status": "completed"
    }


@mcp.tool()
async def tool_with_elicitation(context: Context) -> dict:
    """Tool that requests user input."""
    if context and hasattr(context, 'request_elicitation'):
        # Request user input
        user_name = await context.request_elicitation(
            prompt="What is your name?",
            response_type=str
        )

        return {
            "greeting": f"Hello, {user_name}!",
            "timestamp": datetime.now().isoformat()
        }
    else:
        return {"error": "Elicitation not available"}


# ============================================================================
# Main
# ============================================================================

if __name__ == "__main__":
    mcp.run()
