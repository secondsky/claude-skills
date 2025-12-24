# Pact Broker CI/CD Integration

GitHub Actions workflow for consumer-driven contract testing with Pact Broker.

## Consumer Workflow

```yaml
# .github/workflows/consumer-contracts.yml
name: Consumer Contract Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  contract-tests:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run consumer contract tests
        run: npm run test:contract
        env:
          CI: true

      - name: Publish contracts to Pact Broker
        if: github.ref == 'refs/heads/main'
        run: |
          npx pact-broker publish ./pacts \
            --consumer-app-version=${{ github.sha }} \
            --branch=${{ github.ref_name }} \
            --broker-base-url=${{ secrets.PACT_BROKER_URL }} \
            --broker-token=${{ secrets.PACT_BROKER_TOKEN }}

      - name: Check if can deploy
        if: github.ref == 'refs/heads/main'
        run: |
          npx pact-broker can-i-deploy \
            --pacticipant=OrderService \
            --version=${{ github.sha }} \
            --to-environment=production \
            --broker-base-url=${{ secrets.PACT_BROKER_URL }} \
            --broker-token=${{ secrets.PACT_BROKER_TOKEN }}
```

## Provider Workflow

```yaml
# .github/workflows/provider-verification.yml
name: Provider Contract Verification

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  # Triggered by Pact Broker webhooks
  repository_dispatch:
    types: [pact_changed]

jobs:
  verify-contracts:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Start provider service
        run: npm run start:test &
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test

      - name: Wait for service
        run: npx wait-on http://localhost:3000/health

      - name: Verify contracts
        run: |
          npx pact-broker verify \
            --provider=UserService \
            --provider-app-version=${{ github.sha }} \
            --provider-base-url=http://localhost:3000 \
            --publish-verification-results \
            --broker-base-url=${{ secrets.PACT_BROKER_URL }} \
            --broker-token=${{ secrets.PACT_BROKER_TOKEN }}

      - name: Record deployment
        if: github.ref == 'refs/heads/main'
        run: |
          npx pact-broker record-deployment \
            --pacticipant=UserService \
            --version=${{ github.sha }} \
            --environment=production \
            --broker-base-url=${{ secrets.PACT_BROKER_URL }} \
            --broker-token=${{ secrets.PACT_BROKER_TOKEN }}
```

## Pact Broker Webhook Configuration

Configure webhooks in Pact Broker to trigger provider verification when contracts change:

```json
{
  "description": "Trigger provider verification on contract change",
  "events": [
    {"name": "contract_content_changed"}
  ],
  "request": {
    "method": "POST",
    "url": "https://api.github.com/repos/OWNER/PROVIDER_REPO/dispatches",
    "headers": {
      "Accept": "application/vnd.github.v3+json",
      "Authorization": "Bearer ${GITHUB_TOKEN}"
    },
    "body": {
      "event_type": "pact_changed",
      "client_payload": {
        "pact_url": "${pactbroker.pactUrl}"
      }
    }
  }
}
```

## Matrix Testing Strategy

Test all consumer-provider combinations:

```yaml
jobs:
  verify-contracts:
    strategy:
      matrix:
        consumer: [OrderService, InventoryService, NotificationService]
    steps:
      - name: Verify contracts from ${{ matrix.consumer }}
        run: |
          npx pact-broker verify \
            --provider=UserService \
            --consumer-version-selectors='{"mainBranch": true}' \
            --provider-app-version=${{ github.sha }}
```
