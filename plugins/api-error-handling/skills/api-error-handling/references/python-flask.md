# Python Flask Error Handling

Complete Flask error handling with custom exceptions and recovery patterns.

```python
from flask import Flask, jsonify, request, g
from functools import wraps
import traceback
import uuid
import logging

app = Flask(__name__)
logger = logging.getLogger(__name__)


class ApiError(Exception):
    """Custom API error with code, message, and status."""

    def __init__(self, code, message, status_code=500, details=None):
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details or []
        super().__init__(message)

    @classmethod
    def bad_request(cls, message, details=None):
        return cls("BAD_REQUEST", message, 400, details)

    @classmethod
    def not_found(cls, resource):
        return cls("NOT_FOUND", f"{resource} not found", 404)

    @classmethod
    def unauthorized(cls):
        return cls("UNAUTHORIZED", "Authentication required", 401)

    @classmethod
    def forbidden(cls):
        return cls("FORBIDDEN", "Access denied", 403)

    @classmethod
    def validation_error(cls, errors):
        return cls("VALIDATION_ERROR", "Validation failed", 422, errors)


# Request ID middleware
@app.before_request
def add_request_id():
    g.request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))


# Global error handlers
@app.errorhandler(ApiError)
def handle_api_error(error):
    response = {
        "error": {
            "code": error.code,
            "message": error.message,
            "status": error.status_code,
            "request_id": getattr(g, "request_id", None),
        }
    }
    if error.details:
        response["error"]["details"] = error.details

    if error.status_code >= 500:
        logger.error(f"Server error: {error.message}", exc_info=True)
    else:
        logger.warning(f"Client error: {error.code} - {error.message}")

    return jsonify(response), error.status_code


@app.errorhandler(Exception)
def handle_generic_error(error):
    logger.error(f"Unhandled exception: {error}", exc_info=True)
    return jsonify({
        "error": {
            "code": "INTERNAL_ERROR",
            "message": "An unexpected error occurred",
            "status": 500,
            "request_id": getattr(g, "request_id", None),
        }
    }), 500


@app.errorhandler(404)
def handle_not_found(error):
    return jsonify({
        "error": {
            "code": "NOT_FOUND",
            "message": "Resource not found",
            "status": 404,
        }
    }), 404
```

## Circuit Breaker Pattern

```python
import time
from enum import Enum
from threading import Lock


class CircuitState(Enum):
    CLOSED = "closed"
    OPEN = "open"
    HALF_OPEN = "half_open"


class CircuitBreaker:
    """Prevents cascading failures with automatic recovery."""

    def __init__(self, failure_threshold=5, recovery_timeout=30, half_open_max=3):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.half_open_max = half_open_max

        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.success_count = 0
        self.last_failure_time = None
        self.lock = Lock()

    def can_execute(self):
        with self.lock:
            if self.state == CircuitState.CLOSED:
                return True

            if self.state == CircuitState.OPEN:
                if time.time() - self.last_failure_time >= self.recovery_timeout:
                    self.state = CircuitState.HALF_OPEN
                    self.success_count = 0
                    return True
                return False

            # HALF_OPEN
            return True

    def record_success(self):
        with self.lock:
            if self.state == CircuitState.HALF_OPEN:
                self.success_count += 1
                if self.success_count >= self.half_open_max:
                    self.state = CircuitState.CLOSED
                    self.failure_count = 0
            else:
                self.failure_count = 0

    def record_failure(self):
        with self.lock:
            self.failure_count += 1
            self.last_failure_time = time.time()

            if self.state == CircuitState.HALF_OPEN:
                self.state = CircuitState.OPEN
            elif self.failure_count >= self.failure_threshold:
                self.state = CircuitState.OPEN

    def execute(self, func, *args, **kwargs):
        if not self.can_execute():
            raise ApiError("SERVICE_UNAVAILABLE", "Service temporarily unavailable", 503)

        try:
            result = func(*args, **kwargs)
            self.record_success()
            return result
        except Exception as e:
            self.record_failure()
            raise


# Usage
external_api_breaker = CircuitBreaker(failure_threshold=5, recovery_timeout=30)

def call_external_api():
    return external_api_breaker.execute(requests.get, "https://api.example.com/data")
```

## Retry with Exponential Backoff

```python
import time
import random
from functools import wraps


def retry_with_backoff(max_retries=3, base_delay=1, max_delay=60, exceptions=(Exception,)):
    """Decorator for retrying functions with exponential backoff."""

    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            last_exception = None

            for attempt in range(max_retries):
                try:
                    return func(*args, **kwargs)
                except exceptions as e:
                    last_exception = e

                    if attempt == max_retries - 1:
                        break

                    # Exponential backoff with jitter
                    delay = min(base_delay * (2 ** attempt), max_delay)
                    delay = delay * (0.5 + random.random())  # Add jitter

                    logger.warning(
                        f"Attempt {attempt + 1} failed: {e}. Retrying in {delay:.2f}s"
                    )
                    time.sleep(delay)

            raise last_exception

        return wrapper
    return decorator


# Usage
@retry_with_backoff(max_retries=3, base_delay=1, exceptions=(requests.RequestException,))
def fetch_data(url):
    response = requests.get(url, timeout=10)
    response.raise_for_status()
    return response.json()
```

## Sentry Integration

```python
import sentry_sdk
from sentry_sdk.integrations.flask import FlaskIntegration

sentry_sdk.init(
    dsn=os.environ.get("SENTRY_DSN"),
    integrations=[FlaskIntegration()],
    traces_sample_rate=0.1,
    environment=os.environ.get("ENVIRONMENT", "development"),
)

# Capture additional context
@app.before_request
def add_sentry_context():
    if hasattr(g, "user"):
        sentry_sdk.set_user({"id": g.user.id, "email": g.user.email})
    sentry_sdk.set_tag("request_id", g.request_id)
```
