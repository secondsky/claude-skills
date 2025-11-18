---
name: elevenlabs-agents
description: |
  Use this skill when building AI voice agents with the ElevenLabs Agents Platform. This skill covers the complete platform including agent configuration (system prompts, turn-taking, workflows), voice & language features (multi-voice, pronunciation, speed control), knowledge base (RAG), tools (client/server/MCP/system), SDKs (React, JavaScript, React Native, Swift, Widget), Scribe (real-time STT), WebRTC/WebSocket connections, testing & evaluation, analytics, privacy/compliance (GDPR/HIPAA/SOC 2), cost optimization, CLI workflows ("agents as code"), and DevOps integration. Prevents 17+ common errors including package deprecation, Android audio cutoff, CSP violations, missing dynamic variables, case-sensitive tool names, webhook authentication failures, and WebRTC configuration issues. Provides production-tested templates for React, Next.js, React Native, Swift, and Cloudflare Workers. Token savings: ~73% (22k → 6k tokens). Production tested.

  Keywords: ElevenLabs Agents, ElevenLabs voice agents, AI voice agents, conversational AI, @elevenlabs/react, @elevenlabs/client, @elevenlabs/react-native, @elevenlabs/elevenlabs-js, @elevenlabs/agents-cli, elevenlabs SDK, voice AI, TTS, text-to-speech, ASR, speech recognition, turn-taking model, WebRTC voice, WebSocket voice, ElevenLabs conversation, agent system prompt, agent tools, agent knowledge base, RAG voice agents, multi-voice agents, pronunciation dictionary, voice speed control, elevenlabs scribe, @11labs deprecated, Android audio cutoff, CSP violation elevenlabs, dynamic variables elevenlabs, case-sensitive tool names, webhook authentication
license: MIT
metadata:
  version: 1.1.0
  last_updated: 2025-11-03
  production_tested: true
  packages:
    - name: "@elevenlabs/elevenlabs-js"
      version: 2.21.0
    - name: "@elevenlabs/agents-cli"
      version: 0.2.0
    - name: "@elevenlabs/react"
      version: 0.9.1
    - name: "@elevenlabs/client"
      version: 0.9.1
    - name: "@elevenlabs/react-native"
      version: 0.5.2
  documentation:
    - https://elevenlabs.io/docs/agents-platform/overview
    - https://elevenlabs.io/docs/api-reference
    - https://github.com/elevenlabs/elevenlabs-examples
  errors_prevented: 17+
  token_savings: ~73%
---

# ElevenLabs Agents Platform

## Overview

ElevenLabs Agents Platform is a comprehensive solution for building production-ready conversational AI voice agents. The platform coordinates four core components:

1. **ASR (Automatic Speech Recognition)** - Converts speech to text (32+ languages, sub-second latency)
2. **LLM (Large Language Model)** - Reasoning and response generation (GPT, Claude, Gemini, custom models)
3. **TTS (Text-to-Speech)** - Converts text to speech (5000+ voices, 31 languages, low latency)
4. **Turn-Taking Model** - Proprietary model that handles conversation timing and interruptions

### 🚨 Package Updates (November 2025)

ElevenLabs migrated to new scoped packages in August 2025:

**DEPRECATED (Do not use):**
- `@11labs/react` → **DEPRECATED**
- `@11labs/client` → **DEPRECATED**

**Current packages:**
```bash
npm install @elevenlabs/react@0.9.1        # React SDK
npm install @elevenlabs/client@0.9.1       # JavaScript SDK
npm install @elevenlabs/react-native@0.5.2 # React Native SDK
npm install @elevenlabs/elevenlabs-js@2.21.0 # Base SDK
npm install -g @elevenlabs/agents-cli@0.2.0  # CLI
```

If you have old packages installed, uninstall them first:
```bash
npm uninstall @11labs/react @11labs/client
```

### When to Use This Skill

