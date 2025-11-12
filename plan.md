# MCP-as-Code Orchestrator Plan

## Goal
Implement a production-grade "MCP as code" solution for Claude Code using the `mcp-dynamic-orchestrator` skill so that:
- MCP servers are declared only in `skills/mcp-dynamic-orchestrator/mcp.registry.json`.
- Claude discovers MCPs and their purpose via small meta-tools, not hundreds of direct tools.
- All real usage flows through generated TypeScript/JS clients and a secure code executor.

## Phase 1 – Public Interface

1. Expose only three tools via `.claude-plugin/plugin.json`:
   - `list_mcp_capabilities`: Discover configured MCPs.
   - `describe_mcp`: Inspect a specific MCP (summary, tools, optional schemas).
   - `execute_mcp_code`: Run TS/JS using `mcp-clients/<id>` to call MCPs.
2. Keep `SKILL.md` minimal and model-optimized:
   - Document the discover → describe → code → execute workflow.
   - Document `mcp.registry.json` as the only config surface.
   - Document empty-registry behavior and file path.

## Phase 2 – MCP Client Layer (`callMcpTool`)

3. Implement an MCP client manager:
   - Reads each server’s `command`, `args`, `env`, `transport` from registry.
   - Lazily spawns/connects MCP servers (stdio/http) per `id`.
   - Caches clients per `id`.
   - Provides:
     - `listTools(id)` for metadata.
     - `callTool(id, tool, args)` for execution.
4. Best practices:
   - Add timeouts, retries, structured errors.
   - No secrets in code; read from env/secure config.
   - Clean up MCP processes; prevent zombie processes.

## Phase 3 – Schema-Based Metadata & Codegen

5. `getToolMetadata(id)`:
   - On first call, use MCP client to fetch tools and schemas.
   - Cache compact entries: `name`, `description`, schema excerpts.
6. `describe_mcp`:
   - `summary`: registry only.
   - `tools`: names + 1-line descriptions from metadata.
   - `schema`: bounded subset of schemas for selected tools.
7. `getClientModuleMap(allowedIds)`:
   - For each allowed MCP, generate virtual modules:
     - `mcp-clients/index.ts` exporting MCP namespaces.
     - `mcp-clients/<id>/index.ts` + per-tool modules.
   - Each tool module:
     - Calls `callMcpTool(id, tool, args)`.
     - Includes JSDoc from schemas and registry ("Use when" hints).
     - Uses strong TS types where feasible; `any` fallback when needed.

## Phase 4 – Secure Code Execution (`execute_mcp_code`)

8. Implement sandboxed runtime:
   - Input: `language`, `files`, `entrypoint`, `allowedMcpIds`, `maxRuntimeMs`, `maxLogs`.
   - Build `mergedFiles` = user files + generated `mcp-clients/*` + `runtime` shim.
   - Execute in an isolated environment with:
     - No general outbound network.
     - No unrestricted filesystem.
     - Only MCP access via `callMcpTool`.
   - Return `{ logs, result, errors? }`.
9. Claude Code integration:
   - Use the repo’s existing Node/Bun runtime or a controlled worker process.
   - Enforce CPU/time/memory limits.
   - Disallow dynamic requires outside `mcp-clients/*` and safe stdlib.

## Phase 5 – Safety & Opt-In Controls

10. Use registry fields:
    - `visibility`: default vs opt_in vs experimental.
    - `sensitivity`: low/medium/high.
11. Enforcement:
    - `list_mcp_capabilities` defaults to `visibility: ["default"]`.
    - `execute_mcp_code` only loads opt-in MCPs if explicitly requested.
    - `callMcpTool` checks MCP id against allowed lists; apply per-MCP timeouts & rate limits.

## Phase 6 – Testing & Validation

12. Unit tests:
    - Registry parsing & validation.
    - `searchCapabilities` scoring & filters.
    - `describe_mcp` behavior for all detail levels.
    - Codegen layout for a mocked MCP server.
13. Integration tests:
    - Run simple MCP servers (e.g., `time`, `grep-mcp`) locally.
    - Verify: discover → describe → code → execute flow works end-to-end.
14. Manual Claude Code scenarios:
    - Example: call Cloudflare MCP via code to fetch Workers KV docs.
    - Confirm Claude never sees raw MCP tools, only the orchestrator interface.

## Phase 7 – Portability

15. Keep `orchestrator.ts` and `mcp.registry.json` framework-agnostic.
16. For other agents (OpenAI, Cloudflare Agents), expose the same 3-tool API and reuse the orchestrator.
