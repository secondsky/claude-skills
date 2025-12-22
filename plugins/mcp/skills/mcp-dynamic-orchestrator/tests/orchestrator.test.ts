import {
  loadRegistry,
  listMcpCapabilities,
  describeMcp,
  getClientModuleMap,
  getMcpExecutionPolicy,
} from "../src/orchestrator";

// Minimal smoke tests; host/CI can run via node or bun.

function assert(condition: any, message: string) {
  if (!condition) throw new Error(message);
}

(async () => {
  const reg = loadRegistry();
  assert(Array.isArray(reg.servers), "Registry servers should be an array");

  const list = listMcpCapabilities({});
  assert(Array.isArray(list.mcpServers), "list_mcp_capabilities should return mcpServers array");
  if (list.mcpServers[0]) {
    const entry = reg.servers.find((s) => s.id === list.mcpServers[0].id)!;
    const policy = getMcpExecutionPolicy(entry);
    assert(policy.id === entry.id, "execution policy should bind to entry");
  }

  if (list.mcpServers.length > 0) {
    const id = list.mcpServers[0].id;
    const desc = await describeMcp({ id });
    assert(desc.id === id, "describe_mcp should echo id");
  }

  const map = getClientModuleMap([]);
  assert(typeof map["mcp-clients/index.ts"] === "string", "client module index should exist");
})();
