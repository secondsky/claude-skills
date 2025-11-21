---
name: access-control-rbac
description: Implements role-based access control (RBAC), permissions management, and authorization policies for secure multi-tenant applications. Use when building admin dashboards, enterprise access management, API authorization, or fine-grained data access controls.
---

# Access Control & RBAC

Implement secure access control systems with fine-grained permissions using RBAC, ABAC, or hybrid approaches.

## Access Control Models

| Model | Description | Best For |
|-------|-------------|----------|
| RBAC | Role-based - users assigned to roles with permissions | Most applications |
| ABAC | Attribute-based - policies evaluate user/resource attributes | Complex rules |
| MAC | Mandatory - system-enforced classification levels | Government/military |
| DAC | Discretionary - resource owners control access | File systems |
| ReBAC | Relationship-based - access via entity relationships | Social apps |

## Implementation Pattern (Node.js)

```javascript
class Permission {
  constructor(resource, action) {
    this.resource = resource;
    this.action = action;
  }

  matches(resource, action) {
    return (this.resource === '*' || this.resource === resource) &&
           (this.action === '*' || this.action === action);
  }
}

class Role {
  constructor(name, permissions = [], parent = null) {
    this.name = name;
    this.permissions = permissions;
    this.parent = parent;
  }

  hasPermission(resource, action) {
    if (this.permissions.some(p => p.matches(resource, action))) return true;
    return this.parent?.hasPermission(resource, action) ?? false;
  }
}

// Express middleware
const requirePermission = (resource, action) => (req, res, next) => {
  if (!req.user?.role?.hasPermission(resource, action)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
};
```

## Python ABAC Pattern

```python
class Policy:
    def __init__(self, effect, conditions):
        self.effect = effect  # 'allow' or 'deny'
        self.conditions = conditions

    def evaluate(self, context):
        return all(cond(context) for cond in self.conditions)

class ABACEngine:
    def __init__(self):
        self.policies = []

    def check_access(self, context):
        for policy in self.policies:
            if policy.evaluate(context):
                return policy.effect == 'allow'
        return False  # Deny by default
```

## Best Practices

- Apply least privilege principle
- Use role hierarchies to reduce duplication
- Audit all access changes
- Review permissions quarterly
- Never hardcode permission checks
- Separate authentication from authorization
- Cache permission checks for performance

## References

- [NIST RBAC Model](https://csrc.nist.gov/projects/role-based-access-control)
- [OWASP Access Control Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Access_Control_Cheat_Sheet.html)
