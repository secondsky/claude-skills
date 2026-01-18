---
title: MCP Server Integration Reference
feature: Model Context Protocol (MCP) Server
version: v7.0+
purpose: Integrate Ultracite knowledge with AI assistants
description: Guide for integrating Ultracite with AI assistants via Model Context Protocol
---

# MCP Server Integration Reference

**Feature**: Model Context Protocol (MCP) Server
**Version**: v7.0+
**Purpose**: Integrate Ultracite knowledge with AI assistants

## Overview

The Ultracite MCP Server provides AI assistants (Claude Desktop, Cursor, etc.) with access to Ultracite's rule documentation, configuration guidance, and troubleshooting knowledge. This enables AI assistants to answer Ultracite-specific questions and provide better code suggestions.

## What is MCP?

**Model Context Protocol (MCP)** is an open protocol that enables AI assistants to access external tools and knowledge bases. The Ultracite MCP Server exposes:

- Rule documentation (200+ rules)
- Configuration schemas
- Framework preset details
- Troubleshooting guides
- Provider comparison information

## Installation

### Prerequisites

- Ultracite v7.0+
- Supported AI client (Claude Desktop, Cursor, etc.)
- Node.js v18+ (for MCP server runtime)

### Install MCP Server

```bash
# Install Ultracite MCP server globally
npx ultracite mcp install

# Or install locally in project
npx ultracite mcp install --local
```

### Configure AI Client

#### Claude Desktop

```bash
# Auto-configure Claude Desktop
npx ultracite mcp configure --client claude-desktop

# Manual configuration
# Add to ~/Library/Application Support/Claude/claude_desktop_config.json (macOS)
# or %APPDATA%\Claude\claude_desktop_config.json (Windows)
```

