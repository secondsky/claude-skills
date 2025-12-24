import vm from "node:vm";

import { getClientModuleMap, ExecuteMcpCodeParams } from "./orchestrator";

export interface SandboxResult {
  logs: string[];
  result?: unknown;
  error?: string;
}

export async function runInSandbox(params: ExecuteMcpCodeParams): Promise<SandboxResult> {
  const logs: string[] = [];

  if (process.env.MCP_ORCH_ENABLE_SANDBOX !== "1") {
    return { logs, error: "Sandbox execution is disabled." };
  }

  if (!params.files[params.entrypoint]) {
    return { logs, error: "Entrypoint file not found." };
  }

  const modules = { ...params.files, ...getClientModuleMap(params.allowedMcpIds) };

  const sandboxConsole = {
    log: (...args: any[]) => {
      if (logs.length < (params.maxLogs ?? 200)) logs.push(args.map(String).join(" "));
    },
  };

  const context = vm.createContext({ console: sandboxConsole });
  const code = modules[params.entrypoint];

  try {
    const script = new vm.Script(code, { filename: params.entrypoint });
    const timeout = params.maxRuntimeMs ?? 10_000;
    const result = script.runInContext(context, { timeout });
    return { logs, result };
  } catch (err: any) {
    return { logs, error: String(err?.message || err) };
  }
}
