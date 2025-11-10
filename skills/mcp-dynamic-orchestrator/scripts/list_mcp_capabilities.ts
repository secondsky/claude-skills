import { searchCapabilities } from "./orchestrator";

export async function list_mcp_capabilities(input: {
  query?: string;
  tags?: string[];
  domains?: string[];
  visibilityFilter?: string[];
  limit?: number;
  detail?: "minimal" | "summary";
}) {
  const result = searchCapabilities(input ?? {});

  if (!result.servers.length) {
    return {
      servers: [],
      message:
        "No MCP servers are currently configured for this skill. Please add entries to 'skills/mcp-dynamic-orchestrator/mcp.registry.json' and re-run."
    };
  }

  return result;
}
