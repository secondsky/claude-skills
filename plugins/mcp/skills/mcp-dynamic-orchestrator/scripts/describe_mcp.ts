import { describeMcp } from "../src/orchestrator";

export default async function tool(input: unknown) {
  if (!input || typeof input !== "object") {
    throw new Error("Missing describe_mcp params");
  }
  const { id, includeTools, maxTools } = input as any;
  if (!id || typeof id !== "string") {
    throw new Error("describe_mcp requires 'id' string");
  }
  return describeMcp({ id, includeTools, maxTools });
}
