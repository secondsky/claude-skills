import { loadRegistry, getToolMetadata } from "./orchestrator";

export async function describe_mcp(input: {
  id: string;
  detail?: "summary" | "tools" | "schema";
}) {
  const { id, detail = "summary" } = input;
  const { servers } = loadRegistry();
  const cfg = servers.find(s => s.id === id);
  if (!cfg) {
    throw new Error(`Unknown MCP id: ${id}`);
  }

  const base = {
    id: cfg.id,
    title: cfg.title,
    summary: cfg.summary,
    domains: cfg.domains,
    tags: cfg.tags,
    examples: cfg.examples,
  };

  if (detail === "summary") return base;

  const tools = await getToolMetadata(id);

  if (detail === "tools") {
    return {
      ...base,
      tools: tools.map(t => ({
        name: t.name,
        summary: t.summary,
      })),
    };
  }

  return {
    ...base,
    tools,
  };
}
