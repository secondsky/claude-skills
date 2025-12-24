import fs from "node:fs";
import path from "node:path";
import { spawn, ChildProcessWithoutNullStreams } from "node:child_process";
import vm from "node:vm";

// Basic types
export type McpVisibility = "default" | "opt_in" | "experimental";
export type McpSensitivity = "low" | "medium" | "high";

export interface McpRegistryEntry {
  id: string;
  title?: string;
  summary?: string;
  mcp: {
    transport: "stdio" | "http";
    command?: string;
    args?: string[];
    url?: string;
    env?: Record<string, string>;
  };
  tags?: string[];
  domains?: string[];
  examples?: string[];
  visibility?: McpVisibility;
  sensitivity?: McpSensitivity;
  priority?: number;
  autoDiscoverTools?: boolean;
}

export interface McpRegistryFile {
  servers: McpRegistryEntry[];
}

export interface McpToolSummary {
  name: string;
  description?: string;
  inputSchemaSummary?: string;
}

const registryPath = path.resolve(__dirname, "..", "mcp.registry.json");
let cachedRegistry: McpRegistryFile | null = null;

// Minimal MCP JSON-RPC client for stdio servers (list_tools + call_tool)
interface JsonRpcErrorShape {
  code: number;
  message: string;
  data?: unknown;
}

interface StdioClient {
  child: ChildProcessWithoutNullStreams;
  buffer: string;
  requestId: number;
  pending: Map<
    number,
    {
      resolve: (v: any) => void;
      reject: (e: Error & { code?: number; data?: unknown }) => void;
    }
  >;
}

const stdioClients = new Map<string, StdioClient>();

function normalizeRegistry(raw: unknown): McpRegistryFile {
  if (!raw || typeof raw !== "object") return { servers: [] };
  const obj = raw as any;
  if (Array.isArray(obj)) return { servers: obj } as McpRegistryFile;
  if (Array.isArray(obj.servers)) return obj as McpRegistryFile;
  if (Array.isArray(obj.mcpServers)) return { servers: obj.mcpServers } as McpRegistryFile;
  return { servers: [] };
}

export function loadRegistry(): McpRegistryFile {
  if (cachedRegistry) return cachedRegistry;
  if (!fs.existsSync(registryPath)) {
    cachedRegistry = { servers: [] };
    return cachedRegistry;
  }
  const raw = fs.readFileSync(registryPath, "utf8");
  const parsed = JSON.parse(raw);
  cachedRegistry = normalizeRegistry(parsed);
  cachedRegistry.servers ??= [];
  return cachedRegistry;
}

function getEntry(id: string): McpRegistryEntry | undefined {
  return loadRegistry().servers.find((e) => e.id === id);
}

// Safety helpers
function isOptIn(entry: McpRegistryEntry): boolean {
  const vis = entry.visibility ?? "default";
  return vis === "opt_in" || vis === "experimental";
}

function isHighSensitivity(entry: McpRegistryEntry): boolean {
  return (entry.sensitivity ?? "medium") === "high";
}

export interface McpExecutionPolicy {
  id: string;
  timeoutMs: number;
  maxCalls: number;
  allowByDefault: boolean;
}

export function getMcpExecutionPolicy(entry: McpRegistryEntry): McpExecutionPolicy {
  const sensitivity = entry.sensitivity ?? "medium";
  const visibility = entry.visibility ?? "default";

  if (sensitivity === "high") {
    return {
      id: entry.id,
      timeoutMs: 5_000,
      maxCalls: 10,
      allowByDefault: false,
    };
  }

  if (visibility === "opt_in" || visibility === "experimental") {
    return {
      id: entry.id,
      timeoutMs: 7_500,
      maxCalls: 20,
      allowByDefault: false,
    };
  }

  return {
    id: entry.id,
    timeoutMs: 10_000,
    maxCalls: 50,
    allowByDefault: true,
  };
}

