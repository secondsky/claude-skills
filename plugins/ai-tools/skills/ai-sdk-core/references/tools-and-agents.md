# AI SDK Tools & Agents

Complete guide for tool calling and agent workflows.

**Last Updated**: 2025-11-21

---

## Basic Tool Definition

```typescript
import { generateText, tool } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

const result = await generateText({
  model: openai('gpt-4'),
  tools: {
    weather: tool({
      description: 'Get the weather for a location',
      inputSchema: z.object({
        location: z.string().describe('The city and country, e.g. "Paris, France"'),
        unit: z.enum(['celsius', 'fahrenheit']).optional(),
      }),
      execute: async ({ location, unit = 'celsius' }) => {
        // Simulate API call
        const data = await fetch(`https://api.weather.com/${location}`);
        return { temperature: 72, condition: 'sunny', unit };
      },
    }),
    convertTemperature: tool({
      description: 'Convert temperature between units',
      inputSchema: z.object({
        value: z.number(),
        from: z.enum(['celsius', 'fahrenheit']),
        to: z.enum(['celsius', 'fahrenheit']),
      }),
      execute: async ({ value, from, to }) => {
        if (from === to) return { value };
        if (from === 'celsius' && to === 'fahrenheit') {
          return { value: (value * 9/5) + 32 };
        }
        return { value: (value - 32) * 5/9 };
      },
    }),
  },
  prompt: 'What is the weather in Tokyo in Fahrenheit?',
});

console.log(result.text);
// Model will call weather tool, potentially convertTemperature, then answer
```

**v5 Tool Changes:**
- `parameters` → `inputSchema` (Zod schema)
- Tool properties: `args` → `input`, `result` → `output`
- `ToolExecutionError` removed (now `tool-error` content parts)

---

## Agent Class

The Agent class simplifies multi-step execution with tools.

```typescript
import { Experimental_Agent as Agent, tool } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';

const weatherAgent = new Agent({
  model: anthropic('claude-sonnet-4-5-20250929'),
  system: 'You are a weather assistant. Always convert temperatures to the user\'s preferred unit.',
  tools: {
    getWeather: tool({
      description: 'Get current weather for a location',
      inputSchema: z.object({
        location: z.string(),
      }),
      execute: async ({ location }) => {
        return { temp: 72, condition: 'sunny', unit: 'fahrenheit' };
      },
    }),
    convertTemp: tool({
      description: 'Convert temperature between units',
      inputSchema: z.object({
        fahrenheit: z.number(),
      }),
      execute: async ({ fahrenheit }) => {
        return { celsius: (fahrenheit - 32) * 5/9 };
      },
    }),
  },
});

const result = await weatherAgent.generate({
  prompt: 'What is the weather in SF in Celsius?',
});

console.log(result.text);
// Agent will call getWeather, then convertTemp, then respond
```

**When to Use Agent vs Raw generateText:**
- **Use Agent when:** Multiple tools, complex workflows, multi-step reasoning
- **Use generateText when:** Simple single-step, one or two tools, full control needed

---

## Multi-Step Execution

Control when multi-step execution stops with `stopWhen` conditions.

```typescript
import { generateText, stopWhen, stepCountIs, hasToolCall } from 'ai';
import { openai } from '@ai-sdk/openai';

// Stop after specific number of steps
const result = await generateText({
  model: openai('gpt-4'),
  tools: { /* ... */ },
  prompt: 'Research TypeScript and create a summary',
  stopWhen: stepCountIs(5),  // Max 5 steps (tool calls + responses)
});

// Stop when specific tool is called
const result = await generateText({
  model: openai('gpt-4'),
  tools: {
    research: tool({ /* ... */ }),
    finalize: tool({ /* ... */ }),
  },
  prompt: 'Research and finalize a report',
  stopWhen: hasToolCall('finalize'),  // Stop when finalize is called
});

// Combine conditions
const result = await generateText({
  model: openai('gpt-4'),
  tools: { /* ... */ },
  prompt: 'Complex task',
  stopWhen: (step) => step.stepCount >= 10 || step.hasToolCall('finish'),
});
```

**v5 Change:**
`maxSteps` parameter removed. Use `stopWhen(stepCountIs(n))` instead.

---

## Dynamic Tools (v5 New Feature)

Add tools at runtime based on context:

```typescript
const result = await generateText({
  model: openai('gpt-4'),
  tools: (context) => {
    // Context includes messages, step count, etc.
    const baseTool = {
      search: tool({ /* ... */ }),
    };

    // Add tools based on context
    if (context.messages.some(m => m.content.includes('weather'))) {
      baseTool.weather = tool({ /* ... */ });
    }

    return baseTool;
  },
  prompt: 'Help me with my task',
});
```

---

**Questions?** Check `error-catalog.md` for tool-related error handling.
