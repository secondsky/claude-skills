# Python ABAC Implementation

Attribute-Based Access Control implementation with policy evaluation.

```python
from typing import List, Callable, Dict, Any
from dataclasses import dataclass
from enum import Enum
from datetime import datetime

class Effect(Enum):
    ALLOW = "allow"
    DENY = "deny"

@dataclass
class Policy:
    """Policy defining access rules with conditions."""
    name: str
    effect: Effect
    resource: str
    action: str
    conditions: List[Callable[[Dict[str, Any]], bool]]

    def matches(self, context: Dict[str, Any]) -> bool:
        """Check if policy matches the request context."""
        if self.resource != "*" and self.resource != context.get("resource"):
            return False
        if self.action != "*" and self.action != context.get("action"):
            return False
        return True

    def evaluate(self, context: Dict[str, Any]) -> bool:
        """Evaluate all conditions against context."""
        return all(condition(context) for condition in self.conditions)


class ABACEngine:
    """Attribute-Based Access Control decision engine."""

    def __init__(self):
        self.policies: List[Policy] = []

    def add_policy(self, policy: Policy):
        """Register a policy with the engine."""
        self.policies.append(policy)

    def check_access(self, context: Dict[str, Any]) -> bool:
        """
        Evaluate access request against all policies.
        Deny-by-default: returns False if no matching ALLOW policy.
        """
        for policy in self.policies:
            if policy.matches(context) and policy.evaluate(context):
                if policy.effect == Effect.DENY:
                    return False
                elif policy.effect == Effect.ALLOW:
                    return True
        return False  # Deny by default


# Common condition functions
def is_resource_owner(context: Dict[str, Any]) -> bool:
    """Check if user owns the resource."""
    return context.get("user_id") == context.get("resource_owner_id")


def is_within_business_hours(context: Dict[str, Any]) -> bool:
    """Check if current time is within business hours (9 AM - 6 PM)."""
    current_hour = datetime.now().hour
    return 9 <= current_hour < 18


def has_department(department: str) -> Callable:
    """Factory for department check condition."""
    def check(context: Dict[str, Any]) -> bool:
        return context.get("user_department") == department
    return check


def has_minimum_clearance(level: int) -> Callable:
    """Factory for clearance level check."""
    def check(context: Dict[str, Any]) -> bool:
        return context.get("user_clearance", 0) >= level
    return check


# Usage Example
if __name__ == "__main__":
    engine = ABACEngine()

    # Policy: Users can read their own documents
    engine.add_policy(Policy(
        name="owner-read",
        effect=Effect.ALLOW,
        resource="document",
        action="read",
        conditions=[is_resource_owner]
    ))

    # Policy: Finance department can read financial reports during business hours
    engine.add_policy(Policy(
        name="finance-reports",
        effect=Effect.ALLOW,
        resource="financial_report",
        action="read",
        conditions=[has_department("finance"), is_within_business_hours]
    ))

    # Policy: High clearance users can access sensitive data
    engine.add_policy(Policy(
        name="sensitive-access",
        effect=Effect.ALLOW,
        resource="sensitive_data",
        action="*",
        conditions=[has_minimum_clearance(5)]
    ))

    # Test access
    context = {
        "user_id": "user123",
        "resource_owner_id": "user123",
        "resource": "document",
        "action": "read"
    }
    print(f"Owner read access: {engine.check_access(context)}")  # True
```

## Flask Integration

```python
from functools import wraps
from flask import Flask, request, g, jsonify

app = Flask(__name__)
abac = ABACEngine()

def require_access(resource: str, action: str):
    """Decorator for ABAC-protected endpoints."""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            context = {
                "user_id": g.user.id,
                "user_department": g.user.department,
                "user_clearance": g.user.clearance_level,
                "resource": resource,
                "action": action,
                "resource_owner_id": kwargs.get("owner_id")
            }

            if not abac.check_access(context):
                return jsonify({"error": "Access denied"}), 403

            return f(*args, **kwargs)
        return decorated_function
    return decorator


@app.route("/documents/<doc_id>")
@require_access("document", "read")
def get_document(doc_id):
    return jsonify({"document": doc_id})
```