// MCP stdio client (reference implementation; host may replace if needed)
function getStdioClient(entry: McpRegistryEntry): StdioClient {
  const existing = stdioClients.get(entry.id);
  if (existing) return existing;

  if (!entry.mcp.command) {
    throw new Error(`Missing mcp.command for ${entry.id}`);
  }

  const child = spawn(entry.mcp.command, entry.mcp.args ?? [], {
    stdio: ["pipe", "pipe", "pipe"],
    env: { ...process.env, ...(entry.mcp.env ?? {}) },
  });

  const client: StdioClient = {
    child,
    buffer: "",
    requestId: 1,
    pending: new Map(),
  };

  child.stdout.on("data", (chunk: Buffer) => {
    client.buffer += chunk.toString("utf8");
    // Expect JSON-per-line responses for simplicity.
    let idx: number;
    while ((idx = client.buffer.indexOf("\n")) >= 0) {
      const line = client.buffer.slice(0, idx).trim();
      client.buffer = client.buffer.slice(idx + 1);
      if (!line) continue;
      try {
        const msg = JSON.parse(line);
        const id = msg.id as number | undefined;
        if (id && client.pending.has(id)) {
          const { resolve, reject } = client.pending.get(id)!;
          client.pending.delete(id);
          if (msg.error) reject(msg.error);
          else resolve(msg.result);
        }
      } catch {
        // Ignore malformed lines; callers should handle timeouts.
      }
    }
  });

  child.on("exit", () => {
    for (const { reject } of client.pending.values()) {
      reject(new Error(`MCP process for ${entry.id} exited`));
    }
    client.pending.clear();
    stdioClients.delete(entry.id);
  });

  stdioClients.set(entry.id, client);
  return client;
}

async function stdioRequest(
  entry: McpRegistryEntry,
  method: string,
  params: any,
  timeoutMs: number,
  attempt = 1
): Promise<any> {
  const client = getStdioClient(entry);
  const id = client.requestId++;
  const payload = JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n";

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      if (client.pending.has(id)) {
        client.pending.delete(id);
        const err = new Error(
          `MCP request timeout: ${method} (${entry.id}), attempt ${attempt}`
        ) as Error & { code?: number };
        err.code = -32000;
        if (attempt < 2) {
          stdioRequest(entry, method, params, timeoutMs, attempt + 1)
            .then(resolve)
            .catch(reject);
        } else {
          reject(err);
        }
      }
    }, timeoutMs);

    client.pending.set(id, {
      resolve: (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      reject: (e) => {
        clearTimeout(timer);
        const errObj: JsonRpcErrorShape | undefined =
          e && typeof e === "object" && "code" in e && "message" in e
            ? (e as JsonRpcErrorShape)
            : undefined;
        const err = new Error(
          errObj?.message || `MCP request failed: ${method} (${entry.id})`
        ) as Error & { code?: number; data?: unknown };
        if (errObj) {
          err.code = errObj.code;
          err.data = errObj.data;
        }
        if (attempt < 2 && (err.code === -32000 || err.code === -32001)) {
          stdioRequest(entry, method, params, timeoutMs, attempt + 1)
            .then(resolve)
            .catch(reject);
        } else {
          reject(err);
        }
      },
    });

    client.child.stdin.write(payload);
  });
}

// Tool metadata cache
const toolCache = new Map<string, { tools: McpToolSummary[]; fetchedAt: number }>();
const TOOL_CACHE_TTL_MS = 60_000;

async function listTools(id: string): Promise<McpToolSummary[]> {
  const now = Date.now();
  const cached = toolCache.get(id);
  if (cached && now - cached.fetchedAt < TOOL_CACHE_TTL_MS) {
    return cached.tools;
  }

  const entry = getEntry(id);
  if (!entry) throw new Error(`Unknown MCP id: ${id}`);
  if (!entry.autoDiscoverTools) {
    const tools: McpToolSummary[] = [];
    toolCache.set(id, { tools, fetchedAt: now });
    return tools;
  }

  if (entry.mcp.transport === "stdio") {
    try {
      const result = await stdioRequest(entry, "list_tools", {}, 5000);
      const tools: McpToolSummary[] = Array.isArray(result?.tools)
        ? result.tools.map((t: any) => ({
            name: t.name,
            description: t.description,
            inputSchemaSummary: summarizeSchema(t.inputSchema),
          }))
        : [];
      toolCache.set(id, { tools, fetchedAt: now });
      return tools;
    } catch {
      const tools: McpToolSummary[] = [];
      toolCache.set(id, { tools, fetchedAt: now });
      return tools;
    }
  }

  if (entry.mcp.transport === "http" && entry.mcp.url) {
    try {
      const url = new URL("/list_tools", entry.mcp.url).toString();
      const controller = new AbortController();
      const to = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "list_tools", params: {} }),
        signal: controller.signal,
      });
      clearTimeout(to);
      if (res.ok) {
        const body = await res.json().catch(() => ({}));
        const tools: McpToolSummary[] = Array.isArray(body?.result?.tools)
          ? body.result.tools.map((t: any) => ({
              name: t.name,
              description: t.description,
              inputSchemaSummary: summarizeSchema(t.inputSchema),
            }))
          : [];
        toolCache.set(id, { tools, fetchedAt: now });
        return tools;
      }
    } catch {
      // fall through
    }
  }

  const tools: McpToolSummary[] = [];
  toolCache.set(id, { tools, fetchedAt: now });
  return tools;
}

