"""
FastMCP Resources Examples
===========================
Examples of static resources, dynamic resources, and resource templates.
"""

from fastmcp import FastMCP
from datetime import datetime
from typing import Dict, List, Any
import os

mcp = FastMCP("Resources Examples")

# ============================================================================
# Static Resources
# ============================================================================

@mcp.resource("data://config")
def get_config() -> dict:
    """Static configuration resource."""
    return {
        "version": "1.0.0",
        "environment": os.getenv("ENVIRONMENT", "development"),
        "features": ["search", "analytics", "notifications"],
        "limits": {
            "max_requests": 1000,
            "max_results": 100
        }
    }


@mcp.resource("info://server")
def server_info() -> dict:
    """Server metadata."""
    return {
        "name": "Resources Examples Server",
        "description": "Demonstrates various resource patterns",
        "version": "1.0.0",
        "capabilities": [
            "static_resources",
            "dynamic_resources",
            "resource_templates"
        ]
    }


# ============================================================================
# Dynamic Resources
# ============================================================================

@mcp.resource("info://status")
async def server_status() -> dict:
    """Dynamic status resource (updated on each read)."""
    import psutil

    return {
        "status": "operational",
        "timestamp": datetime.now().isoformat(),
        "uptime_seconds": 0,  # Would track actual uptime
        "system": {
            "cpu_percent": psutil.cpu_percent(interval=1),
            "memory_percent": psutil.virtual_memory().percent,
            "disk_percent": psutil.disk_usage('/').percent
        }
    }


@mcp.resource("data://statistics")
async def get_statistics() -> dict:
    """Dynamic statistics resource."""
    return {
        "timestamp": datetime.now().isoformat(),
        "total_requests": 1234,  # Would track actual requests
        "active_connections": 5,
        "cache_hit_rate": 0.87,
        "average_response_time_ms": 45.3
    }


# ============================================================================
# Resource Templates (with parameters)
# ============================================================================

@mcp.resource("user://{user_id}/profile")
async def get_user_profile(user_id: str) -> dict:
    """Get user profile by ID."""
    # In production, fetch from database
    return {
        "id": user_id,
        "name": f"User {user_id}",
        "email": f"user{user_id}@example.com",
        "created_at": "2024-01-01T00:00:00Z",
        "role": "user"
    }


@mcp.resource("user://{user_id}/posts")
async def get_user_posts(user_id: str) -> List[dict]:
    """Get posts for a specific user."""
    # In production, fetch from database
    return [
        {
            "id": 1,
            "user_id": user_id,
            "title": "First Post",
            "content": "Hello, world!",
            "created_at": "2024-01-01T00:00:00Z"
        },
        {
            "id": 2,
            "user_id": user_id,
            "title": "Second Post",
            "content": "Another post",
            "created_at": "2024-01-02T00:00:00Z"
        }
    ]


@mcp.resource("org://{org_id}/team/{team_id}/members")
async def get_team_members(org_id: str, team_id: str) -> List[dict]:
    """Get team members with org and team context."""
    # In production, fetch from database with filters
    return [
        {
            "id": 1,
            "name": "Alice",
            "role": "engineer",
            "org_id": org_id,
            "team_id": team_id
        },
        {
            "id": 2,
            "name": "Bob",
            "role": "designer",
            "org_id": org_id,
            "team_id": team_id
        }
    ]


@mcp.resource("api://{version}/config")
async def get_versioned_config(version: str) -> dict:
    """Get configuration for specific API version."""
    configs = {
        "v1": {
            "api_version": "v1",
            "endpoints": ["/users", "/posts"],
            "deprecated": True
        },
        "v2": {
            "api_version": "v2",
            "endpoints": ["/users", "/posts", "/comments", "/likes"],
            "deprecated": False
        }
    }

    return configs.get(version, {"error": f"Unknown version: {version}"})


# ============================================================================
# File-based Resources
# ============================================================================

@mcp.resource("file://docs/{filename}")
async def get_documentation(filename: str) -> dict:
    """Get documentation file content."""
    # In production, read actual files
    docs = {
        "getting-started.md": {
            "filename": "getting-started.md",
            "content": "# Getting Started\n\nWelcome to the docs!",
            "last_modified": "2024-01-01T00:00:00Z"
        },
        "api-reference.md": {
            "filename": "api-reference.md",
            "content": "# API Reference\n\nAPI documentation here.",
            "last_modified": "2024-01-02T00:00:00Z"
        }
    }

    return docs.get(filename, {"error": f"File not found: {filename}"})


# ============================================================================
# List-style Resources
# ============================================================================

@mcp.resource("data://users")
async def list_users() -> List[dict]:
    """List all users."""
    # In production, fetch from database
    return [
        {"id": "1", "name": "Alice", "email": "alice@example.com"},
        {"id": "2", "name": "Bob", "email": "bob@example.com"},
        {"id": "3", "name": "Charlie", "email": "charlie@example.com"}
    ]


@mcp.resource("data://categories")
def list_categories() -> List[str]:
    """List available categories."""
    return [
        "Technology",
        "Science",
        "Business",
        "Entertainment",
        "Sports"
    ]


# ============================================================================
# Main
# ============================================================================

if __name__ == "__main__":
    mcp.run()
