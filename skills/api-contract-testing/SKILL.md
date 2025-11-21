---
name: api-contract-testing
description: Verifies API contracts between services using consumer-driven contracts, schema validation, and tools like Pact. Use when testing microservices communication, preventing breaking changes, or validating OpenAPI specifications.
---

# API Contract Testing

Verify that APIs honor their contracts between consumers and providers without requiring full integration tests.

## Key Concepts

- **Consumer**: Service that calls an API
- **Provider**: Service that exposes an API
- **Contract**: Agreed request/response format
- **Pact**: Consumer-driven contract testing tool

## Pact Consumer Test (TypeScript)

```typescript
import { PactV3, MatchersV3 } from '@pact-foundation/pact';

const provider = new PactV3({
  consumer: 'OrderService',
  provider: 'UserService'
});

describe('User API Contract', () => {
  it('returns user by ID', async () => {
    await provider
      .given('user 123 exists')
      .uponReceiving('a request for user 123')
      .withRequest({ method: 'GET', path: '/users/123' })
      .willRespondWith({
        status: 200,
        body: MatchersV3.like({
          id: '123',
          name: MatchersV3.string('John')
        })
      })
      .executeTest(async (mockServer) => {
        const response = await fetch(`${mockServer.url}/users/123`);
        expect(response.status).toBe(200);
      });
  });
});
```

## OpenAPI Validation (Express)

```javascript
const OpenApiValidator = require('express-openapi-validator');

app.use(OpenApiValidator.middleware({
  apiSpec: './openapi.yaml',
  validateRequests: true,
  validateResponses: true
}));
```

## CI/CD Integration

```yaml
# GitHub Actions
- name: Run contract tests
  run: npm run test:contract

- name: Publish contracts
  run: npx pact-broker publish ./pacts --broker-base-url=$PACT_BROKER_URL

- name: Can I Deploy?
  run: npx pact-broker can-i-deploy --pacticipant=OrderService --version=$VERSION
```

## Best Practices

- Test schema structure, not business logic
- Use matchers for flexible assertions
- Integrate into CI pipeline
- Test error responses too
- Avoid hardcoded values in contracts

## Tools

- Pact (multi-language)
- Spring Cloud Contract (Java)
- OpenAPI/Swagger validators
- Dredd, Spectral
