# MCP Protocol Documentation

**Protocol**: Model Context Protocol (MCP)
**Transport**: JSON-RPC 2.0
**Last Updated**: 2025-11-11
**Spec Version**: 1.0

---

## Overview

The **Model Context Protocol (MCP)** is a standard for exposing tools, resources, and context to AI models. It uses **JSON-RPC 2.0** as its wire protocol.

**Key Concepts**:
- **MCP Server**: Process that exposes tools via JSON-RPC
- **MCP Client**: Process that calls tools via JSON-RPC
- **Transport**: stdio (stdin/stdout) or HTTP
- **Tool**: A function that can be called with typed arguments

This document explains how the orchestrator implements the MCP client side.

---

## JSON-RPC 2.0 Basics

### Request Format

```json
{
  "jsonrpc": "2.0",
  "id": 123,
  "method": "tool_name",
  "params": {
    "arg1": "value1",
    "arg2": 42
  }
}
```

**Fields**:
- `jsonrpc`: Always `"2.0"` (required)
- `id`: Unique request identifier, number or string (required for requests)
- `method`: Tool/function name to call (required)
- `params`: Arguments object or array (optional)

### Response Format (Success)

```json
{
  "jsonrpc": "2.0",
  "id": 123,
  "result": {
    "data": "Response data here"
  }
}
```

**Fields**:
- `jsonrpc`: Always `"2.0"` (required)
- `id`: Matches request ID (required)
- `result`: Return value (required for success)

### Response Format (Error)

```json
{
  "jsonrpc": "2.0",
  "id": 123,
  "error": {
    "code": -32601,
    "message": "Method not found",
    "data": {
      "method": "unknown_tool"
    }
  }
}
```

**Fields**:
- `jsonrpc`: Always `"2.0"` (required)
- `id`: Matches request ID (required)
- `error`: Error object (required for errors)
  - `code`: Error code number (required)
  - `message`: Error message string (required)
  - `data`: Additional error data (optional)

### Standard Error Codes

| Code | Meaning | Use Case |
|------|---------|----------|
| -32700 | Parse error | Invalid JSON |
| -32600 | Invalid Request | Missing required fields |
| -32601 | Method not found | Unknown tool name |
| -32602 | Invalid params | Wrong argument types |
| -32603 | Internal error | Server crashed |
| -32000 to -32099 | Server error | Custom MCP errors |

---

## MCP Lifecycle

### 1. Initialization

**Client → Server**: `initialize` request
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": "1.0",
    "capabilities": {
      "tools": {}
    },
    "clientInfo": {
      "name": "mcp-dynamic-orchestrator",
      "version": "1.0.0"
    }
  }
}
```

**Server → Client**: `initialize` response
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "protocolVersion": "1.0",
    "capabilities": {
      "tools": {}
    },
    "serverInfo": {
      "name": "cloudflare-mcp",
      "version": "1.0.0"
    }
  }
}
```

**Client → Server**: `initialized` notification
```json
{
  "jsonrpc": "2.0",
  "method": "initialized"
}
```
(No `id` field = notification, no response expected)

---

### 2. Tool Discovery

**Client → Server**: `tools/list` request
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/list"
}
```

**Server → Client**: Tool list response
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "tools": [
      {
        "name": "search_cloudflare_documentation",
        "description": "Search Cloudflare platform documentation",
        "inputSchema": {
          "type": "object",
          "properties": {
            "query": {
              "type": "string",
              "description": "Search query"
            }
          },
          "required": ["query"]
        }
      },
      {
        "name": "migrate_pages_to_workers_guide",
        "description": "Get migration guide for Pages to Workers",
        "inputSchema": {
          "type": "object",
          "properties": {}
        }
      }
    ]
  }
}
```

**Schema Fields**:
- `name`: Tool identifier (kebab-case recommended)
- `description`: Human-readable description
- `inputSchema`: JSON Schema for arguments

---

### 3. Tool Execution

**Client → Server**: `tools/call` request
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "search_cloudflare_documentation",
    "arguments": {
      "query": "Workers KV API"
    }
  }
}
```

**Server → Client**: Tool result
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "# Workers KV API\n\nWorkers KV is a global, low-latency key-value store..."
      }
    ],
    "isError": false
  }
}
```

