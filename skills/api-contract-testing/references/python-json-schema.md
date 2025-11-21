# Python JSON Schema Validation

Contract testing using JSON Schema validation with pytest.

```python
import json
import os
from jsonschema import validate, ValidationError
import pytest
import requests

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


class APIClient:
    """HTTP client for API contract testing."""

    def __init__(self, base_url=None, timeout=10):
        # Read base URL from environment or use default
        self.base_url = base_url or os.getenv("API_BASE_URL", "http://localhost:3000")
        self.timeout = timeout
        # Reuse session for better performance
        self.session = requests.Session()

    def get(self, path):
        try:
            return self.session.get(
                f"{self.base_url}{path}",
                timeout=self.timeout
            )
        except requests.exceptions.RequestException as e:
            raise RuntimeError(
                f"Request failed: GET {self.base_url}{path}, "
                f"timeout={self.timeout}s, error={str(e)}"
            ) from e

    def post(self, path, data):
        try:
            return self.session.post(
                f"{self.base_url}{path}",
                json=data,
                timeout=self.timeout
            )
        except requests.exceptions.RequestException as e:
            raise RuntimeError(
                f"Request failed: POST {self.base_url}{path}, "
                f"timeout={self.timeout}s, error={str(e)}"
            ) from e


# Pytest fixtures and tests
@pytest.fixture
def validator():
    return ContractValidator()


@pytest.fixture
def api_client():
    """Fixture providing configured API client instance."""
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

        # DRY: Derive valid statuses from schema instead of hard-coding
        valid_statuses = set(ORDER_SCHEMA["properties"]["status"]["enum"])
        for order in orders:
            assert order["status"] in valid_statuses
```

## Mock-Based Unit Tests

For faster, more reliable tests that don't depend on live endpoints, use mocking:

```python
from unittest.mock import Mock, patch
import pytest

class TestUserAPIContractWithMocks:
    """Unit tests using mocked responses - faster and more reliable than integration tests."""

    def test_get_user_matches_schema_with_mock(self, validator):
        # Mock response data
        mock_user_data = {
            "id": "123",
            "email": "test@example.com",
            "name": "Test User",
            "createdAt": "2024-01-15T10:30:00Z"
        }

        # Validate against schema without hitting real API
        is_valid, error = validator.validate("user", mock_user_data)
        assert is_valid, f"Response doesn't match user schema: {error}"

    @patch('requests.Session.get')
    def test_list_users_with_mock_response(self, mock_get, validator):
        # Mock the HTTP response
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "data": [
                {
                    "id": "123",
                    "email": "user1@example.com",
                    "name": "User One",
                    "createdAt": "2024-01-15T10:30:00Z"
                },
                {
                    "id": "124",
                    "email": "user2@example.com",
                    "name": "User Two",
                    "createdAt": "2024-01-15T11:00:00Z"
                }
            ],
            "pagination": {
                "page": 1,
                "limit": 10,
                "total": 2,
                "totalPages": 1
            }
        }
        mock_get.return_value = mock_response

        # Create client and make request (will use mocked response)
        client = APIClient()
        response = client.get("/api/users?page=1&limit=10")

        # Verify schema validation
        data = response.json()
        is_valid, error = validator.validate("paginated", data)
        assert is_valid, f"Response doesn't match paginated schema: {error}"

        # Validate each user
        for user in data["data"]:
            is_valid, error = validator.validate("user", user)
            assert is_valid, f"User in list doesn't match schema: {error}"

    @patch('requests.Session.post')
    def test_create_user_with_mock(self, mock_post, validator):
        # Mock successful creation
        mock_response = Mock()
        mock_response.status_code = 201
        mock_response.json.return_value = {
            "id": "125",
            "email": "newuser@example.com",
            "name": "New User",
            "createdAt": "2024-01-15T12:00:00Z"
        }
        mock_post.return_value = mock_response

        client = APIClient()
        response = client.post("/api/users", {
            "email": "newuser@example.com",
            "name": "New User"
        })

        assert response.status_code == 201
        is_valid, error = validator.validate("user", response.json())
        assert is_valid, f"Created user doesn't match schema: {error}"


class TestOrderAPIContractWithMocks:
    """Unit tests for Order API using mocks."""

    def test_order_status_values_with_mock(self, validator):
        """Verify status validation without live API."""
        # Derive valid statuses from schema (DRY principle)
        valid_statuses = set(ORDER_SCHEMA["properties"]["status"]["enum"])

        # Test valid status values
        for status in valid_statuses:
            mock_order = {
                "id": "456",
                "userId": "123",
                "items": [
                    {
                        "productId": "prod-1",
                        "quantity": 2,
                        "price": 29.99
                    }
                ],
                "total": 59.98,
                "status": status,
                "createdAt": "2024-01-15T10:30:00Z"
            }
            is_valid, error = validator.validate("order", mock_order)
            assert is_valid, f"Order with status '{status}' should be valid: {error}"

        # Test invalid status value
        invalid_order = {
            "id": "457",
            "userId": "123",
            "items": [{"productId": "prod-1", "quantity": 1, "price": 19.99}],
            "total": 19.99,
            "status": "invalid_status",  # Not in enum
            "createdAt": "2024-01-15T10:30:00Z"
        }
        is_valid, error = validator.validate("order", invalid_order)
        assert not is_valid, "Order with invalid status should fail validation"
        assert "enum" in error.lower() or "invalid_status" in error

    @patch('requests.Session.get')
    def test_get_order_with_mock(self, mock_get, validator):
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "id": "456",
            "userId": "123",
            "items": [
                {
                    "productId": "prod-1",
                    "quantity": 2,
                    "price": 29.99
                }
            ],
            "total": 59.98,
            "status": "processing",
            "createdAt": "2024-01-15T10:30:00Z"
        }
        mock_get.return_value = mock_response

        client = APIClient()
        response = client.get("/api/orders/456")

        assert response.status_code == 200
        is_valid, error = validator.validate("order", response.json())
        assert is_valid, f"Response doesn't match order schema: {error}"
```
