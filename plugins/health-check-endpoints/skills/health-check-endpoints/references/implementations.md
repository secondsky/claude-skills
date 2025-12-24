# Python Flask Health Checks

Complete health check implementation with dependency verification.

```python
from flask import Flask, jsonify
import redis
import psycopg2
import requests
import time
import os

app = Flask(__name__)


class HealthChecker:
    """Health check service with dependency verification."""

    def __init__(self):
        self.checks = {}

    def register(self, name, check_func):
        """Register a health check function."""
        self.checks[name] = check_func

    def check_all(self):
        """Run all registered health checks."""
        results = {}
        overall_healthy = True

        for name, check_func in self.checks.items():
            start = time.time()
            try:
                check_func()
                results[name] = {
                    "status": "healthy",
                    "latency_ms": round((time.time() - start) * 1000, 2)
                }
            except Exception as e:
                overall_healthy = False
                results[name] = {
                    "status": "unhealthy",
                    "error": str(e),
                    "latency_ms": round((time.time() - start) * 1000, 2)
                }

        return overall_healthy, results


health_checker = HealthChecker()


# Database check
def check_database():
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    cursor = conn.cursor()
    cursor.execute("SELECT 1")
    cursor.close()
    conn.close()


# Redis check
def check_redis():
    r = redis.from_url(os.environ.get("REDIS_URL", "redis://localhost:6379"))
    r.ping()


# External API check
def check_external_api():
    response = requests.get("https://api.example.com/health", timeout=5)
    response.raise_for_status()


# Register checks
health_checker.register("database", check_database)
health_checker.register("redis", check_redis)
health_checker.register("external_api", check_external_api)


# Liveness - simple process check
@app.route("/health/live")
def liveness():
    return jsonify({
        "status": "ok",
        "timestamp": time.time()
    })


# Readiness - check dependencies
@app.route("/health/ready")
def readiness():
    healthy, results = health_checker.check_all()
    status_code = 200 if healthy else 503

    return jsonify({
        "status": "ready" if healthy else "not_ready",
        "checks": results
    }), status_code


# Deep health - comprehensive check
@app.route("/health")
def health():
    healthy, results = health_checker.check_all()

    # Add system metrics
    import psutil
    results["system"] = {
        "cpu_percent": psutil.cpu_percent(),
        "memory_percent": psutil.virtual_memory().percent,
        "disk_percent": psutil.disk_usage("/").percent
    }

    status_code = 200 if healthy else 503
    return jsonify({
        "status": "healthy" if healthy else "unhealthy",
        "checks": results
    }), status_code
```

## Java Spring Boot Actuator

```java
package com.example.health;

import org.springframework.boot.actuate.health.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;

import javax.sql.DataSource;
import java.sql.Connection;

@Component
public class CustomHealthIndicator implements HealthIndicator {

    @Autowired
    private DataSource dataSource;

    @Autowired
    private RedisTemplate<String, String> redisTemplate;

    @Autowired
    private RestTemplate restTemplate;

    @Override
    public Health health() {
        Health.Builder builder = new Health.Builder();

        try {
            // Check database
            checkDatabase(builder);

            // Check Redis
            checkRedis(builder);

            // Check external service
            checkExternalService(builder);

            return builder.up().build();
        } catch (Exception e) {
            return builder.down(e).build();
        }
    }

    private void checkDatabase(Health.Builder builder) {
        try (Connection conn = dataSource.getConnection()) {
            if (conn.isValid(5)) {
                builder.withDetail("database", "Connected");
            } else {
                throw new RuntimeException("Database connection invalid");
            }
        } catch (Exception e) {
            builder.withDetail("database", "Failed: " + e.getMessage());
            throw new RuntimeException("Database check failed", e);
        }
    }

    private void checkRedis(Health.Builder builder) {
        try {
            String pong = redisTemplate.getConnectionFactory()
                    .getConnection().ping();
            builder.withDetail("redis", "Connected");
        } catch (Exception e) {
            builder.withDetail("redis", "Failed: " + e.getMessage());
            throw new RuntimeException("Redis check failed", e);
        }
    }

    private void checkExternalService(Health.Builder builder) {
        try {
            String response = restTemplate.getForObject(
                    "https://api.example.com/health",
                    String.class
            );
            builder.withDetail("external_api", "Available");
        } catch (Exception e) {
            builder.withDetail("external_api", "Unavailable");
            // Don't fail health check for external services
        }
    }
}
```

## Kubernetes Configuration

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-service
spec:
  template:
    spec:
      containers:
        - name: api
          image: api-service:latest
          ports:
            - containerPort: 8080

          # Startup probe - allows slow startup
          startupProbe:
            httpGet:
              path: /health/live
              port: 8080
            initialDelaySeconds: 10
            periodSeconds: 10
            failureThreshold: 30  # 5 minutes to start

          # Liveness probe - restart if unhealthy
          livenessProbe:
            httpGet:
              path: /health/live
              port: 8080
            initialDelaySeconds: 15
            periodSeconds: 20
            timeoutSeconds: 5
            failureThreshold: 3

          # Readiness probe - remove from load balancer if not ready
          readinessProbe:
            httpGet:
              path: /health/ready
              port: 8080
            initialDelaySeconds: 5
            periodSeconds: 10
            timeoutSeconds: 3
            failureThreshold: 3

          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
```
