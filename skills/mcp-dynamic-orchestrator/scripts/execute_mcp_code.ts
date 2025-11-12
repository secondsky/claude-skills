import { executeMcpCode } from "../src/orchestrator";

export default async function tool(input: unknown) {
  if (!input || typeof input !== "object") {
    throw new Error("Missing execute_mcp_code params");
  }
  const { language, files, entrypoint, allowedMcpIds, maxRuntimeMs, maxLogs } = input as any;

  return executeMcpCode({
    language,
    files,
    entrypoint,
    allowedMcpIds,
    maxRuntimeMs,
    maxLogs,
  });
}
