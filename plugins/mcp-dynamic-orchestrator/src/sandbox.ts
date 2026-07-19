// ⚠️ SECURITY WARNING (B-003) ⚠️
//
// The `vm`-based sandbox in this file is NOT a security boundary. Node's `vm`
// module can be escaped (prototype pollution, constructor access, Promise
// manipulation, etc. — see https://nodejs.org/api/vm.html#vm-executing-javascript
// which states: "The vm module is not a security mechanism. Do not use it to
// run untrusted code.").
//
// This module only reduces accidental damage from trusted, agent-generated
// code (e.g. catching typos and runaway loops via the run timeout). For
// untrusted MCP entries or user-provided code, run them in a SEPARATE process
// or container with proper OS-level isolation. The honesty warning is also
// emitted at runtime via `emitSandboxHonestyWarning()` in orchestrator.ts
// whenever `MCP_ORCH_ENABLE_SANDBOX=1` is honored.
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

  // B-003: surface the honesty warning on every entry so it appears in logs
  // regardless of which sandbox entrypoint is used.
  process.stderr.write(
    "[mcp-orchestrator] WARNING: MCP_ORCH_ENABLE_SANDBOX uses Node's vm module, which is NOT a security boundary. Do not rely on it for untrusted code.\n"
  );

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