**Response Structure**:
- `content`: Array of content blocks
  - `type`: "text", "image", "resource", etc.
  - `text`: Text content (for type="text")
- `isError`: Boolean indicating if tool execution failed

---

### 4. Shutdown

**Client → Server**: `shutdown` request
```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "method": "shutdown"
}
```

**Server → Client**: Shutdown acknowledgment
```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "result": null
}
```

**Client**: Close connection (no more messages)

---

## Transport Layers

### Stdio Transport

**How it works**:
1. Client spawns MCP server as child process
2. Client writes JSON-RPC to server's **stdin**
3. Server writes JSON-RPC to **stdout**
4. Server writes logs to **stderr** (not parsed)

**Implementation** (`src/orchestrator.ts:48-120`):
```typescript
const process = spawn(command, args, {
  stdio: ['pipe', 'pipe', 'pipe']
});

// Write request to stdin
process.stdin.write(JSON.stringify(request) + '\n');

// Read response from stdout
process.stdout.on('data', (chunk) => {
  const lines = chunk.toString().split('\n');
  for (const line of lines) {
    if (line.trim()) {
      const response = JSON.parse(line);
      handleResponse(response);
    }
  }
});
```

**Line Buffering**:
- Each JSON-RPC message is on a single line
- Newline `\n` separates messages
- Empty lines are ignored

**stderr Handling**:
```typescript
process.stderr.on('data', (chunk) => {
  console.error('[MCP stderr]', chunk.toString());
});
```

---

### HTTP Transport

**How it works**:
1. Client makes POST request to MCP server URL
2. Request body is JSON-RPC
3. Response body is JSON-RPC

**Implementation** (`src/orchestrator.ts:122-150`):
```typescript
const response = await fetch(mcpUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    jsonrpc: '2.0',
    id: generateId(),
    method: toolName,
    params: args
  })
});

const result = await response.json();
```

**Differences from stdio**:
- No process spawning
- Stateless (each request is independent)
- Can use HTTP features (auth, caching, load balancing)
- Higher latency (network round-trip)

**Authentication**:
```typescript
const response = await fetch(mcpUrl, {
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.MCP_API_KEY}`
  },
  body: ...
});
```

---

## Orchestrator Implementation Details

### Request ID Generation

**Purpose**: Match responses to requests

**Implementation**:
```typescript
let requestId = 0;

function generateId(): number {
  return ++requestId;
}
```

**Properties**:
- Sequential numbers (1, 2, 3, ...)
- Thread-safe (single-threaded JavaScript)
- Simple and predictable

**Alternative**: UUIDs for distributed systems
```typescript
import { randomUUID } from 'node:crypto';

function generateId(): string {
  return randomUUID();
}
```

---

### Response Matching

**Problem**: Async responses may arrive out of order

**Solution**: Pending requests map
```typescript
const pendingRequests = new Map<number, {
  resolve: (result: any) => void;
  reject: (error: Error) => void;
}>();

async function call(method: string, params: any): Promise<any> {
  const id = generateId();

  return new Promise((resolve, reject) => {
    pendingRequests.set(id, { resolve, reject });

    // Send request
    send({ jsonrpc: '2.0', id, method, params });
  });
}

