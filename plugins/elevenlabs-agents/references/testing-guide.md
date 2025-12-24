# Testing Guide

## 1. Scenario Testing (LLM-Based)

### Create Test
```bash
elevenlabs tests add "Refund Request" --template basic-llm
```

### Test Configuration
```json
{
  "name": "Refund Request Test",
  "scenario": "Customer requests refund for defective product",
  "user_input": "I want a refund for order #12345. The product arrived broken.",
  "success_criteria": [
    "Agent acknowledges the issue empathetically",
    "Agent asks for order number or uses provided number",
    "Agent verifies order details",
    "Agent provides clear next steps or refund timeline"
  ],
  "evaluation_type": "llm"
}
```

### Run Test
```bash
elevenlabs agents test "Support Agent"
```

## 2. Tool Call Testing

### Test Configuration
```json
{
  "name": "Order Lookup Test",
  "scenario": "Customer asks about order status",
  "user_input": "What's the status of order ORD-12345?",
  "expected_tool_call": {
    "tool_name": "lookup_order",
    "parameters": {
      "order_id": "ORD-12345"
    }
  }
}
```

## 3. Load Testing

### Basic Load Test
```bash
# 100 concurrent users, spawn 10/second, run for 5 minutes
elevenlabs test load \
  --users 100 \
  --spawn-rate 10 \
  --duration 300
```

### With Burst Pricing
```json
{
  "call_limits": {
    "burst_pricing_enabled": true
  }
}
```

## 4. Simulation API

### Programmatic Testing
```typescript
const simulation = await client.agents.simulate({
  agent_id: 'agent_123',
  scenario: 'Customer requests refund',
  user_messages: [
    "I want a refund for order #12345",
    "It arrived broken",
    "Yes, process the refund"
  ],
  success_criteria: [
    "Agent shows empathy",
    "Agent verifies order",
    "Agent provides timeline"
  ]
});

console.log('Passed:', simulation.passed);
console.log('Criteria met:', simulation.evaluation.criteria_met, '/', simulation.evaluation.criteria_total);
```

## 5. Convert Real Conversations to Tests

### From Dashboard
1. Navigate to Conversations
2. Select conversation
3. Click "Convert to Test"
4. Add success criteria
5. Save

### From API
```typescript
const test = await client.tests.createFromConversation({
  conversation_id: 'conv_123',
  success_criteria: [
    "Issue was resolved",
    "Customer satisfaction >= 4/5"
  ]
});
```

## 6. CI/CD Integration

### GitHub Actions
```yaml
name: Test Agent
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install CLI
        run: npm install -g @elevenlabs/cli

      - name: Push Tests
        run: elevenlabs tests push
        env:
          ELEVENLABS_API_KEY: ${{ secrets.ELEVENLABS_API_KEY }}

      - name: Run Tests
        run: elevenlabs agents test "Support Agent"
        env:
          ELEVENLABS_API_KEY: ${{ secrets.ELEVENLABS_API_KEY }}
```

## 7. Test Organization

### Directory Structure
```
test_configs/
├── refund-tests/
│   ├── basic-refund.json
│   ├── duplicate-refund.json
│   └── expired-refund.json
├── order-lookup-tests/
│   ├── valid-order.json
│   └── invalid-order.json
└── escalation-tests/
    ├── angry-customer.json
    └── complex-issue.json
```

## 8. Best Practices

### Do's:
✅ Test all conversation paths
✅ Include edge cases
✅ Test tool calls thoroughly
✅ Run tests before deployment
✅ Convert failed conversations to tests
✅ Monitor test trends over time

### Don'ts:
❌ Only test happy paths
❌ Ignore failing tests
❌ Skip load testing
❌ Test only in production
❌ Write vague success criteria

## 9. Metrics to Track

- **Pass Rate**: % of tests passing
- **Tool Accuracy**: % of correct tool calls
- **Response Time**: Average time to resolution
- **Load Capacity**: Max concurrent users before degradation
- **Error Rate**: % of conversations with errors

## 10. Debugging Failed Tests

1. Review conversation transcript
2. Check tool calls and parameters
3. Verify dynamic variables provided
4. Test prompt clarity
5. Check knowledge base content
6. Review guardrails and constraints
7. Iterate and retest
