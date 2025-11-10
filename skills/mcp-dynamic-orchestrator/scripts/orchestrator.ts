import fs from "node:fs";
import path from "node:path";

export interface McpServerConfig {
  id: string;
  title: string;
  summary: string;
  mcp: {
    transport: "stdio" | "http" | string;
    command?: string;
    url?: string;
    args?: string[];
  };
  domains: string[];
  tags: string[];
  examples: string[];
  sensitivity: "low" | "medium" | "high";
  visibility: "default" | "opt_in" | "experimental";
  priority: number;
  autoDiscoverTools?: boolean;
}

export interface McpRegistry {
  servers: McpServerConfig[];
}

export interface McpToolSummary {
  name: string;
  summary: string;
  inputSummary?: string;
  outputSummary?: string;
}

let cachedRegistry: McpRegistry | null = null;

export function loadRegistry(): McpRegistry {
  if (cachedRegistry) return cachedRegistry;
  const registryPath = path.join(__dirname, "..", "mcp.registry.json");
  const raw = fs.readFileSync(registryPath, "utf8");
  const parsed = JSON.parse(raw) as McpRegistry;
  cachedRegistry = parsed;
  return parsed;
}

export interface ListCapabilitiesInput {
  query?: string;
  tags?: string[];
  domains?: string[];
  visibilityFilter?: string[];
  limit?: number;
}

export function searchCapabilities(input: ListCapabilitiesInput) {
  const { query, tags, domains, visibilityFilter, limit = 20 } = input;
  const { servers } = loadRegistry();

  const q = query?.toLowerCase().trim();
  const tagSet = new Set((tags ?? []).map(t => t.toLowerCase()));
  const domainSet = new Set((domains ?? []).map(d => d.toLowerCase()));
  const visibilitySet = visibilityFilter ? new Set(visibilityFilter) : null;

  const scored = servers
    .filter(s => !visibilitySet || visibilitySet.has(s.visibility))
    .map(s => {
      let score = s.priority ?? 0;
      if (q) {
        const haystack = [
          s.id,
          s.title,
          s.summary,
          ...s.tags,
          ...s.domains,
          ...s.examples,
        ]
          .join(" ")
          .toLowerCase();
        if (haystack.includes(q)) score += 5;
      }
      if (tagSet.size) {
        const sTags = new Set(s.tags.map(t => t.toLowerCase()));
        for (const t of tagSet) if (sTags.has(t)) score += 2;
      }
      if (domainSet.size) {
        const sDomains = new Set(s.domains.map(d => d.toLowerCase()));
        for (const d of domainSet) if (sDomains.has(d)) score += 2;
      }
      return { server: s, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ server }) => ({
      id: server.id,
      title: server.title,
      summary: server.summary,
      domains: server.domains,
      tags: server.tags,
      examples: server.examples,
      sensitivity: server.sensitivity,
      visibility: server.visibility,
      priority: server.priority,
    }));

  return { servers: scored };
}

const toolCache = new Map<string, McpToolSummary[]>();

export async function getToolMetadata(id: string): Promise<McpToolSummary[]> {
  if (toolCache.has(id)) return toolCache.get(id)!;

  const { servers } = loadRegistry();
  const cfg = servers.find(s => s.id === id);
  if (!cfg) throw new Error(`Unknown MCP id: ${id}`);

  if (!cfg.autoDiscoverTools) {
    toolCache.set(id, []);
    return [];
  }

  // TODO: integrate real MCP client and schemas.
  const tools: McpToolSummary[] = [];

  toolCache.set(id, tools);
  return tools;
}

export interface ClientModuleMap {
  [filePath: string]: string;
}

export async function getClientModuleMap(allowedIds?: string[]): Promise<ClientModuleMap> {
  const { servers } = loadRegistry();
  const allowed = new Set(
    allowedIds && allowedIds.length ? allowedIds : servers.map(s => s.id),
  );

  const map: ClientModuleMap = {};
  const rootExports: string[] = [];

  for (const s of servers) {
    if (!allowed.has(s.id)) continue;
    rootExports.push(`export * as ${safeIdent(s.id)} from "./${s.id}/index";`);
  }

  map["mcp-clients/index.ts"] = rootExports.join("\n") || "export {};";

  for (const s of servers) {
    if (!allowed.has(s.id)) continue;
    const tools = await getToolMetadata(s.id);
    const dir = `mcp-clients/${s.id}`;
    const indexLines: string[] = [];

    for (const t of tools) {
      const fnName = safeIdent(t.name);
      const filePath = `${dir}/${t.name}.ts`;
      indexLines.push(`export * from "./${t.name}";`);
      map[filePath] = genToolModule(s.id, t.name, t.summary, fnName);
    }

    map[`${dir}/index.ts`] = indexLines.join("\n") || "export {};";
  }

  return map;
}

function safeIdent(name: string): string {
  return name.replace(/[^a-zA-Z0-9_]/g, "_");
}

function genToolModule(mcpId: string, toolName: string, summary: string, fnName: string): string {
  return `// Auto-generated client for ${mcpId}.${toolName}
import { callMcpTool } from "../runtime";

export interface ${fnName}Input {
  [key: string]: any;
}

export type ${fnName}Output = any;

/** ${summary || `Call ${toolName} on MCP server ${mcpId}`} */
export async function ${fnName}(input: ${fnName}Input): Promise<${fnName}Output> {
  return callMcpTool("${mcpId}", "${toolName}", input);
}
`;
}

export async function callMcpTool(mcpId: string, toolName: string, args: any): Promise<any> {
  const { servers } = loadRegistry();
  const cfg = servers.find(s => s.id === mcpId);
  if (!cfg) throw new Error(`Unknown MCP id: ${mcpId}`);

  // TODO: wire to actual MCP client implementation.
  throw new Error("callMcpTool not implemented; integrate MCP SDK here.");
}