function summarizeSchema(schema: any, max = 400): string | undefined {
  if (!schema || typeof schema !== "object") return undefined;
  try {
    const str = JSON.stringify(schema);
    return str.length > max ? str.slice(0, max) + "..." : str;
  } catch {
    return undefined;
  }
}

export async function callTool(
  id: string,
  tool: string,
  args: unknown,
  opts?: { timeoutMs?: number; allowedMcpIds?: string[] }
): Promise<unknown> {
  const entry = getEntry(id);
  if (!entry) throw new Error(`Unknown MCP id: ${id}`);

  if (opts?.allowedMcpIds && !opts.allowedMcpIds.includes(id)) {
    throw new Error(`MCP id '${id}' not allowed by sandbox`);
  }

  const timeoutMs = opts?.timeoutMs ?? 10_000;

  if (entry.mcp.transport === "stdio") {
    const knownTools = toolCache.get(id)?.tools;
    if (knownTools && !knownTools.some((t) => t.name === tool)) {
      // Allow unknown names; registry cache may be stale.
    }
    return stdioRequest(entry, "call_tool", { name: tool, arguments: args }, timeoutMs);
  }

  if (entry.mcp.transport === "http" && entry.mcp.url) {
    const url = new URL("/call_tool", entry.mcp.url).toString();
    const controller = new AbortController();
    const to = setTimeout(() => controller.abort(), timeoutMs);
    return fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: id + 1, jsonrpc: "2.0", method: "call_tool", params: { name: tool, arguments: args } }),
      signal: controller.signal,
    })
      .then(async (res) => {
        clearTimeout(to);
        if (!res.ok) {
          throw new Error(`HTTP MCP ${id} responded with ${res.status}`);
        }
        const body = await res.json().catch(() => ({}));
        if (body.error) {
          const err = new Error(body.error.message || "MCP HTTP call_tool error") as Error & {
            code?: number;
            data?: unknown;
          };
          if (typeof body.error.code === "number") err.code = body.error.code;
          if ("data" in body.error) err.data = body.error.data;
          throw err;
        }
        return body.result;
      })
      .catch((e: any) => {
        if (e?.name === "AbortError") {
          const err = new Error(`MCP HTTP request timeout: call_tool (${id})`) as Error & { code?: number };
          err.code = -32000;
          throw err;
        }
        throw e;
      });
  }

  throw new Error(`Unsupported MCP transport for ${id}: ${entry.mcp.transport}`);
}

// Tool: list_mcp_capabilities
export interface ListMcpCapabilitiesParams {
  query?: string;
  visibility?: McpVisibility[];
}

