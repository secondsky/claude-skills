# Cost Optimization Guide

## 1. LLM Caching

### How It Works
- **First request**: Full cost (`input_cache_write`)
- **Subsequent requests**: 10% cost (`input_cache_read`)
- **Cache TTL**: 5 minutes to 1 hour (configurable)

### Configuration
```json
{
  "llm_config": {
    "caching": {
      "enabled": true,
      "ttl_seconds": 3600
    }
  }
}
```

### What Gets Cached
✅ System prompts
✅ Tool definitions
✅ Knowledge base context
✅ Recent conversation history

❌ User messages (always fresh)
❌ Dynamic variables
❌ Tool responses

### Savings
**Up to 90%** on cached inputs

**Example**:
- System prompt: 500 tokens
- Without caching: 500 tokens × 100 conversations = 50,000 tokens
- With caching: 500 tokens (first) + 50 tokens × 99 (cached) = 5,450 tokens
- **Savings**: 89%

---

## 2. Model Swapping

### Model Comparison

| Model | Cost (per 1M tokens) | Speed | Quality | Best For |
|-------|---------------------|-------|---------|----------|
| GPT-4o | $5 | Medium | Highest | Complex reasoning |
| GPT-4o-mini | $0.15 | Fast | High | Most use cases |
| Claude Sonnet 4.5 | $3 | Medium | Highest | Long context |
| Gemini 2.5 Flash | $0.075 | Fastest | Medium | Simple tasks |

### Configuration
```json
{
  "llm_config": {
    "model": "gpt-4o-mini"
  }
}
```

### Optimization Strategy
1. **Start with gpt-4o-mini** for all agents
2. **Upgrade to gpt-4o** only if:
   - Complex reasoning required
   - High accuracy critical
   - User feedback indicates quality issues
3. **Use Gemini 2.5 Flash** for:
   - Simple routing/classification
   - FAQ responses
   - Order status lookups

### Savings
**Up to 97%** (gpt-4o → Gemini 2.5 Flash)

---

## 3. Burst Pricing

### How It Works
- **Normal**: Your subscription concurrency limit (e.g., 10 calls)
- **Burst**: Up to 3× your limit (e.g., 30 calls)
- **Cost**: 2× per-minute rate for burst calls

### Configuration
```json
{
  "call_limits": {
    "burst_pricing_enabled": true
  }
}
```

### When to Use
✅ Black Friday traffic spikes
✅ Product launches
✅ Seasonal demand (holidays)
✅ Marketing campaigns

❌ Sustained high traffic (upgrade plan instead)
❌ Unpredictable usage patterns

### Cost Calculation
**Example**:
- Subscription: 10 concurrent calls ($0.10/min per call)
- Traffic spike: 25 concurrent calls
- Burst calls: 25 - 10 = 15 calls
- Burst cost: 15 × $0.20/min = $3/min
- Regular cost: 10 × $0.10/min = $1/min
- **Total**: $4/min during spike

---

## 4. Prompt Optimization

### Reduce Token Count

**Before** (500 tokens):
```
You are a highly experienced and knowledgeable customer support specialist with extensive training in technical troubleshooting, customer service best practices, and empathetic communication. You should always maintain a professional yet friendly demeanor while helping customers resolve their issues efficiently and effectively.
```

**After** (150 tokens):
```
You are an experienced support specialist. Be professional, friendly, and efficient.
```

**Savings**: 70% token reduction

### Use Tools Instead of Context

**Before**: Include FAQ in system prompt (2,000 tokens)
**After**: Use RAG/knowledge base (100 tokens + retrieval)

**Savings**: 95% for large knowledge bases

---

## 5. Turn-Taking Optimization

### Impact on Cost

| Mode | Latency | LLM Calls | Cost Impact |
|------|---------|-----------|-------------|
| Eager | Low | More | Higher (more interruptions) |
| Normal | Medium | Medium | Balanced |
| Patient | High | Fewer | Lower (fewer interruptions) |

### Recommendation
Use **Patient** mode for cost-sensitive applications where speed is less critical.

---

## 6. Voice Settings

### Speed vs Cost

| Speed | TTS Cost | User Experience |
|-------|----------|-----------------|
| 0.7x | Higher (longer audio) | Slow |
| 1.0x | Baseline | Natural |
| 1.2x | Lower (shorter audio) | Fast |

### Recommendation
Use **1.1x speed** for slight cost savings without compromising experience.

---

## 7. Conversation Duration Limits

### Configuration
```json
{
  "conversation": {
    "max_duration_seconds": 300 // 5 minutes
  }
}
```

### Use Cases
- FAQ bots (limit: 2-3 minutes)
- Order status (limit: 1 minute)
- Full support (limit: 10-15 minutes)

### Savings
Prevents unexpectedly long conversations.

---

## 8. Analytics-Driven Optimization

### Monitor Metrics
1. **Average conversation duration**
2. **LLM tokens per conversation**
3. **Tool call frequency**
4. **Resolution rate**

### Identify Issues
- Long conversations → improve prompts or add escalation
- High token count → enable caching or shorten prompts
- Low resolution rate → upgrade model or improve knowledge base

---

## 9. Cost Monitoring

### API Usage Tracking
```typescript
const usage = await client.analytics.getLLMUsage({
  agent_id: 'agent_123',
  from_date: '2025-11-01',
  to_date: '2025-11-30'
});

console.log('Total tokens:', usage.total_tokens);
console.log('Cached tokens:', usage.cached_tokens);
console.log('Cost:', usage.total_cost);
```

### Set Budgets
```json
{
  "cost_limits": {
    "daily_budget_usd": 100,
    "monthly_budget_usd": 2000
  }
}
```

---

## 10. Cost Optimization Checklist

### Before Launch
- [ ] Enable LLM caching
- [ ] Use gpt-4o-mini (not gpt-4o)
- [ ] Optimize prompt length
- [ ] Set conversation duration limits
- [ ] Use RAG instead of large system prompts
- [ ] Configure burst pricing if needed

### During Operation
- [ ] Monitor LLM token usage weekly
- [ ] Review conversation analytics monthly
- [ ] Test cheaper models quarterly
- [ ] Optimize prompts based on analytics
- [ ] Review and remove unused tools

### Continuous Improvement
- [ ] A/B test cheaper models
- [ ] Analyze long conversations
- [ ] Improve resolution rates
- [ ] Reduce average conversation duration
- [ ] Increase cache hit rates

---

## Expected Savings

**Baseline Configuration**:
- Model: gpt-4o
- No caching
- Average prompt: 1,000 tokens
- Average conversation: 5 minutes
- Cost: ~$0.50/conversation

**Optimized Configuration**:
- Model: gpt-4o-mini
- Caching enabled
- Average prompt: 300 tokens
- Average conversation: 3 minutes
- Cost: ~$0.05/conversation

**Total Savings**: **90%** 🎉