**Configuration file** (`claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "ultracite": {
      "command": "npx",
      "args": ["-y", "@ultracite/mcp-server"],
      "env": {
        "ULTRACITE_PROJECT_PATH": "/path/to/your/project"
      }
    }
  }
}
```

#### Cursor

```bash
# Auto-configure Cursor
npx ultracite mcp configure --client cursor

# Manual configuration
# Add to ~/.cursor/mcp.json
```

**Configuration file** (`.cursor/mcp.json`):
```json
{
  "servers": {
    "ultracite": {
      "command": "npx",
      "args": ["-y", "@ultracite/mcp-server"],
      "env": {
        "ULTRACITE_PROJECT_PATH": "${workspaceFolder}"
      }
    }
  }
}
```

#### Other MCP Clients

For other MCP-compatible clients:

```json
{
  "command": "npx",
  "args": ["-y", "@ultracite/mcp-server"],
  "env": {
    "ULTRACITE_PROJECT_PATH": "/path/to/project"
  }
}
```

## Available MCP Tools

The Ultracite MCP Server provides these tools to AI assistants:

### 1. `ultracite_get_rule`

Get detailed documentation for a specific rule.

**Parameters**:
- `rule_name` (string): Rule identifier (e.g., "useConst", "noExplicitAny")

**Example**:
```typescript
// AI assistant can query:
ultracite_get_rule({ rule_name: "noExplicitAny" })

// Returns:
{
  "name": "noExplicitAny",
  "category": "suspicious",
  "description": "Disallow the use of the 'any' type",
  "rationale": "The 'any' type defeats the purpose of TypeScript...",
  "examples": { ... },
  "fixes": { ... }
}
```

### 2. `ultracite_search_rules`

Search for rules by keyword or category.

**Parameters**:
- `query` (string): Search term
- `category` (string, optional): Rule category filter

**Example**:
```typescript
ultracite_search_rules({ query: "unused", category: "correctness" })

// Returns list of rules matching "unused" in "correctness" category
```

### 3. `ultracite_get_preset`

Get preset configuration details.

**Parameters**:
- `preset_name` (string): Preset identifier (e.g., "biome/core", "biome/react")

**Example**:
```typescript
ultracite_get_preset({ preset_name: "biome/react" })

// Returns:
{
  "name": "biome/react",
  "description": "React + JSX rules",
  "extends": ["biome/core"],
  "rules": { ... }
}
```

### 4. `ultracite_troubleshoot`

Get troubleshooting guidance for common issues.

**Parameters**:
- `issue` (string): Issue description or error message

**Example**:
```typescript
ultracite_troubleshoot({ issue: "format on save not working" })

// Returns troubleshooting steps and solutions
```

### 5. `ultracite_get_config_schema`

Get configuration file schema for validation.

**Parameters**:
- `provider` (string): Provider name (biome, eslint, oxlint)

**Example**:
```typescript
ultracite_get_config_schema({ provider: "biome" })

// Returns JSON schema for biome.jsonc
```

## Usage in AI Assistants

### Claude Desktop

Once configured, you can ask Claude:

```
User: "What does the noExplicitAny rule do in Ultracite?"

Claude: [Uses ultracite_get_rule tool]
"The noExplicitAny rule (category: suspicious) disallows the use of the 'any' type in TypeScript. It's enabled by default in ultracite/biome/core because..."
```

### Cursor

Ask Cursor to help with Ultracite configuration:

```
User: "Help me configure Ultracite for React"

Cursor: [Uses ultracite_get_preset tool]
"For a React project, you should use the ultracite/biome/react preset. Here's the recommended configuration..."
```

## Environment Variables

Configure MCP server behavior:

### `ULTRACITE_PROJECT_PATH`

**Required**: Path to project root (where `biome.jsonc` is located)

```json
{
  "env": {
    "ULTRACITE_PROJECT_PATH": "/Users/you/projects/my-app"
  }
}
```

### `ULTRACITE_LOG_LEVEL`

**Optional**: Logging verbosity (debug, info, warn, error)

```json
{
  "env": {
    "ULTRACITE_LOG_LEVEL": "debug"
  }
}
```

### `ULTRACITE_CACHE_DIR`

**Optional**: Cache directory for rule documentation

```json
{
  "env": {
    "ULTRACITE_CACHE_DIR": "/tmp/ultracite-mcp-cache"
  }
}
```

## Testing MCP Server

### Verify Installation

```bash
# Test MCP server directly
npx @ultracite/mcp-server --test

# Output:
# ✓ MCP server running
# ✓ 5 tools available
# ✓ Rule database loaded (200+ rules)
```

### Test in AI Client

**Claude Desktop**:
1. Open Claude Desktop
2. Start new conversation
3. Ask: "List available Ultracite tools"
4. Claude should list MCP tools if configured correctly

**Cursor**:
1. Open Cursor
2. Use AI chat
3. Ask: "What Ultracite rules are available?"
4. Cursor should query MCP server

## Troubleshooting

### MCP Server Not Starting

**Problem**: AI client can't connect to MCP server

**Check**:
1. Node.js v18+ installed: `node --version`
2. `npx` available: `npx --version`
3. MCP server package installed: `npx @ultracite/mcp-server --version`

**Solution**:
```bash
# Reinstall MCP server
npx ultracite mcp install --force

# Test standalone
npx @ultracite/mcp-server --test
```

### AI Client Not Detecting Tools

**Problem**: Claude/Cursor doesn't see Ultracite tools

**Check configuration file**:

**macOS (Claude Desktop)**:
```bash
cat ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

**Cursor**:
```bash
cat ~/.cursor/mcp.json
```

**Verify JSON syntax**:
```bash
# Validate JSON
cat config.json | jq .
```

### "Project Path Not Found" Error

**Problem**: MCP server can't find project

**Solution**: Set correct `ULTRACITE_PROJECT_PATH`:

```json
{
  "env": {
    "ULTRACITE_PROJECT_PATH": "/absolute/path/to/project"
  }
}
```

**Verify path**:
```bash
# Path should contain biome.jsonc or package.json
ls /path/to/project/biome.jsonc
```

### Rules Not Loading

**Problem**: MCP server returns empty rule list

**Solution**: Clear cache and reload:

```bash
# Clear MCP cache
rm -rf /tmp/ultracite-mcp-cache

# Restart AI client
```

## Advanced Configuration

### Multi-Project Setup

Configure MCP server for multiple projects:

```json
{
  "mcpServers": {
    "ultracite-project-a": {
      "command": "npx",
      "args": ["-y", "@ultracite/mcp-server"],
      "env": {
        "ULTRACITE_PROJECT_PATH": "/path/to/project-a",
        "ULTRACITE_SERVER_NAME": "project-a"
      }
    },
    "ultracite-project-b": {
      "command": "npx",
      "args": ["-y", "@ultracite/mcp-server"],
      "env": {
        "ULTRACITE_PROJECT_PATH": "/path/to/project-b",
        "ULTRACITE_SERVER_NAME": "project-b"
      }
    }
  }
}
```

### Custom Rule Database

Point MCP server to custom rule database:

```json
{
  "env": {
    "ULTRACITE_RULES_DB": "/path/to/custom-rules.json"
  }
}
```

### Performance Tuning

Enable caching for faster responses:

```json
{
  "env": {
    "ULTRACITE_ENABLE_CACHE": "true",
    "ULTRACITE_CACHE_TTL": "3600"  // 1 hour
  }
}
```

## Security Considerations

### MCP Server Permissions

The MCP server:
- ✅ Read-only access to rule documentation
- ✅ Reads project configuration files
- ❌ Does NOT modify files
- ❌ Does NOT execute code
- ❌ Does NOT access network (except for updates)

### Environment Isolation

MCP server runs in isolated environment:
- No access to environment variables (except configured ones)
- No access to file system outside project path
- No network access

## Resources

- [MCP Protocol Spec](https://modelcontextprotocol.io/)
- [Ultracite MCP Docs](https://www.ultracite.ai/mcp)
- [Claude Desktop MCP Guide](https://docs.anthropic.com/claude/docs/mcp)
- [MCP Server GitHub](https://github.com/ultracite/mcp-server)
- [Troubleshooting](https://www.ultracite.ai/mcp/troubleshooting)
