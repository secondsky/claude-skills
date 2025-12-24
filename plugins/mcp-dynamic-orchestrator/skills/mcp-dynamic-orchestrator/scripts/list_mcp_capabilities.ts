import { listMcpCapabilities } from "../src/orchestrator";

export default async function tool(input: unknown) {
  const params = (input && typeof input === "object") ? (input as any) : {};
  return listMcpCapabilities({
    query: params.query,
    visibility: params.visibility,
  });
}
