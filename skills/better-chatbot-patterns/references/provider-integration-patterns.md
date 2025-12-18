# Multi-AI Provider Integration Patterns

Complete implementation for supporting multiple AI providers (OpenAI, Anthropic, Google, xAI, Groq) with Vercel AI SDK.

---

## The Problem

Supporting multiple AI providers requires:
- Different SDK initialization patterns per provider
- Provider-specific configurations (API keys, base URLs, compatibility modes)
- Unified interface for switching providers at runtime
- Type-safe model selection
- Fallback strategies when a provider is unavailable

---

## The Solution: Provider Registry Pattern

Create `lib/ai/providers.ts` to centralize all provider configurations.

### Complete Implementation

```typescript
import { createOpenAI } from "@ai-sdk/openai"
import { createAnthropic } from "@ai-sdk/anthropic"
import { createGoogleGenerativeAI } from "@ai-sdk/google"

// Define supported providers
export type AIProvider = "openai" | "anthropic" | "google" | "xai" | "groq"

// Provider instances
export const providers = {
  openai: createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    compatibility: "strict"
  }),

  anthropic: createAnthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  }),

  google: createGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_API_KEY
  }),

  // xAI uses OpenAI-compatible API
  xai: createOpenAI({
    apiKey: process.env.XAI_API_KEY,
    baseURL: "https://api.x.ai/v1"
  }),

  // Groq uses OpenAI-compatible API
  groq: createOpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1"
  })
}

// Model registry - update with latest models
export const models = {
  openai: {
    "gpt-5.2": providers.openai("gpt-5.2"),
    "gpt-5.2-chat-latest": providers.openai("gpt-5.2-chat-latest"),
    "gpt-5.2-pro": providers.openai("gpt-5.2-pro"),
    "gpt-4o": providers.openai("gpt-4o"),
    "gpt-4o-mini": providers.openai("gpt-4o-mini")
  },
  anthropic: {
    "claude-sonnet-4-5": providers.anthropic("claude-sonnet-4-5"),
    "claude-haiku-4-5": providers.anthropic("claude-haiku-4-5"),
    "claude-opus-4-5": providers.anthropic("claude-opus-4-5")
  },
  google: {
    "gemini-3-pro-preview": providers.google("gemini-3-pro-preview"),
    "gemini-3-flash-preview": providers.google("gemini-3-flash-preview"),
    "gemini-2.5-pro": providers.google("gemini-2.5-pro"),
    "gemini-2.5-flash": providers.google("gemini-2.5-flash")
  },
  xai: {
    "grok-4.1-fast": providers.xai("grok-4.1-fast"),
    "grok-4-1-fast-reasoning": providers.xai("grok-4-1-fast-reasoning")
  },
  groq: {
    "llama-3.3-70b": providers.groq("llama-3.3-70b-versatile"),
    "llama-3.1-8b": providers.groq("llama-3.1-8b-instant")
  }
}

// Helper to get model with validation
export function getModel(provider: AIProvider, modelName: string) {
  const providerModels = models[provider]
  if (!providerModels) {
    throw new Error(`Provider ${provider} not found`)
  }

  if (!providerModels[modelName]) {
    throw new Error(
      `Model ${modelName} not found for provider ${provider}. ` +
      `Available models: ${Object.keys(providerModels).join(", ")}`
    )
  }

  return providerModels[modelName]
}

// Helper to list available models per provider
export function listModels(provider: AIProvider): string[] {
  return Object.keys(models[provider] || {})
}

// Helper to check if provider is configured
export function isProviderConfigured(provider: AIProvider): boolean {
  const envKeys = {
    openai: "OPENAI_API_KEY",
    anthropic: "ANTHROPIC_API_KEY",
    google: "GOOGLE_API_KEY",
    xai: "XAI_API_KEY",
    groq: "GROQ_API_KEY"
  }

  return !!process.env[envKeys[provider]]
}
```

---

## Usage Examples

### Example 1: Basic API Route with Provider Selection

