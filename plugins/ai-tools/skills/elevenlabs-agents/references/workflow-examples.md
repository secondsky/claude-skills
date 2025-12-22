# Workflow Examples

## Customer Support Routing

**Scenario**: Route calls to specialized agents based on customer needs.

```json
{
  "workflow": {
    "nodes": [
      {
        "id": "initial_routing",
        "type": "subagent",
        "config": {
          "system_prompt": "Ask customer: Are you calling about billing, technical support, or sales?",
          "turn_eagerness": "patient"
        }
      },
      {
        "id": "billing_agent",
        "type": "subagent",
        "config": {
          "system_prompt": "You are a billing specialist. Help with invoices, payments, and account charges.",
          "voice_id": "billing_voice_id"
        }
      },
      {
        "id": "technical_agent",
        "type": "subagent",
        "config": {
          "system_prompt": "You are a technical support specialist. Troubleshoot product issues.",
          "voice_id": "tech_voice_id"
        }
      },
      {
        "id": "sales_agent",
        "type": "subagent",
        "config": {
          "system_prompt": "You are a sales representative. Help customers choose products.",
          "voice_id": "sales_voice_id"
        }
      }
    ],
    "edges": [
      { "from": "initial_routing", "to": "billing_agent", "condition": "user_mentions_billing" },
      { "from": "initial_routing", "to": "technical_agent", "condition": "user_mentions_technical" },
      { "from": "initial_routing", "to": "sales_agent", "condition": "user_mentions_sales" }
    ]
  }
}
```

## Escalation Workflow

**Scenario**: Attempt self-service resolution, then escalate to human if needed.

```json
{
  "workflow": {
    "nodes": [
      {
        "id": "self_service",
        "type": "subagent",
        "config": {
          "system_prompt": "Try to resolve issue using knowledge base and tools. If issue can't be resolved, offer human transfer.",
          "knowledge_base": ["faq_doc_id"],
          "tool_ids": ["lookup_order", "check_status"]
        }
      },
      {
        "id": "human_transfer",
        "type": "tool",
        "tool_name": "transfer_to_human"
      }
    ],
    "edges": [
      { "from": "self_service", "to": "human_transfer", "condition": "user_requests_human_or_issue_unresolved" }
    ]
  }
}
```

## Multi-Language Support

**Scenario**: Detect language and route to appropriate voice/agent.

```json
{
  "workflow": {
    "nodes": [
      {
        "id": "language_detection",
        "type": "subagent",
        "config": {
          "system_prompt": "Greet customer and detect language.",
          "language": "auto"
        }
      },
      {
        "id": "english_agent",
        "type": "subagent",
        "config": {
          "language": "en",
          "voice_id": "en_voice_id",
          "first_message": "Hello! How can I help you today?"
        }
      },
      {
        "id": "spanish_agent",
        "type": "subagent",
        "config": {
          "language": "es",
          "voice_id": "es_voice_id",
          "first_message": "¡Hola! ¿Cómo puedo ayudarte hoy?"
        }
      }
    ],
    "edges": [
      { "from": "language_detection", "to": "english_agent", "condition": "detected_language_en" },
      { "from": "language_detection", "to": "spanish_agent", "condition": "detected_language_es" }
    ]
  }
}
```

## Best Practices

1. **Keep workflows simple** - Max 5-7 nodes for maintainability
2. **Test all paths** - Ensure every edge condition works
3. **Add fallbacks** - Always have a default path
4. **Monitor transitions** - Track which paths users take most
5. **Avoid loops** - Workflows can get stuck in infinite loops