Use this skill when:
- Building voice-enabled customer support agents
- Creating interactive voice response (IVR) systems
- Developing conversational AI applications
- Integrating telephony (Twilio, SIP trunking)
- Implementing voice chat in web/mobile apps
- Configuring agents via CLI ("agents as code")
- Setting up RAG/knowledge bases for agents
- Integrating MCP (Model Context Protocol) servers
- Building HIPAA/GDPR-compliant voice systems
- Optimizing LLM costs with caching strategies

---

## Quick Start (3 Integration Paths)

### Path A: React SDK (Embedded Voice Chat)

For building voice chat interfaces in React applications.

**Installation**:
```bash
npm install @elevenlabs/react zod
```

**Basic Example**:
```typescript
import { useConversation } from '@elevenlabs/react';
import { z } from 'zod';

export default function VoiceChat() {
  const { startConversation, stopConversation, status } = useConversation({
    // Public agent (no API key needed)
    agentId: 'your-agent-id',

    // OR private agent (requires API key)
    apiKey: process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY,

    // OR signed URL (server-generated, most secure)
    signedUrl: '/api/elevenlabs/auth',

    // Client-side tools (browser functions)
    clientTools: {
      updateCart: {
        description: "Update the shopping cart",
        parameters: z.object({
          item: z.string(),
          quantity: z.number()
        }),
        handler: async ({ item, quantity }) => {
          console.log('Updating cart:', item, quantity);
          return { success: true };
        }
      }
    },

    // Event handlers
    onConnect: () => console.log('Connected'),
    onDisconnect: () => console.log('Disconnected'),
    onEvent: (event) => {
      switch (event.type) {
        case 'transcript':
          console.log('User said:', event.data.text);
          break;
        case 'agent_response':
          console.log('Agent replied:', event.data.text);
          break;
      }
    },

    // Regional compliance (GDPR, data residency)
    serverLocation: 'us' // 'us' | 'global' | 'eu-residency' | 'in-residency'
  });

  return (
    <div>
      <button onClick={startConversation}>Start Conversation</button>
      <button onClick={stopConversation}>Stop</button>
      <p>Status: {status}</p>
    </div>
  );
}
```

**Full Template**: See `templates/basic-react-agent.tsx`

### Path B: CLI ("Agents as Code")

For managing agents via code with version control and CI/CD.

**Installation**:
```bash
npm install -g @elevenlabs/agents-cli
# or
pnpm install -g @elevenlabs/agents-cli
```

**Workflow**:
```bash
# 1. Authenticate
elevenlabs auth login

# 2. Initialize project (creates agents.json, tools.json, tests.json)
elevenlabs agents init

# 3. Create agent from template
elevenlabs agents add "Support Agent" --template customer-service

# 4. Configure in agent_configs/support-agent.json

# 5. Push to platform
elevenlabs agents push --env dev

# 6. Test
elevenlabs agents test "Support Agent"

# 7. Deploy to production
elevenlabs agents push --env prod
```

**Configuration Template**: See `templates/basic-cli-agent.json`

### Path C: API (Programmatic Agent Management)

For creating agents dynamically (multi-tenant, SaaS platforms).

**Installation**:
```bash
npm install elevenlabs
```

**Example**:
```typescript
import { ElevenLabsClient } from 'elevenlabs';

const client = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY
});

// Create agent
const agent = await client.agents.create({
  name: 'Support Bot',
  conversation_config: {
    agent: {
      prompt: {
        prompt: "You are a helpful customer support agent.",
        llm: "gpt-4o",
        temperature: 0.7
      },
      first_message: "Hello! How can I help you today?",
      language: "en"
    },
    tts: {
      model_id: "eleven_turbo_v2_5",
      voice_id: "your-voice-id"
    }
  }
});

console.log('Agent created:', agent.agent_id);
```

---

## Agent Configuration

### System Prompt Architecture (6 Components)

ElevenLabs recommends structuring agent prompts using 6 components:

#### 1. Personality
Define the agent's identity, role, and character traits.

```
You are Alex, a friendly and knowledgeable customer support specialist at TechCorp.
You have 5 years of experience helping customers solve technical issues.
You're patient, empathetic, and always maintain a positive attitude.
```

