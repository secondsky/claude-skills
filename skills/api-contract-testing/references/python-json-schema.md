# Python JSON Schema Validation

Contract testing using JSON Schema validation with pytest.

```python
import json
from jsonschema import validate, ValidationError
import pytest

# Schema definitions
USER_SCHEMA = {
    "type": "object",
    "required": ["id", "email", "name", "createdAt"],
    "properties": {
        "id": {"type": "string", "pattern": "^[a-f0-9-]{36}$"},
        "email": {"type": "string", "format": "email"},
        "name": {"type": "string", "minLength": 1, "maxLength": 100},
        "createdAt": {"type": "string", "format": "date-time"},
        "role": {"type": "string", "enum": ["user", "admin", "moderator"]},
        "profile": {
            "type": "object",
            "properties": {
                "bio": {"type": "string"},
                "avatarUrl": {"type": "string", "format": "uri"}
            }
        }
    },
    "additionalProperties": False
}

ORDER_SCHEMA = {
    "type": "object",
    "required": ["id", "userId", "items", "total", "status"],
    "properties": {
        "id": {"type": "string"},
        "userId": {"type": "string"},
        "items": {
            "type": "array",
            "minItems": 1,
            "items": {
                "type": "object",
                "required": ["productId", "quantity", "price"],
                "properties": {
                    "productId": {"type": "string"},
                    "quantity": {"type": "integer", "minimum": 1},
                    "price": {"type": "number", "minimum": 0}
                }
            }
        },
        "total": {"type": "number", "minimum": 0},
        "status": {
            "type": "string",
            "enum": ["pending", "processing", "shipped", "delivered", "cancelled"]
        },
        "createdAt": {"type": "string", "format": "date-time"}
    }
}

PAGINATED_RESPONSE_SCHEMA = {
    "type": "object",
    "required": ["data", "pagination"],
    "properties": {
        "data": {"type": "array"},
        "pagination": {
            "type": "object",
            "required": ["page", "limit", "total", "totalPages"],
            "properties": {
                "page": {"type": "integer", "minimum": 1},
                "limit": {"type": "integer", "minimum": 1, "maximum": 100},
                "total": {"type": "integer", "minimum": 0},
                "totalPages": {"type": "integer", "minimum": 0}
            }
        }
    }
}


class ContractValidator:
    """Validates API responses against JSON schemas."""

    def __init__(self):
        self.schemas = {
            "user": USER_SCHEMA,
            "order": ORDER_SCHEMA,
            "paginated": PAGINATED_RESPONSE_SCHEMA
        }

    def validate(self, schema_name: str, data: dict) -> tuple[bool, str]:
        """Validate data against named schema."""
        schema = self.schemas.get(schema_name)
        if not schema:
            return False, f"Unknown schema: {schema_name}"

        try:
            validate(instance=data, schema=schema)
            return True, "Valid"
        except ValidationError as e:
            return False, str(e.message)


# Pytest fixtures and tests
@pytest.fixture
def validator():
    return ContractValidator()


@pytest.fixture
def api_client():
    """Configure your API client here."""
    import requests
    class APIClient:
        def __init__(self, base_url="http://localhost:3000"):
            self.base_url = base_url

        def get(self, path):
            return requests.get(f"{self.base_url}{path}")

        def post(self, path, data):
            return requests.post(f"{self.base_url}{path}", json=data)

    return APIClient()


class TestUserAPIContract:
    """Contract tests for User API."""

    def test_get_user_matches_schema(self, api_client, validator):
        response = api_client.get("/api/users/123")
        assert response.status_code == 200

        is_valid, error = validator.validate("user", response.json())
        assert is_valid, f"Response doesn't match user schema: {error}"

    def test_list_users_matches_paginated_schema(self, api_client, validator):
        response = api_client.get("/api/users?page=1&limit=10")
        assert response.status_code == 200

        data = response.json()
        is_valid, error = validator.validate("paginated", data)
        assert is_valid, f"Response doesn't match paginated schema: {error}"

        # Validate each user in the list
        for user in data["data"]:
            is_valid, error = validator.validate("user", user)
            assert is_valid, f"User in list doesn't match schema: {error}"

    def test_create_user_returns_valid_user(self, api_client, validator):
        new_user = {
            "email": "test@example.com",
            "name": "Test User"
        }
        response = api_client.post("/api/users", new_user)
        assert response.status_code == 201

        is_valid, error = validator.validate("user", response.json())
        assert is_valid, f"Created user doesn't match schema: {error}"


class TestOrderAPIContract:
    """Contract tests for Order API."""

    def test_get_order_matches_schema(self, api_client, validator):
        response = api_client.get("/api/orders/456")
        assert response.status_code == 200

        is_valid, error = validator.validate("order", response.json())
        assert is_valid, f"Response doesn't match order schema: {error}"

    def test_order_status_values(self, api_client, validator):
        """Verify status field only contains valid enum values."""
        response = api_client.get("/api/orders")
        orders = response.json()["data"]

        valid_statuses = {"pending", "processing", "shipped", "delivered", "cancelled"}
        for order in orders:
            assert order["status"] in valid_statuses
```
