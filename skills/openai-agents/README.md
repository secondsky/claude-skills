# OpenAI Agents SDK Skill

Complete production-ready skill for building AI applications with OpenAI Agents SDK (JavaScript/TypeScript).

---

## Auto-Trigger Keywords

This skill auto-triggers when you mention:

**Core Concepts**:
- openai agents
- openai agents sdk
- openai agents js
- openai agents typescript
- @openai/agents
- @openai/agents-realtime
- agent sdk
- openai agentic
- agentic workflows
- ai agents framework

**Features**:
- multi-agent
- agent handoffs
- agent delegation
- agent orchestration
- agent routing
- tool calling agents
- function calling agents
- agent tools
- agent guardrails
- input guardrails
- output guardrails
- structured output agents
- zod schema agents
- streaming agents
- realtime agents
- voice agents
- openai realtime
- openai voice
- human-in-the-loop agents
- hitl patterns
- agent approval

**Frameworks**:
- cloudflare workers agents
- nextjs agents
- hono agents
- react voice agents
- voice ui react

**Patterns**:
- llm orchestration
- code-based orchestration
- agents as tools
- parallel agents
- agent evaluation
- agent feedback loops
- triage agent
- specialist agents

**Errors**:
- zod schema type error agents
- mcp tracing error
- maxturnsexceedederror
- toolcallerror agents
- guardrail error
- schema mismatch agents

**Use Cases**:
- customer service agents
- support ticket agents
- billing automation agents
- technical support automation
- documentation assistant
- voice assistant
- conversational ai
- ai workflow automation
- automated research agents
- content generation agents

---

## What This Skill Provides

### Text Agents
- ✅ Basic agent creation with tools
- ✅ Multi-agent handoffs (triage pattern)
- ✅ Structured outputs with Zod
- ✅ Streaming responses
- ✅ Input/output guardrails
- ✅ Human-in-the-loop patterns
- ✅ Parallel execution

### Realtime Voice Agents
- ✅ Voice agent setup (WebRTC/WebSocket)
- ✅ Browser session management (React)
- ✅ Voice agent handoffs
- ✅ Audio I/O handling
- ✅ Transport options

### Framework Integration
- ✅ Cloudflare Workers (experimental)
- ✅ Next.js App Router
- ✅ Hono framework
- ✅ React components

### Error Prevention
- ✅ 9+ documented errors with workarounds
- ✅ Retry patterns
- ✅ Fallback strategies
- ✅ Debugging techniques

---

## Templates Included

**17 Production Templates**:

1. Basic agent with tools
2. Multi-agent handoffs (triage)
3. Structured output (Zod)
4. Streaming events
5. Input guardrails
6. Output guardrails
7. Human approval (HITL)
8. Parallel execution
9. Realtime voice agent
10. Browser voice client (React)
11. Voice agent handoffs
12. Cloudflare Workers
13. Hono integration
14. Next.js API route
15. Next.js realtime endpoint
16. Error handling
17. Tracing/debugging

---

## References Included

**5 Comprehensive Guides**:

1. **agent-patterns.md** - LLM vs code orchestration, agents as tools, parallel patterns
2. **common-errors.md** - 9 errors with GitHub issue links and solutions
3. **realtime-transports.md** - WebRTC vs WebSocket comparison
4. **cloudflare-integration.md** - Experimental Workers support, limitations
5. **official-links.md** - Documentation, GitHub, npm, examples

---

## Metrics

- **Token Savings**: ~60% (12k → 5k tokens)
- **Errors Prevented**: 9 documented issues
- **Templates**: 17 production-ready
- **Package Version**: @openai/agents@0.2.1
- **Last Verified**: 2025-10-26

---

## Quick Start

```bash
# Install
bun add @openai/agents zod@3  # preferred
# or: npm install @openai/agents zod@3

# Set API key
export OPENAI_API_KEY="your-key"

# Create agent
import { Agent, run } from '@openai/agents';

const agent = new Agent({
  name: 'Assistant',
  instructions: 'You are helpful.',
});

const result = await run(agent, 'Hello!');
console.log(result.finalOutput);
```

---

## When to Use

✅ **Use when**:
- Building multi-agent workflows
- Creating voice AI applications
- Need tool calling with validation
- Require guardrails for safety
- Implementing human approval gates
- Deploying to Cloudflare/Next.js

❌ **Don't use when**:
- Simple OpenAI API calls
- Non-OpenAI models only
- Massive scale voice (use LiveKit)

---

## Production Tested

This skill has been tested in production environments and includes:
- Error handling for all major failure modes
- Security best practices (API key protection)
- Cost optimization techniques
- Debugging and tracing patterns

---

## Official Resources

- **Docs**: https://openai.github.io/openai-agents-js/
- **GitHub**: https://github.com/openai/openai-agents-js
- **npm**: https://www.npmjs.com/package/@openai/agents

---

**Skill Version**: 1.0.0
**SDK Version**: 0.2.1
**License**: MIT
**Author**: Claude Skills Maintainers