#### 2. Environment
Describe the communication context (phone, web chat, video call).

```
You're speaking with customers over the phone. Communication is voice-only.
Customers may have background noise or poor connection quality.
Speak clearly and occasionally use thoughtful pauses for emphasis.
```

#### 3. Tone
Specify formality, speech patterns, humor, and verbosity.

```
Tone: Professional yet warm. Use contractions ("I'm" instead of "I am") to sound natural.
Avoid jargon unless the customer uses it first. Keep responses concise (2-3 sentences max).
Use encouraging phrases like "I'll be happy to help with that" and "Let's get this sorted for you."
```

#### 4. Goal
Define objectives and success criteria.

```
Primary Goal: Resolve customer technical issues on the first call.
Secondary Goals:
- Verify customer identity securely
- Document issue details accurately
- Offer proactive solutions
- End calls with confirmation that the issue is resolved

Success Criteria: Customer verbally confirms their issue is resolved.
```

#### 5. Guardrails
Set boundaries, prohibited topics, and ethical constraints.

```
Guardrails:
- Never provide medical, legal, or financial advice
- Do not share confidential company information
- If asked about competitors, politely redirect to TechCorp's offerings
- Escalate to a human supervisor if customer becomes abusive
- Never make promises about refunds or credits without verification
```

#### 6. Tools
Describe available external capabilities and when to use them.

```
Available Tools:
1. lookup_order(order_id) - Fetch order details from database. Use when customer mentions an order number.
2. transfer_to_supervisor() - Escalate to human agent. Use when issue requires manager approval.
3. send_password_reset(email) - Trigger password reset email. Use when customer can't access account.

Always explain to the customer what you're doing before calling a tool.
```

**Complete Example**: See `templates/basic-cli-agent.json`

### Turn-Taking Modes

Controls when the agent interrupts or waits for the user to finish speaking.

| Mode | Behavior | Best For |
|------|----------|----------|
| **Eager** | Responds quickly, jumps in at earliest opportunity | Fast-paced support, quick orders |
| **Normal** | Balanced, waits for natural conversation breaks | General customer service (default) |
| **Patient** | Waits longer, allows detailed user responses | Information collection, therapy, tutoring |

**Configuration**:
```json
{
  "conversation_config": {
    "turn": {
      "mode": "patient" // "eager" | "normal" | "patient"
    }
  }
}
```

---

## Voice & Language Features

### Multi-Voice Support

Dynamically switch between different voices during a single conversation.

**Use Cases**: Multi-character storytelling, language tutoring, role-playing scenarios, emotional agents

**Gotchas**: Voice switching adds ~200ms latency per switch

### Pronunciation Dictionary

Customize how the agent pronounces specific words or phrases.

**Supported Formats**: IPA (International Phonetic Alphabet), CMU, Word Substitutions

**Example**:
```json
{
  "pronunciation_dictionary": [
    {
      "word": "ElevenLabs",
      "pronunciation": "ɪˈlɛvənlæbz",
      "format": "ipa"
    },
    {
      "word": "AI",
      "substitution": "artificial intelligence"
    }
  ]
}
```

### Speed Control

Adjust speaking speed dynamically (0.7x - 1.2x).

```json
{
  "voice_settings": {
    "speed": 1.0 // 0.7 = slow, 1.0 = normal, 1.2 = fast
  }
}
```

### Language Configuration

Support for 32+ languages with automatic detection and in-conversation switching.

**Multi-Language Presets** (Different Voice Per Language):
```json
{
  "conversation_config": {
    "language_presets": [
      {
        "language": "en",
        "voice_id": "en_voice_id",
        "first_message": "Hello! How can I help you today?"
      },
      {
        "language": "es",
        "voice_id": "es_voice_id",
        "first_message": "¡Hola! ¿Cómo puedo ayudarte hoy?"
      }
    ]
  }
}
```

---

## Knowledge Base & RAG

Enable agents to access large knowledge bases without loading entire documents into context.