```typescript
// app/api/chat/route.ts
import { streamText } from "ai"
import { getModel } from "@/lib/ai/providers"

export async function POST(req: Request) {
  const { messages, provider, model } = await req.json()

  // Get the selected model
  const selectedModel = getModel(provider, model)

  const result = await streamText({
    model: selectedModel,
    messages,
    temperature: 0.7,
    maxTokens: 1000
  })

  return result.toDataStreamResponse()
}
```

### Example 2: With Fallback Strategy

```typescript
// app/api/chat/route.ts
import { streamText } from "ai"
import { getModel, isProviderConfigured } from "@/lib/ai/providers"

export async function POST(req: Request) {
  const { messages, provider, model } = await req.json()

  // Fallback chain: user choice → OpenAI → Anthropic
  const fallbackProviders: AIProvider[] = [provider, "openai", "anthropic"]

  for (const fallbackProvider of fallbackProviders) {
    if (isProviderConfigured(fallbackProvider)) {
      try {
        const selectedModel = getModel(fallbackProvider, model)

        const result = await streamText({
          model: selectedModel,
          messages
        })

        return result.toDataStreamResponse()
      } catch (error) {
        console.error(`Provider ${fallbackProvider} failed:`, error)
        continue
      }
    }
  }

  return new Response("No available AI providers", { status: 503 })
}
```

### Example 3: User Model Selection UI

```typescript
// app/components/ModelSelector.tsx
"use client"

import { useState, useEffect } from "react"
import { listModels, type AIProvider } from "@/lib/ai/providers"

export function ModelSelector({
  onSelect
}: {
  onSelect: (provider: AIProvider, model: string) => void
}) {
  const [provider, setProvider] = useState<AIProvider>("openai")
  const [model, setModel] = useState("")

  const availableModels = listModels(provider)

  useEffect(() => {
    // Auto-select first model when provider changes
    if (availableModels.length > 0) {
      setModel(availableModels[0])
      onSelect(provider, availableModels[0])
    }
  }, [provider, availableModels])

  return (
    <div className="flex gap-4">
      <select
        value={provider}
        onChange={(e) => setProvider(e.target.value as AIProvider)}
        className="border rounded px-3 py-2"
      >
        <option value="openai">OpenAI</option>
        <option value="anthropic">Anthropic (Claude)</option>
        <option value="google">Google (Gemini)</option>
        <option value="xai">xAI (Grok)</option>
        <option value="groq">Groq</option>
      </select>

      <select
        value={model}
        onChange={(e) => {
          setModel(e.target.value)
          onSelect(provider, e.target.value)
        }}
        className="border rounded px-3 py-2"
      >
        {availableModels.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
    </div>
  )
}
```

---

## Environment Variables Setup

### Development Setup

Create `.env.local` for local development:

```bash
# OpenAI
OPENAI_API_KEY=sk-...

# Anthropic (Claude)
ANTHROPIC_API_KEY=sk-ant-...

# Google (Gemini)
GOOGLE_API_KEY=...

# xAI (Grok)
XAI_API_KEY=xai-...

# Groq
GROQ_API_KEY=gsk_...
```

**Development Security**:
- Never commit `.env.local` to version control
- Add to `.gitignore`
- Use separate development keys (not production keys)

### Production Deployment

**⚠️ CRITICAL**: `.env.local` is for **development only**. For production deployments:

#### Cloud Platform Secret Management

