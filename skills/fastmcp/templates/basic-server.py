"""
FastMCP Basic Server Template

A minimal FastMCP server with tools, resources, and prompts.
Copy this file and customize for your use case.
"""

from fastmcp import FastMCP, Context
from pydantic import BaseModel, Field
import os

# CRITICAL: Server MUST be at module level for FastMCP Cloud
mcp = FastMCP("My MCP Server")


# === TOOLS ===

@mcp.tool()
async def greet(name: str) -> str:
    """Greet someone by name.
    
    Args:
        name: Person's name to greet
    
    Returns:
        Greeting message
    """
    return f"Hello, {name}!"


@mcp.tool()
async def calculate(operation: str, a: float, b: float) -> dict:
    """Perform mathematical operations.
    
    Args:
        operation: add, subtract, multiply, or divide
        a: First number
        b: Second number
    
    Returns:
        Result of the operation
    """
    operations = {
        "add": lambda x, y: x + y,
        "subtract": lambda x, y: x - y,
        "multiply": lambda x, y: x * y,
        "divide": lambda x, y: x / y if y != 0 else None
    }
    
    result = operations.get(operation, lambda x, y: None)(a, b)
    return {
        "operation": operation,
        "input": {"a": a, "b": b},
        "result": result
    }


# === RESOURCES ===

@mcp.resource("data://config")
def get_config() -> dict:
    """Provide server configuration."""
    return {
        "version": "1.0.0",
        "environment": os.getenv("ENVIRONMENT", "development"),
        "features": ["tools", "resources", "prompts"]
    }


# === PROMPTS ===

@mcp.prompt()
def code_review_prompt() -> str:
    """Prompt for code review assistance."""
    return """You are an expert code reviewer. Please review code for:
    - Bugs and potential issues
    - Security vulnerabilities  
    - Best practices
    
    Provide specific, actionable feedback."""


if __name__ == "__main__":
    mcp.run()
