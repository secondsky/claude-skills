/**
 * Tool-Server MCP Template
 *
 * An MCP server focused on exposing multiple tools for LLM use.
 * Examples include API integrations, calculations, and data transformations.
 *
 * Setup:
 * 1. npm install @modelcontextprotocol/sdk hono zod
 * 2. npm install -D @cloudflare/workers-types wrangler typescript
 * 3. Add environment variables to wrangler.jsonc or .dev.vars
 * 4. wrangler deploy
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { Hono } from 'hono';
import { z } from 'zod';

type Env = {
  // API keys for external services
  WEATHER_API_KEY?: string;
  // Database (optional)
  DB?: D1Database;
  // Cache (optional)
  CACHE?: KVNamespace;
};

const server = new McpServer({
  name: 'tool-server',
  version: '1.0.0'
});

// Tool 1: Weather API Integration
server.registerTool(
  'get-weather',
  {
    description: 'Fetches current weather data for a city using OpenWeatherMap API',
    inputSchema: z.object({
      city: z.string().describe('City name (e.g., "London", "New York")'),
      units: z.enum(['metric', 'imperial']).default('metric').describe('Temperature units')
    })
  },
  async ({ city, units }, env) => {
    if (!env.WEATHER_API_KEY) {
      return {
        content: [{
          type: 'text',
          text: 'Error: WEATHER_API_KEY not configured'
        }],
        isError: true
      };
    }

    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=${units}&appid=${env.WEATHER_API_KEY}`
      );

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.statusText}`);
      }

      const data = await response.json() as {
        main: { temp: number; feels_like: number; humidity: number };
        weather: Array<{ description: string }>;
        name: string;
      };

      const tempUnit = units === 'metric' ? '°C' : '°F';
      return {
        content: [{
          type: 'text',
          text: `Weather in ${data.name}:
- Temperature: ${data.main.temp}${tempUnit}
- Feels like: ${data.main.feels_like}${tempUnit}
- Humidity: ${data.main.humidity}%
- Conditions: ${data.weather[0].description}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Failed to fetch weather: ${(error as Error).message}`
        }],
        isError: true
      };
    }
  }
);

// Tool 2: Calculator
server.registerTool(
  'calculate',
  {
    description: 'Performs mathematical calculations',
    inputSchema: z.object({
      operation: z.enum(['add', 'subtract', 'multiply', 'divide', 'power', 'sqrt']).describe('Mathematical operation'),
      a: z.number().describe('First number'),
      b: z.number().optional().describe('Second number (not required for sqrt)')
    })
  },
  async ({ operation, a, b }) => {
    let result: number;

    try {
      switch (operation) {
        case 'add':
          result = a + (b || 0);
          break;
        case 'subtract':
          result = a - (b || 0);
          break;
        case 'multiply':
          result = a * (b || 1);
          break;
        case 'divide':
          if (b === 0) throw new Error('Division by zero');
          result = a / (b || 1);
          break;
        case 'power':
          result = Math.pow(a, b || 2);
          break;
        case 'sqrt':
          if (a < 0) throw new Error('Cannot take square root of negative number');
          result = Math.sqrt(a);
          break;
      }

      return {
        content: [{
          type: 'text',
          text: `Result: ${result}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Calculation error: ${(error as Error).message}`
        }],
        isError: true
      };
    }
  }
);

// Tool 3: Text Analysis
server.registerTool(
  'analyze-text',
  {
    description: 'Analyzes text and returns statistics',
    inputSchema: z.object({
      text: z.string().describe('Text to analyze')
    })
  },
  async ({ text }) => {
    const words = text.trim().split(/\s+/);
    const chars = text.length;
    const charsNoSpaces = text.replace(/\s/g, '').length;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0).length;

    return {
      content: [{
        type: 'text',
        text: `Text Analysis:
- Words: ${words.length}
- Characters: ${chars}
- Characters (no spaces): ${charsNoSpaces}
- Sentences: ${sentences}
- Paragraphs: ${paragraphs}
- Average word length: ${(charsNoSpaces / words.length).toFixed(2)} chars`
      }]
    };
  }
);

// Tool 4: JSON Formatter
server.registerTool(
  'format-json',
  {
    description: 'Formats and validates JSON data',
    inputSchema: z.object({
      json: z.string().describe('JSON string to format'),
      indent: z.number().default(2).describe('Number of spaces for indentation')
    })
  },
  async ({ json, indent }) => {
    try {
      const parsed = JSON.parse(json);
      const formatted = JSON.stringify(parsed, null, indent);

      return {
        content: [{
          type: 'text',
          text: `Formatted JSON:\n\`\`\`json\n${formatted}\n\`\`\``
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Invalid JSON: ${(error as Error).message}`
        }],
        isError: true
      };
    }
  }
);

// Tool 5: URL Parser
server.registerTool(
  'parse-url',
  {
    description: 'Parses a URL and returns its components',
    inputSchema: z.object({
      url: z.string().url().describe('URL to parse')
    })
  },
  async ({ url }) => {
    try {
      const parsed = new URL(url);

      return {
        content: [{
          type: 'text',
          text: `URL Components:
- Protocol: ${parsed.protocol}
- Host: ${parsed.host}
- Hostname: ${parsed.hostname}
- Port: ${parsed.port || 'default'}
- Pathname: ${parsed.pathname}
- Search: ${parsed.search || 'none'}
- Hash: ${parsed.hash || 'none'}
- Origin: ${parsed.origin}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Invalid URL: ${(error as Error).message}`
        }],
        isError: true
      };
    }
  }
);

// HTTP endpoint setup
const app = new Hono<{ Bindings: Env }>();

app.get('/', (c) => {
  return c.json({
    name: 'tool-server',
    version: '1.0.0',
    tools: [
      'get-weather',
      'calculate',
      'analyze-text',
      'format-json',
      'parse-url'
    ]
  });
});

app.post('/mcp', async (c) => {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true
  });

  c.res.raw.on('close', () => transport.close());

  // Pass env to server context
  await server.connect(transport);
  await transport.handleRequest(c.req.raw, c.res.raw, await c.req.json());

  return c.body(null);
});

export default app;
