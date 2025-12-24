# ElevenLabs Agents Platform Skill

**Comprehensive skill for building production-ready conversational AI voice agents with ElevenLabs.**

## Auto-Trigger Keywords

This skill should be used when working with:

- **ElevenLabs agents**, **ElevenLabs conversational AI**, **ElevenLabs platform**
- **Voice agent**, **voice chat**, **conversational AI**, **voice interface**
- **ElevenLabs React**, **ElevenLabs SDK**, **@elevenlabs/react**, **@elevenlabs/client**
- **ElevenLabs CLI**, **agents as code**, **elevenlabs agents**
- **Agent configuration**, **agent workflow**, **agent behavior**
- **System prompt**, **turn-taking**, **conversation flow**
- **Multi-voice**, **pronunciation dictionary**, **voice design**
- **RAG knowledge base**, **ElevenLabs RAG**, **knowledge base agent**
- **ElevenLabs MCP**, **MCP tools**, **Model Context Protocol**
- **Client tools**, **server tools**, **webhook tools**, **system tools**
- **Telephony integration**, **Twilio ElevenLabs**, **SIP trunk**
- **Voice testing**, **agent testing**, **scenario testing**
- **HIPAA voice agent**, **GDPR compliance**, **voice compliance**
- **LLM caching**, **cost optimization**, **burst pricing**
- **React Native voice**, **Swift voice agent**, **voice widget**

## What This Skill Covers

### Platform Capabilities (29 Features)

**Agent Configuration & Management**:
- System prompt engineering (6-component framework)
- Turn-taking modes (Eager/Normal/Patient)
- Workflows (visual builder with nodes and edges)
- Dynamic variables and personalization
- Authentication patterns (public/private/signed URLs)

**Voice & Language**:
- Multi-voice support (5000+ voices, 31 languages)
- Pronunciation dictionaries (IPA/CMU formats)
- Speed control (0.7x-1.2x)
- Voice design and cloning
- Language presets and auto-detection

**Knowledge & Tools**:
- RAG (Retrieval-Augmented Generation) with knowledge bases
- 4 tool types: Client tools, Server tools (webhooks), MCP tools, System tools
- Tool parameter schemas and validation

**SDKs & Integration**:
- React SDK (`@elevenlabs/react`)
- JavaScript SDK (`@elevenlabs/client`)
- React Native SDK (`@elevenlabs/react-native`)
- Swift SDK (iOS/macOS)
- Embeddable widget
- Scribe (Real-Time Speech-to-Text) - Beta

**Testing & Analytics**:
- Scenario testing (LLM-based evaluation)
- Tool call testing
- Load testing
- Conversation analysis and data collection
- Analytics dashboard (resolution rates, sentiment, compliance)

**Privacy & Compliance**:
- Data retention policies (GDPR: 2 years, HIPAA: 6 years)
- Encryption (TLS 1.3, AES-256)
- Regional compliance (US/EU/India)
- SOC 2 compliance

**Cost Optimization**:
- LLM caching (up to 90% savings on cached inputs)
- Model swapping (GPT/Claude/Gemini)
- Burst pricing (3x concurrency at 2x cost)

**DevOps & Advanced**:
- CLI ("agents as code") with multi-environment support
- CI/CD integration (GitHub Actions examples)
- Events (WebSocket/SSE real-time streaming)
- Custom models (bring your own LLM)
- Post-call webhooks
- Chat mode (text-only)
- Telephony integration (Twilio, SIP)

## Errors Prevented

This skill prevents 17+ common errors:

1. **Package deprecation** (@11labs/* → @elevenlabs/*)
2. **Android audio cutoff** (connectionDelay configuration)
3. **CSP violations** (workletPaths self-hosting)
4. **WebRTC vs WebSocket** confusion (different auth flows)
5. Missing required dynamic variables
6. Case-sensitive tool names mismatch
7. Webhook authentication failures (HMAC verification)
8. Voice consistency issues (training data quality)
9. Wrong language voice (English voice for Spanish, etc.)
10. Restricted API keys in CLI
11. Agent configuration push conflicts
12. Tool parameter schema mismatches
13. RAG index not ready before use
14. WebSocket protocol errors (1002)
15. 401 Unauthorized in production (visibility settings)
16. Allowlist connection errors
17. Workflow infinite loops

## Quick Start Examples

### React SDK (Voice Chat UI)
```typescript
import { useConversation } from '@elevenlabs/react';

const { startConversation, stopConversation, status } = useConversation({
  agentId: 'your-agent-id',
  apiKey: process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY,
  onConnect: () => console.log('Connected'),
  onEvent: (event) => console.log('Event:', event)
});
```

### CLI ("Agents as Code")
```bash
elevenlabs agents init
elevenlabs agents add "Support Agent" --template customer-service
elevenlabs agents push --env prod
```

### API (Programmatic Agent Creation)
```typescript
const agent = await client.agents.create({
  name: 'Support Bot',
  conversation_config: {
    agent: {
      prompt: { prompt: "You are a helpful support agent.", llm: "gpt-4o" },
      language: "en"
    }
  }
});
```

## Package Versions

**🚨 IMPORTANT**: ElevenLabs migrated packages in August 2025. Use these current versions:

- `@elevenlabs/elevenlabs-js`: 2.21.0
- `@elevenlabs/agents-cli`: 0.2.0
- `@elevenlabs/react`: 0.9.1
- `@elevenlabs/client`: 0.9.1
- `@elevenlabs/react-native`: 0.5.2

**DEPRECATED** (do not use):
- `@11labs/react` - Deprecated August 2025
- `@11labs/client` - Deprecated August 2025

## Impact Metrics

- **Token Savings**: ~73% (22k → 6k tokens)
- **Errors Prevented**: 17+ common issues (including v1.1.0 additions)
- **Time Savings**: 6-8 hours → 6-8 minutes with Claude Code
- **Coverage**: 31 major features, 100% platform coverage (includes Scribe + WebRTC)

## Templates Included

- **Scripts**: create-agent.sh, test-agent.sh, deploy-agent.sh, simulate-conversation.sh
- **References**: API reference, system prompt guide, workflow examples, tool examples, testing guide, compliance guide, cost optimization
- **Assets**: React boilerplate, JavaScript boilerplate, React Native boilerplate, Swift boilerplate, widget template, agent config schema, CI/CD example

## Integration with Other Skills

Composes well with:
- `cloudflare-worker-base` - Deploy agents on edge
- `cloudflare-workers-ai` - Custom LLM integration
- `cloudflare-durable-objects` - Conversation state
- `nextjs` - React SDK in Next.js
- `ai-sdk-core` - Vercel AI SDK provider
- `clerk-auth` - Authenticated sessions
- `hono-routing` - Webhook endpoints

## Documentation

- Official Docs: https://elevenlabs.io/docs/agents-platform/overview
- API Reference: https://elevenlabs.io/docs/api-reference
- CLI GitHub: https://github.com/elevenlabs/cli
- Examples: https://github.com/elevenlabs/elevenlabs-examples

## Production Tested

- WordPress Auditor
- Customer Support Agents
- Multiple production deployments

## License

MIT