function handleResponse(response: JsonRpcResponse) {
  const pending = pendingRequests.get(response.id);
  if (!pending) return;

  pendingRequests.delete(response.id);

  if (response.error) {
    pending.reject(new Error(response.error.message));
  } else {
    pending.resolve(response.result);
  }
}
```

---

### Timeout Handling

**Implementation**:
```typescript
async function callWithTimeout(
  method: string,
  params: any,
  timeout: number
): Promise<any> {
  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);

  try {
    const result = await call(method, params, { signal: controller.signal });
    return result;
  } finally {
    clearTimeout(timeoutId);
  }
}
```

**Abort Handling**:
```typescript
signal.addEventListener('abort', () => {
  // Clean up pending request
  const pending = pendingRequests.get(id);
  if (pending) {
    pending.reject(new Error('Request timeout'));
    pendingRequests.delete(id);
  }

  // For stdio: kill process
  if (process && !process.killed) {
    process.kill();
  }
});
```

---

### Error Handling

**JSON-RPC Error → JavaScript Error**:
```typescript
function handleResponse(response: JsonRpcResponse) {
  if (response.error) {
    const error = new Error(response.error.message);
    error.code = response.error.code;
    error.data = response.error.data;
    throw error;
  }

  return response.result;
}
```

**Common Error Patterns**:
```typescript
try {
  const result = await mcp.call('search_docs', { query: 'foo' });
} catch (error) {
  if (error.code === -32601) {
    console.error('Tool not found:', error.message);
  } else if (error.code === -32602) {
    console.error('Invalid arguments:', error.data);
  } else {
    console.error('MCP error:', error.message);
  }
}
```

---

## MCP-Specific Extensions

### Tool Schema (JSON Schema)

**Purpose**: Describe tool arguments for type-checking and validation

**Example**:
```json
{
  "inputSchema": {
    "type": "object",
    "properties": {
      "query": {
        "type": "string",
        "description": "Search query",
        "minLength": 1
      },
      "limit": {
        "type": "number",
        "description": "Max results",
        "minimum": 1,
        "maximum": 100,
        "default": 10
      }
    },
    "required": ["query"]
  }
}
```

**Validation**:
```typescript
import Ajv from 'ajv';

const ajv = new Ajv();

function validateArgs(schema: object, args: any): void {
  const validate = ajv.compile(schema);
  if (!validate(args)) {
    throw new Error(`Invalid arguments: ${JSON.stringify(validate.errors)}`);
  }
}
```

---

### Content Types

**MCP supports multiple content types in responses**:

#### Text Content
```json
{
  "content": [
    {
      "type": "text",
      "text": "Plain text response"
    }
  ]
}
```

#### Image Content
```json
{
  "content": [
    {
      "type": "image",
      "data": "base64-encoded-image-data",
      "mimeType": "image/png"
    }
  ]
}
```

#### Resource Content
```json
{
  "content": [
    {
      "type": "resource",
      "resource": {
        "uri": "https://example.com/doc.pdf",
        "mimeType": "application/pdf",
        "text": "Document content..."
      }
    }
  ]
}
```

**Orchestrator Handling**:
```typescript
function extractTextContent(result: any): string {
  if (!result.content) return JSON.stringify(result);

  const textBlocks = result.content
    .filter(block => block.type === 'text')
    .map(block => block.text);

  return textBlocks.join('\n\n');
}
```

---

## Advanced Features

### Streaming Responses

**Not yet implemented, but planned for MCP spec v2**:

```json
// Request with streaming
{
  "jsonrpc": "2.0",
  "id": 5,
  "method": "tools/call",
  "params": {
    "name": "generate_code",
    "arguments": { "prompt": "..." },
    "stream": true
  }
}

// Partial responses
{
  "jsonrpc": "2.0",
  "id": 5,
  "result": {
    "content": [{ "type": "text", "text": "const foo = " }],
    "partial": true
  }
}

{
  "jsonrpc": "2.0",
  "id": 5,
  "result": {
    "content": [{ "type": "text", "text": "42;" }],
    "partial": false
  }
}
```

---

### Resource Subscriptions

**Subscribe to resource changes**:

```json
// Subscribe request
{
  "jsonrpc": "2.0",
  "id": 6,
  "method": "resources/subscribe",
  "params": {
    "uri": "file:///workspace/config.json"
  }
}

// Notification when resource changes
{
  "jsonrpc": "2.0",
  "method": "resources/updated",
  "params": {
    "uri": "file:///workspace/config.json"
  }
}
```

---

## Debugging

### Logging Requests

```typescript
function send(request: JsonRpcRequest) {
  console.log('[MCP →]', JSON.stringify(request));
  // ... send implementation
}

function handleResponse(response: JsonRpcResponse) {
  console.log('[MCP ←]', JSON.stringify(response));
  // ... response handling
}
```

**Output**:
```
[MCP →] {"jsonrpc":"2.0","id":1,"method":"initialize","params":{...}}
[MCP ←] {"jsonrpc":"2.0","id":1,"result":{...}}
[MCP →] {"jsonrpc":"2.0","id":2,"method":"tools/list"}
[MCP ←] {"jsonrpc":"2.0","id":2,"result":{"tools":[...]}}
```

---

### Testing with `jq`

**Stdio transport**:
```bash
# Start MCP server
npx @modelcontextprotocol/server-time | jq .

