## UX Patterns & @Mention System

### The @Mention Philosophy

**Core Design Principle**: Every feature is instantly accessible via `@mentions` - no digging through menus.

**Why This Matters**: Users can compose features on-the-fly without context switching.

### Three Types of @Mentions

#### 1. @tool (Default Tools)
**Format**: `@tool("tool_name")`

**Examples**:
```
@tool("web-search") find recent AI papers
@tool("create-table") show sales data
@tool("python-execution") calculate fibonacci
```

**How It Works**:
- Parsed from message on server
- Loads corresponding tools from `APP_DEFAULT_TOOL_KIT`
- LLM decides when to invoke based on prompt

**Use Case**: Built-in capabilities (search, visualization, code execution)

#### 2. @mcp (MCP Server Tools)
**Format**: `@mcp("server_name")` or specific tool `@mcp("server_name:tool_name")`

**Examples**:
```
@mcp("github") create an issue in my repo
@mcp("playwright") navigate to google.com
@mcp("slack:send-message") post update to #general
```

**How It Works**:
- Mentions filter which MCP servers/tools to load
- Reduces token usage (only relevant tools sent to LLM)
- MCP manager handles connection and execution

**Use Case**: External integrations (GitHub, Slack, databases, etc.)

#### 3. @workflow (Custom Workflows)
**Format**: `@workflow("workflow_name")`

**Examples**:
```
@workflow("customer-onboarding") process new signup
@workflow("data-pipeline") transform and analyze CSV
```

**How It Works**:
- Workflows are converted to callable tools
- LLM sees workflow as a single tool with description
- Execution streams intermediate node results

**Use Case**: Multi-step automations, business processes

#### 4. @agent (Agent Personas)
**Format**: Select agent from dropdown (not typed in message)

**How It Works**:
- Agent's `instructions.mentions` auto-inject tools/workflows
- System prompt prepended to conversation
- Presets can override model/temperature

**Use Case**: Role-specific contexts (coding assistant, data analyst, etc.)

### Tool Choice Modes

**Context**: User selects mode from dropdown

#### Auto Mode (Default)
- LLM can invoke tools autonomously
- Multiple tool calls per message
- Best for: Automation, workflows, exploration

**Example Flow**:
```
User: @tool("web-search") find AI news, then @tool("create-table") summarize
→ LLM searches → formats results → creates table → returns message
```

#### Manual Mode
- LLM proposes tool calls, waits for user approval
- User sees "Tool: web-search" with args, clicks "Execute"
- Best for: Sensitive operations, learning, debugging

**Example Flow**:
```
User: @mcp("github") create issue
→ LLM proposes: create_issue(repo="...", title="...", body="...")
→ User reviews and clicks "Execute"
→ Tool runs → result shown
```

#### None Mode
- No tools loaded (text-only conversation)
- Reduces latency and token usage
- Best for: Brainstorming, explanations, simple queries

### Preset System

**What Are Presets?**
- Quick configurations for common scenarios
- Stored per-user
- Can override: model, temperature, toolChoice, allowed MCP servers

**Example Use Cases**:
```
Preset: "Quick Chat"
- Model: GPT-4o-mini (fast)
- Tools: None
- Use for: Rapid Q&A

Preset: "Research Assistant"
- Model: Claude Sonnet 4.5
- Tools: @tool("web-search"), @mcp("wikipedia")
- Use for: Deep research

Preset: "Code Review"
- Model: GPT-5
- Tools: @mcp("github"), @tool("python-execution")
- Use for: Reviewing PRs with tests
```

**How To Create**:
1. Configure chat (model, tools, settings)
2. Click "Save as Preset"
3. Name it
4. Select from dropdown in future chats

### User Journey Examples

#### Beginner: First-Time User
```
1. Start chat (no @mentions) → Default tools available
2. Ask: "Search for news about AI"
3. LLM automatically uses @tool("web-search")
4. User sees: Search results → Formatted answer
5. Learns: Tools work automatically in Auto mode
```

#### Intermediate: Using Workflows
```
1. Create workflow in Workflow Builder:
   Input → Web Search → LLM Summary → Output
2. Save as "research-workflow"
3. In chat: "@workflow('research-workflow') AI trends 2025"
4. Sees: Live progress per node
5. Gets: Formatted research report
```

#### Advanced: Agent + MCP + Workflows
```
1. Create agent "DevOps Assistant"
2. Agent instructions include: @mcp("github"), @workflow("deploy-pipeline")
3. Select agent from dropdown
4. Chat: "Deploy latest commit to staging"
5. Agent: Uses GitHub MCP → triggers deploy workflow → monitors → reports
```

### Design Patterns Developers Should Follow

**1. Discoverability**
- Every tool should have clear description (shown in LLM context)
- Use semantic names (`create-table` not `tool-42`)

**2. Composability**
- Tools should be single-purpose
- Workflows compose tools
- Agents compose workflows + tools + context

**3. Progressive Disclosure**
- Beginners: Auto mode, no @mentions (use defaults)
- Intermediate: Explicit @tool/@mcp mentions
- Advanced: Workflows, agents, presets

**4. Feedback**
- Streaming for long operations
- Progress updates for workflows
- Clear error messages with solutions

---

