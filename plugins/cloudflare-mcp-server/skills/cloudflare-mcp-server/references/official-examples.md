# Official Cloudflare MCP Server Examples

Curated list of official Cloudflare MCP servers and templates.

---

## Cloudflare AI Demos Repository

**Main Repository**: https://github.com/cloudflare/ai/tree/main/demos

### Basic Templates

**remote-mcp-authless**
- No authentication
- Basic tools example
- SSE + HTTP transports
- **Use for**: Quick start, internal tools
- **Template**: `npm create cloudflare@latest -- my-mcp --template=cloudflare/ai/demos/remote-mcp-authless`

**remote-mcp-server**
- Base remote MCP server
- Minimal setup
- **Use for**: Foundation for custom servers

---

### OAuth Integration Examples

**remote-mcp-github-oauth**
- GitHub OAuth integration
- workers-oauth-provider
- User-scoped GitHub API tools
- **Use for**: GitHub integrations
- **Template**: `npm create cloudflare@latest -- my-mcp --template=cloudflare/ai/demos/remote-mcp-github-oauth`

**remote-mcp-google-oauth**
- Google OAuth integration
- Google APIs access
- **Use for**: Google Workspace integrations

**remote-mcp-auth0**
- Auth0 integration
- Enterprise auth
- **Use for**: Enterprise applications

**remote-mcp-authkit**
- WorkOS AuthKit
- Full OAuth provider example
- **Use for**: Custom OAuth implementation

**remote-mcp-logto**
- Logto identity platform
- **Use for**: Open-source identity provider

**remote-mcp-descope-auth**
- Descope authentication
- **Use for**: No-code auth platform

---

### Specialized MCP Servers

**remote-mcp-server-autorag**
- AutoRAG integration
- AI-powered search
- **Use for**: RAG applications

**remote-mcp-cf-access**
- Cloudflare Access protection
- Zero Trust security
- **Use for**: Corporate networks

**mcp-slack-oauth**
- Slack integration
- Slack OAuth flow
- **Use for**: Slack bots and apps

**mcp-stytch-b2b-okr-manager**
- Stytch B2B auth
- OKR management example
- **Use for**: B2B SaaS applications

**mcp-stytch-consumer-todo-list**
- Stytch consumer auth
- Todo list example
- **Use for**: Consumer applications

---

## Production MCP Servers

### Cloudflare's Official MCP Servers

**mcp-server-cloudflare**
- Repository: https://github.com/cloudflare/mcp-server-cloudflare
- **13 MCP servers** for Cloudflare services
- Blog: https://blog.cloudflare.com/thirteen-new-mcp-servers-from-cloudflare/

**Servers included**:
1. **Workers Bindings** - Manage D1, KV, R2, etc.
2. **Documentation Access** - Search Cloudflare docs
3. **Logpush Analytics** - Query logs
4. **AI Gateway Logs** - AI request logs
5. **Audit Logs** - Account activity
6. **DNS Analytics** - DNS query stats
7. **Browser Rendering** - Puppeteer automation
8. And 6 more...

**workers-mcp**
- Repository: https://github.com/cloudflare/workers-mcp
- CLI tool to connect Workers to Claude Desktop
- **Use for**: Existing Workers → MCP integration

---

## How to Use Templates

### Deploy via CLI
```bash
npm create cloudflare@latest -- my-mcp-server \
  --template=cloudflare/ai/demos/TEMPLATE_NAME
```

### Deploy via Button
Visit demo URL and click "Deploy to Cloudflare" button.

### Clone and Modify
```bash
git clone https://github.com/cloudflare/ai
cd ai/demos/TEMPLATE_NAME
npm install
npm run dev
```

---

## Documentation Links

**Cloudflare Agents**
- Main docs: https://developers.cloudflare.com/agents/
- MCP Guide: https://developers.cloudflare.com/agents/model-context-protocol/
- Build Remote MCP: https://developers.cloudflare.com/agents/guides/remote-mcp-server/
- Test Remote MCP: https://developers.cloudflare.com/agents/guides/test-remote-mcp-server/

**Blog Posts**
- Remote MCP Launch: https://blog.cloudflare.com/remote-model-context-protocol-servers-mcp/
- 13 MCP Servers: https://blog.cloudflare.com/thirteen-new-mcp-servers-from-cloudflare/
- Building Agents: https://blog.cloudflare.com/building-ai-agents-with-mcp-authn-authz-and-durable-objects/

**Third-Party Examples**
- Stytch MCP Guide: https://stytch.com/blog/building-an-mcp-server-oauth-cloudflare-workers/
- Auth0 MCP Guide: https://auth0.com/blog/secure-and-deploy-remote-mcp-servers-with-auth0-and-cloudflare/

---

## Community Examples

Search GitHub for more:
- https://github.com/topics/cloudflare-mcp
- https://github.com/topics/mcp-server

**Notable community servers**:
- Tennis court booking
- Google Calendar integration
- ChatGPT apps
- Strava integration

---

**Last Updated**: 2025-11-04