**How It Works**:
1. Upload documents (PDF, TXT, DOCX) to knowledge base
2. ElevenLabs automatically computes vector embeddings
3. During conversation, relevant chunks retrieved based on semantic similarity
4. LLM uses retrieved context to generate responses

**Configuration**:
```json
{
  "agent": {
    "prompt": {
      "knowledge_base": ["doc_id_1", "doc_id_2"]
    }
  }
}
```

**Upload Documents via API**:
```typescript
const doc = await client.knowledgeBase.upload({
  file: fs.createReadStream('support_docs.pdf'),
  name: 'Support Documentation'
});

await client.knowledgeBase.computeRagIndex({
  document_id: doc.id,
  embedding_model: 'e5_mistral_7b'
});
```

**Use Cases**: Product documentation agents, customer support (FAQ), educational tutors, healthcare assistants

**Gotchas**: RAG adds ~500ms latency per query, documents must be indexed before use

---

## Tools (4 Types)

ElevenLabs supports 4 distinct tool types:

### A. Client Tools
Execute operations on the client side (browser or mobile app).

**Use Cases**: Update UI elements, trigger navigation, access local storage, control media playback

### B. Server Tools (Webhooks)
Execute operations on your backend server via HTTP webhooks.

**Use Cases**: Database queries, payment processing, CRM updates, sending emails

### C. MCP Tools (Model Context Protocol)
Connect to standardized tool servers.

**Use Cases**: Access enterprise APIs, connect to existing MCP servers, reusable tool sets

### D. System Tools
Built-in platform tools.

**Available**: `end_conversation`, `transfer_call`, `mute_microphone`, `press_digit`

**See Full Details**: Documentation for each tool type in original SKILL.md sections 5A-5D

---

## Top 5 Critical Errors

### Error 1: Package Deprecation (@11labs/*)

**Symptom**: Import errors, "module not found"

**Cause**: Using deprecated `@11labs/*` packages instead of new `@elevenlabs/*` packages

**Solution**:
```bash
# Uninstall old packages
npm uninstall @11labs/react @11labs/client

# Install new packages
npm install @elevenlabs/react@0.9.1 @elevenlabs/client@0.9.1
```

**Update imports**:
```typescript
// ❌ OLD
import { useConversation } from '@11labs/react';

// ✅ NEW
import { useConversation } from '@elevenlabs/react';
```

---

### Error 2: First Message Cutoff on Android

**Symptom**: First message from agent gets cut off on Android devices (works fine on iOS/web)

**Cause**: Android devices need time to switch to correct audio mode after connection

**Solution**:
```typescript
const { startConversation } = useConversation({
  agentId: 'your-agent-id',
  
  // Add connection delay for Android
  connectionDelay: {
    android: 3_000,  // 3 seconds (default)
    ios: 0,
    default: 0
  }
});
```

---

### Error 3: CSP (Content Security Policy) Violations

**Symptom**: "Refused to load the script because it violates the following Content Security Policy directive" errors

**Cause**: ElevenLabs SDK uses Audio Worklets loaded as blobs by default

**Solution - Self-Host Worklet Files**:

```bash
# Copy worklet files to your public directory
cp node_modules/@elevenlabs/client/dist/worklets/*.js public/elevenlabs/
```

```typescript
const { startConversation } = useConversation({
  agentId: 'your-agent-id',
  
  workletPaths: {
    'rawAudioProcessor': '/elevenlabs/rawAudioProcessor.worklet.js',
    'audioConcatProcessor': '/elevenlabs/audioConcatProcessor.worklet.js',
  }
});
```

---

### Error 4: Missing Required Dynamic Variables

**Symptom**: "Missing required dynamic variables" error, no transcript generated

**Cause**: Dynamic variables referenced in prompts/messages but not provided at conversation start

**Solution**:
```typescript
const conversation = await client.conversations.create({
  agent_id: "agent_123",
  dynamic_variables: {
    user_name: "John",
    account_tier: "premium",
    // Provide ALL variables referenced in prompts
  }
});
```

