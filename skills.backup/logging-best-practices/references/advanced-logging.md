# Python Structured Logging

Complete logging setup with structlog and centralized logging.

```python
import structlog
import logging
import sys
from contextvars import ContextVar

# Context variables for request tracking
request_id_var: ContextVar[str] = ContextVar("request_id", default="")
user_id_var: ContextVar[str] = ContextVar("user_id", default="")


def add_context(logger, method_name, event_dict):
    """Add request context to all log entries."""
    event_dict["request_id"] = request_id_var.get()
    event_dict["user_id"] = user_id_var.get()
    return event_dict


# Configure structlog
structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        add_context,
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.JSONRenderer(),
    ],
    wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
    context_class=dict,
    logger_factory=structlog.PrintLoggerFactory(),
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()


# Sensitive data sanitization
SENSITIVE_FIELDS = {"password", "token", "api_key", "secret", "ssn", "credit_card"}


def sanitize(data: dict) -> dict:
    """Remove sensitive fields from log data."""
    if not isinstance(data, dict):
        return data

    sanitized = {}
    for key, value in data.items():
        if key.lower() in SENSITIVE_FIELDS:
            sanitized[key] = "[REDACTED]"
        elif isinstance(value, dict):
            sanitized[key] = sanitize(value)
        elif key.lower() == "email" and isinstance(value, str):
            # Mask email
            parts = value.split("@")
            if len(parts) == 2:
                sanitized[key] = f"{parts[0][:2]}***@{parts[1]}"
            else:
                sanitized[key] = "[REDACTED]"
        else:
            sanitized[key] = value

    return sanitized


# Usage
logger.info("user_login", user_id="123", ip_address="192.168.1.1")
logger.error("payment_failed", error="Card declined", **sanitize({"amount": 100}))
```

## Go Zap Logging

```go
package logging

import (
    "go.uber.org/zap"
    "go.uber.org/zap/zapcore"
    "os"
)

var Logger *zap.Logger

func Init(environment string) {
    var config zap.Config

    if environment == "production" {
        config = zap.NewProductionConfig()
        config.EncoderConfig.TimeKey = "timestamp"
        config.EncoderConfig.EncodeTime = zapcore.ISO8601TimeEncoder
    } else {
        config = zap.NewDevelopmentConfig()
        config.EncoderConfig.EncodeLevel = zapcore.CapitalColorLevelEncoder
    }

    var err error
    Logger, err = config.Build(
        zap.AddCaller(),
        zap.AddStacktrace(zapcore.ErrorLevel),
    )
    if err != nil {
        panic(err)
    }
}

// WithContext creates a logger with request context
func WithContext(requestID, userID string) *zap.Logger {
    return Logger.With(
        zap.String("request_id", requestID),
        zap.String("user_id", userID),
    )
}

// Usage
func HandleRequest(requestID string) {
    log := WithContext(requestID, "user123")
    log.Info("processing request",
        zap.String("endpoint", "/api/users"),
        zap.Int("status", 200),
    )
}
```

## ELK Stack Integration

```python
from elasticsearch import Elasticsearch
import json
import logging
from datetime import datetime


class ElasticsearchHandler(logging.Handler):
    """Custom handler to send logs to Elasticsearch."""

    def __init__(self, hosts, index_prefix="logs"):
        super().__init__()
        self.es = Elasticsearch(hosts)
        self.index_prefix = index_prefix

    def emit(self, record):
        try:
            index = f"{self.index_prefix}-{datetime.utcnow():%Y.%m.%d}"
            doc = {
                "@timestamp": datetime.utcnow().isoformat(),
                "level": record.levelname,
                "message": record.getMessage(),
                "logger": record.name,
                "path": record.pathname,
                "line": record.lineno,
                "function": record.funcName,
            }

            if hasattr(record, "request_id"):
                doc["request_id"] = record.request_id

            if record.exc_info:
                doc["exception"] = self.format(record)

            self.es.index(index=index, document=doc)
        except Exception:
            self.handleError(record)


# Setup
es_handler = ElasticsearchHandler(["http://localhost:9200"])
es_handler.setLevel(logging.INFO)
logging.getLogger().addHandler(es_handler)
```

## AWS CloudWatch Integration

```python
import watchtower
import logging


def setup_cloudwatch_logging(log_group, stream_name):
    """Configure CloudWatch logging."""
    handler = watchtower.CloudWatchLogHandler(
        log_group=log_group,
        stream_name=stream_name,
        use_queues=True,
        send_interval=10,
        max_batch_count=100,
    )

    formatter = logging.Formatter(
        '{"timestamp": "%(asctime)s", "level": "%(levelname)s", '
        '"message": "%(message)s", "logger": "%(name)s"}'
    )
    handler.setFormatter(formatter)

    root_logger = logging.getLogger()
    root_logger.addHandler(handler)
    root_logger.setLevel(logging.INFO)


# Usage
setup_cloudwatch_logging("my-application", "api-server")
```

## OpenTelemetry Distributed Tracing

```python
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.jaeger.thrift import JaegerExporter
from opentelemetry.instrumentation.flask import FlaskInstrumentor
from opentelemetry.instrumentation.requests import RequestsInstrumentor

# Setup tracer
trace.set_tracer_provider(TracerProvider())
tracer = trace.get_tracer(__name__)

# Configure Jaeger exporter
jaeger_exporter = JaegerExporter(
    agent_host_name="localhost",
    agent_port=6831,
)
trace.get_tracer_provider().add_span_processor(
    BatchSpanProcessor(jaeger_exporter)
)

# Auto-instrument Flask and requests
FlaskInstrumentor().instrument_app(app)
RequestsInstrumentor().instrument()


# Manual span creation
def process_order(order_id):
    with tracer.start_as_current_span("process_order") as span:
        span.set_attribute("order.id", order_id)

        with tracer.start_as_current_span("validate_order"):
            validate(order_id)

        with tracer.start_as_current_span("charge_payment"):
            charge(order_id)
```