**Vercel**:
- Use Environment Variables in project settings
- Supports environment-specific values (Preview/Production)
- [Vercel Environment Variables Guide](https://vercel.com/docs/environment-variables)

**AWS**:
- Use AWS Secrets Manager for automatic rotation
- Or AWS Systems Manager Parameter Store for simpler use cases
- Integrate via AWS SDK in your application
- [AWS Secrets Manager Documentation](https://aws.amazon.com/secrets-manager/)

**Google Cloud**:
- Use Secret Manager with automatic rotation
- Supports versioning and access control
- [Google Secret Manager Guide](https://cloud.google.com/secret-manager)

**Azure**:
- Use Key Vault with managed identities
- Supports certificate and key management
- [Azure Key Vault Documentation](https://azure.microsoft.com/en-us/products/key-vault)

#### CI/CD Integration

- Store secrets in **GitHub Actions secrets** / **GitLab CI variables**
- Never log or expose secrets in build output
- Use separate keys per environment (dev/staging/production)
- Rotate keys immediately if exposed in logs

#### Security Best Practices

**Key Rotation**:
- Rotate API keys **quarterly** minimum (set calendar reminders)
- Automate rotation where supported (AWS Secrets Manager, Google Secret Manager)
- Have rollback plan before rotating production keys

**Access Control**:
- Use separate keys for each environment
- Restrict keys to specific IP ranges when possible
- Enable provider-specific security features (IP allowlists, rate limits)

**Monitoring**:
- Monitor key usage via provider dashboards
- Set up alerts for unusual API activity
- Track costs to detect unauthorized usage
- Log all API errors for security auditing

#### Additional Resources

- [Anthropic Security Best Practices](https://docs.anthropic.com/en/api/security)
- [OpenAI API Security](https://platform.openai.com/docs/guides/safety-best-practices)
- [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)

---

## Advanced Patterns

### Pattern 1: Provider Health Checks

```typescript
// lib/ai/health.ts
import { isProviderConfigured, type AIProvider, getModel, models } from "./providers"
import { generateText } from "ai" // or your AI SDK module

export async function checkProviderHealth(provider: AIProvider): Promise<boolean> {
  if (!isProviderConfigured(provider)) {
    return false
  }

  try {
    // Make a minimal test request
    const model = getModel(provider, Object.keys(models[provider])[0])
    await generateText({
      model,
      prompt: "test",
      maxTokens: 1
    })
    return true
  } catch (error) {
    console.error(`Provider ${provider} health check failed:`, error)
    return false
  }
}

export async function getHealthyProviders(): Promise<AIProvider[]> {
  const allProviders: AIProvider[] = ["openai", "anthropic", "google", "xai", "groq"]
  const checks = await Promise.all(
    allProviders.map(async (p) => ({
      provider: p,
      healthy: await checkProviderHealth(p)
    }))
  )

  return checks.filter(c => c.healthy).map(c => c.provider)
}
```

### Pattern 2: Cost-Aware Provider Selection

```typescript
// lib/ai/cost.ts
const providerCosts = {
  openai: { input: 0.0025, output: 0.01 }, // per 1k tokens
  anthropic: { input: 0.003, output: 0.015 },
  google: { input: 0.001, output: 0.002 },
  xai: { input: 0.002, output: 0.008 },
  groq: { input: 0.0001, output: 0.0002 }
}

export function getCheapestProvider(
  estimatedInputTokens: number,
  estimatedOutputTokens: number
): AIProvider {
  const costs = Object.entries(providerCosts).map(([provider, rates]) => ({
    provider: provider as AIProvider,
    cost:
      (estimatedInputTokens / 1000) * rates.input +
      (estimatedOutputTokens / 1000) * rates.output
  }))

  costs.sort((a, b) => a.cost - b.cost)
  return costs[0].provider
}
```

### Pattern 3: Smart Model Selection

```typescript
// lib/ai/smart-select.ts
export function selectModelForTask(
  task: "chat" | "coding" | "creative" | "fast"
): { provider: AIProvider; model: string } {
  const recommendations = {
    chat: { provider: "anthropic" as const, model: "claude-sonnet-4-5" },
    coding: { provider: "anthropic" as const, model: "claude-sonnet-4-5" },
    creative: { provider: "anthropic" as const, model: "claude-opus-4-5" },
    fast: { provider: "groq" as const, model: "llama-3.1-8b" }
  }

  return recommendations[task]
}
```

---

## When to Use

**Use multi-provider setup when**:
- User choice of AI model is required
- Need fallback when primary provider is down
- Different providers for different tasks (cheap for summaries, powerful for coding)
- Testing/comparing outputs from multiple models
- Cost optimization is important

**Don't use when**:
- Single provider is sufficient for all use cases
- Team doesn't want to manage multiple API keys
- Simplified architecture is preferred

---

## Benefits

✅ **Flexibility**: Switch providers without code changes
✅ **Resilience**: Fallback when providers are unavailable
✅ **Cost optimization**: Use cheaper providers for simple tasks
✅ **User choice**: Let users pick their preferred model
✅ **Type-safe**: Full TypeScript validation for provider/model combos

---

**Last Updated**: 2025-12-17