---

### Error 5: Case-Sensitive Tool Names

**Symptom**: Tool not executing, agent says "tool not found"

**Cause**: Tool name in config doesn't match registered name (case-sensitive)

**Solution**:
```json
// agent_configs/bot.json
{
  "agent": {
    "prompt": {
      "tool_ids": ["orderLookup"]  // Must match exactly
    }
  }
}

// tool_configs/order-lookup.json
{
  "name": "orderLookup"  // Match case exactly
}
```

---

**See All 17 Errors**: `references/error-catalog.md`

---

## SDK Integration

### React SDK (`@elevenlabs/react`)

**Primary Hook**: `useConversation()`

**Authentication Options**:
1. Public agents (no key needed)
2. Private agents with API key (development only)
3. Signed URLs (production recommended)

**Key Features**:
- Client tools integration
- Event streaming (transcript, agent_response, tool_call, error)
- Connection management (WebRTC/WebSocket)
- Regional compliance (US, EU, IN data residency)

**Full Example**: See `templates/basic-react-agent.tsx`

### Other SDKs

- **JavaScript SDK** (`@elevenlabs/client`) - Vanilla JS/Node.js
- **React Native SDK** (`@elevenlabs/react-native`) - Mobile apps (Expo)
- **Swift SDK** - iOS/macOS native apps
- **Widget** - Embeddable web component (no code)

**Details**: See original SKILL.md sections 6B-6E

---

## Additional Features

### Testing & Evaluation
- Scenario testing (LLM-based evaluation)
- Tool call testing
- Load testing
- Simulation API (programmatic testing)

### Analytics & Monitoring
- Conversation analysis
- Success evaluation (LLM-based)
- Data collection (transcripts, metadata)
- Analytics dashboard

### Privacy & Compliance
- Data retention controls
- Encryption (in-transit and at-rest)
- Zero retention mode
- GDPR/HIPAA/SOC 2 compliance

### Cost Optimization
- LLM caching (prompt caching, KV cache)
- Model swapping (different models for different tasks)
- Burst pricing (handle traffic spikes)

### Advanced Features
- Events (WebSocket/SSE)
- Custom models (bring your own LLM)
- Post-call webhooks
- Chat mode (text-only)
- Telephony integration (Twilio, SIP)

**Details**: See original SKILL.md sections 7-12

---

## Bundled Resources

**Templates** (`templates/`):
- `basic-react-agent.tsx` - React SDK integration with client tools and events
- `basic-cli-agent.json` - CLI agent configuration with 6-component prompt

**References** (`references/`):
- `error-catalog.md` - All 17 documented errors with solutions

---

## Integration with Existing Skills

This skill composes well with:

- **cloudflare-worker-base** → Deploy agents on Cloudflare Workers edge network
- **cloudflare-workers-ai** → Use Cloudflare LLMs as custom models in agents
- **cloudflare-durable-objects** → Persistent conversation state and session management
- **cloudflare-kv** → Cache agent configurations and user preferences
- **nextjs** → React SDK integration in Next.js applications
- **ai-sdk-core** → Vercel AI SDK provider for unified AI interface
- **clerk-auth** → Authenticated voice sessions with user identity
- **hono-routing** → API routes for webhooks and server tools

---

## Additional Resources

**Official Documentation**:
- Platform Overview: https://elevenlabs.io/docs/agents-platform/overview
- API Reference: https://elevenlabs.io/docs/api-reference
- CLI GitHub: https://github.com/elevenlabs/cli

**Examples**:
- Official Examples: https://github.com/elevenlabs/elevenlabs-examples
- MCP Server: https://github.com/elevenlabs/elevenlabs-mcp

**Community**:
- Discord: https://discord.com/invite/elevenlabs
- Twitter: @elevenlabsio

---

**Production Tested**: WordPress Auditor, Customer Support Agents
**Last Updated**: 2025-11-03
**Package Versions**: elevenlabs@1.59.0, @elevenlabs/cli@0.2.0