# Send initialize request
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}' | \
  npx @modelcontextprotocol/server-time | jq .

# List tools
echo '{"jsonrpc":"2.0","id":2,"method":"tools/list"}' | \
  npx @modelcontextprotocol/server-time | jq .
```

**HTTP transport**:
```bash
# Call HTTP MCP endpoint
curl -X POST https://mcp.example.com/rpc \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | jq .
```

---

### MCP Inspector Tool

**Official MCP debugging tool**:
```bash
# Install
npm install -g @modelcontextprotocol/inspector

# Run
mcp-inspector npx @modelcontextprotocol/server-time
```

**Features**:
- Interactive tool explorer
- Request/response viewer
- Schema validator
- Error debugger

---

## Best Practices

### 1. Always Set Timeouts

```typescript
// ❌ Bad - no timeout
await mcp.call('expensive_operation', {});

// ✅ Good - with timeout
await Promise.race([
  mcp.call('expensive_operation', {}),
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Timeout')), 10000)
  )
]);
```

### 2. Validate Arguments

```typescript
// ❌ Bad - no validation
await mcp.call('search', { query: undefined });

// ✅ Good - validate before calling
if (!query || typeof query !== 'string') {
  throw new Error('query must be a non-empty string');
}
await mcp.call('search', { query });
```

### 3. Handle Errors Gracefully

```typescript
// ❌ Bad - error crashes process
const result = await mcp.call('search', { query });

// ✅ Good - error handled
try {
  const result = await mcp.call('search', { query });
  return result;
} catch (error) {
  console.error('MCP search failed:', error);
  return { error: error.message };
}
```

### 4. Retry Transient Failures

```typescript
async function callWithRetry(
  mcp: McpClient,
  method: string,
  params: any,
  maxRetries = 2
): Promise<any> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await mcp.call(method, params);
    } catch (error) {
      if (attempt === maxRetries) throw error;
      if (error.code === -32603) {
        // Internal error - retry
        await sleep(1000 * (attempt + 1)); // Exponential backoff
        continue;
      }
      throw error; // Non-retriable error
    }
  }
}
```

---

## Common Issues

### Issue 1: "Parse error" (-32700)

**Cause**: Invalid JSON sent to MCP server

**Solution**: Validate JSON before sending
```typescript
try {
  JSON.parse(JSON.stringify(request));
} catch (error) {
  console.error('Invalid JSON:', request);
  throw error;
}
```

### Issue 2: "Method not found" (-32601)

**Cause**: Tool name misspelled or not available

**Solution**: List tools first
```typescript
const tools = await mcp.call('tools/list');
const toolNames = tools.tools.map(t => t.name);

if (!toolNames.includes(toolName)) {
  throw new Error(`Tool ${toolName} not found. Available: ${toolNames.join(', ')}`);
}
```

### Issue 3: "Invalid params" (-32602)

**Cause**: Wrong argument types or missing required fields

**Solution**: Validate against schema
```typescript
const tools = await mcp.call('tools/list');
const tool = tools.tools.find(t => t.name === toolName);

if (tool.inputSchema) {
  validateArgs(tool.inputSchema, args);
}
```

### Issue 4: Process Hangs

**Cause**: No newline after JSON-RPC message (stdio transport)

**Solution**: Always append `\n`
```typescript
// ❌ Bad
process.stdin.write(JSON.stringify(request));

// ✅ Good
process.stdin.write(JSON.stringify(request) + '\n');
```

---

## Resources

- **Official MCP Spec**: https://modelcontextprotocol.io
- **JSON-RPC 2.0 Spec**: https://www.jsonrpc.org/specification
- **MCP SDK (Python)**: https://github.com/modelcontextprotocol/python-sdk
- **MCP SDK (TypeScript)**: https://github.com/modelcontextprotocol/typescript-sdk
- **Example MCPs**: https://github.com/modelcontextprotocol/servers

---

**Last Updated**: 2025-11-11
**Protocol Version**: 1.0
**Maintainer**: Claude Skills Maintainers