export function listMcpCapabilities(params: ListMcpCapabilitiesParams = {}) {
  const { query, visibility } = params;
  const reg = loadRegistry();
  const visSet = visibility && visibility.length ? new Set(visibility) : null;
  const q = query?.toLowerCase().trim() ?? "";

  const items = reg.servers
    .filter((entry) => {
      const vis = entry.visibility ?? "default";
      if (!visSet && vis !== "default") return false;
      if (visSet && !visSet.has(vis)) return false;
      if (!q) return true;
      const haystack = [
        entry.id,
        entry.title,
        entry.summary,
        ...(entry.tags ?? []),
        ...(entry.domains ?? []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    })
    .map((entry) => ({
      id: entry.id,
      title: entry.title,
      summary: entry.summary,
      visibility: entry.visibility ?? "default",
      sensitivity: entry.sensitivity ?? "medium",
      tags: entry.tags ?? [],
      domains: entry.domains ?? [],
    }));

  return { mcpServers: items };
}

// Tool: describe_mcp
export interface DescribeMcpParams {
  id: string;
  includeTools?: boolean;
  maxTools?: number;
  includeSchemas?: boolean;
  maxSchemaBytes?: number;
}

export async function describeMcp(params: DescribeMcpParams) {
  const entry = getEntry(params.id);
  if (!entry) {
    throw new Error(`MCP id not found: ${params.id}`);
  }

  const base = {
    id: entry.id,
    title: entry.title,
    summary: entry.summary,
    visibility: entry.visibility ?? "default",
    sensitivity: entry.sensitivity ?? "medium",
    tags: entry.tags ?? [],
    domains: entry.domains ?? [],
    examples: entry.examples ?? [],
  };

  if (!params.includeTools) {
    return { ...base, tools: [] };
  }

  let tools: McpToolSummary[] = [];
  try {
    tools = await listTools(entry.id);
  } catch {
    tools = [];
  }

  const maxTools = params.maxTools && params.maxTools > 0 ? params.maxTools : tools.length;
  const maxSchemaBytes = params.maxSchemaBytes && params.maxSchemaBytes > 0 ? params.maxSchemaBytes : 400;

  const limited = tools.slice(0, maxTools).map((t) => ({
    name: t.name,
    description: t.description,
    inputSchemaSummary:
      t.inputSchemaSummary && t.inputSchemaSummary.length > maxSchemaBytes
        ? t.inputSchemaSummary.slice(0, maxSchemaBytes) + "..."
        : t.inputSchemaSummary,
  }));

  return {
    ...base,
    tools: limited,
  };
}

// Virtual client module generation for execute_mcp_code
export function getClientModuleMap(allowedMcpIds: string[]): Record<string, string> {
  const reg = loadRegistry();
  const allowed = new Set(allowedMcpIds);
  const modules: Record<string, string> = {};
  const exportsIndex: string[] = [];

  for (const entry of reg.servers) {
    if (!allowed.has(entry.id)) continue;
    const safeNs = entry.id.replace(/[^a-zA-Z0-9_]/g, "_");
    const nsPath = `mcp-clients/${entry.id}/index.ts`;

    const nsSource = [
      `import { callTool } from 'mcp-runtime';`,
      ``,
      `// Auto-generated client for MCP '${entry.id}'.`,
      `export async function $call(toolName: string, args: any): Promise<any> {`,
      `  return callTool('${entry.id}', toolName, args);`,
      `}`,
      ``,
    ].join("\n");

    modules[nsPath] = nsSource;
    exportsIndex.push(`export * as ${safeNs} from './${entry.id}/index';`);
  }

  modules["mcp-clients/index.ts"] = exportsIndex.join("\n");
  return modules;
}

// execute_mcp_code
export interface ExecuteMcpCodeParams {
  language: "ts" | "js";
  files: Record<string, string>;
  entrypoint: string;
  allowedMcpIds: string[];
  maxRuntimeMs?: number;
  maxLogs?: number;
}

export async function executeMcpCode(
  params: ExecuteMcpCodeParams
): Promise<{ logs: string[]; result?: unknown; error?: string }> {
  const logs: string[] = [];

  if (params.language !== "ts" && params.language !== "js") {
    return { logs, error: "Invalid language. Use 'ts' or 'js'." };
  }
  if (!params.entrypoint || !params.files[params.entrypoint]) {
    return { logs, error: "Entrypoint file not found in 'files'." };
  }
  if (!Array.isArray(params.allowedMcpIds) || params.allowedMcpIds.length === 0) {
    return { logs, error: "allowedMcpIds must specify which MCPs the code may use." };
  }

  const reg = loadRegistry();
  const allowedSet = new Set(params.allowedMcpIds);
  const effectiveAllowed: string[] = [];
  const policies: McpExecutionPolicy[] = [];

  for (const entry of reg.servers) {
    if (!allowedSet.has(entry.id)) continue;
    const policy = getMcpExecutionPolicy(entry);
    if (!policy.allowByDefault && !allowedSet.has(entry.id)) continue;
    effectiveAllowed.push(entry.id);
    policies.push(policy);
  }

  if (effectiveAllowed.length === 0) {
    return { logs, error: "No allowed MCP ids match registry or safety rules." };
  }

  const virtualModules = getClientModuleMap(effectiveAllowed);

  logs.push("execute_mcp_code: contract-only implementation.");
  logs.push("Host must run merged files + virtual mcp-clients/* in a secure sandbox.");

  if (process.env.MCP_ORCH_ENABLE_SANDBOX === "1") {
    logs.push("MCP_ORCH_ENABLE_SANDBOX is set; running reference in-process sandbox.");

    try {
      const mergedFiles: Record<string, string> = {
        ...params.files,
        ...virtualModules,
      };

      const sandboxConsole = {
        log: (...args: any[]) => {
          if (logs.length < (params.maxLogs ?? 200)) {
            logs.push(args.map(String).join(" "));
          }
        },
      };

      const context = vm.createContext({ console: sandboxConsole });
      const entryCode = mergedFiles[params.entrypoint];
      const script = new vm.Script(entryCode, { filename: params.entrypoint });
      const timeout = params.maxRuntimeMs ?? 10_000;
      const sandboxResult = script.runInContext(context, { timeout });

      return {
        logs,
        result: {
          allowedMcpIds: effectiveAllowed,
          virtualModuleCount: Object.keys(virtualModules).length,
          maxRuntimeMs: timeout,
          maxLogs: params.maxLogs ?? 200,
          policies,
          sandboxResult,
        },
      };
    } catch (err: any) {
      return { logs, error: String(err?.message || err) };
    }
  }

  return {
    logs,
    result: {
      allowedMcpIds: effectiveAllowed,
      virtualModuleCount: Object.keys(virtualModules).length,
      maxRuntimeMs: params.maxRuntimeMs ?? 10000,
      maxLogs: params.maxLogs ?? 200,
      policies,
    },
  };
}
