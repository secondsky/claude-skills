# AI Gateway and the Cloudflare MCP server

Two optional paths on top of plain REST calls: routing through an AI Gateway,
and calling the Cloudflare API through the Cloudflare MCP server. Facts
verified against Cloudflare docs on 2026-10-20; inferred patterns are labeled.

## AI Gateway

### What it adds

Routing model calls through an AI Gateway provides unified logging and
analytics, response caching, rate limiting, retries, and security controls,
plus dynamic routing (fallbacks, A/B tests). Without a gateway you get none of
that — the script's own retry loop is all you have. For a QA run over hundreds
of frames, the useful pieces are caching (identical re-reads of unchanged
frames cost nothing) and logs (a per-request spend trail).

### The unified endpoint (current, documented form)

Same URL as plain Workers AI, one mandatory extra header:

```
POST https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/ai/run/@cf/cloudflare/clef
Authorization: Bearer {CLOUDFLARE_API_TOKEN}
cf-aig-gateway-id: {GATEWAY_ID}
Content-Type: application/json
```

- The `cf-aig-gateway-id` header is required when routing through a gateway
  (for example `cf-aig-gateway-id: default`). Without a gateway configured,
  the script calls the API directly and sends no such header.
- Auth stays the Cloudflare API token. An AI-Gateway-only token returns 401
  (error code 10000); the token needs Workers AI - Read (account scope).
- A `default` gateway is auto-created; it uses Standard billing. To spend
  prepaid credits, the gateway must be on Unified billing.

In this skill, set `CLEFCUT_GATEWAY_ID` in the environment and the script
routes through the gateway.

### Per-request cache headers

Caching is DISABLED by default. Sending `cf-aig-cache-key` alone opts the
request in.

| Header | Effect |
|---|---|
| `cf-aig-cache-key` | Custom cache key; its presence opts the request into caching |
| `cf-aig-cache-ttl` | TTL in seconds; min 60 s, max 1 month. Default TTL when caching is on with no TTL set: 5 minutes |
| `cf-aig-cache-status` (response) | `HIT` or `MISS` |
| `cf-aig-skip-cache: true` | Bypass the cache for this request |

The default cache key is a SHA-256 over provider, endpoint, model, provider
auth header, and the FULL request body — exact-match caching only. Re-reading
the same unchanged frame bytes with the same questions is a HIT; any change to
the question text is a MISS. Only text and image responses are cacheable, and
the cache is volatile.

Other per-request headers (they override gateway-level settings):
`cf-aig-max-attempts` (retry attempts), `cf-aig-retry-delay`,
`cf-aig-backoff`, `cf-aig-request-timeout`, `cf-aig-metadata` (tag requests
with ids), `cf-aig-collect-log`, `cf-aig-custom-cost`. Using
`cf-aig-max-attempts` moves retries from the client loop into the gateway —
handy for batch sweeps.

### The legacy provider form — do not use

A provider-specific form `https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_id}/{provider}`
exists generically and Workers AI is among its providers, but the live
Workers-AI provider documentation no longer shows this URL, and the exact
workers-ai path segment is unverified. Use the unified `api.cloudflare.com`
form above only. Do not put the `gateway.ai.cloudflare.com` form into scripts
or docs without testing it first.

## Cloudflare API MCP server

### What it is

- URL: `https://mcp.cloudflare.com/mcp` (Streamable HTTP; old `/sse` URLs are
  aliases). Docs server: `https://docs.mcp.cloudflare.com/mcp`.
- Client config: `{"mcpServers": {"cloudflare-api": {"url": "https://mcp.cloudflare.com/mcp"}}}`.
- Auth: interactive OAuth (redirect to Cloudflare, pick permissions) or, for
  CI/CD, a Cloudflare API token passed as a bearer token in the
  `Authorization` header (user and account tokens both work).

### Search-and-execute (Code Mode)

The server exposes two tools, `search` and `execute`, each taking a single
required `code` property — a JavaScript async arrow function. This keeps the
tool schemas tiny (~1,000 tokens instead of ~1,170,000 for full schemas).

- `search`: code runs against `spec` — the full OpenAPI spec with `$refs`
  pre-resolved. Example from the docs:
  `spec.paths['/zones/{zone_id}/rulesets']?.get`.
- `execute`: code gets an authenticated client and runs in an isolated
  Dynamic Worker sandbox. Verbatim docs example:
  `await cloudflare.request({ method: "GET", path: \`/zones/${zoneId}/rulesets\` })`.

### Pattern for a clef call through execute — INFERRED

The rulesets example above is documented verbatim; the `/ai/run` adaptation
below is a pattern inferred from it, not a docs example. Read the request
schema with `search` first, then:

```js
// search: read the endpoint's request schema
async () => spec.paths['/accounts/{account_id}/ai/run/{model_name}']?.post

// execute: run the clef call (path-param spelling and body-passing inferred)
async () => await cloudflare.request({
  method: "POST",
  path: `/accounts/${accountId}/ai/run/@cf/cloudflare/clef`,
  body: { model: "clef", state, questions },
})
```

If the path parameters or body handling differ, `search` will show the real
shape — trust it over this pattern.

### When MCP is worth it

- Use the MCP path when the user already has the Cloudflare MCP server
  connected, or wants to explore the API shape interactively (search the spec,
  inspect schemas) before committing to a script change.
- Use plain curl or Node fetch (the default in this skill) for every routine
  QA call: fewer moving parts, no sandbox, exact same endpoint.
- Never route frames through MCP to "save" setup: the data path is the same,
  and the sandbox adds a failure mode the script does not control.
